"""
av_sutras_engine.py
====================
Ashtakvarga Sutras Engine — Session 36+
Features:
  1. Fortune / Hardship Years  (×7 ÷ 27 formula)
  2. Grah Bal  (BAV + SAV combined strength)
  3. Wealth & Status Matrix  (164 rule, CEO rule, savings, etc.)
  4. Relationship Dominance  (Lagna vs 7th, Moon AV compatibility)
  5. Life Risk Index  (Black Hole scanner)
  6. 12-Year Life Cycle  (Golden & Critical years)
  7. Ghatak vs Poshak  (Life struggle meter)

Usage (from engines_bridge.py):
    from av_sutras_engine import compute_av_sutras
    result = compute_av_sutras(planets, houses, sav, bav_charts, birth_year)
"""

from typing import Dict, List, Any, Optional
import datetime
from datetime import timedelta


# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

# Paap (Malefic) and Shubh (Benefic) planets
PAAP_PLANETS  = {"Sa", "Ma", "Su", "Ra"}   # Shani, Mangal, Surya, Rahu

NAKSHATRA_LIST = [
    "अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु",
    "पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी",
    "हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा",
    "मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा",
    "शतभिषा","पूर्व भाद्रपद","उत्तर भाद्रपद","रेवती"
]
SHUBH_PLANETS = {"Ju", "Ve", "Me", "Mo"}   # Guru, Shukra, Budh, Chandra

# Planet display names (Hindi + English)
PLANET_NAMES = {
    "Su": "सूर्य (Sun)",
    "Mo": "चंद्र (Moon)",
    "Ma": "मंगल (Mars)",
    "Me": "बुध (Mercury)",
    "Ju": "गुरु (Jupiter)",
    "Ve": "शुक्र (Venus)",
    "Sa": "शनि (Saturn)",
    "Ra": "राहु (Rahu)",
    "Ke": "केतु (Ketu)",
}

# Strength labels
STRENGTH_LABEL = {
    "very_strong":  "अत्यंत बलवान",
    "strong":       "बलवान",
    "average":      "सामान्य",
    "weak":         "निर्बल",
    "very_weak":    "अत्यंत निर्बल",
}


# ─────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────

def _get_planet_house(planets: Dict, planet_code: str) -> Optional[int]:
    """Return 1-based house number where planet is placed."""
    p = planets.get(planet_code, {})
    return p.get("house")  # Expected: 1-12


def _sav_points_for_house(sav: List[int], house: int) -> int:
    """Return SAV points for a house (1-indexed). sav is list of 12 ints."""
    if not sav or house < 1 or house > 12:
        return 0
    return sav[house - 1]


def _bav_points_for_planet(bav_charts: Dict, planet_code: str, house: int) -> int:
    """Return BAV points for a planet in a specific house (1-indexed)."""
    # bav_charts = { "Su": [3,4,2,...], "Mo": [...], ... }
    chart = bav_charts.get(planet_code, [])
    if not chart or house < 1 or house > 12:
        return 0
    return chart[house - 1]


def _strength_label(bav: int) -> str:
    if bav >= 6:   return "very_strong"
    if bav >= 5:   return "strong"
    if bav == 4:   return "average"
    if bav == 3:   return "weak"
    return "very_weak"


def _sav_strength_label(sav: int) -> str:
    if sav >= 30:  return "very_strong"
    if sav >= 28:  return "strong"
    if sav >= 25:  return "average"
    if sav >= 20:  return "weak"
    return "very_weak"


# ─────────────────────────────────────────────
# FEATURE 1 — FORTUNE / HARDSHIP YEARS
# ─────────────────────────────────────────────

def _sum_sav_lagna_to_house(sav: List[int], target_house: int) -> int:
    """Sum SAV points from house 1 (Lagna) to target_house (inclusive)."""
    return sum(sav[0:target_house])


# ─────────────────────────────────────────────
# ACTIVATION ENGINE — Cycle Rule + Transit + Dasha + Kaksha
# ─────────────────────────────────────────────

def _get_next_active_year(base_age: int, current_age: int) -> int:
    """
    Cycle Rule: 7/27 remainder repeats every 27 years.
    Find the NEXT occurrence >= current_age.
    Example: base=22, current=35 → returns 49
    """
    active = base_age
    while active < current_age:
        active += 27
    return active


PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध",
    "Ju": "गुरु",  "Ve": "शुक्र", "Sa": "शनि",  "Ra": "राहु", "Ke": "केतु",
}

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध",
    "Ju": "गुरु",  "Ve": "शुक्र", "Sa": "शनि",  "Ra": "राहु", "Ke": "केतु",
}

# ─────────────────────────────────────────────
# CYCLE SIMULATION — Dasha at each 27-yr cycle age
# ─────────────────────────────────────────────

def _simulate_dasha_at_age(
    dasha_timeline: List[Dict],
    dob,
    target_age: float,
) -> str:
    """MD code return karta hai, ya '?' """
    result = _simulate_dasha_deep(dasha_timeline, dob, target_age)
    return result.get("md", "?")


def _simulate_dasha_deep(
    dasha_timeline: List[Dict],
    dob,
    target_age: float,
) -> Dict:
    """
    MD + AD + PD simulate karo ek saath.
    Returns:
      { md, md_hi, ad, ad_hi, pd, pd_hi,
        md_known, ad_known, pd_known }
    """
    empty = {
        "md": "?", "md_hi": "?",
        "ad": "?", "ad_hi": "?",
        "pd": "?", "pd_hi": "?",
        "md_known": False, "ad_known": False, "pd_known": False,
    }
    if not dasha_timeline or not dob:
        return empty

    import datetime as _dt

    # ── dob normalize ────────────────────────────────────────────────────────
    def _to_dt(val):
        if isinstance(val, _dt.datetime): return val
        if isinstance(val, _dt.date):     return _dt.datetime(val.year, val.month, val.day)
        if isinstance(val, str):
            val = val.strip()
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
                try: return _dt.datetime.strptime(val[:10], fmt)
                except: continue
        return None

    dob_dt = _to_dt(dob)
    if not dob_dt:
        return empty

    try:
        target_date = dob_dt + _dt.timedelta(days=target_age * 360.0)
    except Exception:
        return empty

    # ── date parse ───────────────────────────────────────────────────────────
    def _parse(s):
        if not s: return None
        if isinstance(s, _dt.datetime): return s
        if isinstance(s, _dt.date):     return _dt.datetime(s.year, s.month, s.day)
        s = str(s).strip()
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
            try: return _dt.datetime.strptime(s[:10], fmt)
            except: continue
        try: return _dt.datetime.strptime(s[:7], "%Y-%m")
        except: return None

    # ── planet name map ──────────────────────────────────────────────────────
    _REV = {
        "Saturn":"Sa","Jupiter":"Ju","Mars":"Ma","Sun":"Su","Moon":"Mo",
        "Venus":"Ve","Mercury":"Me","Rahu":"Ra","Ketu":"Ke",
        "शनि":"Sa","गुरु":"Ju","मंगल":"Ma","सूर्य":"Su","चंद्र":"Mo",
        "शुक्र":"Ve","बुध":"Me","राहु":"Ra","केतु":"Ke",
    }

    result = dict(empty)

    for md in dasha_timeline:
        try:
            md_start = _parse(md.get("start") or md.get("start_date") or "")
            md_end   = _parse(md.get("end")   or md.get("end_date")   or "")
            if not md_start or not md_end: continue
            if not (md_start <= target_date < md_end): continue

            # MD मिला
            md_raw = md.get("lord") or md.get("planet") or ""
            md_code = _REV.get(md_raw, md_raw)
            result["md"]       = md_code
            result["md_hi"]    = PLANET_NAMES_HI.get(md_code, md_code)
            result["md_known"] = bool(md_code and md_code != "?")

            # AD ढूंढो
            for ad in md.get("antardashas", []):
                ad_start = _parse(ad.get("start") or ad.get("start_date") or "")
                ad_end   = _parse(ad.get("end")   or ad.get("end_date")   or "")
                if not ad_start or not ad_end: continue
                if not (ad_start <= target_date < ad_end): continue

                ad_raw  = ad.get("lord") or ad.get("planet") or ""
                ad_code = _REV.get(ad_raw, ad_raw)
                result["ad"]       = ad_code
                result["ad_hi"]    = PLANET_NAMES_HI.get(ad_code, ad_code)
                result["ad_known"] = bool(ad_code and ad_code != "?")

                # PD ढूंढो
                for pd in ad.get("pratyantardashas", []):
                    pd_start = _parse(pd.get("start") or pd.get("start_date") or "")
                    pd_end   = _parse(pd.get("end")   or pd.get("end_date")   or "")
                    if not pd_start or not pd_end: continue
                    if not (pd_start <= target_date < pd_end): continue

                    pd_raw  = pd.get("lord") or pd.get("planet") or ""
                    pd_code = _REV.get(pd_raw, pd_raw)
                    result["pd"]       = pd_code
                    result["pd_hi"]    = PLANET_NAMES_HI.get(pd_code, pd_code)
                    result["pd_known"] = bool(pd_code and pd_code != "?")
                    break
                break
            break
        except Exception:
            continue

    return result


