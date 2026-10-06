// InteractiveKundli.jsx — Fixed: H3/H11 positions, scroll, Lagna, lord display, planet centering
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANET_META, HOUSE_CAT_COLOR } from "../../constants";

// ── Rashi data ───────────────────────────────────────────────
const RASHI = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
// Rashi lords (abbreviated Hindi)
const RASHI_LORD = {
  0:"Ma",1:"Ve",2:"Me",3:"Mo",4:"Su",5:"Me",
  6:"Ve",7:"Ma",8:"Ju",9:"Sa",10:"Sa",11:"Ju"
};
// Full lord name for tooltip
const RASHI_LORD_FULL = {
  0:"Mars",1:"Venus",2:"Mercury",3:"Moon",4:"Sun",5:"Mercury",
  6:"Venus",7:"Mars",8:"Jupiter",9:"Saturn",10:"Saturn",11:"Jupiter"
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
function getPlanetStatus(code, planetData = {}, signIndex = null) {
  if (code === "La") return [];
  const p = planetData?.[code] || {};
  const flags = p.flags || {};
  const notes = String(p.notes || "");
  const out = [];

  // Prefer explicit backend dignity when available; otherwise derive from
  // the planet's current sign in the chart being displayed.
  const dignity = String(p.dignity || p.Dignity || p.status || "");
  const idx = Number.isInteger(signIndex) ? signIndex : null;

  // Natural dignity map: exaltation, debilitation and own signs.
  const EXALT = { Su:0, Mo:1, Ma:9, Me:5, Ju:3, Ve:11, Sa:6 };
  const DEBIL  = { Su:6, Mo:7, Ma:3, Me:11, Ju:9, Ve:5, Sa:0 };
  const OWN = {
    Su:[4], Mo:[3], Ma:[0,7], Me:[2,5], Ju:[8,11],
    Ve:[1,6], Sa:[9,10]
  };

  let dignityLabel = "";
  if (/Uchcha|Exalt|उच्च/i.test(dignity)) dignityLabel = "E";
  else if (/Neecha|Debil|नीच/i.test(dignity)) dignityLabel = "D";
  else if (/Swagraha|Swa|Own|स्वराशि/i.test(dignity)) dignityLabel = "O";
  else if (/Mitra|Friend|मित्र/i.test(dignity)) dignityLabel = "F";
  else if (/Shatru|Enemy|शत्रु/i.test(dignity)) dignityLabel = "En";
  else if (idx !== null && EXALT[code] === idx) dignityLabel = "E";
  else if (idx !== null && DEBIL[code] === idx) dignityLabel = "D";
  else if (idx !== null && (OWN[code] || []).includes(idx)) dignityLabel = "O";

  if (dignityLabel === "E") out.push({label:"E", title:"Exalted", color:"#4ADE80"});
  else if (dignityLabel === "D") out.push({label:"D", title:"Debilitated", color:"#FB7185"});
  else if (dignityLabel === "O") out.push({label:"O", title:"Own sign", color:"#22D3EE"});
  else if (dignityLabel === "F") out.push({label:"F", title:"Friend sign", color:"#C084FC"});
  else if (dignityLabel === "En") out.push({label:"En", title:"Enemy sign", color:"#FB923C"});

  // Natural friend/enemy sign status if not already classified by backend.
  // Sign-lord relationship is used for friend/enemy classification.
  if (!dignityLabel && idx !== null) {
    const signLord = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"][idx];
    const REL = {
      Su:{friend:["Mo","Ma","Ju"], enemy:["Ve","Sa"], neutral:["Me"]},
      Mo:{friend:["Su","Me"], enemy:[], neutral:["Ma","Ju","Ve","Sa"]},
      Ma:{friend:["Su","Mo","Ju"], enemy:["Me"], neutral:["Ve","Sa"]},
      Me:{friend:["Su","Ve"], enemy:["Mo"], neutral:["Ma","Ju","Sa"]},
      Ju:{friend:["Su","Mo","Ma"], enemy:["Me","Ve"], neutral:["Sa"]},
      Ve:{friend:["Me","Sa"], enemy:["Su","Mo"], neutral:["Ma","Ju"]},
      Sa:{friend:["Me","Ve"], enemy:["Su","Mo","Ma"], neutral:["Ju"]}
    };
    const rel = REL[code];
    if (rel?.friend?.includes(signLord)) out.push({label:"F", title:"Friend sign", color:"#C084FC"});
    else if (rel?.enemy?.includes(signLord)) out.push({label:"En", title:"Enemy sign", color:"#FB923C"});
  }

  const retro = p.Retrograde ?? p.retrograde ?? p.isRetrograde ?? flags.retrograde ?? p.retro;
  if (retro === true || retro === 1 || /^(true|yes|1)$/i.test(String(retro)) || /वक्री|retrograde/i.test(notes))
    out.push({label:"R", title:"Retrograde", color:"#818CF8"});

  let combust = p.Combust ?? p.combust ?? p.isCombust ?? flags.combust ?? p.burnt;

  // If backend did not provide a combust flag, derive it from longitudes when
  // available. Thresholds are standard approximate combustion orbs by planet.
  const getLon = obj => {
    const candidates = [obj?.longitude, obj?.Longitude, obj?.lon, obj?.long,
      obj?.absoluteLongitude, obj?.absolute_degree, obj?.degree, obj?.deg,
      obj?.position?.longitude, obj?.position?.lon, obj?.position?.degree];
    const n = candidates.find(v => Number.isFinite(Number(v)));
    return n === undefined ? null : ((Number(n) % 360) + 360) % 360;
  };
  if (!combust && code !== "Su" && planetData?.Su) {
    const sunLon = getLon(planetData.Su);
    const plLon = getLon(p);
    const orbs = {Mo:12, Ma:17, Me:14, Ju:11, Ve:10, Sa:15};
    if (sunLon !== null && plLon !== null && orbs[code] !== undefined) {
      const diff = Math.abs(sunLon - plLon);
      const sep = Math.min(diff, 360 - diff);
      combust = sep <= orbs[code];
    }
  }
  if (combust === true || combust === 1 || /^(true|yes|1)$/i.test(String(combust)) || /अस्त|combust|burnt/i.test(notes))
    out.push({label:"C", title:"Combust", color:"#F97316"});

  return out;
}


// ─────────────────────────────────────────────────────────────
// Build the same 12-house structure as the backend for any Shodashvarga.
// Existing D1 callers can keep passing `houses`; Varga callers pass `vargaKey` + chartData.
function buildVargaHouses(vargaKey, planets = {}, lagnaVargas = {}, d1Houses = [], progressedLagna = null) {
  if (!vargaKey || !Object.keys(planets || {}).length) return [];

  // RTN / Beeja Kundali: keep the D1 Lagna and D1 sign sequence, but place
  // each planet according to the sign it occupies in D9 (Navamsha).
  const isRTN = vargaKey === "RTN";
  const isProgressed = /_PL$/.test(vargaKey);
  const baseVargaKey = isProgressed ? vargaKey.replace(/_PL$/, "") : vargaKey;
  let lagna = isRTN ? lagnaVargas?.D1?.Idx : lagnaVargas?.[baseVargaKey]?.Idx;
  // Progressed charts keep all natal planet sign placements fixed and only
  // replace the Lagna/house framework with the selected Yogini PL sign.
  if (isProgressed && Number.isInteger(progressedLagna?.current_sign_idx)) {
    lagna = progressedLagna.current_sign_idx;
  }
  if (typeof lagna !== "number") {
    const d1LagnaHouse = (d1Houses || []).find(h => h?.num === 1);
    if (isRTN && typeof d1LagnaHouse?.sign_index === "number") lagna = d1LagnaHouse.sign_index;
  }
  if (typeof lagna !== "number") return [];

  const names = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
  const rashiEn = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const houses = Array.from({length:12}, (_, i) => {
    const signIdx = (lagna + i) % 12;
    return {
      num: i + 1,
      sign: rashiEn[signIdx],
      sign_index: signIdx,
      planets: [],
      category: "",
      av: 0,
    };
  });

  names.forEach(code => {
    const idx = isRTN
      ? planets?.[code]?.vargas?.D9?.Idx
      : planets?.[code]?.vargas?.[baseVargaKey]?.Idx;
    if (typeof idx !== "number") return;
    const houseNum = ((idx - lagna + 12) % 12) + 1;
    houses[houseNum - 1].planets.push(code);
  });
  houses[0].planets.unshift("La");
  return houses;
}

export default function InteractiveKundli({
  houses = [],
  selectedPlanet,
  onHouseHover,
  vargaKey = "D1",
  planets = {},
  lagnaVargas = {},
  progressedLagna = null,
  showHeader = true,
  rotation = 1,
}) {
  const [hovered, setHov] = useState(null);
  const [clicked, setCli] = useState(null);
  const svgRef            = useRef(null);
  const [tipXY, setTipXY] = useState({x:0,y:0});
  const isProgressedChart = /_PL$/.test(vargaKey);
  const baseVargaKey = isProgressedChart ? vargaKey.replace(/_PL$/, "") : vargaKey;

  const resolvedHouses = (vargaKey && vargaKey !== "D1")
    ? buildVargaHouses(vargaKey, planets, lagnaVargas, houses, progressedLagna)
    : (houses || []);
  // Visual rotation: rotation=4 means source House 4 is displayed in the House 1 position.
  const safeRotation = Math.min(12, Math.max(1, Number(rotation) || 1));
  const houseMap = Object.fromEntries(Array.from({length:12}, (_, i) => {
    const displayHouse = i + 1;
    const sourceHouse = ((displayHouse + safeRotation - 2) % 12) + 1;
    const source = (resolvedHouses || []).find(h => h.num === sourceHouse) || {
      num: sourceHouse, sign_index: sourceHouse - 1, planets: [], av: 0, category: ""
    };
    return [displayHouse, { ...source, actualHouse: sourceHouse }];
  }));

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

      {/* Header — hidden when used inside the multi-Varga grid */}
      {showHeader && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[9px] tracking-[0.35em] uppercase text-amber-500/60"
            style={{fontFamily:"'Cinzel',serif"}}>{vargaKey === "D1" ? "D1 · Birth Chart" : isProgressedChart ? `${baseVargaKey} · Progressed Lagna` : vargaKey}</span>
          <span className="text-[9px] text-slate-600">Hover = tooltip · Click = lock</span>
        </div>
      )}

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
              const ri  = hd.sign_index !== undefined ? hd.sign_index : n - 1;
              // Each house border follows the color of that house's sign lord.
              // This makes the house, rashi, and rashi-lord visually belong together.
              const houseLordColor = PLANET_META[RASHI_LORD_CODE[ri]]?.color || cs.stroke || "#94A3B8";
              return (
                <polygon key={hn} points={pts}
                  fill={isC?"rgba(245,158,11,.14)":isH?"rgba(34,211,238,.1)":isHi?`${sm?.color}12`:cs.fill}
                  stroke={isC?"#F59E0B":isH?"#22D3EE":isHi?(sm?.color||houseLordColor):houseLordColor}
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

              // हर राशि/हाउस का नंबर, राशि नाम और राशि-स्वामी उसी स्वामी ग्रह के रंग में रहें।
              // इससे जिस ग्रह का स्वामित्व है, उसका रंग पूरे house header को एक ही visual identity देता है।
              const houseLordColor = lordColor || "#94A3B8";
              const rashiColor = isC ? "#FFFFFF" : isH ? "#FFFFFF" : houseLordColor;
              const nameColor  = isC || isH ? "#FFFFFF" : houseLordColor;
              const lordNameColor = houseLordColor;

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
                    fill={nameColor} fontFamily="Inter, sans-serif"
                    filter={isC||isH?"url(#ik-gp)":undefined}>
                    {RASHI[ri]}
                  </text>

                  {/* Lord in brackets — colored with lord's planet color */}
                  <text x={pos.cx} y={pos.ly}
                    textAnchor="middle" fontSize="9.5" fontWeight="600"
                    fill={lordNameColor} fontFamily="Inter, sans-serif"
                    opacity=".92">
                    ({lordAbbr})
                  </text>

                  {/* Lagna marker — shown BELOW lord if this house has Lagna */}
                  {/* Only shown as a small "La" label separate from planets */}
                  {hasLagna && grahas.length === 0 && (
                    <text x={pos.cx} y={pos.py}
                      textAnchor="middle" fontSize="11" fontWeight="900"
                      fill={PLANET_META["La"].color}
                      fontFamily="Inter, sans-serif"
                      filter="url(#ik-gp)" opacity=".9">
                      La
                    </text>
                  )}

                  {/* Planet grahas — horizontally centered in zone */}
                  {grahas.length > 0 && (
                    <g>
                      {grahas.map((p, i) => {
                        const pm   = PLANET_META[p] || {color:"#94A3B8", hi:p};
                        const px   = pos.cx - totalPW/2 + i * planetSpacing;
                        const isSel= selectedPlanet===p;
                        const planetSignIndex = (baseVargaKey === "D1")
                          ? (houseMap[n]?.sign_index ?? null)
                          : (planets?.[p]?.vargas?.[baseVargaKey]?.Idx ?? null);
                        const statuses = getPlanetStatus(p, planets, Number.isInteger(planetSignIndex) ? planetSignIndex : null);
                        return (
                          <g key={p}>
                            <text
                              x={px} y={pos.py}
                              textAnchor="middle"
                              fontSize="15" fontWeight="900"
                              fill={pm.color}
                              fontFamily="Inter, sans-serif"
                              filter={isSel?"url(#ik-gs)":"url(#ik-gp)"}
                              opacity={isSel?1:.95}>
                              {p}
                            </text>
                            {statuses.length > 0 && statuses.map((st, si) => (
                              <text
                                key={st.label}
                                x={px + (si - (statuses.length - 1) / 2) * 8}
                                y={pos.py + 11}
                                textAnchor="middle"
                                fontSize="6.5"
                                fontWeight="900"
                                fill={st.color}
                                fontFamily="Inter, sans-serif"
                                style={{paintOrder:"stroke",stroke:"rgba(1,3,12,.95)",strokeWidth:1}}
                              >
                                {st.label}
                              </text>
                            ))}
                          </g>
                        );
                      })}
                      {/* Lagna indicator as tiny superscript after planets */}
                      {hasLagna && (
                        <text
                          x={pos.cx + totalPW/2 + (grahas.length>0?12:0)}
                          y={pos.py - 5}
                          textAnchor="middle" fontSize="8" fontWeight="900"
                          fill={PLANET_META["La"].color}
                          fontFamily="Inter, sans-serif"
                          opacity=".8">
                          La
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
              fontFamily="Inter, sans-serif"
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
                        House {hd.actualHouse || active}
                      </span>
                      <span className="text-sm font-bold"
                        style={{fontFamily:"Inter, sans-serif", color: PLANET_META[RASHI_LORD_CODE[ri]]?.color || "#FFFFFF"}}>
                        {hd.sign||RASHI[ri]}
                      </span>
                      <span className="text-[9px] ml-auto"
                        style={{fontFamily:"Inter, sans-serif", color: PLANET_META[RASHI_LORD_CODE[ri]]?.color || "#94A3B8"}}>
                        Lord: {lord}
                      </span>
                    </div>
                    {hd.category&&(
                      <div className="text-[9px] text-slate-500 mb-2 -mt-1"
                        style={{fontFamily:"Inter, sans-serif"}}>
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
                                {p}
                              </span>
                            );
                          })}
                        </div>
                      : <div className="text-[10px] text-slate-600 mb-2 italic"
                          style={{fontFamily:"Inter, sans-serif"}}>
                          Empty house
                        </div>
                    }
                    {/* AV bar */}
                    {hd.av>0&&(
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] uppercase tracking-widest text-slate-600">
                            Ashtakavarga
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

      {/* Planet status legend — only on the main D1 chart */}
      {baseVargaKey === "D1" && (
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[8px]"
          style={{fontFamily:"Inter, sans-serif"}}>
          {[
            ["E","Exalted","#4ADE80"],
            ["D","Debilitated","#FB7185"],
            ["O","Own sign","#22D3EE"],
            ["F","Friend sign","#C084FC"],
            ["En","Enemy sign","#FB923C"],
            ["R","Retrograde","#FBBF24"],
            ["C","Combust","#F97316"],
          ].map(([code,label,color]) => (
            <span key={code} title={label} className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5"
              style={{color,background:`${color}10`,border:`1px solid ${color}22`}}>
              <b>{code}</b><span style={{opacity:.55}}>{label}</span>
            </span>
          ))}
        </div>
      )}

    </div>
  );
}
