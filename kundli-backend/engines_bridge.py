"""
engines_bridge.py
═════════════════════════════════════════════════════════════════
Hamare api.py ke astro data ko sabhi engines ke format mein
convert karta hai aur ek baar mein sab results return karta hai.

Hamare api.py format:
  astro["Su"]["Vargas"]["D1"]["Idx"]  → sign_index (0-11)
  astro["Su"]["Degree"]               → full ecliptic degree
  sav_points[0..11]                   → sarvaashtakavarga

Engines ka format:
  planet_positions = {
    "Sun": {"sign_index": 2, "degree": 77.58, "house": 3, ...}
  }
  lagna_sign = 0  (0-11)

v2.0 — Batch 1-4 engines integrated:
  - av_sutras_engine      (Batch 1-B)
  - kaksha_engine         (Batch 1-A  — Daily prediction)
  - dasha_shani_engine    (Batch 2)
  - chandra_surya_engine  (Batch 3)
  - advanced_yogas_engine (Batch 4)
═════════════════════════════════════════════════════════════════
"""

from typing import Dict, Any, List, Optional
import traceback
import datetime

# ── Existing engines (touch mat karo) ──────────────────────────
# (ye imports aapke existing file mein pehle se hain)

# ── New batch engines ───────────────────────────────────────────
from av_sutras_engine      import compute_av_sutras
from kaksha_engine         import compute_daily_prediction
from dasha_shani_engine    import compute_dasha_shani
from chandra_surya_engine  import compute_chandra_surya
from advanced_yogas_engine import compute_advanced_yogas


# ── Planet code mapping: our format → engines' format ──────────
OUR_TO_ENGINE = {
    "Su": "Sun",  "Mo": "Moon", "Ma": "Mars", "Me": "Mercury",
    "Ju": "Jupiter", "Ve": "Venus", "Sa": "Saturn",
    "Ra": "Rahu",  "Ke": "Ketu"
}
ENGINE_TO_OUR = {v: k for k, v in OUR_TO_ENGINE.items()}

# ── SAV helpers ─────────────────────────────────────────────────
def sav_to_house_dict(sav_points: list) -> Dict[int, int]:
    """[35,24,28,...] → {1:35, 2:24, 3:28, ...}"""
    return {i+1: sav_points[i] for i in range(12)}

def sav_to_sign_dict(sav_points: list) -> Dict[int, int]:
    return {i: sav_points[i] for i in range(12)}


# ══════════════════════════════════════════════════════════════════
# NEW HELPER FUNCTIONS — Batch engines ke liye data convert karo
# ══════════════════════════════════════════════════════════════════

def _build_planets_for_batch_engines(astro: Dict, planet_house_map: Dict) -> Dict:
    """
    astro dict (hamare api.py format) ko batch engines ke liye convert karo.
    Output: { "Su": {"house": 1, "rashi_index": 0, "degree": 14.5, ...}, ... }
    """
    result = {}
    for our_code in OUR_TO_ENGINE.keys():
        if our_code not in astro:
            continue
        p         = astro[our_code]
        full_deg  = p.get("Degree", 0)
        sign_idx  = p["Vargas"]["D1"]["Idx"]   # 0-based sign index
        sign_deg  = full_deg % 30
        dignity   = p.get("Dignity", "")
        house     = planet_house_map.get(our_code, 0)

        result[our_code] = {
            "house":       house,
            "rashi_index": sign_idx,            # already 0-based from api.py
            "degree":      round(sign_deg, 4),
            "dignity":     dignity,
            "sign":        p.get("Rashi", ""),
            "retrograde":  bool(p.get("Retro", False) or p.get("retrograde", False)),
        }
    return result


