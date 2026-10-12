/**
 * DailyGocharTab.jsx
 * ====================
 * Batch 1 — Daily Prediction via Kaksha Bal
 *
 * Ye tab GocharPanel.jsx ke andar "📅 दैनिक गोचर" tab mein jaata hai.
 *
 * Data source: chartData.enginesData.daily_prediction
 *
 * Usage in GocharPanel.jsx:
 *   import DailyGocharTab from './DailyGocharTab';
 *   // GocharPanel ke TABS array mein add karo:
 *   { id: "daily", label: "📅 दैनिक गोचर" }
 *   // Renderer mein:
 *   {activeInnerTab === "daily" && (
 *     <DailyGocharTab data={chartData?.enginesData?.daily_prediction} />
 *   )}
 *
 * Refactoring Applied (v1.1):
 *   [Fix ①] LEVEL_COLOR + LEVEL_PILL_COLOR maps removed.
 *           Now uses avColor(score) from designTokens for score-based colors,
 *           and a single inline qCol(level) helper for level-based colors.
 *           KakshaReference custom button/state component removed (48 lines).
 *   [Fix ⑤] Replaced with CollapsibleSection (8 lines) — same visual, zero state boilerplate.
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, GlassCard, ProgressBar,
  RiskRing, SectionLabel, CollapsibleSection
} from "../shared/ui";
import { HI, C, avColor } from "../shared/designTokens";


// ─── Constants ──────────────────────────────────────────

// [Fix ①] LEVEL_COLOR aur LEVEL_PILL_COLOR HATA DIYE.
// Ab ek single helper function use hogi — DRY + maintainable.
// level → hex color (verdict banner, score meter, header score, etc.)
const qCol = (level) =>
  ["mahamuhurta", "very_good"].includes(level) ? C.cyan :
  ["good", "above_avg"].includes(level)         ? C.green :
  ["bad", "very_bad"].includes(level)            ? C.rose :
  level === "caution"                            ? C.orange :
  C.amber; // neutral / fallback

// level → StatusPill color string
const qPill = (level) =>
  ["mahamuhurta", "very_good"].includes(level) ? "cyan" :
  ["good", "above_avg"].includes(level)         ? "green" :
  ["bad", "very_bad"].includes(level)            ? "rose" :
  "amber";

const KAKSHA_LORDS = [
  { lord: "Sa", name: "शनि",   range: "0°–3°45'" },
  { lord: "Ju", name: "गुरु",  range: "3°45'–7°30'" },
  { lord: "Ma", name: "मंगल", range: "7°30'–11°15'" },
  { lord: "Su", name: "सूर्य", range: "11°15'–15°" },
  { lord: "Ve", name: "शुक्र", range: "15°–18°45'" },
  { lord: "Me", name: "बुध",   range: "18°45'–22°30'" },
  { lord: "Mo", name: "चंद्र", range: "22°30'–26°15'" },
  { lord: "La", name: "लग्न",  range: "26°15'–30°" },
];


// ─── Score Meter Component ───────────────────────────────
function ScoreMeter({ title, score, max, percent, label, level, description, icon }) {
  // [Fix ①] avColor(score) for bar color, qCol(level) for border/text
  const color = qCol(level);

  return (
    <GlassCard className="p-4" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
            {title}
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.6rem", fontWeight: 700, color }}>
              {score}
            </span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              /{max}
            </span>
            <StatusPill label={label} color={qPill(level)} size="sm" />
          </div>
        </div>
        <span style={{ fontSize: "1.6rem" }}>{icon}</span>
      </div>

      {/* Progress bar — avColor on the fill */}
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px",
        height: "6px", marginBottom: "8px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "4px",
          width: `${Math.max(2, percent)}%`,
          background: avColor(score),   // [Fix ①] avColor replaces LEVEL_COLOR lookup
          transition: "width 0.8s ease",
        }} />
      </div>

      <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
        {description}
      </div>
    </GlassCard>
  );
}


