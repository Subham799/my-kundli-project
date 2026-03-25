// pages/DashboardLayout.jsx
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { User, Moon, Zap, Download, FileText } from "lucide-react";
import useKundliStore from "../store/useKundliStore";
import { TABS } from "../constants";
import { PLANET_META } from "../constants";
import { useIsMobile } from "../hooks/useIsMobile";
import MobileTabDrawer from "../components/shared/MobileTabDrawer";

// ── Phase 1 panels — loaded immediately (needed on first render) ──────────
import InputSidebar       from "../components/layout/InputSidebar";
import InteractiveKundli  from "../components/chart/InteractiveKundli";
import PlanetCard         from "../components/panels/PlanetCard";
import PlanetDrawer       from "../components/panels/PlanetDrawer";
import DashaTimeline      from "../components/panels/DashaTimeline";
import DrishtiGrid        from "../components/panels/DrishtiGrid";
import AshtakavargaGrid   from "../components/panels/AshtakavargaGrid";
import HousePanel         from "../components/panels/HousePanel";
import Badge              from "../components/ui/Badge";

// ── Phase 1 (but conclusion is heavy — lazy ok) ───────────────────────────
const MasterConclusion  = lazy(() => import("../components/panels/MasterConclusion"));

// ── Phase 2 panels — only loaded when user clicks that tab ────────────────
// Browser downloads 0 bytes for these until the user actually opens them.
const YogaPanel         = lazy(() => import("../components/panels/YogaPanel"));
const AdvancedAVPanel   = lazy(() => import("../components/panels/AdvancedAVPanel"));
const KamuktaPanel      = lazy(() => import("../components/panels/KamuktaPanel"));
const GocharPanel       = lazy(() => import("../components/panels/GocharPanel"));
const NadiJyotishPanel  = lazy(() => import("../components/panels/NadiJyotishPanel"));
const AVSutrasPanel     = lazy(() => import("../components/panels/AVSutrasPanel"));
const ChandraSuryaPanel = lazy(() => import("../components/panels/ChandraSuryaPanel"));
const AdvancedYogasPanel= lazy(() => import("../components/panels/Advancedyogaspanel"));
const KPBTRPanel        = lazy(() => import("../components/panels/KPBTRPanel"));
const VivahPanel         = lazy(() => import("../components/panels/VivahPanel"));

