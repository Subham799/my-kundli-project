// pages/DashboardLayout.jsx
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
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
import AdvancedAstrologyPanel         from "../components/panels/AdvancedAstrologyPanel";
import Badge              from "../components/ui/Badge";

// ── Phase 1 (but conclusion is heavy — lazy ok) ───────────────────────────

// ── Phase 2 panels — only loaded when user clicks that tab ────────────────
// Browser downloads 0 bytes for these until the user actually opens them.
const YogaPanel         = lazy(() => import("../components/panels/YogaPanel"));
const AdvancedAVPanel   = lazy(() => import("../components/panels/AdvancedAVPanel"));
const GocharPanel       = lazy(() => import("../components/panels/GocharPanel"));
const AdvancedYogasPanel= lazy(() => import("../components/panels/Advancedyogaspanel"));
const KPBTRPanel        = lazy(() => import("../components/panels/KPBTRPanel"));
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
    { icon:"🔢", tab:"AV सूत्र",        desc:"27-वर्ष सौभाग्य चक्र · भाग्योदय वर्ष · ग्रह बल सूत्र" },
    { icon:"🌙", tab:"चंद्र-सूर्य",     desc:"चंद्र उपचय · पक्ष बल · शुभ मास · मानसिक संतुलन" },
    { icon:"⚡", tab:"उन्नत योग",       desc:"इन्दु लग्न · भावत भावम · पाप कर्तरी · मेगा रूल्स" },
    { icon:"🔗", tab:"KP शुद्धि",       desc:"KP BTR इंजन · CIL चेक · D24 मातृकारक · जन्म समय शुद्धि" },
    { icon:"💍", tab:"विवाह",           desc:"28 विवाह सूत्र · मांगलिक · प्रेम योग · वैधव्य · तलाक · दशा" },
  ];

  // ── Jyotish facts — shown as floating pills ─────────────────
  const FACTS = [
    "💡 अष्टकवर्ग में अधिकतम 337 बिंदु संभव हैं",
    "💡 विंशोत्तरी दशा = 120 वर्ष का जीवन चक्र",
    "💡 27 नक्षत्र × 4 पाद = 108 नवांश",
    "💡 Swiss Ephemeris सटीकता: 0.001 आर्कसेकंड",
    "💡 KP पद्धति में Sub-Lord विवाह का सबसे सटीक संकेत देता है",
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
        सर्वर लोड हो रहा है{dots}
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
  const ed   = pd.enginesData || {};
  const meta = pd.meta || {};

  const avComplete = ed.ashtakvarga_complete?.analysis || {};
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

  const RASHI  = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
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
  const tp       = pd.avTurningPoints || [];
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
  const avTotal = houses.reduce((sum,h)=>sum + Number(h.av||0), 0);
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
  const TOTAL_PAGES = 5;

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
  const rawBav = ed.bav || ed.ashtakvarga_complete?.bav || pd.bav || pd.ashtakavarga?.bav || {};
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
  };

  pages[3] = () => {
    // Extract dasha data from pd.dasha (same as used in UI)
    const dashaSeqData = dashaSeq || [];
    const currentDasha = dasha || {};
    
    if (!dashaSeqData || dashaSeqData.length === 0) {
      return `${head("वशोत्तरी दशा")}<div class="page">
        <div style="color:#475569;text-align:center;padding:20px">दशा डेटा उपलब्ध नहीं</div>
        ${foot(3, TOTAL_PAGES)}</div>${close}`;
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

      ${foot(3, TOTAL_PAGES)}
    </div>${close}`;
  };

  // PAGE 4 — चलित कुंडली (Bhav Chalit Chart — Sri Pati Paddhati)
  pages[4] = () => {
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

      ${foot(4, TOTAL_PAGES)}</div>${close}`;
  };


  // 🆕 PAGE 25 — षोडशवर्ग चक्र (16 D-Charts) + वक्री ग्रह सारांश
  pages[5] = () => {
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
      ${foot(5, TOTAL_PAGES)}
    </div>${close}`;
  };

  const bodyOnly = (html) => {
    let s = html.replace(/[\s\S]*?<body[^>]*>/i, "");
    s = s.replace(/<\/body>[\s\S]*$/i, "");
    return s;
  };

  const ALL_PAGE_NUMS  = Array.from({length:5}, (_,i)=>i+1);

  if(pageNum==="all"){
    const combined = ALL_PAGE_NUMS.map((n, i) => {
      const pageHtml = bodyOnly(pages[n]());
      return i === 0 ? pageHtml : `<div class="pb"></div>${pageHtml}`;
    }).join("\n");
    return `${head("सम्पूर्ण वैदिक कुंडली")}${combined}</body></html>`;
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
  {num:1, icon:"🪐", label:"ग्रह + भाव", desc:"9 ग्रह तालिका, 12 भाव, डिग्री, नक्षत्र"},
  {num:2, icon:"⏳", label:"दशा + योग", desc:"विंशोत्तरी दशा समयरेखा, सक्रिय योग"},
  {num:3, icon:"⏳", label:"दशा", desc:"महादशा, अंतरदशा, प्रत्यंतरदशा"},
  {num:4, icon:"🔄", label:"चलित कुंडली", desc:"श्री पति पद्धति — वास्तविक भाव स्थिति"},
  {num:5, icon:"📊", label:"षोडशवर्ग चक्र", desc:"17 D-Charts (D1–D60) का सम्पूर्ण मैट्रिक्स + वक्री ग्रह"},
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
              <div className="text-[13px] font-black text-amber-400" style={HI}>सम्पूर्ण कुंडली — सभी 5 पेज</div>
              <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>Complete report — ग्रह + भाव, दशा, चलित और षोडशवर्ग</div>
            </div>
            {sel===null && <span className="text-amber-400 text-lg">✓</span>}
          </button>

          {/* Individual pages */}
          <div className="text-[10px] text-slate-600 mb-2 px-1" style={HI}>📄 उपलब्ध PDF पेज (1–5):</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PDF_PAGES.map(p=>(
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
        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-4 pt-3 flex gap-2 flex-shrink-0 border-t border-slate-800/50">
          <button
            onClick={()=>{ exportKundliPDF(chartData, sel===null?"all":sel); onClose(); }}
            className="flex-1 py-3 rounded-xl font-black text-[13px] transition-all active:scale-[.98]"
            style={{background:"linear-gradient(135deg,rgba(245,158,11,.25),rgba(34,211,238,.15))",border:"1.5px solid rgba(245,158,11,.45)",color:"#F59E0B",...HI}}>
            {sel===null?"📥 सम्पूर्ण PDF (5 पेज)":"📄 पेज "+sel+" PDF बनाएं"}
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
// ─────────────────────────────────────────────────────────────
// JAIMINI RASHI DRISHTI — sign-based aspect view
// Uses the D1 house/sign structure already present in chartData.
// Chara Karaka is intentionally not calculated here because this
// view does not guarantee the exact planetary longitudes needed for
// a reliable 7-Karaka ranking.
// ─────────────────────────────────────────────────────────────
const JAIMINI_SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

const JAIMINI_RASHI_ASPECTS = {
  0:[4,7,10],   // Aries -> Leo, Scorpio, Aquarius
  1:[3,6,9],    // Taurus -> Cancer, Libra, Capricorn
  2:[5,8,11],   // Gemini -> Virgo, Sagittarius, Pisces
  3:[7,10,1],   // Cancer -> Scorpio, Aquarius, Taurus
  4:[6,9,0],    // Leo -> Libra, Capricorn, Aries
  5:[2,8,11],   // Virgo -> Gemini, Sagittarius, Pisces
  6:[10,1,4],   // Libra -> Aquarius, Taurus, Leo
  7:[9,0,3],    // Scorpio -> Capricorn, Aries, Cancer
  8:[2,5,11],   // Sagittarius -> Gemini, Virgo, Pisces
  9:[1,4,7],    // Capricorn -> Taurus, Leo, Scorpio
  10:[0,3,6],   // Aquarius -> Aries, Cancer, Libra
  11:[2,5,8],   // Pisces -> Gemini, Virgo, Sagittarius
};

function getJaiminiPlanetPlacements(houses = []) {
  const result = [];
  for (const h of houses || []) {
    const signIndex = Number(h?.sign_index);
    if (!Number.isInteger(signIndex) || signIndex < 0 || signIndex > 11) continue;
    for (const planet of (h?.planets || [])) {
      if (planet === "La") continue;
      result.push({ planet, house: Number(h.num), signIndex, sign: JAIMINI_SIGN_NAMES[signIndex] });
    }
  }
  return result;
}

function getJaiminiBhavaPlacements(houses = []) {
  return (houses || []).map(h => {
    const signIndex = Number(h?.sign_index);
    return {
      house: Number(h?.num),
      signIndex,
      // Always derive the display name from sign_index so legacy Hindi/transliterated
      // backend strings such as Mesha/Vrishabha never leak into the UI.
      sign: JAIMINI_SIGN_NAMES[signIndex],
    };
  }).filter(x => Number.isInteger(x.signIndex) && x.signIndex >= 0 && x.signIndex <= 11);
}

function JaiminiDrishtiPanel({ houses = [] }) {
  const [view, setView] = useState("graha");
  const planets = getJaiminiPlanetPlacements(houses);
  const bhavas = getJaiminiBhavaPlacements(houses);

  const targetHousesForSign = (signIndex) =>
    (JAIMINI_RASHI_ASPECTS[signIndex] || []).map(targetSign =>
      bhavas.filter(b => b.signIndex === targetSign).map(b => b.house)
    ).flat();

  const signType = (signIndex) => {
    if ([0,3,6,9].includes(signIndex)) return "Movable";
    if ([1,4,7,10].includes(signIndex)) return "Fixed";
    return "Dual";
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-cyan-500/15 bg-slate-900/40">
        <button type="button" onClick={() => setView("graha")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${view === "graha" ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" : "text-slate-400 border-transparent"}`}>
          Jaimini Graha Drishti
        </button>
        <button type="button" onClick={() => setView("bhava")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${view === "bhava" ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" : "text-slate-400 border-transparent"}`}>
          Jaimini Bhava Drishti
        </button>
      </div>

      <div className="rounded-2xl border border-cyan-500/15 bg-slate-950/30 p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-sm font-bold text-slate-200">Jaimini Rashi Drishti</div>
              <div className="text-[9px] text-slate-500">Sign-based aspect: the planet/house carries the aspect of its occupied sign.</div>
            </div>
            <span className="text-[9px] text-cyan-300/80 border border-cyan-500/20 rounded-lg px-2 py-1">3 targets / sign</span>
          </div>

          {view === "graha" ? (
            <div className="space-y-2">
              {planets.length === 0 ? (
                <div className="text-xs text-slate-500">Planet-sign data is not available.</div>
              ) : planets.map(({ planet, house, signIndex, sign }) => {
                const targetSigns = JAIMINI_RASHI_ASPECTS[signIndex] || [];
                const targetHouses = targetHousesForSign(signIndex);
                return (
                  <div key={`${planet}-${house}`} className="rounded-xl border border-slate-800/70 bg-slate-900/45 p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-amber-300 text-sm">{planet}</span>
                      <span className="text-[10px] text-slate-400">{sign} · House {house}</span>
                      <span className="text-[9px] text-slate-600">{signType(signIndex)}</span>
                      <span className="ml-auto text-[9px] text-slate-500">Jaimini Rashi Drishti</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {targetSigns.map((si, i) => (
                        <span key={si} className="text-[9px] px-2 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-200">
                          {JAIMINI_SIGN_NAMES[si]}{targetHouses[i] ? ` · H${targetHouses[i]}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {bhavas.map(({ house, signIndex, sign }) => {
                const targetSigns = JAIMINI_RASHI_ASPECTS[signIndex] || [];
                const targetHouses = targetHousesForSign(signIndex);
                return (
                  <div key={`bhava-${house}`} className="rounded-xl border border-slate-800/70 bg-slate-900/45 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-300 text-sm">House {house}</span>
                      <span className="text-[10px] text-slate-400">{sign}</span>
                      <span className="text-[9px] text-slate-600">{signType(signIndex)}</span>
                      <span className="ml-auto text-[9px] text-slate-500">Bhava → Bhava</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {targetSigns.map((si, i) => (
                        <span key={si} className="text-[9px] px-2 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-200">
                          House {targetHouses[i] || "—"} · {JAIMINI_SIGN_NAMES[si]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}

// SHODASHVARGA GRID — one chart surface, toggled by the "Charts" tab
// D1 is included here so the universal chart is not rendered a second time.
// ─────────────────────────────────────────────────────────────
const VARGA_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];

function ChartAnnotationOverlay({ chartKey }) {
  const storageKey = `kundli-chart-annotations-${chartKey}`;
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState("pen"); // pen | line | arrow | circle | rect
  const [strokes, setStrokes] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(raw) ? raw.slice(-20) : [];
    } catch { return []; }
  });
  const activeStroke = useRef(null);
  const [previewPoints, setPreviewPoints] = useState([]);

  // Keep annotations lightweight and isolated per chart.
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(strokes.slice(-20))); } catch {}
  }, [storageKey, strokes]);

  const pointFromEvent = (e, svg) => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };

  const normalizeShape = (points, selectedTool) => {
    if (!points?.length) return null;
    if (selectedTool === "line") {
      return { type: "line", start: points[0], end: points[points.length - 1] };
    }
    if (selectedTool === "arrow") {
      return { type: "arrow", start: points[0], end: points[points.length - 1] };
    }
    if (selectedTool === "rect") {
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { type: "rect", x, y, w: Math.max(0.5, Math.max(...xs) - x), h: Math.max(0.5, Math.max(...ys) - y) };
    }
    if (selectedTool === "circle") {
      const first = points[0], last = points[points.length - 1];
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const w = maxX - minX, h = maxY - minY;
      if (w < 2 || h < 2) return { type: "path", points };
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const r = (w + h) / 4;
      // If the user draws a reasonably closed circle, clean it automatically.
      const closure = Math.hypot(last.x - first.x, last.y - first.y);
      const deviations = points.map(p => Math.abs(Math.hypot(p.x - cx, p.y - cy) - r));
      const avgDeviation = deviations.reduce((a, v) => a + v, 0) / deviations.length;
      if (closure <= 18 && Math.abs(w - h) / Math.max(w, h) < 0.30 && avgDeviation < r * 0.25) {
        return { type: "circle", cx, cy, r };
      }
      return { type: "circle", cx, cy, r };
    }
    return { type: "path", points: points.slice(-160) };
  };

  const start = (e) => {
    if (!drawing) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const first = pointFromEvent(e, e.currentTarget);
     activeStroke.current = [first];
     setPreviewPoints([first]);
  };

  const move = (e) => {
    if (!drawing || !activeStroke.current) return;
    e.preventDefault();
    const pts = activeStroke.current;
    // Shape tools only need start/end; keeping one extra point avoids a large React update loop.
    if (tool !== "pen") {
      const next = pointFromEvent(e, e.currentTarget);
      activeStroke.current = [pts[0], next];
      // Live preview for straight line / arrow / circle / rectangle.
      setPreviewPoints([pts[0], next]);
      return;
    }
    if (pts.length >= 160) return;
    const next = [...pts, pointFromEvent(e, e.currentTarget)];
    activeStroke.current = next;
    // Keep the in-progress freehand stroke visible while drawing.
    setPreviewPoints(next);
  };

  const end = (e) => {
    try { e?.currentTarget?.releasePointerCapture?.(e.pointerId); } catch {}
    const pts = activeStroke.current;
    activeStroke.current = null;
    setPreviewPoints([]);
    if (!drawing || !pts?.length) return;
    const shape = normalizeShape(pts, tool);
    if (!shape) return;
    setStrokes(prev => [...prev.slice(-19), shape]);
  };

  const clear = () => {
    activeStroke.current = null;
    setPreviewPoints([]);
    setStrokes([]);
  };

  const undo = () => setStrokes(prev => prev.slice(0, -1));

  const renderShape = (shape, i) => {
    if (!shape) return null;
    const common = { key: i, fill: "none", stroke: "currentColor", strokeWidth: "0.65", className: "text-amber-300" };
    if (shape.type === "circle") return <circle {...common} cx={shape.cx} cy={shape.cy} r={shape.r} />;
    if (shape.type === "rect") return <rect {...common} x={shape.x} y={shape.y} width={shape.w} height={shape.h} />;
    if (shape.type === "line") return <line {...common} x1={shape.start.x} y1={shape.start.y} x2={shape.end.x} y2={shape.end.y} strokeLinecap="round" />;
     if (shape.type === "arrow") return <line {...common} x1={shape.start.x} y1={shape.start.y} x2={shape.end.x} y2={shape.end.y} strokeLinecap="round" markerEnd="url(#kundli-arrowhead)" />;
    return <polyline {...common} points={(shape.points || []).map(p => `${p.x},${p.y}`).join(" ")} strokeLinecap="round" strokeLinejoin="round" />;
  };

  return (
    <>
      <div className="absolute left-2 top-9 z-50 flex flex-wrap items-center gap-1 max-w-[90%]">
        <button type="button" onClick={() => setDrawing(v => !v)}
          className={`px-2 py-1 rounded-md text-[9px] font-bold border backdrop-blur ${drawing ? "bg-amber-500/20 text-amber-200 border-amber-400/50" : "bg-slate-950/90 text-slate-300 border-slate-700"}`}>
          {drawing ? "Pen On" : "Draw"}
        </button>
        {[
          ["pen", "Free"], ["line", "Line"], ["arrow", "Arrow"], ["circle", "Circle"], ["rect", "Rect"]
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setTool(id); setDrawing(true); }}
            className={`px-2 py-1 rounded-md text-[9px] font-bold border ${tool === id && drawing ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/40" : "bg-slate-950/90 text-slate-400 border-slate-700"}`}>
            {label}
          </button>
        ))}
        {strokes.length > 0 && <button type="button" onClick={undo}
          className="px-2 py-1 rounded-md text-[9px] font-bold border bg-slate-950/90 text-slate-400 border-slate-700">Undo</button>}
        {strokes.length > 0 && <button type="button" onClick={clear}
          className="px-2 py-1 rounded-md text-[9px] font-bold border bg-slate-950/90 text-slate-400 border-slate-700">Clear</button>}
      </div>

      {(drawing || strokes.length > 0) && (
        <svg className={`absolute inset-0 w-full h-full ${drawing ? "z-40 cursor-crosshair" : "z-20 pointer-events-none"}`}
          viewBox="0 0 100 100" preserveAspectRatio="none" style={drawing ? { touchAction: "none" } : undefined}
           onDoubleClick={(e) => e.preventDefault()}
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <defs>
            <marker id="kundli-arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 z" fill="currentColor" className="text-amber-300" />
            </marker>
          </defs>
          {strokes.map(renderShape)}
          {drawing && previewPoints.length > 0 && renderShape(normalizeShape(previewPoints, tool), "active")}
        </svg>
      )}
    </>
  );
}

function VargaGrid({ chartData }) {
  const { selectedPlanet, hoverHouse } = useKundliStore();
  const SETTINGS_KEY = "kundli-varga-view-settings";
  const readSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      return saved || { viewCount: "4", selectedCharts: ["D1"], rotation: Object.fromEntries(VARGA_KEYS.map(k => [k, 1])) };
    } catch {
      return { viewCount: "4", selectedCharts: ["D1"], rotation: Object.fromEntries(VARGA_KEYS.map(k => [k, 1])) };
    }
  };
  // Persist chart selection/row count/rotation so switching tabs does not reset the user's workspace.
  const [viewCount, setViewCount] = useState(() => readSettings().viewCount);
  const [selectedCharts, setSelectedCharts] = useState(() => readSettings().selectedCharts);
  const [rotation, setRotation] = useState(() => readSettings().rotation);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ viewCount, selectedCharts, rotation })); } catch {}
  }, [viewCount, selectedCharts, rotation]);

  const toggleChart = (key) => {
    setSelectedCharts(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const visibleCharts = selectedCharts.filter(k => VARGA_KEYS.includes(k));
  const columns = viewCount === "all"
    ? Math.min(4, Math.max(1, visibleCharts.length))
    : Math.min(Number(viewCount), Math.max(1, visibleCharts.length));

  const setChartRotation = (key, value) => {
    setRotation(prev => ({ ...prev, [key]: value }));
  };

  const resetChartWorkspace = () => {
    const defaults = { viewCount: "4", selectedCharts: ["D1"], rotation: Object.fromEntries(VARGA_KEYS.map(k => [k, 1])) };
    setViewCount(defaults.viewCount);
    setSelectedCharts(defaults.selectedCharts);
    setRotation(defaults.rotation);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults)); } catch {}
  };

  return (
    <div className="w-full pb-6">
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/35 p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div>
            <div className="text-sm font-bold text-slate-200">Charts</div>
            <div className="text-[10px] text-slate-500">Choose charts to add, then set how many fit in one row</div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-[9px] text-slate-500 mr-1">Charts per row</span>
            {[2,4,6,8].map(n => (
              <button key={n} type="button" onClick={() => setViewCount(String(n))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${viewCount === String(n) ? "bg-amber-500/15 text-amber-300 border-amber-500/40" : "text-slate-400 border-slate-700/60 hover:text-slate-200"}`}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setViewCount("all")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${viewCount === "all" ? "bg-amber-500/15 text-amber-300 border-amber-500/40" : "text-slate-400 border-slate-700/60 hover:text-slate-200"}`}>
              All
            </button>
            <button type="button" onClick={resetChartWorkspace}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border text-slate-400 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40">
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VARGA_KEYS.map(key => {
            const active = selectedCharts.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleChart(key)}
                title={active ? `Remove ${key}` : `Add ${key}`}
                aria-pressed={active}
                className={`px-2 py-1 rounded-md text-[9px] font-bold border transition ${active ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30" : "text-slate-300 border-slate-700 hover:text-amber-300 hover:border-amber-500/40"}`}>
                {key}{active ? " ✓" : " +"}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[9px] text-slate-600">
          {visibleCharts.length} charts selected · {columns} chart{columns === 1 ? "" : "s"} per row · D1 is included in this same grid
        </div>
      </div>

      <div
        className={`grid gap-3 ${visibleCharts.length === 1 ? "place-items-center" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {visibleCharts.map((key) => (
          <div key={key} className={`relative min-w-0 w-full rounded-2xl border border-slate-700/40 bg-slate-900/35 p-2.5 ${visibleCharts.length === 1 ? "max-w-[560px]" : ""}`}>
            <ChartAnnotationOverlay chartKey={key} />
            <div className="relative z-30 flex items-center justify-between gap-2 px-1 pb-2 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black tracking-wide text-amber-300">{key}</span>
                {key === "D1" && <span className="text-[8px] text-slate-600">Birth Chart</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-600">Rotate</span>
                <select value={rotation[key] || 1} onChange={e => setChartRotation(key, Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-md text-[9px] text-slate-300 px-1 py-0.5">
                  {Array.from({length:12}, (_,i) => i+1).map(n => <option key={n} value={n}>H{n}</option>)}
                </select>
              </div>
            </div>
            <InteractiveKundli
              houses={key === "D1" ? chartData.houses : []}
              planets={chartData.planets || {}}
              lagnaVargas={chartData.meta?.lagnaVargas || {}}
              vargaKey={key}
              rotation={rotation[key] || 1}
              selectedPlanet={selectedPlanet}
              onHouseHover={hoverHouse}
              showHeader={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const REMOVED_DASHBOARD_TABS = new Set(["kamukta", "conclusion", "vivah", "chandra_surya", "houses"]);
const DASHBOARD_TABS = [
  { id: "charts", label: "Charts", phase: 1 },
  ...TABS.filter((t) => !REMOVED_DASHBOARD_TABS.has(t.id)),
];

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
// COPYABLE KUNDLI REPORT — Degree + D1–D60 + selectable MD/AD/PD
// Separate from the existing cleaned PDF system.
// ─────────────────────────────────────────────────────────────
const REPORT_VARGA_KEYS = [
  "D1","D2","D3","D4","D6","D7","D9","D10","D12",
  "D16","D20","D24","D27","D30","D40","D45","D60"
];

const REPORT_PLANET_KEYS = ["La","Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];

const REPORT_PLANET_NAMES = {
  La:"लग्न", Su:"सूर्य", Mo:"चंद्र", Ma:"मंगल", Me:"बुध",
  Ju:"गुरु", Ve:"शुक्र", Sa:"शनि", Ra:"राहु", Ke:"केतु"
};

const REPORT_RASHI_EN = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// ─────────────────────────────────────────────────────────────
// SHAREABLE KUNDLI LINK — stores only compact birth/UI state
// The receiving browser recalculates the live chart through the same
// existing /api/chart/fast + /api/chart/engines flow.
// ─────────────────────────────────────────────────────────────
const KUNDLI_SHARE_VERSION = 1;
const VARGA_SETTINGS_STORAGE_KEY = "kundli-varga-view-settings";
const REPORT_DASHA_STORAGE_KEY = "kundli-report-dasha-selection";
const SHARED_UI_STORAGE_KEY = "kundli-shared-ui-state";

function encodeKundliSharePayload(payload) {
  const json = JSON.stringify({ v: KUNDLI_SHARE_VERSION, ...payload });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function buildKundliShareUrl(chartData, formData = {}, uiOverrides = {}) {
  if (typeof window === "undefined") return "";

  let vargaState = null;
  let reportDashaState = null;
  try {
    vargaState = JSON.parse(localStorage.getItem(VARGA_SETTINGS_STORAGE_KEY) || "null");
  } catch {}
  try {
    reportDashaState = JSON.parse(localStorage.getItem(REPORT_DASHA_STORAGE_KEY) || "null");
  } catch {}

  const birth = {
    name: formData?.name || chartData?.meta?.name || "",
    dob: formData?.dob || "",
    time: formData?.time || "",
    city: formData?.city || chartData?.meta?.city || "",
    chartType: formData?.chartType || chartData?.meta?.chartType || "D1",
    lat: formData?.lat ?? null,
    lon: formData?.lon ?? null,
    age: formData?.age ?? 0,
    dashaYearType: formData?.dashaYearType ?? chartData?.meta?.dashaYearType ?? 360.0,
  };

  const ui = {
    activeTab: uiOverrides?.activeTab || "planets",
    selectedPlanet: uiOverrides?.selectedPlanet || null,
    varga: {
      viewCount: vargaState?.viewCount || "4",
      selectedCharts: Array.isArray(vargaState?.selectedCharts) ? vargaState.selectedCharts : ["D1"],
      rotation: vargaState?.rotation || {},
    },
    report: {
      selectedMD: uiOverrides?.reportMD || reportDashaState?.selectedMD || "",
      selectedAD: uiOverrides?.reportAD || reportDashaState?.selectedAD || "",
      openReport: !!uiOverrides?.openReport,
    },
  };

  const token = encodeKundliSharePayload({ birth, ui });
  return `${window.location.origin}/kundli/share/${token}`;
}

async function shareOrCopyKundliLink(url, chartData) {
  if (!url) return { ok: false, message: "Share link नहीं बन पाया" };

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${chartData?.meta?.name || "Kundli"} — KundliMaker`,
        url,
      });
      return { ok: true, message: "Link shared" };
    }
  } catch (e) {
    if (e?.name === "AbortError") return { ok: true, message: "Share cancelled" };
  }

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, message: "Link copied" };
  } catch {}

  try {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const copied = document.execCommand("copy");
    ta.remove();
    return { ok: copied, message: copied ? "Link copied" : "Copy failed" };
  } catch {
    return { ok: false, message: "Copy failed" };
  }
}

