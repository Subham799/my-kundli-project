import React from 'react';
import useKundliStore from "../../store/useKundliStore";

const PLANET_NAMES = {
  "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध",
  "Ju": "गुरु", "Ve": "शुक्र", "Sa": "शनि", "Ra": "राहु", "Ke": "केतु"
};

// 🔮 KP AI Predictions Dashboard Component (Dark Theme UI)
const KPPredictionsDashboard = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-sm text-center font-bold">
        ⚠️ AI Insights अभी लोड नहीं हुए हैं। कृपया बाईं ओर से "कुंडली बनाएं" (New Chart) बटन पर दोबारा क्लिक करें ताकि बैकएंड से नया डेटा आ सके।
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center">
        <span className="mr-2">🔮</span> KP AI Insights (Probability Engine)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((pred, index) => (
          <div key={index} className="bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            
            {/* Header: Topic & Timing Status */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center">
              <span className="font-bold text-base text-cyan-400">{pred.topic}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-600 text-slate-300">
                {pred.timing_status}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Scores: Promise vs Stress */}
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                <div className="text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Promise</div>
                  <div className="text-xl font-black text-emerald-400">{pred.promise_score}%</div>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Stress/Delay</div>
                  <div className="text-xl font-black text-rose-400">{pred.stress_score}%</div>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Current Timing</div>
                  <div className="text-xl font-black text-cyan-400">{pred.timing_score}%</div>
                </div>
              </div>

              {/* Logical Details */}
              <div className="space-y-3">
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  <span className="text-amber-400 mr-1">📢</span> 
                  {pred.details || pred.logic.split('|')[0]}
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 italic leading-relaxed">
                  <strong className="text-slate-300">Technical Logic:</strong> {pred.logic}
                </div>
                <div className="text-[11px] text-cyan-400/80 font-medium italic">
                  ⏳ <strong className="text-cyan-400">Timing Check:</strong> {pred.timing_logic}
                </div>
              </div>

              {/* Active Houses Chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50 mt-2">
                {pred.positive_houses.map(h => (
                  <span key={h} className="bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-bold border border-emerald-500/30">
                    House {h} (+)
                  </span>
                ))}
                {pred.negative_houses.map(h => (
                  <span key={h} className="bg-rose-900/30 text-rose-400 text-[10px] px-2 py-0.5 rounded-md font-bold border border-rose-500/30">
                    House {h} (-)
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-[10px] text-slate-500 italic text-center mt-4">
        *नोट: यह विश्लेषण 4-Step KP प्रॉमिस और वर्तमान DBA (दशा-भुक्ति-अंतरा) पर आधारित है।
      </p>
    </div>
  );
};

// Main KPSignificators Component
export default function KPSignificators() {
  const { chartData } = useKundliStore();
  
  const kpData = chartData?.enginesData?.kp_significators;
  const predictions = chartData?.enginesData?.kp_predictions; 

  if (!kpData) {
    return (
      <div className="p-4 mb-6 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs">
        ❌ Error: बैकएंड से KP डेटा प्राप्त नहीं हुआ।
      </div>
    );
  }

  if (kpData.computed === false) {
    return (
      <div className="p-4 mb-6 bg-amber-900/20 border border-amber-500/50 rounded-lg text-amber-200 text-xs">
        ⚠️ बैकएंड एरर: {kpData.error || "Unknown Error"}
      </div>
    );
  }

  const { significators, cusp_significators } = kpData;
  
  if (!significators) {
    return null;
  }

  const planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"];
  const houses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="space-y-8 mb-8">
      
      {/* ─── 1. ग्रहों की 4-Step टेबल (Planet Significators) ─── */}
      <div>
        <div className="flex items-center gap-3 mb-2 px-1">
          <span className="text-2xl animate-pulse">🎯</span>
          <div>
            <h3 className="text-amber-500 font-bold text-lg leading-tight" style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
              Advanced KP कारकेश (Planets 4-Step)
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Sign Lord → Star Lord (NL) → Sub Lord (SL) → Sub-Sub Lord (SSL)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl bg-slate-950/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-800/80 text-[10px] uppercase tracking-tighter">
              <tr>
                <th className="p-3 text-amber-500 border-r border-b border-white/5 font-black text-center">ग्रह</th>
                <th className="p-3 text-slate-400 border-r border-b border-white/5 text-center">राशि स्वामी</th>
                <th className="p-3 text-cyan-400 border-r border-b border-white/5 text-center bg-cyan-900/10">NL (Star)</th>
                <th className="p-3 text-purple-400 border-r border-b border-white/5 text-center bg-purple-900/10">SL (Sub)</th>
                <th className="p-3 text-pink-400 border-r border-b border-white/5 text-center">SSL</th>
                <th className="p-3 text-green-400 border-r border-b border-white/5 text-center font-bold">L1<br/><span className="text-[8px] opacity-50">(NL Pos)</span></th>
                <th className="p-3 text-green-400 border-r border-b border-white/5 text-center font-bold">L2<br/><span className="text-[8px] opacity-50">(Grah Pos)</span></th>
                <th className="p-3 text-amber-400 border-r border-b border-white/5 text-center font-bold">L3<br/><span className="text-[8px] opacity-50">(NL Rashi)</span></th>
                <th className="p-3 text-amber-400 border-b border-white/5 text-center font-bold">L4<br/><span className="text-[8px] opacity-50">(Grah Rashi)</span></th>
              </tr>
            </thead>
            <tbody className="text-[12px] text-slate-200" style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
              {planets.map((p, idx) => {
                const sig = significators[p];
                if (!sig) return null;
                return (
                  <tr key={p} className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                    <td className="p-3 border-r border-white/5 font-bold text-amber-400 bg-slate-900/50 text-center relative">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span>{PLANET_NAMES[p] || p}</span>
                        {sig.is_untenanted && (
                          <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/50 leading-none whitespace-nowrap" title="Untenanted (कोई अन्य ग्रह इसके नक्षत्र में नहीं है)">
                            ⭐ बलवान
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r border-white/5 text-center text-slate-300">{PLANET_NAMES[sig.kp?.SignLord] || sig.kp?.SignLord || "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center text-cyan-300 font-black bg-cyan-900/5">{PLANET_NAMES[sig.kp?.NL] || sig.kp?.NL || "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center text-purple-300 font-black bg-purple-900/5">{PLANET_NAMES[sig.kp?.SL] || sig.kp?.SL || "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center text-pink-300 font-medium">{PLANET_NAMES[sig.kp?.SSL] || sig.kp?.SSL || "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center font-black text-green-400 text-sm">{Array.isArray(sig.L1) && sig.L1.length > 0 ? sig.L1.join(", ") : "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center font-bold text-green-500/70">{Array.isArray(sig.L2) && sig.L2.length > 0 ? sig.L2.join(", ") : "—"}</td>
                    <td className="p-3 border-r border-white/5 text-center font-bold text-amber-500/70">{Array.isArray(sig.L3) && sig.L3.length > 0 ? sig.L3.join(", ") : "—"}</td>
                    <td className="p-3 text-center font-bold text-slate-500">{Array.isArray(sig.L4) && sig.L4.length > 0 ? sig.L4.join(", ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 2. भावों की 4-Step टेबल (Cuspal Sub-Lords) ─── */}
      {cusp_significators && (
        <div>
          <div className="flex items-center gap-3 mb-2 px-1">
            <span className="text-2xl animate-pulse">🏛️</span>
            <div>
              <h3 className="text-cyan-400 font-bold text-lg leading-tight" style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                Cuspal Sub-Lords (भाव उप-स्वामी)
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                भाव प्रॉमिस (Event Promise) तय करने के लिए 1 से 12 भाव
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl bg-slate-950/50 backdrop-blur-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-800/80 text-[10px] uppercase tracking-tighter">
                <tr>
                  <th className="p-3 text-cyan-400 border-r border-b border-white/5 font-black text-center w-16">भाव</th>
                  <th className="p-3 text-slate-400 border-r border-b border-white/5 text-center">राशि स्वामी (Sign)</th>
                  <th className="p-3 text-amber-400 border-r border-b border-white/5 text-center bg-amber-900/10">NL (Star)</th>
                  <th className="p-3 text-purple-400 border-r border-b border-white/5 text-center bg-purple-900/10">SL (Sub Lord)</th>
                  <th className="p-3 text-pink-400 border-b border-white/5 text-center">SSL (Sub-Sub)</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-200" style={{ fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                {houses.map((h, idx) => {
                  const cSig = cusp_significators[h];
                  if (!cSig) return null;
                  
                  return (
                    <tr key={h} className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}>
                      <td className="p-3 border-r border-white/5 font-bold text-cyan-400 bg-slate-900/50 text-center text-sm">{h}</td>
                      <td className="p-3 border-r border-white/5 text-center text-slate-300">{PLANET_NAMES[cSig.SignLord] || cSig.SignLord || "—"}</td>
                      <td className="p-3 border-r border-white/5 text-center text-amber-300 font-black bg-amber-900/5">{PLANET_NAMES[cSig.NL] || cSig.NL || "—"}</td>
                      <td className="p-3 border-r border-white/5 text-center text-purple-300 font-black bg-purple-900/5">{PLANET_NAMES[cSig.SL] || cSig.SL || "—"}</td>
                      <td className="p-3 text-center text-pink-300 font-medium">{PLANET_NAMES[cSig.SSL] || cSig.SSL || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note Footer */}
      <div className="flex gap-4 mt-2">
        <div className="flex-1 text-[10px] text-slate-500 bg-white/5 p-3 rounded-xl border border-white/10 italic">
          💡 <strong>नियम:</strong> KP में ग्रह घटना का <strong>समय</strong> बताते हैं, जबकि Cuspal Sub-Lord (भाव उप-स्वामी) यह तय करते हैं कि वह घटना जीवन में <strong>घटेगी या नहीं</strong>।
        </div>
        <div className="flex-1 text-[10px] text-green-400 bg-green-900/10 p-3 rounded-xl border border-green-500/20 italic">
          ⭐ <strong>Untenanted (बलवान):</strong> जिस ग्रह के आगे यह बैज है, उसके नक्षत्र में कोई अन्य ग्रह नहीं बैठा है। यह KP में <strong>सबसे अधिक शक्तिशाली</strong> होता है और अपने भावों (L2, L4) का 100% फल देता है!
        </div>
      </div>

      {/* ─── 3. 🔮 KP AI Predictions Dashboard (Dark Theme) ─── */}
      {/* <KPPredictionsDashboard predictions={predictions} /> */}
    </div>
  );
}