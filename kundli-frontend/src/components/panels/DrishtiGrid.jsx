// DrishtiGrid — ग्रह दृष्टि + भाव दृष्टि (dono views)
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PLANET_META } from "../../constants";

const NATURE_STYLE = {
  "अमृत": { bg:"rgba(34,211,238,.1)",  border:"rgba(34,211,238,.3)",  text:"#22D3EE", icon:"✨" },
  "शुभ":  { bg:"rgba(74,222,128,.08)", border:"rgba(74,222,128,.25)", text:"#4ADE80", icon:"✦" },
  "पाप":  { bg:"rgba(251,113,133,.08)",border:"rgba(251,113,133,.25)",text:"#FB7185", icon:"🎯" },
  "तटस्थ":{ bg:"rgba(148,163,184,.06)",border:"rgba(148,163,184,.18)",text:"#94A3B8", icon:"•"  },
};
const natureStyle = (n="") => {
  const nl = n.toLowerCase();
  if (nl.includes("अमृत") || nl==="jupiter" || nl==="amrit" || nl==="yogakaraka" || nl==="protective") return NATURE_STYLE["अमृत"];
  if (nl.includes("शुभ")  || nl==="benefic" || nl==="natural_benefic" || nl==="good") return NATURE_STYLE["शुभ"];
  if (nl.includes("पाप")  || nl==="malefic" || nl==="natural_malefic"|| nl==="killer") return NATURE_STYLE["पाप"];
  return NATURE_STYLE["तटस्थ"];
};

const RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const HOUSE_CAT = ["केंद्र त्रिकोण","धन","उपचय","केंद्र","त्रिकोण","त्रिक","केंद्र मारक","त्रिक","त्रिकोण","केंद्र","त्रिशडाय","त्रिक"];

