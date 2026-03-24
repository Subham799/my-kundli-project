"""
kaksha_engine.py
=================
Batch 1 — Daily Prediction via Kaksha Bal
Based on Dr. Amit Kumar Dadhich's system.

Features:
  1. Kaksha Bal  (8 kakshas × 3°45' per rashi)
  2. Daily Chandra AV Score  (14–42 scale)
  3. Daily SAV Score  (98–294 scale)
  4. Daily Kaksha Score  (0–7 scale)
  5. Maha-Muhurta Finder  (Sun + Moon both in shubh kaksha)
  6. Per-planet kaksha status with timing

Kaksha Order (slowest → fastest planet):
  Index:  0       1       2      3      4      5      6      7
  Lord:   Shani   Guru    Mangal Surya  Shukra Budh   Chandra Lagna
  Degree: 0-3.75  3.75-7.5 ...   ...   ...   ...    22.5-26.25  26.25-30

Corrections Applied (v1.1):
  [NAMING FIX] PLANET_SPEED_DAYS renamed to PLANET_DEG_PER_DAY (values are
               degrees/day, not days/degree). Formula: days = KAKSHA_SIZE / deg_per_day.
               Math was always correct — only the variable name was misleading.

Usage:
    from kaksha_engine import compute_daily_prediction
    result = compute_daily_prediction(
        transit_planets = { "Su": {"rashi_index": 0, "degree": 14.5}, ... },
        bav_charts      = { "Su": [3,4,2,...], "Mo": [...], ... },
        sav             = [28,22,30,...],   # 12-element list
        prastara_bav    = { "Su": [[0,1,0,1,...], ...] }  # optional, 8×12 matrix
    )
"""

from typing import Dict, List, Optional, Tuple, Any


# ─────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────

KAKSHA_LORDS = ["Sa", "Ju", "Ma", "Su", "Ve", "Me", "Mo", "La"]
KAKSHA_SIZE  = 30.0 / 8   # = 3.75 degrees per kaksha

KAKSHA_RANGES = [
    (0.00,  3.75,  "Sa", "शनि"),
    (3.75,  7.50,  "Ju", "गुरु"),
    (7.50,  11.25, "Ma", "मंगल"),
    (11.25, 15.00, "Su", "सूर्य"),
    (15.00, 18.75, "Ve", "शुक्र"),
    (18.75, 22.50, "Me", "बुध"),
    (22.50, 26.25, "Mo", "चंद्र"),
    (26.25, 30.00, "La", "लग्न"),
]

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल",
    "Me": "बुध",   "Ju": "गुरु",  "Ve": "शुक्र",
    "Sa": "शनि",   "Ra": "राहु",  "Ke": "केतु",
    "La": "लग्न",
}

RASHI_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन",
]

# Daily score interpretation tables
CHANDRA_AV_SCALE = [
    (36, 42, "अत्यंत शुभ",   "very_good",  "आज सभी काम निश्चित सफल होंगे।"),
    (31, 35, "शुभ",           "good",       "दिन अच्छा रहेगा, महत्वपूर्ण काम करें।"),
    (29, 30, "सामान्य+",      "above_avg",  "दिन ठीक-ठाक रहेगा।"),
    (28, 28, "सामान्य",       "neutral",    "न बहुत अच्छा, न बुरा।"),
    (25, 27, "सामान्य-",      "below_avg",  "थोड़ी सावधानी रखें।"),
    (21, 24, "अशुभ",          "bad",        "महत्वपूर्ण काम आज टालें।"),
    (14, 20, "अत्यंत अशुभ",   "very_bad",   "कोई भी नया या बड़ा काम न करें।"),
]

SAV_SCALE = [
    (246, 294, "अत्यंत शुभ",  "very_good",  "ग्रहों का सम्पूर्ण समर्थन प्राप्त।"),
    (211, 245, "शुभ",          "good",       "अधिकांश ग्रह अनुकूल स्थिति में।"),
    (197, 210, "सामान्य+",     "above_avg",  "ग्रहों का आंशिक सहयोग।"),
    (196, 196, "सामान्य",      "neutral",    "संतुलित स्थिति।"),
    (169, 195, "सामान्य-",     "below_avg",  "सावधानी के साथ काम करें।"),
    (141, 168, "अशुभ",         "bad",        "ग्रह प्रतिकूल — टालें।"),
    (98,  140, "अत्यंत अशुभ",  "very_bad",   "भारी विरोध — रुकें।"),
]