def _check_house_alignment(
    planet_code: str,
    planet_house: int,
    dasha_result: Dict,
    planets: Dict,
) -> Dict:
    """
    Check karo ki selected age ke MD/AD/PD lords kundali ke
    us planet ke house se aligned hain ya nahi.

    Alignment = MD/AD/PD lord wahi planet hai jiska sutra dekh rahe hain,
    ya wo planet natal house ka swami hai.
    """
    md = dasha_result.get("md", "?")
    ad = dasha_result.get("ad", "?")
    pd = dasha_result.get("pd", "?")

    # House lord = kundali mein us house ka swami
    # (simplified: check if MD/AD/PD is the planet itself)
    md_aligned = (md == planet_code)
    ad_aligned = (ad == planet_code)
    pd_aligned = (pd == planet_code)

    # Bonus: agar MD/AD/PD lord natal house mein hai
    def _lord_in_house(code):
        if code == "?" or not code: return False
        return planets.get(code, {}).get("house") == planet_house

    md_in_house = _lord_in_house(md)
    ad_in_house = _lord_in_house(ad)

    # Alignment score (0-5)
    score = sum([
        md_aligned * 2,      # MD match = most powerful
        ad_aligned * 1.5,    # AD match
        pd_aligned * 1,      # PD match
        md_in_house * 0.5,   # MD lord natal house mein
        ad_in_house * 0.5,   # AD lord natal house mein
    ])

    if score >= 3.5:
        level = "perfect"
        label = "🎯 परफेक्ट एलाइनमेंट"
        color = "#22D3EE"
        desc  = f"MD + AD दोनों {PLANET_NAMES_HI.get(planet_code, planet_code)} से जुड़े हैं — 100% फल निश्चित!"
    elif score >= 2:
        level = "strong"
        label = "✅ मजबूत एलाइनमेंट"
        color = "#4ADE80"
        desc  = f"महादशा अनुकूल है — 80-90% फल मिलेगा।"
    elif score >= 1:
        level = "partial"
        label = "⚡ आंशिक एलाइनमेंट"
        color = "#FCD34D"
        desc  = f"अन्तर्दशा/प्रत्यन्तर में कुछ संबंध है — 50-70% संभावना।"
    else:
        level = "none"
        label = "⏳ एलाइनमेंट नहीं"
        color = "#64748B"
        desc  = f"इस समय दशा का संबंध नहीं — फल अनिश्चित।"

    return {
        "score":      round(score, 1),
        "level":      level,
        "label":      label,
        "color":      color,
        "desc":       desc,
        "md_aligned": md_aligned,
        "ad_aligned": ad_aligned,
        "pd_aligned": pd_aligned,
        "md_in_house": md_in_house,
        "ad_in_house": ad_in_house,
    }


# Hindi month names
_HINDI_MONTHS = [
    "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
    "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
]


def _scan_full_year_dasha(
    dasha_timeline: List[Dict],
    dob,
    target_age: float,
    planet_code: str,
) -> Dict:
    """
    उस age के पूरे 365 दिनों को scan करो।
    Returns:
      {
        md, md_hi,              # उस साल की MD (सबसे लंबी)
        ad_windows:  [{lord, hi, start, end, days}],  # सभी ADs
        pd_windows:  [{lord, hi, start, end, days, month_range}],  # सभी PDs
        pd_match:    True/False,   # क्या planet_code कभी भी PD में आया?
        ad_match:    True/False,   # क्या planet_code कभी भी AD में आया?
        best_pd_window: "मार्च से मई",  # best matching PD का समय
        best_ad_window: "अगस्त",        # best matching AD का समय
        total_pd_days:  int,            # कितने दिन PD active रहेगी
      }
    """
    empty = {
        "md": "?", "md_hi": "?",
        "ad_windows": [], "pd_windows": [],
        "pd_match": False, "ad_match": False,
        "best_pd_window": "", "best_ad_window": "",
        "total_pd_days": 0, "total_ad_days": 0,
    }
    if not dasha_timeline or not dob or not planet_code:
        return empty

    import datetime as _dt

    def _to_dt(val):
        if isinstance(val, _dt.datetime): return val
        if isinstance(val, _dt.date):     return _dt.datetime(val.year, val.month, val.day)
        if isinstance(val, str):
            val = str(val).strip()
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
                try: return _dt.datetime.strptime(val[:10], fmt)
                except: continue
        return None

    dob_dt = _to_dt(dob)
    if not dob_dt: return empty

    try:
        yr_start = dob_dt + _dt.timedelta(days=target_age * 360.0)
        yr_end   = yr_start + _dt.timedelta(days=360.0)
    except Exception:
        return empty

    result = dict(empty)
    md_days_map = {}   # md_lord → days overlap
    ad_list = []
    pd_list = []

    for md in dasha_timeline:
        try:
            ms = _to_dt(md.get("start") or md.get("start_date") or "")
            me = _to_dt(md.get("end")   or md.get("end_date")   or "")
            if not ms or not me: continue
            if ms >= yr_end or me <= yr_start: continue

            md_lord = md.get("lord") or md.get("planet") or ""
            overlap = (min(me, yr_end) - max(ms, yr_start)).days
            md_days_map[md_lord] = md_days_map.get(md_lord, 0) + overlap

            for ad in md.get("antardashas", []):
                as_ = _to_dt(ad.get("start") or ad.get("start_date") or "")
                ae  = _to_dt(ad.get("end")   or ad.get("end_date")   or "")
                if not as_ or not ae: continue
                if as_ >= yr_end or ae <= yr_start: continue

                ad_lord = ad.get("lord") or ad.get("planet") or ""
                a_start = max(as_, yr_start)
                a_end   = min(ae, yr_end)
                a_days  = (a_end - a_start).days
                ad_list.append({
                    "lord": ad_lord,
                    "hi":   PLANET_NAMES_HI.get(ad_lord, ad_lord),
                    "start": a_start, "end": a_end, "days": a_days,
                })

                for pd in ad.get("pratyantardashas", []):
                    ps = _to_dt(pd.get("start") or pd.get("start_date") or "")
                    pe = _to_dt(pd.get("end")   or pd.get("end_date")   or "")
                    if not ps or not pe: continue
                    if ps >= yr_end or pe <= yr_start: continue

                    pd_lord = pd.get("lord") or pd.get("planet") or ""
                    p_start = max(ps, yr_start)
                    p_end   = min(pe, yr_end)
                    p_days  = (p_end - p_start).days

                    # Month range
                    sm = _HINDI_MONTHS[p_start.month - 1]
                    em = _HINDI_MONTHS[p_end.month - 1]
                    month_range = sm if sm == em else f"{sm}–{em}"

                    pd_list.append({
                        "lord": pd_lord,
                        "hi":   PLANET_NAMES_HI.get(pd_lord, pd_lord),
                        "start": p_start, "end": p_end,
                        "days": p_days, "month_range": month_range,
                    })
        except Exception:
            continue

    # Best MD (sab se zyada days wali)
    if md_days_map:
        best_md = max(md_days_map, key=md_days_map.get)
        result["md"]    = best_md
        result["md_hi"] = PLANET_NAMES_HI.get(best_md, best_md)

    result["ad_windows"] = sorted(ad_list, key=lambda x: x["days"], reverse=True)
    result["pd_windows"] = sorted(pd_list, key=lambda x: x["days"], reverse=True)

    # AD match check
    ad_matches = [a for a in ad_list if a["lord"] == planet_code]
    if ad_matches:
        best_ad = max(ad_matches, key=lambda x: x["days"])
        result["ad_match"]      = True
        result["total_ad_days"] = sum(a["days"] for a in ad_matches)
        sm = _HINDI_MONTHS[best_ad["start"].month - 1]
        em = _HINDI_MONTHS[best_ad["end"].month - 1]
        result["best_ad_window"] = sm if sm == em else f"{sm}–{em}"

    # PD match check
    pd_matches = [p for p in pd_list if p["lord"] == planet_code]
    if pd_matches:
        best_pd = max(pd_matches, key=lambda x: x["days"])
        result["pd_match"]       = True
        result["total_pd_days"]  = sum(p["days"] for p in pd_matches)
        result["best_pd_window"] = best_pd["month_range"]

    return result


