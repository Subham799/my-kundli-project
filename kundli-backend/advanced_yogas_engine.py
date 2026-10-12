"""
advanced_yogas_engine.py
=========================
Batch 4 — Indu Lagna + Advanced Yogas (FINAL BATCH)
Completes 62/62 sutra coverage.

Features:
  1.  Indu Lagna Calculation  (Su=30,Mo=16,Ma=6,Me=8,Ju=10,Ve=12,Sa=1)
  2.  Crorepati Yoga          (Indu Lagna SAV ≥ 30)
  3.  Spouse Direction        (Venus BAV highest rashi → E/W/N/S)
  4.  D30 Scandal Filter      (D1/D9 exaltation vs D30 debilitation)
  5.  64th Navamsha / Khar    (D1 → D9 + D3 raw evidence)
  6.  D2 Hora Analysis        (raw formula/evidence layer)

Removed from this backend engine:
  Neech/Uchha Bhang, Dhan-Vivah, Sudarshan, Bhavat Bhavam,
  Rashi Cycle, House Comparison, Mega/Summary Rules,
  Partner Compatibility, and V.P. Goel Vivah/Divorce.

Usage:
    from advanced_yogas_engine import compute_advanced_yogas
    result = compute_advanced_yogas(
        planets          = {...},
        sav              = [...],
        bav_charts       = {...},
        lagna_index      = 0,          # 0-based birth lagna rashi
        moon_rashi       = 3,          # 0-based janm rashi
        chandra_lagna_sav = [...],     # SAV from Chandra Lagna (optional)
        surya_lagna_sav  = [...],      # SAV from Surya Lagna (optional)
        partner_moon_bav_total = None, # partner's Moon SAV at moon house (optional)
    )
"""

from typing import Dict, List, Optional, Tuple


# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

RASHI_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन",
]

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल",
    "Me": "बुध",   "Ju": "गुरु",  "Ve": "शुक्र",
    "Sa": "शनि",   "Ra": "राहु",  "Ke": "केतु",
}

# Indu Lagna kala values (fixed)
INDU_KALA = {
    "Su": 30, "Mo": 16, "Ma": 6,
    "Me": 8,  "Ju": 10, "Ve": 12, "Sa": 1,
}

# Dignity constants required by the retained D30/Khar calculations.
# 0-based sign indices.
NEECH_RASHI = {
    "Su": 6, "Mo": 7, "Ma": 3, "Me": 11,
    "Ju": 9, "Ve": 5, "Sa": 0,
}
UCHHA_RASHI = {
    "Su": 0, "Mo": 1, "Ma": 9, "Me": 5,
    "Ju": 3, "Ve": 11, "Sa": 6,
}


# House lordships (simplified Parashari)
RASHI_LORD = {
    0: "Ma", 1: "Ve", 2: "Me", 3: "Mo",
    4: "Su", 5: "Me", 6: "Ve", 7: "Ma",
    8: "Ju", 9: "Sa", 10: "Sa", 11: "Ju",
}

# Direction mapping for rashis
RASHI_DIRECTION = {
    0: "पूर्व", 1: "दक्षिण", 2: "पश्चिम", 3: "उत्तर",
    4: "पूर्व", 5: "दक्षिण", 6: "पश्चिम", 7: "उत्तर",
    8: "पूर्व", 9: "दक्षिण", 10: "पश्चिम", 11: "उत्तर",
}

DIRECTION_EMOJI = {"पूर्व": "→", "दक्षिण": "↓", "पश्चिम": "←", "उत्तर": "↑"}


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _bav(bav_charts: Dict, planet: str, rashi: int) -> int:
    chart = bav_charts.get(planet, [])
    return int(chart[rashi]) if chart and 0 <= rashi < 12 else 0

def _sav(sav: List[int], idx: int) -> int:
    return sav[idx] if sav and 0 <= idx < 12 else 0

def _planet_rashi(planets: Dict, code: str) -> int:
    """Return canonical 0-based D1 rashi index.

    Bridge input uses ``rashi_index`` as 0-based. Legacy ``rashi_num``,
    when used without ``rashi_index``, is treated as 1-based.
    """
    p = planets.get(code, {}) or {}
    if "rashi_index" in p:
        try:
            return max(0, min(11, int(p.get("rashi_index"))))
        except (TypeError, ValueError):
            return 0
    raw = p.get("rashi_num", 1)
    try:
        return max(0, min(11, int(raw) - 1))
    except (TypeError, ValueError):
        return 0


def _9th_from(rashi: int) -> int:
    """9th rashi from given rashi (0-based)."""
    return (rashi + 8) % 12


# ─────────────────────────────────────────────
# 1. INDU LAGNA + CROREPATI YOGA
# ─────────────────────────────────────────────

def compute_indu_lagna(
    planets: Dict,
    sav: List[int],
    lagna_index: int,
    moon_rashi: int,
) -> Dict:
    """
    Indu Lagna — special wealth lagna.

    Steps:
      1. Find 9th house lord from Lagna → note its Kala.
      2. Find 9th house lord from Moon → note its Kala.
      3. Sum both Kalas.
      4. Divide by 12 → take remainder (0 remainder = 12).
      5. Count that many rashis from Moon's rashi.
      6. That rashi = Indu Lagna.
      7. Check SAV at Indu Lagna house → ≥30 = Crorepati yoga.
    """
    ninth_from_lagna = _9th_from(lagna_index)
    lagna_9th_lord   = RASHI_LORD.get(ninth_from_lagna, "Ju")
    kala_lagna       = INDU_KALA.get(lagna_9th_lord, 10)

    ninth_from_moon  = _9th_from(moon_rashi)
    moon_9th_lord    = RASHI_LORD.get(ninth_from_moon, "Ju")
    kala_moon        = INDU_KALA.get(moon_9th_lord, 10)

    total_kala = kala_lagna + kala_moon
    remainder  = total_kala % 12
    if remainder == 0:
        remainder = 12

    indu_rashi = (moon_rashi + remainder - 1) % 12
    
    # 🚀 FIX: Rashi Index को House Index में बदलें (Lagna Offset लगाकर)
    indu_house_idx = (indu_rashi - lagna_index) % 12
    indu_sav   = _sav(sav, indu_house_idx)

    if indu_sav >= 35:
        wealth_level = "ultra_rich"
        wealth_label = "💎 Ultra Rich — करोड़पति से भी आगे"
        wealth_color = "#22D3EE"
        wealth_desc  = (f"इन्दु लग्न ({RASHI_NAMES_HI[indu_rashi]}) में SAV {indu_sav} ≥ 35 — "
                        "अपार धन-संपत्ति और विरासत का योग है।")
    elif indu_sav >= 30:
        wealth_level = "crorepati"
        wealth_label = "🌟 करोड़पति योग"
        wealth_color = "#22D3EE"
        wealth_desc  = (f"इन्दु लग्न ({RASHI_NAMES_HI[indu_rashi]}) में SAV {indu_sav} ≥ 30 — "
                        "जीवन में अपार धन-संपत्ति अर्जित करने का योग।")
    elif indu_sav >= 25:
        wealth_level = "wealthy"
        wealth_label = "💰 धनवान योग"
        wealth_color = "#4ADE80"
        wealth_desc  = f"SAV {indu_sav} — अच्छी आर्थिक स्थिति, सुखी जीवन।"
    else:
        wealth_level = "moderate"
        wealth_label = "⚖️ सामान्य धन-योग"
        wealth_color = "#F59E0B"
        wealth_desc  = f"SAV {indu_sav} < 25 — आर्थिक संघर्ष की संभावना।"

    return {
        "computed":            True,
        "lagna_rashi":         lagna_index,
        "moon_rashi":          moon_rashi,
        "ninth_from_lagna":    ninth_from_lagna,
        "lagna_9th_lord":      lagna_9th_lord,
        "lagna_9th_lord_name": PLANET_NAMES_HI.get(lagna_9th_lord, lagna_9th_lord),
        "kala_lagna":          kala_lagna,
        "ninth_from_moon":     ninth_from_moon,
        "moon_9th_lord":       moon_9th_lord,
        "moon_9th_lord_name":  PLANET_NAMES_HI.get(moon_9th_lord, moon_9th_lord),
        "kala_moon":           kala_moon,
        "total_kala":          total_kala,
        "remainder":           remainder,
        "indu_lagna_rashi":    indu_rashi,
        "indu_lagna_name":     RASHI_NAMES_HI[indu_rashi],
        "indu_sav":            indu_sav,
        "wealth_level":        wealth_level,
        "wealth_label":        wealth_label,
        "wealth_color":        wealth_color,
        "wealth_description":  wealth_desc,
        "formula": (
            f"लग्न 9वें ({RASHI_NAMES_HI[ninth_from_lagna]}) स्वामी {PLANET_NAMES_HI.get(lagna_9th_lord,'')} "
            f"= {kala_lagna} | "
            f"चंद्र 9वें ({RASHI_NAMES_HI[ninth_from_moon]}) स्वामी {PLANET_NAMES_HI.get(moon_9th_lord,'')} "
            f"= {kala_moon} | "
            f"योग {total_kala} ÷ 12 → शेष {remainder} | "
            f"चंद्र से {remainder} आगे = {RASHI_NAMES_HI[indu_rashi]}"
        ),
        "kala_reference": INDU_KALA,
    }