function reportDashaLord(item) {
  return item?.planet || item?.lord || item?.name || "—";
}

function reportDashaStart(item) {
  return item?.start || item?.startDate || item?.from || "—";
}

function reportDashaEnd(item) {
  return item?.end || item?.endDate || item?.to || "—";
}

function reportDashaADs(item) {
  return item?.antardashas || item?.subperiods || [];
}

function reportDashaPDs(item) {
  return item?.pratyantardashas || item?.pratyantar || item?.subperiods || [];
}

function reportVargaSign(source, key) {
  const cell = source?.[key];
  const idx =
    typeof cell === "number"
      ? cell
      : (cell && typeof cell.Idx === "number" ? cell.Idx : null);

  return typeof idx === "number" ? (REPORT_RASHI_EN[idx] || "—") : "—";
}

function reportRows(chartData) {
  const meta = chartData?.meta || {};

  return REPORT_PLANET_KEYS.map(code => {
    const isLagna = code === "La";
    const p = chartData?.planets?.[code] || {};
    const vargaSource = isLagna ? meta?.lagnaVargas : p?.vargas;

    const degree = isLagna
      ? (meta?.lagnaRashiDegree ?? meta?.lagnaFullDegree ?? "—")
      : (p?.degree ?? "—");

    const status = isLagna
      ? "—"
      : [
          p?.dignityHindi || p?.dignity || "",
          p?.Retrograde || p?.retrograde ? "वक्री" : "",
          p?.Combust || p?.combust ? "अस्त" : ""
        ].filter(Boolean).join(" · ") || "—";

    return {
      code,
      name: REPORT_PLANET_NAMES[code] || code,
      sign: isLagna ? (meta?.lagnaSign || meta?.lagna || "—") : (p?.sign || p?.hindi_sign || "—"),
      house: isLagna ? 1 : (p?.house || "—"),
      degree: typeof degree === "number" ? `${Number(degree).toFixed(2)}°` : degree,
      nakshatra: isLagna ? (meta?.lagnaNakshatra || "—") : (p?.nakshatra || "—"),
      nakLord: isLagna ? "—" : (p?.nakshatraLord || "—"),
      rashiLord: isLagna ? "—" : (p?.rashiLord || p?.lord || "—"),
      status,
      nature: isLagna ? "—" : (p?.functionalNature || "Neutral"),
      strength: isLagna ? "—" : (p?.strength != null ? `${p.strength}%` : "—"),
      vargas: REPORT_VARGA_KEYS.map(k => reportVargaSign(vargaSource, k))
    };
  });
}