def _check_transit_at_age(
    planet_code: str,
    target_house: int,
    lagna_sign: int,
    dob,
    target_age: float,
) -> Dict:
    """
    swisseph se check karo ki target_age par planet actual mein
    target_house mein hai ya nahi.
    Returns { is_present, transit_sign, target_rashi, year, date_str }
    """
    result = {
        "is_present": False,
        "transit_sign": -1,
        "target_rashi": -1,
        "year": 0,
        "date_str": "",
        "checked": False,
    }
    try:
        import swisseph as swe
        import datetime as _dt

        _SWE_MAP = {
            "Su": swe.SUN,  "Mo": swe.MOON, "Ma": swe.MARS,
            "Me": swe.MERCURY, "Ju": swe.JUPITER, "Ve": swe.VENUS,
            "Sa": swe.SATURN,
            "Ra": swe.TRUE_NODE,   # Rahu = North Node
        }
        swe_code = _SWE_MAP.get(planet_code)
        if swe_code is None:
            return result  # Ketu not directly in swisseph

        def _to_dt(val):
            if isinstance(val, _dt.datetime): return val
            if isinstance(val, _dt.date):     return _dt.datetime(val.year, val.month, val.day)
            if isinstance(val, str):
                for fmt in ("%d-%m-%Y", "%Y-%m-%d"):
                    try: return _dt.datetime.strptime(str(val).strip()[:10], fmt)
                    except: continue
            return None

        dob_dt = _to_dt(dob)
        if not dob_dt: return result

        target_date = dob_dt + _dt.timedelta(days=target_age * 360.0)

        # Julian Day
        jd = swe.julday(
            target_date.year, target_date.month, target_date.day,
            target_date.hour + target_date.minute / 60.0
        )

        # Lahiri Ayanamsa set karo
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        # Sidereal longitude
        flags = swe.FLG_SIDEREAL | swe.FLG_SWIEPH
        pos, _ = swe.calc_ut(jd, swe_code, flags)
        longitude = pos[0]

        transit_sign = int(longitude / 30) % 12  # 0-based sign index

        # Rahu ka longitude ulta hota hai (retrograde always)
        # Ra → sign theek hai, Ke = Ra + 6
        if planet_code == "Ra":
            transit_sign = int(longitude / 30) % 12

        target_rashi = (lagna_sign + target_house - 1) % 12

        RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
                    "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]

        result.update({
            "is_present":   transit_sign == target_rashi,
            "transit_sign": transit_sign,
            "target_rashi": target_rashi,
            "transit_rashi_hi": RASHI_HI[transit_sign],
            "target_rashi_hi":  RASHI_HI[target_rashi],
            "year":         target_date.year,
            "date_str":     target_date.strftime("%d-%m-%Y"),
            "checked":      True,
        })
    except Exception:
        pass  # swisseph not available ya koi error
    return result


def _build_cycle_analysis(
    planet_code:    str,
    base_age:       int,
    dasha_timeline: List[Dict],
    dob,
    current_age:    int,
    planets:        Dict = None,
    lagna_sign:     int  = 0,
) -> List[Dict]:
    """
    For each 27-yr cycle: MD + AD + PD (deep) + full year scan + house alignment + transit.
    """
    results   = []
    planet_hi = PLANET_NAMES_HI.get(planet_code, planet_code)
    planet_house = (planets or {}).get(planet_code, {}).get("house", 0)

    for i in range(4):
        age = base_age + (i * 27)
        if age > 120:
            break

        # 1. Point-in-time deep dasha (birthday snapshot)
        dasha    = _simulate_dasha_deep(dasha_timeline, dob, age)
        md_code  = dasha.get("md", "?")
        is_match = (md_code == planet_code)

        # 2. Full year scan (365 days)
        year_scan = _scan_full_year_dasha(dasha_timeline, dob, age, planet_code)

        # AD/PD — year scan se lena zyada accurate hai (entire year coverage)
        ad_match  = year_scan.get("ad_match", False) or (dasha.get("ad") == planet_code)
        pd_match  = year_scan.get("pd_match", False) or (dasha.get("pd") == planet_code)
        ad_hi     = dasha.get("ad_hi", "?")
        pd_hi     = dasha.get("pd_hi", "?")

        # Best windows
        best_pd_window = year_scan.get("best_pd_window", "")
        best_ad_window = year_scan.get("best_ad_window", "")
        total_pd_days  = year_scan.get("total_pd_days", 0)
        total_ad_days  = year_scan.get("total_ad_days", 0)

        # 3. House alignment
        alignment = _check_house_alignment(
            planet_code, planet_house, dasha, planets or {}
        )

        # 4. Transit check (swisseph se actual position)
        transit = _check_transit_at_age(
            planet_code, planet_house, lagna_sign, dob, age
        )

        # 5. Status (MD primary, AD/PD upgrade kar sakte hain)
        if not dasha["md_known"]:
            status     = "unknown"
            status_col = "#475569"
        elif is_match:
            status     = "match"
            status_col = "#4ADE80"
        elif ad_match:
            status     = "ad_match"
            status_col = "#FCD34D"
        elif pd_match:
            status     = "pd_match"
            status_col = "#FB923C"
        else:
            status     = "no_match"
            status_col = "#64748B"

        results.append({
            "age":            age,
            "is_current_age": age <= current_age < age + 27,
            "required_hi":    planet_hi,

            # MD
            "dasha_lord":    md_code,
            "dasha_name_hi": dasha.get("md_hi", "?"),
            "is_match":      is_match,
            "status":        status,
            "status_color":  status_col,

            # AD (snapshot + year scan)
            "ad_lord":       dasha.get("ad", "?"),
            "ad_hi":         ad_hi,
            "ad_match":      ad_match,
            "ad_known":      dasha.get("ad_known", False),
            "best_ad_window": best_ad_window,
            "total_ad_days": total_ad_days,

            # PD (year scan — entire year coverage)
            "pd_lord":       dasha.get("pd", "?"),
            "pd_hi":         pd_hi,
            "pd_match":      pd_match,
            "pd_known":      dasha.get("pd_known", False),
            "best_pd_window": best_pd_window,
            "total_pd_days": total_pd_days,

            # All windows for display
            "pd_windows":    year_scan.get("pd_windows", [])[:3],
            "ad_windows":    year_scan.get("ad_windows", [])[:3],

            # House alignment
            "alignment":     alignment,

            # Transit (swisseph actual position)
            "transit": transit,
        })

    return results


def _check_activation(
    planet_code:    str,
    planet_house:   int,
    base_age:       int,
    current_age:    int,
    current_dasha:  str,
    transit_planets: Dict,
    sav:            List[int],
    kaksha_score:   int,
    antardasha:     str = "",
) -> Dict:
    """
    Check karo ki yeh sutra aaj/is saal active hai ya nahi.
    Dasha explanation clearly batao.
    """
    next_year    = _get_next_active_year(base_age, current_age)
    is_this_year = (next_year == current_age)

    # 1. Mahadasha match
    dasha_upper   = current_dasha.upper() if current_dasha else ""
    antar_upper   = antardasha.upper() if antardasha else ""
    planet_upper  = planet_code.upper()
    planet_hi     = PLANET_NAMES_HI.get(planet_code, planet_code)
    maha_hi       = PLANET_NAMES_HI.get(current_dasha, current_dasha)
    antar_hi      = PLANET_NAMES_HI.get(antardasha, antardasha)

    md_match    = planet_upper in dasha_upper or planet_code == current_dasha
    ad_match    = planet_upper in antar_upper or planet_code == antardasha
    dasha_match = md_match or ad_match

    # Build dasha explanation
    if md_match and ad_match:
        dasha_explain = f"✅ {planet_hi} की महादशा + अंतर्दशा दोनों चल रही हैं — 100% सटीक!"
        dasha_color   = "#22D3EE"
    elif md_match:
        dasha_explain = f"✅ {planet_hi} की महादशा चल रही है ({maha_hi} MD) — 80-90% सटीक"
        dasha_color   = "#4ADE80"
    elif ad_match:
        dasha_explain = f"✅ {planet_hi} की अंतर्दशा चल रही है ({maha_hi} MD → {antar_hi} AD) — 70-80% सटीक"
        dasha_color   = "#FCD34D"
    else:
        curr_dasha_str = f"{maha_hi} MD" + (f" → {antar_hi} AD" if antar_hi else "")
        dasha_explain  = f"❌ अभी {curr_dasha_str} चल रही है — {planet_hi} की दशा नहीं, सटीकता कम"
        dasha_color    = "#64748B"

    # 2. Gochar alignment
    natal_rashi   = (planet_house - 1) % 12
    transit_rashi = transit_planets.get(planet_code, {}).get("rashi_index", -1)
    transit_sign  = transit_planets.get(planet_code, {}).get("rashi_name", "")
    gochar_active = (transit_rashi == natal_rashi)

    if gochar_active:
        gochar_explain = f"✅ {planet_hi} आज जन्म भाव {planet_house} की राशि ({transit_sign}) में गोचर कर रहा है"
    else:
        gochar_explain = f"❌ {planet_hi} अभी भाव {planet_house} में नहीं ({transit_sign or 'अज्ञात'} में है)"

    # 3. Moon trigger
    moon_rashi   = transit_planets.get("Mo", {}).get("rashi_index", -1)
    moon_sign    = transit_planets.get("Mo", {}).get("rashi_name", "")
    house_sav    = sav[planet_house - 1] if 0 < planet_house <= 12 else 0
    moon_trigger = (moon_rashi == natal_rashi and house_sav >= 28)

    if moon_trigger:
        moon_explain = f"🌙 चंद्र आज भाव {planet_house} ({moon_sign}) में + SAV {house_sav}≥28 — तत्काल फल!"
    else:
        moon_explain = ""

    # 4. Mahamuhurta
    mahamuhurta = (kaksha_score == 7)

    # Overall score
    score = sum([is_this_year, dasha_match, gochar_active, moon_trigger])
    if mahamuhurta and score >= 2:
        score = min(4, score + 1)

    if score >= 4:
        alert = "🔥 अत्यंत सक्रिय — आज 100% फल!"
        alert_color = "#22D3EE"
    elif score == 3:
        alert = "⚡ बहुत सक्रिय — 80-90% सटीक"
        alert_color = "#4ADE80"
    elif score == 2:
        alert = "✅ सक्रिय — ध्यान दें"
        alert_color = "#F59E0B"
    elif score == 1:
        alert = "💤 आंशिक — इस वर्ष संभव"
        alert_color = "#64748B"
    else:
        alert = "😴 निष्क्रिय"
        alert_color = "#334155"

    return {
        "next_active_year": next_year,
        "is_this_year":     is_this_year,
        "dasha_match":      dasha_match,
        "md_match":         md_match,
        "ad_match":         ad_match,
        "dasha_explain":    dasha_explain,
        "dasha_color":      dasha_color,
        "gochar_active":    gochar_active,
        "gochar_explain":   gochar_explain,
        "moon_trigger":     moon_trigger,
        "moon_explain":     moon_explain,
        "mahamuhurta":      mahamuhurta,
        "activation_score": score,
        "alert":            alert,
        "alert_color":      alert_color,
        "cycle_years":      [base_age + (27 * i) for i in range(4)],
        "current_dasha_str": f"{maha_hi} MD" + (f" → {antar_hi} AD" if antar_hi else ""),
    }