# ─────────────────────────────────────────────
# 2. SPOUSE DIRECTION
# ─────────────────────────────────────────────

def compute_spouse_direction(bav_charts: Dict) -> Dict:
    """
    Venus BAV mein highest rashi → spouse's home is in that direction.
    Fire  (0,4,8)  → East   | Earth (1,5,9)  → South
    Air   (2,6,10) → West   | Water (3,7,11) → North
    """
    venus_bav = bav_charts.get("Ve", [])
    if not venus_bav or len(venus_bav) < 12:
        return {"computed": False}

    rashi_pts = [(i, venus_bav[i]) for i in range(12)]
    sorted_r  = sorted(rashi_pts, key=lambda x: x[1], reverse=True)
    best_rashi_idx, best_pts = sorted_r[0]

    direction = RASHI_DIRECTION.get(best_rashi_idx, "पूर्व")
    emoji     = DIRECTION_EMOJI.get(direction, "→")

    dir_sums = {"पूर्व": 0, "दक्षिण": 0, "पश्चिम": 0, "उत्तर": 0}
    for i, pts in enumerate(venus_bav):
        d = RASHI_DIRECTION.get(i, "पूर्व")
        dir_sums[d] += pts

    return {
        "computed":         True,
        "best_rashi":       best_rashi_idx,
        "best_rashi_name":  RASHI_NAMES_HI[best_rashi_idx],
        "best_points":      best_pts,
        "spouse_direction": direction,
        "direction_emoji":  emoji,
        "label":   f"{emoji} जीवनसाथी का घर: {direction} दिशा में",
        "color":   "#22D3EE",
        "desc":    (f"शुक्र के अष्टकवर्ग में {RASHI_NAMES_HI[best_rashi_idx]} राशि में सबसे अधिक "
                    f"{best_pts} बिंदु — जीवनसाथी का परिवार अक्सर {direction} दिशा में होता है।"),
        "direction_scores": dir_sums,
        "all_rashis": [
            {"rashi": RASHI_NAMES_HI[i], "pts": venus_bav[i],
             "dir": RASHI_DIRECTION.get(i, ""), "is_best": i == best_rashi_idx}
            for i in range(12)
        ],
    }


# ─────────────────────────────────────────────
# MASTER FUNCTION
# ─────────────────────────────────────────────

def compute_d30_scandal(planets: Dict, bav_charts: Dict) -> List[Dict]:
    """
    D30 (Trishansha) Scandal Filter:
    Planet jo D1/D9 mein uchha hai lekin D30 mein neech sign mein hai
    = Uchhai ke baad bhadnami (scandal).

    D30 formula: 
    Odd sign: Mars(0-5), Saturn(5-10), Jupiter(10-18), Mercury(18-25), Venus(25-30)
    Even sign: Venus(0-5), Mercury(5-10), Jupiter(10-18), Saturn(18-25), Mars(25-30)
    Returns list of planets with scandal risk.
    """
    D30_ODD  = [(5,"Ma"),(10,"Sa"),(18,"Ju"),(25,"Me"),(30,"Ve")]
    D30_EVEN = [(5,"Ve"),(10,"Me"),(18,"Ju"),(25,"Sa"),(30,"Ma")]

    PAAP = {"Ma","Sa","Ra","Ke","Su"}
    results = []

    for code in ["Su","Mo","Ma","Me","Ju","Ve","Sa"]:
        p       = planets.get(code, {})
        rashi   = _planet_rashi(planets, code)
        degree  = float(p.get("degree", 0))  # degree within sign (0-30)

        # D30 lord nikalo
        table = D30_ODD if rashi % 2 == 0 else D30_EVEN
        d30_lord = table[-1][1]
        for limit, lord in table:
            if degree < limit:
                d30_lord = lord
                break

        is_paap_d30  = d30_lord in PAAP
        is_shubh_d30 = d30_lord not in PAAP  # Ju, Ve, Me = shubh

        # D1 dignity
        is_uchha_d1 = (rashi == UCHHA_RASHI.get(code, -1))
        is_neech_d1 = (rashi == NEECH_RASHI.get(code, -1))
        bav_pts     = _bav(bav_charts, code, rashi)

        # Case 1: D1 Uchha + D30 Paap = uchhai ke baad scandal
        if is_uchha_d1 and is_paap_d30:
            results.append({
                "planet":      code,
                "planet_name": PLANET_NAMES_HI.get(code, code),
                "rashi_name":  RASHI_NAMES_HI[rashi],
                "d30_lord":    d30_lord,
                "d30_lord_hi": PLANET_NAMES_HI.get(d30_lord, d30_lord),
                "bav_points":  bav_pts,
                "case":        "uchha_d1_paap_d30",
                "risk_level":  "high" if bav_pts >= 5 else "medium",
                "label":       "⚠️ D30 कलंक योग — सफलता के बाद बदनामी",
                "color":       "#FB923C",
                "base_result": f"D1: उच्च ({RASHI_NAMES_HI[rashi]}) — शुभ फल",
                "override":    f"D30: {PLANET_NAMES_HI.get(d30_lord,'')} (पाप) — विवाद/बदनामी का संकेत",
                "user_note":   "📌 अंतिम निर्णय आपका: D1 उच्च का फल भी मिलेगा और D30 कलंक भी संभव।",
                "description": (
                    f"{PLANET_NAMES_HI.get(code,'')} D1 में उच्च ({RASHI_NAMES_HI[rashi]}) — "
                    f"शुभ फल देगा। लेकिन D30 में {PLANET_NAMES_HI.get(d30_lord,'')} (पाप) का "
                    "अधिकार — ऊंचाइयों पर ले जाएगा, किसी बड़े विवाद/बदनामी का खतरा भी।"
                ),
            })

        # Case 2: D1 Neech + D30 Shubh = neech hone par bhi scandal nahi
        elif is_neech_d1 and is_shubh_d30:
            results.append({
                "planet":      code,
                "planet_name": PLANET_NAMES_HI.get(code, code),
                "rashi_name":  RASHI_NAMES_HI[rashi],
                "d30_lord":    d30_lord,
                "d30_lord_hi": PLANET_NAMES_HI.get(d30_lord, d30_lord),
                "bav_points":  bav_pts,
                "case":        "neech_d1_shubh_d30",
                "risk_level":  "low",
                "label":       "✅ D30 रक्षा — नीच होने पर भी बदनामी नहीं",
                "color":       "#22D3EE",
                "base_result": f"D1: नीच ({RASHI_NAMES_HI[rashi]}) — संघर्ष",
                "override":    f"D30: {PLANET_NAMES_HI.get(d30_lord,'')} (शुभ) — बदनामी से रक्षा",
                "user_note":   "📌 अंतिम निर्णय आपका: D1 नीच का संघर्ष रहेगा, पर D30 बदनामी से बचाएगा।",
                "description": (
                    f"{PLANET_NAMES_HI.get(code,'')} D1 में नीच ({RASHI_NAMES_HI[rashi]}) — "
                    f"संघर्ष देगा। लेकिन D30 में {PLANET_NAMES_HI.get(d30_lord,'')} (शुभ) — "
                    "बदनामी या कलंक से रक्षा होगी।"
                ),
            })

    return results


