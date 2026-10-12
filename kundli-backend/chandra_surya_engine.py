"""
chandra_surya_engine.py
========================
Batch 3 — Chandra + Surya Sutras + Personality Engine

Features:
  1.  Chandra Upachaya Rule     — Moon in 6/11 + BAV 5+ = Super Rich
  2.  Weak Moon Diseases        — kaf, asthma, gastric, depression prediction
  3.  Maata Viyog Check         — Moon in 4/7/8/12 + BAV ≤3 + Rahu = separation
  4.  Paksha Bal Modifier       — Purnima vs Amavasya effect on Moon BAV
  5.  Day 3-Part Division       — Lucky time of day via Sun BAV
  6.  Lucky Month               — Highest Sun BAV rashi = best month
  7.  Sun Month Formula         — Rashi number + 3 = English month
  8.  Sankranti Nakshatra       — 1-3/4-9/10-12/13-18/19-21/22-27 results
  9.  Satvik vs Rajasik         — Internal vs External points (personality)
  10. Work-to-Profit Ratio      — 10th vs 11th house
  11. Past Life Karma Indicator — 5th house high = purva janm karma
  12. Trik Reverse Rule         — 6,8,12 should be <28

Corrections Applied (v1.1):
  [BUG FIX 1] Lucky Direction — was using house-based SAV indices for rashi-based
              direction formula. Now correctly maps rashis→houses via lagna_rashi offset.
              lagna_rashi param added to compute_life_sutras() and master function.
  [BUG FIX 2] Chandra Upachaya — moon_sav was using moon_rashi index on house-based
              SAV array. Fixed to use moon_house - 1 (correct house index).
  [IMPROVEMENT] Maata Viyog — Shani aspects now include 3rd and 10th drishti in
              addition to conjunction (0) and 7th (6). Rahu aspects also separated
              for clarity. Matches standard Vedic aspect rules.

Usage:
    from chandra_surya_engine import compute_chandra_surya
    result = compute_chandra_surya(
        planets          = { "Mo": {"house": 4, "rashi_index": 3, "degree": 18.5}, ... },
        sav              = [28, 22, ...],
        bav_charts       = { "Su": [...], "Mo": [...], ... },
        birth_tithi      = 15,          # 1-30 (15=Purnima, 30/0=Amavasya)
        janm_nakshatra   = 4,           # 0-based index (0=Ashwini)
        sankranti_nakshatra = 12,       # nakshatra index at current Sankranti
        sunrise_hour     = 6.0,         # float, 24h format
        sunset_hour      = 18.0,
    )
"""

from typing import Dict, List, Optional, Tuple, Any


# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

NAKSHATRA_NAMES = [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा",
    "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्वाफाल्गुनी", "उत्तराफाल्गुनी",
    "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा",
    "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती",
]

RASHI_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन",
]

# English month numbers for Sun transit (+3 formula)
ENGLISH_MONTHS = [
    "जनवरी", "फरवरी", "मार्च", "अप्रैल",
    "मई", "जून", "जुलाई", "अगस्त",
    "सितंबर", "अक्तूबर", "नवंबर", "दिसंबर",
]

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल",
    "Me": "बुध",   "Ju": "गुरु",  "Ve": "शुक्र",
    "Sa": "शनि",   "Ra": "राहु",  "Ke": "केतु",
}

# Sankranti nakshatra count → result
SANKRANTI_RESULTS = [
    (range(1, 4),   "यात्रा और सुख में कमी",          "caution",  "🚗"),
    (range(4, 10),  "सुख और समृद्धि",                "good",     "✅"),
    (range(10, 13), "शारीरिक/मानसिक पीड़ा (कष्ट)",   "bad",      "⚠️"),
    (range(13, 19), "वस्त्र और शुभ फल प्राप्ति",     "good",     "🎁"),
    (range(19, 22), "धन हानि",                        "bad",      "💸"),
    (range(22, 28), "धन आगम (पैसा आएगा)",             "very_good","💰"),
]

# Tithi ranges for Paksha Bal
PURNIMA_RANGE   = range(11, 16)   # Tithi 11-15 = Shukla Paksha peak
AMAVASYA_RANGE  = range(26, 31)   # Tithi 26-30 = Krishna Paksha peak
SHUKLA_RANGE    = range(1, 16)    # 1-15 Shukla Paksha
KRISHNA_RANGE   = range(16, 31)   # 16-30 Krishna Paksha

# Disease associations with weak Moon in specific houses
MOON_HOUSE_DISEASES = {
    1:  ["सिरदर्द", "मानसिक तनाव"],
    2:  ["मुंह के रोग", "दांत की समस्या"],
    3:  ["कंधे/बाहु की समस्या"],
    4:  ["छाती/हृदय", "फेफड़ों की कमजोरी"],
    5:  ["पेट के रोग", "बच्चों के रोग"],
    6:  ["कमजोर पाचन", "दस्त"],
    7:  ["किडनी", "मूत्र रोग"],
    8:  ["गुप्त रोग", "पुरानी बीमारी"],
    9:  ["कूल्हे की समस्या"],
    10: ["घुटने की समस्या"],
    11: ["टखने", "रक्त विकार"],
    12: ["पैरों की समस्या", "नींद न आना"],
}

