import React, { useState, useEffect, useCallback } from 'react';
import useKundliStore from '../../store/useKundliStore';
import { generateKPPayload } from '../../api/kundliApi';
// ── Planet shortcode map (Hindi → KP code) ──────────────────────────────────
const PLANET_CODES = {
  "सूर्य": "Su", "चंद्र": "Mo", "मंगल": "Ma", "बुध": "Me",
  "गुरु": "Ju", "शुक्र": "Ve", "शनि": "Sa", "राहु": "Ra", "केतु": "Ke"
};

// ── Topic display labels ─────────────────────────────────────────────────────
const TOPIC_LABELS = {
  marriage: "💍 विवाह",
  career:   "💼 करियर",
  finance:  "💰 धन / आर्थिक",
  health:   "🏥 स्वास्थ्य",
  property: "🏡 संपत्ति / वाहन",
};

// ── Manifestation index → colour + label ────────────────────────────────────
function resolveResonanceMeta(index) {
  if (index >= 0.65) return { color: "#34D399", label: "Strong",  glow: "rgba(52,211,153,0.45)" };
  if (index >= 0.40) return { color: "#FBBF24", label: "Moderate", glow: "rgba(251,191,36,0.40)" };
  if (index >= 0.20) return { color: "#F97316", label: "Weak",    glow: "rgba(249,115,22,0.40)" };
  return                      { color: "#EF4444", label: "Low",    glow: "rgba(239,68,68,0.40)"  };
}

// ── Radial arc meter ─────────────────────────────────────────────────────────
function ArcMeter({ value, size = 80, label }) {
  const pct    = Math.min(Math.max(value, 0), 1);
  const meta   = resolveResonanceMeta(pct);
  const r      = (size / 2) - 7;
  const circ   = 2 * Math.PI * r;
  const arcLen = circ * 0.75;          // ¾ circle
  const offset = arcLen * (1 - pct);
  const cx = size / 2;
  const rotDeg = 135;                   // start at bottom-left

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} style={{ transform: `rotate(${rotDeg}deg)` }}>
        {/* track */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeLinecap="round"
        />
        {/* fill */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke={meta.color}
          strokeWidth="6"
          strokeDasharray={`${arcLen - offset} ${circ - (arcLen - offset)}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${meta.glow})`, transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <span className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: meta.color, marginTop: -size * 0.28 }}>
        {(pct * 100).toFixed(0)}%
      </span>
      {label && (
        <span className="text-[9px] text-slate-500 uppercase tracking-widest -mt-1">{label}</span>
      )}
    </div>
  );
}

// ── Thin horizontal bar ──────────────────────────────────────────────────────
function Bar({ value, type = "promise" }) {
  const pct  = Math.min(Math.max(value * 100, 0), 100);
  const meta = type === "stress"
    ? { fg: "#F43F5E", bg: "rgba(244,63,94,0.10)", glow: "rgba(244,63,94,0.55)" }
    : resolveResonanceMeta(value);
  const fg   = type === "stress" ? meta.fg : meta.color;

  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: type === "stress" ? meta.bg : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out"
           style={{ width: `${pct}%`, background: fg, boxShadow: `0 0 6px ${type === "stress" ? meta.glow : meta.glow}` }} />
    </div>
  );
}

// ── Gate multiplier badge ────────────────────────────────────────────────────
function GateBadge({ multiplier }) {
  const pct  = multiplier ?? 1;
  const col  = pct >= 0.8 ? "#34D399" : pct >= 0.5 ? "#FBBF24" : "#EF4444";
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0"
         style={{ border: `3px solid ${col}`, background: `${col}18`, boxShadow: `0 0 12px ${col}44` }}>
      {pct}×
    </div>
  );
}

// ── DBA / RP / Transit / Trigger row ────────────────────────────────────────
function ScoreRow({ label, value, accent = "#A78BFA" }) {
  const pct = ((value ?? 0) * 100).toFixed(0);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 w-32 shrink-0">{label}</span>
      <div className="flex-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 5px ${accent}88` }} />
        </div>
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color: accent }}>{pct}%</span>
    </div>
  );
}