function selectedDashaBundle(chartData, selectedMD, selectedAD) {
  const dasha = chartData?.dasha || {};
  const current = dasha?.current || {};
  const sequence = Array.isArray(dasha?.sequence) ? dasha.sequence : [];

  const currentMD = current?.mahadasha || reportDashaLord(sequence[0]);
  const mdName = selectedMD || currentMD;
  const mdObj = sequence.find(x => reportDashaLord(x) === mdName) || sequence[0] || null;

  const ads = reportDashaADs(mdObj);
  const currentAD = current?.antardasha || reportDashaLord(ads[0]);
  const adName = selectedAD || currentAD;
  const adObj = ads.find(x => reportDashaLord(x) === adName) || ads[0] || null;

  const pds = reportDashaPDs(adObj);
  const currentPD = current?.pratyantara || "";
  const pdObj = pds.find(x => reportDashaLord(x) === currentPD) || pds[0] || null;

  return {
    sequence,
    current,
    currentMD,
    currentAD,
    currentPD,
    mdName,
    adName: adObj ? reportDashaLord(adObj) : "",
    mdObj,
    adObj,
    pdObj,
    ads,
    pds
  };
}

function buildKundliCopyText(chartData, selectedMD, selectedAD) {
  const meta = chartData?.meta || {};
  const rows = reportRows(chartData);
  const b = selectedDashaBundle(chartData, selectedMD, selectedAD);
  const out = [];

  out.push("🪐 सम्पूर्ण वैदिक कुंडली");
  out.push("Vedic Jyotish Report — Swiss Ephemeris + Nadi AI");
  out.push("");
  out.push(`नाम\t${meta?.name || "—"}`);
  out.push(`लग्न\t${meta?.lagnaSign || meta?.lagna || "—"} ${meta?.lagnaRashiDegree != null ? `${meta.lagnaRashiDegree}°` : ""}`.trim());
  out.push(`जन्म तिथि\t${meta?.dob || "—"}`);
  out.push(`समय / स्थान\t${meta?.time || "—"} | ${meta?.city || "—"}`);
  out.push(`लग्न नक्षत्र\t${meta?.lagnaNakshatra || "—"}${meta?.lagnaNakshatraPada ? ` (चरण ${meta.lagnaNakshatraPada})` : ""}`);
  out.push(`वर्तमान दशा\t${b.current?.mahadasha || "—"} → ${b.current?.antardasha || "—"} → ${b.current?.pratyantara || "—"}`);
  out.push("");

  out.push("ग्रह स्थिति + षोडशवर्ग");
  out.push([
    "ग्रह","राशि","भाव","डिग्री","नक्षत्र","नक्ष.स्वामी","राशि स्वामी",
    "अवस्था","स्वभाव","बल%",...REPORT_VARGA_KEYS
  ].join("\t"));

  rows.forEach(r => {
    out.push([
      r.name,r.sign,r.house,r.degree,r.nakshatra,r.nakLord,r.rashiLord,
      r.status,r.nature,r.strength,...r.vargas
    ].join("\t"));
  });

  out.push("");
  out.push("महादशा — पूर्ण 120 वर्ष समयरेखा");
  out.push("महादशा\tआरंभ\tसमाप्ति");
  b.sequence.forEach(md => {
    out.push([reportDashaLord(md),reportDashaStart(md),reportDashaEnd(md)].join("\t"));
  });

  out.push("");
  out.push(`चयनित महादशा\t${reportDashaLord(b.mdObj)}\t${reportDashaStart(b.mdObj)} → ${reportDashaEnd(b.mdObj)}`);
  out.push("अंतर्दशा — चयनित महादशा");
  out.push("अंतर्दशा\tआरंभ\tसमाप्ति");
  b.ads.forEach(ad => {
    out.push([reportDashaLord(ad),reportDashaStart(ad),reportDashaEnd(ad)].join("\t"));
  });

  out.push("");
  out.push(`चयनित अंतर्दशा\t${reportDashaLord(b.adObj)}\t${reportDashaStart(b.adObj)} → ${reportDashaEnd(b.adObj)}`);
  out.push("प्रत्यंतर — चयनित अंतर्दशा");
  out.push("प्रत्यंतर\tआरंभ\tसमाप्ति");
  b.pds.forEach(pd => {
    out.push([reportDashaLord(pd),reportDashaStart(pd),reportDashaEnd(pd)].join("\t"));
  });

  out.push("");
  out.push("www.kundalimaker.com");
  return out.join("\n");
}