WEAK_MOON_GENERAL_DISEASES = [
    "कफ और सर्दी-जुकाम",
    "खांसी और अस्थमा",
    "पेट/गैस्ट्रिक की समस्या",
    "मानसिक अवसाद (Depression)",
    "नकारात्मक विचार",
    "माता से दूरी या कष्ट",
]

STRONG_MOON_QUALITIES = [
    "मजबूत मनोबल",
    "उर्वर कल्पनाशक्ति",
    "माता का सुख",
    "द्रव्य (Liquid Cash) का अच्छा प्रवाह",
    "भावनात्मक स्थिरता",
]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _bav_raw(bav_charts: Dict, planet: str, rashi_index: int) -> int:
    chart = bav_charts.get(planet, [])
    if not chart or rashi_index < 0 or rashi_index >= 12:
        return 0
    return int(chart[rashi_index])


def _sav_pt(sav: List[int], idx: int) -> int:
    if not sav or idx < 0 or idx >= 12:
        return 0
    return sav[idx]


def _planet_house(planets: Dict, code: str) -> int:
    return int(planets.get(code, {}).get("house", 1))


def _planet_rashi(planets: Dict, code: str) -> int:
    p = planets.get(code, {})
    ri = p.get("rashi_index", p.get("rashi_num", 1))
    if isinstance(ri, int) and ri >= 1:
        ri = ri - 1
    return max(0, min(11, int(ri)))


def _strength_label(bav: int) -> str:
    if bav >= 6: return "अत्यंत बलवान"
    if bav >= 5: return "बलवान"
    if bav == 4: return "सामान्य"
    if bav == 3: return "निर्बल"
    return "अत्यंत निर्बल"


# ─────────────────────────────────────────────
# FEATURE 1 — CHANDRA UPACHAYA RULE
# ─────────────────────────────────────────────

def compute_chandra_upachaya(
    planets: Dict,
    bav_charts: Dict,
    sav: List[int],
) -> Dict:
    """
    Upachaya houses = 3, 6, 10, 11.
    Special Rule: Moon in 6th or 11th + BAV ≥ 5 = Super Rich.
    Even born in poverty → becomes crorepati through wit and courage.
    """
    moon_house = _planet_house(planets, "Mo")
    moon_rashi = _planet_rashi(planets, "Mo")
    moon_bav   = _bav_raw(bav_charts, "Mo", moon_rashi)

    # [BUG FIX v1.1] moon_sav must use house index (0-based), not rashi index.
    # sav list is house-based: sav[0] = 1st house, sav[1] = 2nd house, etc.
    # OLD (wrong):  moon_sav = _sav_pt(sav, moon_rashi)  → picked wrong house
    # NEW (correct): moon_sav = _sav_pt(sav, moon_house - 1)
    moon_sav   = _sav_pt(sav, moon_house - 1)

    is_upachaya = moon_house in (3, 6, 10, 11)
    is_super    = moon_house in (6, 11) and moon_bav >= 5

    if is_super:
        label   = "💎 सुपर रिच योग!"
        color   = "#22D3EE"
        desc    = (f"चंद्रमा {moon_house}वें (उपचय) भाव में + BAV {moon_bav} ≥ 5। "
                   "यह योग है कि चाहे परिवार कितना भी गरीब हो, यह जातक अपनी बुद्धि और "
                   "साहस से करोड़पति बनता है।")
        level   = "elite"
    elif is_upachaya and moon_bav >= 4:
        label   = "🌟 उपचय लाभ"
        color   = "#4ADE80"
        desc    = (f"चंद्रमा उपचय भाव ({moon_house}) में + BAV {moon_bav}। "
                   "धन और सफलता में वृद्धि होती रहती है।")
        level   = "strong"
    elif is_upachaya:
        label   = "🟡 उपचय — कमजोर BAV"
        color   = "#F59E0B"
        desc    = f"चंद्रमा उपचय भाव में है लेकिन BAV {moon_bav} कम है।"
        level   = "weak"
    else:
        label   = "⚖️ सामान्य स्थिति"
        color   = "#F59E0B"
        desc    = f"चंद्रमा {moon_house}वें भाव में — उपचय नियम लागू नहीं।"
        level   = "neutral"

    return {
        "moon_house":      moon_house,
        "moon_rashi":      moon_rashi,
        "moon_rashi_name": RASHI_NAMES_HI[moon_rashi] if moon_rashi < 12 else "",
        "moon_bav":        moon_bav,
        "moon_sav":        moon_sav,
        "is_upachaya":     is_upachaya,
        "is_super_rich":   is_super,
        "label":           label,
        "color":           color,
        "description":     desc,
        "level":           level,
        "bav_strength":    _strength_label(moon_bav),
    }


# ─────────────────────────────────────────────
# FEATURE 2 — WEAK MOON DISEASES
# ─────────────────────────────────────────────

