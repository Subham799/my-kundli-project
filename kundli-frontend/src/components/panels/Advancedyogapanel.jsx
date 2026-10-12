// AdvancedYogaPanel.jsx — विशेष योग विश्लेषण
// Vipreet, Neechbhang, Parivartana, Gajakesari, Lakshmi, Saraswati,
// Adhi, Amala, Chamara, Sankha + Combustion + Retrograde + Gandanta
//
// Refactoring Applied (v2.1):
//   [PERF]  framer-motion REMOVED — AnimatePresence/motion.div replaced with CSS transition
//   [Fix ②] Card{}  REMOVED → GlassCard  from shared/ui
//   [Fix ③] SLabel{} REMOVED → SectionLabel from shared/ui
//   [Fix ①] Bar{}  REMOVED → StrengthBar from shared/ui
//   [Fix ①] HI, C  local defs REMOVED → imported from designTokens
//   [Fix ⑦] chartData prop REMOVED → useKundliStore selector

import { useState } from "react";
import { GlassCard, SectionLabel, StrengthBar } from "../shared/ui";
import { HI, C } from "../shared/designTokens";
import useKundliStore from "../store/useKundliStore";

// ─── Yoga strength badge (no external dependency) ────────
function YBadge({ present, strength }) {
  if (present === undefined) return null;
  if (!present) return (
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500" style={HI}>
      नहीं
    </span>
  );
  const s = {
    strong: { bg: "rgba(34,211,238,.2)",  col: C.cyan,  l: "उच्च" },
    medium: { bg: "rgba(245,158,11,.2)",  col: C.amber, l: "मध्यम" },
    weak:   { bg: "rgba(148,163,184,.15)", col: "#94A3B8", l: "निम्न" },
  };
  const st = s[strength || "medium"];
  return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
      style={{ background: st.bg, color: st.col, ...HI }}>
      ✅ {st.l}
    </span>
  );
}

// ─── Yoga calculation helpers ─────────────────────────────
const getStrength = (planet) => {
  if (!planet) return null;
  const h       = planet.house;
  const dignity = planet.dignity || planet.Dignity || "";
  if (/उच्च|Uchcha|uchcha/i.test(dignity))  return "strong";
  if (/स्वराशि|Swa|swaRashi/i.test(dignity)) return "strong";
  if (/नीच|Neecha|neecha/i.test(dignity))    return "weak";
  if (/शत्रु|Shatru/i.test(dignity))          return "weak";
  if ([1, 4, 5, 7, 9, 10].includes(h))       return "medium";
  return "weak";
};
const inKendra   = h => [1, 4, 7, 10].includes(h);
const inTrikona  = h => [1, 5, 9].includes(h);
const inDusthana = h => [6, 8, 12].includes(h);

const PNAME = {
  Su: "सूर्य", Mo: "चंद्र", Ma: "मंगल", Me: "बुध",
  Ju: "गुरु",  Ve: "शुक्र", Sa: "शनि",  Ra: "राहु", Ke: "केतु",
};


