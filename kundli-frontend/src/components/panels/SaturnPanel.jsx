// SaturnPanel.jsx — Complete Transit System v2
// Sade Sati (3 phases + 4 padas + AV override) + Dhaiya + Jupiter Gochar + Punarjanma
//
// Refactoring Applied (v2.1 → v2.2):
//   [Fix ②] Section{}  REMOVED → CollapsibleSection from shared/ui
//   [Fix ③] Card{}     REMOVED → GlassCard      from shared/ui
//   [Fix ③] SLabel{}   REMOVED → SectionLabel   from shared/ui
//   [Fix ①] Bar{}      REMOVED → StrengthBar    from shared/ui
//   [Fix ①] SevBar{}   REMOVED → StrengthBar (color computed inline, same logic)
//   [Fix ①] HI, C      REMOVED (local defs) → imported from designTokens
//   [PERF]  framer-motion & lucide-react imports REMOVED from this file entirely
//           (CollapsibleSection handles its own animation internally)
//   Result: ~90 lines removed, 0 framer-motion usage in this file, faster cold render

import { useState } from "react";
import {
  GlassCard, CollapsibleSection, SectionLabel,
  StrengthBar, EmptyState
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";

// ─── Severity bar (severity % → color) ──────────────────
// Replaces old SevBar{} — no motion needed, CSS transition is enough
function SevBar({ value = 0 }) {
  const col = value >= 80 ? C.red : value >= 50 ? C.orange : value >= 30 ? C.amber : C.cyan;
  return <StrengthBar value={value} color={col} />;
}


// ═══ SADE SATI COMPLETE ═══════════════════════════════════
function SadeSatiBlock({ data }) {
  const ss          = data?.sade_sati         || {};
  const dy          = data?.dhayya            || {};
  const avOverride  = data?.ashtakvarga_override || {};

  const PHASES = [
    { key: "rising",  num: "1", name: "उदय पाद",  hindi: "12वें में शनि",     sev: 40,  color: C.amber,
      effect: "मानसिक तनाव की शुरुआत, व्यय बढ़ना, अनजाना भय",
      tip:    "अभी से बचत शुरू करें, ऋण चुकाएं, अनावश्यक खर्च बंद करें" },
    { key: "peak",    num: "2", name: "चरम पाद",   hindi: "चंद्र राशि में शनि", sev: 100, color: C.red,
      effect: "सबसे कठिन समय — स्वास्थ्य, धन, मान सभी पर दबाव",
      tip:    "धैर्य रखें। शनि मंत्र 108 बार रोज। गरीबों को भोजन कराएं।" },
    { key: "setting", num: "3", name: "अस्त पाद",  hindi: "2रे में शनि",        sev: 60,  color: C.orange,
      effect: "धीरे-धीरे सुधार, लेकिन अभी भी सावधानी जरूरी",
      tip:    "धन्यवाद पूजा करें। दान जारी रखें। नई शुरुआत शुभ।" },
  ];

  const PADAS = [
    { name: "स्वर्ण पाद", metal: "सोना",   icon: "🥇", color: C.yellow, sev: 25,
      effect: "साढ़े साती का सबसे कम कठिन समय। मानसिक तैयारी करें।" },
    { name: "रजत पाद",   metal: "चाँदी",  icon: "🥈", color: C.slate,  sev: 50,
      effect: "कष्ट बढ़ने लगे हैं। धन संभालें, स्वास्थ्य का ध्यान।" },
    { name: "ताम्र पाद", metal: "तांबा",  icon: "🥉", color: C.orange, sev: 75,
      effect: "काफी कठिन। सोच-समझकर हर निर्णय लें।" },
    { name: "लौह पाद",   metal: "लोहा",   icon: "⚙️", color: C.slate,  sev: 100,
      effect: "सबसे कठिन पाद। स्वास्थ्य और धन दोनों पर अधिकतम दबाव।" },
  ];

  const isActive  = ss.active || dy.active;
  const isDhaiya  = !ss.active && dy.active;
  const curPhase  = ss.phase || "";
  const avPts     = avOverride.house_points || data?.av_points || 0;
  const avGood    = avPts >= 28;

  return (
    <GlassCard className="p-4">
      <SectionLabel color={isActive ? C.red : C.cyan}>🪐 शनि गोचर — वर्तमान स्थिति</SectionLabel>

      {/* Status Badge */}
      <div className="p-4 rounded-xl mb-4" style={{
        background: isActive ? "rgba(239,68,68,.1)" : "rgba(34,211,238,.08)",
        border: `1.5px solid ${isActive ? C.red : C.cyan}35`,
      }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[28px]">{isActive ? "🪐" : "✅"}</span>
          <div>
            <div className="text-[16px] font-black" style={{ color: isActive ? C.red : C.cyan, ...HI }}>
              {ss.active ? (ss.type || "साढ़े साती सक्रिय!") : isDhaiya ? "ढैया सक्रिय" : "शनि गोचर सामान्य"}
            </div>
            <div className="text-[12px] text-slate-400" style={HI}>
              {ss.active ? ss.phase : isDhaiya ? dy.type : "अभी कोई विशेष शनि प्रभाव नहीं"}
            </div>
          </div>
        </div>
        {isActive && <SevBar value={ss.severity || dy.severity || 0} />}
        {(ss.description || dy.description) && (
          <div className="mt-2 text-[12px] text-slate-300" style={HI}>
            {ss.description || dy.description}
          </div>
        )}
        {!isActive && (
          <div>
            <div className="text-[13px] text-cyan-400 mt-1" style={HI}>✅ अभी साढ़े साती/ढैया नहीं है</div>
            {data?.next_sade_sati && (
              <div className="text-[12px] text-slate-400 mt-1" style={HI}>
                अगली साढ़े साती: {data.next_sade_sati}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AV Override */}
      {avPts > 0 && (
        <div className="p-3 rounded-xl mb-4" style={{
          background: avGood ? "rgba(74,222,128,.1)" : "rgba(251,113,133,.1)",
          border: `1px solid ${avGood ? C.green : C.rose}35`,
        }}>
          <div className="text-[13px] font-black mb-2" style={{ color: avGood ? C.green : C.rose, ...HI }}>
            🔢 अष्टकवर्ग Override — {avGood ? "✅ सुरक्षा!" : "⚠️ पूर्ण प्रभाव"}
          </div>
          <div className="text-[12px] text-slate-200 mb-2" style={HI}>
            {isActive
              ? `शनि जिस भाव में गोचर कर रहा = ${avPts} अंक`
              : `शनि का वर्तमान भाव = ${avPts} अंक`}
          </div>
          <StrengthBar value={(avPts / 56) * 100} color={avGood ? C.green : C.rose} />
          <div className="text-[12px] mt-2" style={HI}>
            {avGood
              ? "✅ 28+ अंक = साढ़े साती का कष्ट 70% कम! केवल मानसिक तनाव।"
              : "⚠️ 28 से कम = शनि का पूर्ण कठोर प्रभाव।"}
          </div>
        </div>
      )}

      {/* 3 Phases */}
      <SectionLabel color={C.orange}>साढ़े साती — तीन चरण (7.5 वर्ष)</SectionLabel>
      {PHASES.map((ph, i) => {
        const isThisPhase = isActive && curPhase.includes(ph.hindi.split("में")[0].trim());
        return (
          <div key={i} className="p-3 rounded-xl mb-2" style={{
            background: isThisPhase ? `${ph.color}15` : "rgba(255,255,255,.03)",
            border: `1px solid ${isThisPhase ? ph.color : "rgba(255,255,255,.06)"}35`,
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[18px]">{["🌅", "🔥", "🌇"][i]}</span>
              <span className="text-[13px] font-black" style={{ color: ph.color, ...HI }}>{ph.name}</span>
              <span className="text-[11px] text-slate-500 flex-1" style={HI}>— {ph.hindi}</span>
              {isThisPhase && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${ph.color}20`, color: ph.color, ...HI }}>⚡ चालू</span>
              )}
            </div>
            <div className="text-[12px] text-slate-300 mb-1" style={HI}>{ph.effect}</div>
            <div className="text-[11px] text-slate-500" style={HI}>💡 {ph.tip}</div>
            <SevBar value={ph.sev} />
          </div>
        );
      })}

      {/* 4 Padas */}
      <SectionLabel color={C.purple}>पाद प्रणाली (4 पाद × 2.5 वर्ष)</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PADAS.map((p, i) => (
          <div key={i} className="p-3 rounded-xl" style={{
            background: `${p.color}08`, border: `1px solid ${p.color}25`,
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px]">{p.icon}</span>
              <span className="text-[12px] font-black" style={{ color: p.color, ...HI }}>{p.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 mb-1" style={HI}>{p.effect}</div>
            <SevBar value={p.sev} />
          </div>
        ))}
      </div>

      {/* Dhaiya */}
      <SectionLabel color={C.amber}>ढैया (2.5 वर्ष)</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: "कंटक शनि (4वां)", sub: "चंद्र से 4वें में शनि", desc: "मानसिक कष्ट, माता को कष्ट, मकान समस्या", sev: 70, color: C.orange, match: "4" },
          { label: "अष्टम शनि (8वां)", sub: "चंद्र से 8वें में शनि", desc: "धन हानि, गुप्त शत्रु, स्वास्थ्य समस्या",  sev: 80, color: C.rose,  match: "8" },
        ].map(({ label, sub, desc, sev, color, match }) => {
          const active = dy.active && dy.type?.includes(match);
          return (
            <div key={match} className="p-3 rounded-xl" style={{
              background: active ? `${color}15` : "rgba(255,255,255,.04)",
              border: `1px solid ${active ? color : C.amber}30`,
            }}>
              <div className="text-[12px] font-black mb-1" style={{ color, ...HI }}>{label}</div>
              <div className="text-[11px] text-slate-300" style={HI}>{sub}</div>
              <div className="text-[11px] text-slate-400 mt-1" style={HI}>{desc}</div>
              <SevBar value={sev} />
            </div>
          );
        })}
      </div>

      {/* Remedies */}
      <SectionLabel color={C.teal}>🛡️ उपाय (Phase-wise)</SectionLabel>
      {[
        { phase: "उदय पाद (शुरू)", remedies: ["हनुमान चालीसा प्रातः", "तिल का तेल दान", "काली दाल दान शनिवार", "बचत बढ़ाएं, ऋण चुकाएं"] },
        { phase: "चरम पाद (Peak)", remedies: ["शनि मंत्र 108 बार रोज", "नीलम रत्न (विद्वान से परामर्श)", "शनि शिंगणापुर दर्शन", "गरीबों को भोजन कराएं", "काले तिल का दान"] },
        { phase: "अस्त पाद (अंत)", remedies: ["दान जारी रखें", "धन्यवाद पूजा करें", "नई शुरुआत शुभ है", "Sade Sati ke baad 1 year clear"] },
      ].map((r, i) => (
        <div key={i} className="mb-2 p-3 rounded-xl"
          style={{ background: "rgba(45,212,191,.06)", border: "1px solid rgba(45,212,191,.2)" }}>
          <div className="text-[12px] font-bold text-teal-400 mb-1" style={HI}>{r.phase}:</div>
          {r.remedies.map((rem, j) => (
            <div key={j} className="text-[11px] text-slate-300" style={HI}>• {rem}</div>
          ))}
        </div>
      ))}
    </GlassCard>
  );
}


// ═══ JUPITER GOCHAR ════════════════════════════════════════
const JU_EFFECTS = {
  1:  { col: C.cyan,   title: "लग्न में गुरु",  sev: "✅ अति शुभ",      effect: "नई शुरुआत, व्यक्तित्व निखरेगा, आत्मविश्वास, स्वास्थ्य लाभ" },
  2:  { col: C.green,  title: "2रे में गुरु",   sev: "✅ शुभ",           effect: "धन लाभ, परिवार में खुशी, वाणी प्रभावशाली, बचत बढ़ेगी" },
  3:  { col: C.amber,  title: "3रे में गुरु",   sev: "मध्यम",           effect: "मेहनत का फल, भाई से सहयोग, यात्राएं, साहस बढ़ेगा" },
  4:  { col: C.cyan,   title: "4थे में गुरु",   sev: "✅ शुभ",           effect: "माता का सुख, संपत्ति लाभ, घर में शांति, वाहन संभव" },
  5:  { col: C.green,  title: "5वें में गुरु",  sev: "✅✅ अति शुभ",     effect: "संतान का सुख, बुद्धि तेज, शिक्षा में सफलता, प्रेम" },
  6:  { col: C.rose,   title: "6ठे में गुरु",   sev: "⚠️ सावधानी",      effect: "स्वास्थ्य पर ध्यान दें, शत्रु बढ़ सकते हैं, कर्ज से बचें" },
  7:  { col: C.pink,   title: "7वें में गुरु",  sev: "✅ शुभ",           effect: "विवाह/साझेदारी शुभ, जीवनसाथी खुश, व्यापार में लाभ" },
  8:  { col: C.red,    title: "8वें में गुरु",  sev: "⚠️ सावधानी",      effect: "अचानक परिवर्तन, गुप्त शत्रु, लेकिन लंबी आयु का आश" },
  9:  { col: C.cyan,   title: "9वें में गुरु",  sev: "✅✅ अति शुभ",     effect: "भाग्योदय! पिता का सहयोग, तीर्थ यात्रा, उच्च शिक्षा" },
  10: { col: C.green,  title: "10वें में गुरु", sev: "✅ शुभ",           effect: "करियर में उन्नति, पद-प्रतिष्ठा, सरकारी काम" },
  11: { col: C.cyan,   title: "11वें में गुरु", sev: "✅✅ सर्वोत्तम!",  effect: "सर्वोत्तम! धन की वर्षा, इच्छाएं पूरी, मित्र सहायक" },
  12: { col: C.orange, title: "12वें में गुरु", sev: "मध्यम",           effect: "व्यय बढ़ेगा, विदेश यात्रा, आध्यात्मिक उन्नति" },
};

function JupiterBlock({ saturnData }) {
  const juGochar  = saturnData?.jupiter_transit || {};
  const juHouse   = juGochar.current_house || null;
  const moonHouse = saturnData?.moon_house  || null;
  const [selHouse, setSelHouse] = useState(juHouse || 11);
  const je = JU_EFFECTS[selHouse];

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.orange}>🪐 गुरु गोचर — 12 भावों में फल</SectionLabel>
      {juHouse && (
        <div className="p-2.5 rounded-xl mb-3"
          style={{ background: "rgba(251,146,60,.1)", border: "1px solid rgba(251,146,60,.25)" }}>
          <div className="text-[13px] font-black text-orange-400" style={HI}>
            🪐 वर्तमान में गुरु {juHouse}वें भाव में गोचर कर रहा है
            {moonHouse && ` (चंद्र राशि से ${Math.abs(juHouse - moonHouse) || 12}वें)`}
          </div>
        </div>
      )}

      {/* House selector grid */}
      <div className="grid grid-cols-6 gap-1.5 mb-4">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => {
          const hd   = JU_EFFECTS[h];
          const isJu = h === juHouse;
          const isSel = h === selHouse;
          return (
            <button key={h} onClick={() => setSelHouse(h)}
              className="py-2.5 rounded-xl text-[13px] font-black transition-all"
              style={{
                background: isSel ? `${hd.col}25` : isJu ? `${hd.col}10` : "rgba(255,255,255,.04)",
                color:      isSel ? hd.col : isJu ? hd.col : "#475569",
                border:     isSel ? `2px solid ${hd.col}60` : isJu ? `1px solid ${hd.col}30` : "1px solid rgba(255,255,255,.08)",
              }}>
              {h}
              {isJu && <div className="text-[7px] leading-none mt-0.5">गुरु</div>}
            </button>
          );
        })}
      </div>

      {/* Selected house detail — CSS transition instead of framer-motion */}
      {je && (
        <div key={selHouse} style={{ transition: "opacity 0.2s ease" }}>
          <div className="p-4 rounded-xl" style={{ background: `${je.col}10`, border: `1px solid ${je.col}30` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[24px]">🪐</span>
              <div>
                <div className="text-[15px] font-black" style={{ color: je.col, ...HI }}>{je.title}</div>
                <div className="text-[12px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5"
                  style={{ background: `${je.col}15`, color: je.col, ...HI }}>
                  {je.sev}
                </div>
              </div>
            </div>
            <div className="text-[13px] text-slate-200 mt-2" style={HI}>{je.effect}</div>
          </div>
          <div className="mt-3 p-3 rounded-xl"
            style={{ background: "rgba(251,146,60,.06)", border: "1px solid rgba(251,146,60,.2)" }}>
            <div className="text-[11px] font-bold text-orange-400 mb-2" style={HI}>
              🪐 गुरु गोचर — शुभ भाव (1,2,4,5,7,9,10,11)
            </div>
            <div className="text-[11px] text-slate-300" style={HI}>
              इन भावों में गुरु का गोचर = शुभ फल | 3,6,8,12 = सावधानी जरूरी।
              सबसे शुभ: 5वां (बुद्धि/संतान), 9वां (भाग्य), 11वां (लाभ)।
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}


// ═══ PUNARJANMA ════════════════════════════════════════════
function PunarjanmaBlock({ data }) {
  if (!data || data.error) return (
    <EmptyState icon="🔮" message="पुनर्जन्म डेटा उपलब्ध नहीं" />
  );

  const realm  = data.birth_realm   || {};
  const quality = data.birth_quality || {};

  const REALMS = [
    { name: "देवलोक",   color: C.cyan,   icon: "🌟", desc: "स्वर्ग से आए हैं। बहुत पुण्य लेकर आए।" },
    { name: "पितृलोक",  color: C.amber,  icon: "👴", desc: "पूर्वजों के लोक से। कर्ज चुकाने आए हैं।" },
    { name: "मर्त्यलोक", color: C.green, icon: "🌍", desc: "पृथ्वी से ही फिर आए। कर्म जारी है।" },
    { name: "नरकलोक",   color: C.rose,   icon: "🔥", desc: "पिछले कर्मों की सफाई के लिए।" },
  ];

  const realmName   = realm.realm || "मर्त्यलोक";
  const realmData   = REALMS.find(r => r.name === realmName) || REALMS[2];
  const qualityScore = quality.score || 60;
  const qualityText  = qualityScore >= 80 ? "उत्तम" : qualityScore >= 50 ? "मध्यम" : "अधम";
  const qualityColor = qualityScore >= 80 ? C.cyan : qualityScore >= 50 ? C.amber : C.rose;

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.indigo}>🔮 पुनर्जन्म विश्लेषण — D3 द्रेष्काण</SectionLabel>
      <div className="p-4 rounded-xl mb-3" style={{
        background: "linear-gradient(135deg,rgba(129,140,248,.08),rgba(8,12,28,.98))",
        border: "1px solid rgba(129,140,248,.25)",
      }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[36px]">{realm.icon || realmData.icon}</span>
          <div>
            <div className="text-[16px] font-black text-indigo-300" style={HI}>{realmName}</div>
            <div className="text-[12px] text-slate-400" style={HI}>{realmData.desc}</div>
          </div>
        </div>
        {data.stronger_planet && (
          <div className="text-[12px] text-slate-400 mt-2" style={HI}>
            प्रमुख ग्रह: <span className="text-amber-300 font-bold">{data.stronger_planet}</span>
            {data.drekkana_lord && ` · द्रेष्काण स्वामी: ${data.drekkana_lord}`}
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
        <div className="text-[12px] font-bold mb-2" style={{ color: qualityColor, ...HI }}>
          🌟 जन्म गुणवत्ता: {qualityText}
        </div>
        <StrengthBar value={qualityScore} color={qualityColor} />
        {quality.description && (
          <div className="text-[12px] text-slate-300 mt-2" style={HI}>{quality.description}</div>
        )}
      </div>

      <div className="p-3 rounded-xl"
        style={{ background: "rgba(129,140,248,.06)", border: "1px solid rgba(129,140,248,.2)" }}>
        <div className="text-[12px] font-bold text-indigo-400 mb-2" style={HI}>🙏 इस जन्म का उद्देश्य:</div>
        <div className="text-[12px] text-slate-200" style={HI}>
          {realm.purpose || "कर्म संतुलन और आत्मिक उन्नति। दान, सेवा और सत्य पालन इस जन्म के मुख्य कर्तव्य हैं।"}
        </div>
        <div className="mt-2 text-[11px] text-slate-400" style={HI}>
          उपाय: • पितृ तर्पण • दान-पुण्य • सत्संग • गरीबों की सेवा
        </div>
      </div>
    </GlassCard>
  );
}


// ═══ SADABAHAR SUTRAS ══════════════════════════════════════
const SUTRAS = {
  medical: [
    { title: "👁️ चश्मे/आंखों का योग",  cond: "शनि मेष में या सूर्य पर दृष्टि डाले",
      logic: "शनि की ठंडक + सूर्य की गर्मी = आंखों पर दबाव। मेष राशि = सिर/आंखें।",
      remedy: "सूर्य नमस्कार, आंखों का नियमित चेकअप, तांबे के बर्तन में पानी पिएं" },
    { title: "🩸 शुगर/डायबिटीज",         cond: "गुरु नीच (मकर) या गुरु+शुक्र एक साथ",
      logic: "गुरु = मीठा, शुक्र = भोग। दोनों साथ = अत्यधिक मिठास = शुगर।",
      remedy: "मीठे से परहेज, गुरु मंत्र, पुखराज रत्न (अनुकूल हो तो), व्यायाम" },
    { title: "💪 मांसपेशी/रक्त विकार",  cond: "मंगल नीच (कर्क) या 6/8/12 में",
      logic: "मंगल = रक्त/मांसपेशी। नीच = शक्ति कम। कर्क = जल राशि = खून पतला।",
      remedy: "लाल मूंगा (अनुकूल हो तो), मंगलवार व्रत, हनुमान पूजा" },
    { title: "🧠 मानसिक अस्थिरता",       cond: "चंद्र+राहु युति (ग्रहण योग)",
      logic: "राहु = भ्रम, चंद्र = मन। युति = मन में भ्रम का अंधकार।",
      remedy: "सोमवार व्रत, मोती रत्न, ध्यान, प्राणायाम, दूध दान" },
    { title: "❤️ हृदय रोग",              cond: "सूर्य 6/8/12 में या पाप ग्रहों से पीड़ित",
      logic: "सूर्य = हृदय का कारक। दुष्ट भाव में = हृदय पर दबाव।",
      remedy: "माणिक्य रत्न (अनुकूल), आदित्य हृदयम पाठ, तांबा दान रविवार" },
  ],
  manglik: [
    { title: "⚔️ मंगलिक दोष — 5 स्थान",     cond: "मंगल लग्न/4/7/8/12 में",
      logic: "मंगल = अग्नि, क्रोध। विवाह भाव के संपर्क में = रिश्तों में जलन।",
      remedy: "मंगल मंत्र, लाल मूंगा, हनुमान पूजा, मंगलिक से विवाह" },
    { title: "✅ दोष निवारण — दोनों मंगलिक", cond: "दोनों पार्टनर मंगलिक हों",
      logic: "दो अग्नियां = बराबर। एक-दूसरे का दोष cancel।",
      remedy: "दोषांक मिलाना अनिवार्य" },
    { title: "✅ दोष निवारण — शनि/राहु",     cond: "साथी की कुंडली में शनि/राहु उसी स्थान पर",
      logic: "शनि और राहु मंगल जैसे ही कठोर। समकक्ष = cancel।",
      remedy: "जन्मपत्री मिलान विशेषज्ञ से करवाएं" },
    { title: "❌ झूठा नियम",                  cond: "गुरु की दृष्टि से दोष cancel — यह गलत है!",
      logic: "गुरु दृष्टि केवल 'सुधार' करती है, complete cancel नहीं।",
      remedy: "केवल विद्वान ज्योतिषी से मिलान कराएं" },
  ],
  career: [
    { title: "💰 करोड़पति योग",    cond: "सूर्य → अगले भाव → बुध+शुक्र (अस्त नहीं)",
      logic: "सूर्य की शक्ति बुध-शुक्र को मिले तो व्यापार-कला दोनों से धन।",
      remedy: "रविवार को व्यापार का निर्णय लें" },
    { title: "📊 श्रेष्ठ पेशा",    cond: "जिस ग्रह की राशियों में सबसे ज्यादा ग्रह",
      logic: "अधिक ग्रह जिस राशि-स्वामी के अधीन = वह क्षेत्र सबसे अनुकूल।",
      remedy: "अपने ग्रह बल की गणना करें" },
    { title: "🧠 बुध-शुक्र क्रम",  cond: "बुध शुक्र से आगे = व्यापार में चालाक",
      logic: "बुध (बुद्धि) + शुक्र (पैसा) — बुध पहले आए = बुद्धि से धन।",
      remedy: "व्यापार में रणनीति पहले, पैसा बाद में" },
    { title: "🏛️ सरकारी नौकरी योग", cond: "सूर्य केंद्र में + लग्नेश बली",
      logic: "सूर्य = सरकार। केंद्र में = राज्य का संबंध।",
      remedy: "रविवार को आवेदन करें, माणिक्य विचार करें" },
  ],
  destruction: [
    { title: "🏠 भाव विनाश — सोन पे सुहागा", cond: "भावेश + कारक एक साथ + शुभ दृष्टि",
      logic: "भाव का स्वामी + उस भाव का कारक एक साथ = 100% शुभ।",
      remedy: "उस भाव को और मजबूत करें" },
    { title: "💀 भाव विनाश — पाप कर्तरी",   cond: "भाव के दोनों तरफ पाप ग्रह + स्वामी पीड़ित",
      logic: "दो तरफ से दुश्मन = भाव घिरा हुआ = फल मिलना कठिन।",
      remedy: "भाव के स्वामी को मजबूत करें" },
    { title: "🔱 विनाश — दोहरी नीचता",       cond: "भाव में ग्रह नीच + भाव स्वामी भी नीच",
      logic: "भाव और स्वामी दोनों कमजोर = उस भाव से जुड़ी चीज जीवनभर संघर्ष।",
      remedy: "उस भाव के कारक का मंत्र जाप" },
    { title: "⭐ सर्वोच्च विनाश",             cond: "भाव + स्वामी + कारक तीनों शनि/राहु/केतु से पीड़ित",
      logic: "तीन स्तर पर पाप प्रभाव = भाव पूरी तरह नष्ट।",
      remedy: "उस भाव से संबंधित उपाय तीव्र रूप से करें" },
  ],
};

function SutrasBlock() {
  const [tab, setTab] = useState("medical");
  const STABS = [
    { k: "medical",     l: "🏥 मेडिकल",  c: C.red    },
    { k: "manglik",     l: "⚔️ मांगलिक", c: C.rose   },
    { k: "career",      l: "💼 करियर",   c: C.green  },
    { k: "destruction", l: "🔱 भाव नाश", c: C.orange },
  ];
  const sutras = SUTRAS[tab] || [];

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.amber}>📜 सदाबहार सूत्र — चिरस्थायी ज्योतिष नियम</SectionLabel>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {STABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all"
            style={{
              background: tab === t.k ? `${t.c}20` : "rgba(255,255,255,.04)",
              color:      tab === t.k ? t.c        : "#475569",
              border:     tab === t.k ? `1.5px solid ${t.c}40` : "1px solid rgba(255,255,255,.08)",
              ...HI,
            }}>
            {t.l}
          </button>
        ))}
      </div>
      {sutras.map((s, i) => (
        <div key={i} className="p-3 rounded-xl mb-2"
          style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)" }}>
          <div className="text-[13px] font-black text-amber-400 mb-1" style={HI}>{s.title}</div>
          <div className="text-[12px] text-slate-300 mb-1" style={HI}>
            <span className="text-slate-500">🔑 शर्त: </span>{s.cond}
          </div>
          <div className="text-[12px] text-cyan-300 mb-1" style={HI}>
            <span className="text-slate-500">💡 कारण: </span>{s.logic}
          </div>
          <div className="text-[12px] text-green-300" style={HI}>
            <span className="text-slate-500">🛡️ उपाय: </span>{s.remedy}
          </div>
        </div>
      ))}
    </GlassCard>
  );
}


// ═══ MAIN ══════════════════════════════════════════════════
export default function SaturnPanel({ saturnData, punarjanmaData }) {
  return (
    <div className="pb-6 space-y-2">
      {/* [Fix ②] Section{} → CollapsibleSection from shared/ui */}
      <CollapsibleSection icon="🪐" title="शनि गोचर — साढ़े साती / ढैया"
        color={C.rose} defaultOpen={true}>
        <SadeSatiBlock data={saturnData} />
      </CollapsibleSection>

      <CollapsibleSection icon="🌟" title="गुरु गोचर — 12 भावों में फल"
        color={C.orange} defaultOpen={false}>
        <JupiterBlock saturnData={saturnData} />
      </CollapsibleSection>

      <CollapsibleSection icon="🔮" title="पुनर्जन्म विश्लेषण"
        color={C.indigo} defaultOpen={false}>
        <PunarjanmaBlock data={punarjanmaData} />
      </CollapsibleSection>

      <CollapsibleSection icon="📜" title="सदाबहार सूत्र — मेडिकल, मांगलिक, करियर, भाव नाश"
        color={C.amber} defaultOpen={false}>
        <SutrasBlock />
      </CollapsibleSection>
    </div>
  );
}