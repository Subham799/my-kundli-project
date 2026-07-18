// constants.js — Unified Premium Design System
// Philosophy: Amber/Gold primary · Cyan = positive · Rose = negative · White = content

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
import { HeartPulse } from "lucide-react";
export const THEME = {
  // Backgrounds
  bg:          "bg-gray-950",          // #030712
  bgCard:      "bg-slate-900/80",
  bgInset:     "bg-slate-950/70",

  // Primary accent — Amber/Gold
  amber:       "#F59E0B",
  amberGlow:   "rgba(245,158,11,0.35)",
  amberBorder: "border-amber-500/25",
  amberText:   "text-amber-400",

  // Good — Neon Cyan (Exalted / Own Sign / Yogakaraka only)
  cyan:        "#22D3EE",
  cyanGlow:    "rgba(34,211,238,0.3)",

  // Bad — Soft Rose (Debilitated / Risk / Malefic)
  rose:        "#FB7185",
  roseGlow:    "rgba(251,113,133,0.3)",

  // Neutral content
  textPrimary:   "text-white",
  textSecondary: "text-slate-400",
  textMuted:     "text-slate-600",
  border:        "border-slate-800",
  borderSubtle:  "border-slate-800/60",
};

// ─────────────────────────────────────────────────────────────
// PLANET META — Unified palette (amber for most, cyan/rose for extremes)
// ─────────────────────────────────────────────────────────────
export const PLANET_META = {
  Su: { color: "#FCD34D", glow: "rgba(252,211,77,0.40)",  symbol: "☉", label: "Surya",   hindi: "सूर्य",  hi: "सू" },
  Mo: { color: "#E2E8F0", glow: "rgba(226,232,240,0.35)", symbol: "☽", label: "Chandra", hindi: "चंद्र",  hi: "चं" },
  Ma: { color: "#FB7185", glow: "rgba(251,113,133,0.40)", symbol: "♂", label: "Mangal",  hindi: "मंगल",  hi: "मं" },
  Me: { color: "#86EFAC", glow: "rgba(134,239,172,0.38)", symbol: "☿", label: "Budha",   hindi: "बुध",   hi: "बु" },
  Ju: { color: "#FDE68A", glow: "rgba(253,230,138,0.42)", symbol: "♃", label: "Guru",    hindi: "गुरु",  hi: "गु" },
  Ve: { color: "#FDA4AF", glow: "rgba(253,164,175,0.38)", symbol: "♀", label: "Shukra",  hindi: "शुक्र", hi: "शु" },
  Sa: { color: "#CBD5E1", glow: "rgba(203,213,225,0.35)", symbol: "♄", label: "Shani",   hindi: "शनि",   hi: "श"  },
  Ra: { color: "#A5B4FC", glow: "rgba(165,180,252,0.38)", symbol: "☊", label: "Rahu",    hindi: "राहु",  hi: "रा" },
  Ke: { color: "#94A3B8", glow: "rgba(148,163,184,0.32)", symbol: "☋", label: "Ketu",    hindi: "केतु",  hi: "के" },
  La: { color: "#22D3EE", glow: "rgba(34,211,238,0.55)",  symbol: "↑", label: "Lagna",   hindi: "लग्न",  hi: "ल"  },
};

// ─────────────────────────────────────────────────────────────
// DIGNITY STYLES — Functional (positive=cyan, negative=rose, neutral=amber)
// ─────────────────────────────────────────────────────────────
export const DIGNITY_STYLE = {
  Uchcha:       "text-cyan-300 bg-cyan-500/12 ring-1 ring-cyan-400/30",
  Swa:          "text-cyan-300 bg-cyan-500/10 ring-1 ring-cyan-400/25",
  Moolatrikona: "text-amber-300 bg-amber-500/12 ring-1 ring-amber-400/30",
  Sama:         "text-slate-400 bg-slate-700/30 ring-1 ring-slate-600/20",
  Neecha:       "text-rose-300 bg-rose-500/12 ring-1 ring-rose-400/30",
  "—":          "text-slate-600 bg-slate-800/30",
};

