"""
sudarshan_engine.py — सुदर्शन चक्र + सर्वाष्टक बल इंजन
═══════════════════════════════════════════════════════════════════
Sudarshan Chakra considers THREE charts simultaneously:
  1. Lagna Chakra  — Lagna as ascendant
  2. Chandra Chakra — Moon as ascendant
  3. Surya Chakra   — Sun as ascendant

For each house (bhav):
  - Identify which rashi falls in that house from each of the 3 charts
  - Fetch Sarvashtak points for that rashi
  - Sum all 3 → Total Sudarshan strength for the bhav

Threshold: 85 points
  Normal bhavs  (1–5, 7, 9–11): >85 = शुभ, =85 = सामान्य, <85 = अशुभ
  Trik bhavs    (6, 8, 12)     : <85 = शुभ, =85 = सामान्य, >85 = अशुभ

Public API:
  get_sudarshan_data(astro, sav_points) → main entry point
  build_sudarshan_chakra(lagna_idx, moon_idx, sun_idx, sav_points) → core
═══════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
from typing import Dict, List, Any

# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — CONSTANTS
# ═══════════════════════════════════════════════════════════════════

RASHI_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन",
]

TRIK_BHAVS = {6, 8, 12}
THRESHOLD  = 85


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — CORE ENGINE
# ═══════════════════════════════════════════════════════════════════

def _rashi_for_house(lagna_idx: int, house_num: int) -> int:
    """
    Return 0-indexed rashi for a given house number (1-based),
    when `lagna_idx` is the ascendant sign (0-indexed).

    House 1 = lagna sign itself.
    House N = (lagna_idx + N - 1) % 12
    """
    return (lagna_idx + house_num - 1) % 12


def _status(total: int, house_num: int) -> str:
    """
    Determine शुभ/अशुभ status with trik bhav reversal.

    Normal bhavs : >85 → अति उत्तम | =85 → सामान्य | <85 → अशुभ
    Trik bhavs   : <85 → अति उत्तम | =85 → सामान्य | >85 → अशुभ
    """
    is_trik = house_num in TRIK_BHAVS

    if not is_trik:
        if total > THRESHOLD:  return "अति उत्तम"
        if total == THRESHOLD: return "सामान्य"
        return "अशुभ"
    else:
        if total < THRESHOLD:  return "अति उत्तम"   # less is good in trik
        if total == THRESHOLD: return "सामान्य"
        return "अशुभ"


def _highlight(total: int, house_num: int) -> str:
    """
    Extra highlight flag for extreme values.
    Returns: "extraordinary" | "weak" | ""
    """
    if total > 100: return "extraordinary"
    if total < 70:  return "weak"
    return ""


def build_sudarshan_chakra(
    lagna_idx: int,
    moon_idx:  int,
    sun_idx:   int,
    sav_points: List[int],
) -> Dict[str, Dict[str, Any]]:
    """
    Core computation — no dependencies on api.py internals.

    Parameters
    ----------
    lagna_idx   : 0-indexed rashi of Lagna (0=Mesh … 11=Meen)
    moon_idx    : 0-indexed rashi of Moon
    sun_idx     : 0-indexed rashi of Sun
    sav_points  : List[int] of length 12 — rashi-wise Sarvashtak points
                  (index 0 = Mesh, 1 = Vrishabh … 11 = Meen)

    Returns
    -------
    {
        "1": {
            "lagna_rashi"   : 4,          # 0-indexed rashi idx
            "moon_rashi"    : 6,
            "sun_rashi"     : 8,
            "lagna_rashi_hi": "सिंह",
            "moon_rashi_hi" : "तुला",
            "sun_rashi_hi"  : "धनु",
            "lagna_points"  : 28,
            "moon_points"   : 32,
            "sun_points"    : 33,
            "total"         : 93,
            "status"        : "अति उत्तम",
            "highlight"     : "",
        },
        ...
        "12": { ... }
    }
    """
    # Safety: pad sav_points to 12 if shorter
    sav = list(sav_points) + [0] * max(0, 12 - len(sav_points))

    result: Dict[str, Dict] = {}

    for house_num in range(1, 13):
        l_rashi = _rashi_for_house(lagna_idx, house_num)
        m_rashi = _rashi_for_house(moon_idx,  house_num)
        s_rashi = _rashi_for_house(sun_idx,   house_num)

        l_pts = sav[l_rashi]
        m_pts = sav[m_rashi]
        s_pts = sav[s_rashi]
        total = l_pts + m_pts + s_pts

        result[str(house_num)] = {
            "lagna_rashi"    : l_rashi,
            "moon_rashi"     : m_rashi,
            "sun_rashi"      : s_rashi,
            "lagna_rashi_hi" : RASHI_NAMES_HI[l_rashi],
            "moon_rashi_hi"  : RASHI_NAMES_HI[m_rashi],
            "sun_rashi_hi"   : RASHI_NAMES_HI[s_rashi],
            "lagna_points"   : l_pts,
            "moon_points"    : m_pts,
            "sun_points"     : s_pts,
            "total"          : total,
            "status"         : _status(total, house_num),
            "highlight"      : _highlight(total, house_num),
            "is_trik"        : house_num in TRIK_BHAVS,
        }

    return result


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — api.py WRAPPER
# ═══════════════════════════════════════════════════════════════════

def get_sudarshan_data(
    astro: Dict[str, Any],
    sav_points: List[int],
) -> Dict[str, Any]:
    """
    Drop-in wrapper for api.py — extracts indices from astro dict
    and calls build_sudarshan_chakra().

    Parameters
    ----------
    astro       : api.py astro dict {"La": {...}, "Mo": {...}, "Su": {...}, ...}
    sav_points  : rashi-wise SAV list (index 0=Mesh … 11=Meen)
                  — same list used everywhere in api.py

    Returns
    -------
    Sudarshan chakra dict (str house → data) or {} on error.

    Usage in api.py:
        from sudarshan_engine import get_sudarshan_data
        sudarshan = get_sudarshan_data(astro, sav_points)
        # then add to response: "sudarshan": sudarshan
    """
    try:
        lagna_idx = int(astro["La"]["Vargas"]["D1"]["Idx"])
        moon_idx  = int(astro["Mo"]["Vargas"]["D1"]["Idx"])
        sun_idx   = int(astro["Su"]["Vargas"]["D1"]["Idx"])

        return build_sudarshan_chakra(lagna_idx, moon_idx, sun_idx, sav_points)

    except KeyError as e:
        print(f"[Sudarshan Engine] Missing key: {e}")
        return {}
    except Exception as e:
        print(f"[Sudarshan Engine] Error: {e}")
        return {}


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — SELF TEST  (python sudarshan_engine.py)
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Sample: Lagna=Simha(4), Moon=Tula(6), Sun=Dhanu(8)
    # Typical SAV points (rashi-wise, Mesh=0)
    sample_sav = [25, 30, 28, 32, 27, 29, 33, 31, 26, 28, 30, 27]

    result = build_sudarshan_chakra(
        lagna_idx  = 4,   # Simha
        moon_idx   = 6,   # Tula
        sun_idx    = 8,   # Dhanu
        sav_points = sample_sav,
    )

    print("═" * 72)
    print("  सुदर्शन चक्र — Self Test")
    print("═" * 72)
    print(f"\n  {'भाव':<5} {'लग्न राशि':<12} {'चंद्र राशि':<12} {'सूर्य राशि':<12} {'कुल':>5}  स्थिति")
    print("  " + "─" * 68)

    for h in range(1, 13):
        d   = result[str(h)]
        hi  = d["highlight"]
        tag = " 🔥" if hi == "extraordinary" else " ⚠️" if hi == "weak" else ""
        trik_mark = " [त्रिक]" if d["is_trik"] else ""
        print(
            f"  {h:<5} {d['lagna_rashi_hi']:<12} {d['moon_rashi_hi']:<12}"
            f" {d['sun_rashi_hi']:<12} {d['total']:>5}  {d['status']}{trik_mark}{tag}"
        )

    total_all = sum(result[str(h)]["total"] for h in range(1, 13))
    print(f"\n  कुल योग: {total_all}  |  औसत: {total_all/12:.1f}")
    print("\n  ✅ Engine test complete.\n")