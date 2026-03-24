// PlanetDrawer — Premium Hindi, circular progress ring, glowing badges, collapsible raw calc
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, ChevronUp, ArrowRight, Eye, Sparkles } from "lucide-react";
import { PLANET_META, DIGNITY_STYLE } from "../../constants";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";

const SECTION = { hidden:{opacity:0,y:14}, show:(i)=>({opacity:1,y:0,transition:{delay:0.08+i*0.06}}) };

// ── Circular Progress Ring ────────────────────────────────────
function RingProgress({pct, color, size=64, stroke=5}) {
  const r = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <div className="relative flex-shrink-0" style={{width:size,height:size}}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} initial={{strokeDashoffset:circ}}
          animate={{strokeDashoffset:circ-dash}}
          transition={{duration:1.2,ease:"easeOut"}}
          style={{filter:`drop-shadow(0 0 4px ${color}80)`}}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{color}}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Risk Badge ────────────────────────────────────────────────
function RiskBadge({score}) {
  const [lbl,cls] =
    score<20?["न्यूनतम","bg-emerald-500/15 text-emerald-300 border-emerald-500/25"]:
    score<40?["निम्न","bg-cyan-500/15 text-cyan-300 border-cyan-500/25"]:
    score<60?["मध्यम","bg-amber-500/15 text-amber-300 border-amber-500/25"]:
    score<80?["उच्च","bg-orange-500/20 text-orange-300 border-orange-500/35 shadow-sm shadow-orange-500/20"]:
             ["अत्यंत उच्च","bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/25 animate-pulse"];
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cls}`}
      style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{lbl}</span>
  );
}

function Hdr({icon, label}) {
  return (
    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
      {icon}{label}
    </h3>
  );
}

// ── Collapsible Raw Calc ──────────────────────────────────────
function RawCalc({notes}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button onClick={()=>setOpen(o=>!o)}
        className="flex items-center gap-2 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        {open?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
        ⚙️ विस्तृत गणना
        {!open && <span className="text-[9px] text-slate-700">(छुपा हुआ — क्लिक करें)</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.2}}>
            <div className="mt-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p className="text-xs text-slate-400 leading-relaxed">{notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlanetDrawer({ code, data, open, onClose }) {
  const meta = code ? PLANET_META[code] : null;
  if (!meta || !data) return null;

  const riskColor = data.riskScore<30?"#34D399":data.riskScore<55?"#F59E0B":"#F87171";
  const strengthColor = data.strength>=80?"#34D399":data.strength>=50?"#F59E0B":"#F87171";
  const dignityVariant = data.dignity==="Uchcha"?"emerald":data.dignity==="Neecha"?"rose":data.dignity==="Swa"?"gold":"default";

  const fnHindi =
    data.functionalNature==="Yogakaraka"?"योगकारक ★":
    data.functionalNature==="Malefic"?"पापी":
    data.functionalNature==="Functional Benefic"?"कार्यात्मक शुभ":
    data.functionalNature==="Functional Malefic"?"कार्यात्मक पाप":
    data.functionalNature||"तटस्थ";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.2}}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-40" onClick={onClose}/>

          <motion.div key="dr"
            initial={{x:"100%",opacity:0.5}} animate={{x:0,opacity:1}} exit={{x:"100%",opacity:0}}
            transition={{type:"spring",stiffness:300,damping:30}}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] z-50 flex flex-col overflow-hidden"
            style={{background:"rgba(2,10,22,0.99)",backdropFilter:"blur(32px)",
              borderLeft:"1px solid rgba(99,102,241,0.18)",boxShadow:"-32px 0 80px rgba(0,0,0,0.85)"}}>

            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black"
                    style={{background:`${meta.color}20`,color:meta.color,border:`1px solid ${meta.color}40`,
                      boxShadow:`0 0 20px ${meta.glow}`}}>
                    {meta.symbol}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-100 flex items-baseline gap-2">
                      {data.name}
                      <span className="text-base text-slate-500"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{data.hindi}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={dignityVariant}
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {data.dignityHindi}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        भाव {data.house} · {data.degree}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all">
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5"
              style={{scrollbarWidth:"thin",scrollbarColor:"rgba(99,102,241,0.3) transparent"}}>

              {/* 1 · बल विश्लेषण */}
              <motion.div custom={0} variants={SECTION} initial="hidden" animate="show">
                <GlassCard className="p-5">
                  <Hdr icon={<span className="text-amber-500">◈</span>}
                    label="बल विश्लेषण (षड्बल)"/>
                  <div className="flex items-center gap-5 mb-4">
                    {/* Circular ring */}
                    <RingProgress pct={data.strength} color={strengthColor} size={72} stroke={5}/>
                    <div className="flex-1">
                      <div className="text-2xl font-black mb-1" style={{color:strengthColor}}>{data.strength}%</div>
                      <div className="text-xs text-slate-500 mb-2"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>षड्बल / ग्रह बल</div>
                      <RiskBadge score={data.riskScore}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/25 text-center">
                      <div className="text-sm font-bold mb-0.5" style={{color:riskColor}}>{data.riskScore}</div>
                      <div className="text-[10px] text-slate-600"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>जोखिम स्कोर</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/25 text-center">
                      <div className="text-sm font-bold mb-0.5 text-slate-300"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{data.nakshatra}</div>
                      <div className="text-[10px] text-slate-600"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>नक्षत्र</div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* 2 · कार्यात्मक प्रकृति + फलदाता */}
              <motion.div custom={1} variants={SECTION} initial="hidden" animate="show">
                <GlassCard className="p-5">
                  <Hdr icon={<span className="text-cyan-400">⇌</span>}
                    label="कार्यात्मक प्रकृति और फलदाता"/>
                  <div className="flex items-center justify-between p-3 rounded-xl mb-4 border"
                    style={{background:`${meta.color}10`,borderColor:`${meta.color}25`}}>
                    <span className="text-sm font-bold"
                      style={{color:meta.color,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{fnHindi}</span>
                    {data.maleficInfluence && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/25">
                        <span className="text-[10px] text-rose-400"
                          style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>⚠ पाप प्रभाव सक्रिय</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40">
                      <span className="text-lg" style={{color:meta.color}}>{meta.symbol}</span>
                      <span className="text-slate-300 font-semibold text-sm">{code}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 flex-shrink-0"/>
                    <div className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40">
                      <span className="text-slate-500 text-xs"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>फलदाता: </span>
                      <span className="text-slate-200 font-bold text-sm">{data.dispositor}</span>
                      <span className="text-slate-500 text-xs ml-1"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {data.dispositorSign} में
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* 3 · Active Yogas */}
              {data.keyYogas?.length > 0 && (
                <motion.div custom={2} variants={SECTION} initial="hidden" animate="show">
                  <GlassCard className="p-5">
                    <Hdr icon={<Sparkles size={12} className="text-amber-400"/>}
                      label="सक्रिय योग"/>
                    <div className="flex flex-col gap-2">
                      {data.keyYogas.map((yoga,i) => (
                        <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                          transition={{delay:0.3+i*0.05}}
                          className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/15"
                          style={{background:"rgba(245,158,11,0.06)"}}>
                          <span className="text-amber-400 text-sm flex-shrink-0">✦</span>
                          <span className="text-sm text-amber-100">{yoga}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* 4 · ग्रह दृष्टि */}
              {data.aspects?.length > 0 && (
                <motion.div custom={3} variants={SECTION} initial="hidden" animate="show">
                  <GlassCard className="p-5">
                    <Hdr icon={<Eye size={12} className="text-violet-400"/>}
                      label="ग्रह दृष्टि (Aspects)"/>
                    <div className="flex flex-wrap gap-2">
                      {data.aspects.map(h => (
                        <div key={h}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors cursor-default">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm">
                            {h}
                          </div>
                          <span className="text-xs text-violet-300"
                            style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>भाव {h}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* 5 · ज्योतिषीय नियम विश्लेषण */}
              <motion.div custom={4} variants={SECTION} initial="hidden" animate="show">
                <GlassCard className="p-5">
                  <Hdr icon={<span className="text-cyan-400">⊛</span>}
                    label="ज्योतिषीय नियम विश्लेषण"/>
                  <p className="text-sm text-slate-300 leading-relaxed">{data.notes}</p>
                  <RawCalc notes={data.notes}/>
                </GlassCard>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
