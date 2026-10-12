/**
 * ChandraSuryaPanel.jsx
 * ======================
 * Batch 3 — Chandra + Surya Sutras + Personality Engine
 *
 * Refactoring Applied (v1.1):
 *   [Fix ④] SutraCard{} local component REMOVED — replaced with CardBlock from shared/ui.
 *           CardBlock already does the same job: icon + title header + collapsible + badge.
 *           SutraCard call-sites: Chandra Upachaya, Maata Viyog, Past Karma updated to CardBlock.
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, GlassCard, ProgressBar,
  RiskRing, CollapsibleSection, StrengthBar, CardBlock
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";

const TABS = [
  { id: "chandra",     label: "🌙 चंद्र" },
  { id: "surya",       label: "☀️ सूर्य" },
  { id: "personality", label: "🧠 स्वभाव" },
  { id: "life",        label: "📊 जीवन" },
  { id: "direction",   label: "🧭 दिशा" },
];

// [Fix ④] SutraCard{} REMOVED.
// BEFORE: <SutraCard title="..." label={x.label} color={x.color} description={x.description} note="...">
// AFTER:  <CardBlock icon="🌿" title="..." badge={x.label} accent={x.color} defaultOpen={true}>
//           <div>{x.description}</div> ... children ...
//         </CardBlock>


// ════════ TAB 1 — CHANDRA ════════════════════════════════
function ChandraTab({ data }) {
  const { chandra_upachaya: cu, moon_health: mh, maata_viyog: mv, paksha_bal: pb } = data;
  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div style={{ ...HI, fontWeight: 700, color: C.amber }}>🌙 पक्ष बल</div>
          <div style={{ fontWeight: 700, color: pb?.color, fontSize: "1.1rem" }}>{pb?.strength}%</div>
        </div>
        <ProgressBar value={pb?.strength || 0} max={100} color={pb?.color || C.amber} />
        <div style={{ ...HI, fontSize: "0.82rem", color: pb?.color, marginTop: "8px" }}>{pb?.label}</div>
        {pb?.note && <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>{pb.note}</div>}
      </GlassCard>

      {/* [Fix ④] SutraCard → CardBlock */}
      <CardBlock icon="🌿" title="उपचय नियम (6/11 भाव)" badge={cu?.label}
        accent={cu?.color || C.amber} defaultOpen={true}>
        {cu?.description && (
          <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginBottom: "10px" }}>
            {cu.description}
          </div>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          {[["BAV", cu?.moon_bav, "/8"], ["SAV", cu?.moon_sav, ""], ["भाव", cu?.moon_house, ""]].map(([k, v, s]) => (
            <div key={k} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px",
              padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: C.amber }}>{v}{s}</div>
              <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>{k}</div>
            </div>
          ))}
        </div>
      </CardBlock>

      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mh?.health_color}` }}>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.95rem", color: mh?.health_color, marginBottom: "10px" }}>
          {mh?.health_label}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
            <span>जन्म BAV: {mh?.moon_bav}</span>
            <span>प्रभावी BAV: {mh?.effective_bav}</span>
          </div>
          <StrengthBar value={(mh?.effective_bav / 8) * 100} color={mh?.health_color} />
        </div>
        {mh?.positive_qualities?.length > 0 && (
          <div className="mb-3">
            <div style={{ ...HI, fontSize: "0.72rem", color: C.cyan, marginBottom: "5px" }}>✅ विशेषताएं:</div>
            <div className="flex flex-wrap gap-1">
              {mh.positive_qualities.map(q => (
                <span key={q} style={{ fontSize: "0.72rem", color: C.cyan, ...HI,
                  background: "rgba(34,211,238,0.1)", padding: "2px 8px", borderRadius: "12px" }}>{q}</span>
              ))}
            </div>
          </div>
        )}
        {mh?.potential_diseases?.length > 0 && (
          <div>
            <div style={{ ...HI, fontSize: "0.72rem", color: C.rose, marginBottom: "5px" }}>⚠️ संभावित समस्याएं:</div>
            <div className="flex flex-wrap gap-1">
              {mh.potential_diseases.map(d => (
                <span key={d} style={{ fontSize: "0.72rem", color: C.rose, ...HI,
                  background: "rgba(251,113,133,0.1)", padding: "2px 8px", borderRadius: "12px" }}>{d}</span>
              ))}
            </div>
          </div>
        )}
        {mh?.risk_age && (
          <div style={{ ...HI, fontSize: "0.75rem", color: C.rose, marginTop: "10px",
            padding: "6px", background: "rgba(251,113,133,0.08)", borderRadius: "6px" }}>
            ⚠️ {mh.risk_age} की आयु में विशेष सावधानी।
          </div>
        )}
        {mh?.special_risk_note && (
          <div style={{ ...HI, fontSize: "0.75rem", color: C.rose, marginTop: "6px",
            padding: "5px 8px", background: "rgba(251,113,133,0.08)", borderRadius: "6px" }}>
            🔴 {mh.special_risk_note}
          </div>
        )}
      </GlassCard>

      {/* [Fix ④] SutraCard → CardBlock */}
      <CardBlock icon="👩" title="मातृ सुख विश्लेषण" badge={mv?.label}
        accent={mv?.color || C.amber} defaultOpen={true}>
        {mv?.description && (
          <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginBottom: "10px" }}>
            {mv.description}
          </div>
        )}
        {mv?.risk_count > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[["घातक भाव (4/7/8/12)", mv?.cond1_house],
              ["BAV ≤ 3", mv?.cond2_bav],
              ["राहु/शनि प्रभाव", mv?.cond3_paap]].map(([label, met]) => (
              <span key={label} style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "12px",
                background: met ? "rgba(251,113,133,0.15)" : "rgba(74,222,128,0.1)",
                color: met ? C.rose : C.green, ...HI }}>
                {met ? "✅" : "❌"} {label}
              </span>
            ))}
          </div>
        )}
      </CardBlock>
    </div>
  );
}


// ════════ TAB 2 — SURYA ══════════════════════════════════
function SuryaTab({ data }) {
  const { lucky_time: lt, lucky_months: lm, sankranti_result: sr } = data;
  return (
    <div className="space-y-4">
      {lt?.computed && (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "12px" }}>☀️ दिन का शुभ समय (3 भाग)</div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
            सूर्य राशि: {lt.sun_rashi_name} — यहाँ से 4-4 राशियों के BAV जोड़े गए
          </div>
          <div className="space-y-2">
            {lt.parts?.map((part, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "10px",
                background: part.is_best ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${part.is_best ? C.cyan + "40" : "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span style={{ ...HI, fontWeight: part.is_best ? 700 : 400, fontSize: "0.85rem",
                      color: part.is_best ? C.cyan : "rgba(255,255,255,0.8)" }}>{part.name}</span>
                    {part.is_best && <StatusPill label="सर्वश्रेष्ठ" color="cyan" size="xs" />}
                  </div>
                  <div style={{ fontWeight: 700, color: part.is_best ? C.cyan : C.amber, fontSize: "0.9rem" }}>
                    {part.bav_sum}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{part.start} – {part.end}</div>
                <StrengthBar value={(part.bav_sum / 32) * 100} color={part.is_best ? C.cyan : C.amber} delay={i * 0.1} />
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>{lt.rule}</div>
        </GlassCard>
      )}
      {lm?.computed && (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "10px" }}>📅 शुभ महीने (सूर्य BAV)</div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>{lm.formula_note}</div>
          {lm.lucky_months?.length > 0 && (
            <div className="mb-4">
              <div style={{ ...HI, fontSize: "0.75rem", color: C.cyan, marginBottom: "6px" }}>✅ शुभ महीने:</div>
              <div className="flex flex-wrap gap-2">
                {lm.lucky_months.map(m => (
                  <div key={m.month_name} style={{ background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.25)", borderRadius: "10px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: C.cyan, fontSize: "0.9rem", ...HI }}>{m.month_name}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", ...HI }}>{m.rashi_name} · BAV {m.sun_bav}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lm.unlucky_months?.length > 0 && (
            <div>
              <div style={{ ...HI, fontSize: "0.75rem", color: C.rose, marginBottom: "6px" }}>❌ सावधान के महीने:</div>
              <div className="flex flex-wrap gap-2">
                {lm.unlucky_months.map(m => (
                  <div key={m.month_name} style={{ background: "rgba(251,113,133,0.08)",
                    border: "1px solid rgba(251,113,133,0.2)", borderRadius: "10px", padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: C.rose, fontSize: "0.9rem", ...HI }}>{m.month_name}</div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", ...HI }}>{m.rashi_name} · BAV {m.sun_bav}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "10px" }}>{lm.rule}</div>
        </GlassCard>
      )}
      {sr?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${sr?.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>🌅 संक्रांति नक्षत्र फल</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", ...HI }}>जन्म: {sr?.janm_nakshatra_name}</span>
            <span style={{ fontSize: "0.75rem", color: C.amber }}>→</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", ...HI }}>संक्रांति: {sr?.sankranti_nak_name}</span>
            <span style={{ fontSize: "0.75rem", color: C.amber }}>= {sr?.count}</span>
          </div>
          <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: sr?.color }}>{sr?.label}</div>
          {sr?.is_special_bad && (
            <div style={{ ...HI, fontSize: "0.78rem", color: C.rose, marginTop: "8px",
              padding: "6px", background: "rgba(251,113,133,0.08)", borderRadius: "6px" }}>{sr.special_note}</div>
          )}
          <CollapsibleSection icon="📐" title="गिनती का चार्ट" defaultOpen={false} color={C.amber}>
            {sr?.count_ranges?.map(({ range, result }) => (
              <div key={range} style={{ display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: C.amber }}>{range}</span>
                <span style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>{result}</span>
              </div>
            ))}
          </CollapsibleSection>
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 3 — PERSONALITY ════════════════════════════
function PersonalityTab({ personality }) {
  if (!personality?.computed) return <EmptyState icon="🧠" message="व्यक्तित्व डेटा उपलब्ध नहीं" />;
  const p = personality;
  return (
    <div className="space-y-4">
      <div style={{ background: p.personality === "satvik" ? "rgba(34,211,238,0.08)" :
                    p.personality === "rajasik" ? "rgba(251,146,60,0.08)" : "rgba(74,222,128,0.08)",
        border: `1px solid ${p.color}30`, borderRadius: "14px", padding: "18px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          {p.personality === "satvik" ? "🧘" : p.personality === "rajasik" ? "💼" : "⚖️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem", color: p.color }}>{p.label}</div>
        <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", marginTop: "8px" }}>{p.description}</div>
      </div>
      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "12px" }}>आंतरिक बनाम बाहरी अंक</div>
        <div className="flex gap-4 mb-3">
          {[["आंतरिक", p.internal_sum, p.internal_pct, C.cyan],
            ["बाहरी",  p.external_sum, p.external_pct, C.orange]].map(([label, sum, pct, color]) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.5rem", color }}>{sum}</div>
              <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{label} ({pct}%)</div>
            </div>
          ))}
        </div>
        <div style={{ height: "10px", borderRadius: "5px", overflow: "hidden",
          background: "rgba(255,255,255,0.08)", marginBottom: "8px" }}>
          <div style={{ height: "100%", borderRadius: "5px", transition: "all 0.8s ease",
            background: `linear-gradient(to right, ${C.cyan} ${p.internal_pct}%, ${C.orange} ${p.internal_pct}%)` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
          <span>भाव 1,4,5,7,9,10</span><span>भाव 2,3,6,8,11,12</span>
        </div>
      </GlassCard>
      {p.traits?.length > 0 && (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px" }}>मुख्य गुण</div>
          <div className="flex flex-wrap gap-2">
            {p.traits.map(t => (
              <span key={t} style={{ fontSize: "0.78rem", color: p.color,
                background: `${p.color}15`, padding: "4px 10px", borderRadius: "20px", ...HI }}>{t}</span>
            ))}
          </div>
        </GlassCard>
      )}
      <CollapsibleSection icon="🏠" title="भाव-वार अंक विवरण" defaultOpen={false} color={C.amber}>
        <div className="space-y-2">
          {[["आंतरिक (1,4,5,7,9,10)", p.house_breakdown?.internal_houses, C.cyan],
            ["बाहरी (2,3,6,8,11,12)", p.house_breakdown?.external_houses, C.orange]].map(([title, houses, color]) => (
            <div key={title}>
              <div style={{ ...HI, fontSize: "0.72rem", color, marginBottom: "4px" }}>{title}</div>
              <div className="flex flex-wrap gap-1">
                {houses && Object.entries(houses).map(([h, v]) => (
                  <span key={h} style={{ fontSize: "0.72rem", color, background: `${color}15`,
                    padding: "2px 8px", borderRadius: "8px", fontFamily: "monospace" }}>{h}→{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}


// ════════ TAB 4 — LIFE SUTRAS ════════════════════════════
function LifeSutrasTab({ life_sutras }) {
  if (!life_sutras?.computed) return <EmptyState icon="📊" message="डेटा उपलब्ध नहीं" />;
  const ls = life_sutras;
  return (
    <div className="space-y-4">
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${ls.work_profit.color}` }}>
        <div style={{ ...HI, fontWeight: 700, color: ls.work_profit.color, marginBottom: "8px" }}>
          {ls.work_profit.label}
        </div>
        <div className="flex gap-4 mb-3">
          {[["10वां (कर्म)", ls.work_profit.h10, ls.work_profit.h10 > ls.work_profit.h11 ? C.amber : "rgba(255,255,255,0.4)"],
            ["11वां (लाभ)", ls.work_profit.h11, ls.work_profit.h11 > ls.work_profit.h10 ? C.cyan : "rgba(255,255,255,0.4)"]].map(
            ([title, val, col]) => (
            <div key={title} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.4rem", color: col }}>{val}</div>
              <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{title}</div>
            </div>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>{ls.work_profit.desc}</div>
      </GlassCard>

      {/* [Fix ④] SutraCard → CardBlock */}
      <CardBlock icon="🔄" title="पूर्वजन्म कर्म" badge={ls.past_karma.label}
        accent={ls.past_karma.color} defaultOpen={true}>
        <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>
          {ls.past_karma.desc}
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
          5वें भाव SAV: <span style={{ color: C.amber, fontWeight: 700 }}>{ls.past_karma.h5}</span>
        </div>
      </CardBlock>

      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${ls.trik_analysis.color}` }}>
        <div style={{ ...HI, fontWeight: 700, color: ls.trik_analysis.color, marginBottom: "8px" }}>
          {ls.trik_analysis.label}
        </div>
        <div className="flex gap-3 mb-3">
          {[["6वां", ls.trik_analysis.h6], ["8वां", ls.trik_analysis.h8], ["12वां", ls.trik_analysis.h12]].map(([title, val]) => (
            <div key={title} style={{ textAlign: "center",
              background: val >= 28 ? "rgba(251,113,133,0.12)" : "rgba(34,211,238,0.1)",
              borderRadius: "8px", padding: "6px 12px" }}>
              <div style={{ fontWeight: 700, color: val >= 28 ? C.rose : C.cyan }}>{val}</div>
              <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{title}</div>
            </div>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>{ls.trik_analysis.desc}</div>
        <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
          नियम: 6, 8, 12 में 28 से कम बिंदु = शत्रु/रोग/व्यय में कमी।
        </div>
      </GlassCard>
    </div>
  );
}


// ════════ TAB 5 — LUCKY DIRECTION ════════════════════════
function DirBox({ dir, maxVal, bestDir }) {
  if (!dir) return <div />;
  const isBest = dir.key === bestDir?.key;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "8px", minHeight: "64px", borderRadius: "10px",
      background: isBest ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isBest ? C.cyan + "50" : "rgba(255,255,255,0.08)"}` }}>
      <div style={{ fontSize: "1.2rem", color: isBest ? C.cyan : "rgba(255,255,255,0.5)" }}>{dir.symbol}</div>
      <div style={{ ...HI, fontSize: "0.68rem", color: isBest ? C.cyan : "rgba(255,255,255,0.5)",
        fontWeight: isBest ? 700 : 400 }}>{dir.name}</div>
      <div style={{ fontWeight: 700, fontSize: "0.8rem",
        color: isBest ? C.cyan : "rgba(255,255,255,0.4)" }}>{dir.val}</div>
    </div>
  );
}

