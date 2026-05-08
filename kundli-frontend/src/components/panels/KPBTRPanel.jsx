/**
 * KPBTRPanel.jsx
 * ══════════════════════════════════════════════════════
 * KP System — Birth Time Rectification Panel
 * 2 Methods: CIL (Cuspal Interlinks) + D24 Matrukaraka
 *
 * Data: chartData.enginesData.kp_btr
 * ══════════════════════════════════════════════════════
 */

import { useState } from "react";
import {
  EmptyState, GlassCard, CollapsibleSection,
  SectionLabel, StrengthBar, StatusPill, ProgressBar
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";
import useKundliStore from "../../store/useKundliStore";
import KPSignificators from "./KPSignificators";

// ── Planet Hindi names ────────────────────────────────
const PH = {
  Su:"सूर्य", Mo:"चंद्र", Ma:"मंगल", Me:"बुध",
  Ju:"गुरु",  Ve:"शुक्र", Sa:"शनि",  Ra:"राहु", Ke:"केतु"
};

// ── Color helpers ─────────────────────────────────────
const passColor  = C.cyan;
const failColor  = C.rose;
const warnColor  = C.amber;
const infoColor  = "#a78bfa"; // purple

const scoreColor = (s) =>
  s >= 80 ? C.cyan : s >= 60 ? C.green : s >= 40 ? C.amber : C.rose;

// ── Lord chip ─────────────────────────────────────────
function LordChip({ label, planet, color }) {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column",
      alignItems: "center", gap: "2px",
      padding: "6px 10px", borderRadius: "10px",
      background: `${color}15`,
      border: `1.5px solid ${color}40`,
      minWidth: "52px",
    }}>
      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", ...HI }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", fontWeight: 700, color, ...HI }}>
        {PH[planet] || planet}
      </span>
    </div>
  );
}

// ── Pass/Fail badge ───────────────────────────────────
function VerdictBadge({ pass, label }) {
  const col = pass ? passColor : failColor;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "5px 12px", borderRadius: "20px",
      background: `${col}15`,
      border: `1.5px solid ${col}50`,
    }}>
      <span style={{ fontSize: "0.9rem" }}>{pass ? "✅" : "❌"}</span>
      <span style={{ ...HI, fontSize: "0.78rem", fontWeight: 600, color: col }}>
        {label}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CIL SECTION
