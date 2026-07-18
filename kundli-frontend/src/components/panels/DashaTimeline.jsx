// DashaTimeline — Premium Accordion Dasha Explorer with Complete Lazy Loading + Backend Tara Matrix
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Search, Calendar, Loader2 } from "lucide-react";
import { PLANET_META } from "../../constants";
import DashaAVTab from "./DashaAVTab";   

// ── Planet constants ─────────────────────────────────────────
const LORDS    = ["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
const YEARS    = {"केतु":7,"शुक्र":20,"सूर्य":6,"चंद्र":10,"मंगल":7,"राहु":18,"गुरु":16,"शनि":19,"बुध":17};
const TO_CODE  = {"केतु":"Ke","शुक्र":"Ve","सूर्य":"Su","चंद्र":"Mo","मंगल":"Ma","राहु":"Ra","गुरु":"Ju","शनि":"Sa","बुध":"Me"};

const TINTS = {
  Su:{bg:"rgba(245,158,11,0.07)",border:"rgba(245,158,11,0.22)",glow:"rgba(245,158,11,0.13)"},
  Mo:{bg:"rgba(148,163,184,0.07)",border:"rgba(148,163,184,0.18)",glow:"rgba(148,163,184,0.1)"},
  Ma:{bg:"rgba(239,68,68,0.07)",border:"rgba(239,68,68,0.2)",glow:"rgba(239,68,68,0.11)"},
  Me:{bg:"rgba(16,185,129,0.07)",border:"rgba(16,185,129,0.2)",glow:"rgba(16,185,129,0.11)"},
  Ju:{bg:"rgba(249,115,22,0.07)",border:"rgba(249,115,22,0.2)",glow:"rgba(249,115,22,0.11)"},
  Ve:{bg:"rgba(236,72,153,0.07)",border:"rgba(236,72,153,0.2)",glow:"rgba(236,72,153,0.11)"},
  Sa:{bg:"rgba(139,92,246,0.07)",border:"rgba(139,92,246,0.2)",glow:"rgba(139,92,246,0.11)"},
  Ra:{bg:"rgba(99,102,241,0.07)",border:"rgba(99,102,241,0.2)",glow:"rgba(99,102,241,0.11)"},
  Ke:{bg:"rgba(148,163,184,0.05)",border:"rgba(148,163,184,0.15)",glow:"rgba(148,163,184,0.07)"},
};
const T = c => TINTS[c] || TINTS.Su;

function calcPct(start, end) {
  const s = new Date(parseInt(start),0,1);
  const e = new Date(parseInt(end),0,1);
  const now = new Date();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now-s)/(e-s))*100);
}

function getADs(lord) {
  const i = LORDS.indexOf(lord); if(i<0) return [];
  return LORDS.map((_,j)=>LORDS[(i+j)%9]);
}
function getPDs(lord) {
  const i = LORDS.indexOf(lord); if(i<0) return [];
  return LORDS.map((_,j)=>LORDS[(i+j)%9]);
}

function ProgressBar({pct, color="#F59E0B", delay=0}) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5">
      <motion.div className="absolute inset-y-0 left-0 rounded-full"
        style={{background:`linear-gradient(90deg,${color}70,${color})`}}
        initial={{width:0}} animate={{width:`${pct}%`}}
        transition={{duration:1.1,delay,ease:"easeOut"}}/>
    </div>
  );
}

// 🌟 TARA LOOKUP ENGINE — Uses Backend Matrix OR Falls Back to Pure Calculation
const TARA_NAMES = ["जन्म", "सम्पत", "विपत", "क्षेम", "प्रत्यरि", "साधक", "वध", "मित्र", "अतिमित्र"];

function getTaraFromMatrix(fromCode, toCode, taraMatrix) {
  // Try backend taraMatrix first (PREFERRED)
  if (taraMatrix && taraMatrix[fromCode] && taraMatrix[fromCode][toCode]) {
    return taraMatrix[fromCode][toCode];
  }
  return null;
}

function getTaraFallback(fromCode, toCode, planetsObj) {
  // Fallback: Pure frontend calculation using degrees
  if (!planetsObj || !planetsObj[fromCode] || !planetsObj[toCode]) return null;
  const d1 = planetsObj[fromCode].fullDegree !== undefined ? planetsObj[fromCode].fullDegree : planetsObj[fromCode].Degree;
  const d2 = planetsObj[toCode].fullDegree !== undefined ? planetsObj[toCode].fullDegree : planetsObj[toCode].Degree;
  if (d1 === undefined || d2 === undefined) return null;

  const fromNak = Math.floor(d1 / (360/27));
  const toNak = Math.floor(d2 / (360/27));
  let diff = (toNak - fromNak) % 9;
  if (diff < 0) diff += 9;
  return TARA_NAMES[diff];
}

function getTara(fromCode, toCode, taraMatrix, planetsObj) {
  // PRIMARY: Use backend matrix
  let tara = getTaraFromMatrix(fromCode, toCode, taraMatrix);
  // FALLBACK: Use degree-based calculation
  if (!tara) tara = getTaraFallback(fromCode, toCode, planetsObj);
  return tara;
}

function TaraBadge({ label, tara }) {
  if (!tara) return null;
  let colorClass = "text-slate-300";
  if (["वध", "विपत", "प्रत्यरि"].includes(tara)) colorClass = "text-rose-400 font-bold";
  else if (["सम्पत", "क्षेम", "साधक", "मित्र", "अतिमित्र"].includes(tara)) colorClass = "text-emerald-400 font-bold";
  else if (tara === "जन्म") colorClass = "text-cyan-400 font-bold";

  return (
    <span className="whitespace-nowrap flex gap-1">
      <span className="text-slate-500">{label}:</span> <span className={colorClass}>{tara}</span>
    </span>
  );
}

// 🌟 LAZY LOADING CALCULATION ENGINES (360-Day Saavan Year)
function generateADsLazy(mdLord, mdStartStr, mdDurDays, yearLength = 360.0) {
  if (!mdStartStr || !mdLord) return [];
  let [d, m, y] = mdStartStr.split('-');
  let curTimeMs = Date.UTC(y, m - 1, d);

  const ads = [];
  const startIdx = LORDS.indexOf(mdLord);

  for (let i = 0; i < 9; i++) {
    const adLord = LORDS[(startIdx + i) % 9];
    const adDurDays = (mdDurDays / yearLength) * YEARS[adLord] * yearLength;
    const nextTimeMs = curTimeMs + (adDurDays * 86400000);

    const curDt = new Date(curTimeMs);
    const nextDt = new Date(nextTimeMs);

    ads.push({
      lord: adLord,
      start: `${String(curDt.getUTCDate()).padStart(2,'0')}-${String(curDt.getUTCMonth()+1).padStart(2,'0')}-${curDt.getUTCFullYear()}`,
      end: `${String(nextDt.getUTCDate()).padStart(2,'0')}-${String(nextDt.getUTCMonth()+1).padStart(2,'0')}-${nextDt.getUTCFullYear()}`,
      duration_days: adDurDays
    });
    curTimeMs = nextTimeMs;
  }
  return ads;
}

function generatePDsLazy(adLord, adStartStr, adDurDays, mdLord, mdDurDays, yearLength = 360.0) {
  if (!adStartStr || !adLord) return [];
  let [d, m, y] = adStartStr.split('-');
  let curTimeMs = Date.UTC(y, m - 1, d);

  const pds = [];
  const startIdx = LORDS.indexOf(adLord);

  for (let i = 0; i < 9; i++) {
    const pdLord = LORDS[(startIdx + i) % 9];
    const pdDurDays = (mdDurDays * YEARS[adLord] * YEARS[pdLord] / 14400.0) * yearLength;
    const nextTimeMs = curTimeMs + (pdDurDays * 86400000);

    const curDt = new Date(curTimeMs);
    const nextDt = new Date(nextTimeMs);

    pds.push({
      lord: pdLord,
      start: `${String(curDt.getUTCDate()).padStart(2,'0')}-${String(curDt.getUTCMonth()+1).padStart(2,'0')}-${curDt.getUTCFullYear()}`,
      end: `${String(nextDt.getUTCDate()).padStart(2,'0')}-${String(nextDt.getUTCMonth()+1).padStart(2,'0')}-${nextDt.getUTCFullYear()}`,
      duration_days: pdDurDays
    });
    curTimeMs = nextTimeMs;
  }
  return pds;
}