// ════════ 1. VIPREET RAJYOGA ══════════════════════════════
function VipreetraBlock({ planets, houseLords }) {
  const p = planets || {}, hl = houseLords || {};
  const l6 = hl[6] || null, l8 = hl[8] || null, l12 = hl[12] || null;
  const h6 = l6 ? p[l6]?.house : null;
  const h8 = l8 ? p[l8]?.house : null;
  const h12 = l12 ? p[l12]?.house : null;

  const harsha = l6 && h6 && inDusthana(h6);
  const sarala  = l8 && h8 && inDusthana(h8);
  const vimala  = l12 && h12 && inDusthana(h12);

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.purple}>🔀 विपरीत राजयोग — तीन प्रकार</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(192,132,252,.08)", border: "1px solid rgba(192,132,252,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>विपरीत राजयोग क्या है?</strong> जब दुष्ट भावों (6, 8, 12वें) के स्वामी खुद दुष्ट भावों में चले जाएं — तो बुरे भाव एक-दूसरे को काटते हैं और शुभ फल देते हैं।
        </div>
      </div>
      {[
        { name: "हर्ष योग",  lord: `6ठे का स्वामी${l6 ? ` (${PNAME[l6] || l6})` : ""} 6/8/12 में`, present: harsha, color: C.teal,
          effect: "शत्रु खुद बर्बाद होंगे, रोग जल्दी ठीक होगा, कर्ज अपने आप चुकेगा",
          desc: `6वें का स्वामी${l6 ? ` ${PNAME[l6]}` : ""} ${h6 ? `${h6}वें में — दुष्ट भाव` : "—"} में है।` },
        { name: "सराल योग",  lord: `8वें का स्वामी${l8 ? ` (${PNAME[l8] || l8})` : ""} 6/8/12 में`,  present: sarala,  color: C.indigo,
          effect: "दीर्घायु, निडर, रहस्य विद्या में कुशल, अचानक धन लाभ",
          desc: `8वें का स्वामी${l8 ? ` ${PNAME[l8]}` : ""} ${h8 ? `${h8}वें में` : "—"}।` },
        { name: "विमल योग",  lord: `12वें का स्वामी${l12 ? ` (${PNAME[l12] || l12})` : ""} 6/8/12 में`, present: vimala,  color: C.green,
          effect: "व्यय कम, आत्मनिर्भर, विदेश में सफलता, मोक्ष के करीब",
          desc: `12वें का स्वामी${l12 ? ` ${PNAME[l12]}` : ""} ${h12 ? `${h12}वें में` : "—"}।` },
      ].map((y, i) => (
        <div key={i} className="p-3.5 rounded-xl mb-2"
          style={{ background: y.present ? `${y.color}10` : "rgba(255,255,255,.03)",
            border: `1.5px solid ${y.present ? y.color + "40" : "rgba(255,255,255,.08)"}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[14px] font-black" style={{ color: y.present ? y.color : "#475569", ...HI }}>{y.name}</span>
            <span className="text-[10px] text-slate-500 flex-1" style={HI}>— {y.lord}</span>
            <YBadge present={y.present} />
          </div>
          <div className="text-[11px] text-slate-400 mb-1" style={HI}>📖 {y.desc}</div>
          {y.present
            ? <div className="text-[12px] font-semibold" style={{ color: y.color, ...HI }}>✅ फल: {y.effect}</div>
            : <div className="text-[11px] text-slate-600" style={HI}>यह योग इस कुंडली में सक्रिय नहीं है</div>
          }
        </div>
      ))}
    </GlassCard>
  );
}


// ════════ 2. NEECH BHANG RAJYOGA ═════════════════════════
function NeechBhangBlock({ planets }) {
  const p = planets || {};

  const debilPlanets = Object.entries(p).filter(([, pd]) => {
    const dignity = pd?.dignity || pd?.Dignity || "";
    return /नीच|Neecha|neecha|Debil/i.test(dignity);
  });

  const nbResults = debilPlanets.map(([code, pd]) => {
    const h = pd.house;
    const conditions = [];
    if (inKendra(h)) conditions.push(`${PNAME[code] || code} स्वयं केंद्र (${h}वें) में`);
    const aspects = Object.entries(p).filter(([c2, p2]) => {
      if (c2 === code) return false;
      const dignity2 = p2?.dignity || p2?.Dignity || "";
      return /उच्च|Uchcha|स्वराशि|Swa/i.test(dignity2) && p2?.house && inKendra(p2.house);
    });
    if (aspects.length > 0)
      conditions.push(`उच्च ग्रह ${aspects.map(([c2]) => PNAME[c2] || c2).join(",")} केंद्र में`);
    const isNB     = conditions.length > 0;
    const strength = conditions.length >= 2 ? "strong" : conditions.length === 1 ? "medium" : "weak";
    return { code, planet: PNAME[code] || code, house: h, sign: pd.sign || "", conditions, isNB, strength };
  });

  const REMEDY = { Su:"सूर्य नमस्कार, माणिक्य", Mo:"सोमवार व्रत, मोती", Ma:"हनुमान पूजा, मूंगा",
    Ju:"गुरुवार व्रत, पुखराज", Ve:"शुक्रवार व्रत, हीरा", Sa:"शनिवार व्रत, नीलम (सावधानी)" };

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.orange}>🔄 नीचभंग राजयोग — नीच से उच्च</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>नीचभंग राजयोग क्या है?</strong> जब कोई ग्रह नीच हो, लेकिन उसकी नीचता रद्द हो जाए — तो वह बहुत शक्तिशाली बन जाता है। "गरीबी से अमीरी, अचानक उत्थान" इसका मुख्य फल है।
        </div>
      </div>
      {debilPlanets.length === 0
        ? <div className="text-center py-4 text-slate-500" style={HI}>इस कुंडली में कोई नीच ग्रह नहीं — शुभ संकेत!</div>
        : nbResults.map((r, i) => (
          <div key={i} className="p-3.5 rounded-xl mb-2"
            style={{ background: r.isNB ? "rgba(251,146,60,.1)" : "rgba(255,113,133,.05)",
              border: `1.5px solid ${r.isNB ? "rgba(251,146,60,.4)" : "rgba(251,113,133,.2)"}` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[14px] font-black"
                style={{ color: r.isNB ? C.orange : C.rose, ...HI }}>
                {r.planet} — {r.house}वें भाव में{r.sign ? ` (${r.sign} — नीच)` : ""}
              </span>
              <YBadge present={r.isNB} strength={r.strength} />
            </div>
            {r.isNB ? (
              <>
                <div className="text-[11px] text-orange-300 mb-1" style={HI}>नीचभंग की शर्तें पूरी:</div>
                {r.conditions.map((c2, j) => <div key={j} className="text-[11px] text-slate-300" style={HI}>✅ {c2}</div>)}
                <div className="mt-2 text-[12px] font-bold text-orange-400" style={HI}>
                  फल: गरीबी से अमीरी! {r.planet} नीचभंग से बहुत शक्तिशाली। अचानक उत्थान होगा।
                </div>
              </>
            ) : (
              <div className="text-[11px] text-rose-400" style={HI}>
                ⚠️ {r.planet} नीच है लेकिन नीचभंग की शर्त पूरी नहीं — {r.planet} से जुड़े विषयों में संघर्ष।
                <div className="mt-1 text-slate-500">उपाय: {REMEDY[r.code] || "नवग्रह शांति"}</div>
              </div>
            )}
          </div>
        ))
      }
    </GlassCard>
  );
}


// ════════ 3. PARIVARTANA YOGA ════════════════════════════
function ParivartanaBlock({ planets, houseLords }) {
  const p = planets || {}, hl = houseLords || {};
  const HOUSE_NAMES = { 1:"लग्न",2:"धन",3:"भाई",4:"सुख",5:"संतान",6:"रोग",
    7:"विवाह",8:"आयु",9:"भाग्य",10:"कर्म",11:"लाभ",12:"व्यय" };

  const exchanges = [];
  for (let h1 = 1; h1 <= 12; h1++) {
    const lord1 = hl[h1];
    if (!lord1 || !p[lord1]) continue;
    const lord1House = p[lord1].house;
    if (!lord1House) continue;
    const lord2 = hl[lord1House];
    if (!lord2 || !p[lord2]) continue;
    const lord2House = p[lord2].house;
    if (lord2House === h1 && h1 < lord1House) {
      const h1Bad = inDusthana(h1), h2Bad = inDusthana(lord1House);
      const type = (!h1Bad && !h2Bad) ? "maha" : (h1Bad && h2Bad) ? "dainya" : "khala";
      exchanges.push({ h1, h2: lord1House, lord1, lord2, type });
    }
  }

  const typeInfo = {
    maha:   { label: "महा परिवर्तन",   col: C.cyan,   effect: "दोनों केंद्र/त्रिकोण स्वामी — बहुत शुभ! दोनों भावों में उत्कृष्ट फल।" },
    khala:  { label: "खल परिवर्तन",   col: C.amber,  effect: "एक दुष्ट भाव शामिल — मिश्रित फल। कुछ लाभ, कुछ कष्ट।" },
    dainya: { label: "दैन्य परिवर्तन", col: C.rose,   effect: "दोनों दुष्ट भाव — कष्टकारक। विशेष उपाय जरूरी।" },
  };

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.teal}>🔁 परिवर्तन योग — भाव स्वामी विनिमय</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(45,212,191,.08)", border: "1px solid rgba(45,212,191,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>परिवर्तन योग क्या है?</strong> जब दो भावों के स्वामी एक-दूसरे के घर में चले जाएं — यह दो भावों को मजबूत करता है।
        </div>
      </div>
      {exchanges.length === 0
        ? <div className="text-center py-4 text-slate-500" style={HI}>इस कुंडली में कोई परिवर्तन योग नहीं मिला</div>
        : exchanges.map((ex, i) => {
          const ti = typeInfo[ex.type];
          return (
            <div key={i} className="p-3.5 rounded-xl mb-2"
              style={{ background: `${ti.col}10`, border: `1.5px solid ${ti.col}35` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[15px] font-black" style={{ color: ti.col, ...HI }}>{ti.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${ti.col}20`, color: ti.col, ...HI }}>
                  {ex.type === "maha" ? "✅ शुभ" : ex.type === "khala" ? "⚡ मध्यम" : "⚠️ कष्ट"}
                </span>
              </div>
              <div className="text-[13px] font-black text-white mb-1" style={HI}>
                {ex.h1}वाँ ({HOUSE_NAMES[ex.h1]}) ↔ {ex.h2}वाँ ({HOUSE_NAMES[ex.h2]})
              </div>
              <div className="text-[11px] text-slate-400 mb-2" style={HI}>
                {PNAME[ex.lord1] || ex.lord1} {ex.h2}वें में + {PNAME[ex.lord2] || ex.lord2} {ex.h1}वें में
              </div>
              <div className="text-[12px]" style={{ color: ti.col, ...HI }}>{ti.effect}</div>
            </div>
          );
        })
      }
    </GlassCard>
  );
}