def compute_moon_health(
    planets: Dict,
    bav_charts: Dict,
    birth_tithi: int = 15,
) -> Dict:
    """
    Assess Moon's health impact based on BAV + house + tithi.
    Strong Moon → excellent health and mental strength.
    Weak Moon → diseases, depression, maata issues.
    """
    moon_house = _planet_house(planets, "Mo")
    moon_rashi = _planet_rashi(planets, "Mo")
    moon_bav   = _bav_raw(bav_charts, "Mo", moon_rashi)

    # Paksha modifier
    if birth_tithi in PURNIMA_RANGE:
        paksha    = "purnima"
        pak_label = "पूर्णिमा (अत्यंत बलशाली)"
        pak_mod   = +2
        pak_note  = "पूर्णिमा के पास जन्म — चंद्रमा का पक्ष बल अत्यधिक। BAV फल 2 गुना।"
    elif birth_tithi in AMAVASYA_RANGE:
        paksha    = "amavasya"
        pak_label = "अमावस्या (अत्यंत क्षीण)"
        pak_mod   = -3
        pak_note  = "अमावस्या के पास जन्म — चंद्रमा क्षीण। BAV 7-8 होने पर भी शुभ फल घट जाते हैं।"
    elif birth_tithi in SHUKLA_RANGE:
        paksha    = "shukla"
        pak_label = "शुक्ल पक्ष (बढ़ता चाँद)"
        pak_mod   = +1
        pak_note  = "शुक्ल पक्ष — चंद्रमा का बल बढ़ रहा है।"
    else:
        paksha    = "krishna"
        pak_label = "कृष्ण पक्ष (घटता चाँद)"
        pak_mod   = -1
        pak_note  = "कृष्ण पक्ष — चंद्रमा का बल घट रहा है।"

    effective_bav = max(0, min(8, moon_bav + pak_mod))

    if effective_bav >= 5:
        health_level = "strong"
        health_label = "💪 स्वस्थ और मानसिक रूप से मजबूत"
        health_color = "#22D3EE"
        qualities    = STRONG_MOON_QUALITIES
        diseases     = []
        risk_age     = None
    elif effective_bav == 4:
        health_level = "average"
        health_label = "🟡 सामान्य स्वास्थ्य"
        health_color = "#F59E0B"
        qualities    = STRONG_MOON_QUALITIES[:2]
        diseases     = WEAK_MOON_GENERAL_DISEASES[:2]
        risk_age     = None
    else:
        health_level = "weak"
        health_label = "⚠️ स्वास्थ्य पर ध्यान दें"
        health_color = "#FB7185"
        qualities    = []
        diseases     = (WEAK_MOON_GENERAL_DISEASES +
                        MOON_HOUSE_DISEASES.get(moon_house, []))
        risk_age = "34 से 37 वर्ष" if effective_bav <= 2 else None

    special_risk = (effective_bav <= 2 and
                    any(_planet_house(planets, p) == moon_house
                        for p in ["Ra", "Sa"] if p in planets))

    return {
        "moon_house":         moon_house,
        "moon_rashi":         moon_rashi,
        "moon_bav":           moon_bav,
        "effective_bav":      effective_bav,
        "birth_tithi":        birth_tithi,
        "paksha":             paksha,
        "paksha_label":       pak_label,
        "paksha_note":        pak_note,
        "paksha_modifier":    pak_mod,
        "health_level":       health_level,
        "health_label":       health_label,
        "health_color":       health_color,
        "positive_qualities": qualities,
        "potential_diseases": diseases,
        "risk_age":           risk_age,
        "special_risk":       special_risk,
        "special_risk_note": (
            "राहु/शनि के साथ होने पर मानसिक अवसाद या गंभीर रोग का खतरा।"
            if special_risk else ""
        ),
    }


# ─────────────────────────────────────────────
# FEATURE 3 — MAATA VIYOG
# ─────────────────────────────────────────────

def compute_maata_viyog(
    planets: Dict,
    bav_charts: Dict,
) -> Dict:
    """
    Maata Viyog conditions:
    - Moon in 4th, 7th, 8th, or 12th house
    - Moon BAV in that rashi ≤ 3
    - Rahu or Shani aspecting or conjunct Moon

    [IMPROVEMENT v1.1] Shani aspects now include 3rd and 10th drishti in addition
    to conjunction (0) and 7th (6), per standard Vedic aspect rules.
    Rahu aspects separated for clarity (conjunction + 7th only).
    """
    moon_house  = _planet_house(planets, "Mo")
    moon_rashi  = _planet_rashi(planets, "Mo")
    moon_bav    = _bav_raw(bav_charts, "Mo", moon_rashi)

    cond1 = moon_house in (4, 7, 8, 12)
    cond2 = moon_bav <= 3

    rahu_house  = _planet_house(planets, "Ra")
    shani_house = _planet_house(planets, "Sa")

    # Rahu aspects: conjunction (0) + 7th drishti (6 houses apart)
    rahu_diff   = (moon_house - rahu_house) % 12
    rahu_aspect = rahu_diff in {0, 6}

    # Shani aspects: conjunction (0) + 3rd drishti (2) + 7th drishti (6) + 10th drishti (9)
    shani_diff   = (moon_house - shani_house) % 12
    shani_aspect = shani_diff in {0, 2, 6, 9}

    cond3      = rahu_aspect or shani_aspect
    risk_count = sum([cond1, cond2, cond3])

    if risk_count == 3:
        level = "high"
        label = "⚠️ मातृ वियोग का प्रबल योग"
        color = "#FB7185"
        desc  = (f"चंद्रमा {moon_house}वें भाव में + BAV {moon_bav} ≤ 3 + "
                 f"राहु/शनि का प्रभाव। माता का सुख कम, दूरी, या मातृ वियोग संभव।")
    elif risk_count == 2:
        level = "medium"
        label = "🟡 माता के सुख में कमी"
        color = "#F59E0B"
        desc  = "दो शर्तें पूरी — माता का स्वास्थ्य या सुख प्रभावित हो सकता है।"
    else:
        level = "low"
        label = "✅ माता का सुख"
        color = "#22D3EE"
        desc  = "मातृ वियोग के योग नहीं हैं।"

    return {
        "moon_house":    moon_house,
        "moon_bav":      moon_bav,
        "cond1_house":   cond1,
        "cond2_bav":     cond2,
        "cond3_paap":    cond3,
        "rahu_aspect":   rahu_aspect,
        "shani_aspect":  shani_aspect,
        "shani_diff":    shani_diff,
        "rahu_diff":     rahu_diff,
        "risk_count":    risk_count,
        "level":         level,
        "label":         label,
        "color":         color,
        "description":   desc,
    }


