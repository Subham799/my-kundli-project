// pages/DashboardLayout.jsx
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { User, Moon, Zap, Download, FileText, RefreshCw } from "lucide-react";
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
import ShadbalaPanel from "../components/panels/ShadbalaPanel";
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
        <div className="text-lg font-semibold text-slate-300 mb-2">Enter Birth Details</div>
        <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
          Fill in the form on the left for a complete Vedic astrology analysis.
        </p>
      </div>
      <button
        onClick={loadDemo}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/15 transition-all"
      >
        <Zap size={14} /> Load Demo Chart
      </button>
      <Link
        to="/consultancy"
        className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-sm font-bold"
      >
        Client Reviews 🌟
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
  const shadbalaData = pd.shadbala || ed.shadbala || {};

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
  const birthDateForPDF = (() => {
    const raw = String(dob || "").trim();
    if (!raw || raw === "—") return null;
    let dt = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(dt.getTime())) {
      const m = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (m) dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
    }
    if (Number.isNaN(dt.getTime())) {
      // Handle dates such as "04 July 1999" and "July 04, 1999".
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        dt = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12);
      }
    }
    return Number.isNaN(dt.getTime()) ? null : dt;
  })();
  const birthWeekdayPDF = birthDateForPDF ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][birthDateForPDF.getDay()] : "—";
  const tob       = meta.time  || pd.inputData?.time || "—";
  const pob       = meta.city  || pd.inputData?.city || "—";
  const lagnaSign = meta.lagnaSign || "—";
  const lagnaIdx  = meta.lagnaSignIdx ?? 0;
  const lagnaNak  = meta.lagnaNakshatra || "";
  const lagnaDeg  = meta.lagnaRashiDegree ? meta.lagnaRashiDegree + "°" : "";

  const RASHI  = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const PH     = {Su:"Sun",Mo:"Moon",Ma:"Mars",Me:"Mercury",Ju:"Jupiter",Ve:"Venus",Sa:"Saturn",Ra:"Rahu",Ke:"Ketu"};
  const PS     = {Su:"☉",Mo:"☽",Ma:"♂",Me:"☿",Ju:"♃",Ve:"♀",Sa:"♄",Ra:"☊",Ke:"☋"};
  const DC     = {Uchcha:"#4ADE80",उच्च:"#4ADE80",Neecha:"#FB7185",नीच:"#FB7185",Swa:"#22D3EE",Swagraha:"#22D3EE",स्वराशि:"#22D3EE",Mitra:"#C084FC",मित्र:"#C084FC",Shatru:"#FB923C",शत्रु:"#FB923C",Sama:"#64748B",सम:"#64748B",Yogakaraka:"#F59E0B"};
  const DI     = {Uchcha:"⬆️",उच्च:"⬆️",Neecha:"⬇️",नीच:"⬇️",Swa:"🏠",Swagraha:"🏠",स्वराशि:"🏠",Mitra:"💜",मित्र:"💜",Shatru:"🔴",शत्रु:"🔴",Sama:"⚪",सम:"⚪",Yogakaraka:"⭐"};
  const FC     = {Yogakaraka:"#F59E0B",Malefic:"#FB7185","Functional Benefic":"#4ADE80","Functional Ben":"#4ADE80",Neutral:"#64748B"};
  const DASHA_FX={Su:"Confidence, father, leadership",Mo:"Mind, mother, travel",Ma:"Courage, property, energy",Me:"Intellect, business, education",Ju:"Knowledge, children, dharma",Ve:"Love, wealth, arts",Sa:"Work, discipline, delays",Ra:"Ambition, foreign links",Ke:"Spirituality, detachment"};
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
  const foot = (n,total) => `<div style="text-align:center;font-size:9px;color:#334155;margin-top:14px;padding-top:7px;border-top:1px solid rgba(245,158,11,.12)">🪐 Complete Vedic Kundli — ${name} | Page ${n}${total?" / "+total:""} | © Nadi AI Jyotish</div>`;

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
  </table>`:`<div style="color:#475569;text-align:center;padding:10px">Dasha data unavailable</div>`;

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

  const headerBlock=(showDasha=true)=>`<div class="hdr">
    <div style="font-size:19px;font-weight:900;color:#F59E0B">🪐 Complete Vedic Kundli</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:1px">Vedic Jyotish Report — Swiss Ephemeris + Nadi AI</div>
    <div class="igrid">
      <div class="ii"><div class="il">Name</div><div class="iv">${name}</div></div>
      <div class="ii"><div class="il">Ascendant</div><div class="iv" style="color:#22D3EE">${lagnaSign} ${lagnaDeg}</div></div>
      <div class="ii"><div class="il">Date of Birth</div><div class="iv">${dob}</div></div>
      <div class="ii"><div class="il">Weekday</div><div class="iv">${birthWeekdayPDF}</div></div>
      <div class="ii"><div class="il">Time / Place</div><div class="iv">${tob} | ${pob}</div></div>
      ${lagnaNak?`<div class="ii"><div class="il">Ascendant Nakshatra</div><div class="iv" style="color:#C084FC">${lagnaNak}</div></div>`:""}
      ${showDasha && dasha.mahadasha?`<div class="ii"><div class="il">Current Mahadasha</div><div class="iv" style="color:#F59E0B">${dasha.mahadasha} → ${dasha.antardasha||"—"} (${dasha.endDate||""})</div></div>`:""}
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
      bavTableHtml = `${sect("Bhinnashtakavarga (BAV) — Planetary Points", "#C084FC")}
      <table style="font-size:10px;text-align:center;margin-bottom:15px"><tr style="background:rgba(255,255,255,0.05)"><th>ग्रह / भाव ➔</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>Total</th></tr>${bavRows}</table>`;
    }
  }


  const pages = {
    1: ()=>`${head("Planets + Houses")}<div class="page">
      ${headerBlock(true)}
      ${sect("Planetary Positions — Nine Planets")}
      <table><tr><th>Planet</th><th>Sign</th><th>House</th><th>Degree</th><th>Nakshatra</th><th>Nakshatra Lord</th><th>Sign Lord</th><th>Dignity</th><th>Nature</th><th>Strength %</th></tr>${pRows}</table>
      <div style="margin-top:5px;padding:4px 8px;border-radius:5px;background:rgba(245,158,11,.05);font-size:8px;color:#475569">⬆️Exalted &nbsp;⬇️Debilitated &nbsp;🏠Own Sign &nbsp;💜Friend &nbsp;🔴Enemy &nbsp;⭐Yogakaraka &nbsp;⟲Retrograde &nbsp;🔥Combust</div>
      ${sect("Shadbala — Obtained Strength and Standards", "#F59E0B")}
      <table><tr><th>Planet</th><th>Virupas</th><th>Rupas</th><th>Minimum Standard</th><th>Status</th></tr>${(shadbalaData.planets || []).map(x=>{const min=({Su:390,Mo:360,Ma:300,Me:420,Ju:390,Ve:330,Sa:300})[x.code];const total=Number(x.total_virupas||0);const pct=min?total/min*100:0;return `<tr><td>${x.planet||PH[x.code]||x.code}</td><td>${total.toFixed(2)}</td><td>${(total/60).toFixed(2)}</td><td>${min||"—"}</td><td style="font-weight:700;color:${pct>=100?"#4ADE80":"#FB7185"}">${pct.toFixed(1)}% · ${pct>=100?"At or Above Standard":"Below Standard"}</td></tr>`;}).join("") || `<tr><td colspan="5">Shadbala data unavailable</td></tr>`}</table>
      ${sect("House Positions — 12 Houses","#22D3EE")}
      <table><tr><th>House</th><th>Sign</th><th>Planets</th><th>AV Points</th></tr>${hRows}</table>
      ${foot(1,TOTAL_PAGES)}</div>${close}`,

    2: ()=>`${head("Dasha + Yogas")}<div class="page">
      ${sect("Vimshottari Dasha — Complete Timeline","#FB923C")}
      <div style="padding:6px 8px;border-radius:6px;background:rgba(251,146,60,.05);margin-bottom:7px;font-size:9px;color:#475569">💡 Vimshottari system: a 120-year cycle based on the birth nakshatra. Current: <b style="color:#F59E0B">${dasha.mahadasha||"—"} Mahadasha → ${dasha.antardasha||"—"} Antardasha | Ends: ${dasha.endDate||"—"}</b></div>
      ${dashaTable}
      ${allYogas.length>0?`${sect(`Yogas — ${allYogas.length} Active`,"#4ADE80")}<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${allYogas.slice(0,18).map(y=>{const yn=y.name||y.yoga_name||"";const yd=y.effect||y.description||"";const yc=yn.includes("राज")||yn.includes("Raja")?"#F59E0B":yn.includes("धन")||yn.includes("Dhana")?"#4ADE80":"#22D3EE";return`<div style="padding:5px 8px;border-radius:6px;background:${yc}07;border:1px solid ${yc}20"><div style="font-size:11px;color:${yc};font-weight:700">${yn}</div>${yd?`<div style="font-size:9px;color:#475569;margin-top:1px">${yd.slice(0,60)}${yd.length>60?"...":""}</div>`:""}</div>`;}).join("")}
      </div>`:""}
      ${foot(2,TOTAL_PAGES)}</div>${close}`,
  };

  pages[3] = () => {
    // Extract dasha data from pd.dasha (same as used in UI)
    const dashaSeqData = dashaSeq || [];
    const currentDasha = dasha || {};
    
    if (!dashaSeqData || dashaSeqData.length === 0) {
      return `${head("Vimshottari Dasha")}<div class="page">
        <div style="color:#475569;text-align:center;padding:20px">Dasha data unavailable</div>
        ${foot(3, TOTAL_PAGES)}</div>${close}`;
    }

    // Current dasha info
    const currentMD = currentDasha.mahadasha || "—";
    const currentAD = currentDasha.antardasha || "—";
    const currentPD = currentDasha.pratyantar || "—";

    // Find current MD object to get ALL its antardashas
    const currentMDObj = dashaSeqData.find(md => {
      const pName = md.planet || md.lord || md.name;
      return pName === currentMD;
    });
    
    const antardashas = currentMDObj?.antardashas || currentMDObj?.subperiods || [];

    return `${head("Vimshottari Dasha — Complete Timeline")}<div class="page">
      <div style="margin:12px 0;padding:8px 10px;background:rgba(34,211,238,.04);border-radius:8px;border:1px solid rgba(34,211,238,.12);font-size:10px;color:#64748B">
        This page contains details of the current Mahadasha Antardasha and Pratyantardasha only. The complete Mahadasha timeline is on Page 2.
      </div>

      <div style="padding:5px 8px;border-radius:6px;background:rgba(34,211,238,.05);margin-bottom:7px;font-size:9px;color:#475569">
        The complete Mahadasha timeline is on Page 2. This page contains only Antardasha and Pratyantardasha details.
      </div>

      ${antardashas.length > 0 ? `
      ${sect("Antardasha — All 9 sub-periods of "+currentMD+" Mahadasha","#22D3EE")}
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
              <div style="font-size:6px;color:#94A3B8;margin-bottom:2px;font-weight:700">Pratyantardasha (${pratyantars.length}):</div>
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

  // PAGE 4 — Shodashvarga (Divisional Charts) + Retrograde Summary
  pages[4] = () => {
    const VARGA_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];
    const PL_KEYS    = ["La","Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
    const PL_NAMES   = {"La":"Ascendant","Su":"Sun","Mo":"Moon","Ma":"Mars","Me":"Mercury","Ju":"Jupiter","Ve":"Venus","Sa":"Saturn","Ra":"Rahu","Ke":"Ketu"};

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
      : `<span style="color:#4ADE80;font-size:9px">✅ No planets are currently retrograde</span>`;

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
      ${sect("Shodashvarga Matrix (Divisional Charts)", "#F59E0B")}
      <div style="font-size:9px;color:#64748B;margin-bottom:8px">
        💡 Complete matrix of the ascendant and planetary signs across the divisional charts.
        <b style="color:#22D3EE">D9 (नवांश)</b> is especially important — <b style="color:#818CF8">⟲ = Retrograde planet</b>।
      </div>

      <div style="padding:7px 10px;border-radius:7px;background:rgba(129,140,248,.06);border:1px solid rgba(129,140,248,.2);margin-bottom:10px">
        <span style="font-size:9px;font-weight:900;color:#818CF8">⟲ Currently Retrograde: </span>${vakriBadge}
      </div>

      <div style="border-radius:8px;border:1px solid rgba(255,255,255,.1);overflow:hidden">
        <table style="font-size:8px;text-align:center;width:100%;border-collapse:collapse;margin:0">
          <tr style="background:rgba(245,158,11,.12)">
            <th style="padding:6px 3px;text-align:left;color:#F59E0B;width:70px">Planet</th>
            ${VARGA_KEYS.map(k => `<th style="padding:6px 2px;color:${k==="D9"?"#22D3EE":"#F59E0B"}">${k}</th>`).join("")}
          </tr>
          ${rows}
        </table>
      </div>

      <div style="margin-top:10px;padding:8px;border-radius:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);font-size:8px;color:#94A3B8;line-height:1.6">
        <b>Divisional Chart Guide:</b> <b>D1</b> (Body and overall life), <b>D2</b> (Wealth), <b>D3</b> (Siblings), <b>D4</b> (Property), <b>D7</b> (Children),
        <b>D9</b> (Spouse and deeper fortune), <b>D10</b> (Work and career), <b>D12</b> (Parents), <b>D16</b> (Vehicles and comforts), <b>D20</b> (Spirituality),
        <b>D24</b> (Education), <b>D27</b> (Strength), <b>D30</b> (Adversities), <b>D40</b> (Auspicious and inauspicious influences), <b>D45</b> (Overall character), <b>D60</b> (Past-life karma)।
      </div>
    `;

    return `${head("Shodashvarga")}<div class="page">
      ${body}
      ${foot(4, TOTAL_PAGES)}
    </div>${close}`;
  };

  // One-page quick reference: D1/D9, Shadbala, current MD/AD/PD and SAV.
  pages[5] = () => {
    const rashiHi = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
    const planetKeys = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
    const planetNames = {Su:"Sun",Mo:"Moon",Ma:"Mars",Me:"Mercury",Ju:"Jupiter",Ve:"Venus",Sa:"Saturn",Ra:"Rahu",Ke:"Ketu"};
    const vargaSignIndex = (p, key) => {
      const v = p?.Vargas?.[key] || p?.vargas?.[key];
      if (typeof v === "number") return ((v % 12) + 12) % 12;
      if (Number.isFinite(Number(v?.Idx))) return ((Number(v.Idx) % 12) + 12) % 12;
      const n = v?.Name || v?.name;
      const idx = rashiHi.indexOf(n);
      return idx >= 0 ? idx : null;
    };
    const chartMiniTable = (key) => {
      const asc = vargaSignIndex({Vargas: meta.lagnaVargas || {}}, key);
      const rows = planetKeys.map(code => {
        const pln = pl?.[code] || {};
        const idx = vargaSignIndex(pln, key);
        const house = idx == null || asc == null ? "—" : ((idx - asc + 12) % 12) + 1;
        return `<tr><td>${planetNames[code]}</td><td>${idx == null ? (key === "D1" ? (pln.sign || "—") : "—") : rashiHi[idx]}</td><td>${house}</td></tr>`;
      }).join("");
      const label = key === "D1" ? "(Ascendant)" : key === "D9" ? "(Navamsha)" : "(Dashamsha)";
      return `<div style="width:32.5%;display:inline-block;vertical-align:top"><h3 style="color:#22D3EE;margin:4px 0">${key} ${label}</h3><table><tr><th>Planet</th><th>Sign</th><th>House</th></tr>${rows}</table></div>`;
    };
    const shadRows = (shadbalaData.planets || []).map(x => {
      const min = ({Su:390,Mo:360,Ma:300,Me:420,Ju:390,Ve:330,Sa:300})[x.code];
      const total = Number(x.total_virupas || 0);
      const pct = min ? total / min * 100 : 0;
      return `<tr><td>${x.planet || planetNames[x.code] || x.code}</td><td>${total.toFixed(2)}</td><td>${(total/60).toFixed(2)}</td><td>${min || "—"}</td><td style="color:${pct>=100?'#15803D':'#B91C1C'};font-weight:700">${pct.toFixed(1)}% · ${pct>=100?'At or Above Standard':'Below Standard'}</td></tr>`;
    }).join("");
    const currentMD = dasha.mahadasha || "—";
    const mdObj = dashaSeq.find(x => (x.lord || x.mahadasha || x.planet || x.name) === currentMD) || dashaSeq.find(x => String(x.lord || x.mahadasha || x.planet || x.name || "").includes(currentMD)) || null;
    const ads = mdObj?.antardashas || mdObj?.subperiods || [];
    const currentAD = dasha.antardasha || "—";
    const adObj = ads.find(x => (x.lord || x.antardasha || x.planet || x.name) === currentAD) || ads.find(x => String(x.lord || x.antardasha || x.planet || x.name || "").includes(currentAD)) || null;
    const pds = adObj?.pratyantardashas || adObj?.pratyantar || adObj?.subperiods || [];
    const fmtPeriod = x => `${x.lord || x.mahadasha || x.planet || x.name || "—"} (${x.start || x.startDate || x.from || "—"} → ${x.end || x.endDate || x.to || "—"})`;
    const adRows = ads.map(x => `<tr><td>${fmtPeriod(x)}</td></tr>`).join("");
    const pdRows = pds.length ? pds.map(x => `<tr><td>${fmtPeriod(x)}</td></tr>`).join("") : `<tr><td>Current Pratyantardasha: ${dasha.pratyantara || dasha.pratyantar || "Data unavailable"} ${dasha.pratyantaraStart || ""} ${dasha.pratyantaraEnd || ""}</td></tr>`;
    const sav = ed.sav || ed.ashtakvarga_complete?.sav || ed.ashtakvarga_complete?.analysis?.sign_wise_points || pd.sav || [];
    const savVals = Array.isArray(sav) ? sav : Array.from({length:12}, (_,i)=>sav[i] ?? sav[String(i)] ?? sav[i+1] ?? sav[String(i+1)] ?? "—");
    let dobDate = new Date(`${dob}T12:00:00`);
    if (Number.isNaN(dobDate.getTime())) {
      const dm = String(dob || "").match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dm) dobDate = new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]), 12);
    }
    const weekday = !Number.isNaN(dobDate.getTime()) ? ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"][dobDate.getDay()] : "—";
    return `${head("One-Page Kundli Summary")}<div class="page" style="font-size:9px">
      ${sect("Sarvashtakavarga (SAV) Points", "#C084FC")}<table><tr>${rashiHi.map((r,i)=>`<th>${r}</th>`).join("")}</tr><tr>${rashiHi.map((r,i)=>`<td>${savVals[i] ?? "—"}</td>`).join("")}</tr></table>
      ${bavTableHtml}
      ${foot(5,TOTAL_PAGES)}</div>${close}`;
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
    return `${head("Complete Vedic Kundli")}${combined}</body></html>`;
  }
  return pages[pageNum]?pages[pageNum]():`<h1>Page not found</h1>`;
}




function parseBirthDateValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—") return null;

  const months = {
    jan:0, january:0, feb:1, february:1, mar:2, march:2,
    apr:3, april:3, may:4, jun:5, june:5, jul:6, july:6,
    aug:7, august:7, sep:8, sept:8, september:8, oct:9,
    october:9, nov:10, november:10, dec:11, december:11
  };

  const makeDate = (year, month, day) => {
    year = Number(year);
    month = Number(month);
    day = Number(day);
    if (!Number.isInteger(year) || !Number.isInteger(month) ||
        !Number.isInteger(day) || year < 1 || month < 0 ||
        month > 11 || day < 1 || day > 31) return null;
    const date = new Date(year, month, day, 12);
    return date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day ? date : null;
  };

  // Match the PDF's supported month-name formats without relying on
  // browser-native parsing: "04 July 1999" and "July 04, 1999".
  let match = raw.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (match) {
    const month = months[match[2].toLowerCase()];
    if (month !== undefined) return makeDate(match[3], month, match[1]);
  }

  match = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match) {
    const month = months[match[1].toLowerCase()];
    if (month !== undefined) return makeDate(match[3], month, match[2]);
  }

  // ISO date (optionally followed by a time).
  match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|T|\s)/);
  if (match) return makeDate(match[1], Number(match[2]) - 1, match[3]);

  // Numeric DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY.
  match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12) return makeDate(match[3], second - 1, first);
    if (second > 12) return makeDate(match[3], first - 1, second);
    return makeDate(match[3], second - 1, first); // DD/MM/YYYY convention
  }

  // Same final fallback behavior as the PDF for other browser-recognized dates.
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12);
  }
  return null;
}

// Resolve DOB in the same order as buildPDFPage(): meta.dob, then inputData.dob.
// Accept either a raw DOB or the full chartData object.
function getBirthWeekday(value) {
  const candidates = value && typeof value === "object" && !(value instanceof Date)
    ? [value?.meta?.dob, value?.inputData?.dob]
    : [value];

  for (const candidate of candidates) {
    const date = parseBirthDateValue(candidate);
    if (date) {
      return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
    }
  }
  return "—";
}

function exportAstroSummaryPNG(chartData) {
  const meta = chartData?.meta || {};
  const planets = chartData?.planets || {};
  const shadbala = chartData?.shadbala || chartData?.enginesData?.shadbala || {};
  const engines = chartData?.enginesData || {};
  const dasha = chartData?.dasha || {};
  const sequence = Array.isArray(dasha.sequence) ? dasha.sequence : [];
  const currentMD = dasha.current?.mahadasha || "—";
  const currentMDObj = sequence.find(x => reportDashaLord(x) === currentMD) || sequence[0] || {};
  const ads = reportDashaADs(currentMDObj);
  const currentAD = dasha.current?.antardasha || "—";
  const currentADObj = ads.find(x => reportDashaLord(x) === currentAD) || ads[0] || {};
  const pds = reportDashaPDs(currentADObj);
  const RASHI = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const NAMES = {Su:"Sun",Mo:"Moon",Ma:"Mars",Me:"Mercury",Ju:"Jupiter",Ve:"Venus",Sa:"Saturn",Ra:"Rahu",Ke:"Ketu",Ur:"Uranus",Ne:"Neptune",Pl:"Pluto"};
  const MIN = {Su:390,Mo:360,Ma:300,Me:420,Ju:390,Ve:330,Sa:300};
  const signIdx = (p, key) => { const v=p?.Vargas?.[key] || p?.vargas?.[key]; if(typeof v==="number") return (v+12)%12; if(Number.isFinite(Number(v?.Idx))) return ((Number(v.Idx)%12)+12)%12; const nm=v?.Name||v?.name; const i=RASHI.indexOf(nm); return i>=0?i:null; };
  const weekday = getBirthWeekday(chartData);
  const W=2480, H=2480, canvas=document.createElement("canvas"); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d"); if(!ctx) return;
  const C={bg:"#07111F",panel:"#0E1928",grid:"#253348",gold:"#F59E0B",cyan:"#22D3EE",purple:"#C084FC",white:"#E2E8F0",muted:"#94A3B8",green:"#4ADE80",red:"#FB7185"};
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
  const text=(str,x,y,size=20,color=C.white,bold=false,max=0)=>{ctx.font=`${bold?"700":"400"} ${size}px 'Noto Sans Devanagari', Arial`;ctx.fillStyle=color;let t=String(str??"—");if(max){while(t.length>1&&ctx.measureText(t).width>max)t=t.slice(0,-1);if(t!==String(str??"—"))t+="…";}ctx.fillText(t,x,y);};
  const section=(title,y,color=C.gold)=>{ctx.fillStyle=C.panel;ctx.fillRect(45,y,W-90,42);ctx.strokeStyle=C.grid;ctx.strokeRect(45,y,W-90,42);text(title,62,y+28,22,color,true);};
  const cell=(x,y,w,h,val,color=C.white,size=16,bold=false,bg=null)=>{ctx.fillStyle=bg||C.panel;ctx.fillRect(x,y,w,h);ctx.strokeStyle=C.grid;ctx.strokeRect(x,y,w,h);text(val,x+8,y+h/2+size*.33,size,color,bold,w-16);};
  text("KUNDLI SUMMARY",48,55,34,C.gold,true);
  text(`${meta.name||"Native"} · DOB ${meta.dob||"—"} · Day: ${weekday} · Time ${meta.time||"—"} · ${meta.city||"—"} · Ascendant ${meta.lagnaSign||"—"} · Sunrise ${meta.sunrise||"—"}`,50,91,17,C.muted,false,W-100);
  // Draw D1/D9 with the exact North-Indian diamond geometry used by InteractiveKundli.jsx.
  let y=120;
  const chartHousePolys={
    1:[[220,10],[325,115],[220,220],[115,115]], 2:[[10,10],[220,10],[115,115]],
    3:[[10,10],[115,115],[10,220]], 4:[[10,220],[115,115],[220,220],[115,325]],
    5:[[10,430],[10,220],[115,325]], 6:[[10,430],[115,325],[220,430]],
    7:[[220,430],[115,325],[220,220],[325,325]], 8:[[430,430],[220,430],[325,325]],
    9:[[430,430],[325,325],[430,220]], 10:[[430,220],[325,325],[220,220],[325,115]],
    11:[[430,10],[430,220],[325,115]], 12:[[430,10],[325,115],[220,10]]
  };
  const chartTextPos={1:[220,93],2:[115,30],3:[58,96],4:[115,198],5:[58,298],6:[115,348],7:[220,302],8:[325,348],9:[382,298],10:[325,198],11:[382,96],12:[325,30]};
  const drawDiamondChart=(key,top,color,ox=45,scale=0.62)=>{
    const ascCell=meta?.lagnaVargas?.[key] || meta?.lagnaVargas?.[key.toLowerCase()];
    let asc=Number.isFinite(Number(ascCell?.Idx))?((Number(ascCell.Idx)%12)+12)%12:null;
    if(asc===null && key==="D1") asc=Number.isFinite(Number(meta.lagnaSignIdx))?((Number(meta.lagnaSignIdx)%12)+12)%12:0;
    if(asc===null) asc=0;
    const houses=Array.from({length:12},(_,i)=>({sign:(asc+i)%12,planets:[]}));
    Object.entries(planets).forEach(([code,p])=>{const si=signIdx(p,key);if(si!==null){const hn=((si-asc+12)%12);houses[hn].planets.push(NAMES[code]||code);}});
    const oy=top, size=440*scale;
    ctx.fillStyle="#01030C";ctx.fillRect(ox,oy,size,size);
    const xy=pt=>[ox+pt[0]*scale,oy+pt[1]*scale];
    Object.entries(chartHousePolys).forEach(([hn,pts])=>{const h=houses[Number(hn)-1];ctx.beginPath();pts.forEach((pt,i)=>{const [x0,y0]=xy(pt);i?ctx.lineTo(x0,y0):ctx.moveTo(x0,y0)});ctx.closePath();ctx.fillStyle=(h.sign===asc)?"#211B10":"#080F1B";ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();});
    ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.strokeRect(ox+10*scale,oy+10*scale,420*scale,420*scale);
    ctx.beginPath();ctx.moveTo(ox+10*scale,oy+10*scale);ctx.lineTo(ox+430*scale,oy+430*scale);ctx.moveTo(ox+430*scale,oy+10*scale);ctx.lineTo(ox+10*scale,oy+430*scale);ctx.strokeStyle="#F59E0B88";ctx.lineWidth=1.2;ctx.stroke();
    [[220,10],[430,220],[220,430],[10,220]].forEach((pt,i,arr)=>{const [x0,y0]=xy(pt);if(i===0)ctx.moveTo(x0,y0);});
    ctx.beginPath();[[220,10],[430,220],[220,430],[10,220]].forEach((pt,i)=>{const [x0,y0]=xy(pt);i?ctx.lineTo(x0,y0):ctx.moveTo(x0,y0)});ctx.closePath();ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();
    Object.keys(chartTextPos).forEach(hn=>{const h=houses[Number(hn)-1],pos=chartTextPos[hn], [cx,ry]=xy(pos);ctx.textAlign="center";text(String(h.sign+1),cx,ry,15,C.gold,true);text(RASHI[h.sign],cx,ry+16,11,C.white,true);const ps=h.planets.join(" ");if(ps)text(ps,cx,ry+31,10,C.cyan,true,Math.max(35,100*scale));if(Number(hn)===1)text("ASC",cx,ry+43,9,C.gold,true);});
    ctx.textAlign="left";
    return oy+size;
  };
  section("VARGA CHARTS · D1 LAGNA · D9 NAVAMSHA · D10 DASHAMSHA",y,C.cyan);y+=48;
  const chartScale=0.61, chartSize=440*chartScale, chartGap=42, chartStart=45;
  ["D1","D9","D10"].forEach((key,i)=>{text(key,chartStart+i*(chartSize+chartGap)+chartSize/2,y+16,19,i===0?C.cyan:i===1?C.purple:C.gold,true);drawDiamondChart(key,y+24,i===0?C.cyan:i===1?C.purple:C.gold,chartStart+i*(chartSize+chartGap),chartScale);});
  y+=chartSize+42;
  section("SHADBALA · ALL PLANETS",y);y+=42;
  const shHeaders=["Planet","Sign","House","Virupas","Rupas","Minimum","Strength / Status"], shW=[160,180,100,180,130,160,360], sx0=45;
  let xx=sx0;shHeaders.forEach((h,i)=>{cell(xx,y,shW[i],32,h,C.gold,14,true);xx+=shW[i];});y+=32;
  (shadbala.planets||[]).forEach((p,ri)=>{const min=MIN[p.code],total=Number(p.total_virupas||0),pct=min?total/min*100:0;const vals=[p.planet||NAMES[p.code],p.sign||"—",p.house||"—",total.toFixed(2),Number(p.total_rupas||total/60).toFixed(2),min||"—",`${pct.toFixed(1)}% · ${pct>=100?"Meets standard":"Below standard"}`];xx=sx0;vals.forEach((v,i)=>{cell(xx,y,shW[i],29,v,i===6?(pct>=100?C.green:C.red):C.white,13,i===0,ri%2?"#0A1725":C.panel);xx+=shW[i];});y+=29;});
  y+=10;section(`VIMSHOTTARI DASHA · Current MD ${currentMD} · Current AD ${currentAD}`,y,C.cyan);y+=42;
  text(`All Antardashas of current Mahadasha (${currentMD})`,55,y+18,16,C.gold,true);y+=27;
  if (ads.length) ads.forEach((a,i)=>{cell(45,y,W-90,23,`${reportDashaLord(a)} · ${reportDashaStart(a)} → ${reportDashaEnd(a)}`,C.white,12,false,i%2?"#0A1725":C.panel);y+=23;});
  else {cell(45,y,W-90,23,"AD data उपलब्ध नहीं",C.muted,12);y+=23;}
  text(`All Pratyantar Dashas of current Antardasha (${currentAD})`,55,y+17,15,C.purple,true);y+=24;
  if (pds.length) pds.forEach((a,i)=>{cell(45,y,W-90,23,`${reportDashaLord(a)} · ${reportDashaStart(a)} → ${reportDashaEnd(a)}`,C.white,12,false,i%2?"#0A1725":C.panel);y+=23;});
  else {cell(45,y,W-90,23,`Current PD: ${dasha.current?.pratyantara||dasha.current?.pratyantar||"डेटा उपलब्ध नहीं"}`,C.muted,12);y+=23;}
  y+=12;
  section("ASHTAKVARGA · SAV POINTS",y,C.purple);y+=42;
  const av=engines.sav||engines.ashtakvarga_complete?.sav||engines.ashtakvarga_complete?.analysis?.sign_wise_points||chartData?.sav||[];
  for(let i=0;i<12;i++){const v=Array.isArray(av)?av[i]:(av?.[i]??av?.[String(i)]??av?.[i+1]??av?.[String(i+1)]??"—");const cw=(W-90)/6;cell(45+(i%6)*cw,y+Math.floor(i/6)*38,cw,38,`${i+1} ${RASHI[i]}: ${v}`,C.white,15,false);}
  y+=86;
  const bav=engines.bav||engines.ashtakvarga_complete?.bav||chartData?.bav||{};
  text("BAV TOTAL POINTS",55,y+16,15,C.gold,true);y+=24;
  const planetCodes=["Su","Mo","Ma","Me","Ju","Ve","Sa"];
  planetCodes.forEach((code,i)=>{const vals=bav[code]||bav[code.toLowerCase()]||[];const total=Array.isArray(vals)?vals.reduce((a,b)=>a+(Number(b)||0),0):"—";text(`${NAMES[code]}: ${total}`,55+(i%4)*330,y+18+Math.floor(i/4)*28,14,C.white,false,300);});
  text("KundliMaker · Compact chart report",50,H-28,13,C.muted,false);
  canvas.toBlob(blob=>{if(!blob){alert("PNG export failed");return;}const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`KundliMaker-OnePage-${String(meta.name||"Report").replace(/[^\w\-]+/g,"-")}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);},"image/png");
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
const HI = { fontFamily:"Arial, sans-serif" };
const PDF_PAGES = [
  {num:1, icon:"🪐", label:"Planets + Houses", desc:"9 planets, 12 houses, degrees and nakshatras"},
  {num:2, icon:"⏳", label:"Dasha + Yogas", desc:"Vimshottari Dasha timeline and active yogas"},
  {num:3, icon:"⏳", label:"Dasha", desc:"Mahadasha, Antardasha and Pratyantardasha"},
  {num:4, icon:"📊", label:"Shodashvarga Matrix", desc:"Complete 17 D-Chart matrix (D1–D60) + retrograde planets"},
  {num:5, icon:"📑", label:"Ashtakavarga Summary", desc:"Sarvashtakavarga (SAV) and Bhinnashtakavarga (BAV) scores"},
];

