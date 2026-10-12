"""
yearly_engine.py — सुदर्शन आधारित वार्षिक फल इंजन
═══════════════════════════════════════════════════════════════════
Sudarshan-based Yearly Prediction System.

Theory:
  Every year of life corresponds to a house in the Sudarshan Chakra.
  The cycle repeats every 12 years.

  active_house = ((age - 1) % 12) + 1

  Year Lord = Lord of the rashi in that house (from Lagna chart).
  Year Strength = Sudarshan total points for that house.
  Year Quality = 85-point rule (trik bhavs reversed).

  Monthly Breakdown:
  Month 1 → active_house
  Month 2 → active_house + 1
  ...
  Month 12 → active_house + 11
  (all mod 12)

Public API:
  get_yearly_prediction(age, sudarshan_data, houses) → main entry
  get_year_lord(house_num, houses)                   → lord for house
  get_monthly_breakdown(active_house, houses, sudarshan_data)
═══════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
from typing import Dict, List, Any

# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — CONSTANTS
# ═══════════════════════════════════════════════════════════════════

# Rashi index (0-based) → Natural lord
# Mesh=Ma, Vrishabh=Ve, Mithun=Me, Kark=Mo, Simha=Su, Kanya=Me,
# Tula=Ve, Vrischik=Ma, Dhanu=Ju, Makar=Sa, Kumbh=Sa, Meen=Ju
SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]

PLANET_NAMES_HI = {
    "Su":"सूर्य", "Mo":"चंद्र", "Ma":"मंगल", "Me":"बुध",
    "Ju":"गुरु",  "Ve":"शुक्र", "Sa":"शनि",  "Ra":"राहु", "Ke":"केतु",
}

RASHI_NAMES_HI = [
    "मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
    "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन",
]

MONTH_NAMES_HI = [
    "प्रथम","द्वितीय","तृतीय","चतुर्थ","पंचम","षष्ठ",
    "सप्तम","अष्टम","नवम","दशम","एकादश","द्वादश",
]

TRIK_BHAVS = {6, 8, 12}
THRESHOLD  = 85


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — CORE HELPERS
# ═══════════════════════════════════════════════════════════════════

def get_active_house(age: int) -> int:
    """
    House active in a given year of life.
    Cycle repeats every 12 years.

    age 1  → house 1
    age 12 → house 12
    age 13 → house 1   (new cycle)
    """
    if age < 1:
        age = 1
    return ((age - 1) % 12) + 1


def get_year_lord(house_num: int, houses: Dict) -> str:
    """
    Return the planet code for the lord of the rashi
    in the given house (from the Lagna chart).

    Parameters
    ----------
    house_num : 1–12
    houses    : api.py houses dict — {1: {"sign_index": 0, ...}, ...}

    Returns
    -------
    Planet code e.g. "Su", "Mo", "Ma" etc.
    Falls back to natural rashi lord if house data missing.
    """
    try:
        sign_idx = int(houses[house_num]["sign_index"])
        return SIGN_LORDS[sign_idx % 12]
    except (KeyError, TypeError, IndexError):
        # Fallback: natural lord based on house number
        natural_signs = [4, 1, 2, 3, 0, 5, 6, 7, 8, 9, 10, 11]
        return SIGN_LORDS[natural_signs[(house_num - 1) % 12]]


def _year_quality(total: int, house_num: int) -> str:
    """85-point rule with trik reversal."""
    is_trik = house_num in TRIK_BHAVS
    if not is_trik:
        if total > THRESHOLD:  return "अति उत्तम"
        if total == THRESHOLD: return "सामान्य"
        return "अशुभ"
    else:
        if total < THRESHOLD:  return "अति उत्तम"
        if total == THRESHOLD: return "सामान्य"
        return "अशुभ"


def _highlight(total: int) -> str:
    if total > 100: return "extraordinary"
    if total < 70:  return "weak"
    return ""


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — MONTHLY BREAKDOWN
# ═══════════════════════════════════════════════════════════════════

def get_monthly_breakdown(
    active_house: int,
    houses: Dict,
    sudarshan_data: Dict[str, Dict],
) -> List[Dict]:
    """
    12-month breakdown starting from active_house.

    Month 1 = active_house
    Month 2 = active_house + 1 (mod 12)
    ...

    Returns
    -------
    [
        {
            "month"      : 1,
            "month_hi"   : "प्रथम",
            "house"      : 3,
            "lord"       : "Me",
            "lord_hi"    : "बुध",
            "points"     : 82,
            "result"     : "अशुभ",
            "highlight"  : "",
            "is_trik"    : False,
        },
        ...
    ]
    """
    months = []
    for i in range(12):
        h    = ((active_house - 1 + i) % 12) + 1
        lord = get_year_lord(h, houses)

        # Get sudarshan points for this house
        h_data = sudarshan_data.get(str(h), {})
        pts    = h_data.get("total", 0)

        months.append({
            "month"    : i + 1,
            "month_hi" : MONTH_NAMES_HI[i],
            "house"    : h,
            "lord"     : lord,
            "lord_hi"  : PLANET_NAMES_HI.get(lord, lord),
            "points"   : pts,
            "result"   : _year_quality(pts, h),
            "highlight": _highlight(pts),
            "is_trik"  : h in TRIK_BHAVS,
        })

    return months


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — MAIN PUBLIC API
# ═══════════════════════════════════════════════════════════════════

def get_yearly_prediction(
    age: int,
    sudarshan_data: Dict[str, Dict],
    houses: Dict,
) -> Dict[str, Any]:
    """
    Main entry point for api.py.

    Parameters
    ----------
    age            : Current age of the person (int)
    sudarshan_data : Output of sudarshan_engine.get_sudarshan_data()
                     {"1": {"total":93, "status":"अति उत्तम", ...}, ...}
    houses         : api.py houses dict
                     {1: {"sign_index":4, "sign":"सिंह (5)", ...}, ...}

    Returns
    -------
    {
        "age"          : 28,
        "active_house" : 4,
        "year_lord"    : "Mo",
        "year_lord_hi" : "चंद्र",
        "points"       : 93,
        "result"       : "अति उत्तम",
        "highlight"    : "",
        "is_trik"      : False,
        "cycle"        : 3,          ← which 12-year cycle (1-based)
        "year_in_cycle": 4,          ← position within current cycle
        "monthly"      : [ ...12 months... ],
    }
    """
    try:
        if not isinstance(age, int) or age < 1:
            age = 1

        active_house = get_active_house(age)
        year_lord    = get_year_lord(active_house, houses)

        h_data = sudarshan_data.get(str(active_house), {})
        pts    = h_data.get("total", 0)

        monthly = get_monthly_breakdown(active_house, houses, sudarshan_data)

        return {
            "age"          : age,
            "active_house" : active_house,
            "year_lord"    : year_lord,
            "year_lord_hi" : PLANET_NAMES_HI.get(year_lord, year_lord),
            "points"       : pts,
            "result"       : _year_quality(pts, active_house),
            "highlight"    : _highlight(pts),
            "is_trik"      : active_house in TRIK_BHAVS,
            "cycle"        : ((age - 1) // 12) + 1,
            "year_in_cycle": active_house,
            "monthly"      : monthly,
        }

    except Exception as e:
        print(f"[Yearly Engine] Error: {e}")
        return {}


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — SELF TEST
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Mock data
    mock_sudarshan = {
        str(h): {"total": 70 + h * 3, "status": "सामान्य", "is_trik": h in {6,8,12}}
        for h in range(1, 13)
    }
    mock_houses = {
        h: {"sign_index": (h + 3) % 12, "sign": RASHI_NAMES_HI[(h+3) % 12]}
        for h in range(1, 13)
    }

    print("═" * 60)
    print("  वार्षिक फल इंजन — Self Test")
    print("═" * 60)

    for age in [1, 12, 13, 25, 28, 36]:
        res = get_yearly_prediction(age, mock_sudarshan, mock_houses)
        print(f"\n  उम्र {age:>3} | भाव {res['active_house']:>2} | "
              f"चक्र {res['cycle']} | दशानाथ: {res['year_lord_hi']:<8} | "
              f"अंक: {res['points']:>3} | {res['result']}")

    print("\n  ── माहवार (उम्र 28) ──────────────────────────")
    res28 = get_yearly_prediction(28, mock_sudarshan, mock_houses)
    for m in res28["monthly"]:
        trik = " [त्रिक]" if m["is_trik"] else ""
        print(f"  माह {m['month']:>2} ({m['month_hi']:<12}) → "
              f"भाव {m['house']:>2} | {m['lord_hi']:<8} | {m['points']:>3} अंक | {m['result']}{trik}")

    print("\n  ✅ Engine test complete.\n")