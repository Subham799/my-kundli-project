// App.jsx — Root component
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import { HelmetProvider } from 'react-helmet-async'; // 🌟 SEO के लिए ज़रूरी

// 🚀 Lazy Load Pages (यह पेज तभी डाउनलोड होंगे जब यूज़र इन्हें खोलेगा)
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const ConsultancyPage = lazy(() => import("./pages/ConsultancyPage"));

// 🌟 नए ब्लॉग / केस-स्टडी पेजेस को भी Lazy Load करें
// 🌟 फाइलों का सही रास्ता (Path) अपडेट कर दिया गया है
const CaseStudyList = lazy(() => import("./components/panels/CaseStudyList"));
const CaseStudyDetail = lazy(() => import("./components/panels/CaseStudyDetail"));

// ── Animated star field background ───────────
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
          className="absolute bg-white rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.1,
            animation: `starPulse ${s.dur}s infinite alternate ${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  return (
    // 🌟 HelmetProvider से पूरी ऐप को Wrap करना ज़रूरी है
    <HelmetProvider>
      <BrowserRouter>
        {/* 1. Global Styles */}
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
          ::-webkit-scrollbar              { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track        { background: transparent; }
          ::-webkit-scrollbar-thumb        { background: rgba(99,102,241,0.3); border-radius: 4px; }
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(0.5) sepia(1) saturate(3) hue-rotate(190deg);
          }
        `}</style>

        {/* 2. Background Animation */}
        <StarField />

        {/* 3. Routes & Lazy Loading (Suspense) */}
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020B18]">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-amber-500 font-bold tracking-widest text-sm animate-pulse">KUNDALIMAKER...</p>
          </div>
        }>
          <div className="relative z-10 flex flex-col h-full">
            <Routes>
              {/* 🏠 Homepage Route */}
              <Route 
                path="/" 
                element={
                  <>
                    <Header />
                    <DashboardLayout />
                  </>
                } 
              />

              {/* 💼 Consultancy Route */}
              <Route 
                path="/consultancy" 
                element={
                  <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    <ConsultancyPage />
                  </div>
                } 
              />

              {/* 📝 Case Studies Listing Route */}
              <Route 
                path="/case-studies" 
                element={
                  <div className="h-full overflow-y-auto w-full" style={{ scrollbarWidth: "none" }}>
                    <CaseStudyList />
                  </div>
                } 
              />

              {/* 📖 Single Case Study Detail Route */}
              <Route 
                path="/case-studies/:slug" 
                element={
                  <div className="h-full overflow-y-auto w-full" style={{ scrollbarWidth: "none" }}>
                    <CaseStudyDetail />
                  </div>
                } 
              />
            </Routes>
          </div>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}