# ─────────────────────────────────────────────
# FEATURE 4 — PAKSHA BAL MODIFIER
# ─────────────────────────────────────────────

def compute_paksha_bal(birth_tithi: int) -> Dict:
    """
    Standalone Paksha Bal calculator.
    Tithi 1-15 = Shukla Paksha (waxing moon)
    Tithi 16-30 = Krishna Paksha (waning moon)
    """
    if birth_tithi <= 0 or birth_tithi > 30:
        birth_tithi = 15  # default Purnima

    if birth_tithi == 15:
        strength = 100
        phase    = "पूर्णिमा"
        label    = "🌕 अत्यंत बलवान (पूर्णिमा)"
        color    = "#22D3EE"
    elif birth_tithi == 30 or birth_tithi == 0:
        strength = 0
        phase    = "अमावस्या"
        label    = "🌑 अत्यंत क्षीण (अमावस्या)"
        color    = "#FB7185"
    elif birth_tithi < 15:
        # Shukla Paksha — growing
        strength = int((birth_tithi / 15) * 100)
        phase    = f"शुक्ल पक्ष (तिथि {birth_tithi})"
        label    = f"🌒 बढ़ता चाँद (शक्ति {strength}%)"
        color    = "#4ADE80" if strength > 50 else "#F59E0B"
    else:
        # Krishna Paksha — waning
        strength = int(((30 - birth_tithi) / 15) * 100)
        phase    = f"कृष्ण पक्ष (तिथि {birth_tithi})"
        label    = f"🌘 घटता चाँद (शक्ति {strength}%)"
        color    = "#F59E0B" if strength > 30 else "#FB7185"

    return {
        "tithi":    birth_tithi,
        "strength": strength,
        "phase":    phase,
        "label":    label,
        "color":    color,
        "note": (
            "यदि BAV 7-8 है लेकिन अमावस्या पर जन्म है तो शुभ फल घट जाते हैं।"
            if strength < 20 else
            "पूर्णिमा/पूर्ण चंद्र पर जन्म — BAV फल दोगुना प्रभावशाली।"
            if strength >= 90 else ""
        ),
    }


# ─────────────────────────────────────────────
# FEATURE 5 — DAY 3-PART DIVISION
# ─────────────────────────────────────────────

def compute_lucky_time_of_day(
    planets: Dict,
    bav_charts: Dict,
    sunrise_hour: float = 6.0,
    sunset_hour:  float = 18.0,
) -> Dict:
    """
    Sun BAV divides day into 3 equal parts.
    Natal Sun rashi → start of calculation.
    Part with highest sum of 4 rashis = lucky time.
    """
    sun_rashi = _planet_rashi(planets, "Su")
    sun_bav   = bav_charts.get("Su", [])
    if len(sun_bav) < 12:
        return {"computed": False}

    day_hours = sunset_hour - sunrise_hour
    part_hrs  = day_hours / 3.0

    rashis = [(sun_rashi + i) % 12 for i in range(12)]
    g1     = rashis[0:4]
    g2     = rashis[4:8]
    g3     = rashis[8:12]

    sum1 = sum(sun_bav[r] for r in g1)
    sum2 = sum(sun_bav[r] for r in g2)
    sum3 = sum(sun_bav[r] for r in g3)

    parts = [
        {
            "name":    "प्रथम भाग (सुबह)",
            "start":   _format_time(sunrise_hour),
            "end":     _format_time(sunrise_hour + part_hrs),
            "rashis":  [RASHI_NAMES_HI[r] for r in g1],
            "bav_sum": sum1,
            "is_best": False,
        },
        {
            "name":    "द्वितीय भाग (दोपहर)",
            "start":   _format_time(sunrise_hour + part_hrs),
            "end":     _format_time(sunrise_hour + 2 * part_hrs),
            "rashis":  [RASHI_NAMES_HI[r] for r in g2],
            "bav_sum": sum2,
            "is_best": False,
        },
        {
            "name":    "तृतीय भाग (शाम)",
            "start":   _format_time(sunrise_hour + 2 * part_hrs),
            "end":     _format_time(sunset_hour),
            "rashis":  [RASHI_NAMES_HI[r] for r in g3],
            "bav_sum": sum3,
            "is_best": False,
        },
    ]

    best_idx = [sum1, sum2, sum3].index(max(sum1, sum2, sum3))
    parts[best_idx]["is_best"] = True

    return {
        "computed":       True,
        "sun_rashi":      sun_rashi,
        "sun_rashi_name": RASHI_NAMES_HI[sun_rashi],
        "parts":          parts,
        "best_part":      parts[best_idx],
        "best_part_idx":  best_idx,
        "rule":           "जिस भाग का BAV योग सबसे अधिक, वह समय महत्वपूर्ण कामों के लिए सर्वश्रेष्ठ।",
    }


