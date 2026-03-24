// SutrasPanel.jsx — Planetary Sutras: Disease, Wealth, Relatives, Suffering
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PLANET_META } from "../../constants";

const ENG_TO_OUR = {Sun:"Su",Moon:"Mo",Mars:"Ma",Mercury:"Me",Jupiter:"Ju",Venus:"Ve",Saturn:"Sa",Rahu:"Ra",Ketu:"Ke"};

const SECTION_META = {
  disease_analysis:    { label:"स्वास्थ्य",     icon:"🏥", color:"#FB7185" },
  benefits_losses:     { label:"लाभ-हानि",       icon:"💰", color:"#34D399" },
  marak_analysis:      { label:"मारक ग्रह",       icon:"⚠️", color:"#FB923C" },
  suffering_analysis:  { label:"कष्ट",           icon:"😢", color:"#C084FC" },
  relatives_analysis:  { label:"रिश्तेदार",       icon:"👨‍👩‍👧‍👦", color:"#67E8F9" },
  adultery_indicators: { label:"व्यभिचारी योग",  icon:"🔴", color:"#F43F5E" },
  lustful_indicators:  { label:"कामुक योग",       icon:"🟠", color:"#F97316" },
};

function PlanetBadge({ name }) {
  const code = ENG_TO_OUR[name] || name;
  const pm = PLANET_META[code] || {};
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-lg font-bold"
      style={{ background:`${pm.color||"#94A3B8"}15`, color:pm.color||"#94A3B8",
        border:`1px solid ${pm.color||"#94A3B8"}25` }}>
      {pm.symbol||name[0]} {pm.hi||name}
    </span>
  );
}