def _compute_bav_classical(planet_signs: Dict[str, int], lagna_rashi: int) -> Dict[str, List[int]]:
    """
    Classical Ashtakvarga bindu computation from planet sign positions.

    For each planet, count which signs (houses from contributor's position)
    give a bindu according to traditional Parashari rules.

    planet_signs: { "Su": 0, "Mo": 3, "Ma": 6, ... }  (0-based sign index)
    lagna_rashi:  0-based lagna sign

    Returns: { "Su": [3,4,2,...12 values], "Mo": [...], ... }
    Each value = number of bindus that sign received (0-8 max).
    """
    # Classical bindu rules: for each planet, from each contributor,
    # which HOUSES (1-based, counted from contributor) give a bindu.
    # Source: Brihat Parashara Hora Shastra
    RULES = {
        "Su": {
            "Su": {1,2,4,7,8,9,10,11},
            "Mo": {3,6,10,11},
            "Ma": {1,2,4,7,8,9,10,11},
            "Me": {3,5,6,9,10,11,12},
            "Ju": {5,6,9,11},
            "Ve": {6,7,12},
            "Sa": {1,2,4,7,8,9,10,11},
            "La": {3,4,6,10,11,12},
        },
        "Mo": {
            "Su": {3,6,7,8,10,11},
            "Mo": {1,3,6,7,10,11},
            "Ma": {2,3,5,6,9,10,11},
            "Me": {1,3,4,5,7,8,10,11},
            "Ju": {1,4,7,8,10,11,12},
            "Ve": {3,4,5,7,9,10,11},
            "Sa": {3,5,6,11},
            "La": {3,6,10,11},
        },
        "Ma": {
            "Su": {3,5,6,10,11},
            "Mo": {3,6,11},
            "Ma": {1,2,4,7,8,10,11},
            "Me": {3,5,6,11},
            "Ju": {6,10,11,12},
            "Ve": {6,8,11,12},
            "Sa": {1,4,7,8,9,10,11},
            "La": {1,4,8,10,11},
        },
        "Me": {
            "Su": {5,6,9,11,12},
            "Mo": {2,4,6,8,10,11},
            "Ma": {1,2,4,7,8,9,10,11},
            "Me": {1,3,5,6,9,10,11,12},
            "Ju": {6,8,11,12},
            "Ve": {1,2,3,4,5,8,9,11},
            "Sa": {1,2,4,7,8,9,10,11},
            "La": {1,2,4,6,8,10,11},
        },
        "Ju": {
            "Su": {1,2,3,4,7,8,9,10,11},
            "Mo": {2,5,7,9,11},
            "Ma": {1,2,4,7,8,10,11},
            "Me": {1,2,4,5,6,9,10,11},
            "Ju": {1,2,3,4,7,8,10,11},
            "Ve": {2,5,6,9,10,11},
            "Sa": {3,5,6,12},
            "La": {1,2,4,5,6,7,9,10,11},
        },
        "Ve": {
            "Su": {8,11,12},
            "Mo": {1,2,3,4,5,8,9,11,12},
            "Ma": {3,4,6,9,11,12},
            "Me": {3,5,6,9,11},
            "Ju": {5,8,9,10,11},
            "Ve": {1,2,3,4,5,8,9,10,11},
            "Sa": {3,4,5,8,9,10,11},
            "La": {1,2,3,4,5,8,9,11},
        },
        "Sa": {
            "Su": {1,2,4,7,8,10,11},
            "Mo": {3,6,11},
            "Ma": {3,5,6,10,11,12},
            "Me": {6,8,9,10,12},
            "Ju": {5,6,11,12},
            "Ve": {6,11,12},
            "Sa": {1,3,5,6,11},       # Varahamihira: house 1 included (total 39)
            "La": {1,3,4,6,10,11},
        },
    }

    # Compute bindu count per sign (0-11) for each target planet
    result = {}
    for target_planet, contributor_rules in RULES.items():
        sign_bindus = [0] * 12  # 12 signs

        for contributor, shubh_houses in contributor_rules.items():
            # Get contributor's sign position
            if contributor == "La":
                contributor_sign = lagna_rashi
            else:
                contributor_sign = planet_signs.get(contributor)
                if contributor_sign is None:
                    continue

            # For each sign (0-11), calculate house number from contributor
            for sign_idx in range(12):
                house_from_contrib = ((sign_idx - contributor_sign) % 12) + 1
                if house_from_contrib in shubh_houses:
                    sign_bindus[sign_idx] += 1

        result[target_planet] = sign_bindus

    return result


