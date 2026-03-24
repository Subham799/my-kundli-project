// NadiJyotishPanel.jsx — Architecture v2
// 16 Vishay Topics × 4 sources (BNN + Vedic + D-Charts + AV)
// D9 popup chart: clicking "D9 देखें" opens navamsha chakra overlay.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useKundliStore from "../../store/useKundliStore";
import { SUTRA_TOPICS } from "../../constants";

const HI = { fontFamily: "'Noto Sans Devanagari', sans-serif" };
const C  = {
  amber:"#F59E0B", cyan:"#22D3EE", rose:"#FB7185", green:"#4ADE80",
  purple:"#C084FC", indigo:"#818CF8", orange:"#FB923C", teal:"#2DD4BF",
  red:"#EF4444", yellow:"#FCD34D", pink:"#F472B6", blue:"#60A5FA",
  slate:"#94A3B8", white:"#F1F5F9",
};

// ═══════════════════════════════════════════════════════
// SUTRA TOPICS UI COMPONENTS
// ═══════════════════════════════════════════════════════

// Single evidence row: ✓/✗ + text + detail + ref
function SutraRow({ rule }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="py-2.5 border-b border-white/5 last:border-0 cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex gap-2.5 items-start">
        <span
          className="text-[15px] font-black shrink-0 mt-0.5 w-5 text-center"
          style={{ color: rule.met ? C.green : "#ef444460" }}
        >
          {rule.met ? "✓" : "✗"}
        </span>

        <div className="flex-1 min-w-0">
          <div
            className="text-[12px] font-semibold leading-snug"
            style={{ color: rule.met ? "#e2e8f0" : "#64748b", ...HI }}
          >
            {rule.text}
          </div>

          {/* Expandable detail */}
          {open && (
            <div className="mt-1.5 text-[10px] text-slate-500 leading-relaxed" style={HI}>
              {rule.detail}
            </div>
          )}

          {/* Planets tags (when open) */}
          {open && rule.planets?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {rule.planets.map(p => (
                <span
                  key={p}
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(192,132,252,.15)", color: C.purple }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right flex flex-col items-end gap-1">
          <span
            className="text-[8px] leading-tight max-w-[85px] text-right"
            style={{ color: "#6b21a8", ...HI }}
          >
            {rule.ref}
          </span>
          <span className="text-[9px]" style={{ color: "#334155" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Collapsible section wrapper (BNN / Vedic / D-Charts / AV)
function SourceSection({ icon, title, accentColor = C.purple, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="mb-2 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${accentColor}20`, background: "rgba(8,12,28,.97)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ borderBottom: open ? `1px solid ${accentColor}12` : "none" }}
      >
        <span className="text-[13px]">{icon}</span>
        <span
          className="flex-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: accentColor, ...HI }}
        >
          {title}
        </span>
        <span className="text-[9px]" style={{ color: accentColor }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="px-4 pb-2 pt-1">{children}</div>}
    </div>
  );
}

// D-Chart table rows
function DchartTable({ dchart }) {
  if (!dchart || Object.keys(dchart).length === 0) return null;
  return (
    <div className="space-y-1.5">
      {Object.values(dchart).map((entry, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,.025)" }}
        >
          <span className="text-[10px] font-bold text-cyan-400 shrink-0 w-44" style={HI}>
            {entry.label}
          </span>
          {entry.sign && entry.sign !== "—" && (
            <span className="text-[11px] text-slate-300" style={HI}>
              राशि: <span className="text-amber-300">{entry.sign}</span>
            </span>
          )}
          {entry.planets?.length > 0 && (
            <span className="text-[11px] text-slate-400" style={HI}>
              ग्रह: <span className="text-purple-300">{entry.planets.join(", ")}</span>
            </span>
          )}
          {entry.dignity && entry.dignity !== "—" && (
            <span
              className="text-[11px]"
              style={{
                color: entry.dignity.includes("✅")
                  ? C.green
                  : entry.dignity.includes("⚠️")
                  ? C.rose
                  : C.slate,
                ...HI,
              }}
            >
              {entry.dignity}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Ashtakavarga bindu bar
function AvBar({ av }) {
  if (!av) return null;
  const pct = Math.min(100, Math.max(0, (av.bindus / av.max) * 100));
  const barColor = av.strong ? C.green : C.rose;
  return (
    <div className="px-3 py-3 rounded-xl" style={{ background: "rgba(255,255,255,.025)" }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-slate-400" style={HI}>
          {av.note}
        </span>
        <span className="text-[13px] font-black" style={{ color: barColor }}>
          {av.bindus}/{av.max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: barColor,
            boxShadow: `0 0 8px ${barColor}50`,
          }}
        />
      </div>
      <div
        className="text-[10px] mt-1.5 text-right"
        style={{ color: barColor, ...HI }}
      >
        {av.strong ? "बलवान — अनुकूल" : "कमज़ोर — प्रतिकूल"}
      </div>
    </div>
  );
}

// Full topic view: all 4 sources
function TopicView({ topicKey, topicMeta, chartData }) {
  const topic = chartData?.enginesData?.nadi_jyotish?.sutra_topics?.[topicKey] ?? null;

  if (!topic) {
    return (
      <div className="text-center py-10 text-slate-600 text-xs" style={HI}>
        डेटा लोड हो रहा है…
      </div>
    );
  }

  const bnnMet   = (topic.bnn   || []).filter(r => r.met).length;
  const bnnTotal = (topic.bnn   || []).length;
  const vedMet   = (topic.vedic || []).filter(r => r.met).length;
  const vedTotal = (topic.vedic || []).length;

  return (
    <div>
      {/* Summary pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div
          className="px-3 py-1.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(192,132,252,.12)", color: C.purple, ...HI }}
        >
          📜 BNN: {bnnMet}/{bnnTotal} मिले
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(34,211,238,.1)", color: C.cyan, ...HI }}
        >
          🕉 Vedic: {vedMet}/{vedTotal} मिले
        </div>
        {topicMeta?.karak && (
          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-bold"
            style={{ background: "rgba(245,158,11,.1)", color: C.amber, ...HI }}
          >
            कारक: {topicMeta.karak} | भाव: {topicMeta.house}
          </div>
        )}
      </div>

      {/* BNN Sutras */}
      <SourceSection icon="📜" title="BNN — भृगु नंदी नाड़ी सूत्र" accentColor={C.purple}>
        {(topic.bnn || []).map(r => <SutraRow key={r.id} rule={r} />)}
      </SourceSection>

      {/* Vedic Sutras */}
      <SourceSection icon="🕉" title="Vedic — शास्त्रीय सूत्र" accentColor={C.cyan} defaultOpen={true}>
        {(topic.vedic || []).map(r => <SutraRow key={r.id} rule={r} />)}
      </SourceSection>

      {/* D-Charts */}
      {topic.dchart && Object.keys(topic.dchart).length > 0 && (
        <SourceSection icon="🗺" title="D-Charts — भाव विश्लेषण" accentColor={C.blue} defaultOpen={true}>
          <DchartTable dchart={topic.dchart} />
          {/* D9 popup button */}
          <button
            className="mt-3 w-full text-[10px] py-2 rounded-xl font-bold transition-all"
            style={{
              background: "rgba(96,165,250,.08)",
              border: "1px solid rgba(96,165,250,.25)",
              color: C.blue,
              ...HI,
            }}
            onClick={() => {
              // Trigger D9 chart popup — handled by DashboardLayout
              window.dispatchEvent(new CustomEvent("open-d9-chart"));
            }}
          >
            🗺 D9 नवांश चार्ट देखें →
          </button>
        </SourceSection>
      )}

      {/* Ashtakavarga */}
      {topic.av && (
        <SourceSection icon="🔢" title="अष्टकवर्ग — भाव बल" accentColor={C.yellow} defaultOpen={true}>
          <AvBar av={topic.av} />
        </SourceSection>
      )}

      {/* User decides footer */}
      <div className="mt-4 py-4 border-t border-slate-800 text-center">
        <div className="text-[11px] text-slate-600 leading-relaxed" style={HI}>
          👆 ऊपर दिए सभी स्रोत देखकर{" "}
          <span className="text-amber-400 font-bold">आप स्वयं निर्णय लें</span>
          <br />
          <span className="text-slate-700">कोई भी एक सूत्र अंतिम नहीं होता</span>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════

function NadiLoading() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-xl animate-pulse"
          style={{ background: "rgba(255,255,255,.04)" }}
        />
      ))}
    </div>
  );
}

export default function NadiJyotishPanel({ chartData }) {
  const { enginesLoading } = useKundliStore();
  const [activeTopic, setActiveTopic] = useState("vivah");

  const nadi    = chartData?.enginesData?.nadi_jyotish || {};
  const hasData = Object.keys(nadi).length > 0 && !nadi.error;
  const hasSutraTopics = !!nadi.sutra_topics;

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(168,85,247,.15)", border: "1px solid rgba(168,85,247,.3)" }}
        >
          🔮
        </div>
        <div>
          <div className="text-[14px] font-black text-slate-200" style={HI}>नाड़ी ज्योतिष</div>
          <div className="text-[10px] text-slate-600" style={HI}>
            BNN · Saptarishi · Bhrigu Gurukulam — 16 विषय × 4 स्रोत
          </div>
        </div>
        {/* Status pill */}
        <div
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: enginesLoading
              ? "rgba(245,158,11,.1)"
              : hasData
              ? "rgba(74,222,128,.1)"
              : "rgba(239,68,68,.1)",
            border: `1px solid ${enginesLoading ? "rgba(245,158,11,.25)" : hasData ? "rgba(74,222,128,.25)" : "rgba(239,68,68,.25)"}`,
          }}
        >
          {enginesLoading ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400" style={HI}>लोड हो रहा है…</span>
            </>
          ) : hasData ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] text-green-400" style={HI}>तैयार</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] text-red-400" style={HI}>डेटा नहीं</span>
            </>
          )}
        </div>
      </div>

      {/* ── Error display ── */}
      {nadi.error && (
        <div
          className="p-3 rounded-xl text-[11px]"
          style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: C.red, ...HI }}
        >
          ⚠️ नाड़ी इंजन त्रुटि: {nadi.error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {enginesLoading && <NadiLoading />}

      {/* ── No data ── */}
      {!enginesLoading && !hasData && (
        <div className="text-center py-10 text-slate-600 text-xs" style={HI}>
          नाड़ी इंजन का डेटा अभी नहीं आया। कुंडली दोबारा generate करें।
        </div>
      )}

      {/* ── 16 विषय ── */}
      {!enginesLoading && hasData && (
        <div>
          {/* 16-topic scrollable tab bar */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {SUTRA_TOPICS.map(topic => {
              const isActive = activeTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: isActive ? "rgba(245,158,11,.18)" : "rgba(255,255,255,.04)",
                    color: isActive ? C.amber : C.slate,
                    border: isActive
                      ? "1px solid rgba(245,158,11,.4)"
                      : "1px solid rgba(255,255,255,.07)",
                    ...HI,
                  }}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          {/* Topic content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTopic}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {hasSutraTopics ? (
                <TopicView
                  topicKey={activeTopic}
                  topicMeta={SUTRA_TOPICS.find(t => t.id === activeTopic)}
                  chartData={chartData}
                />
              ) : (
                <div className="text-center py-8 text-slate-600 text-xs" style={HI}>
                  sutra_topics डेटा नहीं मिला। Backend update करें।
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}


    </div>
  );
}