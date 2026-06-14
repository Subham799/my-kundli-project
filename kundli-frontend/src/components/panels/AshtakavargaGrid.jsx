import { motion } from "framer-motion";
import React, { useState } from "react";

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

// भावों के मुख्य नैसर्गिक कारकत्व विवरण (स्वामित्व फल विश्लेषण के लिए)
const HOUSE_SIGNIFICANCES = {
  1: "सेहत/व्यक्तित्व", 2: "धन/कुटुंब", 3: "साहस/पराक्रम", 4: "सुख/माता/भूमि",
  5: "बुद्धि/संतान", 6: "रोग/ऋण/शत्रु", 7: "विवाह/साझेदारी", 8: "आयु/अचानक कष्ट",
  9: "भाग्य/धर्म", 10: "करियर/कर्म", 11: "आय/लाभ", 12: "व्यय/हानि"
};

// फिक्स ज्योतिषीय वैश्विक नियम: 0-इंडेक्स आधारित राशियों के स्वामी (0=मेष का Ma, 1=वृषभ का Ve, 2=मिथुन का Me...)
const RASHI_LORDS = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"];

// ============================================================
// SHASTRA POINTS — शास्त्र-निर्धारित बिंदु (हर भाव के लिए)
// ============================================================
const SHASTRA_POINTS = [25, 22, 29, 24, 25, 34, 19, 24, 29, 36, 54, 16];

// त्रिक भाव (6, 8, 12) — Index: 5, 7, 11
const TRIK_HOUSES = new Set([5, 7, 11]); // 0-indexed

// Three Stages of Life (4-4 houses each)
const STAGES = [
  { label: "बचपन (0–22 वर्ष)",    emoji: "🌱", houseRange: "भाव 1–4",   indices: [0,1,2,3] },
  { label: "कामकाजी (22–60 वर्ष)", emoji: "💼", houseRange: "भाव 5–8",   indices: [4,5,6,7] },
  { label: "बुढ़ापा (60+ वर्ष)",    emoji: "🌅", houseRange: "भाव 9–12", indices: [8,9,10,11] },
];
const STAGE_AVG = 112;

function getSavColor(val, houseIdx) {
  const target = SHASTRA_POINTS[houseIdx];
  const isTrik = TRIK_HOUSES.has(houseIdx);

  if (houseIdx === 7 && val >= 40) {
    return { bar:"#c084fc", bg:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.35)", text:"#c084fc", label:"दीर्घायु/साधना ✦" };
  }
  if (isTrik && val > target + 10) {
    return { bar:"#fb923c", bg:"rgba(251,146,60,0.13)", border:"rgba(251,146,60,0.35)", text:"#fb923c", label:"त्रिक अधिक ⚠" };
  }
  if (val >= target) {
    return { bar:"#34D399", bg:"rgba(52,211,153,0.12)", border:"rgba(52,211,153,0.30)", text:"#34D399", label:"उत्तम" };
  }
  if (val >= target - 5) {
    return { bar:"#22D3EE", bg:"rgba(34,211,238,0.08)", border:"rgba(34,211,238,0.22)", text:"#22D3EE", label:"सामान्य" };
  }
  if (val >= target - 10) {
    return { bar:"#F59E0B", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.22)", text:"#F59E0B", label:"साधारण" };
  }
  return { bar:"#F87171", bg:"rgba(248,113,113,0.10)", border:"rgba(248,113,113,0.28)", text:"#F87171", label:"निम्न" };
}

function getBavCellColor(val) {
  if (val === 0) return { color:"#ef4444", bg: "rgba(239, 68, 68, 0.25)", opacity: 1, fontWeight: 900, isZero: true };
  if (val >= 6) return { color:"#34D399", opacity: 1, fontWeight: 900 };
  if (val >= 4) return { color:"#F59E0B", opacity: 1, fontWeight: 900 };
  if (val >= 3) return { color:"#fb923c", opacity: 1, fontWeight: 900 };
  return { color:"#F87171", opacity: 0.7, fontWeight: 700 };
}

const PLANET_NAMES = {
  Su: "सूर्य (Su)", Mo: "चंद्र (Mo)", Ma: "मंगल (Ma)",
  Me: "बुध (Me)", Ju: "गुरु (Ju)", Ve: "शुक्र (Ve)", Sa: "शनि (Sa)"
};
const PLANET_KEYS = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];