// ════════ 4. GAJAKESARI YOGA ═════════════════════════════
function GajakesariBlock({ planets }) {
  const p = planets || {};
  const moH = p.Mo?.house, juH = p.Ju?.house;
  const moonToJu = moH && juH ? ((juH - moH + 12) % 12) : 99;
  const inKendraFromMoon = [1, 4, 7, 10].includes(moonToJu);
  const moAfflicted = p.Mo && (inDusthana(moH) || /नीच|Neecha/i.test(p.Mo.dignity || ""));
  const juAfflicted = p.Ju && (inDusthana(juH) || /नीच|Neecha/i.test(p.Ju.dignity || ""));
  const present  = inKendraFromMoon && !moAfflicted && !juAfflicted;
  const moStr    = getStrength(p.Mo);
  const juStr    = getStrength(p.Ju);
  const strength = present && moStr === "strong" && juStr === "strong" ? "strong" : present ? "medium" : "weak";

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.yellow}>👑 गजकेसरी योग — विस्तृत विश्लेषण</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(252,211,77,.08)", border: "1px solid rgba(252,211,77,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>गजकेसरी योग क्या है?</strong> जब चंद्र से गुरु केंद्र (1,4,7,10) में हो और दोनों पीड़ित न हों — राजा जैसा जीवन!
        </div>
      </div>
      <div className="p-4 rounded-xl mb-3"
        style={{ background: present ? "rgba(252,211,77,.12)" : "rgba(255,255,255,.04)",
          border: `1.5px solid ${present ? "rgba(252,211,77,.4)" : "rgba(255,255,255,.1)"}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{present ? "👑" : "—"}</span>
          <div className="flex-1">
            <div className="text-[15px] font-black"
              style={{ color: present ? C.yellow : "#475569", ...HI }}>
              गजकेसरी योग — {present ? `✅ ${strength === "strong" ? "पूर्ण बली" : strength === "medium" ? "मध्यम" : "सामान्य"}` : inKendraFromMoon ? "⚠️ आंशिक (पीड़ित)" : "❌ नहीं"}
            </div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              चंद्र {moH ? `${moH}वें` : "?"} + गुरु {juH ? `${juH}वें` : "?"} — चंद्र से गुरु = {moonToJu !== 99 ? `${moonToJu} स्थान` : "?"}
            </div>
          </div>
        </div>
        {[
          { cond: inKendraFromMoon, txt: `चंद्र से गुरु ${moonToJu !== 99 ? moonToJu + "वें" : ""} में — केंद्र में` },
          { cond: !moAfflicted,     txt: `चंद्र ${moAfflicted ? "पीड़ित ⚠️" : "शुभ ✅"}` },
          { cond: !juAfflicted,     txt: `गुरु ${juAfflicted ? "पीड़ित ⚠️" : "शुभ ✅"}` },
        ].map((c2, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
            <span style={{ color: c2.cond ? C.green : C.rose }}>{c2.cond ? "✅" : "❌"}</span>
            <span className="text-[11px] text-slate-300" style={HI}>{c2.txt}</span>
          </div>
        ))}
      </div>
      {present && (
        <div className="p-3 rounded-xl mb-3"
          style={{ background: "rgba(252,211,77,.08)", border: "1px solid rgba(252,211,77,.25)" }}>
          <div className="text-[12px] font-bold text-yellow-400 mb-2" style={HI}>✅ गजकेसरी फल:</div>
          {(strength === "strong"
            ? ["राजा जैसा जीवन — उच्च पद और प्रतिष्ठा", "जनता में बहुत प्रसिद्धि और सम्मान",
               "धन की कमी नहीं — सुखी परिवार", "बुद्धि और वाणी बहुत प्रभावशाली"]
            : ["सम्मानित और धनी जीवन", "समाज में प्रतिष्ठा", "अच्छी शिक्षा और करियर", "परिवार में सुख"]
          ).map((r, i) => <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>)}
        </div>
      )}
      {!present && inKendraFromMoon && (
        <div className="p-3 rounded-xl mb-3"
          style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)" }}>
          <div className="text-[12px] text-amber-400" style={HI}>⚠️ गुरु-चंद्र केंद्र में हैं लेकिन पीड़ित — योग कमजोर। उपाय करें।</div>
        </div>
      )}
      <div className="p-3 rounded-xl"
        style={{ background: "rgba(252,211,77,.06)", border: "1px solid rgba(252,211,77,.2)" }}>
        <div className="text-[11px] font-bold text-yellow-400 mb-1.5" style={HI}>गजकेसरी मजबूत करने के उपाय:</div>
        {["गुरुवार व्रत — गुरु को मजबूत करें", "पुखराज रत्न (ज्योतिषी की सलाह से)",
          "सोमवार व्रत — चंद्र उपाय", "गाय को सोमवार दूध पिलाएं",
          "गुरु मंत्र: ॐ गुं गुरवे नमः — 108 बार"].map((r, i) => (
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </GlassCard>
  );
}


// ════════ 5. SPECIAL YOGAS ═══════════════════════════════
function SpecialYogasBlock({ planets, houseLords, lagna }) {
  const p = planets || {}, hl = houseLords || {};

  const l9 = hl[9], h9 = l9 ? p[l9]?.house : null;

  const lakshmiFn = () => {
    const cond1 = h9 && (inKendra(h9) || inTrikona(h9));
    const veH = p.Ve?.house, veStr = p.Ve?.dignity || "";
    const cond2 = veH && (inKendra(veH) || /उच्च|Uchcha|स्वराशि/i.test(veStr));
    return { present: cond1 && cond2,
      desc: `9वें का स्वामी${l9 ? ` (${PNAME[l9]})` : ""} ${h9 ? `${h9}वें में` : ""} + शुक्र ${veH ? `${veH}वें में` : "—"}` };
  };

  const sarasvatiFn = () => {
    const juH = p.Ju?.house, veH = p.Ve?.house, meH = p.Me?.house;
    const cond = juH && veH && meH && (inKendra(juH) || inTrikona(juH)) &&
      (inKendra(veH) || inTrikona(veH)) && (inKendra(meH) || inTrikona(meH));
    return { present: !!cond,
      desc: `गुरु ${juH ? `${juH}वें` : "—"} + शुक्र ${veH ? `${veH}वें` : "—"} + बुध ${meH ? `${meH}वें` : "—"}` };
  };

  const adhiFn = () => {
    const moH = p.Mo?.house;
    if (!moH) return { present: false, desc: "चंद्र स्थिति अज्ञात" };
    const in678 = ["Ju", "Ve", "Me"].filter(b => {
      const bH = p[b]?.house; if (!bH) return false;
      return [6, 7, 8].includes(((bH - moH + 12) % 12) + 1);
    });
    return { present: in678.length >= 2, desc: `चंद्र ${moH}वें से ${in678.length > 0 ? in678.map(b => PNAME[b]).join(",") + " = " + in678.length + " शुभ ग्रह" : "कोई शुभ ग्रह नहीं"} 6/7/8वें में` };
  };

  const amalaFn = () => {
    const in10 = ["Ju", "Ve", "Me", "Mo"].some(b => p[b]?.house === 10);
    return { present: in10, desc: ["Ju", "Ve", "Me", "Mo"].filter(b => p[b]?.house === 10).map(b => PNAME[b]).join(",") + (in10 ? " 10वें भाव में — शुभ" : "10वें में कोई शुभ ग्रह नहीं") };
  };

  const chamaraFn = () => {
    const l1 = hl[1], lp = l1 ? p[l1] : null;
    if (!lp) return { present: false, desc: "लग्नेश की जानकारी नहीं" };
    const isUchcha = /उच्च|Uchcha/i.test(lp.dignity || "");
    const inKen = inKendra(lp.house);
    return { present: isUchcha && inKen, desc: `लग्नेश ${l1 ? (PNAME[l1] || l1) : "—"} ${lp.house ? `${lp.house}वें में` : "—"} — ${isUchcha ? "उच्च" : "उच्च नहीं"} + ${inKen ? "केंद्र में" : "केंद्र में नहीं"}` };
  };

  const sankhaFn = () => {
    const l5 = hl[5], l6 = hl[6], h5 = l5 ? p[l5]?.house : null, h6 = l6 ? p[l6]?.house : null;
    const mutual = h5 && h6 && inKendra(h5) && inKendra(h6);
    return { present: !!mutual, desc: `5वें का स्वामी ${l5 ? (PNAME[l5] || l5) : "—"} ${h5 ? `${h5}वें` : "—"} + 6ठे का स्वामी ${l6 ? (PNAME[l6] || l6) : "—"} ${h6 ? `${h6}वें` : "—"} — ${mutual ? "दोनों केंद्र में" : "—"}` };
  };

  const YOGAS = [
    { name: "लक्ष्मी योग",   icon: "💰", color: C.green,  ...lakshmiFn(),   effect: "अपार धन और ऐश्वर्य।",          why: "9वां भाव = भाग्य + शुक्र = धन — दोनों मजबूत।" },
    { name: "सरस्वती योग",   icon: "📚", color: C.blue,   ...sarasvatiFn(), effect: "उच्च विद्वान, लेखक, वक्ता।",    why: "गुरु + शुक्र + बुध — ज्ञान + सौंदर्य + बुद्धि।" },
    { name: "आधि योग",       icon: "⭐", color: C.cyan,   ...adhiFn(),      effect: "नेतृत्व शक्ति, मंत्री/सलाहकार।", why: "चंद्र के सामने शुभ ग्रह = मन को शुभता घेरती है।" },
    { name: "अमल योग",       icon: "🌟", color: C.teal,   ...amalaFn(),     effect: "स्थायी प्रसिद्धि, पुण्यात्मा।",  why: "10वें (कर्म) में शुभ ग्रह = कर्म शुद्ध।" },
    { name: "चामर योग",      icon: "👑", color: C.purple, ...chamaraFn(),   effect: "राजकीय जीवन, उच्च पद।",         why: "लग्नेश उच्च + केंद्र = व्यक्तित्व का शिखर।" },
    { name: "शंख योग",       icon: "🐚", color: C.amber,  ...sankhaFn(),    effect: "धार्मिक, दानी, न्यायप्रिय।",     why: "5वां + 6ठा स्वामी केंद्र में = सेवाभाव + बुद्धि।" },
  ];

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.yellow}>✨ विशेष राजयोग — 6 प्रकार</SectionLabel>
      {YOGAS.map((y, i) => (
        <div key={i} className="p-3.5 rounded-xl mb-2"
          style={{ background: y.present ? `${y.color}10` : "rgba(255,255,255,.03)",
            border: `1.5px solid ${y.present ? y.color + "40" : "rgba(255,255,255,.07)"}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[18px]">{y.icon}</span>
            <span className="text-[14px] font-black" style={{ color: y.present ? y.color : "#475569", ...HI }}>{y.name}</span>
            <YBadge present={y.present} />
          </div>
          <div className="text-[11px] text-slate-500 mb-1" style={HI}>📖 क्यों? {y.why}</div>
          <div className="text-[11px] text-slate-400 mb-1" style={HI}>📊 स्थिति: {y.desc}</div>
          {y.present
            ? <div className="text-[12px] font-semibold" style={{ color: y.color, ...HI }}>✅ फल: {y.effect}</div>
            : <div className="text-[11px] text-slate-600" style={HI}>यह योग इस कुंडली में सक्रिय नहीं है</div>
          }
        </div>
      ))}
    </GlassCard>
  );
}


