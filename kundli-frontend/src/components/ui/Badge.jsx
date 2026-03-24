// components/ui/Badge.jsx
const VARIANTS = {
  default: "bg-slate-700/60    text-slate-300  border-slate-600/50",
  gold:    "bg-amber-500/15   text-amber-300  border-amber-500/30",
  cyan:    "bg-cyan-500/15    text-cyan-300   border-cyan-500/30",
  rose:    "bg-rose-500/15    text-rose-300   border-rose-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  violet:  "bg-violet-500/15  text-violet-300 border-violet-500/30",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
        "text-[10px] font-semibold border tracking-wider uppercase",
        VARIANTS[variant] ?? VARIANTS.default,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