def _format_time(hour: float) -> str:
    h = int(hour)
    m = int((hour - h) * 60)
    return f"{h:02d}:{m:02d}"


# ─────────────────────────────────────────────
# FEATURE 6 — LUCKY MONTH + SUN FORMULA
# ─────────────────────────────────────────────

def compute_lucky_months(
    planets: Dict,
    bav_charts: Dict,
) -> Dict:
    """
    Highest Sun BAV rashi → lucky month when Sun transits there.
    Formula: Rashi_number + 3 = English month number.
    """
    sun_bav = bav_charts.get("Su", [])
    if not sun_bav or len(sun_bav) < 12:
        return {"computed": False}

    rashi_pts = [(i, sun_bav[i]) for i in range(12)]
    sorted_r  = sorted(rashi_pts, key=lambda x: x[1], reverse=True)

    months = []
    for rashi_idx, pts in sorted_r:
        month_num  = ((rashi_idx + 1) + 3 - 1) % 12 + 1
        if month_num > 12:
            month_num -= 12
        month_name = ENGLISH_MONTHS[month_num - 1]
        months.append({
            "rashi_index": rashi_idx,
            "rashi_name":  RASHI_NAMES_HI[rashi_idx],
            "sun_bav":     pts,
            "month_num":   month_num,
            "month_name":  month_name,
            "formula":     f"राशि {rashi_idx+1} + 3 = {(rashi_idx+1)+3} → {month_name}",
            "is_lucky":    pts >= 5,
            "is_unlucky":  pts <= 2,
        })

    lucky   = [m for m in months if m["is_lucky"]]
    unlucky = [m for m in months if m["is_unlucky"]]

    return {
        "computed":       True,
        "all_months":     months,
        "lucky_months":   lucky[:4],
        "unlucky_months": unlucky[:3],
        "best_month":     months[0] if months else None,
        "worst_month":    sorted(months, key=lambda x: x["sun_bav"])[0] if months else None,
        "rule":           "सूर्य जिस महीने अधिक BAV वाली राशि में हो — वह महीना शुभ।",
        "formula_note":   "शॉर्टकट: राशि संख्या + 3 = अंग्रेजी महीने की संख्या।",
    }


# ─────────────────────────────────────────────
# FEATURE 7 — SANKRANTI NAKSHATRA RESULT
# ─────────────────────────────────────────────

def compute_sankranti_result(
    janm_nakshatra: int,
    sankranti_nakshatra: int,
) -> Dict:
    """
    Count from Janm Nakshatra to Sankranti's Moon Nakshatra.
    Special: If count falls on 1, 10, or 19 (Janma/Anujanma/Trijanma) → bad month.
    """
    count = ((sankranti_nakshatra - janm_nakshatra) % 27) + 1

    result_info = None
    for r_range, desc, level, icon in SANKRANTI_RESULTS:
        if count in r_range:
            result_info = (desc, level, icon)
            break

    if not result_info:
        result_info = ("सामान्य महीना", "neutral", "⚖️")

    desc, level, icon = result_info

    is_special_bad = count in (1, 10, 19)

    colors = {
        "very_good": "#22D3EE",
        "good":      "#4ADE80",
        "neutral":   "#F59E0B",
        "caution":   "#FB923C",
        "bad":       "#FB7185",
    }

    if is_special_bad:
        label       = "⛔ अत्यंत कष्टकारी महीना"
        color       = "#FB7185"
        final_level = "bad"
    else:
        label       = f"{icon} {desc}"
        color       = colors.get(level, "#F59E0B")
        final_level = level

    return {
        "janm_nakshatra":      janm_nakshatra,
        "janm_nakshatra_name": NAKSHATRA_NAMES[janm_nakshatra % 27],
        "sankranti_nakshatra": sankranti_nakshatra,
        "sankranti_nak_name":  NAKSHATRA_NAMES[sankranti_nakshatra % 27],
        "count":               count,
        "description":         desc,
        "label":               label,
        "level":               final_level,
        "color":               color,
        "is_special_bad":      is_special_bad,
        "special_note": (
            f"गिनती {count} = जन्म/अनुजन्म/त्रिजन्म नक्षत्र पर पड़ी — यह महीना बहुत कष्टकारी होगा।"
            if is_special_bad else ""
        ),
        "count_ranges": [
            {"range": "1-3",   "result": "यात्रा, सुख में कमी"},
            {"range": "4-9",   "result": "सुख प्राप्ति"},
            {"range": "10-12", "result": "पीड़ा / कष्ट"},
            {"range": "13-18", "result": "वस्त्र / शुभ फल"},
            {"range": "19-21", "result": "धन हानि"},
            {"range": "22-27", "result": "धन आगम"},
        ],
    }