function reportCanvasText(ctx, value, x, y, width, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  const str = String(value ?? "—");

  if (ctx.measureText(str).width <= width) {
    ctx.fillText(str, x, y);
    return;
  }

  let s = str;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > width) {
    s = s.slice(0, -1);
  }
  ctx.fillText(`${s}…`, x, y);
}

function buildKundliJpgCanvas(chartData, selectedMD, selectedAD) {
  const meta = chartData?.meta || {};
  const rows = reportRows(chartData);
  const b = selectedDashaBundle(chartData, selectedMD, selectedAD);

  const W = 4300;
  const H = 2350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const BG = "#07111F";
  const PANEL = "#0E1928";
  const GRID = "#253348";
  const GOLD = "#F59E0B";
  const CYAN = "#22D3EE";
  const PURPLE = "#C084FC";
  const WHITE = "#E2E8F0";
  const MUTED = "#94A3B8";

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  ctx.font = "900 34px 'Noto Sans Devanagari', Arial, sans-serif";
  ctx.fillStyle = GOLD;
  ctx.fillText("🪐 सम्पूर्ण वैदिक कुंडली", 55, 58);

  ctx.font = "500 16px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("Vedic Jyotish Report — Swiss Ephemeris + Nadi AI", 55, 88);

  ctx.fillStyle = PANEL;
  ctx.fillRect(45, 110, W - 90, 125);
  ctx.strokeStyle = GRID;
  ctx.strokeRect(45, 110, W - 90, 125);

  const metaRows = [
    ["नाम", meta?.name || "—", "लग्न", `${meta?.lagnaSign || meta?.lagna || "—"} ${meta?.lagnaRashiDegree ?? "—"}°`],
    ["जन्म तिथि", meta?.dob || "—", "समय / स्थान", `${meta?.time || "—"} | ${meta?.city || "—"}`],
    ["लग्न नक्षत्र", `${meta?.lagnaNakshatra || "—"}${meta?.lagnaNakshatraPada ? ` (${meta.lagnaNakshatraPada})` : ""}`, "वर्तमान दशा", `${b.current?.mahadasha || "—"} → ${b.current?.antardasha || "—"} → ${b.current?.pratyantara || "—"}`]
  ];

  metaRows.forEach((r, i) => {
    const yy = 145 + i * 36;
    reportCanvasText(ctx, r[0], 65, yy, 120, "700 13px 'Noto Sans Devanagari', Arial", GOLD);
    reportCanvasText(ctx, r[1], 185, yy, 790, "700 14px 'Noto Sans Devanagari', Arial", WHITE);
    reportCanvasText(ctx, r[2], 1000, yy, 180, "700 13px 'Noto Sans Devanagari', Arial", CYAN);
    reportCanvasText(ctx, r[3], 1190, yy, W - 1250, "700 14px 'Noto Sans Devanagari', Arial", WHITE);
  });

  let y = 272;
  ctx.font = "900 21px 'Noto Sans Devanagari', Arial";
  ctx.fillStyle = GOLD;
  ctx.fillText("ग्रह स्थिति + षोडशवर्ग (D1 सहित)", 55, y);
  y += 24;

  const headers = [
    "ग्रह","राशि","भाव","डिग्री","नक्षत्र","नक्ष.स्वामी","राशि स्वामी",
    "अवस्था","स्वभाव","बल%",...REPORT_VARGA_KEYS
  ];
  const widths = [95,145,55,95,185,120,120,165,245,65,...REPORT_VARGA_KEYS.map(() => 90)];
  const xs = [];
  let xx = 45;
  widths.forEach(w => {
    xs.push(xx);
    xx += w;
  });

  headers.forEach((h, i) => {
    ctx.fillStyle = PANEL;
    ctx.fillRect(xs[i], y, widths[i], 38);
    ctx.strokeStyle = GRID;
    ctx.strokeRect(xs[i], y, widths[i], 38);
    reportCanvasText(
      ctx, h, xs[i] + 4, y + 24, widths[i] - 8,
      "800 10px 'Noto Sans Devanagari', Arial",
      i >= 10 ? CYAN : GOLD
    );
  });

  y += 38;

  rows.forEach((r, ri) => {
    const values = [
      r.name,r.sign,r.house,r.degree,r.nakshatra,r.nakLord,r.rashiLord,
      r.status,r.nature,r.strength,...r.vargas
    ];

    values.forEach((v, i) => {
      ctx.fillStyle = ri % 2 === 0 ? "#0A1725" : "#0D1B2B";
      ctx.fillRect(xs[i], y, widths[i], 40);
      ctx.strokeStyle = GRID;
      ctx.strokeRect(xs[i], y, widths[i], 40);

      reportCanvasText(
        ctx, v, xs[i] + 4, y + 25, widths[i] - 8,
        i === 0 ? "800 11px 'Noto Sans Devanagari', Arial" : "600 10px 'Noto Sans Devanagari', Arial",
        i === 0 ? GOLD : WHITE
      );
    });

    y += 40;
  });

  y += 24;

  const drawDashaTable = (title, data, accent) => {
    ctx.font = "900 17px 'Noto Sans Devanagari', Arial";
    ctx.fillStyle = accent;
    ctx.fillText(title, 55, y);
    y += 23;

    const tw = [230,170,170];
    const hh = ["नाम","आरंभ","समाप्ति"];
    let tx = 55;

    hh.forEach((h, i) => {
      ctx.fillStyle = PANEL;
      ctx.fillRect(tx, y, tw[i], 31);
      ctx.strokeStyle = GRID;
      ctx.strokeRect(tx, y, tw[i], 31);
      reportCanvasText(ctx, h, tx + 5, y + 20, tw[i] - 10, "800 10px 'Noto Sans Devanagari', Arial", accent);
      tx += tw[i];
    });
    y += 31;

    data.forEach((item, ri) => {
      const vals = [reportDashaLord(item),reportDashaStart(item),reportDashaEnd(item)];
      tx = 55;
      vals.forEach((v, i) => {
        ctx.fillStyle = ri % 2 === 0 ? "#0A1725" : "#0D1B2B";
        ctx.fillRect(tx, y, tw[i], 29);
        ctx.strokeStyle = GRID;
        ctx.strokeRect(tx, y, tw[i], 29);
        reportCanvasText(ctx, v, tx + 5, y + 19, tw[i] - 10, "600 10px 'Noto Sans Devanagari', Arial", WHITE);
        tx += tw[i];
      });
      y += 29;
    });

    y += 14;
  };

  drawDashaTable("महादशा — पूर्ण 120 वर्ष", b.sequence, GOLD);
  drawDashaTable(`अंतर्दशा — ${reportDashaLord(b.mdObj)}`, b.ads, CYAN);
  drawDashaTable(`प्रत्यंतर — ${reportDashaLord(b.adObj)}`, b.pds, PURPLE);

  ctx.font = "600 12px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("www.kundalimaker.com", 55, H - 24);

  return canvas;
}