// ─── Planet Kaksha Card ──────────────────────────────────
function PlanetKakshaCard({ planet }) {
  const color = planet.is_shubh ? C.cyan : C.rose;
  const bg    = planet.is_shubh ? "rgba(34,211,238,0.08)" : "rgba(251,113,133,0.08)";

  return (
    <div style={{
      background: bg,
      border: `0.5px solid ${planet.is_shubh ? "rgba(34,211,238,0.25)" : "rgba(251,113,133,0.25)"}`,
      borderRadius: "10px",
      padding: "10px 12px",
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color, ...HI }}>
            {planet.planet_name}
          </span>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>
            {planet.rashi_name} {planet.degree}°
          </span>
        </div>
        <span style={{ fontSize: "1rem" }}>
          {planet.is_shubh ? "✅" : "❌"}
        </span>
      </div>

      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", marginBottom: "4px" }}>
        कक्षा: <span style={{ color: C.amber }}>
          {planet.kaksha_lord_name} ({planet.kaksha?.start_deg}°–{planet.kaksha?.end_deg}°)
        </span>
      </div>

      <div style={{ ...HI, fontSize: "0.73rem", color: planet.is_shubh ? C.cyan : C.rose }}>
        {planet.effect}
      </div>

      {planet.duration && (
        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
          इस कक्षा में अवधि: {planet.duration}
        </div>
      )}
    </div>
  );
}


