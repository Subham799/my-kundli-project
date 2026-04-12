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
              <div className="text-[7px] text-slate-400">बल/150</div>
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
                      <span className="text-[7px] text-slate-400">बल</span>
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

      {/* ══ BLOCK 6 — AV TURNING POINTS (High Contrast) ══ */}
      {avTurningPoints?.length > 0 && (
        <CollapsibleSection variant="compact" icon="⏳" title="Block 6 — अष्टकवर्ग आयु सूत्र (टर्निंग पॉइंट)"
          badge="आयु सूत्र" color="#10B981" defaultOpen={true}>
          
          {/* 💡 Rule Explanation Banner (High Contrast & Clear Context) */}
          <div className="mb-5 p-4 rounded-xl text-[12px] text-emerald-50 leading-relaxed shadow-sm"
            style={{ background: "rgba(16, 185, 129, 0.10)", border: "1px solid rgba(16, 185, 129, 0.40)" }}>
            <b className="text-emerald-400 text-[13px]">💡 गोचर ट्रिगर नियम:</b> 
            <br className="mt-2" />
            गणितीय सूत्र से प्राप्त शेषफल (Remainder) को हमेशा <b>'अश्विनी'</b> नक्षत्र से गिना जाता है। 
            ब्रह्मांड में गोचर करता हुआ पापी ग्रह (जैसे शनि या राहु) जब ठीक इस निकाली गई <b>'ट्रिगर नक्षत्र'</b> के ऊपर से गुजरता है, तब जातक के जीवन में उस भाव से जुड़ा बड़ा परिवर्तन या कष्ट ट्रिगर होता है।
          </div>

          <div className="space-y-3">
            {[...(avTurningPoints || [])].sort((a, b) => a.year - b.year).map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl shadow-lg flex flex-col gap-3 transition-all hover:shadow-xl"
                style={{ background: "#1e293b", border: "1px solid rgba(148, 163, 184, 0.30)" }}>
                
                {/* Top Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[20px]">{PLANET_META[t.code]?.symbol || "•"}</span>
                      <div>
                        <span className="text-[13px] font-black text-amber-300 drop-shadow-sm">{t.hindi}</span>
                        <div className="text-[11px] text-slate-300 mt-1">{t.ageGroup}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-[10px] border border-white/20 font-bold w-fit">
                      भाव {t.house}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-white drop-shadow-md">{t.year}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">वर्ष की आयु</div>
                  </div>
                </div>

                {/* Formula Box - Improved Contrast (Dark Black BG with Bright Text) */}
                {t.formula && (
                  <div className="px-3 py-3 rounded-lg font-mono text-[11.5px] tracking-wide shadow-inner overflow-x-auto whitespace-nowrap"
                    style={{ background: "#050814", border: "1px solid rgba(100, 116, 139, 0.5)", color: "#fef3c7" }}>
                    {t.formula}
                  </div>
                )}

                {/* 🎯 Trigger Nakshatra Badge (Clear, Prominent & Explanatory) */}
                {t.nakshatra && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl w-fit font-bold text-[12.5px] shadow-sm"
                    style={{ background: "rgba(244, 63, 94, 0.20)", border: "1px solid rgba(244, 63, 94, 0.50)", color: "#fca5a5" }}>
                    🎯 ट्रिगर नक्षत्र: <span style={{ color: "#f87171", fontSize: "13px", fontWeight: "900" }}>{t.nakshatra}</span>
                  </div>
                )}

              </motion.div>
            ))}
          </div>

          {avTotal != null && (
            <div className="flex justify-between text-[10px] p-3 rounded-xl mt-4 font-bold"
              style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
              <span className="text-slate-400">सर्वयोग:</span>
              <span className="text-emerald-400">{avTotal} बिंदु</span>
              <span className="text-slate-500">औसत: {(avTotal / 12).toFixed(1)} / भाव</span>
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
                  style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.35)" }}>
                  <div className="text-[7px] text-slate-400">भाव {n}</div>
                  <div className="text-[8px] text-slate-300 truncate">{rashi}</div>
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