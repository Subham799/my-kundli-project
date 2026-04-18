// components/layout/Header.jsx
import { Moon, Menu, XCircle } from "lucide-react";
import useKundliStore from "../../store/useKundliStore";

export default function Header() {
  const { chartData, toggleSidebar, resetChart } = useKundliStore();

  return (
    <header className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-2xl flex-shrink-0">
      {/* Left — Toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse" />
            <Moon size={17} className="text-amber-400 relative z-10" />
          </div>
          <div>
            <div
              className="font-bold tracking-wide text-amber-100 text-[17px] leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              वैदिक ज्योतिष 
            </div>
            <div className="text-[9px] tracking-[0.3em] text-slate-500 uppercase">
              Vedic Astrology Engine
            </div>
          </div>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {chartData && (
          <button
            onClick={resetChart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs transition-all hover:border-slate-600"
          >
            <XCircle size={13} />
            New Chart
          </button>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold tracking-widest">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
