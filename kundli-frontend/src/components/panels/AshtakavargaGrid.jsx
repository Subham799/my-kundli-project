// AshtakavargaGrid — 12 sleek cards with turning point highlight
import { motion } from "framer-motion";

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const RASHI_ENG = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];

function avColor(v) {
  if (v>=6) return {bar:"#34D399",bg:"rgba(52,211,153,0.12)",border:"rgba(52,211,153,0.3)",text:"#34D399"};
  if (v>=5) return {bar:"#22D3EE",bg:"rgba(34,211,238,0.08)",border:"rgba(34,211,238,0.22)",text:"#22D3EE"};
  if (v>=4) return {bar:"#F59E0B",bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.22)",text:"#F59E0B"};
  if (v>=3) return {bar:"#F97316",bg:"rgba(249,115,22,0.08)",border:"rgba(249,115,22,0.22)",text:"#F97316"};
  return    {bar:"#F87171",bg:"rgba(248,113,113,0.1)",border:"rgba(248,113,113,0.28)",text:"#F87171"};
}

export default function AshtakavargaGrid({ sav=[], houses=[], ashtakavargaSpecial="" }) {
  const maxAV = Math.max(...sav.filter(Boolean), 1);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200"
            style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>सर्वाष्टकवर्ग</h3>
          <p className="text-[10px] text-slate-600 mt-0.5">प्रत्येक भाव के बिंदु (0–8)</p>
        </div>
        {ashtakavargaSpecial && (
          <div className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 max-w-[200px]">
            <p className="text-[10px] text-amber-300 leading-snug"
              style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{ashtakavargaSpecial}</p>
          </div>
        )}
      </div>

      {/* 12 cards grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {sav.map((av, i) => {
          const hNum = i+1;
          const h = houses.find(x=>x.num===hNum)||{};
          const c = avColor(av);
          const isMax = av===maxAV;
          const pct = Math.round((av/8)*100);

          return (
            <motion.div key={i} initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}}
              transition={{delay:i*0.04}}
              className={`relative rounded-2xl p-3 border transition-all hover:scale-[1.03] cursor-default ${isMax?"ring-1 ring-emerald-400/40 shadow-md shadow-emerald-500/10":""}`}
              style={{background:c.bg, borderColor:c.border}}>

              {/* House number */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500"
                  style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>भाव {hNum}</span>
                {isMax && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>सर्वोच्च ✦</span>
                )}
              </div>

              {/* Score */}
              <div className="text-2xl font-black mb-1" style={{color:c.text,textShadow:`0 0 10px ${c.bar}50`}}>
                {av}
              </div>
              <div className="text-[10px] text-slate-600 mb-2"
                style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                {h.signHindi||RASHIS[i]}
              </div>

              {/* Mini bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
                <motion.div className="h-full rounded-full"
                  style={{background:c.bar,boxShadow:`0 0 6px ${c.bar}60`}}
                  initial={{width:0}} animate={{width:`${pct}%`}}
                  transition={{duration:0.8,delay:0.2+i*0.04,ease:"easeOut"}}/>
              </div>

              {/* Category */}
              {h.category && (
                <div className="mt-2 text-[9px] text-slate-700 leading-tight"
                  style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{h.category}</div>
              )}

              {/* Planets in house */}
              {h.planets?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-0.5">
                  {h.planets.slice(0,3).map(p=>(
                    <span key={p} className="text-[9px] px-1 py-0.5 rounded-md bg-slate-800/50 text-slate-500">{p}</span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-slate-600"
          style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>बल श्रेणी:</span>
        {[{r:"6-8",c:"#34D399",l:"उत्तम"},{r:"4-5",c:"#F59E0B",l:"सामान्य"},{r:"0-3",c:"#F87171",l:"निम्न"}].map(x=>(
          <div key={x.r} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{background:x.c}}/>
            <span className="text-[9px] text-slate-600"
              style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{x.l} ({x.r})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