// ── Suspense fallback — shown while a lazy panel is loading ──────────────
function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-4 animate-pulse">
      {[1,2,3].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-slate-800/50" />
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// LOADING STATE — Dynamic tabs preview + jyotish facts
// ─────────────────────────────────────────────────────────────
function LoadingState() {
  const [phase, setPhase]     = useState(0);   // which message
  const [tabIdx, setTabIdx]   = useState(0);   // which tab preview
  const [dots, setDots]       = useState("");  // "..." animation

  // ── Phase messages — server cold start + computation steps ──
  const PHASES = [
    { icon:"🌌", text:"ब्रह्मांडीय ऊर्जाओं को अलाइन किया जा रहा है...",             sub:"Render सर्वर जाग रहा है (Cold Start)" },
    { icon:"🪐", text:"Swiss Ephemeris से ग्रहों की सटीक डिग्री निकाली जा रही है...", sub:"9 ग्रह · 12 भाव · लग्न स्पष्ट" },
    { icon:"📐", text:"अष्टकवर्ग और सर्वाष्टकवर्ग के 337 बिंदु जोड़े जा रहे हैं...",  sub:"8 ग्रहों के BAV + SAV गणना" },
    { icon:"📜", text:"भृगु नंदी नाड़ी के 62 गुप्त सूत्रों का मिलान हो रहा है...",    sub:"नाड़ी AI Engine v2.0" },
    { icon:"⚡", text:"13 विश्लेषण इंजन एक साथ चल रहे हैं...",                         sub:"योग · दशा · गोचर · विवाह · KP · AV सूत्र..." },
    { icon:"🔮", text:"आपकी सम्पूर्ण वैदिक कुंडली लगभग तैयार है...",                 sub:"बस कुछ ही पल..." },
  ];

  // ── Tab preview data — what awaits them ─────────────────────
  const TAB_PREVIEWS = [
    { icon:"🪐", tab:"ग्रह",            desc:"9 ग्रहों की डिग्री, राशि, नक्षत्र, दिग्बल और फलादेश" },
    { icon:"👁️", tab:"ग्रह दृष्टि",    desc:"कौन सा ग्रह किसको देख रहा है — पूर्ण दृष्टि चक्र" },
    { icon:"📅", tab:"दशा",             desc:"विंशोत्तरी दशा · अंतर्दशा · 27-वर्ष चक्र विश्लेषण" },
    { icon:"🔢", tab:"AV",              desc:"अष्टकवर्ग ग्रिड · बिंदु चार्ट · भाव बल" },
    { icon:"🏠", tab:"भाव",             desc:"12 भावों का विस्तृत विश्लेषण · भावेश स्थिति" },
    { icon:"🏆", tab:"निष्कर्ष",        desc:"मास्टर कुंडली रिपोर्ट · राजयोग · धनयोग · 8-page PDF" },
    { icon:"✨", tab:"योग",             desc:"राजयोग · धनयोग · केंद्रत्रिकोण · 50+ योगों की पहचान" },
    { icon:"📊", tab:"विस्तृत AV",      desc:"जीवन समृद्धि · संघर्ष मीटर · करियर टाइप · AV मैप" },
    { icon:"💕", tab:"कामुकता",         desc:"प्रेम स्वभाव · आकर्षण · दांपत्य रसायन · कुंडली मिलान" },
    { icon:"🌍", tab:"गोचर",            desc:"आज के ग्रहों का प्रभाव · 7/7 महामुहूर्त · दैनिक पूर्वानुमान" },
    { icon:"🔮", tab:"नाड़ी ज्योतिष",   desc:"भृगु नंदी नाड़ी के 62 सूत्र · कर्म पैटर्न · पुनर्जन्म" },
    { icon:"🔢", tab:"AV सूत्र",        desc:"27-वर्ष सौभाग्य चक्र · भाग्योदय वर्ष · ग्रह बल सूत्र" },
    { icon:"🌙", tab:"चंद्र-सूर्य",     desc:"चंद्र उपचय · पक्ष बल · शुभ मास · मानसिक संतुलन" },
    { icon:"⚡", tab:"उन्नत योग",       desc:"इन्दु लग्न · भावत भावम · पाप कर्तरी · मेगा रूल्स" },
    { icon:"🔗", tab:"KP शुद्धि",       desc:"KP BTR इंजन · CIL चेक · D24 मातृकारक · जन्म समय शुद्धि" },
    { icon:"💍", tab:"विवाह",           desc:"28 विवाह सूत्र · मांगलिक · प्रेम योग · वैधव्य · तलाक · दशा" },
  ];

  // ── Jyotish facts — shown as floating pills ─────────────────
  const FACTS = [
    "💡 नाड़ी ज्योतिष 5000 वर्ष पुरानी भविष्यवाणी पद्धति है",
    "💡 अष्टकवर्ग में अधिकतम 337 बिंदु संभव हैं",
    "💡 विंशोत्तरी दशा = 120 वर्ष का जीवन चक्र",
    "💡 27 नक्षत्र × 4 पाद = 108 नवांश",
    "💡 Swiss Ephemeris सटीकता: 0.001 आर्कसेकंड",
    "💡 KP पद्धति में Sub-Lord विवाह का सबसे सटीक संकेत देता है",
    "💡 भृगु नंदी नाड़ी में हर ग्रह युति एक 'सूत्र' बनाती है",
  ];
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    // Phase: every 4.5s
    const pt = setInterval(() => {
      setPhase(p => p < PHASES.length - 1 ? p + 1 : p);
    }, 4500);
    // Tab preview: every 2.2s
    const tt = setInterval(() => {
      setTabIdx(i => (i + 1) % TAB_PREVIEWS.length);
    }, 2200);
    // Facts: every 6s
    const ft = setInterval(() => {
      setFactIdx(i => (i + 1) % FACTS.length);
    }, 6000);
    // Dots animation
    const dt = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 500);
    return () => { clearInterval(pt); clearInterval(tt); clearInterval(ft); clearInterval(dt); };
  }, []);

  const cur  = PHASES[phase];
  const tab  = TAB_PREVIEWS[tabIdx];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6"
      style={{ background:"rgba(2,6,18,0.85)", minHeight:"100vh" }}>

      {/* ── Orbit animation ── */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/15 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 border-amber-500/10 animate-spin"
          style={{ animationDuration:"2s" }} />
        <div className="absolute inset-3 rounded-full border border-t-cyan-400 border-cyan-400/10 animate-spin"
          style={{ animationDirection:"reverse", animationDuration:"1.2s" }} />
        <div className="absolute inset-6 rounded-full border border-t-purple-400 border-purple-400/10 animate-spin"
          style={{ animationDuration:"3s" }} />
        <Moon className="absolute inset-0 m-auto text-amber-400" size={26} />
      </div>

      {/* ── Dynamic phase text ── */}
      <div className="text-center max-w-xs" style={{ minHeight:"60px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={phase}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.45 }}>
            <div className="text-[15px] font-bold mb-1"
              style={{ background:"linear-gradient(90deg,#F59E0B,#22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              {cur.icon} {cur.text}
            </div>
            <div className="text-[11px] text-slate-500">{cur.sub}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Progress bar ── */}
      <div className="flex gap-1.5 items-center">
        {PHASES.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-700"
            style={{
              height:"4px",
              width: i <= phase ? "24px" : "8px",
              background: i <= phase
                ? i === phase ? "#F59E0B" : "rgba(245,158,11,0.4)"
                : "rgba(255,255,255,0.08)",
            }} />
        ))}
        <span className="text-[10px] text-slate-600 ml-1"
          style={{ minWidth:"24px" }}>{Math.round((phase/PHASES.length)*100)}%</span>
      </div>

      {/* ── Tab preview card — "aapko milega" ── */}
      <div className="w-full max-w-sm">
        <div className="text-[10px] text-slate-600 text-center mb-2 uppercase tracking-widest">
          आपको मिलेगा
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tabIdx}
            initial={{ opacity:0, x:20 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-20 }}
            transition={{ duration:0.35 }}
            className="rounded-2xl border px-4 py-3 flex items-center gap-3"
            style={{ background:"rgba(245,158,11,0.04)", borderColor:"rgba(245,158,11,0.18)" }}>
            <span style={{ fontSize:"22px", flexShrink:0 }}>{tab.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-amber-300/90 mb-0.5">{tab.tab}</div>
              <div className="text-[11px] text-slate-500 leading-snug">{tab.desc}</div>
            </div>
            <div className="text-[9px] text-slate-700 flex-shrink-0 ml-auto">
              {tabIdx + 1}/{TAB_PREVIEWS.length}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── All tabs mini grid ── */}
      <div className="w-full max-w-sm">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {TAB_PREVIEWS.map((t, i) => (
            <motion.div key={t.tab}
              initial={{ opacity:0, scale:0.8 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay: i * 0.06, duration:0.3 }}
              className="text-[10px] px-2 py-1 rounded-full border transition-all duration-300"
              style={{
                background:  i === tabIdx ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                borderColor: i === tabIdx ? "rgba(245,158,11,0.5)"  : "rgba(255,255,255,0.07)",
                color:       i === tabIdx ? "#F59E0B"               : "#475569",
                fontWeight:  i === tabIdx ? 700 : 400,
              }}>
              {t.icon} {t.tab}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Rotating jyotish fact ── */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div key={factIdx}
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.6 }}
            className="text-center text-[11px] text-slate-600 px-4 py-2 rounded-xl"
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            {FACTS[factIdx]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom hint ── */}
      <div className="text-[10px] text-slate-700 text-center">
        सर्वर लोड हो रहा है{dots} · Nadi AI Jyotish Engine
      </div>

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// WELCOME / EMPTY
// ─────────────────────────────────────────────────────────────
function WelcomeState() {
  const { loadDemo } = useKundliStore();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Moon size={28} className="text-amber-400" />
      </div>
      <div>
        <div className="text-lg font-semibold text-slate-300 mb-2">जन्म विवरण भरें</div>
        <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
          सम्पूर्ण वैदिक ज्योतिष विश्लेषण के लिए बाईं ओर फ़ॉर्म भरें।
        </p>
      </div>
      <button
        onClick={loadDemo}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/15 transition-all"
      >
        <Zap size={14} /> डेमो कुंडली देखें
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// PDF EXPORT — Complete 8-Page Premium Report
// ─────────────────────────────────────────────────────────────
function buildPDFPage(pageNum, chartData) {
  const pd   = chartData || {};
  const pl   = pd.planets || {};
  const mcD  = pd.masterConclusion || {};
  const ed   = pd.enginesData || {};
  const meta = pd.meta || {};
  const avD  = ed.ashtakvarga_complete?.analysis || {};
  const nav  = ed.navatara?.navatara_chakra || {};
  const cv   = ed.comprehensive_vedic || {};
  const advS = ed.advanced_sutras?.analysis || {};
  const sat  = ed.saturn_transit || {};
  const pj   = ed.punarjanma || {};
  const yog  = ed.yogas || {};

  const name      = meta.name  || pd.inputData?.name || "जातक";
  const dob       = meta.dob   || pd.inputData?.dob  || "—";
  const tob       = meta.time  || pd.inputData?.time || "—";
  const pob       = meta.city  || pd.inputData?.city || "—";
  const lagnaSign = meta.lagnaSign || "—";
  const lagnaIdx  = meta.lagnaSignIdx ?? 0;
  const lagnaNak  = meta.lagnaNakshatra || "";
  const lagnaDeg  = meta.lagnaRashiDegree ? meta.lagnaRashiDegree + "°" : "";

  const RASHI  = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const PH     = {Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
  const PS     = {Su:"☉",Mo:"☽",Ma:"♂",Me:"☿",Ju:"♃",Ve:"♀",Sa:"♄",Ra:"☊",Ke:"☋"};
  const DC     = {Uchcha:"#4ADE80",उच्च:"#4ADE80",Neecha:"#FB7185",नीच:"#FB7185",Swa:"#22D3EE",Swagraha:"#22D3EE",स्वराशि:"#22D3EE",Mitra:"#C084FC",मित्र:"#C084FC",Shatru:"#FB923C",शत्रु:"#FB923C",Sama:"#64748B",सम:"#64748B",Yogakaraka:"#F59E0B"};
  const DI     = {Uchcha:"⬆️",उच्च:"⬆️",Neecha:"⬇️",नीच:"⬇️",Swa:"🏠",Swagraha:"🏠",स्वराशि:"🏠",Mitra:"💜",मित्र:"💜",Shatru:"🔴",शत्रु:"🔴",Sama:"⚪",सम:"⚪",Yogakaraka:"⭐"};
  const FC     = {Yogakaraka:"#F59E0B",Malefic:"#FB7185","Functional Benefic":"#4ADE80","Functional Ben":"#4ADE80",Neutral:"#64748B"};
  const DASHA_FX={Su:"आत्मबल, पिता, नेतृत्व",Mo:"मन, माता, यात्रा",Ma:"साहस, भूमि, ऊर्जा",Me:"बुद्धि, व्यापार, शिक्षा",Ju:"ज्ञान, संतान, धर्म",Ve:"प्रेम, धन, कला",Sa:"कर्म, अनुशासन, देरी",Ra:"महत्वाकांक्षा, विदेश",Ke:"आध्यात्म, वैराग्य"};
  const RAHU_T ={1:"चतुर, रहस्यमई, स्वार्थी | सिर दर्द | नौकरी से सफलता | खतरा: 5वर्ष",2:"वाणी जादूगर, झूठ का शौक | दांत/आंख/गला | झूठ से बचें | खतरा: 12-24",3:"✅ उत्तम — धन, यश, पराक्रम | श्वास नली | खतरा: 21",4:"यात्राएं, घर से दूरी | माता को चर्म रोग | खतरा: 8,16",5:"राजनैतिक बुद्धि | पेट/गैस | सरकारी से झगड़ा न करें | खतरा: 5,19",6:"✅✅ श्रेष्ठ — शत्रु नाश | मंगल+राहु=लक्ष्मी योग | खतरा: 21,37",7:"दांपत्य कलह | किडनी | व्यापार में धोखा | खतरा: 37",8:"गूढ़ शक्तियां, तांत्रिक | गुप्त रोग, बवासीर | खतरा: 25,32",9:"धर्म में अरुचि | पिता कष्ट | विदेश में भाग्य | खतरा: 19,29",10:"✅ धनवान, विद्वान | 54वर्ष नौकरी खतरा",11:"✅✅ श्रेष्ठ — धन, सम्मान | बड़े भाई कष्ट | खतरा: 45",12:"विदेश यात्रा, जन्मस्थान छोड़ना | चर्म रोग | खतरा: 36,48"};
  const KETU_T ={1:"वैराग्य, आत्मज्ञान | सिर दर्द | आध्यात्मिक उन्नति",2:"वाणी असामान्य | दांत/गला | रहस्यमय ज्ञान",3:"साहस, पराक्रम | भाई कष्ट | तंत्र-मंत्र",4:"माता-गृह अलगाव | छाती/फेफड़े | आध्यात्मिक जागृति",5:"✅ तंत्र सिद्धि, पूर्वजन्म ज्ञान | संतान देरी",6:"✅✅ शत्रु नाशक — अति शुभ",7:"विवाह देरी | किडनी | जीवनसाथी उदासीन",8:"गूढ़ शक्ति, दीर्घायु | गुप्त रोग | दुर्घटना भय",9:"भाग्य बाधित | पिता कष्ट | पूर्वजन्म संस्कार",10:"करियर उतार-चढ़ाव, आध्यात्मिक पेशा | घुटने",11:"✅ बड़ी उपलब्धि | अनिश्चित आय",12:"✅ मोक्ष योग, विदेश सफलता | खर्चे अधिक"};
  const DIS_MAP={Su:["हृदय रोग","पित्त","आंख (दाईं)"],Mo:["मानसिक तनाव","कफ","किडनी"],Ma:["रक्त विकार","दुर्घटना","बवासीर"],Me:["त्वचा","नसें","एलर्जी"],Ju:["मोटापा","डायबिटीज","लीवर"],Ve:["किडनी","प्रजनन","मधुमेह"],Sa:["जोड़ों का दर्द","दांत","वात"],Ra:["कैंसर भय","नशा","अज्ञात रोग"],Ke:["दुर्घटना","रहस्यमय रोग","ऑपरेशन"]};

  const dasha    = pd.dasha?.current || {};
  const dashaSeq = pd.dasha?.sequence || [];
  const avBhavas = mcD.avBhavas || [];
  const tp       = mcD.avTurningPoints || [];
  const lp  = avD.life_prosperity || {};
  const sm  = avD.struggle_meter || {};
  const ct  = avD.career_type || {};
  const ld  = avD.lucky_direction || {};
  const aa  = avD.age_analysis || {};
  const kb  = avD.karma_bhagya || {};
  const bs  = avD.business_success || {};
  const rl  = avD.reverse_logic_houses || {};
  const ta  = cv.trikona_analysis || {};
  const as_ = cv.age_of_success || {};
  const cw  = advS.continuous_wealth || {};
  const ra  = advS.rajyoga_age || {};
  const ss  = sat.sade_sati || {};
  const dh  = sat.dhaiya || {};
  const gems= nav.gemstone_recommendations || {};
  const bn  = nav.taras || {};

  const allYogas = [
    ...(yog.raja_yogas||[]),
    ...(yog.dhana_yogas||[]),
    ...(yog.yogas_found||[]),
    ...(yog.detected_yogas||[]),
  ].filter((y,i,a)=>a.findIndex(x=>(x.name||x.yoga_name)===(y.name||y.yoga_name))===i);

  const rahuH = pl?.Ra?.house;
  const ketuH = rahuH ? ((rahuH+5)%12||12) : null;
  const now   = new Date().getFullYear();

  // ── helpers ──
  const sect = (t,c="#F59E0B") =>
    `<div style="margin:12px 0 5px;padding:5px 10px;background:${c}12;border-left:3px solid ${c};font-size:12px;font-weight:900;color:${c}">${t}</div>`;
  const card = (html,c="#F59E0B") =>
    `<div style="padding:9px 11px;border-radius:9px;background:${c}07;border:1px solid ${c}25;margin:4px 0">${html}</div>`;
  const badge = (t,c) =>
    `<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:5px;background:${c}18;color:${c};border:1px solid ${c}30;font-size:10px;font-weight:700">${t}</span>`;
  const foot = (n,total) =>
    `<div style="text-align:center;font-size:9px;color:#334155;margin-top:14px;padding-top:7px;border-top:1px solid rgba(245,158,11,.12)">🪐 सम्पूर्ण वैदिक कुंडली — ${name} | पृष्ठ ${n}${total?" / "+total:""} | © Nadi AI Jyotish</div>`;

  // ── Planet Table ──
  const pRows = Object.entries(pl).map(([c,p])=>{
    if(!p) return "";
    const dk=p.dignity||"Sama", dh_=p.dignityHindi||dk;
    const dc=DC[dk]||DC[dh_]||"#64748B", di=DI[dk]||DI[dh_]||"⚪";
    const fc=FC[p.functionalNature]||"#64748B";
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:4px 6px;color:#F59E0B;font-weight:900;font-size:11px">${PH[c]||c} ${PS[c]||""} ${p.Retrograde?"⟲":""}</td>
      <td style="padding:4px 6px;color:#CBD5E1;font-size:11px">${p.hindi_sign||"—"}</td>
      <td style="padding:4px 6px;color:#94A3B8;font-size:11px;text-align:center;font-weight:700">${p.house||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${p.degree||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${p.nakshatra||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${p.lord?PH[p.lord]||p.lord:"—"}</td>
      <td style="padding:4px 6px;font-size:10px;font-weight:700;color:${dc}">${di} ${dh_}</td>
      <td style="padding:4px 6px;font-size:10px;color:${fc}">${(p.functionalNature||"Neutral").slice(0,16)}</td>
      <td style="padding:4px 6px;font-size:10px;color:#475569">${p.strength!=null?p.strength+"%":"—"}</td>
    </tr>`;
  }).join("");

  // ── Houses ──
  const houses = pd.houses||[];
  const hRows = houses.map(h=>`<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
    <td style="padding:4px 6px;color:#F59E0B;font-weight:700;font-size:11px">${h.n||h.house||""}वाँ</td>
    <td style="padding:4px 6px;color:#CBD5E1;font-size:11px">${h.sign||h.rashi||"—"}</td>
    <td style="padding:4px 6px;color:#94A3B8;font-size:11px">${h.planets||"—"}</td>
    <td style="padding:4px 6px;font-size:11px;color:${(h.av||0)>=30?"#22D3EE":(h.av||0)>=25?"#F59E0B":"#FB7185"};font-weight:700">${h.av||"—"}</td>
  </tr>`).join("");

  // ── AV Grid ──
  const avGrid = avBhavas.length>0?avBhavas.map(({n,av})=>{
    const c=av>=30?"#22D3EE":av>=25?"#F59E0B":"#FB7185";
    return `<div style="text-align:center;padding:5px 2px;border-radius:7px;background:${c}12;border:1px solid ${c}28">
      <div style="font-size:8px;color:#475569">भाव ${n}</div>
      <div style="font-size:17px;font-weight:900;color:${c}">${av}</div>
    </div>`;
  }).join(""):"";

  // ── Turning Points ──
  const tpHTML = [...tp].sort((a,b)=>a.year-b.year).map(t=>{
    const near=t.year>=now-1&&t.year<=now+10, past=t.year<now-2;
    const c=near?"#F59E0B":past?"#334155":t.nature==="good"?"#4ADE80":"#FB7185";
    return `<div style="display:flex;gap:8px;margin:4px 0;padding:6px 9px;border-radius:7px;background:${c}08;border:1px solid ${c}20;opacity:${past?.5:1}">
      <div style="font-size:21px;font-weight:900;color:${c};min-width:42px;text-align:center;line-height:1.15">${t.year}</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:900;color:${c}">${t.hindi||t.code||""} — भाव ${t.house} ${t.nature==="good"?"✅":"⚠️"}</div>
        <div style="font-size:9px;color:#64748B;margin-top:1px">${t.ageGroup||""}${t.planetaryReason?" | "+t.planetaryReason:""}</div>
        ${t.avSum?`<div style="font-size:8px;color:#334155;font-family:monospace">Σ(1→${t.house})=${t.avSum}×7÷27=${t.year}</div>`:""}
      </div>
      ${near?`<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:rgba(245,158,11,.2);color:#F59E0B;white-space:nowrap;align-self:center">← अभी</span>`:""}
    </div>`;
  }).join("");

  // ── Dasha Table ──
  const dashaTable = dashaSeq.length>0?`<table style="width:100%;border-collapse:collapse">
    <tr><th>महादशा</th><th>आरंभ</th><th>समाप्त</th><th>वर्ष</th><th>फल</th></tr>
    ${dashaSeq.map(d=>{const cur=d.active||d.lord===dasha.mahadasha;return`<tr style="border-bottom:1px solid rgba(255,255,255,.04);${cur?"background:rgba(245,158,11,.06)":""}">
      <td style="padding:4px 6px;color:${cur?"#F59E0B":"#CBD5E1"};font-weight:${cur?900:400};font-size:11px">${cur?"▶ ":""}${d.lord||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${d.start||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${d.end||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${d.years||"—"}</td>
      <td style="padding:4px 6px;color:#475569;font-size:10px">${DASHA_FX[d.code]||DASHA_FX[d.lord]||"—"}</td>
    </tr>`;}).join("")}
  </table>`:`<div style="color:#475569;text-align:center;padding:10px">दशा डेटा उपलब्ध नहीं</div>`;

  // ── Trikona ──
  const getPlIn=(hs)=>Object.entries(pl).filter(([c,p])=>p&&hs.includes(p.house)).map(([c,p])=>{
    const d=p.dignityHindi||p.dignity||"";
    return {name:PH[c]||c,h:p.house,g:/उच्च|Uchcha|स्वराशि|Swa|मित्र|Mitra/i.test(d),b:/नीच|Neecha|शत्रु|Shatru/i.test(d)};
  });
  const tkSc=(hs)=>{const ps=getPlIn(hs);const g=ps.filter(x=>x.g).length,b=ps.filter(x=>x.b).length;const s=Math.min(100,Math.max(0,50+g*15-b*15));return{s,lbl:s>=70?"🟢 मजबूत":s>=45?"🟡 सामान्य":"🔴 कमजोर",ps};};
  const TK=[
    {i:"🕉️",t:"धर्म त्रिकोण",h:[1,5,9],c:"#22D3EE",lg:"1=आत्मा, 5=पुण्य, 9=भाग्य+धर्म",g:"धार्मिक कार्य, सेवा, परोपकार, शिक्षा",b:"केवल पैसे के पीछे = मानसिक तनाव"},
    {i:"💰",t:"अर्थ त्रिकोण",h:[2,6,10],c:"#4ADE80",lg:"2=धन, 6=मेहनत+सेवा, 10=करियर+कर्म",g:"निवेश, नौकरी, पैसे से पैसा",b:"व्यर्थ खर्च = धन नाश"},
    {i:"❤️",t:"काम त्रिकोण",h:[3,7,11],c:"#FB7185",lg:"3=प्रयास+साहस, 7=साझेदार+विवाह, 11=लाभ+मित्र",g:"नेटवर्क, साझेदारी, प्रेम",b:"अति इच्छाएं = दुख"},
    {i:"🌌",t:"मोक्ष त्रिकोण",h:[4,8,12],c:"#C084FC",lg:"4=सुख+माँ, 8=परिवर्तन+आयु, 12=मोक्ष+विदेश",g:"निस्वार्थ कार्य, आध्यात्म",b:"भौतिक लक्ष्य = चिड़चिड़ापन"},
  ];
  const tkHTML=TK.map(t=>{const a=tkSc(t.h);const sc=a.s>=70?"#4ADE80":a.s>=45?"#F59E0B":"#FB7185";return`<div style="padding:9px;border-radius:9px;background:${t.c}07;border:1px solid ${t.c}22;margin-bottom:7px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-size:13px">${t.i}</span>
      <span style="font-size:12px;font-weight:900;color:${t.c};margin:0 6px">${t.t}</span>
      <span style="font-size:9px;color:#475569">भाव ${t.h.join("-")}</span>
      <span style="font-size:9px;padding:1px 6px;border-radius:4px;background:${sc}18;color:${sc};font-weight:700">${a.lbl}</span>
    </div>
    <div style="font-size:9px;color:#475569;margin-bottom:5px">💡 ${t.lg}</div>
    ${a.ps.length>0?`<div style="margin-bottom:5px">${a.ps.map(p=>`${badge(p.name+" "+p.h+"वें"+(p.g?" ✅":p.b?" ⚠️":""),p.g?"#4ADE80":p.b?"#FB7185":"#F59E0B")}`).join("")}</div>`:""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      <div style="padding:4px 7px;border-radius:5px;background:rgba(74,222,128,.07)"><div style="font-size:9px;color:#4ADE80;font-weight:700">✅ अनुकूल</div><div style="font-size:10px;color:#CBD5E1">${t.g}</div></div>
      <div style="padding:4px 7px;border-radius:5px;background:rgba(251,113,133,.07)"><div style="font-size:9px;color:#FB7185;font-weight:700">⚠️ टालें</div><div style="font-size:10px;color:#CBD5E1">${t.b}</div></div>
    </div>
  </div>`;}).join("");

  // ── Afflicted planets ──
  const afflicted=Object.entries(pl).filter(([c,p])=>{
    if(!p)return false;
    const d=p.dignity||"";
    return /Neecha|नीच/i.test(d)||[6,8,12].includes(p.house)||/Shatru|शत्रु/i.test(d);
  });

  // ── Spouse ──
  const SPOUSE_N={1:"आत्मनिर्भर",2:"धनी परिवार",3:"साहसी, यात्राप्रिय",4:"घरेलू, माँ से जुड़े",5:"रचनात्मक, प्रेमी",6:"मेहनती, सेवाभाव",7:"सुंदर, संतुलित",8:"रहस्यमय, गहरे",9:"धार्मिक, भाग्यशाली",10:"महत्वाकांक्षी",11:"सामाजिक, लाभकारी",12:"आध्यात्मिक, विदेशी"};
  const ve=pl.Ve,ma_p=pl.Ma;
  const veH=ve?.house;
  const manglik=ma_p&&[1,4,7,8,12].includes(ma_p.house);
  const planIn7=Object.entries(pl).filter(([c,p])=>p?.house===7);
  const malIn7=planIn7.filter(([c])=>["Sa","Ma","Ra","Ke","Su"].includes(c));
  const benIn7=planIn7.filter(([c])=>["Ju","Ve","Mo","Me"].includes(c));
  const veDig=ve?.dignityHindi||ve?.dignity||"";
  const veGood=/उच्च|स्वराशि|मित्र|Uchcha|Swa|Mitra/i.test(veDig);
  const veBad=/नीच|शत्रु|Neecha|Shatru/i.test(veDig);

  // ═══════════ SHARED CSS ═══════════
  const css=`
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#080C1C;color:#E2E8F0;font-family:'Noto Sans Devanagari',sans-serif;font-size:11px;line-height:1.5}
    @media print{body{background:#080C1C!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.pb{page-break-before:always}}
    .page{max-width:210mm;margin:0 auto;padding:11mm 10mm}
    .hdr{background:linear-gradient(135deg,rgba(245,158,11,.13),rgba(34,211,238,.06));border:1.5px solid rgba(245,158,11,.28);border-radius:11px;padding:13px 16px;margin-bottom:12px}
    .igrid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:9px}
    .ii{padding:5px 8px;background:rgba(255,255,255,.04);border-radius:7px;border:1px solid rgba(255,255,255,.06)}
    .il{font-size:8px;color:#475569;text-transform:uppercase;letter-spacing:.04em}
    .iv{font-size:12px;font-weight:700;color:#fff;margin-top:1px}
    table{width:100%;border-collapse:collapse;margin:4px 0}
    th{padding:4px 6px;background:rgba(245,158,11,.12);color:#F59E0B;font-size:9px;text-align:left;font-weight:700}
    td{vertical-align:middle}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:5px 0}
    .avg{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin:5px 0}
  `;

  const head=(title)=>`<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"/><title>${title} — ${name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&display=swap" rel="stylesheet"/>
  <style>${css}</style></head><body>`;
  const close=`</body></html>`;

  // ═══ PAGE DEFINITIONS ═══
  const TOTAL_PAGES = 23; // 8 standard + 15 Nadi pages

  const headerBlock=`
  <div class="hdr">
    <div style="font-size:19px;font-weight:900;color:#F59E0B">🪐 सम्पूर्ण वैदिक कुंडली</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:1px">Vedic Jyotish Report — Swiss Ephemeris + Nadi AI</div>
    <div class="igrid">
      <div class="ii"><div class="il">नाम</div><div class="iv">${name}</div></div>
      <div class="ii"><div class="il">लग्न</div><div class="iv" style="color:#22D3EE">${lagnaSign} ${lagnaDeg}</div></div>
      <div class="ii"><div class="il">जन्म तिथि</div><div class="iv">${dob}</div></div>
      <div class="ii"><div class="il">समय / स्थान</div><div class="iv">${tob} | ${pob}</div></div>
      ${lagnaNak?`<div class="ii"><div class="il">लग्न नक्षत्र</div><div class="iv" style="color:#C084FC">${lagnaNak}</div></div>`:""}
      ${dasha.mahadasha?`<div class="ii"><div class="il">वर्तमान महादशा</div><div class="iv" style="color:#F59E0B">${dasha.mahadasha} → ${dasha.antardasha||"—"} (${dasha.endDate||""})</div></div>`:""}
    </div>
  </div>`;

  const pages = {
    1: ()=>`${head("ग्रह + भाव")}<div class="page">
      ${headerBlock}
      ${sect("ग्रह स्थिति — नवग्रह (9 Planets)")}
      <table><tr><th>ग्रह</th><th>राशि</th><th>भाव</th><th>डिग्री</th><th>नक्षत्र</th><th>नक्ष.स्वामी</th><th>अवस्था</th><th>स्वभाव</th><th>बल%</th></tr>${pRows}</table>
      <div style="margin-top:5px;padding:4px 8px;border-radius:5px;background:rgba(245,158,11,.05);font-size:8px;color:#475569">⬆️उच्च &nbsp;⬇️नीच &nbsp;🏠स्वराशि &nbsp;💜मित्र &nbsp;🔴शत्रु &nbsp;⭐योगकारक &nbsp;⟲वक्री</div>
      ${sect("भाव स्थिति — 12 भाव","#22D3EE")}
      <table><tr><th>भाव</th><th>राशि</th><th>ग्रह</th><th>AV अंक</th></tr>${hRows}</table>
      ${foot(1,TOTAL_PAGES)}</div>${close}`,

    2: ()=>`${head("दशा + योग")}<div class="page">
      ${sect("विंशोत्तरी दशा — पूर्ण समयरेखा","#FB923C")}
      <div style="padding:6px 8px;border-radius:6px;background:rgba(251,146,60,.05);margin-bottom:7px;font-size:9px;color:#475569">💡 विंशोत्तरी पद्धति: जन्म नक्षत्र से 120 वर्ष का चक्र। वर्तमान: <b style="color:#F59E0B">${dasha.mahadasha||"—"} महादशा → ${dasha.antardasha||"—"} अंतर्दशा | समाप्त: ${dasha.endDate||"—"}</b></div>
      ${dashaTable}
      ${allYogas.length>0?`${sect(`योग — ${allYogas.length} सक्रिय`,"#4ADE80")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${allYogas.slice(0,18).map(y=>{const yn=y.name||y.yoga_name||"";const yd=y.effect||y.description||"";const yc=yn.includes("राज")||yn.includes("Raja")?"#F59E0B":yn.includes("धन")||yn.includes("Dhana")?"#4ADE80":"#22D3EE";return`<div style="padding:5px 8px;border-radius:6px;background:${yc}07;border:1px solid ${yc}20"><div style="font-size:11px;color:${yc};font-weight:700">${yn}</div>${yd?`<div style="font-size:9px;color:#475569;margin-top:1px">${yd.slice(0,60)}${yd.length>60?"...":""}</div>`:""}</div>`;}).join("")}
      </div>`:""}
      ${foot(2,TOTAL_PAGES)}</div>${close}`,

    3: ()=>`${head("अष्टकवर्ग")}<div class="page">
      ${sect("अष्टकवर्ग — 13 मॉड्यूल")}
      <div style="font-size:10px;color:#22D3EE;font-weight:700;margin-bottom:3px">सर्वाष्टकवर्ग — 12 भाव</div>
      <div class="avg">${avGrid}</div>
      ${mcD.avTotal?`<div style="text-align:right;font-size:10px;color:#F59E0B;font-weight:700">कुल: ${mcD.avTotal} | औसत: ${(mcD.avTotal/12).toFixed(1)}/भाव</div>`:""}
      <div class="two">
        ${lp.total_score?`<div style="padding:9px;border-radius:9px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.22)">
          <div style="font-size:9px;color:#64748B">MODULE 1 — जीवन समृद्धि</div>
          <div style="font-size:26px;font-weight:900;color:${lp.is_prosperous?"#22D3EE":"#FB923C"}">${lp.total_score}</div>
          <div style="font-size:8px;color:#475569">थ्रेशहोल्ड: 164 | ${lp.is_prosperous?"✅ समृद्ध":"⚠️ संघर्ष"}</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">${lp.prediction_hindi||""}</div>
          <div style="margin-top:3px;padding:3px 5px;border-radius:4px;background:rgba(255,255,255,.03);font-size:8px;color:#475569">💡 सर्वाष्टक ≥164 = समृद्ध। इस कुंडली: ${lp.total_score}</div>
        </div>`:""}
        ${kb.dominant?`<div style="padding:9px;border-radius:9px;background:rgba(192,132,252,.06);border:1px solid rgba(192,132,252,.22)">
          <div style="font-size:9px;color:#64748B">MODULE 11 — कर्म vs भाग्य</div>
          <div style="font-size:15px;font-weight:900;color:#C084FC">${kb.dominant}</div>
          <div style="display:flex;gap:7px;margin-top:3px">
            ${kb.house_9_points!=null?`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(192,132,252,.1)"><div style="font-size:16px;font-weight:900;color:#C084FC">${kb.house_9_points}</div><div style="font-size:8px;color:#64748B">9वां भाग्य</div></div>`:""}
            ${kb.house_10_points!=null?`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(129,140,248,.1)"><div style="font-size:16px;font-weight:900;color:#818CF8">${kb.house_10_points}</div><div style="font-size:8px;color:#64748B">10वां कर्म</div></div>`:""}
          </div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">${kb.prediction_hindi||""}</div>
          <div style="margin-top:3px;padding:3px 5px;border-radius:4px;background:rgba(255,255,255,.03);font-size:8px;color:#475569">💡 9वां ≥ 10वां = भाग्य से धन।</div>
        </div>`:""}
      </div>
      <div class="two">
        <div style="padding:8px;border-radius:8px;background:${sm.has_extreme_struggle?"rgba(251,113,133,.06)":"rgba(74,222,128,.06)"};border:1px solid ${sm.has_extreme_struggle?"rgba(251,113,133,.2)":"rgba(74,222,128,.2)"}">
          <div style="font-size:9px;color:#64748B;margin-bottom:2px">M2 — संघर्ष</div>
          <div style="font-size:14px;font-weight:900;color:${sm.has_extreme_struggle?"#FB7185":"#4ADE80"}">${sm.has_extreme_struggle?"उच्च संघर्ष ⚠️":"सामान्य ✅"}</div>
          <div style="font-size:9px;color:#64748B">${sm.prediction_hindi||"सामान्य जीवन संघर्ष"}</div>
          <div style="margin-top:3px;font-size:8px;color:#475569">💡 6+8+12वें भाव के कम अंक = अधिक संघर्ष</div>
        </div>
        <div style="padding:8px;border-radius:8px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2)">
          <div style="font-size:9px;color:#64748B;margin-bottom:2px">M4 — करियर प्रकार</div>
          <div style="font-size:13px;font-weight:900;color:#818CF8">${ct.recommended_type||"—"}</div>
          <div style="font-size:9px;color:#64748B">${ct.description_hindi||""}</div>
          <div style="margin-top:3px;font-size:8px;color:#475569">💡 10वें+6वें+7वें भाव की तुलना से तय</div>
        </div>
      </div>
      <div class="two">
        ${bs.will_become_businessman!=null?`<div style="padding:8px;border-radius:8px;background:${bs.will_become_businessman?"rgba(74,222,128,.06)":"rgba(251,113,133,.06)"};border:1px solid ${bs.will_become_businessman?"rgba(74,222,128,.2)":"rgba(251,113,133,.2)"}">
          <div style="font-size:9px;color:#64748B;margin-bottom:2px">MODULE 8 — व्यापार</div>
          <div style="font-size:13px;font-weight:900;color:${bs.will_become_businessman?"#4ADE80":"#FB7185"}">${bs.will_become_businessman?"✅ व्यापार सफल":"❌ व्यापार कठिन"}</div>
          <div style="font-size:9px;color:#64748B">${bs.prediction_hindi||""}</div>
          <div style="margin-top:3px;font-size:8px;color:#475569">💡 7वां ≥28 + 10वां + 11वां = व्यापार योग${bs.house_7_points!=null?` | 7वें: ${bs.house_7_points}अंक`:""}</div>
          ${(()=>{const planIn7_=Object.entries(pl).filter(([c,p])=>p?.house===7);return planIn7_.length?`<div style="margin-top:3px;font-size:9px;color:#94A3B8">7वें में: ${planIn7_.map(([c])=>PH[c]||c).join(", ")}</div>`:"";})()}
          ${manglik?`<div style="margin-top:2px;font-size:9px;color:#FB7185">⚠️ मांगलिक दोष — मंगल ${ma_p.house}वें</div>`:`<div style="margin-top:2px;font-size:9px;color:#4ADE80">✅ मांगलिक दोष नहीं</div>`}
          ${veH?`<div style="font-size:9px;color:#F472B6">💕 जीवनसाथी: ${SPOUSE_N[veH]||""} (शुक्र ${veH}वें)</div>`:""}
        </div>`:""}
        ${ld.ranked_directions?.length>0?`<div style="padding:8px;border-radius:8px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2)">
          <div style="font-size:9px;color:#64748B;margin-bottom:4px">MODULE 6 — शुभ दिशाएं</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">
            ${ld.ranked_directions.map((d,i)=>`<div style="text-align:center;padding:3px;border-radius:4px;background:${i===0?"rgba(129,140,248,.18)":"rgba(255,255,255,.03)"}"><div style="font-size:14px;font-weight:900;color:${i===0?"#818CF8":"#475569"}">${d.rank}</div><div style="font-size:8px;color:${i===0?"#818CF8":"#475569"}">${d.direction}</div><div style="font-size:8px;color:#334155">${d.points}</div></div>`).join("")}
          </div>
        </div>`:""}
      </div>
      ${aa.happiness_ages?.length>0||aa.sorrow_ages?.length>0?`
      ${sect("MODULE 7 — सुख-दुख की आयु ⏰","#FB923C")}
      <div style="padding:4px 7px;border-radius:5px;background:rgba(251,146,60,.05);margin-bottom:5px;font-size:8px;color:#475569">💡 Σ(भाव 1→ग्रह भाव)×7÷27 = टर्निंग वर्ष | शुभ ग्रह=सुख, पाप ग्रह=कष्ट</div>
      <div class="two">
        ${aa.happiness_ages?.length>0?`<div style="padding:6px;border-radius:7px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18)">
          <div style="font-size:9px;font-weight:700;color:#4ADE80;margin-bottom:4px">✅ सुख की आयु</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${aa.happiness_ages.map(a=>`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.18)"><div style="font-size:18px;font-weight:900;color:#4ADE80">${a.age}</div><div style="font-size:8px;color:#86EFAC">${a.planet_hindi||a.planet}</div></div>`).join("")}</div>
        </div>`:""}
        ${aa.sorrow_ages?.length>0?`<div style="padding:6px;border-radius:7px;background:rgba(251,113,133,.06);border:1px solid rgba(251,113,133,.18)">
          <div style="font-size:9px;font-weight:700;color:#FB7185;margin-bottom:4px">⚠️ कष्ट की आयु</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${aa.sorrow_ages.map(a=>`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.18)"><div style="font-size:18px;font-weight:900;color:#FB7185">${a.age}</div><div style="font-size:8px;color:#FDA4AF">${a.planet_hindi||a.planet}</div></div>`).join("")}</div>
        </div>`:""}
      </div>`:""}
      ${foot(3,TOTAL_PAGES)}</div>${close}`,

    4: ()=>`${head("टर्निंग पॉइंट")}<div class="page">
      ${sect("अष्टकवर्ग टर्निंग पॉइंट — आयु सूत्र ⏳","#4ADE80")}
      <div style="padding:5px 8px;border-radius:5px;background:rgba(74,222,128,.05);margin-bottom:7px;font-size:9px;color:#475569">
        📐 आयु सूत्र: Σ(भाव 1→ग्रह भाव) × 7 ÷ 27 = टर्निंग वर्ष &nbsp;|&nbsp;
        <span style="color:#F59E0B">● = अभी (${now-1}–${now+10})</span>
        <span style="color:#4ADE80"> ✅ शुभ</span>
        <span style="color:#FB7185"> ⚠️ कष्ट</span>
      </div>
      ${tpHTML||`<div style="color:#475569;text-align:center;padding:14px">टर्निंग पॉइंट डेटा नहीं</div>`}
      ${foot(4,TOTAL_PAGES)}</div>${close}`,

    5: ()=>`${head("त्रिकोण + राहु-केतु + नवतारा")}<div class="page">
      ${sect("चतुर्विध त्रिकोण — जीवन दिशा","#C084FC")}
      ${tkHTML}
      <div style="padding:7px 9px;border-radius:8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);margin-top:4px">
        <div style="font-size:10px;font-weight:700;color:#F59E0B;margin-bottom:4px">💼 करियर फोकस</div>
        <div class="two">
          <div style="padding:4px 7px;border-radius:5px;background:rgba(74,222,128,.07)"><div style="font-size:10px;font-weight:900;color:#4ADE80">अर्थ &gt; काम</div><div style="font-size:8px;color:#64748B">कम मेहनत, भाग्य से धन | 9/10वें बलवान</div></div>
          <div style="padding:4px 7px;border-radius:5px;background:rgba(251,113,133,.07)"><div style="font-size:10px;font-weight:900;color:#FB7185">काम &gt; अर्थ</div><div style="font-size:8px;color:#64748B">श्रम से धन | 6वें बलवान ग्रह</div></div>
        </div>
        <div style="margin-top:4px;padding:4px 7px;border-radius:5px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18)">
          <div style="font-size:9px;font-weight:700;color:#EF4444">🔴 अर्थ + मोक्ष = विरोधाभास! पैसा + त्याग एक साथ नहीं। एक मार्ग चुनें।</div>
        </div>
      </div>
      <div class="two" style="margin-top:8px">
        ${rahuH?`<div style="padding:9px;border-radius:9px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.22)">
          <div style="font-size:11px;font-weight:900;color:#818CF8;margin-bottom:4px">🐍 राहु — ${rahuH}वें भाव में</div>
          <div style="font-size:10px;color:#CBD5E1">${RAHU_T[rahuH]||"—"}</div>
        </div>`:""}
        ${ketuH?`<div style="padding:9px;border-radius:9px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.22)">
          <div style="font-size:11px;font-weight:900;color:#2DD4BF;margin-bottom:4px">🪐 केतु — ${ketuH}वें भाव में</div>
          <div style="font-size:10px;color:#CBD5E1">${KETU_T[ketuH]||"—"}</div>
        </div>`:""}
      </div>
      ${sect("नवतारा — जन्म नक्षत्र + रत्न","#FB923C")}
      ${bn.birth_nakshatra?`<div style="padding:6px 9px;border-radius:7px;background:rgba(251,146,60,.09);border:1px solid rgba(251,146,60,.22);margin-bottom:6px;font-size:12px;font-weight:900;color:#FB923C">⭐ जन्म नक्षत्र: ${bn.birth_nakshatra.name_hindi||""} (${bn.birth_nakshatra.name_english||""}) — #${bn.birth_nakshatra.number||""}</div>`:""}
      <div class="two">
        ${gems.highly_beneficial?.length>0?`<div style="padding:7px;border-radius:7px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18)">
          <div style="font-size:9px;font-weight:700;color:#4ADE80;margin-bottom:4px">💎 पहनें:</div>
          ${gems.highly_beneficial.map(g=>`<div style="padding:2px 6px;border-radius:4px;background:rgba(74,222,128,.09);margin-bottom:3px"><span style="font-size:11px;font-weight:700;color:#4ADE80">${g.gemstone_hindi}</span> <span style="font-size:9px;color:#475569">${g.gemstone_english}</span></div>`).join("")}
        </div>`:""}
        ${gems.avoid?.length>0?`<div style="padding:7px;border-radius:7px;background:rgba(251,113,133,.06);border:1px solid rgba(251,113,133,.18)">
          <div style="font-size:9px;font-weight:700;color:#FB7185;margin-bottom:4px">🚫 वर्जित:</div>
          ${gems.avoid.map(g=>`<div style="padding:2px 6px;border-radius:4px;background:rgba(251,113,133,.09);margin-bottom:3px"><span style="font-size:11px;font-weight:700;color:#FB7185">${g.gemstone_hindi}</span> <span style="font-size:9px;color:#475569">${g.gemstone_english}</span></div>`).join("")}
        </div>`:""}
      </div>
      ${foot(5,TOTAL_PAGES)}</div>${close}`,

    6: ()=>`${head("शनि + स्वास्थ्य + पुनर्जन्म")}<div class="page">
      ${sect("शनि — साढ़े साती / ढैया","#C084FC")}
      ${ss.is_active?`<div style="padding:9px;border-radius:9px;background:rgba(251,113,133,.07);border:1px solid rgba(251,113,133,.22);margin-bottom:5px">
        <div style="font-size:13px;font-weight:900;color:#FB7185;margin-bottom:3px">⚠️ साढ़े साती सक्रिय!</div>
        <div style="font-size:11px;color:#CBD5E1">फेज: ${ss.phase||"—"} | प्रारंभ: ${ss.start||"—"} | समाप्त: ${ss.end||"—"}</div>
        <div style="margin-top:4px;font-size:9px;color:#64748B">⚕️ उपाय: शनिवार व्रत | हनुमान चालीसा | काले तिल दान</div>
      </div>`:`<div style="padding:8px 9px;border-radius:8px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18)"><div style="font-size:12px;font-weight:900;color:#4ADE80">✅ अभी साढ़े साती और ढैया नहीं — शुभ समय!</div></div>`}
      ${dh.is_active?`<div style="padding:7px 9px;border-radius:7px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);margin-top:4px"><div style="font-size:11px;font-weight:900;color:#F59E0B">⚡ ढैया सक्रिय | ${dh.start||"—"} – ${dh.end||"—"}</div></div>`:""}

      ${sect("स्वास्थ्य — ग्रह-रोग विश्लेषण","#EF4444")}
      ${afflicted.length>0?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${afflicted.slice(0,8).map(([c,p])=>{const d=p.dignityHindi||p.dignity||"";return`<div style="padding:6px 8px;border-radius:7px;background:rgba(251,113,133,.06);border:1px solid rgba(251,113,133,.18)">
          <div style="font-size:11px;font-weight:900;color:#FB7185">${PH[c]||c} ${PS[c]||""} — ${p.house}वें (${d})</div>
          ${(DIS_MAP[c]||[]).slice(0,2).map(dis=>`<div style="font-size:9px;color:#CBD5E1">• ${dis}</div>`).join("")}
        </div>`;}).join("")}
      </div>`:`<div style="padding:7px 9px;border-radius:7px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18)"><div style="color:#4ADE80;font-size:11px;font-weight:700">✅ कोई विशेष स्वास्थ्य चिंता नहीं</div></div>`}

      ${sect("पुनर्जन्म विश्लेषण","#2DD4BF")}
      ${(()=>{const prev=pj.previous_life||pj.pichla_janam||{};const next=pj.next_life||pj.agla_janam||{};
        if(!prev.realm&&!pj.realm&&!next.realm) return`<div style="color:#475569;text-align:center;padding:8px">डेटा उपलब्ध नहीं</div>`;
        return`<div class="two">
          <div style="padding:8px;border-radius:7px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.18)">
            <div style="font-size:9px;color:#64748B;margin-bottom:2px">🔮 पिछला जन्म</div>
            <div style="font-size:13px;font-weight:900;color:#2DD4BF">${prev.realm||pj.realm||"—"}</div>
            <div style="font-size:10px;color:#94A3B8;margin-top:1px">${prev.description||pj.description||""}</div>
            <div style="font-size:8px;color:#475569">गुणवत्ता: ${prev.quality||pj.quality||"—"} | कर्म स्कोर: ${pj.karma_score||"—"}</div>
          </div>
          <div style="padding:8px;border-radius:7px;background:rgba(192,132,252,.06);border:1px solid rgba(192,132,252,.18)">
            <div style="font-size:9px;color:#64748B;margin-bottom:2px">🌟 अगला जन्म</div>
            <div style="font-size:13px;font-weight:900;color:#C084FC">${next.realm||pj.next_realm||"—"}</div>
            <div style="font-size:10px;color:#94A3B8;margin-top:1px">${next.description||pj.next_description||""}</div>
          </div>
        </div>`;
      })()}
      ${foot(6,TOTAL_PAGES)}</div>${close}`,

    7: ()=>`${head("कामुकता + उन्नत सूत्र")}<div class="page">
      ${sect("कामुकता — ग्रह विश्लेषण","#F472B6")}
      ${(()=>{
        const together=ma_p?.house&&veH&&ma_p.house===veH;
        const raVe=rahuH&&veH&&rahuH===veH;
        const v12=veH===12,v8=veH===8,v5=veH===5;
        let score=35;
        if(together)score+=30;if(raVe)score+=25;if(v12)score+=15;if(v8)score+=10;if(v5)score+=12;
        score=Math.min(100,score);
        const sc=score>=70?"#EF4444":score>=50?"#FB923C":score>=35?"#F59E0B":"#4ADE80";
        const yks=[];
        if(together)yks.push(`मंगल+शुक्र ${ma_p.house}वें`);
        if(raVe)yks.push(`राहु+शुक्र ${rahuH}वें`);
        if(v12)yks.push("शुक्र 12वें (गुप्त इच्छाएं)");
        if(v8)yks.push("शुक्र 8वें (गहरी आसक्ति)");
        if(v5)yks.push("शुक्र 5वें (प्रेम योग)");
        return`<div style="padding:10px;border-radius:9px;background:rgba(244,114,182,.06);border:1px solid rgba(244,114,182,.22)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
            <div style="text-align:center;min-width:50px">
              <div style="font-size:30px;font-weight:900;color:${sc}">${score}</div>
              <div style="font-size:8px;color:#64748B">/100 जोखिम</div>
            </div>
            <div>
              <div style="font-size:13px;font-weight:900;color:${sc}">${score>=70?"🔴 उच्च जोखिम":score>=50?"🟠 मध्यम-उच्च":score>=35?"🟡 मध्यम":"🟢 कम"}</div>
              ${yks.length?`<div style="font-size:9px;color:#94A3B8;margin-top:2px">सक्रिय: ${yks.join(" | ")}</div>`:`<div style="font-size:9px;color:#4ADE80;margin-top:2px">✅ कोई विशेष योग नहीं</div>`}
              ${veH?`<div style="font-size:9px;color:#64748B;margin-top:1px">💕 जीवनसाथी: ${SPOUSE_N[veH]||""} (शुक्र ${veH}वें)</div>`:""}
            </div>
          </div>
          <div style="font-size:10px;color:#64748B;padding:4px 6px;border-radius:4px;background:rgba(255,255,255,.03)">⚕️ उपाय: शुक्रवार व्रत | शिव-पार्वती पूजा | ध्यान+योग प्रतिदिन</div>
        </div>`;
      })()}

      ${sect("उन्नत सूत्र — सफलता + राजयोग","#F59E0B")}
      <div class="two">
        ${(as_.success_age||as_.age)?`<div style="padding:9px;border-radius:9px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.22)">
          <div style="font-size:9px;color:#64748B">🌟 सफलता की उम्र</div>
          <div style="font-size:38px;font-weight:900;color:#22D3EE;line-height:1.1">${as_.success_age||as_.age}</div>
          <div style="font-size:9px;color:#94A3B8">वर्ष से सफलता प्रारंभ</div>
          ${as_.description?`<div style="font-size:8px;color:#475569;margin-top:2px">${as_.description}</div>`:""}
        </div>`:""}
        ${ra.activation_age?`<div style="padding:9px;border-radius:9px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.22)">
          <div style="font-size:9px;color:#64748B">✨ राजयोग सक्रिय</div>
          <div style="font-size:38px;font-weight:900;color:#F59E0B;line-height:1.1">${ra.activation_age}</div>
          <div style="font-size:9px;color:#94A3B8">वर्ष की उम्र में</div>
          ${ra.description?`<div style="font-size:8px;color:#475569;margin-top:2px">${ra.description}</div>`:""}
        </div>`:""}
      </div>
      ${cw.continuous_wealth_flow!=null?`<div style="margin-top:5px;padding:7px 9px;border-radius:7px;background:${cw.continuous_wealth_flow?"rgba(74,222,128,.06)":"rgba(251,113,133,.06)"};border:1px solid ${cw.continuous_wealth_flow?"rgba(74,222,128,.18)":"rgba(251,113,133,.18)"}">
        <div style="font-size:11px;font-weight:700;color:${cw.continuous_wealth_flow?"#4ADE80":"#FB7185"}">${cw.continuous_wealth_flow?"✅ धन का निरंतर प्रवाह":"⚠️ धन के लिए संघर्ष"}</div>
        ${cw.prediction_hindi?`<div style="font-size:9px;color:#64748B;margin-top:1px">${cw.prediction_hindi}</div>`:""}
      </div>`:""}
      ${foot(7,TOTAL_PAGES)}</div>${close}`,

    8: ()=>`${head("उपाय + निष्कर्ष")}<div class="page">
      ${sect("समग्र उपाय एवं मार्गदर्शन","#4ADE80")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:7px">
        ${["🌅 प्रतिदिन सूर्य नमस्कार + गायत्री मंत्र (108 बार)","🙏 नवग्रह मंत्र — प्रत्येक रविवार प्रातःकाल","🐄 गाय को रोटी+गुड़ — प्रतिदिन यदि संभव हो","💧 पवित्र जल में फूल अर्पण — गंगाजल सर्वोत्तम","📿 रुद्राक्ष धारण — ज्योतिषी की सलाह अनुसार","🕯️ सायंकाल घर में दीपक — नियमित प्रज्वलित करें"].map(r=>`<div style="padding:5px 7px;border-radius:6px;background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.15);font-size:10px;color:#CBD5E1">${r}</div>`).join("")}
      </div>
      ${sect("विशेष ग्रह उपाय","#22D3EE")}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:7px">
        ${[{p:"सूर्य",r:"रविवार व्रत, गेहूं+गुड़ दान, लाल वस्त्र",c:"#F59E0B"},{p:"चंद्र",r:"सोमवार व्रत, सफेद वस्त्र, दूध-चावल दान",c:"#CBD5E1"},{p:"मंगल",r:"मंगलवार हनुमान पूजा, लाल मसूर दान",c:"#FB7185"},{p:"बुध",r:"बुधवार, हरी वस्तु दान, गणेश पूजा",c:"#4ADE80"},{p:"गुरु",r:"गुरुवार, केले+हल्दी दान, पीले वस्त्र",c:"#F59E0B"},{p:"शुक्र",r:"शुक्रवार, सफेद मिठाई, लक्ष्मी पूजा",c:"#F472B6"}].map(x=>`<div style="padding:5px 7px;border-radius:6px;background:${x.c}07;border:1px solid ${x.c}20"><div style="font-size:10px;font-weight:700;color:${x.c}">${x.p}</div><div style="font-size:8px;color:#64748B;margin-top:1px">${x.r}</div></div>`).join("")}
      </div>
      ${mcD.overallScore?`<div style="padding:13px 15px;border-radius:11px;background:${mcD.overallScore>=75?"rgba(34,211,238,.07)":mcD.overallScore>=50?"rgba(245,158,11,.07)":"rgba(251,113,133,.07)"};border:1.5px solid ${mcD.overallScore>=75?"rgba(34,211,238,.28)":mcD.overallScore>=50?"rgba(245,158,11,.28)":"rgba(251,113,133,.28)"}">
        <div style="font-size:14px;font-weight:900;color:#F59E0B;margin-bottom:5px">🪐 अंतिम निष्कर्ष — ${name}</div>
        <div style="font-size:26px;font-weight:900;color:${mcD.overallScore>=75?"#22D3EE":mcD.overallScore>=50?"#F59E0B":"#FB7185"}">समग्र स्कोर: ${mcD.overallScore}/100</div>
        <div style="font-size:11px;color:#CBD5E1;margin-top:5px;line-height:1.6">${mcD.summary||""}</div>
        ${mcD.bestPeriod?`<div style="font-size:10px;color:#4ADE80;margin-top:4px;font-weight:700">✅ शुभ काल: ${mcD.bestPeriod}</div>`:""}
        ${mcD.caution?`<div style="font-size:10px;color:#FB7185;margin-top:2px;font-weight:700">⚠️ सावधानी: ${mcD.caution}</div>`:""}
        <div style="margin-top:9px;font-size:8px;color:#334155;text-align:right">Generated: ${new Date().toLocaleDateString("hi-IN")} | Swiss Ephemeris + Nadi AI | ${name}</div>
      </div>`:`<div style="padding:11px;border-radius:9px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18)"><div style="font-size:12px;font-weight:700;color:#F59E0B">🪐 ${name} की सम्पूर्ण वैदिक कुंडली — ${new Date().toLocaleDateString("hi-IN")}</div></div>`}
      ${foot(8,TOTAL_PAGES)}
    </div>${close}`,
  };

  // ── Nadi Data Extract ──
  // full_nadi_analysis() returns these exact keys (from nadi_jyotish_engine.py)
  const nadiEd = ed.nadi_jyotish || ed.nadi || ed.nadiResults || ed.nadi_results || {};

  // ── Generic fallback renderer (for any unexpected shape) ──
  const renderMsgList = (msgs, color="#a78bfa") => {
    if (!msgs || msgs.length === 0) return `<div style="color:#475569;font-size:10px;padding:6px">कोई संदेश नहीं</div>`;
    return msgs.map(m => `<div style="padding:5px 9px;border-radius:6px;background:${color}10;border-left:3px solid ${color};margin-bottom:4px;font-size:10px;color:#CBD5E1;line-height:1.6">${m}</div>`).join("");
  };
  const nadiCard = (title, value, color="#a78bfa", sub="") =>
    `<div style="padding:9px 11px;border-radius:8px;background:${color}0A;border:1px solid ${color}28;margin-bottom:6px">
      <div style="font-size:9px;color:#64748B;margin-bottom:2px">${title}</div>
      <div style="font-size:13px;font-weight:900;color:${color}">${value}</div>
      ${sub?`<div style="font-size:9px;color:#94A3B8;margin-top:2px">${sub}</div>`:""}
    </div>`;
  const noData = () => `<div style="color:#475569;text-align:center;padding:20px;border:1px dashed rgba(124,58,237,.3);border-radius:8px;font-size:11px">नाड़ी इंजन डेटा उपलब्ध नहीं<br/><span style="font-size:9px;color:#334155">chartData.enginesData.nadi_jyotish → सुनिश्चित करें कि backend इसे भेज रहा है</span></div>`;

  // ── PAGE 9: ग्रह पीड़ा (planet_afflictions) ──
  pages[9] = () => {
    const aff = nadiEd.planet_afflictions || {};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
    const body = Object.keys(aff).length === 0 ? noData() :
      Object.entries(aff).map(([p, d]) => {
        if (!d) return "";
        const c = d.afflicted ? "#FB7185" : "#4ADE80";
        return `<div style="padding:9px 11px;border-radius:9px;background:${c}08;border:1px solid ${c}25;margin-bottom:7px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="font-size:13px;font-weight:900;color:${c}">${PH2[p]||p}</div>
            <div style="font-size:10px;padding:1px 7px;border-radius:4px;background:${c}18;color:${c};font-weight:700">${d.afflicted?"⚠️ पीड़ित":"✅ सामान्य"}</div>
            ${d.flags?.combust?`<div style="font-size:9px;padding:1px 6px;border-radius:4px;background:rgba(251,146,60,.15);color:#FB923C">🔥 अस्त</div>`:""}
            ${d.flags?.retrograde?`<div style="font-size:9px;padding:1px 6px;border-radius:4px;background:rgba(129,140,248,.15);color:#818CF8">⟲ वक्री</div>`:""}
            ${d.flags?.weak?`<div style="font-size:9px;padding:1px 6px;border-radius:4px;background:rgba(251,113,133,.12);color:#FB7185">कमजोर</div>`:""}
          </div>
          ${d.messages?.length>0 ? renderMsgList(d.messages, c) : ""}
        </div>`;
      }).join("");
    return `${head("नाड़ी — ग्रह पीड़ा")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(239,68,68,.1);border:1.5px solid rgba(239,68,68,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💥</span>
        <div><div style="font-size:14px;font-weight:900;color:#EF4444">ग्रह पीड़ा विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN — पीड़ित ग्रह जातक के जीवन के संबंधित क्षेत्र में बाधा देते हैं</div></div>
      </div>
      ${body}${foot(9,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 10: रोग (disease) ──
  pages[10] = () => {
    const dis = nadiEd.disease || {};
    const body = !dis || Object.keys(dis).length===0 ? noData() : `
      ${dis.summary ? `<div style="padding:10px;border-radius:9px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);margin-bottom:8px;font-size:11px;font-weight:700;color:#FB7185">${dis.summary}</div>` : ""}
      ${dis.diseases?.length>0 ? `${sect("चिह्नित रोग","#DC2626")}${dis.diseases.map(d=>
        `<div style="padding:7px 10px;border-radius:7px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);margin-bottom:5px">
          <div style="font-size:11px;font-weight:700;color:#FB7185">${d.name||d}</div>
          ${d.planet?`<div style="font-size:9px;color:#64748B;margin-top:1px">ग्रह: ${d.planet} | भाव: ${d.house||"—"}</div>`:""}
          ${d.description?`<div style="font-size:9px;color:#94A3B8;margin-top:2px">${d.description}</div>`:""}
        </div>`).join("")}` : ""}
      ${dis.messages?.length>0 ? `${sect("विश्लेषण","#EF4444")}${renderMsgList(dis.messages,"#FB7185")}` : ""}
      ${dis.remedies?.length>0 ? `${sect("उपाय","#4ADE80")}${dis.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}` : ""}
    `;
    return `${head("नाड़ी — रोग")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(220,38,38,.1);border:1.5px solid rgba(220,38,38,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🏥</span>
        <div><div style="font-size:14px;font-weight:900;color:#DC2626">रोग विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">ग्रह-भाव-नक्षत्र से रोग की सम्भावना</div></div>
      </div>
      ${body}${foot(10,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 11: आयु (lifespan) ──
  pages[11] = () => {
    const ls = nadiEd.lifespan || {};
    const lc = ls.lifespan_category;
    const lColor = lc==="Long"?"#4ADE80":lc==="Medium"?"#F59E0B":"#FB7185";
    const body = !ls || Object.keys(ls).length===0 ? noData() : `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        ${nadiCard("आयु वर्ग", lc==="Long"?"दीर्घायु ✅":lc==="Medium"?"मध्यमायु":"अल्पायु ⚠️", lColor)}
        ${nadiCard("आयु स्कोर", ls.score!=null?ls.score+"/100":"—", lColor)}
      </div>
      ${ls.messages?.length>0 ? `${sect("आयु विश्लेषण","#D97706")}${renderMsgList(ls.messages,"#D97706")}` : ""}
    `;
    return `${head("नाड़ी — आयु")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(217,119,6,.1);border:1.5px solid rgba(217,119,6,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⏳</span>
        <div><div style="font-size:14px;font-weight:900;color:#D97706">आयु विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN दीर्घायु सूत्र — ग्रह बल + भाव स्थिति</div></div>
      </div>
      ${body}${foot(11,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 12: विवाह (marriage) ──
  pages[12] = () => {
    const mar = nadiEd.marriage || {};
    const body = !mar || Object.keys(mar).length===0 ? noData() : `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
        ${mar.promise!=null?nadiCard("विवाह योग", mar.promise?"✅ हाँ":"❌ कठिन", mar.promise?"#4ADE80":"#FB7185"):""}
        ${mar.timing?nadiCard("विवाह समय", mar.timing, "#EC4899"):""}
        ${mar.type?nadiCard("विवाह प्रकार", mar.type, "#F472B6"):""}
      </div>
      ${mar.manglik!=null?`<div style="padding:8px 11px;border-radius:8px;background:${mar.manglik?"rgba(251,113,133,.08)":"rgba(74,222,128,.08)"};border:1px solid ${mar.manglik?"rgba(251,113,133,.25)":"rgba(74,222,128,.25)"};margin-bottom:7px">
        <div style="font-size:12px;font-weight:900;color:${mar.manglik?"#FB7185":"#4ADE80"}">${mar.manglik?"⚠️ मांगलिक दोष":"✅ मांगलिक दोष नहीं"}</div>
        ${mar.manglik_cancelled?`<div style="font-size:10px;color:#4ADE80;margin-top:2px">✅ दोष निवारण हुआ</div>`:""}
        ${mar.manglik_messages?.length>0?`<div style="margin-top:4px">${renderMsgList(mar.manglik_messages,"#FB7185")}</div>`:""}
      </div>`:""}
      ${mar.divorce_score!=null?`${nadiCard("तलाक संभावना", mar.divorce_score+"/100", mar.divorce_score>50?"#FB7185":"#4ADE80", mar.divorce_risk||"")}`:""}
      ${mar.spouse_traits?.length>0?`${sect("जीवनसाथी विशेषता","#F472B6")}${renderMsgList(mar.spouse_traits,"#F472B6")}`:""}
      ${mar.messages?.length>0?`${sect("विवाह विश्लेषण","#EC4899")}${renderMsgList(mar.messages,"#EC4899")}`:""}
      ${mar.remedies?.length>0?`${sect("उपाय","#4ADE80")}${mar.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — विवाह")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(236,72,153,.1);border:1.5px solid rgba(236,72,153,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💍</span>
        <div><div style="font-size:14px;font-weight:900;color:#EC4899">विवाह विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN विवाह योग, समय, मांगलिक, जीवनसाथी</div></div>
      </div>
      ${body}${foot(12,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 13: दुर्घटना (accident) ──
  pages[13] = () => {
    const acc = nadiEd.accident || {};
    const body = !acc || Object.keys(acc).length===0 ? noData() : `
      <div style="margin-bottom:8px">
        ${acc.risk_level?nadiCard("जोखिम स्तर", acc.risk_level, acc.risk_level==="HIGH"?"#FB7185":acc.risk_level==="MEDIUM"?"#F59E0B":"#4ADE80"):""}
        ${acc.score!=null?nadiCard("दुर्घटना स्कोर", acc.score+"/100", acc.score>60?"#FB7185":"#4ADE80"):""}
      </div>
      ${acc.messages?.length>0?`${sect("दुर्घटना विश्लेषण","#F97316")}${renderMsgList(acc.messages,"#F97316")}`:""}
      ${acc.coma_risk?`<div style="padding:8px;border-radius:7px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);margin:6px 0;font-size:11px;font-weight:700;color:#EF4444">⚠️ कोमा / गहरी चोट का योग</div>`:""}
      ${acc.remedies?.length>0?`${sect("सावधानी व उपाय","#4ADE80")}${acc.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — दुर्घटना")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(249,115,22,.1);border:1.5px solid rgba(249,115,22,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⚠️</span>
        <div><div style="font-size:14px;font-weight:900;color:#F97316">दुर्घटना विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">मंगल + केतु + वक्री + 6/8/12वें भाव संयोग</div></div>
      </div>
      ${body}${foot(13,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 14: संतान (child) ──
  pages[14] = () => {
    const ch = nadiEd.child || {};
    const body = !ch || Object.keys(ch).length===0 ? noData() : `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        ${ch.promise!=null?nadiCard("संतान योग", ch.promise?"✅ हाँ":"⚠️ कठिन", ch.promise?"#10B981":"#FB7185"):""}
        ${ch.son_promise!=null?nadiCard("पुत्र योग", ch.son_promise?"✅ हाँ":"❌ कम", ch.son_promise?"#10B981":"#64748B"):""}
        ${ch.daughter_promise!=null?nadiCard("पुत्री योग", ch.daughter_promise?"✅ हाँ":"❌ कम", ch.daughter_promise?"#10B981":"#64748B"):""}
        ${ch.child_loss_risk?nadiCard("संतान हानि", "⚠️ जोखिम", "#FB7185"):""}
      </div>
      ${ch.messages?.length>0?`${sect("संतान विश्लेषण","#10B981")}${renderMsgList(ch.messages,"#10B981")}`:""}
      ${ch.remedies?.length>0?`${sect("उपाय","#4ADE80")}${ch.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — संतान")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">👶</span>
        <div><div style="font-size:14px;font-weight:900;color:#10B981">संतान विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">गुरु + 5वां भाव + संतान कारक</div></div>
      </div>
      ${body}${foot(14,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 15: मानसिक शांति (mental_peace) ──
  pages[15] = () => {
    const mp = nadiEd.mental_peace || {};
    const sc = mp.stress_score ?? mp.score ?? null;
    const scColor = sc!=null?(sc>60?"#FB7185":sc>35?"#F59E0B":"#4ADE80"):"#64748B";
    const body = !mp || Object.keys(mp).length===0 ? noData() : `
      ${sc!=null?`<div style="text-align:center;padding:12px;border-radius:10px;background:${scColor}08;border:1.5px solid ${scColor}25;margin-bottom:10px">
        <div style="font-size:9px;color:#64748B;margin-bottom:2px">तनाव स्कोर</div>
        <div style="font-size:40px;font-weight:900;color:${scColor}">${sc}</div>
        <div style="font-size:11px;color:${scColor}">${sc>60?"🔴 उच्च तनाव":sc>35?"🟡 मध्यम":"🟢 मानसिक शांति"}</div>
      </div>`:""}
      ${mp.afflicting_planets?.length>0?`${sect("तनाव देने वाले ग्रह","#8B5CF6")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${mp.afflicting_planets.map(p=>`<span style="padding:2px 8px;border-radius:5px;background:rgba(139,92,246,.15);color:#a78bfa;font-size:10px;font-weight:700;border:1px solid rgba(139,92,246,.3)">${p}</span>`).join("")}</div>`:""}
      ${mp.messages?.length>0?`${sect("मानसिक विश्लेषण","#8B5CF6")}${renderMsgList(mp.messages,"#8B5CF6")}`:""}
      ${mp.remedies?.length>0?`${sect("मन की शांति के उपाय","#4ADE80")}${mp.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — मानसिक शांति")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(139,92,246,.1);border:1.5px solid rgba(139,92,246,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🧠</span>
        <div><div style="font-size:14px;font-weight:900;color:#8B5CF6">मानसिक शांति मीटर</div>
        <div style="font-size:9px;color:#64748B">चंद्र + लग्न + पापी ग्रह संयोग से तनाव स्कोर</div></div>
      </div>
      ${body}${foot(15,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 16: करियर - धन (career) ──
  pages[16] = () => {
    const car = nadiEd.career || {};
    const body = !car || Object.keys(car).length===0 ? noData() : `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        ${car.career_type?nadiCard("करियर प्रकार", car.career_type, "#22D3EE"):""}
        ${car.business_promise!=null?nadiCard("व्यापार योग", car.business_promise?"✅ उत्तम":"⚠️ नौकरी बेहतर", car.business_promise?"#4ADE80":"#F59E0B"):""}
        ${car.govt_job?nadiCard("सरकारी नौकरी", "✅ योग है", "#22D3EE"):""}
        ${car.foreign_connection?nadiCard("विदेश योग", "✅ संभव", "#818CF8"):""}
      </div>
      ${car.debt_risk?`<div style="padding:8px;border-radius:7px;background:rgba(251,113,133,.08);border:1px solid rgba(251,113,133,.25);margin-bottom:7px;font-size:11px;font-weight:700;color:#FB7185">⚠️ कर्ज / आर्थिक संकट का योग — ${car.debt_severity||""}</div>`:""}
      ${car.messages?.length>0?`${sect("करियर विश्लेषण","#22D3EE")}${renderMsgList(car.messages,"#22D3EE")}`:""}
      ${car.remedies?.length>0?`${sect("उपाय","#4ADE80")}${car.remedies.map(r=>`<div style="padding:5px 9px;border-radius:6px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);margin-bottom:4px;font-size:10px;color:#CBD5E1">🙏 ${r}</div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — करियर-धन")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(34,211,238,.1);border:1.5px solid rgba(34,211,238,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💼</span>
        <div><div style="font-size:14px;font-weight:900;color:#22D3EE">करियर - धन विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">शनि + 10वां + 2वां + 11वां भाव</div></div>
      </div>
      ${body}${foot(16,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 17: पूर्व जन्म (past_life + curses) ──
  pages[17] = () => {
    const pl2 = nadiEd.past_life || {};
    const cur = nadiEd.curses || [];
    const body = (!pl2 || Object.keys(pl2).length===0) && cur.length===0 ? noData() : `
      ${pl2.previous_lagna?nadiCard("पूर्व जन्म लग्न", pl2.previous_lagna, "#2DD4BF", pl2.description||""):""}
      ${pl2.karmic_debt?`<div style="padding:8px;border-radius:7px;background:rgba(45,212,191,.08);border:1px solid rgba(45,212,191,.2);margin-bottom:7px;font-size:11px;color:#CBD5E1">${pl2.karmic_debt}</div>`:""}
      ${cur.length>0?`${sect("पूर्वजन्म श्राप","#A855F7")}${cur.map(c=>
        `<div style="padding:8px 10px;border-radius:7px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.22);margin-bottom:5px">
          <div style="font-size:11px;font-weight:700;color:#a78bfa">${c.curse_type||c.type||c}</div>
          ${c.messages?.length>0?`<div style="margin-top:4px">${renderMsgList(c.messages,"#a78bfa")}</div>`:""}
          ${c.remedies?.length>0?c.remedies.map(r=>`<div style="font-size:9px;color:#4ADE80;margin-top:2px">🙏 ${r}</div>`).join(""):""}
        </div>`).join("")}`:""}
    `;
    return `${head("नाड़ी — पूर्व जन्म")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(45,212,191,.1);border:1.5px solid rgba(45,212,191,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🔮</span>
        <div><div style="font-size:14px;font-weight:900;color:#2DD4BF">पूर्व जन्म विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">पूर्वजन्म लग्न + कर्म ऋण + श्राप</div></div>
      </div>
      ${body}${foot(17,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 18: वक्री ग्रह (retrograde) ──
  pages[18] = () => {
    const ret = nadiEd.retrograde || {};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
    const retroList = ret.retrograde_planets || ret.planets || [];
    const body = !ret || Object.keys(ret).length===0 ? noData() : `
      ${retroList.length>0?`${sect(`वक्री ग्रह — ${retroList.length}`,"#818CF8")}<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${retroList.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(129,140,248,.15);color:#818CF8;font-size:11px;font-weight:700;border:1px solid rgba(129,140,248,.3)">⟲ ${PH2[p]||p}</span>`).join("")}</div>`:`<div style="color:#64748B;font-size:11px;padding:8px">कोई वक्री ग्रह नहीं</div>`}
      ${ret.messages?.length>0?`${sect("वक्री विश्लेषण","#818CF8")}${renderMsgList(ret.messages,"#818CF8")}`:""}
      ${ret.effects?.length>0?`${sect("प्रभाव","#6366F1")}${renderMsgList(ret.effects,"#6366F1")}`:""}
    `;
    return `${head("नाड़ी — वक्री ग्रह")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(129,140,248,.1);border:1.5px solid rgba(129,140,248,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⟲</span>
        <div><div style="font-size:14px;font-weight:900;color:#818CF8">वक्री ग्रह विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">राहु/केतु छोड़कर, 50% शक्ति में कमी + विलंब</div></div>
      </div>
      ${body}${foot(18,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 19: अष्टम भाव (eighth_house) ──
  pages[19] = () => {
    const eh = nadiEd.eighth_house || {};
    const dt = nadiEd.death_timing || {};
    const body = !eh || Object.keys(eh).length===0 ? noData() : `
      ${eh.summary?nadiCard("8वें भाव सार", eh.summary, "#6366F1"):""}
      ${eh.messages?.length>0?`${sect("अष्टम भाव विश्लेषण","#6366F1")}${renderMsgList(eh.messages,"#6366F1")}`:""}
      ${dt && Object.keys(dt).length>0?`${sect("मृत्यु काल संकेत","#475569")}<div style="padding:8px;border-radius:7px;background:rgba(71,85,105,.08);border:1px solid rgba(71,85,105,.25);font-size:10px;color:#94A3B8">${renderMsgList(dt.messages||[],"#475569")}</div>`:""}
    `;
    return `${head("नाड़ी — अष्टम भाव")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🌑</span>
        <div><div style="font-size:14px;font-weight:900;color:#6366F1">अष्टम भाव विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">आयु, रहस्य, परिवर्तन, गूढ़ शक्तियां</div></div>
      </div>
      ${body}${foot(19,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 20: रत्न (gemstones) ──
  pages[20] = () => {
    const gems2 = nadiEd.gemstones || {};
    const GEM_H={SUN:"माणिक",MOON:"मोती",MARS:"मूंगा",MERCURY:"पन्ना",JUPITER:"पुखराज",VENUS:"हीरा",SATURN:"नीलम",RAHU:"गोमेद",KETU:"लहसुनिया"};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
    const body = !gems2 || Object.keys(gems2).length===0 ? noData() : `
      ${sect("नाड़ी रत्न सुझाव","#14B8A6")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${Object.entries(gems2).map(([p,g])=>{
          if(!g) return "";
          const c=g.recommended?"#4ADE80":"#FB7185";
          return `<div style="padding:9px;border-radius:8px;background:${c}08;border:1px solid ${c}22">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <div style="font-size:11px;font-weight:700;color:#F59E0B">${PH2[p]||p}</div>
              <div style="font-size:16px">${GEM_H[p]||""}</div>
              <div style="font-size:9px;padding:1px 6px;border-radius:4px;background:${c}18;color:${c};font-weight:700">${g.recommended?"✅ पहनें":"🚫 वर्जित"}</div>
            </div>
            ${g.gemstone_name?`<div style="font-size:10px;color:#CBD5E1">${g.gemstone_name}</div>`:""}
            ${g.reason?`<div style="font-size:9px;color:#64748B;margin-top:1px">${g.reason}</div>`:""}
          </div>`;
        }).join("")}
      </div>
    `;
    return `${head("नाड़ी — रत्न")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(20,184,166,.1);border:1.5px solid rgba(20,184,166,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💎</span>
        <div><div style="font-size:14px;font-weight:900;color:#14B8A6">नाड़ी रत्न विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">लग्न + ग्रह स्थिति आधारित रत्न सुझाव</div></div>
      </div>
      ${body}${foot(20,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 21: विष नवमांश (vish_navamsha) ──
  pages[21] = () => {
    const vn = nadiEd.vish_navamsha || {};
    const body = !vn || Object.keys(vn).length===0 ? noData() : `
      ${vn.vish_planets?.length>0?`${sect("विष नवमांश ग्रह","#A855F7")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${vn.vish_planets.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(168,85,247,.15);color:#a78bfa;font-size:11px;font-weight:700;border:1px solid rgba(168,85,247,.3)">☠️ ${p}</span>`).join("")}</div>`:""}
      ${vn.pushkara_planets?.length>0?`${sect("पुष्कर नवमांश ग्रह","#4ADE80")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${vn.pushkara_planets.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(74,222,128,.12);color:#4ADE80;font-size:11px;font-weight:700;border:1px solid rgba(74,222,128,.25)">✨ ${p}</span>`).join("")}</div>`:""}
      ${vn.venus_vish_warning?`<div style="padding:9px;border-radius:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);margin-bottom:7px;font-size:11px;font-weight:700;color:#FB7185">⚠️ शुक्र विष नवमांश — विवाह में विशेष सावधानी</div>`:""}
      ${vn.messages?.length>0?`${sect("विष नवमांश विश्लेषण","#A855F7")}${renderMsgList(vn.messages,"#a78bfa")}`:""}
    `;
    return `${head("नाड़ी — विष नवमांश")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(168,85,247,.1);border:1.5px solid rgba(168,85,247,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">☠️</span>
        <div><div style="font-size:14px;font-weight:900;color:#A855F7">विष नवमांश विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">विष/पुष्कर नवमांश — ग्रह की गहरी शक्ति/कमजोरी</div></div>
      </div>
      ${body}${foot(21,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 22: विशेष योग (special_yogas) ──
  pages[22] = () => {
    const sy = nadiEd.special_yogas || [];
    const body = !sy || sy.length===0 ? noData() : `
      ${sect(`विशेष नाड़ी योग — ${sy.length}`,"#F59E0B")}
      ${sy.map(y=>{
        const yc=y.type==="benefic"||y.positive?"#4ADE80":y.type==="malefic"||y.negative?"#FB7185":"#F59E0B";
        return `<div style="padding:8px 11px;border-radius:8px;background:${yc}08;border:1px solid ${yc}22;margin-bottom:6px">
          <div style="font-size:12px;font-weight:900;color:${yc};margin-bottom:3px">✨ ${y.name||y.yoga_name||y}</div>
          ${y.description?`<div style="font-size:10px;color:#CBD5E1;margin-bottom:3px">${y.description}</div>`:""}
          ${y.messages?.length>0?renderMsgList(y.messages,yc):""}
          ${y.effect?`<div style="font-size:9px;color:#94A3B8;margin-top:2px">फल: ${y.effect}</div>`:""}
        </div>`;
      }).join("")}
    `;
    return `${head("नाड़ी — विशेष योग")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(245,158,11,.1);border:1.5px solid rgba(245,158,11,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">✨</span>
        <div><div style="font-size:14px;font-weight:900;color:#F59E0B">विशेष नाड़ी योग</div>
        <div style="font-size:9px;color:#64748B">BNN दुर्लभ योग — ग्रह संयोग से जीवन में विशेष घटनाएं</div></div>
      </div>
      ${body}${foot(22,TOTAL_PAGES)}</div>${close}`;
  };

  // ── PAGE 23: शारीरिक बनावट (appearance / degree_control) ──
  pages[23] = () => {
    const dc2 = nadiEd.degree_control || {};
    const comb = nadiEd.combustion || {};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
    // Appearance hints from degree control dominant planets
    const domPlanets = dc2.dominant_planets || [];
    const BODY_MAP={SUN:"हड्डियां, हृदय, आंखें (दाईं), रीढ़",MOON:"मन, रक्त, छाती, गोल चेहरा",MARS:"मांसपेशियां, रक्त, तीखे नाक-नक्श",MERCURY:"त्वचा, नसें, पतला, लंबा",JUPITER:"मोटापा, गोल, चमकता चेहरा",VENUS:"सुंदर, गोल, कोमल रंग-रूप",SATURN:"दुबला, काला, हड्डीदार",RAHU:"रहस्यमय रूप",KETU:"असामान्य, आध्यात्मिक दिखावट"};
    const body = `
      ${domPlanets.length>0?`${sect("लग्न के प्रमुख ग्रह (रूप-रंग निर्धारक)","#FB923C")}<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px">
        ${domPlanets.map(p=>`<div style="padding:8px;border-radius:7px;background:rgba(251,146,60,.08);border:1px solid rgba(251,146,60,.22)">
          <div style="font-size:11px;font-weight:700;color:#FB923C">${PH2[p]||p}</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">${BODY_MAP[p]||""}</div>
        </div>`).join("")}</div>`:`<div style="color:#64748B;font-size:11px;padding:6px">अंश नियंत्रण डेटा उपलब्ध नहीं</div>`}
      ${dc2.messages?.length>0?`${sect("अंश विश्लेषण","#FB923C")}${renderMsgList(dc2.messages,"#FB923C")}`:""}
      ${Object.keys(comb).length>0?`${sect("अस्त ग्रह","#F97316")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px">${Object.entries(comb).filter(([,v])=>v).map(([p])=>`<span style="padding:2px 8px;border-radius:5px;background:rgba(249,115,22,.15);color:#FB923C;font-size:10px;font-weight:700;border:1px solid rgba(249,115,22,.3)">🔥 ${PH2[p]||p} अस्त</span>`).join("")}</div>`:""}
    `;
    return `${head("नाड़ी — शारीरिक बनावट")}<div class="page">${headerBlock}
      <div style="padding:9px 14px;border-radius:9px;background:rgba(251,146,60,.1);border:1.5px solid rgba(251,146,60,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🧍</span>
        <div><div style="font-size:14px;font-weight:900;color:#FB923C">शारीरिक बनावट विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">लग्न ग्रह + अंश नियंत्रण से रूप-रंग संकेत</div></div>
      </div>
      ${body}${foot(23,TOTAL_PAGES)}</div>${close}`;
  };

  // ── Helper: strip HTML wrapper, keep only body content ──
  const bodyOnly = (html) => {
    // Remove everything up to and including <body> (any attrs)
    let s = html.replace(/[\s\S]*?<body[^>]*>/i, "");
    // Remove closing </body></html>
    s = s.replace(/<\/body>[\s\S]*$/i, "");
    // Add print page-break before each page div (except first)
    return s;
  };

  const ALL_PAGE_NUMS  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  const NADI_PAGE_NUMS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

  if(pageNum==="all"){
    const combined = ALL_PAGE_NUMS.map((n, i) => {
      const pageHtml = bodyOnly(pages[n]());
      // Add page-break before every page after the first
      return i === 0 ? pageHtml : `<div class="pb"></div>${pageHtml}`;
    }).join("\n");
    return `${head("सम्पूर्ण कुंडली + नाड़ी ज्योतिष")}${combined}</body></html>`;
  }
  if(pageNum==="nadi_all"){
    const combined = NADI_PAGE_NUMS.map((n, i) => {
      const pageHtml = bodyOnly(pages[n]());
      return i === 0 ? pageHtml : `<div class="pb"></div>${pageHtml}`;
    }).join("\n");
    return `${head("नाड़ी ज्योतिष — सम्पूर्ण")}${combined}</body></html>`;
  }
  return pages[pageNum]?pages[pageNum]():`<h1>Page not found</h1>`;
}

function exportKundliPDF(chartData, pageNum="all") {
  const html = buildPDFPage(pageNum, chartData);
  const win = window.open("", "_blank", "width=1000,height=750");
  if(!win){ alert("पॉप-अप ब्लॉक है — allow करें"); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { setTimeout(()=>{ win.print(); }, 900); };
}


// PDF PAGE SELECTOR MODAL
// ─────────────────────────────────────────────────────────────
const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const PDF_PAGES = [
  {num:1,  icon:"🪐", label:"ग्रह + भाव",        desc:"9 ग्रह तालिका, 12 भाव, डिग्री, नक्षत्र"},
  {num:2,  icon:"⏳", label:"दशा + योग",          desc:"विंशोत्तरी दशा समयरेखा, सक्रिय योग"},
  {num:3,  icon:"🔢", label:"अष्टकवर्ग",           desc:"13 मॉड्यूल, संघर्ष, करियर, सुख-दुख आयु"},
  {num:4,  icon:"📈", label:"टर्निंग पॉइंट",      desc:"आयु सूत्र — शुभ/अशुभ वर्ष"},
  {num:5,  icon:"△",  label:"त्रिकोण + राहु-केतु", desc:"चतुर्विध त्रिकोण, राहु-केतु, नवतारा रत्न"},
  {num:6,  icon:"🪐", label:"शनि + स्वास्थ्य",    desc:"साढ़े साती, ग्रह-रोग, पुनर्जन्म"},
  {num:7,  icon:"❤️", label:"कामुकता + सूत्र",    desc:"कामुकता स्कोर, सफलता की उम्र, राजयोग"},
  {num:8,  icon:"✅", label:"उपाय + निष्कर्ष",    desc:"ग्रह उपाय, समग्र स्कोर, अंतिम निष्कर्ष"},
  // ── नाड़ी ज्योतिष ──
  {num:9,  icon:"💥", label:"नाड़ी — ग्रह पीड़ा",      desc:"BNN ग्रह पीड़ा विश्लेषण", nadi:true},
  {num:10, icon:"🏥", label:"नाड़ी — रोग",              desc:"नाड़ी रोग भविष्यवाणी",     nadi:true},
  {num:11, icon:"⏳", label:"नाड़ी — आयु",              desc:"आयु गणना, दीर्घायु योग",   nadi:true},
  {num:12, icon:"💍", label:"नाड़ी — विवाह",            desc:"विवाह समय, जीवनसाथी",      nadi:true},
  {num:13, icon:"⚠️", label:"नाड़ी — दुर्घटना",        desc:"दुर्घटना योग, सावधानियां",  nadi:true},
  {num:14, icon:"👶", label:"नाड़ी — संतान",            desc:"संतान योग, संतान सुख",     nadi:true},
  {num:15, icon:"🧠", label:"नाड़ी — मानसिक शांति",    desc:"मनोबल, चिंता, शांति",      nadi:true},
  {num:16, icon:"💼", label:"नाड़ी — करियर - धन",      desc:"नाड़ी करियर व धन विश्लेषण",nadi:true},
  {num:17, icon:"🔮", label:"नाड़ी — पूर्व जन्म",       desc:"पूर्वजन्म संस्कार, कर्म",  nadi:true},
  {num:18, icon:"⟲",  label:"नाड़ी — वक्री ग्रह",       desc:"वक्री ग्रहों का प्रभाव",   nadi:true},
  {num:19, icon:"🌑", label:"नाड़ी — अष्टम भाव",       desc:"आयु, रहस्य, परिवर्तन",     nadi:true},
  {num:20, icon:"💎", label:"नाड़ी — रत्न",             desc:"नाड़ी रत्न सुझाव",          nadi:true},
  {num:21, icon:"☠️", label:"नाड़ी — विष नवमांश",      desc:"विष नवमांश विश्लेषण",      nadi:true},
  {num:22, icon:"✨", label:"नाड़ी — विशेष योग",        desc:"दुर्लभ नाड़ी योग",          nadi:true},
  {num:23, icon:"🧍", label:"नाड़ी — शारीरिक बनावट",   desc:"देह लक्षण, स्वास्थ्य संकेत",nadi:true},
];

function PDFModal({ chartData, onClose }) {
  const [sel, setSel] = useState(null); // null = all selected
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,.75)"}}>
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-amber-500/30 overflow-hidden" style={{background:"#0C1128"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/15" style={{background:"rgba(245,158,11,.06)"}}>
          <div>
            <div className="text-[15px] font-black text-amber-400" style={HI}>📄 कुंडली PDF</div>
            <div className="text-[11px] text-slate-500 mt-0.5" style={HI}>कौन सा पेज चाहिए?</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
        </div>

        {/* All pages option */}
        <div className="flex-1 overflow-y-auto px-4 pt-4" style={{scrollbarWidth:"thin", scrollbarColor:"rgba(245,158,11,.2) transparent"}}>
          <button
            onClick={()=>setSel(null)}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all"
            style={{
              background:sel===null?"rgba(245,158,11,.15)":"rgba(255,255,255,.03)",
              border:sel===null?"1.5px solid rgba(245,158,11,.5)":"1px solid rgba(255,255,255,.08)"
            }}>
            <span className="text-xl">📚</span>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-black text-amber-400" style={HI}>सम्पूर्ण कुंडली — सभी 23 पेज</div>
              <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>Complete report — ग्रह से नाड़ी ज्योतिष तक</div>
            </div>
            {sel===null && <span className="text-amber-400 text-lg">✓</span>}
          </button>

          <button
            onClick={()=>setSel("nadi_all")}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all"
            style={{
              background:sel==="nadi_all"?"rgba(124,58,237,.2)":"rgba(255,255,255,.02)",
              border:sel==="nadi_all"?"1.5px solid rgba(124,58,237,.5)":"1px solid rgba(255,255,255,.06)"
            }}>
            <span className="text-xl">🌟</span>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-black" style={{color: sel==="nadi_all"?"#a78bfa":"#94A3B8", ...HI}}>केवल नाड़ी ज्योतिष — पेज 9–23</div>
              <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>BNN · Saptarishi Nadi · 15 विषय</div>
            </div>
            {sel==="nadi_all" && <span className="text-purple-400 text-lg">✓</span>}
          </button>

          {/* Individual pages */}
          <div className="text-[10px] text-slate-600 mb-2 px-1" style={HI}>📄 मानक पेज (1–8):</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PDF_PAGES.filter(p=>!p.nadi).map(p=>(
              <button
                key={p.num}
                onClick={()=>setSel(p.num)}
                className="flex items-start gap-2 p-2.5 rounded-xl transition-all text-left"
                style={{
                  background:sel===p.num?"rgba(34,211,238,.1)":"rgba(255,255,255,.03)",
                  border:sel===p.num?"1.5px solid rgba(34,211,238,.4)":"1px solid rgba(255,255,255,.07)"
                }}>
                <span className="text-[15px] mt-0.5 flex-shrink-0">{p.icon}</span>
                <div>
                  <div className="text-[11px] font-bold" style={{color:sel===p.num?"#22D3EE":"#CBD5E1",...HI}}>
                    {p.num}. {p.label}
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5 leading-tight" style={HI}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-purple-400/70 mb-2 px-1 font-bold" style={HI}>🌟 नाड़ी ज्योतिष पेज (9–23):</div>
          <div className="grid grid-cols-2 gap-2 pb-4">
            {PDF_PAGES.filter(p=>p.nadi).map(p=>(
              <button
                key={p.num}
                onClick={()=>setSel(p.num)}
                className="flex items-start gap-2 p-2.5 rounded-xl transition-all text-left"
                style={{
                  background:sel===p.num?"rgba(124,58,237,.18)":"rgba(255,255,255,.02)",
                  border:sel===p.num?"1.5px solid rgba(124,58,237,.5)":"1px solid rgba(124,58,237,.12)"
                }}>
                <span className="text-[15px] mt-0.5 flex-shrink-0">{p.icon}</span>
                <div>
                  <div className="text-[11px] font-bold" style={{color:sel===p.num?"#a78bfa":"#94A3B8",...HI}}>
                    {p.num}. {p.label.replace("नाड़ी — ","")}
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5 leading-tight" style={HI}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-4 pt-3 flex gap-2 flex-shrink-0 border-t border-slate-800/50">
          <button
            onClick={()=>{ exportKundliPDF(chartData, sel===null?"all":sel); onClose(); }}
            className="flex-1 py-3 rounded-xl font-black text-[13px] transition-all active:scale-[.98]"
            style={{background:"linear-gradient(135deg,rgba(245,158,11,.25),rgba(34,211,238,.15))",border:"1.5px solid rgba(245,158,11,.45)",color:"#F59E0B",...HI}}>
            {sel===null?"📥 सम्पूर्ण PDF (23 पेज)":sel==="nadi_all"?"🌟 नाड़ी ज्योतिष PDF (15 पेज)":"📄 पेज "+sel+" PDF बनाएं"}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-500 text-[12px] hover:text-white transition-all" style={HI}>
            रद्द
          </button>
        </div>
      </div>
    </div>
  );
}

// RIGHT PANEL (Tabbed)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// RIGHT PANEL (Clean & Correct Version)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// MOBILE CHART HEADER — Compact chart for mobile (collapsible)
// ─────────────────────────────────────────────────────────────
function MobileChartHeader({ chartData }) {
  const [expanded, setExpanded] = useState(true);
  const { selectedPlanet, hoverHouse } = useKundliStore();

  return (
    <div className="flex-shrink-0 border-b border-slate-800/50"
      style={{ background: "rgba(2,11,24,0.7)" }}>
      {/* Meta bar — always visible */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-200 truncate">
            {chartData.meta.name}
          </div>

          {/* जन्म विवरण */}
          <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-1.5 mt-0.5">
            <span className="whitespace-nowrap">{chartData.meta.dob}</span>
            {chartData.meta.time && <span className="whitespace-nowrap">• {chartData.meta.time}</span>}
          </div>

          {/* सूर्योदय */}
          {chartData.meta.sunrise && (
            <div className="text-[10px] text-amber-400/90 font-medium mt-1">
              🌅 सूर्योदय: {chartData.meta.sunrise}
            </div>
          )}
        </div>
        <Badge variant="gold" style={{ fontSize:"10px" }}>
          {chartData.meta.lagnaSign}
        </Badge>
        {/* Toggle chart visibility */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="ml-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          style={{ fontSize:"18px", lineHeight:1, background:"rgba(255,255,255,0.05)" }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Chart — collapsible */}
      {expanded && (
        <div className="px-2 pb-2">
          <InteractiveKundli
            houses={chartData.houses}
            selectedPlanet={selectedPlanet}
            onHouseHover={hoverHouse}
          />
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// RIGHT PANEL (Tabbed)
// ─────────────────────────────────────────────────────────────
function RightPanel({ chartData }) {
  // State for PDF Modal
  const [showPDFModal, setShowPDFModal] = useState(false);

  const { 
    activeTab, 
    selectedPlanet, 
    drawerOpen, 
    setActiveTab, 
    selectPlanet, 
    closeDrawer, 
    enginesLoading 
  } = useKundliStore();

  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-0">
      {/* 1. PDF Export Button */}
      <button
        onClick={() => setShowPDFModal(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3 mb-3 rounded-2xl font-bold text-[13px] transition-all hover:scale-[1.01] active:scale-[.99] flex-shrink-0"
        style={{
          background: "linear-gradient(135deg,rgba(245,158,11,.18),rgba(34,211,238,.12))",
          border: "1.5px solid rgba(245,158,11,.4)",
          color: "#F59E0B",
          fontFamily: "'Noto Sans Devanagari', sans-serif"
        }}
      >
        <FileText size={16} />
        <span>📄 कुंडली PDF — पेज चुनें</span>
        <Download size={14} style={{ opacity: 0.7 }} />
      </button>

      {/* 2. PDF Modal */}
      {showPDFModal && <PDFModal chartData={chartData} onClose={() => setShowPDFModal(false)} />}

      {/* 3. Engines loading strip */}
      {enginesLoading && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border flex-shrink-0"
          style={{background:"rgba(168,85,247,.06)", borderColor:"rgba(168,85,247,.2)"}}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0"/>
          <span className="text-[10px] text-purple-400 flex-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            नाड़ी AI इंजन लोड हो रहा है — योग · सूत्र · शनि · गोचर…
          </span>
          <div className="w-3 h-3 border border-t-purple-400 border-purple-400/20 rounded-full animate-spin flex-shrink-0"/>
        </div>
      )}

      {/* 4. Active dasha strip */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 border border-amber-500/20 bg-amber-500/5 flex-shrink-0 flex-wrap">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
        <span className="text-[10px] text-amber-500/70 uppercase tracking-widest">वर्तमान दशा</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-300">{chartData.dasha.current.mahadasha}</span>
          <span className="text-slate-700 text-xs">›</span>
          <span className="text-sm text-amber-200/70">{chartData.dasha.current.antardasha}</span>
          <span className="text-slate-700 text-xs">›</span>
          <span className="text-xs text-slate-500">{chartData.dasha.current.pratyantara}</span>
        </div>
        <span className="ml-auto text-[10px] text-slate-600">समाप्त: {chartData.dasha.current.endDate}</span>
      </div>

      {/* 5. Tab bar — desktop only (mobile uses MobileTabDrawer) */}
      <div
        className="main-tab-bar flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-800/40 border border-slate-700/30 mb-4 flex-shrink-0"
        style={{ scrollbarWidth:"none", ...(isMobile && { display:"none" }) }}>
        {TABS.map((t) => {
          // KP BTR tab ke liye SSL badge
          const kpData   = t.id === "kp_btr" ? chartData?.enginesData?.kp_btr : null;
          const kpPass   = kpData?.current_check?.overall_score === 100;
          const kpSSL    = kpData?.current_check?.cil?.lagna_lords?.ssl;
          const PH_MINI  = {Su:"सू",Mo:"चं",Ma:"मं",Me:"बु",Ju:"गु",Ve:"शु",Sa:"श",Ra:"रा",Ke:"के"};

          return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              "main-tab-btn flex-shrink-0 py-2 px-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200 whitespace-nowrap relative",
              activeTab === t.id ? "bg-slate-700/70 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-300",
            ].join(" ")}
          >
            {t.label}
            {/* KP SSL badge */}
            {t.id === "kp_btr" && kpSSL && !enginesLoading && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                fontSize: "8px", fontWeight: 800, lineHeight: 1,
                padding: "1px 4px", borderRadius: "5px",
                background: kpPass ? "rgba(34,211,238,0.9)" : "rgba(251,113,133,0.9)",
                color: "#000",
              }}>
                {PH_MINI[kpSSL] || kpSSL}
              </span>
            )}
            {enginesLoading && t.phase === 2 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"/>
            )}
          </button>
          );
        })}
      </div>

      {/* 6. Tab content */}
      <div className="flex-1 overflow-y-visible" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
        <Suspense fallback={<TabSkeleton />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
            {activeTab === "planets" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {Object.entries(chartData.planets).map(([code, pdata]) => (
                  <PlanetCard key={code} code={code} data={pdata} isSelected={selectedPlanet === code} onClick={() => selectPlanet(code)} />
                ))}
              </div>
            )}
            {activeTab === "drishti" && <DrishtiGrid drishti={chartData.drishti} bhavDrishti={chartData.bhavDrishti || {}} planets={chartData.planets} houses={chartData.houses || []} />}
            {activeTab === "dasha" && <DashaTimeline dasha={chartData.dasha} chartMeta={chartData.meta} />}
            {activeTab === "av" && <AshtakavargaGrid sav={chartData.sav||[]} houses={chartData.houses||[]} ashtakavargaSpecial={chartData.ashtakavargaSpecial||""} />}
            {activeTab === "yogas" && <YogaPanel data={chartData.enginesData?.yogas} chartData={chartData} />}
            {activeTab === "houses" && <HousePanel chartData={chartData} />}
            {activeTab === "advanced" && <AdvancedAVPanel enginesData={chartData.enginesData} chartData={chartData} onExportPDF={() => exportKundliPDF(chartData)} />}
            {activeTab === "kamukta" && <KamuktaPanel chartData={chartData} />}
            {activeTab === "gochar" && <GocharPanel chartData={chartData} />}
            {activeTab === "nadi" && <NadiJyotishPanel chartData={chartData} />}
            {activeTab === "conclusion" && <MasterConclusion data={chartData.masterConclusion} />}
            {activeTab === "av_sutras"      && <AVSutrasPanel data={chartData?.enginesData?.av_sutras} chartData={chartData} />}
            {activeTab === "chandra_surya"  && <ChandraSuryaPanel data={chartData?.enginesData?.chandra_surya} />}
            {activeTab === "advanced_yogas" && <AdvancedYogasPanel />}
            {activeTab === "kp_btr"         && <KPBTRPanel />}
            {activeTab === "vivah"           && <VivahPanel />}
          </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>

      {/* 7. Planet Drawer */}
      <PlanetDrawer
        code={selectedPlanet}
        data={selectedPlanet ? chartData.planets?.[selectedPlanet] : null}
        open={drawerOpen}
        onClose={closeDrawer}
      />

      {/* 8. Mobile Tab Drawer — only renders on <768px */}
      {isMobile && (
        <MobileTabDrawer
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          enginesReady={chartData?._enginesReady}
        />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// MAIN CHART + META (centre column)
// ─────────────────────────────────────────────────────────────
function ChartColumn({ chartData }) {
  const { selectedPlanet, hoverHouse } = useKundliStore();

  // Quick stat counts
  const exalted    = Object.values(chartData.planets).filter((p) => p.dignity === "Uchcha").length;
  const debilitated= Object.values(chartData.planets).filter((p) => p.dignity === "Neecha").length;
  const ownSign    = Object.values(chartData.planets).filter((p) => p.dignity === "Swa").length;

  return (
    <div
      className="flex-shrink-0 border-r border-slate-800/50 overflow-y-auto p-5 flex flex-col gap-5"
      style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(2,11,24,0.5)",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(99,102,241,0.2) transparent"
      }}
    >
      {/* Meta bar */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-700/40 bg-slate-800/30">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <User size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-200 truncate">{chartData.meta.name}</div>
          <div className="text-[10px] text-slate-500">
            {chartData.meta.dob} · {chartData.meta.time} · {chartData.meta.city}
          </div>
          {chartData.meta.sunrise && (
            <div className="text-[10px] text-amber-400/80 mt-0.5">
              🌅 सूर्योदय: {chartData.meta.sunrise}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="gold">
            लग्न: {chartData.meta.lagnaSign}
          </Badge>
          <Badge variant="cyan">{chartData.meta.chartType}</Badge>
        </div>
      </div>

      {/* SVG Chart */}
      <InteractiveKundli
        houses={chartData.houses}
        selectedPlanet={selectedPlanet}
        onHouseHover={hoverHouse}
      />

      {/* Quick dignity stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "उच्च",    value: exalted,     color: "#34D399" },
          { label: "नीच",    value: debilitated, color: "#F87171" },
          { label: "स्वराशि", value: ownSign,     color: "#F59E0B" },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/25"
          >
            <div className="text-xl font-black mb-0.5" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD LAYOUT (exported)
// ─────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { chartData, loading } = useKundliStore();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-1 min-h-0 overflow-auto">
      {/* Left sidebar — form (hidden on mobile, shown via InputSidebar's own toggle) */}
      <InputSidebar />

      {/* Main area */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col">
        {loading ? (
          <LoadingState />
        ) : chartData ? (
          isMobile ? (
            /* ── MOBILE LAYOUT: single scroll column ── */
            <div className="flex-1 overflow-y-auto flex flex-col"
              style={{ scrollbarWidth:"none" }}>
              {/* Chart — compact, non-sticky */}
              <MobileChartHeader chartData={chartData} />
              {/* Panels — full width below chart */}
              <div className="flex-1 p-3 pb-24">
                {/* pb-24 = space so MobileTabDrawer button doesn't cover last panel */}
                <RightPanel chartData={chartData} />
              </div>
            </div>
          ) : (
            /* ── DESKTOP LAYOUT: side by side (unchanged) ── */
            <div className="flex-1 flex min-h-0">
              <ChartColumn chartData={chartData} />
              <div className="flex-1 min-w-0 p-5 overflow-y-auto flex flex-col">
                <RightPanel chartData={chartData} />
              </div>
            </div>
          )
        ) : (
          <WelcomeState />
        )}
      </main>
    </div>
  );
}