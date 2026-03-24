// kundliApi.js
// LOCAL:   uses Vite proxy (/api → localhost:5001) — BASE_URL khali rakho
// VERCEL:  set VITE_API_URL=https://your-backend.onrender.com in Vercel env vars
const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function fetchKundliChart(formData) {
  const res = await fetch(`${BASE_URL}/api/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name:formData.name, dob:formData.dob, time:formData.time, city:formData.city, chart_type:formData.chartType }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Server error: ${res.status}`); }
  return res.json();
}

// FAST — sirf chart+dasha+AV, no engines (~0.5s)
export async function fetchKundliChartFast(formData) {
  const res = await fetch(`${BASE_URL}/api/chart/fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name:formData.name, dob:formData.dob, time:formData.time, city:formData.city, chart_type:formData.chartType }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Server error: ${res.status}`); }
  return res.json();
}

// ENGINES — sirf 7 engines ka data, chart dobara nahi
export async function fetchKundliEngines(formData) {
  const res = await fetch(`${BASE_URL}/api/chart/engines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name:formData.name, dob:formData.dob, time:formData.time, city:formData.city, chart_type:formData.chartType }),
  });
  if (!res.ok) return { enginesData: {}, _enginesReady: false };
  return res.json();
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