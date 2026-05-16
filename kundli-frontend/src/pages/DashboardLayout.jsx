// pages/DashboardLayout.jsx
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
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
const VivahPanel        = lazy(() => import("../components/panels/VivahPanel"));
const PrashnaKundli = lazy(() => import("../components/panels/PrashnaKundli"));
const Chalit = lazy(() => import("../components/panels/Chalit"));

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
      <Link
        to="/consultancy"
        className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-sm font-bold"
      >
        क्लाइंट्स के रिव्यू देखें 🌟
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// PDF EXPORT — Complete 8-Page Premium Report
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// PDF EXPORT — Complete 8-Page Premium Report + Nadi
// ─────────────────────────────────────────────────────────────
function buildPDFPage(pageNum, chartData) {
  const pd   = chartData || {};
  const pl   = pd.planets || {};
  const mcD  = pd.masterConclusion || {};
  const ed   = pd.enginesData || {};
  const meta = pd.meta || {};

  // ✅ FIX: दोनों engines अलग-अलग — कभी merge नहीं करना
  // ashtakvarga_complete → modules (lp, sm, ct, aa, kb, etc.)
  // av_sutras           → planet strength (planetStrength)
  const avComplete = ed.ashtakvarga_complete?.analysis || {};
  const avSutras   = ed.av_sutras || {};
  const avD        = avComplete; // alias for backward compat (BAV grid helpers)
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
  
  // नवतारा + रत्न Helpers
  const gems = nav.gemstone_recommendations || {};
  const taras = nav.taras || {};
  const proh = nav.prohibited_items || {};
  const pdfCard = (label, val, col="#F59E0B") => `
    <div style="padding:8px; background:${col}08; border:1px solid ${col}25; border-radius:10px; margin-bottom:6px">
      <div style="font-size:10px; font-weight:900; color:${col}">${label}</div>
      <div style="font-size:11px; color:#CBD5E1; margin-top:2px">${val||"—"}</div>
    </div>`;

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
  const sect = (t,c="#F59E0B") => `<div style="margin:12px 0 5px;padding:5px 10px;background:${c}12;border-left:3px solid ${c};font-size:12px;font-weight:900;color:${c}">${t}</div>`;
  const badge = (t,c) => `<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:5px;background:${c}18;color:${c};border:1px solid ${c}30;font-size:10px;font-weight:700">${t}</span>`;
  const foot = (n,total) => `<div style="text-align:center;font-size:9px;color:#334155;margin-top:14px;padding-top:7px;border-top:1px solid rgba(245,158,11,.12)">🪐 सम्पूर्ण वैदिक कुंडली — ${name} | पृष्ठ ${n}${total?" / "+total:""} | © Nadi AI Jyotish</div>`;

  // ── Planet Table ──
  const pRows = Object.entries(pl).map(([c,p])=>{
    if(!p) return "";
    const dk=p.dignity||"Sama", dh_=p.dignityHindi||dk;
    const dc=DC[dk]||DC[dh_]||"#64748B", di=DI[dk]||DI[dh_]||"⚪";
    const fc=FC[p.functionalNature]||"#64748B";
    // वक्री और अस्त — तीनों possible keys check करते हैं
    const isVakri = p.Retrograde || p.retrograde || (p.notes && p.notes.includes("वक्री"));
    const isAst   = p.Combust   || p.combust   || (p.notes && p.notes.includes("अस्त"));
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:4px 6px;color:#F59E0B;font-weight:900;font-size:11px">
        ${PH[c]||c} ${PS[c]||""}
        ${isVakri ? '<span style="color:#818CF8;font-size:10px;margin-left:2px" title="वक्री">⟲</span>' : ''}
        ${isAst   ? '<span style="color:#FB923C;font-size:10px;margin-left:2px" title="अस्त">🔥</span>' : ''}
      </td>
      <td style="padding:4px 6px;color:#CBD5E1;font-size:11px">${p.hindi_sign||"—"}</td>
      <td style="padding:4px 6px;color:#94A3B8;font-size:10px;text-align:center;font-weight:700">${p.house||"—"} ${p.houseCategory ? `<br/><span style="font-size:8px;color:#64748B;font-weight:normal">${p.houseCategory}</span>` : ""}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${p.degree||"—"}</td>
      <td style="padding:4px 6px;color:#64748B;font-size:10px">${p.nakshatra||"—"}</td>
      <td style="padding:4px 6px;color:#C084FC;font-size:10px;font-weight:700">${p.nakshatraLord || "—"}</td>
      <td style="padding:4px 6px;color:#22D3EE;font-size:10px;font-weight:700">${p.rashiLord || p.lord || "—"}</td>
      <td style="padding:4px 6px;font-size:10px;font-weight:700;color:${dc}">${di} ${dh_}</td>
      <td style="padding:4px 6px;font-size:10px;color:${fc};white-space:nowrap">${p.functionalNature || "Neutral"}</td>
      <td style="padding:4px 6px;font-size:10px;color:#475569">${p.strength!=null?p.strength+"%":"—"}</td>
    </tr>`;
  }).join("");

  const houses = pd.houses||[];
  const hRows = houses.map((h, i)=>`<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
    <td style="padding:4px 6px;color:#F59E0B;font-weight:700;font-size:11px">${h.n||h.house||h.number||h.bhava||(i+1)}</td>
    <td style="padding:4px 6px;color:#CBD5E1;font-size:11px">${h.sign||h.rashi||"—"}</td>
    <td style="padding:4px 6px;color:#94A3B8;font-size:11px">${h.planets||"—"}</td>
    <td style="padding:4px 6px;font-size:11px;color:${(h.av||0)>=30?"#22D3EE":(h.av||0)>=25?"#F59E0B":"#FB7185"};font-weight:700">${h.av||"—"}</td>
  </tr>`).join("");

  // 🔥 FIX: SAV grid should use houses array (lagna-based) not avBhavas
  // avBhavas has wrong bhav numbers (Kaalpurush order), houses has correct lagna-based order
  const avGrid = houses.length>0 ? houses.map((h,i)=>{
    const av = h.av || 0;
    const c=av>=30?"#22D3EE":av>=25?"#F59E0B":"#FB7185";
    return `<div style="text-align:center;padding:5px 2px;border-radius:7px;background:${c}12;border:1px solid ${c}28"><div style="font-size:8px;color:#475569">भाव ${i+1}</div><div style="font-size:17px;font-weight:900;color:${c}">${av}</div></div>`;
  }).join("") : "";
  const tpHTML = [...tp].sort((a,b)=>a.year-b.year).map(t=>{
    const near=t.year>=now-1&&t.year<=now+10, past=t.year<now-2;
    const c=near?"#F59E0B":past?"#334155":t.nature==="good"?"#4ADE80":"#FB7185";
    return `<div style="display:flex;gap:8px;margin:4px 0;padding:6px 9px;border-radius:7px;background:${c}08;border:1px solid ${c}20;opacity:${past?.5:1}">
      <div style="font-size:21px;font-weight:900;color:${c};min-width:42px;text-align:center;line-height:1.15">${t.year}</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:900;color:${c}">${t.hindi||t.code||""} — भाव ${t.house} ${t.nature==="good"?"✅":"⚠️"}</div>
        <div style="font-size:9px;color:#64748B;margin-top:1px">${t.ageGroup||""}${t.planetaryReason?" | "+t.planetaryReason:""}</div>
        ${t.avSum?`<div style="font-size:8px;color:#334155;font-family:monospace">Σ(1→${t.house})=${t.avSum}×7%27=${t.year}</div>`:""}
      </div>
      ${near?`<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:rgba(245,158,11,.2);color:#F59E0B;white-space:nowrap;align-self:center">← अभी</span>`:""}
    </div>`;
  }).join("");

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
      <span style="font-size:13px">${t.i}</span><span style="font-size:12px;font-weight:900;color:${t.c};margin:0 6px">${t.t}</span>
      <span style="font-size:9px;color:#475569">भाव ${t.h.join("-")}</span><span style="font-size:9px;padding:1px 6px;border-radius:4px;background:${sc}18;color:${sc};font-weight:700">${a.lbl}</span>
    </div>
    <div style="font-size:9px;color:#475569;margin-bottom:5px">💡 ${t.lg}</div>
    ${a.ps.length>0?`<div style="margin-bottom:5px">${a.ps.map(p=>`${badge(p.name+" "+p.h+"वें"+(p.g?" ✅":p.b?" ⚠️":""),p.g?"#4ADE80":p.b?"#FB7185":"#F59E0B")}`).join("")}</div>`:""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      <div style="padding:4px 7px;border-radius:5px;background:rgba(74,222,128,.07)"><div style="font-size:9px;color:#4ADE80;font-weight:700">✅ अनुकूल</div><div style="font-size:10px;color:#CBD5E1">${t.g}</div></div>
      <div style="padding:4px 7px;border-radius:5px;background:rgba(251,113,133,.07)"><div style="font-size:9px;color:#FB7185;font-weight:700">⚠️ टालें</div><div style="font-size:10px;color:#CBD5E1">${t.b}</div></div>
    </div>
  </div>`;}).join("");

  const afflicted=Object.entries(pl).filter(([c,p])=>{
    if(!p)return false;
    const d=p.dignity||"";
    return /Neecha|नीच/i.test(d)||[6,8,12].includes(p.house)||/Shatru|शत्रु/i.test(d);
  });

  const SPOUSE_N={1:"आत्मनिर्भर",2:"धनी परिवार",3:"साहसी, यात्राप्रिय",4:"घरेलू, माँ से जुड़े",5:"रचनात्मक, प्रेमी",6:"मेहनती, सेवाभाव",7:"सुंदर, संतुलित",8:"रहस्यमय, गहरे",9:"धार्मिक, भाग्यशाली",10:"महत्वाकांक्षी",11:"सामाजिक, लाभकारी",12:"आध्यात्मिक, विदेशी"};
  const ve=pl.Ve,ma_p=pl.Ma;
  const veH=ve?.house;
  const manglik=ma_p&&[1,4,7,8,12].includes(ma_p.house);
  const planIn7=Object.entries(pl).filter(([c,p])=>p?.house===7);
  const malIn7=planIn7.filter(([c])=>["Sa","Ma","Ra","Ke","Su"].includes(c));
  const benIn7=planIn7.filter(([c])=>["Ju","Ve","Mo","Me"].includes(c));

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
    th{padding:8px 6px;background:rgba(245,158,11,.12);color:#F59E0B;font-size:9px;text-align:left;font-weight:700;border:1px solid rgba(255,255,255,.1)}
    td{vertical-align:middle;padding:6px;border:1px solid rgba(255,255,255,.08)}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:5px 0}
    .avg{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin:5px 0}
  `;

  const head=(title)=>`<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"/><title>${title} — ${name}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&display=swap" rel="stylesheet"/><style>${css}</style></head><body>`;
  const close=`</body></html>`;
  const TOTAL_PAGES = 28;

  const headerBlock=`<div class="hdr">
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

  // 🔥 FIX 1: BULLETPROOF BAV Table (अब av_sutras से भी चेक करेगा)
  // 🔥 FIX: BAV Table — Rotate to match Lagna-based bhav order
  const rawBav = ed.bav || ed.av_sutras?.bav || ed.av_sutras?.bav_charts || ed.ashtakvarga_complete?.bav || pd.bav || pd.ashtakavarga?.bav || {};
  let bavTableHtml = "";
  if (Object.keys(rawBav).length > 0) {
    const pKeys = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];
    const bavRows = pKeys.map(k => {
      const pts = rawBav[k] || rawBav[k.toLowerCase()] || rawBav[k.toUpperCase()];
      if (!pts || !Array.isArray(pts) || pts.length < 12) return "";
      
      // 🔥 FIX: Backend already sends data rotated from Lagna, no need to rotate again.
      // Double rotation was causing a 4-index shift (e.g., Dhanu lagna → Leo shown first).
      const rotatedPts = pts;
      
      let row = `<td style="color:#F59E0B;font-weight:900;background:rgba(245,158,11,0.05)">${PH[k] || k}</td>`;
      let total = 0;
      for (let i = 0; i < 12; i++) { 
        row += `<td>${rotatedPts[i]}</td>`; 
        total += rotatedPts[i]; 
      }
      row += `<td style="color:#22D3EE;font-weight:900;background:rgba(34,211,238,0.05)">${total}</td>`;
      return `<tr>${row}</tr>`;
    }).join("");
    if (bavRows) {
      bavTableHtml = `${sect("भिन्नाष्टकवर्ग (BAV) — ग्रहों के बिंदु", "#C084FC")}
      <table style="font-size:10px;text-align:center;margin-bottom:15px"><tr style="background:rgba(255,255,255,0.05)"><th>ग्रह / भाव ➔</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>कुल</th></tr>${bavRows}</table>`;
    }
  }

  // ✅ FIX: planetStrength सिर्फ av_sutras engine से — avComplete (ashtakvarga) से नहीं
  const planetStrength =
    avSutras.planets ||
    avSutras.planet_strength ||
    avSutras.analysis?.planets ||
    avSutras.analysis?.planet_strength ||
    avSutras.grah_bal ||
    {};
  let avSutraHtml = "";
  
  if (Object.keys(planetStrength).length > 0) {
    const avSutraRows = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"].map(k => {
      const s = planetStrength[k] || planetStrength[k.toLowerCase()] || planetStrength[k.toUpperCase()];
      if (!s) return "";
      
      const statusText = s.strength || s.status || "सामान्य";
      const isStrong = statusText.includes("बलवान");
      const isWeak   = statusText.includes("निर्बल");
      const statusCol = isStrong ? "#4ADE80" : isWeak ? "#FB7185" : "#94A3B8";
      const infoNote  = k === "Ra" ? "ℹ️ शनिवत राहु" : k === "Ke" ? "ℹ️ कुजवत केतु" : "";
      
      // BAV और SAV की वैल्यू
      const bavVal = s.bav != null ? s.bav : (s.bav_score != null ? s.bav_score : "—");
      const savVal = s.sav != null ? s.sav : (s.sav_score != null ? s.sav_score : "—");
      const dashaFx = s.dasha_effect || "—";
      const dashaCol = dashaFx.includes("शुभ") ? "#4ADE80" : (dashaFx.includes("अशुभ") ? "#FB7185" : "#94A3B8");

      return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
        <td style="padding:6px 8px;font-weight:900;color:#F59E0B">${PH[k]||k}</td>
        <td style="padding:6px 8px;color:#CBD5E1">भाव ${s.house||"—"}</td>
        <td style="padding:6px 8px;font-weight:900;color:${statusCol}">${statusText}</td>
        <td style="padding:6px 8px;color:#94A3B8;font-size:10px"><b>BAV:</b> ${bavVal}/8 ${infoNote?`<br/><span style="font-size:9px">${infoNote}</span>`:""}</td>
        <td style="padding:6px 8px;color:#CBD5E1;font-weight:700">${savVal}</td>
        <td style="padding:6px 8px;font-size:10px;color:${dashaCol}">${dashaFx}</td>
      </tr>`;
    }).join("");

    if (avSutraRows) {
      avSutraHtml = `${sect("अष्टकवर्ग सूत्र विश्लेषण — ग्रह बल","#F59E0B")}
      <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);padding:8px;border-radius:8px;margin-bottom:12px">
        <div style="font-size:9px;color:#94A3B8;margin-bottom:8px">💡 <b>सिद्धांत:</b> BAV (व्यक्तिगत बल) + SAV (भाव बल) के योग से अंतिम निर्णय। SAV &gt; 28 हो तो निर्बल BAV ग्रह को भी सुरक्षा मिलती है।</div>
        <table><tr style="background:rgba(255,255,255,.05)"><th>ग्रह</th><th>स्थिति</th><th>बल</th><th>BAV स्कोर</th><th>SAV अंक</th><th>दशा फल</th></tr>${avSutraRows}</table>
      </div>`;
    }
  }

  const pages = {
    1: ()=>`${head("ग्रह + भाव")}<div class="page">
      ${headerBlock}
      ${sect("ग्रह स्थिति — नवग्रह (9 Planets)")}
      <table><tr><th>ग्रह</th><th>राशि</th><th>भाव</th><th>डिग्री</th><th>नक्षत्र</th><th>नक्ष.स्वामी</th><th>राशि स्वामी</th><th>अवस्था</th><th>स्वभाव</th><th>बल%</th></tr>${pRows}</table>
      <div style="margin-top:5px;padding:4px 8px;border-radius:5px;background:rgba(245,158,11,.05);font-size:8px;color:#475569">⬆️उच्च &nbsp;⬇️नीच &nbsp;🏠स्वराशि &nbsp;💜मित्र &nbsp;🔴शत्रु &nbsp;⭐योगकारक &nbsp;⟲वक्री &nbsp;🔥अस्त</div>
      ${sect("भाव स्थिति — 12 भाव","#22D3EE")}
      <table><tr><th>भाव</th><th>राशि</th><th>ग्रह</th><th>AV अंक</th></tr>${hRows}</table>
      ${foot(1,TOTAL_PAGES)}</div>${close}`,

    2: ()=>`${head("दशा + योग")}<div class="page">
      ${sect("विंशोत्तरी दशा — पूर्ण समयरेखा","#FB923C")}
      <div style="padding:6px 8px;border-radius:6px;background:rgba(251,146,60,.05);margin-bottom:7px;font-size:9px;color:#475569">💡 विंशोत्तरी पद्धति: जन्म नक्षत्र से 120 वर्ष का चक्र। वर्तमान: <b style="color:#F59E0B">${dasha.mahadasha||"—"} महादशा → ${dasha.antardasha||"—"} अंतर्दशा | समाप्त: ${dasha.endDate||"—"}</b></div>
      ${dashaTable}
      ${allYogas.length>0?`${sect(`योग — ${allYogas.length} सक्रिय`,"#4ADE80")}<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${allYogas.slice(0,18).map(y=>{const yn=y.name||y.yoga_name||"";const yd=y.effect||y.description||"";const yc=yn.includes("राज")||yn.includes("Raja")?"#F59E0B":yn.includes("धन")||yn.includes("Dhana")?"#4ADE80":"#22D3EE";return`<div style="padding:5px 8px;border-radius:6px;background:${yc}07;border:1px solid ${yc}20"><div style="font-size:11px;color:${yc};font-weight:700">${yn}</div>${yd?`<div style="font-size:9px;color:#475569;margin-top:1px">${yd.slice(0,60)}${yd.length>60?"...":""}</div>`:""}</div>`;}).join("")}
      </div>`:""}
      ${foot(2,TOTAL_PAGES)}</div>${close}`,

    3: ()=>`${head("अष्टकवर्ग")}<div class="page">
      ${sect("सर्वाष्टकवर्ग (SAV) — 12 भावों की कुल शक्ति", "#4ADE80")}
      <div class="avg">${avGrid}</div>
      ${mcD.avTotal?`<div style="text-align:right;font-size:10px;color:#F59E0B;font-weight:700;margin-top:3px">कुल: ${mcD.avTotal} | औसत: ${(mcD.avTotal/12).toFixed(1)}/भाव</div>`:""}
      <div style="margin-top:12px"></div>
      ${bavTableHtml}
      ${avSutraHtml}
      ${sect("अष्टकवर्ग — प्रमुख मॉड्यूल विश्लेषण", "#F472B6")}
      ${bavTableHtml}
      ${avSutraHtml}
      <div class="two">
        ${lp.total_score?`<div style="padding:9px;border-radius:9px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.22)"><div style="font-size:9px;color:#64748B">MODULE 1 — जीवन समृद्धि</div><div style="font-size:26px;font-weight:900;color:${lp.is_prosperous?"#22D3EE":"#FB923C"}">${lp.total_score}</div><div style="font-size:8px;color:#475569">थ्रेशहोल्ड: 164 | ${lp.is_prosperous?"✅ समृद्ध":"⚠️ संघर्ष"}</div><div style="font-size:9px;color:#94A3B8;margin-top:2px">${lp.prediction_hindi||""}</div></div>`:""}
        ${kb.dominant?`<div style="padding:9px;border-radius:9px;background:rgba(192,132,252,.06);border:1px solid rgba(192,132,252,.22)"><div style="font-size:9px;color:#64748B">MODULE 11 — कर्म vs भाग्य</div><div style="font-size:15px;font-weight:900;color:#C084FC">${kb.dominant}</div><div style="display:flex;gap:7px;margin-top:3px">${kb.house_9_points!=null?`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(192,132,252,.1)"><div style="font-size:16px;font-weight:900;color:#C084FC">${kb.house_9_points}</div><div style="font-size:8px;color:#64748B">9वां भाग्य</div></div>`:""}${kb.house_10_points!=null?`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(129,140,248,.1)"><div style="font-size:16px;font-weight:900;color:#818CF8">${kb.house_10_points}</div><div style="font-size:8px;color:#64748B">10वां कर्म</div></div>`:""}</div><div style="font-size:9px;color:#94A3B8;margin-top:2px">${kb.prediction_hindi||""}</div></div>`:""}
      </div>
      <div class="two" style="margin-top:6px">
        <div style="padding:8px;border-radius:8px;background:${sm.has_extreme_struggle?"rgba(251,113,133,.06)":"rgba(74,222,128,.06)"};border:1px solid ${sm.has_extreme_struggle?"rgba(251,113,133,.2)":"rgba(74,222,128,.2)"}"><div style="font-size:9px;color:#64748B;margin-bottom:2px">M2 — संघर्ष मीटर</div><div style="font-size:14px;font-weight:900;color:${sm.has_extreme_struggle?"#FB7185":"#4ADE80"}">${sm.has_extreme_struggle?"उच्च संघर्ष ⚠️":"सामान्य ✅"}</div><div style="font-size:9px;color:#64748B">${sm.prediction_hindi||"सामान्य जीवन संघर्ष"}</div></div>
        <div style="padding:8px;border-radius:8px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2)"><div style="font-size:9px;color:#64748B;margin-bottom:2px">M4 — करियर प्रकार</div><div style="font-size:13px;font-weight:900;color:#818CF8">${ct.recommended_type||"—"}</div><div style="font-size:9px;color:#64748B">${ct.description_hindi||""}</div></div>
      </div>
      ${aa.happiness_ages?.length>0||aa.sorrow_ages?.length>0?`${sect("MODULE 7 — सुख-दुख की आयु ⏰","#FB923C")}<div class="two">${aa.happiness_ages?.length>0?`<div style="padding:6px;border-radius:7px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18)"><div style="font-size:9px;font-weight:700;color:#4ADE80;margin-bottom:4px">✅ सुख की आयु</div><div style="display:flex;flex-wrap:wrap;gap:4px">${aa.happiness_ages.map(a=>`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(74,222,128,.1)"><div style="font-size:18px;font-weight:900;color:#4ADE80">${a.age}</div><div style="font-size:8px;color:#86EFAC">${a.planet_hindi||a.planet}</div></div>`).join("")}</div></div>`:""}${aa.sorrow_ages?.length>0?`<div style="padding:6px;border-radius:7px;background:rgba(251,113,133,.06);border:1px solid rgba(251,113,133,.18)"><div style="font-size:9px;font-weight:700;color:#FB7185;margin-bottom:4px">⚠️ कष्ट की आयु</div><div style="display:flex;flex-wrap:wrap;gap:4px">${aa.sorrow_ages.map(a=>`<div style="text-align:center;padding:3px 7px;border-radius:5px;background:rgba(251,113,133,.1)"><div style="font-size:18px;font-weight:900;color:#FB7185">${a.age}</div><div style="font-size:8px;color:#FDA4AF">${a.planet_hindi||a.planet}</div></div>`).join("")}</div></div>`:""}</div>`:""}
      ${foot(3,TOTAL_PAGES)}</div>${close}`,

    4: ()=>`${head("टर्निंग पॉइंट")}<div class="page">
      ${sect("अष्टकवर्ग टर्निंग पॉइंट — आयु सूत्र ⏳","#4ADE80")}
      <div style="padding:5px 8px;border-radius:5px;background:rgba(74,222,128,.05);margin-bottom:7px;font-size:9px;color:#475569">📐 आयु सूत्र: Σ(भाव 1→ग्रह भाव) × 7 ÷ 27 = टर्निंग वर्ष &nbsp;|&nbsp;<span style="color:#F59E0B">● = अभी (${now-1}–${now+10})</span><span style="color:#4ADE80"> ✅ शुभ</span><span style="color:#FB7185"> ⚠️ कष्ट</span></div>
      ${tpHTML||`<div style="color:#475569;text-align:center;padding:14px">टर्निंग पॉइंट डेटा नहीं</div>`}
      ${foot(4,TOTAL_PAGES)}</div>${close}`,

    // 🔥 FIX 3: BULLETPROOF PREMIUM NAVATARA 🔥
    5: ()=>`${head("त्रिकोण + राहु-केतु + नवतारा")}<div class="page">
      ${sect("चतुर्विध त्रिकोण — जीवन दिशा","#C084FC")}
      ${tkHTML}
      <div class="two" style="margin-top:8px">
        ${rahuH?`<div style="padding:9px;border-radius:9px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.22)">
          <div style="font-size:11px;font-weight:900;color:#818CF8;margin-bottom:4px">🐍 राहु — ${rahuH}वें भाव में</div><div style="font-size:10px;color:#CBD5E1">${RAHU_T[rahuH]||"—"}</div>
        </div>`:""}
        ${ketuH?`<div style="padding:9px;border-radius:9px;background:rgba(45,212,191,.06);border:1px solid rgba(45,212,191,.22)">
          <div style="font-size:11px;font-weight:900;color:#2DD4BF;margin-bottom:4px">🪐 केतु — ${ketuH}वें भाव में</div><div style="font-size:10px;color:#CBD5E1">${KETU_T[ketuH]||"—"}</div>
        </div>`:""}
      </div>
      ${sect("नवतारा — जन्म नक्षत्र एवं तारा चक्र", "#FB923C")}
      ${taras.birth_nakshatra ? `<div style="padding:10px; border-radius:10px; background:rgba(34,211,238,0.1); border:1px solid rgba(34,211,238,0.3); margin-bottom:10px; text-align:center"><div style="font-size:14px; font-weight:900; color:#22D3EE">⭐ जन्म नक्षत्र: ${taras.birth_nakshatra.name_hindi||""} (#${taras.birth_nakshatra.number||""})</div></div>` : ""}
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
        <div>
          ${taras.sampat_tara ? pdfCard("💰 संपत् (Wealth)", taras.sampat_tara.nakshatra_names?.join(", "), "#4ADE80") : ""}
          ${taras.kshema_tara ? pdfCard("🛡️ क्षेम (Prosperity)", taras.kshema_tara.nakshatra_names?.join(", "), "#2DD4BF") : ""}
          ${taras.sadhana_tara ? pdfCard("✨ साधन (Achievement)", taras.sadhana_tara.nakshatra_names?.join(", "), "#818CF8") : ""}
          ${taras.mitra_tara ? pdfCard("🤝 मित्र (Friend)", taras.mitra_tara.nakshatra_names?.join(", "), "#F59E0B") : ""}
        </div>
        <div>
          ${taras.vipat_tara ? pdfCard("⚠️ विपत् (Danger)", taras.vipat_tara.nakshatra_names?.join(", "), "#FB7185") : ""}
          ${taras.pratyari_tara ? pdfCard("🔥 प्रत्यारी (Obstacles)", taras.pratyari_tara.nakshatra_names?.join(", "), "#F472B6") : ""}
          ${taras.vadha_tara ? pdfCard("💀 वध (Severe)", taras.vadha_tara.nakshatra_names?.join(", "), "#EF4444") : ""}
        </div>
      </div>
      ${sect("💎 रत्न एवं वर्जित निर्देश", "#22D3EE")}
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
         <div style="padding:10px; background:rgba(74,222,128,0.05); border:1px solid rgba(74,222,128,0.2); border-radius:10px">
            <div style="font-size:11px; font-weight:900; color:#4ADE80; margin-bottom:6px">✅ शुभ रत्न (Gemstones)</div>
            ${(gems.highly_beneficial || []).map(g => `<div style="font-size:10px; color:#CBD5E1; margin-bottom:4px">• ${g.gemstone_hindi}</div>`).join("")}
         </div>
         <div style="padding:10px; background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2); border-radius:10px">
            <div style="font-size:11px; font-weight:900; color:#FB7185; margin-bottom:6px">❌ वर्जित (Avoid)</div>
            <div style="font-size:10px; color:#CBD5E1">रंग: ${(proh.prohibited_colors || []).join(", ")}</div>
            <div style="font-size:10px; color:#CBD5E1; margin-top:2px">दिन: ${(proh.prohibited_days || []).join(", ")}</div>
         </div>
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
  const nadiEd = ed.nadi_jyotish || ed.nadi || ed.nadiResults || ed.nadi_results || {};

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
    return `${head("नाड़ी — ग्रह पीड़ा")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(239,68,68,.1);border:1.5px solid rgba(239,68,68,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💥</span>
        <div><div style="font-size:14px;font-weight:900;color:#EF4444">ग्रह पीड़ा विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN — पीड़ित ग्रह जातक के जीवन के संबंधित क्षेत्र में बाधा देते हैं</div></div>
      </div>
      ${body}${foot(9,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — रोग")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(220,38,38,.1);border:1.5px solid rgba(220,38,38,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🏥</span>
        <div><div style="font-size:14px;font-weight:900;color:#DC2626">रोग विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">ग्रह-भाव-नक्षत्र से रोग की सम्भावना</div></div>
      </div>
      ${body}${foot(10,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — आयु")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(217,119,6,.1);border:1.5px solid rgba(217,119,6,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⏳</span>
        <div><div style="font-size:14px;font-weight:900;color:#D97706">आयु विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN दीर्घायु सूत्र — ग्रह बल + भाव स्थिति</div></div>
      </div>
      ${body}${foot(11,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — विवाह")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(236,72,153,.1);border:1.5px solid rgba(236,72,153,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💍</span>
        <div><div style="font-size:14px;font-weight:900;color:#EC4899">विवाह विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">BNN विवाह योग, समय, मांगलिक, जीवनसाथी</div></div>
      </div>
      ${body}${foot(12,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — दुर्घटना")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(249,115,22,.1);border:1.5px solid rgba(249,115,22,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⚠️</span>
        <div><div style="font-size:14px;font-weight:900;color:#F97316">दुर्घटना विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">मंगल + केतु + वक्री + 6/8/12वें भाव संयोग</div></div>
      </div>
      ${body}${foot(13,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — संतान")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">👶</span>
        <div><div style="font-size:14px;font-weight:900;color:#10B981">संतान विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">गुरु + 5वां भाव + संतान कारक</div></div>
      </div>
      ${body}${foot(14,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — मानसिक शांति")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(139,92,246,.1);border:1.5px solid rgba(139,92,246,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🧠</span>
        <div><div style="font-size:14px;font-weight:900;color:#8B5CF6">मानसिक शांति मीटर</div>
        <div style="font-size:9px;color:#64748B">चंद्र + लग्न + पापी ग्रह संयोग से तनाव स्कोर</div></div>
      </div>
      ${body}${foot(15,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — करियर-धन")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(34,211,238,.1);border:1.5px solid rgba(34,211,238,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💼</span>
        <div><div style="font-size:14px;font-weight:900;color:#22D3EE">करियर - धन विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">शनि + 10वां + 2वां + 11वां भाव</div></div>
      </div>
      ${body}${foot(16,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — पूर्व जन्म")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(45,212,191,.1);border:1.5px solid rgba(45,212,191,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🔮</span>
        <div><div style="font-size:14px;font-weight:900;color:#2DD4BF">पूर्व जन्म विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">पूर्वजन्म लग्न + कर्म ऋण + श्राप</div></div>
      </div>
      ${body}${foot(17,TOTAL_PAGES)}</div>${close}`;
  };

  pages[18] = () => {
    const ret = nadiEd.retrograde || {};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
    const retroList = ret.retrograde_planets || ret.planets || [];
    const body = !ret || Object.keys(ret).length===0 ? noData() : `
      ${retroList.length>0?`${sect(`वक्री ग्रह — ${retroList.length}`,"#818CF8")}<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${retroList.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(129,140,248,.15);color:#818CF8;font-size:11px;font-weight:700;border:1px solid rgba(129,140,248,.3)">⟲ ${PH2[p]||p}</span>`).join("")}</div>`:`<div style="color:#64748B;font-size:11px;padding:8px">कोई वक्री ग्रह नहीं</div>`}
      ${ret.messages?.length>0?`${sect("वक्री विश्लेषण","#818CF8")}${renderMsgList(ret.messages,"#818CF8")}`:""}
      ${ret.effects?.length>0?`${sect("प्रभाव","#6366F1")}${renderMsgList(ret.effects,"#6366F1")}`:""}
    `;
    return `${head("नाड़ी — वक्री ग्रह")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(129,140,248,.1);border:1.5px solid rgba(129,140,248,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⟲</span>
        <div><div style="font-size:14px;font-weight:900;color:#818CF8">वक्री ग्रह विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">राहु/केतु छोड़कर, 50% शक्ति में कमी + विलंब</div></div>
      </div>
      ${body}${foot(18,TOTAL_PAGES)}</div>${close}`;
  };

  pages[19] = () => {
    const eh = nadiEd.eighth_house || {};
    const dt = nadiEd.death_timing || {};
    const body = !eh || Object.keys(eh).length===0 ? noData() : `
      ${eh.summary?nadiCard("8वें भाव सार", eh.summary, "#6366F1"):""}
      ${eh.messages?.length>0?`${sect("अष्टम भाव विश्लेषण","#6366F1")}${renderMsgList(eh.messages,"#6366F1")}`:""}
      ${dt && Object.keys(dt).length>0?`${sect("मृत्यु काल संकेत","#475569")}<div style="padding:8px;border-radius:7px;background:rgba(71,85,105,.08);border:1px solid rgba(71,85,105,.25);font-size:10px;color:#94A3B8">${renderMsgList(dt.messages||[],"#475569")}</div>`:""}
    `;
    return `${head("नाड़ी — अष्टम भाव")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(99,102,241,.1);border:1.5px solid rgba(99,102,241,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🌑</span>
        <div><div style="font-size:14px;font-weight:900;color:#6366F1">अष्टम भाव विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">आयु, रहस्य, परिवर्तन, गूढ़ शक्तियां</div></div>
      </div>
      ${body}${foot(19,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — रत्न")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(20,184,166,.1);border:1.5px solid rgba(20,184,166,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">💎</span>
        <div><div style="font-size:14px;font-weight:900;color:#14B8A6">नाड़ी रत्न विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">लग्न + ग्रह स्थिति आधारित रत्न सुझाव</div></div>
      </div>
      ${body}${foot(20,TOTAL_PAGES)}</div>${close}`;
  };

  pages[21] = () => {
    const vn = nadiEd.vish_navamsha || {};
    const body = !vn || Object.keys(vn).length===0 ? noData() : `
      ${vn.vish_planets?.length>0?`${sect("विष नवमांश ग्रह","#A855F7")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${vn.vish_planets.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(168,85,247,.15);color:#a78bfa;font-size:11px;font-weight:700;border:1px solid rgba(168,85,247,.3)">☠️ ${p}</span>`).join("")}</div>`:""}
      ${vn.pushkara_planets?.length>0?`${sect("पुष्कर नवमांश ग्रह","#4ADE80")}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${vn.pushkara_planets.map(p=>`<span style="padding:3px 10px;border-radius:6px;background:rgba(74,222,128,.12);color:#4ADE80;font-size:11px;font-weight:700;border:1px solid rgba(74,222,128,.25)">✨ ${p}</span>`).join("")}</div>`:""}
      ${vn.venus_vish_warning?`<div style="padding:9px;border-radius:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);margin-bottom:7px;font-size:11px;font-weight:700;color:#FB7185">⚠️ शुक्र विष नवमांश — विवाह में विशेष सावधानी</div>`:""}
      ${vn.messages?.length>0?`${sect("विष नवमांश विश्लेषण","#A855F7")}${renderMsgList(vn.messages,"#a78bfa")}`:""}
    `;
    return `${head("नाड़ी — विष नवमांश")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(168,85,247,.1);border:1.5px solid rgba(168,85,247,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">☠️</span>
        <div><div style="font-size:14px;font-weight:900;color:#A855F7">विष नवमांश विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">विष/पुष्कर नवमांश — ग्रह की गहरी शक्ति/कमजोरी</div></div>
      </div>
      ${body}${foot(21,TOTAL_PAGES)}</div>${close}`;
  };

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
    return `${head("नाड़ी — विशेष योग")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(245,158,11,.1);border:1.5px solid rgba(245,158,11,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">✨</span>
        <div><div style="font-size:14px;font-weight:900;color:#F59E0B">विशेष नाड़ी योग</div>
        <div style="font-size:9px;color:#64748B">BNN दुर्लभ योग — ग्रह संयोग से जीवन में विशेष घटनाएं</div></div>
      </div>
      ${body}${foot(22,TOTAL_PAGES)}</div>${close}`;
  };

  pages[23] = () => {
    const dc2 = nadiEd.degree_control || {};
    const comb = nadiEd.combustion || {};
    const PH2={SUN:"सूर्य",MOON:"चंद्र",MARS:"मंगल",MERCURY:"बुध",JUPITER:"गुरु",VENUS:"शुक्र",SATURN:"शनि",RAHU:"राहु",KETU:"केतु"};
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
    return `${head("नाड़ी — शारीरिक बनावट")}<div class="page">
      <div style="padding:9px 14px;border-radius:9px;background:rgba(251,146,60,.1);border:1.5px solid rgba(251,146,60,.3);margin-bottom:10px;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🧍</span>
        <div><div style="font-size:14px;font-weight:900;color:#FB923C">शारीरिक बनावट विश्लेषण</div>
        <div style="font-size:9px;color:#64748B">लग्न ग्रह + अंश नियंत्रण से रूप-रंग संकेत</div></div>
      </div>
      ${body}${foot(23,TOTAL_PAGES)}</div>${close}`;
  };

  // ── विवाह Engine Data ──────────────────────────────────────────
  const vd = ed.vivah || {};

  // ── Page 24: विवाह (Part 1) ─────────────────────────────────
  pages[24] = () => {
    if (!vd || !vd.saptam) return `${head("विवाह विश्लेषण")}<div class="page">
      <div style="padding:20px;text-align:center;color:#475569;border:1px dashed rgba(244,114,182,.3);border-radius:8px">
        विवाह इंजन डेटा उपलब्ध नहीं
      </div>${foot(24,TOTAL_PAGES)}</div>${close}`;

    const {
      saptam={}, mangalik={}, vilamb={}, prem_vivah={}, prem_sambandh={},
      vichchhed={}, swabhaav={}, vivah_kaal={}, daampatya_sukh={},
      vaidhavya={}, dwi_vivah={}, paracetamol={}, chandra_bal={},
      vivah_bhagya={}, dosha_yogas={}, rahu_checks={}, attraction={},
      combos_7th={}, vivah_saham={}, vish_navamsha={}, ugra_nakshatra={},
      sasural_disha={}, sapt_varga={}, d9_saccha_prem={}, mangalik_vish={},
    } = vd;

    const vS  = (t,c="#F472B6")=>`<div style="margin:8px 0 4px;padding:4px 9px;background:${c}12;border-left:3px solid ${c};font-size:11px;font-weight:900;color:${c}">${t}</div>`;
    const vR  = (t,c="#CBD5E1")=>t?`<div style="padding:4px 8px;border-radius:5px;background:rgba(255,255,255,.04);border-left:2px solid ${c}50;margin-bottom:3px;font-size:9.5px;color:${c};line-height:1.5">${t}</div>`:"";
    const vV  = (t,c)=>t?`<div style="display:inline-block;padding:3px 10px;border-radius:12px;margin-bottom:5px;background:${c}18;border:1.5px solid ${c}55;font-size:10px;font-weight:700;color:${c}">${t}</div>`:"";
    const vC  = (items,c="#94A3B8")=>(items||[]).map(x=>`<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:5px;background:${c}18;color:${c};border:1px solid ${c}35;font-size:9px;font-weight:700">${x}</span>`).join("");
    const vSL = (sutras,max=5)=>(sutras||[]).slice(0,max).map(s=>{
      const ic=s.applied?"🔴":"🟢"; const c=s.applied?"#FB7185":"#4ADE80";
      return `<div style="padding:4px 7px;border-radius:6px;margin-bottom:3px;background:${c}06;border:1px solid ${c}25;font-size:8.5px;color:${c}">${ic} <span style="color:rgba(255,255,255,0.4);font-style:italic">${s.sutra||""}</span> — <span>${s.result||""}</span></div>`;
    }).join("");

    const savCol=saptam.h7_sav>=28?"#22D3EE":saptam.h7_sav>=22?"#FCD34D":"#FB7185";
    const mgCol=mangalik.cancelled?"#4ADE80":mangalik.is_mangalik?"#FB7185":"#22D3EE";
    const mgText=mangalik.cancelled?"✅ दोष रद्द":mangalik.is_mangalik?"🔴 मांगलिक है":"✅ मांगलिक नहीं";

    return `${head("विवाह विश्लेषण — भाग 1")}<div class="page">
      <div style="padding:7px 11px;border-radius:9px;background:rgba(244,114,182,.07);border:1.5px solid rgba(244,114,182,.3);margin-bottom:8px;display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">💍</span>
        <div><div style="font-size:13px;font-weight:900;color:#F472B6">विवाह विश्लेषण — 33 मॉड्यूल (पृष्ठ 1/2)</div>
        <div style="font-size:8px;color:#64748B">🔴 = दोष लागू | 🟢 = दोष नहीं | D1 कुंडली से</div></div>
      </div>

      ${vS("💑 सप्तम भाव — विवाह का मूल","#22D3EE")}
      <div class="two">
        <div style="padding:8px;border-radius:8px;background:${savCol}08;border:1px solid ${savCol}30;text-align:center">
          <div style="font-size:8px;color:#64748B">सप्तम SAV</div>
          <div style="font-size:28px;font-weight:900;color:${savCol}">${saptam.h7_sav||"—"}</div>
          <div style="font-size:8.5px;color:${savCol}">${saptam.h7_sav>=28?"✅ बलवान":saptam.h7_sav>=22?"🟡 सामान्य":saptam.h7_sav>=14?"⚠️ कमजोर":"❌ अत्यंत कमजोर"}</div>
        </div>
        <div>
          ${vV(saptam.verdict, saptam.color||"#FCD34D")}
          ${vR(`सप्तमेश ${saptam.h7_lord_hi||"—"} — ${saptam.h7_lord_house||"—"}वें भाव में${saptam.lord_in_trik?" ⚠️ त्रिक":""}`,saptam.lord_in_trik?"#FB7185":"#22D3EE")}
          ${vR(`विवाह कारक ${saptam.vivah_karak||"—"}: BAV ${saptam.karak_bav||"—"} — ${saptam.karak_strong?"✅ बलवान":"⚠️ कमजोर"}`,saptam.karak_strong?"#4ADE80":"#FCD34D")}
          <div style="margin-top:3px">${vC(saptam.kroor_in_7,"#FB7185")}${vC(saptam.shubh_in_7,"#4ADE80")}</div>
        </div>
      </div>
      ${vSL(saptam.sutras_with_status,6)}

      ${vS("🔴 मांगलिक दोष","#FB7185")}
      <div style="padding:8px;border-radius:8px;background:${mgCol}08;border:1px solid ${mgCol}30;margin-bottom:5px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:13px;font-weight:900;color:${mgCol}">${mgText}</div>
          <div style="font-size:9px;color:#94A3B8">मंगल ${mangalik.mars_house||"—"}वें | BAV: ${mangalik.mars_bav||"—"}/8</div>
        </div>
        ${mangalik.cancel_reasons?.length?`<div style="font-size:8.5px;color:#4ADE80;margin-top:2px">रद्द: ${mangalik.cancel_reasons.join(" | ")}</div>`:""}
      </div>
      ${vSL(mangalik.sutras_with_status,4)}

      ${vS("🌙 चंद्र बल — कुंडली मिलान","#C084FC")}
      <div style="font-size:9px;color:#C084FC;margin-bottom:4px">🌙 चंद्रमा: ${chandra_bal.moon_rashi||"—"} | BAV: ${chandra_bal.moon_bav||"—"}</div>
      ${(chandra_bal.warnings||[]).map(w=>vR(w,"#FCD34D")).join("")}
      ${(chandra_bal.strengths||[]).map(s=>vR(s,"#4ADE80")).join("")}
      ${chandra_bal.matchmaking_note?vR(chandra_bal.matchmaking_note,"#F59E0B"):""}

      ${vS("⏳ विवाह विलंब","#FCD34D")}
      <div class="two">
        <div>${vV(vilamb.verdict,vilamb.color||"#FCD34D")}
          ${(vilamb.delay_factors||[]).slice(0,3).map(f=>vR(f,"#FCD34D")).join("")}
        </div>
        <div>${(vilamb.protect_factors||[]).slice(0,3).map(f=>vR(f,"#4ADE80")).join("")}</div>
      </div>

      ${vS("❤️ प्रेम विवाह योग","#22D3EE")}
      ${vV(prem_vivah.verdict,prem_vivah.color||"#94A3B8")}
      ${(prem_vivah.prem_yoga_factors||[]).slice(0,3).map(f=>vR(f,"#22D3EE")).join("")}
      ${prem_vivah.family_note?vR(prem_vivah.family_note,prem_vivah.family_approval?"#4ADE80":"#FCD34D"):""}

      ${vS("💔 विवाह विच्छेद / तलाक","#EF4444")}
      <div class="two">
        <div>${vV(vichchhed.verdict,vichchhed.color||"#FCD34D")}
          ${(vichchhed.vichchhed_factors||[]).slice(0,3).map(f=>vR(f,"#FB7185")).join("")}
        </div>
        <div>${(vichchhed.protection_factors||[]).slice(0,3).map(f=>vR(f,"#4ADE80")).join("")}</div>
      </div>

      ${vS("📅 विवाह का समय — अनुकूल दशाएं","#22D3EE")}
      ${vivah_kaal.current_note?`<div style="padding:6px;border-radius:6px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.25);font-size:9.5px;color:#22D3EE;margin-bottom:4px">${vivah_kaal.current_note}</div>`:""}
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:5px">${vC(vivah_kaal.key_dashas,"#22D3EE")}</div>
      ${(vivah_kaal.timing_notes||[]).slice(0,3).map(n=>vR("🕐 "+n,"rgba(255,255,255,0.7)")).join("")}

      ${vS("🏠 दांपत्य सुख — भाव SAV","#F59E0B")}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:5px">
        ${(daampatya_sukh.breakdown||[]).map(b=>{
          const c=b.sav>=28?"#22D3EE":b.sav>=22?"#FCD34D":"#FB7185";
          return `<div style="padding:6px;border-radius:7px;background:${c}08;border:1px solid ${c}25;text-align:center">
            <div style="font-size:8px;color:#64748B">${b.bhav||""}</div>
            <div style="font-size:16px;font-weight:900;color:${c}">${b.sav||"—"}</div>
          </div>`;
        }).join("")}
      </div>

      ${foot(24,TOTAL_PAGES)}</div>${close}`;
  };

  // ── Page 25: विवाह (Part 2) ─────────────────────────────────
  pages[25] = () => {
    if (!vd || !vd.saptam) return `${head("विवाह — भाग 2")}<div class="page">
      <div style="padding:20px;text-align:center;color:#475569">डेटा उपलब्ध नहीं</div>
      ${foot(25,TOTAL_PAGES)}</div>${close}`;

    const {
      swabhaav={}, dwi_vivah={}, paracetamol={}, vivah_bhagya={},
      rahu_checks={}, attraction={}, combos_7th={}, vivah_saham={},
      vish_navamsha={}, ugra_nakshatra={}, sasural_disha={}, sapt_varga={},
      d9_saccha_prem={}, dosha_yogas={}, kul_nirdharan={}, anterjatiya={},
      vyabhichar={}, d9_hints={},
    } = vd;

    const vS  = (t,c="#F472B6")=>`<div style="margin:8px 0 4px;padding:4px 9px;background:${c}12;border-left:3px solid ${c};font-size:11px;font-weight:900;color:${c}">${t}</div>`;
    const vR  = (t,c="#CBD5E1")=>t?`<div style="padding:4px 8px;border-radius:5px;background:rgba(255,255,255,.04);border-left:2px solid ${c}50;margin-bottom:3px;font-size:9.5px;color:${c};line-height:1.5">${t}</div>`:"";
    const vV  = (t,c)=>t?`<div style="display:inline-block;padding:3px 10px;border-radius:12px;margin-bottom:5px;background:${c}18;border:1.5px solid ${c}55;font-size:10px;font-weight:700;color:${c}">${t}</div>`:"";
    const vC  = (items,c="#94A3B8")=>(items||[]).map(x=>`<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:5px;background:${c}18;color:${c};border:1px solid ${c}35;font-size:9px;font-weight:700">${x}</span>`).join("");
    const vSL = (sutras,max=4)=>(sutras||[]).slice(0,max).map(s=>{
      const ic=s.applied?"🔴":"🟢"; const c=s.applied?"#FB7185":"#4ADE80";
      return `<div style="padding:4px 7px;border-radius:6px;margin-bottom:3px;background:${c}06;border:1px solid ${c}25;font-size:8.5px;color:${c}">${ic} <span style="color:rgba(255,255,255,0.4);font-style:italic">${s.sutra||""}</span> — ${s.result||""}</div>`;
    }).join("");

    return `${head("विवाह विश्लेषण — भाग 2")}<div class="page">
      <div style="padding:5px 10px;border-radius:7px;background:rgba(244,114,182,.07);border:1px solid rgba(244,114,182,.3);margin-bottom:8px;font-size:11px;font-weight:900;color:#F472B6">💍 विवाह विश्लेषण — (पृष्ठ 2/2)</div>

      ${vS("👤 जीवनसाथी का स्वभाव","#C084FC")}
      ${(swabhaav.descriptions||[]).map(d=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:7px;margin-bottom:4px;background:rgba(192,132,252,.06);border:1px solid rgba(192,132,252,.2)">
        <span style="font-size:16px;flex-shrink:0">${d.icon||""}</span>
        <div><div style="font-size:10px;font-weight:700;color:#C084FC">${d.planet||""}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.7);margin-top:2px;line-height:1.4">${d.nature||""}</div></div>
      </div>`).join("")}

      ${combos_7th.sutras?.length?`${vS("⚔️ 7वें भाव के खतरनाक संयोग","#FCD34D")}
      ${(combos_7th.sutras||[]).slice(0,4).map(s=>vR(s)).join("")}`:""}

      ${vS("🌟 विवाह के बाद भाग्योदय","#F59E0B")}
      ${vR(vivah_bhagya.prediction||"","#F59E0B")}
      ${(vivah_bhagya.bhagya_factors||[]).slice(0,3).map(f=>vR(f,"#4ADE80")).join("")}

      ${vS("☠️ विष नवमांश — छिपा हुआ दोष","#EF4444")}
      ${(vish_navamsha.afflicted_planets||[]).length>0
        ?`<div style="padding:7px;border-radius:7px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);margin-bottom:5px">
          ${(vish_navamsha.afflicted_planets||[]).map(p=>`<div style="font-size:9.5px;color:#EF4444;margin-bottom:2px">⚠️ ${p.planet||""} (${p.degree||""}) — ${p.house_desc||""}</div>`).join("")}
        </div>`
        :`<div style="font-size:9.5px;color:#4ADE80;padding:4px">✅ कोई विष नवमांश दोष नहीं</div>`}

      ${vS("🔥 उग्र/तीक्ष्ण नक्षत्र","#EF4444")}
      ${vV(ugra_nakshatra?.verdict||"✅ कोई उग्र/तीक्ष्ण नक्षत्र दोष नहीं", ugra_nakshatra?.has_dosha?"#EF4444":"#4ADE80")}
      ${vSL(ugra_nakshatra?.sutras_with_status,4)}

      ${vS("🎯 विवाह सहम — सटीक विवाह समय","#22D3EE")}
      ${vivah_saham.saham_rashi?`<div style="padding:8px;border-radius:8px;background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.3);margin-bottom:5px">
        <div style="font-size:9px;color:#64748B">विवाह सहम राशि</div>
        <div style="font-size:20px;font-weight:900;color:#22D3EE">${vivah_saham.saham_rashi||"—"}</div>
        ${vivah_saham.timing_note?`<div style="font-size:8.5px;color:#94A3B8;margin-top:2px">${vivah_saham.timing_note}</div>`:""}
      </div>`:""}

      ${vS("🧭 ससुराल की दिशा","#C084FC")}
      ${sasural_disha.sasural_disha?`<div style="padding:8px;border-radius:8px;background:rgba(192,132,252,.1);border:1.5px solid rgba(192,132,252,.4);text-align:center;margin-bottom:5px">
        <div style="font-size:8px;color:#94A3B8">संभावित ससुराल दिशा</div>
        <div style="font-size:24px;font-weight:900;color:#C084FC">${sasural_disha.sasural_disha}</div>
        <div style="font-size:8px;color:#64748B">(${sasural_disha.frequency||"—"}/${sasural_disha.total_points||"—"} बिंदु)</div>
      </div>`:""}
      ${(sasural_disha.details||[]).slice(0,3).map(d=>vR(d,"rgba(255,255,255,0.6)")).join("")}

      ${vS("📊 सप्त-वर्ग विलंब सूत्र","#FCD34D")}
      ${vV(sapt_varga.verdict||"—",sapt_varga.color||"#FCD34D")}
      ${sapt_varga.results?.length?`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:5px">
        ${(sapt_varga.results||[]).map(r=>`<div style="padding:4px 5px;border-radius:6px;text-align:center;background:${r.shani?"rgba(251,113,133,.1)":"rgba(255,255,255,.03)"};border:1px solid ${r.shani?"rgba(251,113,133,.4)":"rgba(255,255,255,.07)"}">
          <div style="font-size:9px;font-weight:700;color:${r.shani?"#FB7185":"#4ADE80"}">${r.chart||""}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.5)">${r.rashi||""}</div>
        </div>`).join("")}
      </div>`:""}

      ${paracetamol?.has_upay?`${vS("💊 पेरासिटामोल उपाय — सटीक दान","#F59E0B")}
      ${paracetamol.afflicting?.length?`<div style="padding:6px 9px;border-radius:7px;background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.3);margin-bottom:5px">
        <div style="font-size:8px;color:#64748B">मुख्य दोषी ग्रह:</div>
        <div style="margin-top:2px">${vC(paracetamol.afflicting,"#FB7185")}</div>
      </div>`:""}
      ${(paracetamol.remedies||[]).slice(0,2).map(r=>`<div style="padding:7px 9px;border-radius:7px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.22);margin-bottom:4px">
        <div style="font-size:10px;font-weight:800;color:#F59E0B;margin-bottom:3px">🎯 ${r.planet||""}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:8.5px;color:#94A3B8">
          <div>📦 ${r.vastu||"—"}</div><div>📅 ${r.vaar||"—"}</div>
          <div>🕉️ ${(r.mantra||"").slice(0,35)}${(r.mantra||"").length>35?"...":""}</div><div>👘 ${r.vastra||"—"}</div>
        </div>
        <div style="margin-top:4px;font-size:8px;color:#94A3B8">⚖️ ${r.daan_rule||""}</div>
      </div>`).join("")}
      ${paracetamol.kadwa_sach?`<div style="padding:6px 9px;border-radius:7px;background:rgba(251,113,133,.08);border:1px solid rgba(251,113,133,.3);font-size:9px;color:#FB7185;font-weight:700">${paracetamol.kadwa_sach}</div>`:""}
      `:""}

      <div style="margin-top:8px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);font-size:8.5px;color:rgba(255,255,255,0.4);line-height:1.5">
        📌 ये सभी संकेत हैं — अंतिम निर्णय आप स्वयं लें। दशा + गोचर + परिस्थिति सब मिलाकर देखें। 🔴 = यह दोष लागू है &nbsp; 🟢 = यह दोष नहीं है
      </div>
      ${foot(25,TOTAL_PAGES)}</div>${close}`;
  };

  // 🆕 PAGE 26 — वशोत्तरी दशा समयरेखा (MD + AD + PD)
  pages[26] = () => {
    // Extract dasha data from pd.dasha (same as used in UI)
    const dashaSeqData = dashaSeq || [];
    const currentDasha = dasha || {};
    
    if (!dashaSeqData || dashaSeqData.length === 0) {
      return `${head("वशोत्तरी दशा")}<div class="page">
        <div style="color:#475569;text-align:center;padding:20px">दशा डेटा उपलब्ध नहीं</div>
        ${foot(26, TOTAL_PAGES)}</div>${close}`;
    }

    // Current dasha info
    const currentMD = currentDasha.mahadasha || "—";
    const currentAD = currentDasha.antardasha || "—";
    const currentPD = currentDasha.pratyantar || "—";
    const endDate = currentDasha.endDate || "—";

    // Find current MD object to get ALL its antardashas
    const currentMDObj = dashaSeqData.find(md => {
      const pName = md.planet || md.lord || md.name;
      return pName === currentMD;
    });
    
    const antardashas = currentMDObj?.antardashas || currentMDObj?.subperiods || [];

    return `${head("वशोत्तरी दशा — पूर्ण समयरेखा")}<div class="page">
      <div style="margin:12px 0;padding:10px;background:rgba(245,158,11,.06);border-radius:8px;border:1px solid rgba(245,158,11,.2)">
        <div style="font-size:11px;color:#475569;margin-bottom:5px">💡 <strong>वशोत्तरी पद्धति:</strong> जन्म नक्षत्र से 120 वर्ष का चक्र।</div>
        <div style="font-size:11px;color:#0f766e"><strong>वर्तमान:</strong> ${currentMD} महादशा → ${currentAD} अंतर्दशा → ${currentPD} प्रत्यंतर | समाप्ति: ${endDate}</div>
      </div>

      ${sect("महादशा — 120 वर्ष चक्र","#F59E0B")}
      <table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:10px;background:white">
        <thead>
          <tr style="background:#1e293b;color:white">
            <th style="padding:5px 4px;text-align:left;border:1px solid #cbd5e1;font-weight:700">महादशा</th>
            <th style="padding:5px 4px;text-align:center;border:1px solid #cbd5e1;font-weight:700">आरंभ</th>
            <th style="padding:5px 4px;text-align:center;border:1px solid #cbd5e1;font-weight:700">समाप्ति</th>
            <th style="padding:5px 4px;text-align:center;border:1px solid #cbd5e1;font-weight:700">वर्ष</th>
            <th style="padding:5px 4px;text-align:left;border:1px solid #cbd5e1;font-weight:700">फल</th>
          </tr>
        </thead>
        <tbody>
          ${dashaSeqData.map((md, i) => {
            const planetName = md.planet || md.lord || md.name || "—";
            const mdLord = PH[planetName] || planetName;
            const startDate = md.start || md.startDate || md.from || "—";
            const endDateMD = md.end || md.endDate || md.to || "—";
            const durationYears = md.years || md.duration || md.durationYears || "—";
            const effect = DASHA_FX[planetName] || "—";
            const isCurrent = planetName === currentMD;
            const bgColor = isCurrent ? 'rgba(245,158,11,.15)' : (i % 2 === 0 ? '#f8fafc' : 'white');
            const textWeight = isCurrent ? '900' : '600';
            const textColor = isCurrent ? '#F59E0B' : '#1e293b';
            
            return `
            <tr style="background:${bgColor}">
              <td style="padding:5px 4px;border:1px solid #e2e8f0;font-weight:${textWeight};color:${textColor};white-space:nowrap">${isCurrent?'▶ ':''}${mdLord}</td>
              <td style="padding:5px 4px;border:1px solid #e2e8f0;text-align:center;color:#475569;font-size:8px">${startDate}</td>
              <td style="padding:5px 4px;border:1px solid #e2e8f0;text-align:center;color:#475569;font-size:8px">${endDateMD}</td>
              <td style="padding:5px 4px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:#64748B">${durationYears}</td>
              <td style="padding:5px 4px;border:1px solid #e2e8f0;font-size:8px;color:#64748B;line-height:1.3">${effect}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      ${antardashas.length > 0 ? `
      ${sect("अंतर्दशा — "+currentMD+" महादशा के सभी 9 अंतर्दशा","#22D3EE")}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:10px">
        ${antardashas.map((ad, i) => {
          const planetName = ad.planet || ad.lord || ad.name || "—";
          const adLord = PH[planetName] || planetName;
          const startDate = ad.start || ad.startDate || ad.from || "—";
          const endDateAD = ad.end || ad.endDate || ad.to || "—";
          const isCurrent = planetName === currentAD;
          
          // Get pratyantars for THIS antardasha
          const pratyantars = ad.pratyantardashas || ad.subperiods || [];
          
          const bgColor = isCurrent ? 'rgba(34,211,238,.12)' : 'rgba(255,255,255,.02)';
          const borderColor = isCurrent ? '#22D3EE' : 'rgba(255,255,255,.1)';
          const textWeight = isCurrent ? '900' : '700';
          const textColor = isCurrent ? '#22D3EE' : '#94A3B8';
          
          return `
          <div style="padding:6px;border-radius:6px;background:${bgColor};border:1px solid ${borderColor}">
            <div style="font-weight:${textWeight};color:${textColor};font-size:10px;margin-bottom:3px">${isCurrent?'● ':''}${adLord}</div>
            <div style="color:#64748B;font-size:7px;margin-bottom:4px">${startDate}<br/>–<br/>${endDateAD}</div>
            ${pratyantars.length > 0 ? `
            <div style="padding:3px;background:rgba(192,132,252,.06);border-radius:4px;border:1px solid rgba(192,132,252,.15)">
              <div style="font-size:6px;color:#94A3B8;margin-bottom:2px;font-weight:700">प्रत्यंतर (${pratyantars.length}):</div>
              ${pratyantars.map((pd, j) => {
                const pdPlanet = pd.planet || pd.lord || pd.name || "—";
                const pdLord = PH[pdPlanet] || pdPlanet;
                const pdStart = pd.start || pd.startDate || pd.from || "—";
                const pdEnd = pd.end || pd.endDate || pd.to || "—";
                const isPDCurrent = isCurrent && pdPlanet === currentPD;
                const pdColor = isPDCurrent ? '#C084FC' : '#64748B';
                const pdWeight = isPDCurrent ? '900' : '600';
                
                return `<div style="font-size:6px;color:${pdColor};font-weight:${pdWeight};padding:1px 2px;margin-bottom:1px;background:${isPDCurrent?'rgba(192,132,252,.15)':'transparent'};border-radius:2px">${isPDCurrent?'◆ ':''}${pdLord} ${pdStart}–${pdEnd}</div>`;
              }).join('')}
            </div>
            ` : ''}
          </div>`;
        }).join('')}
      </div>
      ` : ''}

      ${foot(26, TOTAL_PAGES)}
    </div>${close}`;
  };

  // 🆕 PAGE 27 — चलित कुंडली (Bhav Chalit Chart — Sri Pati Paddhati)
  pages[27] = () => {
    const chalit        = pd.chalit || {};
    // engine se aate hain: _comparison (sandhi_risk, summary) aur _planets
    const chalitCmp     = chalit._comparison || {};
    const chalitSummary = chalitCmp.summary  || {};
    const sandhiRisk    = chalitCmp.sandhi_risk || [];
    const chalitEntries = Object.entries(chalit).filter(([k]) => !k.startsWith("_"));
    const changedCount  = chalitSummary.changed_count
                          ?? chalitEntries.filter(([,d]) => d.is_changed).length;
    const sandhiCount   = chalitSummary.sandhi_count ?? sandhiRisk.length;
    const stability     = chalitSummary.chart_stability || "";

    const PLANET_ORDER  = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
    const BHAV_KARAKA   = {
      1:"लग्न",2:"धन",3:"पराक्रम",4:"सुख",5:"संतान",6:"रोग",
      7:"विवाह",8:"आयु",9:"भाग्य",10:"कर्म",11:"लाभ",12:"व्यय"
    };

    // ── Main table rows ───────────────────────────────────────────
    const chalitRows = PLANET_ORDER
      .filter(pc => chalit[pc])
      .map(pc => {
        const data    = chalit[pc];
        const pInfo   = pl[pc] || {};
        const changed = data.is_changed;
        const isBhavS = data.is_bhav_sandhi  || false;
        const isRashiS= data.is_rashi_sandhi || false;
        const bsDist  = data.bhav_sandhi_dist != null ? Number(data.bhav_sandhi_dist).toFixed(2) : null;
        const madhyaDist = data.dist_from_madhya != null ? Number(data.dist_from_madhya).toFixed(2) : null;
        const bsNear  = data.bhav_sandhi_near;

        const d1H  = data.d1_house || "—";
        const chH  = data.house    || "—";

        const statusCol = changed  ? "#F59E0B" : "#4ADE80";
        const chHCol    = changed  ? "#F59E0B" : "#CBD5E1";
        const bsCol     = isBhavS  ? "#FB7185" : isRashiS ? "#FB923C" : "#334155";

        const rashi     = pInfo.hindi_sign || pInfo.sign || "—";
        const deg       = pInfo.degree || (data.degree ? Number(data.degree).toFixed(2)+"°" : "—");
        const nakshatra = pInfo.nakshatra    || "—";
        const nakLord   = pInfo.nakshatraLord|| "—";
        const dignity   = pInfo.dignityHindi || pInfo.dignity || "—";
        const digCol    = DC[pInfo.dignity]  || DC[pInfo.dignityHindi] || "#64748B";
        const digIcon   = DI[pInfo.dignity]  || DI[pInfo.dignityHindi] || "⚪";

        const sandhiTag = isBhavS && isRashiS
          ? `<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:rgba(251,113,133,.2);color:#FB7185;font-weight:700">⚠️ भाव+राशि सन्धि</span>`
          : isBhavS
          ? `<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:rgba(251,113,133,.15);color:#FB7185;font-weight:700">⚠️ भाव सन्धि ${bsDist ? bsDist+"°" : ""}</span>`
          : isRashiS
          ? `<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:rgba(251,146,60,.15);color:#FB923C;font-weight:700">⚠️ राशि सन्धि</span>`
          : `<span style="font-size:7px;color:#334155">मध्य ${madhyaDist ? madhyaDist+"°" : "—"}</span>`;

        return `<tr style="border-bottom:1px solid rgba(255,255,255,.04);${changed?"background:rgba(245,158,11,.03)":isBhavS?"background:rgba(251,113,133,.02)":""}">
          <td style="padding:5px 7px">
            <div style="color:#F59E0B;font-weight:900;font-size:12px">${PH[pc]||pc} ${PS[pc]||""}</div>
            <div style="font-size:8px;color:#475569;margin-top:1px">${rashi} | ${deg}</div>
          </td>
          <td style="padding:5px 7px;font-size:9px;color:#64748B">
            ${nakshatra}<br/><span style="color:#475569;font-size:8px">${nakLord}</span>
          </td>
          <td style="padding:5px 7px;font-size:9px;font-weight:700;color:${digCol}">${digIcon} ${dignity}</td>
          <td style="padding:5px 7px;text-align:center">
            <div style="font-size:13px;font-weight:900;color:#94A3B8">${d1H}</div>
            <div style="font-size:7px;color:#334155">${typeof d1H==="number"?BHAV_KARAKA[d1H]||"":""}</div>
          </td>
          <td style="padding:5px 7px;text-align:center">
            <div style="font-size:13px;font-weight:900;color:${chHCol}">${chH}</div>
            <div style="font-size:7px;color:${changed?"#92400E":"#334155"}">${typeof chH==="number"?BHAV_KARAKA[chH]||"":""}</div>
          </td>
          <td style="padding:5px 7px">
            <span style="font-size:10px;font-weight:700;color:${statusCol};padding:2px 6px;border-radius:4px;background:${statusCol}12;border:1px solid ${statusCol}25">${changed?"🔄 बदला":"✅ समान"}</span>
            ${changed?`<div style="font-size:8px;color:#92400E;margin-top:1px">भाव ${d1H}→${chH}</div>`:""}
          </td>
          <td style="padding:5px 7px">${sandhiTag}</td>
        </tr>`;
      }).join("") ||
      `<tr><td colspan="7" style="padding:16px;text-align:center;color:#475569">चलित डेटा उपलब्ध नहीं</td></tr>`;

    // ── Bhav grid ────────────────────────────────────────────────
    const bhavGrid = Array.from({length:12},(_,i)=>{
      const n  = i+1;
      const ps = PLANET_ORDER.filter(pc => chalit[pc] && chalit[pc].house === n);
      const hasChanged = ps.some(pc => chalit[pc]?.is_changed);
      const hasSandhi  = ps.some(pc => chalit[pc]?.is_bhav_sandhi || chalit[pc]?.is_rashi_sandhi);
      const bdr = hasChanged ? "rgba(245,158,11,.3)" : hasSandhi ? "rgba(251,113,133,.3)" : "rgba(255,255,255,.06)";
      const bg  = hasChanged ? "rgba(245,158,11,.07)" : hasSandhi ? "rgba(251,113,133,.05)" : "rgba(255,255,255,.02)";
      const inner = ps.map(pc => {
        const ch = chalit[pc];
        const c  = ch.is_bhav_sandhi ? "#FB7185" : ch.is_changed ? "#F59E0B" : "#94A3B8";
        return `<span style="font-size:8px;font-weight:700;color:${c}">${PS[pc]||pc}${ch.is_bhav_sandhi?"⚠":ch.is_changed?"*":""}</span>`;
      }).join(" ");
      return `<div style="text-align:center;padding:5px 2px;border-radius:6px;background:${bg};border:1px solid ${bdr}">
        <div style="font-size:7px;color:#334155;margin-bottom:2px">भाव ${n}</div>
        <div style="min-height:14px;line-height:1.4">${inner||'<span style="color:#1e293b;font-size:8px">—</span>'}</div>
      </div>`;
    }).join("");

    // ── Sandhi risk section ───────────────────────────────────────
    const sandhiHTML = sandhiRisk.length > 0 ? `
      ${sect(`⚠️ सन्धि ग्रह — ${sandhiCount} ग्रह कमजोर स्थिति में`,"#FB7185")}
      <div style="margin-bottom:10px">
        <div style="font-size:9px;color:#64748B;margin-bottom:6px;padding:4px 8px;background:rgba(251,113,133,.05);border-radius:5px;border:1px solid rgba(251,113,133,.15)">
          💡 <b style="color:#FB7185">सन्धि का अर्थ:</b>
          <b>भाव सन्धि</b> = ग्रह दो भावों की सीमा पर है (±1°) — दोनों भावों का अनिश्चित फल।
          <b>राशि सन्धि</b> = ग्रह राशि के अंत/आरंभ पर है (0°/30° के पास) — अगली राशि का भी प्रभाव।
        </div>
        ${sandhiRisk.map(sp => {
          const typeCol = sp.sandhi_type?.includes("Bhav") ? "#FB7185" : "#FB923C";
          const pInfo = pl[sp.code] || {};
          const fn = pInfo.functionalNature || "";
          const fnCol = FC[fn] || "#64748B";
          return `<div style="padding:6px 10px;border-radius:7px;background:rgba(251,113,133,.05);border:1px solid rgba(251,113,133,.2);margin-bottom:5px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
              <span style="color:#F59E0B;font-weight:900;font-size:11px">${PH[sp.code]||sp.code} ${PS[sp.code]||""}</span>
              <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${typeCol}20;color:${typeCol};font-weight:700">${sp.sandhi_type||"सन्धि"}</span>
              ${fn?`<span style="font-size:8px;color:${fnCol}">${fn}</span>`:""}
            </div>
            <div style="font-size:9px;color:#94A3B8">${sp.sandhi_note||""}</div>
            <div style="font-size:8px;color:#475569;margin-top:1px">D1: भाव ${sp.d1_house} → चलित: भाव ${sp.chalit_house} ${sp.is_changed?"🔄":""}</div>
          </div>`;
        }).join("")}
      </div>` : "";

    // ── Changed planets summary ───────────────────────────────────
    const changedHTML = PLANET_ORDER
      .filter(pc => chalit[pc]?.is_changed)
      .map(pc => {
        const d   = chalit[pc];
        const fn  = pl[pc]?.functionalNature || "";
        const fnCol = FC[fn] || "#64748B";
        const isSandhi = d.is_bhav_sandhi || d.is_rashi_sandhi;
        return `<div style="padding:6px 10px;border-radius:7px;background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.18);display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#F59E0B;font-weight:900;font-size:11px">${PH[pc]||pc} ${PS[pc]||""}</span>
          <span style="font-size:11px;color:#94A3B8">भाव <b style="color:#CBD5E1">${d.d1_house}</b> → <b style="color:#F59E0B">${d.house}</b></span>
          <div style="display:flex;gap:4px;align-items:center">
            ${isSandhi?`<span style="font-size:7px;color:#FB7185;padding:1px 4px;border-radius:3px;background:rgba(251,113,133,.15)">⚠️ सन्धि</span>`:""}
            ${fn?`<span style="font-size:8px;color:${fnCol};padding:1px 5px;border-radius:3px;background:${fnCol}15">${fn}</span>`:""}
          </div>
        </div>`;
      }).join("");

    return `${head("चलित कुंडली")}<div class="page">
      ${headerBlock}
      ${sect("चलित कुंडली (Bhav Chalit Chart) — श्री पति पद्धति", "#22D3EE")}

      <div style="padding:8px 12px;border-radius:7px;background:rgba(34,211,238,.04);border:1px solid rgba(34,211,238,.15);margin-bottom:10px;font-size:9px;color:#64748B;line-height:1.8">
        💡 <b style="color:#22D3EE">चलित कुंडली:</b> D1 राशि-मध्य से भाव गिनता है।
        चलित में <b>श्री पति पद्धति</b> से exact भाव-सन्धि (cusp) निकाली जाती है।
        ग्रह यदि boundary पार करे → भाव बदलता है।
        <b style="color:#FB7185">⚠️ भाव सन्धि</b> = boundary ±1° पर (अनिश्चित फल) &nbsp;|&nbsp;
        <b style="color:#FB923C">⚠️ राशि सन्धि</b> = 0°/30° पर (दोनों राशि का प्रभाव)
      </div>

      ${sect("ग्रह-वार चलित स्थिति + सन्धि विश्लेषण","#22D3EE")}
      <table style="margin-bottom:10px;font-size:10px">
        <tr style="background:rgba(255,255,255,.05)">
          <th>ग्रह / राशि</th><th>नक्षत्र</th><th>अवस्था</th>
          <th style="text-align:center">D1</th>
          <th style="text-align:center">चलित</th>
          <th>स्थिति</th>
          <th>सन्धि</th>
        </tr>
        ${chalitRows}
      </table>

      ${sect("चलित भाव ग्रिड  (* बदला  ⚠ सन्धि)","#C084FC")}
      <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-bottom:10px">${bhavGrid}</div>

      ${sandhiHTML}

      ${changedCount > 0 ? `
      ${sect(`🔄 बदले हुए ग्रह — ${changedCount}`, "#F59E0B")}
      <div style="margin-bottom:8px">${changedHTML}</div>
      <div style="padding:6px 10px;border-radius:6px;background:rgba(245,158,11,.04);border:1px solid rgba(245,158,11,.15);font-size:9px;color:#94A3B8">
        <b style="color:#F59E0B">फलादेश नियम:</b> shifted ग्रह का फल → <b>चलित भाव</b> से।
        Sign/Dignity → <b>D1</b> से। सन्धि ग्रह का फल दोनों भावों से मिलाकर देखें।
      </div>` : `
      <div style="padding:8px 12px;border-radius:7px;background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.18);font-size:10px;color:#CBD5E1;margin-bottom:8px">
        ✅ सभी ग्रह D1 और चलित में <b>समान भाव</b> — कुंडली अत्यंत स्थिर।
      </div>`}

      ${stability ? `<div style="text-align:right;font-size:9px;color:#475569;margin-top:4px">कुंडली स्थिरता: <b style="color:#22D3EE">${stability}</b></div>` : ""}

      ${(()=>{
        const strength = pd.chalit?._planetStrength || {};
        if (!Object.keys(strength).length) return "";
        const ORDER = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
        let bal=0, madhyam=0, durbal=0;
        ORDER.forEach(k=>{ const s=strength[k]; if(!s) return; if(s.score>=14) bal++; else if(s.score>=8) madhyam++; else durbal++; });
        const rows = ORDER.map(k=>{
          const s = strength[k];
          if(!s) return "";
          const sc   = Number(s.score||0).toFixed(2);
          const col  = s.score>=14 ? "#4ADE80" : s.score>=8 ? "#F59E0B" : "#FB7185";
          const purv = s.prev_cusp!=null ? Number(s.prev_cusp).toFixed(2)+"°" : (s.bhav_prev!=null ? Number(s.bhav_prev).toFixed(2)+"°" : "—");
          const uttar= s.next_cusp!=null ? Number(s.next_cusp).toFixed(2)+"°" : (s.bhav_next!=null ? Number(s.bhav_next).toFixed(2)+"°" : "—");
          return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
            <td style="padding:5px 7px;color:#F59E0B;font-weight:900;font-size:11px">${PH[k]||k} ${PS[k]||""}</td>
            <td style="padding:5px 7px;text-align:center;color:#94A3B8;font-weight:700">${s.house||"—"}</td>
            <td style="padding:5px 7px;text-align:center">
              <span style="font-size:13px;font-weight:900;color:${col}">${sc}</span>
              <span style="font-size:8px;color:#475569">/20</span>
            </td>
            <td style="padding:5px 7px">
              <span style="font-size:9px;font-weight:700;color:${col};padding:2px 6px;border-radius:4px;background:${col}12;border:1px solid ${col}25">${s.status_hi||"—"}</span>
            </td>
            <td style="padding:5px 7px;font-size:9px;color:#64748B">${purv}</td>
            <td style="padding:5px 7px;font-size:9px;color:#64748B">${uttar}</td>
          </tr>`;
        }).join("");
        return `
        ${sect("🔢 विंशोपक बल (Bhav Strength)","#818CF8")}
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div style="padding:5px 10px;border-radius:6px;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);font-size:10px;font-weight:700;color:#4ADE80">💪 ${bal} बलवान</div>
          <div style="padding:5px 10px;border-radius:6px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);font-size:10px;font-weight:700;color:#F59E0B">〰️ ${madhyam} मध्यम</div>
          <div style="padding:5px 10px;border-radius:6px;background:rgba(251,113,133,.08);border:1px solid rgba(251,113,133,.25);font-size:10px;font-weight:700;color:#FB7185">⚠️ ${durbal} दुर्बल</div>
        </div>
        <table style="font-size:10px;margin-bottom:8px">
          <tr style="background:rgba(255,255,255,.05)">
            <th>ग्रह</th><th style="text-align:center">भाव</th><th style="text-align:center">Score (/20)</th><th>स्थिति</th><th>पूर्व°</th><th>उत्तर°</th>
          </tr>
          ${rows}
        </table>
        <div style="padding:5px 9px;border-radius:5px;background:rgba(129,140,248,.04);border:1px solid rgba(129,140,248,.12);font-size:8px;color:#64748B;line-height:1.8">
          💪 <b style="color:#4ADE80">बलवान</b> = 14 से अधिक (मध्य के पास) &nbsp;|&nbsp;
          〰️ <b style="color:#F59E0B">मध्यम</b> = 8–14 &nbsp;|&nbsp;
          ⚠️ <b style="color:#FB7185">दुर्बल</b> = 8 से कम या सन्धि पर
        </div>`;
      })()}

      ${foot(27, TOTAL_PAGES)}</div>${close}`;
  };


  // 🆕 PAGE 28 — षोडशवर्ग चक्र (16 D-Charts) + वक्री ग्रह सारांश
  pages[28] = () => {
    const VARGA_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];
    const PL_KEYS    = ["La","Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
    const PL_NAMES   = {"La":"लग्न","Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"};

    const getVarga = (p, k) => {
      try {
        const vName = p === "La"
          ? (meta.lagnaVargas?.[k]?.Name || "—")
          : (pl[p]?.vargas?.[k]?.Name   || "—");
        return vName.split(" ")[0];
      } catch(e) { return "—"; }
    };

    // वक्री ग्रह — सभी वक्री ग्रहों की सूची
    const PLANET_KEYS = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
    const vakri = PLANET_KEYS.filter(p => pl[p]?.Retrograde || pl[p]?.retrograde);
    const vakriBadge = vakri.length > 0
      ? vakri.map(p => `<span style="display:inline-block;margin:2px 3px;padding:3px 8px;border-radius:20px;background:rgba(129,140,248,.15);border:1px solid rgba(129,140,248,.4);color:#818CF8;font-size:9px;font-weight:900">${PL_NAMES[p]||p} ⟲</span>`).join("")
      : `<span style="color:#4ADE80;font-size:9px">✅ इस समय कोई ग्रह वक्री नहीं है</span>`;

    const rows = PL_KEYS.map(p => {
      const isLagna  = p === "La";
      const isVakri  = !isLagna && (pl[p]?.Retrograde || pl[p]?.retrograde);
      const pCol     = isLagna ? "#F59E0B" : isVakri ? "#818CF8" : "#22D3EE";
      const vakriTag = isVakri ? ' <span style="font-size:8px;color:#818CF8">⟲</span>' : "";
      return `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
        <td style="padding:6px 3px;text-align:left;font-weight:900;color:${pCol};background:rgba(255,255,255,0.02);white-space:nowrap">${PL_NAMES[p]}${vakriTag}</td>
        ${VARGA_KEYS.map(k => {
          const sign = getVarga(p, k);
          const isD9 = k === "D9";
          return `<td style="padding:6px 2px;font-size:7.5px;${isD9?"background:rgba(34,211,238,.08);color:#22D3EE;font-weight:900":"color:#CBD5E1"}">${sign}</td>`;
        }).join("")}
      </tr>`;
    }).join("");

    const body = `
      ${sect("षोडशवर्ग चक्र (16 D-Charts Matrix)", "#F59E0B")}
      <div style="font-size:9px;color:#64748B;margin-bottom:8px">
        💡 सभी 16 वर्ग कुण्डलियों में लग्न और ग्रहों की राशियों का सम्पूर्ण मैट्रिक्स।
        <b style="color:#22D3EE">D9 (नवांश)</b> विशेष महत्वपूर्ण — <b style="color:#818CF8">⟲ = वक्री ग्रह</b>।
      </div>

      <div style="padding:7px 10px;border-radius:7px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2);margin-bottom:10px">
        <span style="font-size:9px;font-weight:900;color:#818CF8">⟲ वर्तमान वक्री ग्रह: </span>${vakriBadge}
      </div>

      <div style="border-radius:8px;border:1px solid rgba(255,255,255,.1);overflow:hidden">
        <table style="font-size:8px;text-align:center;width:100%;border-collapse:collapse;margin:0">
          <tr style="background:rgba(245,158,11,.12)">
            <th style="padding:6px 3px;text-align:left;color:#F59E0B;width:45px">ग्रह</th>
            ${VARGA_KEYS.map(k => `<th style="padding:6px 2px;color:${k==="D9"?"#22D3EE":"#F59E0B"}">${k}</th>`).join("")}
          </tr>
          ${rows}
        </table>
      </div>

      <div style="margin-top:10px;padding:8px;border-radius:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);font-size:8px;color:#94A3B8;line-height:1.6">
        <b>कुण्डली उपयोग:</b> <b>D1</b> (शारीरिक व मूल), <b>D2</b> (धन), <b>D3</b> (भाई-बहन), <b>D4</b> (संपत्ति), <b>D7</b> (संतान),
        <b>D9</b> (जीवनसाथी/सूक्ष्म भाग्य), <b>D10</b> (कर्म/करियर), <b>D12</b> (माता-पिता), <b>D16</b> (वाहन सुख), <b>D20</b> (आध्यात्मिक),
        <b>D24</b> (शिक्षा), <b>D27</b> (बल), <b>D30</b> (अरिष्ट), <b>D40</b> (शुभ/अशुभ), <b>D45</b> (समग्र चरित्र), <b>D60</b> (पूर्वजन्म कर्म)।
      </div>
    `;

    return `${head("षोडशवर्ग")}<div class="page">
      ${headerBlock}
      ${body}
      ${foot(28, TOTAL_PAGES)}
    </div>${close}`;
  };

  const bodyOnly = (html) => {
    let s = html.replace(/[\s\S]*?<body[^>]*>/i, "");
    s = s.replace(/<\/body>[\s\S]*$/i, "");
    return s;
  };

  const ALL_PAGE_NUMS  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28];
  const NADI_PAGE_NUMS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];

  if(pageNum==="all"){
    const combined = ALL_PAGE_NUMS.map((n, i) => {
      const pageHtml = bodyOnly(pages[n]());
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
  
  // ✅ Mobile Detection (iPhone/iPad/Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // ✅ Mobile users को पहले ही बता दें कि क्या होगा
  if (isMobile) {
    alert("✅ कुंडली तैयार है!\n\nअगली स्क्रीन पर 'Save as PDF' (PDF के रूप में सहेजें) का विकल्प चुनें। फाइल सीधे आपके 'Downloads' फोल्डर में सेव हो जाएगी।");
  }

  const win = window.open("", "_blank", "width=1000,height=750");
  
  if(!win){ 
    alert("⚠️ पॉप-अप ब्लॉक है! कृपया ब्राउज़र में पॉप-अप को Allow करें।"); 
    return; 
  }
  
  win.document.write(html);
  win.document.close();
  
  win.onload = () => { 
    setTimeout(() => { 
      win.print(); 
    }, 900); 
  };
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
  // ── विवाह ──
  {num:24, icon:"💍", label:"विवाह — भाग 1",           desc:"सप्तम, मांगलिक, चंद्र बल, प्रेम विवाह, दशा"},
  {num:25, icon:"💍", label:"विवाह — भाग 2",           desc:"स्वभाव, विष नवमांश, सहम, ससुराल दिशा, उपाय"},
  // ── दशा ──
  {num:26, icon:"⏳", label:"वशोत्तरी दशा",             desc:"महा, अंतर, प्रत्यंतर — 120 वर्ष चक्र"},
  // ── चलित ──
  {num:27, icon:"🔄", label:"चलित कुंडली",              desc:"श्री पति पद्धति — वास्तविक भाव स्थिति"},
  // ── षोडशवर्ग ──
  {num:28, icon:"📊", label:"षोडशवर्ग चक्र",            desc:"16 D-Charts का सम्पूर्ण मैट्रिक्स + वक्री ग्रह"},
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
              <div className="text-[13px] font-black text-amber-400" style={HI}>सम्पूर्ण कुंडली — सभी 28 पेज</div>
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
            {sel===null?"📥 सम्पूर्ण PDF (25 पेज)":sel==="nadi_all"?"🌟 नाड़ी ज्योतिष PDF (15 पेज)":"📄 पेज "+sel+" PDF बनाएं"}
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
            {activeTab === "drishti" && (
  <DrishtiGrid
    drishti={chartData.drishti}
    bhavDrishti={chartData.bhavDrishti || {}}
    advancedDrishti={chartData.chalit?._advancedDrishti || []}
    planets={chartData.planets}
    houses={chartData.houses || []}
  />
)}

{activeTab === "dasha" && (
  <DashaTimeline
    dasha={chartData.dasha}
    chartMeta={chartData.meta}
  />
)}

{activeTab === "av" && (
  <AshtakavargaGrid
    sav={chartData.sav || []}
    houses={chartData.houses || []}
    ashtakavargaSpecial={chartData.ashtakavargaSpecial || ""}
  />
)}

{activeTab === "yogas" && (
  enginesLoading
    ? <TabSkeleton />
    : (
      <YogaPanel
        data={chartData.enginesData?.yogas}
        chartData={chartData}
      />
    )
)}

{activeTab === "houses" && (
  <HousePanel chartData={chartData} />
)}

{activeTab === "advanced" && (
  enginesLoading
    ? <TabSkeleton />
    : (
      <AdvancedAVPanel
        enginesData={chartData.enginesData}
        chartData={chartData}
        onExportPDF={() => exportKundliPDF(chartData)}
      />
    )
)}
            {activeTab === "kamukta" && <KamuktaPanel chartData={chartData} />}
            {activeTab === "gochar" && <GocharPanel chartData={chartData} />}
            {activeTab === "nadi" && (
              enginesLoading
                ? <TabSkeleton />
                : <NadiJyotishPanel chartData={chartData} />
            )}
            {activeTab === "conclusion" && <MasterConclusion data={chartData.masterConclusion} />}
            {activeTab === "av_sutras" && (
              enginesLoading
                ? <TabSkeleton />
                : <AVSutrasPanel data={chartData?.enginesData?.av_sutras} chartData={chartData} />
            )}
            {activeTab === "chandra_surya" && (
              enginesLoading
                ? <TabSkeleton />
                : <ChandraSuryaPanel data={chartData?.enginesData?.chandra_surya} />
            )}
            {activeTab === "advanced_yogas" && <AdvancedYogasPanel />}
            {activeTab === "kp_btr"         && <KPBTRPanel />}
            {activeTab === "vivah"           && <VivahPanel />}
            {activeTab === "prashna"         && <PrashnaKundli />}  {/* 🔥 PRASHNA KUNDLI TAB */}
            {activeTab === "chalit" && <Chalit />}
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