# ─────────────────────────────────────────────
# FEATURE 8 — SATVIK VS RAJASIK PERSONALITY
# ─────────────────────────────────────────────

def compute_personality_type(sav: List[int]) -> Dict:
    """
    Internal points (1,4,5,7,9,10) = Kendra + Trikon = Satvik/spiritual
    External points (2,3,6,8,11,12) = Others = Rajasik/materialistic
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    h = {i+1: sav[i] for i in range(12)}

    internal = h[1] + h[4] + h[5] + h[7] + h[9] + h[10]
    external = h[2] + h[3] + h[6] + h[8] + h[11] + h[12]

    total   = internal + external
    int_pct = round((internal / total) * 100) if total > 0 else 50
    ext_pct = 100 - int_pct

    if internal > external + 15:
        ptype  = "satvik"
        label  = "🧘 सात्विक / परोपकारी"
        color  = "#22D3EE"
        desc   = ("आप दिल से शांतिप्रिय, दानी और परोपकारी हैं। "
                  "आत्म-संतुष्टि और धर्म को महत्व देते हैं।")
        traits = ["शांत स्वभाव", "दान की प्रवृत्ति", "आध्यात्मिक रुचि",
                  "भावनात्मक बुद्धि", "लोगों की मदद में आनंद"]
    elif external > internal + 15:
        ptype  = "rajasik"
        label  = "💼 राजसिक / महत्वाकांक्षी"
        color  = "#FB923C"
        desc   = ("आप धन, प्रसिद्धि और पद को महत्व देते हैं। "
                  "महत्वाकांक्षी और कर्मठ — सफलता के लिए कठोर मेहनत करते हैं।")
        traits = ["महत्वाकांक्षी", "धन-प्रेमी", "दिखावे में रुचि",
                  "प्रभावशाली व्यक्तित्व", "कड़ी मेहनत"]
    else:
        ptype  = "balanced"
        label  = "⚖️ संतुलित व्यक्तित्व"
        color  = "#4ADE80"
        desc   = "आपका स्वभाव संतुलित है — आध्यात्म और सांसारिक जीवन में तालमेल।"
        traits = ["संतुलित दृष्टिकोण", "व्यावहारिक", "दोनों जगत में सफल"]

    return {
        "computed":      True,
        "internal_sum":  internal,
        "external_sum":  external,
        "internal_pct":  int_pct,
        "external_pct":  ext_pct,
        "personality":   ptype,
        "label":         label,
        "color":         color,
        "description":   desc,
        "traits":        traits,
        "house_breakdown": {
            "internal_houses": {"1": h[1], "4": h[4], "5": h[5],
                                "7": h[7], "9": h[9], "10": h[10]},
            "external_houses": {"2": h[2], "3": h[3], "6": h[6],
                                "8": h[8], "11": h[11], "12": h[12]},
        },
    }


# ─────────────────────────────────────────────
# FEATURE 9 — ADDITIONAL LIFE SUTRAS
# ─────────────────────────────────────────────

def compute_life_sutras(sav: List[int], lagna_rashi: int = 0) -> Dict:
    """
    Remaining important sutras:
    - Work-to-profit ratio (10 vs 11)
    - Past life karma (5th house)
    - Trik reverse rule (6,8,12 < 28)
    - Lucky direction from SAV (rashi-based, not house-based)

    Args:
        sav:         12-element list, house-based (sav[0] = 1st house)
        lagna_rashi: 0-based rashi index of Lagna (e.g. 0=Aries, 1=Taurus)

    [BUG FIX v1.1] Lucky Direction was incorrectly using house indices (h[1], h[5], h[9])
    directly as rashi indices. The direction formula is rashi-based:
      East  = Aries(0)  + Leo(4)    + Sagittarius(8)
      South = Taurus(1) + Virgo(5)  + Capricorn(9)
      West  = Gemini(2) + Libra(6)  + Aquarius(10)
      North = Cancer(3) + Scorpio(7) + Pisces(11)
    Fix: map each rashi to its house via lagna_rashi offset, then look up SAV.
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    h = {i+1: sav[i] for i in range(12)}

    # Work-to-profit
    if h[11] > h[10]:
        wtp_label = "💸 कम मेहनत, ज्यादा मुनाफा"
        wtp_color = "#22D3EE"
        wtp_desc  = f"11वां ({h[11]}) > 10वां ({h[10]}) — कम काम में अधिक लाभ।"
    elif h[10] > h[11]:
        wtp_label = "⚒️ मेहनत ज्यादा, मुनाफा कम"
        wtp_color = "#FB923C"
        wtp_desc  = f"10वां ({h[10]}) > 11वां ({h[11]}) — कड़ी मेहनत करनी पड़ती है।"
    else:
        wtp_label = "⚖️ मेहनत और मुनाफा बराबर"
        wtp_color = "#F59E0B"
        wtp_desc  = "संतुलित अनुपात।"

    # Past life karma
    fifth = h[5]
    if fifth >= 28:
        karma_label = "🔄 पूर्वजन्म के कर्म सक्रिय"
        karma_color = "#F59E0B"
        karma_desc  = (f"5वें भाव में {fifth} बिंदु — पूर्व जन्म के अधूरे कर्म "
                       "इस जन्म में पीछा कर रहे हैं। अधिक आत्मिक साधना करें।")
    else:
        karma_label = "✅ कर्म का बोझ कम"
        karma_color = "#4ADE80"
        karma_desc  = (f"5वें भाव में {fifth} बिंदु — पूर्व जन्म के कर्म का "
                       "बोझ कम है, यह जन्म अपेक्षाकृत हल्का है।")

    # Trik reverse rule
    trik_bad  = [i for i in [6, 8, 12] if h[i] >= 28]
    trik_good = [i for i in [6, 8, 12] if h[i] < 25]
    if not trik_bad:
        trik_label = "✅ त्रिक भाव अनुकूल"
        trik_color = "#22D3EE"
        trik_desc  = "6, 8, 12 में बिंदु 28 से कम — निरोगी, कर्ज-मुक्त, न्यून व्यय।"
    else:
        trik_label = f"⚠️ त्रिक भाव {trik_bad} में अधिक बिंदु"
        trik_color = "#FB7185"
        trik_desc  = (f"भाव {trik_bad} में 28+ बिंदु — "
                      "शत्रु/रोग/व्यय में वृद्धि। सावधानी आवश्यक।")

    # ─── Lucky Direction (RASHI-based, BUG FIX v1.1) ────────────────────────
    # Each rashi maps to a house via: house_idx = (rashi - lagna_rashi) % 12
    # Direction rashi groups (0-indexed):
    #   East  = Aries(0), Leo(4), Sagittarius(8)
    #   South = Taurus(1), Virgo(5), Capricorn(9)
    #   West  = Gemini(2), Libra(6), Aquarius(10)
    #   North = Cancer(3), Scorpio(7), Pisces(11)
    def rashi_sav(rashi_idx: int) -> int:
        house_idx = (rashi_idx - lagna_rashi) % 12  # 0-based house index
        return sav[house_idx]

    east  = rashi_sav(0) + rashi_sav(4) + rashi_sav(8)   # Aries, Leo, Sagittarius
    south = rashi_sav(1) + rashi_sav(5) + rashi_sav(9)   # Taurus, Virgo, Capricorn
    west  = rashi_sav(2) + rashi_sav(6) + rashi_sav(10)  # Gemini, Libra, Aquarius
    north = rashi_sav(3) + rashi_sav(7) + rashi_sav(11)  # Cancer, Scorpio, Pisces
    # ────────────────────────────────────────────────────────────────────────

    dirs     = {"पूर्व": east, "दक्षिण": south, "पश्चिम": west, "उत्तर": north}
    best_dir = max(dirs, key=dirs.get)

    return {
        "computed": True,
        "work_profit": {
            "h10": h[10], "h11": h[11],
            "label": wtp_label, "color": wtp_color, "desc": wtp_desc,
        },
        "past_karma": {
            "h5": fifth,
            "label": karma_label, "color": karma_color, "desc": karma_desc,
        },
        "trik_analysis": {
            "h6": h[6], "h8": h[8], "h12": h[12],
            "bad_houses": trik_bad, "good_houses": trik_good,
            "label": trik_label, "color": trik_color, "desc": trik_desc,
        },
        "lucky_direction": {
            "east":  east, "south": south, "west": west, "north": north,
            "best":  best_dir,
            "label": f"🧭 सबसे शुभ दिशा: {best_dir}",
            "desc":  f"{best_dir} दिशा में महत्वपूर्ण काम करने से सफलता जल्दी मिलती है।",
        },
    }