def get_hardship_years(
    planets: Dict,
    sav: List[int],
    current_age: int = 0,
    current_dasha: str = "",
    transit_planets: Dict = None,
    kaksha_score: int = 0,
    antardasha: str = "",
    dasha_timeline: List[Dict] = None,
    dob = None,
    lagna_sign: int = 0,
) -> List[Dict]:
    results = []
    tp = transit_planets or {}
    for code in PAAP_PLANETS:
        house = _get_planet_house(planets, code)
        if not house:
            continue
        total = _sum_sav_lagna_to_house(sav, house)
        product = total * 7
        remainder = product % 27
        age = remainder if remainder != 0 else 27

        # Ashwini se nakshatra gino (1-based → 0-based index)
        nak_index = (age - 1) % 27
        nakshatra = NAKSHATRA_LIST[nak_index]
        trigger_rule = f"जब शनि/राहु {nakshatra} नक्षत्र से गोचर करेंगे → घटना सक्रिय होगी"

        activation = _check_activation(
            code, house, age, current_age,
            current_dasha, tp, sav, kaksha_score, antardasha
        )

        cycle_analysis = _build_cycle_analysis(
            code, age, dasha_timeline or [], dob, current_age, planets, lagna_sign
        )

        results.append({
            "planet":          code,
            "planet_name":     PLANET_NAMES.get(code, code),
            "house":           house,
            "sav_sum":         total,
            "formula":         f"{total} × 7 = {product} ÷ 27 → शेष {age}",
            "age":             age,
            "nakshatra":       nakshatra,
            "trigger_rule":    trigger_rule,
            "type":            "hardship",
            "label":           "⚠️ कष्ट का वर्ष",
            "description":     f"{age} वर्ष की आयु में भारी समस्याएं, दुख या संकट आ सकता है।",
            "accuracy_tip":    "यदि इसी वर्ष उस ग्रह की दशा/अंतर्दशा भी चले, तो यह 80-90% सटीक होता है।",
            "activation":      activation,
            "next_active_year": activation["next_active_year"],
            "cycle_years":     activation["cycle_years"],
            "cycle_analysis":  cycle_analysis,
        })
    return sorted(results, key=lambda x: x["age"])


def get_fortune_years(
    planets: Dict,
    sav: List[int],
    current_age: int = 0,
    current_dasha: str = "",
    transit_planets: Dict = None,
    kaksha_score: int = 0,
    antardasha: str = "",
    dasha_timeline: List[Dict] = None,
    dob = None,
    lagna_sign: int = 0,
) -> List[Dict]:
    results = []
    tp = transit_planets or {}
    for code in SHUBH_PLANETS:
        house = _get_planet_house(planets, code)
        if not house:
            continue
        total = _sum_sav_lagna_to_house(sav, house)
        product = total * 7
        remainder = product % 27
        age = remainder if remainder != 0 else 27

        # Ashwini se nakshatra gino (1-based → 0-based index)
        nak_index = (age - 1) % 27
        nakshatra = NAKSHATRA_LIST[nak_index]
        trigger_rule = f"जब गुरु/शुक्र {nakshatra} नक्षत्र से गोचर करेंगे → शुभ फल सक्रिय होगा"

        activation = _check_activation(
            code, house, age, current_age,
            current_dasha, tp, sav, kaksha_score, antardasha
        )

        cycle_analysis = _build_cycle_analysis(
            code, age, dasha_timeline or [], dob, current_age, planets, lagna_sign
        )

        results.append({
            "planet":          code,
            "planet_name":     PLANET_NAMES.get(code, code),
            "house":           house,
            "sav_sum":         total,
            "formula":         f"{total} × 7 = {product} ÷ 27 → शेष {age}",
            "age":             age,
            "nakshatra":       nakshatra,
            "trigger_rule":    trigger_rule,
            "type":            "fortune",
            "label":           "🌟 भाग्योदय का वर्ष",
            "description":     f"{age} वर्ष की आयु में जीवन का सबसे बड़ा सुख, सफलता और समृद्धि प्राप्त होगी।",
            "accuracy_tip":    "यदि इसी वर्ष शुभ दशा भी चले तो परिणाम 100% शुभ होंगे।",
            "activation":      activation,
            "next_active_year": activation["next_active_year"],
            "cycle_years":     activation["cycle_years"],
            "cycle_analysis":  cycle_analysis,
        })
    return sorted(results, key=lambda x: x["age"])


def compute_fortune_hardship_years(
    planets: Dict,
    sav: List[int],
    current_age: int = 0,
    current_dasha: str = "",
    transit_planets: Dict = None,
    kaksha_score: int = 0,
    antardasha: str = "",
    dasha_timeline: List[Dict] = None,
    dob = None,
    lagna_sign: int = 0,
) -> Dict:
    """Master function — returns both hardship and fortune years with activation data."""
    tp = transit_planets or {}
    hardship = get_hardship_years(planets, sav, current_age, current_dasha, tp, kaksha_score, antardasha, dasha_timeline, dob, lagna_sign)
    fortune  = get_fortune_years(planets, sav, current_age, current_dasha, tp, kaksha_score, antardasha, dasha_timeline, dob, lagna_sign)

    # Combined timeline sorted by age
    timeline = sorted(hardship + fortune, key=lambda x: x["age"])

    # Active alerts — score >= 2
    active_alerts = [e for e in timeline if e.get("activation", {}).get("activation_score", 0) >= 2]

    return {
        "hardship_years":  hardship,
        "fortune_years":   fortune,
        "timeline":        timeline,
        "active_alerts":   active_alerts,
        "mahamuhurta_active": kaksha_score == 7,
        "current_age":     current_age,
        "summary": {
            "earliest_hardship": hardship[0]["age"]  if hardship else None,
            "earliest_fortune":  fortune[0]["age"]   if fortune  else None,
            "total_events":      len(timeline),
            "active_count":      len(active_alerts),
        }
    }


# ─────────────────────────────────────────────
# FEATURE 2 — GRAH BAL (Planet Strength)
# ─────────────────────────────────────────────

