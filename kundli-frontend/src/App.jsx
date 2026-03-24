// App.jsx — Root component
import Header         from "./components/layout/Header";
import DashboardLayout from "./pages/DashboardLayout";

// ── Animated star field background ─────────────────────────
function StarField() {
  const stars = Array.from({ length: 130 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,
    y:     Math.random() * 100,
    size:  Math.random() * 1.6 + 0.4,
    delay: Math.random() * 5,
    dur:   Math.random() * 3 + 2,
  }));

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Gradient nebula */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 25%, rgba(99,102,241,0.11) 0%, transparent 55%)," +
            "radial-gradient(ellipse at 85% 75%, rgba(245,158,11,0.06) 0%, transparent 50%)," +
            "radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 40%)",
        }}
      />

      {/* Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left:             `${s.x}%`,
            top:              `${s.y}%`,
            width:            s.size,
            height:           s.size,
            opacity:          Math.random() * 0.55 + 0.1,
            animationName:    "starPulse",
            animationDuration:`${s.dur}s`,
            animationDelay:   `${s.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
          }}
        />
      ))}
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      {/* Global styles injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; }
        body {
          background: #020B18;
          color: #e2e8f0;
          font-family: ui-sans-serif, system-ui, sans-serif;
          overflow: hidden;
        }

        @keyframes starPulse {
          from { opacity: 0.1; }
          to   { opacity: 0.7; }
        }

        /* Custom scrollbars */
        ::-webkit-scrollbar              { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track        { background: transparent; }
        ::-webkit-scrollbar-thumb        { background: rgba(99,102,241,0.3); border-radius: 4px; }

        /* Date / time picker icon tint */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5) sepia(1) saturate(3) hue-rotate(190deg);
        }
      `}</style>

      {/* Layered background */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(30,27,75,0.6) 0%, #020B18 70%)",
          zIndex: 0,
        }}
      />
      <StarField />

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <Header />
        <DashboardLayout />
      </div>
    </>
  );
}
