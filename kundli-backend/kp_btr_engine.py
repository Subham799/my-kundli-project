"""
kp_btr_engine.py
═══════════════════════════════════════════════════════
KP (Krishnamurti Paddhati) + CIL + D24 BTR Engine

2 Methods:
1. CIL (Cuspal Interlinks) — Chandra NL ↔ Lagna SSL
2. D24 Matrukaraka — 4th highest degree planet in D24 5th house

Input: astro dict (from calculate_astrology in api.py)
Output: kp_btr result dict
═══════════════════════════════════════════════════════
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# ══════════════════════════════════════════════════════
# CONSTANTS
# ══════════════════════════════════════════════════════

# Vimshottari dasha sequence & years
DASHA_SEQUENCE = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"]
DASHA_YEARS    = {"Ke":7, "Ve":20, "Su":6, "Mo":10, "Ma":7, "Ra":18, "Ju":16, "Sa":19, "Me":17}
TOTAL_YEARS    = 120  # Vimshottari total

NAKSHATRA_SIZE = 360 / 27  # 13.3333°

# Nakshatra lords (1-27, starting from Ashwini)
NAK_LORDS = [
    "Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me",  # 1-9
    "Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me",  # 10-18
    "Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me",  # 19-27
]

# Rashi lords
SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]

RASHI_NAMES = [
    "मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
    "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"
]

PLANET_HINDI = {
    "Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध",
    "Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"
}

# ══════════════════════════════════════════════════════
# KP HELPER — Sign/Star/Sub/SSL nikalo
# ══════════════════════════════════════════════════════

def get_kp_lords(degree: float) -> dict:
    """
    Kisi bhi degree ke liye KP 4 lords nikalo.
    Sign Lord, Star Lord, Sub Lord, Sub-Sub Lord
    """
    degree = degree % 360

    # Sign Lord
    sign_idx  = int(degree / 30)
    sign_lord = SIGN_LORDS[sign_idx]

    # Nakshatra (Star) Lord
    nak_idx   = int(degree / NAKSHATRA_SIZE)  # 0-26
    star_lord = NAK_LORDS[nak_idx]

    # Remainder within nakshatra
    nak_start   = nak_idx * NAKSHATRA_SIZE
    remainder   = degree - nak_start  # 0 to 13.333°

    # Sub Lord — start from star lord in dasha sequence
    star_idx_in_seq = DASHA_SEQUENCE.index(star_lord)
    sub_lord, ssl   = _find_sub_and_ssl(remainder, star_idx_in_seq)

    return {
        "sign_lord": sign_lord,
        "star_lord": star_lord,
        "sub_lord":  sub_lord,
        "ssl":       ssl,
        "sign_idx":  sign_idx,
        "nak_idx":   nak_idx + 1,  # 1-27
        "degree":    round(degree, 4),
    }


def _find_sub_and_ssl(remainder: float, start_idx: int) -> tuple:
    """
    Remainder (0 to 13.333°) ke andar Sub Lord aur SSL nikalo.
    start_idx = nakshatra lord ka DASHA_SEQUENCE mein index
    """
    accumulated = 0.0
    sub_lord    = None
    sub_start   = 0.0
    sub_portion = 0.0

    # Sub Lord find karo
    for i in range(9):
        planet = DASHA_SEQUENCE[(start_idx + i) % 9]
        portion = (DASHA_YEARS[planet] / TOTAL_YEARS) * NAKSHATRA_SIZE
        if accumulated + portion > remainder:
            sub_lord    = planet
            sub_start   = accumulated
            sub_portion = portion
            break
        accumulated += portion

    if sub_lord is None:
        sub_lord    = DASHA_SEQUENCE[(start_idx + 8) % 9]
        sub_start   = accumulated - sub_portion
        sub_portion = (DASHA_YEARS[sub_lord] / TOTAL_YEARS) * NAKSHATRA_SIZE

    # SSL find karo — sub lord se start
    sub_idx_in_seq = DASHA_SEQUENCE.index(sub_lord)
    ssl_remainder  = remainder - sub_start
    ssl_accum      = 0.0
    ssl            = None

    for i in range(9):
        planet      = DASHA_SEQUENCE[(sub_idx_in_seq + i) % 9]
        ssl_portion = (DASHA_YEARS[planet] / TOTAL_YEARS) * sub_portion
        if ssl_accum + ssl_portion > ssl_remainder:
            ssl = planet
            break
        ssl_accum += ssl_portion

    if ssl is None:
        ssl = DASHA_SEQUENCE[(sub_idx_in_seq + 8) % 9]

    return sub_lord, ssl


# ══════════════════════════════════════════════════════
# CIL CHECK
# ══════════════════════════════════════════════════════

def _check_cil_connection(moon_star_lord: str, lagna_ssl: str, astro: dict) -> dict:
    """
    CIL Rule: Chandra NL ↔ Lagna SSL connection hona chahiye
    Direct: Same planet
    Indirect: SSL ka Sub/Star lord = Moon NL
    """
    # Direct connection
    if moon_star_lord == lagna_ssl:
        return {
            "connected": True,
            "type": "direct",
            "detail": f"{PLANET_HINDI.get(moon_star_lord, moon_star_lord)} = Chandra NL = Lagna SSL (Direct Match)"
        }

    # Indirect — SSL planet ki position dekho
    ssl_planet_data = astro.get(lagna_ssl)
    if ssl_planet_data:
        ssl_degree = ssl_planet_data.get("Degree", 0)
        ssl_lords  = get_kp_lords(ssl_degree)

        # SSL ka star lord ya sub lord = moon_star_lord?
        if ssl_lords["star_lord"] == moon_star_lord:
            return {
                "connected": True,
                "type": "indirect",
                "detail": f"{PLANET_HINDI.get(lagna_ssl, lagna_ssl)} (SSL) ka Star Lord = {PLANET_HINDI.get(moon_star_lord, moon_star_lord)} (Chandra NL)"
            }
        if ssl_lords["sub_lord"] == moon_star_lord:
            return {
                "connected": True,
                "type": "indirect",
                "detail": f"{PLANET_HINDI.get(lagna_ssl, lagna_ssl)} (SSL) ka Sub Lord = {PLANET_HINDI.get(moon_star_lord, moon_star_lord)} (Chandra NL)"
            }

        # SSL aur Moon NL same sign mein hain?
        moon_nl_data = astro.get(moon_star_lord)
        if moon_nl_data and ssl_planet_data:
            ssl_sign  = int(ssl_planet_data["Degree"] / 30)
            moon_sign = int(moon_nl_data["Degree"] / 30)
            if ssl_sign == moon_sign:
                return {
                    "connected": True,
                    "type": "indirect",
                    "detail": f"{PLANET_HINDI.get(lagna_ssl, lagna_ssl)} (SSL) aur {PLANET_HINDI.get(moon_star_lord, moon_star_lord)} (Chandra NL) ek hi rashi mein — Conjunction"
                }

    return {
        "connected": False,
        "type": "none",
        "detail": f"Koi connection nahi — {PLANET_HINDI.get(lagna_ssl, lagna_ssl)} (SSL) aur {PLANET_HINDI.get(moon_star_lord, moon_star_lord)} (Chandra NL)"
    }


def compute_cil(astro: dict) -> dict:
    """
    CIL (Cuspal Interlinks) BTR check.
    astro = calculate_astrology() ka output
    """
    try:
        lagna_deg  = astro["La"]["Degree"]
        moon_deg   = astro["Mo"]["Degree"]

        lagna_lords = get_kp_lords(lagna_deg)
        moon_lords  = get_kp_lords(moon_deg)

        moon_star_lord = moon_lords["star_lord"]
        lagna_ssl      = lagna_lords["ssl"]

        connection = _check_cil_connection(moon_star_lord, lagna_ssl, astro)

        return {
            "computed": True,
            "lagna_degree": round(lagna_deg, 4),
            "lagna_lords": {
                "sign_lord": lagna_lords["sign_lord"],
                "star_lord": lagna_lords["star_lord"],
                "sub_lord":  lagna_lords["sub_lord"],
                "ssl":       lagna_lords["ssl"],
            },
            "moon_degree": round(moon_deg, 4),
            "moon_lords": {
                "sign_lord": moon_lords["sign_lord"],
                "star_lord": moon_lords["star_lord"],
                "sub_lord":  moon_lords["sub_lord"],
            },
            "chandra_nak_lord":  moon_star_lord,
            "lagna_ssl":         lagna_ssl,
            "cil_connected":     connection["connected"],
            "connection_type":   connection["type"],
            "connection_detail": connection["detail"],
            "verdict": "✅ CIL PASS — जन्म समय सटीक" if connection["connected"] else "❌ CIL FAIL — समय में सुधार जरूरी",
        }

    except Exception as e:
        return {"computed": False, "error": str(e)}


# ══════════════════════════════════════════════════════
# D24 MATRUKARAKA METHOD
# ══════════════════════════════════════════════════════

def compute_d24_matrukaraka(astro: dict) -> dict:
    """
    D24 Matrukaraka BTR method.
    1. 7 planets mein se 4th highest degree = Matrukaraka
    2. D24 mein 5th house ya 5th lord se sambandh check karo
    """
    try:
        # Step 1: 7 planets ki sign degrees nikalo (Rahu/Ketu exclude)
        planets_7 = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]
        planet_degrees = {}
        for p in planets_7:
            if p in astro:
                planet_degrees[p] = astro[p]["SignDegree"]  # 0-30 within sign

        # Sort by degree descending
        sorted_planets = sorted(planet_degrees.items(), key=lambda x: x[1], reverse=True)

        if len(sorted_planets) < 4:
            return {"computed": False, "error": "4 planets nahi mile"}

        matrukaraka_code   = sorted_planets[3][0]   # 4th highest
        matrukaraka_degree = sorted_planets[3][1]

        # Step 2: D24 Lagna nikalo
        lagna_deg     = astro["La"]["Degree"]
        d24_lagna_idx = astro["La"]["Vargas"]["D24"]["Idx"]  # 0-11

        # Step 3: Matrukaraka ka D24 sign nikalo
        mk_full_degree  = astro[matrukaraka_code]["Degree"]
        mk_d24_idx      = astro[matrukaraka_code]["Vargas"]["D24"]["Idx"]

        # Step 4: 5th house from D24 lagna
        d24_5th_house_idx = (d24_lagna_idx + 4) % 12  # 5th = lagna + 4
        d24_5th_lord      = SIGN_LORDS[d24_5th_house_idx]

        # Step 5: Matrukaraka D24 mein kahan hai
        mk_bhav_in_d24 = (mk_d24_idx - d24_lagna_idx) % 12 + 1  # 1-12

        # Step 6: Connection check
        connected      = False
        connection_type = ""

        # Direct: MK D24 mein 5th house mein
        if mk_bhav_in_d24 == 5:
            connected       = True
            connection_type = f"सीधा — {PLANET_HINDI.get(matrukaraka_code, matrukaraka_code)} D24 के 5वें भाव में"

        # Lord: MK khud 5th lord hai
        elif matrukaraka_code == d24_5th_lord:
            connected       = True
            connection_type = f"स्वामी — {PLANET_HINDI.get(matrukaraka_code, matrukaraka_code)} D24 का 5वां स्वामी है"

        # Aspect: MK 5th house ko dekh raha hai (7th aspect from 11th, etc.)
        else:
            # 7th drishti check
            mk_7th_from = (mk_d24_idx + 6) % 12  # 7th from MK
            if mk_7th_from == d24_5th_house_idx:
                connected       = True
                connection_type = f"दृष्टि — {PLANET_HINDI.get(matrukaraka_code, matrukaraka_code)} 5वें भाव को देख रहा है"

        # Direction hint (agar fail hua)
        direction_hint = ""
        if not connected:
            # Rule: 2,3,4,9,10 → time peeche; 1,6,7,8,12 → time aage
            backward_bhav = {2, 3, 4, 9, 10}
            forward_bhav  = {1, 6, 7, 8, 12}
            if mk_bhav_in_d24 in backward_bhav:
                direction_hint = "⬅️ समय पीछे करें (Backward)"
            elif mk_bhav_in_d24 in forward_bhav:
                direction_hint = "➡️ समय आगे करें (Forward)"

        return {
            "computed": True,
            "matrukaraka": matrukaraka_code,
            "matrukaraka_hindi": PLANET_HINDI.get(matrukaraka_code, matrukaraka_code),
            "matrukaraka_sign_degree": round(matrukaraka_degree, 2),
            "planet_degrees_ranked": [
                {"planet": p, "planet_hindi": PLANET_HINDI.get(p, p), "degree": round(d, 2), "rank": i+1}
                for i, (p, d) in enumerate(sorted_planets)
            ],
            "d24_lagna_idx": d24_lagna_idx,
            "d24_lagna_rashi": RASHI_NAMES[d24_lagna_idx],
            "d24_5th_house_rashi": RASHI_NAMES[d24_5th_house_idx],
            "d24_5th_lord": d24_5th_lord,
            "d24_5th_lord_hindi": PLANET_HINDI.get(d24_5th_lord, d24_5th_lord),
            "mk_d24_rashi": RASHI_NAMES[mk_d24_idx],
            "mk_bhav_in_d24": mk_bhav_in_d24,
            "d24_connected": connected,
            "connection_type": connection_type,
            "direction_hint": direction_hint,
            "verdict": "✅ D24 PASS — जन्म समय सटीक" if connected else f"❌ D24 FAIL — {direction_hint}",
        }

    except Exception as e:
        return {"computed": False, "error": str(e)}


# ══════════════════════════════════════════════════════
# MAIN FUNCTION — dono methods ek saath
# ══════════════════════════════════════════════════════

def compute_kp_btr(astro: dict) -> dict:
    """
    Main function — CIL + D24 dono calculate karo.
    astro = api.py ka calculate_astrology() output
    """
    cil_result = compute_cil(astro)
    d24_result = compute_d24_matrukaraka(astro)

    # Overall verdict
    cil_pass = cil_result.get("cil_connected", False)
    d24_pass = d24_result.get("d24_connected", False)

    if cil_pass and d24_pass:
        overall = "✅✅ दोनों विधियाँ PASS — जन्म समय 100% सटीक"
        score   = 100
    elif cil_pass or d24_pass:
        overall = "✅ एक विधि PASS — जन्म समय संभवतः सही"
        score   = 60
    else:
        overall = "❌ दोनों विधियाँ FAIL — समय में सुधार जरूरी"
        score   = 0

    return {
        "computed":       True,
        "overall_verdict": overall,
        "overall_score":   score,
        "cil":            cil_result,
        "d24_matrukaraka": d24_result,
    }


# ══════════════════════════════════════════════════════
# AUTO-RECTIFICATION ENGINE
# ══════════════════════════════════════════════════════

def _get_lagna_degree_at_offset(base_lagna_deg: float, offset_minutes: float) -> float:
    """
    Lagna ±offset minutes par kahan hogi.
    Lagna 1° per 4 minutes chalti hai = 0.25°/min
    """
    delta = offset_minutes * 0.25  # degrees
    return (base_lagna_deg + delta) % 360


def _get_d24_idx_from_degree(degree: float) -> int:
    """
    Kisi bhi lagna degree se D24 lagna idx nikalo.
    Same formula as api.py get_all_vargas D24
    """
    sign = int(degree / 30)
    rem  = degree % 30
    d24  = ((4 if sign % 2 == 0 else 3) + int(rem / 1.25)) % 12
    return d24


def _check_both_methods(lagna_deg: float, astro_static: dict, candidate_astro: Optional[dict] = None) -> dict:
    """
    Ek specific lagna degree par CIL + D24 dono check karo.
    astro_static = original astro dict (planets move nahi karte ±30 min mein)
    """
    # Temporary astro with new lagna degree
    import copy
    # If the API supplied a chart recalculated for the exact candidate minute,
    # use it. Otherwise preserve the existing fast lagna-only approximation.
    astro_temp = copy.deepcopy(candidate_astro if candidate_astro is not None else astro_static)
    astro_temp["La"]["Degree"]      = lagna_deg
    astro_temp["La"]["SignDegree"]  = lagna_deg % 30

    # D24 update is derived from the candidate Lagna degree.
    d24_idx = _get_d24_idx_from_degree(lagna_deg)
    astro_temp["La"].setdefault("Vargas", {})["D24"] = {"Idx": d24_idx, "Name": RASHI_NAMES[d24_idx]}

    # Lightweight candidate snapshots intentionally contain only degrees.
    # Materialize the D24 index lazily so the D24 checker never needs a full
    # calculate_astrology() result.
    for _p in ("Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"):
        if _p in astro_temp:
            _pd = astro_temp[_p]
            _deg = float(_pd.get("Degree", 0.0))
            _pd.setdefault("SignDegree", _deg % 30.0)
            _pd.setdefault("Vargas", {})["D24"] = {
                "Idx": _get_d24_idx_from_degree(_deg),
                "Name": RASHI_NAMES[_get_d24_idx_from_degree(_deg)],
            }

    cil = compute_cil(astro_temp)
    d24 = compute_d24_matrukaraka(astro_temp)

    return {
        "lagna_deg":   round(lagna_deg, 4),
        "cil_pass":    cil.get("cil_connected", False),
        "d24_pass":    d24.get("d24_connected", False),
        "both_pass":   cil.get("cil_connected", False) and d24.get("d24_connected", False),
        "cil_detail":  cil.get("connection_detail", ""),
        "d24_detail":  d24.get("connection_type", ""),
        "cil_ssl":     cil.get("lagna_ssl", ""),
        "d24_mk_bhav": d24.get("mk_bhav_in_d24", 0),
    }


def auto_rectify(astro: dict, search_range_minutes: int = 30, birth_datetime: Optional[datetime] = None, candidate_charts: Optional[Dict[int, dict]] = None) -> dict:
    """
    SMART AUTO-RECTIFICATION:
    ±search_range_minutes ke har minute ko lightweight candidate data se evaluate karo.
    Full kundli engine ko repeat na karo. Passing windows ko rank karke original
    birth time ke against ek stable absolute recommendation do.

    Returns:
    - rectified_offset: kitne minutes adjust kiye (+ aage, - peeche)
    - rectified_lagna: sahi lagna degree
    - all_results: har minute ka result
    - best_match: sabse best time
    - all_results: every minute with actual candidate clock time and condition status
    - pass_windows: contiguous ranges for BOTH/CIL-only/D24-only/FAIL
    """
    base_lagna = astro["La"]["Degree"]

    all_results     = []
    both_pass_times = []
    cil_only_times  = []
    d24_only_times  = []

    # ±30 minutes, har 1 minute par check
    for offset in range(-search_range_minutes, search_range_minutes + 1):
        candidate_dt = (birth_datetime + timedelta(minutes=offset)) if birth_datetime is not None else None
        candidate_astro = candidate_charts.get(offset) if candidate_charts else None
        if candidate_astro is not None:
            new_lagna = candidate_astro["La"]["Degree"]
        else:
            new_lagna = _get_lagna_degree_at_offset(base_lagna, offset)
        result    = _check_both_methods(new_lagna, astro, candidate_astro=candidate_astro)
        result["offset_minutes"] = offset
        result["candidate_time"] = candidate_dt.strftime("%H:%M") if candidate_dt else None
        result["candidate_time_12h"] = candidate_dt.strftime("%I:%M %p") if candidate_dt else None
        result["candidate_datetime"] = candidate_dt.isoformat(timespec="minutes") if candidate_dt else None
        if candidate_astro is not None:
            result["calculation_mode"] = "exact"
        else:
            result["calculation_mode"] = "lagna_estimate"

        # Time string
        all_results.append(result)

        if result["both_pass"]:
            both_pass_times.append(result)
        elif result["cil_pass"]:
            cil_only_times.append(result)
        elif result["d24_pass"]:
            d24_only_times.append(result)

    # All both_pass windows
    # Categorize every minute. This is intentionally exhaustive so the UI can
    # show the user every candidate instead of forcing manual +/- time checks.
    def _category(r):
        if r["both_pass"]:
            return "both_pass"
        if r["cil_pass"]:
            return "cil_only"
        if r["d24_pass"]:
            return "d24_only"
        return "fail"

    def _group_ranges(rows):
        if not rows:
            return []
        rows = sorted(rows, key=lambda x: x["offset_minutes"])
        groups = []
        start = prev = rows[0]
        for row in rows[1:]:
            if row["offset_minutes"] == prev["offset_minutes"] + 1:
                prev = row
            else:
                groups.append({"start_offset": start["offset_minutes"], "end_offset": prev["offset_minutes"],
                               "start_time": start.get("candidate_time_12h"), "end_time": prev.get("candidate_time_12h"),
                               "count": prev["offset_minutes"] - start["offset_minutes"] + 1})
                start = prev = row
        groups.append({"start_offset": start["offset_minutes"], "end_offset": prev["offset_minutes"],
                       "start_time": start.get("candidate_time_12h"), "end_time": prev.get("candidate_time_12h"),
                       "count": prev["offset_minutes"] - start["offset_minutes"] + 1})
        return groups

    categorized = {"both_pass": [], "cil_only": [], "d24_only": [], "fail": []}
    for row in all_results:
        categorized[_category(row)].append(row)

    condition_windows = {
        key: _group_ranges(rows) for key, rows in categorized.items()
    }

    def _pick_stable(rows):
        if not rows:
            return None

        # Never replace the supplied birth time when it itself passes.
        original = next((r for r in rows if r["offset_minutes"] == 0), None)
        if original is not None:
            return original

        groups = condition_windows["both_pass"] if rows is both_pass_times else (
            condition_windows["cil_only"] if rows is cil_only_times else condition_windows["d24_only"]
        )
        if not groups:
            return None

        # Otherwise choose the nearest matching window; width is only a tie-breaker.
        ranked = sorted(groups, key=lambda g: (
            min(abs(g["start_offset"]), abs(g["end_offset"])),
            -g["count"],
        ))
        g = ranked[0]
        inside = [r for r in rows if g["start_offset"] <= r["offset_minutes"] <= g["end_offset"]]
        return min(inside, key=lambda r: abs(r["offset_minutes"]))

    original_result = next((r for r in all_results if r["offset_minutes"] == 0), None)

    if both_pass_times:
        best = _pick_stable(both_pass_times)
        verdict = "✅✅ CIL + D24 दोनों PASS — एक स्थिर समय-खिड़की मिली"
        confidence = 100
    elif cil_only_times:
        best = _pick_stable(cil_only_times)
        verdict = "✅ CIL PASS (D24 pending) — सबसे स्थिर उपलब्ध विंडो"
        confidence = 60
    elif d24_only_times:
        best = _pick_stable(d24_only_times)
        verdict = "✅ D24 PASS (CIL pending) — सबसे स्थिर उपलब्ध विंडो"
        confidence = 60
    else:
        best = {"offset_minutes": 0, "lagna_deg": base_lagna, "cil_pass": False, "d24_pass": False}
        verdict = "❌ ±30 min में कोई match नहीं मिला"
        confidence = 0

    both_windows = [
        {
            "offset": r["offset_minutes"],
            "lagna":  round(r["lagna_deg"], 3),
            "cil":    r["cil_detail"],
            "d24":    r["d24_detail"],
        }
        for r in both_pass_times
    ]

    return {
        "computed":            True,
        "base_lagna":          round(base_lagna, 4),
        "best_offset_minutes": best["offset_minutes"],
        "best_lagna_degree":   round(best.get("lagna_deg", base_lagna), 4),
        "best_cil_pass":       best.get("cil_pass", False),
        "best_d24_pass":       best.get("d24_pass", False),
        "verdict":             verdict,
        "confidence":          confidence,
        "both_pass_windows":   both_windows,
        "correct_times": [
            {
                "offset_minutes": r["offset_minutes"],
                "candidate_time": r.get("candidate_time"),
                "candidate_time_12h": r.get("candidate_time_12h"),
                "lagna_deg": r.get("lagna_deg"),
                "cil_pass": True,
                "d24_pass": True,
                "both_pass": True,
            }
            for r in both_pass_times
        ],
        "original_time_result": original_result,
        "original_time_pass": bool(original_result and original_result.get("both_pass")),
        "all_pass_times": [
            {
                "offset_minutes": r["offset_minutes"],
                "candidate_time": r.get("candidate_time"),
                "candidate_time_12h": r.get("candidate_time_12h"),
                "cil_pass": r.get("cil_pass", False),
                "d24_pass": r.get("d24_pass", False),
                "both_pass": r.get("both_pass", False),
                "status": _category(r),
            }
            for r in all_results if r.get("cil_pass") or r.get("d24_pass")
        ],
        "all_results":          all_results,
        "condition_windows":    condition_windows,
        "total_checked":        len(all_results),
        "calculation_mode":     "smart_lightweight" if candidate_charts else "lagna_estimate",
        "recommendation_mode":  "stable_window_then_nearest",
        "total_both_pass":     len(both_pass_times),
        "total_cil_only":      len(cil_only_times),
        "total_d24_only":      len(d24_only_times),
        "search_range":        f"±{search_range_minutes} minutes",
    }


# ══════════════════════════════════════════════════════
# UPDATED MAIN FUNCTION — auto-rectification included
# ══════════════════════════════════════════════════════

def compute_kp_btr_full(astro: dict, birth_datetime: Optional[datetime] = None, candidate_charts: Optional[Dict[int, dict]] = None) -> dict:
    """
    Complete KP BTR:
    1. Current time par CIL + D24 check
    2. Agar fail → auto-rectify karo
    3. Best time suggest karo
    """
    # Step 1: Current time check
    current = compute_kp_btr(astro)

    # Step 2: Auto-rectification
    rectification = auto_rectify(astro, search_range_minutes=30, birth_datetime=birth_datetime, candidate_charts=candidate_charts)

    # Step 3: Final verdict
    current_pass = current.get("overall_score", 0) == 100

    if current_pass:
        final_verdict = "✅ दिया गया समय बिल्कुल सही है"
        time_adjustment = "0 मिनट — कोई बदलाव नहीं"
    elif rectification.get("original_time_pass"):
        final_verdict = "✅ दिया गया समय बिल्कुल सही है"
        time_adjustment = "0 मिनट — कोई बदलाव नहीं"
    else:
        offset = rectification["best_offset_minutes"]
        if birth_datetime is not None:
            recommended_dt = birth_datetime + timedelta(minutes=offset)
            time_adjustment = (
                f"निर्धारित समय: {recommended_dt.strftime('%I:%M %p')} "
                f"({offset:+d} min from original)"
            )
        elif offset > 0:
            time_adjustment = f"निर्धारित समय: +{offset} मिनट"
        elif offset < 0:
            time_adjustment = f"निर्धारित समय: {offset} मिनट"
        else:
            time_adjustment = "निर्धारित समय: मूल समय"
        final_verdict = rectification["verdict"]

    return {
        "computed":         True,
        "current_check":    current,
        "rectification":    rectification,
        "final_verdict":    final_verdict,
        "time_adjustment":  time_adjustment,
        "confidence":       rectification["confidence"],
        "both_pass_windows": rectification["both_pass_windows"],
    }