# ─────────────────────────────────────────────
# 14. RAW MARRIAGE OBSERVATIONS — D1 + D9
# ─────────────────────────────────────────────

# Classical Parashari graha-drishti used here only to expose raw aspecting
# planets. This section intentionally does NOT convert observations into a
# marriage/divorce prediction.
BENEFIC_PLANETS = {"Ju", "Ve", "Me", "Mo"}
MALEFIC_PLANETS = {"Su", "Ma", "Sa", "Ra", "Ke"}
OBSERVATION_PLANETS = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]


def _get_varga_idx(planet_data: dict, varga: str = "D9"):
    """Return normalized 0-based rashi index from either supported Vargas shape.

    Supported input:
        Vargas[D9] = {"Idx": 5}
    and legacy/alternate input:
        Vargas[D9] = 5
    """
    if not isinstance(planet_data, dict):
        return None

    vargas = planet_data.get("Vargas", {})
    if not isinstance(vargas, dict):
        return None

    raw = vargas.get(varga)

    if isinstance(raw, dict):
        idx = raw.get("Idx")
        if isinstance(idx, (int, float)):
            return int(idx) % 12
        return None

    if isinstance(raw, (int, float)):
        return int(raw) % 12

    return None


def _planet_name(code: str) -> str:
    return PLANET_NAMES_HI.get(code, code)


# Hora: विषम राशियों में 0–15° सूर्य, 15–30° चंद्र; सम राशियों में क्रम उल्टा।
ODD_RASHIS = {0, 2, 4, 6, 8, 10}  # 1,3,5,7,9,11 क्रमांक

def _d1_hora_for_planet(planets: dict, planet_code: str) -> dict:
    """Return raw D1 Hora evidence for a planet; no prediction."""
    pdata = planets.get(planet_code, {}) or {}
    idx = _get_varga_idx(pdata, "D1")
    if idx is None:
        idx = pdata.get("rashi_index")
        try:
            idx = int(idx) % 12 if idx is not None else None
        except (TypeError, ValueError):
            idx = None

    full_degree = pdata.get("full_degree", pdata.get("Degree", 0))
    try:
        sign_degree = float(full_degree) % 30.0
    except (TypeError, ValueError):
        return {"available": False}

    if idx is None:
        return {"available": False, "degree": round(sign_degree, 4)}

    first_half_sun = idx in ODD_RASHIS
    if sign_degree < 15.0:
        hora_lord = "Su" if first_half_sun else "Mo"
        hora_no = 1
        range_label = "0°–15°"
    else:
        hora_lord = "Mo" if first_half_sun else "Su"
        hora_no = 2
        range_label = "15°–30°"

    return {
        "available": True,
        "rashi_index": idx,
        "rashi_name": RASHI_NAMES_HI[idx],
        "degree": round(sign_degree, 4),
        "hora_no": hora_no,
        "range": range_label,
        "hora_lord_code": hora_lord,
        "hora_lord": _planet_name(hora_lord),
        "is_sun_hora": hora_lord == "Su",
        "is_moon_hora": hora_lord == "Mo",
    }


# Parashar / Cancer-Leo (Uma Shambhu) Hora — D2 source of truth
# Khar Lord ki Hora D1 degree se dobara calculate nahi ki ja rahi.
# API/bridge mein preserved Vargas[D2] se Cancer (Chandra Hora) / Leo (Surya Hora) liya jayega.
PARASHAR_HORA_SIGNS = {
    3: ("Mo", "चंद्र"),  # Cancer
    4: ("Su", "सूर्य"),  # Leo
}

def _d2_hora_for_planet(planets: dict, planet_code: str) -> dict:
    """
    Khar Lord ki Parashar Hora ko API-preserved D2 placement se read karo.

    D2 hi source of truth hai; D1 degree se Hora recalculate nahi hoti.
    Parashar/Uma-Shambhu Hora mein D2 ke Cancer ko Chandra Hora aur
    Leo ko Surya Hora maana jata hai.
    """
    pdata = planets.get(planet_code, {}) or {}
    vargas = pdata.get("Vargas") or {}
    d2 = vargas.get("D2") if isinstance(vargas, dict) else None

    if isinstance(d2, dict):
        d2_idx = d2.get("Idx")
        if d2_idx is None:
            d2_idx = d2.get("rashi_index", d2.get("RashiIdx"))
    elif isinstance(d2, (int, float)):
        d2_idx = int(d2)
    else:
        d2_idx = None

    try:
        d2_idx = int(d2_idx) % 12 if d2_idx is not None else None
    except (TypeError, ValueError):
        d2_idx = None

    base = {
        "available": False,
        "planet_code": planet_code,
        "planet_name": _planet_name(planet_code),
        "method": "Parashar / Cancer-Leo D2",
    }

    if d2_idx is None:
        base["reason"] = "Vargas[D2].Idx unavailable"
        return base

    base.update({
        "d2_rashi_index": d2_idx,
        "d2_rashi_name": RASHI_NAMES_HI[d2_idx],
    })

    hora = PARASHAR_HORA_SIGNS.get(d2_idx)
    if hora is None:
        base["reason"] = "Parashar D2 में Cancer/Leo placement नहीं मिला"
        return base

    hora_code, hora_name = hora
    base.update({
        "available": True,
        "hora_lord_code": hora_code,
        "hora_lord": hora_name,
        "hora_sign": RASHI_NAMES_HI[d2_idx],
        "is_sun_hora": hora_code == "Su",
        "is_moon_hora": hora_code == "Mo",
    })
    return base


def _vedic_aspects_from_house(house: int, planet_code: str) -> list:
    """Return 1-based houses receiving this planet's classical aspects."""
    try:
        house = int(house)
    except (TypeError, ValueError):
        return []

    if house < 1 or house > 12:
        return []

    offsets = [7]  # all grahas: 7th aspect
    if planet_code == "Ma":
        offsets += [4, 8]
    elif planet_code == "Ju":
        offsets += [5, 9]
    elif planet_code == "Sa":
        offsets += [3, 10]

    return [((house - 1 + offset - 1) % 12) + 1 for offset in offsets]


