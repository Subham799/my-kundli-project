/**
 * AdvancedYogasPanel.jsx
 * =======================
 * Batch 4 — Indu Lagna + Advanced Yogas (FINAL PANEL)
 *
 * Refactoring Applied (v1.1):
 *   [Fix ④] SutraCard{} local component REMOVED — replaced with CardBlock from shared/ui.
 *           SutraCard had: GlassCard + label + formula + desc + note + children.
 *           CardBlock has: icon + title + badge (collapsible) + children.
 *           Migration: label→badge, color→accent, desc+formula+note go inside children.
 *           2 call-sites updated: Debt Trap, (other SutraCard instances inline).
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, GlassCard, ProgressBar,
  RiskRing, CollapsibleSection, StrengthBar, CardBlock
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";
import useKundliStore from "../../store/useKundliStore";
const useAdvancedYogas = () =>
  useKundliStore(s => s.chartData?.enginesData?.advanced_yogas ?? null);

// ─── Helpers ─────────────────────────────────────────────
const qColor = (level) => ({
  elite: C.cyan, ultra_rich: C.cyan, crorepati: C.cyan,
  wealthy: C.green, strong: C.green, good: C.green,
  saver: C.cyan, normal: C.amber, average: C.amber,
  moderate: C.amber, struggle: C.orange, trapped: C.orange,
  overspend: C.rose, bad: C.rose, danger: C.rose,
  very_weak: C.orange, weak: C.amber,
  neech_bhang: C.cyan, uchha_bhang: C.orange,
  neech_double: C.rose, uchha_double: C.cyan,
  massive: C.cyan,
}[level] || C.amber);

const TABS = [
  { id: "indu",    label: "💰 इन्दु लग्न" },
  { id: "yogas",   label: "⚡ नीच-भंग" },
  { id: "dhan",    label: "💑 धन-विवाह" },
  { id: "chakra",  label: "🔯 सुदर्शन" },
  { id: "bhavat",  label: "🌀 भवत्-भवम्" },
  { id: "rashis",  label: "📅 राशि चक्र" },
  { id: "tulna",   label: "⚖️ भाव तुलना" },
  { id: "mega",    label: "📊 सारांश" },
  { id: "vivah",   label: "💍 विवाह-तलाक (सूत्र)" },
  { id: "khar",    label: "☠️ 64वाँ नवांश / खर" },
  { id: "hora",    label: "☀️ D2 होरा" },
];

// [Fix ④] SutraCard{} REMOVED.
// BEFORE: <SutraCard label={x.label} color={x.color} desc={x.desc} note={x.rule} formula={...}>
// AFTER:  <CardBlock icon="⚠️" title={x.label} accent={x.color} defaultOpen={true}>
//           <div style={...}>{formula}</div>
//           <div style={...}>{x.desc}</div>
//           <div style={...}>{x.rule}</div>
//           {children}
//         </CardBlock>

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)",
      borderRadius: "10px", padding: "8px 14px" }}>
      <div style={{ fontWeight: 700, fontSize: "1.2rem", color: color || C.amber }}>{value}</div>
      <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>{label}</div>
    </div>
  );
}


// ════════ TAB 1 — INDU LAGNA ═════════════════════════════
function InduTab({ indu_lagna, spouse_direction }) {
  if (!indu_lagna?.computed) return <EmptyState icon="💰" message="इन्दु लग्न डेटा उपलब्ध नहीं" />;
  const il = indu_lagna;
  const sd = spouse_direction;

  return (
    <div className="space-y-4">
      <div style={{
        background: il.indu_sav >= 30 ? "rgba(34,211,238,0.08)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${il.wealth_color}30`,
        borderRadius: "14px", padding: "18px", textAlign: "center",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          {["ultra_rich", "crorepati"].includes(il.wealth_level) ? "💎" :
           il.wealth_level === "wealthy" ? "💰" : "⚖️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem",
          color: il.wealth_color, marginBottom: "4px" }}>
          {il.wealth_label}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.8rem", color: il.wealth_color }}>
          इन्दु लग्न: {il.indu_lagna_name}
        </div>
        <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>
          {il.wealth_description}
        </div>
      </div>

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "10px" }}>गणना विधि</div>
        <div className="flex justify-around mb-4">
          <StatBox label={`लग्न 9वें\n${il.lagna_9th_lord_name}`} value={il.kala_lagna} color={C.cyan} />
          <div style={{ alignSelf: "center", fontSize: "1.2rem", color: "rgba(255,255,255,0.3)" }}>+</div>
          <StatBox label={`चंद्र 9वें\n${il.moon_9th_lord_name}`} value={il.kala_moon} color={C.amber} />
          <div style={{ alignSelf: "center", fontSize: "1.2rem", color: "rgba(255,255,255,0.3)" }}>=</div>
          <StatBox label="योग" value={il.total_kala} color={C.green} />
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)",
          padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", marginBottom: "8px" }}>
          {il.total_kala} ÷ 12 → शेष {il.remainder} → चंद्र से {il.remainder} आगे = {il.indu_lagna_name}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <StatBox label="इन्दु लग्न SAV" value={il.indu_sav} color={il.wealth_color} />
          <StatBox label="थ्रेशोल्ड" value="30" color="rgba(255,255,255,0.3)" />
        </div>
        <CollapsibleSection icon="📐" title="कला संदर्भ तालिका" defaultOpen={false} color={C.amber}>
          <div className="flex flex-wrap gap-2 mt-1">
            {il.kala_reference && Object.entries(il.kala_reference).map(([p, v]) => (
              <span key={p} style={{ fontSize: "0.75rem", fontFamily: "monospace",
                color: C.amber, background: "rgba(245,158,11,0.1)", padding: "3px 8px", borderRadius: "6px" }}>
                {{"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि"}[p]}={v}
              </span>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
            सूर्य=30 | चंद्र=16 | मंगल=6 | बुध=8 | गुरु=10 | शुक्र=12 | शनि=1
          </div>
        </CollapsibleSection>
      </GlassCard>

      {sd?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${C.cyan}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.cyan, marginBottom: "8px" }}>💑 जीवनसाथी की दिशा</div>
          <div style={{ fontSize: "2.5rem", textAlign: "center", marginBottom: "6px" }}>{sd.direction_emoji}</div>
          <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.cyan,
            textAlign: "center", marginBottom: "6px" }}>
            {sd.spouse_direction} दिशा
          </div>
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>{sd.desc}</div>
          <div className="flex flex-wrap gap-1 mt-3">
            {sd.direction_scores && Object.entries(sd.direction_scores)
              .sort((a, b) => b[1] - a[1])
              .map(([dir, pts]) => (
                <span key={dir} style={{
                  fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px",
                  background: dir === sd.spouse_direction ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)",
                  color: dir === sd.spouse_direction ? C.cyan : "rgba(255,255,255,0.5)",
                  fontWeight: dir === sd.spouse_direction ? 700 : 400, ...HI,
                }}>
                  {dir}: {pts}
                </span>
              ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 2 — NEECH BHANG / UCHHA BHANG ══════════════
function YogasTab({ neech_uchha, debt_trap, sudden_rise }) {
  return (
    <div className="space-y-4">
      <div style={{ ...HI, fontWeight: 600, color: C.amber, fontSize: "0.85rem" }}>
        नीच-भंग / उच्च-भंग विश्लेषण
      </div>
      {neech_uchha?.length > 0 ? (
        neech_uchha.map((p, i) => (
          <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${p.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ ...HI, fontWeight: 700, color: p.color, fontSize: "1rem" }}>
                  {p.planet_name}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  {p.rashi_name} | BAV {p.bav_points}
                </span>
              </div>
              <StatusPill label={
                p.status === "neech_bhang" ? "नीच-भंग" :
                p.status === "uchha_bhang" ? "उच्च-भंग" :
                p.status === "uchha_double" ? "दोहरा उच्च" : "दोहरा नीच"
              } color={p.status.includes("bhang") || p.status === "neech_double" ? "rose" : "cyan"}
              size="sm" />
            </div>
            <div style={{ ...HI, fontSize: "0.82rem", color: p.color, fontWeight: 600, marginBottom: "4px" }}>
              {p.label}
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.72)" }}>{p.description}</div>
          </GlassCard>
        ))
      ) : (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
            ⚖️ कोई असाधारण नीच/उच्च योग नहीं।
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📜 नियम
        </div>
        {[
          ["नीच + BAV 6/7/8",   "नीच-भंग — उच्च ग्रह जैसा अपार फल", C.cyan],
          ["नीच + BAV 0/1/2",   "दोहरी कमजोरी — भारी संघर्ष",        C.rose],
          ["उच्च + BAV 6/7/8",  "उच्च दोहरा — असाधारण शक्ति",         C.cyan],
          ["उच्च + BAV 0/1/2/3","उच्च-भंग — कोई लाभ नहीं",            C.orange],
        ].map(([cond, res, col]) => (
          <div key={cond} style={{ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: col }}>{cond}</span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>{res}</span>
          </div>
        ))}
      </GlassCard>

      {/* [Fix ④] SutraCard → CardBlock for Debt Trap */}
      {debt_trap && (
        <CardBlock
          icon={debt_trap.has_debt_trap ? "⚠️" : "✅"}
          title={debt_trap.label}
          accent={debt_trap.color}
          defaultOpen={true}
        >
          {debt_trap.desc && (
            <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>
              {debt_trap.desc}
            </div>
          )}
          {debt_trap.rule && (
            <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)",
              padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "6px",
              marginBottom: "8px" }}>
              💡 {debt_trap.rule}
            </div>
          )}
          {debt_trap.has_debt_trap && debt_trap.trapped_planets?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {debt_trap.trapped_planets.map(p => (
                <span key={p.planet} style={{
                  fontSize: "0.75rem", color: C.orange,
                  background: "rgba(251,146,60,0.12)", padding: "3px 10px",
                  borderRadius: "12px", ...HI,
                }}>
                  {p.planet_name} — {p.position} (BAV {p.bav_pts})
                </span>
              ))}
            </div>
          )}
        </CardBlock>
      )}

      {sudden_rise && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${sudden_rise.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: sudden_rise.color, marginBottom: "8px" }}>
            {sudden_rise.label}
          </div>
          <div className="flex gap-4 mb-3">
            {[["9वां (भाग्य)", sudden_rise.h9], ["10वां (कर्म)", sudden_rise.h10],
              ["11वां (लाभ)", sudden_rise.h11]].map(([t, v]) => (
              <StatBox key={t} label={t} value={v}
                color={v === sudden_rise.h11 && sudden_rise.h11 > sudden_rise.h10 ? C.cyan : C.amber} />
            ))}
          </div>
          {sudden_rise.jump >= 0 && (
            <div style={{ ...HI, fontSize: "0.78rem",
              color: sudden_rise.jump >= 10 ? C.cyan : "rgba(255,255,255,0.65)" }}>
              उछाल: 10वें → 11वें = +{sudden_rise.jump} बिंदु
            </div>
          )}
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
            {sudden_rise.description}
          </div>
          {sudden_rise.bhagya_factor && (
            <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, marginTop: "6px" }}>
              {sudden_rise.bhagya_factor}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 3 — DHAN + VIVAH ═══════════════════════════