# ─────────────────────────────────────────────
# MASTER FUNCTION
# ─────────────────────────────────────────────

def compute_moon_transit_override(
    planets: Dict,
    bav_charts: Dict,
    sav: List[int],
) -> Dict:
    """
    Moon 4-8-12 Transit Analysis:
    Dono result dikhao —
    1. Mool niyam: 4, 8, 12 mein Chandra gochaar ashubh hota hai
    2. Override check: Agar Chandra BAV 5+ ho toh ashubh cancel
    User khud final decision kare.
    """
    RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
                "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]

    moon_rashi = planets.get("Mo", {}).get("rashi_index", 0)
    moon_bav   = bav_charts.get("Mo", [0]*12)

    trik_offsets = {4: "4वाँ", 8: "8वाँ", 12: "12वाँ"}
    houses = {}

    for offset, label in trik_offsets.items():
        target_rashi = (moon_rashi + offset - 1) % 12
        bav_pts      = moon_bav[target_rashi] if len(moon_bav) == 12 else 0
        sav_pts      = sav[target_rashi] if len(sav) == 12 else 0
        is_cancelled = bav_pts >= 5

        houses[f"h{offset}"] = {
            "rashi":           target_rashi,
            "rashi_name":      RASHI_HI[target_rashi],
            "house_label":     label,
            "moon_bav":        bav_pts,
            "sav":             sav_pts,
            # ── Mool niyam (hamesha dikhao) ──
            "base_rule":       f"⚠️ {label} भाव में चंद्र गोचर — मूल नियम: अशुभ",
            "base_color":      "#FB7185",
            # ── Override check (alag se dikhao) ──
            "is_cancelled":    is_cancelled,
            "override_label":  (
                f"✅ BAV {bav_pts}≥5 — अष्टकवर्ग बल से अशुभ रद्द, गोचर शुभ होगा"
                if is_cancelled else
                f"❌ BAV {bav_pts}<5 — अष्टकवर्ग बल नहीं, अशुभ प्रभाव सक्रिय"
            ),
            "override_color":  "#22D3EE" if is_cancelled else "#FB923C",
            # ── Final note (user ke liye) ──
            "user_note":       (
                "📌 अंतिम निर्णय आपका: दोनों नियम एक साथ देखें।"
            ),
            "description": (
                f"चंद्र जन्म राशि से {label} भाव ({RASHI_HI[target_rashi]}) में गोचर। "
                f"मूल नियम: अशुभ। "
                f"अष्टकवर्ग: BAV {bav_pts}/8 — "
                + ("बल पर्याप्त (5+), अशुभ रद्द हो सकता है।"
                   if is_cancelled else
                   "बल कम (<5), अशुभ सक्रिय।")
            ),
        }

    cancelled_count = sum(1 for v in houses.values() if v["is_cancelled"])
    return {
        "computed":        True,
        "janma_rashi":     moon_rashi,
        "janma_rashi_name": RASHI_HI[moon_rashi],
        "houses":          houses,
        "cancelled_count": cancelled_count,
        "rule_note":       "📜 नियम: चंद्र BAV ≥5 → अशुभ गोचर रद्द। उपयोगकर्ता अंतिम निर्णय स्वयं लें।",
        "summary": (
            f"✅ {cancelled_count}/3 राशियों में BAV बल से अशुभ रद्द | "
            f"⚠️ {3-cancelled_count}/3 राशियों में सावधानी जरूरी"
        ),
    }