function PDFModal({ chartData, onClose }) {
  const [sel, setSel] = useState(null); // null = all selected
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,.75)"}}>
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-amber-500/30 overflow-hidden" style={{background:"#0C1128"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/15" style={{background:"rgba(245,158,11,.06)"}}>
          <div>
            <div className="text-[15px] font-black text-amber-400" style={HI}>📄 Kundli PDF</div>
            <div className="text-[11px] text-slate-500 mt-0.5" style={HI}>Which page do you need?</div>
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
              <div className="text-[13px] font-black text-amber-400" style={HI}>Complete Kundli — All 5 Pages</div>
              <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>Complete report — Planets + Houses, Dasha, Vargas and Summary</div>
            </div>
            {sel===null && <span className="text-amber-400 text-lg">✓</span>}
          </button>

          {/* Individual pages */}
          <div className="text-[10px] text-slate-600 mb-2 px-1" style={HI}>📄 Available PDF Pages (1–5):</div>
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
          {sel===5 && <button
            onClick={()=>{ exportAstroSummaryPNG(chartData); onClose(); }}
            className="py-3 px-3 rounded-xl font-black text-[12px] transition-all active:scale-[.98]"
            style={{background:"rgba(34,211,238,.10)",border:"1.5px solid rgba(34,211,238,.4)",color:"#22D3EE",...HI}}>
            🖼️ PNG
          </button>}
          <button
            onClick={()=>{ exportKundliPDF(chartData, sel===null?"all":sel); onClose(); }}
            className="flex-1 py-3 rounded-xl font-black text-[13px] transition-all active:scale-[.98]"
            style={{background:"linear-gradient(135deg,rgba(245,158,11,.25),rgba(34,211,238,.15))",border:"1.5px solid rgba(245,158,11,.45)",color:"#F59E0B",...HI}}>
            {sel===null?"📥 Complete PDF (5 Pages)":"📄 Create PDF for Page "+sel}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-500 text-[12px] hover:text-white transition-all" style={HI}>
            Cancel
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
const VARGA_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60","RTN","YOGINI_PL",
  "D1_PL","D2_PL","D3_PL","D4_PL","D6_PL","D7_PL","D9_PL","D10_PL","D12_PL","D16_PL","D20_PL","D24_PL","D27_PL","D30_PL","D40_PL","D45_PL","D60_PL"];