def _build_bav_charts_from_astro(astro: Dict, sav_points: list = None,
                                  lagna_rashi: int = 0) -> Dict:
    """
    BAV charts nikalo.

    Priority order:
    1. astro["bav"] ya astro["bav_charts"] mein pehle se computed ho
    2. astro ke andar individual planet BAV keys (Su_bav, Mo_bav etc.)
    3. Classical Ashtakvarga rules se compute karo (ACCURATE)
    4. SAV se approximate (last resort)
    """
    bav_charts = {}
    name_map = {
        "Sun": "Su", "Moon": "Mo", "Mars": "Ma",
        "Mercury": "Me", "Jupiter": "Ju",
        "Venus": "Ve", "Saturn": "Sa",
    }

    # ── Priority 1: astro dict mein pehle se bav key hai? ───────
    bav_raw = astro.get("bav") or astro.get("bav_charts") or {}
    if bav_raw:
        for full_name, code in name_map.items():
            bav_data = bav_raw.get(full_name, bav_raw.get(code, {}))
            points = (
                bav_data.get("points_per_house") or
                bav_data.get("house_points") or
                bav_data.get("points") or []
            )
            if len(points) == 12:
                bav_charts[code] = [int(x) for x in points]
        if len(bav_charts) >= 6:
            return bav_charts

    # ── Priority 2: Individual planet BAV keys ───────────────────
    for full_name, code in name_map.items():
        for key in [f"{code}_bav", f"{full_name.lower()}_bav",
                    f"bav_{code}", f"bav_{full_name.lower()}"]:
            val = astro.get(key, [])
            if val and len(val) == 12:
                bav_charts[code] = [int(x) for x in val]
                break
    if len(bav_charts) >= 6:
        return bav_charts

    # ── Priority 3: Classical rules se compute karo ─────────────
    # Planet signs nikalo (0-based)
    planet_signs = {}
    for code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]:
        if code in astro:
            planet_signs[code] = int(astro[code]["Vargas"]["D1"]["Idx"])

    if len(planet_signs) >= 6:
        computed = _compute_bav_classical(planet_signs, lagna_rashi)
        for code, points in computed.items():
            if code not in bav_charts:
                bav_charts[code] = points
        return bav_charts

    # ── Priority 4: SAV se approximate (last resort) ─────────────
    if sav_points and len(sav_points) == 12:
        for code in name_map.values():
            if code not in bav_charts:
                approx = [max(0, min(8, round(v / 7))) for v in sav_points]
                bav_charts[code] = approx

    return bav_charts


def _build_transit_planets_from_astro(astro: Dict) -> Dict:
    """
    Aaj ke transit planets compute karo.
    Priority 1: astro dict mein transit_planets key ho (api.py se) toh use karo.
    Priority 2: Simplified orbital mechanics se aaj ki sidereal positions nikalo.
    Output: { "Su": {"rashi_index": 0, "degree": 14.5, "rashi_name": "मेष"}, ... }
    """
    RASHI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
             "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]

    # ── PRIORITY 1: api.py ne transit data bheja ho ──────────────
    transit_raw = astro.get("transit_planets", astro.get("transits", {}))
    name_map = {
        "Sun": "Su", "Moon": "Mo", "Mars": "Ma",
        "Mercury": "Me", "Jupiter": "Ju",
        "Venus": "Ve", "Saturn": "Sa",
    }
    if transit_raw:
        result = {}
        for full_name, code in name_map.items():
            p = transit_raw.get(full_name, transit_raw.get(code, {}))
            if p:
                full_deg = p.get("Degree", p.get("degree", 0))
                sign_idx = p.get("Vargas", {}).get("D1", {}).get("Idx",
                           int(full_deg / 30) % 12)
                result[code] = {
                    "rashi_index": int(sign_idx),
                    "degree":      round(float(full_deg) % 30, 4),
                    "rashi_name":  p.get("Rashi", p.get("rashi", RASHI[int(sign_idx)])),
                }
        if result:
            return result

    # ── PRIORITY 2: Orbital mechanics se aaj ki positions ────────
    today = datetime.date.today()
    jd = (today - datetime.date(2000, 1, 1)).days + 2451545.0
    T  = (jd - 2451545.0) / 36525.0   # Julian centuries from J2000

    # Lahiri ayanamsa (approx)
    ayanamsa = 23.85 + 0.013954 * T * 100

    def sid(trop_deg):
        return (trop_deg - ayanamsa) % 360

    def sign_deg(deg360):
        s = int(deg360 / 30) % 12
        d = round(deg360 % 30, 2)
        return s, d

    # Mean longitude formulas (J2000 epoch)
    planets_raw = {
        "Su": (280.46646 + 36000.76983  * T) % 360,
        "Mo": (218.31650 + 481267.88130 * T) % 360,
        "Ma": (355.43300 + 19140.29900  * T) % 360,
        "Me": (252.25100 + 149472.67400 * T) % 360,
        "Ju": ( 34.35100 +  3034.90600  * T) % 360,
        "Ve": (181.97900 + 58517.81600  * T) % 360,
        "Sa": ( 50.07700 +  1222.11400  * T) % 360,
    }

    result = {}
    for code, trop_lon in planets_raw.items():
        s, d = sign_deg(sid(trop_lon))
        result[code] = {
            "rashi_index": s,
            "degree":      d,
            "rashi_name":  RASHI[s],
        }
    return result


