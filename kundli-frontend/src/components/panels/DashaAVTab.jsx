/**
 * DashaAVTab.jsx
 * ================
 * Batch 2 — Dasha Brahmastra + Shani Sutras
 *
 * Data source: chartData.enginesData.dasha_shani
 *
 * Refactoring Applied (v1.1):
 *   [Fix ①] Inline BAV progress bar (div+div, hardcoded height/radius) in GocharChhandraTab
 *           replaced with StrengthBar from shared/ui — consistent animation + less code.
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, GlassCard, ProgressBar,
  RiskRing, CollapsibleSection, StrengthBar
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";


// ─── Color helpers ───────────────────────────────────────
const qualityColor = (q) => ({
  excellent: C.cyan,
  good:      C.green,
  average:   C.amber,
  bad:       C.rose,
  caution:   C.orange,
}[q] || C.amber);

const qualityBg = (q) => ({
  excellent: "rgba(34,211,238,0.08)",
  good:      "rgba(74,222,128,0.08)",
  average:   "rgba(245,158,11,0.08)",
  bad:       "rgba(251,113,133,0.08)",
}[q] || "rgba(245,158,11,0.06)");


// ─── SUB-TABS ────────────────────────────────────────────
const SUB_TABS = [
  { id: "brahmastra", label: "⚡ ब्रह्मास्त्र" },
  { id: "shani",      label: "🪐 शनि सूत्र" },
  { id: "sadhesati",  label: "♄ साढ़े साती" },
  { id: "gochar",     label: "🌍 गोचर नियम" },
];


// ════════ TAB 1 — DASHA BRAHMASTRA ═══════════════════════
function BrahmastraTab({ dasha_brahmastra, antardasha_all, gochar_rescue }) {
  if (!dasha_brahmastra?.computed) {
    return (
      <EmptyState icon="⚡" message="दशा डेटा उपलब्ध नहीं"
        subtext="दशा/अंतर्दशा जानकारी engines_bridge.py से पास करें" />
    );
  }

  const db  = dasha_brahmastra;
  const col = db.color || C.amber;

  return (
    <div className="space-y-4">
      {/* Main verdict */}
      <div style={{
        background: qualityBg(db.quality),
        border: `1px solid ${col}30`,
        borderRadius: "14px", padding: "18px", textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
          {db.quality === "excellent" ? "🌟" : db.quality === "average" ? "⚖️" : "⚠️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.1rem", color: col, marginBottom: "6px" }}>
          {db.label}
        </div>
        <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", marginBottom: "10px" }}>
          {db.description}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: col }}>💡 {db.advice}</div>
      </div>

      {/* Planets involved */}
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "12px", fontSize: "0.85rem" }}>
          ग्रहों का आपसी बिंदु
        </div>
        <div className="space-y-2">
          {[
            { label: db.step1_label, score: db.step1_score },
            { label: db.step2_label, score: db.step2_score },
          ].map(({ label, score }, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", borderRadius: "8px",
              background: score ? "rgba(34,211,238,0.08)" : "rgba(251,113,133,0.08)",
            }}>
              <span style={{ ...HI, fontSize: "0.82rem" }}>{label}</span>
              <span style={{ fontWeight: 700, color: score ? C.cyan : C.rose }}>
                {score ? "1" : "0"}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: "1.1rem", color: C.amber }}>
            {db.step1_score}-{db.step2_score}
          </span>
          <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginLeft: "8px" }}>
            {db.combined_score === 2 ? "(1-1 = सर्वश्रेष्ठ)" :
             db.combined_score === 1 ? "(मिश्रित)" : "(0-0 = कष्टकारी)"}
          </span>
        </div>
      </GlassCard>

      {/* Karakatva */}
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.85rem" }}>
          कारकत्व प्रभाव
        </div>
        <div className="space-y-2">
          {db.maha_karakatva && (
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: C.cyan, fontWeight: 600 }}>{db.mahadasha_name} महादशा:</span>
              {" "}{db.maha_karakatva}
            </div>
          )}
          {db.antar_karakatva && (
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: C.amber, fontWeight: 600 }}>{db.antardasha_name} अंतर्दशा:</span>
              {" "}{db.antar_karakatva}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Gochar Rescue */}
      {gochar_rescue?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${gochar_rescue.color}` }}>
          <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "6px", fontSize: "0.85rem" }}>
            🌍 गोचर से बचाव?
          </div>
          <StatusPill label={gochar_rescue.label}
            color={gochar_rescue.rescue ? "cyan" : "rose"} size="sm" />
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>
            {gochar_rescue.description}
          </div>
          {gochar_rescue.critical_warning && (
            <div style={{ ...HI, fontSize: "0.78rem", color: C.rose, marginTop: "8px",
              padding: "6px", background: "rgba(251,113,133,0.08)", borderRadius: "6px" }}>
              {gochar_rescue.critical_warning}
            </div>
          )}
        </GlassCard>
      )}

      {/* All antardasha quality */}
      {antardasha_all?.length > 0 && (
        <CollapsibleSection icon="📋" title="सभी अंतर्दशाओं की गुणवत्ता"
          defaultOpen={false} color={C.amber}>
          <div className="space-y-2">
            {antardasha_all.map((a, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: "8px",
                background: qualityBg(a.quality),
                borderLeft: `3px solid ${qualityColor(a.quality)}`,
              }}>
                <span style={{ ...HI, fontWeight: 600, fontSize: "0.85rem",
                  color: qualityColor(a.quality) }}>
                  {a.antardasha_name}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.5)" }}>
                    {a.step1_score}-{a.step2_score}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: qualityColor(a.quality) }}>
                    {a.quality === "excellent" ? "🌟" : a.quality === "average" ? "⚖️" : "⚠️"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
            1-1 = शुभ &nbsp;|&nbsp; 1-0 या 0-1 = मिश्रित &nbsp;|&nbsp; 0-0 = कष्टकारी
          </div>
        </CollapsibleSection>
      )}

      {/* Rule explanation */}
      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.05)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📜 ब्रह्मास्त्र नियम
        </div>
        {[
          "Step 1: अंतर्दशा ग्रह के BAV चार्ट में → महादशा ग्रह ने उसे बिंदु दिया?",
          "Step 2: महादशा ग्रह के BAV चार्ट में → अंतर्दशा ग्रह ने उसे बिंदु दिया?",
          "दोनों 1-1 → अत्यंत शुभ | एक 0 → मिश्रित | दोनों 0-0 → कष्टकारी",
        ].map((t, i) => (
          <div key={i} style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)",
            marginBottom: "6px", paddingLeft: "10px", borderLeft: `2px solid ${C.amber}40` }}>
            {t}
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 2 — SHANI SUTRAS ═══════════════════════════
function ShaniTab({ shani_kast_varsh, shodhya_pinda }) {
  if (!shani_kast_varsh?.computed) {
    return <EmptyState icon="🪐" message="शनि डेटा उपलब्ध नहीं" />;
  }

  const sk = shani_kast_varsh;
  const sp = shodhya_pinda;

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px" }}>🪐 शनि स्थिति</div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[["भाव", sk.shani_house], ["SAV", sk.shani_house_sav]].map(([label, val]) => (
            <div key={label} style={{ background: "rgba(245,158,11,0.1)", borderRadius: "8px",
              padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.4rem", color: C.amber }}>{val}</div>
              <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div style={{ ...HI, fontWeight: 600, color: C.amber, fontSize: "0.85rem" }}>
        कष्ट के वर्ष (Direct SAV Formula)
      </div>

      {[
        { data: sk.kast_varsh_1, borderCol: C.orange },
        { data: sk.kast_varsh_2, borderCol: C.orange },
        { data: sk.mrityu_tulya, borderCol: C.rose,   pillColor: "rose" },
      ].map(({ data, borderCol, pillColor }, i) => (
        <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${borderCol}` }}>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: "2rem", fontWeight: 700, color: borderCol }}>{data.age}</span>
            <StatusPill label={data.label} color={pillColor || "amber"} size="sm" />
          </div>
          <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>{data.desc}</div>
          {data.warning && (
            <div style={{ ...HI, fontSize: "0.75rem", color: C.rose, marginTop: "8px",
              padding: "6px", background: "rgba(251,113,133,0.08)", borderRadius: "6px" }}>
              {data.warning}
            </div>
          )}
        </GlassCard>
      ))}

      {sp?.computed && (
        <CollapsibleSection icon="🔯" title="शोध्य पिंड — खतरे का नक्षत्र"
          defaultOpen={true} color={C.rose}>
          <div className="space-y-3">
            {[
              { title: "लग्न से 8वें भाव के आधार पर", data: sp.from_lagna },
              { title: "शनि से 8वें भाव के आधार पर", data: sp.from_shani },
            ].map(({ title, data }, i) => (
              <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${C.rose}` }}>
                <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                  {title}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: C.amber, marginBottom: "6px" }}>
                  {data.formula}
                </div>
                <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.rose, marginBottom: "4px" }}>
                  ⚠️ खतरे का नक्षत्र: {data.danger_nakshatra}
                </div>
                <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
                  {data.warning}
                </div>
              </GlassCard>
            ))}
            <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", padding: "6px" }}>
              शोध्य पिंड = {sp.shodhya_pinda} | आधार: अश्विनी नक्षत्र से गिनती
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}


// ════════ TAB 3 — SADHESATI ══════════════════════════════
function SadhesatiAVTab({ sadhesati }) {
  if (!sadhesati?.computed) {
    return <EmptyState icon="♄" message="साढ़े साती डेटा उपलब्ध नहीं" />;
  }

  const ss  = sadhesati;
  const col = ss.av_color || C.amber;
  const avQuality = ss.av_verdict === "very_good" ? "excellent" :
                    ss.av_verdict === "good"       ? "good"      :
                    ss.av_verdict === "bad"         ? "bad"       : "average";

  return (
    <div className="space-y-4">
      <GlassCard className="p-4"
        style={{ borderLeft: `3px solid ${ss.is_sadhesati ? C.amber : C.cyan}` }}>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem",
          color: ss.is_sadhesati ? C.amber : C.cyan, marginBottom: "6px" }}>
          {ss.is_sadhesati ? "🪐 साढ़े साती चल रही है" : "✅ अभी साढ़े साती नहीं है"}
        </div>
        {ss.is_sadhesati && (
          <>
            <div style={{ ...HI, fontWeight: 600, fontSize: "0.9rem", color: C.amber }}>
              {ss.phase_name}
            </div>
            <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
              {ss.phase_desc}
            </div>
          </>
        )}
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>
          जन्म राशि: {ss.moon_rashi_name} &nbsp;|&nbsp; शनि गोचर: {ss.shani_transit_name}
        </div>
      </GlassCard>

      {/* AV Correction */}
      <div style={{
        background: qualityBg(avQuality),
        border: `1px solid ${col}30`,
        borderRadius: "14px", padding: "16px",
      }}>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: col, marginBottom: "8px" }}>
          🔢 अष्टकवर्ग का निर्णय
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: col, marginBottom: "4px" }}>
          SAV: {ss.sav_at_transit}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: col, marginBottom: "6px" }}>
          {ss.av_label}
        </div>
        <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}>
          {ss.av_description}
        </div>
        {ss.bav_note && (
          <div style={{ ...HI, fontSize: "0.78rem", color: C.cyan, marginTop: "8px",
            padding: "6px", background: "rgba(34,211,238,0.08)", borderRadius: "6px" }}>
            ✨ {ss.bav_note}
          </div>
        )}
      </div>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontSize: "0.82rem", color: C.amber, fontWeight: 600, marginBottom: "8px" }}>
          📜 {ss.key_rule}
        </div>
        {[
          ["SAV ≥ 30", "शुभ फल — उन्नति देगी", C.cyan],
          ["SAV 28-29", "सामान्य फल",           C.green],
          ["SAV 25-27", "मिश्रित फल",            C.amber],
          ["SAV < 25",  "कष्टकारी — उपाय करें", C.rose],
        ].map(([range, label, color]) => (
          <div key={range} style={{ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color }}>{range}</span>
            <span style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>{label}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 4 — TRANSIT CHANDRA RULE ═══════════════════
function GocharChhandraTab({ transit_chandra }) {
  if (!transit_chandra?.length) {
    return <EmptyState icon="🌍" message="गोचर डेटा उपलब्ध नहीं" />;
  }

  const shubh  = transit_chandra.filter(p => p.final_shubh === true);
  const ashubh = transit_chandra.filter(p => p.final_shubh === false);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div style={{ display: "flex", gap: "12px" }}>
        <GlassCard className="p-3 flex-1 text-center">
          <div style={{ fontWeight: 700, fontSize: "1.4rem", color: C.cyan }}>{shubh.length}</div>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>शुभ गोचर</div>
        </GlassCard>
        <GlassCard className="p-3 flex-1 text-center">
          <div style={{ fontWeight: 700, fontSize: "1.4rem", color: C.rose }}>{ashubh.length}</div>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>अशुभ गोचर</div>
        </GlassCard>
      </div>

      {/* Planet list */}
      <div className="space-y-2">
        {transit_chandra.map((p, i) => (
          <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${p.color}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span style={{ ...HI, fontWeight: 700, fontSize: "0.95rem", color: p.color }}>
                  {p.planet_name}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  {p.rashi_name}
                </span>
              </div>
              <StatusPill label={p.status}
                color={p.final_shubh ? "cyan" : p.final_shubh === false ? "rose" : "amber"}
                size="sm" />
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
              {p.position_label}
            </div>

            {/* [Fix ①] Inline BAV bar → StrengthBar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", width: "40px" }}>
                BAV {p.bav}
              </span>
              <div style={{ flex: 1 }}>
                <StrengthBar
                  value={(p.bav / 8) * 100}
                  color={p.final_shubh ? C.cyan : C.rose}
                />
              </div>
            </div>

            {p.override_note && (
              <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, marginTop: "6px" }}>
                🔄 {p.override_note}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📜 चंद्र गोचर नियम (जन्म राशि से)
        </div>
        {[
          ["3, 6, 10, 11 वें स्थान", "शुभ गोचर",  C.cyan],
          ["4, 8, 12 वें स्थान",     "अशुभ गोचर", C.rose],
          ["बाकी (1,2,5,7,9)",       "सामान्य",    C.amber],
        ].map(([pos, label, color]) => (
          <div key={pos} style={{ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color }}>{pos}</span>
            <span style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
              → {label}
            </span>
          </div>
        ))}
        <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
          AV Override: अशुभ स्थान पर BAV ≥ 6 → बुरा असर रद्द।
          शुभ स्थान पर BAV ≤ 2 → शुभ फल नहीं।
        </div>
      </GlassCard>
    </div>
  );
}


// ════════ MAIN COMPONENT ═════════════════════════════════
export default function DashaAVTab({ data }) {
  const [activeTab, setActiveTab] = useState("brahmastra");

  if (!data) {
    return <EmptyState icon="🔢" message="Dasha AV डेटा लोड हो रहा है..."
      subtext="Phase 2 background analysis..." />;
  }

  if (!data.computed) {
    return <EmptyState icon="⚙️" message={data.error || "गणना में त्रुटि"} />;
  }

  const { summary } = data;

  const renderTab = () => {
    switch (activeTab) {
      case "brahmastra": return (
        <BrahmastraTab
          dasha_brahmastra={data.dasha_brahmastra}
          antardasha_all={data.antardasha_quality_all}
          gochar_rescue={data.gochar_rescue}
        />
      );
      case "shani":     return <ShaniTab shani_kast_varsh={data.shani_kast_varsh} shodhya_pinda={data.shodhya_pinda} />;
      case "sadhesati": return <SadhesatiAVTab sadhesati={data.sadhesati} />;
      case "gochar":    return <GocharChhandraTab transit_chandra={data.transit_chandra} />;
      default:          return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, margin: 0 }}>
            ⚡ दशा + शनि AV विश्लेषण
          </h3>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            Dasha Brahmastra · Shani Sutras · Sadhesati AV Correction
          </p>
        </div>
        {summary?.dasha_label && (
          <StatusPill
            label={summary.dasha_label.replace(/[🌟🔴🟡⚡⚠️]/g, "").trim()}
            color={summary.dasha_quality === "excellent" ? "cyan" :
                   summary.dasha_quality === "bad"       ? "rose" : "amber"}
            size="sm"
          />
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {SUB_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "5px 12px", borderRadius: "20px",
            fontSize: "0.75rem", cursor: "pointer", border: "none",
            background: activeTab === tab.id ? C.amber : "rgba(255,255,255,0.07)",
            color: activeTab === tab.id ? "#000" : "rgba(255,255,255,0.7)",
            fontWeight: activeTab === tab.id ? 700 : 400, ...HI,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}