function IndicatorCard({ item, color }) {
  const [open, setOpen] = useState(false);
  const sev = item.severity || item.risk_level || item.intensity || item.level || "";
  const sevColor = /उच्च|high|critical|गंभीर/i.test(sev) ? "#FB7185"
                 : /मध्यम|medium|moderate/i.test(sev) ? "#F59E0B"
                 : "#22D3EE";

  return (
    <motion.div layout className="rounded-xl border overflow-hidden"
      style={{ background:"rgba(10,14,32,.92)", borderColor:`${color}20` }}>
      <div className="px-3 py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setOpen(o=>!o)}>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-white"
            style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
            {item.planet_hindi || item.title || item.name || item.planet || "—"}
          </div>
          {(item.possible_diseases || item.effect || item.description || item.suffering_areas) && (
            <div className="text-[9px] text-slate-500 mt-0.5 line-clamp-1"
              style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
              {item.possible_diseases || item.effect || item.description || item.suffering_areas}
            </div>
          )}
        </div>
        {sev && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background:`${sevColor}15`, color:sevColor, border:`1px solid ${sevColor}30`,
              fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
            {sev}
          </span>
        )}
        {open ? <ChevronUp size={11} className="text-slate-700 flex-shrink-0 mt-0.5"/>
               : <ChevronDown size={11} className="text-slate-700 flex-shrink-0 mt-0.5"/>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}
            className="border-t border-white/5 px-3 pb-3 pt-2 flex flex-col gap-1.5">
            {item.body_parts && (
              <div className="text-[9px] text-slate-400"
                style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                🫀 {Array.isArray(item.body_parts) ? item.body_parts.join(", ") : item.body_parts}
              </div>
            )}
            {item.planet && <PlanetBadge name={item.planet} />}
            {item.remedies?.map((r,i) => (
              <div key={i} className="text-[9px] text-slate-500 pl-2 border-l border-white/8"
                style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>• {r}</div>
            ))}
            {item.description && item.description !== (item.possible_diseases || item.effect) && (
              <div className="text-[9px] text-slate-400 leading-relaxed"
                style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                {item.description}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionBlock({ sectionKey, data }) {
  const [open, setOpen] = useState(true);
  const meta = SECTION_META[sectionKey] || { label:sectionKey, icon:"•", color:"#94A3B8" };
  if (!data) return null;

  // Normalize items array from different output formats
  const items = Array.isArray(data) ? data
    : data.disease_indicators || data.marak_planets || data.suffering_indicators
    || data.adultery_yogas || data.lustful_yogas || data.relative_effects
    || (data.analysis ? Object.values(data.analysis) : null)
    || [];

  const overallStatus = data.overall_health_status || data.overall_risk
    || data.overall_level || data.net_result || null;

  if (!items.length && !overallStatus) return null;

  return (
    <div className="mb-3">
      <button onClick={() => setOpen(o=>!o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1.5 hover:bg-white/3 transition-colors"
        style={{ background:"rgba(255,255,255,.03)", border:`1px solid rgba(255,255,255,.06)` }}>
        <span className="text-base">{meta.icon}</span>
        <span className="text-[11px] font-black flex-1 text-left"
          style={{ color:meta.color, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          {meta.label}
        </span>
        {overallStatus && (
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background:`${meta.color}12`, color:meta.color, border:`1px solid ${meta.color}25`,
              fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
            {overallStatus}
          </span>
        )}
        <span className="text-[9px] text-slate-600">{items.length}</span>
        {open ? <ChevronUp size={11} className="text-slate-600"/>
               : <ChevronDown size={11} className="text-slate-600"/>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            className="flex flex-col gap-1.5 pl-1">
            {items.map((item, i) => (
              <IndicatorCard key={i} item={item} color={meta.color} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Benefits-Losses special display (net score based)
function BenefitsLossesBlock({ data }) {
  const [open, setOpen] = useState(true);
  const meta = SECTION_META.benefits_losses;
  if (!data) return null;

  // Can be {planet: {net_score, benefit, loss, description}} or array
  const entries = Array.isArray(data) ? data
    : data.planet_effects ? Object.entries(data.planet_effects).map(([k,v])=>({planet:k,...v}))
    : data.analysis ? Object.entries(data.analysis).map(([k,v])=>({planet:k,...v}))
    : [];

  if (!entries.length) return null;
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(o=>!o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1.5 hover:bg-white/3 transition-colors"
        style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
        <span className="text-base">{meta.icon}</span>
        <span className="text-[11px] font-black flex-1 text-left"
          style={{ color:meta.color, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
          {meta.label}
        </span>
        {open ? <ChevronUp size={11} className="text-slate-600"/>
               : <ChevronDown size={11} className="text-slate-600"/>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} className="flex flex-col gap-1.5 pl-1">
            {entries.map((e, i) => {
              const net = e.net_score ?? e.net ?? 0;
              const color = net > 0 ? "#22D3EE" : net < 0 ? "#FB7185" : "#94A3B8";
              const code = ENG_TO_OUR[e.planet] || e.planet;
              const pm = PLANET_META[code] || {};
              return (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                  style={{ background:`${color}05`, borderColor:`${color}18` }}>
                  <span style={{ color:pm.color||"#94A3B8", fontSize:16 }}>{pm.symbol||e.planet?.[0]}</span>
                  <span className="text-[10px] font-bold flex-1"
                    style={{ color:pm.color||"#fff", fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                    {pm.hi||e.planet}
                  </span>
                  {e.description && (
                    <span className="text-[9px] text-slate-500 flex-1 line-clamp-1"
                      style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                      {e.description}
                    </span>
                  )}
                  <span className="text-[11px] font-black flex-shrink-0"
                    style={{ color }}>
                    {net > 0 ? "+" : ""}{net}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SutrasPanel({ data }) {
  if (!data || data.error) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-3xl">🪐</div>
      <div className="text-sm text-slate-600" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
        {data?.error ? `सूत्र डेटा उपलब्ध नहीं: ${data.error}` : "सूत्र डेटा लोड हो रहा है…"}
      </div>
    </div>
  );

  return (
    <div className="pb-6">
      <SectionBlock sectionKey="disease_analysis"   data={data.disease_analysis} />
      <BenefitsLossesBlock                           data={data.benefits_losses} />
      <SectionBlock sectionKey="marak_analysis"     data={data.marak_analysis} />
      <SectionBlock sectionKey="suffering_analysis" data={data.suffering_analysis} />
      <SectionBlock sectionKey="relatives_analysis" data={data.relatives_analysis} />
      <SectionBlock sectionKey="adultery_indicators" data={data.adultery_indicators} />
      <SectionBlock sectionKey="lustful_indicators" data={data.lustful_indicators} />
    </div>
  );
}