function DirectionTab({ life_sutras }) {
  if (!life_sutras?.computed) return <EmptyState icon="🧭" message="डेटा उपलब्ध नहीं" />;
  const ld = life_sutras.lucky_direction;
  const dirs = [
    { key: "north", name: "उत्तर",  val: ld.north, symbol: "↑" },
    { key: "east",  name: "पूर्व",  val: ld.east,  symbol: "→" },
    { key: "west",  name: "पश्चिम", val: ld.west,  symbol: "←" },
    { key: "south", name: "दक्षिण", val: ld.south, symbol: "↓" },
  ];
  const maxVal  = Math.max(ld.north, ld.east, ld.west, ld.south);
  const bestDir = dirs.find(d => d.val === maxVal);
  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center" style={{ borderLeft: `3px solid ${C.cyan}` }}>
        <div style={{ fontSize: "3rem", marginBottom: "6px" }}>🧭</div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem", color: C.cyan }}>{ld.label}</div>
        <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>{ld.desc}</div>
      </GlassCard>
      <GlassCard className="p-5">
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ ...HI, fontSize: "0.8rem", color: C.amber }}>SAV अंकों के आधार पर शुभ दिशाएं</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr", gap: "8px", maxWidth: "280px", margin: "0 auto" }}>
          <div />
          <DirBox dir={dirs.find(d => d.key === "north")} maxVal={maxVal} bestDir={bestDir} />
          <div />
          <DirBox dir={dirs.find(d => d.key === "west")} maxVal={maxVal} bestDir={bestDir} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.04)", borderRadius: "50%",
            width: "64px", height: "64px", margin: "auto" }}>
            <div style={{ fontSize: "1.8rem" }}>🧭</div>
          </div>
          <DirBox dir={dirs.find(d => d.key === "east")} maxVal={maxVal} bestDir={bestDir} />
          <div />
          <DirBox dir={dirs.find(d => d.key === "south")} maxVal={maxVal} bestDir={bestDir} />
          <div />
        </div>
        <div className="space-y-2 mt-4">
          {[...dirs].sort((a, b) => b.val - a.val).map(dir => (
            <div key={dir.key} className="flex items-center gap-3">
              <span style={{ ...HI, fontSize: "0.78rem", width: "48px",
                color: dir.val === maxVal ? C.cyan : "rgba(255,255,255,0.6)",
                fontWeight: dir.val === maxVal ? 700 : 400 }}>{dir.name}</span>
              <div style={{ flex: 1 }}>
                <StrengthBar value={(dir.val / (maxVal + 5)) * 100}
                  color={dir.val === maxVal ? C.cyan : C.amber} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: "28px",
                color: dir.val === maxVal ? C.cyan : "rgba(255,255,255,0.6)" }}>{dir.val}</span>
            </div>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "10px", textAlign: "center" }}>
          राशि: पूर्व=मेष/सिंह/धनु | दक्षिण=वृषभ/कन्या/मकर | पश्चिम=मिथुन/तुला/कुंभ | उत्तर=कर्क/वृश्चिक/मीन
        </div>
      </GlassCard>
    </div>
  );
}