KAKSHA_SCALE = [
    (7, 7, "महामुहूर्त",      "mahamuhurta",  "सभी 7 ग्रह शुभ कक्षा में — अत्यंत दुर्लभ शुभ क्षण।"),
    (5, 6, "अत्यंत शुभ",      "very_good",    "बड़े काम, नई शुरुआत, Deal करें।"),
    (4, 4, "शुभ",              "good",         "महत्वपूर्ण काम किए जा सकते हैं।"),
    (3, 3, "सामान्य",          "neutral",      "सामान्य काम ठीक — बड़े फैसले टालें।"),
    (2, 2, "सावधान",           "caution",      "किसी बड़े काम से बचें।"),
    (1, 1, "अशुभ",             "bad",          "महत्वपूर्ण काम टालना उचित।"),
    (0, 0, "अत्यंत अशुभ",     "very_bad",     "कोई भी बड़ा काम बिल्कुल न करें।"),
]


# ─────────────────────────────────────────────────────────
# CORE KAKSHA FUNCTIONS
# ─────────────────────────────────────────────────────────

def get_kaksha_index(degree_in_rashi: float) -> int:
    """
    Given a degree within a rashi (0.0 to 30.0),
    return the kaksha index (0-7).
    """
    degree_in_rashi = max(0.0, min(29.999, degree_in_rashi))
    return int(degree_in_rashi / KAKSHA_SIZE)


def get_kaksha_lord(degree_in_rashi: float) -> str:
    """Return kaksha lord code (Sa/Ju/Ma/Su/Ve/Me/Mo/La)."""
    return KAKSHA_LORDS[get_kaksha_index(degree_in_rashi)]


def get_kaksha_info(degree_in_rashi: float) -> Dict:
    """Full kaksha info for a given degree."""
    idx   = get_kaksha_index(degree_in_rashi)
    lord  = KAKSHA_LORDS[idx]
    start = idx * KAKSHA_SIZE
    end   = start + KAKSHA_SIZE
    return {
        "index":      idx,
        "lord":       lord,
        "lord_name":  PLANET_NAMES_HI.get(lord, lord),
        "start_deg":  round(start, 2),
        "end_deg":    round(end, 2),
        "degree":     round(degree_in_rashi, 4),
    }


# ─────────────────────────────────────────────────────────
# BAV LOOKUP HELPERS
# ─────────────────────────────────────────────────────────

def _bav_raw(bav_charts: Dict, planet: str, rashi_index: int) -> int:
    """Raw BAV total (0-8) for a planet in a rashi (0-based index)."""
    chart = bav_charts.get(planet, [])
    if not chart or rashi_index < 0 or rashi_index >= 12:
        return 0
    return int(chart[rashi_index])


def _bav_point(bav_charts: Dict, planet: str, rashi_index: int) -> int:
    """
    Binary BAV indicator (0 or 1) — for kaksha binary check.
    Returns 1 if planet has any points in that rashi, else 0.
    """
    return 1 if _bav_raw(bav_charts, planet, rashi_index) > 0 else 0


def _prastara_point(
    prastara_bav: Optional[Dict],
    transit_planet: str,
    rashi_index: int,
    kaksha_lord: str
) -> int:
    """
    Check if kaksha_lord gave a point to transit_planet in rashi_index.
    
    prastara_bav format:
    {
      "Su": {           # transit planet
        "Sa": [0,1,...],  # kaksha lord → 12 rashi values (0 or 1)
        "Ju": [...],
        ...
        "La": [...]
      },
      ...
    }
    
    If prastara not provided, fall back to simplified BAV total.
    """
    if prastara_bav and transit_planet in prastara_bav:
        planet_prastara = prastara_bav[transit_planet]
        if kaksha_lord in planet_prastara:
            row = planet_prastara[kaksha_lord]
            if rashi_index < len(row):
                return int(row[rashi_index])
    return -1  # -1 means prastara not available


