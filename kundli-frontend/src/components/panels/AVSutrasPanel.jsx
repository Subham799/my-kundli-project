/**
 * AVSutrasPanel.jsx
 * ===================
 * Ashtakvarga Sutras Panel — Session 36+
 * 
 * Features shown:
 *  1. Fortune / Hardship Years Timeline
 *  2. Grah Bal (Planet Strength cards)
 *  3. Wealth & Status Matrix
 *  4. Relationship Analysis
 *  5. Life Risk Index (Black Hole Scanner)
 *  6. 12-Year Life Cycle Graph
 * 
 * Import path: ./panels/AVSutrasPanel
 * Data source: chartData.enginesData.av_sutras (Phase 2)
 * 
 * Usage in DashboardLayout.jsx:
 *   import AVSutrasPanel from './panels/AVSutrasPanel';
 *   <AVSutrasPanel data={chartData?.enginesData?.av_sutras} chartData={chartData} />
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, CardBlock, SectionLabel,
  Card, CollapsibleSection, ProgressBar, RiskRing,
  PlanetChip, GlassCard, StrengthBar
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";

// ─── Sub-tab config ─────────────────────────────────────
const TABS = [
  { id: "timeline",     label: "⏳ जीवन-काल" },
  { id: "grah_bal",     label: "🪐 ग्रह बल" },
  { id: "wealth",       label: "💰 धन-योग" },
  { id: "relationship", label: "💑 रिश्ते" },
  { id: "risk",         label: "⚠️ जोखिम" },
  { id: "lifecycle",    label: "📈 जीवन चक्र" },
];

// ─── Strength color map ─────────────────────────────────
const STRENGTH_COLOR = {
  very_strong: C.cyan,
  strong:      C.green,
  average:     C.amber,
  weak:        "rgb(251,146,60)",   // orange
  very_weak:   C.rose,
};

const STRENGTH_BG = {
  very_strong: "rgba(34,211,238,0.1)",
  strong:      "rgba(74,222,128,0.1)",
  average:     "rgba(245,158,11,0.1)",
  weak:        "rgba(251,146,60,0.1)",
  very_weak:   "rgba(251,113,133,0.1)",
};

// ─── Helper ─────────────────────────────────────────────
function LoadingState() {
  return (
    <EmptyState
      icon="⏳"
      message="AV सूत्र गणना हो रही है..."
      subtext="Phase 2 background analysis चल रही है"
    />
  );
}

function Section({ title, children, defaultOpen = true, icon = "📌" }) {
  return (
    <CollapsibleSection icon={icon} title={title} defaultOpen={defaultOpen} color={C.amber}>
      {children}
    </CollapsibleSection>
  );
}

// ─── TAB 1: Fortune / Hardship Timeline ─────────────────
// ── Planet Hindi names for display ──────────────────────
const PLANET_HI_NAMES = {
  Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",
  Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"
};

function SutraCard({ item, currentAge, setActiveTab }) {
  const act        = item.activation || {};
  const cycles     = item.cycle_analysis || [];
  const isFortune  = item.type === "fortune";
  const typeColor  = isFortune ? "#22D3EE" : "#FB7185";
  const typeIcon   = isFortune ? "🌟" : "⚠️";
  const typeLabel  = isFortune ? "शुभ फल — भाग्योदय" : "कष्ट — संकट";
  const planetCode = item.planet;
  const planetHi   = PLANET_HI_NAMES[planetCode] || item.planet_name?.split(" ")[0] || planetCode;

  // ── Default selected = current age row, else next_active_year, else first ──
  const defaultCycle =
    cycles.find(c => c.is_current_age) ||
    cycles.find(c => c.age === act.next_active_year) ||
    cycles[0] || {};

  const [selected, setSelected] = useState(defaultCycle);

  // Accuracy badge (based on selected cycle)
  const getAccuracy = (cy) => {
    if (!cy || cy.status === "unknown")
      return { text: "अनिश्चित", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
    if (cy.is_match && act.ad_match)
      return { text: "100% सटीक", color: "#22D3EE", bg: "rgba(34,211,238,0.15)" };
    if (cy.is_match)
      return isFortune
        ? { text: "100% सटीक", color: "#4ADE80", bg: "rgba(74,222,128,0.15)" }
        : { text: "80-90% सटीक", color: "#4ADE80", bg: "rgba(74,222,128,0.15)" };
    return { text: "अनिश्चित", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
  };
  const acc = getAccuracy(selected);

  // ── Selected cycle ki dasha ──────────────────────────────────────────────
  const selDasha    = selected.dasha_name_hi || selected.dasha_lord || "?";
  const selIsMatch  = selected.is_match || false;
  const selAge      = selected.age;
  const isFuture    = selAge > currentAge;
  const isPast      = selAge < currentAge;

  return (
    <div style={{
      border: `1.5px solid ${typeColor}35`,
      borderRadius: "14px", overflow: "hidden", marginBottom: "14px",
    }}>

      {/* ── Card Header ── */}
      <div style={{
        background: isFortune ? "rgba(34,211,238,0.1)" : "rgba(251,113,133,0.1)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${typeColor}25`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>{typeIcon}</span>
          <div>
            <div style={{ ...HI, fontWeight: 800, fontSize: "0.95rem", color: typeColor }}>
              {item.planet_name}
            </div>
            <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", marginTop: "1px" }}>
              {typeLabel} · भाव {item.house}
            </div>
          </div>
        </div>
        <div style={{
          background: acc.bg, border: `1.5px solid ${acc.color}60`,
          borderRadius: "20px", padding: "5px 14px",
          color: acc.color, fontSize: "0.75rem", fontWeight: 800, ...HI,
        }}>
          {acc.text}
        </div>
      </div>

      {/* ── Table Body ── */}
      <div style={{ background: "rgba(0,0,0,0.25)" }}>

        {/* ── Cycle Analysis Table (Clickable rows) ── */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)",
            fontWeight: 600, marginBottom: "8px" }}>
            📐 27-वर्ष चक्र — <span style={{ color: typeColor }}>किसी भी उम्र पर क्लिक करें 👇</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 100px",
            gap: "4px", fontSize: "0.68rem" }}>
            {/* Header */}
            <div style={{ color: "rgba(255,255,255,0.3)", ...HI, fontWeight: 700 }}>आयु</div>
            <div style={{ color: "rgba(255,255,255,0.3)", ...HI, fontWeight: 700 }}>उस समय महादशा</div>
            <div style={{ color: "rgba(255,255,255,0.3)", ...HI, fontWeight: 700 }}>चाहिए</div>
            <div style={{ color: "rgba(255,255,255,0.3)", ...HI, fontWeight: 700, textAlign: "right" }}>स्थिति</div>

            {/* Data rows */}
            {cycles.map((cy, i) => {
              const isSelected = selected.age === cy.age;
              return (
                <div key={`row-${i}`} style={{
                  display: "contents", cursor: "pointer",
                }} onClick={() => setSelected(cy)}>
                  <div style={{
                    ...HI, fontWeight: isSelected ? 900 : (cy.is_current_age ? 700 : 400),
                    color: isSelected ? "#fff" : cy.is_current_age ? typeColor : "rgba(255,255,255,0.6)",
                    padding: "6px 4px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: isSelected ? `${typeColor}18` : "transparent",
                    borderRadius: isSelected ? "6px 0 0 6px" : "0",
                    cursor: "pointer",
                  }}>
                    {cy.age} वर्ष{cy.is_current_age ? " ◀" : ""}
                    {isSelected && <span style={{ fontSize: "0.6rem", marginLeft: "4px", opacity: 0.7 }}>✦</span>}
                  </div>
                  <div style={{
                    padding: "6px 6px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: isSelected ? `${typeColor}18` : "transparent",
                    cursor: "pointer",
                  }}>
                    <span style={{
                      ...HI, fontSize: "0.7rem", fontWeight: 700,
                      color: cy.is_match ? "#4ADE80" : (cy.dasha_name_hi === "?" ? "#64748B" : "#94A3B8"),
                      background: cy.is_match ? "rgba(74,222,128,0.15)" : "rgba(148,163,184,0.1)",
                      padding: "2px 8px", borderRadius: "6px",
                      border: cy.is_match ? "1px solid rgba(74,222,128,0.35)" : "none",
                    }}>
                      {cy.dasha_name_hi || "?"}
                    </span>
                  </div>
                  <div style={{
                    padding: "6px 6px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: isSelected ? `${typeColor}18` : "transparent",
                    cursor: "pointer",
                  }}>
                    <span style={{
                      ...HI, fontSize: "0.7rem", fontWeight: 700,
                      color: typeColor, background: `${typeColor}12`,
                      padding: "2px 8px", borderRadius: "6px",
                      border: `1px solid ${typeColor}30`,
                    }}>
                      {cy.required_hi}
                    </span>
                  </div>
                  <div style={{
                    textAlign: "right", padding: "6px 0",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    background: isSelected ? `${typeColor}18` : "transparent",
                    borderRadius: isSelected ? "0 6px 6px 0" : "0",
                    cursor: "pointer",
                  }}>
                    <span style={{
                      ...HI, fontSize: "0.68rem", fontWeight: 700,
                      color: cy.status_color,
                      background: cy.is_match ? "rgba(74,222,128,0.12)"
                        : cy.status === "ad_match" ? "rgba(252,211,77,0.12)"
                        : cy.status === "pd_match" ? "rgba(251,146,60,0.12)"
                        : "transparent",
                      padding: (cy.is_match || cy.status === "ad_match" || cy.status === "pd_match") ? "2px 6px" : "0",
                      borderRadius: "6px",
                    }}>
                      {cy.is_match ? "✅ MD!" : cy.status === "ad_match" ? "🔶 AD" : cy.status === "pd_match" ? "🟠 PD" : "⏳ नहीं"}
                    </span>
                  </div>
                </div>
              );
            })}

            {cycles.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.3)", gridColumn: "1/-1", ...HI }}>
                {(act.cycle_years || []).map((yr, i) => (
                  <span key={i} style={{
                    marginRight: "8px", fontSize: "0.72rem",
                    fontWeight: yr === currentAge ? 900 : 400,
                    color: yr === currentAge ? typeColor : "rgba(255,255,255,0.4)",
                  }}>{yr}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Dynamic Prediction Box (selected age ke liye) ── */}
        <div style={{
          margin: "0", padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: selIsMatch
            ? "rgba(74,222,128,0.04)"
            : "rgba(255,255,255,0.02)",
        }}>
          {/* Title */}
          <div style={{ ...HI, fontSize: "0.72rem", fontWeight: 700,
            color: typeColor, marginBottom: "10px" }}>
            🔮 भविष्यवाणी:{" "}
            <span style={{ color: "#FCD34D" }}>{selAge} वर्ष</span> की आयु के लिए
            {isFuture && <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}> (भविष्य)</span>}
            {isPast  && <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}> (भूतकाल)</span>}
            {!isFuture && !isPast && <span style={{ color: C.amber, fontWeight: 400 }}> ← अभी</span>}
          </div>

          {/* ── दशा त्रिस्तरीय विश्लेषण ── */}
          <div style={{
            background: "rgba(0,0,0,0.2)", borderRadius: "10px",
            padding: "10px 12px", marginBottom: "10px",
          }}>
            <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.4)",
              marginBottom: "8px", fontWeight: 600 }}>
              🪐 दशा त्रिस्तरीय विश्लेषण
            </div>

            {[
              {
                label: "महादशा (MD)", weight: "★★★",
                val:   selected.dasha_name_hi || "?",
                match: selected.is_match,
                known: selected.dasha_lord !== "?",
                window: "",
                days: 0,
              },
              {
                label: "अन्तर्दशा (AD)", weight: "★★",
                val:   selected.ad_hi || "?",
                match: selected.ad_match,
                known: selected.ad_known,
                window: selected.best_ad_window || "",
                days: selected.total_ad_days || 0,
              },
              {
                label: "प्रत्यन्तर (PD)", weight: "★",
                val:   selected.pd_hi || "?",
                match: selected.pd_match,
                known: selected.pd_known,
                window: selected.best_pd_window || "",
                days: selected.total_pd_days || 0,
              },
            ].map(({ label, val, match, known, weight, window, days }) => (
              <div key={label} style={{ marginBottom: "8px" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", ...HI, minWidth: "110px" }}>
                      {label}:
                    </span>
                    <span style={{
                      ...HI, fontSize: "0.72rem", fontWeight: 700,
                      color: !known ? "#475569" : match ? "#4ADE80" : "#94A3B8",
                      background: !known ? "rgba(71,85,105,0.15)"
                        : match ? "rgba(74,222,128,0.15)" : "rgba(148,163,184,0.1)",
                      padding: "2px 8px", borderRadius: "6px",
                      border: match ? "1px solid rgba(74,222,128,0.35)" : "none",
                    }}>
                      {val === "?" && !known ? "—" : val}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>{weight}</span>
                    <span style={{
                      ...HI, fontSize: "0.65rem", fontWeight: 700,
                      color: !known ? "#475569" : match ? "#4ADE80" : "#64748B",
                      minWidth: "60px", textAlign: "right",
                    }}>
                      {!known ? "—" : match ? `✅ ${planetHi}!` : "⏳ नहीं"}
                    </span>
                  </div>
                </div>
                {/* Window badge — year scan से मिला */}
                {match && window && (
                  <div style={{
                    marginTop: "4px", marginLeft: "116px",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <span style={{
                      fontSize: "0.6rem", ...HI, fontWeight: 700,
                      color: "#FCD34D", background: "rgba(252,211,77,0.12)",
                      padding: "2px 8px", borderRadius: "4px",
                      border: "1px solid rgba(252,211,77,0.3)",
                    }}>
                      🗓️ {window}
                    </span>
                    {days > 0 && (
                      <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.3)" }}>
                        ({days} दिन)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Required */}
            <div style={{
              marginTop: "6px", paddingTop: "6px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: "6px", alignItems: "center",
            }}>
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", ...HI, minWidth: "110px" }}>
                🔑 चाहिए:
              </span>
              <span style={{
                ...HI, fontSize: "0.72rem", fontWeight: 800,
                color: typeColor, background: `${typeColor}18`,
                padding: "2px 8px", borderRadius: "6px",
                border: `1px solid ${typeColor}35`,
              }}>
                {planetHi} की दशा
              </span>
            </div>
          </div>

          {/* ── House Alignment Meter ── */}
          {(() => {
            const aln = selected.alignment;
            if (!aln) return null;
            const scorePercent = Math.min(100, (aln.score / 5) * 100);
            return (
              <div style={{
                background: "rgba(0,0,0,0.2)", borderRadius: "10px",
                padding: "10px 12px", marginBottom: "10px",
                border: `1px solid ${aln.color}25`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    🏠 भाव एलाइनमेंट — भाव {item.house}
                  </div>
                  <span style={{
                    ...HI, fontSize: "0.68rem", fontWeight: 800,
                    color: aln.color, background: `${aln.color}18`,
                    padding: "2px 8px", borderRadius: "6px",
                    border: `1px solid ${aln.color}35`,
                  }}>
                    {aln.label}
                  </span>
                </div>

                {/* Score bar */}
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)" }}>
                      एलाइनमेंट स्कोर
                    </span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: aln.color }}>
                      {aln.score}/5
                    </span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "3px",
                    background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "3px",
                      width: `${scorePercent}%`,
                      background: aln.level === "perfect"
                        ? "linear-gradient(90deg,#22D3EE,#4ADE80)"
                        : aln.level === "strong" ? "#4ADE80"
                        : aln.level === "partial" ? "#FCD34D"
                        : "#64748B",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>

                {/* Alignment details */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                  {[
                    ["MD", aln.md_aligned],
                    ["AD", aln.ad_aligned],
                    ["PD", aln.pd_aligned],
                    ["MD भाव में", aln.md_in_house],
                    ["AD भाव में", aln.ad_in_house],
                  ].map(([lbl, val]) => (
                    <span key={lbl} style={{
                      fontSize: "0.6rem", ...HI,
                      color: val ? "#4ADE80" : "rgba(255,255,255,0.2)",
                      background: val ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                      padding: "2px 6px", borderRadius: "4px",
                      border: val ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                      {val ? "✓" : "✗"} {lbl}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", ...HI, fontStyle: "italic" }}>
                  {aln.desc}
                </div>
              </div>
            );
          })()}

          {/* ── Gochar Confirmation (Transit Check) ── */}
          {(() => {
            const tr = selected.transit || {};
            const hasData = tr.checked;
            const isMatch = tr.is_present;

            return (
              <div
                onClick={() => setActiveTab && setActiveTab("gochar")}
                style={{
                  display: "grid", gridTemplateColumns: "130px 1fr 110px",
                  alignItems: "center", cursor: "pointer",
                  transition: "background 0.2s",
                  padding: "10px 0",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(34,211,238,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                  🌍 गोचर शर्त
                  <div style={{ fontSize: "0.58rem", color: "#22D3EE", marginTop: "2px" }}>
                    LIVE देखें →
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {hasData ? (
                    <>
                      {/* Actual swisseph result */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", ...HI, minWidth: "90px" }}>
                          📅 {tr.date_str} को:
                        </span>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700,
                          color: isMatch ? "#4ADE80" : "#FCD34D",
                          background: isMatch ? "rgba(74,222,128,0.15)" : "rgba(252,211,77,0.1)",
                          padding: "2px 8px", borderRadius: "6px",
                          border: isMatch ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(252,211,77,0.2)",
                          ...HI,
                        }}>
                          {planetHi} — {tr.transit_rashi_hi}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", ...HI, minWidth: "90px" }}>
                          📍 चाहिए:
                        </span>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700,
                          color: typeColor, background: `${typeColor}15`,
                          padding: "2px 8px", borderRadius: "6px",
                          border: `1px solid ${typeColor}30`, ...HI,
                        }}>
                          {tr.target_rashi_hi} (भाव {item.house})
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Fallback — swisseph unavailable */
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", ...HI, minWidth: "90px" }}>
                        📍 ट्रिगर:
                      </span>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700,
                        color: "rgba(255,255,255,0.7)",
                        background: "rgba(255,255,255,0.06)",
                        padding: "2px 10px", borderRadius: "6px", ...HI,
                      }}>
                        जब {planetHi} भाव {item.house} में आए
                      </span>
                    </div>
                  )}
                  {isMatch && (
                    <div style={{ fontSize: "0.65rem", color: "#4ADE80", ...HI }}>
                      🎯 दशा + गोचर दोनों — 100% फल निश्चित!
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  {hasData ? (
                    isMatch ? (
                      <span style={{ ...HI, fontSize: "0.7rem", fontWeight: 800,
                        color: "#4ADE80", background: "rgba(74,222,128,0.15)",
                        padding: "3px 8px", borderRadius: "8px",
                        border: "1px solid rgba(74,222,128,0.3)" }}>
                        ✅ पुष्टि!
                      </span>
                    ) : (
                      <span style={{ ...HI, fontSize: "0.68rem", fontWeight: 600,
                        color: "#FCD34D", background: "rgba(252,211,77,0.1)",
                        padding: "3px 8px", borderRadius: "8px" }}>
                        📍 दूर है
                      </span>
                    )
                  ) : (
                    <span style={{ ...HI, fontSize: "0.68rem", fontWeight: 600,
                      color: "rgba(255,255,255,0.3)",
                      padding: "3px 8px" }}>
                      {isFuture ? "⏳" : isPast ? "📜" : "🔴"}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Conclusion */}
          <div style={{
            marginTop: "10px", paddingTop: "8px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            fontSize: "0.7rem", fontStyle: "italic",
            color: selIsMatch ? "#4ADE80"
              : (selected.ad_match || selected.pd_match) ? "#FCD34D"
              : "rgba(255,255,255,0.35)", ...HI,
          }}>
            {(() => {
              const aln = selected.alignment;
              const alnLevel = aln?.level;
              const pdWin = selected.best_pd_window;
              const adWin = selected.best_ad_window;

              if (selIsMatch && alnLevel === "perfect")
                return `🎯 ${selAge} वर्ष में MD + AD + भाव एलाइनमेंट — 100% फल निश्चित!`;
              if (selIsMatch && alnLevel === "strong")
                return `✅ ${selAge} वर्ष में महादशा अनुकूल + एलाइनमेंट मजबूत — 90% संभावना।`;
              if (selIsMatch)
                return `✅ ${selAge} वर्ष में ${planetHi} महादशा — फल 80% निश्चित।`;
              if (selected.ad_match && adWin)
                return `🔶 ${selAge} वर्ष में ${adWin} के दौरान अन्तर्दशा सक्रिय — 60-70% संभावना।`;
              if (selected.pd_match && pdWin)
                return `🟠 ${selAge} वर्ष में ${pdWin} के दौरान प्रत्यन्तर सक्रिय — 40-50% संभावना।`;
              if (selDasha === "?")
                return `❓ ${selAge} वर्ष की दशा अज्ञात है।`;
              return `⏳ ${selAge} वर्ष में ${selDasha} की दशा — ${planetHi} की नहीं, फल अनिश्चित।`;
            })()}
          </div>
        </div>

        {/* Row: Formula + extras */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 16px",
        }}>
          <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(255,255,255,0.25)" }}>
            {item.formula}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {act.moon_trigger && (
              <span style={{ fontSize: "0.65rem", ...HI, color: "#94A3B8",
                background: "rgba(148,163,184,0.1)", padding: "2px 6px", borderRadius: "6px" }}>
                🌙 चंद्र ट्रिगर
              </span>
            )}
            {act.mahamuhurta && (
              <span style={{ fontSize: "0.65rem", ...HI, color: "#FCD34D",
                background: "rgba(252,211,77,0.1)", padding: "2px 6px", borderRadius: "6px" }}>
                🌟 महामुहूर्त
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


function TimelineTab({ data, setActiveTab }) {
  if (!data) return <LoadingState />;
  const {
    timeline = [], summary = {}, active_alerts = [],
    mahamuhurta_active = false, current_age = 0,
  } = data;

  return (
    <div className="space-y-4">

      {/* Mahamuhurta Banner */}
      {mahamuhurta_active && (
        <div style={{
          background: "linear-gradient(135deg,rgba(252,211,77,0.15),rgba(34,211,238,0.1))",
          border: "1.5px solid rgba(252,211,77,0.5)",
          borderRadius: "14px", padding: "12px 16px",
        }}>
          <div style={{ ...HI, fontWeight: 700, fontSize: "0.95rem", color: "#FCD34D" }}>
            🌟 आज 7/7 महामुहूर्त — सभी ग्रह शुभ कक्षा में!
          </div>
          <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
            जिन सूत्रों में दशा भी मिल रही है, उनका फल आज 100% होगा।
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {active_alerts.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: "10px",
          background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)" }}>
          <div style={{ ...HI, fontWeight: 700, color: "#22D3EE", fontSize: "0.82rem" }}>
            ⚡ {active_alerts.length} सूत्र अभी सक्रिय हैं
          </div>
        </div>
      )}

      {/* Summary Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {summary.earliest_fortune  && <StatusPill label={`🌟 पहला सुख: ${summary.earliest_fortune} वर्ष`} color="cyan" size="sm" />}
        {summary.earliest_hardship && <StatusPill label={`⚠️ पहला कष्ट: ${summary.earliest_hardship} वर्ष`} color="rose" size="sm" />}
        {current_age > 0           && <StatusPill label={`📅 अभी: ${current_age} वर्ष`} color="amber" size="sm" />}
      </div>

      {/* Algorithm Note */}
      <div style={{ padding: "8px 12px", borderRadius: "8px",
        background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, marginBottom: "3px", fontWeight: 600 }}>
          📐 सूत्र: SAV जोड़ × 7 ÷ 27 = शेषफल = वह आयु (हर 27 साल में दोहराता है)
        </div>
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
          ✅ दशा मिले = 80-100% सटीक | गोचर = timing indicator (कब फल मिलेगा) | बिना दशा = अनिश्चित
        </div>
      </div>

      {/* Sutra Cards */}
      <div>
        {timeline.map((item, idx) => (
          <SutraCard key={idx} item={item} currentAge={current_age} setActiveTab={setActiveTab} />
        ))}
        {timeline.length === 0 && <EmptyState icon="📊" message="टाइमलाइन डेटा उपलब्ध नहीं" />}
      </div>
    </div>
  );
}
// ─── TAB 2: Grah Bal ────────────────────────────────────
function GrahBalTab({ data }) {
  if (!data || data.length === 0) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
        BAV (भिन्नाष्टकवर्ग) + SAV (सर्वाष्टकवर्ग) मिलाकर अंतिम ग्रह बल निकाला गया है
      </div>

      {data.map((planet, idx) => {
        const col = STRENGTH_COLOR[planet.final_strength] || C.amber;
        const bg  = STRENGTH_BG[planet.final_strength]   || "rgba(245,158,11,0.1)";

        return (
          <GlassCard key={idx} className="p-4" style={{ borderLeft: `3px solid ${col}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: col }}>
                  {planet.planet_name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                  भाव {planet.house}
                </span>
              </div>
              <StatusPill label={planet.strength_label} color={
                planet.final_strength.includes("strong") ? "green" :
                planet.final_strength === "average" ? "amber" : "rose"
              } size="sm" />
            </div>

            {/* BAV + SAV bars */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", width: "80px" }}>
                  BAV: {planet.bav_points}/8
                </span>
                <div className="flex-1">
                  <StrengthBar value={(planet.bav_points / 8) * 100} color={col} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", width: "80px" }}>
                  SAV: {planet.sav_points}
                </span>
                <div className="flex-1">
                  <StrengthBar value={(planet.sav_points / 40) * 100} color={C.amber} />
                </div>
              </div>
            </div>

            {/* Dasha impact */}
            <div style={{ marginTop: "8px", fontSize: "0.75rem",
              color: planet.final_strength.includes("strong") ? C.cyan : 
                     planet.final_strength === "average" ? C.amber : C.rose }}>
              दशा में: {planet.dasha_impact}
            </div>

            {/* Override note if any */}
            {planet.override_note && (
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: C.amber,
                background: "rgba(245,158,11,0.08)", padding: "4px 8px", borderRadius: "4px" }}>
                🔄 {planet.override_note}
              </div>
            )}

            {planet.rahu_ketu_note && (
              <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>
                ℹ️ {planet.rahu_ketu_note}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

// ─── TAB 3: Wealth Matrix ───────────────────────────────
function WealthTab({ data, propertyYoga }) {
  if (!data || !data.rule_164) return <LoadingState />;

  const rules = [
    data.rule_164,
    data.rule_ceo,
    data.rule_savings,
    data.rule_income,
    data.rule_biz,
    data.rule_rajyoga,
    data.rule_desires,
    data.rule_76,
    data.luck_vs_effort,
    data.rule_rakshak,
    data.rule_bank_balance,
    data.rule_shatru_vijay,
    data.rule_employment,
  ];

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <GlassCard className="p-4 text-center">
        <div style={{ fontSize: "2rem", marginBottom: "4px" }}>
          {data.wealth_level?.includes("Elite") ? "💎" :
           data.wealth_level?.includes("Wealthy") ? "💰" :
           data.wealth_level?.includes("Average") ? "⚖️" : "📉"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem", color: C.amber }}>
          {data.wealth_level}
        </div>
        <ProgressBar value={data.overall_wealth_score} max={100}
          color={data.overall_wealth_score >= 70 ? C.cyan : C.amber} height="6px" />
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
          समृद्धि स्कोर: {data.overall_wealth_score}/100
        </div>
      </GlassCard>

      {/* Individual rules */}
      {rules.map((rule, idx) => {
        if (!rule) return null;
        const passed = rule.passed !== undefined ? rule.passed : null;
        const color  = passed === true ? C.cyan : passed === false ? C.rose : C.amber;

        return (
          <GlassCard key={idx} className="p-3" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-start justify-between gap-2">
              <div style={{ ...HI, fontWeight: 600, fontSize: "0.85rem", color }}>
                {rule.label}
              </div>
              {passed !== null && (
                <span style={{ fontSize: "1rem" }}>
                  {passed ? "✅" : "❌"}
                </span>
              )}
            </div>
            <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
              {rule.result}
            </div>

            {/* Show sub-scores if available */}
            {rule.house_scores && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(rule.house_scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: "0.7rem", color: v >= 30 ? C.cyan : C.amber,
                    background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}

      {/* Property Yoga — Dream House, Career Boom, Life Fluctuation */}
      {propertyYoga?.computed && (
        <CollapsibleSection icon="🏠" title="संपत्ति और करियर योग" defaultOpen={true} color={C.amber}>
          {/* Dream Home */}
          <GlassCard className="p-3 mb-2" style={{
            borderLeft: `3px solid ${propertyYoga.dream_home?.has_yoga ? C.cyan : C.amber}` }}>
            <div style={{ ...HI, fontWeight: 600, fontSize: "0.85rem",
              color: propertyYoga.dream_home?.color || C.amber }}>
              {propertyYoga.dream_home?.label}
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
              {propertyYoga.dream_home?.desc}
            </div>
          </GlassCard>

          {/* Career Boom */}
          <GlassCard className="p-3 mb-2" style={{
            borderLeft: `3px solid ${propertyYoga.career_boom?.color || C.amber}` }}>
            <div style={{ ...HI, fontWeight: 600, fontSize: "0.85rem",
              color: propertyYoga.career_boom?.color || C.amber }}>
              {propertyYoga.career_boom?.label}
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
              {propertyYoga.career_boom?.desc}
            </div>
          </GlassCard>

          {/* Life Fluctuation */}
          <GlassCard className="p-3" style={{
            borderLeft: `3px solid ${propertyYoga.life_fluctuation?.color || C.amber}` }}>
            <div style={{ ...HI, fontWeight: 600, fontSize: "0.85rem",
              color: propertyYoga.life_fluctuation?.color || C.amber }}>
              {propertyYoga.life_fluctuation?.label}
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
              {propertyYoga.life_fluctuation?.desc}
            </div>
          </GlassCard>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ─── TAB 4: Relationship ────────────────────────────────
function RelationshipTab({ data }) {
  if (!data || !data.marriage) return <LoadingState />;

  const { dominance, marriage, moon_compatibility, mind_heart } = data;

  return (
    <div className="space-y-4">
      {/* Marriage health */}
      <GlassCard className="p-4" style={{
        borderLeft: `3px solid ${marriage.divorce_risk ? C.rose : marriage.danger_zone ? "rgb(251,146,60)" : C.cyan}`
      }}>
        <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
          💍 विवाह स्वास्थ्य
        </div>
        <div className="flex items-center gap-3">
          <RiskRing
            value={Math.round((marriage["7th_sav"] / 40) * 100)}
            size={64}
            color={marriage.divorce_risk ? C.rose : marriage.danger_zone ? "rgb(251,146,60)" : C.cyan}
          />
          <div>
            <div style={{ ...HI, fontWeight: 600, fontSize: "0.9rem" }}>
              {marriage.label}
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>
              सप्तम भाव SAV: {marriage["7th_sav"]} बिंदु
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Dominance */}
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
          {dominance.label}
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: dominance.lagna_points > dominance["7th_points"] ? C.cyan : "rgba(255,255,255,0.4)" }}>
              {dominance.lagna_points}
            </div>
            <div style={{ ...HI, fontSize: "0.75rem" }}>आप (लग्न)</div>
          </div>
          <div className="text-center self-center" style={{ fontSize: "1.2rem" }}>VS</div>
          <div className="text-center">
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: dominance["7th_points"] > dominance.lagna_points ? C.cyan : "rgba(255,255,255,0.4)" }}>
              {dominance["7th_points"]}
            </div>
            <div style={{ ...HI, fontSize: "0.75rem" }}>जीवनसाथी (7वां)</div>
          </div>
        </div>
        <div style={{ ...HI, textAlign: "center", fontSize: "0.85rem", color: C.amber, marginTop: "8px" }}>
          {dominance.dominant}
        </div>
      </GlassCard>

      {/* Moon compatibility */}
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
          🌙 मानसिक तालमेल (चंद्र अष्टकवर्ग)
        </div>
        <ProgressBar
          value={moon_compatibility.moon_bav_total}
          max={56}
          color={moon_compatibility.level === "excellent" ? C.cyan : moon_compatibility.level === "good" ? C.green : C.rose}
        />
        <div style={{ ...HI, fontSize: "0.85rem", marginTop: "8px" }}>
          {moon_compatibility.label}
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
          {moon_compatibility.note} | चंद्र BAV कुल: {moon_compatibility.moon_bav_total}
        </div>
      </GlassCard>

      {/* Mind vs Heart */}
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
          {mind_heart.label}
        </div>
        <div className="flex justify-around mb-2">
          <div className="text-center">
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: mind_heart.lagna > mind_heart["4th"] ? C.cyan : "rgba(255,255,255,0.4)" }}>
              🧠 {mind_heart.lagna}
            </div>
            <div style={{ ...HI, fontSize: "0.75rem" }}>दिमाग (लग्न)</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: mind_heart["4th"] > mind_heart.lagna ? C.rose : "rgba(255,255,255,0.4)" }}>
              ❤️ {mind_heart["4th"]}
            </div>
            <div style={{ ...HI, fontSize: "0.75rem" }}>दिल (4थां)</div>
          </div>
        </div>
        <div style={{ ...HI, textAlign: "center", fontSize: "0.9rem", color: C.cyan }}>
          {mind_heart.type}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── TAB 5: Life Risk Index ─────────────────────────────
function RiskTab({ data }) {
  if (!data) return <LoadingState />;

  const { black_holes = [], immunity, struggle, ghatak_vs_poshak, risk_score, risk_label } = data;

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <GlassCard className="p-4 text-center">
        <RiskRing
          value={risk_score}
          size={100}
          color={risk_score >= 60 ? C.rose : risk_score >= 35 ? "rgb(251,146,60)" : C.cyan}
        />
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, marginTop: "8px" }}>
          {risk_label}
        </div>
      </GlassCard>

      {/* Black Holes */}
      {black_holes.length > 0 && (
        <Section title="🕳️ ब्लैक होल भाव (Black Holes)" icon="⛔">
          {black_holes.map((bh, idx) => (
            <GlassCard key={idx} className="p-3 mb-2"
              style={{ borderLeft: `3px solid ${C.rose}`, background: "rgba(251,113,133,0.06)" }}>
              <div className="flex items-center gap-2 mb-1">
                <StatusPill label={`भाव ${bh.house} — ${bh.points} बिंदु`} color="rose" size="sm" />
                <StatusPill label={bh.severity === "extreme" ? "अत्यंत खतरनाक" : "खतरनाक"} color="rose" size="xs" />
              </div>
              <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                {bh.warning}
              </div>
            </GlassCard>
          ))}
        </Section>
      )}

      {/* Immunity */}
      {immunity && (
        <GlassCard className="p-4"
          style={{ borderLeft: `3px solid ${immunity.strong ? C.cyan : C.rose}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.amber }}>{immunity.label}</div>
          <div className="flex gap-4 my-2">
            {[["लग्न", immunity.lagna], ["6वां", immunity["6th"]], ["8वां", immunity["8th"]]].map(([name, val]) => (
              <div key={name} className="text-center">
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: C.amber }}>{val}</div>
                <div style={{ ...HI, fontSize: "0.72rem" }}>{name}</div>
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.85rem", color: immunity.strong ? C.cyan : C.rose }}>
            {immunity.result}
          </div>
        </GlassCard>
      )}

      {/* Ghatak vs Poshak */}
      {ghatak_vs_poshak && (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
            {ghatak_vs_poshak.label}
          </div>
          <div className="flex justify-around mb-3">
            {[
              ["घातक", ghatak_vs_poshak.ghatak, C.rose],
              ["पोषक", ghatak_vs_poshak.poshak, C.cyan],
              ["सेवक", ghatak_vs_poshak.sewak, C.amber],
              ["बंधु", ghatak_vs_poshak.bandhu, C.green],
            ].map(([name, val, col]) => (
              <div key={name} className="text-center">
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: col }}>{val}</div>
                <div style={{ ...HI, fontSize: "0.72rem" }}>{name}</div>
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.85rem", color: ghatak_vs_poshak.life_happy ? C.cyan : C.rose }}>
            {ghatak_vs_poshak.result}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── TAB 6: Life Cycle ──────────────────────────────────
function LifecycleTab({ data }) {
  if (!data || !data.house_data) return <LoadingState />;

  const { golden_ages, critical_ages, best_phase, house_data,
          phase1_score, phase2_score, phase3_score } = data;

  const maxPhase = Math.max(phase1_score, phase2_score, phase3_score);

  return (
    <div className="space-y-4">
      {/* Life phases bar chart */}
      <Section title="🌟 जीवन के तीन खंड" icon="📊">
        {[
          ["बचपन/युवावस्था\n(1-30 वर्ष)", phase1_score, C.cyan],
          ["मध्य आयु\n(30-60 वर्ष)", phase2_score, C.amber],
          ["बुढ़ापा\n(60+ वर्ष)", phase3_score, C.green],
        ].map(([label, score, color]) => (
          <div key={label} className="mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ ...HI, fontSize: "0.8rem" }}>{label}</span>
              <span style={{ fontWeight: 700, color }}>{score}</span>
            </div>
            <ProgressBar value={score} max={maxPhase + 10} color={color} />
          </div>
        ))}
        <div style={{ ...HI, fontSize: "0.85rem", color: C.cyan, marginTop: "8px" }}>
          🏆 सर्वश्रेष्ठ काल: {best_phase}
        </div>
      </Section>

      {/* Golden years */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${C.cyan}` }}>
        <div style={{ ...HI, fontWeight: 700, color: C.cyan, marginBottom: "8px" }}>
          🌟 सुनहरे वर्ष (Golden Years)
        </div>
        <div className="flex flex-wrap gap-2">
          {golden_ages.map((age) => (
            <span key={age} style={{ background: "rgba(34,211,238,0.15)", color: C.cyan,
              padding: "4px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "0.9rem" }}>
              {age} वर्ष
            </span>
          ))}
        </div>
      </GlassCard>

      {/* Critical years */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${C.rose}` }}>
        <div style={{ ...HI, fontWeight: 700, color: C.rose, marginBottom: "8px" }}>
          ⚠️ सावधानी के वर्ष
        </div>
        <div className="flex flex-wrap gap-2">
          {critical_ages.map((age) => (
            <span key={age} style={{ background: "rgba(251,113,133,0.15)", color: C.rose,
              padding: "4px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "0.9rem" }}>
              {age} वर्ष
            </span>
          ))}
        </div>
      </GlassCard>

      {/* House-by-house bars */}
      <Section title="12 भावों का बल चार्ट" icon="🏠" defaultOpen={false}>
        <div className="space-y-2">
          {house_data.map((h) => (
            <div key={h.house} className="flex items-center gap-2">
              <span style={{ width: "28px", fontSize: "0.75rem",
                color: h.is_golden ? C.cyan : h.is_critical ? C.rose : "rgba(255,255,255,0.5)",
                fontWeight: h.is_golden || h.is_critical ? 700 : 400 }}>
                {h.house}
              </span>
              <div className="flex-1">
                <StrengthBar
                  value={(h.sav_points / 45) * 100}
                  color={h.is_golden ? C.cyan : h.is_critical ? C.rose : C.amber}
                />
              </div>
              <span style={{ width: "24px", textAlign: "right", fontSize: "0.75rem",
                color: h.is_golden ? C.cyan : h.is_critical ? C.rose : "rgba(255,255,255,0.5)" }}>
                {h.sav_points}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}


// ─── MAIN COMPONENT ─────────────────────────────────────
export default function AVSutrasPanel({ data, chartData, setActiveTab: parentSetActiveTab }) {
  const [activeTab, setActiveTab] = useState("timeline");

  // data comes from chartData.enginesData.av_sutras
  if (!data || !data.computed) {
    return (
      <EmptyState
        icon="🔢"
        message="AV सूत्र डेटा लोड हो रहा है..."
        subtext="यह Phase 2 engine में चलता है — कुछ समय लगेगा"
      />
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "timeline":     return <TimelineTab     data={data.fortune_hardship} setActiveTab={parentSetActiveTab} />;
      case "grah_bal":     return <GrahBalTab       data={data.grah_bal} />;
      case "wealth":       return <WealthTab        data={data.wealth_matrix} propertyYoga={data.property_yoga} />;
      case "relationship": return <RelationshipTab  data={data.relationship} />;
      case "risk":         return <RiskTab          data={data.risk_index} />;
      case "lifecycle":    return <LifecycleTab     data={data.life_cycle} />;
      default:             return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ ...HI, fontWeight: 700, fontSize: "1.2rem", color: C.amber }}>
          🔢 अष्टकवर्ग सूत्र विश्लेषण
        </h2>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
          Vedic AV sutras — fortune/hardship years, planet strength, wealth matrix & more
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: activeTab === tab.id ? 700 : 400,
              background: activeTab === tab.id ? C.amber : "rgba(255,255,255,0.06)",
              color: activeTab === tab.id ? "#000" : "rgba(255,255,255,0.7)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              ...HI,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {renderTab()}
    </div>
  );
}