// ─────────────────────────────────────────────────────────────
// HOUSE CATEGORY COLORS
// ─────────────────────────────────────────────────────────────
export const HOUSE_CAT_COLOR = {
  "केंद्र":    { stroke: "#22D3EE", fill: "rgba(34,211,238,0.07)" },
  "त्रिकोण":  { stroke: "#86EFAC", fill: "rgba(134,239,172,0.07)" },
  "त्रिक":    { stroke: "#FB7185", fill: "rgba(251,113,133,0.07)" },
  "उपचय":     { stroke: "#FCD34D", fill: "rgba(252,211,77,0.06)"  },
  "मारक":     { stroke: "#C4B5FD", fill: "rgba(196,181,253,0.06)" },
  "default":  { stroke: "rgba(100,116,139,0.3)", fill: "rgba(2,6,20,0.7)" },
};

export const CHART_TYPES = [
  "D1","D2","D3","D4","D7","D9","D10",
  "D12","D16","D20","D24","D27","D30","D40","D45","D60",
];

export const TABS = [
  // ── Phase 1 tabs (fast — no enginesData needed) ──
  { id: "planets",    label: "ग्रह",        phase: 1 },
  { id: "drishti",    label: "दृष्टि",      phase: 1 },
  { id: "dasha",      label: "दशा",         phase: 1 },
  { id: "av",         label: "AV",           phase: 1 },
  { id: "houses",     label: "भाव",          phase: 1 },
  { id: "conclusion", label: "निष्कर्ष",    phase: 1 },
  // ── Phase 2 tabs (need enginesData) ──
  { id: "yogas",      label: "योग",          phase: 2 },
  { id: "advanced",   label: "विस्तृत AV",   phase: 2 },
  { id: "kamukta",    label: "💕 कामुकता",   phase: 2 },
  { id: "gochar",     label: "🌍 गोचर",      phase: 2 },
  // ── Nadi Jyotish mega-tab ──
  { id: "nadi",       label: "🔮 नाड़ी ज्योतिष", phase: 2 },
  { id: "av_sutras",      label: "🔢 AV सूत्र",    phase: 2 },
  { id: "chandra_surya",  label: "🌙 चंद्र-सूर्य",  phase: 2 },
  { id: "advanced_yogas", label: "⚡ उन्नत योग",    phase: 2 },
  { id: "kp_btr",         label: "🔗 KP शुद्धि",      phase: 2 },
  { id: "vivah",           label: "💍 विवाह",           phase: 2 },
  { id: "prashna",           label: "🔯 प्रश्न कुण्डली",           phase: 2 },
  { id: "chalit", label: "🔯 चलित कुण्डली", phase: 2 },
  { id: "karaka", label: "🔯 karak", phase: 2 },

  
   
];

// ─────────────────────────────────────────────────────────────
// SUTRA TOPICS — Architecture v2 (15 life topics)
// id must match nadi_jyotish_engine.build_sutra_topics() keys
// ─────────────────────────────────────────────────────────────
export const SUTRA_TOPICS = [
  { id: "vivah",      label: "💑 विवाह",     house: 7,  karak: "शुक्र"    },
  { id: "santan",     label: "👶 संतान",     house: 5,  karak: "गुरु"     },
  { id: "career",     label: "💼 करियर",     house: 10, karak: "शनि"      },
  { id: "dhan",       label: "💰 धन",        house: 2,  karak: "गुरु"     },
  { id: "ayu",        label: "⏳ आयु",       house: 8,  karak: "शनि"      },
  { id: "swasthya",   label: "🏥 स्वास्थ्य", house: 6,  karak: "शनि"      },
  { id: "manas",      label: "🧠 मानसिक",    house: 4,  karak: "चंद्र"    },
  { id: "durghatna",  label: "⚡ दुर्घटना",  house: 8,  karak: "मंगल"     },
  { id: "astham",     label: "🏛 अष्टम",     house: 8,  karak: "शनि"      },
  { id: "court",      label: "⚖ कोर्ट",     house: 6,  karak: "शनि"      },
  { id: "property",   label: "🏠 संपत्ति",   house: 4,  karak: "मंगल"     },
  { id: "videsh",     label: "✈ विदेश",     house: 12, karak: "राहु"     },
  { id: "mata",       label: "🌸 माता",      house: 4,  karak: "चंद्र"    },
  { id: "pita",       label: "🙏 पिता",      house: 9,  karak: "सूर्य"    },
  { id: "bhai_behen", label: "👫 भाई-बहन",  house: 3,  karak: "मंगल"     },
  { id: "charitra",   label: "💞 चरित्र",   house: 7,  karak: "शुक्र"    },
];