// ─────────────────────────────────────────────────────────────
// VIEW 1: Graha → Target houses (existing)
// ─────────────────────────────────────────────────────────────
function GrahaDrishtiView({ drishti, planets }) {
  return (
    <div className="flex flex-col gap-2.5 pb-4">
      {Object.entries(drishti).map(([code, houses], i) => {
        const meta = PLANET_META[code] || {};
        const p    = planets[code] || {};
        const fn   = p.functionalNature || "";
        const isBenefic = /Yogakaraka|Functional Benefic/i.test(fn);
        const isMalefic = /Malefic/i.test(fn) && !/Functional Benefic/i.test(fn);
        const arrowColor = isBenefic ? "#22D3EE" : isMalefic ? "#FB7185" : "#94A3B8";

        return (
          <motion.div key={code} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:i*.04 }}
            className="p-3 rounded-2xl border"
            style={{
              background:"linear-gradient(135deg,rgba(10,14,32,.95),rgba(5,8,22,.98))",
              borderColor:"rgba(255,255,255,.06)",
            }}>
            <div className="flex items-center gap-3">

              {/* Source planet */}
              <div className="flex items-center gap-2.5 w-28 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black border flex-shrink-0"
                  style={{ background:`${meta.color}15`,color:meta.color,borderColor:`${meta.color}30` }}>
                  {meta.symbol}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-black text-white"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {p.hindi || code}
                  </div>
                  <div className="text-[9px] text-slate-600"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {p.hindi_sign || ""}{p.house ? ` · भाव ${p.house}` : ""}
                  </div>
                </div>
              </div>

              {/* Arrow + nature */}
              <div className="flex flex-col items-center flex-shrink-0">
                <ArrowRight size={13} style={{ color:arrowColor }}/>
                <span className="text-[7px] mt-0.5 font-semibold"
                  style={{ color:arrowColor, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                  {isBenefic?"शुभ":isMalefic?"पाप":"सम"}
                </span>
              </div>

              {/* Target houses */}
              <div className="flex flex-wrap gap-1.5 flex-1">
                {(houses||[]).map(h => (
                  <div key={h}
                    className="flex flex-col items-center w-9 h-9 rounded-xl justify-center border hover:scale-105 transition-transform cursor-default"
                    style={{
                      background: isBenefic?"rgba(34,211,238,.08)":isMalefic?"rgba(251,113,133,.08)":"rgba(148,163,184,.06)",
                      borderColor: isBenefic?"rgba(34,211,238,.25)":isMalefic?"rgba(251,113,133,.25)":"rgba(148,163,184,.18)",
                    }}>
                    <span className="text-[14px] font-black"
                      style={{ color:isBenefic?"#22D3EE":isMalefic?"#FB7185":"#94A3B8" }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Degree + strength */}
              {p.strength && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] font-black"
                    style={{ color:p.strength>=70?"#22D3EE":p.strength>=40?"#F59E0B":"#FB7185" }}>
                    {p.strength}
                  </div>
                  <div className="text-[8px] text-slate-600"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>बल</div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2: Bhav → Incoming drishti list (NEW)
// ─────────────────────────────────────────────────────────────
function BhavDrishtiView({ bhavDrishti={}, planets={}, houses=[] }) {
  // Build bhav sign map from houses array
  const bhavSign = {};
  houses.forEach(h => { bhavSign[h.num] = h.signHindi || RASHI_HI[h.num-1] || ""; });

  // Compute house → resident planets map
  const houseResidents = {};
  Object.entries(planets).forEach(([pc, p]) => {
    const h = p.house;
    if (h) { houseResidents[h] = houseResidents[h] || []; houseResidents[h].push(pc); }
  });

  return (
    <div className="flex flex-col gap-2.5 pb-4">
      {Array.from({length:12},(_,i)=>i+1).map((hnum, idx) => {
        const incoming = bhavDrishti[hnum] || [];
        const residents= houseResidents[hnum] || [];
        const rashi    = bhavSign[hnum] || RASHI_HI[hnum-1] || "";
        const cat      = HOUSE_CAT[hnum-1] || "";
        const hasAmrit = incoming.some(d => d.nature?.includes("अमृत") || d.nature?.includes("Amrit"));
        const hasPaap  = incoming.some(d => d.nature?.includes("पाप")  || d.nature?.includes("Malefic"));
        const borderCol = hasAmrit ? "rgba(34,211,238,.25)" : hasPaap ? "rgba(251,113,133,.2)" : "rgba(255,255,255,.05)";
        const bgCol     = hasAmrit ? "rgba(34,211,238,.04)" : hasPaap ? "rgba(251,113,133,.03)" : "rgba(10,14,32,.92)";

        return (
          <motion.div key={hnum}
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:idx*.03 }}
            className="rounded-2xl border overflow-hidden"
            style={{ background:bgCol, borderColor:borderCol }}>

            {/* Header row */}
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              {/* House number circle */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[14px] flex-shrink-0"
                style={{
                  background: hasAmrit?"rgba(34,211,238,.12)":hasPaap?"rgba(251,113,133,.1)":"rgba(255,255,255,.05)",
                  color: hasAmrit?"#22D3EE":hasPaap?"#FB7185":"#94A3B8",
                  border:`1px solid ${borderCol}`,
                }}>
                {hnum}
              </div>

              {/* Rashi + category */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-black text-white"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {rashi}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full text-slate-500"
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)",
                      fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {cat}
                  </span>
                </div>
                {/* Resident planets */}
                {residents.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {residents.map(pc => {
                      const pm = PLANET_META[pc] || {};
                      return (
                        <span key={pc} className="text-[9px] px-1.5 py-0.5 rounded-lg font-bold"
                          style={{ background:`${pm.color}15`, color:pm.color, border:`1px solid ${pm.color}28`,
                            fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                          {pm.symbol} {planets[pc]?.hindi || pc}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Incoming count badge */}
              {incoming.length > 0 && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-[18px] font-black leading-none"
                    style={{ color: hasAmrit?"#22D3EE":hasPaap?"#FB7185":"#94A3B8" }}>
                    {incoming.length}
                  </div>
                  <div className="text-[7px] text-slate-600"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>दृष्टियां</div>
                </div>
              )}
              {incoming.length === 0 && (
                <span className="text-[9px] text-slate-700 flex-shrink-0"
                  style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>कोई नहीं</span>
              )}
            </div>

            {/* Incoming drishti pills */}
            {incoming.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
                {incoming.map((d, i) => {
                  const pm  = PLANET_META[d.planet] || {};
                  const ns  = natureStyle(d.nature || "");
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background:ns.bg, border:`1px solid ${ns.border}` }}>
                      <span style={{ color:pm.color, fontSize:14 }}>{pm.symbol}</span>
                      <div>
                        <span className="text-[10px] font-black"
                          style={{ color:pm.color, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                          {planets[d.planet]?.hindi || d.planet}
                        </span>
                        <span className="text-[8px] text-slate-500 ml-1"
                          style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                          की {d.aspectType || ""}
                        </span>
                        <span className="text-[7px] ml-1.5 font-semibold" style={{ color:ns.text }}>
                          {ns.icon} {d.nature || ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT — Tab-switched dual view
// ─────────────────────────────────────────────────────────────
export default function DrishtiGrid({ drishti={}, bhavDrishti={}, planets={}, houses=[] }) {
  const [view, setView] = useState("graha"); // "graha" | "bhav"

  return (
    <div className="flex flex-col gap-3">

      {/* Toggle tabs */}
      <div className="flex rounded-xl p-0.5 gap-0.5"
        style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)" }}>
        {[
          { key:"graha", label:"ग्रह दृष्टि", sub:"ग्रह → भाव" },
          { key:"bhav",  label:"भाव दृष्टि",  sub:"भाव ← ग्रह" },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex-1 py-2 rounded-lg transition-all"
            style={{
              background: view===tab.key ? "rgba(245,158,11,.15)" : "transparent",
              border: view===tab.key ? "1px solid rgba(245,158,11,.3)" : "1px solid transparent",
            }}>
            <div className="text-[11px] font-black"
              style={{ color:view===tab.key?"#F59E0B":"#64748b",
                fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
              {tab.label}
            </div>
            <div className="text-[8px] text-slate-600" style={{ fontFamily:"'Cinzel',serif" }}>
              {tab.sub}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-1 flex-wrap">
        {[["✨ अमृत","#22D3EE"],["✦ शुभ","#4ADE80"],["🎯 पाप","#FB7185"]].map(([l,c])=>(
          <span key={l} className="text-[9px] font-semibold"
            style={{ color:c, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{l}</span>
        ))}
      </div>

      {view === "graha"
        ? <GrahaDrishtiView drishti={drishti} planets={planets}/>
        : <BhavDrishtiView  bhavDrishti={bhavDrishti} planets={planets} houses={houses}/>
      }
    </div>
  );
}
