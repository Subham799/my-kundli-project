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
  const [mode,    setMode]              = useState(null); // "kaksha" | "lost"

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
        body:    JSON.stringify({ lat: coords.lat, lon: coords.lon, tz_offset: 5.5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data);
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

          {/* ── खोई वस्तु — only when mode === "lost" ───────────────────── */}
          {mode === "lost" && (
            <LostItemSection lostItem={result?.lost_item} result={result} />
          )}

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