// ── Topic card ───────────────────────────────────────────────────────────────
function TopicCard({ topic, topicData }) {
  const { cuspal_data, transit_trigger, final_synthesis } = topicData;
  if (!cuspal_data || !final_synthesis) return null;

  const finalMI    = final_synthesis.final_manifestation_index ?? 0;
  const finalMeta  = resolveResonanceMeta(finalMI);
  const cs         = transit_trigger?.component_scores || {};
  const confidence = final_synthesis.confidence?.confidence_score ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07]"
         style={{ background: "linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(10,18,35,0.98) 100%)" }}>

      {/* ── Header strip ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]"
           style={{ background: `linear-gradient(90deg, ${finalMeta.color}18, transparent)` }}>
        <span className="text-base font-black text-white tracking-wide">
          {TOPIC_LABELS[topic] || topic.toUpperCase()}
        </span>
        <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ color: finalMeta.color, background: `${finalMeta.color}18`, border: `1px solid ${finalMeta.color}44` }}>
          {finalMeta.label}
        </span>
      </div>

      <div className="p-5 space-y-6">

        {/* ── Row 1: Arc meters ── */}
        <div className="flex items-end justify-around gap-2">
          <ArcMeter value={cuspal_data.aggregate_cusp_manifestation_index ?? 0} size={76} label="Cuspal Gate" />
          <ArcMeter value={finalMI} size={92} label="Final MI" />
          <ArcMeter value={confidence} size={76} label="Confidence" />
        </div>

        {/* ── Row 2: Gate control ── */}
        <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.05]">
          <GateBadge multiplier={cuspal_data.cusp_gate_multiplier} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-300 mb-1 truncate">
              {cuspal_data.cusp_gate_label || "Primary Cusp Gate"}
            </div>
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Planetary promise attenuated by&nbsp;
              <strong className="text-white">×{cuspal_data.cusp_gate_multiplier}</strong>.
              Aggregate cusp verdict:&nbsp;
              <span className="text-slate-300">{cuspal_data.aggregate_cusp_verdict}</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Promise / Stress bars ── */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-emerald-400 uppercase tracking-widest">Promise Index</span>
              <span className="text-emerald-400">{((final_synthesis.final_promise_index ?? finalMI) * 100).toFixed(1)}%</span>
            </div>
            <Bar value={final_synthesis.final_promise_index ?? finalMI} type="promise" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-rose-400 uppercase tracking-widest">Stress Index</span>
              <span className="text-rose-400">{((final_synthesis.final_stress_index ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <Bar value={final_synthesis.final_stress_index ?? 0} type="stress" />
          </div>
        </div>

        {/* ── Row 4: Timing concurrence ── */}
        {transit_trigger && (
          <div className="rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="bg-purple-950/30 px-4 py-2 border-b border-purple-500/20">
              <span className="text-[10px] uppercase tracking-widest font-bold text-purple-300">⏱ Timing & Trigger Concurrence</span>
            </div>
            <div className="px-4 py-3 space-y-1">
              <ScoreRow label="DBA Concurrence"   value={cs.dba_concurrence}        accent="#A78BFA" />
              <ScoreRow label="RP Alignment"       value={cs.rp_alignment}           accent="#818CF8" />
              <ScoreRow label="Transit Trigger"    value={cs.best_transit_trigger}   accent="#C084FC" />
              <ScoreRow label="Cuspal Hit"         value={cs.cuspal_trigger}         accent="#E879F9" />
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                  <span className="text-purple-300 uppercase tracking-widest">Final Trigger Window</span>
                  <span className="text-purple-300">{((transit_trigger.trigger_composite ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <Bar value={transit_trigger.trigger_composite ?? 0} type="promise" />
              </div>
            </div>
            <div className="bg-slate-900/60 px-4 py-2 border-t border-white/[0.04] text-[10px] text-slate-300 text-center italic">
              {transit_trigger.trigger_verdict}
            </div>
          </div>
        )}

        {/* ── Row 5: Final verdict + trace ── */}
        <div className="rounded-xl p-4 border"
             style={{ background: `${finalMeta.color}0a`, borderColor: `${finalMeta.color}30` }}>
          <div className="text-[9px] uppercase tracking-widest font-bold mb-1 text-slate-500">Final Verdict</div>
          <div className="text-sm font-black text-slate-100 mb-3 leading-snug">
            {final_synthesis.final_verdict}
          </div>
          {final_synthesis.synthesis_trace && (
            <details className="group">
              <summary className="text-[9px] uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-400 transition-colors select-none">
                Synthesis Trace ▾
              </summary>
              <div className="mt-2 text-[9px] font-mono text-slate-400 bg-black/40 rounded-lg p-2.5 border border-white/[0.04] leading-relaxed max-h-24 overflow-y-auto"
                   style={{ scrollbarWidth: "none" }}>
                <span className="text-amber-500/70 font-bold">TRACE: </span>
                {final_synthesis.synthesis_trace}
              </div>
            </details>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-slate-800/60 bg-slate-900/30">
      <div className="relative w-12 h-12 mb-5">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"
             style={{ boxShadow: "0 0 16px rgba(6,182,212,0.5)" }} />
      </div>
      <p className="font-bold text-cyan-400 text-base animate-pulse tracking-wide">🔮 Advanced KP Resonance Engine</p>
      <p className="text-[11px] text-slate-500 mt-1.5 text-center max-w-xs leading-relaxed">
        Strength Filtering → Cuspal Gates → DBA Concurrence → Trigger Windows
      </p>
      {/* shimmer cards */}
      <div className="mt-8 w-full max-w-2xl space-y-3 px-6">
        {[0.85, 0.65, 0.45].map(op => (
          <div key={op} className="h-3 rounded-full animate-pulse"
               style={{ background: `rgba(51,65,85,${op})` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function KPResonanceDashboard() {
  const { chartData, setChartData } = useKundliStore();
  const [loadingKP, setLoadingKP]   = useState(false);
  const [error, setError]           = useState(null);

  const kpResonanceData = chartData?.enginesData?.kp_resonance;

  // Stable fetch function wrapped in useCallback
  const fetchKPAdvancedData = useCallback(async (signal) => {
    setLoadingKP(true);
    setError(null);
    try {
      const md = PLANET_CODES[chartData?.dasha?.current?.mahadasha]  || "";
      const ad = PLANET_CODES[chartData?.dasha?.current?.antardasha] || "";
      const pd = PLANET_CODES[chartData?.dasha?.current?.pratyantara]|| "";
      const dba_planets = [md, ad, pd].filter(Boolean);

      const payload = {
        astro_data:        chartData?.enginesData?.kp_significators?.planets       || chartData?.planets || {},
        raw_significators: chartData?.enginesData?.kp_significators?.significators || {},
        cusp_data:         chartData?.enginesData?.kp_significators?.cusp_significators || {},
        dba_planets,
        ruling_planets:    chartData?.enginesData?.kp_ruling_planets || {},
        transit_positions: {},   // Phase-3 (Gochar) — reserved
      };

      const response = await fetch('http://127.0.0.1:5001/api/kp-advanced', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal,                  // AbortController signal
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Functional update — never stale-closure issue
        setChartData(prev => ({
          ...prev,
          enginesData: {
            ...prev.enginesData,
            kp_resonance: result.kp_resonance,
          },
        }));
      } else {
        setError(result.error || "Unknown engine error");
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User navigated away — silent cancel, no error shown
        console.log("🛑 KP Engine fetch aborted (component unmounted or tab switched).");
      } else {
        setError(err.message);
      }
    } finally {
      setLoadingKP(false);
    }
  }, [chartData, setChartData]);

  useEffect(() => {
    // Only fetch if chart is loaded but resonance data not yet cached
    if (!kpResonanceData && chartData) {
      const controller = new AbortController();
      fetchKPAdvancedData(controller.signal);
      // Cleanup: cancel in-flight request if component unmounts
      return () => controller.abort();
    }
  }, [kpResonanceData, chartData, fetchKPAdvancedData]);

  // ── Render states ──
  if (loadingKP)     return <LoadingSkeleton />;
  if (error)         return (
    <div className="my-6 p-4 rounded-xl border border-rose-500/40 bg-rose-900/15 text-rose-400 text-sm text-center">
      ⚠️ KP Engine Error: {error}
      <button
        onClick={() => { setError(null); }}
        className="ml-3 text-xs underline text-rose-300 hover:text-white transition-colors"
      >
        Retry
      </button>
    </div>
  );
  if (!kpResonanceData) return null;

  const topics = Object.entries(kpResonanceData);
  if (!topics.length) return null;

  return (
    <div className="mt-8 mb-6 space-y-6">
      {/* Section heading */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
        <h2 className="text-lg font-black text-slate-200 tracking-wide">
          Advanced KP Resonance Analysis
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
      </div>

      {/* Topic cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {topics.map(([topic, topicData]) => (
          <TopicCard key={topic} topic={topic} topicData={topicData} />
        ))}
      </div>
    </div>
  );
}