import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Info, Activity } from "lucide-react";

const COMPONENTS = [
  ["sthana", "स्थान बल", "Sthana Bala"],
  ["dig", "दिग्बल", "Dig Bala"],
  ["kala", "काल बल", "Kala Bala"],
  ["chesta", "चेष्टा बल", "Cheshta Bala"],
  ["naisargika", "नैसर्गिक बल", "Naisargika Bala"],
  ["drik", "दृष्टि बल", "Drik Bala"],
];
const MIN_COMPONENTS = {
  sthana: { Su: 165, Me: 165, Ju: 165, Mo: 133, Ve: 133, Ma: 96, Sa: 96 },
  dig: { Su: 35, Mo: 35, Ma: 35, Me: 35, Ju: 35, Ve: 35, Sa: 35 },
  kala: { Su: 30, Mo: 30, Ma: 30, Me: 30, Ju: 30, Ve: 30, Sa: 30 },
  chesta: { Ma: 40, Me: 40, Ju: 40, Ve: 40, Sa: 40 },
  ayana: { Su: 30, Mo: 30, Ma: 30, Me: 30, Ju: 30, Ve: 30, Sa: 30 },
};

const DETAIL_LABELS = {
  uchcha: "उच्च बल", saptavargaja: "सप्तवर्गज बल", ojhayugmarashi: "ओजयुग्म राशि बल",
  kendra: "केन्द्र बल", drekkana: "द्रेष्काण बल", nathonnatha: "नतोन्नत बल", paksha: "पक्ष बल",
  tribhaga: "त्रिभाग बल", varsha: "वर्षेश बल", masa: "मासेश बल", dina: "दिनेश बल",
  hora: "होरापति बल", ayana: "अयन बल", yuddha: "युद्ध बल"
};

function getStatus(planet) {
  const minimum = MIN_SHADBALA[planet?.code];
  const received = Number(planet?.total_virupas);
  if (!minimum || !Number.isFinite(received)) return null;
  return { minimum, percent: (received / minimum) * 100, strong: received >= minimum };
}

function getComponentWarnings(planet) {
  if (!planet?.components) return [];
  const warnings = [];
  for (const [key, perPlanet] of Object.entries(MIN_COMPONENTS)) {
    const threshold = perPlanet[planet.code];
    if (threshold == null) continue;
    const received = key === "ayana"
      ? Number(planet.components?.kala?.details?.ayana)
      : Number(planet.components?.[key]?.virupas);
    if (Number.isFinite(received) && received < threshold) {
      const label = key === "sthana" ? "स्थान बल" : key === "dig" ? "दिग्बल" : key === "kala" ? "काल बल" : key === "chesta" ? "चेष्टा बल" : "अयन बल";
      warnings.push({ key, label, received, threshold });
    }
  }
  return warnings;
}

function fmt(v) {
  return Number.isFinite(Number(v)) ? Number(v).toFixed(2) : "—";
}