def _build_current_dasha_from_astro(astro: Dict) -> Optional[Dict]:
    """
    astro dict se current dasha nikalo.
    Returns None agar data nahi mila.
    """
    dasha = astro.get("dasha", {})
    name_to_code = {
        "Sun":     "Su", "Moon":    "Mo", "Mars":    "Ma",
        "Mercury": "Me", "Jupiter": "Ju", "Venus":   "Ve",
        "Saturn":  "Sa", "Rahu":    "Ra", "Ketu":    "Ke",
    }
    maha = (
        dasha.get("mahadasha", {}).get("planet", "") or
        dasha.get("current_mahadasha", "")
    )
    antar = (
        dasha.get("antardasha", {}).get("planet", "") or
        dasha.get("current_antardasha", "")
    )
    maha  = name_to_code.get(maha, maha)
    antar = name_to_code.get(antar, antar)
    return {"mahadasha": maha, "antardasha": antar} if maha else None


# ══════════════════════════════════════════════════════════════════
# EXISTING FUNCTION — koi change nahi, exactly as before
# ══════════════════════════════════════════════════════════════════

def build_unified_chart_data(
    astro: Dict,
    lagna_rashi: int,
    planet_house_map: Dict[str, int],
    sav_points: list,
    current_dasha: str = "",
    jyotish_evaluation: Dict = None,
    dob=None,
    moon_degree: float = 0.0,
) -> Dict[str, Any]:
    """
    Hamare api.py ke sab data ko ek unified chart_data dict mein daalo
    jo sabhi 7 engines samjhein.
    [UNCHANGED from v1 — existing engines is function pe depend hain]
    """
    jyotish_evaluation = jyotish_evaluation or {}

    planet_positions = {}
    for our_code, eng_name in OUR_TO_ENGINE.items():
        if our_code not in astro:
            continue
        p        = astro[our_code]
        sign_idx = p["Vargas"]["D1"]["Idx"]
        full_deg = p["Degree"]
        sign_deg = full_deg % 30
        nak_idx  = int(full_deg / (360/27))
        pada     = int((full_deg % (360/27)) / (360/108)) + 1
        house    = planet_house_map.get(our_code, 0)

        dignity_raw    = p.get("Dignity", "")
        is_exalted     = "उच्च" in dignity_raw
        is_debilitated = "नीच" in dignity_raw
        is_own_sign    = "स्वराशि" in dignity_raw

        fn_data = jyotish_evaluation.get("planets", {}).get(our_code, {})
        fn      = fn_data.get("functional", {})

        planet_positions[eng_name] = {
            "sign_index":      sign_idx,
            "degree":          round(sign_deg, 2),
            "full_degree":     round(full_deg, 2),
            "house":           house,
            "nakshatra":       nak_idx + 1,
            "nakshatra_pada":  pada,
            "is_exalted":      is_exalted,
            "is_debilitated":  is_debilitated,
            "is_own_sign":     is_own_sign,
            "is_enemy_sign":   "शत्रु" in dignity_raw,
            "is_friendly":     "मित्र" in dignity_raw,
            "is_yogakaraka":   bool(fn.get("yogakaraka")),
            "is_benefic":      bool(fn.get("benefic") or fn.get("yogakaraka")),
            "is_malefic":      bool(fn.get("malefic")),
            "is_maraka":       bool(fn.get("maraka")),
            "is_badhakesh":    bool(fn.get("badhakesh")),
            "strength":        fn_data.get("strength", {}).get("score", 50),
            "risk_score":      fn_data.get("risk_score", 0),
        }

    SIGN_LORDS_ENG = {
        0:"Mars",1:"Venus",2:"Mercury",3:"Moon",4:"Sun",5:"Mercury",
        6:"Venus",7:"Mars",8:"Jupiter",9:"Saturn",10:"Saturn",11:"Jupiter"
    }
    house_lords = {}
    for h in range(1, 13):
        sign_in_house = (lagna_rashi + h - 1) % 12
        house_lords[h] = SIGN_LORDS_ENG[sign_in_house]

    lagnesh_eng  = SIGN_LORDS_ENG[lagna_rashi]
    lagnesh_data = planet_positions.get(lagnesh_eng, {})
    yogakaraka_planets = jyotish_evaluation.get("yogakaraka_planets", [])
    has_rajyoga  = len(yogakaraka_planets) > 0

    lagna_afflicted = any(
        planet_positions.get(p, {}).get("is_malefic") and
        planet_positions.get(p, {}).get("house") == 1
        for p in OUR_TO_ENGINE.values()
    )
    lagna_strong = planet_positions.get(lagnesh_eng, {}).get("strength", 50) > 60

    house_4_benefic = any(
        planet_positions.get(p, {}).get("house") == 4 and
        planet_positions.get(p, {}).get("is_benefic")
        for p in OUR_TO_ENGINE.values()
    )

    saturn_data = planet_positions.get("Saturn", {})
    sa_house    = saturn_data.get("house", 0)
    lg_house    = lagnesh_data.get("house", 0)
    saturn_aspects_lagnesh = lg_house in [
        sa_house,
        (sa_house + 2) % 12 or 12,
        (sa_house + 6) % 12 or 12,
        (sa_house + 9) % 12 or 12,
    ]

    moon_nak           = int(moon_degree / (360/27)) + 1
    current_dasha_eng  = OUR_TO_ENGINE.get(current_dasha, current_dasha)

    chart_data = {
        "lagna_sign":           lagna_rashi,
        "planet_positions":     planet_positions,
        "house_lords":          house_lords,
        "lagnesh_position":     {"house": lg_house, "planet": lagnesh_eng},
        "lagnesh_strong":       lagna_strong,
        "lagna_afflicted":      lagna_afflicted,
        "lagna_strong":         lagna_strong,
        "has_rajyoga":          has_rajyoga,
        "has_d1_dosha":         lagna_afflicted,
        "house_4_has_benefic":  house_4_benefic,
        "house_8_lord_strong":  planet_positions.get(house_lords.get(8,""), {}).get("strength", 50) > 60,
        "saturn_aspects":       saturn_aspects_lagnesh,
        "has_wealth_yoga":      any(p in yogakaraka_planets for p in ["Ju", "Ve"]),
        "current_dasha":        current_dasha_eng,
        "birth_nakshatra":      moon_nak,
        "moon_degree":          moon_degree,
        "dob":                  str(dob.date()) if dob else "",
        "gender":               "male",
    }

    return {
        "chart_data":          chart_data,
        "ashtakvarga_points":  sav_to_house_dict(sav_points),
        "sign_points":         sav_to_sign_dict(sav_points),
        "moon_nak":            moon_nak,
    }


