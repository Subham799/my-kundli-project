// kundliApi.js
// LOCAL:   uses Vite proxy (/api → localhost:5001) — BASE_URL khali rakho
// VERCEL:  set VITE_API_URL=https://your-backend.onrender.com in Vercel env vars
const BASE_URL = import.meta.env.VITE_API_URL || "";

// ── Utility: wait ────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Silent ping: sirf ek baar server ko jagao ───────────────
let _hasWoken = false;
const wakeUpServer = () => {
  if (!_hasWoken && BASE_URL) {
    _hasWoken = true;
    fetch(`${BASE_URL}/api/cities?q=delhi`).catch(() => {});
  }
};

// ── Core retry logic ─────────────────────────────────────────
// 400 = data error  → turant rok do, retry mat karo
// 5xx / network     → retry karo (max 6 baar, har baar thoda zyada wait)
async function fetchWithSmartRetry(endpoint, payload) {
  const MAX_ATTEMPTS = 3;
  let delay = 4000; // pehli retry ke baad 4s, phir 6s, 9s...

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ✅ Success
      if (res.ok) return await res.json();

      // ❌ 400 = galat data, retry nahi karni
      if (res.status === 400) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Data Error: ${err.message || "Invalid input — city/dob/time check karein"}`);
      }

      // ⏳ 5xx / kuch aur = server so raha hai ya busy hai
      throw new Error(`Server status: ${res.status}`);

    } catch (err) {
      // 400 error pe seedha bahar
      if (err.message.startsWith("Data Error:")) throw err;

      // Aakhri attempt — haar maano
      if (attempt === MAX_ATTEMPTS) {
        throw new Error("सर्वर अभी शुरू नहीं हो सका। 1 मिनट बाद दोबारा कोशिश करें।");
      }

      // Wait karke agli koshish
      console.warn(`Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
      await sleep(delay);
      delay = Math.round(delay * 1.5); // exponential backoff: 4s → 6s → 9s → 13s...
    }
  }
}

// ── Exported functions ────────────────────────────────────────

export async function fetchKundliChart(formData) {
  wakeUpServer();
  return fetchWithSmartRetry("/api/chart", {
    name: formData.name, dob: formData.dob, time: formData.time,
    city: formData.city, chart_type: formData.chartType,
    lat: formData.lat, lon: formData.lon,
  });
}

// FAST — sirf chart+dasha+AV, no engines (~0.5s)
export async function fetchKundliChartFast(formData) {
  wakeUpServer();
  return fetchWithSmartRetry("/api/chart/fast", {
    name: formData.name, dob: formData.dob, time: formData.time,
    city: formData.city, chart_type: formData.chartType,
    lat: formData.lat, lon: formData.lon,
  });
}

// ENGINES — sirf 7 engines ka data, direct fetch (no retry loop)
export async function fetchKundliEngines(formData) {
  try {
    const res = await fetch(`${BASE_URL}/api/chart/engines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name, dob: formData.dob, time: formData.time,
        city: formData.city, chart_type: formData.chartType,
        lat: formData.lat, lon: formData.lon,
      }),
    });
    if (!res.ok) return { enginesData: null, _enginesReady: false };
    return await res.json();
  } catch (err) {
    console.error("Engines fetch failed:", err);
    return { enginesData: null, _enginesReady: false };
  }
}

export async function fetchDashasForYear(dob, moondeg, year) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashas_for_year`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dob, moon_degree: moondeg, year }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchDashaAlignment(dob, moondeg, filters) {
  try {
    const res = await fetch(`${BASE_URL}/api/dasha_alignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dob, moon_degree: moondeg, ...filters }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchCitySuggestions(query) {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${BASE_URL}/api/cities?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}