# ─────────────────────────────────────────────────────────
# PLANET KAKSHA STATUS
# ─────────────────────────────────────────────────────────

def get_planet_kaksha_status(
    planet_code: str,
    rashi_index: int,
    degree_in_rashi: float,
    bav_charts: Dict,
    prastara_bav: Optional[Dict] = None
) -> Dict:
    """
    Complete kaksha analysis for one transit planet.
    Returns shubh (1) or ashubh (0) + full details.
    """
    kaksha = get_kaksha_info(degree_in_rashi)
    lord   = kaksha["lord"]

    # Try prastara first
    prastara_val = _prastara_point(prastara_bav, planet_code, rashi_index, lord)

    if prastara_val >= 0:
        # Exact prastara data available
        is_shubh  = bool(prastara_val)
        method    = "prastara"
        bindu_val = prastara_val
    else:
        # Fallback: use total BAV.
        # Lagna kaksha — typically favorable if planet has any points
        if lord == "La":
            planet_raw = _bav_raw(bav_charts, planet_code, rashi_index)
            bindu_val  = 1 if planet_raw >= 4 else 0
            is_shubh   = bool(bindu_val)
            method     = "lagna_approx"
        else:
            # Check: did the kaksha lord give any BAV point in this rashi?
            lord_raw   = _bav_raw(bav_charts, lord, rashi_index)
            planet_raw = _bav_raw(bav_charts, planet_code, rashi_index)

            if lord_raw >= 4 and planet_raw >= 4:
                # Both strong — shubh
                bindu_val = 1; is_shubh = True
            elif lord_raw == 0 and planet_raw <= 2:
                # Both weak — ashubh
                bindu_val = 0; is_shubh = False
            elif lord_raw >= 3:
                # Lord has decent points → shubh
                bindu_val = 1; is_shubh = True
            elif planet_raw >= 5:
                # Planet itself is strong here → shubh
                bindu_val = 1; is_shubh = True
            else:
                bindu_val = 0; is_shubh = False
            method = "bav_approx"

    rashi_name = RASHI_NAMES_HI[rashi_index] if rashi_index < 12 else f"रा.{rashi_index+1}"

    return {
        "planet":           planet_code,
        "planet_name":      PLANET_NAMES_HI.get(planet_code, planet_code),
        "rashi_index":      rashi_index,
        "rashi_name":       rashi_name,
        "degree":           round(degree_in_rashi, 2),
        "kaksha":           kaksha,
        "kaksha_lord":      lord,
        "kaksha_lord_name": PLANET_NAMES_HI.get(lord, lord),
        "is_shubh":         is_shubh,
        "kaksha_score":     1 if is_shubh else 0,
        "method":           method,
        "bindu":            bindu_val,
        "status_label":     "✅ शुभ" if is_shubh else "❌ अशुभ",
        "effect": (
            f"{PLANET_NAMES_HI.get(planet_code,planet_code)} की कक्षा स्वामी "
            f"{PLANET_NAMES_HI.get(lord,lord)} ने बिंदु दिया → शुभ"
        ) if is_shubh else (
            f"{PLANET_NAMES_HI.get(planet_code,planet_code)} की कक्षा स्वामी "
            f"{PLANET_NAMES_HI.get(lord,lord)} ने बिंदु नहीं दिया → अशुभ"
        ),
    }


# ─────────────────────────────────────────────────────────
# SCORE INTERPRETATION
# ─────────────────────────────────────────────────────────

def _interpret(value: int, scale: list) -> Dict:
    for lo, hi, label, level, desc in scale:
        if lo <= value <= hi:
            return {"label": label, "level": level, "description": desc}
    # Fallback
    return {"label": "अज्ञात", "level": "unknown", "description": ""}


def _score_to_percent(value: int, min_v: int, max_v: int) -> int:
    return round(((value - min_v) / (max_v - min_v)) * 100)