// ══════════════════════════════════════════════════════
function CILSection({ cil }) {
  if (!cil?.computed) return null;

  const pass  = cil.cil_connected;
  const color = pass ? passColor : failColor;

  return (
    <CollapsibleSection
      icon="🔗"
      title="CIL — कस्पल इंटरलिंक"
      color={pass ? passColor : warnColor}
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">

        {/* Verdict */}
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${color}` }}>
          <div style={{ ...HI, fontSize: "0.85rem", fontWeight: 700, color }}>
            {cil.verdict}
          </div>
          {cil.connection_detail && (
            <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
              {cil.connection_detail}
            </div>
          )}
          <div style={{
            display: "inline-block", marginTop: "6px",
            padding: "2px 8px", borderRadius: "6px",
            background: pass ? `${passColor}20` : `${warnColor}20`,
            fontSize: "0.72rem", color: pass ? passColor : warnColor, ...HI
          }}>
            {cil.connection_type === "direct" ? "⚡ Direct Connection" :
             cil.connection_type === "indirect" ? "🔄 Indirect Connection" : "❌ No Connection"}
          </div>
        </GlassCard>

        {/* Lagna Lords */}
        <div>
          <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
            🏠 लग्न के चार स्वामी
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <LordChip label="राशि" planet={cil.lagna_lords?.sign_lord} color={C.amber} />
            <LordChip label="नक्षत्र" planet={cil.lagna_lords?.star_lord} color={infoColor} />
            <LordChip label="उप" planet={cil.lagna_lords?.sub_lord} color={C.green} />
            <LordChip label="उप-उप (SSL)" planet={cil.lagna_lords?.ssl} color={pass ? passColor : failColor} />
          </div>
        </div>

        {/* Moon Lords */}
        <div>
          <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
            🌙 चंद्र के स्वामी
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <LordChip label="राशि" planet={cil.moon_lords?.sign_lord} color={C.amber} />
            <LordChip label="नक्षत्र (NL)" planet={cil.moon_lords?.star_lord} color={pass ? passColor : failColor} />
            <LordChip label="उप" planet={cil.moon_lords?.sub_lord} color={C.green} />
          </div>
        </div>

        {/* Connection arrow */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px", borderRadius: "10px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <span style={{ ...HI, fontSize: "0.8rem", color: infoColor, fontWeight: 600 }}>
            चंद्र NL: {PH[cil.chandra_nak_lord] || cil.chandra_nak_lord}
          </span>
          <span style={{ color: pass ? passColor : failColor, fontSize: "1rem" }}>
            {pass ? "⟺" : "✗"}
          </span>
          <span style={{ ...HI, fontSize: "0.8rem", color: pass ? passColor : failColor, fontWeight: 600 }}>
            लग्न SSL: {PH[cil.lagna_ssl] || cil.lagna_ssl}
          </span>
        </div>

      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════
// D24 SECTION
// ══════════════════════════════════════════════════════
function D24Section({ d24 }) {
  if (!d24?.computed) return null;

  const pass  = d24.d24_connected;
  const color = pass ? passColor : failColor;

  return (
    <CollapsibleSection
      icon="🪐"
      title="D24 — मातृकारक विधि"
      color={pass ? passColor : warnColor}
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">

        {/* Verdict */}
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${color}` }}>
          <div style={{ ...HI, fontSize: "0.85rem", fontWeight: 700, color }}>
            {d24.verdict}
          </div>
          {d24.connection_type && (
            <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
              {d24.connection_type}
            </div>
          )}
          {!pass && d24.direction_hint && (
            <div style={{
              marginTop: "6px", padding: "4px 10px", borderRadius: "8px",
              background: `${warnColor}20`, display: "inline-block",
              fontSize: "0.78rem", color: warnColor, ...HI
            }}>
              {d24.direction_hint}
            </div>
          )}
        </GlassCard>

        {/* Planet degrees ranked */}
        {d24.planet_degrees_ranked && (
          <div>
            <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
              📊 ग्रह डिग्री क्रम (मातृकारक = 4th)
            </div>
            <div className="space-y-1">
              {d24.planet_degrees_ranked.map((item) => (
                <div key={item.planet} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "5px 10px", borderRadius: "8px",
                  background: item.rank === 4
                    ? `${passColor}15`
                    : "rgba(255,255,255,0.03)",
                  border: item.rank === 4
                    ? `1px solid ${passColor}40`
                    : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: item.rank === 4 ? `${passColor}30` : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", color: item.rank === 4 ? passColor : "rgba(255,255,255,0.4)",
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.rank}
                  </span>
                  <span style={{
                    ...HI, fontSize: "0.82rem", flex: 1, fontWeight: item.rank === 4 ? 700 : 400,
                    color: item.rank === 4 ? passColor : "rgba(255,255,255,0.7)",
                  }}>
                    {item.planet_hindi}
                  </span>
                  <span style={{
                    fontFamily: "monospace", fontSize: "0.78rem",
                    color: item.rank === 4 ? passColor : "rgba(255,255,255,0.45)",
                  }}>
                    {item.degree}°
                  </span>
                  {item.rank === 4 && (
                    <span style={{
                      fontSize: "0.65rem", color: passColor,
                      padding: "1px 6px", borderRadius: "4px",
                      background: `${passColor}20`, ...HI
                    }}>
                      मातृकारक
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* D24 Analysis */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}>
          {[
            { label: "D24 लग्न", value: d24.d24_lagna_rashi, color: infoColor },
            { label: "5वाँ भाव", value: d24.d24_5th_house_rashi, color: infoColor },
            { label: "5वाँ स्वामी", value: PH[d24.d24_5th_lord] || d24.d24_5th_lord, color: warnColor },
            { label: "MK D24 राशि", value: d24.mk_d24_rashi, color: pass ? passColor : failColor },
          ].map(item => (
            <div key={item.label} style={{
              padding: "8px 10px", borderRadius: "8px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", ...HI }}>
                {item.label}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: item.color, ...HI, marginTop: "2px" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* MK bhav position */}
        <div style={{
          padding: "8px 12px", borderRadius: "10px",
          background: pass ? `${passColor}10` : `${failColor}10`,
          border: `1px solid ${pass ? passColor : failColor}30`,
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "1.2rem" }}>🎯</span>
          <span style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
            मातृकारक <strong style={{ color: pass ? passColor : failColor }}>
              {PH[d24.matrukaraka] || d24.matrukaraka}
            </strong> D24 के{" "}
            <strong style={{ color: pass ? passColor : failColor }}>
              {d24.mk_bhav_in_d24}वें भाव
            </strong> में है
            {pass
              ? " — 5वें भाव से संबंध ✅"
              : ` — 5वें भाव से संबंध नहीं ❌`}
          </span>
        </div>

      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════
// RECTIFICATION SECTION
// ══════════════════════════════════════════════════════
function RectificationSection({ rect, timeAdjust }) {
  if (!rect?.computed) return null;

  const hasBothPass  = rect.total_both_pass > 0;
  const windows      = rect.both_pass_windows || [];

  return (
    <CollapsibleSection
      icon="⏱️"
      title="स्वतः सुधार (Auto-Rectification)"
      color={hasBothPass ? passColor : warnColor}
      defaultOpen={true}
    >
      <div className="space-y-3 pt-1">

        {/* Time adjustment result */}
        <GlassCard className="p-4" style={{
          borderLeft: `4px solid ${hasBothPass ? passColor : warnColor}`,
          background: hasBothPass ? `${passColor}08` : `${warnColor}08`,
        }}>
          <div style={{ ...HI, fontWeight: 700, fontSize: "0.95rem",
            color: hasBothPass ? passColor : warnColor, marginBottom: "6px" }}>
            {rect.verdict}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 14px", borderRadius: "10px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <span style={{ fontSize: "1.1rem" }}>🕐</span>
            <span style={{ ...HI, fontSize: "0.9rem", fontWeight: 700,
              color: hasBothPass ? passColor : warnColor }}>
              {timeAdjust}
            </span>
          </div>
          <div style={{ marginTop: "10px" }}>
            <StrengthBar value={rect.confidence} color={hasBothPass ? passColor : warnColor} />
            <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
              विश्वसनीयता: {rect.confidence}% · खोज: {rect.search_range}
            </div>
          </div>
        </GlassCard>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            { label: "दोनों PASS", value: rect.total_both_pass, color: passColor },
            { label: "केवल CIL", value: rect.total_cil_only, color: infoColor },
            { label: "केवल D24", value: rect.total_d24_only, color: warnColor },
          ].map(item => (
            <div key={item.label} style={{
              padding: "10px 8px", borderRadius: "10px", textAlign: "center",
              background: `${item.color}12`,
              border: `1.5px solid ${item.color}35`,
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: item.color, lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Both-pass windows */}
        {windows.length > 0 && (
          <div>
            <div style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>
              ✅ सभी valid समय-खिड़कियाँ
            </div>
            <div className="space-y-2">
              {windows.map((w, i) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: "10px",
                  background: w.offset === rect.best_offset_minutes
                    ? `${passColor}18`
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${w.offset === rect.best_offset_minutes
                    ? passColor
                    : "rgba(255,255,255,0.08)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {w.offset === rect.best_offset_minutes && (
                        <span style={{
                          fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px",
                          background: `${passColor}30`, color: passColor, ...HI
                        }}>⭐ BEST</span>
                      )}
                      <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: passColor }}>
                        {w.offset === 0 ? "±0 min (base)" :
                         w.offset > 0 ? `+${w.offset} min` : `${w.offset} min`}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                        लग्न {w.lagna}°
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <span style={{
                        fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px",
                        background: `${passColor}20`, color: passColor,
                      }}>CIL ✅</span>
                      <span style={{
                        fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px",
                        background: `${passColor}20`, color: passColor,
                      }}>D24 ✅</span>
                    </div>
                  </div>
                  {w.cil && (
                    <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                      CIL: {w.cil}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
export default function KPBTRPanel() {
  const chartData = useKundliStore(s => s.chartData);
console.log("🔥 [DEBUG FRONTEND] Full chartData.enginesData:", chartData?.enginesData);
  if (!chartData) {
    return (
      <EmptyState
        icon="🔗"
        message="पहले कुंडली लोड करें"
        subtext="KP BTR के लिए जन्म कुंडली जरूरी है"
      />
    );
  }

  const kpData = chartData?.enginesData?.kp_btr;

  if (!kpData || !kpData.computed) {
    return (
      <EmptyState
        icon="⏳"
        message="KP BTR डेटा लोड हो रहा है..."
        subtext="Phase 2 engines का इंतजार करें"
      />
    );
  }

  const current   = kpData.current_check;
  const rect      = kpData.rectification;
  const score     = current?.overall_score ?? 0;
  const col       = scoreColor(score);
  const timeAdj   = kpData.time_adjustment || "—";
  const bothPass  = current?.cil?.cil_connected && current?.d24_matrukaraka?.d24_connected;

  // KP Significators data (for the new table)
  const kpSigData = chartData?.enginesData?.kp_significators;

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="mb-2">
        <h2 style={{ ...HI, fontWeight: 700, fontSize: "1.1rem", color: infoColor, margin: 0 }}>
          🔗 KP जन्म समय शुद्धि
        </h2>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
          KP System · CIL + D24 मातृकारक · Auto Rectification
        </p>
      </div>

      {/* ✅ नई टेबल: KP Significators — BTR से पहले दिखती है */}
      <KPSignificators kpData={kpSigData} />

      {/* Score Hero */}
      <GlassCard className="p-5 text-center" style={{ borderLeft: `4px solid ${col}` }}>

        {/* Overall status */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px",
          marginBottom: "12px", flexWrap: "wrap" }}>
          <VerdictBadge pass={current?.cil?.cil_connected} label="CIL" />
          <VerdictBadge pass={current?.d24_matrukaraka?.d24_connected} label="D24" />
        </div>

        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", ...HI, marginBottom: "8px" }}>
          KP BTR सटीकता
        </div>
        <div style={{ fontSize: "3rem", fontWeight: 900, color: col, lineHeight: 1 }}>
          {score}%
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.95rem", color: col, marginTop: "8px" }}>
          {kpData.final_verdict}
        </div>

        {/* Time adjustment */}
        <div style={{
          marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "20px",
          background: bothPass ? `${passColor}15` : `${warnColor}15`,
          border: `1.5px solid ${bothPass ? passColor : warnColor}40`,
        }}>
          <span>⏱️</span>
          <span style={{ ...HI, fontSize: "0.82rem", fontWeight: 600,
            color: bothPass ? passColor : warnColor }}>
            {timeAdj}
          </span>
        </div>

        <div style={{ marginTop: "12px" }}>
          <ProgressBar value={score} max={100} color={col} height="h-2" />
        </div>

        {/* Lagna info */}
        <div style={{ marginTop: "10px", fontSize: "0.72rem",
          color: "rgba(255,255,255,0.4)", ...HI }}>
          लग्न: {rect?.base_lagna}° ·
          श्रेष्ठ: {rect?.best_lagna_degree}° ({rect?.best_offset_minutes > 0
            ? `+${rect.best_offset_minutes}` : rect?.best_offset_minutes} min)
        </div>

        {/* SSL Row — Score card ke andar, hamesha visible */}
        {current?.cil?.computed && (
          <div style={{
            marginTop: "14px", paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "10px", flexWrap: "wrap",
          }}>
            {/* Label */}
            <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", width: "100%", textAlign: "center", marginBottom: "4px" }}>
              🔑 KP Sub-Sub Lord (SSL) — CIL की कुंजी
            </div>

            {/* Chandra NL chip */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", ...HI, marginBottom: "3px" }}>चंद्र NL</div>
              <div style={{
                padding: "6px 18px", borderRadius: "10px",
                background: "rgba(167,139,250,0.2)",
                border: "2px solid rgba(167,139,250,0.6)",
                fontSize: "1rem", fontWeight: 900, color: "#a78bfa", ...HI,
              }}>
                {PH[current.cil.chandra_nak_lord] || current.cil.chandra_nak_lord}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ fontSize: "1.3rem", color: current.cil.cil_connected ? passColor : failColor }}>
              {current.cil.cil_connected ? "⟺" : "✗"}
            </div>

            {/* Lagna SSL chip */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", ...HI, marginBottom: "3px" }}>लग्न SSL</div>
              <div style={{
                padding: "6px 18px", borderRadius: "10px",
                background: current.cil.cil_connected ? `${passColor}25` : `${failColor}25`,
                border: `2px solid ${current.cil.cil_connected ? passColor : failColor}`,
                fontSize: "1rem", fontWeight: 900,
                color: current.cil.cil_connected ? passColor : failColor, ...HI,
              }}>
                {PH[current.cil.lagna_ssl] || current.cil.lagna_ssl}
              </div>
            </div>

            {/* Connection badge */}
            <div style={{
              padding: "3px 10px", borderRadius: "16px",
              background: current.cil.cil_connected ? `${passColor}15` : `${failColor}15`,
              border: `1px solid ${current.cil.cil_connected ? passColor : failColor}50`,
              fontSize: "0.68rem", fontWeight: 700, ...HI,
              color: current.cil.cil_connected ? passColor : failColor,
            }}>
              {current.cil.connection_type === "direct"   ? "⚡ Direct"   :
               current.cil.connection_type === "indirect" ? "🔄 Indirect" : "❌ None"}
            </div>
          </div>
        )}
      </GlassCard>

      {/* CIL Section */}
      <CILSection cil={current?.cil} />

      {/* D24 Section */}
      <D24Section d24={current?.d24_matrukaraka} />

      {/* Auto Rectification */}
      <RectificationSection rect={rect} timeAdj={timeAdj} />

      {/* Info card */}
      <GlassCard className="p-4" style={{ background: "rgba(167,139,250,0.04)" }}>
        <SectionLabel color={infoColor}>📖 विधि का अर्थ</SectionLabel>
        {[
          ["CIL", "चंद्र नक्षत्र स्वामी ↔ लग्न SSL — सेकंड-स्तरीय सटीकता", infoColor],
          ["D24", "4th उच्च डिग्री ग्रह = मातृकारक → D24 के 5वें भाव से संबंध", passColor],
          ["Auto", "±30 मिनट में खोज — जहाँ दोनों pass हों वही सही समय", warnColor],
        ].map(([label, desc, color]) => (
          <div key={label} style={{
            display: "flex", gap: "10px", padding: "5px 0",
            borderBottom: "0.5px solid rgba(255,255,255,0.05)",
          }}>
            <span style={{
              fontFamily: "monospace", fontSize: "0.75rem",
              color, width: "40px", flexShrink: 0, fontWeight: 700,
            }}>{label}</span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>
              {desc}
            </span>
          </div>
        ))}
      </GlassCard>

    </div>
  );
}