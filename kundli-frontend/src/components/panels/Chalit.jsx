// src/components/panels/Chalit.jsx
// चलित पैनल — D1 vs Chalit comparison + Bhav Sandhi + Planet Strength
import { useState, useEffect, useCallback } from "react";
import useKundliStore from "../../store/useKundliStore";
import ShodhanaPanel from "./ShodhanaPanel"; // 🔥 NEW IMPORT

const HI = { fontFamily: "'Noto Sans Devanagari', sans-serif" };

const C = {
  teal   : "#2DD4BF",
  amber  : "#F59E0B",
  green  : "#4ADE80",
  yellow : "#FCD34D",
  red    : "#F87171",
  rose   : "#FB7185",
  cyan   : "#22D3EE",
  slate  : "#94A3B8",
  muted  : "#475569",
  bg     : "rgba(8,12,28,.97)",
  card   : "rgba(255,255,255,.04)",
  border : "rgba(255,255,255,.08)",
};

const PLANET_HI = {
  Su:"सूर्य", Mo:"चंद्र", Ma:"मंगल",
  Me:"बुध",  Ju:"गुरु",  Ve:"शुक्र",
  Sa:"शनि",  Ra:"राहु",  Ke:"केतु",
};
const PLANET_ORDER = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];

// ── Helpers ──────────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score > 14) return C.green;
  if (score >= 7) return C.yellow;
  return C.red;
}

function ScoreBar({ score }) {
  const color = scoreColor(score);
  const pct   = Math.min(100, (score / 20) * 100);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, borderRadius:4, background:"rgba(255,255,255,.08)", overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:4, transition:"width .6s ease" }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color, minWidth:28, textAlign:"right" }}>{score}</span>
    </div>
  );
}

function SLabel({ children, color = C.teal }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <div style={{ flex:1, height:1, background:`${color}25` }}/>
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color, textTransform:"uppercase", ...HI }}>{children}</span>
      <div style={{ flex:1, height:1, background:`${color}25` }}/>
    </div>
  );
}

