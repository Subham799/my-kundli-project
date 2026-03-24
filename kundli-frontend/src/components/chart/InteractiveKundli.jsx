// InteractiveKundli.jsx — Fixed: H3/H11 positions, scroll, Lagna, lord display, planet centering
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANET_META, HOUSE_CAT_COLOR } from "../../constants";

// ── Rashi data ───────────────────────────────────────────────
const RASHI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
// Rashi lords (abbreviated Hindi)
const RASHI_LORD = {
  0:"मं",1:"शु",2:"बु",3:"चं",4:"सू",5:"बु",
  6:"शु",7:"मं",8:"गु",9:"श",10:"श",11:"गु"
};
// Full lord name for tooltip
const RASHI_LORD_FULL = {
  0:"मंगल",1:"शुक्र",2:"बुध",3:"चंद्र",4:"सूर्य",5:"बुध",
  6:"शुक्र",7:"मंगल",8:"गुरु",9:"शनि",10:"शनि",11:"गुरु"
};
// Lord planet code for color
const RASHI_LORD_CODE = {
  0:"Ma",1:"Ve",2:"Me",3:"Mo",4:"Su",5:"Me",
  6:"Ve",7:"Ma",8:"Ju",9:"Sa",10:"Sa",11:"Ju"
};

// ── SVG geometry ─────────────────────────────────────────────
// viewBox="0 0 440 440", chart rect at (10,10) size 420×420
const P   = 10;
const SZ  = 420;
const M   = P + SZ / 2;   // 220 — centre
const S   = P + SZ;        // 430 — far edge

const T   = [M,  P ];   // (220,  10) — top diamond tip
const R   = [S,  M ];   // (430, 220) — right diamond tip
const B   = [M,  S ];   // (220, 430) — bottom diamond tip
const L   = [P,  M ];   // ( 10, 220) — left diamond tip
const TL  = [P,  P ];   // ( 10,  10)
const TR  = [S,  P ];   // (430,  10)
const BR  = [S,  S ];   // (430, 430)
const BL  = [P,  S ];   // ( 10, 430)
const C   = [M,  M ];   // (220, 220)
// Diagonal × diamond-edge midpoints
const MLT = [P+SZ/4,   P+SZ/4  ]; // (115, 115)
const MTR = [P+SZ*3/4, P+SZ/4  ]; // (325, 115)
const MRB = [P+SZ*3/4, P+SZ*3/4]; // (325, 325)
const MBL = [P+SZ/4,   P+SZ*3/4]; // (115, 325)

const pp = pts => pts.map(p => p.join(",")).join(" ");

// ── 12 polygon zones ─────────────────────────────────────────
const POLY = {
  1:  pp([T,   MTR, C,   MLT]),
  2:  pp([TL,  T,   MLT      ]),
  3:  pp([TL,  MLT, L        ]),
  4:  pp([L,   MLT, C,   MBL]),
  5:  pp([BL,  L,   MBL      ]),
  6:  pp([BL,  MBL, B        ]),
  7:  pp([B,   MBL, C,   MRB]),
  8:  pp([BR,  B,   MRB      ]),
  9:  pp([BR,  MRB, R        ]),
  10: pp([R,   MRB, C,   MTR]),
  11: pp([TR,  R,   MTR      ]),
  12: pp([TR,  MTR, T        ]),
};