def compute_grah_bal(
    planets: Dict,
    sav: List[int],
    bav_charts: Dict
) -> List[Dict]:
    """
    BAV + SAV combined strength for all 9 planets.
    Rahu → Saturn BAV, Ketu → Mars BAV (Shanivat Rahu, Kujvat Ketu)
    """
    results = []
    all_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]

    for code in all_planets:
        house = _get_planet_house(planets, code)
        if not house:
            continue

        # Special rule for Rahu and Ketu
        if code == "Ra":
            bav_source = "Sa"
            note = "शनिवत राहु — शनि के अष्टकवर्ग से बल देखा जाता है"
        elif code == "Ke":
            bav_source = "Ma"
            note = "कुजवत केतु — मंगल के अष्टकवर्ग से बल देखा जाता है"
        else:
            bav_source = code
            note = None

        bav = _bav_points_for_planet(bav_charts, bav_source, house)
        sav_pts = _sav_points_for_house(sav, house)

        # Determine final strength (BAV primary, SAV can rescue or reduce)
        if bav <= 2 and sav_pts >= 30:
            # SAV rescues weak BAV → average
            final_strength = "average"
            override = "SAV ने BAV की कमजोरी को बचाया"
        elif bav >= 5 and sav_pts <= 21:
            # SAV reduces strong BAV → average
            final_strength = "average"
            override = "SAV ने BAV की शक्ति को घटाया"
        else:
            final_strength = _strength_label(bav)
            override = None

        results.append({
            "planet":          code,
            "planet_name":     PLANET_NAMES.get(code, code),
            "house":           house,
            "bav_points":      bav,
            "bav_source":      bav_source,
            "sav_points":      sav_pts,
            "bav_strength":    _strength_label(bav),
            "sav_strength":    _sav_strength_label(sav_pts),
            "final_strength":  final_strength,
            "strength_label":  STRENGTH_LABEL.get(final_strength, final_strength),
            "override_note":   override,
            "rahu_ketu_note":  note,
            "dasha_impact":    "शुभ दशा" if final_strength in ("strong", "very_strong") else
                               "सामान्य दशा" if final_strength == "average" else "अशुभ दशा",
        })

    return results


# ─────────────────────────────────────────────
# FEATURE 3 — WEALTH & STATUS MATRIX
# ─────────────────────────────────────────────

def compute_wealth_matrix(sav: List[int]) -> Dict:
    """
    Multiple wealth sutras from AV:
    - 164 rule, CEO rule, savings, businessman test, etc.
    """
    if len(sav) < 12:
        return {}

    h = {i+1: sav[i] for i in range(12)}  # 1-indexed dict

    # 1. 164 Rule (houses 1,2,4,9,10,11)
    sum_164 = h[1] + h[2] + h[4] + h[9] + h[10] + h[11]
    rule_164 = {
        "score":       sum_164,
        "threshold":   164,
        "passed":      sum_164 >= 164,
        "label":       "🌟 164 बिंदु समृद्धि नियम",
        "result":      "जीवन अत्यधिक सुखमय और संपन्न होगा।" if sum_164 >= 164
                       else "जीवन में आर्थिक संघर्ष की संभावना है।",
    }

    # 2. CEO / Ameer Rule (houses 1,2,9,10,11 all ≥ 30)
    ceo_houses = [h[1], h[2], h[9], h[10], h[11]]
    ceo_count = sum(1 for x in ceo_houses if x >= 30)
    is_super_elite = h[10] >= 33 and h[11] >= 33   # Sudarshan Chakra — dono bhav 33+
    rule_ceo = {
        "house_scores":   {"lagna": h[1], "2nd": h[2], "9th": h[9], "10th": h[10], "11th": h[11]},
        "houses_passed":  ceo_count,
        "passed":         ceo_count >= 5,
        "is_super_elite": is_super_elite,
        "label":          "👑 अमीर और ताकतवर योग",
        "result":         "🏆 सुपर-एलीट CEO / उद्योगपति योग (10वाँ और 11वाँ दोनों ≥ 33)।" if is_super_elite
                          else "अत्यंत धनी और सत्तावान योग है।" if ceo_count == 5
                          else f"{ceo_count}/5 भाव बलवान हैं।",
    }

    # 3. Savings Rule (11 > 12 for savings, 2 > 12 for accumulated wealth)
    savings_ok  = h[11] > h[12]
    savings2_ok = h[2]  > h[12]
    rule_savings = {
        "11th_vs_12th":  {"11th": h[11], "12th": h[12], "good": savings_ok},
        "2nd_vs_12th":   {"2nd": h[2],   "12th": h[12], "good": savings2_ok},
        "label":         "💰 धन बचत सूत्र",
        "result":        "पैसा आता है और टिकता भी है।" if (savings_ok and savings2_ok)
                         else "11वें > 12वें = आय अच्छी" if savings_ok
                         else "12वें > 11वें = खर्च अधिक, बचत मुश्किल।",
    }

    # 4. Continuous income (11 > 10 AND 11 > 12)
    cont_income = h[11] > h[10] and h[11] > h[12]
    rule_income = {
        "10th": h[10], "11th": h[11], "12th": h[12],
        "passed": cont_income,
        "label":  "💸 निरंतर धन प्रवाह",
        "result": "धन का आगमन बिना ज्यादा मेहनत के होता रहेगा।" if cont_income
                  else "मेहनत अधिक, मुनाफा कम।" if h[10] > h[11]
                  else "खर्च आय से अधिक — सावधान!",
    }

    # 5. Business Acumen (houses 1,4,7,10 — min 2 should be ≥ 30)
    biz_houses  = [h[1], h[4], h[7], h[10]]
    biz_count   = sum(1 for x in biz_houses if x >= 30)
    rule_biz = {
        "house_scores": {"lagna": h[1], "4th": h[4], "7th": h[7], "10th": h[10]},
        "houses_passed": biz_count,
        "label":  "🏪 सफल व्यापारी योग",
        "passed": biz_count >= 2,
        "result": "बड़े व्यापारी बनने का प्रबल योग है।" if biz_count >= 4
                  else "व्यापार में सफलता मिलेगी।" if biz_count >= 2
                  else "नौकरी या व्यापार दोनों में संघर्ष की संभावना।",
    }

    # 6. Rajyoga Age (Lagna points = age when Rajyoga activates)
    rajyoga_age = h[1]
    rule_rajyoga = {
        "lagna_points":  rajyoga_age,
        "label":         "⭐ राजयोग सक्रिय होने की उम्र",
        "result":        f"लगभग {rajyoga_age} वर्ष की आयु में राजयोग या बड़ी सफलता मिलती है।",
    }

    # 7. Desires fulfilled (11 > 3)
    desires_ok = h[11] > h[3]
    rule_desires = {
        "3rd": h[3], "11th": h[11],
        "passed": desires_ok,
        "label":  "🌠 सपनों की पूर्ति",
        "result": "जीवन की सभी इच्छाएं पूरी होती हैं।" if desires_ok
                  else "सपने बड़े लेकिन पूर्ति कम होती है।",
    }

    # 8. 76 Rule — debt check (6+8+12 ≤ 76)
    trik_sum = h[6] + h[8] + h[12]
    rule_76 = {
        "trik_sum": trik_sum,
        "threshold": 76,
        "passed":   trik_sum <= 76,
        "label":    "⚖️ 76 बिंदु कर्ज नियम",
        "result":   "आय हमेशा खर्च से अधिक रहेगी।" if trik_sum <= 76
                    else f"कर्ज और खर्चों से परेशानी ({trik_sum} > 76)।",
    }

    # 9. Effort vs Luck (9 vs 10)
    luck_vs_effort = {
        "9th": h[9], "10th": h[10],
        "label":  "🎯 भाग्य बनाम मेहनत",
        "result": "भाग्य से कम मेहनत में अधिक मिलता है।" if h[9] > h[10]
                  else "अपनी मेहनत से ही सब कुछ हासिल करना पड़ता है (Self-Made)." if h[10] > h[9]
                  else "भाग्य और मेहनत का संतुलन है।",
    }

    # Overall wealth score
    score = 0
    if rule_164["passed"]:    score += 25
    if rule_ceo["passed"]:    score += 25
    if rule_savings["11th_vs_12th"]["good"]: score += 15
    if rule_income["passed"]: score += 15
    if rule_biz["passed"]:    score += 10
    if trik_sum <= 76:        score += 10

    # ── MISSING RULE 1: Trikon vs Trik (Rakshak Yoga) ────────────
    # If 1,5,9 sum > 6,8,12 sum → bhagya/help in worst times
    trikon_sum = h[1] + h[5] + h[9]
    trik_sum2  = h[6] + h[8] + h[12]
    rakshak_yoga = trikon_sum > trik_sum2
    rule_rakshak = {
        "trikon_sum": trikon_sum,
        "trik_sum":   trik_sum2,
        "has_yoga":   rakshak_yoga,
        "label":      "🛡️ रक्षक योग — मुसीबत में भाग्य/व्यक्ति बचाएगा" if rakshak_yoga
                      else "⚠️ रक्षक योग नहीं — संकट में अकेले लड़ना पड़ेगा",
        "desc": (f"त्रिकोण ({trikon_sum}) > त्रिक ({trik_sum2}) — बड़ी से बड़ी मुसीबत में "
                 "भाग्य या कोई अपना व्यक्ति बचा लेगा।" if rakshak_yoga
                 else f"त्रिकोण ({trikon_sum}) < त्रिक ({trik_sum2}) — संघर्ष में स्वयं ही निपटना पड़ता है।"),
    }

    # ── MISSING RULE 2: Positive Bank Balance (1st > 12th) ───────
    bank_balance_ok = h[1] > h[12]
    rule_bank_balance = {
        "h1":    h[1],
        "h12":   h[12],
        "good":  bank_balance_ok,
        "label": "✅ हमेशा पॉजिटिव बैलेंस" if bank_balance_ok
                 else "⚠️ खर्च काबू में नहीं",
        "desc": (f"लग्न ({h[1]}) > 12वें ({h[12]}) — खर्च कमाई से हमेशा कम रहता है।"
                 if bank_balance_ok
                 else f"12वें ({h[12]}) ≥ लग्न ({h[1]}) — व्यय पर ध्यान देना जरूरी।"),
    }
    if bank_balance_ok:
        score += 5

    # ── MISSING RULE 3: Shatru Vijay (Lagna > 6th) ───────────────
    shatru_vijay = h[1] > h[6]
    rule_shatru_vijay = {
        "h1":    h[1],
        "h6":    h[6],
        "wins":  shatru_vijay,
        "label": "⚔️ शत्रुओं पर विजय" if shatru_vijay
                 else "⚠️ शत्रु हावी हो सकते हैं",
        "desc": (f"लग्न ({h[1]}) > 6ठा ({h[6]}) — जातक अपने विरोधियों और शत्रुओं पर भारी पड़ता है।"
                 if shatru_vijay
                 else f"6ठा ({h[6]}) ≥ लग्न ({h[1]}) — शत्रुओं से सावधान रहना जरूरी।"),
    }
    if shatru_vijay:
        score += 5

    # ── MISSING RULE 4: Never Unemployed (10th ≥ 28) ─────────────
    never_unemployed = h[10] >= 28
    rule_employment = {
        "h10":   h[10],
        "good":  never_unemployed,
        "label": "💼 कभी बेरोजगार नहीं" if never_unemployed
                 else "⚠️ रोजगार में उतार-चढ़ाव",
        "desc": (f"10वें भाव में {h[10]} ≥ 28 — जातक कभी बेरोजगार नहीं बैठता, "
                 "हमेशा काम मिलता रहता है।" if never_unemployed
                 else f"10वें भाव में {h[10]} < 28 — कर्म क्षेत्र में संघर्ष और अनिश्चितता।"),
    }

    return {
        "rule_164":          rule_164,
        "rule_ceo":          rule_ceo,
        "rule_savings":      rule_savings,
        "rule_income":       rule_income,
        "rule_biz":          rule_biz,
        "rule_rajyoga":      rule_rajyoga,
        "rule_desires":      rule_desires,
        "rule_76":           rule_76,
        "luck_vs_effort":    luck_vs_effort,
        "rule_rakshak":      rule_rakshak,       # ← NEW
        "rule_bank_balance": rule_bank_balance,  # ← NEW
        "rule_shatru_vijay": rule_shatru_vijay,  # ← NEW
        "rule_employment":   rule_employment,    # ← NEW
        "overall_wealth_score": score,
        "wealth_level": "Elite 💎" if score >= 85
                        else "Wealthy 💰" if score >= 60
                        else "Average ⚖️" if score >= 35
                        else "Struggling 📉",
    }