def _get_house_aspects_from_chart(chart_planets: dict, target_house: int) -> dict:
    """Find actual benefic/malefic planets aspecting a target house."""
    benefic = []
    malefic = []

    for code in OBSERVATION_PLANETS:
        pdata = chart_planets.get(code, {}) or {}
        house = pdata.get("house")
        if not house:
            continue

        if target_house not in _vedic_aspects_from_house(house, code):
            continue

        if code in BENEFIC_PLANETS:
            benefic.append(code)
        if code in MALEFIC_PLANETS:
            malefic.append(code)

    return {
        "benefic": benefic,
        "malefic": malefic,
    }


def _get_planet_aspects_from_chart(chart_planets: dict, target_code: str) -> dict:
    """Find planets aspecting the house occupied by target planet."""
    target = chart_planets.get(target_code, {}) or {}
    target_house = target.get("house")
    if not target_house:
        return {"benefic": [], "malefic": []}
    return _get_house_aspects_from_chart(chart_planets, target_house)


def _chart_house_map_from_varga(planets: dict, varga: str, lagna_idx: int) -> dict:
    """Build {1..12: [planet codes]} from a varga's rashi positions."""
    houses = {i: [] for i in range(1, 13)}
    if lagna_idx is None:
        return houses

    for code in OBSERVATION_PLANETS:
        idx = _get_varga_idx(planets.get(code, {}), varga)
        if idx is None:
            continue
        house = ((idx - lagna_idx + 12) % 12) + 1
        houses[house].append(code)

    return houses


def _chart_planets_from_varga(planets: dict, varga: str, lagna_idx: int) -> dict:
    """Create a normalized planet map with house/rashi for a D1/D9 chart."""
    chart = {}
    if lagna_idx is None:
        return chart

    for code in OBSERVATION_PLANETS:
        source = planets.get(code, {}) or {}
        idx = _get_varga_idx(source, varga)
        if idx is None:
            continue

        house = ((idx - lagna_idx + 12) % 12) + 1
        chart[code] = {
            "house": house,
            "rashi_index": idx,
            "rashi_name": RASHI_NAMES_HI[idx],
            "degree": source.get("degree", 0),
            "full_degree": source.get("full_degree", source.get("Degree", 0)),
            "dignity": source.get("dignity", source.get("Dignity", "")),
            "retrograde": bool(
                source.get("retrograde", False)
                or source.get("Retrograde", False)
                or source.get("Retro", False)
            ),
        }

    return chart


# ─────────────────────────────────────────────
# 15. KHAR / 64TH NAVAMSHA — D1 → D9 + D3 RAW ENGINE
# ─────────────────────────────────────────────

DUAL_SIGN_RASHIS = {2, 5, 8, 11}  # मिथुन, कन्या, धनु, मीन


def _navamsha_no_from_d1_degree(full_degree) -> Optional[int]:
    """D1 longitude से sign के भीतर 1..9 नवांश क्रम निकालें."""
    try:
        deg = float(full_degree) % 30.0
    except (TypeError, ValueError):
        return None
    # 30/9 = 3°20'
    no = int(deg / (30.0 / 9.0)) + 1
    return max(1, min(9, no))


def _relative_house_from_sign(target_sign: int, reference_sign: int) -> int:
    """Reference sign से target sign तक 1-based house count."""
    return ((target_sign - reference_sign) % 12) + 1


def _khar_target_from_varga(planets: dict, code: str, varga: str, count_from: int):
    """किसी ग्रह की D9/D3 राशि से count_from house का target sign/lord."""
    idx = _get_varga_idx(planets.get(code, {}), varga)
    if idx is None:
        return {
            "available": False,
            "reason": f"{varga} position unavailable",
        }

    target_idx = (idx + count_from - 1) % 12
    lord_code = RASHI_LORD.get(target_idx)

    return {
        "available": True,
        "base_rashi_index": idx,
        "base_rashi_name": RASHI_NAMES_HI[idx],
        "target_house_from_planet": count_from,
        "target_rashi_index": target_idx,
        "target_rashi_name": RASHI_NAMES_HI[target_idx],
        "lord_code": lord_code,
        "lord_name": _planet_name(lord_code) if lord_code else "",
    }


