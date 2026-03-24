// MasterConclusion.jsx — Plugs into: <MasterConclusion data={chartData.masterConclusion} />
// ── DRY: ALL primitives from shared/ui & shared/designTokens ────────────────
import { motion } from "framer-motion";
import { PLANET_META } from "../../constants";
import {
  ProgressBar, RingGauge, SectionLabel, CollapsibleSection,
  PlanetChip, ScoreHero, StatusPill, EmptyState,
} from "../shared/ui";
import { HI, C, strColor, strLabel, avColor, avLabel, riskColor, riskBg } from "../shared/designTokens";

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function MasterConclusion({ data }) {
  if (!data) return <EmptyState icon="📜" message="कुंडली डेटा उपलब्ध नहीं" />;

  const {
    overallScore, summary, bestPeriod, caution,
    lagnesh, lagnaMeta,
    shubhPlanets, ashubhPlanets, topStrengths, topRisks,
    riskTable,
    aspectDominance,
    specialYogas, yogakaraka,
    avTurningPoints,
    avBhavas, avTotal,
  } = data;

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-3.5 pb-6" style={HI}>

      {/* ══ HERO — Overall Score ══ */}
      <ScoreHero
        score={overallScore}
        label="समग्र कुण्डली विश्लेषण"
        summary={summary}
        bestPeriod={bestPeriod}
        caution={caution}
      />

      {/* ══ BLOCK 1 — LAGNESH ══ */}
      {lagnesh && (
        <CollapsibleSection variant="compact" icon="🏠" title="Block 1 — लग्न एवं लग्नेश"
          color="#F59E0B" defaultOpen={true}>
          {/* Lagnesh card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl mb-3"
            style={{ background: `${PLANET_META[lagnesh.code]?.color}0D`,
              border: `1px solid ${PLANET_META[lagnesh.code]?.color}25` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${PLANET_META[lagnesh.code]?.color}18`,
                border: `1px solid ${PLANET_META[lagnesh.code]?.color}35`,
                boxShadow: `0 0 16px ${PLANET_META[lagnesh.code]?.color}20` }}>
              {PLANET_META[lagnesh.code]?.symbol}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[14px] font-black text-white">{lagnesh.hindi}</span>
                <StatusPill color={C.cyan}>लग्नेश</StatusPill>
              </div>
              <div className="text-[9px] text-slate-400 mb-1.5">
                भाव {lagnesh.house}
                {lagnesh.rashi ? ` · ${lagnesh.rashi}` : ""}
                {lagnesh.functionalNature ? ` · ${lagnesh.functionalNature}` : ""}
              </div>
              <ProgressBar value={lagnesh.strength || 0} max={150}
                color={strColor(lagnesh.strength || 0)} variant="thin" delay={0.1} />
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[20px] font-black leading-none"
                style={{ color: strColor(lagnesh.strength || 0) }}>{lagnesh.strength}</div>
              <div className="text-[7px] text-slate-600">बल/150</div>
              <div className="text-[8px] mt-0.5" style={{ color: strColor(lagnesh.strength || 0) }}>
                {strLabel(lagnesh.strength || 0)}
              </div>
            </div>
          </div>
          {lagnaMeta?.desc && (
            <div className="p-3 rounded-xl text-[10px] text-slate-300 leading-relaxed"
              style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)" }}>
              {lagnaMeta.desc}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ══ BLOCK 2 — SHUBH / ASHUBH ══ */}
      {(shubhPlanets?.length || ashubhPlanets?.length || topStrengths?.length || topRisks?.length) && (
        <CollapsibleSection variant="compact" icon="⚖️" title="Block 2 — शुभ / अशुभ वर्गीकरण"
          color={C.cyan} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3.5"
              style={{ background: "rgba(34,211,238,.06)", border: "1px solid rgba(34,211,238,.18)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">शुभ ग्रह</span>
              </div>
              {(shubhPlanets || topStrengths || []).map((p, i) => {
                const code = typeof p === "string" ? p : p.code;
                const pd   = typeof p === "object" ? p : {};
                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <PlanetChip code={code} showName />
                    {pd.dosha && <div className="text-[8px] text-cyan-400/60">{pd.dosha}</div>}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl p-3.5"
              style={{ background: "rgba(251,113,133,.06)", border: "1px solid rgba(251,113,133,.18)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">अशुभ ग्रह</span>
              </div>
              {(ashubhPlanets || topRisks || []).map((p, i) => {
                const code = typeof p === "string" ? p : p.code;
                const pd   = typeof p === "object" ? p : {};
                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <PlanetChip code={code} showName />
                    {pd.dosha && <div className="text-[8px] text-rose-400/60">{pd.dosha}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* ══ BLOCK 3 — RISK TABLE ══ */}
      {riskTable?.length > 0 && (
        <CollapsibleSection variant="compact" icon="🎯" title="Block 3 — जोखिम सारणी"
          badge="Risk Matrix" color={C.rose} defaultOpen={true}>
          <div className="flex flex-col gap-1.5">
            {riskTable.map(({ code, hindi, house, strength, risk, riskLabel, dosh }, i) => {
              const pm  = PLANET_META[code] || {};
              const col = riskColor(risk);
              return (
                <motion.div key={code}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * .04 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: riskBg(risk), border: `1px solid ${col}1A` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${pm.color}18`, border: `1px solid ${pm.color}30` }}>
                    {pm.symbol}
                  </div>
                  <div className="w-16 flex-shrink-0">
                    <div className="text-[12px] font-black text-white">{hindi || pm.label}</div>
                    <div className="text-[8px] text-slate-600">भाव {house}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[7px] text-slate-600">बल</span>
                      <span className="text-[8px] font-bold" style={{ color: strColor(strength) }}>
                        {strength}/150
                      </span>
                    </div>
                    <ProgressBar value={strength} max={150} color={strColor(strength)}
                      variant="thin" delay={i * .04} showValue={false} />
                  </div>
                  {/* Risk ring — using RingGauge (small) */}
                  <RingGauge value={risk} max={100} size={42} color={col} label="/100" />
                  <div className="w-20 flex-shrink-0 text-right">
                    {dosh && dosh !== "—"
                      ? <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold text-rose-300"
                          style={{ background: "rgba(251,113,133,.12)", border: "1px solid rgba(251,113,133,.22)" }}>
                          {dosh}
                        </span>
                      : <span className="text-[8px] text-slate-700">—</span>
                    }
                    <div className="text-[8px] mt-1 font-semibold" style={{ color: col }}>{riskLabel}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ══ BLOCK 4 — DRISHTI ══ */}
      {aspectDominance && (
        <CollapsibleSection variant="compact" icon="👁️" title="Block 4 — दृष्टि प्रबलता"
          color="#A5B4FC" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-3">
            {aspectDominance.guruDrishti?.length > 0 && (
              <div className="rounded-xl p-3.5"
                style={{ background:"rgba(253,230,138,.06)", border:"1px solid rgba(253,230,138,.2)" }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span>🌟</span>
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">गुरु दृष्टि रक्षित</span>
                </div>
                {aspectDominance.guruDrishti.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="text-amber-400/50 text-xs flex-shrink-0">✦</span>
                    <span className="text-[10px] text-slate-300">{t}</span>
                  </div>
                ))}
              </div>
            )}
            {aspectDominance.ghatak?.length > 0 && (
              <div className="rounded-xl p-3.5"
                style={{ background:"rgba(251,113,133,.06)", border:"1px solid rgba(251,113,133,.2)" }}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span>☠️</span>
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">घातक दृष्टि</span>
                </div>
                {aspectDominance.ghatak.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="text-rose-400/50 text-xs flex-shrink-0">▼</span>
                    <span className="text-[10px] text-slate-300">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ══ BLOCK 5 — SPECIAL YOGAS ══ */}
      {(specialYogas?.length > 0 || yogakaraka) && (
        <CollapsibleSection variant="compact" icon="✨" title="Block 5 — विशेष योग सारांश"
          color="#FDE68A" defaultOpen={true}>
          <div className="flex flex-col gap-2.5">
            {yogakaraka && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl"
                style={{ background:"rgba(245,158,11,.09)", border:"1px solid rgba(245,158,11,.28)" }}>
                <span className="text-amber-400 text-lg">★</span>
                <div>
                  <div className="text-[9px] text-amber-400/70 uppercase tracking-widest mb-0.5">योगकारक ग्रह</div>
                  <div className="text-[12px] font-black text-amber-300">{yogakaraka}</div>
                </div>
              </div>
            )}
            {(specialYogas || []).map((y, i) => {
              const isObj  = typeof y === "object";
              const planet = isObj ? y.planet : null;
              const title  = isObj ? y.title  : y;
              const desc   = isObj ? y.desc   : null;
              const col    = planet ? PLANET_META[planet]?.color : C.cyan;
              const sym    = planet ? PLANET_META[planet]?.symbol : "✦";
              return (
                <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * .06 }}
                  className="p-3.5 rounded-xl"
                  style={{ background:`${col}0A`, border:`1px solid ${col}22` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background:`${col}18`, border:`1px solid ${col}30` }}>{sym}</div>
                    <div>
                      <div className="text-[12px] font-black mb-1" style={{ color: col }}>{title}</div>
                      {desc && <div className="text-[10px] text-slate-400 leading-relaxed">{desc}</div>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ══ BLOCK 6 — AV TURNING POINTS ══ */}
      {avTurningPoints?.length > 0 && (
        <CollapsibleSection variant="compact" icon="⏳" title="Block 6 — अष्टकवर्ग टर्निंग पॉइंट"
          badge="आयु सूत्र" color="#4ADE80" defaultOpen={true}>
          <div className="mb-4 p-3 rounded-xl text-[12px] text-slate-300 leading-relaxed"
            style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.25)" }}>
            <span className="text-amber-400 font-bold">📐 आयु सूत्र: </span>
            <span className="text-white font-bold">Σ(भाव 1 → ग्रह भाव) × 7 ÷ 27 = टर्निंग वर्ष</span>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-3 bottom-3 w-px pointer-events-none"
              style={{ background:"linear-gradient(180deg,rgba(245,158,11,.35),rgba(245,158,11,.05))" }} />
            {[...(avTurningPoints || [])].sort((a, b) => a.year - b.year).map(
              ({ code, hindi, year, house, ageGroup, avSum, formula, planetaryReason, nature }, i) => {
                const pm         = PLANET_META[code] || { color:"#94A3B8", symbol:"?" };
                const col        = pm.color;
                const isNear     = year >= currentYear - 2 && year <= currentYear + 10;
                const isPast     = year < currentYear - 2;
                const isPositive = nature === "good"  || /सुख|लाभ|उन्नति|सफलता|शुभ|धन/.test(ageGroup || "");
                const isNegative = nature === "bad"   || /कष्ट|संकट|हानि|दुख|बाधा|रोग/.test(ageGroup || "");
                const dotColor   = isNear ? C.amber : isPast ? "rgba(255,255,255,.12)" : isPositive ? C.green : isNegative ? C.rose : col;

                return (
                  <motion.div key={code} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * .05 }}
                    className="relative flex items-stretch gap-3 mb-2.5 pl-10">
                    <div className="absolute left-3 top-4 w-3 h-3 rounded-full -translate-x-1/2"
                      style={{ background: dotColor, border:`2px solid ${dotColor}50`,
                        boxShadow: isNear ? "0 0 10px rgba(245,158,11,.5)" : `0 0 6px ${dotColor}60` }} />
                    <div className="flex-1 flex items-start gap-3 p-3 rounded-xl"
                      style={{
                        background: isNear ? "rgba(245,158,11,.08)" : isPast ? "rgba(255,255,255,.015)"
                          : isPositive ? "rgba(74,222,128,.06)" : isNegative ? "rgba(251,113,133,.06)" : `${col}0A`,
                        border: `1px solid ${isNear ? "rgba(245,158,11,.3)" : isPast ? "rgba(255,255,255,.04)"
                          : isPositive ? "rgba(74,222,128,.2)" : isNegative ? "rgba(251,113,133,.2)" : col+"1E"}`,
                        opacity: isPast ? .5 : 1,
                      }}>
                      <span className="text-xl flex-shrink-0 mt-0.5" style={{ color: isPast ? "#475569" : col }}>
                        {pm.symbol}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-black" style={{ color: isPast ? "#64748b" : col }}>
                            {hindi || pm.label || code}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background:"rgba(255,255,255,.08)", color: isPast ? "#475569":"#CBD5E1" }}>
                            भाव {house}
                          </span>
                          {isNear && <StatusPill color={C.amber} pulse>← निकट</StatusPill>}
                        </div>
                        {ageGroup && (
                          <div className="text-[12px] font-bold mt-1.5 px-2 py-1 rounded-lg inline-block"
                            style={{ color: isPast ? "#475569" : isPositive ? C.green : isNegative ? C.rose : col,
                              background: isPast ? "transparent" : isPositive ? "rgba(74,222,128,.1)" : isNegative ? "rgba(251,113,133,.1)" : `${col}10`,
                              border: isPast ? "none" : `1px solid ${isPast?"transparent":isPositive?C.green:isNegative?C.rose:col}30` }}>
                            {isPositive ? "✅ " : isNegative ? "⚠️ " : ""}{ageGroup}
                          </div>
                        )}
                        {planetaryReason && !isPast && (
                          <div className="mt-1.5 text-[11px] leading-relaxed p-2 rounded-lg"
                            style={{ background:`${col}0D`, border:`1px solid ${col}20`, color:"#CBD5E1" }}>
                            <span style={{ color: col }} className="font-bold">🪐 कारण: </span>{planetaryReason}
                          </div>
                        )}
                        {(formula || avSum != null) && (
                          <div className="mt-1.5 text-[11px] font-mono p-2 rounded-lg"
                            style={{ background:"rgba(255,255,255,.07)", border:`1px solid ${col}25`,
                              color: isPast ? "#475569" : "#94A3B8" }}>
                            {formula || `Σ(भाव 1→${house}) = ${avSum} | ×7 = ${avSum*7} | ÷27 = `}
                            {!formula && <strong style={{ color: isPast ? "#475569" : col }}>{year} वर्ष</strong>}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[22px] font-black leading-none"
                          style={{ color: isPast ? "#475569" : isNear ? C.amber : isPositive ? C.green : isNegative ? C.rose : col }}>
                          {year}
                        </div>
                        <div className="text-[10px] font-bold mt-0.5"
                          style={{ color: isPast ? "#475569" : col+"99" }}>वर्ष</div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
          {avTotal != null && (
            <div className="mt-2 p-2.5 rounded-xl text-[9px]"
              style={{ background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.15)" }}>
              <span className="text-amber-400/70">⭐ कुल सर्वाष्टकवर्ग: </span>
              <span className="text-amber-300 font-black">{avTotal} बिंदु</span>
              <span className="text-slate-600 ml-2">· औसत {(avTotal / 12).toFixed(1)}/भाव</span>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ══ BHAV AV GRID ══ */}
      {avBhavas?.length > 0 && (
        <CollapsibleSection variant="compact" icon="🔢" title="सर्वाष्टकवर्ग — 12 भाव"
          color="#4ADE80" defaultOpen={false}>
          <div className="grid grid-cols-4 gap-2">
            {avBhavas.map(({ n, rashi, av }) => {
              const col = avColor(av);
              return (
                <div key={n} className="rounded-xl p-2.5 text-center"
                  style={{ background:`${col}0C`, border:`1px solid ${col}22` }}>
                  <div className="text-[7px] text-slate-600">भाव {n}</div>
                  <div className="text-[8px] text-slate-500 truncate">{rashi}</div>
                  <div className="text-[18px] font-black leading-tight" style={{ color: col }}>{av}</div>
                  <div className="text-[7px] mt-0.5" style={{ color: col }}>{avLabel(av)}</div>
                  <ProgressBar value={av} max={8} color={col} variant="thin"
                    delay={n * .03} showValue={false} />
                </div>
              );
            })}
          </div>
          {avTotal != null && (
            <div className="flex justify-between text-[10px] p-2.5 rounded-xl mt-2"
              style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.05)" }}>
              <span className="text-slate-500">सर्वयोग:</span>
              <span className="font-black text-amber-400">{avTotal} बिंदु</span>
              <span className="text-slate-500">औसत: {(avTotal / 12).toFixed(1)} / भाव</span>
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}