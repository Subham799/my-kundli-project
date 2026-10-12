// components/ui/GlassCard.jsx
export default function GlassCard({ children, className = "", onClick, hover = false }) {
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
