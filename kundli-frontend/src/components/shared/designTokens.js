// src/components/shared/designTokens.js
// ─── Central design tokens — import from here, never inline ──

// Typography
export const HI = { fontFamily: "'Noto Sans Devanagari', sans-serif" };

// Color palette
export const C = {
  amber:  "#F59E0B",
  cyan:   "#22D3EE",
  rose:   "#FB7185",
  green:  "#4ADE80",
  purple: "#C084FC",
  indigo: "#818CF8",
  orange: "#FB923C",
  teal:   "#2DD4BF",
  red:    "#EF4444",
  yellow: "#FCD34D",
  pink:   "#F472B6",
  blue:   "#60A5FA",
  slate:  "#94A3B8",
};

// Planet Hindi names + symbols
export const PH = {
  Su: "सूर्य ☉",
  Mo: "चंद्र ☽",
  Ma: "मंगल ♂",
  Me: "बुध ☿",
  Ju: "गुरु ♃",
  Ve: "शुक्र ♀",
  Sa: "शनि ♄",
  Ra: "राहु ☊",
  Ke: "केतु ☋",
};

// Strength color + label
export const strColor = (s) =>
  s >= 90 ? "#22D3EE" : s >= 60 ? "#4ADE80" : s >= 40 ? "#F59E0B" : "#FB7185";

export const strLabel = (s) =>
  s >= 90 ? "बलवान" : s >= 60 ? "सामान्य" : s >= 40 ? "कमजोर" : "अत्यंत कमजोर";

// Ashtakvarga color + label
export const avColor = (v) =>
  v >= 28 ? "#4ADE80" : v >= 24 ? "#FCD34D" : "#FB7185";

export const avLabel = (v) =>
  v >= 28 ? "बलवान" : v >= 24 ? "सामान्य" : "कमजोर";

// Risk color + background
export const riskColor = (r) =>
  r >= 70 ? "#FB7185" : r >= 40 ? "#F59E0B" : r >= 20 ? "#FDE68A" : "#4ADE80";

export const riskBg = (r) =>
  r >= 70
    ? "rgba(251,113,133,.12)"
    : r >= 40
    ? "rgba(245,158,11,.10)"
    : r >= 20
    ? "rgba(253,230,138,.08)"
    : "rgba(74,222,128,.08)";