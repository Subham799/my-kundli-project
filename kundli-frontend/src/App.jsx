// App.jsx — Root component
import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import Header from "./components/layout/Header";
import { HelmetProvider } from 'react-helmet-async'; // 🌟 SEO के लिए ज़रूरी
import useKundliStore from "./store/useKundliStore";

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


// ─────────────────────────────────────────────────────────────
// SHARED KUNDLI ROUTE
// Token contains compact birth/UI state only. The same existing Zustand
// fetch flow recalculates the chart for the receiving user.
// ─────────────────────────────────────────────────────────────
const SHARED_VARGA_STORAGE_KEY = "kundli-varga-view-settings";
const SHARED_REPORT_STORAGE_KEY = "kundli-report-dasha-selection";

function decodeKundliSharePayload(token) {
  const normalized = String(token || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  const payload = JSON.parse(json);
  if (payload?.v !== 1) throw new Error("Unsupported share link version");
  return payload;
}

const VALID_SHARED_TABS = new Set([
  "charts","planets","drishti","dasha","av","yogas","advanced",
  "gochar","advanced_yogas","kp_btr","prashna","chalit","karaka"
]);

function SharedKundliPage() {
  const { token } = useParams();
  const { setForm, fetchChart, setActiveTab, selectPlanet } = useKundliStore();
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSharedKundli = async () => {
      try {
        const payload = decodeKundliSharePayload(token);
        const birth = payload?.birth || {};
        if (!birth.name || !birth.dob || !birth.time || !birth.city) {
          throw new Error("इस share link में birth details अधूरी हैं");
        }

        // Restore the same Varga workspace and report MD/AD selection before
        // the target tabs mount.
        try {
          if (payload?.ui?.varga) {
            localStorage.setItem(SHARED_VARGA_STORAGE_KEY, JSON.stringify(payload.ui.varga));
          }
          if (payload?.ui?.report) {
            localStorage.setItem(SHARED_REPORT_STORAGE_KEY, JSON.stringify(payload.ui.report));
            if (payload.ui.report.openReport) localStorage.setItem("kundli-shared-report-open", "1");
          }
          localStorage.setItem("kundli-shared-ui-state", JSON.stringify(payload.ui || {}));
        } catch {}

        useKundliStore.getState().resetChart();

        const fields = {
          name: birth.name,
          dob: birth.dob,
          time: birth.time,
          city: birth.city,
          chartType: birth.chartType || "D1",
          lat: birth.lat ?? null,
          lon: birth.lon ?? null,
          age: birth.age || 0,
        };
        Object.entries(fields).forEach(([key, value]) => setForm(key, value));

        await fetchChart(Number(birth.dashaYearType || 360.0));
        const stateAfterFetch = useKundliStore.getState();
        if (!stateAfterFetch.chartData) {
          throw new Error(stateAfterFetch.error || "Kundli load नहीं हो पाई");
        }

        if (cancelled) return;

        const requestedTab = VALID_SHARED_TABS.has(payload?.ui?.activeTab)
          ? payload.ui.activeTab
          : "planets";
        setActiveTab(requestedTab);

        // setActiveTab clears the drawer, so restore the selected planet after it.
        if (payload?.ui?.selectedPlanet) {
          selectPlanet(payload.ui.selectedPlanet);
        }
        setShareError("");
      } catch (error) {
        if (!cancelled) setShareError(error?.message || "Invalid Kundli share link");
      }
    };

    loadSharedKundli();
    return () => { cancelled = true; };
  }, [token, setForm, fetchChart, setActiveTab, selectPlanet]);

  if (shareError) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 bg-[#020B18]">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-slate-900/60 p-6 text-center">
            <div className="text-lg font-black text-rose-300 mb-2">Kundli Link नहीं खुल पाया</div>
            <div className="text-sm text-slate-400 mb-4">{shareError}</div>
            <a href="/" className="inline-flex px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-bold">
              नई Kundli बनाएं
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <DashboardLayout />
    </>
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

              {/* 🔗 Shared Kundli Route — opens the same pre-filled chart state */}
              <Route path="/kundli/share/:token" element={<SharedKundliPage />} />

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