// ─── Verdict Banner ──────────────────────────────────────
function VerdictBanner({ verdict, kaksha_score }) {
  // [Fix ①] verdict.color already comes from backend — no local map needed
  const color   = verdict.color || C.amber;
  const isGreat = ["mahamuhurta", "very_good", "good"].includes(verdict.level);

  return (
    <div style={{
      background: isGreat ? "rgba(34,211,238,0.08)" : "rgba(251,113,133,0.06)",
      border: `1px solid ${color}30`,
      borderRadius: "14px",
      padding: "16px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {kaksha_score?.is_mahamuhurta && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}

      <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
        {verdict.level === "mahamuhurta" ? "🌟" : isGreat ? "✨" : "⚠️"}
      </div>
      <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem", color, marginBottom: "6px" }}>
        {verdict.label}
      </div>
      <div style={{ ...HI, fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
        {verdict.advice}
      </div>

      {kaksha_score?.mahamuhurta_msg && (
        <div style={{ ...HI, fontSize: "0.8rem", color: C.cyan, marginTop: "8px",
          padding: "6px", background: "rgba(34,211,238,0.1)", borderRadius: "8px" }}>
          {kaksha_score.mahamuhurta_msg}
        </div>
      )}
    </div>
  );
}


// ─── 3 Scores Overview ──────────────────────────────────
function ThreeMeters({ chandra, sav, kaksha }) {
  return (
    <div className="space-y-3">
      <ScoreMeter
        title="चंद्र अष्टकवर्ग स्कोर"
        score={chandra.score} max={42}
        percent={chandra.percent} label={chandra.label}
        level={chandra.level} description={chandra.description}
        icon="🌙"
      />
      <ScoreMeter
        title="सर्वाष्टकवर्ग (SAV) स्कोर"
        score={sav.score} max={294}
        percent={sav.percent} label={sav.label}
        level={sav.level} description={sav.description}
        icon="🪐"
      />
      <ScoreMeter
        title="कक्षा बल स्कोर"
        score={kaksha.score} max={7}
        percent={kaksha.percent} label={kaksha.label}
        level={kaksha.level} description={kaksha.description}
        icon="🎯"
      />
    </div>
  );
}


// ─── Moon Timing Insight ─────────────────────────────────
function MoonTimingCard({ moon_status, moon_tip }) {
  if (!moon_status) return null;
  const color = moon_status.is_shubh ? C.cyan : C.rose;

  return (
    <GlassCard className="p-4" style={{
      borderLeft: `3px solid ${color}`,
      background: moon_status.is_shubh ? "rgba(34,211,238,0.06)" : "rgba(251,113,133,0.06)",
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: "1.2rem" }}>🌙</span>
        <span style={{ ...HI, fontWeight: 700, color }}>
          चंद्रमा — {moon_status.rashi_name} {moon_status.degree}°
        </span>
      </div>
      <div style={{ ...HI, fontSize: "0.82rem", color }}>
        {moon_status.effect}
      </div>
      <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "8px",
        padding: "6px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }}>
        {moon_tip}
      </div>
    </GlassCard>
  );
}


// ─── Main Component ──────────────────────────────────────
export default function DailyGocharTab({ data }) {
  const [view, setView] = useState("overview"); // overview | planets | guide

  if (!data) {
    return (
      <EmptyState
        icon="📅"
        message="दैनिक गोचर डेटा उपलब्ध नहीं"
        subtext="यह Phase 2 में compute होता है"
      />
    );
  }

  if (!data.computed) {
    return (
      <EmptyState
        icon="⚙️"
        message={data.error || "गणना में त्रुटि"}
        subtext="कृपया पुनः प्रयास करें"
      />
    );
  }

  const { chandra_score, sav_score, kaksha_score, verdict,
          shubh_planets, ashubh_planets, moon_status, moon_tip,
          key_rule, date } = data;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, margin: 0 }}>
            📅 दैनिक गोचर विश्लेषण
          </h3>
          {date && (
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
              {date}
            </div>
          )}
        </div>
        {/* Quick score pill — [Fix ①] qCol(level) replaces LEVEL_COLOR[level] */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: qCol(kaksha_score?.level) }}>
            {kaksha_score?.score}/7
          </div>
          <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>कक्षा स्कोर</div>
        </div>
      </div>

      {/* Verdict Banner */}
      <VerdictBanner verdict={verdict} kaksha_score={kaksha_score} />

      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "📊 स्कोर" },
          { id: "planets",  label: "🪐 ग्रह" },
          { id: "guide",    label: "📐 सूत्र" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: "5px 12px", borderRadius: "20px",
              fontSize: "0.75rem", cursor: "pointer", border: "none",
              background: view === tab.id ? C.amber : "rgba(255,255,255,0.07)",
              color: view === tab.id ? "#000" : "rgba(255,255,255,0.7)",
              fontWeight: view === tab.id ? 700 : 400,
              ...HI,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW: Overview */}
      {view === "overview" && (
        <div className="space-y-4">
          <ThreeMeters chandra={chandra_score} sav={sav_score} kaksha={kaksha_score} />

          <MoonTimingCard moon_status={moon_status} moon_tip={moon_tip} />

          {(shubh_planets?.length > 0 || ashubh_planets?.length > 0) && (
            <GlassCard className="p-4">
              {shubh_planets?.length > 0 && (
                <div className="mb-3">
                  <div style={{ ...HI, fontSize: "0.75rem", color: C.cyan, marginBottom: "6px" }}>
                    ✅ शुभ कक्षा में:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {shubh_planets.map(p => (
                      <span key={p} style={{
                        background: "rgba(34,211,238,0.15)", color: C.cyan,
                        padding: "3px 10px", borderRadius: "20px",
                        fontSize: "0.8rem", ...HI,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {ashubh_planets?.length > 0 && (
                <div>
                  <div style={{ ...HI, fontSize: "0.75rem", color: C.rose, marginBottom: "6px" }}>
                    ❌ अशुभ कक्षा में:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ashubh_planets.map(p => (
                      <span key={p} style={{
                        background: "rgba(251,113,133,0.15)", color: C.rose,
                        padding: "3px 10px", borderRadius: "20px",
                        fontSize: "0.8rem", ...HI,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* VIEW: Planet Details */}
      {view === "planets" && (
        <div className="space-y-3">
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
            प्रत्येक ग्रह की वर्तमान कक्षा और उसका फल:
          </div>
          {kaksha_score?.planet_details?.map((planet, i) => (
            <PlanetKakshaCard key={i} planet={planet} />
          ))}

          <CollapsibleSection
            icon="🌙"
            title="चंद्र AV विवरण (प्रत्येक ग्रह)"
            defaultOpen={false}
            color={C.amber}
          >
            <div className="space-y-2">
              {chandra_score?.planet_details?.map((p, i) => (
                <div key={i} className="flex items-center justify-between"
                  style={{ padding: "6px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ ...HI, fontSize: "0.82rem" }}>
                    {p.planet_name} ({p.rashi})
                  </span>
                  <span style={{
                    fontWeight: 700, fontSize: "0.9rem",
                    color: p.moon_bav >= 5 ? C.cyan : p.moon_bav >= 4 ? C.amber : C.rose,
                  }}>
                    {p.moon_bav}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: "0.75rem", color: C.amber, textAlign: "right" }}>
                कुल: {chandra_score?.score}/42
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* VIEW: Sutra Guide */}
      {view === "guide" && (
        <div className="space-y-4">
          <GlassCard className="p-4"
            style={{ borderLeft: `3px solid ${C.amber}`, background: "rgba(245,158,11,0.06)" }}>
            <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.85rem" }}>
              📜 मुख्य सूत्र
            </div>
            <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
              {key_rule}
            </div>
          </GlassCard>

          <CollapsibleSection icon="📊" title="स्कोर स्केल (Interpretation)" defaultOpen={true} color={C.amber}>
            <div className="space-y-3">
              <div>
                <div style={{ ...HI, fontWeight: 600, color: C.amber, fontSize: "0.82rem", marginBottom: "6px" }}>
                  कक्षा स्कोर (0–7):
                </div>
                {[
                  [7,     "महामुहूर्त 🌟", C.cyan],
                  ["5-6", "अत्यंत शुभ ✅", C.cyan],
                  [4,     "शुभ ✅",         C.green],
                  [3,     "सामान्य ⚖️",    C.amber],
                  [2,     "सावधान ⚠️",    C.orange],
                  [1,     "अशुभ ❌",       C.rose],
                  [0,     "अत्यंत अशुभ ❌❌", C.rose],
                ].map(([score, label, color]) => (
                  <div key={score} className="flex items-center gap-2 mb-1">
                    <span style={{ fontWeight: 700, color, minWidth: "24px", fontSize: "0.85rem" }}>
                      {score}
                    </span>
                    <span style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                <div style={{ ...HI, fontWeight: 600, color: C.amber, fontSize: "0.82rem", marginBottom: "6px" }}>
                  चंद्र AV स्कोर (14–42):
                </div>
                {[
                  ["36-42", "बहुत शुभ",   C.cyan],
                  ["31-35", "शुभ",         C.green],
                  ["28-30", "सामान्य",     C.amber],
                  ["21-27", "अशुभ",        C.orange],
                  ["14-20", "बहुत अशुभ",   C.rose],
                ].map(([range, label, color]) => (
                  <div key={range} className="flex items-center gap-2 mb-1">
                    <span style={{ color, minWidth: "48px", fontSize: "0.78rem", fontFamily: "monospace" }}>
                      {range}
                    </span>
                    <span style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>
                      → {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* [Fix ⑤] KakshaReference custom component (48 lines + useState) HATA DIYA.
              Ab seedha CollapsibleSection use ho raha hai — same visual, zero boilerplate. */}
          <CollapsibleSection icon="📐" title="कक्षा क्रम देखें" defaultOpen={false} color={C.amber}>
            {KAKSHA_LORDS.map((k, i) => (
              <div key={k.lord} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: i < KAKSHA_LORDS.length - 1 ? "0.5px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <span style={{ fontWeight: 700, color: C.amber, ...HI, fontSize: "0.85rem" }}>
                  {i + 1}. {k.name}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                  {k.range}
                </span>
              </div>
            ))}
            <div style={{ ...HI, paddingTop: "8px", fontSize: "0.72rem",
              color: "rgba(255,255,255,0.4)", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
              क्रम: शनि → गुरु → मंगल → सूर्य → शुक्र → बुध → चंद्र → लग्न
            </div>
          </CollapsibleSection>

          <GlassCard className="p-4">
            <div style={{ ...HI, fontWeight: 600, color: C.cyan, marginBottom: "8px", fontSize: "0.85rem" }}>
              💡 कैसे इस्तेमाल करें?
            </div>
            {[
              "जब कक्षा स्कोर 5-7 हो, तभी Meeting, Deal या नई शुरुआत करें।",
              "चंद्रमा हर ~6-7 घंटे में कक्षा बदलता है — इसीलिए दिन के कुछ घंटे अच्छे और कुछ बुरे होते हैं।",
              "शनि/गुरु जैसे धीमे ग्रह एक कक्षा में महीनों रहते हैं — उनका असर लंबे समय तक रहता है।",
              "तीनों स्कोर (चंद्र AV + SAV + कक्षा) एक साथ अच्छे हों तो परिणाम 100% शुभ।",
            ].map((tip, i) => (
              <div key={i} style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)",
                marginBottom: "6px", paddingLeft: "10px", borderLeft: `2px solid ${C.amber}30` }}>
                {tip}
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  );
}