# ══════════════════════════════════════════════════════════════════
# MAIN RUNNER — v2.0 (existing 8 engines + 5 new batch engines)
# ══════════════════════════════════════════════════════════════════

def run_all_engines(
    astro: Dict,
    lagna_rashi: int,
    planet_house_map: Dict[str, int],
    sav_points: list,
    current_dasha: str = "",
    jyotish_evaluation: Dict = None,
    dob=None,
    moon_degree: float = 0.0,
) -> Dict[str, Any]:
    """
    Sab engines chalao aur ek combined dict return karo.
    Koi bhi engine fail ho to uska error catch karo, baaki chalte rahein.
    """
    # ── Existing unified data (existing engines ke liye) ─────────
    unified = build_unified_chart_data(
        astro, lagna_rashi, planet_house_map,
        sav_points, current_dasha, jyotish_evaluation, dob, moon_degree
    )
    cd  = unified["chart_data"]
    av  = unified["ashtakvarga_points"]
    sp  = unified["sign_points"]
    nak = unified["moon_nak"]

    # ── New batch engines ke liye data build karo ─────────────────
    planets_dict        = _build_planets_for_batch_engines(astro, planet_house_map)
    bav_charts          = _build_bav_charts_from_astro(astro, sav_points, lagna_rashi)
    transit_planets     = _build_transit_planets_from_astro(astro)
    current_dasha_dict  = _build_current_dasha_from_astro(astro)
    shani_transit_rashi = transit_planets.get("Sa", {}).get("rashi_index", 0)
    moon_rashi          = int(moon_degree / 30) % 12   # 0-based
    today_str           = datetime.date.today().isoformat()  # aaj ki date

    results = {}

    # ══════════════════════════════════════════════════════════════
    # EXISTING ENGINES 1-8 — koi change nahi
    # ══════════════════════════════════════════════════════════════

    # ENGINE 1: Yoga Detection
    try:
        from yoga_detection_system import detect_all_yogas
        results["yogas"] = detect_all_yogas(cd)
    except Exception as e:
        results["yogas"] = {"error": str(e)}


    # ENGINE 2: Planetary Sutras
    try:
        from planetary_sutras_system import analyze_planetary_sutras
        results["planetary_sutras"] = analyze_planetary_sutras(cd)
    except Exception as e:
        results["planetary_sutras"] = {"error": str(e)}

    # ENGINE 3: Advanced Jyotish (Punarjanma + Sade Sati)
    try:
        from advanced_jyotish_features import (
            calculate_punarjanma,
            comprehensive_saturn_analysis
        )
        sun_data  = astro.get("Su", {})
        sun_deg   = sun_data.get("Degree", 0)
        sun_sign  = int(sun_deg / 30)
        moon_sign = int(moon_degree / 30)

        results["punarjanma"] = calculate_punarjanma(
            sun_degree=sun_deg,
            moon_degree=moon_degree,
            sun_sign=sun_sign,
            moon_sign=moon_sign,
            event_type="birth"
        )
        if dob:
            results["saturn_transit"] = comprehensive_saturn_analysis(
                birth_date=dob,
                moon_degree=moon_degree
            )
    except Exception as e:
        results["punarjanma"]     = {"error": str(e)}
        results["saturn_transit"] = {"error": str(e)}

    # ENGINE 4: Ashtakvarga Complete
    try:
        from ashtakvarga_complete_system import complete_ashtakvarga_analysis
        _av_result = complete_ashtakvarga_analysis(
            ashtakvarga_points = av,
            sign_wise_points   = sp,
            planet_positions   = cd["planet_positions"],
            has_rajyoga        = cd["has_rajyoga"],
            has_d1_dosha       = cd["has_d1_dosha"],
            house_8_lord_strong= cd["house_8_lord_strong"],
            current_dasha      = cd["current_dasha"],
            gender             = cd["gender"]
        )
        # 🔥 KEY FIX: bav_charts ko result mein inject karo
        # Frontend: ed.ashtakavarga_complete.bav → BAV grid milega
        _av_result["bav"] = bav_charts
        results["ashtakvarga_complete"] = _av_result
    except Exception as e:
        results["ashtakvarga_complete"] = {"error": str(e), "bav": bav_charts}
    # ENGINE 5: Comprehensive Vedic
    try:
        from comprehensive_vedic_engine import comprehensive_vedic_analysis
        results["comprehensive_vedic"] = comprehensive_vedic_analysis(cd)
    except Exception as e:
        results["comprehensive_vedic"] = {"error": str(e)}
    

    # ENGINE 6: Navatara Chakra
    try:
        from navatara_complete_system import complete_navatara_planetary_analysis
        results["navatara"] = complete_navatara_planetary_analysis(
            birth_nakshatra=nak,
            chart_data=cd
        )
    except Exception as e:
        results["navatara"] = {"error": str(e)}

    # ENGINE 7: Advanced Sutras
    try:
        from advanced_sutras_engine import advanced_sutras_analysis
        results["advanced_sutras"] = advanced_sutras_analysis(cd, av, sp)
    except Exception as e:
        results["advanced_sutras"] = {"error": str(e)}

    # ENGINE 8: Nadi Jyotish Complete
    try:
        from nadi_jyotish_engine import full_nadi_analysis

        nadi_pc = {}
        NADI_P  = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN","RAHU","KETU"]
        OUR_P   = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]
        for our, nadi_name in zip(OUR_P, NADI_P):
            if our in astro:
                p           = astro[our]
                full_deg    = p.get("Degree", 0)
                sign_num    = int(full_deg / 30) % 12 + 1
                deg_in_sign = full_deg % 30
                nadi_pc[nadi_name] = {
                    "sign":       sign_num,
                    "degree":     round(deg_in_sign, 4),
                    "retrograde": bool(p.get("Retro", False) or p.get("retrograde", False)),
                    "combust":    bool(p.get("Combust", False) or p.get("combust", False)),
                }

        lagna_sign_num = lagna_rashi % 12 + 1
        gender         = cd.get("gender", "MALE")
        birth_year     = dob.year if dob else 1990
        current_year   = datetime.datetime.now().year

        results["nadi_jyotish"] = full_nadi_analysis(
            nadi_pc,
            lagna_sign_num,
            gender,
            birth_year,
            current_year,
            sav=sav_points,
        )
    except Exception as e:
        results["nadi_jyotish"] = {
            "error":     str(e),
            "traceback": traceback.format_exc()
        }

    # ══════════════════════════════════════════════════════════════
    # NEW BATCH ENGINES 9-13 — v2.0 additions
    # ══════════════════════════════════════════════════════════════

    # ENGINE 9: Daily Prediction (Kaksha Bal — Batch 1-A)
    try:
        results["daily_prediction"] = compute_daily_prediction(
            transit_planets = transit_planets,
            bav_charts      = bav_charts,
            sav             = sav_points,
            date_str        = today_str,   # ← aaj ki date (janam nahi)
        )
    except Exception as e:
        results["daily_prediction"] = {"computed": False, "error": str(e)}

    # ENGINE 10: AV Sutras Analysis (Batch 1-B)
    try:
        # Get kaksha_score from daily_prediction if already computed
        kaksha_score = results.get("daily_prediction", {}).get("kaksha_score", 0)
        # Get current mahadasha planet code
        # Keys from _build_current_dasha_from_astro: "mahadasha" and "antardasha"
        # Fallback to run_all_engines 'current_dasha' param if dict empty
        _PLANET_REV = {
            "Saturn":"Sa","Jupiter":"Ju","Mars":"Ma","Sun":"Su",
            "Moon":"Mo","Venus":"Ve","Mercury":"Me","Rahu":"Ra","Ketu":"Ke",
        }
        _raw_md = current_dasha_dict.get("mahadasha", "") if current_dasha_dict else current_dasha
        _raw_ad = current_dasha_dict.get("antardasha", "") if current_dasha_dict else ""
        cd_str = _PLANET_REV.get(_raw_md, _raw_md)
        ad_str = _PLANET_REV.get(_raw_ad, _raw_ad)
        # ... (तुम्हारा पुराना कोड जहाँ ashtakvarga_complete कॉल हो रहा है) ...

    
      # ── Dasha timeline — MD + AD + PD सब preserve ────────────
        _dasha_seq = []
        try:
            _PMAP = {
                "Sun":"Su","Moon":"Mo","Mars":"Ma","Mercury":"Me",
                "Jupiter":"Ju","Venus":"Ve","Saturn":"Sa","Rahu":"Ra","Ketu":"Ke",
                "सूर्य":"Su","चंद्र":"Mo","मंगल":"Ma","बुध":"Me",
                "गुरु":"Ju","शुक्र":"Ve","शनि":"Sa","राहु":"Ra","केतु":"Ke",
            }
            dasha_root = astro.get("dasha", {})
            raw_seq = (dasha_root.get("sequence") or dasha_root.get("timeline") or
                       dasha_root.get("all_mahadashas") or dasha_root.get("mahadasha_list") or
                       dasha_root.get("periods") or astro.get("dasha_timeline") or [])

            def _cvt(raw): return _PMAP.get(raw, raw) if raw else ""
            
            def _dates(d):
                s = d.get("start") or d.get("start_date") or d.get("from") or ""
                e = d.get("end")   or d.get("end_date")   or d.get("to")   or ""
                # अगर तारीखें न भी हों तो कम से कम स्ट्रिंग पास करें ताकि लॉजिक ब्रेक न हो
                return str(s), str(e)
                
            def _lord(d): return d.get("lord") or d.get("planet") or d.get("lord_hi") or d.get("name") or ""
            print("\n--- RAW FIRST MD DATA ---")
            print(raw_seq[0] if raw_seq else "No Data")
            print("-------------------------\n")
            for md in raw_seq:
                if not isinstance(md, dict): continue
                ml = _cvt(_lord(md)); ms, me = _dates(md)
                if not ml: continue
                
                ads = []
                # 🟢 FIX: API के अलग-अलग keys को चेक करें
                raw_ads = md.get("antardashas") or md.get("antardasha") or md.get("sub_periods") or md.get("periods") or []
                for ad in raw_ads:
                    if not isinstance(ad, dict): continue
                    al = _cvt(_lord(ad)); as_, ae = _dates(ad)
                    if not al: continue
                    
                    pds = []
                    # 🟢 FIX: Pratyantardasha के लिए भी अलग keys चेक करें
                    raw_pds = ad.get("pratyantardashas") or ad.get("pratyantardasha") or ad.get("sub_sub_periods") or ad.get("periods") or []
                    for pd in raw_pds:
                        if not isinstance(pd, dict): continue
                        pl_ = _cvt(_lord(pd)); ps, pe = _dates(pd)
                        if pl_:
                            pds.append({"lord":pl_,"start":ps,"end":pe})
                    
                    ads.append({"lord":al,"start":as_,"end":ae,"pratyantardashas":pds})
                _dasha_seq.append({"lord":ml,"start":ms,"end":me,"antardashas":ads})
                
        except Exception as e:
            print(f"Dasha Parse Error: {e}")
            _dasha_seq = []

        print(f"[BRIDGE] dasha count={len(_dasha_seq)}, ADs={len(_dasha_seq[0].get('antardashas', [])) if _dasha_seq else 0}")
        # ── Safe planet degree extraction ─────────────────────────
        def _safe_full_deg(p_code):
            """Returns full ecliptic degree or None — never fake 0"""
            p = astro.get(p_code, {})
            deg = p.get("Degree")
            return float(deg) if deg is not None else None

        results["av_sutras"] = compute_av_sutras(
            planets         = planets_dict,
            houses          = [],
            sav             = sav_points,
            bav_charts      = bav_charts,
            birth_year      = dob.year if dob else 0,
            current_dasha   = cd_str,
            transit_planets = transit_planets,
            kaksha_score    = kaksha_score,
            antardasha      = ad_str,
            dasha_timeline  = _dasha_seq,
            dob             = dob,
            lagna_sign      = lagna_rashi,
        )
    except Exception as e:
        results["av_sutras"] = {"computed": False, "error": str(e)}

    # ENGINE 11: Dasha + Shani Analysis (Batch 2)
    try:
        results["dasha_shani"] = compute_dasha_shani(
            planets             = planets_dict,
            sav                 = sav_points,
            bav_charts          = bav_charts,
            current_dasha       = current_dasha_dict,
            shani_transit_rashi = shani_transit_rashi,
            moon_rashi          = moon_rashi,
            transit_positions   = transit_planets,
        )
    except Exception as e:
        results["dasha_shani"] = {"computed": False, "error": str(e)}

    # ENGINE 12: Chandra-Surya Analysis (Batch 3)
    try:
        meta = astro.get("meta", {})
        results["chandra_surya"] = compute_chandra_surya(
            planets        = planets_dict,
            sav            = sav_points,
            bav_charts     = bav_charts,
            birth_tithi    = int(meta.get("tithi", 15)),
            janm_nakshatra = int(meta.get("nakshatra_index",
                             int(moon_degree / (360/27)) % 27)),
            sunrise_hour   = float(meta.get("sunrise", 6.0)),
            sunset_hour    = float(meta.get("sunset", 18.0)),
        )
    except Exception as e:
        results["chandra_surya"] = {"computed": False, "error": str(e)}

    # ENGINE 13: Advanced Yogas (Batch 4)
    try:
        # ── Chandra Lagna SAV: SAV rotate karke Moon's sign ko lagna maano ──
        # Moon jis sign mein hai, ussse rotate karo 12 values
        chandra_sav = sav_points[moon_rashi:] + sav_points[:moon_rashi]

        # ── Surya Lagna SAV: Sun's sign se rotate karo ──────────────────────
        sun_rashi    = planets_dict.get("Su", {}).get("rashi_index", 0)
        surya_sav    = sav_points[sun_rashi:] + sav_points[:sun_rashi]

        # ── Vivah Engine ──────────────────────────────────────────────
        try:
            from vivah_engine import compute_vivah
            _gender = astro.get("meta", {}).get("gender", "male")
            _tithi = int(astro.get("meta", {}).get("tithi", 15))
            results["vivah"] = compute_vivah(
                planets       = planets_dict,
                sav           = sav_points,
                bav_charts    = bav_charts,
                lagna_rashi   = lagna_rashi,
                gender        = _gender,
                current_dasha = current_dasha,
                birth_tithi   = _tithi,
            )
            print(f"[Vivah] ✅ {results['vivah'].get('saptam',{}).get('verdict','computed')}")
        except Exception as _ve:
            print(f"[Vivah] Error: {_ve}")
            results["vivah"] = {"computed": False, "error": str(_ve)}

        results["advanced_yogas"] = compute_advanced_yogas(
            planets              = planets_dict,
            sav                  = sav_points,
            bav_charts           = bav_charts,
            lagna_index          = lagna_rashi,
            moon_rashi           = moon_rashi,
            chandra_lagna_sav    = chandra_sav,   # ← NEW: Chandra Lagna SAV
            surya_lagna_sav      = surya_sav,     # ← NEW: Surya Lagna SAV
        )
    except Exception as e:
        results["advanced_yogas"] = {"computed": False, "error": str(e)}

    return results