function DhanTab({ income_trapped, danger_zones, partner_compat }) {
  return (
    <div className="space-y-4">
      {income_trapped && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${income_trapped.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: income_trapped.color, marginBottom: "10px" }}>
            {income_trapped.label}
          </div>
          <div className="flex gap-3 mb-3">
            {[["2रा (बचत)", income_trapped.h2],
              ["11वां (आय)", income_trapped.h11],
              ["12वां (व्यय)", income_trapped.h12]].map(([t, v]) => (
              <StatBox key={t} label={t} value={v}
                color={
                  t.includes("11") && income_trapped.h11 > income_trapped.h12 ? C.cyan :
                  t.includes("2")  && income_trapped.h2 >= 28 ? C.cyan :
                  t.includes("12") && income_trapped.h12 > income_trapped.h11 ? C.rose :
                  C.amber
                } />
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>
            {income_trapped.description}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
            {income_trapped.rule}
          </div>
        </GlassCard>
      )}

      {danger_zones && (
        <>
          {danger_zones.both_danger && (
            <div style={{ ...HI, fontSize: "0.82rem", color: C.rose, padding: "8px 12px",
              background: "rgba(251,113,133,0.08)", borderRadius: "8px" }}>
              {danger_zones.combined_alert}
            </div>
          )}
          {[danger_zones.fifth_house, danger_zones.seventh_house].map((h, i) => h && (
            <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${h.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <div style={{ ...HI, fontWeight: 700, color: h.color }}>{h.label}</div>
                <StatusPill
                  label={h.in_danger_zone ? "खतरा!" : h.level === "strong" ? "बलवान" : "सामान्य"}
                  color={h.in_danger_zone ? "rose" : h.level === "strong" ? "cyan" : "amber"}
                  size="sm"
                />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: h.color, marginBottom: "4px" }}>
                {h.points} <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>SAV</span>
              </div>
              {h.in_danger_zone && (
                <div style={{ ...HI, fontSize: "0.78rem", color: C.rose, marginTop: "4px" }}>
                  {h.description}
                </div>
              )}
            </GlassCard>
          ))}
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)",
            padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
            {danger_zones.rule}
          </div>
        </>
      )}

      {partner_compat?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${partner_compat.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
            🌙 साथी का मानसिक तालमेल
          </div>
          <div style={{ ...HI, fontWeight: 700, fontSize: "1rem",
            color: partner_compat.color, marginBottom: "6px" }}>
            {partner_compat.label}
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
            {partner_compat.description}
          </div>
          <div className="space-y-1 mt-3">
            {partner_compat.scale?.map(s => (
              <div key={s.range} style={{ display: "flex", gap: "12px", fontSize: "0.72rem" }}>
                <span style={{ fontFamily: "monospace", color: C.amber, width: "48px" }}>{s.range}</span>
                <span style={{ ...HI, color: "rgba(255,255,255,0.55)" }}>→ {s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>
            {partner_compat.rule}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 4 — SUDARSHAN CHAKRA ═══════════════════════
function ChakraTab({ sudarshan_avg }) {
  if (!sudarshan_avg?.computed) return <EmptyState icon="🔯" message="सुदर्शन चक्र डेटा उपलब्ध नहीं" />;
  const sa = sudarshan_avg;
  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center" style={{ borderLeft: `3px solid ${sa.ceo_color}` }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
          {sa.ceo_avg >= 33 ? "👑" : sa.ceo_avg >= 28 ? "💼" : "⚖️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.1rem", color: sa.ceo_color, marginBottom: "4px" }}>
          {sa.ceo_label}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.8rem", color: sa.ceo_color }}>{sa.ceo_avg}</div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
          10वें+11वें का औसत (थ्रेशोल्ड: 30+)
        </div>
      </GlassCard>

      {!sa.has_all_three && (
        <div style={{ ...HI, fontSize: "0.78rem", color: C.orange, padding: "8px 12px",
          background: "rgba(251,146,60,0.08)", borderRadius: "8px" }}>
          ⚠️ {sa.note}
        </div>
      )}

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "10px" }}>12 भावों का औसत बल</div>
        <div className="space-y-2">
          {sa.house_data?.map(h => (
            <div key={h.house} className="flex items-center gap-2">
              <span style={{ width: "28px", fontSize: "0.75rem", textAlign: "right",
                color: h.strong ? C.cyan : h.weak ? C.rose : "rgba(255,255,255,0.5)",
                fontWeight: h.strong || h.weak ? 700 : 400 }}>
                {h.house}
              </span>
              <div style={{ flex: 1 }}>
                <StrengthBar value={(h.avg / 45) * 100}
                  color={h.strong ? C.cyan : h.weak ? C.rose : C.amber} />
              </div>
              <span style={{ width: "32px", textAlign: "right", fontSize: "0.75rem", fontWeight: 600,
                color: h.strong ? C.cyan : h.weak ? C.rose : "rgba(255,255,255,0.5)" }}>
                {h.avg}
              </span>
              {h.house === sa.best_house && <span style={{ fontSize: "0.6rem", color: C.cyan }}>★</span>}
              {h.house === sa.worst_house && <span style={{ fontSize: "0.6rem", color: C.rose }}>▼</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px",
          fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
          <span>★ सर्वश्रेष्ठ: भाव {sa.best_house}</span>
          <span>▼ कमजोर: भाव {sa.worst_house}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontSize: "0.8rem", color: C.amber, marginBottom: "6px", fontWeight: 600 }}>
          {sa.rule}
        </div>
        {[
          ["≥33",   "CEO / IAS / मंत्री स्तर",     C.cyan],
          ["28-32", "उच्च पद / सफल व्यापारी",      C.green],
          ["22-27", "मध्यम स्तर",                   C.amber],
          ["<22",   "संघर्ष का स्तर",               C.rose],
        ].map(([r, l, c]) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between",
            padding: "4px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: c }}>{r}</span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{l}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 5 — BHAVAT BHAVAM ══════════════════════════
function BhavatTab({ bhavat_bhavam }) {
  if (!bhavat_bhavam?.length) return <EmptyState icon="🌀" message="भवत्-भवम् डेटा उपलब्ध नहीं" />;
  const struggling  = bhavat_bhavam.filter(b => b.struggle);
  const flourishing = bhavat_bhavam.filter(b => !b.struggle && b.house_pts >= 28);

  return (
    <div className="space-y-4">
      <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
        किसी भाव से 8वाँ भाव = उस भाव का संघर्ष-दर्पण।
        यदि 8वें भाव के बिंदु उस भाव से अधिक → संघर्ष।
      </div>
      {struggling.length > 0 && (
        <div>
          <div style={{ ...HI, fontWeight: 600, color: C.rose, fontSize: "0.82rem", marginBottom: "8px" }}>
            ⚠️ संघर्ष वाले क्षेत्र ({struggling.length})
          </div>
          <div className="space-y-2">
            {struggling.map(b => (
              <GlassCard key={b.house} className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ ...HI, fontWeight: 600, color: C.rose, fontSize: "0.85rem" }}>
                    {b.topic}
                  </span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      {b.house_pts} vs {b.eighth_pts}
                    </span>
                    <StatusPill label="संघर्ष" color="rose" size="xs" />
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                  {b.house}वें SAV={b.house_pts} &lt; {b.eighth_house}वें SAV={b.eighth_pts}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      {flourishing.length > 0 && (
        <div>
          <div style={{ ...HI, fontWeight: 600, color: C.cyan, fontSize: "0.82rem", marginBottom: "8px" }}>
            ✅ बलवान क्षेत्र ({flourishing.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {flourishing.map(b => (
              <span key={b.house} style={{ fontSize: "0.75rem", color: C.cyan,
                background: "rgba(34,211,238,0.1)", padding: "4px 10px",
                borderRadius: "12px", ...HI }}>
                {b.topic}
              </span>
            ))}
          </div>
        </div>
      )}
      <CollapsibleSection icon="📋" title="सभी 12 भाव" defaultOpen={false} color={C.amber}>
        <div className="space-y-1">
          {bhavat_bhavam.map(b => (
            <div key={b.house} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "6px 8px", borderRadius: "6px",
              background: b.struggle ? "rgba(251,113,133,0.06)" : "rgba(255,255,255,0.02)" }}>
              <span style={{ ...HI, fontSize: "0.78rem",
                color: b.struggle ? C.rose : "rgba(255,255,255,0.65)" }}>
                {b.house}. {b.topic}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.72rem",
                color: b.struggle ? C.rose : "rgba(255,255,255,0.4)" }}>
                {b.house_pts}→{b.eighth_pts}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}


// ════════ TAB 6 — LIFE CYCLE BY RASHIS ═══════════════════
function RashiCycleTab({ life_cycle_rashis }) {
  if (!life_cycle_rashis?.computed) return <EmptyState icon="📅" message="राशि चक्र डेटा उपलब्ध नहीं" />;
  const lc = life_cycle_rashis;
  const maxScore = Math.max(...lc.scores);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center" style={{ borderLeft: `3px solid ${C.cyan}` }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🏆</div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.cyan }}>
          {lc.best_phase?.name}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
          {lc.desc}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "12px" }}>तीन काल की शक्ति</div>
        {lc.phases?.map((phase, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-1">
              <div>
                <span style={{ ...HI, fontWeight: phase.is_best ? 700 : 400,
                  color: phase.is_best ? C.cyan : "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}>
                  {phase.name}
                </span>
                {phase.is_best && <StatusPill label="सर्वश्रेष्ठ" color="cyan" size="xs" />}
              </div>
              <span style={{ fontWeight: 700, color: phase.is_best ? C.cyan : C.amber }}>{phase.score}</span>
            </div>
            <ProgressBar value={phase.score} max={maxScore + 10}
              color={phase.is_best ? C.cyan : i === 1 ? C.amber : C.green} delay={i * 0.15} />
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>
              {phase.rashis} | {phase.rashi_names?.join(", ")}
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📐 विधि (राशि-वार विभाजन)
        </div>
        {[
          ["0-30 वर्ष",  "मीन → मिथुन (12,1,2,3 राशि)"],
          ["30-60 वर्ष", "कर्क → तुला (4,5,6,7 राशि)"],
          ["60+ वर्ष",   "वृश्चिक → कुंभ (8,9,10,11 राशि)"],
        ].map(([age, rashis]) => (
          <div key={age} style={{ display: "flex", gap: "12px", padding: "5px 0",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: C.amber, width: "72px" }}>
              {age}
            </span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{rashis}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 7 — HOUSE COMPARISONS ═════════════════════════
function TulnaTab({ house_comparisons }) {
  if (!house_comparisons?.computed)
    return <EmptyState icon="⚖️" message="भाव तुलना डेटा उपलब्ध नहीं" />;

  const hc = house_comparisons;
  const rules = [
    {
      icon: "🌟", title: "सपनों की पूर्ति",
      subtitle: `3रा भाव (${hc.h3}) vs 11वां भाव (${hc.h11})`,
      ...hc.sapne_purti,
    },
    {
      icon: "🧠", title: "दिमाग vs दिल",
      subtitle: `लग्न (${hc.h1}) vs 4था भाव (${hc.h4})`,
      ...hc.dimag_dil,
    },
    {
      icon: "💍", title: "वैवाहिक जीवन में दबदबा",
      subtitle: `लग्न (${hc.h1}) vs 7वां भाव (${hc.h7})`,
      ...hc.vivah_dominance,
    },
    {
      icon: "🍀", title: "खुद की मेहनत या भाग्य?",
      subtitle: `9वां भाव (${hc.h9}) vs 10वां भाव (${hc.h10})`,
      ...hc.bhagya_mehnat,
    },
  ];

  return (
    <div className="space-y-3">
      <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
        भावों की आपसी तुलना से व्यक्तित्व और जीवन के पहलू समझें
      </div>
      {rules.map((r, i) => (
        <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${r.color}` }}>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{r.icon}</span>
            <div className="flex-1">
              <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: r.color, marginBottom: "2px" }}>
                {r.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
                {r.subtitle}
              </div>

              {/* Visual bar comparison */}
              <div className="flex items-center gap-2 mb-3">
                {r.h3 !== undefined ? (
                  <>
                    <div style={{ flex: r.h3, height: "6px", borderRadius: "3px",
                      background: "#818CF8", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#818CF8", flexShrink: 0 }}>{r.h3}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h11}</span>
                    <div style={{ flex: r.h11, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                ) : r.h1 !== undefined && r.h4 !== undefined ? (
                  <>
                    <div style={{ flex: r.h1, height: "6px", borderRadius: "3px",
                      background: "#22D3EE", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#22D3EE", flexShrink: 0 }}>{r.h1}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h4 ?? r.h7 ?? r.h10}</span>
                    <div style={{ flex: r.h4 ?? r.h7 ?? r.h10, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                ) : (
                  <>
                    <div style={{ flex: r.h9, height: "6px", borderRadius: "3px",
                      background: "#4ADE80", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#4ADE80", flexShrink: 0 }}>{r.h9}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h10}</span>
                    <div style={{ flex: r.h10, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                )}
              </div>

              <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem", color: r.color, marginBottom: "4px" }}>
                {r.label}
              </div>
              <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                {r.desc}
              </div>
              <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
                padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                💡 {r.rule}
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}


// ════════ TAB 8 — MEGA RULES (164, 76, Black Hole, Saatvik) ══
function MegaTab({ mega_rules }) {
  if (!mega_rules?.computed)
    return <EmptyState icon="📊" message="सारांश डेटा उपलब्ध नहीं" />;

  const mr = mega_rules;

  return (
    <div className="space-y-3">

      {/* 164 Rule */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.prosperity.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>{mr.prosperity.is_prosperous ? "🌟" : "⚠️"}</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.prosperity.color }}>
              164 बिंदु — समृद्धि नियम
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              भाव 1+2+4+9+10+11
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: "1.6rem", color: mr.prosperity.color }}>
              {mr.prosperity.sum}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>/ 164</div>
          </div>
        </div>
        <StrengthBar value={Math.min(100, (mr.prosperity.sum / 250) * 100)}
          color={mr.prosperity.color} delay={0.1} />
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.prosperity.color, marginTop: "10px", marginBottom: "4px" }}>
          {mr.prosperity.label}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(mr.prosperity.house_vals).map(([h, v]) => (
            <span key={h} style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px",
              background: v >= 28 ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
              color: v >= 28 ? "#22D3EE" : "rgba(255,255,255,0.5)", ...HI }}>
              {h}वां: {v}
            </span>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.prosperity.rule}
        </div>
      </GlassCard>

      {/* 76 Rule */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.debtfree.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>{mr.debtfree.is_debtfree ? "✅" : "💸"}</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.debtfree.color }}>
              76 बिंदु — कर्ज-मुक्ति नियम
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              भाव 6+8+12
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: "1.6rem", color: mr.debtfree.color }}>
              {mr.debtfree.sum}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>/ 76</div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem", color: mr.debtfree.color, marginBottom: "4px" }}>
          {mr.debtfree.label}
        </div>
        <div className="flex gap-3 mt-2">
          {Object.entries(mr.debtfree.house_vals).map(([h, v]) => (
            <div key={h} style={{ textAlign: "center", flex: 1, padding: "6px",
              background: "rgba(255,255,255,0.04)", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: mr.debtfree.color }}>{v}</div>
              <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{h}वां भाव</div>
            </div>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.debtfree.rule}
        </div>
      </GlassCard>

      {/* Black Hole */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.blackhole.color}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: "1.6rem" }}>⚫</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.blackhole.color }}>
              ब्लैक होल भाव (15 से कम बिंदु)
            </div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.blackhole.color, marginBottom: "8px" }}>
          {mr.blackhole.label}
        </div>
        {mr.blackhole.has_blackhole ? (
          <div className="space-y-2">
            {mr.blackhole.black_holes.map((bh, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: "8px",
                background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)" }}>
                <div style={{ ...HI, fontSize: "0.82rem", color: "#FB7185", fontWeight: 600 }}>
                  {bh.warning}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
            सभी भावों में 15+ बिंदु — कोई खतरनाक क्षेत्र नहीं।
          </div>
        )}
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.blackhole.rule}
        </div>
      </GlassCard>

      {/* Saatvik vs Dikhawa */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.saatvik.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>
            {mr.saatvik.type === "saatvik" ? "🙏" : mr.saatvik.type === "dikhawa" ? "✨" : "⚖️"}
          </span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.saatvik.color }}>
              सात्विक vs दिखावा
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              आंतरिक (1,4,5,7,9,10) vs बाहरी (2,3,6,8,11,12)
            </div>
          </div>
        </div>
        <div className="flex gap-3 mb-3">
          <div style={{ flex: 1, textAlign: "center", padding: "8px",
            background: "rgba(74,222,128,0.08)", borderRadius: "8px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#4ADE80" }}>
              {mr.saatvik.internal_sum}
            </div>
            <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>आंतरिक</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px",
            background: "rgba(192,132,252,0.08)", borderRadius: "8px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#C084FC" }}>
              {mr.saatvik.external_sum}
            </div>
            <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>बाहरी</div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.saatvik.color, marginBottom: "4px" }}>
          {mr.saatvik.label}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
          {mr.saatvik.desc}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.saatvik.rule}
        </div>
      </GlassCard>

    </div>
  );
}


// ════════ TAB — KHAR / 64TH NAVAMSHA ════════════════════════
function Khar64NavamsaTab({ khar_64th_navamsa }) {
  const data = khar_64th_navamsa;

  if (!data?.computed) {
    return <EmptyState icon="☠️" message="64वें नवांश / खर का डेटा उपलब्ध नहीं" />;
  }

  const dualPlanets = Array.isArray(data.dual_sign_planets) ? data.dual_sign_planets : [];
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const vishPlanets = Array.isArray(data.vish_navamsha_planets) ? data.vish_navamsha_planets : [];
  const names = (arr) => Array.isArray(arr) && arr.length ? arr.join(", ") : "—";

  const Mini = ({ label, value, tone = "normal" }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.35,
      color: tone === "bad" ? C.rose : tone === "good" ? C.cyan : "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value || "—"}
    </span>
  );

  return (
    <div className="space-y-3">
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.9rem", color: C.amber }}>
          ☠️ 64वाँ नवांश / खर
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginTop: "4px", lineHeight: 1.5 }}>
          D1 द्वि-स्वभाव राशि → 1/5/9 नवांश → D9 से 4था → D3 से 8वाँ → केवल राशि-स्वामी।
        </div>
      </GlassCard>

      {/* STEP 1 + 2: show every planet in a D1 dual sign and its degree/navamsha status */}
      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>
          स्टेप 1–2 · D1 द्वि-स्वभाव राशि + 1/5/9 नवांश
        </div>
        {!dualPlanets.length ? (
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.55)" }}>कोई ग्रह द्वि-स्वभाव राशि में नहीं।</div>
        ) : (
          <div style={{ display: "grid", gap: "5px" }}>
            {dualPlanets.map((x, i) => (
              <div key={`${x.planet_code}-${i}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
                padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)"
              }}>
                <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,.82)" }}>
                  <b>{x.planet_name}</b> · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                </div>
                <StatusPill
                  label={x.navamsha_qualifies ? "योग्य" : "बाहर"}
                  color={x.navamsha_qualifies ? "cyan" : "rose"}
                  size="xs"
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* STEP 3 + 4: only qualifying planets */}
      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>
          स्टेप 3–4 · 64वाँ नवांश + 22वाँ द्रेष्काण + Double Khar
        </div>

        {!candidates.length ? (
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.55)" }}>
            कोई ग्रह 1/5/9 नवांश की शर्त पूरी नहीं करता।
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {candidates.map((x, i) => {
              const d9 = x.d9_64th_navamsha || x.d9_fourth || {};
              const d3 = x.d3_22nd_drekkana || x.d3_eighth || {};
              const isDouble = !!x.double_khar;

              return (
                <div key={`${x.planet_code}-${i}`} style={{
                  padding: "8px", borderRadius: "7px",
                  border: `1px solid ${isDouble ? "rgba(251,113,133,.28)" : "rgba(255,255,255,.08)"}`,
                  background: isDouble ? "rgba(251,113,133,.055)" : "rgba(255,255,255,.025)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan }}>
                      {x.planet_name} से खर
                    </div>
                    <StatusPill label={isDouble ? "DOUBLE KHAR" : "Single Khar"} color={isDouble ? "rose" : "cyan"} size="xs" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "5px 10px" }}>
                    <Mini label="D1" value={`${x.d1_rashi_name} · ${x.d1_sign_degree}° · नवांश ${x.navamsha_no}`} />
                    <Mini label="D9 में ग्रह" value={`${x.planet_name}: ${x.d9_rashi_name || "—"}`} />
                    <Mini label="D3 में ग्रह" value={`${x.planet_name}: ${x.d3_rashi_name || "—"}`} />
                    <Mini label="D9 से 4था (64वाँ नवांश)" value={d9.available ? `${d9.target_rashi_name} → ${d9.lord_name}` : "—"} tone="good" />
                    <Mini label="D3 से 8वाँ (22वाँ द्रेष्काण)" value={d3.available ? `${d3.target_rashi_name} → ${d3.lord_name}` : "—"} tone="good" />
                    <Mini label="64वें नवांश के स्वामी की D2 होरा" value={x.d9_khar_lord_hora?.available ? `${x.d9_khar_lord} → ${x.d9_khar_lord_hora.hora_lord} होरा · ${x.d9_khar_lord_hora.d2_rashi_name || "D2 उपलब्ध"}` : "D2 डेटा उपलब्ध नहीं"} />
                    <Mini label="22वें द्रेष्काण के स्वामी की D2 होरा" value={x.d3_khar_lord_hora?.available ? `${x.d3_khar_lord} → ${x.d3_khar_lord_hora.hora_lord} होरा · ${x.d3_khar_lord_hora.d2_rashi_name || "D2 उपलब्ध"}` : "D2 डेटा उपलब्ध नहीं"} />
                  </div>

                  {isDouble && (
                    <div style={{ ...HI, marginTop: "6px", fontSize: "0.72rem", fontWeight: 700, color: C.rose }}>
                      Double Khar: <b>{x.planet_name}</b> से <b>{x.d9_khar_lord}</b> बन रहा है
                      {x.double_khar_hora?.available && (
                        <span style={{ fontWeight: 600, color: "rgba(255,255,255,.72)" }}>
                          {` · D2 में ${x.d9_khar_lord_hora?.d2_rashi_name || x.double_khar_hora.d2_rashi_name || "होरा"}: ${x.double_khar_hora.hora_lord}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* ALL-PLANET 64TH NAVAMSHA + 22ND DREKKANA EVIDENCE */}
      {Array.isArray(data.all_planet_checks) && data.all_planet_checks.length > 0 && (
        <GlassCard className="p-3">
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>
            सभी ग्रह · 64वाँ नवांश + 22वाँ द्रेष्काण
          </div>
          <div style={{ ...HI, fontSize: "0.67rem", color: "rgba(255,255,255,.48)", marginBottom: "8px", lineHeight: 1.45 }}>
            Double Khar बने या न बने, हर ग्रह से D9 का 4था और D3 का 8वाँ केवल evidence के रूप में दिखाया गया है।
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {data.all_planet_checks.map((x, i) => {
              const d9 = x.d9_64th_navamsha || x.d9_fourth || {};
              const d3 = x.d3_22nd_drekkana || x.d3_eighth || {};
              return (
                <div key={`all-khar-${x.planet_code}-${i}`} style={{
                  padding: "7px 8px", borderRadius: "7px",
                  background: "rgba(255,255,255,.025)",
                  border: "1px solid rgba(255,255,255,.06)"
                }}>
                  <div style={{ ...HI, fontWeight: 750, fontSize: "0.73rem", color: "rgba(255,255,255,.82)", marginBottom: "5px" }}>
                    {x.planet_name} · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "4px 10px" }}>
                    <Mini label="64वाँ नवांश" value={d9.available ? `${d9.target_rashi_name} → ${d9.lord_name}` : "D9 डेटा उपलब्ध नहीं"} />
                    <Mini label="22वाँ द्रेष्काण" value={d3.available ? `${d3.target_rashi_name} → ${d3.lord_name}` : "D3 डेटा उपलब्ध नहीं"} />
                    <Mini label="Double Khar" value={x.double_khar ? `हाँ · ${x.d9_khar_lord || "—"}` : "नहीं"} />
                    <Mini label="64वें स्वामी की Hora" value={x.d9_khar_lord_hora?.available ? `${x.d9_khar_lord} → ${x.d9_khar_lord_hora.hora_lord}` : "—"} />
                    <Mini label="22वें स्वामी की Hora" value={x.d3_khar_lord_hora?.available ? `${x.d3_khar_lord} → ${x.d3_khar_lord_hora.hora_lord}` : "—"} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* VISH NAVAMSHA — INDEPENDENT RAW EVIDENCE */}
      {vishPlanets.length > 0 && (
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.rose, marginBottom: "7px" }}>
            विष नवांश · सर्प / गिद्ध / सूअर
          </div>
          <div style={{ ...HI, fontSize: "0.67rem", color: "rgba(255,255,255,.48)", marginBottom: "6px", lineHeight: 1.45 }}>
            D1 राशि के अनुसार 1/5/9 विष नवांश की raw स्थिति; साथ में भाव, स्वामित्व, प्राकृतिक कारकत्व और D2 होरा।
          </div>
          <div style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.62)", marginBottom: "8px", padding: "5px 7px", borderRadius: "6px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
            <b>विष नवांश वर्ग:</b> 1वाँ नवांश = <b>सर्प</b> · 5वाँ नवांश = <b>गिद्ध</b> · 9वाँ नवांश = <b>सूअर</b>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {vishPlanets.map((x, i) => (
              <div key={`vish-${x.planet_code}-${i}`} style={{
                padding: "7px 8px", borderRadius: "7px",
                background: "rgba(251,113,133,.045)",
                border: "1px solid rgba(251,113,133,.12)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <div style={{ ...HI, fontWeight: 800, fontSize: "0.73rem", color: C.rose }}>
                    {x.planet_name} · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                  </div>
                  <StatusPill label={x.vish_navamsha_no ? `${x.vish_navamsha_no}वाँ · ${x.vish_category || "विष"}` : (x.vish_category || "विष")} color="rose" size="xs" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "4px 10px" }}>
                  <Mini label="D1 भाव" value={x.d1_house_name || "—"} />
                  <Mini label="D1 स्वामित्व" value={Array.isArray(x.d1_lordship_houses) && x.d1_lordship_houses.length ? x.d1_lordship_houses.join(", ") + "वां" : "—"} />
                  <Mini label="प्राकृतिक कारकत्व" value={x.natural_karakatwa || "—"} />
                  <Mini label="D2 होरा" value={x.vish_hora?.available ? `${x.vish_hora.hora_lord} होरा · ${x.vish_hora.d2_rashi_name || "—"}` : "D2 डेटा उपलब्ध नहीं"} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div style={{ ...HI, fontSize: "0.67rem", lineHeight: 1.5, color: "rgba(255,255,255,.38)", padding: "7px 9px", background: "rgba(255,255,255,.025)", borderRadius: "6px" }}>
        नोट: ये सभी entries केवल गणना/evidence हैं। Double Khar, 64वाँ नवांश, 22वाँ द्रेष्काण या विष नवांश से software स्वयं कोई अंतिम फलादेश/निर्णय नहीं देता।
      </div>

      {data.has_double_khar && (
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,.5)", marginBottom: "3px" }}>
            Double Khar किन ग्रहों से बन रहा है?
          </div>
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.rose }}>
            {names(data.double_khar_planets)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ════════ TAB 9 — VIVAH & DIVORCE (V.P. GOEL SUTRAS) ════════
function VivahDivorceTab({ vivah_promise, divorce_separation }) {
  if (!vivah_promise || !divorce_separation)
    return <EmptyState icon="💍" message="विवाह-संबंधी डेटा उपलब्ध नहीं" />;

  const vp = vivah_promise;
  const ds = divorce_separation;
  const d1 = vp.d1 || ds.d1 || {};
  const d9 = vp.d9 || ds.d9 || {};

  const names = (arr) => Array.isArray(arr) && arr.length ? arr.join(", ") : "—";
  const yn = (v) => v ? "हाँ" : "नहीं";
  const field = (o, ...keys) => {
    for (const k of keys) if (o && o[k] != null) return o[k];
    return null;
  };

  const Mini = ({ label, value, tone = "normal" }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.3,
      color: tone === "bad" ? C.rose : tone === "good" ? C.cyan : "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value || "—"}
    </span>
  );

  const EntityRow = ({ title, data, lord = false }) => {
    if (!data) return null;
    const planet = data.planet_name || data.lagnesh_name || "—";
    const house = field(data, "house_no", "house");
    const trik = field(data, "in_trik_6_8_12", "in_trik");
    const yutiBad = field(data, "yuti_malefics");
    const yutiGood = field(data, "yuti_benefics");
    const drishtiBad = field(data, "malefic_drishti", "malefic_drishti_planets");
    const drishtiGood = field(data, "benefic_drishti", "benefic_drishti_planets");
    const retro = field(data, "is_retrograde", "is_vakri_retrograde");

    return (
      <div style={{
        display: "grid", gridTemplateColumns: "78px 1fr", gap: "8px",
        padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.055)"
      }}>
        <div style={{ ...HI, fontSize: "0.76rem", fontWeight: 700, color: C.cyan }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
          <Mini label={lord ? "ग्रह" : "स्थिति"} value={lord ? `${planet}${house ? ` · ${house} भाव` : ""}` : planet} />
          {lord && <Mini label="त्रिक" value={yn(Boolean(trik))} tone={trik ? "bad" : "normal"} />}
          {lord && <Mini label="युति पाप" value={names(yutiBad)} tone={yutiBad?.length ? "bad" : "normal"} />}
          {lord && <Mini label="युति शुभ" value={names(yutiGood)} tone={yutiGood?.length ? "good" : "normal"} />}
          <Mini label="दृष्टि पाप" value={names(drishtiBad)} tone={drishtiBad?.length ? "bad" : "normal"} />
          <Mini label="दृष्टि शुभ" value={names(drishtiGood)} tone={drishtiGood?.length ? "good" : "normal"} />
          {lord && <Mini label="वक्री" value={yn(Boolean(retro))} />}
        </div>
      </div>
    );
  };

  const HouseRow = ({ title, data, showPK = false }) => {
    if (!data) return null;
    const occ = data.planets_present || [];
    const bad = data.malefic_planets_present || [];
    const good = data.benefic_planets_present || [];
    const badDr = data.malefic_drishti || data.malefic_drishti_planets || [];
    const goodDr = data.benefic_drishti || data.benefic_drishti_planets || [];
    const pk = data.paap_kartari;
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "78px 1fr", gap: "8px",
        padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.055)"
      }}>
        <div style={{ ...HI, fontSize: "0.76rem", fontWeight: 700, color: C.amber }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
          <Mini label="ग्रह" value={names(occ)} />
          <Mini label="पाप" value={names(bad)} tone={bad.length ? "bad" : "normal"} />
          <Mini label="शुभ" value={names(good)} tone={good.length ? "good" : "normal"} />
          <Mini label="पाप दृष्टि" value={names(badDr)} tone={badDr.length ? "bad" : "normal"} />
          <Mini label="शुभ दृष्टि" value={names(goodDr)} tone={goodDr.length ? "good" : "normal"} />
          {showPK && <Mini label="Paap Kartari" value={pk?.is_active ? `हाँ (${names(pk.previous_house_planets || pk.previous_planets)} | ${names(pk.next_house_planets || pk.next_planets)})` : "नहीं"} tone={pk?.is_active ? "bad" : "normal"} />}
        </div>
      </div>
    );
  };

  const ChartBlock = ({ chart, label }) => {
    if (!chart?.computed) return null;
    const lagna = chart.lagna || {};
    const lagnesh = chart.lagnesh || {};
    const seventh = chart.seventh_house || {};
    const seventhLord = chart.seventh_lord || {};
    const ninth = chart.ninth_house || {};
    const ninthLord = chart.house_lords?.["9"] || {};

    return (
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${label === "D1" ? C.cyan : C.amber}` }}>
        <div style={{ ...HI, fontSize: "0.9rem", fontWeight: 800, color: label === "D1" ? C.cyan : C.amber, marginBottom: "5px" }}>
          {label} <span style={{ color: "rgba(255,255,255,.5)", fontWeight: 500 }}>· लग्न {lagna.rashi_name || "—"}</span>
        </div>
        <EntityRow title="लग्न" data={{ planet_name: names(lagna.planets_present), benefic_drishti: lagna.benefic_drishti_planets, malefic_drishti: lagna.malefic_drishti_planets }} />
        {lagna.paap_kartari && <div style={{ ...HI, fontSize: "0.68rem", padding: "5px 0", color: lagna.paap_kartari.is_active ? C.rose : "rgba(255,255,255,.58)" }}>Paap Kartari: <b>{lagna.paap_kartari.is_active ? "हाँ" : "नहीं"}</b>{lagna.paap_kartari.is_active && ` · ${names(lagna.paap_kartari.previous_house_planets || lagna.paap_kartari.previous_planets)} | ${names(lagna.paap_kartari.next_house_planets || lagna.paap_kartari.next_planets)}`}</div>}
        <EntityRow title="लग्नेश" data={lagnesh} lord />
        <EntityRow title="सप्तमेश" data={seventhLord} lord />
        <EntityRow title="नवमेश" data={{ ...ninthLord, planet_name: ninthLord.planet_name }} lord />
        <HouseRow title="सप्तम भाव" data={seventh} showPK />
        <HouseRow title="नवम भाव" data={ninth} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px", paddingTop: "7px" }}>
          <Mini label="त्रिक 6" value={names(chart.sixth_house?.planets_present)} />
          <Mini label="त्रिक 8" value={names(chart.eighth_house?.planets_present)} />
          <Mini label="त्रिक 12" value={names(chart.twelfth_house?.planets_present)} />
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-3">
      <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, padding: "7px 10px", background: "rgba(245,158,11,.07)", borderRadius: "7px" }}>
        केवल raw observations — ग्रह, भाव, युति, दृष्टि, त्रिक और Paap Kartari। कोई final prediction/synthesis नहीं।
      </div>
      <ChartBlock chart={d1} label="D1" />
      <ChartBlock chart={d9} label="D9" />
    </div>
  );
}

// ════════ TAB — D2 HORA ANALYSIS ═══════════════════════════
function HoraTab({ hora_analysis }) {
  const h = hora_analysis;

  // Local compact renderer for Hora rows.
  // Keep this inside HoraTab so tab switching never depends on
  // Mini being declared in another tab component.
  const Mini = ({ label, value }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.3,
      color: "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value ?? "—"}
    </span>
  );
  if (!h?.computed) return <EmptyState icon="☀️" message="D2 होरा डेटा उपलब्ध नहीं" subtext="यह टैब केवल उपलब्ध D1/D2 raw data और configured Hora rules दिखाता है।" />;

  const planets = Array.isArray(h.rows) ? h.rows : [];
  const strength = Array.isArray(h.formula_2_hora_strength?.rows) ? h.formula_2_hora_strength.rows : [];
  const natureFlags = Array.isArray(h.formula_4_nature_speech?.flags) ? h.formula_4_nature_speech.flags : [];
  const houseData = Array.isArray(h.d2_house_reference?.rows) ? h.d2_house_reference.rows : [];
  const mansagariRules = Array.isArray(h.mansagari_textual_rules?.rules) ? h.mansagari_textual_rules.rules : [];
  const horaName = x => x?.hora_lord || x?.hora || x?.hora_lord_name || "—";
  const strengthName = x => x?.strength_label || x?.segment_label || x?.strength || "—";

  return (
    <div className="space-y-3">
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.9rem", color: C.amber }}>☀️ D2 होरा — Raw Analysis</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginTop: "4px", lineHeight: 1.5 }}>
          D1 राशि + डिग्री से Parashari D2 Hora, फिर Hora lord, strength और उपलब्ध textual flags।
          यह मॉड्यूल कोई अंतिम फलादेश या निर्णय नहीं देता।
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>सूत्र 1 · बेसिक पराशरी होरा</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", padding: "6px 8px", background: "rgba(255,255,255,.03)", borderRadius: "6px", marginBottom: "8px" }}>
          विषम राशि: 0°–&lt;15° = सूर्य/सिंह, 15°–&lt;30° = चंद्र/कर्क ·
          सम राशि: 0°–&lt;15° = चंद्र/कर्क, 15°–&lt;30° = सूर्य/सिंह
        </div>
        {planets.length ? <div style={{ display: "grid", gap: "5px" }}>
          {planets.map((x, i) => (
            <div key={`${x.planet_code || x.code || "p"}-${i}`} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "6px", padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)" }}>
              <span style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.82)" }}><b>{x.planet_name || x.name || x.planet_code || "—"}</b></span>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,.55)" }}>D1 {x.rashi_name || "—"} · {x.degree ?? "—"}°</span>
              <span style={{ ...HI, fontSize: "0.68rem", color: x.parashari_hora?.hora_lord_code === "Su" ? C.amber : C.cyan }}>{horaName(x.parashari_hora)} · {x.parashari_hora?.hora_sign || "—"}</span>
            </div>
          ))}
        </div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>ग्रहवार D2 Hora data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>सूत्र 2 · होरा शक्ति</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.5)", marginBottom: "7px" }}>
          0°–5°, 5°–10°, 10°–15° तथा 15°–20°, 20°–25°, 25°–30° segments को raw strength category।
        </div>
        {strength.length ? <div className="space-y-1">{strength.map((x, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 7px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.75)" }}>{x.planet_name || "—"}</span>
            <span style={{ fontSize: "0.68rem", color: C.amber }}>{strengthName(x.strength)}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Hora strength data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>सूत्र 3 · लाभ मण्डूक / केरल होरा</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>
          Sun-contributed और Moon-contributed mapping को raw evidence के रूप में दिखाया जाएगा।
        </div>
        {planets.length ? <div style={{ display: "grid", gap: "5px" }}>{planets.map((x, i) => (
          <div key={`kerala-${i}`} style={{ padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)" }}>
            <Mini label="ग्रह" value={x.planet_name || x.name || x.planet_code} />
            <Mini label="D1 राशि-स्वामी" value={x.rashi_lord || "—"} />
            <Mini label="Hora" value={horaName(x.parashari_hora)} />
            <Mini label="Mapped D2 राशि" value={x.kerala_hora?.mapped_rashi_name || "—"} />
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Kerala Hora mapping data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>ग्रंथीय संदर्भ · मानसागरी Hora Rules</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>Source में दिए planetary Hora फल केवल textual reference के रूप में हैं। Software इन्हें किसी व्यक्ति पर automatic prediction नहीं लगाएगा।</div>
        {mansagariRules.length ? <div className="space-y-1">{mansagariRules.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2.6fr", gap: "7px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ ...HI, fontSize: "0.68rem", color: C.cyan }}>{x.planet || "—"}</span>
            <span style={{ ...HI, fontSize: "0.68rem", color: C.amber }}>{x.placement || "—"}</span>
            <span style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.62)" }}>{x.rule || "—"}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Textual rules उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>सूत्र 4 · स्वभाव और वाणी Flags</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>
          केवल rule-match / evidence flags। कोई निश्चित भविष्यवाणी या final decision नहीं।
        </div>
        {natureFlags.length ? <div className="space-y-1">{natureFlags.map((x, i) => (
          <div key={i} style={{ padding: "6px 8px", borderRadius: "6px", background: x.available === false ? "rgba(255,255,255,.025)" : "rgba(34,211,238,.06)" }}>
            <div style={{ ...HI, fontSize: "0.72rem", fontWeight: 700, color: x.available === false ? "rgba(255,255,255,.65)" : C.cyan }}>{x.label || x.rule || "Rule"}</div>
            {x.evidence && <div style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.5)", marginTop: "3px" }}>{x.evidence}</div>}
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>कोई configured nature/speech flag उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>D2 के 12 भाव · धन के संदर्भ</div>
        {houseData.length ? <div className="space-y-1">{houseData.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "45px 1fr", gap: "7px", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: C.amber }}>{x.house || i + 1}</span>
            <span style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.62)" }}>{x.topic || x.description || x.label || "—"}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>D2 house reference engine data आने पर दिखेगा।</div>}
      </GlassCard>

      <div style={{ ...HI, fontSize: "0.67rem", lineHeight: 1.5, color: "rgba(255,255,255,.38)", padding: "7px 9px", background: "rgba(255,255,255,.025)", borderRadius: "6px" }}>
        नोट: software केवल सूत्रों से निकले evidence/flags रखेगा। “100% धन लाभ”, “गरीब”, “विवाह निश्चित” जैसे final conclusions software स्वयं नहीं देगा। अंतिम व्याख्या व्यक्ति/ज्योतिषी करेगा।
      </div>
    </div>
  );
}

// ════════ MAIN COMPONENT ═════════════════════════════════
export default function AdvancedYogasPanel() {
  const data     = useAdvancedYogas();   // [Fix ⑦] prop hata, store se direct
  const [activeTab, setActiveTab] = useState("indu");

  // IMPORTANT: Phase-2 engines are asynchronous. Do NOT block the whole
  // panel while advanced_yogas is being calculated. The tab shell opens
  // immediately from the fast chart response; individual tabs render their
  // own small "data pending" state until enginesData arrives.
  const summary = data?.summary || {};
  const engineReady = Boolean(data?.computed);

  const pendingData = (
    <EmptyState
      icon="⚡"
      message={data?.error || "Advanced Yogas डेटा तैयार हो रहा है..."}
      subtext="D1 chart तुरंत उपलब्ध है; Phase 2 केवल analysis data भर रहा है।"
    />
  );

  const renderTab = () => {
    if (!engineReady) return pendingData;
    switch (activeTab) {
      case "indu":   return <InduTab indu_lagna={data.indu_lagna} spouse_direction={data.spouse_direction} />;
      case "yogas":  return <YogasTab neech_uchha={data.neech_uchha} debt_trap={data.debt_trap} sudden_rise={data.sudden_rise} />;
      case "dhan":   return <DhanTab income_trapped={data.income_trapped} danger_zones={data.danger_zones} partner_compat={data.partner_compat} />;
      
      // 👇 यह रही सही लाइन (बिना डबल कोट्स के) 👇
      case "vivah":  return <VivahDivorceTab vivah_promise={data.vivah_promise} divorce_separation={data.divorce_separation} />;
      case "khar":   return <Khar64NavamsaTab khar_64th_navamsa={data.khar_64th_navamsa} />;
      case "hora":   return <HoraTab hora_analysis={data.hora_analysis} />;
      
      case "chakra": return <ChakraTab sudarshan_avg={data.sudarshan_avg} />;
      case "bhavat": return <BhavatTab bhavat_bhavam={data.bhavat_bhavam} />;
      case "rashis": return <RashiCycleTab life_cycle_rashis={data.life_cycle_rashis} />;
      case "tulna":  return <TulnaTab house_comparisons={data.house_comparisons} />;
      case "mega":   return <MegaTab mega_rules={data.mega_rules} />;
      default:       return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, margin: 0 }}>
            ⚡ उन्नत योग विश्लेषण
          </h3>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            Indu Lagna · Neech Bhang · Sudarshan Avg · Bhavat Bhavam
          </p>
        </div>
        <div className="space-y-1">
          {summary?.crorepati_yoga && <StatusPill label="💎 करोड़पति योग" color="cyan" size="xs" />}
          {summary?.debt_trap      && <StatusPill label="⚠️ कर्ज जाल"     color="rose" size="xs" />}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem",
            cursor: "pointer", border: "none",
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