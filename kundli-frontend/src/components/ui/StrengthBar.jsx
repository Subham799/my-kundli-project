// components/ui/StrengthBar.jsx
import { motion } from "framer-motion";

export default function StrengthBar({ value = 0, color = "#F59E0B", delay = 0.2 }) {
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
