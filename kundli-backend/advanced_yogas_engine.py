"""
advanced_yogas_engine.py
=========================
Batch 4 — Indu Lagna + Advanced Yogas (FINAL BATCH)
Completes 62/62 sutra coverage.

Features:
  1.  Indu Lagna Calculation  (Su=30,Mo=16,Ma=6,Me=8,Ju=10,Ve=12,Sa=1)
  2.  Crorepati Yoga          (Indu Lagna SAV ≥ 30)
  3.  Spouse Direction        (Venus BAV highest rashi → E/W/N/S)
  4.  Divorce Danger Zone     (7th house SAV 14-22 specific check)
  5.  Intellect Confusion     (5th house SAV 14-22 specific check)
  6.  Neech Bhang via AV      (Debilitated + BAV 6/7/8 = exalted result)
  7.  Uchha Bhang via AV      (Exalted + BAV 0-3 = zero benefit)
  8.  Rajyoga Debt Trap       (BAV 1-3 + planet in 6th/8th from Guru)
  9.  Sudden Rise Detection   (10th→11th SAV big jump)
  10. Income Trapped          (11th high + 2nd low)
  11. Sudarshan Chakra Avg    (Janm+Chandra+Surya SAV ÷ 3)
  12. Life Cycle by Rashis    (Meen-Mithun / Kark-Tula / Vrishchik-Kumbh)
  13. Bhavat Bhavam           (8th from any bhav = sangharsh indicator)
  14. Partner Moon Compat     (Both charts' Moon BAV comparison)

Corrections Applied (v1.1):
  [BUG FIX 1] Life Cycle by Rashis — sav array is house-based, not rashi-based.
              Old code used rashi indices directly on sav[], giving wrong results
              whenever lagna_index != 0. Fix: map rashi → house via lagna_index offset.
              lagna_index param added to compute_life_cycle_rashis() and master function.
  [BUG FIX 2] Partner Moon Compatibility — sum(bav_charts["Mo"]) always equals 49
              (fixed total for Moon BAV), so every user got "excellent" compatibility.
              Fix: use SAV points at Moon's house (sav[moon_house_idx]) instead,
              which correctly ranges 14–42 and matches the ≥30 threshold logic.

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

# Debilitation rashis (0-based)
NEECH_RASHI = {
    "Su": 6,   # Tula
    "Mo": 7,   # Vrishchik
    "Ma": 3,   # Kark
    "Me": 11,  # Meen
    "Ju": 9,   # Makar
    "Ve": 5,   # Kanya
    "Sa": 0,   # Mesh
}

# Exaltation rashis (0-based)
UCHHA_RASHI = {
    "Su": 0,   # Mesh
    "Mo": 1,   # Vrishabh
    "Ma": 9,   # Makar
    "Me": 5,   # Kanya
    "Ju": 3,   # Kark
    "Ve": 11,  # Meen
    "Sa": 6,   # Tula
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
    p = planets.get(code, {})
    ri = p.get("rashi_index", p.get("rashi_num", 1))
    if isinstance(ri, int) and ri >= 1:
        ri -= 1
    return max(0, min(11, int(ri)))

def _planet_house(planets: Dict, code: str) -> int:
    return int(planets.get(code, {}).get("house", 1))

def _9th_from(rashi: int) -> int:
    """9th rashi from given rashi (0-based)."""
    return (rashi + 8) % 12

def _8th_from_house(house: int) -> int:
    """1-based: 8th house from given house."""
    return ((house - 1 + 7) % 12) + 1


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
    indu_sav   = _sav(sav, indu_rashi)

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
# 3. DANGER ZONE ANALYSIS (5th & 7th houses)
# ─────────────────────────────────────────────

def compute_danger_zones(sav: List[int]) -> Dict:
    """
    7th house 14-22: divorce danger
    5th house 14-22: confused intellect + bad decisions
    """
    h5 = _sav(sav, 4)   # 5th house (0-indexed)
    h7 = _sav(sav, 6)   # 7th house (0-indexed)

    def zone_analysis(points: int, house: int, topic: str) -> Dict:
        if 14 <= points <= 22:
            level = "danger"
            label = f"🔴 {topic} — खतरे का क्षेत्र!"
            color = "#FB7185"
            desc  = (f"{house}वें भाव में {points} बिंदु (14-22 का खतरनाक क्षेत्र)। "
                     f"{'दांपत्य जीवन में गंभीर मतभेद, तलाक संभव।' if house == 7 else 'बुद्धि भ्रमित, गलत निर्णय, शिक्षा काम नहीं आती।'}")
        elif points < 14:
            level = "very_weak"
            label = f"⚠️ {topic} — बहुत कमजोर"
            color = "#FB923C"
            desc  = f"{points} बिंदु — अत्यंत कमजोर भाव।"
        elif points < 25:
            level = "weak"
            label = f"🟡 {topic} — कमजोर"
            color = "#F59E0B"
            desc  = f"{points} बिंदु — थोड़ा संघर्ष संभव।"
        elif points >= 30:
            level = "strong"
            label = f"✅ {topic} — बलवान"
            color = "#22D3EE"
            desc  = f"{points} बिंदु — उत्तम।"
        else:
            level = "average"
            label = f"⚖️ {topic} — सामान्य"
            color = "#4ADE80"
            desc  = f"{points} बिंदु — सामान्य फल।"

        return {
            "house": house, "points": points,
            "in_danger_zone": 14 <= points <= 22,
            "level": level, "label": label, "color": color, "description": desc,
        }

    fifth   = zone_analysis(h5, 5, "5वां भाव (बुद्धि/संतान)")
    seventh = zone_analysis(h7, 7, "7वां भाव (विवाह)")
    both_danger = fifth["in_danger_zone"] and seventh["in_danger_zone"]

    return {
        "computed":       True,
        "fifth_house":    fifth,
        "seventh_house":  seventh,
        "both_danger":    both_danger,
        "combined_alert": (
            "⛔ 5वें और 7वें दोनों खतरे के क्षेत्र में — विवाह और बुद्धि दोनों प्रभावित।"
            if both_danger else ""
        ),
        "rule": "14-22 बिंदु = खतरे का क्षेत्र। <14 = अत्यंत कमजोर। >28 = बलवान।",
    }


# ─────────────────────────────────────────────
# 4. NEECH BHANG + UCHHA BHANG VIA AV
# ─────────────────────────────────────────────

def compute_neech_uchha_av(
    planets: Dict,
    bav_charts: Dict,
    sav: List[int] = None,
) -> List[Dict]:
    """
    For each planet:
    - Neech + BAV 6/7/8 → Neech Bhang = exalted results
    - Uchha + BAV 0/1/2/3 → Uchha Bhang = no benefit
    """
    results = []
    all_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]

    for code in all_planets:
        p_rashi = _planet_rashi(planets, code)
        bav_pts = _bav(bav_charts, code, p_rashi)

        is_neech = (p_rashi == NEECH_RASHI.get(code, -1))
        is_uchha = (p_rashi == UCHHA_RASHI.get(code, -1))

        if is_neech and bav_pts >= 6:
            status = "neech_bhang"
            label  = "🔄 नीच-भंग — उच्च समान फल"
            color  = "#22D3EE"
            desc   = (f"{PLANET_NAMES_HI.get(code,'')} नीच राशि में है लेकिन "
                      f"BAV {bav_pts} ≥ 6 — नीच का फल नहीं, उच्च ग्रह की तरह अपार शक्ति देगा।")
        elif is_neech and bav_pts <= 3:
            status = "neech_double"
            label  = "⛔ नीच + कमजोर BAV"
            color  = "#FB7185"
            desc   = (f"{PLANET_NAMES_HI.get(code,'')} नीच राशि + BAV {bav_pts} ≤ 3 — "
                      "दोहरी कमजोरी। दशा में भारी संघर्ष।")
        elif is_uchha and bav_pts <= 3:
            status = "uchha_bhang"
            label  = "⚠️ उच्च-भंग — बिना फल उच्च"
            color  = "#FB923C"
            desc   = (f"{PLANET_NAMES_HI.get(code,'')} उच्च राशि में है लेकिन "
                      f"BAV {bav_pts} ≤ 3 — उच्च होने का कोई फायदा नहीं, संघर्ष ही मिलेगा।")
        elif is_uchha and bav_pts >= 6:
            status = "uchha_double"
            label  = "🌟 उच्च + बलवान BAV"
            color  = "#22D3EE"
            desc   = (f"{PLANET_NAMES_HI.get(code,'')} उच्च + BAV {bav_pts} ≥ 6 — "
                      "सोने पे सुहागा। असाधारण शक्ति।")
        else:
            status = "normal"
            label  = "⚖️ सामान्य"
            color  = "#F59E0B"
            desc   = ""

        if status != "normal":
            results.append({
                "planet":      code,
                "planet_name": PLANET_NAMES_HI.get(code, code),
                "rashi":       p_rashi,
                "rashi_name":  RASHI_NAMES_HI[p_rashi],
                "bav_points":  bav_pts,
                "is_neech":    is_neech,
                "is_uchha":    is_uchha,
                "status":      status,
                "label":       label,
                "color":       color,
                "description": desc,
            })

    # ── Retrograde Debilitated = Exalted (Vakri Neech Override) ────
    for code in all_planets:
        p         = planets.get(code, {})
        is_retro  = bool(p.get("retrograde", False))
        p_rashi   = _planet_rashi(planets, code)
        is_neech  = (p_rashi == NEECH_RASHI.get(code, -1))
        if is_retro and is_neech:
            bav_pts = _bav(bav_charts, code, p_rashi)
            results.append({
                "planet":      code,
                "planet_name": PLANET_NAMES_HI.get(code, code),
                "rashi":       p_rashi,
                "rashi_name":  RASHI_NAMES_HI[p_rashi],
                "bav_points":  bav_pts,
                "is_neech":    True,
                "is_uchha":    False,
                "status":      "vakri_neech_override",
                "label":       "🔄 वक्री नीच = उच्च समान",
                "color":       "#22D3EE",
                "description": (
                    f"{PLANET_NAMES_HI.get(code,'')} नीच राशि ({RASHI_NAMES_HI[p_rashi]}) में "
                    f"वक्री (Retrograde) है — नीच का फल नहीं मिलता, उच्च ग्रह के समान शुभ फल देगा।"
                ),
            })

    # ── Vargottam + SAV≥30 check ────────────────────────────────
    # Vargottam = same sign in D1 and D9.
    # Tabhee best result deta hai jab rashi ka SAV ≥ 30 ho.
    if sav and len(sav) == 12:
        for code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]:
            d1_sign  = _planet_rashi(planets, code)
            p        = planets.get(code, {})
            degree   = float(p.get("degree", 0))
            full_deg = d1_sign * 30 + degree
            d9_sign  = int(full_deg / (360 / 108)) % 12
            if d1_sign == d9_sign:
                rashi_sav = _sav(sav, d1_sign)
                if rashi_sav >= 30:
                    label = f"⭐ वर्गोत्तम + SAV {rashi_sav}≥30 — असाधारण और स्थायी फल"
                    color = "#22D3EE"
                    desc  = (f"{PLANET_NAMES_HI.get(code,'')} D1 और D9 दोनों में "
                             f"{RASHI_NAMES_HI[d1_sign]} (वर्गोत्तम) और SAV {rashi_sav}≥30 — "
                             "यह ग्रह जीवन में असाधारण स्थायी फल देगा।")
                else:
                    label = f"⚠️ वर्गोत्तम लेकिन SAV {rashi_sav}<30 — फल सीमित"
                    color = "#F59E0B"
                    desc  = (f"{PLANET_NAMES_HI.get(code,'')} वर्गोत्तम है लेकिन "
                             f"SAV केवल {rashi_sav}<30 — पूरा फल नहीं मिलेगा।")
                results.append({
                    "planet": code, "planet_name": PLANET_NAMES_HI.get(code, code),
                    "rashi": d1_sign, "rashi_name": RASHI_NAMES_HI[d1_sign],
                    "is_vargottam": True, "rashi_sav": rashi_sav,
                    "status": "vargottam_strong" if rashi_sav >= 30 else "vargottam_weak_sav",
                    "label": label, "color": color, "description": desc,
                })

    return results


# ─────────────────────────────────────────────
# 5. RAJYOGA DEBT TRAP
# ─────────────────────────────────────────────

def compute_rajyoga_debt_trap(
    planets: Dict,
    bav_charts: Dict,
) -> Dict:
    """
    If any planet has BAV 1-3 AND sits in 6th or 8th from Guru (Jupiter),
    then despite any Rajyoga → always in debt.
    """
    guru_house  = _planet_house(planets, "Ju")
    sixth_from  = ((guru_house - 1 + 5) % 12) + 1
    eighth_from = ((guru_house - 1 + 7) % 12) + 1

    trapped_planets = []
    all_planets = ["Su", "Mo", "Ma", "Me", "Ve", "Sa", "Ra", "Ke"]

    for code in all_planets:
        house   = _planet_house(planets, code)
        rashi   = _planet_rashi(planets, code)
        bav_pts = _bav(bav_charts, code, rashi)

        if house in (sixth_from, eighth_from) and bav_pts <= 3:
            trapped_planets.append({
                "planet":      code,
                "planet_name": PLANET_NAMES_HI.get(code, code),
                "house":       house,
                "bav_pts":     bav_pts,
                "position":    f"गुरु से {'6वें' if house == sixth_from else '8वें'} भाव में",
            })

    has_trap = len(trapped_planets) > 0

    return {
        "computed":          True,
        "guru_house":        guru_house,
        "sixth_from_guru":   sixth_from,
        "eighth_from_guru":  eighth_from,
        "trapped_planets":   trapped_planets,
        "has_debt_trap":     has_trap,
        "label":  "⚠️ राजयोग + कर्ज का जाल" if has_trap else "✅ कर्ज का जाल नहीं",
        "color":  "#FB923C" if has_trap else "#22D3EE",
        "desc":   (
            f"{', '.join(p['planet_name'] for p in trapped_planets)} — "
            f"गुरु से 6वें/8वें भाव में + BAV ≤ 3। कुंडली में राजयोग होने पर भी "
            "हमेशा कर्ज में रहने की संभावना।"
            if has_trap else
            "कर्ज के जाल का कोई ग्रह-योग नहीं।"
        ),
        "rule": "नियम: BAV 1-3 वाला ग्रह गुरु से 6वें/8वें में → राजयोग में भी कर्ज।",
    }


# ─────────────────────────────────────────────
# 6. SUDDEN RISE DETECTION
# ─────────────────────────────────────────────

def compute_sudden_rise(sav: List[int]) -> Dict:
    """
    If 11th house SAV > 10th house SAV by large margin → Sudden Rise.
    """
    h10 = _sav(sav, 9)   # 10th house
    h11 = _sav(sav, 10)  # 11th house
    h9  = _sav(sav, 8)   # 9th (bhagya)

    jump = h11 - h10

    if jump >= 15 and h11 >= 35:
        level = "massive"
        label = "🚀 अचानक बड़ी तरक्की (Sudden Rise)"
        color = "#22D3EE"
        desc  = (f"11वां ({h11}) - 10वां ({h10}) = +{jump} — "
                 "जीवन में अचानक बड़ा कायाकल्प होगा। "
                 "सही दशा आने पर रातोरात नाम और धन दोनों मिलेंगे।")
    elif jump >= 8 and h11 >= 30:
        level = "strong"
        label = "📈 उल्लेखनीय तरक्की"
        color = "#4ADE80"
        desc  = f"11वां ({h11}) > 10वां ({h10}) — अच्छी वृद्धि, मेहनत से सफलता।"
    elif jump >= 0:
        level = "normal"
        label = "⚖️ सामान्य वृद्धि"
        color = "#F59E0B"
        desc  = f"11वां ({h11}) ≥ 10वां ({h10}) — सामान्य तरक्की।"
    else:
        level = "struggle"
        label = "⚒️ मेहनत ज्यादा, तरक्की कम"
        color = "#FB923C"
        desc  = f"10वां ({h10}) > 11वां ({h11}) — परिश्रम का अनुपात में फल नहीं।"

    return {
        "computed":      True,
        "h9": h9, "h10": h10, "h11": h11,
        "jump": jump, "level": level,
        "label": label, "color": color, "description": desc,
        "bhagya_factor": (
            "भाग्य का साथ भी है।" if h9 >= 30
            else "भाग्य का विशेष साथ नहीं — मेहनत से ही मिलेगा।"
        ),
        "rule": "नियम: 10वें से 11वें में बड़ा उछाल + दशा अनुकूल = Sudden Rise।",
    }


# ─────────────────────────────────────────────
# 7. INCOME TRAPPED
# ─────────────────────────────────────────────

def compute_income_trapped(sav: List[int]) -> Dict:
    """
    If 11th (income) is high but 2nd (savings) is low:
    Earns a lot but can't save.
    """
    h2  = _sav(sav, 1)   # 2nd house
    h11 = _sav(sav, 10)  # 11th house
    h12 = _sav(sav, 11)  # 12th house

    is_trapped = h11 >= 32 and h2 <= 24
    is_spender = h12 > h11
    is_saver   = h11 > h12 and h2 >= 28

    if is_trapped:
        label = "💸 आय अच्छी, बचत शून्य!"
        color = "#FB923C"
        desc  = (f"11वां ({h11}) बहुत अच्छा लेकिन 2रा ({h2}) कमजोर — "
                 "खूब कमाते हैं लेकिन पैसा जोड़ नहीं पाते।")
        level = "trapped"
    elif is_spender:
        label = "⚠️ खर्च आय से अधिक"
        color = "#FB7185"
        desc  = f"12वां ({h12}) > 11वां ({h11}) — हमेशा खर्च ज्यादा।"
        level = "overspend"
    elif is_saver:
        label = "✅ कमाई और बचत दोनों"
        color = "#22D3EE"
        desc  = f"11वां ({h11}) > 12वां ({h12}), 2रा ({h2}) भी मजबूत — पैसा आता है और टिकता भी है।"
        level = "saver"
    else:
        label = "⚖️ सामान्य वित्त स्थिति"
        color = "#4ADE80"
        desc  = "आय और व्यय का सामान्य संतुलन।"
        level = "normal"

    return {
        "computed": True,
        "h2": h2, "h11": h11, "h12": h12,
        "is_trapped": is_trapped, "is_spender": is_spender, "is_saver": is_saver,
        "level": level, "label": label, "color": color, "description": desc,
        "rule": "नियम: 11वां ↑ + 2रा ↓ = कमाई खूब, बचत शून्य।",
    }


# ─────────────────────────────────────────────
# 8. SUDARSHAN CHAKRA AVERAGE
# ─────────────────────────────────────────────

def compute_sudarshan_average(
    janm_sav: List[int],
    chandra_sav: Optional[List[int]] = None,
    surya_sav: Optional[List[int]] = None,
) -> Dict:
    """
    Average of 3 lagna SAVs = True house power.
    CEO Rule: 10th/11th average ≥ 30-35 = high status.
    """
    if not janm_sav or len(janm_sav) < 12:
        return {"computed": False, "reason": "Janm SAV unavailable"}

    c_sav = chandra_sav if (chandra_sav and len(chandra_sav) == 12) else janm_sav
    s_sav = surya_sav   if (surya_sav   and len(surya_sav)   == 12) else janm_sav

    has_all_three = (chandra_sav is not None and surya_sav is not None)

    avg_houses = [round((janm_sav[i] + c_sav[i] + s_sav[i]) / 3, 1) for i in range(12)]

    def _avg(i): return avg_houses[i]

    ceo_avg = round((_avg(9) + _avg(10)) / 2, 1)  # 10th and 11th
    if ceo_avg >= 33:
        ceo_label = "👑 CEO / IAS स्तर"
        ceo_color = "#22D3EE"
    elif ceo_avg >= 28:
        ceo_label = "💼 उच्च पद"
        ceo_color = "#4ADE80"
    elif ceo_avg >= 22:
        ceo_label = "⚖️ मध्यम स्तर"
        ceo_color = "#F59E0B"
    else:
        ceo_label = "⚒️ संघर्ष का स्तर"
        ceo_color = "#FB923C"

    sorted_avg  = sorted(enumerate(avg_houses), key=lambda x: x[1], reverse=True)
    best_house  = sorted_avg[0][0] + 1
    worst_house = sorted_avg[-1][0] + 1

    house_data = [
        {
            "house":    i + 1,
            "janm_sav": janm_sav[i],
            "avg":      avg_houses[i],
            "strong":   avg_houses[i] >= 30,
            "weak":     avg_houses[i] < 22,
        }
        for i in range(12)
    ]

    return {
        "computed":       True,
        "has_all_three":  has_all_three,
        "avg_houses":     avg_houses,
        "house_data":     house_data,
        "ceo_avg":        ceo_avg,
        "ceo_label":      ceo_label,
        "ceo_color":      ceo_color,
        "best_house":     best_house,
        "worst_house":    worst_house,
        "income_surplus": round(_avg(10) - _avg(11), 1),
        "note": (
            "तीनों लग्न (जन्म, चंद्र, सूर्य) का औसत ही वास्तविक भाव-शक्ति है।"
            if has_all_three else
            "⚠️ केवल जन्म SAV से average निकाला — अधिक सटीकता के लिए Chandra/Surya SAV भी दें।"
        ),
        "rule": "नियम: Average ही सत्य है — किसी एक लग्न से निर्णय न करें।",
    }



# ─────────────────────────────────────────────
# 9B. SUDARSHAN PAAP KARTARI
# ─────────────────────────────────────────────

def compute_paap_kartari(
    planets: Dict,
    sav: List[int],
) -> Dict:
    """
    Sudarshan Paap Kartari:
    10th house avg ≥30 BUT 9th AND 11th both have malefics
    → unexplained obstacles despite good points.
    """
    MALEFICS = {"Su", "Ma", "Sa", "Ra", "Ke"}

    def has_malefic(house: int) -> bool:
        return any(planets.get(p, {}).get("house") == house for p in MALEFICS)

    h = {i+1: sav[i] for i in range(12)}

    tenth_kartari = h[10] >= 30 and has_malefic(9) and has_malefic(11)

    kartari_houses = []
    for house in range(1, 13):
        prev_h = ((house - 2) % 12) + 1
        next_h = (house % 12) + 1
        if has_malefic(prev_h) and has_malefic(next_h):
            kartari_houses.append({"house": house, "house_pts": h[house]})

    return {
        "computed":         True,
        "tenth_kartari":    tenth_kartari,
        "tenth_kartari_msg": (
            "⚠️ सुदर्शन पाप कर्तरी: 10वें भाव के 30+ अंक होने के बावजूद 9वें और 11वें में "
            "क्रूर ग्रह — करियर में बिना वजह भारी रुकावटें।" if tenth_kartari else ""
        ),
        "kartari_houses": kartari_houses,
        "has_kartari":    len(kartari_houses) > 0,
        "summary": (
            f"⚠️ भाव {[k['house'] for k in kartari_houses]} में पाप कर्तरी"
            if kartari_houses else "✅ कोई पाप कर्तरी योग नहीं"
        ),
        "rule": "नियम: किसी भाव के दोनों तरफ क्रूर ग्रह हों → उस भाव के शुभ फल अवरुद्ध।",
    }


# ─────────────────────────────────────────────
# 9. LIFE CYCLE BY RASHIS
# ─────────────────────────────────────────────

def compute_life_cycle_rashis(sav: List[int], lagna_index: int = 0) -> Dict:
    """
    Divide 12 rashis into 3 life phases:
    Phase 1 (Youth 0-30):    Meen(11)–Mithun(2) → rashi indices [11,0,1,2]
    Phase 2 (Middle 30-60):  Kark(3)–Tula(6)    → rashi indices [3,4,5,6]
    Phase 3 (Old 60+):       Vrishchik(7)–Kumbh(10) → rashi indices [7,8,9,10]

    [BUG FIX v1.1] sav is house-based, not rashi-based.
    OLD: p1 = sum(sav[i] for i in phase1_rashis)
         → used rashi index directly on house-based array (wrong for non-Aries lagna)
    NEW: each rashi is mapped to its house via lagna_index offset, then SAV is fetched.
         house_idx = (rashi_idx - lagna_index) % 12  →  sav[house_idx]
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    # Helper: get SAV for a rashi by converting to correct house index
    def rashi_to_sav(rashi_idx: int) -> int:
        house_idx = (rashi_idx - lagna_index) % 12
        return sav[house_idx]

    # Phase groupings (0-based rashi indices)
    phase1_rashis = [11, 0, 1, 2]   # Meen, Mesh, Vrishabh, Mithun
    phase2_rashis = [3,  4, 5, 6]   # Kark, Singh, Kanya, Tula
    phase3_rashis = [7,  8, 9, 10]  # Vrishchik, Dhanu, Makar, Kumbh

    p1 = sum(rashi_to_sav(i) for i in phase1_rashis)
    p2 = sum(rashi_to_sav(i) for i in phase2_rashis)
    p3 = sum(rashi_to_sav(i) for i in phase3_rashis)

    phases = [
        {"name": "युवावस्था (0-30 वर्ष)", "rashis": "मीन-मिथुन", "score": p1,
         "rashi_names": [RASHI_NAMES_HI[i] for i in phase1_rashis]},
        {"name": "मध्य आयु (30-60 वर्ष)", "rashis": "कर्क-तुला", "score": p2,
         "rashi_names": [RASHI_NAMES_HI[i] for i in phase2_rashis]},
        {"name": "उत्तर आयु (60+ वर्ष)", "rashis": "वृश्चिक-कुंभ", "score": p3,
         "rashi_names": [RASHI_NAMES_HI[i] for i in phase3_rashis]},
    ]

    best_phase = max(phases, key=lambda x: x["score"])
    for ph in phases:
        ph["is_best"] = ph["name"] == best_phase["name"]

    return {
        "computed":   True,
        "phases":     phases,
        "best_phase": best_phase,
        "scores":     [p1, p2, p3],
        "label":      f"🏆 सर्वश्रेष्ठ काल: {best_phase['name']}",
        "color":      "#22D3EE",
        "desc":       f"{best_phase['name']} ({best_phase['rashis']}) — स्कोर {best_phase['score']} — जीवन का यह हिस्सा सबसे सुखी और समृद्ध।",
    }