// ── Text positions — mathematically derived centroids + edge nudges ───
// Layout rows per house (from top):
//   ry  = rashi number  (small amber)
//   ny  = rashi name    (white medium)
//   ly  = (lord)        (small, lord color, bracketed)
//   py  = planet names  (colored bold) — only if planets exist
//
// Centroids: H1=(220,115) H2=(115,45) H3=(45,115) H4=(115,220)
//            H5=(45,325)  H6=(115,395) H7=(220,325) H8=(325,395)
//            H9=(395,325) H10=(325,220) H11=(395,115) H12=(325,45)
// Edge houses nudged inward so text stays inside zone
const TPOS = {
  1:  { cx:220, ry: 93, ny:109, ly:124, py:141 },
  2:  { cx:115, ry: 30, ny: 46, ly: 61, py: 78 },
  3:  { cx: 58, ry: 96, ny:112, ly:127, py:144 },  // ← FIXED (was at M-32 = 188!)
  4:  { cx:115, ry:198, ny:214, ly:229, py:246 },
  5:  { cx: 58, ry:298, ny:314, ly:329, py:346 },
  6:  { cx:115, ry:348, ny:364, ly:379, py:396 },
  7:  { cx:220, ry:302, ny:318, ly:333, py:350 },
  8:  { cx:325, ry:348, ny:364, ly:379, py:396 },
  9:  { cx:382, ry:298, ny:314, ly:329, py:346 },  // ← FIXED (was at S-82 from top)
  10: { cx:325, ry:198, ny:214, ly:229, py:246 },
  11: { cx:382, ry: 96, ny:112, ly:127, py:144 },  // ← FIXED (was at M-32 = 188!)
  12: { cx:325, ry: 30, ny: 46, ly: 61, py: 78 },
};

function getCatStyle(cat="") {
  for (const [k,v] of Object.entries(HOUSE_CAT_COLOR))
    if (k !== "default" && cat.includes(k)) return v;
  return HOUSE_CAT_COLOR["default"];
}

// ── avColor helper ───────────────────────────────────────────
const avColor = v => v >= 6 ? "#4ADE80" : v >= 4 ? "#FCD34D" : "#FB7185";