# ─────────────────────────────────────────────
# FEATURE 4 — RELATIONSHIP DOMINANCE
# ─────────────────────────────────────────────

def compute_relationship_analysis(
    sav: List[int],
    bav_charts: Dict
) -> Dict:
    """
    - Lagna vs 7th: who is dominant
    - 7th house score: marriage health
    - Moon AV (chandra_bav) total: mental compatibility
    """
    if len(sav) < 12:
        return {}

    h = {i+1: sav[i] for i in range(12)}

    # Dominance
    dominance = {
        "lagna_points": h[1],
        "7th_points":   h[7],
        "label":        "💑 वैवाहिक प्रभुत्व",
        "dominant":     "आप स्वयं (आत्मनिर्भर)" if h[1] > h[7]
                        else "जीवनसाथी (अधिक प्रभावशाली)" if h[7] > h[1]
                        else "संतुलित (बराबर प्रभाव)",
    }

    # Marriage health from 7th SAV
    seventh = h[7]
    if seventh < 14:
        marriage_status = "very_troubled"
        marriage_label  = "⛔ विवाह में गंभीर समस्याएं — तलाक का खतरा"
    elif seventh <= 22:
        marriage_status = "troubled"
        marriage_label  = "⚠️ दांपत्य जीवन में कलह और मतभेद"
    elif seventh < 28:
        marriage_status = "weak"
        marriage_label  = "🟡 विवाह होने में देरी या कठिनाई संभव"
    elif seventh >= 30:
        marriage_status = "strong"
        marriage_label  = "✅ वैवाहिक जीवन सुखमय और मजबूत"
    else:
        marriage_status = "average"
        marriage_label  = "🔵 विवाह सामान्य रहेगा"

    marriage = {
        "7th_sav":        seventh,
        "status":         marriage_status,
        "label":          marriage_label,
        "danger_zone":    seventh <= 22,
        "divorce_risk":   seventh < 14,
    }

    # Moon AV mental compatibility — 7th house BAV (marriage/partner)
    # v1.1 fix: sum(moon_bav) = always 49 for everyone — use 7th house BAV (0-8 scale)
    moon_bav = bav_charts.get("Mo", [])
    moon_7th_points = int(moon_bav[6]) if len(moon_bav) >= 7 else 0
    if moon_7th_points >= 5:
        compat_label = "💚 मानसिक तालमेल बेहतरीन — विचार मिलते हैं"
        compat_level = "excellent"
    elif moon_7th_points == 4:
        compat_label = "🟡 मानसिक तालमेल ठीक — कभी-कभी बहस"
        compat_level = "good"
    elif moon_7th_points == 3:
        compat_label = "🟠 विचार कम मिलते हैं — झगड़े संभव"
        compat_level = "poor"
    else:
        compat_label = "🔴 मानसिक अनुकूलता बहुत कम — अलगाव का खतरा"
        compat_level = "very_poor"

    moon_compatibility = {
        "moon_7th_bav_points": moon_7th_points,
        "level":               compat_level,
        "label":               compat_label,
        "note":                "चंद्र के BAV में 7वें भाव के बिंदु = मानसिक तालमेल का सटीक माप।",
    }

    # Mind (Lagna) vs Heart (4th house)
    mind_heart = {
        "lagna": h[1],
        "4th":   h[4],
        "type":  "Practical (दिमाग से चलने वाला)" if h[1] > h[4]
                 else "Emotional (भावनाओं से चलने वाला)" if h[4] > h[1]
                 else "Balanced (संतुलित स्वभाव)",
        "label": "🧠 दिमाग बनाम दिल",
    }

    return {
        "dominance":         dominance,
        "marriage":          marriage,
        "moon_compatibility": moon_compatibility,
        "mind_heart":        mind_heart,
    }


# ─────────────────────────────────────────────
# FEATURE 5 — LIFE RISK INDEX (Black Hole Scanner)
# ─────────────────────────────────────────────

def compute_life_risk_index(sav: List[int]) -> Dict:
    """
    - Black Hole: houses with < 15 points
    - Immunity: Lagna vs 6th & 8th
    - Struggle: 6+8+12 sum
    - Ghatak vs Poshak
    """
    if len(sav) < 12:
        return {}

    h = {i+1: sav[i] for i in range(12)}

    # Black Hole detection
    black_holes = []
    danger_zones = []
    for house_num in range(1, 13):
        pts = h[house_num]
        if pts < 15:
            black_holes.append({
                "house":  house_num,
                "points": pts,
                "severity": "extreme" if pts < 10 else "high",
                "warning": f"भाव {house_num} में {pts} बिंदु — यह जीवन का ब्लैक होल है। "
                           f"जब भी शनि/राहु यहाँ गोचर करे, भारी दुर्घटना या कलंक का खतरा।",
            })
        elif pts < 22:
            danger_zones.append({"house": house_num, "points": pts})

    # Immunity (Lagna vs 6th & 8th)
    immunity_ok = h[1] > h[6] and h[1] > h[8] and h[1] >= 28
    immunity = {
        "lagna":   h[1],
        "6th":     h[6],
        "8th":     h[8],
        "strong":  immunity_ok,
        "label":   "💪 रोग-प्रतिरोधक क्षमता (Immunity)",
        "result":  "मजबूत इम्युनिटी — बीमारी जल्दी ठीक होती है।" if immunity_ok
                   else "कमजोर इम्युनिटी — रोग जल्दी लगते हैं।",
    }

    # Trik struggle check (6,8,12 vs Lagna)
    trik_sum  = h[6] + h[8] + h[12]
    trik_high = (h[6] > h[1]) or (h[8] > h[1]) or (h[12] > h[1])
    struggle = {
        "6th": h[6], "8th": h[8], "12th": h[12],
        "trik_sum": trik_sum,
        "lagna":    h[1],
        "struggle_likely": trik_high,
        "label": "⚔️ जीवन संघर्ष सूत्र",
        "result": "भारी जीवन-संघर्ष की संभावना।" if trik_high
                  else "जीवन में संघर्ष कम, सफलता आसानी से मिलती है।",
    }

    # Ghatak (4+8+12) vs Poshak (3+7+11) vs Sewak (2+6+10) vs Bandhu (1+5+9)
    ghatak  = h[4] + h[8]  + h[12]
    poshak  = h[3] + h[7]  + h[11]
    sewak   = h[2] + h[6]  + h[10]
    bandhu  = h[1] + h[5]  + h[9]
    others  = poshak + sewak + bandhu

    ghatak_vs_poshak = {
        "ghatak":  ghatak,
        "poshak":  poshak,
        "sewak":   sewak,
        "bandhu":  bandhu,
        "label":   "🔱 घातक बनाम पोषक",
        "life_happy": ghatak < others,
        "result":  "जीवन सुखी और प्रगतिशील है।" if ghatak < others
                   else "जीवन में भारी संघर्ष और दुखों की संभावना है।",
    }

    # Overall Risk Score (0-100)
    risk = 0
    if len(black_holes) > 0:  risk += 30
    if trik_high:              risk += 25
    if not immunity_ok:        risk += 20
    if ghatak >= others:       risk += 15
    risk = min(risk, 100)

    risk_label = (
        "🔴 उच्च जोखिम (High Risk)" if risk >= 60 else
        "🟡 मध्यम जोखिम (Medium Risk)" if risk >= 35 else
        "🟢 निम्न जोखिम (Low Risk)"
    )

    return {
        "black_holes":        black_holes,
        "danger_zones":       danger_zones,
        "immunity":           immunity,
        "struggle":           struggle,
        "ghatak_vs_poshak":   ghatak_vs_poshak,
        "risk_score":         risk,
        "risk_label":         risk_label,
    }