def compute_chandra_surya(
    planets: Dict,
    sav: List[int],
    bav_charts: Dict,
    birth_tithi: int = 15,
    janm_nakshatra: int = 0,
    sankranti_nakshatra: Optional[int] = None,
    sunrise_hour: float = 6.0,
    sunset_hour:  float = 18.0,
) -> Dict:
    """
    Master function — Batch 3.

    Args:
        planets:              { "Su": {"house":1, "rashi_index":0}, ... }
        sav:                  12-element SAV list (house-based)
        bav_charts:           { "Su": [...], "Mo": [...], ... }
        birth_tithi:          1-30 (15=Purnima, 30=Amavasya)
        janm_nakshatra:       0-based index (0=Ashwini)
        sankranti_nakshatra:  0-based index at current Sankranti
        sunrise_hour:         6.0 (float, 24h format)
        sunset_hour:          18.0
    """
    try:
        result = {"computed": True, "engine": "chandra_surya_engine v1.1"}

        # [BUG FIX v1.1] Extract lagna_rashi once and pass to compute_life_sutras
        lagna_rashi = _planet_rashi(planets, "La") if "La" in planets else _planet_rashi(planets, "Su")

        # Chandra sutras
        result["chandra_upachaya"] = compute_chandra_upachaya(planets, bav_charts, sav)
        result["moon_health"]      = compute_moon_health(planets, bav_charts, birth_tithi)
        result["maata_viyog"]      = compute_maata_viyog(planets, bav_charts)
        result["paksha_bal"]         = compute_paksha_bal(birth_tithi)
        result["moon_transit_override"] = compute_moon_transit_override(planets, bav_charts, sav)

        # Surya sutras
        result["lucky_time"]       = compute_lucky_time_of_day(
            planets, bav_charts, sunrise_hour, sunset_hour
        )
        result["lucky_months"]     = compute_lucky_months(planets, bav_charts)
        result["sankranti_result"] = (
            compute_sankranti_result(janm_nakshatra, sankranti_nakshatra)
            if sankranti_nakshatra is not None
            else {"computed": False, "reason": "Sankranti nakshatra not provided"}
        )

        # Personality & life sutras
        result["personality"] = compute_personality_type(sav)
        result["life_sutras"] = compute_life_sutras(sav, lagna_rashi)  # [FIX] pass lagna_rashi

        # Quick summary
        result["summary"] = {
            "moon_strength":    result["moon_health"]["health_level"],
            "personality_type": result["personality"].get("personality", ""),
            "best_time_of_day": result["lucky_time"].get("best_part", {}).get("name", ""),
            "lucky_direction":  result["life_sutras"].get("lucky_direction", {}).get("best", ""),
            "super_rich_yoga":  result["chandra_upachaya"]["is_super_rich"],
            "maata_risk":       result["maata_viyog"]["level"],
        }

        return result

    except Exception as e:
        return {"computed": False, "error": str(e), "engine": "chandra_surya_engine v1.1"}