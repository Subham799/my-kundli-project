import React from 'react';

const PLANET_NAMES = {
  "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध",
  "Ju": "गुरु", "Ve": "शुक्र", "Sa": "शनि", "Ra": "राहु", "Ke": "केतु"
};

export default function KPSignificators({ kpData }) {
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
                    {/* Planet Name + Untenanted Badge */}
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
    </div>
  );
}