def compute_khar_64th_navamsa(planets: dict, lagna_index: int = 0) -> dict:
    """
    Raw Khar / 64th-Navamsha + 22nd Drekkana + Vish Navamsha evidence.

    Existing Khar / Double-Khar flow is preserved:
      1. D1 dual-sign planets + degree.
      2. D1 Navamsha 1/5/9 eligibility.
      3. For eligible Khar candidates, D9 4th (64th Navamsha) and D3 8th
         (22nd Drekkana), comparing only target-sign lords for Double Khar.

    Additional evidence (does NOT alter Double-Khar calculation):
      4. Every observed planet is independently checked for Vish Navamsha
         according to its D1 sign-specific Vish Navamsha.
      5. Vish planet -> D1 house placement -> D1 lordship -> natural
         karakatwa -> Sarp/Giddh/Suar category -> D2 Hora evidence.
      6. D9 4th and D3 8th target/lord evidence is also retained for every
         planet, even when the planet is not a Double-Khar candidate.

    No final prediction/decision is produced.
    """
    try:
        dual_planets = []
        all_planets = OBSERVATION_PLANETS
        eligible_nav = {1, 5, 9}

        # Source-framework: Vish Navamsha depends on the D1 sign.
        # 1st = Sarp, 5th = Giddh, 9th = Suar.
        vish_nav_by_rashi = {
            0: (1, "सर्प"), 1: (1, "सर्प"), 5: (1, "सर्प"), 8: (1, "सर्प"),
            2: (5, "गिद्ध"), 4: (5, "गिद्ध"), 6: (5, "गिद्ध"), 10: (5, "गिद्ध"),
            3: (9, "सूअर"), 7: (9, "सूअर"), 9: (9, "सूअर"), 11: (9, "सूअर"),
        }
        natural_karakatwa = {
            "Su": "पिता / authority",
            "Mo": "मन / माता",
            "Ma": "भाई-बहन / साहस / ऊर्जा",
            "Me": "बुद्धि / वाणी / संवाद / मामा",
            "Ju": "ज्ञान / गुरु / बड़े",
            "Ve": "प्रेम / संबंध / विवाह / सुख-सुविधा",
            "Sa": "श्रम / देरी / संघर्ष",
            "Ra": "भौतिक लालसा / असामान्य अनुभव",
            "Ke": "वैराग्य / पृथक्करण / सूक्ष्म कर्म",
        }

        def d1_lordship_for_planet(code: str):
            houses = []
            for house in range(1, 13):
                sign_idx = (lagna_index + house - 1) % 12
                if RASHI_LORD.get(sign_idx) == code:
                    houses.append(house)
            return houses

        def build_vish_item(code, pdata, full_degree, d1_idx, sign_degree, nav_no):
            vish_nav_no, vish_type = vish_nav_by_rashi.get(d1_idx, (None, None))
            is_vish = nav_no == vish_nav_no
            d1_house = pdata.get("house", pdata.get("House"))
            try:
                d1_house = int(d1_house) if d1_house is not None else None
            except (TypeError, ValueError):
                d1_house = None
            if d1_house is None and lagna_index is not None:
                d1_house = ((d1_idx - int(lagna_index)) % 12) + 1

            hora = _d2_hora_for_planet(planets, code) if is_vish else {"available": False}
            return {
                "planet_code": code,
                "planet_name": _planet_name(code),
                "d1_rashi_index": d1_idx,
                "d1_rashi_name": RASHI_NAMES_HI[d1_idx],
                "d1_sign_degree": round(sign_degree, 4),
                "d1_full_degree": round(full_degree, 4),
                "navamsha_no": nav_no,
                "vish_navamsha_no": vish_nav_no,
                "vish_navamsha": is_vish,
                "vish_category": vish_type if is_vish else "",
                "d1_house": d1_house,
                "d1_house_name": f"{d1_house}वां भाव" if d1_house else "",
                "d1_lordship_houses": d1_lordship_for_planet(code),
                "natural_karakatwa": natural_karakatwa.get(code, ""),
                "vish_hora": hora,
            }

        # ── Independent Vish + D9/D3 evidence for every planet ──────────────
        all_planet_checks = []
        vish_planets = []
        for code in all_planets:
            pdata = planets.get(code, {}) or {}
            # IMPORTANT: upstream charts may expose `Degree` as the degree
            # WITHIN the sign (e.g. Moon = 14.1289 in Aquarius), while the
            # absolute longitude may live in `full_degree`.  Therefore the D1
            # sign must come from rashi_index / D1 Vargas first.  Never infer
            # Aquarius from 14.1289° as if it were 14.1289° Aries.
            raw_rashi = pdata.get("rashi_index", pdata.get("RashiIdx", pdata.get("rashi_num")))
            raw_d1 = _get_varga_idx(pdata, "D1")
            try:
                d1_idx = int(raw_rashi) % 12 if raw_rashi is not None else None
            except (TypeError, ValueError):
                d1_idx = None
            if d1_idx is None and raw_d1 is not None:
                d1_idx = int(raw_d1) % 12

            raw_degree = pdata.get("full_degree", pdata.get("Degree", pdata.get("degree", 0)))
            try:
                numeric_degree = float(raw_degree)
            except (TypeError, ValueError):
                continue

            # For navamsha, only the degree inside the D1 sign matters.
            # If the supplied value is already 0..30, retain it; otherwise
            # normalize an absolute longitude with modulo 30.
            sign_degree = numeric_degree if 0.0 <= numeric_degree < 30.0 else numeric_degree % 30.0
            full_degree = numeric_degree
            if d1_idx is None:
                # Last-resort sign inference from absolute longitude only.
                d1_idx = int(numeric_degree / 30.0) % 12

            nav_no = _navamsha_no_from_d1_degree(full_degree)
            vish_item = build_vish_item(code, pdata, full_degree, d1_idx, sign_degree, nav_no)

            # 64th Navamsha = 4th from the planet's D9 sign.
            # 22nd Drekkana = 8th from the planet's D3 sign.
            d9_idx = _get_varga_idx(pdata, "D9")
            d3_idx = _get_varga_idx(pdata, "D3")
            d9_target = _khar_target_from_varga(planets, code, "D9", 4)
            d3_target = _khar_target_from_varga(planets, code, "D3", 8)
            d9_lord = d9_target.get("lord_code") if d9_target.get("available") else None
            d3_lord = d3_target.get("lord_code") if d3_target.get("available") else None

            vish_item.update({
                "d9_rashi_index": d9_idx,
                "d9_rashi_name": RASHI_NAMES_HI[d9_idx] if d9_idx is not None else "",
                "d3_rashi_index": d3_idx,
                "d3_rashi_name": RASHI_NAMES_HI[d3_idx] if d3_idx is not None else "",
                "d9_fourth": d9_target,
                "d3_eighth": d3_target,
                "d9_64th_navamsha": d9_target,
                "d3_22nd_drekkana": d3_target,
                "d9_khar_lord_code": d9_lord,
                "d9_khar_lord": _planet_name(d9_lord) if d9_lord else "",
                "d3_khar_lord_code": d3_lord,
                "d3_khar_lord": _planet_name(d3_lord) if d3_lord else "",
                "d9_khar_lord_hora": _d2_hora_for_planet(planets, d9_lord) if d9_lord else {"available": False},
                "d3_khar_lord_hora": _d2_hora_for_planet(planets, d3_lord) if d3_lord else {"available": False},
                "double_khar": bool(d9_lord and d3_lord and d9_lord == d3_lord),
                "double_khar_from_planet": _planet_name(code) if (d9_lord and d3_lord and d9_lord == d3_lord) else "",
                "double_khar_planet_code": d9_lord if (d9_lord and d3_lord and d9_lord == d3_lord) else None,
                "double_khar_hora": _d2_hora_for_planet(planets, d9_lord) if (d9_lord and d3_lord and d9_lord == d3_lord) else {"available": False},
            })
            all_planet_checks.append(vish_item)
            if vish_item["vish_navamsha"]:
                vish_planets.append(vish_item)

            # Keep the original dual-sign Khar list unchanged in meaning.
            if d1_idx not in DUAL_SIGN_RASHIS:
                continue
            item = {
                "planet_code": code,
                "planet_name": _planet_name(code),
                "d1_rashi_index": d1_idx,
                "d1_rashi_name": RASHI_NAMES_HI[d1_idx],
                "d1_sign_degree": round(sign_degree, 4),
                "d1_full_degree": round(full_degree, 4),
                "dual_sign": True,
                "navamsha_no": nav_no,
                "navamsha_qualifies": nav_no in eligible_nav,
                "eligible": nav_no in eligible_nav,
            }

            # Existing Khar candidate data is preserved; no new eligibility rule.
            if nav_no in eligible_nav:
                double_khar = bool(d9_lord and d3_lord and d9_lord == d3_lord)
                item.update({
                    "d9_rashi_index": d9_idx,
                    "d9_rashi_name": RASHI_NAMES_HI[d9_idx] if d9_idx is not None else "",
                    "d3_rashi_index": d3_idx,
                    "d3_rashi_name": RASHI_NAMES_HI[d3_idx] if d3_idx is not None else "",
                    "d9_fourth": d9_target,
                    "d3_eighth": d3_target,
                    "d9_64th_navamsha": d9_target,
                    "d3_22nd_drekkana": d3_target,
                    "d9_khar_lord_code": d9_lord,
                    "d9_khar_lord": _planet_name(d9_lord) if d9_lord else "",
                    "d3_khar_lord_code": d3_lord,
                    "d3_khar_lord": _planet_name(d3_lord) if d3_lord else "",
                    "d9_khar_lord_hora": _d2_hora_for_planet(planets, d9_lord) if d9_lord else {"available": False},
                    "d3_khar_lord_hora": _d2_hora_for_planet(planets, d3_lord) if d3_lord else {"available": False},
                    "double_khar": double_khar,
                    "double_khar_from_planet": _planet_name(code),
                    "double_khar_planet_code": d9_lord if double_khar else None,
                    "double_khar_hora": _d2_hora_for_planet(planets, d9_lord) if double_khar else {"available": False},
                })
            dual_planets.append(item)

        qualifying = [x for x in dual_planets if x.get("eligible")]
        return {
            "computed": True,
            "mode": "raw_observations_only",
            "rule": {
                "eligible_rashis": [RASHI_NAMES_HI[i] for i in sorted(DUAL_SIGN_RASHIS)],
                "eligible_navamsas": [1, 5, 9],
                "d9_count_from_planet": 4,
                "d3_count_from_planet": 8,
                "d9_label": "64वाँ नवांश",
                "d3_label": "22वाँ द्रेष्काण",
                "lord_only": True,
                "vish_rule": "मेष/वृषभ/कन्या/धनु = 1st; मिथुन/सिंह/तुला/कुंभ = 5th; कर्क/वृश्चिक/मकर/मीन = 9th",
                "vish_categories": {"1": "सर्प", "5": "गिद्ध", "9": "सूअर"},
                "vish_house_source": "D1",
                "vish_d9_role": "supporting evidence only",
            },
            "dual_sign_planets": dual_planets,
            "candidates": qualifying,
            "double_khar_planets": [x["planet_name"] for x in qualifying if x.get("double_khar")],
            "has_double_khar": any(x.get("double_khar") for x in qualifying),
            "all_planet_checks": all_planet_checks,
            "vish_navamsha_planets": vish_planets,
            "has_vish_navamsha": bool(vish_planets),
            "note": "मूल Khar/Double-Khar eligibility को बदले बिना, सभी ग्रहों के D9 4थे (64वाँ नवांश) और D3 8वें (22वाँ द्रेष्काण) evidence तथा D1-आधारित Vish Navamsha check अलग से रखा गया है।",
        }
    except Exception as e:
        return {
            "computed": False,
            "error": str(e),
            "mode": "raw_observations_only",
        }