# ─────────────────────────────────────────────────────────
# DAILY PREDICTION SCORES
# ─────────────────────────────────────────────────────────

def compute_chandra_av_score(
    transit_positions: Dict,
    bav_charts: Dict
) -> Dict:
    """
    Sum of Chandra BAV values for each transit planet's rashi.
    7 planets × max 6 points each = max 42. Neutral = 28.
    """
    moon_bav = bav_charts.get("Mo", [])
    if not moon_bav:
        return {"score": 0, "planet_details": []}

    total   = 0
    details = []
    planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]

    for p in planets:
        pdata = transit_positions.get(p, {})
        if not pdata:
            continue
        rashi_idx = pdata.get("rashi_index", 0)
        pts = moon_bav[rashi_idx] if rashi_idx < len(moon_bav) else 0
        total += pts
        details.append({
            "planet":      p,
            "planet_name": PLANET_NAMES_HI.get(p, p),
            "rashi":       RASHI_NAMES_HI[rashi_idx] if rashi_idx < 12 else "",
            "moon_bav":    pts,
        })

    interp = _interpret(total, CHANDRA_AV_SCALE)
    return {
        "score":          total,
        "max":            42,
        "percent":        _score_to_percent(total, 14, 42),
        "label":          interp["label"],
        "level":          interp["level"],
        "description":    interp["description"],
        "planet_details": details,
    }


def compute_sav_daily_score(
    transit_positions: Dict,
    sav: List[int]
) -> Dict:
    """
    Sum of SAV values for each transit planet's rashi.
    7 planets × max 42 pts each = max 294. Neutral = 196.
    """
    total   = 0
    details = []
    planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]

    for p in planets:
        pdata = transit_positions.get(p, {})
        if not pdata:
            continue
        rashi_idx = pdata.get("rashi_index", 0)
        pts = sav[rashi_idx] if rashi_idx < len(sav) else 0
        total += pts
        details.append({
            "planet":      p,
            "planet_name": PLANET_NAMES_HI.get(p, p),
            "rashi":       RASHI_NAMES_HI[rashi_idx] if rashi_idx < 12 else "",
            "sav_pts":     pts,
        })

    interp = _interpret(total, SAV_SCALE)
    return {
        "score":          total,
        "max":            294,
        "percent":        _score_to_percent(total, 98, 294),
        "label":          interp["label"],
        "level":          interp["level"],
        "description":    interp["description"],
        "planet_details": details,
    }


def compute_kaksha_daily_score(
    transit_positions: Dict,
    bav_charts: Dict,
    prastara_bav: Optional[Dict] = None
) -> Dict:
    """
    For each of 7 transit planets, check if kaksha lord gave a point.
    Score = count of planets in shubh kaksha (0-7).
    """
    total       = 0
    planets_out = []
    planets     = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]

    for p in planets:
        pdata = transit_positions.get(p, {})
        if not pdata:
            continue
        rashi_idx = pdata.get("rashi_index", 0)
        degree    = pdata.get("degree",      0.0)

        status = get_planet_kaksha_status(
            planet_code     = p,
            rashi_index     = rashi_idx,
            degree_in_rashi = degree,
            bav_charts      = bav_charts,
            prastara_bav    = prastara_bav,
        )
        total += status["kaksha_score"]
        planets_out.append(status)

    interp = _interpret(total, KAKSHA_SCALE)
    is_mahamuhurta = (total == 7)

    # Check if Sun and Moon are both shubh (bonus insight)
    sun_shubh  = next((p["is_shubh"] for p in planets_out if p["planet"] == "Su"), False)
    moon_shubh = next((p["is_shubh"] for p in planets_out if p["planet"] == "Mo"), False)
    sun_moon_both = sun_shubh and moon_shubh

    return {
        "score":           total,
        "max":             7,
        "percent":         round((total / 7) * 100),
        "label":           interp["label"],
        "level":           interp["level"],
        "description":     interp["description"],
        "is_mahamuhurta":  is_mahamuhurta,
        "sun_moon_shubh":  sun_moon_both,
        "mahamuhurta_msg": "🌟 महामुहूर्त! यह अत्यंत दुर्लभ क्षण है — सभी 7 ग्रह शुभ कक्षा में हैं।" if is_mahamuhurta else (
            "✨ सूर्य + चंद्र दोनों शुभ कक्षा में — बड़े काम के लिए उत्तम समय।" if sun_moon_both else ""
        ),
        "planet_details":  planets_out,
    }