// ─────────────────────────────────────────────────────────────
export default function InteractiveKundli({ houses=[], selectedPlanet, onHouseHover }) {
  const [hovered, setHov] = useState(null);
  const [clicked, setCli] = useState(null);
  const svgRef            = useRef(null);
  const [tipXY, setTipXY] = useState({x:0,y:0});

  const houseMap = Object.fromEntries((houses||[]).map(h=>[h.num,h]));

  const onEnter = (n,e) => {
    setHov(n);
    const r = svgRef.current?.getBoundingClientRect();
    if (r) setTipXY({x: e.clientX-r.left, y: e.clientY-r.top});
    onHouseHover?.(n);
  };
  const onLeave = () => { setHov(null); onHouseHover?.(null); };
  const onClick = (n,e) => { e.stopPropagation(); setCli(x=>x===n?null:n); };

  return (
    <div className="relative w-full select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[9px] tracking-[0.35em] uppercase text-amber-500/60"
          style={{fontFamily:"'Cinzel',serif"}}>D1 · लग्न कुंडली</span>
        <span className="text-[9px] text-slate-600">hover = tooltip · click = lock</span>
      </div>

      {/* Chart container — fixed aspect ratio, NO overflow:visible on parent */}
      <div className="relative w-full rounded-xl" style={{
        background:"linear-gradient(155deg,rgba(2,4,16,.99),rgba(3,7,24,.99))",
        border:"1px solid rgba(245,158,11,.22)",
        boxShadow:"0 0 48px rgba(245,158,11,.07)",
        padding:"6px",
        /* SCROLL FIX: let this div size naturally — don't use overflow:hidden */
      }}>

        {/* SVG wrapper — gives it explicit aspect ratio so layout is stable */}
        <div style={{position:"relative", width:"100%", paddingBottom:"100%"}}>
          <svg
            ref={svgRef}
            viewBox="0 0 440 440"
            style={{
              position:"absolute", top:0, left:0,
              width:"100%", height:"100%",
              display:"block",
              /* overflow:visible REMOVED — was causing scroll bleed */
            }}
            onClick={()=>setCli(null)}>

            <defs>
              <filter id="ik-gp" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ik-gs" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="ik-gb" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="ik-cg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(245,158,11,.18)"/>
                <stop offset="55%"  stopColor="rgba(245,158,11,.06)"/>
                <stop offset="100%" stopColor="rgba(245,158,11,0)"/>
              </radialGradient>
            </defs>

            {/* Dark bg */}
            <rect x="0" y="0" width="440" height="440" fill="rgba(1,3,12,.97)"/>

            {/* ── Zone fills (clickable) ── */}
            {Object.entries(POLY).map(([hn,pts]) => {
              const n   = +hn;
              const hd  = houseMap[n]||{};
              const cs  = getCatStyle(hd.category||"");
              const isH = hovered===n, isC = clicked===n;
              const isHi= selectedPlanet&&(hd.planets||[]).includes(selectedPlanet);
              const sm  = selectedPlanet ? PLANET_META[selectedPlanet] : null;
              return (
                <polygon key={hn} points={pts}
                  fill={isC?"rgba(245,158,11,.14)":isH?"rgba(34,211,238,.1)":isHi?`${sm?.color}12`:cs.fill}
                  stroke={isC?"#F59E0B":isH?"#22D3EE":isHi?(sm?.color||cs.stroke):cs.stroke}
                  strokeWidth={isC||isH||isHi?1.8:.5}
                  style={{cursor:"pointer",transition:"fill .13s"}}
                  onMouseEnter={e=>onEnter(n,e)} onMouseLeave={onLeave}
                  onClick={e=>onClick(n,e)}/>
              );
            })}

            {/* ── 3 structural lines ── */}
            {/* 1. Outer rect */}
            <rect x={P} y={P} width={SZ} height={SZ}
              fill="none" stroke="#F59E0B" strokeWidth="2"
              style={{pointerEvents:"none"}}/>
            {/* 2a. Diagonal TL→BR */}
            <line x1={P} y1={P} x2={S} y2={S}
              stroke="#F59E0B" strokeWidth="1.2" strokeOpacity=".5"
              style={{pointerEvents:"none"}}/>
            {/* 2b. Diagonal TR→BL */}
            <line x1={S} y1={P} x2={P} y2={S}
              stroke="#F59E0B" strokeWidth="1.2" strokeOpacity=".5"
              style={{pointerEvents:"none"}}/>
            {/* 3. Diamond polygon */}
            <polygon points={pp([T,R,B,L])}
              fill="none" stroke="#F59E0B" strokeWidth="2"
              style={{pointerEvents:"none"}}/>
            <polygon points={pp([T,R,B,L])}
              fill="url(#ik-cg)" style={{pointerEvents:"none"}}/>

            {/* ── Text labels per house ── */}
            {Object.entries(TPOS).map(([hn,pos]) => {
              const n     = +hn;
              const hd    = houseMap[n] || {sign_index: n-1, planets:[]};
              const isH   = hovered===n, isC = clicked===n;
              const ri    = hd.sign_index !== undefined ? hd.sign_index : n-1;
              const rashiN= ri + 1;

              // Planets: separate Lagna from actual planets
              const allP    = hd.planets || [];
              const hasLagna= allP.includes("La");
              const grahas  = allP.filter(p => p !== "La"); // real planets only

              // Lord info
              const lordCode   = RASHI_LORD_CODE[ri];
              const lordAbbr   = RASHI_LORD[ri];
              const lordColor  = PLANET_META[lordCode]?.color || "#94A3B8";

              // For centering planets: distribute evenly in zone width
              // Kite zones (H1,H4,7,10): available width ~120px
              // Corner/side zones: available width ~70px
              const isKite    = [1,4,7,10].includes(n);
              const maxWidth  = isKite ? 110 : 70;
              const planetSpacing = grahas.length > 1
                ? Math.min(18, maxWidth / grahas.length)
                : 0;
              const totalPW   = (grahas.length - 1) * planetSpacing;

              const rashiColor = isC?"#FDE68A":isH?"#67E8F9":"rgba(245,158,11,.85)";
              const nameColor  = isC||isH ? "#FFFFFF" : "rgba(255,255,255,.92)";

              return (
                <g key={hn} style={{pointerEvents:"none"}}>

                  {/* Rashi number — small amber */}
                  <text x={pos.cx} y={pos.ry}
                    textAnchor="middle" fontSize="11" fontWeight="700"
                    fill={rashiColor} fontFamily="'Cinzel',serif"
                    filter={isC||isH?"url(#ik-gp)":undefined}>
                    {rashiN}
                  </text>

                  {/* Rashi name — white */}
                  <text x={pos.cx} y={pos.ny}
                    textAnchor="middle" fontSize="12" fontWeight="600"
                    fill={nameColor} fontFamily="'Noto Sans Devanagari',sans-serif"
                    filter={isC||isH?"url(#ik-gp)":undefined}>
                    {hd.signHindi || RASHI[ri]}
                  </text>

                  {/* Lord in brackets — colored with lord's planet color */}
                  <text x={pos.cx} y={pos.ly}
                    textAnchor="middle" fontSize="9.5" fontWeight="600"
                    fill={lordColor} fontFamily="'Noto Sans Devanagari',sans-serif"
                    opacity=".78">
                    ({lordAbbr})
                  </text>

                  {/* Lagna marker — shown BELOW lord if this house has Lagna */}
                  {/* Only shown as a small "ल॰" label separate from planets */}
                  {hasLagna && grahas.length === 0 && (
                    <text x={pos.cx} y={pos.py}
                      textAnchor="middle" fontSize="11" fontWeight="900"
                      fill={PLANET_META["La"].color}
                      fontFamily="'Noto Sans Devanagari',sans-serif"
                      filter="url(#ik-gp)" opacity=".9">
                      लग्न
                    </text>
                  )}

                  {/* Planet grahas — horizontally centered in zone */}
                  {grahas.length > 0 && (
                    <g>
                      {grahas.map((p, i) => {
                        const pm   = PLANET_META[p] || {color:"#94A3B8", hi:p};
                        const px   = pos.cx - totalPW/2 + i * planetSpacing;
                        const isSel= selectedPlanet===p;
                        return (
                          <text key={p}
                            x={px} y={pos.py}
                            textAnchor="middle"
                            fontSize="15" fontWeight="900"
                            fill={pm.color}
                            fontFamily="'Noto Sans Devanagari',sans-serif"
                            filter={isSel?"url(#ik-gs)":"url(#ik-gp)"}
                            opacity={isSel?1:.95}>
                            {pm.hi||p}
                          </text>
                        );
                      })}
                      {/* Lagna indicator as tiny superscript after planets */}
                      {hasLagna && (
                        <text
                          x={pos.cx + totalPW/2 + (grahas.length>0?12:0)}
                          y={pos.py - 5}
                          textAnchor="middle" fontSize="8" fontWeight="900"
                          fill={PLANET_META["La"].color}
                          fontFamily="'Noto Sans Devanagari',sans-serif"
                          opacity=".8">
                          ल॰
                        </text>
                      )}
                    </g>
                  )}

                </g>
              );
            })}

            {/* ── Centre OM ── */}
            <circle cx={M} cy={M} r={30} fill="rgba(245,158,11,.06)"
              stroke="rgba(245,158,11,.35)" strokeWidth="1.3"
              filter="url(#ik-gb)" style={{pointerEvents:"none"}}/>
            <circle cx={M} cy={M} r={20} fill="rgba(245,158,11,.04)"
              stroke="rgba(245,158,11,.18)" strokeWidth=".8"
              style={{pointerEvents:"none"}}/>
            <text x={M} y={M+8} textAnchor="middle" fontSize="20"
              fill="rgba(245,158,11,.82)"
              fontFamily="'Noto Sans Devanagari',sans-serif"
              filter="url(#ik-gp)" style={{pointerEvents:"none"}}>ॐ</text>

            {/* Corner dots */}
            {[[P,P],[S,P],[S,S],[P,S]].map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r={4}
                fill="rgba(245,158,11,.6)" stroke="rgba(245,158,11,.25)" strokeWidth="1"
                style={{pointerEvents:"none"}}/>
            ))}
            {/* Diamond tip dots */}
            {[T,R,B,L].map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r={3}
                fill="rgba(245,158,11,.75)" style={{pointerEvents:"none"}}/>
            ))}

          </svg>

          {/* ── Tooltip ── */}
          <AnimatePresence>
            {(hovered||clicked) && (()=>{
              const active = clicked||hovered;
              const hd     = houseMap[active]||{sign_index:active-1,planets:[],av:0,category:""};
              const ri     = hd.sign_index!==undefined ? hd.sign_index : active-1;
              const rashiN = ri+1;
              const lord   = RASHI_LORD_FULL[ri]||"";
              const svgW   = svgRef.current?.clientWidth||440;
              let tx = tipXY.x+16, ty = tipXY.y-140;
              if(tx > svgW-230) tx = tipXY.x-240;
              if(ty < 0) ty = tipXY.y+14;
              return (
                <motion.div key={`t${active}`}
                  initial={{opacity:0,scale:.92,y:4}} animate={{opacity:1,scale:1,y:0}}
                  exit={{opacity:0,scale:.92}} transition={{duration:.11}}
                  style={{position:"absolute",left:tx,top:ty,minWidth:205,zIndex:50,
                    pointerEvents:"none"}}>
                  <div style={{
                    background:"rgba(2,6,20,.98)",
                    border:"1px solid rgba(245,158,11,.38)",
                    boxShadow:"0 14px 50px rgba(0,0,0,.75)",
                    backdropFilter:"blur(18px)",
                    borderRadius:16, padding:"14px 16px",
                  }}>
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                        style={{background:"rgba(245,158,11,.15)",color:"#F59E0B",
                          border:"1px solid rgba(245,158,11,.28)"}}>
                        भाव {active}
                      </span>
                      <span className="text-sm font-bold text-white"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {hd.signHindi||RASHI[ri]}
                      </span>
                      <span className="text-[9px] text-slate-500 ml-auto"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        स्वामी: {lord}
                      </span>
                    </div>
                    {hd.category&&(
                      <div className="text-[9px] text-slate-500 mb-2 -mt-1"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {hd.category}
                      </div>
                    )}
                    {/* Planets */}
                    {(hd.planets||[]).filter(p=>p!=="La").length>0
                      ? <div className="flex flex-wrap gap-1.5 mb-2">
                          {(hd.planets||[]).filter(p=>p!=="La").map(p=>{
                            const pm=PLANET_META[p]||{};
                            return (
                              <span key={p} className="flex items-center gap-1 text-[10px] font-bold
                                px-2 py-0.5 rounded-lg"
                                style={{color:pm.color,background:`${pm.color}14`,
                                  border:`1px solid ${pm.color}28`}}>
                                {pm.symbol} <span style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{pm.hi}</span>
                              </span>
                            );
                          })}
                        </div>
                      : <div className="text-[10px] text-slate-600 mb-2 italic"
                          style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                          रिक्त भाव
                        </div>
                    }
                    {/* AV bar */}
                    {hd.av>0&&(
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] uppercase tracking-widest text-slate-600">
                            अष्टकवर्ग
                          </span>
                          <span className="text-[11px] font-black" style={{color:avColor(hd.av)}}>
                            {hd.av}/8
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            initial={{width:0}} animate={{width:`${(hd.av/8)*100}%`}}
                            transition={{duration:.4}}
                            style={{background:`linear-gradient(90deg,${avColor(hd.av)}70,${avColor(hd.av)})`,
                              boxShadow:`0 0 6px ${avColor(hd.av)}`}}/>
                        </div>
                      </div>
                    )}
                    {clicked&&(
                      <div className="mt-2 text-[8px] text-amber-500/40 text-right">
                        🔒 locked · click chart to release
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>{/* end SVG wrapper */}
      </div>{/* end chart container */}

      {/* Planet legend */}
      <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
        {Object.entries(PLANET_META).filter(([k])=>k!=="La").map(([code,meta])=>(
          <div key={code} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md"
            style={{background:`${meta.color}10`,color:meta.color,
              border:`1px solid ${meta.color}22`,
              fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            <span style={{fontSize:11,fontWeight:900}}>{meta.symbol}</span>
            <span style={{fontWeight:700}}>{meta.hi}</span>
            <span className="text-slate-700 mx-0.5">=</span>
            <span style={{opacity:.55}}>{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