function DashaSelectorCard({ label, value, options, onChange, currentValue, accent = "amber" }) {
  const cls = accent === "cyan"
    ? "border-cyan-500/30 bg-cyan-500/5"
    : "border-amber-500/30 bg-amber-500/5";

  return (
    <div className={`rounded-xl border p-2.5 ${cls}`}>
      <div className="text-[9px] text-slate-500 mb-1">{label}</div>
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-[10px] text-slate-200 outline-none"
      >
        {options.length === 0 ? (
          <option value="">डेटा उपलब्ध नहीं</option>
        ) : (
          options.map((item, i) => {
            const name = reportDashaLord(item);
            const isCurrent = name === currentValue;
            return (
              <option key={`${name}-${i}`} value={name}>
                {isCurrent ? "▶ " : ""}{name}
              </option>
            );
          })
        )}
      </select>
    </div>
  );
}

function CopyableKundliReportModal({ chartData, onClose, onShareLink }) {
  const initial = selectedDashaBundle(chartData);
  let savedDasha = null;
  try { savedDasha = JSON.parse(localStorage.getItem(REPORT_DASHA_STORAGE_KEY) || "null"); } catch {}

  const savedMD = savedDasha?.selectedMD && initial.sequence?.some(x => reportDashaLord(x) === savedDasha.selectedMD)
    ? savedDasha.selectedMD
    : initial.mdName;
  const savedBundle = selectedDashaBundle(chartData, savedMD, savedDasha?.selectedAD || "");
  const [selectedMD, setSelectedMD] = useState(savedMD);
  const [selectedAD, setSelectedAD] = useState(savedBundle.adName);
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(REPORT_DASHA_STORAGE_KEY, JSON.stringify({ selectedMD, selectedAD }));
    } catch {}
  }, [selectedMD, selectedAD]);

  const bundle = selectedDashaBundle(chartData, selectedMD, selectedAD);
  const rows = reportRows(chartData);
  const reportText = buildKundliCopyText(chartData, selectedMD, selectedAD);
  const meta = chartData?.meta || {};

  const changeMD = (value) => {
    const next = selectedDashaBundle(chartData, value, "");
    setSelectedMD(value);
    setSelectedAD(next.adName || "");
  };

  const copyFullReport = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(reportText);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = reportText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {}
    }

    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const getSafeName = () => (
    String(meta?.name || "Kundli")
      .replace(/[^\w\u0900-\u097F-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Kundli"
  );

  const downloadJpg = async () => {
    const blob = await new Promise(resolve =>
      buildKundliJpgCanvas(chartData, selectedMD, selectedAD).toBlob(resolve, "image/jpeg", 0.94)
    );
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getSafeName()}_Kundli_Report.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const shareJpg = async () => {
    const blob = await new Promise(resolve =>
      buildKundliJpgCanvas(chartData, selectedMD, selectedAD).toBlob(resolve, "image/jpeg", 0.94)
    );
    if (!blob) return;

    const file = new File([blob], `${getSafeName()}_Kundli_Report.jpg`, { type:"image/jpeg" });

    if (navigator.share && navigator.canShare?.({ files:[file] })) {
      try {
        await navigator.share({
          title: "Kundli Report",
          text: "www.kundalimaker.com",
          files: [file]
        });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }

    await downloadJpg();
  };

  const downloadTxt = () => {
    const blob = new Blob([reportText], { type:"text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getSafeName()}_Kundli_Report.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const shareLinkFromReport = async () => {
    if (!onShareLink) return;
    const result = await onShareLink({ reportMD: selectedMD, reportAD: selectedAD, openReport: true });
    setShareMsg(result?.message || "");
    window.setTimeout(() => setShareMsg(""), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-2 sm:p-5"
      style={{ background:"rgba(0,0,0,.80)" }}
    >
      <div className="w-full max-w-[1500px] max-h-[96vh] flex flex-col overflow-hidden rounded-2xl border border-amber-500/25 bg-[#07111F]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70 bg-slate-900/80">
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-amber-300">📋 Copy / Save Kundli Report</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Degree + D1–D60 Shodashvarga + selectable MD → AD → PD
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/5 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800/70 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={copyFullReport}
            className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-[11px] font-bold"
          >
            {copied ? "✓ Copied" : "📋 Copy Full Report"}
          </button>

          <button
            type="button"
            onClick={downloadJpg}
            className="px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[11px] font-bold"
          >
            ⬇ Download JPG
          </button>

          <button
            type="button"
            onClick={shareJpg}
            className="px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 text-[11px] font-bold"
          >
            ↗ Share JPG
          </button>

          <button
            type="button"
            onClick={downloadTxt}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-[11px] font-bold"
          >
            ⬇ Download TXT
          </button>

          <button
            type="button"
            onClick={shareLinkFromReport}
            className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[11px] font-bold"
          >
            🔗 Share Kundli Link
          </button>

          {shareMsg && (
            <span className="text-[10px] text-emerald-300 font-semibold">✓ {shareMsg}</span>
          )}

          <span className="text-[10px] text-slate-500">
            Link खोलते ही DOB / Time / Place और यही page-state अपने आप load होगा.
          </span>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-4">
            <div className="text-lg font-black text-slate-100">🪐 सम्पूर्ण वैदिक कुंडली</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Vedic Jyotish Report — Swiss Ephemeris + Nadi AI</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-[10px] sm:text-[11px]">
              <div><span className="text-slate-500">नाम:</span> <b className="text-slate-200">{meta?.name || "—"}</b></div>
              <div><span className="text-slate-500">लग्न:</span> <b className="text-amber-300">{meta?.lagnaSign || meta?.lagna || "—"} {meta?.lagnaRashiDegree != null ? `${meta.lagnaRashiDegree}°` : ""}</b></div>
              <div><span className="text-slate-500">जन्म:</span> <b className="text-slate-200">{meta?.dob || "—"}</b></div>
              <div><span className="text-slate-500">समय / स्थान:</span> <b className="text-slate-200">{meta?.time || "—"} | {meta?.city || "—"}</b></div>
              <div><span className="text-slate-500">लग्न नक्षत्र:</span> <b className="text-slate-200">{meta?.lagnaNakshatra || "—"}{meta?.lagnaNakshatraPada ? ` · चरण ${meta.lagnaNakshatraPada}` : ""}</b></div>
              <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-500">वर्तमान:</span> <b className="text-cyan-200">{bundle.current?.mahadasha || "—"} → {bundle.current?.antardasha || "—"} → {bundle.current?.pratyantara || "—"}</b></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-4">
            <div className="text-sm font-black text-cyan-300 mb-2">दशा चुनें</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <DashaSelectorCard
                label="महादशा — Current default, कोई भी MD चुनें"
                value={bundle.mdName}
                options={bundle.sequence}
                onChange={changeMD}
                currentValue={bundle.currentMD}
                accent="amber"
              />

              <DashaSelectorCard
                label={`अंतर्दशा — ${bundle.mdName || "selected MD"} में`}
                value={bundle.adName}
                options={bundle.ads}
                onChange={setSelectedAD}
                currentValue={bundle.currentAD}
                accent="cyan"
              />
            </div>

            <div className="mt-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[10px]">
              <span className="text-slate-500">चयनित:</span>{" "}
              <b className="text-amber-300">{reportDashaLord(bundle.mdObj)}</b>
              <span className="text-slate-600 mx-1">→</span>
              <b className="text-cyan-200">{reportDashaLord(bundle.adObj)}</b>
              <span className="text-slate-600 mx-1">→</span>
              <b className="text-purple-200">{reportDashaLord(bundle.pdObj)}</b>
              <span className="text-slate-600 ml-2">
                {reportDashaStart(bundle.pdObj)} → {reportDashaEnd(bundle.pdObj)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/60">
              <div className="text-sm font-black text-amber-300">ग्रह स्थिति + षोडशवर्ग</div>
              <div className="text-[10px] text-slate-500">
                Degree और सभी listed D-Charts एक ही table में.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[2450px] w-full text-[9px]">
                <thead className="bg-slate-950/85">
                  <tr>
                    {[
                      "ग्रह","राशि","भाव","डिग्री","नक्षत्र","नक्ष.स्वामी","राशि स्वामी",
                      "अवस्था","स्वभाव","बल%",...REPORT_VARGA_KEYS
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-2 py-2 text-left border-b border-slate-800 whitespace-nowrap ${i >= 10 ? "text-cyan-300" : "text-amber-300"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(r => (
                    <tr key={r.code} className="border-b border-slate-800/60">
                      {[
                        r.name,r.sign,r.house,r.degree,r.nakshatra,r.nakLord,
                        r.rashiLord,r.status,r.nature,r.strength,...r.vargas
                      ].map((v, i) => (
                        <td
                          key={`${r.code}-${i}`}
                          className={`px-2 py-2 whitespace-nowrap ${i === 0 ? "font-black text-amber-300" : i >= 10 ? "text-slate-200" : "text-slate-300"}`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <DashaReportTable title="महादशा — पूर्ण 120 वर्ष" rows={bundle.sequence} />
            <DashaReportTable title={`अंतर्दशा — ${reportDashaLord(bundle.mdObj)}`} rows={bundle.ads} />
            <DashaReportTable title={`प्रत्यंतर — ${reportDashaLord(bundle.adObj)}`} rows={bundle.pds} />
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[11px] text-slate-500">Copy-ready text</div>
              <div className="text-[9px] text-slate-600">Tab-separated — Word / Excel / Notes में paste-friendly</div>
            </div>
            <textarea
              readOnly
              value={reportText}
              className="w-full h-72 resize-y rounded-xl border border-slate-700 bg-[#050B14] p-3 text-[10px] leading-5 text-slate-300 outline-none"
            />
          </div>

          <div className="text-center text-[10px] text-slate-600 py-1">
            www.kundalimaker.com
          </div>
        </div>
      </div>
    </div>
  );
}

function DashaReportTable({ title, rows }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800/60 text-[11px] font-black text-cyan-300">{title}</div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-[9px]">
          <thead className="bg-slate-950/70">
            <tr>
              <th className="px-2 py-2 text-left text-amber-300">Lord</th>
              <th className="px-2 py-2 text-left text-amber-300">Start</th>
              <th className="px-2 py-2 text-left text-amber-300">End</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r, i) => (
              <tr key={`${reportDashaLord(r)}-${i}`} className="border-b border-slate-800/50">
                <td className="px-2 py-1.5 text-slate-200 font-bold">{reportDashaLord(r)}</td>
                <td className="px-2 py-1.5 text-slate-400">{reportDashaStart(r)}</td>
                <td className="px-2 py-1.5 text-slate-400">{reportDashaEnd(r)}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={3} className="px-2 py-4 text-center text-slate-600">डेटा उपलब्ध नहीं</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RIGHT PANEL (Tabbed)
// ─────────────────────────────────────────────────────────────
function RightPanel({ chartData }) {
  // State for PDF Modal
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(() => {
    try { return localStorage.getItem("kundli-shared-report-open") === "1"; } catch { return false; }
  });
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem("kundli-shared-report-open") === "1") {
        localStorage.removeItem("kundli-shared-report-open");
      }
    } catch {}
  }, []);

  const { 
    activeTab, 
    selectedPlanet, 
    formData,
    drawerOpen, 
    setActiveTab, 
    selectPlanet, 
    closeDrawer, 
    enginesLoading,
    setDashaYearType
  } = useKundliStore();

  const isMobile = useIsMobile();

  const handleShareKundli = async (overrides = {}) => {
    const url = buildKundliShareUrl(chartData, formData, {
      activeTab,
      selectedPlanet,
      reportMD: overrides?.reportMD,
      reportAD: overrides?.reportAD,
      openReport: !!overrides?.openReport,
    });
    const result = await shareOrCopyKundliLink(url, chartData);
    setShareMsg(result?.message || "");
    window.setTimeout(() => setShareMsg(""), 1800);
    return result;
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* 1. Export options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        <button
          type="button"
          onClick={() => setShowPDFModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-bold text-[13px] transition-all hover:scale-[1.01] active:scale-[.99] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(245,158,11,.18),rgba(34,211,238,.12))",
            border: "1.5px solid rgba(245,158,11,.4)",
            color: "#F59E0B",
            fontFamily: "'Noto Sans Devanagari', sans-serif"
          }}
        >
          <FileText size={16} />
          <span>📄 कुंडली PDF</span>
          <Download size={14} style={{ opacity: 0.7 }} />
        </button>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-bold text-[13px] transition-all hover:scale-[1.01] active:scale-[.99] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(34,211,238,.12),rgba(168,85,247,.10))",
            border: "1.5px solid rgba(34,211,238,.3)",
            color: "#67E8F9",
            fontFamily: "'Noto Sans Devanagari', sans-serif"
          }}
        >
          <span>📋 Copy / Save Report</span>
          <Download size={14} style={{ opacity: 0.7 }} />
        </button>

        <button
          type="button"
          onClick={() => handleShareKundli()}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-bold text-[13px] transition-all hover:scale-[1.01] active:scale-[.99] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(16,185,129,.12),rgba(34,211,238,.10))",
            border: "1.5px solid rgba(16,185,129,.3)",
            color: "#6EE7B7",
            fontFamily: "'Noto Sans Devanagari', sans-serif"
          }}
        >
          <span>🔗 Share Kundli Link</span>
          {shareMsg ? <span className="text-[10px]">✓ {shareMsg}</span> : <span className="text-[10px] opacity-70">Live page</span>}
        </button>
      </div>

      {/* 2. PDF Modal */}
      {showPDFModal && <PDFModal chartData={chartData} onClose={() => setShowPDFModal(false)} />}

      {/* 2A. Copy / Save Report Modal */}
      {showReportModal && (
        <CopyableKundliReportModal
          chartData={chartData}
          onClose={() => setShowReportModal(false)}
          onShareLink={handleShareKundli}
        />
      )}

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
        {DASHBOARD_TABS.map((t) => {
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
            {activeTab === "charts" && <VargaGrid chartData={chartData} />}
            {activeTab === "planets" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {Object.entries(chartData.planets).map(([code, pdata]) => (
                  <PlanetCard key={code} code={code} data={pdata} isSelected={selectedPlanet === code} onClick={() => selectPlanet(code)} />
                ))}
              </div>
            )}
            {activeTab === "drishti" && (
  <div className="space-y-4">
    <div className="rounded-2xl border border-cyan-500/15 bg-slate-950/30 p-3">
      <div className="text-sm font-bold text-cyan-300 mb-1">Jaimini Rashi Drishti</div>
      <div className="text-[10px] text-slate-500 mb-3">Jaimini Graha Drishti + Jaimini Bhava Drishti</div>
      <JaiminiDrishtiPanel houses={chartData.houses || []} />
    </div>
    <div className="rounded-2xl border border-indigo-500/15 bg-slate-950/30 p-3">
      <div className="text-sm font-bold text-indigo-300 mb-1">Parashari Drishti</div>
      <div className="text-[10px] text-slate-500 mb-3">Graha Drishti + Bhava Drishti + Aspect Strength</div>
      <DrishtiGrid
      drishti={chartData.drishti}
      bhavDrishti={chartData.bhavDrishti || {}}
      advancedDrishti={chartData.chalit?._advancedDrishti || []}
      planets={chartData.planets}
      houses={chartData.houses || []}
    />
    </div>
  </div>
)}

{activeTab === "dasha" && (
  <DashaTimeline
    dasha={chartData.dasha}
    chartMeta={chartData.meta}
    currentYearType={chartData.meta?.dashaYearType || 360.0}
    onYearTypeChange={setDashaYearType}
  />
)}

{activeTab === "av" && (
  <AshtakavargaGrid
    sav={chartData.sav || []}
    houses={chartData.houses || []}
    ashtakavargaSpecial={chartData.ashtakavargaSpecial || ""}
    chartData={chartData}  // <--- यह लाइन जोड़नी है
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
            {activeTab === "gochar" && <GocharPanel chartData={chartData} />}
            {activeTab === "advanced_yogas" && <AdvancedYogasPanel />}
            {activeTab === "kp_btr"         && <KPBTRPanel />}
            {activeTab === "prashna"         && <PrashnaKundli />}  {/* 🔥 PRASHNA KUNDLI TAB */}
            {activeTab === "chalit" && <Chalit />}
            {/* 🌟 नया कारक टैब यहाँ जोड़ें */}
        {activeTab === "karaka" && (
          enginesLoading 
            ? <TabSkeleton /> 
            : <AdvancedAstrologyPanel 
                data={chartData?.enginesData?.advanced_astrology} 
              />
        )}
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
          tabs={DASHBOARD_TABS}
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
  const { activeTab, selectedPlanet, hoverHouse } = useKundliStore();

  // The multi-chart tab owns the chart surface. Do not render the universal D1
  // beside it, otherwise D1 would appear twice.
  if (activeTab === "charts") return null;

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
  const { chartData, loading, activeTab } = useKundliStore();
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
              {/* Universal D1 is hidden while the multi-chart tab is active. */}
              {activeTab !== "charts" && (
                <MobileChartHeader chartData={chartData} />
              )}
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