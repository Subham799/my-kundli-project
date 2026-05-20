import React, { useState } from 'react';
import useKundliStore from '../../store/useKundliStore';

const KP_EVENT_DICTIONARY = {
  "marriage": { label: "शादी कब होगी? (Marriage)", target: [2, 7, 11], stress: [1, 6, 10] },
  "career": { label: "जॉब कब लगेगी? (Career)", target: [2, 6, 10, 11], stress: [5, 9, 12] },
  "ex_return": { label: "Ex वापस आएगी? (Ex Return)", target: [5, 11], stress: [6, 8, 12] },
  "childbirth": { label: "बच्चा कब होगा? (Childbirth)", target: [2, 5, 11], stress: [1, 4, 10] },
  "foreign_travel": { label: "विदेश यात्रा? (Foreign Travel)", target: [3, 9, 12], stress: [2, 4, 11] },
  "property_buy": { label: "संपत्ति/घर? (Property)", target: [4, 11, 12], stress: [3, 10] },
  "accident": { label: "दुर्घटना/चोट? (Accident)", target: [1, 8, 12], stress: [11] }
};

export default function KPResonanceDashboard() {
  const { chartData } = useKundliStore();
  const [selectedTopic, setSelectedTopic] = useState("career");
  const [loading, setLoading] = useState(false);
  const [payloadResult, setPayloadResult] = useState(null);
  const [error, setError] = useState(null);

  const generateAIPrompt = async () => {
    setLoading(true);
    setError(null);
    setPayloadResult(null);

    try {
      const payload = {
        topic: selectedTopic,
        astro_data: chartData?.planets || {},
        raw_significators: chartData?.enginesData?.kp_significators?.significators || {},
        cusp_data: chartData?.cusps || chartData?.enginesData?.kp_significators?.cusp_significators || {},
        dob: chartData?.meta?.dob,
        moon_degree: chartData?.planets?.Mo?.fullDegree || 0,
        lat: chartData?.meta?.lat || 28.61,
        lon: chartData?.meta?.lon || 77.20
      };

     const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

      const response = await fetch(`${API_BASE_URL}/api/generate-kp-payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to generate payload");

      const finalPrompt = `Question: ${KP_EVENT_DICTIONARY[selectedTopic].label}\n\nUniversal KP Payload:\n${JSON.stringify(result.universal_payload, null, 2)}\n\nBhai, is data ko analyze karke strict KP rules ke hisaab se batao event ka promise hai ya nahi, aur agar hai to exact time window aur gochar kab trigger karega?`;
      
      setPayloadResult(finalPrompt);
      navigator.clipboard.writeText(finalPrompt);
      alert("✅ 5-Block KP Payload Copied to Clipboard! Paste it to your AI.");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 mb-6 p-6 bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-lg">
      <h2 className="text-xl font-black text-slate-200 tracking-wide mb-2 flex items-center gap-2">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500 block"></span>
        Ask AI Astrologer (Top-Down KP Approach)
      </h2>
      <p className="text-sm text-slate-400 mb-6">Select a question to generate a precise 5-Block KP prediction prompt.</p>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <select 
          value={selectedTopic} 
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="bg-slate-950 border border-indigo-500/50 text-indigo-200 text-base rounded-lg px-4 py-3 outline-none w-full md:w-72"
        >
          {Object.entries(KP_EVENT_DICTIONARY).map(([key, data]) => (
            <option key={key} value={key}>{data.label}</option>
          ))}
        </select>
        
        <button 
          onClick={generateAIPrompt}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full md:w-auto flex justify-center items-center gap-2"
        >
          {loading ? "Generating..." : "Copy AI Prompt 📋"}
        </button>
      </div>

      {error && <div className="mt-4 p-3 bg-rose-500/20 text-rose-300 rounded border border-rose-500/50">⚠️ {error}</div>}

      {payloadResult && (
        <div className="mt-6">
          <h4 className="text-emerald-400 font-bold mb-2 text-sm">✅ Prompt Successfully Generated!</h4>
          <textarea 
            readOnly 
            value={payloadResult} 
            className="w-full h-48 bg-black/50 text-slate-300 font-mono text-xs p-3 rounded-lg border border-slate-700 outline-none"
          />
        </div>
      )}
    </div>
  );
}