# ─────────────────────────────────────────────
# HORA ANALYSIS — FORMULA 1/2/3/4 + D2 HOUSE REFERENCE
# Raw evidence only: no final prediction/decision.
# Formula 1 = Parashari D2 (Sun/Moon Hora)
# Formula 2 = Hora strength by 5-degree segment
# Formula 3 = Labh Mandook / Kerala 12-sign D2 mapping
# Formula 4 = Mansagari-style nature/speech flags supplied by user
# ─────────────────────────────────────────────

HORA_BENEFICS = {"Ju", "Ve", "Me", "Mo"}
HORA_MALEFICS = {"Su", "Ma", "Sa", "Ra", "Ke"}
HORA_CRUEL = {"Su", "Ma", "Sa", "Ra", "Ke"}

# User-supplied Kerala / Labh Mandook mapping.
# Values are 1-based rashi numbers in the source rule.
KERALA_SUN_CONTRIBUTED = {
    "Su": 5, "Me": 6, "Ve": 7, "Ma": 8, "Ju": 9, "Sa": 10,
}
KERALA_MOON_CONTRIBUTED = {
    "Mo": 4, "Me": 3, "Ve": 2, "Ma": 1, "Ju": 12, "Sa": 11,
}

D2_HOUSE_REFERENCE = [
    {"house": 1, "topic": "धन कमाने की सामान्य ताकत, स्वभाव और धन के प्रति सोच"},
    {"house": 2, "topic": "धन संचय, बैंक बैलेंस और उपलब्ध संसाधन"},
    {"house": 3, "topic": "पैसा कमाने की मेहनत और छोटे भाई-बहनों से आर्थिक संबंध"},
    {"house": 4, "topic": "पैसे से मिलने वाली खुशी/संतोष और धन का उपयोग"},
    {"house": 5, "topic": "धन कमाने के तरीके, जीवनसाथी का धन और बच्चों से आर्थिक संबंध"},
    {"house": 6, "topic": "धन कमाने की रुकावटें और आर्थिक संघर्ष"},
    {"house": 7, "topic": "दूसरों के माध्यम से धन और दूसरों के पास रखा धन"},
    {"house": 8, "topic": "विरासत, अचानक प्राप्त धन और धन में अचानक उतार-चढ़ाव"},
    {"house": 9, "topic": "धन की सुरक्षा, भाग्य और धन संबंधी यात्राएं"},
    {"house": 10, "topic": "काम/करियर और वैध तरीके से धन कमाना"},
    {"house": 11, "topic": "आसान आर्थिक लाभ और संपत्ति प्राप्ति की इच्छाएं"},
    {"house": 12, "topic": "धन हानि और हर प्रकार का खर्च"},
]


def _hora_degree_from_planet(pdata: dict):
    """Return sign-local D1 degree and D1 rashi index robustly."""
    idx = _get_varga_idx(pdata, "D1")
    if idx is None:
        idx = pdata.get("rashi_index", pdata.get("rashi_num"))
        try:
            idx = int(idx)
            # rashi_num is commonly 1..12; rashi_index is commonly 0..11.
            if pdata.get("rashi_index") is None and 1 <= idx <= 12:
                idx -= 1
            idx %= 12
        except (TypeError, ValueError):
            idx = None

    raw = pdata.get("full_degree", pdata.get("Degree", pdata.get("degree", 0)))
    try:
        full_degree = float(raw)
        sign_degree = full_degree % 30.0
    except (TypeError, ValueError):
        return idx, None
    return idx, sign_degree


def _parashari_hora_from_d1(idx: int, sign_degree: float) -> dict:
    """Exact user-supplied odd/even Parashari Hora rule."""
    if idx is None or sign_degree is None:
        return {"available": False}

    odd = idx in ODD_RASHIS
    first_half = sign_degree < 15.0
    # Odd: 0-15 Sun, 15-30 Moon. Even: reverse.
    hora_code = ("Su" if first_half else "Mo") if odd else ("Mo" if first_half else "Su")
    hora_no = 1 if first_half else 2
    return {
        "available": True,
        "rashi_index": idx,
        "rashi_name": RASHI_NAMES_HI[idx],
        "degree": round(sign_degree, 4),
        "sign_type": "विषम" if odd else "सम",
        "sign_type_en": "odd" if odd else "even",
        "hora_no": hora_no,
        "range": "0°–15°" if first_half else "15°–30°",
        "hora_lord_code": hora_code,
        "hora_lord": _planet_name(hora_code),
        "hora_sign_index": 4 if hora_code == "Su" else 3,
        "hora_sign": "सिंह" if hora_code == "Su" else "कर्क",
        "is_sun_hora": hora_code == "Su",
        "is_moon_hora": hora_code == "Mo",
    }


def _hora_strength(sign_degree: float) -> dict:
    """Three-part strength supplied by the user; no percentage prediction."""
    if sign_degree is None:
        return {"available": False}
    local = sign_degree if sign_degree < 15.0 else sign_degree - 15.0
    if local < 5.0:
        level, label = "strongest", "मजबूत"
    elif local < 10.0:
        level, label = "average", "औसत"
    else:
        level, label = "weakest", "कमजोर"
    return {
        "available": True,
        "segment_degree": round(local, 4),
        "level": level,
        "label": label,
        "range": ("0°–5°" if sign_degree < 15.0 else "15°–20°") if local < 5 else
                 (("5°–10°" if sign_degree < 15.0 else "20°–25°") if local < 10 else
                  ("10°–15°" if sign_degree < 15.0 else "25°–30°")),
    }


def _kerala_hora_mapping(lord_code: str, hora_code: str) -> dict:
    """User-supplied Labh Mandook / Kerala 12-sign mapping."""
    mapping = KERALA_SUN_CONTRIBUTED if hora_code == "Su" else KERALA_MOON_CONTRIBUTED
    rashi_1 = mapping.get(lord_code)
    return {
        "available": rashi_1 is not None,
        "lord_code": lord_code,
        "lord_name": _planet_name(lord_code),
        "hora_lord_code": hora_code,
        "hora_lord": _planet_name(hora_code),
        "mapped_rashi_number": rashi_1,
        "mapped_rashi_name": RASHI_NAMES_HI[rashi_1 - 1] if rashi_1 else None,
        "mapping": "Sun_Contributed_Signs" if hora_code == "Su" else "Moon_Contributed_Signs",
    }