# ─────────────────────────────────────────────
# 10. BHAVAT BHAVAM
# ─────────────────────────────────────────────

def compute_bhavat_bhavam(sav: List[int]) -> List[Dict]:
    """
    For each house, find its 8th (sangharsh indicator).
    """
    if not sav or len(sav) < 12:
        return []

    BHAV_TOPICS = {
        1: "स्वयं (स्वास्थ्य/व्यक्तित्व)", 2: "धन/परिवार",
        3: "भाई/साहस",                     4: "माता/सुख/वाहन",
        5: "संतान/बुद्धि",                  6: "शत्रु/रोग/कर्ज",
        7: "जीवनसाथी/व्यापार",              8: "आयु/मृत्यु/रहस्य",
        9: "पिता/भाग्य/धर्म",               10: "कर्म/करियर/यश",
        11: "आय/लाभ/मित्र",                 12: "व्यय/मोक्ष/विदेश",
    }

    results = []
    for house in range(1, 13):
        eighth = _8th_from_house(house)
        h_pts  = _sav(sav, house - 1)
        e_pts  = _sav(sav, eighth - 1)

        if e_pts > h_pts:
            struggle = True
            label    = f"⚠️ संघर्ष: {BHAV_TOPICS.get(house,'')}"
            color    = "#FB923C"
            desc     = (f"{house}वें भाव SAV={h_pts} < {eighth}वें ({e_pts}) — "
                        f"'{BHAV_TOPICS.get(house,'')}' में संघर्ष।")
        else:
            struggle = False
            label    = f"✅ {BHAV_TOPICS.get(house,'')}"
            color    = "#22D3EE" if h_pts >= 28 else "#4ADE80"
            desc     = ""

        results.append({
            "house":        house,
            "topic":        BHAV_TOPICS.get(house, ""),
            "house_pts":    h_pts,
            "eighth_house": eighth,
            "eighth_pts":   e_pts,
            "struggle":     struggle,
            "label":        label,
            "color":        color,
            "description":  desc,
        })

    return results


