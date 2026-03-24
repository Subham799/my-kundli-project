// components/layout/InputSidebar.jsx
import { motion } from "framer-motion";
import { User, Calendar, Clock, MapPin, Layers, Zap } from "lucide-react";
import useKundliStore from "../../store/useKundliStore";
import { CHART_TYPES } from "../../constants";

// ── Field config ────────────────────────────────────────────
const FIELDS = [
  { label: "पूर्ण नाम",    key: "name", type: "text",  placeholder: "जैसे: अर्जुन शर्मा", Icon: User     },
  { label: "जन्म तिथि",   key: "dob",  type: "date",  placeholder: "",                   Icon: Calendar },
  { label: "जन्म समय",   key: "time", type: "time",  placeholder: "",                   Icon: Clock    },
  { label: "जन्म शहर",   key: "city", type: "text",  placeholder: "जैसे: नई दिल्ली",      Icon: MapPin   },
];

// ── Shared input className ──────────────────────────────────
const inputCls = [
  "w-full px-4 py-3 rounded-xl border border-slate-700/60",
  "bg-slate-800/50 backdrop-blur-sm",
  "text-slate-200 placeholder-slate-500 text-sm",
  "focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30",
  "transition-all duration-200",
].join(" ");

export default function InputSidebar() {
  const { formData, loading, error, sidebarCollapsed, setForm, fetchChart, loadDemo } =
    useKundliStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 0 : 320, opacity: sidebarCollapsed ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-10 overflow-hidden flex-shrink-0 border-r border-slate-800/60"
      style={{ background: "rgba(2,11,24,0.72)", backdropFilter: "blur(24px)" }}
    >
      {/* Fixed-width inner — prevents layout shift during animation */}
      <div className="w-[320px] h-full overflow-y-auto flex flex-col gap-6 p-6">

        {/* Heading */}
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-1">जन्म विवरण</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter details to generate your complete Vedic chart analysis.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Input fields */}
        <div className="flex flex-col gap-4">
          {FIELDS.map(({ label, key, type, placeholder, Icon }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2">
                <Icon size={12} className="text-amber-500/80" />
                {label}
              </label>
              <input
                type={type}
                value={formData[key]}
                placeholder={placeholder}
                onChange={(e) => setForm(key, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}

          {/* Chart type selector */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2">
              <Layers size={12} className="text-amber-500/80" />
              Varga Chart
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CHART_TYPES.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm("chartType", c)}
                  className={[
                    "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border",
                    formData.chartType === c
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={fetchChart}
          disabled={loading}
          className={[
            "w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all active:scale-95",
            "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950",
            "shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500",
            loading ? "opacity-60 cursor-wait" : "",
          ].join(" ")}
        >
          {loading ? "⟳ Calculating…" : "कुंडली बनाएं ✦"}
        </button>

        {/* Demo shortcut */}
        <button
          onClick={loadDemo}
          className="w-full py-3 rounded-xl font-medium text-sm text-slate-400 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:text-slate-300 transition-all flex items-center justify-center gap-2"
        >
          <Zap size={13} />
          डेमो लोड Chart
        </button>

        {/* Footer note */}
        <div className="mt-auto p-4 rounded-xl border border-slate-700/30 bg-slate-800/20">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Powered by Swiss Ephemeris. Supports all 16 Varga charts, Vimshottari Dasha,
            Ashtakavarga, and Nadi AI engine.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
