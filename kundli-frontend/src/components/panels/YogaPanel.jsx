// YogaPanel.jsx — 50+ Yoga + Pancha Mahapurush + Rajyoga
// ── DRY: ALL primitives come from shared/ui & shared/designTokens ──────────
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PLANET_META } from "../../constants";
import {
  CardBlock, SectionLabel, CollapsibleSection,
  PlanetChip, StatusPill, EmptyState,
} from "../shared/ui";
import { HI, C, PH } from "../shared/designTokens";

// ─────────────────────────────────────────────────────────────
// YOGA CATEGORIES (engine data keys → display meta)
// ─────────────────────────────────────────────────────────────
const YOGA_CATEGORIES = {
  raja_yogas:               { label: "राज योग",        icon: "👑", color: "#F59E0B" },
  dhana_yogas:              { label: "धन योग",         icon: "💰", color: "#34D399" },
  pancha_mahapurusha_yogas: { label: "पंच महापुरुष",  icon: "⭐", color: "#22D3EE" },
  chandra_yogas:            { label: "चंद्र योग",      icon: "🌙", color: "#A5B4FC" },
  neecha_bhanga_raja_yoga:  { label: "नीचभंग राजयोग", icon: "🔄", color: "#FB923C" },
  viparita_raja_yogas:      { label: "विपरीत राजयोग", icon: "🔀", color: "#C084FC" },
  arishta_yogas:            { label: "अरिष्ट योग",     icon: "⚠️", color: "#FB7185" },
  special_yogas:            { label: "विशेष योग",       icon: "✨", color: "#67E8F9" },
};

const STRENGTH_STYLE = {
  उच्च:   { bg:"rgba(34,211,238,.1)",   border:"rgba(34,211,238,.3)",   text:"#22D3EE" },
  मध्यम:  { bg:"rgba(245,158,11,.1)",  border:"rgba(245,158,11,.3)",  text:"#F59E0B" },
  निम्न:  { bg:"rgba(148,163,184,.08)",border:"rgba(148,163,184,.2)", text:"#94A3B8" },
  high:   { bg:"rgba(34,211,238,.1)",   border:"rgba(34,211,238,.3)",   text:"#22D3EE" },
  medium: { bg:"rgba(245,158,11,.1)",  border:"rgba(245,158,11,.3)",  text:"#F59E0B" },
  low:    { bg:"rgba(148,163,184,.08)",border:"rgba(148,163,184,.2)", text:"#94A3B8" },
};
const ss = (s) => STRENGTH_STYLE[s] || STRENGTH_STYLE["निम्न"];