# ─────────────────────────────────────────────────────────
# FINAL VERDICT (combine 3 scores)
# ─────────────────────────────────────────────────────────

LEVEL_ORDER = {
    "very_bad": 0, "bad": 1, "below_avg": 2, "neutral": 3,
    "above_avg": 4, "good": 5, "very_good": 6, "mahamuhurta": 7,
}

FINAL_VERDICT = {
    (True,  True,  True):  ("🌟 दिन अत्यंत शुभ", "very_good", "#22D3EE"),
    (True,  True,  False): ("✅ दिन अच्छा", "good", "#4ADE80"),
    (True,  False, True):  ("✅ दिन ठीक", "above_avg", "#4ADE80"),
    (False, True,  True):  ("🟡 मिला-जुला", "above_avg", "#F59E0B"),
    (True,  False, False): ("🟡 सामान्य", "neutral", "#F59E0B"),
    (False, True,  False): ("🟡 सामान्य", "neutral", "#F59E0B"),
    (False, False, True):  ("🟠 सावधान", "caution", "#FB923C"),
    (False, False, False): ("🔴 अशुभ — रुकें", "bad", "#FB7185"),
}

def _is_positive(level: str) -> bool:
    return LEVEL_ORDER.get(level, 3) >= 4

def compute_final_verdict(chandra_score: Dict, sav_score: Dict, kaksha_score: Dict) -> Dict:
    key = (
        _is_positive(chandra_score["level"]),
        _is_positive(sav_score["level"]),
        _is_positive(kaksha_score["level"]),
    )
    label, level, color = FINAL_VERDICT.get(key, ("🟡 सामान्य", "neutral", "#F59E0B"))

    if kaksha_score.get("is_mahamuhurta"):
        return {
            "label": "🌟 महामुहूर्त — अत्यंत दुर्लभ शुभ क्षण",
            "level": "mahamuhurta",
            "color": "#22D3EE",
            "advice": "आज कोई भी बड़ा काम, Deal, नई शुरुआत या शुभ कार्य करें — सफलता निश्चित।",
        }

    advice_map = {
        "very_good":  "आज सभी महत्वपूर्ण काम करें — ग्रह पूर्णतः अनुकूल हैं।",
        "good":       "दिन अच्छा है — बड़े काम और meetings आज करें।",
        "above_avg":  "दिन ठीक है — सामान्य काम सफल होंगे।",
        "neutral":    "दिन सामान्य है — बड़े फैसले बाद में लें।",
        "caution":    "सावधानी रखें — महत्वपूर्ण काम टालना उचित।",
        "bad":        "आज बड़े काम, Deal या नई शुरुआत न करें।",
        "very_bad":   "ग्रह प्रतिकूल हैं — आज कोई बड़ा निर्णय बिल्कुल न लें।",
    }

    return {
        "label":  label,
        "level":  level,
        "color":  color,
        "advice": advice_map.get(level, ""),
    }


# ─────────────────────────────────────────────────────────
# SPEED-BASED TIMING (slow planet kast lasts longer)
# ─────────────────────────────────────────────────────────

# [NAMING FIX v1.1] Renamed from PLANET_SPEED_DAYS → PLANET_DEG_PER_DAY
# Values represent degrees traveled per day (not days per degree).
# Formula to get kaksha duration: days = KAKSHA_SIZE / deg_per_day
# Example: Moon = 13.2 deg/day → 3.75 / 13.2 = 0.284 days ≈ 6.8 hours per kaksha ✓
PLANET_DEG_PER_DAY = {
    "Sa": 0.034,   # ~30 years / 360°  → stays in one kaksha ~110 days
    "Ju": 0.083,   # ~12 years         → stays in one kaksha ~45 days
    "Ma": 0.524,   # ~2 years          → stays in one kaksha ~7 days
    "Su": 1.0,     # 1 year            → stays in one kaksha ~3.75 days
    "Ve": 1.2,                         # → stays in one kaksha ~3.1 days
    "Me": 1.5,                         # → stays in one kaksha ~2.5 days
    "Mo": 13.2,    # ~27 days          → stays in one kaksha ~6.8 hours ← VIRAL FEATURE
}