def _formula4_flags(planets: dict, lagna_index: int, planet_rows: list) -> dict:
    """Return source-rule matches only. It intentionally does not make final decisions."""
    flags = []

    # Soft spoken & fortunate: benefic + D1 even + Moon Hora + first 5 degrees of Hora.
    for row in planet_rows:
        if row["planet_code"] not in HORA_BENEFICS:
            continue
        h = row["parashari_hora"]
        if h.get("available") and h["sign_type_en"] == "even" and h["is_moon_hora"] and row["hora_strength"]["range"] in ("0°–5°", "15°–20°"):
            flags.append({
                "code": "soft_spoken_fortunate",
                "label": "मधुर वाणी / भाग्यशाली — सूत्र match",
                "planet": row["planet_name"],
                "evidence": f'{row["rashi_name"]} (सम), {row["degree"]}°, {h["hora_lord"]} होरा, {row["hora_strength"]["range"]}',
                "source_rule": "शुभ ग्रह + सम राशि + चंद्र होरा + पहला 5° भाग",
            })

    # Harsh speech: Jupiter in Leo + Sun Hora + first 5 degrees of Hora.
    ju = next((r for r in planet_rows if r["planet_code"] == "Ju"), None)
    if ju and ju["rashi_index"] == 4:
        h = ju["parashari_hora"]
        if h.get("available") and h["is_sun_hora"] and ju["hora_strength"]["range"] in ("0°–5°", "15°–20°"):
            flags.append({
                "code": "harsh_speech_jupiter",
                "label": "कठोर वाणी — सूत्र match",
                "planet": "गुरु",
                "evidence": f'गुरु सिंह में {ju["degree"]}°, सूर्य होरा, {ju["hora_strength"]["range"]}',
                "source_rule": "गुरु सिंह + सूर्य होरा + पहला 5° भाग",
            })

    # Lagnesh cruel/odd/Sun Hora.
    lagna_lord = RASHI_LORD.get(lagna_index)
    ll = next((r for r in planet_rows if r["planet_code"] == lagna_lord), None)
    if ll and lagna_lord in HORA_CRUEL:
        h = ll["parashari_hora"]
        if h.get("available") and h["sign_type_en"] == "odd" and h["is_sun_hora"]:
            flags.append({
                "code": "cruel_lagnesh_sun_hora",
                "label": "क्रूर लग्नेश + सूर्य होरा — सूत्र match",
                "planet": ll["planet_name"],
                "evidence": f'लग्नेश {ll["planet_name"]}: {ll["rashi_name"]} (विषम), {ll["degree"]}°, सूर्य होरा',
                "source_rule": "क्रूर लग्नेश + विषम राशि + सूर्य होरा",
            })

    # Voracious eater rule needs D30 cruel Shashtiamsha details. Do not guess if absent.
    flags.append({
        "code": "voracious_eater_d30_required",
        "label": "अधिक भोजन — D30/क्रूर षष्ट्यांश evidence आवश्यक",
        "planet": None,
        "evidence": "इस engine में इस सूत्र को final match घोषित करने के लिए D30 के विशिष्ट दंडायुध/दावाग्नि/काल षष्ट्यांश data चाहिए।",
        "source_rule": "लग्नेश या 2nd lord + पाप प्रभाव + क्रूर षष्ट्यांश",
        "available": False,
    })

    return {
        "computed": True,
        "flags": flags,
        "note": "ये केवल सूत्र-आधारित evidence/flags हैं; अंतिम फलादेश या निर्णय नहीं।",
    }


def _raw_d2_rashi_index(pdata: dict):
    """Read the preserved D2 rashi index directly from Vargas[D2].
    This is used for D2 house placement; it does not recalculate Hora.
    """
    vargas = (pdata or {}).get("Vargas") or {}
    d2 = vargas.get("D2") if isinstance(vargas, dict) else None
    if isinstance(d2, dict):
        value = d2.get("Idx")
        if value is None:
            value = d2.get("rashi_index", d2.get("RashiIdx"))
    elif isinstance(d2, (int, float)):
        value = int(d2)
    else:
        value = None
    try:
        return int(value) % 12 if value is not None else None
    except (TypeError, ValueError):
        return None


HORA_MANSAGARI_RULES = [
    {"planet": "सूर्य", "placement": "चंद्र होरा", "rule": "सुख-सुविधा/धन, अपने प्रयास से अर्जन, गरिमा/स्त्री-सदृश disposition और ग्रंथ में रोग-संबंधी उल्लेख।"},
    {"planet": "सूर्य", "placement": "अपनी होरा", "rule": "साहस, परिश्रम, इंद्रिय-संयम, विद्या और पराक्रम का ग्रंथीय वर्णन।"},
    {"planet": "चंद्र", "placement": "सूर्य होरा", "rule": "स्त्री-संबंधी कष्ट, कामुकता, शत्रु/मित्र संबंध और बुद्धि के बारे में ग्रंथीय वर्णन।"},
    {"planet": "मंगल", "placement": "सूर्य होरा", "rule": "प्रियता, साहस, धन और संरक्षण/स्थिरता का ग्रंथीय वर्णन।"},
    {"planet": "मंगल", "placement": "चंद्र होरा", "rule": "विवाह/धार्मिक आचरण संबंधी नकारात्मक फल का ग्रंथीय वर्णन।"},
    {"planet": "बुध", "placement": "सूर्य होरा", "rule": "धन और वाणी/परनिंदा संबंधी फल का ग्रंथीय वर्णन।"},
    {"planet": "बुध", "placement": "चंद्र होरा", "rule": "प्रसिद्धि और spouse-related फल का ग्रंथीय वर्णन।"},
    {"planet": "गुरु", "placement": "सूर्य होरा", "rule": "रोग/आयु संबंधी नकारात्मक फल का ग्रंथीय वर्णन।"},
    {"planet": "गुरु", "placement": "चंद्र होरा", "rule": "उत्तम चरित्र/सज्जनता और धन संबंधी फल का ग्रंथीय वर्णन।"},
    {"planet": "शुक्र", "placement": "सूर्य होरा", "rule": "काम/संबंध संबंधी ग्रंथीय वर्णन।"},
    {"planet": "शुक्र", "placement": "चंद्र होरा", "rule": "पत्नी/जीवनसाथी संबंधी सकारात्मक वर्णन।"},
    {"planet": "शनि", "placement": "सूर्य होरा", "rule": "विवाह/जीवनसाथी संबंधी ग्रंथीय वर्णन।"},
    {"planet": "शनि", "placement": "चंद्र होरा", "rule": "वैवाहिक dynamics संबंधी ग्रंथीय वर्णन।"},
    {"planet": "बलवान पाप ग्रह", "placement": "सूर्य होरा", "rule": "धन/ऐश्वर्य के साथ कुछ नकारात्मक जीवन-विषयों का ग्रंथीय वर्णन।"},
    {"planet": "शुभ ग्रह", "placement": "चंद्र होरा", "rule": "स्त्री-संबंधी स्नेह/सुख का ग्रंथीय वर्णन।"},
    {"planet": "कोई ग्रह", "placement": "सूर्य होरा", "rule": "सूर्य होरा में जन्म के संबंध में धर्म, सत्य, स्व-प्रयास, संगीत और संतान आदि का ग्रंथीय वर्णन।"},
]


