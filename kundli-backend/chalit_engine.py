"""
chalit_engine.py — Exact Shripati Bhav Chalit Engine
═══════════════════════════════════════════════════════════════════
Production-grade Vedic Jyotish engine.

Method   : Shripati Paddhati (strict)
Ayanamsa : Lahiri (Sidereal)
Library  : pyswisseph

Core logic:
  1. ASC + MC from swe.houses_ex (FLG_SIDEREAL)
  2. 4 Kendras  : 1st=ASC, 10th=MC, 7th=ASC+180, 4th=MC+180
  3. Trisection : Each quadrant split into 3 equal arcs → 12 Madhyas
  4. Sandhis    : Midpoint between consecutive Madhyas → 12 boundaries
  5. Placement  : Planet degree vs Sandhi boundaries (circular)
  6. Detection  : Bhav Sandhi (±1° of boundary) | Rashi Sandhi (0°/30°)
  7. Comparison : D1 house vs Chalit house

Public API:
  get_bhav_chalit(julian_day, lat, lon, planets_d1)  → main function
  compute_shripati_houses(julian_day, lat, lon)       → raw house data
  compare_d1_chalit(planets_d1, chalit_planets)       → diff report
  build_chalit_for_api(dt_local, lat, lon, astro)     → Flask wrapper
═══════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
import swisseph as swe
from typing import Dict, List, Tuple, Any


# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — GEOMETRY HELPERS
# ═══════════════════════════════════════════════════════════════════

def angular_distance(a: float, b: float) -> float:
    """
    Signed angular distance from a → b on the ecliptic circle.
    Result is in (-180, +180].
    Positive = b is ahead of a (zodiac / counter-clockwise direction).
    """
    diff = (b - a) % 360.0
    return diff if diff <= 180.0 else diff - 360.0


def midpoint(a: float, b: float) -> float:
    """
    True circular midpoint between a and b (result in [0, 360)).
    Handles 359° → 1° wrap correctly.
    """
    diff = (b - a) % 360.0
    return (a + diff / 2.0) % 360.0


def normalize(deg: float) -> float:
    """Force a degree value into [0, 360)."""
    return deg % 360.0


def is_between_circular(start: float, end: float, point: float) -> bool:
    """
    True if `point` lies in arc [start, end) going in zodiac direction.
    Handles 360° wrap correctly.
    """
    start = normalize(start)
    end   = normalize(end)
    point = normalize(point)
    if start < end:
        return start <= point < end
    else:                           # arc crosses 0° (e.g. 350° → 20°)
        return point >= start or point < end


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — SHRIPATI HOUSE COMPUTATION
# ═══════════════════════════════════════════════════════════════════

def compute_shripati_houses(
    julian_day: float,
    lat: float,
    lon: float,
) -> Dict[str, Any]:
    """
    Compute all 12 Bhav Madhyas and Bhav Sandhis — strict Shripati Paddhati.

    Parameters
    ----------
    julian_day : Julian Day UT of birth moment
    lat        : Geographic latitude  (+N, -S)
    lon        : Geographic longitude (+E, -W)

    Returns
    -------
    {
        "asc"     : float            — Ascendant (1st Madhya)
        "mc"      : float            — MC (10th Madhya)
        "madhyas" : List[float]      — 12 Bhav Madhya degrees (index 0 = Bhav 1)
        "sandhis" : List[float]      — 12 Bhav Sandhi (start boundary, index 0 = Bhav 1)
        "houses"  : List[Dict]       — Structured house table for JSON output
    }
    """
    # ── Step 1: Sidereal mode + ASC/MC via Swiss Ephemeris ─────────
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    # houses_ex with FLG_SIDEREAL returns sidereal ASC and MC directly.
    # We use Placidus ('P') only to extract ASC & MC — Shripati cusps
    # are computed manually from these two points (not from Placidus cusps).
    _, ascmc = swe.houses_ex(julian_day, lat, lon, b'P', swe.FLG_SIDEREAL)

    asc = normalize(ascmc[0])   # Lagna = 1st Bhav Madhya
    mc  = normalize(ascmc[1])   # MC    = 10th Bhav Madhya

    # ── Step 2: 4 Kendra Madhyas ────────────────────────────────────
    m1  = asc
    m10 = mc
    m7  = normalize(asc + 180.0)
    m4  = normalize(mc  + 180.0)

    # ── Step 3: Trisection — each quadrant → 3 equal arcs ──────────
    #
    # Quadrant 1→4 : contains Bhavs 1, 2, 3
    arc14 = angular_distance(m1, m4)      # signed: always positive here
    m2 = normalize(m1 + arc14 / 3.0)
    m3 = normalize(m1 + arc14 * 2.0 / 3.0)

    # Quadrant 4→7 : contains Bhavs 4, 5, 6
    arc47 = angular_distance(m4, m7)
    m5 = normalize(m4 + arc47 / 3.0)
    m6 = normalize(m4 + arc47 * 2.0 / 3.0)

    # Quadrant 7→10 : contains Bhavs 7, 8, 9
    arc710 = angular_distance(m7, m10)
    m8 = normalize(m7 + arc710 / 3.0)
    m9 = normalize(m7 + arc710 * 2.0 / 3.0)

    # Quadrant 10→1 : contains Bhavs 10, 11, 12
    arc101 = angular_distance(m10, m1)
    m11 = normalize(m10 + arc101 / 3.0)
    m12 = normalize(m10 + arc101 * 2.0 / 3.0)

    # Ordered list: index 0 = Bhav 1 ... index 11 = Bhav 12
    madhyas: List[float] = [
        m1, m2, m3, m4, m5, m6,
        m7, m8, m9, m10, m11, m12
    ]

    # ── Step 4: Bhav Sandhis (start boundary of each bhav) ──────────
    # Sandhi of Bhav N = midpoint(Madhya[N-2], Madhya[N-1])  (1-based)
    # i.e. for Bhav 1: midpoint(Madhya[12], Madhya[1])
    sandhis: List[float] = []
    for i in range(12):
        prev_m = madhyas[(i - 1) % 12]
        curr_m = madhyas[i]
        sandhis.append(midpoint(prev_m, curr_m))

    # ── Step 5: Structured output ────────────────────────────────────
    houses_out: List[Dict] = []
    for i in range(12):
        houses_out.append({
            "house"  : i + 1,
            "madhya" : round(madhyas[i], 6),
            "start"  : round(sandhis[i], 6),                 # Sandhi = start
            "end"    : round(sandhis[(i + 1) % 12], 6),      # next Sandhi = end
        })

    return {
        "asc"     : round(asc, 6),
        "mc"      : round(mc,  6),
        "madhyas" : [round(m, 6) for m in madhyas],
        "sandhis" : [round(s, 6) for s in sandhis],
        "houses"  : houses_out,
    }


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — PLANET PLACEMENT
# ═══════════════════════════════════════════════════════════════════

# Default orbs — can be overridden in get_bhav_chalit()
_BHAV_SANDHI_ORB  = 1.0   # degrees
_RASHI_SANDHI_ORB = 1.0   # degrees

PLANET_HINDI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध",
    "Ju": "गुरु",  "Ve": "शुक्र", "Sa": "शनि",
    "Ra": "राहु",  "Ke": "केतु",  "La": "लग्न",
}
PLANET_ENGLISH = {
    "Su": "Sun",     "Mo": "Moon",    "Ma": "Mars",
    "Me": "Mercury", "Ju": "Jupiter", "Ve": "Venus",
    "Sa": "Saturn",  "Ra": "Rahu",    "Ke": "Ketu",
    "La": "Lagna",
}


def _assign_house(planet_deg: float, sandhis: List[float]) -> int:
    """
    Place a planet into one of 12 bhavs using Sandhi boundaries.
    Returns bhav number 1–12.
    """
    planet_deg = normalize(planet_deg)
    for i in range(12):
        start = sandhis[i]
        end   = sandhis[(i + 1) % 12]
        if is_between_circular(start, end, planet_deg):
            return i + 1

    # Fallback: nearest sandhi (should not normally reach here)
    min_dist = 999.0
    nearest  = 1
    for i, s in enumerate(sandhis):
        d = abs(angular_distance(planet_deg, s))
        if d < min_dist:
            min_dist = d
            nearest  = i + 1
    return nearest


def _check_bhav_sandhi(
    planet_deg: float,
    sandhis: List[float],
    orb: float = _BHAV_SANDHI_ORB,
) -> Tuple[bool, int, float]:
    """
    Check if planet is within `orb` degrees of any Bhav Sandhi.

    Returns
    -------
    (is_sandhi: bool, nearest_house: int, distance_deg: float)
    """
    planet_deg = normalize(planet_deg)
    min_dist   = 999.0
    nearest_h  = 0
    for i, s in enumerate(sandhis):
        dist = abs(angular_distance(planet_deg, s))
        if dist < min_dist:
            min_dist  = dist
            nearest_h = i + 1       # house whose START sandhi is nearest
    return (min_dist <= orb, nearest_h, round(min_dist, 4))


def _check_rashi_sandhi(
    planet_deg: float,
    orb: float = _RASHI_SANDHI_ORB,
) -> bool:
    """
    True if planet is within `orb` degrees of a rashi boundary (0°, 30°, ...).
    """
    deg_in_sign = planet_deg % 30.0
    return deg_in_sign < orb or deg_in_sign > (30.0 - orb)


def place_planets(
    planets_d1: Dict[str, Dict],
    sandhis: List[float],
    madhyas: List[float],
    bhav_orb:  float = _BHAV_SANDHI_ORB,
    rashi_orb: float = _RASHI_SANDHI_ORB,
) -> List[Dict[str, Any]]:
    """
    Place all planets into Chalit bhavs and compute sandhi flags.

    Parameters
    ----------
    planets_d1 : {
        "Su": {"Degree": 123.45, "house": 5},  # house = D1 rashi-based
        ...
    }
    sandhis    : 12 Bhav Sandhi degrees
    madhyas    : 12 Bhav Madhya degrees
    bhav_orb   : Orb for Bhav Sandhi detection (degrees)
    rashi_orb  : Orb for Rashi Sandhi detection (degrees)

    Returns
    -------
    List of dicts — one per planet with full chalit placement info.
    """
    result: List[Dict] = []

    for code, p_data in planets_d1.items():
        # ── Degree validation ─────────────────────────────────────
        deg = float(p_data.get("Degree") or p_data.get("degree_float") or 0.0)

        # Guard: SignDegree (0-30) passed instead of full ecliptic degree
        if 0.0 < deg < 30.0:
            sign_idx = p_data.get("sign_idx", p_data.get("rashi_index", -1))
            if isinstance(sign_idx, int) and sign_idx >= 0:
                deg = sign_idx * 30.0 + deg
                print(f"[Chalit] ⚠️ {code}: SignDegree converted "
                      f"(sign_idx={sign_idx} → {deg:.3f}°)")

        deg = normalize(deg)

        # ── Chalit house assignment ───────────────────────────────
        chalit_house = _assign_house(deg, sandhis)

        # ── Sandhi detection ──────────────────────────────────────
        is_bs, bs_near, bs_dist = _check_bhav_sandhi(deg, sandhis, bhav_orb)
        is_rs = _check_rashi_sandhi(deg, rashi_orb)

        # ── D1 house (rashi-based, passed in) ────────────────────
        d1_house = int(p_data.get("house", 0))
        d1_house = max(1, min(12, d1_house)) if d1_house else chalit_house

        # ── Distance from assigned Bhav Madhya ───────────────────
        madhya_deg  = madhyas[chalit_house - 1]
        dist_madhya = round(abs(angular_distance(deg, madhya_deg)), 4)

        result.append({
            "name"              : PLANET_ENGLISH.get(code, code),
            "code"              : code,
            "hindi"             : PLANET_HINDI.get(code, code),
            "degree"            : round(deg, 4),
            "chalit_house"      : chalit_house,
            "d1_house"          : d1_house,
            "house"             : chalit_house,       # alias for frontend
            "is_changed"        : chalit_house != d1_house,
            "is_bhav_sandhi"    : is_bs,
            "bhav_sandhi_near"  : bs_near if is_bs else None,
            "bhav_sandhi_dist"  : bs_dist,
            "is_rashi_sandhi"   : is_rs,
            "dist_from_madhya"  : dist_madhya,
        })

    return result


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — D1 vs CHALIT COMPARISON
# ═══════════════════════════════════════════════════════════════════

def compare_d1_chalit(
    planets_d1: Dict[str, Dict],
    chalit_planets: List[Dict],
    tolerance: float = 0.0,
) -> Dict[str, Any]:
    """
    Compare D1 rashi-based house vs Chalit house for each planet.

    Parameters
    ----------
    planets_d1     : Original planets dict
    chalit_planets : Output of place_planets()
    tolerance      : Treat as same if house difference <= this (default 0)

    Returns
    -------
    {
        "changed"     : [...planets that moved bhav...],
        "unchanged"   : [...planets that stayed...],
        "sandhi_risk" : [...planets in Bhav/Rashi Sandhi...],
        "summary"     : {total, changed_count, sandhi_count, stability}
    }
    """
    changed:     List[Dict] = []
    unchanged:   List[Dict] = []
    sandhi_risk: List[Dict] = []

    for p in chalit_planets:
        code     = p["code"]
        d1_h     = p["d1_house"]
        chalit_h = p["chalit_house"]
        moved    = abs(chalit_h - d1_h) > tolerance

        entry = {
            "code"           : code,
            "name"           : p["name"],
            "hindi"          : p["hindi"],
            "degree"         : p["degree"],
            "d1_house"       : d1_h,
            "chalit_house"   : chalit_h,
            "is_changed"     : moved,
            "is_bhav_sandhi" : p["is_bhav_sandhi"],
            "is_rashi_sandhi": p["is_rashi_sandhi"],
        }

        if moved:
            changed.append(entry)
        else:
            unchanged.append(entry)

        if p["is_bhav_sandhi"] or p["is_rashi_sandhi"]:
            sandhi_type = (
                "Bhav + Rashi" if p["is_bhav_sandhi"] and p["is_rashi_sandhi"]
                else "Bhav"    if p["is_bhav_sandhi"]
                else "Rashi"
            )
            sandhi_note = (
                "ग्रह भाव सन्धि में — फल अनिश्चित, दोनों भावों का प्रभाव"
                if p["is_bhav_sandhi"]
                else "ग्रह राशि सन्धि में — अगली राशि का भी प्रभाव"
            )
            sandhi_risk.append({**entry,
                                 "sandhi_type": sandhi_type,
                                 "sandhi_note": sandhi_note})

    total = len(chalit_planets)
    nc    = len(changed)

    return {
        "changed"     : changed,
        "unchanged"   : unchanged,
        "sandhi_risk" : sandhi_risk,
        "summary"     : {
            "total_planets"   : total,
            "changed_count"   : nc,
            "unchanged_count" : len(unchanged),
            "sandhi_count"    : len(sandhi_risk),
            "chart_stability" : (
                "अत्यंत स्थिर" if nc == 0
                else "स्थिर"   if nc <= 2
                else "मध्यम"  if nc <= 4
                else "अस्थिर"
            ),
        },
    }


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — BHAV SANDHI STRENGTH (Vimshopak-style)
# ═══════════════════════════════════════════════════════════════════

def _arc_length(start: float, end: float) -> float:
    """
    Forward arc length from start → end (zodiac direction).
    Always positive in (0, 360]. Handles 360° wrap.
    e.g. 350° → 20° = 30°
    """
    return (end - start) % 360.0


def compute_bhav_strength(
    planet_deg: float,
    house_start: float,
    house_end: float,
) -> Dict[str, Any]:
    """
    Vimshopak-style Bhav Sandhi strength score (0–20).

    Formula (Midpoint-based — correct Jyotish logic)
    -------
    Bhav Madhya (midpoint) = maximum strength → score 20
    Bhav Sandhi (boundary) = zero strength    → score 0

    score = (1 − dist_from_madhya / half_span) × 20

    Interpretation
    --------------
    score >= 14  → Strong  (ग्रह भाव मध्य के पास — पूर्ण फलदाता)
    score  8-13  → Medium  (मध्यम बल)
    score  < 8   → Weak    (संधि के पास — निष्फल / अनिश्चित)

    Principle: "भाव मध्ये स्थित ग्रह पूर्ण फलदाता,
                संधि समीप स्थित ग्रह निष्फल।"
    """
    planet_deg  = normalize(planet_deg)
    house_start = normalize(house_start)
    house_end   = normalize(house_end)

    total_span = _arc_length(house_start, house_end)

    # Safety: degenerate house (bad data)
    if total_span < 0.001:
        return {
            "score"      : 10.0,
            "status"     : "medium",
            "status_hi"  : "मध्यम",
            "pct_traveled": 50.0,
        }

    half = total_span / 2.0

    # Bhav Madhya = midpoint of the house arc
    madhya = (house_start + half) % 360.0

    # Shortest circular distance from planet to Madhya
    dist = abs(angular_distance(planet_deg, madhya))   # always 0-180

    # Clamp: guard float drift
    dist = min(dist, half)

    # Core formula: madhya → 20, sandhi → 0
    score = round((1.0 - dist / half) * 20.0, 2)
    score = max(0.0, score)

    pct = round((1.0 - dist / half) * 100.0, 1)

    if score >= 14.0:
        status, status_hi = "strong", "बलवान"
    elif score >= 8.0:
        status, status_hi = "medium", "मध्यम"
    else:
        status, status_hi = "weak",   "दुर्बल (सन्धि)"

    return {
        "score"      : score,
        "status"     : status,
        "status_hi"  : status_hi,
        "pct_traveled": pct,
    }


def compute_all_planet_strengths(
    planet_list: List[Dict],
    sandhis: List[float],
) -> Dict[str, Dict]:
    """
    Compute Bhav Sandhi strength for every planet.

    Parameters
    ----------
    planet_list : Output of place_planets() — needs "code", "degree", "chalit_house"
    sandhis     : 12 Bhav Sandhi degrees from compute_shripati_houses()

    Returns
    -------
    {
        "Su": {"house":10, "score":17.5, "status":"strong",
               "status_hi":"बलवान", "poorva":12.3, "uttara":3.2,
               "total_span":28.5, "pct_traveled":87.3},
        ...
    }
    """
    result: Dict[str, Dict] = {}
    for p in planet_list:
        code     = p["code"]
        deg      = float(p["degree"])
        chalit_h = int(p["chalit_house"])

        h_start = sandhis[chalit_h - 1]
        h_end   = sandhis[chalit_h % 12]   # next sandhi = this house end

        strength      = compute_bhav_strength(deg, h_start, h_end)
        result[code]  = {"house": chalit_h, **strength}

    return result


def build_bhav_sandhi_output(sandhis: List[float]) -> List[Dict]:
    """
    Build bhavSandhi list for API response.

    Returns
    -------
    [{"house":1, "start_deg":12.34, "end_deg":42.10}, ...]
    """
    return [
        {
            "house"    : i + 1,
            "start_deg": round(sandhis[i], 4),
            "end_deg"  : round(sandhis[(i + 1) % 12], 4),
        }
        for i in range(12)
    ]


# ═══════════════════════════════════════════════════════════════════
# SECTION 6 — MAIN PUBLIC API
# ═══════════════════════════════════════════════════════════════════

def get_bhav_chalit(
    julian_day: float,
    lat: float,
    lon: float,
    planets_d1: Dict[str, Dict],
    sandhi_orb: float = 1.0,
    rashi_orb:  float = 1.0,
    include_house_data: bool = False,
) -> Dict[str, Any]:
    """
    Main entry point — Exact Shripati Bhav Chalit calculation.

    Parameters
    ----------
    julian_day        : Julian Day UT of birth (swe.julday output)
    lat               : Geographic latitude
    lon               : Geographic longitude
    planets_d1        : {
                          "Su": {"Degree": 0-360, "house": 1-12},
                          ...
                        }
    sandhi_orb        : Bhav Sandhi orb in degrees (default 1.0)
    rashi_orb         : Rashi Sandhi orb in degrees (default 1.0)
    include_house_data: If True, attach full house madhya/sandhi table

    Returns
    -------
    Flat dict (backward compatible) + metadata:

    {
        "Su": {
            "house"           : 10,      # Chalit house (Shripati)
            "d1_house"        : 9,       # D1 rashi-based house
            "is_changed"      : True,
            "is_bhav_sandhi"  : False,
            "bhav_sandhi_near": None,
            "bhav_sandhi_dist": 3.21,
            "is_rashi_sandhi" : True,
            "degree"          : 299.62,
            "dist_from_madhya": 5.44,
        },
        ...

        "_planets"    : [full planet list with all fields],
        "_comparison" : {changed, unchanged, sandhi_risk, summary},
        "_houses"     : [house madhya/sandhi table — if requested],
    }
    """
    # ── House structure ───────────────────────────────────────────
    house_data = compute_shripati_houses(julian_day, lat, lon)

    # ── Planet placement ──────────────────────────────────────────
    planet_list = place_planets(
        planets_d1,
        house_data["sandhis"],
        house_data["madhyas"],
        bhav_orb  = sandhi_orb,
        rashi_orb = rashi_orb,
    )

    # ── Comparison ────────────────────────────────────────────────
    comparison = compare_d1_chalit(planets_d1, planet_list)

    # ── Bhav Sandhi boundaries (always included) ──────────────────
    flat_bhav_sandhi = build_bhav_sandhi_output(house_data["sandhis"])

    # ── Planet strength scores ────────────────────────────────────
    planet_strength = compute_all_planet_strengths(
        planet_list, house_data["sandhis"]
    )

    # ── Flat dict (backward compatible with old chalit_engine) ────
    flat: Dict[str, Any] = {}
    for p in planet_list:
        code     = p["code"]
        strength = planet_strength.get(code, {})
        flat[code] = {
            "house"           : p["chalit_house"],
            "d1_house"        : p["d1_house"],
            "is_changed"      : p["is_changed"],
            "is_bhav_sandhi"  : p["is_bhav_sandhi"],
            "bhav_sandhi_near": p["bhav_sandhi_near"],
            "bhav_sandhi_dist": p["bhav_sandhi_dist"],
            "is_rashi_sandhi" : p["is_rashi_sandhi"],
            "degree"          : p["degree"],
            "dist_from_madhya": p["dist_from_madhya"],
            # ── Strength fields (inline for frontend convenience) ──
            "score"           : strength.get("score",        0.0),
            "status"          : strength.get("status",       "medium"),
            "status_hi"       : strength.get("status_hi",    "मध्यम"),
            "pct_traveled"    : strength.get("pct_traveled", 50.0),
        }

    flat["_planets"]    = planet_list
    flat["_comparison"] = comparison
    if include_house_data:
        flat["_houses"] = house_data["houses"]

    flat["_bhavSandhi"]     = flat_bhav_sandhi
    flat["_planetStrength"] = planet_strength

    return flat


# ═══════════════════════════════════════════════════════════════════
# SECTION 6 — FLASK / api.py CONVENIENCE WRAPPER
# ═══════════════════════════════════════════════════════════════════

def build_chalit_for_api(
    dt_local,               # datetime — local time (IST)
    lat: float,
    lon: float,
    astro: Dict,            # api.py astro dict {"Su": {...}, "Mo": {...}, ...}
    tz_offset: float = 5.5,
) -> Dict[str, Any]:
    """
    Drop-in wrapper for api.py _build_chart_response().

    Usage:
        from chalit_engine import build_chalit_for_api
        chalit_data = build_chalit_for_api(dt, lat, lon, astro)
        return jsonify({..., "chalit": chalit_data})

    Replaces the inline chalit block in _build_chart_response —
    cleaner and catches seconds-precision correctly.
    """
    from datetime import timedelta

    utc_dt = dt_local - timedelta(hours=tz_offset)
    jd = swe.julday(
        utc_dt.year, utc_dt.month, utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
    )

    asc_idx = astro["La"]["Vargas"]["D1"]["Idx"]
    planets_d1: Dict[str, Dict] = {}

    for code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
        if code not in astro:
            continue
        p     = astro[code]
        p_idx = p["Vargas"]["D1"]["Idx"]
        h     = (p_idx - asc_idx + 12) % 12 + 1
        planets_d1[code] = {
            "Degree": float(p["Degree"]),
            "house" : h,
        }

    try:
        return get_bhav_chalit(jd, lat, lon, planets_d1,
                               include_house_data=True)
    except Exception as e:
        print(f"[Chalit Engine] Error: {e}")
        return {}


# ═══════════════════════════════════════════════════════════════════
# SECTION 7 — SELF TEST  (python chalit_engine.py)
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import datetime

    # ── Birth: 15 Aug 1947, 00:17 IST, New Delhi ──────────────────
    birth_dt = datetime.datetime(1947, 8, 15, 0, 17, 0)
    utc_dt   = birth_dt - datetime.timedelta(hours=5, minutes=30)
    jd_test  = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                           utc_dt.hour + utc_dt.minute / 60.0)
    LAT, LON = 28.6139, 77.2090

    print("═" * 62)
    print("  SHRIPATI BHAV CHALIT ENGINE — Self Test")
    print("═" * 62)

    # House structure
    hd = compute_shripati_houses(jd_test, LAT, LON)
    print(f"\n  ASC = {hd['asc']:.4f}°    MC = {hd['mc']:.4f}°\n")
    print(f"  {'Bhav':<5}  {'Madhya':>10}  {'Sandhi (Start)':>16}")
    print("  " + "─" * 36)
    for h in hd["houses"]:
        print(f"  {h['house']:<5}  {h['madhya']:>10.4f}°  {h['start']:>14.4f}°")

    # Sample planets (sidereal degrees)
    sample = {
        "Su": {"Degree": 118.62, "house": 4},
        "Mo": {"Degree": 194.81, "house": 7},
        "Ma": {"Degree":  59.62, "house": 2},
        "Me": {"Degree": 131.40, "house": 4},
        "Ju": {"Degree": 217.30, "house": 7},
        "Ve": {"Degree": 103.90, "house": 4},
        "Sa": {"Degree": 109.50, "house": 4},
        "Ra": {"Degree":  20.30, "house": 1},
        "Ke": {"Degree": 200.30, "house": 7},
    }

    res = get_bhav_chalit(jd_test, LAT, LON, sample, include_house_data=False)

    print(f"\n  {'Planet':<10} {'D1':>4} {'Chalit':>7}  "
          f"{'Changed':>8}  {'BhavS':>7}  {'RashiS':>7}  {'SandhiDist':>11}  {'Score':>6}  {'Status'}")
    print("  " + "─" * 80)
    for code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
        if code not in res:
            continue
        p   = res[code]
        ch  = "🔄 YES" if p["is_changed"]      else "  —"
        bs  = "⚠️ YES" if p["is_bhav_sandhi"]  else "  —"
        rs  = "⚠️ YES" if p["is_rashi_sandhi"] else "  —"
        print(f"  {PLANET_ENGLISH.get(code,code):<10} {p['d1_house']:>4} "
              f"{p['house']:>7}  {ch:>9}  {bs:>9}  {rs:>9}  "
              f"{p['bhav_sandhi_dist']:>8.4f}°  {p['score']:>6.2f}  {p['status']}")

    cmp = res["_comparison"]
    s   = cmp["summary"]
    print(f"\n  ── Summary ─────────────────────────────────────────")
    print(f"     Changed    : {s['changed_count']} / {s['total_planets']}")
    print(f"     Sandhi Risk: {s['sandhi_count']}")
    print(f"     Stability  : {s['chart_stability']}")

    if cmp["sandhi_risk"]:
        print(f"\n  ── Sandhi Planets ──────────────────────────────────")
        for sp in cmp["sandhi_risk"]:
            print(f"     {sp['name']:<12} [{sp['sandhi_type']}]")
            print(f"     → {sp['sandhi_note']}")

    print("\n  ✅ Engine test complete.\n")