// ════════ MAIN COMPONENT ═════════════════════════════════
export default function ChandraSuryaPanel({ data }) {
  const [activeTab, setActiveTab] = useState("chandra");
  if (!data?.computed) {
    return <EmptyState icon="🌙"
      message={data?.error || "चंद्र-सूर्य डेटा लोड हो रहा है..."}
      subtext="Phase 2 background analysis..." />;
  }
  const { summary } = data;
  const renderTab = () => {
    switch (activeTab) {
      case "chandra":     return <ChandraTab data={data} />;
      case "surya":       return <SuryaTab data={data} />;
      case "personality": return <PersonalityTab personality={data.personality} />;
      case "life":        return <LifeSutrasTab life_sutras={data.life_sutras} />;
      case "direction":   return <DirectionTab life_sutras={data.life_sutras} />;
      default:            return null;
    }
  };
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, margin: 0 }}>
            🌙☀️ चंद्र-सूर्य अष्टकवर्ग
          </h3>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            Health · Lucky Time · Personality · Life Sutras
          </p>
        </div>
        {summary && (
          <div className="space-y-1">
            {summary.super_rich_yoga && <StatusPill label="💎 सुपर रिच" color="cyan" size="xs" />}
            {summary.moon_strength === "weak" && <StatusPill label="⚠️ कमजोर चंद्र" color="rose" size="xs" />}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem",
            cursor: "pointer", border: "none",
            background: activeTab === tab.id ? C.amber : "rgba(255,255,255,0.07)",
            color: activeTab === tab.id ? "#000" : "rgba(255,255,255,0.7)",
            fontWeight: activeTab === tab.id ? 700 : 400, ...HI,
          }}>{tab.label}</button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}