def get_kaksha_duration(planet_code: str) -> str:
    """
    How long will this planet stay in its current kaksha?
    Uses PLANET_DEG_PER_DAY: days = KAKSHA_SIZE (3.75°) / deg_per_day
    """
    deg_per_day = PLANET_DEG_PER_DAY.get(planet_code, 1.0)  # [FIX] was: days_per_deg
    days = KAKSHA_SIZE / deg_per_day                          # [FIX] formula unchanged, naming correct
    if days >= 60:
        return f"~{round(days/30)} महीने"
    elif days >= 7:
        return f"~{round(days)} दिन"
    elif days >= 1:
        return f"~{round(days, 1)} दिन"
    else:
        hours = round(days * 24)
        return f"~{hours} घंटे"


# ─────────────────────────────────────────────────────────
# MASTER FUNCTION
# ─────────────────────────────────────────────────────────

def compute_daily_prediction(
    transit_planets: Dict,
    bav_charts: Dict,
    sav: List[int],
    prastara_bav: Optional[Dict] = None,
    date_str: str = ""
) -> Dict:
    """
    Master function — called from engines_bridge.py or API directly.

    Args:
        transit_planets: {
            "Su": {"rashi_index": 0, "degree": 14.5, "rashi_name": "Aries"},
            "Mo": {...}, "Ma": {...}, "Me": {...}, "Ju": {...}, "Ve": {...}, "Sa": {...}
        }
        bav_charts: {"Su": [3,4,...12 vals], "Mo": [...], ...}
        sav:        [28, 22, ..., 12 values]
        prastara_bav: optional exact 8×12 matrix per planet
        date_str:   "2025-03-17" (for display)

    Returns:
        Complete daily prediction dict.
    """
    try:
        chandra_score = compute_chandra_av_score(transit_planets, bav_charts)
        sav_score     = compute_sav_daily_score(transit_planets, sav)
        kaksha_score  = compute_kaksha_daily_score(transit_planets, bav_charts, prastara_bav)
        verdict       = compute_final_verdict(chandra_score, sav_score, kaksha_score)

        # Add duration info to each planet
        for p in kaksha_score["planet_details"]:
            p["duration"] = get_kaksha_duration(p["planet"])

        # Find best planets (shubh kaksha)
        shubh_planets  = [p for p in kaksha_score["planet_details"] if p["is_shubh"]]
        ashubh_planets = [p for p in kaksha_score["planet_details"] if not p["is_shubh"]]

        # Moon timing: changes kaksha every ~6.7 hours
        moon_data   = kaksha_score["planet_details"]
        moon_status = next((p for p in moon_data if p["planet"] == "Mo"), None)

        return {
            "computed":       True,
            "date":           date_str,
            "chandra_score":  chandra_score,
            "sav_score":      sav_score,
            "kaksha_score":   kaksha_score,
            "verdict":        verdict,
            "shubh_planets":  [p["planet_name"] for p in shubh_planets],
            "ashubh_planets": [p["planet_name"] for p in ashubh_planets],
            "moon_status":    moon_status,
            "moon_tip": (
                "🌙 चंद्रमा हर ~6-7 घंटे में कक्षा बदलता है — समय के साथ दिन बेहतर/खराब हो सकता है।"
            ),
            "key_rule": (
                "सूत्र: कोई ग्रह तभी शुभ फल देता है जब वह ऐसे अंशों पर हो "
                "जहाँ उसकी कक्षा के स्वामी ने उसे बिंदु दिया हो।"
            ),
            "engine": "kaksha_engine v1.1",
        }

    except Exception as e:
        return {
            "computed": False,
            "error":    str(e),
            "engine":   "kaksha_engine v1.1",
        }