// ─────────────────────────────────────────────────────────────
// ENGINE-DRIVEN YOGA CARD  (from backend yogas data)
// ─────────────────────────────────────────────────────────────
function YogaCard({ yoga, isArishta }) {
  const [open, setOpen] = useState(false);
  const st  = ss(yoga.strength);
  const borderCol = isArishta ? "rgba(251,113,133,.2)" : st.border;
  const bgCol     = isArishta ? "rgba(251,113,133,.04)" : "rgba(10,14,32,.92)";

  return (
    <motion.div layout className="rounded-xl border overflow-hidden"
      style={{ background: bgCol, borderColor: borderCol }}>
      <div className="px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setOpen((o) => !o)}>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black text-white" style={HI}>{yoga.name || yoga.name_en}</div>
          {yoga.effect && (
            <div className="text-[9px] mt-0.5"
              style={{ color: isArishta ? "#FB7185" : "#22D3EE", ...HI }}>
              {yoga.effect}
            </div>
          )}
        </div>

        {yoga.strength && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text, ...HI }}>
            {yoga.strength}
          </span>
        )}

        {/* Planet chips — reusing PlanetChip */}
        {yoga.planets?.length > 0 && (
          <div className="flex gap-1 flex-shrink-0">
            {yoga.planets.map((p) => <PlanetChip key={p} code={p} />)}
          </div>
        )}

        {open ? <ChevronUp size={11} className="text-slate-600 flex-shrink-0" />
               : <ChevronDown size={11} className="text-slate-600 flex-shrink-0" />}
      </div>

      <AnimatePresence>
        {open && yoga.description && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="px-3 pb-2.5 text-[9px] text-slate-400 leading-relaxed border-t border-white/5"
            style={HI}>
            <div className="pt-2">{yoga.description}</div>
            {yoga.name_en && yoga.name_en !== yoga.name && (
              <div className="mt-1 text-slate-600 font-mono text-[8px]">{yoga.name_en}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Category block — uses CollapsibleSection (variant="category")
function CategoryBlock({ catKey, yogas }) {
  const cat      = YOGA_CATEGORIES[catKey] || { label: catKey, icon: "•", color: "#94A3B8" };
  const isArishta = catKey === "arishta_yogas";
  if (!yogas?.length) return null;

  return (
    <CollapsibleSection
      variant="category"
      icon={cat.icon}
      title={cat.label}
      badge={yogas.length}
      color={cat.color}
      defaultOpen={true}
    >
      {yogas.map((yoga, i) => <YogaCard key={i} yoga={yoga} isArishta={isArishta} />)}
    </CollapsibleSection>
  );
}

// ─────────────────────────────────────────────────────────────
// PANCHA MAHAPURUSH  (frontend-computed)
// ─────────────────────────────────────────────────────────────
const MAHA_YOGAS = [
  { id:"hamsa",   planet:"Ju", name:"हंस योग",   icon:"🦢", color:C.cyan,
    condition:"गुरु केंद्र (1,4,7,10) में + धनु/मीन/कर्क राशि",
    signs:["Sagittarius","Pisces","Cancer"],
    effect:"धार्मिक, विद्वान, धनी, सम्मानित, दयालु",
    physical:"सुंदर चेहरा, कमल जैसी आंखें, गोरा रंग",
    lifespan:"105 वर्ष", special:"गुरु जिस घर में हो — उस भाव का फल 100 गुना बढ़ता है" },
  { id:"malavya", planet:"Ve", name:"मालव्य योग", icon:"💎", color:C.pink,
    condition:"शुक्र केंद्र (1,4,7,10) में + वृषभ/तुला/मीन राशि",
    signs:["Taurus","Libra","Pisces"],
    effect:"सुखी, वाहन, संपत्ति, सुंदर जीवनसाथी, विलासी",
    physical:"आकर्षक व्यक्तित्व, चमकदार त्वचा",
    lifespan:"77 वर्ष", special:"शुक्र की राशि में विवाह सुखी, कला में सफलता" },
  { id:"sasha",   planet:"Sa", name:"शश योग",    icon:"🪨", color:C.indigo,
    condition:"शनि केंद्र (1,4,7,10) में + मकर/कुंभ/तुला राशि",
    signs:["Capricorn","Aquarius","Libra"],
    effect:"कठिन परिश्रम से सफलता, नेता, दीर्घायु",
    physical:"मजबूत शरीर, गंभीर स्वभाव, काला रंग",
    lifespan:"70 वर्ष", special:"शनि की दशा में सर्वोच्च उन्नति" },
  { id:"ruchaka", planet:"Ma", name:"रुचक योग",  icon:"⚔️", color:C.rose,
    condition:"मंगल केंद्र (1,4,7,10) में + मेष/वृश्चिक/मकर राशि",
    signs:["Aries","Scorpio","Capricorn"],
    effect:"साहसी, योद्धा, सेना/पुलिस में सफल, देशभक्त",
    physical:"मजबूत, लाल रंग, तीखे नैन-नक्श",
    lifespan:"60 वर्ष", special:"मंगल की दशा में भूमि/संपत्ति लाभ" },
  { id:"bhadra",  planet:"Me", name:"भद्र योग",  icon:"🧠", color:C.green,
    condition:"बुध केंद्र (1,4,7,10) में + मिथुन/कन्या राशि",
    signs:["Gemini","Virgo"],
    effect:"बुद्धिमान, वक्ता, लेखक, व्यापारी, अनुकूलनशील",
    physical:"तेज दिमाग, लंबी नाक, पतला शरीर",
    lifespan:"85 वर्ष", special:"बुध की दशा में व्यापार में जबरदस्त सफलता" },
];

function checkMahapurush(planet, chartPlanets) {
  if (!chartPlanets?.[planet]) return false;
  const p = chartPlanets[planet];
  const rashi = p.Vargas?.D1?.Rashi || p.rashi || "";
  const yoga  = MAHA_YOGAS.find((y) => y.planet === planet);
  return yoga &&
    [1,4,7,10].includes(p.house) &&
    yoga.signs.some((s) => rashi.toLowerCase().includes(s.toLowerCase()));
}

function MahapurushBlock({ chartPlanets }) {
  const results = MAHA_YOGAS.map((y) => ({ ...y, present: checkMahapurush(y.planet, chartPlanets) }));
  const found   = results.filter((y) => y.present);

  return (
    <>
      {found.length === 5 && (
        <div className="p-4 rounded-2xl mb-4"
          style={{ background:"linear-gradient(135deg,rgba(245,158,11,.15),rgba(34,211,238,.1))", border:"2px solid rgba(245,158,11,.5)" }}>
          <div className="text-[18px] font-black text-amber-400 mb-1" style={HI}>🌟 पंच महापुरुष योग! (अत्यंत दुर्लभ)</div>
          <div className="text-[13px] text-slate-200" style={HI}>सभी 5 महापुरुष योग — महान राजा या युग पुरुष का जीवन!</div>
        </div>
      )}
      {found.length > 0 && found.length < 5 && (
        <div className="p-3 rounded-2xl mb-3" style={{ background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.3)" }}>
          <div className="text-[14px] font-black text-green-400" style={HI}>✅ {found.length} महापुरुष योग मिले!</div>
        </div>
      )}
      {results.map((y) => (
        <div key={y.id} className="p-4 rounded-2xl mb-3"
          style={{ background: y.present ? `${y.color}10` : "rgba(255,255,255,.02)",
            border: `1.5px solid ${y.present ? y.color+"40" : "rgba(255,255,255,.08)"}` }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[24px]">{y.icon}</span>
            <div className="flex-1">
              <div className="text-[15px] font-black" style={{ color: y.present ? y.color : "#475569", ...HI }}>
                {y.name} {y.present ? "✅" : "—"}
              </div>
              <div className="text-[11px]" style={{ color: y.present ? y.color+"99" : "#334155", ...HI }}>
                {PH[y.planet]}
              </div>
            </div>
            {y.present && <StatusPill color={y.color}>सक्रिय</StatusPill>}
          </div>
          {y.present ? (
            <>
              <div className="text-[12px] text-slate-400 mb-2" style={HI}>🔑 {y.condition}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background:`${y.color}08` }}>
                  <div className="text-[11px] font-bold mb-1" style={{ color:y.color, ...HI }}>✨ जीवन फल:</div>
                  <div className="text-[12px] text-slate-200" style={HI}>{y.effect}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/4">
                  <div className="text-[11px] font-bold text-slate-400 mb-1" style={HI}>👤 शारीरिक:</div>
                  <div className="text-[12px] text-slate-300" style={HI}>{y.physical}</div>
                </div>
              </div>
              <div className="mt-2 p-2 rounded-xl" style={{ background:`${y.color}08` }}>
                <div className="text-[12px] text-slate-200" style={HI}>⭐ {y.special} | आयु: {y.lifespan}</div>
              </div>
            </>
          ) : (
            <div className="text-[12px] text-slate-600" style={HI}>{y.condition}</div>
          )}
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// RAJYOGA  (frontend-computed)
// ─────────────────────────────────────────────────────────────
function checkNeechBhang(planet, p) {
  const debilSigns = { Su:"Libra",Mo:"Scorpio",Ma:"Cancer",Me:"Pisces",Ju:"Capricorn",Ve:"Virgo",Sa:"Aries" };
  const rashi = p.Vargas?.D1?.Rashi || p.rashi || "";
  return debilSigns[planet] &&
    (rashi.includes(debilSigns[planet]) || /नीच/.test(p.Dignity || "")) &&
    [1,4,7,10].includes(p.house);
}

function RajyogaBlock({ chartPlanets }) {
  const p = chartPlanets || {};
  const yogas = [];

  // Gajakesari
  if (p.Ju && p.Mo) {
    const norm = Math.min(Math.abs(p.Ju.house - p.Mo.house), 12 - Math.abs(p.Ju.house - p.Mo.house));
    yogas.push([0,3,6,9].includes(norm)
      ? { n:"गजकेसरी योग", c:C.cyan, icon:"🐘", present:true,
          effect:"राजा जैसा जीवन, धनी, प्रसिद्ध",
          reason:`गुरु ${p.Ju.house}वें + चंद्र ${p.Mo.house}वें — केंद्र में` }
      : { n:"गजकेसरी योग", c:C.cyan, icon:"🐘", present:false, effect:"गुरु-चंद्र केंद्र में नहीं", reason:"" });
  }
  // Lakshmi
  yogas.push(p.Ve && [1,4,7,10].includes(p.Ve.house) && /उच्च|स्वराशि/.test(p.Ve.Dignity || "")
    ? { n:"लक्ष्मी योग", c:C.pink, icon:"🌸", present:true, effect:"अपार धन, वैभव", reason:`शुक्र ${p.Ve.house}वें उच्च/स्वराशि` }
    : { n:"लक्ष्मी योग", c:C.pink, icon:"🌸", present:false, effect:"शुक्र केंद्र उच्च/स्वराशि नहीं", reason:"" });
  // Saraswati
  const triKendra = [1,2,4,5,7,9,10,11];
  yogas.push(triKendra.includes(p.Me?.house) && triKendra.includes(p.Ju?.house) && triKendra.includes(p.Ve?.house)
    ? { n:"सरस्वती योग", c:C.green, icon:"📚", present:true, effect:"विद्वान, कलाकार, प्रसिद्ध", reason:"गुरु+बुध+शुक्र केंद्र/त्रिकोण में" }
    : { n:"सरस्वती योग", c:C.green, icon:"📚", present:false, effect:"तीनों एक साथ केंद्र में नहीं", reason:"" });
  // Amala
  const amalaWho = ["Ju","Ve","Mo","Me"].find((c) => p[c]?.house === 10);
  yogas.push(amalaWho
    ? { n:"अमल योग", c:C.teal, icon:"✨", present:true, effect:"स्थायी प्रसिद्धि, कीर्ति", reason:`${PH[amalaWho]} 10वें में` }
    : { n:"अमल योग", c:C.teal, icon:"✨", present:false, effect:"शुभ ग्रह 10वें में नहीं", reason:"" });
  // Adhi
  if (p.Mo) {
    const mh = p.Mo.house;
    const bens = ["Ju","Ve","Me"].filter((c) => p[c] && [((mh+4)%12)||12,((mh+5)%12)||12,((mh+6)%12)||12].includes(p[c].house));
    yogas.push(bens.length >= 2
      ? { n:"आधि योग", c:C.indigo, icon:"👑", present:true, effect:"नेतृत्व, मंत्री/उच्च पद", reason:`चंद्र से 6/7/8 में ${bens.map((c)=>PH[c]).join(", ")}` }
      : { n:"आधि योग", c:C.indigo, icon:"👑", present:false, effect:"चंद्र से 6/7/8 में 2+ शुभ नहीं", reason:"" });
  }
  // Budha-Aditya
  yogas.push(p.Su && p.Me && p.Su.house === p.Me.house
    ? { n:"बुधादित्य योग", c:C.yellow, icon:"☀️", present:true, effect:"तेज बुद्धि, राजकीय सम्मान", reason:`सूर्य+बुध ${p.Su.house}वें` }
    : { n:"बुधादित्य योग", c:C.yellow, icon:"☀️", present:false, effect:"सूर्य+बुध एक साथ नहीं", reason:"" });
  // Neech Bhang
  const nbPlanets = ["Su","Mo","Ma","Me","Ju","Ve","Sa"].filter((c) => p[c] && checkNeechBhang(c, p[c]));
  yogas.push(nbPlanets.length > 0
    ? { n:"नीचभंग राजयोग", c:C.green, icon:"⬆️", present:true, effect:"गरीबी से अमीरी! अचानक उत्थान", reason:`${nbPlanets.map((c)=>PH[c]).join(", ")} नीच केंद्र में` }
    : { n:"नीचभंग राजयोग", c:C.green, icon:"⬆️", present:false, effect:"कोई नीचभंग नहीं", reason:"" });

  const found = yogas.filter((y) => y.present);
  return (
    <>
      <div className="p-3 rounded-xl mb-3"
        style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)" }}>
        <div className="text-[15px] font-black text-amber-400" style={HI}>
          ✨ {found.length} राजयोग मिले ({yogas.length} में से)
        </div>
      </div>
      {yogas.map((y, i) => (
        <div key={i} className="p-3 rounded-xl mb-2"
          style={{ background: y.present ? `${y.c}0A` : "rgba(255,255,255,.02)",
            border: `1px solid ${y.present ? y.c+"30" : "rgba(255,255,255,.06)"}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px]">{y.icon}</span>
            <span className="text-[13px] font-black" style={{ color: y.present ? y.c : "#475569", ...HI }}>{y.n}</span>
            {y.present && <StatusPill color={y.c} className="ml-auto">✅ सक्रिय</StatusPill>}
          </div>
          <div className="text-[12px]" style={{ color: y.present ? "#CBD5E1" : "#334155", ...HI }}>{y.effect}</div>
          {y.present && y.reason && <div className="text-[11px] text-slate-500 mt-0.5" style={HI}>🪐 {y.reason}</div>}
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function YogaPanel({ data, chartData }) {
  const hasEngine = data && !data.error;
  const pl        = chartData?.planets || {};
  const lagna     = chartData?.lagna ?? 0;
  const summary   = data?.summary || {};

  if (!hasEngine && !Object.keys(pl).length) {
    return <EmptyState icon="🔮"
      message={data?.error ? `योग डेटा उपलब्ध नहीं: ${data.error}` : "योग डेटा लोड हो रहा है…"} />;
  }

  return (
    <div className="pb-6">
      {/* Summary counters */}
      {hasEngine && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l:"कुल योग",  v: summary.total_yogas || 0,       c:"#F59E0B" },
            { l:"शुभ योग",  v: summary.auspicious_yogas || 0,   c:"#22D3EE" },
            { l:"अरिष्ट",   v: summary.inauspicious_yogas || 0, c:"#FB7185" },
          ].map((x) => (
            <div key={x.l} className="text-center p-3 rounded-2xl border"
              style={{ background:`${x.c}08`, borderColor:`${x.c}20` }}>
              <div className="text-2xl font-black" style={{ color: x.c }}>{x.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5" style={HI}>{x.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Engine-driven categories */}
      {hasEngine && Object.keys(YOGA_CATEGORIES).map((k) => (
        <CategoryBlock key={k} catKey={k} yogas={data[k]} />
      ))}

      {/* Frontend-computed: Pancha Mahapurush */}
      {Object.keys(pl).length > 0 && (
        <CollapsibleSection variant="panel" icon="🦢" title="पंच महापुरुष योग"
          color={C.cyan} defaultOpen={true}>
          <MahapurushBlock chartPlanets={pl} />
        </CollapsibleSection>
      )}

      {/* Frontend-computed: Rajyoga */}
      {Object.keys(pl).length > 0 && (
        <CollapsibleSection variant="panel" icon="👑" title="राजयोग विश्लेषण"
          color={C.amber} defaultOpen={true}>
          <RajyogaBlock chartPlanets={pl} lagna={lagna} />
        </CollapsibleSection>
      )}
    </div>
  );
}