def compute_hora_analysis(planets: Dict, lagna_index: int = 0) -> Dict:
    """Complete standalone Hora/D2 evidence.
    D1 sign + exact degree is the input to the Parashari rule that determines
    the D2 Hora; preserved Vargas[D2] remains the source of truth when reading
    an already-computed D2 placement, including Khar Lord Hora.
    No final predictive decision is produced."""
    try:
        rows = []
        for code in ["La", "Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
            pdata = planets.get(code)
            if not pdata:
                continue
            idx, deg = _hora_degree_from_planet(pdata)
            h = _parashari_hora_from_d1(idx, deg)
            strength = _hora_strength(deg)
            lord = RASHI_LORD.get(idx) if idx is not None else None
            kerala = _kerala_hora_mapping(lord, h.get("hora_lord_code")) if lord and h.get("available") else {"available": False}
            rows.append({
                "planet_code": code,
                "planet_name": _planet_name(code),
                "rashi_index": idx,
                "rashi_name": RASHI_NAMES_HI[idx] if idx is not None else None,
                "degree": round(deg, 4) if deg is not None else None,
                "parashari_hora": h,
                "hora_strength": strength,
                "rashi_lord_code": lord,
                "rashi_lord": _planet_name(lord) if lord else None,
                "kerala_hora": kerala,
            })

        # D2 house placement must read the preserved D2 chart directly.
        # Do NOT use _d2_hora_for_planet() here because that helper intentionally
        # classifies Cancer/Leo as Moon/Sun Hora for Khar.
        d2_lagna_index = _raw_d2_rashi_index(planets.get("La", {}))
        d2_lagna = {
            "available": d2_lagna_index is not None,
            "rashi_index": d2_lagna_index,
            "rashi_name": RASHI_NAMES_HI[d2_lagna_index] if d2_lagna_index is not None else None,
            "source": "preserved Vargas[D2]",
        }
        if d2_lagna_index is not None:
            for row in rows:
                # row rashi_index is D1; D2 placement is separately derived from
                # the Parashari formula and therefore the house is not assigned here
                # unless a preserved D2 rashi is available for that planet.
                pdata = planets.get(row["planet_code"], {}) or {}
                d2_idx = _raw_d2_rashi_index(pdata)
                if d2_idx is not None:
                    row["d2_rashi_index"] = d2_idx
                    row["d2_rashi_name"] = RASHI_NAMES_HI[d2_idx]
                    row["d2_house"] = ((d2_idx - d2_lagna_index) % 12) + 1

        formula4 = _formula4_flags(planets, lagna_index, rows)

        return {
            "computed": True,
            "engine": "hora_analysis v1.0",
            "method_note": "Formula 1: Parashari D2 odd/even rule. Formula 2: 5° strength segments. Formula 3: supplied Kerala/Labh Mandook mapping. Formula 4: supplied nature/speech source-rules. Raw evidence only.",
            "formula_1_parashari": {
                "computed": True,
                "rule": "विषम: 0°–15° सूर्य, 15°–30° चंद्र | सम: 0°–15° चंद्र, 15°–30° सूर्य",
                "rows": rows,
            },
            "formula_2_hora_strength": {
                "computed": True,
                "rule": "प्रत्येक 15° होरा को 0–5° मजबूत, 5–10° औसत, 10–15° कमजोर भाग में विभाजित किया गया है।",
                "rows": [{
                    "planet_code": r["planet_code"], "planet_name": r["planet_name"],
                    "degree": r["degree"], "hora": r["parashari_hora"], "strength": r["hora_strength"],
                } for r in rows],
            },
            "formula_3_kerala_hora": {
                "computed": True,
                "sun_contributed_signs": {k: {"planet_name": _planet_name(k), "rashi_number": v, "rashi_name": RASHI_NAMES_HI[v-1]} for k, v in KERALA_SUN_CONTRIBUTED.items()},
                "moon_contributed_signs": {k: {"planet_name": _planet_name(k), "rashi_number": v, "rashi_name": RASHI_NAMES_HI[v-1]} for k, v in KERALA_MOON_CONTRIBUTED.items()},
                "rows": [{
                    "planet_code": r["planet_code"], "planet_name": r["planet_name"],
                    "d1_rashi": r["rashi_name"], "d1_rashi_lord": r["rashi_lord"],
                    "hora_lord": r["parashari_hora"].get("hora_lord"), "mapping": r["kerala_hora"],
                } for r in rows],
            },
            "mansagari_textual_rules": {
                "computed": True,
                "note": "ये source में दिए गए ग्रंथीय फल-संदर्भ हैं; software इन्हें automatic prediction/decision में convert नहीं करता।",
                "rules": HORA_MANSAGARI_RULES,
            },
            "formula_4_nature_speech": formula4,
            "d2_house_reference": {
                "computed": True,
                "d2_lagna": d2_lagna,
                "rows": D2_HOUSE_REFERENCE,
                "note": "यह reference/evidence framework है; किसी भाव से automatic final result नहीं निकाला गया।",
            },
            "rows": rows,
            "final_decision_note": "सॉफ्टवेयर केवल गणना, rule-match और evidence निकालता है। अंतिम निर्णय व्यक्ति/ज्योतिषी करेगा।",
        }
    except Exception as e:
        return {"computed": False, "error": str(e), "engine": "hora_analysis v1.0"}


def compute_advanced_yogas(
    planets: Dict,
    sav: List[int],
    bav_charts: Dict,
    lagna_index: int = 0,
    moon_rashi: int = 0,
    chandra_lagna_sav: Optional[List[int]] = None,
    surya_lagna_sav: Optional[List[int]] = None,
    partner_moon_bav_total: Optional[int] = None,
) -> Dict:
    """
    Master — Batch 4 final engine.

    Args:
        planets:                { "Su": {"house":1,"rashi_index":0}, ... }
        sav:                    12-element list (house-based)
        bav_charts:             { "Su":[...], "Mo":[...], ... }
        lagna_index:            0-based birth lagna rashi
        moon_rashi:             0-based janm chandra rashi
        chandra_lagna_sav:      Legacy compatibility parameter (not used)
        surya_lagna_sav:        Legacy compatibility parameter (not used)
        partner_moon_bav_total: Legacy compatibility parameter (not used)
    """
    try:
        result = {"computed": True, "engine": "advanced_yogas_engine v1.1"}

        result["indu_lagna"]       = compute_indu_lagna(planets, sav, lagna_index, moon_rashi)
        result["spouse_direction"] = compute_spouse_direction(bav_charts)

        # [BUG FIX 1] Pass lagna_index so rashi→house mapping is correct
        result["d30_scandal"]      = compute_d30_scandal(planets, bav_charts)

        # [BUG FIX 2] Use SAV at Moon's house instead of sum(Moon BAV) which is always 49
        # sav is house-based; moon_house_idx = (moon_rashi - lagna_index) % 12
        result["summary"] = {
            "indu_wealth":      result["indu_lagna"].get("wealth_level", ""),
            "crorepati_yoga":   result["indu_lagna"].get("indu_sav", 0) >= 30,
            "spouse_direction": result["spouse_direction"].get("spouse_direction", ""),
        }

        # KHAR / 64TH NAVAMSHA (D1 + D9 + D3)
        result["khar_64th_navamsa"] = compute_khar_64th_navamsa(planets, lagna_index)

        # STANDALONE HORA TAB — formulas/evidence only; no final prediction
        result["hora_analysis"] = compute_hora_analysis(planets, lagna_index)

        return result

    except Exception as e:
        return {"computed": False, "error": str(e), "engine": "advanced_yogas_engine v1.1"}