// Clear only Kundli UI/cache state. This does not touch unrelated site storage.
function clearKundliClientState() {
  try {
    [
      "kundli-varga-view-settings",
      "kundli-report-dasha-selection",
      "kundli-shared-ui-state",
      "kundli-shared-report-open",
      ...VARGA_KEYS.map((key) => `kundli-chart-annotations-${key}`),
    ].forEach((key) => localStorage.removeItem(key));
  } catch {}
}

function ChartAnnotationOverlay({ chartKey }) {
  const storageKey = `kundli-chart-annotations-${chartKey}`;
  const [drawing, setDrawing] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tool, setTool] = useState("pen"); // pen | line | arrow | circle | rect | eraser
  const [drawColor, setDrawColor] = useState("#F59E0B");
  const [strokes, setStrokes] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(raw) ? raw.slice(-20) : [];
    } catch { return []; }
  });
  const activeStroke = useRef(null);
  const [previewPoints, setPreviewPoints] = useState([]);

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
    if (selectedTool === "line") return { type: "line", start: points[0], end: points[points.length - 1] };
    if (selectedTool === "arrow") return { type: "arrow", start: points[0], end: points[points.length - 1] };
    if (selectedTool === "rect") {
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { type: "rect", x, y, w: Math.max(0.5, Math.max(...xs) - x), h: Math.max(0.5, Math.max(...ys) - y) };
    }
    if (selectedTool === "circle") {
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const w = maxX - minX, h = maxY - minY;
      if (w < 2 || h < 2) return { type: "path", points };
      return { type: "circle", cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, r: (w + h) / 4 };
    }
    return { type: "path", points: points.slice(-160) };
  };

  const start = (e) => {
    if (!drawing || tool === "eraser") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const first = pointFromEvent(e, e.currentTarget);
    activeStroke.current = [first];
    setPreviewPoints([first]);
  };

  const move = (e) => {
    if (!drawing || tool === "eraser" || !activeStroke.current) return;
    e.preventDefault();
    const pts = activeStroke.current;
    if (tool !== "pen") {
      const next = pointFromEvent(e, e.currentTarget);
      activeStroke.current = [pts[0], next];
      setPreviewPoints([pts[0], next]);
      return;
    }
    if (pts.length >= 160) return;
    const next = [...pts, pointFromEvent(e, e.currentTarget)];
    activeStroke.current = next;
    setPreviewPoints(next);
  };

  const end = (e) => {
    try { e?.currentTarget?.releasePointerCapture?.(e.pointerId); } catch {}
    const pts = activeStroke.current;
    activeStroke.current = null;
    setPreviewPoints([]);
    if (!drawing || tool === "eraser" || !pts?.length) return;
    const shape = normalizeShape(pts, tool);
    if (!shape) return;
    setStrokes(prev => [
      ...prev.slice(-19),
      { ...shape, id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, color: drawColor }
    ]);
  };

  const clear = () => {
    activeStroke.current = null;
    setPreviewPoints([]);
    setStrokes([]);
  };

  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const eraseShape = (id) => setStrokes(prev => prev.filter((shape, i) => (shape.id ?? i) !== id));

  const renderShape = (shape, i, isPreview = false) => {
    if (!shape) return null;
    const markerId = isPreview ? `kundli-arrowhead-preview-${chartKey}` : `kundli-arrowhead-${chartKey}-${shape.id ?? i}`;
    const isEraser = !isPreview && tool === "eraser" && drawing;
    const common = {
      key: shape.id ?? i,
      fill: "none",
      stroke: shape.color || "#F59E0B",
      strokeWidth: "0.65",
      style: { pointerEvents: isEraser ? "stroke" : "none", cursor: isEraser ? "pointer" : undefined },
      onPointerDown: isEraser ? (e) => { e.stopPropagation(); eraseShape(shape.id ?? i); } : undefined,
    };
    if (shape.type === "circle") return <circle {...common} cx={shape.cx} cy={shape.cy} r={shape.r} />;
    if (shape.type === "rect") return <rect {...common} x={shape.x} y={shape.y} width={shape.w} height={shape.h} />;
    if (shape.type === "line") return <line {...common} x1={shape.start.x} y1={shape.start.y} x2={shape.end.x} y2={shape.end.y} strokeLinecap="round" />;
    if (shape.type === "arrow") return <line {...common} x1={shape.start.x} y1={shape.start.y} x2={shape.end.x} y2={shape.end.y} strokeLinecap="round" markerEnd={`url(#${markerId})`} />;
    return <polyline {...common} points={(shape.points || []).map(p => `${p.x},${p.y}`).join(" ")} strokeLinecap="round" strokeLinejoin="round" />;
  };

  const tools = [
    ["pen", "Free"], ["line", "Line"], ["arrow", "Arrow"], ["circle", "Circle"], ["rect", "Rect"], ["eraser", "Eraser"],
  ];
  const colors = ["#F59E0B","#EF4444","#22D3EE","#4ADE80","#A78BFA","#F472B6","#FFFFFF"];

  const selectTool = (id) => {
    setTool(id);
    setDrawing(true);
    setToolsOpen(false);
  };

  return (
    <>
      <div className="absolute left-2 top-9 z-50 flex flex-wrap items-start gap-1 max-w-[94%]">
        <button
          type="button"
          onClick={() => setToolsOpen(v => !v)}
          className="md:hidden px-2.5 py-1 rounded-md text-[9px] font-bold border bg-slate-950/95 text-slate-300 border-slate-700 backdrop-blur"
        >
          Drawing Tools {toolsOpen ? "▴" : "▾"}
        </button>

        <div className={`${toolsOpen ? "flex" : "hidden"} md:flex flex-wrap items-center gap-1 w-full md:w-auto p-1 md:p-0 rounded-lg md:rounded-none bg-slate-950/85 md:bg-transparent border border-slate-700/60 md:border-0 backdrop-blur md:backdrop-blur-none`}>
          <button type="button" onClick={() => setDrawing(v => !v)}
            className={`px-2 py-1 rounded-md text-[9px] font-bold border backdrop-blur ${drawing ? "bg-amber-500/20 text-amber-200 border-amber-400/50" : "bg-slate-950/90 text-slate-300 border-slate-700"}`}>
            {drawing ? "Pen On" : "Draw"}
          </button>
          {tools.map(([id, label]) => (
            <button key={id} type="button" onClick={() => selectTool(id)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold border ${tool === id && drawing ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/40" : "bg-slate-950/90 text-slate-400 border-slate-700"}`}>
              {label}
            </button>
          ))}

          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-slate-700 bg-slate-950/90" title="Drawing properties / colour">
            <span className="text-[8px] text-slate-500 mr-0.5">Property</span>
            {colors.map(c => (
              <button key={c} type="button" aria-label={`Colour ${c}`} onClick={() => { setDrawColor(c); if (tool === "eraser") setTool("pen"); setDrawing(true); }}
                className="w-3.5 h-3.5 rounded-full border"
                style={{ background: c, borderColor: drawColor === c ? "white" : "rgba(255,255,255,.25)", boxShadow: drawColor === c ? "0 0 0 1px rgba(245,158,11,.8)" : "none" }} />
            ))}
          </div>

          {strokes.length > 0 && <button type="button" onClick={undo}
            className="px-2 py-1 rounded-md text-[9px] font-bold border bg-slate-950/90 text-slate-400 border-slate-700">Undo</button>}
          {strokes.length > 0 && <button type="button" onClick={clear}
            className="px-2 py-1 rounded-md text-[9px] font-bold border bg-slate-950/90 text-slate-400 border-slate-700">Clear</button>}
        </div>
      </div>

      {(drawing || strokes.length > 0) && (
        <svg className={`absolute inset-0 w-full h-full ${drawing ? "z-40 cursor-crosshair" : "z-20 pointer-events-none"}`}
          viewBox="0 0 100 100" preserveAspectRatio="none" style={drawing ? { touchAction: "none" } : undefined}
          onDoubleClick={(e) => e.preventDefault()}
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <defs>
            {(strokes || []).filter(shape => shape?.type === "arrow").map((shape, i) => (
              <marker key={`arrowhead-${shape.id ?? i}`} id={`kundli-arrowhead-${chartKey}-${shape.id ?? i}`}
                markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L5,2.5 L0,5 z" fill={shape.color || "#F59E0B"} />
              </marker>
            ))}
            {previewPoints.length > 0 && tool === "arrow" && (
              <marker id={`kundli-arrowhead-preview-${chartKey}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L5,2.5 L0,5 z" fill={drawColor || "#F59E0B"} />
              </marker>
            )}
          </defs>
          {strokes.map((shape, i) => renderShape(shape, i))}
          {drawing && tool !== "eraser" && previewPoints.length > 0 && renderShape({ ...normalizeShape(previewPoints, tool), color: drawColor }, "active", true)}
        </svg>
      )}
    </>
  );
}

function downloadVargaChart(cardEl, chartKey) {
  if (!cardEl) return;
  const svgEls = Array.from(cardEl.querySelectorAll("svg"));
  const mainSvg = svgEls.find(el => el.getAttribute("viewBox") === "0 0 440 440");
  const overlaySvg = svgEls.find(el => el.getAttribute("viewBox") === "0 0 100 100");
  if (!mainSvg) return;

  const W = 1000, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#020713";
  ctx.fillRect(0, 0, W, H);

  const drawSvg = (svg, x, y, w, h) => new Promise(resolve => {
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, x, y, w, h); URL.revokeObjectURL(url); resolve(); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });

  (async () => {
    ctx.textAlign = "center";
    ctx.font = "900 28px Inter, Arial, sans-serif";
    ctx.fillStyle = "#FCD34D";
    ctx.fillText(chartKey, W / 2, 42);

    const chartX = 20, chartY = 58, chartW = 960, chartH = 960;
    await drawSvg(mainSvg, chartX, chartY, chartW, chartH);
    if (overlaySvg) await drawSvg(overlaySvg, chartX, chartY, chartW, chartH);

    ctx.font = "700 20px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.fillText("www.kundalimaker.com", W / 2, 1055);

    const a = document.createElement("a");
    a.download = `KundaliMaker-${chartKey}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  })();
}


async function downloadVargaView(gridEl, visibleCharts, columns) {
  if (!gridEl || !visibleCharts?.length) return;

  const cards = visibleCharts.map(key => gridEl.querySelector(`[data-varga-card="${key}"]`)).filter(Boolean);
  if (!cards.length) return;

  // Compose the currently visible chart grid into one PNG, including annotations.
  const CARD_W = 760;
  const CARD_H = 830;
  const GAP = 18;
  const COLS = Math.max(1, Number(columns) || 1);
  const ROWS = Math.ceil(cards.length / COLS);
  const PAD = 18;
  const HEADER_H = 48;
  const FOOTER_H = 34;
  const W = PAD * 2 + Math.min(COLS, cards.length) * CARD_W + Math.max(0, Math.min(COLS, cards.length) - 1) * GAP;
  const H = PAD * 2 + ROWS * CARD_H + Math.max(0, ROWS - 1) * GAP;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#020713';
  ctx.fillRect(0, 0, W, H);

  const drawSvg = (svg, x, y, w, h) => new Promise(resolve => {
    if (!svg) return resolve();
    const clone = svg.cloneNode(true);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, w, h);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    img.src = url;
  });

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const key = visibleCharts[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = PAD + row * (CARD_H + GAP);

    ctx.fillStyle = '#07101f';
    ctx.strokeStyle = 'rgba(100,116,139,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_W, CARD_H, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '900 20px Inter, Arial, sans-serif';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(key, x + 18, y + 30);
    if (key === 'D1' || key === 'RTN' || key === 'YOGINI_PL') {
      ctx.font = '600 11px Inter, Arial, sans-serif';
      ctx.fillStyle = 'rgba(148,163,184,.65)';
      ctx.fillText(key === 'D1' ? 'Birth Chart' : key === 'RTN' ? 'Rashi Tulya Navamsha' : 'VP Goel · Udu Progressed Lagna', x + 54, y + 29);
    }

    const svgEls = Array.from(card.querySelectorAll('svg'));
    const mainSvg = svgEls.find(el => el.getAttribute('viewBox') === '0 0 440 440');
    const overlaySvg = svgEls.find(el => el.getAttribute('viewBox') === '0 0 100 100');
    const chartX = x + 20;
    const chartY = y + HEADER_H;
    const chartW = CARD_W - 40;
    const chartH = CARD_H - HEADER_H - FOOTER_H - 10;

    await drawSvg(mainSvg, chartX, chartY, chartW, chartH);
    if (overlaySvg) await drawSvg(overlaySvg, chartX, chartY, chartW, chartH);

    ctx.textAlign = 'center';
    ctx.font = '700 12px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fillText('www.kundalimaker.com', x + CARD_W / 2, y + CARD_H - 12);
  }

  const a = document.createElement('a');
  a.download = `KundaliMaker-Charts-View.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}


function YoginiProgressedContext({ chartData, selectedKey, onSelectKey, selectedPart, onSelectPart }) {
  const data = chartData?.enginesData?.advanced_astrology?.yogini_progressed_options;
  const cycles = data?.cycles || [];
  const rows = data?.md_options || [];
  const selected = rows.find((r) => r.key === selectedKey)
    || rows.find((r) => r.key === data?.current_key)
    || rows[0];

  const [cycle, setCycle] = useState(selected?.cycle || 1);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (selected?.cycle) setCycle(selected.cycle);
  }, [selected?.cycle]);

  if (!rows.length) return null;

  const cycleRows = rows.filter((r) => r.cycle === Number(cycle));
  const activeMd = selected && selected.cycle === Number(cycle) ? selected : cycleRows[0];
  const activeParts = activeMd?.parts || [];
  const activePart = activeParts.find((p) => p.part === Number(selectedPart)) || activeParts[0];

  const signEn = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const lordFull = {
    Ma: "Mars (मंगल)", Ve: "Venus (शुक्र)", Me: "Mercury (बुध)",
    Mo: "Moon (चंद्र)", Su: "Sun (सूर्य)", Ju: "Jupiter (गुरु)",
    Sa: "Saturn (शनि)", Ra: "Rahu (राहु)", Ke: "Ketu (केतु)"
  };

  const selectedLord = activeMd?.udu_dasha_lord;
  const natalHouse = activePart?.udu_house_natal;
  const progressedHouse = activePart?.udu_house_progressed;
  const progressedLord = activePart?.progressed_lagna_lord;

  return (
    <div className="mb-3 rounded-2xl border border-amber-500/20 bg-slate-950/70 p-3 shadow-[0_0_35px_rgba(245,158,11,.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div className="text-[13px] font-black text-amber-300">Yogini Progressed Lagna</div>
          <div className="text-[9px] text-slate-500">Choose a separate Progressed Lagna period according to the Yogini Dasha timeline</div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-[10px] border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300"
        >
          {showDetails ? "Hide Prediction Details" : "View Prediction Details"}
        </button>
      </div>

      <div className="text-[9px] text-slate-500 mb-2">
        Natal planets fixed · केवल Lagna / house framework बदलेगा
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {cycles.map((c) => (
          <button
            type="button"
            key={c.cycle}
            onClick={() => {
              setCycle(c.cycle);
              const first = rows.find((r) => r.cycle === c.cycle);
              if (first) {
                onSelectKey(first.key);
                onSelectPart(first.parts?.[0]?.part || 1);
              }
            }}
            className={`rounded-lg px-3 py-1.5 text-[10px] border ${Number(cycle) === c.cycle ? "border-amber-400 text-amber-300 bg-amber-500/10" : "border-slate-700 text-slate-400"}`}
          >
            {c.label} · {c.age_range}
          </button>
        ))}
      </div>

      <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">Yogini Dasha Period</div>
      <div className="space-y-1.5 mb-3 max-h-[310px] overflow-y-auto pr-1">
        {cycleRows.map((md) => {
          const active = md.key === activeMd?.key;
          return (
            <div
              key={md.key}
              className={`rounded-xl border ${active ? "border-amber-500/50 bg-amber-500/5" : "border-slate-800 bg-slate-900/30"}`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelectKey(md.key);
                  onSelectPart(md.current_part || 1);
                }}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-100">{md.yogini}</span>
                  <span className="text-[10px] text-cyan-300">★ {md.current_nakshatra}</span>
                  <span className="text-[9px] text-slate-500">{md.duration_years} वर्ष · Udu: {md.udu_dasha_lord_name || md.udu_dasha_lord}</span>
                </div>
                <div className="text-[10px] text-slate-300 tabular-nums">
                  {md.start_date} → {md.end_date} {active ? "▾" : "▸"}
                </div>
              </button>

              {active ? (
                <div className="px-3 pb-2 pt-1 border-t border-slate-800/70 space-y-1">
                  <div className="text-[9px] uppercase tracking-wider text-slate-600">Progressed Lagna Period</div>
                  {activeParts.map((part) => (
                    <button
                      type="button"
                      key={part.part}
                      onClick={() => onSelectPart(part.part)}
                      className={`w-full flex flex-wrap justify-between items-center text-left rounded-lg border px-2.5 py-2 gap-2 ${activePart?.part === part.part ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200" : "border-slate-800 text-slate-400"}`}
                    >
                      <span className="text-[10px] font-bold">
                        {activePart?.part === part.part ? "● " : "○ "}{part.sign} · {part.padas_label}
                      </span>
                      <span className="text-[10px] tabular-nums">{part.start_date} → {part.end_date}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {showDetails ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-2.5">
              <div className="text-[8px] uppercase tracking-wider text-slate-500">Running Yogini MD & Nakshatra</div>
              <div className="text-[11px] font-bold text-slate-100 mt-1">{activeMd?.yogini} ({activeMd?.duration_years} वर्ष)</div>
              <div className="text-[9px] text-cyan-300 mt-0.5">{activeMd?.current_nakshatra} · {activePart?.padas_label}</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
              <div className="text-[8px] uppercase tracking-wider text-slate-500">Progressed Lagna</div>
              <div className="text-[12px] font-black text-amber-300 mt-1">
                {activePart ? `${activePart.sign} (${activePart.sign_idx + 1})` : "—"}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {activePart ? signEn[activePart.sign_idx] : ""} · Lagna Lord: {lordFull[progressedLord] || progressedLord || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5">
              <div className="text-[8px] uppercase tracking-wider text-slate-500">मुख्य फलदाता · Udu Lord</div>
              <div className="text-[11px] font-black text-cyan-300 mt-1">{activeMd?.udu_dasha_lord_name || lordFull[selectedLord] || selectedLord || "—"}</div>
              <div className="text-[8px] text-slate-500 mt-0.5">Yogini नाम नहीं, progression Nakshatra का Vimshottari स्वामी मुख्य driver है</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-2.5">
              <div className="text-[8px] uppercase tracking-wider text-slate-500">Effective Date Range</div>
              <div className="text-[11px] font-bold text-slate-100 mt-1">{activePart?.start_date} → {activePart?.end_date}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">MD: {activeMd?.start_date} → {activeMd?.end_date}</div>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/35 p-2.5">
              <div className="text-[8px] text-slate-500">Natal Chart में Udu Lord</div>
              <div className="text-[10px] text-slate-200 mt-1">{lordFull[selectedLord] || selectedLord || "—"} · House {natalHouse ?? "—"}</div>
              <div className="text-[8px] text-slate-600 mt-0.5">Natal house lordship: {(activePart?.udu_lordships_natal || []).map((x) => `H${x}`).join(", ") || "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/35 p-2.5">
              <div className="text-[8px] text-slate-500">Progressed Chart में Udu Lord</div>
              <div className="text-[10px] text-slate-200 mt-1">House {progressedHouse ?? "—"} · {lordFull[selectedLord] || selectedLord || "—"}</div>
              <div className="text-[8px] text-slate-600 mt-0.5">Progressed lordships: {(activePart?.udu_lordships_progressed || []).map((x) => `H${x}`).join(", ") || "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/35 p-2.5">
              <div className="text-[8px] text-slate-500">PL Transition</div>
              <div className="text-[10px] text-slate-200 mt-1">
                {activeMd?.has_mid_dasha_pl_change ? `हाँ · ${activeMd.parts.length} parts` : "नहीं · एक ही राशि"}
              </div>
              <div className="text-[8px] text-slate-600 mt-0.5">
                {activeMd?.has_mid_dasha_pl_change
                  ? activeMd.parts.map((p) => `${p.sign} · ${p.padas_label}`).join(" → ")
                  : "This Progressed Lagna remains the same throughout the MD"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VargaGrid({ chartData }) {
  const { selectedPlanet, hoverHouse } = useKundliStore();
  const chartsGridRef = useRef(null);
  const SETTINGS_KEY = "kundli-varga-view-settings";
  const NORMAL_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60","RTN"];
  const PROGRESSED_BASE_KEYS = ["D1","D2","D3","D4","D6","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];

  const readSettings = () => {
    const fallback = {
      mode: "normal",
      viewCount: "4",
      normalSelectedCharts: ["D1"],
      progressedSelectedCharts: ["D1_PL"],
      rotation: Object.fromEntries(VARGA_KEYS.map(k => [k, 1])),
    };
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (!saved) return fallback;
      const oldSelected = Array.isArray(saved.selectedCharts) ? saved.selectedCharts : ["D1"];
      const migratedNormal = oldSelected.filter(k => NORMAL_KEYS.includes(k));
      const migratedProgressed = oldSelected
        .filter(k => k.endsWith("_PL") && PROGRESSED_BASE_KEYS.includes(k.replace(/_PL$/, "")));
      return {
        ...fallback,
        ...saved,
        mode: saved.mode === "progressed" ? "progressed" : "normal",
        viewCount: saved.viewCount || "4",
        normalSelectedCharts: Array.isArray(saved.normalSelectedCharts) ? saved.normalSelectedCharts : (migratedNormal.length ? migratedNormal : ["D1"]),
        progressedSelectedCharts: Array.isArray(saved.progressedSelectedCharts) ? saved.progressedSelectedCharts : (migratedProgressed.length ? migratedProgressed : ["D1_PL"]),
        rotation: { ...fallback.rotation, ...(saved.rotation || {}) },
      };
    } catch {
      return fallback;
    }
  };

  const initial = readSettings();
  const [mode, setMode] = useState(initial.mode);
  const [viewCount, setViewCount] = useState(initial.viewCount);
  const [normalSelectedCharts, setNormalSelectedCharts] = useState(initial.normalSelectedCharts);
  const [progressedSelectedCharts, setProgressedSelectedCharts] = useState(initial.progressedSelectedCharts);
  const [rotation, setRotation] = useState(initial.rotation);

  const progressedOptions = chartData?.enginesData?.advanced_astrology?.yogini_progressed_options || {};
  const initialPLRow = (progressedOptions.md_options || []).find(r => r.key === progressedOptions.current_key) || (progressedOptions.md_options || [])[0] || null;
  const [selectedPLKey, setSelectedPLKey] = useState(initialPLRow?.key || null);
  const [selectedPLPart, setSelectedPLPart] = useState(initialPLRow?.current_part || 1);

  useEffect(() => {
    if (progressedOptions.current_key && !progressedOptions.md_options?.some(r => r.key === selectedPLKey)) {
      const currentRow = progressedOptions.md_options?.find(r => r.key === progressedOptions.current_key);
      setSelectedPLKey(progressedOptions.current_key);
      setSelectedPLPart(currentRow?.current_part || 1);
    }
  }, [progressedOptions.current_key, progressedOptions.md_options?.length]);

  const selectedPLRow = (progressedOptions.md_options || []).find(r => r.key === selectedPLKey) || (progressedOptions.md_options || [])[0] || null;
  const selectedPLPartData = selectedPLRow?.parts?.find(p => p.part === Number(selectedPLPart)) || selectedPLRow?.parts?.[0] || null;
  const selectedProgressedLagna = selectedPLPartData ? {
    current_sign_idx: selectedPLPartData.sign_idx,
    current_sign: selectedPLPartData.sign,
    progression_nakshatra: selectedPLRow.current_nakshatra,
    progression_star_lord: selectedPLRow.udu_dasha_lord,
    start_date: selectedPLPartData.start_date,
    end_date: selectedPLPartData.end_date,
  } : (chartData.enginesData?.advanced_astrology?.progressed_lagna || null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        mode, viewCount, normalSelectedCharts, progressedSelectedCharts, rotation,
      }));
    } catch {}
  }, [mode, viewCount, normalSelectedCharts, progressedSelectedCharts, rotation]);

  const activeSelection = mode === "progressed" ? progressedSelectedCharts : normalSelectedCharts;
  const visibleCharts = activeSelection.filter(k => VARGA_KEYS.includes(k));
  const columns = viewCount === "all"
    ? Math.min(4, Math.max(1, visibleCharts.length))
    : Math.min(Number(viewCount), Math.max(1, visibleCharts.length));

  const toggleChart = (key) => {
    if (mode === "progressed") {
      setProgressedSelectedCharts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    } else {
      setNormalSelectedCharts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }
  };

  const setChartRotation = (key, value) => setRotation(prev => ({ ...prev, [key]: value }));

  const resetChartWorkspace = () => {
    setMode("normal");
    setViewCount("4");
    setNormalSelectedCharts(["D1"]);
    setProgressedSelectedCharts(["D1_PL"]);
    setRotation(Object.fromEntries(VARGA_KEYS.map(k => [k, 1])));
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        mode: "normal", viewCount: "4", normalSelectedCharts: ["D1"], progressedSelectedCharts: ["D1_PL"],
        rotation: Object.fromEntries(VARGA_KEYS.map(k => [k, 1])),
      }));
    } catch {}
  };

  const displayName = key => key.endsWith("_PL") ? key.replace(/_PL$/, "") : key;
  const chartLabel = key => key === "RTN" ? "RTN" : displayName(key);

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
            <button type="button" onClick={() => downloadVargaView(chartsGridRef.current, visibleCharts, columns)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border text-slate-300 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40"
              title="Download the current selected Charts grid as one PNG">
              Download View
            </button>
            <button type="button" onClick={resetChartWorkspace}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border text-slate-400 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40">
              Reset
            </button>
          </div>
        </div>

        <div className="flex rounded-xl border border-slate-700/50 bg-slate-950/50 p-1 mb-3 max-w-xl">
          <button type="button" onClick={() => setMode("normal")}
            className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black border ${mode === "normal" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "text-slate-400 border-transparent"}`}>
            Normal D-Charts
          </button>
          <button type="button" onClick={() => setMode("progressed")}
            className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black border ${mode === "progressed" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" : "text-slate-400 border-transparent"}`}>
            Yogini Progressed Lagna
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(mode === "normal" ? NORMAL_KEYS : PROGRESSED_BASE_KEYS.map(k => `${k}_PL`)).map(key => {
            const active = activeSelection.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleChart(key)}
                title={active ? `Remove ${chartLabel(key)}` : `Add ${chartLabel(key)}`}
                aria-pressed={active}
                className={`px-2 py-1 rounded-md text-[9px] font-bold border transition ${active ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30" : "text-slate-300 border-slate-700 hover:text-amber-300 hover:border-amber-500/40"}`}>
                {chartLabel(key)}{active ? " ✓" : " +"}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[9px] text-slate-600">
          {visibleCharts.length} charts selected · {columns} chart{columns === 1 ? "" : "s"} per row
          {mode === "normal" && activeSelection.includes("D1") && <span className="ml-2 text-slate-500">D1 is included in this same grid</span>}
          {mode === "normal" && activeSelection.includes("RTN") && <span className="ml-2 text-slate-500">RTN = D1 Lagna + D9 planet signs</span>}
          {mode === "progressed" && <span className="ml-2 text-slate-500">Natal planets fixed · selected Yogini PL changes Lagna / house framework</span>}
        </div>
      </div>

      {mode === "progressed" && <YoginiProgressedContext
        chartData={chartData}
        selectedKey={selectedPLKey}
        onSelectKey={(key) => { setSelectedPLKey(key); setSelectedPLPart(1); }}
        selectedPart={selectedPLPart}
        onSelectPart={setSelectedPLPart}
      />}

      <div ref={chartsGridRef}
        className={`grid gap-3 ${visibleCharts.length === 1 ? "place-items-center" : ""}`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {visibleCharts.map((key) => {
          const isProgressed = mode === "progressed";
          const baseKey = isProgressed ? key.replace(/_PL$/, "") : key;
          const renderKey = isProgressed ? `${baseKey}_PL` : baseKey;
          const cardKey = renderKey;
          return (
            <div key={cardKey} data-varga-card={cardKey} className={`relative min-w-0 w-full rounded-2xl border border-slate-700/40 bg-slate-900/35 p-2.5 ${visibleCharts.length === 1 ? "max-w-[560px]" : ""}`}>
              <ChartAnnotationOverlay chartKey={cardKey} />
              <div className="relative z-30 flex items-center justify-between gap-2 px-1 pb-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black tracking-wide text-amber-300">{baseKey}</span>
                  {baseKey === "D1" && <span className="text-[8px] text-slate-600">{isProgressed ? "Progressed Lagna" : "Birth Chart"}</span>}
                  {baseKey === "RTN" && <span className="text-[8px] text-slate-600">Rashi Tulya Navamsha</span>}
                  {isProgressed && <span className="text-[8px] text-cyan-700">VP Goel · Yogini PL</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-slate-600">Rotate</span>
                  <select value={rotation[cardKey] || 1} onChange={e => setChartRotation(cardKey, Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-md text-[9px] text-slate-300 px-1 py-0.5">
                    {Array.from({length:12}, (_,i) => i+1).map(n => <option key={n} value={n}>H{n}</option>)}
                  </select>
                  <button type="button" onClick={e => downloadVargaChart(e.currentTarget.closest("[data-varga-card]"), cardKey)}
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold border bg-slate-950 text-slate-300 border-slate-700 hover:text-amber-300 hover:border-amber-500/40"
                    title={`Download ${baseKey} as PNG`}>
                    Download
                  </button>
                </div>
              </div>
              {isProgressed && !selectedProgressedLagna ? (
                <div className="min-h-[280px] flex items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40 text-center px-5">
                  <div>
                    <div className="text-xs font-bold text-amber-300">Yogini Progressed Lagna तैयार हो रहा है</div>
                    <div className="text-[9px] text-slate-500 mt-1.5">Kundli पहले दिख रही है; Yogini/Progressed-Lagna engine पूरा होने के बाद chart यहाँ दिखाई देगा।</div>
                  </div>
                </div>
              ) : (
                <InteractiveKundli
                  houses={!isProgressed && (baseKey === "D1" || baseKey === "RTN") ? (chartData.houses || []) : []}
                  planets={chartData.planets || {}}
                  lagnaVargas={chartData.meta?.lagnaVargas || {}}
                  vargaKey={renderKey}
                  progressedLagna={isProgressed ? selectedProgressedLagna : null}
                  rotation={rotation[cardKey] || 1}
                  selectedPlanet={selectedPlanet}
                  onHouseHover={hoverHouse}
                  showHeader={false}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const REMOVED_DASHBOARD_TABS = new Set(["kamukta", "conclusion", "vivah", "chandra_surya", "houses"]);
const DASHBOARD_TABS = [
  { id: "charts", label: "Charts", phase: 1 },
  { id: "shadbala", label: "Shadbala", phase: 1 },
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
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {chartData.meta.sunrise && <div className="text-[10px] text-amber-400/90 font-medium">🌅 Sunrise: {chartData.meta.sunrise}</div>}
            <div className="text-[10px] text-cyan-300/90 font-medium">Weekday: {getBirthWeekday(chartData)}</div>
            <button type="button" onClick={() => exportAstroSummaryPNG(chartData)} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-200">📥 One-page Report PNG</button>
          </div>
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
    // Base/live Kundli is always D1; D10 is rendered from the Varga data separately.
    chartType: "D1",
    lat: formData?.lat ?? null,
    lon: formData?.lon ?? null,
    age: formData?.age ?? 0,
    dashaYearType: formData?.dashaYearType ?? chartData?.meta?.dashaYearType ?? 365.2425,
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
  out.push(`लग्न नक्षत्र\t${meta?.lagnaNakshatra || "—"}${meta?.lagnaNakshatraPada ? ` (Pada ${meta.lagnaNakshatraPada})` : ""}`);
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
            Opening the link automatically loads the DOB / Time / Place and the same page state.
          </span>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-4">
            <div className="text-lg font-black text-slate-100">🪐 Complete Vedic Kundli</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Vedic Jyotish Report — Swiss Ephemeris + Nadi AI</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-[10px] sm:text-[11px]">
              <div><span className="text-slate-500">Name:</span> <b className="text-slate-200">{meta?.name || "—"}</b></div>
              <div><span className="text-slate-500">Ascendant:</span> <b className="text-amber-300">{meta?.lagnaSign || meta?.lagna || "—"} {meta?.lagnaRashiDegree != null ? `${meta.lagnaRashiDegree}°` : ""}</b></div>
              <div><span className="text-slate-500">Birth Date:</span> <b className="text-slate-200">{meta?.dob || "—"}</b></div>
              <div><span className="text-slate-500">Time / Place:</span> <b className="text-slate-200">{meta?.time || "—"} | {meta?.city || "—"}</b></div>
              <div><span className="text-slate-500">Ascendant Nakshatra:</span> <b className="text-slate-200">{meta?.lagnaNakshatra || "—"}{meta?.lagnaNakshatraPada ? ` · Pada ${meta.lagnaNakshatraPada}` : ""}</b></div>
              <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-500">Current:</span> <b className="text-cyan-200">{bundle.current?.mahadasha || "—"} → {bundle.current?.antardasha || "—"} → {bundle.current?.pratyantara || "—"}</b></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3 sm:p-4">
            <div className="text-sm font-black text-cyan-300 mb-2">Select Dasha</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <DashaSelectorCard
                label="Mahadasha — Current default; select any MD"
                value={bundle.mdName}
                options={bundle.sequence}
                onChange={changeMD}
                currentValue={bundle.currentMD}
                accent="amber"
              />

              <DashaSelectorCard
                label={`Antardasha — ${bundle.mdName || "selected MD"}`}
                value={bundle.adName}
                options={bundle.ads}
                onChange={setSelectedAD}
                currentValue={bundle.currentAD}
                accent="cyan"
              />
            </div>

            <div className="mt-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[10px]">
              <span className="text-slate-500">Selected:</span>{" "}
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
              <div className="text-sm font-black text-amber-300">Planet Positions + Vargas</div>
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
              <div className="text-[11px] text-slate-500">Copy-ready Text</div>
              <div className="text-[9px] text-slate-600">Tab-separated — ready to paste into Word / Excel / Notes</div>
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
    setDashaYearType,
    resetForm,
    resetChart
  } = useKundliStore();

  const isMobile = useIsMobile();

  const handleNewKundli = () => {
    clearKundliClientState();
    resetChart();
    resetForm();
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
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
          <span>📄 Kundli PDF</span>
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

        <Link
          to="/"
          onClick={handleNewKundli}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl font-bold text-[13px] transition-all hover:scale-[1.01] active:scale-[.99] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,rgba(245,158,11,.10),rgba(168,85,247,.10))",
            border: "1.5px solid rgba(245,158,11,.28)",
            color: "#FCD34D",
            fontFamily: "'Noto Sans Devanagari', sans-serif"
          }}
        >
          <RefreshCw size={15} />
          <span>New Kundli</span>
          <span className="text-[10px] opacity-70">Fresh</span>
        </Link>
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
            Nadi AI engine loading — Yogas · Sutras · Saturn · Transits…
          </span>
          <div className="w-3 h-3 border border-t-purple-400 border-purple-400/20 rounded-full animate-spin flex-shrink-0"/>
        </div>
      )}

      {/* 4. Active dasha strip */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 border border-amber-500/20 bg-amber-500/5 flex-shrink-0 flex-wrap">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
        <span className="text-[10px] text-amber-500/70 uppercase tracking-widest">Current Dasha</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-300">{chartData.dasha.current.mahadasha}</span>
          <span className="text-slate-700 text-xs">›</span>
          <span className="text-sm text-amber-200/70">{chartData.dasha.current.antardasha}</span>
          <span className="text-slate-700 text-xs">›</span>
          <span className="text-xs text-slate-500">{chartData.dasha.current.pratyantara}</span>
        </div>
        <span className="ml-auto text-[10px] text-slate-600">Ends: {chartData.dasha.current.endDate}</span>
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
            {({ charts: "Charts", shadbala: "Shadbala", planets: "Planets", drishti: "Aspects", dasha: "Dasha", av: "Ashtakavarga", yogas: "Yogas", gochar: "Transits", advanced_yogas: "Advanced Yogas", kp_btr: "KP Rectification", prashna: "Horary Chart", chalit: "Bhava Chalit", karaka: "Karaka" }[t.id] || t.label)}
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
            {activeTab === "shadbala" && <ShadbalaPanel data={chartData.shadbala} chartData={chartData} />}
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
    currentYearType={chartData.meta?.dashaYearType || 365.2425}
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
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {chartData.meta.sunrise && <div className="text-[10px] text-amber-400/80">🌅 Sunrise: {chartData.meta.sunrise}</div>}
            <div className="text-[10px] text-cyan-300/90 font-medium">Weekday: {getBirthWeekday(chartData)}</div>
            <button type="button" onClick={() => exportAstroSummaryPNG(chartData)} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/20" title="D1/D9, Shadbala, Dasha और Ashtakavarga का एक-पृष्ठ PNG डाउनलोड करें">📥 One-page Report PNG</button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="gold">
            Ascendant: {chartData.meta.lagnaSign}
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
          { label: "Exalted",    value: exalted,     color: "#34D399" },
          { label: "Debilitated",    value: debilitated, color: "#F87171" },
          { label: "Own Sign", value: ownSign,     color: "#F59E0B" },
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