# ─────────────────────────────────────────────
# FEATURE 5B — DREAM HOUSE / VEHICLE (4th > 30)
# ─────────────────────────────────────────────

def compute_property_yoga(planets: Dict, sav: List[int], bav_charts: Dict) -> Dict:
    """
    Dream House Yoga:
    4th house SAV >= 30 + any shubh planet (Ju/Ve/Mo/Me) aspecting = luxury home & vehicle.
    Also checks: Malefic in 10th + 10th > 30 = career boom.
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    h = {i+1: sav[i] for i in range(12)}

    # Rule 1: Dream House
    fourth_strong = h[4] >= 30
    shubh_in_4    = any(
        planets.get(p, {}).get("house") == 4
        for p in ["Ju", "Ve", "Mo", "Me"]
    )
    # Shubh aspect: Guru from 1st/7th/10th aspects 4th
    guru_house  = planets.get("Ju", {}).get("house", 0)
    guru_aspect_4 = guru_house in {
        h4: {4: {1,7,10}, 1:{4,7,11}, 7:{1,4,10}, 10:{4,7,1}}.get(4, set())
        for h4 in [4]
    }.get(4, set()) or abs(guru_house - 4) in (3, 6, 9)   # Guru aspects 5th, 7th, 9th from itself

    has_dream_home = fourth_strong and (shubh_in_4 or guru_aspect_4)

    if has_dream_home:
        dream_label = "🏠 मनमाफिक लग्जरी घर और वाहन का योग"
        dream_color = "#22D3EE"
        dream_desc  = (f"4थे भाव में {h[4]} ≥ 30 अंक और शुभ ग्रह का प्रभाव — "
                       "जीवन में लग्जरी घर, महंगा वाहन और सुख-संपत्ति अवश्य मिलती है।")
    elif fourth_strong:
        dream_label = "🏡 अच्छे घर का योग"
        dream_color = "#4ADE80"
        dream_desc  = f"4थे भाव में {h[4]} ≥ 30 — सुखी गृहस्थी और संपत्ति का योग।"
    else:
        dream_label = "⚖️ 4थे भाव का सामान्य फल"
        dream_color = "#F59E0B"
        dream_desc  = f"4थे भाव में {h[4]} अंक — संपत्ति के लिए मेहनत करनी पड़ेगी।"

    # Rule 2: Malefic in 10th = career boom
    tenth_pts = h[10]
    malefic_in_10 = any(
        planets.get(p, {}).get("house") == 10
        for p in ["Su", "Ma", "Sa", "Ra"]
    )
    ketu_in_10 = planets.get("Ke", {}).get("house") == 10

    if tenth_pts >= 30 and malefic_in_10 and not ketu_in_10:
        career_label = "🚀 करियर में अपार सफलता (पाप ग्रह + 30+ अंक)"
        career_color = "#22D3EE"
        career_desc  = (f"10वें भाव में {tenth_pts} ≥ 30 अंक + पाप ग्रह की उपस्थिति — "
                        "अपने दम पर करियर में चार-चाँद लगाएगा, यश मिलेगा।")
    elif tenth_pts >= 30 and ketu_in_10:
        career_label = "⚠️ 10वें में केतु — अस्थिर करियर"
        career_color = "#F59E0B"
        career_desc  = f"10वें में {tenth_pts} अंक लेकिन केतु है — करियर में उतार-चढ़ाव।"
    elif tenth_pts >= 28:
        career_label = "✅ अच्छा करियर — कभी बेरोजगार नहीं"
        career_color = "#4ADE80"
        career_desc  = f"10वें में {tenth_pts} ≥ 28 — रोजगार हमेशा मिलता रहेगा।"
    else:
        career_label = "⚒️ करियर में संघर्ष"
        career_color = "#FB923C"
        career_desc  = f"10वें में {tenth_pts} < 28 — करियर में अधिक मेहनत आवश्यक।"

    # Rule 3: Life ups/downs (adjacent house gap)
    max_gap = 0
    max_gap_pair = (1, 2)
    for house in range(1, 12):
        gap = abs(h[house] - h[house + 1])
        if gap > max_gap:
            max_gap = gap
            max_gap_pair = (house, house + 1)

    if max_gap >= 12:
        fluctuation_label = f"🎢 जीवन में बड़े उतार-चढ़ाव (भाव {max_gap_pair[0]}-{max_gap_pair[1]} gap={max_gap})"
        fluctuation_color = "#FB923C"
        fluctuation_desc  = (f"भाव {max_gap_pair[0]} ({h[max_gap_pair[0]]}) और भाव {max_gap_pair[1]} "
                             f"({h[max_gap_pair[1]]}) में {max_gap} का बड़ा अंतर — जीवन में sudden changes।")
    elif max_gap >= 7:
        fluctuation_label = "🌊 मध्यम उतार-चढ़ाव"
        fluctuation_color = "#F59E0B"
        fluctuation_desc  = f"कुछ भावों में अंतर है — जीवन में कुछ बदलाव आते हैं।"
    else:
        fluctuation_label = "✅ जीवन स्थिर और संतुलित"
        fluctuation_color = "#22D3EE"
        fluctuation_desc  = "सभी भावों में अंक संतुलित हैं — जीवन में अचानक बदलाव कम।"

    return {
        "computed":   True,
        "dream_home": {
            "h4":        h[4],
            "strong":    fourth_strong,
            "has_yoga":  has_dream_home,
            "label":     dream_label,
            "color":     dream_color,
            "desc":      dream_desc,
        },
        "career_boom": {
            "h10":           tenth_pts,
            "malefic_in_10": malefic_in_10,
            "ketu_in_10":    ketu_in_10,
            "label":         career_label,
            "color":         career_color,
            "desc":          career_desc,
        },
        "life_fluctuation": {
            "max_gap":       max_gap,
            "gap_pair":      max_gap_pair,
            "label":         fluctuation_label,
            "color":         fluctuation_color,
            "desc":          fluctuation_desc,
        },
    }


# ─────────────────────────────────────────────
# FEATURE 6 — 12-YEAR LIFE CYCLE
# ─────────────────────────────────────────────

def compute_life_cycle(sav: List[int], birth_year: int = 0) -> Dict:
    """
    House 1 = Year 1, 2 = Year 2, ..., 12 = Year 12, 13 = Year 1 again.
    Find golden years (high SAV) and critical years (low SAV).
    """
    if len(sav) < 12:
        return {}

    h = {i+1: sav[i] for i in range(12)}

    houses_sorted_high = sorted(range(1, 13), key=lambda x: h[x], reverse=True)
    houses_sorted_low  = sorted(range(1, 13), key=lambda x: h[x])

    golden_house    = houses_sorted_high[0]
    critical_house  = houses_sorted_low[0]

    # Generate cycles for 0-80 years of life
    golden_ages   = []
    critical_ages = []
    for cycle in range(7):  # 0-84 years
        g_age = golden_house   + (cycle * 12)
        c_age = critical_house + (cycle * 12)
        if g_age <= 80: golden_ages.append(g_age)
        if c_age <= 80: critical_ages.append(c_age)

    # Life phases (3 khanda)
    phase1 = sum(sav[0:4])   # Houses 1-4  (Youth)
    phase2 = sum(sav[4:8])   # Houses 5-8  (Middle age)
    phase3 = sum(sav[8:12])  # Houses 9-12 (Old age)
    best_phase = max([(phase1, "बचपन/युवावस्था (1-30 वर्ष)"),
                      (phase2, "मध्य आयु (30-60 वर्ष)"),
                      (phase3, "बुढ़ापा (60+ वर्ष)")], key=lambda x: x[0])

    # House-wise summary
    house_data = []
    for i in range(1, 13):
        pts = h[i]
        ages_in_cycle = [i + (c * 12) for c in range(6) if i + (c * 12) <= 80]
        house_data.append({
            "house":       i,
            "sav_points":  pts,
            "strength":    _sav_strength_label(pts),
            "ages":        ages_in_cycle,
            "is_golden":   pts >= 30,
            "is_critical": pts < 22,
        })

    return {
        "golden_house":   golden_house,
        "golden_ages":    golden_ages,
        "golden_points":  h[golden_house],
        "critical_house": critical_house,
        "critical_ages":  critical_ages,
        "critical_points": h[critical_house],
        "phase1_score":   phase1,
        "phase2_score":   phase2,
        "phase3_score":   phase3,
        "best_phase":     best_phase[1],
        "house_data":     house_data,
    }


# ─────────────────────────────────────────────
# MASTER FUNCTION (called from engines_bridge.py)
# ─────────────────────────────────────────────

def compute_medical_astrology(planets: Dict, sav: List[int]) -> Dict:
    """
    Medical Astrology — Planet position based disease indicators.
    Based on classical Ashtakvarga sutras.
    """
    indicators = []

    def _house(code):
        return planets.get(code, {}).get("house", 0)

    def _rashi(code):
        return planets.get(code, {}).get("rashi_index", -1)

    def _retro(code):
        return bool(planets.get(code, {}).get("retrograde", False))

    # 1. Chashma / Aankhon ki samasya
    # Shani 1st/7th mein ya Surya ke saath
    sa_house = _house("Sa")
    su_house = _house("Su")
    su_rashi = _rashi("Su")
    if sa_house in (1, 7) or su_rashi in (0, 6):  # Mesh/Tula
        indicators.append({
            "condition":   "👁️ चश्मे का योग",
            "risk":        "medium",
            "color":       "#FB923C",
            "reason":      f"शनि {'1वें' if sa_house==1 else '7वें'} भाव में या सूर्य मेष/तुला में",
            "description": "आंखों की समस्या, चश्मे की संभावना।",
            "remedy":      "सूर्य को जल चढ़ाएं, आंखों की नियमित जांच करवाएं।",
        })

    # 2. Diabetes — Guru Makar (neech)
    ju_rashi = _rashi("Ju")
    if ju_rashi == 9:  # Makar = index 9
        indicators.append({
            "condition":   "🍬 मधुमेह (Diabetes) योग",
            "risk":        "high",
            "color":       "#FB7185",
            "reason":      "गुरु मकर (नीच) राशि में",
            "description": "मधुमेह (Diabetes) की प्रबल संभावना। मीठे पर नियंत्रण जरूरी।",
            "remedy":      "गुरुवार व्रत, पीले वस्त्र, मीठा कम करें।",
        })

    # 3. Kidney — Shukra Kanya (neech)
    ve_rashi = _rashi("Ve")
    if ve_rashi == 5:  # Kanya = index 5
        indicators.append({
            "condition":   "🫘 किडनी समस्या",
            "risk":        "medium",
            "color":       "#FB923C",
            "reason":      "शुक्र कन्या (नीच) राशि में",
            "description": "किडनी या मूत्र संबंधी समस्या की संभावना। पानी खूब पिएं।",
            "remedy":      "शुक्रवार व्रत, सफेद वस्त्र, पानी प्रचुर मात्रा में।",
        })

    # 4. Tvacha/Daant — Budh 6/8/12 ya neech (Meen)
    me_house = _house("Me")
    me_rashi = _rashi("Me")
    if me_house in (6, 8, 12) or me_rashi == 11:  # Meen = 11
        indicators.append({
            "condition":   "🦷 त्वचा/दांत समस्या",
            "risk":        "medium",
            "color":       "#FB923C",
            "reason":      f"बुध {'6/8/12वें भाव' if me_house in (6,8,12) else 'मीन (नीच)'} में",
            "description": "त्वचा रोग या दांतों की समस्या की संभावना।",
            "remedy":      "बुधवार व्रत, हरे वस्त्र, मुंह की सफाई पर ध्यान।",
        })

    # 5. Hriday (Heart) — Surya 6/8/12
    if su_house in (6, 8, 12):
        indicators.append({
            "condition":   "❤️ हृदय (Heart) सावधानी",
            "risk":        "high",
            "color":       "#FB7185",
            "reason":      f"सूर्य {su_house}वें भाव में",
            "description": "हृदय रोग की संभावना। रक्तचाप और कोलेस्ट्रॉल पर ध्यान दें।",
            "remedy":      "रविवार व्रत, आदित्य हृदयम पाठ, नियमित व्यायाम।",
        })

    # Immunity check
    immunity_sav = sav[0] + sav[5] + sav[7]  # lagna + 6th + 8th
    immunity = "मजबूत" if immunity_sav >= 80 else "कमजोर"

    return {
        "computed":    True,
        "indicators":  indicators,
        "count":       len(indicators),
        "immunity":    immunity,
        "immunity_sav": immunity_sav,
        "note":        "ये संकेत हैं, निश्चित नहीं। चिकित्सक से परामर्श लें।",
    }


def compute_av_sutras(
    planets: Dict,
    houses: List,
    sav: List[int],
    bav_charts: Dict,
    birth_year: int = 0,
    current_dasha: str = "",
    transit_planets: Dict = None,
    kaksha_score: int = 0,
    antardasha: str = "",
    dob = None,
    dasha_timeline: List[Dict] = None,
    lagna_sign: int = 0,
    **kwargs,
) -> Dict:
    """
    Master entry point.
    Called from engines_bridge.py in Phase 2 background calculation.

    Args:
        planets:         { "Su": { "house": 1, "rashi": "Aries", ... }, ... }
        houses:          list of house objects (not used directly here)
        sav:             list of 12 SAV point values
        bav_charts:      { "Su": [3,4,2,...12 values], "Mo": [...], ... }
        birth_year:      janam varsh (optional, for age calculation)
        current_dasha:   current mahadasha planet code e.g. "Sa"
        transit_planets: aaj ke graha { "Sa": {"rashi_index": 11}, ... }
        kaksha_score:    0-7 from daily engine

    Returns:
        Complete av_sutras dict with all features.
    """
    try:
        import datetime
        current_age = datetime.date.today().year - birth_year if birth_year else 0
        tp = transit_planets or {}

        # dob और dasha_timeline — direct params लो, नहीं तो kwargs से
        _dasha_raw = dasha_timeline if dasha_timeline is not None else kwargs.get("dasha_timeline", [])
        _dob_raw   = dob if dob is not None else kwargs.get("dob", None)

        # dob को normalize करो — string या object दोनों चलेंगे
        _dob = None
        if _dob_raw:
            if isinstance(_dob_raw, (datetime.date, datetime.datetime)):
                _dob = _dob_raw
            elif isinstance(_dob_raw, str):
                for _fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
                    try:
                        _dob = datetime.datetime.strptime(_dob_raw.strip()[:10], _fmt)
                        break
                    except Exception:
                        continue

        fortune_hardship = compute_fortune_hardship_years(
            planets, sav, current_age, current_dasha, tp, kaksha_score,
            antardasha, _dasha_raw, _dob, lagna_sign
        )
        grah_bal         = compute_grah_bal(planets, sav, bav_charts)
        wealth_matrix    = compute_wealth_matrix(sav)
        relationship     = compute_relationship_analysis(sav, bav_charts)
        risk_index       = compute_life_risk_index(sav)
        life_cycle       = compute_life_cycle(sav, birth_year)
        property_yoga    = compute_property_yoga(planets, sav, bav_charts)
        medical          = compute_medical_astrology(planets, sav)

        return {
            "fortune_hardship": fortune_hardship,
            "medical":          medical,
            "grah_bal":         grah_bal,
            "wealth_matrix":    wealth_matrix,
            "relationship":     relationship,
            "risk_index":       risk_index,
            "life_cycle":       life_cycle,
            "property_yoga":    property_yoga,
            "computed":         True,
            "current_age":      current_age,
            "kaksha_score":     kaksha_score,
            "mahamuhurta":      kaksha_score == 7,
            "engine":           "av_sutras_engine v2.0",
        }

    except Exception as e:
        return {
            "computed":  False,
            "error":     str(e),
            "engine":    "av_sutras_engine v2.0",
        }