// 🔥 FIX: Added taraMatrix parameter to correctly fetch Tara during lazy load
function generateSDsLazy(mdLord, adLord, pdLord, pdStartStr, taraMatrix) {
  if (!pdStartStr || !mdLord || !adLord || !pdLord) return [];
  const pdDurDays = (YEARS[mdLord] * YEARS[adLord] * YEARS[pdLord] / 14400.0) * 360.0;
  
  let [d, m, y] = pdStartStr.split('-');
  let curTimeMs = Date.UTC(y, m - 1, d);
  
  const sds = [];
  const startIdx = LORDS.indexOf(pdLord);
  const pdLordCode = TO_CODE[pdLord] || "Su";
  
  for (let i = 0; i < 9; i++) {
      const sdLord = LORDS[(startIdx + i) % 9];
      const sdLordCode = TO_CODE[sdLord] || "Su";
      const sdDurDays = pdDurDays * (YEARS[sdLord] / 120.0);
      const nextTimeMs = curTimeMs + (sdDurDays * 86400000); 
      
      const curDt = new Date(curTimeMs);
      const nextDt = new Date(nextTimeMs);
      
      // 🔥 TARA: तुरंत matrix से निकाल दो
      const taraMoon = taraMatrix?.["Mo"]?.[sdLordCode] || null;
      const taraLord = taraMatrix?.[pdLordCode]?.[sdLordCode] || null;
      
      sds.push({
          lord: sdLord,
          start: `${String(curDt.getUTCDate()).padStart(2,'0')}-${String(curDt.getUTCMonth()+1).padStart(2,'0')}-${curDt.getUTCFullYear()}`,
          end: `${String(nextDt.getUTCDate()).padStart(2,'0')}-${String(nextDt.getUTCMonth()+1).padStart(2,'0')}-${nextDt.getUTCFullYear()}`,
          duration_days: sdDurDays,
          taraMoon: taraMoon,
          taraLord: taraLord
      });
      curTimeMs = nextTimeMs;
  }
  return sds;
}

// 🔥 FIX: Added taraMatrix parameter to correctly fetch Tara during lazy load
function generatePRsLazy(sdLord, sdStartStr, sdDurDays, taraMatrix) {
  if (!sdStartStr || !sdLord) return [];
  let [d, m, y] = sdStartStr.split('-');
  let curTimeMs = Date.UTC(y, m - 1, d);
  
  const prs = [];
  const startIdx = LORDS.indexOf(sdLord);
  const sdLordCode = TO_CODE[sdLord] || "Su";
  
  for (let i = 0; i < 9; i++) {
      const prLord = LORDS[(startIdx + i) % 9];
      const prLordCode = TO_CODE[prLord] || "Su";
      const prDurDays = sdDurDays * (YEARS[prLord] / 120.0);
      const nextTimeMs = curTimeMs + (prDurDays * 86400000);
      
      const curDt = new Date(curTimeMs);
      const nextDt = new Date(nextTimeMs);
      
      // 🔥 TARA: तुरंत matrix से निकाल दो
      const taraMoon = taraMatrix?.["Mo"]?.[prLordCode] || null;
      const taraLord = taraMatrix?.[sdLordCode]?.[prLordCode] || null;
      
      prs.push({
          lord: prLord,
          start: `${String(curDt.getUTCDate()).padStart(2,'0')}-${String(curDt.getUTCMonth()+1).padStart(2,'0')}-${curDt.getUTCFullYear()}`,
          end: `${String(nextDt.getUTCDate()).padStart(2,'0')}-${String(nextDt.getUTCMonth()+1).padStart(2,'0')}-${nextDt.getUTCFullYear()}`,
          taraMoon: taraMoon,
          taraLord: taraLord
      });
      curTimeMs = nextTimeMs;
  }
  return prs;
}