# ─────────────────────────────────────────────
# 11. PARTNER MOON COMPATIBILITY
# ─────────────────────────────────────────────

# ─────────────────────────────────────────────
# 11. HOUSE COMPARISON RULES
# ─────────────────────────────────────────────

def compute_house_comparisons(sav: List[int]) -> Dict:
    """
    4 comparison rules:
    1. 3rd vs 11th  — Sapnon ki purti
    2. Lagna vs 4th — Dimag vs Dil
    3. Lagna vs 7th — Vivah mein dominance
    4. 9th vs 10th  — Bhagya vs Mehnat
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    h1  = sav[0]   # Lagna
    h3  = sav[2]   # 3rd
    h4  = sav[3]   # 4th
    h7  = sav[6]   # 7th
    h9  = sav[8]   # 9th
    h10 = sav[9]   # 10th
    h11 = sav[10]  # 11th

    # Rule 1: 3rd vs 11th — Sapne vs Purti
    if h11 > h3:
        r1_label = "✅ सपने पूरे होते हैं"
        r1_desc  = f"11वां ({h11}) > 3रा ({h3}) — इच्छाएं और लक्ष्य पूरे होते हैं।"
        r1_color = "#22D3EE"
        r1_good  = True
    elif h11 == h3:
        r1_label = "⚖️ मिश्रित — कुछ सपने पूरे, कुछ नहीं"
        r1_desc  = f"11वां ({h11}) = 3रा ({h3}) — आधी इच्छाएं पूरी होती हैं।"
        r1_color = "#F59E0B"
        r1_good  = None
    else:
        r1_label = "⚠️ सपने अधूरे रह जाते हैं"
        r1_desc  = f"3रा ({h3}) > 11वां ({h11}) — इच्छाशक्ति है पर फल नहीं मिलता।"
        r1_color = "#FB7185"
        r1_good  = False

    # Rule 2: Lagna vs 4th — Dimag vs Dil
    if h1 > h4:
        r2_label = "🧠 प्रैक्टिकल — दिमाग से चलते हैं"
        r2_desc  = f"लग्न ({h1}) > 4था ({h4}) — तर्क और व्यावहारिकता प्रबल।"
        r2_color = "#22D3EE"
    elif h4 > h1:
        r2_label = "❤️ भावुक — दिल से चलते हैं"
        r2_desc  = f"4था ({h4}) > लग्न ({h1}) — भावनाएं और संवेदनशीलता प्रबल।"
        r2_color = "#F472B6"
    else:
        r2_label = "⚖️ संतुलित — दिमाग और दिल दोनों"
        r2_desc  = f"लग्न ({h1}) = 4था ({h4}) — दोनों का संतुलन।"
        r2_color = "#4ADE80"

    # Rule 3: Lagna vs 7th — Vivah mein kaun dominant
    if h1 > h7:
        r3_label = "👤 आप वैवाहिक जीवन में हावी"
        r3_desc  = f"लग्न ({h1}) > 7वां ({h7}) — आप रिश्ते में dominant रहते हैं।"
        r3_color = "#F59E0B"
        r3_dominant = "self"
    elif h7 > h1:
        r3_label = "👫 जीवनसाथी वैवाहिक जीवन में हावी"
        r3_desc  = f"7वां ({h7}) > लग्न ({h1}) — जीवनसाथी अधिक dominant होगा/होगी।"
        r3_color = "#C084FC"
        r3_dominant = "partner"
    else:
        r3_label = "⚖️ बराबरी का रिश्ता"
        r3_desc  = f"लग्न ({h1}) = 7वां ({h7}) — दोनों बराबर निर्णय लेते हैं।"
        r3_color = "#4ADE80"
        r3_dominant = "equal"

    # Rule 4: 9th vs 10th — Bhagya vs Mehnat
    if h10 > h9:
        r4_label = "💪 Self-Made — मेहनत से सफलता"
        r4_desc  = f"10वां ({h10}) > 9वां ({h9}) — भाग्य कम, खुद की मेहनत अधिक काम आती है।"
        r4_color = "#FB923C"
        r4_type  = "self_made"
    elif h9 > h10:
        r4_label = "🍀 भाग्यशाली — आसानी से सफलता"
        r4_desc  = f"9वां ({h9}) > 10वां ({h10}) — भाग्य साथ देता है, सफलता आसानी से मिलती है।"
        r4_color = "#4ADE80"
        r4_type  = "lucky"
    else:
        r4_label = "⚖️ मेहनत और भाग्य दोनों समान"
        r4_desc  = f"9वां ({h9}) = 10वां ({h10}) — दोनों बराबर योगदान करते हैं।"
        r4_color = "#22D3EE"
        r4_type  = "balanced"

    return {
        "computed": True,
        "h1": h1, "h3": h3, "h4": h4, "h7": h7, "h9": h9, "h10": h10, "h11": h11,
        "sapne_purti": {
            "label": r1_label, "desc": r1_desc, "color": r1_color,
            "h3": h3, "h11": h11, "good": r1_good,
            "rule": "नियम: 11वां > 3रा → सपने पूरे होते हैं।"
        },
        "dimag_dil": {
            "label": r2_label, "desc": r2_desc, "color": r2_color,
            "h1": h1, "h4": h4,
            "rule": "नियम: लग्न > 4था → प्रैक्टिकल | 4था > लग्न → भावुक।"
        },
        "vivah_dominance": {
            "label": r3_label, "desc": r3_desc, "color": r3_color,
            "h1": h1, "h7": h7, "dominant": r3_dominant,
            "rule": "नियम: लग्न > 7वां → आप dominant | 7वां > लग्न → साथी dominant।"
        },
        "bhagya_mehnat": {
            "label": r4_label, "desc": r4_desc, "color": r4_color,
            "h9": h9, "h10": h10, "type": r4_type,
            "rule": "नियम: 10वां > 9वां → Self-Made | 9वां > 10वां → भाग्यशाली।"
        },
    }


# ─────────────────────────────────────────────
# 12. MEGA RULES — 164, 76, Black Hole, Saatvik
# ─────────────────────────────────────────────

def compute_mega_rules(sav: List[int]) -> Dict:
    """
    4 fixed-point mega rules:
    1. 164 — Prosperity (1+2+4+9+10+11 >= 164)
    2. 76  — Debt-free  (6+8+12 <= 76)
    3. Black Hole (<15 in any house)
    4. Saatvik vs Dikhawa (internal vs external houses)
    """
    if not sav or len(sav) < 12:
        return {"computed": False}

    # Rule 1: 164 — Prosperity
    prosperity_houses = [1, 2, 4, 9, 10, 11]  # 1-indexed
    prosperity_sum = sum(sav[h-1] for h in prosperity_houses)
    is_prosperous = prosperity_sum >= 164
    prosperity_result = {
        "sum": prosperity_sum,
        "threshold": 164,
        "is_prosperous": is_prosperous,
        "label": "✅ समृद्धि योग — जीवन सुखमय और संपन्न" if is_prosperous else "⚠️ संघर्ष योग — जीवन में कठिनाइयां",
        "color": "#22D3EE" if is_prosperous else "#FB923C",
        "desc": (
            f"1+2+4+9+10+11 भावों का योग = {prosperity_sum} "
            f"({'≥164 ✅' if is_prosperous else '<164 ⚠️'})"
        ),
        "house_vals": {str(h): sav[h-1] for h in prosperity_houses},
        "rule": "नियम: भाव 1,2,4,9,10,11 का योग ≥164 = जीवन अत्यधिक सुखमय और संपन्न।",
    }

    # Rule 2: 76 — Debt-free
    trik_houses = [6, 8, 12]
    trik_sum = sum(sav[h-1] for h in trik_houses)
    is_debtfree = trik_sum <= 76
    debtfree_result = {
        "sum": trik_sum,
        "threshold": 76,
        "is_debtfree": is_debtfree,
        "label": "✅ कर्ज-मुक्त जीवन" if is_debtfree else "⚠️ कर्ज का योग",
        "color": "#4ADE80" if is_debtfree else "#FB7185",
        "desc": (
            f"6+8+12 भावों का योग = {trik_sum} "
            f"({'≤76 ✅' if is_debtfree else '>76 ⚠️'})"
        ),
        "house_vals": {str(h): sav[h-1] for h in trik_houses},
        "rule": "नियम: भाव 6,8,12 का योग ≤76 = व्यक्ति हमेशा कर्ज-मुक्त रहता है।",
    }

    # Rule 3: Black Hole (<15 in any house)
    black_holes = []
    for i, pts in enumerate(sav):
        if pts < 15:
            HOUSE_TOPICS = {
                1: "स्वास्थ्य/व्यक्तित्व", 2: "धन/परिवार", 3: "साहस/भाई",
                4: "सुख/माता/वाहन", 5: "संतान/बुद्धि", 6: "शत्रु/रोग",
                7: "विवाह/साझेदारी", 8: "आयु/रहस्य", 9: "भाग्य/पिता",
                10: "करियर/यश", 11: "लाभ/मित्र", 12: "व्यय/विदेश"
            }
            black_holes.append({
                "house": i+1,
                "points": pts,
                "topic": HOUSE_TOPICS.get(i+1, ""),
                "warning": f"⚫ भाव {i+1} ({HOUSE_TOPICS.get(i+1,'')}) में मात्र {pts} बिंदु — खतरनाक क्षेत्र!"
            })

    blackhole_result = {
        "has_blackhole": len(black_holes) > 0,
        "black_holes": black_holes,
        "count": len(black_holes),
        "label": f"⚫ {len(black_holes)} ब्लैक होल मिले!" if black_holes else "✅ कोई ब्लैक होल नहीं",
        "color": "#FB7185" if black_holes else "#4ADE80",
        "rule": "नियम: जिस भाव में <15 बिंदु — वह जीवन का 'ब्लैक होल' है। गोचर यहाँ से गुजरे तो भारी कष्ट।",
    }

    # Rule 4: Saatvik vs Dikhawa
    internal_houses = [1, 4, 5, 7, 9, 10]   # Kendra + Trikona
    external_houses = [2, 3, 6, 8, 11, 12]   # Baki
    internal_sum = sum(sav[h-1] for h in internal_houses)
    external_sum = sum(sav[h-1] for h in external_houses)

    if internal_sum > external_sum:
        sv_label = "🙏 सात्विक स्वभाव — आंतरिक मूल्य प्रबल"
        sv_desc  = f"आंतरिक ({internal_sum}) > बाहरी ({external_sum}) — व्यक्ति सात्विक, दिखावा कम।"
        sv_color = "#4ADE80"
        sv_type  = "saatvik"
    elif external_sum > internal_sum:
        sv_label = "✨ दिखावा प्रधान — बाहरी छवि महत्वपूर्ण"
        sv_desc  = f"बाहरी ({external_sum}) > आंतरिक ({internal_sum}) — दिखावे और छवि पर ध्यान।"
        sv_color = "#C084FC"
        sv_type  = "dikhawa"
    else:
        sv_label = "⚖️ संतुलित स्वभाव"
        sv_desc  = f"आंतरिक ({internal_sum}) = बाहरी ({external_sum}) — संतुलित व्यक्तित्व।"
        sv_color = "#F59E0B"
        sv_type  = "balanced"

    saatvik_result = {
        "internal_sum": internal_sum,
        "external_sum": external_sum,
        "type": sv_type,
        "label": sv_label,
        "desc": sv_desc,
        "color": sv_color,
        "rule": "नियम: केंद्र+त्रिकोण (1,4,5,7,9,10) > बाकी → सात्विक | बाकी अधिक → दिखावा।",
    }

    return {
        "computed":    True,
        "prosperity":  prosperity_result,
        "debtfree":    debtfree_result,
        "blackhole":   blackhole_result,
        "saatvik":     saatvik_result,
    }


def compute_partner_compatibility(
    self_moon_sav: int,
    partner_moon_bav_total: Optional[int],
) -> Dict:
    """
    Compares Moon SAV at moon's house for mental compatibility.

    [BUG FIX v1.1] Previously called with sum(bav_charts["Mo"]) which always = 49
    (Moon BAV total is always fixed at 49 across 12 houses), causing every user to
    get "excellent" compatibility. Now uses SAV at Moon's house (14–42 scale),
    which is the correct metric per Dr. Dadhich's sutra.

    self_moon_sav:         SAV points at native's Moon house (use sav[moon_house_idx])
    partner_moon_bav_total: Partner's SAV at their Moon house (future feature)
    """
    if partner_moon_bav_total is None:
        return {
            "computed": False,
            "self_moon_sav": self_moon_sav,
            "reason":   "Partner's Moon SAV not provided.",
        }

    def classify(total: int) -> str:
        if total >= 30: return "excellent"
        if total >= 25: return "good"
        if total >= 20: return "poor"
        return "very_poor"

    self_level    = classify(self_moon_sav)
    partner_level = classify(partner_moon_bav_total)

    level_rank = {"excellent": 3, "good": 2, "poor": 1, "very_poor": 0}
    combined   = min(level_rank[self_level], level_rank[partner_level])

    LABELS = {
        3: ("💚 मानसिक तालमेल उत्कृष्ट",               "#22D3EE"),
        2: ("🟡 तालमेल ठीक — कभी-कभी बहस",             "#4ADE80"),
        1: ("🟠 विचार कम मिलते हैं — झगड़े संभव",       "#FB923C"),
        0: ("🔴 मानसिक अनुकूलता बहुत कम — अलगाव खतरा", "#FB7185"),
    }
    label, color = LABELS.get(combined, ("⚖️ सामान्य", "#F59E0B"))

    return {
        "computed":         True,
        "self_moon_sav":    self_moon_sav,
        "partner_moon_sav": partner_moon_bav_total,
        "self_level":       self_level,
        "partner_level":    partner_level,
        "combined_rank":    combined,
        "label":            label,
        "color":            color,
        "description": (
            f"आपका चंद्र भाव SAV: {self_moon_sav} | "
            f"साथी का चंद्र भाव SAV: {partner_moon_bav_total}"
        ),
        "rule": "नियम: दोनों के चंद्र भाव SAV में 30+ = मानसिक तालमेल उत्कृष्ट। 70% मामलों में सच।",
        "scale": [
            {"range": "≥30", "label": "उत्कृष्ट तालमेल"},
            {"range": "25-29", "label": "अच्छा तालमेल"},
            {"range": "20-24", "label": "बहस संभव"},
            {"range": "<20",   "label": "अलगाव का खतरा"},
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
        chandra_lagna_sav:      Optional SAV from Chandra Lagna
        surya_lagna_sav:        Optional SAV from Surya Lagna
        partner_moon_bav_total: Partner's Moon house SAV points (optional)
    """
    try:
        result = {"computed": True, "engine": "advanced_yogas_engine v1.1"}

        result["indu_lagna"]       = compute_indu_lagna(planets, sav, lagna_index, moon_rashi)
        result["spouse_direction"] = compute_spouse_direction(bav_charts)
        result["danger_zones"]     = compute_danger_zones(sav)
        result["neech_uchha"]      = compute_neech_uchha_av(planets, bav_charts, sav)
        result["debt_trap"]        = compute_rajyoga_debt_trap(planets, bav_charts)
        result["sudden_rise"]      = compute_sudden_rise(sav)
        result["income_trapped"]   = compute_income_trapped(sav)
        result["sudarshan_avg"]    = compute_sudarshan_average(sav, chandra_lagna_sav, surya_lagna_sav)

        # [BUG FIX 1] Pass lagna_index so rashi→house mapping is correct
        result["life_cycle_rashis"] = compute_life_cycle_rashis(sav, lagna_index)

        result["bhavat_bhavam"] = compute_bhavat_bhavam(sav)
        result["paap_kartari"]    = compute_paap_kartari(planets, sav)
        result["d30_scandal"]      = compute_d30_scandal(planets, bav_charts)
        result["house_comparisons"] = compute_house_comparisons(sav)
        result["mega_rules"]        = compute_mega_rules(sav)

        # [BUG FIX 2] Use SAV at Moon's house instead of sum(Moon BAV) which is always 49
        # sav is house-based; moon_house_idx = (moon_rashi - lagna_index) % 12
        moon_house_idx = (moon_rashi - lagna_index) % 12
        self_moon_sav  = sav[moon_house_idx] if sav else 0

        result["partner_compat"] = compute_partner_compatibility(
            self_moon_sav,
            partner_moon_bav_total,
        )

        result["summary"] = {
            "indu_wealth":      result["indu_lagna"].get("wealth_level", ""),
            "crorepati_yoga":   result["indu_lagna"].get("indu_sav", 0) >= 30,
            "spouse_direction": result["spouse_direction"].get("spouse_direction", ""),
            "sudden_rise":      result["sudden_rise"].get("level", ""),
            "debt_trap":        result["debt_trap"].get("has_debt_trap", False),
            "ceo_level":        result["sudarshan_avg"].get("ceo_avg", 0),
            "self_moon_sav":    self_moon_sav,
        }

        return result

    except Exception as e:
        return {"computed": False, "error": str(e), "engine": "advanced_yogas_engine v1.1"}