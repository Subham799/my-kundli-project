// src/components/shared/ui.jsx
// ─── Reusable UI primitives ───────────────────────────────────
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const HI = { fontFamily: "'Noto Sans Devanagari', sans-serif" };

// ── StatusPill ────────────────────────────────────────────────
// Usage: <StatusPill color="#22D3EE" label="उच्च" />
export function StatusPill({ label, color = "#F59E0B", size = "sm" }) {
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-0.5 text-[9px]";
  return (
    <span
      className={`${pad} rounded-full font-bold inline-flex items-center`}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
        ...HI,
      }}
    >
      {label}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────────
// Usage: <EmptyState icon="🔮" message="डेटा उपलब्ध नहीं" />
export function EmptyState({ icon = "🔮", message = "डेटा उपलब्ध नहीं", subtext = "" }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="text-4xl">{icon}</div>
      <div className="text-sm text-slate-500 text-center" style={HI}>
        {message}
      </div>
      {subtext && (
        <div className="text-xs text-slate-700 text-center" style={HI}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
// Usage: <Card color="#F59E0B">...</Card>
export function Card({ children, color = "#F59E0B", className = "" }) {
  return (
    <div
      className={`p-4 rounded-2xl border mb-3 ${className}`}
      style={{ background: "rgba(8,12,28,.97)", borderColor: `${color}30` }}
    >
      {children}
    </div>
  );
}

// ── SectionLabel / SLabel (divider with text) ────────────────
// Usage: <SectionLabel color="#22D3EE">पंच महापुरुष</SectionLabel>
export function SectionLabel({ children, color = "#F59E0B" }) {
  return (
    <div
      className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
      style={{ color }}
    >
      <span className="flex-1 h-px" style={{ background: `${color}30` }} />
      <span style={HI}>{children}</span>
      <span className="flex-1 h-px" style={{ background: `${color}30` }} />
    </div>
  );
}
// Alias — both names work
export const SLabel = SectionLabel;

// ── CollapsibleSection ────────────────────────────────────────
// Usage: <CollapsibleSection icon="🦢" title="..." color="#22D3EE" defaultOpen>
export function CollapsibleSection({
  icon,
  title,
  color = "#F59E0B",
  children,
  defaultOpen = false,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
        style={{ background: `${color}12`, border: `1.5px solid ${color}30` }}
      >
        {icon && <span className="text-[20px] flex-shrink-0">{icon}</span>}
        <span
          className="text-[14px] font-black flex-1 text-left"
          style={{ color, ...HI }}
        >
          {title}
        </span>
        {badge != null && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: `${color}18`,
              color,
              border: `1px solid ${color}28`,
              ...HI,
            }}
          >
            {badge}
          </span>
        )}
        {open ? (
          <ChevronUp size={16} style={{ color }} />
        ) : (
          <ChevronDown size={16} style={{ color }} />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden pt-2 px-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────
// Usage: <ProgressBar value={75} max={150} color="#22D3EE" delay={0.1} />
export function ProgressBar({ value, max = 100, color, delay = 0, height = "h-1.5" }) {
  const pct = Math.min(value / max, 1);
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 ${height} rounded-full`}
        style={{ background: "rgba(255,255,255,.06)" }}
      >
        <motion.div
          className={`h-full rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      <span
        className="text-[10px] font-black w-8 text-right flex-shrink-0"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

// ── RiskRing (SVG circle progress) ───────────────────────────
// Usage: <RiskRing value={72} size={46} />
export function RiskRing({ value, size = 46, color }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const col =
    color ||
    (value >= 70 ? "#FB7185" : value >= 40 ? "#F59E0B" : value >= 20 ? "#FDE68A" : "#4ADE80");
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.05)"
          strokeWidth="5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 3px ${col}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black leading-none" style={{ color: col }}>
          {value}
        </span>
        <span className="text-[6px] text-slate-700">/100</span>
      </div>
    </div>
  );
}

// ── PlanetChip ────────────────────────────────────────────────
// Usage: <PlanetChip code="Ju" meta={PLANET_META["Ju"]} />
export function PlanetChip({ code, meta = {} }) {
  return (
    <span
      className="text-[13px]"
      style={{ color: meta.color || "#94A3B8" }}
      title={meta.label || code}
    >
      {meta.symbol || code[0]}
    </span>
  );
}

// ── CardBlock ─────────────────────────────────────────────────
// Collapsible block with icon + title header (used in YogaPanel,
// MasterConclusion, etc.)
// Usage: <CardBlock icon="👑" title="राज योग" accent="#F59E0B" defaultOpen>
export function CardBlock({ icon, title, badge, accent = "#F59E0B", defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,.06)",
        background: "linear-gradient(145deg,rgba(10,14,32,.98),rgba(5,8,22,.99))",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[.03] transition-colors"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}
        >
          <span style={{ fontSize: 14 }}>{icon}</span>
        </div>
        <span
          className="text-[12px] font-black text-white flex-1"
          style={{ fontFamily: "'Cinzel',serif" }}
        >
          {title}
        </span>
        {badge && (
          <span
            className="text-[8px] px-2 py-0.5 rounded-full font-bold"
            style={{
              background: `${accent}18`,
              color: accent,
              border: `1px solid ${accent}28`,
              fontFamily: "'Noto Sans Devanagari',sans-serif",
            }}
          >
            {badge}
          </span>
        )}
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={13} className="text-slate-600" />
        </motion.div>
      </button>
      {/* accent line */}
      <div className="h-px mx-4" style={{ background: open ? `${accent}28` : "transparent" }} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-4 pb-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── GlassCard ─────────────────────────────────────────────────
// Re-export pattern — wraps the ui/GlassCard style inline so
// panels don't need a second import path.
// Usage: <GlassCard hover>...</GlassCard>
export function GlassCard({ children, className = "", onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={[
        "relative rounded-2xl border border-slate-700/50",
        "bg-gradient-to-br from-slate-800/60 to-slate-900/80",
        "backdrop-blur-xl shadow-xl",
        hover
          ? "cursor-pointer transition-all duration-300 hover:border-slate-500/70 hover:shadow-2xl hover:scale-[1.02]"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── StrengthBar ───────────────────────────────────────────────
// Thin animated horizontal bar (0–100 range).
// Usage: <StrengthBar value={75} color="#22D3EE" delay={0.2} />
export function StrengthBar({ value = 0, color = "#F59E0B", delay = 0.2 }) {
  return (
    <div className="relative h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, ease: "easeOut", delay }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// ── RingGauge (SVG arc gauge) ─────────────────────────────────
// Like RiskRing but with label below value.
// Usage: <RingGauge value={72} max={100} size={56} label="बल" color="#22D3EE" />
export function RingGauge({ value = 0, max = 100, size = 56, color, label = "" }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  const col = color || (pct >= 0.7 ? "#22D3EE" : pct >= 0.4 ? "#F59E0B" : "#FB7185");
  return (
    <div className="relative flex-shrink-0 flex flex-col items-center gap-0.5" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(255,255,255,.06)" strokeWidth="6" />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={col} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 3px ${col}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black" style={{ color: col }}>{value}</span>
        </div>
      </div>
      {label && (
        <span className="text-[9px] text-slate-500 text-center leading-tight"
          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{label}</span>
      )}
    </div>
  );
}

// ── ScoreHero (large centered score display) ──────────────────
// Usage: <ScoreHero score={82} label="कुल बल" color="#22D3EE" icon="⭐" />
export function ScoreHero({ score, max = 100, label = "", color = "#F59E0B", icon, sublabel = "" }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {icon && <div className="text-4xl mb-1">{icon}</div>}
      <div className="relative w-24 h-24">
        <svg width={96} height={96} className="-rotate-90">
          <circle cx={48} cy={48} r={40} fill="none"
            stroke="rgba(255,255,255,.05)" strokeWidth="7" />
          <motion.circle cx={48} cy={48} r={40} fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={251.2}
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 * (1 - pct / 100) }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
          {max !== 100 && (
            <span className="text-[9px] text-slate-600">/{max}</span>
          )}
        </div>
      </div>
      {label && (
        <div className="text-[13px] font-bold text-slate-300 text-center"
          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{label}</div>
      )}
      {sublabel && (
        <div className="text-[10px] text-slate-600 text-center"
          style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{sublabel}</div>
      )}
    </div>
  );
}