function ThreeStagesPanel({ houseAlignedSav }) {
  if (!houseAlignedSav || houseAlignedSav.length < 12) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl border border-amber-500/25 bg-[rgba(255,200,50,0.04)]">
      <h4 className="text-sm font-bold text-amber-400 mb-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        जीवन के तीन चरण (4-4 भाव नियम)
      </h4>
      <p className="text-[10px] text-slate-500 mb-4" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        कुल 337 बिंदु · प्रत्येक चरण का औसत <span className="text-amber-400 font-bold">112</span> बिंदु
      </p>
      <div className="grid grid-cols-3 gap-3">
        {STAGES.map((stage, si) => {
          const total = stage.indices.reduce((acc, idx) => acc + (houseAlignedSav[idx] || 0), 0);
          const isGood = total >= STAGE_AVG;
          const pct = Math.min(100, Math.round((total / (STAGE_AVG * 1.5)) * 100));
          return (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
              className={`rounded-xl p-3 border text-center ${
                isGood ? "bg-emerald-900/20 border-emerald-500/35" : "bg-red-900/15 border-red-500/30"
              }`}
            >
              <div className="text-lg mb-1">{stage.emoji}</div>
              <div className="text-[10px] font-bold text-slate-300 leading-tight mb-0.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{stage.label}</div>
              <div className="text-[9px] text-slate-500 mb-2" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{stage.houseRange}</div>
              <div className={`text-3xl font-black mb-1 ${isGood ? "text-emerald-400" : "text-red-400"}`} style={{ textShadow: isGood ? "0 0 12px #34d39980" : "0 0 12px #f8717180" }}>{total}</div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${
                isGood ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/15 text-red-300 border border-red-500/25"
              }`} style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{isGood ? "✓ सुखी जीवन" : "⚡ संघर्ष"}</div>
              <div className="text-[9px] text-slate-600">{isGood ? `+${total - STAGE_AVG} अधिक` : `${total - STAGE_AVG} कम`}</div>
              <div className="h-1 rounded-full mt-2 overflow-hidden bg-slate-700/50">
                <motion.div className="h-full rounded-full" style={{ background: isGood ? "#34D399" : "#F87171", boxShadow: isGood ? "0 0 6px #34D39960" : "0 0 6px #F8717160" }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.3 + si * 0.1 }} />
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {stage.indices.map(idx => (
                  <span key={idx} className="text-[8px] px-1 rounded" style={{
                    background: getSavColor(houseAlignedSav[idx] || 0, idx).bg,
                    color: getSavColor(houseAlignedSav[idx] || 0, idx).text,
                    border: `1px solid ${getSavColor(houseAlignedSav[idx] || 0, idx).border}`
                  }}>
                    {houseAlignedSav[idx] || 0}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function NorthIndianAVChart({ title, pointsArray, total, isSav = false, lagnaSignIdx = 0 }) {
  if (!pointsArray || pointsArray.length < 12) return null;

  const P = 10, SZ = 300, M = P + SZ / 2, S = P + SZ;
  const T=[M,P],R=[S,M],B=[M,S],L=[P,M],TL=[P,P],TR=[S,P],BR=[S,S],BL=[P,S],C=[M,M];
  const MLT=[P+SZ/4,P+SZ/4],MTR=[P+SZ*3/4,P+SZ/4],MRB=[P+SZ*3/4,P+SZ*3/4],MBL=[P+SZ/4,P+SZ*3/4];
  const pp = pts => pts.map(p => p.join(",")).join(" ");

  const POLY = {
    1:pp([T,MTR,C,MLT]),2:pp([TL,T,MLT]),3:pp([TL,MLT,L]),4:pp([L,MLT,C,MBL]),
    5:pp([BL,L,MBL]),6:pp([BL,MBL,B]),7:pp([B,MBL,C,MRB]),8:pp([BR,B,MRB]),
    9:pp([BR,MRB,R]),10:pp([R,MRB,C,MTR]),11:pp([TR,R,MTR]),12:pp([TR,MTR,T]),
  };
  const TPOS = {
    1:{cx:M,cy:P+SZ/4+12},2:{cx:P+SZ/4,cy:P+SZ/8+12},3:{cx:P+SZ/8,cy:P+SZ/4+12},
    4:{cx:P+SZ/4,cy:M+12},5:{cx:P+SZ/8,cy:P+SZ*3/4+12},6:{cx:P+SZ/4,cy:S-SZ/8+12},
    7:{cx:M,cy:P+SZ*3/4+12},8:{cx:P+SZ*3/4,cy:S-SZ/8+12},9:{cx:S-SZ/8,cy:P+SZ*3/4+12},
    10:{cx:P+SZ*3/4,cy:M+12},11:{cx:S-SZ/8,cy:P+SZ/4+12},12:{cx:P+SZ*3/4,cy:P+SZ/8+12},
  };

  return (
    <div className="flex flex-col items-center bg-[rgba(2,4,16,0.5)] p-4 rounded-xl border border-amber-500/20 shadow-lg">
      <div className="w-full flex justify-between items-center mb-3 px-2">
        <span className="text-sm font-bold text-amber-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{title}</span>
        {total !== undefined && (
          <span className="text-xs font-bold px-2 py-1 rounded bg-amber-500/10 text-emerald-400 border border-emerald-500/20">
            कुल: {total}
          </span>
        )}
      </div>
      <div className="relative w-full max-w-[280px] aspect-square">
        <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-md">
          <rect x={P} y={P} width={SZ} height={SZ} fill="rgba(1,3,12,0.9)" stroke="#F59E0B" strokeWidth="1.5" rx="4"/>
          <line x1={P} y1={P} x2={S} y2={S} stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4"/>
          <line x1={S} y1={P} x2={P} y2={S} stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.4"/>
          <polygon points={pp([T,R,B,L])} fill="none" stroke="#F59E0B" strokeWidth="1.5"/>
          {Object.entries(POLY).map(([hn, pts]) => {
            const houseNum = parseInt(hn, 10);
            const arrayIndex = houseNum - 1;
            const points = pointsArray[arrayIndex] || 0;
            const pos = TPOS[houseNum];
            const isTrik = TRIK_HOUSES.has(arrayIndex);
            
            // [सुधार 3]: चक्र ग्रिड में त्रिक भावों (6,8,12) पर विशेष नारंगी (Orange) बॉर्डर संकेत मार्कर
            const strokeColor = isTrik ? "#fb923c" : "rgba(245,158,11,0.1)";
            const strokeW = isTrik ? "1.5" : "0.5";

            const color = isSav ? getSavColor(points, arrayIndex).bar : getBavCellColor(points).color;
            const rashiNum = isSav ? ((lagnaSignIdx + houseNum - 1) % 12) + 1 : houseNum;
            return (
              <g key={hn}>
                <polygon points={pts} fill="transparent" stroke={strokeColor} strokeWidth={strokeW}/>
                <text x={pos.cx} y={pos.cy-18} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.45)" fontWeight="bold">{rashiNum}</text>
                <text x={pos.cx} y={pos.cy} textAnchor="middle" fontSize="22" fill={color} fontWeight="900"
                  style={{textShadow:`0 0 8px ${color}60`, opacity: points === 0 && !isSav ? 0.4 : 1}}>{points}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function BavTableHeader({ accentColor }) {
  return (
    <tr className="bg-slate-800/80 border-b border-slate-700">
      <th className="p-2 border-r border-slate-700 text-left pl-3 font-bold sticky left-0 bg-slate-800/90"
        style={{color: accentColor}}>ग्रह</th>
      {Array.from({length:12},(_, i) => (
        <th key={i} className="p-2 border-r border-slate-700 font-bold" style={{color: accentColor}}>
          <div className="text-[10px] font-black">{i+1}</div>
          <div className="text-[7px] text-slate-500" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>भाव</div>
        </th>
      ))}
      <th className="p-2 text-emerald-400 font-bold">कुल</th>
    </tr>
  );
}

function ShastraRow({ accentColor }) {
  return (
    <tr className="border-t border-amber-500/20 bg-slate-900/80">
      <td className="p-2 border-r border-slate-700 text-left pl-3 sticky left-0 bg-slate-900/80 text-[9px] font-bold"
        style={{color: accentColor, fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        शास्त्र<br/>लक्ष्य
      </td>
      {SHASTRA_POINTS.map((pt, i) => (
        <td key={i} className={`p-2 border-r border-slate-700 text-[9px] font-bold ${TRIK_HOUSES.has(i) ? "bg-orange-900/20" : "bg-slate-900/30"}`}
          style={{color: TRIK_HOUSES.has(i) ? "#fb923c" : "#94a3b8"}}>
          {pt}
        </td>
      ))}
      <td className="p-2 text-[9px] text-slate-500 bg-slate-900/50">337</td>
    </tr>
  );
}

export default function AshtakavargaGrid({ sav=[], houses=[], ashtakavargaSpecial="", chartData }) {

  const lagnaSignIdx = chartData?.meta?.lagnaSignIdx || 0;

  // State management for Transit feature
  const [transitDate, setTransitDate] = useState(new Date().toISOString().split('T')[0]);
  const [transitResult, setTransitResult] = useState(null);
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [transitError, setTransitError] = useState("");

  // SAV: Lagna के अनुसार rotate करें
  const houseAlignedSav = sav.length === 12
    ? Array.from({length:12}).map((_,i) => sav[(lagnaSignIdx + i) % 12])
    : [];

  const maxAV = Math.max(...houseAlignedSav.filter(Boolean), 1);
  const savTotal = houseAlignedSav.reduce((a,b) => a+b, 0);

  const ed = chartData?.enginesData || {};
  const rawBav = ed.bav || ed.av_sutras?.bav || ed.av_sutras?.bav_charts ||
                 ed.ashtakvarga_complete?.bav || chartData?.bav ||
                 chartData?.ashtakavarga?.bav || null;

  // BAV: raw rashi-indexed (बिल्कुल rotate नहीं करना)
  const bavByHouse = {};
  const bavTotals = {};
  if (rawBav) {
    PLANET_KEYS.forEach(p => {
      bavByHouse[p] = rawBav[p] || [];
      bavTotals[p] = (rawBav[p] || []).reduce((a,b) => a+b, 0);
    });
  }

  // ------------------------------------------------------------
  // BIRTH BASE SAV का प्रामाणिक डायनामिक जोड़ (7-ग्रह नियम)
  // ------------------------------------------------------------
  let birthBaseSavScore = 0;
  if (sav.length === 12 && chartData?.planets) {
    PLANET_KEYS.forEach(p => {
      const pData = chartData.planets[p];
      const d1Idx = pData?.vargas?.D1?.Idx ?? pData?.vargas?.D1?.idx ?? null;
      if (d1Idx !== null && sav[d1Idx] !== undefined) {
        birthBaseSavScore += sav[d1Idx];
      }
    });
  }

  // 🎯 [लॉजिक सुधार]: जन्म कुंडली के वास्तविक लग्न के अनुसार ग्रहों के स्वामित्व (Lordship) की लाइव गणना
  const getPlanetLordships = (planetKey) => {
    const ownedHouses = [];
    for (let bhava = 1; bhava <= 12; bhava++) {
      const currentRashiIdx = (lagnaSignIdx + bhava - 1) % 12;
      const rashiLord = RASHI_LORDS[currentRashiIdx];
      if (rashiLord === planetKey) {
        ownedHouses.push(bhava);
      }
    }
    return ownedHouses;
  };

  // Trigger monthly transit API call
  const handleCalculateTransit = async () => {
    if (!rawBav) {
      setTransitError("जन्म कुंडली का BAV डेटा उपलब्ध नहीं है।");
      return;
    }
    setLoadingTransit(true);
    setTransitError("");
    try {
      const response = await fetch('/api/monthly_transit_bav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transit_date: transitDate,
          base_bav: rawBav
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setTransitResult(resData);
      } else {
        setTransitError(resData.error || "गणना करने में विफल।");
      }
    } catch (err) {
      setTransitError("सर्वर से कनेक्ट करने में त्रुटि आई।");
    } finally {
      setLoadingTransit(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-4">

      {/* STAGE 1: THREE STAGES OF LIFE */}
      {houseAlignedSav.length === 12 && (
        <ThreeStagesPanel houseAlignedSav={houseAlignedSav} />
      )}

      {/* V.P. GOEL MONTHLY TRANSIT PANEL WITH LIVE COMPARISON */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-[rgba(34,211,238,0.02)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-cyan-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              मास प्रवेश गोचर विश्लेषक (V.P. Goel Rule)
            </h3>
            <p className="text-[10px] text-slate-500">गोचर ग्रहों की लाइव स्थिति का जन्म कुंडली (D1-D9-D10) के SAV और BAV से सीधा मिलान</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="date" 
              value={transitDate}
              onChange={(e) => setTransitDate(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCalculateTransit}
              disabled={loadingTransit}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-4 py-1.5 rounded-xl transition-all whitespace-nowrap disabled:opacity-50"
              style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}
            >
              {loadingTransit ? "गणना जारी..." : "गोचर जाँचें"}
            </motion.button>
          </div>
        </div>

        {transitError && (
          <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl mb-2">
            {transitError}
          </div>
        )}

        {/* सूर्य के राशि संक्रांति प्रवेश क्षण का डायनामिक लाइव अलर्ट बॉक्स */}
        {transitResult?.exact_ingress_time && (
          <div className="mb-3 text-[10px] bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 px-3 py-1.5 rounded-xl">
            ☀️ <strong>सूर्य प्रवेश क्षण (Exact Ingress):</strong> इस महीने सूर्य का 0° संक्रांति प्रवेश <strong>{transitResult.exact_ingress_time}</strong> पर हुआ है। संपूर्ण कुंडली विश्लेषण इसी क्षण का है।
          </div>
        )}

        {/* Transit Result Table Comparison Block */}
        {transitResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 border mt-2 ${transitResult.is_auspicious ? 'bg-emerald-950/10 border-emerald-500/25' : 'bg-red-950/10 border-red-500/25'}`}
          >
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="text-[11px] text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>कुल गोचर BAV बिंदु स्कोर: </span>
                  <span className={`text-2xl font-black ml-1.5 ${transitResult.is_auspicious ? 'text-emerald-400' : 'text-red-400'}`}>
                    {transitResult.total_points}
                  </span>
                  <span className="text-[10px] text-slate-600 ml-1">/ लक्ष्य: {transitResult.average_threshold}</span>
                </div>
                <div className={`text-xs font-black px-3 py-1 rounded-full border ${
                  transitResult.is_auspicious ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/25'
                }`} style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                  {transitResult.is_auspicious ? "✓ यह महीना अत्यंत शुभ रहेगा 🚀" : "⚠ इस महीने थोड़ा संघर्ष रह सकता है"}
                </div>
              </div>

              {/* सातों ग्रहों के गोचर स्थान के SAV का जोड़ बनाम जन्म बेस जोड़ */}
              {(() => {
                let currentTransitSavTotal = 0;
                transitResult.transit_details.forEach(pt => {
                  if (sav[pt.transit_sign_idx] !== undefined) {
                    currentTransitSavTotal += sav[pt.transit_sign_idx];
                  }
                });
                const isTransitSavGood = currentTransitSavTotal >= birthBaseSavScore;

                return (
                  <div className="mt-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-[11px] text-slate-300">
                      🔮 <span className="text-amber-400 font-bold">V.P. Goel SAV सूत्र:</span> गोचर योग: <span className="text-cyan-400 font-black text-sm">{currentTransitSavTotal}</span> बनाम जन्म बेस (Base SAV): <span className="text-slate-400 font-black text-sm">{birthBaseSavScore}</span>
                    </div>
                    <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${isTransitSavGood ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {isTransitSavGood ? `🚀 +${currentTransitSavTotal - birthBaseSavScore} बिंदु अधिक (अनुकूल फल)` : `⚠️ ${currentTransitSavTotal - birthBaseSavScore} बिंदु कम (कष्टकारी योग)`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* LIVE CROSS COMPARISON TABLE FOR TRANSIT */}
            <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-950/50 mb-4">
              <table className="w-full text-center text-[10px] sm:text-[11px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-slate-300">
                    <th className="p-2 text-left pl-3 text-cyan-400">ग्रह</th>
                    <th className="p-2">गोचर राशि</th>
                    <th className="p-2 text-amber-400">गोचर भाव</th>
                    <th className="p-2 border-l border-slate-800 text-slate-400">D1 BAV</th>
                    <th className="p-2 text-purple-400">D9 BAV</th>
                    <th className="p-2 text-blue-400">D10 BAV</th>
                    <th className="p-2 border-l border-slate-800 text-emerald-400 font-bold">गोचर SAV</th>
                    <th className="p-2 text-cyan-400 font-bold">प्राप्त बिंदु</th>
                    <th className="p-2 text-left pl-4">स्वामित्व फल प्रभाव (Lordship SUTRA)</th>
                  </tr>
                </thead>
                <tbody>
                  {transitResult.transit_details.map((ptDetail) => {
                    const pk = ptDetail.planet;
                    const transitSign = ptDetail.transit_sign_idx;
                    const gocharBhava = ((transitSign - lagnaSignIdx + 12) % 12) + 1;
                    
                    const planetData = chartData?.planets?.[pk];
                    const d1Idx = planetData?.vargas?.D1?.Idx ?? planetData?.vargas?.D1?.idx ?? null;
                    const d9Idx = planetData?.vargas?.D9?.Idx ?? planetData?.vargas?.D9?.idx ?? null;
                    const d10Idx = planetData?.vargas?.D10?.Idx ?? planetData?.vargas?.D10?.idx ?? null;

                    const d1Bav = (d1Idx !== null && bavByHouse[pk]) ? bavByHouse[pk][d1Idx] : "-";
                    const d9Bav = (d9Idx !== null && bavByHouse[pk]) ? bavByHouse[pk][d9Idx] : "-";
                    const d10Bav = (d10Idx !== null && bavByHouse[pk]) ? bavByHouse[pk][d10Idx] : "-";
                    const currentGocharSav = sav[transitSign] || 0;

                    // वास्तविक लग्न के रोटेशन के आधार पर भाव स्वामित्व विवरण लोड करना
                    const lords = getPlanetLordships(pk);
                    const lordshipText = lords.length > 0 ? lords.map(h => `भाव ${h} (${HOUSE_SIGNIFICANCES[h]})`).join(" व ") : "कोई विशेष नहीं";

                    return (
                      <tr key={pk} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                        <td className="p-2 text-left pl-3 font-bold text-slate-200">{PLANET_NAMES[pk]?.split(' ')[0]}</td>
                        <td className="p-2 text-amber-500 font-medium">{RASHIS[transitSign]}</td>
                        <td className="p-2 font-black text-slate-300">भाव {gocharBhava}</td>
                        <td className="p-2 border-l border-slate-800/50 text-slate-400">{d1Bav}</td>
                        <td className="p-2 text-purple-400">{d9Bav}</td>
                        <td className="p-2 text-blue-400">{d10Bav}</td>
                        <td className="p-2 border-l border-slate-800/50 text-emerald-400 font-bold">{currentGocharSav}</td>
                        <td className={`p-2 text-base font-black ${ptDetail.is_winner ? 'text-emerald-400' : ptDetail.is_caution ? 'text-red-400' : 'text-cyan-400'}`}>
                          {ptDetail.points}
                        </td>
                        <td className="p-2 text-left pl-4">
                          {ptDetail.is_winner ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">🚀 अत्यंत बली फल → {lordshipText} के क्षेत्रों में विशेष वृद्धि और लाभ योग।</span>
                          ) : ptDetail.is_caution ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">⚠️ कमजोर/पीड़ा योग → {lordshipText} के फलों में रुकावट या कष्ट की चेतावनी।</span>
                          ) : (
                            <span className="text-slate-400">सामान्य प्रभाव ({lordshipText})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* ============================================================ */}
      {/* === SAV 12 CARDS GRID ===================================== */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              सर्वाष्टकवर्ग सारिणी
            </h3>
            <p className="text-[10px] text-slate-600 mt-0.5">शास्त्र-निर्धारित लक्ष्य अनुसार रंग | त्रिक भाव (6,8,12) विशेष नारंगी बॉर्डर मार्कर</p>
          </div>
          {ashtakavargaSpecial && (
            <div className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 max-w-[200px]">
              <p className="text-[10px] text-amber-300 leading-snug" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{ashtakavargaSpecial}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {houseAlignedSav.map((av, i) => {
            const hNum = i + 1;
            const h = houses.find(x => x.num === hNum) || {};
            const target = SHASTRA_POINTS[i];
            const c = getSavColor(av, i);
            const pct = Math.min(100, Math.round((av / Math.max(target * 1.5, 1)) * 100));
            const isMax = av === maxAV;
            const isTrik = TRIK_HOUSES.has(i);
            const isSpecial8 = i === 7 && av >= 40;

            return (
              <motion.div key={i}
                initial={{opacity:0, scale:0.92}} animate={{opacity:1, scale:1}}
                transition={{delay: i*0.04}}
                className={`relative rounded-2xl p-3 border transition-all hover:scale-[1.03] cursor-default
                  ${isMax ? "ring-1 ring-emerald-400/40 shadow-md shadow-emerald-500/10" : ""}
                `}
                style={{
                  background: c.bg, 
                  borderColor: isTrik ? "#fb923c" : c.border,
                  borderWidth: isTrik ? "2px" : "1px"
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                    भाव {hNum}
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {isMax && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        सर्वोच्च ✦
                      </span>
                    )}
                    {isTrik && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        त्रिक भाव
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-2xl font-black mb-0.5" style={{color:c.text, textShadow:`0 0 10px ${c.bar}50`}}>
                  {av}
                </div>

                {/* Shastra target badge */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] text-slate-600" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                    लक्ष्य:
                  </span>
                  <span className="text-[9px] font-bold" style={{color: c.bar}}>{target}</span>
                  {isSpecial8 && (
                    <span className="text-[8px] text-purple-300 ml-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                      दीर्घायु ✦
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-slate-600 mb-1.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                  {h.signHindi || RASHIS[(lagnaSignIdx + i) % 12]}
                </div>

                {/* Status label */}
                <div className="text-[8px] font-bold mb-1.5 px-1.5 py-0.5 rounded-full inline-block"
                  style={{background: c.bg, color: c.text, border:`1px solid ${c.border}`, fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                  {c.label}
                </div>

                <div className="h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
                  <motion.div className="h-full rounded-full" style={{background:c.bar, boxShadow:`0 0 6px ${c.bar}60`}}
                    initial={{width:0}} animate={{width:`${pct}%`}}
                    transition={{duration:0.8, delay:0.2+i*0.04, ease:"easeOut"}}/>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* === D1 BAV TABLE =========================================== */}
      {/* ============================================================ */}
      {rawBav && (
        <div className="border-t border-slate-700/50 pt-6">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-cyan-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              भिन्नाष्टकवर्ग D1 (लग्न कुंडली) — ग्रहों के बिंदु
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 border border-cyan-700/40 text-cyan-400 font-bold">1–12</span>
              <span>= भाव क्रम · ✦ = उस भाव में ग्रह की स्थिति (D1)</span>
              <span className="px-1.5 py-0.5 rounded bg-red-900/30 border border-red-700/30 text-red-400 font-bold">0 (असहायक)</span>
              <span>= ग्रह बिंदु नहीं → उस राशि/भाव में धुंधला लाल बॉक्स प्रभाव</span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-800/30">
            <table className="w-full text-center text-[9px] sm:text-[10px] whitespace-nowrap">
              <thead>
                <BavTableHeader accentColor="#22D3EE"/>
              </thead>
              <tbody>
                {PLANET_KEYS.map((pk) => {
                  const pts = bavByHouse[pk] || [];
                  const total = bavTotals[pk] || 0;
                  return (
                    <tr key={pk} className="border-b border-slate-700/60 hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 border-r border-slate-700 text-left font-bold text-slate-200 pl-3 sticky left-0 bg-slate-900/80"
                        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {PLANET_NAMES[pk]}
                      </td>
                      {pts.map((val, i) => {
                        const pd = chartData?.planets?.[pk];
                        const d1Idx = pd?.vargas?.D1?.Idx ?? pd?.vargas?.D1?.idx ?? null;
                        const isD1 = d1Idx !== null && i === d1Idx;
                        const s = getBavCellColor(val);
                        return (
                          <td key={i} className={`p-2 border-r border-slate-700 ${
                            isD1 ? 'bg-cyan-900/40 ring-1 ring-inset ring-cyan-500/50' : ''
                          }`} style={{ backgroundColor: s.bg || "transparent" }}>
                            <span style={{color: s.color, fontWeight: s.fontWeight, opacity: s.opacity}}>
                              {val === 0 ? "0 (असहायक)" : val}
                            </span>
                            {isD1 && <div className="text-[6px] text-cyan-300 mt-0.5">D1 ✦</div>}
                          </td>
                        );
                      })}
                      <td className="p-2 font-bold text-emerald-400 bg-slate-900/50">{total}</td>
                    </tr>
                  );
                })}

                {/* SAV Row */}
                <tr className="border-t-2 border-amber-500/30 bg-slate-900/60">
                  <td className="p-2 border-r border-slate-700 text-left font-bold text-amber-400 pl-3 sticky left-0 bg-slate-900/80"
                    style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>SAV</td>
                  {sav.map((val, i) => {
                    const c = getSavColor(val, i);
                    return (
                      <td key={i} className="p-2 border-r border-slate-700 bg-slate-900/40">
                        <span style={{color: c.text, fontWeight: 900}}>{val}</span>
                      </td>
                    );
                  })}
                  <td className="p-2 font-bold text-amber-400 bg-slate-900/50">{sav.reduce((a,b)=>a+b,0)}</td>
                </tr>

                {/* Shastra Points Row */}
                <ShastraRow accentColor="#22D3EE"/>
              </tbody>
            </table>
          </div>

          {/* Planet Total Cards */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3">
            {PLANET_KEYS.map((pk) => (
              <motion.div key={pk} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="p-2 rounded-lg bg-slate-800/40 border border-slate-700 text-center">
                <div className="text-[10px] text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[pk].split(' ')[0]}</div>
                <div className="text-xl font-bold text-cyan-400">{bavTotals[pk] || 0}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* === D9 BAV TABLE =========================================== */}
      {/* ============================================================ */}
      {rawBav && chartData?.planets && (
        <div className="border-t border-slate-700/50 pt-6">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-purple-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              भिन्नाष्टकवर्ग D9 (नवांश) — प्रारब्ध के ग्रह
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700/40 text-purple-400 font-bold">1–12</span>
              <span>= भाव क्रम (मेष=1) · ✦ = D9 में ग्रह की राशि स्थिति</span>
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-purple-700/40 bg-slate-800/30">
            <table className="w-full text-center text-[9px] sm:text-[10px] whitespace-nowrap">
              <thead><BavTableHeader accentColor="#c084fc"/></thead>
              <tbody>
                {PLANET_KEYS.map((pk) => {
                  const pd = chartData.planets[pk];
                  const d9Idx = pd?.vargas?.D9?.Idx ?? pd?.vargas?.D9?.idx ?? null;
                  const d9Rashi = d9Idx !== null ? RASHIS[d9Idx] : '-';
                  const pts = bavByHouse[pk] || [];
                  const total = bavTotals[pk] || 0;
                  const d9BavPt = d9Idx !== null ? (pts[d9Idx] || 0) : '-';
                  return (
                    <tr key={pk} className="border-b border-slate-700/60 hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 border-r border-slate-700 text-left pl-3 sticky left-0 bg-slate-900/80">
                        <div className="font-bold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[pk]}</div>
                        <div className="text-[8px] text-purple-400 mt-0.5">D9: {d9Rashi} → BAV: {d9BavPt}</div>
                      </td>
                      {pts.map((val, i) => {
                        const isD9 = d9Idx !== null && i === d9Idx;
                        const s = getBavCellColor(val);
                        return (
                          <td key={i} className={`p-2 border-r border-slate-700 ${
                            isD9 ? 'bg-purple-900/40 ring-1 ring-inset ring-purple-500/50' : ''
                          }`} style={{ backgroundColor: s.bg || "transparent" }}>
                            <span style={{color: s.color, fontWeight: s.fontWeight, opacity: s.opacity}}>
                              {val === 0 ? "0 (असहायक)" : val}
                            </span>
                            {isD9 && <div className="text-[6px] text-purple-300 mt-0.5">D9 ✦</div>}
                          </td>
                        );
                      })}
                      <td className="p-2 font-bold text-purple-400 bg-slate-900/50">{total}</td>
                    </tr>
                  );
                })}
                <ShastraRow accentColor="#c084fc"/>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {PLANET_KEYS.map((pk) => {
              const pd = chartData.planets[pk];
              const d9Idx = pd?.vargas?.D9?.Idx ?? pd?.vargas?.D9?.idx ?? null;
              const pts = bavByHouse[pk] || [];
              const d9BavPt = d9Idx !== null ? (pts[d9Idx] || 0) : '-';
              return (
                <motion.div key={pk} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="p-2 rounded-lg bg-purple-900/20 border border-purple-700/40 text-center">
                  <div className="text-[10px] text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[pk].split(' ')[0]}</div>
                  <div className="text-xl font-bold text-purple-400">{d9BavPt}</div>
                  {d9Idx !== null && (
                    <div className="text-[8px] text-purple-300 mt-0.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{RASHIS[d9Idx]}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* === D10 BAV TABLE ========================================== */}
      {/* ============================================================ */}
      {rawBav && chartData?.planets && (
        <div className="border-t border-slate-700/50 pt-6">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-blue-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              भिन्नाष्टकवर्ग D10 (दशांश) — करियर के ग्रह
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-blue-400 font-bold">1–12</span>
              <span>= भाव क्रम (मेष=1) · ✦ = D10 में ग्रह की राशि स्थिति</span>
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-blue-700/40 bg-slate-800/30">
            <table className="w-full text-center text-[9px] sm:text-[10px] whitespace-nowrap">
              <thead><BavTableHeader accentColor="#60a5fa"/></thead>
              <tbody>
                {PLANET_KEYS.map((pk) => {
                  const pd = chartData.planets[pk];
                  const d10Idx = pd?.vargas?.D10?.Idx ?? pd?.vargas?.D10?.idx ?? null;
                  const d10Rashi = d10Idx !== null ? RASHIS[d10Idx] : '-';
                  const pts = bavByHouse[pk] || [];
                  const total = bavTotals[pk] || 0;
                  const d10BavPt = d10Idx !== null ? (pts[d10Idx] || 0) : '-';
                  return (
                    <tr key={pk} className="border-b border-slate-700/60 hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 border-r border-slate-700 text-left pl-3 sticky left-0 bg-slate-900/80">
                        <div className="font-bold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[pk]}</div>
                        <div className="text-[8px] text-blue-400 mt-0.5">D10: {d10Rashi} → BAV: {d10BavPt}</div>
                      </td>
                      {pts.map((val, i) => {
                        const isD10 = d10Idx !== null && i === d10Idx;
                        const s = getBavCellColor(val);
                        return (
                          <td key={i} className={`p-2 border-r border-slate-700 ${
                            isD10 ? 'bg-blue-900/40 ring-1 ring-inset ring-blue-500/50' : ''
                          }`} style={{ backgroundColor: s.bg || "transparent" }}>
                            <span style={{color: s.color, fontWeight: s.fontWeight, opacity: s.opacity}}>
                              {val === 0 ? "0 (असहायक)" : val}
                            </span>
                            {isD10 && <div className="text-[6px] text-blue-300 mt-0.5">D10 ✦</div>}
                          </td>
                        );
                      })}
                      <td className="p-2 font-bold text-blue-400 bg-slate-900/50">{total}</td>
                    </tr>
                  );
                })}
                <ShastraRow accentColor="#60a5fa"/>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {PLANET_KEYS.map((pk) => {
              const pd = chartData.planets[pk];
              const d10Idx = pd?.vargas?.D10?.Idx ?? pd?.vargas?.D10?.idx ?? null;
              const pts = bavByHouse[pk] || [];
              const d10BavPt = d10Idx !== null ? (pts[d10Idx] || 0) : '-';
              return (
                <motion.div key={pk} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="p-2 rounded-lg bg-blue-900/20 border border-blue-700/40 text-center">
                  <div className="text-[10px] text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[pk].split(' ')[0]}</div>
                  <div className="text-xl font-bold text-blue-400">{d10BavPt}</div>
                  {d10Idx !== null && (
                    <div className="text-[8px] text-blue-300 mt-0.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{RASHIS[d10Idx]}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* === NORTH INDIAN SVG CHARTS ================================ */}
      {/* ============================================================ */}
      <div className="mt-4 pt-6 border-t border-slate-700/50">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-amber-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            अष्टकवर्ग कुंडलियाँ (VP Goel Method)
          </h3>
          <p className="text-xs text-slate-400 mt-1">डी-1 (लग्न) के आधार पर बिंदु · शास्त्र-रंग सहित</p>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-[340px]">
            <NorthIndianAVChart title="सर्वाष्टक वर्ग (SAV)" pointsArray={houseAlignedSav}
              total={savTotal} isSav={true} lagnaSignIdx={lagnaSignIdx}/>
          </div>
        </div>
        {rawBav && (
          <div>
            <h4 className="text-sm font-bold text-cyan-400 mb-4 ml-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              ग्रहीय भिन्नाष्टकवर्ग (BAV) — 7 ग्रहों की कुंडलियाँ
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {PLANET_KEYS.map((planetKey) => (
                <motion.div key={planetKey} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700 text-center">
                  <div className="text-xs text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{PLANET_NAMES[planetKey]}</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{bavTotals[planetKey]}</div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PLANET_KEYS.map((planetKey) => {
                const pointsArray = bavByHouse[planetKey];
                if (!pointsArray || pointsArray.length < 12) return null;
                return (
                  <NorthIndianAVChart key={planetKey} title={`${PLANET_NAMES[planetKey]} BAV`}
                    pointsArray={pointsArray} total={bavTotals[planetKey]}
                    isSav={false} lagnaSignIdx={lagnaSignIdx}/>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* === V.P. GOEL MAGIC ======================================== */}
      {/* ============================================================ */}
      {chartData?.planets && rawBav && sav.length >= 12 && (() => {
        const RASHIS_H = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
        const getVal = (vargaObj, p) => {
          if (!vargaObj) return {sav:0, bav:0, rashi:"-"};
          let sIdx = vargaObj.Idx ?? vargaObj.idx;
          if (sIdx === undefined || sIdx === null) {
            const signName = vargaObj.Sign || vargaObj.name || vargaObj.Name || "";
            sIdx = RASHIS_H.indexOf(signName);
          }
          if (sIdx === -1 || sIdx === undefined || sIdx === null) return {sav:0, bav:0, rashi:"-"};
          return {sav: sav[sIdx]||0, bav: rawBav[p]?(rawBav[p][sIdx]||0):0, rashi: RASHIS_H[sIdx]};
        };

        const goelData = [];
        const t = {d1Sav:0,d9Sav:0,d10Sav:0,d1Bav:0,d9Bav:0,d10Bav:0};
        const AVERAGES = {Su:4,Mo:4,Ma:3,Me:4.5,Ju:4.5,Ve:4.5,Sa:3};
        const PNAMES_SHORT = {Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि"};

        PLANET_KEYS.forEach(p => {
          const pd = chartData.planets[p];
          if (!pd) return;
          let d1;
          if (pd.vargas?.D1) {
            d1 = getVal(pd.vargas.D1, p);
          } else {
            const d1HouseIdx = (pd.house || 1) - 1;
            const d1SignIdx = (lagnaSignIdx + d1HouseIdx) % 12;
            d1 = {sav: sav[d1SignIdx]||0, bav: rawBav[p]?(rawBav[p][d1SignIdx]||0):0, rashi: RASHIS_H[d1SignIdx]};
          }
          const d9  = getVal(pd.vargas?.D9,  p);
          const d10 = getVal(pd.vargas?.D10, p);
          t.d1Sav+=d1.sav; t.d9Sav+=d9.sav; t.d10Sav+=d10.sav;
          t.d1Bav+=d1.bav; t.d9Bav+=d9.bav; t.d10Bav+=d10.bav;
          goelData.push({planet:PNAMES_SHORT[p], key:p, d1, d9, d10});
        });

        const beneficD9  = goelData.filter(r => r.d9.bav  > Math.floor(AVERAGES[r.key])).map(r=>`${r.planet} (${r.d9.bav})`);
        const beneficD10 = goelData.filter(r => r.d10.bav > Math.floor(AVERAGES[r.key])).map(r=>`${r.planet} (${r.d10.bav})`);

        const GoelCell = ({val, isBav}) => {
          const col = isBav
            ? (val>=5?"#4ADE80":val>=4?"#F59E0B":"#FB7185")
            : (val>=28?"#4ADE80":val>=24?"#F59E0B":"#FB7185");
          return <span style={{color:col, fontWeight:900, textShadow:`0 0 10px ${col}40`}}>{val}</span>;
        };

        return (
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-amber-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                 वर्ग कुंडलियों पर अष्टकवर्ग का जादू (V.P. Goel Rule)
              </h3>
              <p className="text-xs text-slate-400 mt-1">D1 (बेस) की तुलना में D9 और D10 के बिंदु</p>
            </div>

            {/* SAV Comparison */}
            <div className="mb-6 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/20">
              <div className="p-2 bg-emerald-500/10 border-b border-emerald-500/20 text-center text-xs font-bold text-emerald-400 uppercase tracking-widest">
                सर्वाष्टक (SAV) तुलना
              </div>
              <table className="w-full text-center text-[11px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700 text-slate-300">
                    <th className="p-2 border-r border-slate-700 text-amber-400">ग्रह</th>
                    <th className="p-2 border-r border-slate-700">D1 राशि</th>
                    <th className="p-2 border-r border-slate-700">SAV बेस</th>
                    <th className="p-2 border-r border-slate-700 bg-emerald-900/10 text-emerald-300">D9 राशि</th>
                    <th className="p-2 border-r border-slate-700 bg-emerald-900/20 text-emerald-300">D9 SAV</th>
                    <th className="p-2 border-r border-slate-700 bg-indigo-900/10 text-indigo-300">D10 राशि</th>
                    <th className="p-2 bg-indigo-900/20 text-indigo-300">D10 SAV</th>
                  </tr>
                </thead>
                <tbody>
                  {goelData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                      <td className="p-2 border-r border-slate-700 font-bold text-slate-200">{row.planet}</td>
                      <td className="p-2 border-r border-slate-700 text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d1.rashi}</td>
                      <td className="p-2 border-r border-slate-700 bg-slate-800/30"><GoelCell val={row.d1.sav} isBav={false}/></td>
                      <td className="p-2 border-r border-slate-700 text-slate-400 bg-emerald-900/10" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d9.rashi}</td>
                      <td className="p-2 border-r border-slate-700 bg-emerald-900/20"><GoelCell val={row.d9.sav} isBav={false}/></td>
                      <td className="p-2 border-r border-slate-700 text-slate-400 bg-indigo-900/10" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d10.rashi}</td>
                      <td className="p-2 bg-indigo-900/20"><GoelCell val={row.d10.sav} isBav={false}/></td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800/80 font-black border-t-2 border-slate-600">
                    <td colSpan="2" className="p-2 border-r border-slate-700 text-right text-slate-300 text-[10px]">कुल बेस:</td>
                    <td className="p-2 border-r border-slate-700 text-amber-400 text-[13px]">{t.d1Sav}</td>
                    <td className="p-2 border-r border-slate-700 text-right text-emerald-400 bg-emerald-900/30 text-[10px]">D9 योग:</td>
                    <td className="p-2 border-r border-slate-700 bg-emerald-900/30">
                      <span className={`text-[13px] ${t.d9Sav>t.d1Sav?'text-emerald-400':'text-amber-500'}`}>{t.d9Sav} {t.d9Sav>t.d1Sav?"🚀":""}</span>
                    </td>
                    <td className="p-2 border-r border-slate-700 text-right text-indigo-400 bg-indigo-900/30 text-[10px]">D10 योग:</td>
                    <td className="p-2 bg-indigo-900/30">
                      <span className={`text-[13px] ${t.d10Sav>t.d1Sav?'text-indigo-400':'text-amber-500'}`}>{t.d10Sav} {t.d10Sav>t.d1Sav?"🚀":""}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAV Comparison */}
            <div className="mb-5 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/20">
              <div className="p-2 bg-cyan-500/10 border-b border-cyan-500/20 text-center text-xs font-bold text-cyan-400 uppercase tracking-widest">
                भिन्नाष्टक (BAV) तुलना
              </div>
              <table className="w-full text-center text-[11px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700 text-slate-300">
                    <th className="p-2 border-r border-slate-700 text-cyan-400">ग्रह</th>
                    <th className="p-2 border-r border-slate-700">D1 राशि</th>
                    <th className="p-2 border-r border-slate-700">BAV बेस</th>
                    <th className="p-2 border-r border-slate-700 bg-emerald-900/10 text-emerald-300">D9 राशि</th>
                    <th className="p-2 border-r border-slate-700 bg-emerald-900/20 text-emerald-300">D9 BAV</th>
                    <th className="p-2 border-r border-slate-700 bg-indigo-900/10 text-indigo-300">D10 राशि</th>
                    <th className="p-2 bg-indigo-900/20 text-indigo-300">D10 BAV</th>
                  </tr>
                </thead>
                <tbody>
                  {goelData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                      <td className="p-2 border-r border-slate-700 font-bold text-slate-200">{row.planet}</td>
                      <td className="p-2 border-r border-slate-700 text-slate-400" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d1.rashi}</td>
                      <td className="p-2 border-r border-slate-700 bg-slate-800/30"><GoelCell val={row.d1.bav} isBav={true}/></td>
                      <td className="p-2 border-r border-slate-700 text-slate-400 bg-emerald-900/10" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d9.rashi}</td>
                      <td className="p-2 border-r border-slate-700 bg-emerald-900/20"><GoelCell val={row.d9.bav} isBav={true}/></td>
                      <td className="p-2 border-r border-slate-700 text-slate-400 bg-indigo-900/10" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{row.d10.rashi}</td>
                      <td className="p-2 bg-indigo-900/20"><GoelCell val={row.d10.bav} isBav={true}/></td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800/80 font-black border-t-2 border-slate-600">
                    <td colSpan="2" className="p-2 border-r border-slate-700 text-right text-slate-300 text-[10px]">कुल बेस:</td>
                    <td className="p-2 border-r border-slate-700 text-cyan-400 text-[13px]">{t.d1Bav}</td>
                    <td className="p-2 border-r border-slate-700 text-right text-emerald-400 bg-emerald-900/30 text-[10px]">D9 योग:</td>
                    <td className="p-2 border-r border-slate-700 bg-emerald-900/30">
                      <span className={`text-[13px] ${t.d9Bav>t.d1Bav?'text-emerald-400':'text-amber-500'}`}>{t.d9Bav} {t.d9Bav>t.d1Bav?"🚀":""}</span>
                    </td>
                    <td className="p-2 border-r border-slate-700 text-right text-indigo-400 bg-indigo-900/30 text-[10px]">D10 योग:</td>
                    <td className="p-2 bg-indigo-900/30">
                      <span className={`text-[13px] ${t.d10Bav>t.d1Bav?'text-indigo-400':'text-amber-500'}`}>{t.d10Bav} {t.d10Bav>t.d1Sav?"🚀":""}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Benefic Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {label:"नवांश (D9) — दशा में लाभ देने वाले ग्रह", list:beneficD9, color:"#a78bfa"},
                {label:"दशमांश (D10) — दशा में लाभ देने वाले ग्रह", list:beneficD10, color:"#60a5fa"}
              ].map(({label,list,color}) => (
                <div key={label} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-2" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{label}</div>
                  <div className="font-bold text-sm" style={{color, fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                    {list.length > 0 ? list.join(", ") : "कोई नहीं"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* LEGEND */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 p-3 rounded-xl bg-slate-800/20 border border-slate-700/40">
        <span className="text-[10px] text-slate-500 font-bold" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>रंग संकेत:</span>
        {[
          {c:"#34D399", l:"शास्त्र लक्ष्य ≥ प्राप्त"},
          {c:"#22D3EE", l:"लक्ष्य से -5 तक"},
          {c:"#F59E0B", l:"लक्ष्य से -10 तक"},
          {c:"#F87171", l:"निम्न"},
          {c:"#fb923c", l:"त्रिक भाव अधिक ⚠"},
          {c:"#c084fc", l:"8वाँ भाव: दीर्घायु (>40)"},
        ].map(x => (
          <div key={x.l} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{background:x.c}}/>
            <span className="text-[9px] text-slate-500" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{x.l}</span>
          </div>
        ))}
        <div className="w-full border-t border-slate-700/30 mt-1 pt-1 flex flex-wrap gap-2 justify-center">
          <span className="text-[9px] text-slate-600" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            त्रिक भाव (6,8,12): नारंगी बॉर्डर · BAV में 0 बिंदु = धुंधला लाल (ग्रह असहायक)
          </span>
        </div>
      </div>

    </div>
  );
}