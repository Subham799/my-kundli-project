import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HI = { fontFamily: "'Noto Sans Devanagari', sans-serif" };

const PLANETS = [
  { k: "Su", hi: "सूर्य", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { k: "Mo", hi: "चंद्र", color: "text-slate-200", bg: "bg-slate-200/10", border: "border-slate-200/20" },
  { k: "Ma", hi: "मंगल", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  { k: "Me", hi: "बुध", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { k: "Ju", hi: "गुरु", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { k: "Ve", hi: "शुक्र", color: "text-pink-300", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { k: "Sa", hi: "शनि", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" }
];

const RASHIS = ["मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

const getHeatmapClass = (pt) => {
  if (pt >= 4) return "text-emerald-400 font-black"; 
  if (pt >= 2) return "text-amber-400 font-bold";  
  if (pt > 0) return "text-rose-400 font-medium";  
  return "text-slate-600";                         
};

const ShodhanaPanel = React.memo(({ shodhanaData }) => {
  const [activeTab, setActiveTab] = useState('trikona');
  console.log("FULL SHODHANA DATA", shodhanaData);
console.log("ORIGINAL BAV", shodhanaData?.original_bav);
console.log(
  "MARS",
  shodhanaData?.original_bav?.Ma,
  shodhanaData?.original_bav?.Ma?.reduce((a,b)=>a+b,0)
);

  const { 
    trikona_shodhana = {}, 
    ekadhipatya_shodhana = {}, 
    shodhya_pinda = {}, 
    event_triggers = [],
    original_bav = {} 
  } = shodhanaData || {};
  // 2. यहाँ अपना Console Log लगा दें 👇
  console.log(
    "🔥 Mars BAV Frontend Check:", 
    original_bav?.Ma, 
    "Total Sum:", 
    original_bav?.Ma?.reduce((a, b) => a + b, 0)
  );

  

  if (!shodhanaData || shodhanaData.error) {
    return <div className="p-5 text-center text-rose-400 text-sm" style={HI}>⚠️ शोधन डेटा उपलब्ध नहीं है या कोई त्रुटि है।</div>;
  }

  const maxPinda = useMemo(() => {
    const values = Object.values(shodhya_pinda).map(Number).filter(n => !isNaN(n));
    return values.length > 0 ? Math.max(...values) : 0;
  }, [shodhya_pinda]);

  const renderTable = (data, title, desc) => (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4">
      <div className="mb-4">
        <h3 className="text-emerald-400 font-bold text-[14px]" style={HI}>{title}</h3>
        <p className="text-slate-400 text-[11px] leading-relaxed mt-1" style={HI}>{desc}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50 shadow-lg" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
        <table className="w-full text-center text-[12px] border-collapse" style={HI}>
          <thead>
            <tr className="bg-slate-800/80 text-slate-300">
              <th className="p-2 border-b border-r border-slate-700/50 font-black">ग्रह</th>
              {/* 🔥 FIX: हेडिंग में सीधे राशियों के नाम (मेष, वृषभ) दिखाएं ताकि कन्फ्यूजन न हो */}
              {RASHIS.map((r, i) => (
                <th key={i} className="p-2 border-b border-slate-700/50 font-semibold min-w-[35px] text-[10px]">
                  {i + 1}<br/><span className="text-slate-500">{r}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((p) => {
              const points = data[p.k] || Array(12).fill(0);
              return (
                <tr key={p.k} className="hover:bg-white/[0.02] transition-colors border-b border-slate-700/30 last:border-0">
                  <td className={`p-2 border-r border-slate-700/50 font-black ${p.color} bg-slate-900/50`}>{p.hi}</td>
                  {Array.from({ length: 12 }).map((_, i) => {
                      // 🔥 FIX: रोटेशन हटा दिया गया है। अब i=0 मतलब हमेशा मेष (Aries) होगा।
                      const rashiIndex = i;
                      const pt = points[rashiIndex] ?? 0;
                      return (
                        <td key={i} className={`p-2 ${getHeatmapClass(pt)}`}>
                          {pt > 0 ? pt : '·'}
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="mt-6 mb-4 p-4 rounded-2xl border border-slate-700/50 bg-slate-900/60 shadow-xl">
      <div className="flex p-1 bg-slate-800 rounded-xl overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'trikona', label: 'त्रिकोण शोधन' },
          { id: 'ekadhipatya', label: 'एकाधिपत्य शोधन' },
          { id: 'triggers', label: 'शोध्य पिण्ड व गोचर' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
              activeTab === t.id 
                ? 'bg-emerald-500 text-slate-900 shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            style={HI}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'trikona' && renderTable(trikona_shodhana, "त्रिकोण शोधन (Trikona Shodhana)", "अग्नि, पृथ्वी, वायु और जल त्रिकोण की राशियों में से न्यूनतम अंक को घटाने के बाद बचे हुए बिंदु।")}
        
        {activeTab === 'ekadhipatya' && renderTable(ekadhipatya_shodhana, "एकाधिपत्य शोधन (Ekadhipatya Shodhana)", "जिन ग्रहों की दो राशियां होती हैं, उनके 'खाली' या 'भरे' होने के आधार पर किया गया अंतिम शोधन।")}
        
        {activeTab === 'triggers' && (
          <motion.div key="p" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4">
            
            <div className="mb-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {PLANETS.map(p => {
                const pVal = shodhya_pinda[p.k] || 0;
                const isHighest = pVal === maxPinda && maxPinda > 0;
                
                return (
                  <div key={p.k} className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm transition-all ${
                    isHighest ? "bg-amber-500/20 border-amber-400 shadow-amber-500/20 scale-105" : `${p.bg} ${p.border}`
                  }`}>
                    {isHighest && <span className="absolute -top-2 bg-amber-500 text-slate-900 text-[9px] px-2 py-0.5 rounded-full font-black drop-shadow" style={HI}>👑 सर्वाधिक बलवान</span>}
                    <span className={`text-[10px] font-bold ${isHighest ? "text-amber-300" : p.color}`} style={HI}>{p.hi} पिण्ड</span>
                    <span className="text-[15px] font-black text-white mt-0.5">{pVal}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="text-emerald-400 font-bold text-[14px] mb-3 flex items-center gap-2" style={HI}>
              <span className="h-px flex-1 bg-emerald-400/20"></span>
              🎯 प्रमुख गोचर भविष्यवाणियां
              <span className="h-px flex-1 bg-emerald-400/20"></span>
            </h3>

            {event_triggers.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm" style={HI}>
                गोचर भविष्यवाणियां उपलब्ध नहीं हैं।
              </div>
            ) : (
              <div className="space-y-4">
                {event_triggers.map((evt, i) => {
                  const pInfo = PLANETS.find(p => p.k === evt.karaka) || PLANETS[0];
                  return (
                    <div key={`${evt.event}-${i}`} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-600/50 shadow-md relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-1 ${pInfo.bg} border-t ${pInfo.border}`}></div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[16px] bg-slate-900 border ${pInfo.border} shadow-sm`}>✨</div>
                          <div>
                            <h4 className="text-[14px] font-black text-white" style={HI}>{evt.event}</h4>
                            <span className={`text-[10px] font-bold ${pInfo.color} uppercase tracking-wider`} style={HI}>कारक: {pInfo.hi}</span>
                          </div>
                        </div>
                        {evt.transit_by && (
                          <div className={`px-2 py-1 rounded text-[10px] font-bold border ${evt.transit_by === 'Ju' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-600/30 text-slate-300 border-slate-500/50'}`} style={HI}>
                            गोचर: {evt.transit_by === 'Ju' ? 'गुरु' : 'शनि'}
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-[#040814] border border-slate-700 text-slate-300 text-[11px] font-mono tracking-wide mb-3 flex justify-between items-center">
                        <span>{evt.formula}</span>
                        <span className="text-emerald-400 font-bold">÷ 27</span>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded border border-rose-500/30" style={HI}>नक्षत्र: {evt.trigger_nakshatra}</span>
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded border border-cyan-500/30" style={HI}>राशि: {evt.trigger_rashi}</span>
                        </div>
                        <p className="text-[12px] text-slate-200 leading-relaxed font-medium" style={HI}>
                          {evt.prediction ? evt.prediction.replace(/\*\*/g, '') : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ShodhanaPanel;