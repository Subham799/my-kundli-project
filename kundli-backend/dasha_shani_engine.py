"""
dasha_shani_engine.py
======================
Batch 2 — Dasha Brahmastra + Shani Sutras

Features:
  1. Dasha Brahmastra     — Mahadasha × Antardasha mutual BAV check (1-1 / 0-0)
  2. Gochar Rescue        — Bad dasha mein gochar ka support (BAV ≥5 = bachav)
  3. Shani Kast Varsh     — Lagna→Shani + Shani→Lagna direct formula
  4. Shodhya Pinda        — Danger nakshatra calculation
  5. Sadhesati Correction — SAV >28 in transit rashi = shubh Sadhesati
  6. Transit Chandra Rule — Chandra se 3,6,10,11 = shubh; 4,8,12 = ashubh
  7. Dasha Quality Score  — Combined BAV-based dasha assessment

Corrections Applied (v1.1):
  [BUG FIX] Shani Kast Varsh — sum2 indexing corrected.
            OLD: sum(sav[shani_house:12])     → skips Shani's own house
            NEW: sum(sav[shani_house - 1:12]) → includes Shani's own house (correct per sutra)
            This means Shani's house SAV points are counted in BOTH sum1 and sum2,
            which is the intended jyotish rule: "Shani rashi se aarambh kar Lagna tak".

Usage:
    from dasha_shani_engine import compute_dasha_shani
    result = compute_dasha_shani(
        planets         = { "Su": {"house": 1, "rashi_index": 0}, ... },
        sav             = [28, 22, ...],        # 12-element list
        bav_charts      = { "Su": [...], ... }, # 12-element per planet
        current_dasha   = { "mahadasha": "Sa", "antardasha": "Mo" },
        shani_transit_rashi = 10,               # 0-based rashi index
        moon_rashi      = 3,                    # janm rashi (0-based)
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

# Ashwini = index 0 (used as base for Shodhya Pinda counting)
ASHWINI_INDEX = 0

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल",
    "Me": "बुध",   "Ju": "गुरु",  "Ve": "शुक्र",
    "Sa": "शनि",   "Ra": "राहु",  "Ke": "केतु",
}

PLANET_KARAKATVA = {
    "Su": "पिता, सरकार, स्वास्थ्य, आत्मा",
    "Mo": "माता, मन, धन, सुख",
    "Ma": "भाई, साहस, भूमि, दुर्घटना",
    "Me": "बुद्धि, व्यापार, शिक्षा",
    "Ju": "गुरु, धर्म, संतान, धन",
    "Ve": "पत्नी, विवाह, वाहन, सुख",
    "Sa": "कर्म, नौकर, मेहनत, आयु, न्यायालय",
    "Ra": "विदेश, अचानक लाभ/हानि",
    "Ke": "मोक्ष, अध्यात्म, दुर्घटना",
}

# Shubh months for Chandra gochar
CHANDRA_SHUBH_FROM_JANM  = {3, 6, 10, 11}   # 3rd, 6th, 10th, 11th from Janm Rashi
CHANDRA_ASHUBH_FROM_JANM = {4, 8, 12}        # 4th, 8th, 12th = ashubh

RASHI_NAMES_HI = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन",
]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def _bav_raw(bav_charts: Dict, planet: str, rashi_index: int) -> int:
    """Raw BAV total (0-8) for planet in rashi (0-based)."""
    chart = bav_charts.get(planet, [])
    if not chart or rashi_index < 0 or rashi_index >= 12:
        return 0
    return int(chart[rashi_index])


def _sav_pt(sav: List[int], rashi_index: int) -> int:
    """SAV points for a rashi (0-based)."""
    if not sav or rashi_index < 0 or rashi_index >= 12:
        return 0
    return sav[rashi_index]


def _planet_rashi(planets: Dict, code: str) -> int:
    """0-based rashi index where planet is placed."""
    p = planets.get(code, {})
    ri = p.get("rashi_index", p.get("rashi_num", 1))
    # If 1-based, convert
    if isinstance(ri, int) and ri >= 1:
        ri = ri - 1
    return max(0, min(11, int(ri)))


def _planet_house(planets: Dict, code: str) -> int:
    """1-based house number."""
    return int(planets.get(code, {}).get("house", 1))


# ─────────────────────────────────────────────
# FEATURE 1 — DASHA BRAHMASTRA
# ─────────────────────────────────────────────

def compute_dasha_brahmastra(
    planets: Dict,
    bav_charts: Dict,
    mahadasha_planet: str,
    antardasha_planet: str,
) -> Dict:
    """
    Dr. Dadhich's Brahmastra:
    Step 1: Antardasha planet's BAV chart → check if Mahadasha planet gave a point
            in the rashi where Antardasha planet sits.
    Step 2: Mahadasha planet's BAV chart → check if Antardasha planet gave a point
            in the rashi where Mahadasha planet sits.
    
    Result:
      1-1 → Excellent dasha
      1-0 or 0-1 → Average/mixed
      0-0 → Bad dasha
    """
    if not mahadasha_planet or not antardasha_planet:
        return {"computed": False, "reason": "Dasha info unavailable"}

    # Rashi where each planet sits in birth chart
    maha_rashi  = _planet_rashi(planets, mahadasha_planet)
    antar_rashi = _planet_rashi(planets, antardasha_planet)

    # Step 1: Did Mahadasha planet give point to Antardasha planet in antar_rashi?
    antar_bav_of_maha = _bav_raw(bav_charts, antardasha_planet, antar_rashi)
    # We need: in Antardasha planet's BAV chart, did Mahadasha planet give bindu?
    # Since we have total BAV (not prastara), we approximate:
    # If total BAV at that rashi >= 4, assume Maha planet contributed
    step1_score = 1 if antar_bav_of_maha >= 4 else 0

    # Step 2: Did Antardasha planet give point to Mahadasha planet in maha_rashi?
    maha_bav_of_antar = _bav_raw(bav_charts, mahadasha_planet, maha_rashi)
    step2_score = 1 if maha_bav_of_antar >= 4 else 0

    combined = step1_score + step2_score  # 0, 1, or 2

    if combined == 2:
        quality = "excellent"
        label   = "🌟 अत्यंत शुभ दशा"
        color   = "#22D3EE"
        desc    = (f"{PLANET_NAMES_HI.get(mahadasha_planet,'')} महादशा में "
                   f"{PLANET_NAMES_HI.get(antardasha_planet,'')} अंतर्दशा — "
                   "दोनों ने एक-दूसरे को बिंदु दिया है। यह दशा जीवन में बड़ी सफलता और सुख लाएगी।")
        advice  = "इस दशा में बड़े निर्णय, निवेश और नई शुरुआत करें।"
    elif combined == 1:
        quality = "average"
        label   = "🟡 मिश्रित दशा"
        color   = "#F59E0B"
        desc    = (f"{PLANET_NAMES_HI.get(mahadasha_planet,'')} महादशा में "
                   f"{PLANET_NAMES_HI.get(antardasha_planet,'')} अंतर्दशा — "
                   "एक-तरफा बिंदु। परिणाम मिले-जुले रहेंगे।")
        advice  = "सावधानी से काम करें — आधी मेहनत फल देगी, आधी नहीं।"
    else:
        quality = "bad"
        label   = "🔴 कष्टकारी दशा"
        color   = "#FB7185"
        desc    = (f"{PLANET_NAMES_HI.get(mahadasha_planet,'')} महादशा में "
                   f"{PLANET_NAMES_HI.get(antardasha_planet,'')} अंतर्दशा — "
                   "किसी ने भी बिंदु नहीं दिया। यह दशा कष्टकारी रहेगी।")
        advice  = "इस दशा में बड़े निर्णय टालें। धैर्य रखें।"

    # Check gochar rescue possibility
    rescue_tip = (
        "यदि गोचर में उस भाव में 5+ BAV बिंदु हों, तो दशा का कुप्रभाव कम हो जाता है।"
        if combined == 0 else ""
    )

    return {
        "computed":          True,
        "mahadasha":         mahadasha_planet,
        "mahadasha_name":    PLANET_NAMES_HI.get(mahadasha_planet, mahadasha_planet),
        "antardasha":        antardasha_planet,
        "antardasha_name":   PLANET_NAMES_HI.get(antardasha_planet, antardasha_planet),
        "maha_rashi":        maha_rashi,
        "antar_rashi":       antar_rashi,
        "step1_score":       step1_score,
        "step2_score":       step2_score,
        "step1_label":       f"{'✅' if step1_score else '❌'} {PLANET_NAMES_HI.get(mahadasha_planet,'')} → {PLANET_NAMES_HI.get(antardasha_planet,'')}: {'बिंदु दिया' if step1_score else 'बिंदु नहीं'}",
        "step2_label":       f"{'✅' if step2_score else '❌'} {PLANET_NAMES_HI.get(antardasha_planet,'')} → {PLANET_NAMES_HI.get(mahadasha_planet,'')}: {'बिंदु दिया' if step2_score else 'बिंदु नहीं'}",
        "combined_score":    combined,
        "quality":           quality,
        "label":             label,
        "color":             color,
        "description":       desc,
        "advice":            advice,
        "rescue_tip":        rescue_tip,
        "maha_karakatva":    PLANET_KARAKATVA.get(mahadasha_planet, ""),
        "antar_karakatva":   PLANET_KARAKATVA.get(antardasha_planet, ""),
        "maha_bav":          maha_bav_of_antar,
        "antar_bav":         antar_bav_of_maha,
    }


def compute_all_antardasha_quality(
    planets: Dict,
    bav_charts: Dict,
    mahadasha_planet: str,
    all_antardasha_planets: Optional[List[str]] = None,
) -> List[Dict]:
    """
    Ek Mahadasha ke saare possible Antardasha planets ke liye quality nikalo.
    Returns sorted list (best first).
    """
    if not all_antardasha_planets:
        all_antardasha_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]

    results = []
    quality_order = {"excellent": 2, "average": 1, "bad": 0}

    for antar in all_antardasha_planets:
        if antar == mahadasha_planet:
            continue  # Same planet antardasha — neutral (skip or handle separately)
        r = compute_dasha_brahmastra(planets, bav_charts, mahadasha_planet, antar)
        results.append(r)

    return sorted(results, key=lambda x: quality_order.get(x.get("quality", "bad"), 0), reverse=True)


# ─────────────────────────────────────────────
# FEATURE 2 — GOCHAR RESCUE
# ─────────────────────────────────────────────

def compute_gochar_rescue(
    transit_rashi_of_dasha_planet: int,
    bav_charts: Dict,
    dasha_planet: str,
    dasha_quality: str,
) -> Dict:
    """
    Bad dasha (0-0) hone par bhi gochar rescue ho sakta hai.
    Rule: Dasha planet jis rashi mein gochar kar raha hai,
          wahan agar BAV ≥ 5 ho, to kast kam hoga.
    """
    bav_in_transit = _bav_raw(bav_charts, dasha_planet, transit_rashi_of_dasha_planet)
    rashi_name = RASHI_NAMES_HI[transit_rashi_of_dasha_planet] if transit_rashi_of_dasha_planet < 12 else ""

    if bav_in_transit >= 5:
        rescue = True
        label  = "✅ गोचर से बचाव"
        desc   = (f"{PLANET_NAMES_HI.get(dasha_planet,'')} का गोचर {rashi_name} में — "
                  f"BAV {bav_in_transit} ≥ 5 — दशा खराब होने पर भी काम चलते रहेंगे।")
        color  = "#22D3EE"
    elif bav_in_transit >= 4:
        rescue = False
        label  = "🟡 आंशिक बचाव"
        desc   = (f"BAV {bav_in_transit} — थोड़ा सहारा है, लेकिन पूर्ण बचाव नहीं।")
        color  = "#F59E0B"
    else:
        rescue = False
        label  = "❌ गोचर का भी सहारा नहीं"
        desc   = (f"{PLANET_NAMES_HI.get(dasha_planet,'')} का गोचर {rashi_name} में — "
                  f"BAV {bav_in_transit} < 5 — दशा भी खराब, गोचर भी अशुभ। "
                  "यह समय अत्यंत कष्टकारी हो सकता है।")
        color  = "#FB7185"

    critical = (dasha_quality == "bad" and not rescue)

    return {
        "dasha_planet":       dasha_planet,
        "dasha_planet_name":  PLANET_NAMES_HI.get(dasha_planet, dasha_planet),
        "transit_rashi":      transit_rashi_of_dasha_planet,
        "transit_rashi_name": rashi_name,
        "bav_in_transit":     bav_in_transit,
        "rescue":             rescue,
        "label":              label,
        "description":        desc,
        "color":              color,
        "critical":           critical,
        "critical_warning": (
            "⚠️ दशा भी खराब (0-0 बिंदु) + गोचर भी अशुभ (BAV < 5) — "
            "यह समय जीवन का सबसे कठिन दौर हो सकता है। संभलकर रहें।"
            if critical else ""
        ),
    }


# ─────────────────────────────────────────────
# FEATURE 3 — SHANI KAST VARSH
# ─────────────────────────────────────────────

def compute_shani_kast_varsh(
    planets: Dict,
    sav: List[int]
) -> Dict:
    """
    Direct formula (no ×7÷27):

    Method 1 (Lagna → Shani):
      Sum of SAV from House 1 up to AND INCLUDING House where Shani sits.
      That sum = age when 1st major illness/accident may occur.

    Method 2 (Shani → Lagna):
      Sum from Shani's house (INCLUSIVE) to House 12, then add Lagna (House 1) again.
      That sum = age of 2nd major hardship.
      [BUG FIX v1.1] OLD used sav[shani_house:12] which skipped Shani's own house.
                     NEW uses sav[shani_house - 1:12] to include Shani's house (0-indexed),
                     matching the jyotish rule: "Shani rashi se aarambh kar Lagna tak".

    Sum of both = age of death-like crisis (mrityu-tulya kast).
    If Maarak dasha also active at that age → serious danger.

    Note: Shani's house SAV is intentionally counted in both sum1 and sum2
          as it marks the pivot/starting point for both directions.
    """
    if not sav or len(sav) < 12:
        return {"computed": False, "reason": "SAV data unavailable"}

    shani_house = _planet_house(planets, "Sa")  # 1-based (e.g. 7 means 7th house)

    # Method 1: House 1 → Shani's house (inclusive)
    # sav is 0-indexed: house N = sav[N-1]
    # sav[0:shani_house] = houses 1 through shani_house (inclusive) ✓
    sum1 = sum(sav[0:shani_house])

    # Method 2: Shani's house (inclusive) → House 12 → + House 1 (Lagna)
    # [BUG FIX v1.1] sav[shani_house - 1 : 12] starts from Shani's own house (0-indexed)
    # OLD (wrong):  sum(sav[shani_house:12])     → started one house AFTER Shani
    # NEW (correct): sum(sav[shani_house - 1:12]) → starts FROM Shani's house ✓
    sum2 = sum(sav[shani_house - 1:12]) + sav[0]

    # Combined (mrityu-tulya kast age)
    sum_combined = sum1 + sum2

    # SAV points at Shani's house
    shani_house_sav = sav[shani_house - 1] if shani_house >= 1 else 0

    return {
        "computed":        True,
        "shani_house":     shani_house,
        "shani_house_sav": shani_house_sav,
        "sum1":            sum1,
        "sum2":            sum2,
        "sum_combined":    sum_combined,
        "kast_varsh_1": {
            "age":   sum1,
            "label": f"⚠️ प्रथम कष्ट: {sum1} वर्ष",
            "desc":  f"लग्न से शनि (भाव {shani_house}) तक SAV योग = {sum1}। "
                     f"{sum1} वर्ष की आयु में व्याधि, दुर्घटना या कष्ट संभव।",
        },
        "kast_varsh_2": {
            "age":   sum2,
            "label": f"⚠️ द्वितीय कष्ट: {sum2} वर्ष",
            "desc":  f"शनि (भाव {shani_house}) से लग्न तक SAV योग = {sum2}। "
                     f"{sum2} वर्ष की आयु में दुर्घटना/बीमारी संभव।",
        },
        "mrityu_tulya": {
            "age":   sum_combined,
            "label": f"🔴 मृत्युतुल्य कष्ट: {sum_combined} वर्ष",
            "desc":  f"दोनों योगों का जोड़ = {sum_combined}। इस आयु में यदि मारक दशा भी चले, "
                     "तो अत्यंत गंभीर संकट या मृत्युतुल्य कष्ट आ सकता है।",
            "warning": "यदि उसी समय मारक दशा (2nd/7th lord) भी चल रही हो, तो विशेष सावधानी आवश्यक।",
        },
    }


# ─────────────────────────────────────────────
# FEATURE 4 — SHODHYA PINDA
# ─────────────────────────────────────────────

def compute_shodhya_pinda(
    planets: Dict,
    sav: List[int],
    bav_charts: Dict,
    shodhya_pinda_value: Optional[int] = None,
) -> Dict:
    """
    Shodhya Pinda formula for danger nakshatra:
    
    Step 1: Find 8th house from Lagna (house 8) OR 8th from Shani.
    Step 2: SAV points at that 8th house.
    Step 3: Multiply by Shani's Shodhya Pinda value.
    Step 4: Divide by 27.
    Step 5: Remainder → count from Ashwini → danger nakshatra.
    
    If shodhya_pinda_value not provided, we calculate a simplified version
    using Shani's BAV total.
    """
    if not sav or len(sav) < 12:
        return {"computed": False, "reason": "SAV data unavailable"}

    shani_house  = _planet_house(planets, "Sa")      # 1-based
    # 8th from Lagna = house 8
    eighth_house = 8                                  # 1-based
    # 8th from Shani
    eighth_from_shani = ((shani_house - 1 + 7) % 12) + 1  # 1-based

    # SAV at these positions
    sav_8th         = sav[eighth_house - 1]
    sav_8th_shani   = sav[eighth_from_shani - 1]

    # Shodhya Pinda — if not provided, estimate from Shani BAV total
    if shodhya_pinda_value is None:
        shani_bav = bav_charts.get("Sa", [])
        # Sum of all BAV points for Shani across all rashis (typical range 30-50)
        shodhya_pinda_value = sum(shani_bav) if shani_bav else 40  # fallback

    # Formula calculation (using 8th from Lagna)
    product1   = sav_8th * shodhya_pinda_value
    remainder1 = product1 % 27
    nakshatram1_idx = (ASHWINI_INDEX + remainder1) % 27
    danger_nakshatra1 = NAKSHATRA_NAMES[nakshatram1_idx]

    # Formula calculation (using 8th from Shani)
    product2   = sav_8th_shani * shodhya_pinda_value
    remainder2 = product2 % 27
    nakshatra2_idx = (ASHWINI_INDEX + remainder2) % 27
    danger_nakshatra2 = NAKSHATRA_NAMES[nakshatra2_idx]

    return {
        "computed":              True,
        "shodhya_pinda":         shodhya_pinda_value,
        "shani_house":           shani_house,
        "eighth_house":          eighth_house,
        "eighth_from_shani":     eighth_from_shani,
        "sav_at_8th":            sav_8th,
        "sav_at_8th_from_shani": sav_8th_shani,
        "from_lagna": {
            "sav_points":       sav_8th,
            "product":          product1,
            "remainder":        remainder1,
            "danger_nakshatra": danger_nakshatra1,
            "nakshatra_index":  nakshatram1_idx,
            "formula":          f"{sav_8th} × {shodhya_pinda_value} = {product1} ÷ 27 → शेष {remainder1} → {danger_nakshatra1}",
            "warning":          f"जब भी गोचर का शनि या राहु '{danger_nakshatra1}' नक्षत्र पर आए, सावधान रहें।",
        },
        "from_shani": {
            "sav_points":       sav_8th_shani,
            "product":          product2,
            "remainder":        remainder2,
            "danger_nakshatra": danger_nakshatra2,
            "nakshatra_index":  nakshatra2_idx,
            "formula":          f"{sav_8th_shani} × {shodhya_pinda_value} = {product2} ÷ 27 → शेष {remainder2} → {danger_nakshatra2}",
            "warning":          f"जब भी गोचर का शनि '{danger_nakshatra2}' नक्षत्र पर आए, सावधान रहें।",
        },
    }


# ─────────────────────────────────────────────
# FEATURE 5 — SADHESATI CORRECTION
# ─────────────────────────────────────────────

def compute_sadhesati_analysis(
    moon_janm_rashi: int,
    shani_transit_rashi: int,
    sav: List[int],
    bav_charts: Dict,
) -> Dict:
    """
    Sadhesati = Shani 12th, 1st, 2nd from Moon sign (7.5 years total).
    
    AV Correction:
      If SAV >28 in Shani's current transit rashi → Sadhesati gives GOOD results!
      (Ashtakvarga overrides general rule)
    
    Also calculates which phase of Sadhesati we're in.
    """
    # Determine Sadhesati phase
    diff = (shani_transit_rashi - moon_janm_rashi) % 12

    if diff == 11:   # 12th house (pehli dhaiya — entry)
        phase = 1
        phase_name = "प्रथम चरण (12वें में शनि)"
        phase_desc = "पिछले जीवन का हिसाब, मानसिक बोझ, व्यय"
    elif diff == 0:  # 1st house (madhya — peak)
        phase = 2
        phase_name = "मध्य चरण (लग्न/चंद्र राशि में शनि)"
        phase_desc = "साढ़ेसाती का सबसे तीव्र समय — व्यक्तित्व पर दबाव"
    elif diff == 1:  # 2nd house (antima)
        phase = 3
        phase_name = "अंतिम चरण (2रे में शनि)"
        phase_desc = "परिवार, धन, वाणी पर प्रभाव — समाप्ति की ओर"
    else:
        phase = 0
        phase_name = "साढ़ेसाती नहीं चल रही"
        phase_desc = ""

    is_sadhesati = phase > 0

    # AV Correction
    shani_transit_sav = _sav_pt(sav, shani_transit_rashi)
    shani_transit_bav = _bav_raw(bav_charts, "Sa", shani_transit_rashi)
    rashi_name = RASHI_NAMES_HI[shani_transit_rashi] if shani_transit_rashi < 12 else ""

    if shani_transit_sav >= 30:
        av_verdict  = "very_good"
        av_label    = "🌟 साढ़ेसाती शुभ फल देगी!"
        av_color    = "#22D3EE"
        av_desc     = (f"शनि का गोचर {rashi_name} में — SAV {shani_transit_sav} ≥ 30। "
                       "अष्टकवर्ग के अनुसार यह साढ़ेसाती उन्नति और शुभ फल लाएगी।")
    elif shani_transit_sav >= 28:
        av_verdict  = "good"
        av_label    = "✅ साढ़ेसाती सामान्य रहेगी"
        av_color    = "#4ADE80"
        av_desc     = f"SAV {shani_transit_sav} — न बहुत अच्छा, न बुरा।"
    elif shani_transit_sav >= 25:
        av_verdict  = "average"
        av_label    = "🟡 साढ़ेसाती मिश्रित फल"
        av_color    = "#F59E0B"
        av_desc     = f"SAV {shani_transit_sav} — कुछ कष्ट, कुछ लाभ।"
    else:
        av_verdict  = "bad"
        av_label    = "⚠️ साढ़ेसाती कष्टकारी"
        av_color    = "#FB7185"
        av_desc     = (f"SAV {shani_transit_sav} < 25 — साढ़ेसाती का पूरा बुरा असर होगा। "
                       "सावधानी और उपाय आवश्यक।")

    # BAV check for Shani in transit rashi
    bav_note = ""
    if shani_transit_bav >= 5:
        bav_note = f"शनि का BAV भी {shani_transit_bav} ≥ 5 — दोगुनी शुभता!"
    elif shani_transit_bav <= 2:
        bav_note = f"शनि का BAV केवल {shani_transit_bav} — विशेष सावधानी।"

    return {
        "computed":            True,
        "is_sadhesati":        is_sadhesati,
        "phase":               phase,
        "phase_name":          phase_name,
        "phase_desc":          phase_desc,
        "moon_rashi":          moon_janm_rashi,
        "moon_rashi_name":     RASHI_NAMES_HI[moon_janm_rashi] if moon_janm_rashi < 12 else "",
        "shani_transit_rashi": shani_transit_rashi,
        "shani_transit_name":  rashi_name,
        "sav_at_transit":      shani_transit_sav,
        "bav_at_transit":      shani_transit_bav,
        "av_verdict":          av_verdict,
        "av_label":            av_label,
        "av_color":            av_color,
        "av_description":      av_desc,
        "bav_note":            bav_note,
        "key_rule":            "नियम: भले ही साढ़ेसाती हो, यदि SAV >28 हो तो शुभ फल मिलते हैं।",
    }


# ─────────────────────────────────────────────
# FEATURE 6 — TRANSIT CHANDRA RULE
# ─────────────────────────────────────────────

def compute_transit_chandra_rule(
    moon_janm_rashi: int,
    transit_positions: Dict,
    bav_charts: Dict,
    sav: List[int],
) -> List[Dict]:
    """
    For each transit planet, check its position from Janm Rashi (Moon sign):
    Shubh positions: 3, 6, 10, 11 from Moon
    Ashubh positions: 4, 8, 12 from Moon
    
    AV Override: Ashubh position + high BAV (6-7) → ashubh cancelled
    """
    results = []
    planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]

    for p in planets:
        pdata = transit_positions.get(p, {})
        if not pdata:
            continue

        transit_rashi = pdata.get("rashi_index", 0)
        # Position from Moon (1-based)
        pos_from_moon = ((transit_rashi - moon_janm_rashi) % 12) + 1

        bav_at_transit = _bav_raw(bav_charts, p, transit_rashi)
        sav_at_transit = _sav_pt(sav, transit_rashi)

        # Determine base result
        if pos_from_moon in CHANDRA_SHUBH_FROM_JANM:
            base_shubh = True
            position_label = f"चंद्र से {pos_from_moon}वें भाव में — शुभ स्थान"
        elif pos_from_moon in CHANDRA_ASHUBH_FROM_JANM:
            base_shubh = False
            position_label = f"चंद्र से {pos_from_moon}वें भाव में — अशुभ स्थान"
        else:
            base_shubh = None  # Neutral
            position_label = f"चंद्र से {pos_from_moon}वें भाव में — सामान्य"

        # AV override
        if base_shubh is False and bav_at_transit >= 6:
            final_shubh = True
            override_note = f"BAV {bav_at_transit} ≥ 6 — अशुभ गोचर का बुरा असर रद्द!"
        elif base_shubh is True and bav_at_transit <= 2:
            final_shubh = False
            override_note = f"BAV {bav_at_transit} ≤ 2 — शुभ गोचर का फल भी नहीं मिलेगा।"
        else:
            final_shubh  = base_shubh if base_shubh is not None else (bav_at_transit >= 4)
            override_note = ""

        rashi_name = RASHI_NAMES_HI[transit_rashi] if transit_rashi < 12 else ""

        results.append({
            "planet":         p,
            "planet_name":    PLANET_NAMES_HI.get(p, p),
            "transit_rashi":  transit_rashi,
            "rashi_name":     rashi_name,
            "pos_from_moon":  pos_from_moon,
            "position_label": position_label,
            "base_shubh":     base_shubh,
            "final_shubh":    final_shubh,
            "bav":            bav_at_transit,
            "sav":            sav_at_transit,
            "override_note":  override_note,
            "status":         "✅ शुभ गोचर" if final_shubh else
                              "❌ अशुभ गोचर" if final_shubh is False else
                              "⚖️ सामान्य गोचर",
            "color":          "#22D3EE" if final_shubh else
                              "#FB7185" if final_shubh is False else "#F59E0B",
        })

    return results


# ─────────────────────────────────────────────
# FEATURE 7 — DASHA QUALITY TIMELINE
# ─────────────────────────────────────────────

def compute_dasha_quality_timeline(
    planets: Dict,
    bav_charts: Dict,
    dasha_sequence: Optional[List[Dict]] = None,
) -> List[Dict]:
    """
    For a list of upcoming dasha/antardasha combinations,
    compute quality for each.
    
    dasha_sequence: [
        {"mahadasha": "Sa", "antardasha": "Mo", "start": "2024-01", "end": "2027-03"},
        ...
    ]
    """
    if not dasha_sequence:
        return []

    results = []
    for dasha in dasha_sequence:
        maha  = dasha.get("mahadasha", "")
        antar = dasha.get("antardasha", "")
        if not maha or not antar:
            continue
        quality = compute_dasha_brahmastra(planets, bav_charts, maha, antar)
        quality["start"] = dasha.get("start", "")
        quality["end"]   = dasha.get("end",   "")
        results.append(quality)

    return results


# ─────────────────────────────────────────────
# MASTER FUNCTION
# ─────────────────────────────────────────────

def compute_dasha_shani(
    planets: Dict,
    sav: List[int],
    bav_charts: Dict,
    current_dasha: Optional[Dict] = None,
    shani_transit_rashi: int = 0,
    moon_rashi: int = 0,
    transit_positions: Optional[Dict] = None,
    shodhya_pinda_value: Optional[int] = None,
    dasha_sequence: Optional[List[Dict]] = None,
) -> Dict:
    """
    Master entry point — called from engines_bridge.py.

    Args:
        planets:              { "Sa": {"house": 12, "rashi_index": 10}, ... }
        sav:                  [28, 22, ...] 12-element list
        bav_charts:           { "Su": [...], "Mo": [...], ... }
        current_dasha:        { "mahadasha": "Sa", "antardasha": "Mo" }
        shani_transit_rashi:  0-based index of current Shani transit rashi
        moon_rashi:           0-based janm rashi (Moon sign)
        transit_positions:    { "Su": {"rashi_index": 0}, ... } for chandra rule
        shodhya_pinda_value:  Shani's Shodhya Pinda (optional, computed if None)
        dasha_sequence:       List of upcoming dasha combos (optional)

    Returns:
        Complete batch 2 dict.
    """
    try:
        result = {"computed": True, "engine": "dasha_shani_engine v1.1"}

        # 1. Dasha Brahmastra (current dasha)
        if current_dasha:
            maha  = current_dasha.get("mahadasha", "")
            antar = current_dasha.get("antardasha", "")
            result["dasha_brahmastra"] = compute_dasha_brahmastra(
                planets, bav_charts, maha, antar
            )
            # Also compute gochar rescue for mahadasha planet
            result["gochar_rescue"] = compute_gochar_rescue(
                shani_transit_rashi, bav_charts, maha,
                result["dasha_brahmastra"].get("quality", "bad")
            )
        else:
            result["dasha_brahmastra"] = {"computed": False, "reason": "No dasha data"}
            result["gochar_rescue"]    = {"computed": False}

        # 2. All antardasha quality for current mahadasha
        if current_dasha:
            result["antardasha_quality_all"] = compute_all_antardasha_quality(
                planets, bav_charts, current_dasha.get("mahadasha", "")
            )
        else:
            result["antardasha_quality_all"] = []

        # 3. Shani Kast Varsh
        result["shani_kast_varsh"] = compute_shani_kast_varsh(planets, sav)

        # 4. Shodhya Pinda
        result["shodhya_pinda"] = compute_shodhya_pinda(
            planets, sav, bav_charts, shodhya_pinda_value
        )

        # 5. Sadhesati Analysis
        result["sadhesati"] = compute_sadhesati_analysis(
            moon_rashi, shani_transit_rashi, sav, bav_charts
        )

        # 6. Transit Chandra Rule
        if transit_positions:
            result["transit_chandra"] = compute_transit_chandra_rule(
                moon_rashi, transit_positions, bav_charts, sav
            )
        else:
            result["transit_chandra"] = []

        # 7. Dasha timeline (optional)
        if dasha_sequence:
            result["dasha_timeline"] = compute_dasha_quality_timeline(
                planets, bav_charts, dasha_sequence
            )
        else:
            result["dasha_timeline"] = []

        # Quick summary
        brahmastra = result.get("dasha_brahmastra", {})
        sadhesati  = result.get("sadhesati", {})
        kast       = result.get("shani_kast_varsh", {})

        result["summary"] = {
            "dasha_quality":        brahmastra.get("quality", "unknown"),
            "dasha_label":          brahmastra.get("label", ""),
            "sadhesati_active":     sadhesati.get("is_sadhesati", False),
            "sadhesati_av_verdict": sadhesati.get("av_verdict", ""),
            "kast_ages":            [
                kast.get("kast_varsh_1", {}).get("age", 0),
                kast.get("kast_varsh_2", {}).get("age", 0),
            ] if kast.get("computed") else [],
        }

        return result

    except Exception as e:
        return {
            "computed": False,
            "error":    str(e),
            "engine":   "dasha_shani_engine v1.1",
        }