// ── Level 5: Pranadasha Grid ─────────────────────────────────────────
function PRGrid({ sdLord, prData, curPR, isCurrentSD, chartMeta, sdStart, sdDurDays }) {
  const list = getPDs(sdLord);
  const sdLordCode = TO_CODE[sdLord] || "Su";
  const taraMatrix = chartMeta?.taraMatrix;
  
  // ⚡ LAZY LOAD DATES: Passed taraMatrix to generatePRsLazy
  const resolvedPrData = useMemo(() => {
      if (prData && prData.length > 0) return prData;
      return generatePRsLazy(sdLord, sdStart, sdDurDays, taraMatrix);
  }, [prData, sdLord, sdStart, sdDurDays, taraMatrix]);

  const findPR = (lord) => resolvedPrData?.find(p => p.lord === lord || p.lord_hi === lord || p.planet === lord);

  return (
    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="mt-2">
      <div className="px-2 pb-3 pt-2 border-t border-violet-900/40">
        <div className="text-[9px] text-violet-400/60 uppercase tracking-widest mb-2" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          प्राण दशा
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {list.map((lord, i) => {
            const code = TO_CODE[lord] || "Su";
            const meta = PLANET_META[code] || {};
            const t = T(code);
            const isCur = isCurrentSD && lord === curPR;
            const prEntry = findPR(lord);
            
            // 🔥 Tara Logic: Use Backend Matrix + Fallback
            const taraMoon = prEntry?.taraMoon || getTara("Mo", code, taraMatrix, chartMeta?.planets);
            const taraLord = prEntry?.taraLord || getTara(sdLordCode, code, taraMatrix, chartMeta?.planets);

            return (
              <motion.div key={i} initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.03 }}
                className="p-2 rounded-lg border transition-all"
                style={{
                  background: isCur ? `${t.bg}` : "rgba(0,0,0,0.2)",
                  borderColor: isCur ? t.border : "rgba(255,255,255,0.08)",
                  boxShadow: isCur ? `0 0 12px ${t.glow}` : "none",
                }}>
                <div className="text-[11px] font-bold text-slate-100 mb-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{lord}</div>
                <div className="text-[7.5px] text-slate-500 mb-1.5 font-mono">{prEntry?.start} → {prEntry?.end}</div>
                
                {/* Tara Badges */}
                <div className="flex gap-1 flex-wrap mb-1">
                  <TaraBadge label="चं" tara={taraMoon} />
                  <TaraBadge label="प्र" tara={taraLord} />
                </div>

                {isCur && (
                  <div className="text-[7px] px-1 py-0.5 rounded-full text-center"
                    style={{background:`${meta.color}40`, color:meta.color, fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                    चालू
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Level 4: Sookshma Dasha Grid ─────────────────────────────────────────
function SDGrid({ pdLord, sdData, curSD, curPR, isCurrentPD, chartMeta, mdLord, adLord, pdStart, pdDurDays }) {
  const list = getPDs(pdLord);
  const pdLordCode = TO_CODE[pdLord] || "Su";
  const taraMatrix = chartMeta?.taraMatrix;
  
  // ⚡ LAZY LOAD DATES: Passed taraMatrix to generateSDsLazy
  const resolvedSdData = useMemo(() => {
      if (sdData && sdData.length > 0) return sdData;
      return generateSDsLazy(mdLord, adLord, pdLord, pdStart, taraMatrix);
  }, [sdData, mdLord, adLord, pdLord, pdStart, taraMatrix]);

  const findSD = (lord) => resolvedSdData?.find(s => s.lord === lord || s.lord_hi === lord || s.planet === lord);

  const [openSD, setOpenSD] = useState(isCurrentPD ? curSD : null);
  const openSDEntry = findSD(openSD);

  return (
    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="mt-2">
      <div className="px-2 pb-3 pt-2 border-t border-indigo-900/40">
        <div className="text-[9px] text-indigo-400/60 uppercase tracking-widest mb-2" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          सूक्ष्म दशा
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {list.map((lord, i) => {
            const code = TO_CODE[lord] || "Su";
            const meta = PLANET_META[code] || {};
            const t = T(code);
            const isCur = isCurrentPD && lord === curSD;
            const isSelected = openSD === lord;
            const sdEntry = findSD(lord);
            
            // 🔥 Tara Logic: Use Backend Matrix + Fallback
            const taraMoon = sdEntry?.taraMoon || getTara("Mo", code, taraMatrix, chartMeta?.planets);
            const taraLord = sdEntry?.taraLord || getTara(pdLordCode, code, taraMatrix, chartMeta?.planets);

            return (
              <motion.button key={i} onClick={() => setOpenSD(isSelected ? null : lord)} initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.03 }}
                className={`relative w-full text-left rounded-xl p-2 border transition-all ${isCur ? "ring-1 ring-indigo-400/50 shadow-sm shadow-indigo-500/20" : ""} ${isSelected && !isCur ? "ring-1 ring-white/30" : ""}`}
                style={{ background: isCur || isSelected ? t.glow : t.bg, borderColor: isCur || isSelected ? t.border : "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-black" style={{ color:meta.color }}>{meta.symbol}</span>
                  <span className="text-[10px] font-semibold text-slate-300 truncate" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{lord}</span>
                </div>
                {sdEntry ? <div className="text-[9px] text-slate-500">{sdEntry.start}–{sdEntry.end}</div> : <div className="text-[9px] text-slate-600">{YEARS[lord]}y</div>}

                {/* Tara Badges */}
                <div className="mt-1 flex items-center justify-between px-1.5 py-0.5 rounded text-[7.5px] bg-black/20 border border-white/5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                   <TaraBadge label="चं" tara={taraMoon} />
                   <TaraBadge label="ना" tara={taraLord} />
                </div>

                {isCur && <span className="absolute -top-1 -right-1 text-[7px] px-1 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/50" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>चालू</span>}
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {openSD && (
            <PRGrid
              sdLord={openSD}
              prData={openSDEntry?.pranadashas}
              curPR={curPR}
              isCurrentSD={isCurrentPD && openSD === curSD}
              chartMeta={chartMeta}
              sdStart={openSDEntry?.start}
              sdDurDays={openSDEntry?.duration_days}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Level 3: Pratyantara Grid ─────────────────────────────────────────
function PDGrid({ adLord, pdData, curPD, curSD, curPR, isCurrentAD, chartMeta, mdLord, adStart, adDurDays }) {
  const list = getPDs(adLord);
  const adLordCode = TO_CODE[adLord] || "Su";
  const taraMatrix = chartMeta?.taraMatrix;
  
  // ⚡ LAZY LOAD DATES
  const yearLength = chartMeta?.meta?.dashaYearType || 360.0;

  const resolvedPdData = useMemo(() => {
      if (pdData && pdData.length > 0) return pdData;
      return generatePDsLazy(adLord, adStart, adDurDays, mdLord, YEARS[mdLord], yearLength);
  }, [pdData, adLord, adStart, adDurDays, mdLord, yearLength]);

  const findPD = (lord) => resolvedPdData?.find(p => p.lord === lord || p.lord_hi === lord || p.planet === lord);

  const [openPD, setOpenPD] = useState(isCurrentAD ? curPD : null);
  const openPDEntry = findPD(openPD);

  return (
    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="mt-2">
      <div className="px-6 pb-3 pt-2 border-t border-slate-800/50">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2 flex justify-between" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          <span>प्रत्यंतर्दशा</span>
          <span className="text-[8px] normal-case text-slate-500">सूक्ष्म दशा देखने के लिए क्लिक करें</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {list.map((lord, i) => {
            const code = TO_CODE[lord] || "Su";
            const meta = PLANET_META[code] || {};
            const t = T(code);
            const isCur = isCurrentAD && lord === curPD;
            const isSelected = openPD === lord;
            const pdEntry = findPD(lord);
            
            // 🔥 Tara Logic: Use Backend Matrix + Fallback
            const taraMoon = pdEntry?.taraMoon || getTara("Mo", code, taraMatrix, chartMeta?.planets);
            const taraLord = pdEntry?.taraLord || getTara(adLordCode, code, taraMatrix, chartMeta?.planets);

            return (
              <motion.button key={i} onClick={() => setOpenPD(isSelected ? null : lord)} initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.03 }}
                className={`relative w-full text-left rounded-xl p-2 border transition-all ${isCur ? "ring-1 ring-amber-400/50 shadow-sm shadow-amber-500/20" : ""} ${isSelected && !isCur ? "ring-1 ring-white/30" : ""}`}
                style={{ background: isCur || isSelected ? t.glow : t.bg, borderColor: isCur || isSelected ? t.border : "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs font-black" style={{ color:meta.color }}>{meta.symbol}</span>
                  <span className="text-[10px] font-semibold text-slate-300 truncate" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{lord}</span>
                </div>
                {pdEntry ? <div className="text-[9px] text-slate-500">{pdEntry.start}–{pdEntry.end}</div> : <div className="text-[9px] text-slate-600">{YEARS[lord]}y</div>}

                {/* Tara Badges */}
                <div className="mt-1 flex items-center justify-between px-1.5 py-0.5 rounded text-[8px] bg-black/20 border border-white/5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                   <TaraBadge label="चं" tara={taraMoon} />
                   <TaraBadge label="ना" tara={taraLord} />
                </div>

                {isCur && <span className="absolute -top-1 -right-1 text-[7px] px-1 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>चालू</span>}
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {openPD && (
            <SDGrid
              pdLord={openPD}
              sdData={openPDEntry?.sookshmadashas || []}
              curSD={curSD}
              curPR={curPR}
              isCurrentPD={isCurrentAD && openPD === curPD}
              chartMeta={chartMeta}
              mdLord={mdLord}
              adLord={adLord}
              pdStart={openPDEntry?.start}
              pdDurDays={openPDEntry?.duration_days}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Level 2: Antardasha Row ───────────────────────────────────
function ADRow({ lord, adData, isCurrentMD, curAD, curPD, curSD, curPR, mdLord, mdLordCode, chartMeta }) {
  const [open, setOpen] = useState(false);
  const code = TO_CODE[lord]||"Su";
  const meta = PLANET_META[code]||{};
  const t = T(code);
  const isCur = isCurrentMD && lord===curAD;
  const taraMatrix = chartMeta?.taraMatrix;
  
  // 🔥 Tara Logic: Use Backend Matrix + Fallback
  const taraMoon = adData?.taraMoon || getTara("Mo", code, taraMatrix, chartMeta?.planets);
  const taraLord = adData?.taraLord || getTara(mdLordCode, code, taraMatrix, chartMeta?.planets);

  return (
    <div className={`border-b border-slate-800/40 last:border-0 ${isCur?"border-l-2 border-l-cyan-400/60":""}`}>
      <button onClick={()=>setOpen(o=>!o)}
        className={`w-full flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-left transition-colors hover:bg-white/3 ${open?"bg-white/3":""}`}>
        
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 border"
          style={{background:t.bg, color:meta.color, borderColor:t.border}}>{meta.symbol}</div>
        
        <div className="flex-1 flex flex-col justify-center min-w-0">
           <span className="text-xs font-semibold text-slate-300" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{lord}</span>
           {/* TARA INFO */}
           {(taraMoon || taraLord) && (
              <div className="text-[8.5px] mt-0.5 flex gap-1.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                 {taraMoon && <TaraBadge label="चंद्र" tara={taraMoon} />}
                 {taraMoon && taraLord && <span className="text-slate-700">|</span>}
                 {taraLord && <TaraBadge label="नाथ" tara={taraLord} />}
              </div>
           )}
        </div>

        <div className="text-right flex flex-col items-end mr-2">
            {adData ? <span className="text-[10px] text-slate-500">{adData.start} – {adData.end}</span> : <span className="text-[10px] text-slate-600">{YEARS[lord]} वर्ष</span>}
        </div>
        
        {isCur && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex-shrink-0"
            style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>वर्तमान</span>
        )}
        {open?<ChevronDown size={11} className="text-slate-600 flex-shrink-0 ml-2"/> :<ChevronRight size={11} className="text-slate-700 flex-shrink-0 ml-2"/>}
      </button>
      <AnimatePresence>
        {open && <PDGrid adLord={lord} pdData={adData?.pratyantardashas || []} curPD={curPD} curSD={curSD} curPR={curPR} isCurrentAD={isCur} chartMeta={chartMeta} mdLord={mdLord} adStart={adData?.start} adDurDays={adData?.duration_days} />}
      </AnimatePresence>
    </div>
  );
}

// ── Level 1: Mahadasha Card ───────────────────────────────────
function MDCard({ d, curMD, curAD, curPD, curSD, curPR, idx, chartMeta }) {
  const [isOpen, setIsOpen] = useState(false);
  const code = TO_CODE[d.lord] || "Su";
  const meta = PLANET_META[code] || {};
  const t = T(code);
  const isCur = d.lord === curMD;
  const hasADs = d.antardashas && d.antardashas.length > 0;
  const taraMatrix = chartMeta?.taraMatrix;
  
  // 🔥 Tara Logic: Use Backend Matrix + Fallback
  const taraMoon = d.taraMoon || getTara("Mo", code, taraMatrix, chartMeta?.planets);

  return (
    <motion.div
      className="border rounded-lg overflow-hidden transition-all"
      style={{
        background: isCur ? `${t.glow}` : "rgba(0,0,0,0.1)",
        borderColor: isCur ? t.border : "rgba(255,255,255,0.08)",
        boxShadow: isCur ? `0 0 24px ${t.glow}` : "none",
      }}
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:idx*0.05 }}>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left">
        
        {/* Planet Icon */}
        <div className="text-2xl" style={{ color: meta.color, filter:`drop-shadow(0 0 8px ${meta.color}70)` }}>
          {meta.symbol}
        </div>

        {/* Lord Name & Duration */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-slate-100 mb-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            {d.lord}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {d.start} → {d.end}
          </div>
          {taraMoon && (
            <div className="mt-1.5 flex gap-2 text-[10px]" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
              <div className="px-2 py-0.5 rounded bg-black/20 border border-white/5 inline-flex items-center">
                <TaraBadge label="चंद्र से तारा" tara={taraMoon} />
              </div>
            </div>
          )}
        </div>

        {/* Current Indicator + Expand Button */}
        {isCur && (
          <span className="text-[8px] px-2 py-1 rounded-full flex-shrink-0"
            style={{ background:`${meta.color}40`, color:meta.color, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
            चालू
          </span>
        )}
        {hasADs && (
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration:0.15 }}>
            <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
          </motion.div>
        )}
      </button>

      {/* AD Grid (Nested) */}
      <AnimatePresence>
        {isOpen && hasADs && (
          <motion.div
            initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 pt-2 border-t border-slate-700/40 space-y-2">
              {d.antardashas.map((ad, i) => (
                <ADRow
                  key={i}
                  lord={ad.lord}
                  adData={ad}
                  mdLord={d.lord}
                  mdLordCode={code}
                  curAD={curAD}
                  curPD={curPD}
                  curSD={curSD}
                  curPR={curPR}
                  isCurrentMD={isCur}
                  chartMeta={chartMeta}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function YearSelector({ sequence }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [results, setResults] = useState(null);
  const search = () => {
    let found = [];
    sequence?.forEach(md => {
      md.antardashas?.forEach(ad => {
        ad.pratyantardashas?.forEach(pd => {
          const startYear = parseInt(pd.start?.split("-")[2]) || 0;
          const endYear = parseInt(pd.end?.split("-")[2]) || 0;
          if (startYear <= year && year <= endYear) {
            found.push({mahadasha:md.lord, antardasha:ad.lord, pratyantara:pd.lord, start:pd.start, end:pd.end});
          }
        });
      });
    });
    setResults(found.length > 0 ? found : [{mahadasha:"—", antardasha:"—", pratyantara:"कोई डेटा नहीं"}]);
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-700/40 bg-slate-800/15">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={13} className="text-amber-400"/>
        <span className="text-sm font-semibold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>🔍 वर्ष चयनकर्ता</span>
      </div>
      <p className="text-[10px] text-slate-600 mb-3" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>किसी भी वर्ष की सक्रिय दशा देखें</p>

      <div className="flex gap-2 mb-1">
        <input type="number" value={year} min={1900} max={2100}
          onChange={e=>setYear(parseInt(e.target.value)||new Date().getFullYear())}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
          placeholder="वर्ष"/>
        <button onClick={search}
          className="px-4 py-2 rounded-xl bg-amber-500/18 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/28 transition-all flex items-center gap-1.5"
          style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
          दशा देखें
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-3">
            <div className="flex flex-col gap-2">
              {results.map((r,i) => {
                const codes = [TO_CODE[r.mahadasha]||"Su", TO_CODE[r.antardasha]||"Su", TO_CODE[r.pratyantara||r.pratyantardashas]||"Su"];
                const metas = codes.map(c=>PLANET_META[c]||{});
                return (
                  <motion.div key={i} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/25 flex-wrap">
                    {[r.mahadasha,r.antardasha,r.pratyantara||r.pratyantardashas].map((lord,li)=>(
                      <span key={li} className="flex items-center gap-1">
                        <span className="text-xs font-black" style={{color:metas[li].color||"#94A3B8"}}>{metas[li].symbol}</span>
                        <span className="text-xs text-slate-300" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{lord}</span>
                        {li<2&&<span className="text-slate-700 text-xs mx-0.5">›</span>}
                      </span>
                    ))}
                    {r.start && (
                      <span className="ml-auto text-[10px] text-slate-600" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                        {r.start} – {r.end}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlignmentSearch({ sequence }) {
  const [f, setF] = useState({md:"",ad:"",pd:""});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = () => {
    let found = [];
    sequence?.forEach(md => {
      if (f.md && md.lord !== f.md) return;
      md.antardashas?.forEach(ad => {
        if (f.ad && ad.lord !== f.ad) return;
        ad.pratyantardashas?.forEach(pd => {
          if (f.pd && pd.lord !== f.pd) return;
          found.push({mahadasha:md.lord, antardasha:ad.lord, pratyantara:pd.lord, start:pd.start, end:pd.end});
        });
      });
    });
    setResults(found);
  };

  const Sel = ({label, val, onChange}) => (
    <div className="flex-1">
      <div className="text-[10px] text-slate-600 mb-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{label}</div>
      <select value={val} onChange={e=>onChange(e.target.value)}
        className="w-full px-2 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        <option value="">कोई भी</option>
        {LORDS.map(l=><option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-4 rounded-2xl border border-slate-700/40 bg-slate-800/15">
      <div className="flex items-center gap-2 mb-1">
        <Search size={13} className="text-cyan-400"/>
        <span className="text-sm font-semibold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>🎯 दशा संरेखण खोज</span>
      </div>
      <p className="text-[10px] text-slate-600 mb-3" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        विशेष दशा संयोजन खोजें — जैसे "कब आएगा शनि-राहु-केतु का समय?"
      </p>

      <div className="flex gap-2 mb-3">
        <Sel label="महादशा"   val={f.md} onChange={v=>setF(x=>({...x,md:v}))}/>
        <Sel label="अंतर्दशा" val={f.ad} onChange={v=>setF(x=>({...x,ad:v}))}/>
        <Sel label="प्रत्यंतर" val={f.pd} onChange={v=>setF(x=>({...x,pd:v}))}/>
      </div>
      <button onClick={doSearch} disabled={loading}
        className="w-full py-2.5 rounded-xl bg-cyan-500/12 border border-cyan-500/28 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/22 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
        {loading && <Loader2 size={13} className="animate-spin"/>}
        खोजें
      </button>

      <AnimatePresence>
        {results !== null && (
          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-3">
            {results.length === 0
              ? <p className="text-[11px] text-slate-500 text-center py-3" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>कोई परिणाम नहीं मिला</p>
              : <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(99,102,241,0.25) transparent"}}>
                  <div className="text-[9px] text-slate-600 mb-1" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>मिले {results.length} परिणाम</div>
                  {results.map((r,i) => {
                    const lords = [r.mahadasha, r.antardasha, r.pratyantara||r.pratyantardashas];
                    const codes = lords.map(l=>TO_CODE[l]||"Su");
                    const metas = codes.map(c=>PLANET_META[c]||{});
                    return (
                      <motion.div key={i} initial={{opacity:0,x:-5}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                        className="px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/25">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          {lords.map((lord,li)=>(
                            <span key={li} className="flex items-center gap-1">
                              <span className="text-xs font-black" style={{color:metas[li].color||"#94A3B8"}}>{metas[li].symbol}</span>
                              <span className="text-xs font-semibold text-slate-200" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{lord}</span>
                              {li<2 && <span className="text-slate-600 text-xs">»</span>}
                            </span>
                          ))}
                        </div>
                        {(r.start||r.from) && (
                          <div className="text-[10px] text-slate-500 flex gap-3" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
                            <span>{r.start||r.from} से {r.end||r.to}</span>
                            {r.duration && <span className="text-slate-600">अवधि: {r.duration}</span>}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHA PREDICTIONS & YOGINI 
// ═══════════════════════════════════════════════════════════════════════════
const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C  = { amber:"#F59E0B",cyan:"#22D3EE",rose:"#FB7185",green:"#4ADE80",purple:"#C084FC",
             indigo:"#818CF8",orange:"#FB923C",teal:"#2DD4BF",red:"#EF4444",yellow:"#FCD34D",pink:"#F472B6" };

const MD_DATA = {
  Su:{ years:6, icon:"☉", color:"#FCD34D", name:"सूर्य महादशा",
    personality:"अहंकार बढ़ेगा पर आत्मविश्वास भी। सरकारी काम सबसे शुभ।",
    good:["सरकारी नौकरी/पद में उन्नति","पिता का सहयोग और आशीर्वाद","नेतृत्व की भूमिका मिलेगी","राजकीय/प्रशासनिक सम्मान","आत्मविश्वास चरम पर"],
    bad:["अहंकार की वजह से रिश्ते टूट सकते हैं","आंख/हृदय रोग (कमजोर सूर्य हो तो)","पिता का स्वास्थ्य ध्यान रखें","गर्मी और पित्त रोग"],
    career:"सरकार, राजनीति, प्रशासन, नेतृत्व, पशु चिकित्सा, खनन",
    tip:"इस दशा में सरकारी काम, राजकीय संबंध बनाएं। रविवार को सूर्य नमस्कार करें।",
    remedy:"सूर्य मंत्र: ॐ सूर्याय नमः | माणिक्य रत्न (यदि अनुकूल) | आदित्य हृदयम पाठ" },
  Mo:{ years:10, icon:"☽", color:"#94A3B8", name:"चंद्र महादशा",
    personality:"मन अत्यंत संवेदनशील। जनता से जुड़ाव बढ़ेगा। भावनाएं तीव्र होंगी।",
    good:["माता का आशीर्वाद और सहयोग","जनता से प्रेम — सार्वजनिक जीवन","संपत्ति/भूमि लाभ संभव","विदेश यात्रा योग","व्यापार में वृद्धि (जल/दूध/खाद्य)"],
    bad:["मानसिक उथल-पुथल, नींद की समस्या","पानी/नमी से रोग","माता की तबियत का ध्यान","भावुकता में गलत निर्णय"],
    career:"जनसेवा, राजनीति, होटल/खाद्य, कृषि, नौकायन, नर्सिंग",
    tip:"माता की सेवा करें। मन को शांत रखें। सोमवार व्रत शुभ।",
    remedy:"चंद्र मंत्र: ॐ चन्द्राय नमः | मोती रत्न | दूध दान सोमवार को" },
  Ma:{ years:7, icon:"♂", color:"#FB7185", name:"मंगल महादशा",
    personality:"ऊर्जा और साहस चरम पर। जोश में होश खोने से बचें।",
    good:["भूमि/संपत्ति लाभ","सेना/पुलिस/तकनीक में सफलता","भाई से सहयोग","साहसी कामों में सफलता"],
    bad:["दुर्घटना/चोट का उच्च खतरा","रक्त विकार, रक्तचाप","भाई से झगड़ा संभव","बहुत ऊर्जा — क्रोध में निर्णय न लें"],
    career:"सेना, पुलिस, इंजीनियरिंग, शल्य चिकित्सा, भूमि व्यवसाय, खेल",
    tip:"भूमि खरीदें। साहसी काम करें। मंगलवार को हनुमान पूजा।",
    remedy:"मंगल मंत्र: ॐ मंगलाय नमः | लाल मूंगा | हनुमान चालीसा" },
  Ra:{ years:18, icon:"☊", color:"#818CF8", name:"राहु महादशा",
    personality:"भ्रम और महत्वाकांक्षा साथ-साथ। विदेश से जुड़ाव बढ़ेगा।",
    good:["विदेश में सफलता/बसना","तकनीक/IT में उन्नति","अचानक बड़ा लाभ","राजनीति में अप्रत्याशित उभरना","नया सोचने की शक्ति"],
    bad:["भ्रम और झूठे वादों का शिकार","नाना/मातृ परिवार से दूरी","असामान्य/रहस्यमय बीमारियां","धोखाधड़ी का शिकार हो सकते हैं"],
    career:"विदेश, IT/तकनीक, राजनीति, जासूसी, रसायन, मास मीडिया",
    tip:"18 साल लंबी दशा। विदेश अवसर भुनाएं। गणेश पूजा नित्य करें।",
    remedy:"राहु मंत्र: ॐ राहवे नमः | गोमेद रत्न (यदि अनुकूल) | दुर्गा सप्तशती" },
  Ju:{ years:16, icon:"♃", color:"#FB923C", name:"गुरु महादशा",
    personality:"ज्ञान और धर्म की ओर झुकाव। धन और संतान के योग।",
    good:["संतान जन्म का शुभ समय","धन-संपत्ति में वृद्धि","शिक्षा में उच्च सफलता","विवाह के योग (यदि विवाह नहीं हुआ)","गुरु/संत का मार्गदर्शन मिलेगा"],
    bad:["मोटापे की समस्या बढ़ सकती है","लिवर की समस्या (कमजोर गुरु)","अति उदारता से नुकसान","कानूनी मामले (गुरु पीड़ित हो तो)"],
    career:"शिक्षा, धर्म/पुजारी, न्यायालय, बैंकिंग, वित्त, लेखन, चिकित्सा",
    tip:"शिक्षा/धर्म में निवेश करें। गुरुवार को पीले वस्त्र पहनें।",
    remedy:"गुरु मंत्र: ॐ गुरवे नमः | पुखराज रत्न | विष्णु सहस्रनाम" },
  Sa:{ years:19, icon:"♄", color:"#8B5CF6", name:"शनि महादशा",
    personality:"19 साल की कठिन पर फलदायी यात्रा। मेहनत का पक्का परिणाम।",
    good:["मेहनत का 100% फल मिलेगा (देरी से)","दीर्घकालिक स्थिर सफलता","नौकरशाही/सेवा में उन्नति","आध्यात्मिक जागरण","अनुशासन और व्यवस्था"],
    bad:["हर चीज में देरी — धैर्य जरूरी","जोड़ों/हड्डियों का दर्द","पुराने रोग उभर सकते हैं","मानसिक थकान और अवसाद"],
    career:"न्यायपालिका, श्रम, कृषि, लोहा/तेल, आध्यात्म, सफाई, सेवा",
    tip:"धैर्य रखें। निरंतर परिश्रम करते रहें। शनिवार को तेल दान।",
    remedy:"शनि मंत्र: ॐ शनिचराय नमः | नीलम (यदि अनुकूल) | शनि शिंगणापुर दर्शन" },
  Me:{ years:17, icon:"☿", color:"#4ADE80", name:"बुध महादशा",
    personality:"बुद्धि तेज, वाणी प्रभावशाली। व्यापार और लेखन से लाभ।",
    good:["व्यापार में जबरदस्त सफलता","लेखन/वाणी/मीडिया से लाभ","भांजे से लाभ","शिक्षा में उत्कृष्टता","नई भाषाएं सीखने का समय"],
    bad:["त्वचा रोग संभव","चालाकी में फंसना — सावधान","मित्र या व्यापारी से धोखा","अत्यधिक सोचने से निर्णय अटकना"],
    career:"व्यापार, लेखन, मीडिया/पत्रकारिता, गणित, कंप्यूटर, कानून, लेखाकार",
    tip:"व्यापार, लेखन, शिक्षा में आगे बढ़ें। बुधवार को हरा रंग पहनें।",
    remedy:"बुध मंत्र: ॐ बुधाय नमः | पन्ना रत्न | गणेश पूजा" },
  Ke:{ years:7, icon:"☋", color:"#2DD4BF", name:"केतु महादशा",
    personality:"वैराग्य और आध्यात्म की ओर। भौतिक सुख में कमी पर आंतरिक ज्ञान।",
    good:["आध्यात्मिक उन्नति","गूढ़ विद्याओं में प्रवीणता","पितामह का आशीर्वाद","मोक्ष की राह पर","तंत्र/ज्योतिष में सफलता"],
    bad:["रहस्यमय बीमारियां","दुर्घटना का भय","भटकाव और अनिश्चितता","भौतिक नुकसान","संबंधों में ठंडापन"],
    career:"आध्यात्म, तंत्र, ज्योतिष, पशु चिकित्सा, दर्शन, रिसर्च",
    tip:"ध्यान/साधना करें। तीर्थ यात्राएं करें। मंगलवार को गणेश पूजा।",
    remedy:"केतु मंत्र: ॐ केतवे नमः | लहसुनिया रत्न | गणेश अथर्वशीर्ष" },
  Ve:{ years:20, icon:"♀", color:"#F472B6", name:"शुक्र महादशा",
    personality:"सबसे लंबी दशा। विलासिता, प्रेम, कला का स्वर्णकाल।",
    good:["विवाह/प्रेम का सर्वोत्तम समय","वाहन/संपत्ति लाभ","कला/मनोरंजन में सफलता","विलासिता की वस्तुएं मिलेंगी","स्त्री सुख, सौंदर्य"],
    bad:["मधुमेह/चीनी रोग का खतरा","यौन रोग से सावधानी","अत्यधिक विलासिता से धन हानि","आंखों/गुर्दे का ध्यान रखें"],
    career:"कला, मनोरंजन, फैशन, सौंदर्य, विवाह व्यवसाय, होटल, वाहन",
    tip:"20 साल सबसे लंबी। विवाह, कला, संपत्ति के लिए सर्वोत्तम। शुक्रवार व्रत।",
    remedy:"शुक्र मंत्र: ॐ शुक्राय नमः | हीरा/ओपल | लक्ष्मी पूजा शुक्रवार" },
};

const AD_COMPAT = {
  Su:{Su:"मध्यम — स्वयं का अत्यधिक प्रभाव",Mo:"✅ अच्छा — माता/जनता से लाभ",Ma:"✅ मित्र — साहस और उन्नति",Me:"✅ मित्र — बुद्धि तेज, व्यापार",Ju:"✅ मित्र — धर्म-ज्ञान, पुत्र सुख",Ve:"⚠️ शत्रु — प्रेम-करियर में टकराव",Sa:"⚠️ शत्रु — बाधा, देरी, स्वास्थ्य",Ra:"⚠️ — भ्रम, अचानक परिवर्तन",Ke:"⚠️ — वैराग्य, आध्यात्मिक झुकाव"},
  Mo:{Su:"✅ — माता-पिता दोनों से लाभ",Mo:"मध्यम — अत्यधिक भावुकता",Ma:"⚠️ शत्रु — मानसिक तनाव, क्रोध",Me:"✅ मित्र — बुद्धि-भावना का संतुलन",Ju:"✅ मित्र — गजकेसरी सक्रिय",Ve:"✅ मित्र — प्रेम, सुख, संपत्ति",Sa:"⚠️ शत्रु — माता को कष्ट, तनाव",Ra:"⚠️ — मानसिक भ्रम, अस्थिरता",Ke:"⚠️ — वैराग्य, माता से दूरी"},
  Ma:{Su:"✅ मित्र — साहस, सरकारी काम",Mo:"⚠️ — मन अशांत, क्रोध",Ma:"मध्यम — अत्यधिक ऊर्जा",Me:"⚠️ शत्रु — व्यापार में झगड़े",Ju:"✅ मित्र — भूमि, संपत्ति, संतान",Ve:"⚠️ शत्रु — प्रेम में तनाव",Sa:"⚠️ शत्रु — दुर्घटना, रोग",Ra:"⚠️ — अचानक दुर्घटना",Ke:"मध्यम — आध्यात्मिक साहस"},
  Ra:{Su:"⚠️ — सरकार से टकराव",Mo:"⚠️ — मानसिक भ्रम",Ma:"⚠️ — अंगारक (यदि युति)",Me:"✅ — तकनीक, बुद्धि, व्यापार",Ju:"✅ — भाग्योदय, धन",Ve:"✅ — विलासिता, विदेश",Sa:"✅ — दीर्घकालिक लाभ (यदि बल हो)",Ra:"मध्यम — अत्यधिक राहु प्रभाव",Ke:"⚠️ — अचानक परिवर्तन, उथल-पुथल"},
  Ju:{Su:"✅ मित्र — सरकारी, पिता",Mo:"✅ गजकेसरी — धन, जनता",Ma:"✅ मित्र — साहस, संपत्ति",Me:"मध्यम — ज्ञान vs व्यापार",Ju:"✅ — सर्वश्रेष्ठ! धर्म-ज्ञान",Ve:"⚠️ शत्रु — करियर vs प्रेम",Sa:"⚠️ शत्रु — देरी, कानूनी",Ra:"मध्यम — विदेश भाग्य",Ke:"मध्यम — आध्यात्म गहरा"},
  Sa:{Su:"⚠️ शत्रु — सरकार से झगड़ा",Mo:"⚠️ शत्रु — माता को कष्ट",Ma:"⚠️ शत्रु — दुर्घटना, रोग",Me:"✅ मित्र — व्यापार, लेखन",Ju:"⚠️ शत्रु — कानूनी, देरी",Ve:"✅ मित्र — विवाह, वाहन",Sa:"✅ — कठोर परिश्रम का फल",Ra:"✅ — दीर्घकालिक, विदेश",Ke:"मध्यम — आध्यात्म, वैराग्य"},
  Me:{Su:"✅ मित्र — सरकारी, पिता",Mo:"✅ मित्र — जनता, माता",Ma:"⚠️ शत्रु — व्यापार-साहस टकराव",Me:"✅ — बुद्धि शिखर पर",Ju:"मध्यम — ज्ञान vs व्यापार",Ve:"✅ मित्र — कला, व्यापार",Sa:"✅ मित्र — व्यापार, अनुशासन",Ra:"⚠️ — धोखा संभव",Ke:"मध्यम — तकनीक vs आध्यात्म"},
  Ke:{Su:"⚠️ — पिता से दूरी, सरकार",Mo:"⚠️ — माता से दूरी, मन",Ma:"मध्यम — साहस + वैराग्य",Me:"मध्यम — बुद्धि + त्याग",Ju:"✅ — आध्यात्म + ज्ञान",Ve:"⚠️ — प्रेम में उदासीनता",Sa:"⚠️ — वैराग्य, अकेलापन",Ra:"⚠️ — अस्थिरता, भ्रम",Ke:"✅ — पूर्ण वैराग्य, मोक्ष"},
  Ve:{Su:"⚠️ शत्रु — करियर vs प्रेम",Mo:"✅ मित्र — सुख, सौंदर्य",Ma:"⚠️ शत्रु — प्रेम में झगड़े",Me:"✅ मित्र — कला, व्यापार",Ju:"⚠️ शत्रु — विवाह vs धर्म",Ve:"✅ — सर्वश्रेष्ठ सुख!",Sa:"✅ मित्र — वाहन, संपत्ति",Ra:"✅ — विलासिता, विदेश",Ke:"⚠️ — प्रेम में उदासीनता"},
};

function DashaPredictions({ curMD, curAD, curMDCode, curADCode, chartMeta }) {
  const [selMD, setSelMD] = useState(curMDCode || "Sa");
  const [showAD, setShowAD] = useState(false);
  const dd = MD_DATA[selMD];
  const compat = AD_COMPAT[selMD] || {};
  const PLANET_ORDER = ["Su","Mo","Ma","Ra","Ju","Sa","Me","Ke","Ve"];
  const isCurMD = selMD === curMDCode;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-1 flex items-center gap-2">
        <span className="flex-1 h-px bg-slate-800"/>
        <span style={HI}>📖 दशा फलादेश — विस्तृत</span>
        <span className="flex-1 h-px bg-slate-800"/>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {PLANET_ORDER.map(c => {
          const d = MD_DATA[c]; if(!d) return null;
          const meta = PLANET_META[c]||{};
          const isCur = c === curMDCode;
          const isSel = c === selMD;
          return <button key={c} onClick={() => setSelMD(c)}
            className="py-2.5 rounded-xl flex flex-col items-center gap-0.5 transition-all"
            style={{ background: isSel ? `${d.color}22` : isCur ? `${d.color}10` : "rgba(255,255,255,.04)",
              color: isSel ? d.color : isCur ? d.color : "#475569",
              border: isSel ? `2px solid ${d.color}55` : isCur ? `1px solid ${d.color}30` : "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ fontSize:16 }}>{d.icon}</span>
            <span className="text-[10px] font-black" style={HI}>{d.years}yr</span>
            {isCur && <span className="text-[8px] text-amber-400" style={HI}>चालू</span>}
          </button>;
        })}
      </div>

      {dd && <motion.div key={selMD} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}>
        <div className="p-4 rounded-2xl border" style={{ background:`${dd.color}0A`, borderColor:`${dd.color}35` }}>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize:28 }}>{dd.icon}</span>
            <div className="flex-1">
              <div className="text-[15px] font-black" style={{color:dd.color,...HI}}>{dd.name}</div>
              <div className="text-[11px] text-slate-400" style={HI}>अवधि: {dd.years} वर्ष</div>
            </div>
            {isCurMD && <span className="text-[10px] px-2.5 py-1 rounded-full font-black animate-pulse"
              style={{ background:`${dd.color}22`, color:dd.color, border:`1px solid ${dd.color}40`,...HI }}>⚡ चालू</span>}
          </div>

          <div className="p-2.5 rounded-xl mb-3" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)" }}>
            <div className="text-[12px] text-slate-300" style={HI}>👤 {dd.personality}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 rounded-xl" style={{ background:"rgba(74,222,128,.07)", border:"1px solid rgba(74,222,128,.2)" }}>
              <div className="text-[11px] font-black text-green-400 mb-2" style={HI}>✅ शुभ फल:</div>
              {dd.good.map((g,i) => <div key={i} className="text-[11px] text-slate-200 mb-1" style={HI}>• {g}</div>)}
            </div>
            <div className="p-3 rounded-xl" style={{ background:"rgba(251,113,133,.07)", border:"1px solid rgba(251,113,133,.2)" }}>
              <div className="text-[11px] font-black text-rose-400 mb-2" style={HI}>⚠️ सावधानी:</div>
              {dd.bad.map((b,i) => <div key={i} className="text-[11px] text-slate-200 mb-1" style={HI}>• {b}</div>)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl mb-2" style={{ background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.2)" }}>
            <div className="text-[11px] font-bold text-amber-400 mb-1" style={HI}>💼 करियर क्षेत्र:</div>
            <div className="text-[12px] text-slate-200" style={HI}>{dd.career}</div>
          </div>
          <div className="p-2.5 rounded-xl mb-2" style={{ background:"rgba(34,211,238,.06)", border:"1px solid rgba(34,211,238,.2)" }}>
            <div className="text-[11px] font-bold text-cyan-400 mb-1" style={HI}>💡 इस दशा में करें:</div>
            <div className="text-[12px] text-slate-200" style={HI}>{dd.tip}</div>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background:"rgba(192,132,252,.06)", border:"1px solid rgba(192,132,252,.2)" }}>
            <div className="text-[11px] font-bold text-purple-400 mb-1" style={HI}>🛡️ उपाय:</div>
            <div className="text-[12px] text-slate-300" style={HI}>{dd.remedy}</div>
          </div>
        </div>

        <button onClick={() => setShowAD(s => !s)}
          className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-black transition-all flex items-center justify-center gap-2"
          style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", color:C.amber }}>
          <span style={HI}>⚡ {dd.name} में अंतर्दशा फल</span>
          <span>{showAD ? "▲" : "▼"}</span>
        </button>

        <AnimatePresence>
          {showAD && <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
            exit={{height:0,opacity:0}} className="overflow-hidden mt-2">
            <div className="p-3 rounded-2xl" style={{ background:"rgba(8,12,28,.9)", border:"1px solid rgba(255,255,255,.06)" }}>
              <div className="text-[11px] font-bold text-amber-400 mb-3" style={HI}>
                {dd.name} में सभी अंतर्दशाओं का फल:
              </div>
              {PLANET_ORDER.map(c => {
                const adData = MD_DATA[c];
                const compat_text = compat[c] || "—";
                const meta = PLANET_META[c]||{};
                const isCurAD2 = (selMD === curMDCode) && (c === curADCode);
                const isGood = compat_text.includes("✅");
                const isBad = compat_text.includes("⚠️");
                const col = isGood ? C.green : isBad ? C.rose : C.amber;
                return <div key={c} className="flex items-start gap-2 p-2 rounded-lg mb-1"
                  style={{ background: isCurAD2 ? `${meta.color}15` : "rgba(255,255,255,.02)",
                    border: isCurAD2 ? `1px solid ${meta.color}30` : "1px solid transparent" }}>
                  <span style={{ color:meta.color, fontSize:14, flexShrink:0 }}>{meta.symbol}</span>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold" style={{ color:meta.color,...HI }}>{adData?.name?.split(" ")[0] || c} </span>
                    <span className="text-[11px]" style={{ color:col,...HI }}>{compat_text}</span>
                  </div>
                  {isCurAD2 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex-shrink-0" style={HI}>चालू</span>}
                </div>;
              })}
            </div>
          </motion.div>}
        </AnimatePresence>
      </motion.div>}
    </div>
  );
}

// ── योगिनी दशा ───────────────────────────────────────────────
const YOGINI_PLANET_CODE = {
  "Mo":"Mo", "Su":"Su", "Ju":"Ju", "Ma":"Ma",
  "Me":"Me", "Sa":"Sa", "Ve":"Ve", "Ra/Ke":"Ra",
};
const YOGINI_NAMES = {
  "Mo":"मंगला", "Su":"पिंगला", "Ju":"धान्या", "Ma":"भ्रामरी",
  "Me":"भद्रिका", "Sa":"उल्का", "Ve":"सिद्धा",
  "Ra/Ke":"संकटा", "Ra":"संकटा", "Ke":"संकटा",
};
const YOGINI_ACCENT = {
  "संकटा":"#818CF8","मंगला":"#94A3B8","पिंगला":"#F59E0B",
  "धान्या":"#FB923C","भ्रामरी":"#F87171","भद्रिका":"#34D399",
  "उल्का":"#A78BFA","सिद्धा":"#F472B6",
};
const yAccent = (planet) => YOGINI_ACCENT[YOGINI_NAMES[planet]] || "#94A3B8";

function yParse(s) {
  if (!s) return null;
  const p = s.split(" ")[0].split("-");
  if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  return null;
}
function yIsCur(start, end, now) {
  const s = yParse(start); const e = yParse(end);
  return s && e && now >= s && now < e;
}

function YoginiSDRow({ pds, isCurAD, now }) {
  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="text-[9px] text-pink-400/50 uppercase tracking-widest mb-1.5"
        style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>सूक्ष्म दशा</div>
      <div className="grid grid-cols-4 gap-1">
        {pds.map((sd, k) => {
          const sdCode   = YOGINI_PLANET_CODE[sd.planet] || "Su";
          const sdMeta   = PLANET_META[sdCode] || {};
          const isSdCur  = isCurAD && yIsCur(sd.start, sd.end, now);
          return (
            <div key={k}
              className={`p-1.5 rounded-lg border text-center ${isSdCur ? "ring-1" : ""}`}
              style={{
                background:  isSdCur ? `${sdMeta.color}20` : "rgba(255,255,255,0.02)",
                borderColor: isSdCur ? sdMeta.color : "rgba(255,255,255,0.05)",
              }}
            >
              <div className="text-xs font-black" style={{ color: sdMeta.color }}>{sdMeta.symbol}</div>
              <div className="text-[8px] font-bold truncate"
                style={{ color: yAccent(sd.planet), fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                {YOGINI_NAMES[sd.planet] || sd.planet}
              </div>
              <div className="text-[8px] text-slate-500 truncate"
                style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{sd.planet}</div>
              <div className="text-[7px] text-slate-600 font-mono leading-tight mt-0.5">
                {sd.start?.slice(0,5)}<br/>{sd.end?.slice(0,5)}
              </div>
              {isSdCur && (
                <div className="text-[7px] mt-0.5 rounded-full px-1"
                  style={{ background:`${sdMeta.color}30`, color:sdMeta.color,
                    fontFamily:"'Noto Sans Devanagari',sans-serif" }}>चालू</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YoginiPDSection({ pratyantardashas, isCurAD, now }) {
  const [openPD, setOpenPD] = useState(() => {
    if (!isCurAD) return null;
    const idx = pratyantardashas?.findIndex(pd => yIsCur(pd.start, pd.end, now));
    return idx >= 0 ? idx : null;
  });

  if (!pratyantardashas?.length) return null;

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="text-[9px] text-violet-400/50 uppercase tracking-widest mb-1.5"
        style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
        प्रत्यंतर दशा
      </div>
      <div className="flex flex-col gap-1">
        {pratyantardashas.map((pd, k) => {
          const pdCode   = YOGINI_PLANET_CODE[pd.planet] || "Su";
          const pdMeta   = PLANET_META[pdCode] || {};
          const isPdCur  = isCurAD && yIsCur(pd.start, pd.end, now);
          const isPdOpen = openPD === k;
          const hasSDs   = pd.sookshmadashas?.length > 0;

          return (
            <div key={k}
              className={`rounded-xl border overflow-hidden ${isPdCur ? "ring-1" : ""}`}
              style={{
                background:  isPdCur ? `${pdMeta.color}12` : "rgba(255,255,255,0.02)",
                borderColor: isPdCur ? pdMeta.color : "rgba(255,255,255,0.06)",
              }}
            >
              <button
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
                onClick={() => hasSDs && setOpenPD(isPdOpen ? null : k)}
              >
                <span className="text-xs font-black flex-shrink-0" style={{ color:pdMeta.color }}>
                  {pdMeta.symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold truncate"
                    style={{ color: yAccent(pd.planet), fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {YOGINI_NAMES[pd.planet] || pd.planet}
                  </div>
                  <div className="text-[9px] text-slate-500"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{pd.planet}</div>
                </div>
                {isPdCur && (
                  <span className="text-[8px] px-1 rounded-full flex-shrink-0"
                    style={{ background:`${pdMeta.color}30`, color:pdMeta.color,
                      fontFamily:"'Noto Sans Devanagari',sans-serif" }}>चालू</span>
                )}
                <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">
                  {pd.start?.slice(0,5)} – {pd.end?.slice(0,5)}
                </span>
                {hasSDs && (
                  <motion.div animate={{ rotate: isPdOpen ? 90 : 0 }} transition={{ duration:0.15 }}>
                    <ChevronRight size={11} className="text-slate-600 flex-shrink-0" />
                  </motion.div>
                )}
              </button>

              <AnimatePresence>
                {isPdOpen && hasSDs && (
                  <motion.div
                    initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                    exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 pb-2">
                      <YoginiSDRow pds={pd.sookshmadashas} isCurAD={isPdCur} now={now} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YoginiGrid({ yoginiData }) {
  const [openMD, setOpenMD] = useState({});
  const [openAD, setOpenAD] = useState({});

  if (!yoginiData || yoginiData.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-12"
        style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
        योगिनी दशा डेटा उपलब्ध नहीं है
      </div>
    );
  }

  const now = new Date();
  const toggleMD = (i) => setOpenMD(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleAD = (key) => setOpenAD(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2">
        <span className="w-3 h-px bg-slate-700 inline-block"/>
        <span style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          योगिनी महादशा — अंतर्दशा — प्रत्यंतर — सूक्ष्म (4 स्तर)
        </span>
        <span className="flex-1 h-px bg-slate-800 inline-block"/>
      </div>

      {yoginiData.map((md, i) => {
        const accent  = YOGINI_ACCENT[md.name] || "#F59E0B";
        const pCode   = YOGINI_PLANET_CODE[md.planet] || "Su";
        const t       = T(pCode);
        const meta    = PLANET_META[pCode] || {};
        const isMdCur = yIsCur(md.start, md.end, now);
        const isMdOpen = !!openMD[i];
        const ads     = md.antardashas || [];

        return (
          <motion.div key={i}
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border overflow-hidden ${isMdCur ? "ring-1 shadow-md" : ""}`}
            style={{
              background:  isMdCur ? t.glow : t.bg,
              borderColor: isMdCur ? accent : t.border,
              boxShadow:   isMdCur ? `0 0 18px ${accent}22` : "none",
            }}
          >
            <button className="w-full flex items-center gap-3 p-3.5 text-left"
              onClick={() => toggleMD(i)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
                style={{ background:`${accent}18`, borderColor:`${accent}40` }}>
                <span className="text-lg font-black" style={{ color:accent }}>
                  {meta.symbol || md.planet[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-bold"
                    style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", color:accent }}>
                    {md.name}
                  </span>
                  {md.nakshatra && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border"
                      style={{ background:`${accent}12`, borderColor:`${accent}35`, color:`${accent}cc`,
                        fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                      ★ {md.nakshatra}
                    </span>
                  )}
                  {isMdCur && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border animate-pulse"
                      style={{ background:`${accent}25`, borderColor:`${accent}60`, color:accent,
                        fontFamily:"'Noto Sans Devanagari',sans-serif" }}>● चालू</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap"
                  style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                  <span>{md.planet} · {md.duration_years} वर्ष</span>
                  {md.star_lord && (
                    <span className="text-slate-600">
                      नक्षत्र स्वामी: <span className="text-slate-400">{md.star_lord}</span>
                    </span>
                  )}
                  {md.prog_lagna && (
                    <span className="text-slate-600">
                      प्र॰ लग्न: <span style={{ color:`${accent}99` }}>{md.prog_lagna}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <div className="text-[10px] text-slate-400 font-mono">{md.start}</div>
                <div className="text-[10px] text-slate-600 font-mono">{md.end}</div>
              </div>
              {isMdCur && (() => {
                const s = yParse(md.start); const e = yParse(md.end);
                const pct = s && e ? Math.round(Math.min(100,((now-s)/(e-s))*100)) : 0;
                return (
                  <div className="w-12 flex-shrink-0">
                    <div className="text-[9px] text-center mb-1" style={{ color:accent }}>{pct}%</div>
                    <div className="h-1 rounded-full overflow-hidden bg-white/5">
                      <motion.div className="h-full rounded-full" style={{ background:accent }}
                        initial={{ width:0 }} animate={{ width:`${pct}%` }}
                        transition={{ duration:1, ease:"easeOut" }}/>
                    </div>
                  </div>
                );
              })()}
              <motion.div animate={{ rotate: isMdOpen ? 90 : 0 }} transition={{ duration:0.2 }}>
                <ChevronRight size={14} className="text-slate-600" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isMdOpen && ads.length > 0 && (
                <motion.div
                  initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                  exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor:`${accent}25` }}>
                    <div className="text-[9px] uppercase tracking-widest mb-2"
                      style={{ color:`${accent}80`, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                      अंतर्दशा — क्लिक करें → प्रत्यंतर देखें
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {ads.map((ad, j) => {
                        const adCode   = YOGINI_PLANET_CODE[ad.planet] || "Su";
                        const adMeta   = PLANET_META[adCode] || {};
                        const adAccent = adMeta.color || "#94A3B8";
                        const isAdCur  = isMdCur && yIsCur(ad.start, ad.end, now);
                        const adKey    = `${i}-${j}`;
                        const isAdOpen = !!openAD[adKey];
                        const hasPDs   = ad.pratyantardashas?.length > 0;

                        return (
                          <div key={j}
                            className={`rounded-xl border overflow-hidden ${isAdCur ? "ring-1" : ""}`}
                            style={{
                              background:  isAdCur ? `${adAccent}12` : "rgba(255,255,255,0.02)",
                              borderColor: isAdCur ? adAccent : "rgba(255,255,255,0.06)",
                              boxShadow:   isAdCur ? `0 0 8px ${adAccent}18` : "none",
                            }}
                          >
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-left"
                              onClick={() => hasPDs && toggleAD(adKey)}
                            >
                              <span className="text-sm font-black flex-shrink-0" style={{ color:adAccent }}>
                                {adMeta.symbol}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold truncate"
                                  style={{ color: yAccent(ad.planet), fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                                  {YOGINI_NAMES[ad.planet] || ad.planet}
                                </div>
                                <div className="text-[9px] text-slate-500"
                                  style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{ad.planet}</div>
                              </div>
                              {isAdCur && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background:`${adAccent}30`, color:adAccent,
                                    fontFamily:"'Noto Sans Devanagari',sans-serif" }}>चालू</span>
                              )}
                              <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">
                                {ad.start} – {ad.end}
                              </span>
                              {hasPDs && (
                                <motion.div animate={{ rotate: isAdOpen ? 90 : 0 }} transition={{ duration:0.15 }}>
                                  <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
                                </motion.div>
                              )}
                            </button>

                            <AnimatePresence>
                              {isAdOpen && hasPDs && (
                                <motion.div
                                  initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                                  exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3">
                                    <YoginiPDSection
                                      pratyantardashas={ad.pratyantardashas}
                                      isCurAD={isAdCur}
                                      now={now}
                                      accentColor={adAccent}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

const DASHA_TABS = [
  { id: "timeline",    label: "📅 दशा क्रम" },
  { id: "predictions", label: "📖 फलादेश" },
  { id: "dasha_av",   label: "🔢 AV विश्लेषण" },
  { id: "year",        label: "🔍 वर्ष चयन" },
  { id: "alignment",   label: "🎯 संरेखण" },
  { id: "yogini",      label: "✨ योगिनी दशा" },
];

function DashaInnerTabs({ active, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-4">
      {DASHA_TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
          style={{
            background: active === t.id ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
            color:      active === t.id ? "#F59E0B"              : "#64748B",
            border:     active === t.id ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.07)",
            fontFamily: "'Noto Sans Devanagari',sans-serif",
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function DashaTimeline({ dasha, chartMeta, currentYearType = 360.0, onYearTypeChange }) {
  if (!dasha) return null;
  const { current, sequence, yogini } = dasha;

  const [activeTab, setActiveTab] = useState("timeline");

  const curMD = current.mahadasha;
  const curAD = current.antardasha;
  const curPD = current.pratyantara;
  const curSD = current.sookshmadasha;
  const curPR = current.pranadasha;

  const curMDCode = TO_CODE[curMD] || "Su";
  const curADCode = TO_CODE[curAD] || "Su";
  const curPDCode = TO_CODE[curPD] || "Su";
  const curSDCode = TO_CODE[curSD] || "Su";
  const curPRCode = TO_CODE[curPR] || "Su";

  const m1 = PLANET_META[curMDCode]||{};
  const m2 = PLANET_META[curADCode]||{};
  const m3 = PLANET_META[curPDCode]||{};
  const m4 = PLANET_META[curSDCode]||{};
  const m5 = PLANET_META[curPRCode]||{};

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* 🌟 दशा वर्ष प्रणाली टॉगल बटन 🌟 */}
      {onYearTypeChange && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-700/40 bg-slate-800/20">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
            दशा वर्ष प्रणाली (Dasha Year)
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onYearTypeChange(360.0)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                currentYearType === 360.0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
              style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}
            >
              360 दिन (सावन)
            </button>
            <button
              onClick={() => onYearTypeChange(365.2425)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                currentYearType === 365.2425
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
              style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}
            >
              365.24 दिन (सौर)
            </button>
          </div>
        </div>
      )}

      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
        className="p-5 rounded-2xl border border-amber-500/28 bg-gradient-to-br from-amber-500/8 via-slate-900/50 to-slate-950/70 ring-1 ring-amber-500/15 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-2 text-[10px] text-amber-400/70 uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/>
          <span style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>वर्तमान दशा काल</span>
        </div>

        <div className="grid grid-cols-5 gap-2 md:gap-3 mb-4">
          {[
              {label:"महादशा", lord:curMD, code:curMDCode, meta:m1},
              {label:"अंतर्दशा", lord:curAD, code:curADCode, meta:m2},
              {label:"प्रत्यंतर", lord:curPD, code:curPDCode, meta:m3},
              {label:"सूक्ष्म", lord:curSD, code:curSDCode, meta:m4},
              {label:"प्राण", lord:curPR, code:curPRCode, meta:m5},
            ].map((d,i)=>{
            const t = T(d.code);
            return (
              <div key={i} className="text-center p-3 rounded-xl border"
                style={{background:t.glow, borderColor:t.border}}>
                <div className="text-2xl mb-1" style={{color:d.meta.color, filter:`drop-shadow(0 0 8px ${d.meta.color}60)`}}>{d.meta.symbol}</div>
                <div className="text-sm font-bold text-slate-100 mb-0.5" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{d.lord}</div>
                <div className="text-[10px] text-slate-500" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{d.label}</div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-slate-500" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>महादशा प्रगति</span>
            <span style={{color:m1.color}}>समाप्त: {current.endDate} · {current.progressPercent}%</span>
          </div>
          <ProgressBar pct={current.progressPercent} color={m1.color} delay={0.4}/>
        </div>
      </motion.div>

      <DashaInnerTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "timeline" && (
        <div>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-3 h-px bg-slate-700 inline-block"/>
            <span style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>महादशा → अंतर्दशा → प्रत्यंतर्दशा</span>
            <span className="flex-1 h-px bg-slate-800 inline-block"/>
          </div>
          <div className="flex flex-col gap-3">
            {sequence.map((d,i) => (
              <MDCard key={i} d={d} curMD={curMD} curAD={curAD} curPD={curPD} curSD={curSD} curPR={curPR} idx={i} chartMeta={chartMeta}/>
            ))}
          </div>
        </div>
      )}

      {activeTab === "predictions" && <DashaPredictions curMD={curMD} curAD={curAD} curMDCode={curMDCode} curADCode={curADCode} chartMeta={chartMeta}/>}
      {activeTab === "dasha_av" && <DashaAVTab data={chartMeta?.enginesData?.dasha_shani} />}
      {activeTab === "year" && <YearSelector sequence={sequence}/>}
      {activeTab === "alignment" && <AlignmentSearch sequence={sequence}/>}
      {activeTab === "yogini" && <YoginiGrid yoginiData={yogini} />}

    </div>
  );
}