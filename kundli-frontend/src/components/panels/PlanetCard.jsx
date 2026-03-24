// PlanetCard.jsx — Premium Redesign
// Unified color scheme: Amber primary · Cyan = positive · Rose = negative · White = content
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PLANET_META, DIGNITY_STYLE } from "../../constants";

// ─────────────────────────────────────────────────────────────
// STRENGTH RING — Amber→Green gradient, pure white numeric
// ─────────────────────────────────────────────────────────────
function StrengthRing({ value, max = 150, size = 54 }) {
  const r      = (size - 7) / 2;
  const circ   = 2 * Math.PI * r;
  const pct    = Math.min(value / max, 1);
  // Unified: low=rose, mid=amber, high=cyan
  const color  = pct >= 0.65 ? "#22D3EE" : pct >= 0.4 ? "#F59E0B" : "#FB7185";
  const label  = pct >= 0.65 ? "बलवान" : pct >= 0.4 ? "सामान्य" : "कमजोर";

  return (
    <div className="relative flex-shrink-0 flex flex-col items-center gap-0.5"
      style={{ width: size + 8 }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5.5"/>
          <motion.circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${color}70)` }}/>
        </svg>
        {/* Value — pure white */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[12px] font-black leading-none text-white">{value}</span>
          <span className="text-[7px] text-slate-600">/{max}</span>
        </div>
      </div>
      <span className="text-[8px] font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RISK BADGE — functional color only
// ─────────────────────────────────────────────────────────────
function RiskBadge({ score = 0 }) {
  const cfg =
    score < 15 ? { l: "न्यूनतम", c: "text-emerald-400",  bg: "bg-emerald-500/10",  b: "border-emerald-500/25" } :
    score < 30 ? { l: "निम्न",   c: "text-cyan-400",     bg: "bg-cyan-500/10",     b: "border-cyan-500/25"    } :
    score < 50 ? { l: "मध्यम",   c: "text-amber-400",    bg: "bg-amber-500/10",    b: "border-amber-500/25"   } :
    score < 75 ? { l: "उच्च",    c: "text-orange-400",   bg: "bg-orange-500/12",   b: "border-orange-500/30"  } :
                 { l: "अत्यंत",  c: "text-rose-400 animate-pulse", bg: "bg-rose-500/15", b: "border-rose-500/35" };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border
      ${cfg.c} ${cfg.bg} ${cfg.b}`}
      style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
      🎯 जोखिम: {cfg.l}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGES — Cyan = positive, Rose = negative, Amber = special
// ─────────────────────────────────────────────────────────────
function StatusBadges({ data }) {
  const badges = [];
  // POSITIVE — Cyan
  if (data.dignity === "Uchcha")
    badges.push({ t: "उच्च ✦",       c: "text-cyan-300 bg-cyan-500/12 border-cyan-400/30"   });
  if (data.dignity === "Swa")
    badges.push({ t: "स्वराशि",      c: "text-cyan-300 bg-cyan-500/10 border-cyan-400/25"   });
  if (data.dignity === "Moolatrikona")
    badges.push({ t: "मूलत्रिकोण",   c: "text-cyan-300 bg-cyan-500/10 border-cyan-400/20"   });
  if (data.functionalNature === "Yogakaraka")
    badges.push({ t: "योगकारक ★",    c: "text-cyan-300 bg-cyan-500/14 border-cyan-400/35"   });
  if (data.neechabhanga)
    badges.push({ t: "नीचभंग 🌟",    c: "text-amber-300 bg-amber-500/12 border-amber-400/28" });
  // NEGATIVE — Rose
  if (data.dignity === "Neecha")
    badges.push({ t: "नीच ▼",        c: "text-rose-300 bg-rose-500/12 border-rose-400/30"   });
  if (data.maraka)
    badges.push({ t: "मारक ☠️",      c: "text-rose-300 bg-rose-500/12 border-rose-400/28"   });
  if (data.badhakesh)
    badges.push({ t: "बाधकेश 🔒",    c: "text-rose-300/80 bg-rose-900/18 border-rose-700/28" });
  if (data.functionalNature?.includes("Malefic") || data.functionalNature?.includes("अशुभ"))
    badges.push({ t: "पापी",          c: "text-rose-400/70 bg-rose-900/12 border-rose-800/25" });

  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {badges.map((b, i) => (
        <span key={i}
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${b.c}`}
          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
          {b.t}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ASPECT ROW
// ─────────────────────────────────────────────────────────────
function AspectRow({ graha, drishti, prakriti, score }) {
  const pm      = PLANET_META[graha] || {};
  const isGood  = prakriti?.includes("शुभ") || prakriti?.includes("Benefic");
  return (
    <div className="grid grid-cols-4 px-2 py-1.5 border-b border-white/5 last:border-0
      hover:bg-white/3 transition-colors">
      <span className="text-[10px] font-bold" style={{ color: pm.color || "#94A3B8",
        fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
        {pm.hi || graha}
      </span>
      <span className="text-[10px] text-white/70">{drishti}°</span>
      <span className={`text-[10px] col-span-2 font-medium
        ${isGood ? "text-cyan-400/80" : "text-rose-400/80"}`}
        style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
        {prakriti}
        {score !== undefined &&
          <span className="ml-1 opacity-60">({score > 0 ? "+" : ""}{score})</span>}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DISPOSITOR CHAIN
// ─────────────────────────────────────────────────────────────
function DispositorChain({ chain = [] }) {
  if (!chain.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {chain.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-[10px] px-2 py-0.5 rounded-md text-white/60"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'Noto Sans Devanagari',sans-serif",
            }}>
            {item}
          </span>
          {i < chain.length - 1 && <span className="text-slate-700 text-xs">→</span>}
        </span>
      ))}
      {chain.length > 2 && (
        <span className="text-[8px] text-amber-500/50 ml-0.5">⟳ चक्रीय</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CALC STEP
// ─────────────────────────────────────────────────────────────
function CalcStep({ step }) {
  const isDosh = step.type?.includes("दोष") || step.value > 0;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm flex-shrink-0">
        {step.type?.includes("बचाव") ? "🛡️" : step.type?.includes("दोष") ? "⚠️" : "⚙️"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-white/70 leading-tight"
          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
          {step.label}
        </div>
        {step.detail && (
          <div className="text-[9px] text-slate-600 mt-0.5">{step.detail}</div>
        )}
      </div>
      {step.value !== undefined && (
        <span className={`text-[10px] font-black flex-shrink-0
          ${isDosh ? "text-rose-400" : "text-cyan-400"}`}>
          {step.value > 0 ? "+" : ""}{step.value}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FUNCTIONAL NATURE LABEL — Hindi
// ─────────────────────────────────────────────────────────────
const FN_HINDI = {
  Benefic:        "शुभ",
  Malefic:        "अशुभ",
  Yogakaraka:     "योगकारक",
  "Neutral":      "तटस्थ",
  "Functional Benefic": "कार्यात्मक शुभ",
  "Functional Malefic": "कार्यात्मक अशुभ",
};

// ─────────────────────────────────────────────────────────────
// MAIN PLANET CARD
// ─────────────────────────────────────────────────────────────
export default function PlanetCard({ code, data = {}, isSelected = false, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const meta     = PLANET_META[code] || { color: "#94A3B8", symbol: "?", label: code, hi: code };
  const risk     = data.netRisk ?? data.risk ?? 0;
  const fnHindi  = FN_HINDI[data.functionalNature] || data.functionalNature || "—";
  const isGoodFn = data.functionalNature === "Yogakaraka" ||
                   data.functionalNature?.includes("Benefic");
  const riskColor = risk >= 50 ? "#FB7185" : risk >= 30 ? "#F59E0B" : "#22D3EE";

  return (
    <motion.div
      layout
      whileHover={{ y: -1 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        expanded ? "col-span-2 xl:col-span-3" : ""
      }`}
      style={{
        // Base: slate-900 with planet-tinted edge
        background: "linear-gradient(145deg,rgba(15,20,40,0.95),rgba(8,12,28,0.98))",
        borderColor: isSelected ? meta.color : "rgba(100,116,139,0.18)",
        boxShadow: isSelected
          ? `0 0 0 1px ${meta.color}30, 0 4px 20px ${meta.color}12`
          : "0 2px 12px rgba(0,0,0,0.35)",
      }}>

      {/* Top accent line — planet color, very subtle */}
      <div className="h-px w-full" style={{
        background: `linear-gradient(90deg,transparent,${meta.color}60,transparent)`
      }}/>

      {/* ── Summary (always visible) ── */}
      <div className="p-3.5 cursor-pointer" onClick={onClick}>

        {/* Row 1: Symbol + Name + Ring */}
        <div className="flex items-start gap-3 mb-2.5">

          {/* Planet symbol circle */}
          <motion.div whileHover={{ scale: 1.08 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl
              font-black flex-shrink-0 border"
            style={{
              background: `${meta.color}14`,
              color: meta.color,
              borderColor: `${meta.color}30`,
              boxShadow: isSelected ? `0 0 14px ${meta.color}35` : undefined,
            }}>
            {meta.symbol}
          </motion.div>

          {/* Name + details */}
          <div className="flex-1 min-w-0">
            {/* Planet Hindi name — PURE WHITE, prominent */}
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[15px] font-black text-white leading-tight"
                style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                {data.hindi || code}
              </span>
              {/* Dignity badge */}
              {data.dignity && data.dignity !== "—" && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold
                  ${DIGNITY_STYLE[data.dignity] ?? DIGNITY_STYLE["—"]}`}
                  style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                  {data.dignityHindi || data.dignity}
                </span>
              )}
            </div>

            {/* House · Rashi · Degree — slate-400 secondary */}
            <div className="text-[10px] text-slate-400 leading-snug"
              style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
              <span className="text-white/50">भाव </span>
              <span className="text-white font-semibold">{data.house}</span>
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-white/80">{data.hindi_sign || "—"}</span>
              {data.degree && (
                <span className="text-slate-500 ml-1">· {data.degree}</span>
              )}
            </div>

            {/* Full degree (ecliptic) + Rashi degree */}
            {data.fullDegree != null && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{ background:"rgba(245,158,11,.1)", color:"#F59E0B", border:"1px solid rgba(245,158,11,.2)" }}>
                  🌐 {data.fullDegree}°
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{ background:"rgba(255,255,255,.05)", color:"#94A3B8", border:"1px solid rgba(255,255,255,.08)" }}>
                  ♈ {data.degree}
                </span>
              </div>
            )}

            {/* Nakshatra + Pada */}
            {data.nakshatra && (
              <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1.5"
                style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                ⭐ {data.nakshatra}
                {data.nakshatraPada && (
                  <span className="px-1 rounded text-[8px]"
                    style={{ background:"rgba(255,255,255,.05)", color:"#64748b" }}>
                    चरण {data.nakshatraPada}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Strength ring */}
          <StrengthRing value={data.strength || 0} max={150}/>
        </div>

        {/* Status badges */}
        <StatusBadges data={data}/>

        {/* Row: Functional nature + Risk */}
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-1">
          {/* Functional nature pill */}
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border
            ${isGoodFn
              ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/25"
              : "text-rose-300/80 bg-rose-900/15 border-rose-700/25"}`}
            style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
            ⚡ {fnHindi}
          </span>
          <RiskBadge score={risk}/>
        </div>
      </div>

      {/* ── Expand/Collapse toggle ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-1.5 py-2
          border-t border-white/5 hover:bg-white/3 transition-colors
          text-[10px] text-slate-600 hover:text-slate-300"
        style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
        {expanded
          ? <><ChevronUp size={11} className="text-amber-500/60"/> Raw Data छुपाएं</>
          : <><ChevronDown size={11} className="text-amber-500/60"/> Raw Data देखें</>
        }
      </button>

      {/* ── Expanded Raw Data ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}>

            <div className="border-t border-white/5 p-3.5 flex flex-col gap-4"
              style={{ background: "rgba(2,5,16,0.7)" }}>

              {/* Strength factors */}
              <div>
                <div className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  💪 बल स्तर
                  {data.ownsHouses && (
                    <span className="text-slate-500 normal-case text-[9px]"
                      style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                      · स्वामी: भाव {Array.isArray(data.ownsHouses) ? data.ownsHouses.join(",") : data.ownsHouses}
                    </span>
                  )}
                </div>
                {data.strengthFactors?.map((f, i) => (
                  <div key={i} className={`text-[10px] flex items-center gap-1.5 py-0.5
                    ${f.positive ? "text-cyan-400" : "text-rose-400"}`}
                    style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                    <span className="opacity-70">{f.positive ? "✓" : "✗"}</span>
                    <span className="flex-1 text-white/70">{f.label}</span>
                    {f.value !== undefined && (
                      <span className="font-black">{f.positive ? "+" : ""}{f.value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Aspect table */}
              {data.aspectTable?.length > 0 && (
                <div>
                  <div className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-2">
                    👁️ दृष्टि व युति
                  </div>
                  <div className="rounded-xl overflow-hidden border border-white/6">
                    <div className="grid grid-cols-4 px-2 py-1.5 bg-white/4 text-[8px]
                      text-slate-500 uppercase tracking-wider">
                      <span>ग्रह</span><span>दृष्टि</span><span className="col-span-2">प्रकृति</span>
                    </div>
                    {data.aspectTable.map((row, i) => (
                      <AspectRow key={i} graha={row.graha} drishti={row.drishti}
                        prakriti={row.prakriti} score={row.score}/>
                    ))}
                  </div>

                  {data.aspectResult && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {[
                        { l: "शुभ बल", v: data.aspectResult.shubh, c: "#22D3EE"  },
                        { l: "पाप बल", v: data.aspectResult.paap,  c: "#FB7185"  },
                        { l: "परिणाम", v: data.aspectResult.result, c: "#F59E0B" },
                      ].map(x => (
                        <div key={x.l} className="text-center p-1.5 rounded-lg border border-white/6"
                          style={{ background: `${x.c}08` }}>
                          <div className="text-xs font-black" style={{ color: x.c }}>{x.v}</div>
                          <div className="text-[8px] text-slate-600"
                            style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dispositor Chain */}
              {data.dispositorChain?.length > 0 && (
                <div>
                  <div className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-1">
                    🔗 फलदाता श्रृंखला
                  </div>
                  <DispositorChain chain={data.dispositorChain}/>
                </div>
              )}

              {/* Raw Calc Steps */}
              {data.calcSteps?.length > 0 && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">
                    ⚙️ Raw Calculation
                  </div>
                  <div className="rounded-xl border border-white/6 px-3 py-2"
                    style={{ background: "rgba(0,0,0,0.4)" }}>
                    {data.calcSteps.map((s, i) => <CalcStep key={i} step={s}/>)}
                    {data.netRisk !== undefined && (
                      <div className="mt-2 pt-2 border-t border-white/6 flex justify-between items-center">
                        <span className="text-[9px] text-slate-600"
                          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                          दोष: {data.totalDosh || 0} · बचाव: -{data.totalBachao || 0}
                        </span>
                        <span className="text-[11px] font-black" style={{ color: riskColor }}>
                          नेट: {data.netRisk}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {data.notes && (
                <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-white/5"
                  style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                  📝 {data.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