// ════════ 6. COMBUSTION ══════════════════════════════════
const COMBUST_ORBS = { Mo:12, Ma:17, Me:14, Ju:11, Ve:10, Sa:15 };
const COMBUST_FX   = {
  Mo: "मन अशांत, माता को कष्ट, आत्मविश्वास कम।",
  Ma: "साहस कम, भाई से झगड़ा, दुर्घटना का खतरा।",
  Me: "बुद्धि पर प्रभाव, व्यापार में धोखा।",
  Ju: "गुरु-ज्ञान कम, विवाह देरी, संतान में कठिनाई।",
  Ve: "प्रेम में कष्ट, विवाह देरी, मधुमेह का जोखिम।",
  Sa: "शनि की मेहनत बाधित, कर्ज, देरी।",
};
const COMBUST_REMEDY = {
  Ve: "शुक्र मंत्र + शुक्रवार व्रत", Me: "बुध मंत्र + बुधवार व्रत",
  Ju: "गुरु मंत्र + गुरुवार व्रत",   Ma: "हनुमान चालीसा + मंगलवार",
  Mo: "सोमवार व्रत + चंद्र उपाय",
};

function CombustionBlock({ planets }) {
  const p = planets || {};
  const suH = p.Su?.house;

  const combusted = Object.keys(COMBUST_ORBS).filter(c => p[c]).map(code => {
    const ph = p[code]?.house;
    if (!ph || !suH) return null;
    const diff = Math.abs(ph - suH);
    const proximate = diff <= 1 || diff >= 11;
    return proximate ? { code, planet: PNAME[code], house: ph, suHouse: suH, orb: COMBUST_ORBS[code] } : null;
  }).filter(Boolean);

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.orange}>☀️ अस्त ग्रह (Combustion) विश्लेषण</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>अस्त ग्रह क्या है?</strong> जब ग्रह सूर्य के बहुत पास हो — उसकी शक्ति बहुत कम हो जाती है। सूर्य {suH ? `अभी ${suH}वें भाव में` : "—"} है।
        </div>
      </div>
      {combusted.length > 0 ? combusted.map((r, i) => (
        <div key={i} className="p-3.5 rounded-xl mb-2"
          style={{ background: "rgba(251,146,60,.1)", border: "1.5px solid rgba(251,146,60,.35)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[14px] font-black text-orange-400" style={HI}>⚠️ {r.planet} — अस्त संभव</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold" style={HI}>जांचें</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1" style={HI}>
            {r.planet} {r.house}वें + सूर्य {r.suHouse}वें — निकट भाव। सीमा: {r.orb}°
          </div>
          <div className="text-[12px] text-orange-300" style={HI}>{COMBUST_FX[r.code] || ""}</div>
          <div className="mt-2 text-[11px] text-slate-500" style={HI}>
            उपाय: {COMBUST_REMEDY[r.code] || "नवग्रह शांति"}
          </div>
        </div>
      )) : (
        <div className="text-center py-3 text-slate-500" style={HI}>
          कोई स्पष्ट अस्त ग्रह नहीं — शुभ संकेत।
        </div>
      )}
      <div className="p-3 rounded-xl mt-2"
        style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>📏 अस्त की सीमा (Orb):</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(COMBUST_ORBS).map(([c, orb]) => (
            <div key={c} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,.04)" }}>
              <div className="text-[11px] font-bold text-slate-400" style={HI}>{PNAME[c]}</div>
              <div className="text-[10px] text-slate-600">{orb}° के अंदर</div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}


// ════════ 7. RETROGRADE ══════════════════════════════════
const RETRO_FX = {
  Me: { name: "बुध वक्री",  icon: "☿", color: C.green,
    effects: ["संचार में समस्याएं", "Technology में खराबी", "पुराने लोग वापस आते हैं", "Contract में देरी"],
    remedies: ["बुध मंत्र: ॐ बुं बुधाय नमः", "हरे रंग का उपयोग", "बुधवार व्रत"] },
  Ju: { name: "गुरु वक्री", icon: "♃", color: C.yellow,
    effects: ["आंतरिक ज्ञान बढ़ता है", "शिक्षण क्षमता उत्कृष्ट", "संतान मामलों में देरी"],
    remedies: ["गुरु मंत्र", "गुरुवार व्रत", "पुखराज (सलाह से)"] },
  Sa: { name: "शनि वक्री", icon: "♄", color: C.indigo,
    effects: ["पिछले कर्म सामने आते हैं", "जिम्मेदारी बढ़ती है", "पुरानी बाधाएं दूर होती हैं"],
    remedies: ["शनि मंत्र", "शनिवार व्रत", "काले तिल दान"] },
  Ve: { name: "शुक्र वक्री", icon: "♀", color: C.pink,
    effects: ["पुराने प्रेमी वापस", "रिश्तों पर पुनर्विचार", "पैसे का प्रवाह अनिश्चित"],
    remedies: ["शुक्र मंत्र", "शुक्रवार व्रत", "सफेद चीजें दान"] },
  Ma: { name: "मंगल वक्री", icon: "♂", color: C.rose,
    effects: ["ऊर्जा में उतार-चढ़ाव", "क्रोध पर नियंत्रण जरूरी", "Surgery से बचें"],
    remedies: ["हनुमान चालीसा", "मंगलवार व्रत", "लाल मूंगा (सलाह से)"] },
};

function RetrogradeBlock({ planets }) {
  const p = planets || {};
  const retros = Object.entries(p).filter(([, pd]) =>
    pd?.retrograde || pd?.Retrograde || /वक्री|Vakri|Retro/i.test(pd?.dignity || pd?.Dignity || "")
  );

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.indigo}>🔄 वक्री ग्रह (Retrograde) विश्लेषण</SectionLabel>
      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(129,140,248,.08)", border: "1px solid rgba(129,140,248,.2)" }}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 <strong>वक्री ग्रह क्या है?</strong> जब ग्रह उल्टा चलने लगे — वह अपने प्रभाव को "अंदर की ओर" मोड़ देता है।
        </div>
      </div>
      {retros.length > 0 ? retros.map(([code, pd]) => {
        const rfx = RETRO_FX[code];
        if (!rfx) return null;
        return (
          <div key={code} className="p-3.5 rounded-xl mb-2"
            style={{ background: `${rfx.color}10`, border: `1.5px solid ${rfx.color}35` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[22px]">{rfx.icon}</span>
              <div>
                <div className="text-[14px] font-black" style={{ color: rfx.color, ...HI }}>
                  {rfx.name} — {pd.house}वें भाव में
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-full inline-block"
                  style={{ background: `${rfx.color}20`, color: rfx.color, ...HI }}>🔄 वक्री</div>
              </div>
            </div>
            <div className="text-[11px] font-bold mb-1" style={{ color: rfx.color, ...HI }}>प्रभाव:</div>
            {rfx.effects.map((e, j) => <div key={j} className="text-[11px] text-slate-300" style={HI}>• {e}</div>)}
            <div className="p-2 rounded-lg mt-2" style={{ background: `${rfx.color}08` }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: rfx.color, ...HI }}>उपाय:</div>
              {rfx.remedies.map((r, j) => <div key={j} className="text-[11px] text-slate-400" style={HI}>• {r}</div>)}
            </div>
          </div>
        );
      }) : (
        <div className="text-center py-4 text-slate-500" style={HI}>
          इस कुंडली में कोई वक्री ग्रह नहीं — या डेटा उपलब्ध नहीं।
        </div>
      )}
      <div className="mt-2 p-3 rounded-xl"
        style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>सामान्य वक्री नियम:</div>
        {["6/8/12 के स्वामी वक्री हों तो Vipreet Rajyoga जैसा फल",
          "वक्री ग्रह नीच में हो — तो शक्ति बढ़ जाती है",
          "गोचर में वक्री ग्रह आए तो नए काम शुरू करने से बचें"].map((r, i) => (
          <div key={i} className="text-[11px] text-slate-400" style={HI}>• {r}</div>
        ))}
      </div>
    </GlassCard>
  );
}


// ════════ 8. GANDANTA ════════════════════════════════════
const GANDANTA_JUNCTIONS = [
  { from: "मीन→मेष",      type: "जल→अग्नि", karma: "जीवन परिवर्तन, मोक्ष की ओर" },
  { from: "कर्क→सिंह",   type: "जल→अग्नि", karma: "भावनात्मक से नेतृत्व की ओर" },
  { from: "वृश्चिक→धनु", type: "जल→अग्नि", karma: "रहस्य से ज्ञान की ओर" },
];
const GANDANTA_SIGNS = ["Meena","Mesha","Karka","Simha","Vrischika","Dhanu",
  "Pisces","Aries","Cancer","Leo","Scorpio","Sagittarius"];

function GandantaBlock({ planets }) {
  const p = planets || {};
  const moH = p.Mo?.house || 0, raH = p.Ra?.house || 0;
  const bBindu = moH && raH ? (Math.round(((moH + raH) / 2 + 0.5) % 12) || 12) : null;

  const gandantaPs = Object.entries(p).filter(([, pd]) => {
    const sign = pd?.sign || pd?.rashi || "";
    return GANDANTA_SIGNS.some(gs => sign.toLowerCase().includes(gs.toLowerCase()));
  });

  return (
    <GlassCard className="p-4">
      <SectionLabel color={C.rose}>🌀 गंडांत + संधि + भृगु बिंदु</SectionLabel>

      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(251,113,133,.08)", border: "1px solid rgba(251,113,133,.2)" }}>
        <div className="text-[13px] font-black text-rose-400 mb-2" style={HI}>🌀 गंडांत — जल-अग्नि संधि</div>
        <div className="text-[11px] text-slate-400 mb-2" style={HI}>
          💡 गंडांत = जल राशि और अग्नि राशि की सीमा पर ग्रह। अत्यंत संवेदनशील स्थान।
        </div>
        {gandantaPs.length > 0 ? gandantaPs.map(([c, pd]) => (
          <div key={c} className="flex items-start gap-2 p-2.5 rounded-xl mb-1.5"
            style={{ background: "rgba(251,113,133,.08)", border: "1px solid rgba(251,113,133,.2)" }}>
            <span className="text-[13px] font-black text-rose-400">{PNAME[c] || c}</span>
            <div>
              <div className="text-[11px] text-slate-300" style={HI}>{pd.house}वें भाव में ({pd.sign || "?"} राशि)</div>
              <div className="text-[11px] text-rose-400" style={HI}>⚡ गंडांत — जीवन में आत्मिक परिवर्तन का संकेत।</div>
            </div>
          </div>
        )) : <div className="text-[11px] text-slate-500" style={HI}>कोई ग्रह स्पष्ट गंडांत में नहीं</div>}
        <div className="mt-2">
          {GANDANTA_JUNCTIONS.map((j, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-rose-400 flex-shrink-0">{j.from}</span>
              <span className="text-[10px] text-slate-500 flex-1" style={HI}>{j.type} = {j.karma}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl mb-3"
        style={{ background: "rgba(129,140,248,.08)", border: "1px solid rgba(129,140,248,.2)" }}>
        <div className="text-[12px] font-black text-indigo-400 mb-1.5" style={HI}>🔸 संधि — राशि संधि बिंदु</div>
        <div className="text-[11px] text-slate-400" style={HI}>
          संधि = किसी राशि के पहले 3° या अंतिम 3° में ग्रह। फल देरी से और कमजोर।
          उपाय: उस ग्रह की पूजा-पाठ से शक्ति दें।
        </div>
      </div>

      <div className="p-3 rounded-xl"
        style={{ background: "rgba(252,211,77,.08)", border: "1px solid rgba(252,211,77,.2)" }}>
        <div className="text-[12px] font-black text-yellow-400 mb-1.5" style={HI}>⚡ भृगु बिंदु — चंद्र-राहु मध्यबिंदु</div>
        <div className="text-[11px] text-slate-400 mb-2" style={HI}>
          भृगु बिंदु = चंद्र ({moH ? `${moH}वाँ` : "-"}) + राहु ({raH ? `${raH}वाँ` : "-"}) का मध्यबिंदु = {bBindu ? `${bBindu}वाँ भाव` : "—"}
        </div>
        {bBindu && (
          <div className="text-[12px] text-yellow-400" style={HI}>
            ⚡ {bBindu}वाँ भाव आपका भृगु बिंदु है। जब भी कोई गोचर ग्रह यहाँ आए — महत्वपूर्ण घटना होती है।
          </div>
        )}
        <div className="mt-2 text-[11px] text-slate-500" style={HI}>
          यह बिंदु = आपके जीवन का "ट्रिगर पॉइंट"।
        </div>
      </div>
    </GlassCard>
  );
}


// ════════ MAIN COMPONENT ═════════════════════════════════
const MAIN_TABS = [
  { k: "vipreet", l: "🔀 विपरीत",  color: C.purple },
  { k: "neech",   l: "🔄 नीचभंग",  color: C.orange },
  { k: "pariv",   l: "🔁 परिवर्तन", color: C.teal   },
  { k: "gaja",    l: "👑 गजकेसरी", color: C.yellow },
  { k: "special", l: "✨ विशेष",    color: C.green  },
  { k: "combust", l: "☀️ अस्त",    color: C.orange },
  { k: "retro",   l: "🔄 वक्री",    color: C.indigo },
  { k: "gand",    l: "🌀 गंडांत",   color: C.rose   },
];

export default function AdvancedYogaPanel() {
  // [Fix ⑦] chartData prop REMOVED → useKundliStore selector
  const chartData = useKundliStore(s => s.chartData);
  const [tab, setTab] = useState("vipreet");

  const pl    = chartData?.planets    || {};
  const hl    = chartData?.houseLords || chartData?.house_lords || {};
  const lagna = chartData?.lagna      || 0;

  const renderTab = () => {
    switch (tab) {
      case "vipreet": return <VipreetraBlock   planets={pl} houseLords={hl} />;
      case "neech":   return <NeechBhangBlock  planets={pl} />;
      case "pariv":   return <ParivartanaBlock planets={pl} houseLords={hl} />;
      case "gaja":    return <GajakesariBlock  planets={pl} />;
      case "special": return <SpecialYogasBlock planets={pl} houseLords={hl} lagna={lagna} />;
      case "combust": return <CombustionBlock  planets={pl} />;
      case "retro":   return <RetrogradeBlock  planets={pl} />;
      case "gand":    return <GandantaBlock    planets={pl} />;
      default:        return null;
    }
  };

  return (
    <div className="pb-8">
      {/* Scrollable tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: "none" }}>
        {MAIN_TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-black transition-all"
            style={{
              background: tab === t.k ? `${t.color}20` : "rgba(255,255,255,.04)",
              color:      tab === t.k ? t.color         : "#475569",
              border:     tab === t.k ? `2px solid ${t.color}45` : "1px solid rgba(255,255,255,.07)",
              ...HI,
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* [PERF] AnimatePresence/motion.div REMOVED — CSS transition replaces it */}
      <div key={tab} style={{ transition: "opacity 0.15s ease" }}>
        {renderTab()}
      </div>
    </div>
  );
}