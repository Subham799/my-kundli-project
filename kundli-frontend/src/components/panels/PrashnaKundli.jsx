// ═══════════════════════════════════════════════════════════════════════════
//  PrashnaKundli.jsx  —  प्रश्न कुण्डली (Horary Astrology) Page
//  VERSION 2.0 — Lost Item Engine + Visual Compass added
//  अपने React project में src/pages/ या src/components/ में रखें
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── API Base URL — अपने backend का URL यहाँ set करें ──────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

// ── ग्रह रंग ──────────────────────────────────────────────────────────────
const PLANET_COLORS = {
  शनि:    "#6366f1",
  गुरु:   "#f59e0b",
  मंगल:   "#ef4444",
  सूर्य:  "#f97316",
  शुक्र:  "#ec4899",
  बुध:    "#10b981",
  चंद्र:  "#3b82f6",
  लग्नेश: "#8b5cf6",
};

// Direction → degrees (for compass needle)
const DIRECTION_DEG = {
  East:  90,
  South: 180,
  West:  270,
  North: 0,
};

// ── Kaksha Dial SVG Component ──────────────────────────────────────────────
function KakshaDial({ allKaksha, activeKaksha, lagnaDeg }) {
  const cx = 130, cy = 130, r = 100, inner = 55;

  const slices = allKaksha.map((k) => {
    const startAngle = ((k.kaksha - 1) * 45 - 90) * (Math.PI / 180);
    const endAngle   = (k.kaksha * 45 - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + inner * Math.cos(startAngle);
    const yi1 = cy + inner * Math.sin(startAngle);
    const xi2 = cx + inner * Math.cos(endAngle);
    const yi2 = cy + inner * Math.sin(endAngle);
    const mid  = ((k.kaksha - 0.5) * 45 - 90) * (Math.PI / 180);
    const lx   = cx + (r + inner) / 2 * Math.cos(mid);
    const ly   = cy + (r + inner) / 2 * Math.sin(mid);
    const color = PLANET_COLORS[k.lord] || "#94a3b8";
    const path  = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 0 0 ${xi1} ${yi1} Z`;
    return { ...k, path, lx, ly, color };
  });

  const needleDeg = (lagnaDeg / 30) * 360 - 90;
  const needleRad = needleDeg * (Math.PI / 180);
  const nx = cx + 85 * Math.cos(needleRad);
  const ny = cy + 85 * Math.sin(needleRad);

  return (
    <svg viewBox="0 0 260 260" width="260" height="260">
      {slices.map((s) => (
        <g key={s.kaksha}>
          <path
            d={s.path}
            fill={s.active ? s.color : s.color + "44"}
            stroke={s.active ? "#fff" : "#1e293b"}
            strokeWidth={s.active ? 2.5 : 1}
            style={{ transition: "all 0.4s" }}
          />
          <text x={s.lx} y={s.ly - 5} textAnchor="middle" fontSize="9"
            fill={s.active ? "#fff" : "#94a3b8"} fontWeight={s.active ? "bold" : "normal"}>
            {s.lord}
          </text>
          <text x={s.lx} y={s.ly + 7} textAnchor="middle" fontSize="7"
            fill={s.active ? "#e2e8f0" : "#64748b"}>
            {s.kaksha}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={inner} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#f1f5f9" fontWeight="bold">कक्षा</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18"
        fill={PLANET_COLORS[allKaksha[activeKaksha - 1]?.lord] || "#f59e0b"} fontWeight="bold">
        {activeKaksha}
      </text>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#fbbf24" />
    </svg>
  );
}

// ── 🧭 Compass Component ───────────────────────────────────────────────────
function DirectionCompass({ directionEn, directionHi }) {
  const needleDeg = DIRECTION_DEG[directionEn] ?? 0;
  const cx = 80, cy = 80, r = 65;
  const needleRad = (needleDeg - 90) * (Math.PI / 180);
  const nx = cx + 52 * Math.cos(needleRad);
  const ny = cy + 52 * Math.sin(needleRad);

  // Cardinal points
  const cardinals = [
    { label: "N", deg: 0,   color: "#ef4444" },
    { label: "E", deg: 90,  color: "#94a3b8" },
    { label: "S", deg: 180, color: "#94a3b8" },
    { label: "W", deg: 270, color: "#94a3b8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg viewBox="0 0 160 160" width="140" height="140">
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r} fill="#0f172a" stroke="#334155" strokeWidth="2" />
        {/* Tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 - 90) * (Math.PI / 180);
          const isMajor = i % 9 === 0;
          const r1 = isMajor ? 56 : 60;
          const r2 = 65;
          return (
            <line key={i}
              x1={cx + r1 * Math.cos(angle)} y1={cy + r1 * Math.sin(angle)}
              x2={cx + r2 * Math.cos(angle)} y2={cy + r2 * Math.sin(angle)}
              stroke={isMajor ? "#475569" : "#1e293b"} strokeWidth={isMajor ? 1.5 : 1}
            />
          );
        })}
        {/* Cardinal labels */}
        {cardinals.map(({ label, deg, color }) => {
          const angle = (deg - 90) * (Math.PI / 180);
          const lx = cx + 48 * Math.cos(angle);
          const ly = cy + 48 * Math.sin(angle);
          return (
            <text key={label} x={lx} y={ly + 4} textAnchor="middle" fontSize="11"
              fontWeight="bold" fill={color}>
              {label}
            </text>
          );
        })}
        {/* Needle (glowing) */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        {/* Needle tail (opposite) */}
        <line x1={cx} y1={cy}
          x2={cx - 22 * Math.cos(needleRad)}
          y2={cy - 22 * Math.sin(needleRad)}
          stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#f59e0b" />
        <circle cx={cx} cy={cy} r="2.5" fill="#0f172a" />
        {/* Active direction label */}
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="8"
          fill="#f59e0b" letterSpacing="1">
          {directionEn?.toUpperCase()}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        {directionHi}
      </div>
    </div>
  );
}

// ── राशि + ग्रह data ──────────────────────────────────────────────────────────
const RASHI_NAMES = ["मेष","वृष","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"];
const RASHI_SWAMI = ["मंगल","शुक्र","बुध","चंद्र","सूर्य","बुध","शुक्र","मंगल","गुरु","शनि","शनि","गुरु"];
const BHAV_KAARAK = [
  "स्वयं / शरीर","धन / वाणी","भाई / पराक्रम","माता / सुख","संतान / विद्या","शत्रु / रोग",
  "जीवनसाथी / विवाह","मृत्यु / गुप्त","भाग्य / धर्म","कर्म / पिता","लाभ / आय","व्यय / हानि"
];

// ── 🗺️ Prashna Bhav Table ─────────────────────────────────────────────────────
function PrashnaBhavTable({ result }) {
  if (!result) return null;

  const lagnaRashi = result.lagna_rashi ?? 0;
  // planets: backend se aana chahiye [{name, rashi_index, degree, is_retrograde}]
  const planets = result.planets || [];

  const bhavRows = Array.from({ length: 12 }, (_, i) => {
    const bhavNum   = i + 1;
    const rashiIdx  = (lagnaRashi + i) % 12;
    const rashiName = RASHI_NAMES[rashiIdx];
    const swami     = RASHI_SWAMI[rashiIdx];
    const kaarak    = BHAV_KAARAK[i];

    // Match planets to this rashi
    const grahas = planets
      .filter(p => (p.rashi_index ?? p.rashi ?? -1) === rashiIdx)
      .map(p => {
        const color = PLANET_COLORS[p.name] || "#94a3b8";
        const retro = p.is_retrograde ? " ℞" : "";
        return { ...p, color, retro };
      });

    const isLagna   = bhavNum === 1;
    const is2ndLord = grahas.some(g => g.name === result?.lost_item?.second_lord);

    return { bhavNum, rashiIdx, rashiName, swami, kaarak, grahas, isLagna, is2ndLord };
  });

  return (
    <div style={{
      background: "#0f172a", borderRadius: 12, border: "1px solid #334155",
      marginTop: 16, overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #334155",
        fontWeight: 700, fontSize: 14, color: "#a78bfa",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        🏠 प्रश्न कुण्डली — 12 भाव विवरण
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>
          (लग्न राशि: {RASHI_NAMES[lagnaRashi]})
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1e293b" }}>
              {["भाव","राशि","राशि स्वामी","स्थित ग्रह","भाव कारक"].map(h => (
                <th key={h} style={{
                  padding: "9px 12px", textAlign: "left",
                  color: "#64748b", fontWeight: 600, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: 0.5,
                  borderBottom: "1px solid #334155", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bhavRows.map(row => (
              <tr key={row.bhavNum} style={{
                background: row.isLagna
                  ? "#a78bfa12"
                  : row.is2ndLord
                    ? "#f59e0b0e"
                    : row.grahas.length > 0
                      ? "#1e293b80"
                      : "transparent",
                borderBottom: "1px solid #1e293b",
              }}>
                {/* Bhav number */}
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26, borderRadius: "50%",
                    background: row.isLagna ? "#a78bfa" : row.is2ndLord ? "#f59e0b" : "#1e293b",
                    border: `1px solid ${row.isLagna ? "#a78bfa" : row.is2ndLord ? "#f59e0b" : "#334155"}`,
                    color: row.isLagna || row.is2ndLord ? "#0f172a" : "#e2e8f0",
                    fontWeight: 700, fontSize: 12,
                  }}>{row.bhavNum}</span>
                  {row.isLagna && <span style={{ marginLeft: 6, fontSize: 10, color: "#a78bfa" }}>लग्न</span>}
                  {row.is2ndLord && !row.isLagna && <span style={{ marginLeft: 6, fontSize: 10, color: "#f59e0b" }}>2nd</span>}
                </td>

                {/* Rashi */}
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap" }}>
                  {row.rashiName}
                  <span style={{ marginLeft: 5, fontSize: 11, color: "#64748b" }}>#{row.rashiIdx + 1}</span>
                </td>

                {/* Rashi Swami */}
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <span style={{
                    color: PLANET_COLORS[row.swami] || "#94a3b8",
                    fontWeight: 600, fontSize: 13,
                  }}>{row.swami}</span>
                </td>

                {/* Grahas in this bhav */}
                <td style={{ padding: "10px 12px" }}>
                  {row.grahas.length === 0
                    ? <span style={{ color: "#334155", fontSize: 12 }}>—</span>
                    : <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {row.grahas.map((g, gi) => (
                          <span key={gi} style={{
                            background: g.color + "22",
                            border: `1px solid ${g.color}66`,
                            borderRadius: 6, padding: "2px 8px",
                            color: g.color, fontWeight: 700, fontSize: 12,
                            whiteSpace: "nowrap",
                          }}>
                            {g.name}{g.retro}
                            {g.degree != null &&
                              <span style={{ fontWeight: 400, fontSize: 10, marginLeft: 3, color: g.color + "aa" }}>
                                {Number(g.degree).toFixed(1)}°
                              </span>
                            }
                          </span>
                        ))}
                      </div>
                  }
                </td>

                {/* Bhav Kaarak */}
                <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>
                  {row.kaarak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{
        padding: "10px 14px", borderTop: "1px solid #1e293b",
        display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "#475569",
      }}>
        <span><span style={{ color: "#a78bfa" }}>■</span> लग्न भाव</span>
        <span><span style={{ color: "#f59e0b" }}>■</span> 2nd Lord स्थान (खोई वस्तु)</span>
        <span>℞ = वक्री ग्रह</span>
        {planets.length === 0 &&
          <span style={{ color: "#ef4444" }}>
            ⚠️ ग्रह data नहीं मिला — backend में <code>planets</code> array भेजें
          </span>
        }
      </div>
    </div>
  );
}

// ── 🔍 Lost Item Card Component ─────────────────────────────────────────────
function LostItemSection({ lostItem, result }) {
  if (!lostItem) return null;

  // Highlight "चोरी" case
  const isStolen = lostItem?.location_house === 7;
  const isGone   = lostItem?.location_house === 8;
  const willFind = lostItem?.location_house === 11;

  const outcomeColor = isGone   ? "#ef4444"
                     : isStolen ? "#f97316"
                     : willFind ? "#10b981"
                     : "#a78bfa";

  const outcomeLabel = isGone   ? "⛔ मिलना मुश्किल"
                     : isStolen ? "⚠️ चोरी हुई हो सकती है"
                     : willFind ? "✅ मिल जाएगी"
                     : "🔍 खोज जारी रखें";

  return (
    <div style={{
      background: "#1e293b",
      borderRadius: 14,
      padding: "20px",
      border: `1px solid ${outcomeColor}55`,
      boxShadow: `0 0 20px ${outcomeColor}18`,
    }}>
      {/* Title */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#a78bfa" }}>
          🔍 नष्ट द्रव्य विचार (Lost Item)
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: outcomeColor,
          background: outcomeColor + "22", borderRadius: 20,
          padding: "3px 12px", border: `1px solid ${outcomeColor}44`,
        }}>
          {outcomeLabel}
        </div>
      </div>

      {/* Main grid: info + compass */}
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
        marginBottom: 14,
      }}>
        {/* Info Column */}
        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Location */}
          <div style={infoRow}>
            <div style={rowLabel}>📍 स्थान</div>
            <div style={{ ...rowValue, color: outcomeColor }}>{lostItem?.location}</div>
          </div>

          {/* Movement */}
          <div style={infoRow}>
            <div style={rowLabel}>📦 स्थिति</div>
            <div style={rowValue}>{lostItem?.movement}</div>
          </div>

          {/* Direction */}
          <div style={infoRow}>
            <div style={rowLabel}>🧭 दिशा</div>
            <div style={{ ...rowValue, color: "#f59e0b" }}>{lostItem?.direction_hi}</div>
          </div>

          {/* 2nd Lord info */}
          {lostItem?.second_lord && (
            <div style={infoRow}>
              <div style={rowLabel}>🪐 2nd Lord</div>
              <div style={{ ...rowValue, color: "#94a3b8" }}>
                {lostItem.second_lord}
                {lostItem.location_house ? ` (भाव ${lostItem.location_house})` : ""}
              </div>
            </div>
          )}
        </div>

        {/* Compass */}
        {lostItem?.direction_en && (
          <DirectionCompass
            directionEn={lostItem.direction_en}
            directionHi={lostItem.direction_hi}
          />
        )}
      </div>

      {/* Prediction Box */}
      <div style={{
        padding: "12px 14px",
        background: "#0f172a",
        borderRadius: 10,
        border: "1px solid #334155",
        fontSize: 13,
        lineHeight: 1.8,
        color: "#cbd5e1",
      }}>
        🔮 {lostItem?.prediction}
      </div>

      {/* Special warning for stolen / lost forever */}
      {isStolen && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "#f9731618", borderRadius: 8,
          border: "1px solid #f9731655",
          fontSize: 12, color: "#fed7aa",
        }}>
          ⚠️ <strong>संभावित चोरी:</strong> 2nd lord 7वें भाव में है — वस्तु किसी और के पास हो सकती है।
          परिचितों से पूछताछ करें।
        </div>
      )}
      {isGone && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "#ef444418", borderRadius: 8,
          border: "1px solid #ef444455",
          fontSize: 12, color: "#fca5a5",
        }}>
          ⛔ <strong>8वां भाव:</strong> वस्तु बहुत गहरी जगह या स्थायी रूप से खो सकती है।
        </div>
      )}
      {willFind && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "#10b98118", borderRadius: 8,
          border: "1px solid #10b98155",
          fontSize: 12, color: "#6ee7b7",
        }}>
          ✅ <strong>शुभ संकेत:</strong> 11वां भाव — वस्तु मिलने की प्रबल संभावना है।
        </div>
      )}

      {/* ── 12 Bhav Table ─────────────────────────────────────────────── */}
      <PrashnaBhavTable result={result} />

    </div>
  );
}

// Shared row styles for Lost Item
const infoRow = {
  display: "flex", alignItems: "flex-start", gap: 10,
  padding: "8px 0", borderBottom: "1px solid #1e3050",
};
const rowLabel = {
  fontSize: 12, color: "#64748b", minWidth: 70,
  textTransform: "uppercase", letterSpacing: 0.5, paddingTop: 1,
};
const rowValue = {
  fontSize: 14, fontWeight: 600, color: "#e2e8f0", flex: 1,
};
// ── Ruling Planets Card ────────────────────────────────────────────────────
function RulingPlanetsCard({ result }) {
  if (!result?.ruling_planets) return null;
  const rp = result.ruling_planets;
  const rows = [
    { label: "लग्न NL (नक्षत्र स्वामी)", value: rp.lagna_nl },
    { label: "लग्न SL (उप-स्वामी)",      value: rp.lagna_sl },
    { label: "लग्न राशि स्वामी",         value: rp.lagna_sign_lord },
    { label: "चंद्र NL",                 value: rp.moon_nl },
    { label: "चंद्र SL",                 value: rp.moon_sl },
    { label: "चंद्र राशि स्वामी",        value: rp.moon_sign_lord },
    { label: "दिन स्वामी",               value: rp.day_lord },
  ];
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px", border: "1px solid #334155" }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#f59e0b" }}>⭐ Ruling Planets (RPs)</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {rp.ruling_planets?.map((p) => (
          <span key={p} style={{
            background: (PLANET_COLORS[p] || "#334155") + "33",
            border: `1px solid ${PLANET_COLORS[p] || "#475569"}`,
            borderRadius: 20, padding: "4px 14px",
            color: PLANET_COLORS[p] || "#e2e8f0",
            fontWeight: 700, fontSize: 13,
          }}>{p}</span>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={{ padding: "6px 8px", color: "#64748b" }}>{r.label}</td>
              <td style={{ padding: "6px 8px", fontWeight: 700, color: PLANET_COLORS[r.value] || "#e2e8f0" }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── DBA Card ───────────────────────────────────────────────────────────────
function DbaCard({ result }) {
  if (!result?.dba) return null;
  const d = result.dba;
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px", border: "1px solid #334155" }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#a78bfa" }}>🕐 Vimshottari DBA</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "महादशा", value: d.mahadasha, sub: `${d.balance_yrs} yr शेष`, color: "#f59e0b" },
          { label: "भुक्ति",  value: d.bhukti,    sub: `${d.bhukti_yrs} yr`, color: "#a78bfa" },
          { label: "अंतरा",  value: d.antara,    sub: `${d.antara_yrs} yr`, color: "#10b981" },
        ].map(item => (
          <div key={item.label} style={{
            flex: 1, minWidth: 90,
            background: "#0f172a", borderRadius: 10,
            padding: "10px 14px", textAlign: "center",
            border: `1px solid ${item.color}44`,
          }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: PLANET_COLORS[item.value] || item.color }}>{item.value}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{item.sub}</div>
          </div>
        ))}
      </div>
      {result.moon_connection && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#0f172a", borderRadius: 8, fontSize: 12, color: "#94a3b8" }}>
          🌙 {result.moon_connection.note}
        </div>
      )}
    </div>
  );
}

// ── KP House Analysis Card — Full layered verdict ─────────────────────────
const GRADE_COLORS = { A:"#22c55e", B:"#4ade80", C:"#fbbf24", D:"#fb923c", E:"#94a3b8" };
const RETRO_COLORS = { rejected:"#ef4444", delayed:"#f59e0b", suspended:"#fb923c", direct:"#10b981" };

// ── Small reusable layer section ──────────────────────────────────────────
function LayerBox({ title, children, color="#334155" }) {
  return (
    <div style={{ padding:"10px 12px", background:"#0f172a", borderRadius:8,
      borderLeft:`3px solid ${color}`, marginBottom:2 }}>
      <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:1,
        textTransform:"uppercase", marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
}

function Tag({ label, color="#475569", bg, strike=false, small=false }) {
  return (
    <span style={{
      display:"inline-block", padding: small ? "2px 7px" : "3px 10px",
      borderRadius:12, fontSize: small ? 10 : 11, fontWeight:700,
      background: bg || color+"22", border:`1px solid ${color}`,
      color, textDecoration: strike ? "line-through" : "none",
      opacity: strike ? 0.5 : 1, margin:"2px",
    }}>{label}</span>
  );
}

// ═══════════════════════════════════════════════════════════
//  14-LAYER KP ANALYTICAL CONSOLE
// ═══════════════════════════════════════════════════════════
function HouseAnalysisCard({ result }) {
  const [expanded, setExpanded] = useState(null);
const [activeLayers, setActiveLayers] = useState({});
  if (!result?.house_analysis?.length) return null;

  const LAYERS = [
    { id:"summary",  label:"📋 Summary" },
    { id:"l1",       label:"1️⃣ Query" },
    { id:"l3",       label:"2️⃣ Houses" },
    { id:"l4",       label:"3️⃣ CSL" },
    { id:"l5",       label:"4️⃣ Sigs" },
    { id:"l6",       label:"5️⃣ Ra/Ke" },
    { id:"l7",       label:"6️⃣ DBA" },
    { id:"l8",       label:"7️⃣ RP" },
    { id:"l9",       label:"8️⃣ Transit" },
    { id:"l10",      label:"9️⃣ Promise" },
    { id:"l11",      label:"🔟 Resonance" },
    { id:"l12",      label:"⚠️ Delay" },
    { id:"l13",      label:"⏱️ Timing" },
  ];

  return (
    <div style={{ background:"#1e293b", borderRadius:12, padding:"16px",
      border:"1px solid #334155" }}>
      <div style={{ fontWeight:600, fontSize:15, marginBottom:12, color:"#a78bfa" }}>
        🔬 KP Raw Analytical Console
        <span style={{ fontSize:10, fontWeight:400, color:"#64748b", marginLeft:8 }}>
          14 layers — no final prediction
        </span>
      </div>

      {/* Topic list */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {result.house_analysis.map((h, i) => (
          <div key={h.topic}>
            {/* Topic row */}
            <div onClick={() => setExpanded(expanded===i ? null : i)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px", background:"#0f172a", borderRadius: expanded===i ? "8px 8px 0 0" : 8,
                border:`1px solid ${h.color}44`, cursor:"pointer" }}>
              <span style={{ fontSize:13, color:"#cbd5e1" }}>{h.icon} {h.topic}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:h.color }}>{h.status}</span>
                <span style={{ color:"#475569", fontSize:10 }}>{expanded===i ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded panel */}
            {expanded===i && (
              <div style={{ background:"#080f1e", border:`1px solid ${h.color}44`,
                borderTop:"none", borderRadius:"0 0 8px 8px" }}>

                {/* Layer tab bar */}
                <div style={{ display:"flex", overflowX:"auto", gap:4, padding:"8px 10px",
                  borderBottom:"1px solid #1e293b" }}>
                  {LAYERS.map(l => (
                   <button
                          key={l.id}
                          onClick={() =>
                            setActiveLayers(prev => ({
                              ...prev,
                              [i]: l.id
                            }))
                          }
                          style={{
                            background:
                              (activeLayers[i] || "summary") === l.id
                                ? h.color
                                : "#1e293b",
                        color: activeLayer===l.id ? "#000" : "#64748b" }}>
                      {l.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>

                  {/* ── SUMMARY ── */}
                  {(activeLayers[i] || "summary")==="summary" && h.l14_summary && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <LayerBox title="📊 Layer 14 — Raw KP Summary" color={h.color}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                          <Tag label={h.l14_summary.promise_status}
                            color={h.l14_summary.promise_status.includes("✅") ? "#22c55e" : "#ef4444"} />
                          <Tag label={`RP: ${h.l14_summary.rp_agreement}`} color="#f59e0b" />
                          <Tag label={`Transit: ${h.l14_summary.transit_readiness}`} color="#10b981" />
                          <Tag label={h.l14_summary.resonance_label} color="#a78bfa" />
                        </div>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                          <div style={{ flex:1, minWidth:120 }}>
                            <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>✅ Strongest Sig</div>
                            {h.l14_summary.strongest_significators?.map(p =>
                              <Tag key={p} label={p} color="#22c55e" small />
                            )}
                          </div>
                          <div style={{ flex:1, minWidth:120 }}>
                            <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>✗ Rejected</div>
                            {h.l14_summary.rejected_significators?.map(p =>
                              <Tag key={p} label={p} color="#ef4444" strike small />
                            ) || <span style={{ fontSize:10, color:"#475569" }}>—</span>}
                          </div>
                          <div style={{ flex:1, minWidth:120 }}>
                            <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>⏳ Suspended</div>
                            {h.l14_summary.retro_suspended?.map(p =>
                              <Tag key={p} label={p} color="#f59e0b" small />
                            ) || <span style={{ fontSize:10, color:"#475569" }}>—</span>}
                          </div>
                        </div>
                        {h.l14_summary.denial_indicated &&
                          <div style={{ marginTop:8, padding:"6px 10px", background:"#ef444422", borderRadius:6,
                            fontSize:11, color:"#ef4444" }}>🚫 Denial Indicated</div>}
                        {h.l14_summary.delay_indicated && !h.l14_summary.denial_indicated &&
                          <div style={{ marginTop:8, padding:"6px 10px", background:"#f59e0b22", borderRadius:6,
                            fontSize:11, color:"#f59e0b" }}>⏳ Delay Indicated</div>}
                        <div style={{ marginTop:8, fontSize:10, color:"#475569", fontStyle:"italic" }}>
                          {h.l14_summary.analytical_note}
                        </div>
                      </LayerBox>
                    </div>
                  )}

                  {/* ── LAYER 1: QUERY VALIDATION ── */}
                  {(activeLayers[i] || "summary")==="l1" && h.l1_query_validation && (() => {
                    const qv = h.l1_query_validation;
                    return (
                      <LayerBox title="Layer 1 — Query Validation" color="#f59e0b">
                        <div style={{ fontSize:13, fontWeight:700, color:"#f59e0b", marginBottom:8 }}>
                          {qv.validity} &nbsp; Score: {qv.score}/{qv.max_score}
                        </div>
                        {[
                          { label:"Moon NL", planet:qv.moon_nl, houses:qv.moon_nl_houses, ok:qv.moon_nl_ok },
                          { label:"Moon SL", planet:qv.moon_sl, houses:qv.moon_sl_houses, ok:qv.moon_sl_ok, retro:qv.moon_sl_retro },
                          { label:"Lagna NL", planet:qv.lagna_nl, houses:qv.lagna_nl_houses, ok:qv.lagna_nl_ok },
                          { label:"Lagna SL", planet:qv.lagna_sl, houses:qv.lagna_sl_houses, ok:qv.lagna_sl_ok },
                          { label:"11th CSL", planet:qv.cusp11_csl, houses:qv.cusp11_houses, ok:qv.cusp11_ok },
                        ].map(row => (
                          <div key={row.label} style={{ display:"flex", alignItems:"center", gap:8,
                            marginBottom:5, fontSize:12 }}>
                            <span style={{ color:"#64748b", minWidth:70 }}>{row.label}:</span>
                            <span style={{ fontWeight:700, color:PLANET_COLORS[row.planet]||"#e2e8f0" }}>
                              {row.planet}{row.retro ? " ℞" : ""}
                            </span>
                            <span style={{ color:"#475569", fontSize:11 }}>→ {row.houses?.join(",") || "—"}</span>
                            <span style={{ color: row.ok ? "#10b981" : "#ef4444", fontWeight:700 }}>
                              {row.ok ? "✓" : "✗"}
                            </span>
                          </div>
                        ))}
                        <div style={{ fontSize:10, color:"#64748b", marginTop:6, fontStyle:"italic" }}>{qv.note}</div>
                      </LayerBox>
                    );
                  })()}

                  {/* ── LAYER 3: EVENT HOUSE MAPPING ── */}
                  {activeLayer==="l3" && h.l3_event_map && (
                    <LayerBox title="Layer 3 — Event House Mapping" color="#10b981">
                      <div style={{ fontSize:10, color:"#64748b", marginBottom:8 }}>{h.l3_event_map.topic_note}</div>
                      {["primary","support","fulfillment","obstruct"].map(role => (
                        <div key={role} style={{ marginBottom:8 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:
                            role==="obstruct"?"#ef4444":role==="fulfillment"?"#22c55e":"#94a3b8",
                            marginBottom:4, textTransform:"uppercase" }}>{role}</div>
                          {h.l3_event_map[role]?.map(item => (
                            <div key={item.house} style={{ display:"flex", gap:8, alignItems:"center",
                              marginBottom:3, fontSize:11 }}>
                              <Tag label={`Bhav ${item.house}`}
                                color={item.csl_favors_event?"#10b981":item.csl_obstructs?"#ef4444":"#475569"} small />
                              <span style={{ color:"#64748b" }}>CSL:</span>
                              <span style={{ color:PLANET_COLORS[item.csl]||"#e2e8f0", fontWeight:700 }}>{item.csl}</span>
                              <span style={{ color:"#475569" }}>→ {item.csl_sig_houses?.join(",") || "—"}</span>
                              {item.csl_favors_event && <span style={{ color:"#10b981" }}>✓</span>}
                              {item.csl_obstructs && <span style={{ color:"#ef4444" }}>⚠</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 4: CSL DEEP ── */}
                  {activeLayer==="l4" && h.l4_csl_deep && (
                    <LayerBox title="Layer 4 — Complete CSL Analysis" color="#a78bfa">
                      {h.l4_csl_deep.filter(c => [
                        ...h.l3_event_map?.primary?.map(x=>x.house)||[],
                        ...h.l3_event_map?.fulfillment?.map(x=>x.house)||[]
                      ].includes(c.house)).map(c => (
                        <div key={c.house} style={{ marginBottom:10, padding:"8px",
                          background:"#1e293b", borderRadius:6,
                          borderLeft:`3px solid ${c.retro_verdict==="denial"?"#ef4444":c.retro_verdict==="delay"?"#f59e0b":"#10b981"}` }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                            <Tag label={`Bhav ${c.house}`} color="#a78bfa" small />
                            <span style={{ fontSize:11, color:"#64748b" }}>CSL:</span>
                            <span style={{ fontWeight:700, color:PLANET_COLORS[c.sub_lord]||"#e2e8f0" }}>
                              {c.sub_lord}{c.csl_retro?" ℞":""}
                            </span>
                            <span style={{ fontSize:10, color:
                              c.retro_verdict==="denial"?"#ef4444":c.retro_verdict==="delay"?"#f59e0b":"#10b981" }}>
                              [{c.retro_verdict}]
                            </span>
                          </div>
                          <div style={{ fontSize:10, color:"#94a3b8" }}>
                            NL: {c.csl_nl}{c.nl_retro?" ℞":""} → {c.csl_nl_signifies?.join(",") || "—"}
                          </div>
                          <div style={{ fontSize:10, color:"#94a3b8" }}>
                            Sig: {c.csl_signifies?.join(",") || "—"}
                            &nbsp;{c.favors_event?"✅":""}
                            &nbsp;{c.obstructs_event?"⚠️":""}
                          </div>
                          <div style={{ fontSize:10, color:
                            c.retro_verdict==="denial"?"#ef4444":"#f59e0b", marginTop:3 }}>
                            {c.retro_note}
                          </div>
                        </div>
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 5: SIGNIFICATORS ── */}
                  {activeLayer==="l5" && h.l5_significators && (
                    <LayerBox title="Layer 5 — Full Significator Extraction (A/B/C/D/E)" color="#22c55e">
                      {["strongest","medium","weak","delayed","rejected"].map(cat => (
                        h.l5_significators[cat]?.length > 0 && (
                          <div key={cat} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:10, fontWeight:700, marginBottom:4,
                              color:cat==="rejected"?"#ef4444":cat==="delayed"?"#f59e0b":
                                    cat==="strongest"?"#22c55e":"#94a3b8",
                              textTransform:"uppercase" }}>
                              {cat==="strongest"?"✅ Strongest":cat==="medium"?"⚖️ Medium":
                               cat==="weak"?"🔵 Weak (E)":cat==="delayed"?"⏳ Delayed/Suspended":"✗ Rejected"}
                            </div>
                            {h.l5_significators[cat].map(p => {
                              const d = h.l5_significators.graded[p];
                              return (
                                <div key={p} style={{ display:"flex", gap:8, alignItems:"flex-start",
                                  marginBottom:5, padding:"5px 8px", background:"#0f172a", borderRadius:5 }}>
                                  <div style={{ minWidth:80 }}>
                                    <Tag label={`${p} (${d?.grade})`}
                                      color={GRADE_COLORS[d?.grade]||"#475569"}
                                      strike={d?.rejected} small />
                                    {d?.is_retro && <Tag label="℞" color="#f59e0b" small />}
                                  </div>
                                  <div style={{ flex:1, fontSize:10, color:"#64748b", lineHeight:1.5 }}>
                                    <div>{d?.grade_reason}</div>
                                    <div style={{ color:RETRO_COLORS[d?.retro_class]||"#94a3b8" }}>
                                      {d?.retro_why}
                                    </div>
                                    {d?.neg_touched?.length > 0 &&
                                      <div style={{ color:"#ef4444" }}>⚠ neg: {d.neg_touched.join(",")}</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 6: RAHU/KETU ── */}
                  {activeLayer==="l6" && h.l6_rahu_ketu && (
                    <LayerBox title="Layer 6 — Rahu/Ketu Advanced Breakdown" color="#f59e0b">
                      {Object.entries(h.l6_rahu_ketu).map(([node, nd]) => (
                        <div key={node} style={{ marginBottom:10, padding:"8px",
                          background:"#1e293b", borderRadius:6 }}>
                          <div style={{ fontWeight:700, color:PLANET_COLORS[node]||"#e2e8f0",
                            marginBottom:6 }}>{node} — Bhav {nd.house_placed}</div>
                          <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.8 }}>
                            <div>युक्त ग्रह: {nd.conjoined_planets?.join(", ") || "कोई नहीं"}</div>
                            <div>Star Lord (NL): {nd.star_lord} → {nd.star_lord_houses?.join(",") || "—"}
                              {nd.retro_contaminated ? " ℞ (contaminated)" : ""}</div>
                            <div>Sign Lord: {nd.sign_lord} → {nd.sign_lord_houses?.join(",") || "—"}</div>
                            <div>Star Tenanted: {nd.star_tenanted ? "हाँ — partial rep." : "नहीं — full rep."}</div>
                            <div style={{ marginTop:4, fontWeight:600,
                              color: nd.retro_contaminated ? "#ef4444" : "#10b981" }}>
                              {nd.representation}
                            </div>
                            <div style={{ color: nd.favors_event ? "#10b981" : "#ef4444" }}>
                              Event favors: {nd.favors_event ? "✅" : "❌"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 7: DBA ── */}
                  {activeLayer==="l7" && h.l7_dba && (
                    <LayerBox title="Layer 7 — DBA Resonance Analysis" color="#a78bfa">
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {Object.entries(h.l7_dba).map(([period, d]) => (
                          <div key={period} style={{ flex:1, minWidth:100,
                            background:"#1e293b", borderRadius:8, padding:"10px",
                            borderLeft:`3px solid ${d.supports_event?"#10b981":d.obstructs_event?"#ef4444":"#475569"}` }}>
                            <div style={{ fontSize:10, color:"#64748b", marginBottom:3 }}>{period}</div>
                            <div style={{ fontWeight:800, fontSize:16,
                              color:PLANET_COLORS[d.lord]||"#e2e8f0" }}>
                              {d.lord}{d.is_retro?" ℞":""}
                            </div>
                            <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>
                              Houses: {d.houses?.join(",") || "—"}
                            </div>
                            <div style={{ fontSize:10, color:"#10b981" }}>
                              ✅ {d.positive_houses?.join(",") || "—"}
                            </div>
                            <div style={{ fontSize:10, color:"#ef4444" }}>
                              ⚠ {d.negative_houses?.join(",") || "—"}
                            </div>
                            <div style={{ fontSize:10, marginTop:4,
                              color:d.supports_event?"#10b981":d.obstructs_event?"#ef4444":"#94a3b8" }}>
                              {d.resonance} | {d.retro_effect}
                            </div>
                          </div>
                        ))}
                      </div>
                    </LayerBox>
                  )}

                  {/* ── LAYER 8: RP ── */}
                  {activeLayer==="l8" && h.l8_rp && (
                    <LayerBox title="Layer 8 — Ruling Planet Concurrence" color="#f59e0b">
                      <div style={{ marginBottom:8 }}>
                        <Tag label={h.l8_rp.strength} color="#f59e0b" />
                        <Tag label={`Score: ${h.l8_rp.score}`} color="#a78bfa" small />
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                        <div style={{ fontSize:10, color:"#64748b" }}>Sig overlap:</div>
                        {h.l8_rp.sig_overlap?.map(p => <Tag key={p} label={p} color="#22c55e" small />)}
                        {h.l8_rp.sig_overlap?.length === 0 && <span style={{ fontSize:10, color:"#475569" }}>—</span>}
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                        <div style={{ fontSize:10, color:"#64748b" }}>DBA overlap:</div>
                        {h.l8_rp.dba_overlap?.map(p => <Tag key={p} label={p} color="#a78bfa" small />)}
                      </div>
                      {h.l8_rp.rp_detail?.map(rp => (
                        <div key={rp.planet} style={{ display:"flex", gap:8, alignItems:"center",
                          marginBottom:4, fontSize:11 }}>
                          <span style={{ fontWeight:700, minWidth:70,
                            color:PLANET_COLORS[rp.planet]||"#e2e8f0" }}>
                            {rp.planet}{rp.is_retro?" ℞":""}
                          </span>
                          <span style={{ color:"#64748b", flex:1 }}>{rp.influence}</span>
                        </div>
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 9: TRANSIT ── */}
                  {activeLayer==="l9" && h.l9_transit && (
                    <LayerBox title="Layer 9 — Transit Activation Engine" color="#10b981">
                      <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <Tag label={h.l9_transit.trigger_active ? "⚡ Trigger Active" : "⏳ No Active Trigger"}
                          color={h.l9_transit.trigger_active ? "#10b981" : "#94a3b8"} />
                        <Tag label={`Moon ✓ ${h.l9_transit.moon_transit_ok ? "Active" : "Pending"}`}
                          color={h.l9_transit.moon_transit_ok ? "#10b981" : "#475569"} small />
                        <Tag label={`Sun ${h.l9_transit.sun_transit_ok ? "✓ Active" : "Pending"}`}
                          color={h.l9_transit.sun_transit_ok ? "#10b981" : "#475569"} small />
                      </div>
                      {["activated","pending","blocked"].map(cat => (
                        h.l9_transit[cat]?.length > 0 && (
                          <div key={cat} style={{ marginBottom:6 }}>
                            <div style={{ fontSize:10, fontWeight:700, marginBottom:3,
                              color:cat==="activated"?"#10b981":cat==="blocked"?"#ef4444":"#f59e0b",
                              textTransform:"uppercase" }}>
                              {cat==="activated"?"⚡ Activated":cat==="blocked"?"🚫 Blocked":"⏳ Pending"}
                            </div>
                            {h.l9_transit[cat].map((t, ti) => (
                              <div key={ti} style={{ fontSize:11, color:"#94a3b8",
                                paddingLeft:8, borderLeft:"2px solid #334155", marginBottom:2 }}>
                                {t.planet} via {t.via_nl}
                                {t.grade && ` (${t.grade})`}
                                {t.is_rp && " [RP]"}
                                {t.is_dba && " [DBA]"}
                                {t.reason && ` — ${t.reason}`}
                              </div>
                            ))}
                          </div>
                        )
                      ))}
                      <div style={{ fontSize:10, color:"#475569", marginTop:6, fontStyle:"italic" }}>
                        {h.l9_transit.note}
                      </div>
                    </LayerBox>
                  )}

                  {/* ── LAYER 10: PROMISE/FRUCTIFY ── */}
                  {activeLayer==="l10" && h.l10_promise_fructify && (() => {
                    const pf = h.l10_promise_fructify;
                    const items = [
                      { label:"Event Promised",     val:pf.event_promised,     yes:"✅ हाँ", no:"❌ नहीं" },
                      { label:"Timing Active",       val:pf.timing_active,      yes:"⚡ Active", no:"⏳ Pending" },
                      { label:"Delay Indicated",     val:pf.delay_indicated,    yes:"⏳ हाँ", no:"✓ नहीं", inverted:true },
                      { label:"Denial Indicated",    val:pf.denial_indicated,   yes:"🚫 हाँ", no:"✓ नहीं", inverted:true },
                      { label:"Retro Suspended",     val:pf.retro_suspended,    yes:"⏸️ हाँ", no:"✓ नहीं", inverted:true },
                      { label:"Partial Fulfillment", val:pf.partial_fulfillment,yes:"⚖️ हाँ", no:"✓ नहीं", inverted:true },
                      { label:"DBA Supports",        val:pf.dba_supports,       yes:"✅ हाँ", no:"❌ नहीं" },
                      { label:"RP Supports",         val:pf.rp_supports,        yes:"✅ हाँ", no:"❌ नहीं" },
                      { label:"Transit Ready",       val:pf.transit_ready,      yes:"✅ हाँ", no:"⏳ नहीं" },
                    ];
                    return (
                      <LayerBox title="Layer 10 — Promise vs Fructification" color="#a78bfa">
                        <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", marginBottom:8 }}>
                          Obstruction: {pf.obstruction_type} | Strong count: {pf.strong_count}
                        </div>
                        {items.map(item => (
                          <div key={item.label} style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"center", marginBottom:4, fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>{item.label}</span>
                            <span style={{ fontWeight:700,
                              color: item.inverted ? (item.val?"#ef4444":"#10b981") : (item.val?"#10b981":"#ef4444") }}>
                              {item.val ? item.yes : item.no}
                            </span>
                          </div>
                        ))}
                        <div style={{ fontSize:10, color:"#475569", marginTop:6, fontStyle:"italic" }}>
                          {pf.note}
                        </div>
                      </LayerBox>
                    );
                  })()}

                  {/* ── LAYER 11: RESONANCE ── */}
                  {activeLayer==="l11" && h.l11_resonance && (() => {
                    const r = h.l11_resonance;
                    const total = (r.pos_score||0) + (r.neg_score||0) + (r.retro_contamination||0) || 1;
                    return (
                      <LayerBox title="Layer 11 — Positive vs Negative Resonance" color="#22c55e">
                        <div style={{ fontWeight:700, fontSize:14, color:"#a78bfa", marginBottom:10 }}>
                          {r.label} &nbsp; Balance: {r.balance > 0 ? "+" : ""}{r.balance}
                        </div>
                        {/* Bar */}
                        <div style={{ height:12, background:"#334155", borderRadius:6, overflow:"hidden",
                          display:"flex", marginBottom:10 }}>
                          <div style={{ width:`${(r.pos_score/total)*100}%`, background:"#22c55e" }} />
                          <div style={{ width:`${(r.neg_score/total)*100}%`, background:"#ef4444" }} />
                          <div style={{ width:`${(r.retro_contamination/total)*100}%`, background:"#f59e0b" }} />
                        </div>
                        <div style={{ display:"flex", gap:10, fontSize:11, marginBottom:10 }}>
                          <span style={{ color:"#22c55e" }}>✅ Pos: {r.pos_score}</span>
                          <span style={{ color:"#ef4444" }}>⚠ Neg: {r.neg_score}</span>
                          <span style={{ color:"#f59e0b" }}>℞ Retro: {r.retro_contamination}</span>
                        </div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>
                          Pos Houses: {r.pos_houses_activated?.join(", ") || "—"}
                        </div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>
                          Neg Houses: {r.neg_houses_activated?.join(", ") || "—"}
                        </div>
                        {r.mixed_planets?.length > 0 && (
                          <div style={{ fontSize:11, color:"#f59e0b" }}>
                            Mixed: {r.mixed_planets.map(m => `${m.planet}(+${m.pos.join(",")} -${m.neg.join(",")})`).join(" | ")}
                          </div>
                        )}
                        {r.dormant_planets?.length > 0 && (
                          <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>
                            Dormant (retro): {r.dormant_planets.join(", ")}
                          </div>
                        )}
                      </LayerBox>
                    );
                  })()}

                  {/* ── LAYER 12: DELAY/DENIAL ── */}
                  {activeLayer==="l12" && h.l12_delay_denial && (
                    <LayerBox title="Layer 12 — Delay / Denial / Obstruction" color="#ef4444">
                      <div style={{ fontWeight:700, color:"#ef4444", marginBottom:8 }}>
                        {h.l12_delay_denial.summary}
                      </div>
                      {h.l12_delay_denial.issues?.length === 0 &&
                        <div style={{ fontSize:12, color:"#10b981" }}>✅ कोई विशेष बाधा नहीं</div>}
                      {h.l12_delay_denial.issues?.map((issue, ii) => (
                        <div key={ii} style={{ marginBottom:5, padding:"6px 10px",
                          background:"#1e293b", borderRadius:6,
                          borderLeft:`3px solid ${issue.severity==="high"?"#ef4444":issue.severity==="medium"?"#f59e0b":"#475569"}` }}>
                          <div style={{ fontSize:11, fontWeight:700,
                            color:issue.severity==="high"?"#ef4444":issue.severity==="medium"?"#f59e0b":"#94a3b8" }}>
                            [{issue.type.toUpperCase()}] {issue.planet || ""}
                          </div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{issue.reason}</div>
                        </div>
                      ))}
                    </LayerBox>
                  )}

                  {/* ── LAYER 13: MICRO TIMING ── */}
                  {activeLayer==="l13" && h.l13_micro_timing && (() => {
                    const t = h.l13_micro_timing;
                    return (
                      <LayerBox title="Layer 13 — Micro Timing Preparation" color="#10b981">
                        <div style={{ fontSize:10, color:"#475569", marginBottom:8, fontStyle:"italic" }}>
                          {t.note}
                        </div>
                        {[
                          { label:"Strongest DBA", items:t.strongest_dba, color:"#a78bfa" },
                          { label:"Strongest RP",  items:t.strongest_rp,  color:"#f59e0b" },
                          { label:"Transit Triggers", items:t.strongest_transit, color:"#10b981" },
                          { label:"Lagna A-grade", items:t.lagna_trigger_candidates, color:"#22c55e" },
                          { label:"Dormant (retro)", items:t.dormant_triggers, color:"#f59e0b" },
                          { label:"Blocked Transit", items:t.blocked_transit, color:"#ef4444" },
                        ].map(row => (
                          <div key={row.label} style={{ display:"flex", gap:8, alignItems:"center",
                            marginBottom:5, fontSize:11 }}>
                            <span style={{ color:"#64748b", minWidth:110 }}>{row.label}:</span>
                            <div>
                              {row.items?.length > 0
                                ? row.items.map(p => <Tag key={p} label={p} color={row.color} small />)
                                : <span style={{ color:"#475569", fontSize:10 }}>—</span>}
                            </div>
                          </div>
                        ))}
                      </LayerBox>
                    );
                  })()}

                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── 1st & 11th CSL Success Banner ────────────────────────────────────────
function CslSuccessBanner({ result }) {
  if (!result?.kp_cusp_lords || !result?.kp_4_step) return null;
  const cslMap = {};
  result.kp_cusp_lords.forEach(c => { cslMap[c.house] = c.sub_lord; });

  // Build sig map
  const sigMap = {};
  result.kp_4_step.forEach(p => {
    sigMap[p.planet] = new Set([...(p.L1||[]), ...(p.L2||[]), ...(p.L3||[]), ...(p.L4||[])]);
  });
  const SHORT_EN = {Su:"Sun",Mo:"Moon",Ma:"Mars",Me:"Mercury",Ju:"Jupiter",Ve:"Venus",Sa:"Saturn",Ra:"Rahu",Ke:"Ketu"};

  const csl1_s  = cslMap[1]  || "";
  const csl11_s = cslMap[11] || "";
  const csl1_en  = SHORT_EN[csl1_s]  || csl1_s;
  const csl11_en = SHORT_EN[csl11_s] || csl11_s;

  const csl1_houses  = sigMap[csl1_en]  || new Set();
  const csl11_houses = sigMap[csl11_en] || new Set();

  const csl1_to_11     = csl1_houses.has(11);
  const csl11_benef    = [1,2,3,6,10,11].some(h => csl11_houses.has(h));
  const fulfillment    = csl1_to_11 || csl11_benef;

  return (
    <div style={{ background: fulfillment ? "#052e16" : "#1e293b", borderRadius: 10,
      padding: "12px 16px", border: `1px solid ${fulfillment ? "#22c55e" : "#334155"}` }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: fulfillment ? "#22c55e" : "#94a3b8", marginBottom: 8 }}>
        {fulfillment ? "✅ Desire Fulfillment Promised" : "⚠️ Fulfillment Not Confirmed"}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
        <div style={{ padding: "4px 12px", borderRadius: 6, background: "#0f172a",
          border: `1px solid ${csl1_to_11 ? "#22c55e" : "#334155"}` }}>
          <span style={{ color: "#64748b" }}>1st CSL: </span>
          <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{csl1_en}</span>
          <span style={{ color: csl1_to_11 ? "#22c55e" : "#ef4444", marginLeft: 6 }}>
            {csl1_to_11 ? "→ 11th ✓" : "→ 11th ✗"}
          </span>
        </div>
        <div style={{ padding: "4px 12px", borderRadius: 6, background: "#0f172a",
          border: `1px solid ${csl11_benef ? "#22c55e" : "#334155"}` }}>
          <span style={{ color: "#64748b" }}>11th CSL: </span>
          <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{csl11_en}</span>
          <span style={{ color: csl11_benef ? "#22c55e" : "#ef4444", marginLeft: 6 }}>
            {csl11_benef ? "→ Benef ✓" : "→ Benef ✗"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Query Verification Banner (per-topic from house_analysis) ─────────────
function QueryVerifyBanner({ result }) {
  if (!result?.house_analysis?.length) return null;
  // Show Moon NL/SL + Lagna CSL from first topic (same for all)
  // Use first VALID topic instead of blindly taking first
const validTopic = result.house_analysis.find(
  h => h?.l1_query_validation
);

const qv = validTopic?.l1_query_validation;
  if (!qv) return null;

  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 16px",
      border: "1px solid #334155" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b", marginBottom: 8 }}>
        🔍 प्रश्न सत्यता (Query Verification)
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
        Moon NL: <strong style={{ color: PLANET_COLORS[qv.moon_nl]||"#e2e8f0" }}>{qv.moon_nl}</strong>
        &nbsp;|&nbsp;Moon SL: <strong style={{ color: PLANET_COLORS[qv.moon_sl]||"#e2e8f0" }}>{qv.moon_sl}</strong>
        {qv.moon_sl_retro && <span style={{ color: "#ef4444" }}> ℞</span>}
        &nbsp;|&nbsp;Lagna CSL: <strong style={{ color: PLANET_COLORS[qv.lagna_csl]||"#e2e8f0" }}>{qv.lagna_csl}</strong>
      </div>
      {/* Per-topic verification */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {result.house_analysis.slice(0,5).map(h => (
          <div key={h.topic} style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", fontSize: 11, padding: "3px 8px",
            background: "#0f172a", borderRadius: 5 }}>
            <span style={{ color: "#64748b" }}>{h.icon} {h.topic}</span>
            <span style={{ fontWeight: 700,
              color: h.l1_query_validation?.validity?.includes("✅") ? "#22c55e"
                   : h.l1_query_validation?.validity?.includes("⚠️") ? "#f59e0b"
                   : "#ef4444", fontSize: 10 }}>
              {h.l1_query_validation?.validity || "—"}
            </span>
          </div>
        ))}
        {result.house_analysis.length > 5 && (
          <div style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>
            + {result.house_analysis.length - 5} more topics in KP Console below
          </div>
        )}
      </div>
    </div>
  );
}

function KpTables({ result }) {
  if (!result || !result.is_kp) return null;
  const retro = new Set(result.retrograde_planets || []);
  const EN_HI = { Sun:"सूर्य", Moon:"चंद्र", Mars:"मंगल", Mercury:"बुध", Jupiter:"गुरु", Venus:"शुक्र", Saturn:"शनि", Rahu:"राहु", Ketu:"केतु" };

  // Build Grade E (L5) map from ALL topics
const gradeE = {};

if (result.house_analysis?.length) {
  result.house_analysis.forEach(topic => {

    const graded = topic?.l5_significators?.graded || {};

    Object.entries(graded).forEach(([planet, data]) => {

      if (data?.grade === "E") {
        gradeE[planet] = data;
      }

    });

  });
}

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Query Verification Banner */}
      <QueryVerifyBanner result={result} />
      {/* 1st + 11th CSL Success Banner */}
      <CslSuccessBanner result={result} />
      {/* Ruling Planets */}
      <RulingPlanetsCard result={result} />
      {/* DBA */}
      <DbaCard result={result} />
      {/* House Analysis */}
      <HouseAnalysisCard result={result} />

      {/* CSL Table */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px", border: "1px solid #334155" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: "#a78bfa" }}>🎯 KP Cuspal Sub Lords (1 to 12)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#cbd5e1" }}>
          <thead>
            <tr>
              {["House","Degree","Sign Lord","Star Lord","Sub Lord (CSL)"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"8px",color:"#a78bfa",borderBottom:"1px solid #334155"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.kp_cusp_lords?.map((c) => (
              <tr key={c.house} style={{ background: c.house === 11 ? "rgba(16,185,129,0.15)" : "transparent" }}>
                <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{c.house}{c.house===11&&" ⭐"}{c.house===1&&" 🔑"}</td>
                <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{c.degree}°</td>
                <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{c.sign_lord}</td>
                <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{c.star_lord}</td>
                <td style={{padding:"8px",borderBottom:"1px solid #1e293b",
                  color:c.house===11?"#10b981":c.house===1?"#f59e0b":"#e2e8f0",
                  fontWeight:(c.house===11||c.house===1)?"bold":"normal"}}>
                  {c.sub_lord}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4-Step + L5 Table */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px", border: "1px solid #334155" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#a78bfa" }}>📊 KP Significators (L1→L4 + L5/Grade E)</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          ℞ = वक्री &nbsp;|&nbsp; ✗ = Rejected (retro NL) &nbsp;|&nbsp; L5 = Conjunct (Grade E)
        </div>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#cbd5e1", minWidth: 480 }}>
          <thead>
            <tr>
              {["Planet","L1","L2","L3","L4","L5 (E)"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"8px",color:"#a78bfa",
                  borderBottom:"1px solid #334155",
                  background: h==="L5 (E)" ? "#1e293b" : "transparent",
                  color: h==="L5 (E)" ? "#f59e0b" : "#a78bfa"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.kp_4_step?.map((p) => {
              const hi = EN_HI[p.planet] || p.planet;
              const isRetro = retro.has(hi);
              const gradeEData = gradeE[p.planet];
              // Find planets in same house as this planet (Grade E candidates)
              const l5Planets = Object.entries(gradeE)
                .filter(([ep]) => ep !== p.planet)
                .map(([ep, ed]) => ep)
                .slice(0,3);
              return (
                <tr key={p.planet} style={{
                  background: isRetro ? "#ef444411" : "transparent",
                  opacity: gradeEData?.rejected ? 0.5 : 1,
                }}>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b",fontWeight:"bold",
                    color:PLANET_COLORS[hi]||"#e2e8f0"}}>
                    {p.planet}{isRetro ? " ℞" : ""}
                    {gradeEData?.rejected && <span style={{color:"#ef4444",fontSize:10}}> ✗</span>}
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{p.L1?.join(", ")}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{p.L2?.join(", ")}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{p.L3?.join(", ")}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b"}}>{p.L4?.join(", ")}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #1e293b",color:"#f59e0b",fontSize:11}}>
                    {gradeEData ? `E: ${gradeEData.grade_reason?.replace("Grade E/L5: ","").slice(0,30)}` : "—"}
                  </td>
                </tr>
              );
            })}
            {/* Grade E only planets (not in L1-L4 but conjunct) */}
            {Object.entries(gradeE)
              .filter(([ep]) => !result.kp_4_step?.find(p => p.planet===ep))
              .map(([ep, ed]) => {
                const hi = EN_HI[ep] || ep;
                return (
                  <tr key={ep} style={{ background: "#f59e0b11" }}>
                    <td style={{padding:"8px",borderBottom:"1px solid #1e293b",fontWeight:"bold",
                      color:PLANET_COLORS[hi]||"#f59e0b", fontSize:11}}>
                      {ep} {ed.is_retro ? "℞" : ""}{ed.rejected ? " ✗" : ""}
                    </td>
                    <td colSpan={4} style={{padding:"8px",borderBottom:"1px solid #1e293b",
                      fontSize:10,color:"#64748b"}}>L1-L4 में नहीं</td>
                    <td style={{padding:"8px",borderBottom:"1px solid #1e293b",
                      color:ed.rejected?"#ef4444":"#f59e0b",fontSize:11,fontWeight:700}}>
                      ★ E
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function GocharTable({ result }) {
  if (!result || !result.macro_gochar) return null;
  const gocharData = Object.values(result.macro_gochar);
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: "16px", border: "1px solid #334155", marginTop: 20 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#f59e0b" }}>🔄 Macro Gochar (Transits)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#cbd5e1" }}>
        <thead>
          <tr style={{ background: "#0f172a" }}>
            {["Planet","Sign","Degree","Transit NL","℞"].map(h => (
              <th key={h} style={{textAlign:"left",padding:"10px",color:"#94a3b8"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gocharData.map((g) => (
            <tr key={g.Planet} style={{ borderBottom: "1px solid #1e293b", background: g.is_retrograde ? "#ef444411" : "transparent" }}>
              <td style={{padding:"10px",fontWeight:"bold",color:PLANET_COLORS[g.Planet]||"#fff"}}>{g.Planet}</td>
              <td style={{padding:"10px"}}>{g.Current_Sign}</td>
              <td style={{padding:"10px"}}>{g.Degree}</td>
              <td style={{padding:"10px",color:"#10b981",fontWeight:"600"}}>{g.Transit_NL}</td>
              <td style={{padding:"10px",color:"#ef4444",fontWeight:"bold"}}>{g.is_retrograde ? "℞" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// ── Main Component ─────────────────────────────────────────────────────────
export default function PrashnaKundli() {
  const [loading, setLoading]           = useState(false);
  const [result,  setResult]            = useState(null);
  const [error,   setError]             = useState("");
  const [locErr,  setLocErr]            = useState("");
  const [coords,  setCoords]            = useState(null);
  const [locName, setLocName]           = useState("");
  const [manualCity, setManualCity]     = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [mode,    setMode]              = useState(null); // "kaksha" | "lost"
  const [kpNumber, setKpNumber]         = useState(""); // KP Horary Number (1-249)
  const [forWhom, setForWhom]           = useState("1"); // Chart rotation pivot house

  // ── Browser से location लो ───────────────────────────────────────────
  const getIpLocation = async () => {
    try {
      setLocErr("⚠️ GPS failed, IP से location ली जा रही है...");
      const res = await fetch("https://ip-api.com/json");
      const data = await res.json();
      if (data.status === "success") {
        setCoords({ lat: data.lat, lon: data.lon });
        setLocName(`${data.city || "Location"} (approx)`);
        setLocErr("");
        return true;
      } else {
        setLocErr("❌ IP location failed — कृपया manual location डालें");
        return false;
      }
    } catch (err) {
      setLocErr("❌ Location service error — कृपया manual location डालें");
      return false;
    }
  };

  const getLocation = () => {
    setLocErr("");
    if (!navigator.geolocation) {
      setLocErr("आपका browser geolocation support नहीं करता।");
      getIpLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "User-Agent": "KundliApp/1.0" } }
          );
          const geo = await res.json();
          setLocName(
            geo.address?.city ||
            geo.address?.town ||
            geo.address?.village ||
            geo.display_name?.split(",")[0] ||
            "आपकी लोकेशन"
          );
        } catch {
          setLocName("स्थान अज्ञात");
        }
      },
      (err) => {
        if (err.code === 1) {
          setLocErr("Location permission denied — IP fallback से location ली जा रही है...");
          getIpLocation();
        } else if (err.code === 2) {
          setLocErr("Location unavailable — IP fallback से try कर रहे हैं...");
          getIpLocation();
        } else if (err.code === 3) {
          setLocErr("GPS slow है, retry कर रहे हैं... (3 sec में)");
          setTimeout(() => { getLocation(); }, 3000);
        } else {
          setLocErr("Location error — IP fallback से try कर रहे हैं...");
          getIpLocation();
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  // ── Manual City Search ────────────────────────────────────────────────
  const handleManualSearch = async () => {
    if (!manualCity.trim()) { setLocErr("कृपया city का नाम डालें"); return; }
    setManualLoading(true);
    setLocErr("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${manualCity}&format=json&limit=1`,
        { headers: { "User-Agent": "KundliApp/1.0" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });
        setLocName(display_name);
        setManualCity("");
        setLocErr("");
      } else {
        setLocErr(`"${manualCity}" नहीं मिला। कृपया दूसरा नाम try करें।`);
      }
    } catch (err) {
      setLocErr("Search error: " + err.message);
    } finally {
      setManualLoading(false);
    }
  };

  // ── API Call ──────────────────────────────────────────────────────────
  const generatePrashna = async () => {
    if (!coords) { setError("पहले location allow करें।"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    setMode(null);
    try {
      const res = await fetch(`${API_BASE}/api/prashna_kundli`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.lat, lon: coords.lon, tz_offset: 5.5, kp_number: kpNumber ? parseInt(kpNumber) : null, date: customDate, time: customTime, chart_pivot: parseInt(forWhom) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data);
      setMode(data.is_kp ? "kp_engine" : "kaksha");
      setMode("kaksha"); // default: Man ki baat
    } catch (e) {
      setError("API Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>🔯</div>
        <h1 style={styles.title}>प्रश्न कुण्डली</h1>
        <p style={styles.subtitle}>Horary Astrology — वर्तमान क्षण की कुण्डली</p>
      </div>

      {/* Location Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📍 आपकी वर्तमान स्थिति</div>
        {coords ? (
          <div style={styles.coordRow}>
            <span style={styles.coordBadge}>{locName || "स्थान लोड हो रहा है..."}</span>
            <span style={styles.coordText}>
              Lat: {coords.lat.toFixed(4)}° | Lon: {coords.lon.toFixed(4)}°
            </span>
            <button onClick={getLocation} style={styles.refreshBtn}>🔄 बदलें</button>
          </div>
        ) : (
          <div>
            {locErr
              ? <p style={styles.errorText}>{locErr}</p>
              : <p style={styles.mutedText}>⏳ Location ढूंढी जा रही है...</p>
            }
            <button onClick={getLocation} style={styles.locBtn}>📍 Location लें</button>
          </div>
        )}
        {/* Manual City Input */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>या City का नाम डालें:</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="जैसे: Delhi, Mumbai..."
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
              style={{
                flex: 1, padding: "8px 12px", background: "#0f172a",
                border: "1px solid #475569", borderRadius: 6,
                color: "#e2e8f0", fontSize: 13,
              }}
            />
            <button
              onClick={handleManualSearch}
              disabled={manualLoading}
              style={{ ...styles.locBtn, padding: "8px 14px", marginTop: 0 }}
            >
              {manualLoading ? "🔍..." : "🔍"}
            </button>
          </div>
        </div>

        {/* NAYA KP AUR TIME WALA DIBBA YAHAN SE SHURU */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Custom Date & Time (वैकल्पिक):</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ flex: 1, padding: "8px 12px", background: "#0f172a", border: "1px solid #475569", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }} />
            <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} style={{ flex: 1, padding: "8px 12px", background: "#0f172a", border: "1px solid #475569", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }} />
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>🔢 KP Prashna Number (वैकल्पिक — 1-249):</div>
          <input type="number" min="1" max="249" placeholder="जैसे: 108... (खाली छोड़ें = Vedic Mode)" value={kpNumber} onChange={(e) => setKpNumber(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "#0f172a", border: "1px solid #475569", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }} />
        </div>
        {/* NAYA DIBBA YAHAN KHATAM */}

        {/* KP Number Input */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            🔢 KP Prashna Number (वैकल्पिक — 1-249):
          </div>
          <input
            type="number"
            min="1"
            max="249"
            placeholder="जैसे: 108, 143... (खाली छोड़ें = Vedic Mode)"
            value={kpNumber}
            onChange={(e) => setKpNumber(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", background: "#0f172a",
              border: "1px solid #475569", borderRadius: 6,
              color: "#e2e8f0", fontSize: 13,
            }}
          />
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
            💡 KP Number दें तो Placidus Houses + Fixed Lagna; खाली = Vedic Whole Sign
          </div>
        </div>
        {/* Chart Rotation — Bhavat Bhavam */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #334155" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>🔄 प्रश्न किसके लिए? (Chart Rotation)</div>
          <select value={forWhom} onChange={(e) => setForWhom(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", background: "#0f172a",
              border: "1px solid #475569", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }}>
            <option value="1">स्वयं / Self (1st House)</option>
            <option value="3">छोटे भाई/बहन (3rd)</option>
            <option value="4">माता / Mother (4th)</option>
            <option value="5">पुत्र/पुत्री (5th)</option>
            <option value="6">मामा (6th)</option>
            <option value="7">पति/पत्नी / Spouse (7th)</option>
            <option value="9">पिता / Father (9th)</option>
            <option value="11">बड़े भाई/दोस्त (11th)</option>
            <option value="12">चाचा/ताऊ (12th)</option>
          </select>
          {forWhom !== "1" && (
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 5 }}>
              ⚠️ Chart भाव {forWhom} से rotate होगा
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePrashna}
        disabled={loading || !coords}
        style={{
          ...styles.generateBtn,
          opacity: loading || !coords ? 0.6 : 1,
          cursor:  loading || !coords ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "⏳ गणना हो रही है..." : "🔯 प्रश्न कुण्डली बनाएं"}
      </button>

      {error && <p style={styles.errorText}>{error}</p>}

      {/* ── Result ─────────────────────────────────────────────────────── */}
      {result && (
        <div style={styles.resultWrap}>

          {/* ── Mode Selector Tabs ─────────────────────────────────────── */}
          <div style={styles.modeSelectorWrap}>
            <div style={styles.modeSelectorLabel}>आप क्या जानना चाहते हैं?</div>
            <div style={styles.modeBtnRow}>
              {result.is_kp && (
                <button onClick={() => setMode("kp_engine")} style={{ ...styles.modeBtn, ...(mode === "kp_engine" ? styles.modeBtnActive : {}) }}>
                  📊 KP Engine
                </button>
              )}
              <button
                onClick={() => setMode("kaksha")}
                style={{
                  ...styles.modeBtn,
                  ...(mode === "kaksha" ? styles.modeBtnActive : {}),
                }}
              >
                🧠 मन की बात
              </button>
              <button
                onClick={() => setMode("lost")}
                style={{
                  ...styles.modeBtn,
                  ...(mode === "lost" ? styles.modeBtnActiveLost : {}),
                }}
              >
                🔍 खोई वस्तु
              </button>
            </div>
          </div>

          {/* Dial + Lagna Info — always visible */}
          <div style={styles.topRow}>
            <div style={styles.dialCard}>
              <div style={styles.cardTitle}>कक्षा चक्र</div>
              <KakshaDial
                allKaksha={result.all_kaksha}
                activeKaksha={result.kaksha}
                lagnaDeg={result.lagna_degree_in_sign}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>⬡ प्रश्न लग्न राशि</div>
                <div style={styles.infoBig}>{result.lagna_rashi_name}</div>
                <div style={styles.infoSub}>राशि क्रमांक: {result.lagna_rashi + 1}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>📐 लग्न डिग्री</div>
                <div style={styles.infoBig}>{result.lagna_degree_in_sign.toFixed(2)}°</div>
                <div style={styles.infoSub}>राशि में डिग्री (0–30°)</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>⭐ नक्षत्र</div>
                <div style={styles.infoBig}>{result.nakshatra}</div>
                <div style={styles.infoSub}>स्वामी: {result.nakshatra_lord}</div>
              </div>
            </div>
          </div>

          {/* Kaksha Banner — always visible */}
          <div style={{
            ...styles.kakshaBanner,
            borderColor: PLANET_COLORS[result.kaksha_lord] || "#f59e0b",
            background: (PLANET_COLORS[result.kaksha_lord] || "#f59e0b") + "18",
          }}>
            <div style={styles.kakshaLabel}>सक्रिय कक्षा</div>
            <div style={styles.kakshaNum}>{result.kaksha}</div>
            <div style={{ color: PLANET_COLORS[result.kaksha_lord] || "#f59e0b", fontSize: 15, fontWeight: 600 }}>
              स्वामी: {result.kaksha_lord}
            </div>
            <div style={styles.kakshaVishay}>{result.kaksha_vishay}</div>
          </div>

          {/* ── मन की बात — only when mode === "kaksha" ─────────────────── */}
          {mode === "kaksha" && (
            <div style={styles.predCard}>
              <div style={styles.cardTitle}>🔮 भविष्यवाणी</div>
              <p style={styles.predText}>{result.prediction}</p>
              <div style={styles.timeRow}>
                🕐 प्रश्न समय: <strong>{result.prashna_time}</strong> (IST)
              </div>
            </div>
          )}
          {mode === "kp_engine" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <KpTables result={result} />
              <GocharTable result={result} />
            </div>
          )}
          {/* ── खोई वस्तु — only when mode === "lost" ───────────────────── */}
          {mode === "lost" && (
            <LostItemSection lostItem={result?.lost_item} result={result} />
          )}
          {/* Gochar Table — Kaksha aur Lost mode mein bhi dikhao */}
          {mode !== "kp_engine" && <GocharTable result={result} />}

          {/* All Kaksha Table */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>📊 सभी 8 कक्षाएं</div>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["कक्षा", "स्वामी", "डिग्री (राशि में)", "विषय"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.all_kaksha.map((k) => (
                    <tr key={k.kaksha} style={{
                      background: k.active ? (PLANET_COLORS[k.lord] || "#f59e0b") + "22" : "transparent",
                      fontWeight: k.active ? "bold" : "normal",
                    }}>
                      <td style={styles.td}>{k.active ? "▶ " : ""}{k.kaksha}</td>
                      <td style={{ ...styles.td, color: PLANET_COLORS[k.lord] || "#94a3b8" }}>
                        {k.lord}
                      </td>
                      <td style={styles.td}>{k.start_deg}° – {k.end_deg}°</td>
                      <td style={styles.td}>{k.vishay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "24px 16px",
    maxWidth: 720,
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: 28 },
  headerIcon: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 28, fontWeight: 700, margin: "0 0 6px",
    background: "linear-gradient(90deg, #a78bfa, #f59e0b)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#94a3b8", fontSize: 14, margin: 0 },
  card: {
    background: "#1e293b", borderRadius: 12,
    padding: "16px 20px", marginBottom: 16, border: "1px solid #334155",
  },
  cardTitle: { fontWeight: 600, fontSize: 15, marginBottom: 10, color: "#a78bfa" },
  coordRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  coordBadge: { background: "#3b4b6b", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "#e2e8f0" },
  coordText: { fontSize: 12, color: "#94a3b8" },
  refreshBtn: {
    background: "transparent", border: "1px solid #475569", borderRadius: 8,
    color: "#94a3b8", fontSize: 12, padding: "4px 10px", cursor: "pointer",
  },
  locBtn: {
    marginTop: 10, background: "#3730a3", border: "none",
    borderRadius: 8, color: "#fff", fontSize: 14, padding: "8px 18px", cursor: "pointer",
  },
  generateBtn: {
    width: "100%", padding: "16px",
    background: "linear-gradient(90deg, #7c3aed, #b45309)",
    border: "none", borderRadius: 14, color: "#fff",
    fontSize: 17, fontWeight: 700, marginBottom: 20, letterSpacing: 1,
  },
  errorText: { color: "#f87171", fontSize: 13, marginBottom: 10 },
  mutedText: { color: "#64748b", fontSize: 13 },
  resultWrap: { display: "flex", flexDirection: "column", gap: 16 },
  topRow: { display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" },
  dialCard: {
    background: "#1e293b", borderRadius: 12, padding: "16px",
    border: "1px solid #334155", display: "flex", flexDirection: "column", alignItems: "center",
  },
  infoCard: {
    background: "#1e293b", borderRadius: 10, padding: "12px 16px",
    marginBottom: 10, border: "1px solid #334155",
  },
  infoLabel: {
    fontSize: 11, color: "#64748b", marginBottom: 2,
    textTransform: "uppercase", letterSpacing: 1,
  },
  infoBig: { fontSize: 22, fontWeight: 700, color: "#f1f5f9" },
  infoSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  kakshaBanner: { borderRadius: 12, padding: "20px", border: "2px solid", textAlign: "center" },
  kakshaLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#94a3b8", marginBottom: 4 },
  kakshaNum: { fontSize: 52, fontWeight: 800, lineHeight: 1.1 },
  kakshaVishay: { fontSize: 15, color: "#e2e8f0", marginTop: 6 },
  predCard: {
    background: "#1e293b", borderRadius: 12,
    padding: "16px 20px", border: "1px solid #334155",
  },
  predText: { fontSize: 14, lineHeight: 1.8, color: "#cbd5e1", margin: "0 0 12px" },
  timeRow: { fontSize: 12, color: "#64748b" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #334155",
    color: "#a78bfa", fontWeight: 600, fontSize: 12,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  td: { padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1" },

  // ── Mode Selector ──────────────────────────────────────────────────────
  modeSelectorWrap: {
    background: "#1e293b", borderRadius: 14,
    padding: "16px 20px", border: "1px solid #334155", textAlign: "center",
  },
  modeSelectorLabel: {
    fontSize: 13, color: "#94a3b8", marginBottom: 12,
    textTransform: "uppercase", letterSpacing: 1,
  },
  modeBtnRow: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  modeBtn: {
    padding: "12px 24px", borderRadius: 12, border: "2px solid #334155",
    background: "#0f172a", color: "#94a3b8", fontSize: 15, fontWeight: 600,
    cursor: "pointer", transition: "all 0.25s", letterSpacing: 0.5,
  },
  modeBtnActive: {
    border: "2px solid #a78bfa", background: "#a78bfa22",
    color: "#c4b5fd", boxShadow: "0 0 16px #a78bfa44",
  },
  modeBtnActiveLost: {
    border: "2px solid #f59e0b", background: "#f59e0b22",
    color: "#fcd34d", boxShadow: "0 0 16px #f59e0b44",
  },
};