function Card({ children, color = C.teal, style = {} }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${color}28`,
      borderRadius: 16,
      padding: "16px",
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Table wrapper with horizontal scroll on small screens ────────────────
function ScrollTable({ children }) {
  return (
    <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th style={{
      textAlign: align,
      padding: "6px 10px 8px",
      color: C.slate,
      fontWeight: 700,
      fontSize: 11,
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: "nowrap",
      ...HI,
    }}>{children}</th>
  );
}

function Td({ children, style = {} }) {
  return (
    <td style={{
      padding: "8px 10px",
      borderBottom: `1px solid rgba(255,255,255,.04)`,
      verticalAlign: "middle",
      ...style,
    }}>{children}</td>
  );
}

// ── Section 1: D1 vs Chalit Comparison ──────────────────────────────────
function ChalitkComparison({ chalit }) {
  const planets = PLANET_ORDER.filter(p => chalit[p]);

  if (!planets.length) {
    return <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>चलित डेटा उपलब्ध नहीं।</div>;
  }

  const changed = planets.filter(p => chalit[p]?.is_changed).length;

  return (
    <Card color={C.cyan}>
      <SLabel color={C.cyan}>D1 बनाम चलित भाव</SLabel>

      {/* summary pill */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {[
          { label:`${changed} ग्रह बदले`,         color:C.rose },
          { label:`${planets.length - changed} समान`, color:C.green },
        ].map((s,i) => (
          <span key={i} style={{
            fontSize:10, fontWeight:700, padding:"3px 10px",
            borderRadius:8, background:`${s.color}18`,
            color:s.color, border:`1px solid ${s.color}28`, ...HI,
          }}>{s.label}</span>
        ))}
      </div>

      <ScrollTable>
        <thead>
          <tr>
            <Th>ग्रह</Th>
            <Th align="center">D1 भाव</Th>
            <Th align="center">चलित भाव</Th>
            <Th align="center">स्थिति</Th>
          </tr>
        </thead>
        <tbody>
          {planets.map((code, i) => {
            const p       = chalit[code];
            const changed = p?.is_changed;
            const rowBg   = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
            return (
              <tr key={code} style={{ background:rowBg }}>
                <Td>
                  <span style={{ fontWeight:700, color:changed ? C.rose : C.slate, ...HI }}>
                    {PLANET_HI[code] || code}
                  </span>
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{ color:C.slate, fontWeight:600 }}>{p?.d1_house ?? "—"}वाँ</span>
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{ color: changed ? C.amber : C.green, fontWeight:700 }}>
                    {p?.house ?? "—"}वाँ
                  </span>
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{
                    fontSize:10, fontWeight:700,
                    padding:"2px 8px", borderRadius:6,
                    background: changed ? `${C.rose}18` : `${C.green}18`,
                    color: changed ? C.rose : C.green,
                    border: `1px solid ${changed ? C.rose : C.green}28`,
                    ...HI,
                  }}>
                    {changed ? "🔄 बदला" : "✔️ समान"}
                  </span>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ScrollTable>

      {/* Sandhi flags from chalit data */}
      {planets.some(p => chalit[p]?.is_bhav_sandhi) && (
        <div style={{
          marginTop:10, padding:"8px 12px", borderRadius:10,
          background:`${C.amber}10`, border:`1px solid ${C.amber}25`,
          fontSize:11, color:C.amber, ...HI,
        }}>
          ⚠️ {planets.filter(p => chalit[p]?.is_bhav_sandhi).map(p => PLANET_HI[p]).join(", ")} — भाव सन्धि में
        </div>
      )}
    </Card>
  );
}

// ── Section 2: Bhav Sandhi Boundaries ───────────────────────────────────
function BhavSandhiTable({ sandhi }) {
  if (!sandhi?.length) {
    return <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>भाव सन्धि डेटा उपलब्ध नहीं।</div>;
  }

  return (
    <Card color={C.amber}>
      <SLabel color={C.amber}>भाव सन्धि सीमाएँ</SLabel>
      <ScrollTable>
        <thead>
          <tr>
            <Th>भाव</Th>
            <Th align="right">आरंभ (°)</Th>
            <Th align="right">अंत (°)</Th>
            <Th align="right">विस्तार (°)</Th>
          </tr>
        </thead>
        <tbody>
          {sandhi.map((b, i) => {
            const span = b.end_deg >= b.start_deg
              ? b.end_deg - b.start_deg
              : 360 - b.start_deg + b.end_deg;
            const rowBg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
            return (
              <tr key={b.house} style={{ background:rowBg }}>
                <Td>
                  <span style={{ fontWeight:700, color:C.amber, ...HI }}>{b.house}वाँ</span>
                </Td>
                <Td style={{ textAlign:"right", fontFamily:"monospace", color:C.slate }}>
                  {b.start_deg.toFixed(2)}°
                </Td>
                <Td style={{ textAlign:"right", fontFamily:"monospace", color:C.slate }}>
                  {b.end_deg.toFixed(2)}°
                </Td>
                <Td style={{ textAlign:"right", fontFamily:"monospace", color:C.muted }}>
                  {span.toFixed(2)}°
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ScrollTable>
    </Card>
  );
}

// ── Section 3: Planet Strength ───────────────────────────────────────────
function PlanetStrengthTable({ strength }) {
  const planets = PLANET_ORDER.filter(p => strength[p]);

  if (!planets.length) {
    return <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>बल डेटा उपलब्ध नहीं।</div>;
  }

  const strong = planets.filter(p => strength[p].status === "strong").length;
  const medium = planets.filter(p => strength[p].status === "medium").length;
  const weak   = planets.filter(p => strength[p].status === "weak").length;

  return (
    <Card color={C.green}>
      <SLabel color={C.green}>भाव सन्धि बल (0–20)</SLabel>

      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {[
          { label:`${strong} बलवान`, color:C.green  },
          { label:`${medium} मध्यम`, color:C.yellow },
          { label:`${weak} दुर्बल`,  color:C.red    },
        ].map((s,i) => (
          <span key={i} style={{
            fontSize:10, fontWeight:700, padding:"3px 10px",
            borderRadius:8, background:`${s.color}18`,
            color:s.color, border:`1px solid ${s.color}28`, ...HI,
          }}>{s.label}</span>
        ))}
      </div>

      <ScrollTable>
        <thead>
          <tr>
            <Th>ग्रह</Th>
            <Th align="center">भाव</Th>
            <Th>Score (/20)</Th>
            <Th align="center">स्थिति</Th>
            <Th align="right">पूर्व°</Th>
            <Th align="right">उत्तर°</Th>
          </tr>
        </thead>
        <tbody>
          {planets.map((code, i) => {
            const p     = strength[code];
            const color = scoreColor(p.score);
            const rowBg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
            return (
              <tr key={code} style={{ background:rowBg }}>
                <Td>
                  <span style={{ fontWeight:700, color, ...HI }}>{PLANET_HI[code]}</span>
                </Td>
                <Td style={{ textAlign:"center", color:C.slate, fontWeight:600 }}>
                  {p.house}वाँ
                </Td>
                <Td style={{ minWidth:130 }}>
                  <ScoreBar score={p.score} />
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"2px 8px",
                    borderRadius:6, background:`${color}18`,
                    color, border:`1px solid ${color}28`, ...HI,
                  }}>
                    {p.status_hi}
                  </span>
                </Td>
                <Td style={{ textAlign:"right", fontFamily:"monospace", color:C.muted, fontSize:11 }}>
                  {p.poorva?.toFixed(2)}°
                </Td>
                <Td style={{ textAlign:"right", fontFamily:"monospace", color:C.muted, fontSize:11 }}>
                  {p.uttara?.toFixed(2)}°
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ScrollTable>

      {/* Legend */}
      <div style={{ marginTop:12, display:"flex", gap:12, flexWrap:"wrap", fontSize:10, color:C.muted, ...HI }}>
        <span>💪 बलवान = 14 से अधिक (मध्य के पास)</span>
        <span>〰️ मध्यम = 7–14</span>
        <span>⚠️ दुर्बल = 7 से कम या सन्धि पर</span>
      </div>
    </Card>
  );
}


// ── Section 4: Sudarshan Chakra ──────────────────────────────────────────
const SUDARSHAN_PURPLE = "#C084FC";

function SudarshanChakra({ sudarshan }) {
  if (!sudarshan || !Object.keys(sudarshan).length) {
    return <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>सुदर्शन डेटा उपलब्ध नहीं।</div>;
  }

  const houses        = Array.from({length:12}, (_,i) => sudarshan[String(i+1)]).filter(Boolean);
  const extraordinary = houses.filter(h => h.highlight === "extraordinary").length;
  const weak          = houses.filter(h => h.highlight === "weak").length;

  function sudColor(h) {
    if (h.highlight === "extraordinary") return "#FB923C";
    if (h.status === "अति उत्तम")       return C.green;
    if (h.status === "सामान्य")          return C.yellow;
    if (h.highlight === "weak")          return "#EF4444";
    return C.red;
  }

  return (
    <Card color={SUDARSHAN_PURPLE}>
      <SLabel color={SUDARSHAN_PURPLE}>🔱 सुदर्शन चक्र — सर्वाष्टक बल</SLabel>

      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {[
          { label:"लग्न + चंद्र + सूर्य",               color:SUDARSHAN_PURPLE },
          { label:`${extraordinary} असाधारण (>100)`,     color:"#FB923C"        },
          { label:`${weak} दुर्बल (<70)`,                color:C.red            },
        ].map((s,i) => (
          <span key={i} style={{
            fontSize:10, fontWeight:700, padding:"3px 10px",
            borderRadius:8, background:`${s.color}18`,
            color:s.color, border:`1px solid ${s.color}28`, ...HI,
          }}>{s.label}</span>
        ))}
      </div>

      <ScrollTable>
        <thead>
          <tr>
            <Th>भाव</Th>
            <Th>लग्न राशि</Th>
            <Th>चंद्र राशि</Th>
            <Th>सूर्य राशि</Th>
            <Th align="center">कुल अंक</Th>
            <Th align="center">स्थिति</Th>
          </tr>
        </thead>
        <tbody>
          {houses.map((h, i) => {
            const hnum  = i + 1;
            const color = sudColor(h);
            const rowBg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
            const tag   = h.highlight === "extraordinary" ? " 🔥" : h.highlight === "weak" ? " ⚠️" : "";
            return (
              <tr key={hnum} style={{ background:rowBg }}>
                <Td>
                  <span style={{ fontWeight:700, color:h.is_trik ? C.rose : SUDARSHAN_PURPLE, ...HI }}>
                    {hnum}वाँ{h.is_trik ? " ✦" : ""}
                  </span>
                </Td>
                <Td style={{ color:C.slate, ...HI, fontSize:11 }}>{h.lagna_rashi_hi}</Td>
                <Td style={{ color:C.slate, ...HI, fontSize:11 }}>{h.moon_rashi_hi}</Td>
                <Td style={{ color:C.slate, ...HI, fontSize:11 }}>{h.sun_rashi_hi}</Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{ fontWeight:700, fontSize:13, color }}>{h.total}{tag}</span>
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"2px 8px",
                    borderRadius:6, background:`${color}18`,
                    color, border:`1px solid ${color}28`, ...HI,
                  }}>{h.status}</span>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ScrollTable>

      <div style={{ marginTop:12, display:"flex", gap:12, flexWrap:"wrap", fontSize:10, color:C.muted, ...HI }}>
        <span>✦ = त्रिक भाव (6,8,12) — उल्टा नियम लागू</span>
        <span>🔥 असाधारण = 100 से अधिक</span>
        <span>⚠️ दुर्बल = 70 से कम</span>
        <span>सीमा = 85 अंक</span>
      </div>
    </Card>
  );
}


// ── Section 5: Yearly Prediction ─────────────────────────────────────────
const YEARLY_INDIGO = "#818CF8";

function YearlyPrediction({ yearly, onAgeChange, age, loading, error }) {
  function yColor(result, highlight) {
    if (highlight === "extraordinary") return "#FB923C";
    if (highlight === "weak")          return C.red;
    if (result === "अति उत्तम")        return C.green;
    if (result === "सामान्य")           return C.yellow;
    return C.red;
  }

  return (
    <Card color={YEARLY_INDIGO}>
      <SLabel color={YEARLY_INDIGO}>📅 वार्षिक फल (सुदर्शन आधारित)</SLabel>

      {/* Age input */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16,
        padding:"10px 14px", borderRadius:12,
        background:"rgba(129,140,248,.08)", border:"1px solid rgba(129,140,248,.2)" }}>
        <span style={{ fontSize:12, color:C.slate, ...HI }}>उम्र दर्ज करें:</span>
        <input
          type="number" min="1" max="120" value={age}
          onChange={e => onAgeChange(Number(e.target.value))}
          style={{
            width:70, padding:"4px 8px", borderRadius:8, fontSize:13,
            fontWeight:700, textAlign:"center", color:"white",
            background:"rgba(255,255,255,.08)",
            border:"1px solid rgba(129,140,248,.4)", outline:"none",
          }}
        />
        <span style={{ fontSize:11, color:C.muted, ...HI }}>वर्ष</span>
      </div>

      {loading ? (
        <div style={{ color:C.teal, fontSize:12, textAlign:"center", padding:20, ...HI }}>
          ⏳ गणना हो रही है...
        </div>
      ) : error ? (
        <div style={{ color:C.red, fontSize:11, padding:"10px 12px", borderRadius:10,
          background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", ...HI }}>
          ⚠️ {error}
        </div>
      ) : !yearly || !yearly.active_house ? (
        <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>
          उम्र डालें और सुदर्शन डेटा लोड करें।
        </div>
      ) : (
        <>
          {/* Year summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:16 }}>
            {[
              { label:"सक्रिय भाव",  value:`${yearly.active_house}वाँ${yearly.is_trik?" (त्रिक)":""}`, color:YEARLY_INDIGO },
              { label:"दशानाथ",      value:yearly.year_lord_hi,                                         color:C.amber      },
              { label:"सुदर्शन अंक", value:`${yearly.points} / 255`,                                    color:yColor(yearly.result, yearly.highlight) },
              { label:"वर्ष फल",     value:`${yearly.result}${yearly.highlight==="extraordinary"?" 🔥":yearly.highlight==="weak"?" ⚠️":""}`,
                color:yColor(yearly.result, yearly.highlight) },
            ].map((item,i) => (
              <div key={i} style={{
                padding:"10px 12px", borderRadius:10,
                background:`${item.color}10`, border:`1px solid ${item.color}20`,
              }}>
                <div style={{ fontSize:10, color:C.slate, marginBottom:3, ...HI }}>{item.label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:item.color, ...HI }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Cycle info */}
          <div style={{ fontSize:11, color:C.muted, marginBottom:14, ...HI }}>
            चक्र {yearly.cycle} • इस चक्र में {yearly.year_in_cycle}वाँ वर्ष
          </div>

          {/* Monthly table */}
          <div style={{ fontSize:11, fontWeight:700, color:YEARLY_INDIGO, marginBottom:8, ...HI }}>
            माहवार विवरण
          </div>
          <ScrollTable>
            <thead>
              <tr>
                <Th>माह</Th>
                <Th align="center">भाव</Th>
                <Th>दशानाथ</Th>
                <Th align="center">अंक</Th>
                <Th align="center">फल</Th>
              </tr>
            </thead>
            <tbody>
              {yearly.monthly?.map((m, i) => {
                const color = yColor(m.result, m.highlight);
                const rowBg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
                return (
                  <tr key={m.month} style={{ background:rowBg }}>
                    <Td>
                      <span style={{ fontSize:11, color:C.slate, ...HI }}>
                        {m.month}. {m.month_hi}
                      </span>
                    </Td>
                    <Td style={{ textAlign:"center" }}>
                      <span style={{ fontWeight:700, color:m.is_trik ? C.rose : YEARLY_INDIGO, ...HI }}>
                        {m.house}वाँ{m.is_trik?" ✦":""}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontWeight:700, color:C.amber, ...HI }}>{m.lord_hi}</span>
                    </Td>
                    <Td style={{ textAlign:"center" }}>
                      <span style={{ fontWeight:700, color, fontSize:12 }}>{m.points}</span>
                    </Td>
                    <Td style={{ textAlign:"center" }}>
                      <span style={{
                        fontSize:10, fontWeight:700, padding:"2px 7px",
                        borderRadius:6, background:`${color}18`,
                        color, border:`1px solid ${color}25`, ...HI,
                      }}>
                        {m.result}{m.highlight==="extraordinary"?" 🔥":m.highlight==="weak"?" ⚠️":""}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </ScrollTable>

          <div style={{ marginTop:12, display:"flex", gap:12, flexWrap:"wrap", fontSize:10, color:C.muted, ...HI }}>
            <span>✦ = त्रिक भाव — उल्टा नियम</span>
            <span>सीमा = 85 अंक</span>
            <span>🔥 &gt; 100 असाधारण | ⚠️ &lt; 70 दुर्बल</span>
          </div>
        </>
      )}
    </Card>
  );
}


// ── Section 6: Maitri (Panchadha) ────────────────────────────────────────
const MAITRI_PINK = "#F472B6";

function MaitriTable({ maitri }) {
  const planets = PLANET_ORDER.filter(p => maitri[p]);

  if (!planets.length) {
    return <div style={{ color:C.slate, fontSize:12, textAlign:"center", padding:16, ...HI }}>मैत्री डेटा उपलब्ध नहीं।</div>;
  }

  function mColor(final) {
    if (final === "अधिमित्र") return "#4ADE80";
    if (final === "मित्र")    return "#86EFAC";
    if (final === "स्वराशि")  return "#22D3EE";
    if (final === "सम")       return "#FCD34D";
    if (final === "शत्रु")    return "#FB923C";
    if (final === "अधिशत्रु") return "#F87171";
    return C.slate;
  }

  const counts = {};
  planets.forEach(p => {
    const f = maitri[p]?.final || "सम";
    counts[f] = (counts[f] || 0) + 1;
  });

  return (
    <Card color={MAITRI_PINK}>
      <SLabel color={MAITRI_PINK}>पंचधा मैत्री (ग्रह-मित्रता)</SLabel>

      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {Object.entries(counts).map(([label, count], i) => (
          <span key={i} style={{
            fontSize:10, fontWeight:700, padding:"3px 10px",
            borderRadius:8, background:`${mColor(label)}18`,
            color:mColor(label), border:`1px solid ${mColor(label)}28`, ...HI,
          }}>{count} {label}</span>
        ))}
      </div>

      <ScrollTable>
        <thead>
          <tr>
            <Th>ग्रह</Th>
            <Th>राशि स्वामी</Th>
            <Th align="center">नैसर्गिक</Th>
            <Th align="center">तात्कालिक</Th>
            <Th align="center">पंचधा फल</Th>
          </tr>
        </thead>
        <tbody>
          {planets.map((code, i) => {
            const m     = maitri[code];
            const color = mColor(m?.final);
            const rowBg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
            const isOwn = m?.final === "स्वराशि";
            const isNA  = m?.final === "लागू नहीं";
            return (
              <tr key={code} style={{ background:rowBg }}>
                <Td>
                  <span style={{ fontWeight:700, color:MAITRI_PINK, ...HI }}>{PLANET_HI[code]}</span>
                </Td>
                <Td>
                  <span style={{ color:C.amber, fontWeight:600, ...HI }}>
                    {m?.lord ? PLANET_HI[m.lord] || m.lord : "—"}
                  </span>
                </Td>
                <Td style={{ textAlign:"center" }}>
                  {isOwn || isNA ? (
                    <span style={{ color:C.muted, fontSize:11 }}>—</span>
                  ) : (
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6,
                      background: m?.naisargik === "मित्र" ? `${C.green}18` : m?.naisargik === "शत्रु" ? `${C.red}18` : `${C.yellow}18`,
                      color:      m?.naisargik === "मित्र" ? C.green         : m?.naisargik === "शत्रु" ? C.red         : C.yellow,
                      border:     `1px solid ${m?.naisargik === "मित्र" ? C.green : m?.naisargik === "शत्रु" ? C.red : C.yellow}28`,
                      ...HI,
                    }}>{m?.naisargik}</span>
                  )}
                </Td>
                <Td style={{ textAlign:"center" }}>
                  {isOwn || isNA ? (
                    <span style={{ color:C.muted, fontSize:11 }}>—</span>
                  ) : (
                    <span style={{
                      fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6,
                      background: m?.tatkalik === "मित्र" ? `${C.green}18` : `${C.red}18`,
                      color:      m?.tatkalik === "मित्र" ? C.green : C.red,
                      border:     `1px solid ${m?.tatkalik === "मित्र" ? C.green : C.red}28`,
                      ...HI,
                    }}>{m?.tatkalik}</span>
                  )}
                </Td>
                <Td style={{ textAlign:"center" }}>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8,
                    background:`${color}18`, color, border:`1px solid ${color}28`, ...HI,
                  }}>{m?.final}</span>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ScrollTable>

      <div style={{ marginTop:12, display:"flex", gap:10, flexWrap:"wrap", fontSize:10, color:C.muted, ...HI }}>
        <span style={{color:"#4ADE80"}}>अधिमित्र</span>
        <span style={{color:"#86EFAC"}}>मित्र</span>
        <span style={{color:"#22D3EE"}}>स्वराशि</span>
        <span style={{color:"#FCD34D"}}>सम</span>
        <span style={{color:"#FB923C"}}>शत्रु</span>
        <span style={{color:"#F87171"}}>अधिशत्रु</span>
      </div>
    </Card>
  );
}

// ── Tab nav ──────────────────────────────────────────────────────────────
const TABS = [
  { k:"comparison", l:"🔄 D1 vs चलित",   color:C.cyan          },
  { k:"sandhi",     l:"📐 भाव सन्धि",    color:C.amber         },
  { k:"strength",   l:"⚖️ ग्रह बल",      color:C.green         },
  { k:"sudarshan",  l:"🔱 सुदर्शन चक्र", color:SUDARSHAN_PURPLE},
  { k:"maitri",     l:"🤝 पंचधा मैत्री", color:MAITRI_PINK     },
  { k:"shodhana",   l:"🔱 शोधन विश्लेषण", color:"#10B981"       }, // 🔥 NEW TAB
  { k:"yearly",     l:"📅 वार्षिक फल",    color:YEARLY_INDIGO   },
];

// ── Main export ──────────────────────────────────────────────────────────
export default function Chalit() {
  const chartData = useKundliStore(s => s.chartData);
  const [tab,     setTab]    = useState("comparison");
  const [age,     setAge]    = useState(1);
  const [yearly,  setYearly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]  = useState(null);

  const fetchYearly = useCallback(async (ageVal) => {
    if (!chartData?.sudarshan || !ageVal || ageVal < 1) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/yearly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age:       ageVal,
          sudarshan: chartData.sudarshan,
          chart:     { houses: chartData.houses },
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else            setYearly(data);
    } catch (e) {
      setError("नेटवर्क एरर — सर्वर से connect नहीं हो पाया");
    }
    setLoading(false);
  }, [chartData]);

  // Auto-fetch when age changes (debounced 400ms)
  useEffect(() => {
    if (tab !== "yearly") return;
    const t = setTimeout(() => fetchYearly(age), 400);
    return () => clearTimeout(t);
  }, [age, tab, fetchYearly]);

  // Fetch when switching to yearly tab
  useEffect(() => {
    if (tab === "yearly" && !yearly) fetchYearly(age);
  }, [tab]);

  if (!chartData) {
    return (
      <div style={{ padding:24, textAlign:"center", color:C.slate, fontSize:13, ...HI }}>
        डेटा उपलब्ध नहीं है — पहले कुंडली बनाएँ।
      </div>
    );
  }

  const chalit    = chartData?.chalit         || {};
  const sandhi    = chartData?.bhavSandhi     || [];
  const strength  = chartData?.planetStrength || {};
  const sudarshan = chartData?.sudarshan      || {};
  const maitri    = chartData?.maitri          || {};
  // 🔥 enginesData.shodhana first, fallback chartData.shodhana
  const shodhanaData = chartData?.enginesData?.shodhana
                    || chartData?.shodhana
                    || {};
  const lagnaIdx = chartData?.planets?.La?.Vargas?.D1?.Idx ?? 0;

  return (
    <div style={{ paddingBottom:32 }}>

      {/* Panel header */}
      <div style={{
        padding:"14px 16px", borderRadius:16, marginBottom:16,
        background:"rgba(45,212,191,.07)", border:"1px solid rgba(45,212,191,.2)",
      }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.teal, marginBottom:4, ...HI }}>
          चलित भाव विश्लेषण
        </div>
        <div style={{ fontSize:11, color:C.slate, ...HI }}>
          श्री पति पद्धति • लाहिरी अयनांश
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:16, scrollbarWidth:"none" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flexShrink:0,
            padding:"8px 14px",
            borderRadius:12,
            fontSize:11, fontWeight:700,
            cursor:"pointer",
            transition:"all .15s",
            background: tab === t.k ? `${t.color}20` : "rgba(255,255,255,.04)",
            color:       tab === t.k ? t.color        : C.muted,
            border:      tab === t.k ? `2px solid ${t.color}45` : "1px solid rgba(255,255,255,.07)",
            ...HI,
          }}>{t.l}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "comparison" && <ChalitkComparison chalit={chalit} />}
      {tab === "sandhi"     && <BhavSandhiTable   sandhi={sandhi} />}
      {tab === "strength"   && <PlanetStrengthTable strength={strength} />}
      {tab === "sudarshan"  && <SudarshanChakra    sudarshan={sudarshan} />}
      {tab === "maitri"     && <MaitriTable          maitri={maitri} />}
      {tab === "shodhana"   && (
        shodhanaData?.trikona_shodhana ? (
          <ShodhanaPanel shodhanaData={shodhanaData} lagnaIdx={lagnaIdx} />
        ) : (
          <div style={{padding:24, textAlign:"center", color:C.slate, fontSize:12, ...HI}}>
            ⚠️ शोधन डेटा उपलब्ध नहीं
          </div>
        )
      )}
      {tab === "yearly"     && (
        <YearlyPrediction
          yearly={yearly}
          loading={loading}
          error={error}
          age={age}
          onAgeChange={(v) => { setAge(v); }}
        />
      )}

    </div>
  );
}