export default function ShadbalaPanel({ data, chartData }) {
  const [selected, setSelected] = useState("Su");
  const [showMethod, setShowMethod] = useState(false);
  const rows = data?.planets || [];
  const current = useMemo(() => rows.find(p => p.code === selected) || rows[0], [rows, selected]);
  if (!data || !rows.length) {
    return <div className="rounded-2xl border border-amber-500/20 bg-slate-950/50 p-5 text-sm text-slate-400">
      <div className="font-bold text-amber-300 mb-1">षड्बल गणना उपलब्ध नहीं है</div>
      {data?.error || "Chart response में Shadbala data नहीं मिला। Backend logs और API response जाँचें।"}
    </div>;
  }
  return <div className="space-y-4 pb-6">
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-lg font-black text-amber-300">षड्बल · Shadbala</div>
          <div className="text-xs text-slate-400 mt-1">ग्रहवार छह प्रकार के बल · D1 आधारित</div>
        </div>
        <button onClick={() => setShowMethod(v => !v)} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/40">
          <Info size={14}/>{showMethod ? "विधि छिपाएँ" : "गणना विधि"}
        </button>
      </div>
      {showMethod && <div className="mt-3 rounded-xl border border-slate-800 bg-black/20 p-3 text-xs text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-200">Calculation notes</div>
        <div>{data.method}</div>
        {(data.assumptions || []).map((note, i) => <div key={i}>• {note}</div>)}
      </div>}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {rows.map(p => {
        const active = p.code === current?.code;
        return <button key={p.code} onClick={() => setSelected(p.code)} className={`text-left rounded-xl border p-3 transition-colors ${active ? "border-amber-400/50 bg-amber-500/[0.08]" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
          <div className="flex items-center justify-between gap-2">
            <div><div className="text-sm font-bold text-slate-100">{p.planet}</div><div className="text-[10px] text-slate-500">{p.sign} · भाव {p.house}{p.retrograde ? " · वक्री" : ""}</div></div>
            <div className="text-right"><div className="text-lg font-black text-amber-300">{fmt(p.total_rupas)}</div><div className="text-[9px] text-slate-500">रूप</div></div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>कुल विरूपा</span><span>{fmt(p.total_virupas)}</span></div>
          <div className="h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-amber-400" style={{width:`${Math.max(0,Math.min(100,(Number(p.total_virupas)||0)/600*100))}%`}}/></div>
        </button>;
      })}
    </div>

    {current && <div className="rounded-2xl border border-slate-800 bg-slate-950/55 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div><div className="text-base font-bold text-slate-100">{current.planet} का Shadbala Breakdown</div><div className="text-[10px] text-slate-500 mt-1">{current.sign} · भाव {current.house}</div></div>
        <div className="text-right"><div className="text-2xl font-black text-amber-300">{fmt(current.total_virupas)} <span className="text-xs font-medium">विरूपा</span></div><div className="text-xs text-slate-400">{fmt(current.total_rupas)} रूप</div></div>
      </div>
      {getComponentWarnings(current).length > 0 && <div className="p-3 border-b border-amber-500/20 bg-amber-500/[0.05]"><div className="text-xs font-bold text-amber-200 mb-2">घटक-वार चेतावनी</div><div className="space-y-1.5">{getComponentWarnings(current).map(w => <div key={w.key} className="text-xs text-amber-100/90">• {w.label}: {fmt(w.received)} / {w.threshold} विरूपा — निर्धारित न्यूनतम से कम</div>)}</div><div className="mt-2 text-[10px] text-slate-500">ये component warnings हैं; overall status कुल Shadbala threshold से तय होता है।</div></div>}
      <div className="divide-y divide-slate-800/80">
        {COMPONENTS.map(([key, hi, en]) => {
          const c = current.components?.[key] || {};
          return <details key={key} className="group">
            <summary className="cursor-pointer list-none p-3 sm:px-4 flex items-center gap-3 hover:bg-slate-900/50">
              <div className="w-8 h-8 rounded-lg bg-slate-800/70 flex items-center justify-center"><Activity size={15} className="text-amber-300"/></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-slate-200">{hi}</div><div className="text-[10px] text-slate-500">{en}</div></div>
              <div className="text-sm font-bold tabular-nums text-amber-200">{fmt(c.virupas)} <span className="text-[9px] text-slate-500">वि.</span></div>
              <ChevronDown size={14} className="text-slate-500 group-open:hidden"/><ChevronUp size={14} className="text-slate-500 hidden group-open:block"/>
            </summary>
            {c.details && <div className="px-4 pb-4 pl-14 space-y-2">
              {Object.entries(c.details).filter(([k,v]) => typeof v === "number" && !["house","maximum_house","third"].includes(k)).map(([k,v]) => <div key={k} className="flex justify-between gap-3 text-xs"><span className="text-slate-400">{DETAIL_LABELS[k] || k}</span><span className="text-slate-200 tabular-nums">{fmt(v)} विरूपा</span></div>)}
              {c.details.house && <div className="text-[10px] text-slate-500">ग्रह भाव: {c.details.house}{c.details.maximum_house ? ` · अधिकतम दिग्बल भाव: ${c.details.maximum_house}` : ""}</div>}
              {c.details.motion && <div className="text-xs text-slate-300">गति: {c.details.motion} · Speed: {c.details.speed}</div>}
              {c.details.saptavargaja_details && <div className="mt-2"><div className="text-[10px] text-slate-500 mb-1">सप्तवर्गज — वर्गवार</div>{c.details.saptavargaja_details.map(d => <div key={d.varga} className="flex justify-between text-[10px] py-1 border-b border-slate-800/60"><span className="text-slate-400">{d.varga} · {d.sign} · {d.dignity}</span><span className="text-slate-200">{fmt(d.points)}</span></div>)}</div>}
              {c.details.aspects?.length > 0 && <div className="mt-2"><div className="text-[10px] text-slate-500 mb-1">Drik Bala — ग्रह दृष्टियाँ</div>{c.details.aspects.map((a,i) => <div key={`${a.planet}-${i}`} className="flex justify-between text-[10px] py-1 border-b border-slate-800/60"><span className="text-slate-400">{a.planet} · {a.angle}° · {a.nature}</span><span className={a.points >= 0 ? "text-emerald-300" : "text-rose-300"}>{fmt(a.points)}</span></div>)}</div>}
            </div>}
          </details>;
        })}
      </div>
    </div>}
    <div className="text-[10px] text-slate-600 leading-relaxed">नोट: यह Shadbala v1 implementation है। ऊपर गणना-विधि में बताए गए assumptions के कारण इसे canonical classical score मानने से पहले अपने चुने हुए ग्रंथ/पद्धति के test charts से validate करें।</div>
  </div>;
}
