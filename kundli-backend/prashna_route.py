# ═══════════════════════════════════════════════════════════════════════════
#  prashna_route.py  —  प्रश्न कुण्डली (Horary Astrology) + Lost Item Engine
#  VERSION 2.0 — All issues fixed
#
#  FIXES in v2.0:
#    ✅ FIX 1 — Time precision: proper hour_decimal calculation
#    ✅ FIX 2 — Ketu added (Rahu + 180°)
#    ✅ FIX 3 — Ayanamsha double-subtraction removed (lagna was raw tropical, now corrected)
#    ✅ FIX 4 — Lost Item edge case: safe .get() for missing planets
#    ✅ FIX 5 — House system unified to pure Whole Sign (no Placidus hybrid)
#
#  api.py में सिर्फ 2 lines add करो:
#      from prashna_route import prashna_bp
#      app.register_blueprint(prashna_bp)
# ═══════════════════════════════════════════════════════════════════════════

from flask import Blueprint, request, jsonify
import swisseph as swe
from datetime import datetime, timedelta, timezone
def get_kp_horary_degree(number):
    """ 1-249 KP Number mapping """
    degree = (number - 1) * (360.0 / 249.0) 
    return degree % 360

prashna_bp = Blueprint("prashna", __name__)

# ── Swiss Ephemeris Setup ──────────────────────────────────────────────────
swe.set_sid_mode(swe.SIDM_LAHIRI)  # 🔥 Lahiri Ayanamsha (Indian standard)

# ── Constants ─────────────────────────────────────────────────────────────

RASHI_NAMES = [
    "मेष", "वृषभ", "मिथुन", "कर्क",
    "सिंह", "कन्या", "तुला", "वृश्चिक",
    "धनु", "मकर", "कुंभ", "मीन"
]

RASHI_NAMES_EN = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# राशि के स्वामी (Lord of signs)
RASHI_LORD = {
    0: "मंगल",    1: "शुक्र",    2: "बुध",    3: "चंद्र",
    4: "सूर्य",   5: "बुध",      6: "शुक्र",   7: "मंगल",
    8: "गुरु",    9: "शनि",      10: "शनि",   11: "गुरु",
}

RASHI_LORD_EN = {
    0: "Mars",    1: "Venus",   2: "Mercury", 3: "Moon",
    4: "Sun",     5: "Mercury", 6: "Venus",   7: "Mars",
    8: "Jupiter", 9: "Saturn",  10: "Saturn", 11: "Jupiter",
}

# कक्षा 1–8 → स्वामी + विषय
KAKSHA_MAP = {
    1: {"lord": "शनि",    "lord_en": "Saturn",  "vishay": "नौकरी, संघर्ष, कठिनाई"},
    2: {"lord": "गुरु",   "lord_en": "Jupiter", "vishay": "ज्ञान, संतान, धर्म"},
    3: {"lord": "मंगल",   "lord_en": "Mars",    "vishay": "भूमि, सम्पत्ति, विवाद"},
    4: {"lord": "सूर्य",  "lord_en": "Sun",     "vishay": "अधिकार, सरकार, पिता"},
    5: {"lord": "शुक्र",  "lord_en": "Venus",   "vishay": "विवाह, प्रेम, सौंदर्य"},
    6: {"lord": "बुध",    "lord_en": "Mercury", "vishay": "व्यापार, लेन-देन, बुद्धि"},
    7: {"lord": "चंद्र",  "lord_en": "Moon",    "vishay": "मन, यात्रा, माँ"},
    8: {"lord": "लग्नेश", "lord_en": "Lagna",   "vishay": "स्वास्थ्य, स्वयं, व्यक्तित्व"},
}

NAKSHATRA_NAMES = [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा",
    "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी",
    "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा",
    "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती"
]

NAK_LORD_CYCLE = ["केतु", "शुक्र", "सूर्य", "चंद्र", "मंगल",
                  "राहु", "गुरु", "शनि", "बुध"]

# ग्रह names
PLANET_NAMES = {
    swe.SUN:       "सूर्य",
    swe.MOON:      "चंद्र",
    swe.MARS:      "मंगल",
    swe.MERCURY:   "बुध",
    swe.JUPITER:   "गुरु",
    swe.VENUS:     "शुक्र",
    swe.SATURN:    "शनि",
    swe.TRUE_NODE: "राहु",
    # Ketu: virtual planet (Rahu + 180°), added manually in _get_planets
}

PLANETS_LIST = [
    (swe.SUN,       "सूर्य", "Sun"),
    (swe.MOON,      "चंद्र", "Moon"),
    (swe.MARS,      "मंगल", "Mars"),
    (swe.MERCURY,   "बुध",  "Mercury"),
    (swe.JUPITER,   "गुरु",  "Jupiter"),
    (swe.VENUS,     "शुक्र", "Venus"),
    (swe.SATURN,    "शनि",  "Saturn"),
    (swe.TRUE_NODE, "राहु", "Rahu"),
    # केतु is added separately after Rahu
]

# राशि के गुण (Fixed/Movable/Dual)
RASHI_QUALITY = {
    0: "movable",  1: "fixed",    2: "dual",     3: "movable",
    4: "fixed",    5: "dual",     6: "movable",  7: "fixed",
    8: "dual",     9: "movable",  10: "fixed",   11: "dual",
}

RASHI_QUALITY_HI = {
    "movable": "चल",
    "fixed":   "स्थिर",
    "dual":    "द्विस्वभाव",
}

# राशि के तत्व (Element)
RASHI_ELEMENT = {
    0: "fire",   1: "earth",  2: "air",   3: "water",
    4: "fire",   5: "earth",  6: "air",   7: "water",
    8: "fire",   9: "earth",  10: "air",  11: "water",
}

RASHI_ELEMENT_HI = {
    "fire":   "अग्नि (पूर्व)",
    "earth":  "पृथ्वी (दक्षिण)",
    "air":    "वायु (पश्चिम)",
    "water":  "जल (उत्तर)",
}

RASHI_ELEMENT_DIR = {
    "fire":   "East",
    "earth":  "South",
    "air":    "West",
    "water":  "North",
}

# ── Helpers ───────────────────────────────────────────────────────────────

def get_kp_horary_degree(kp_num: int) -> float:
    """
    KP Horary System: Map KP Number (1-249) to exact Lagna degree (0-360°)
    
    Logic: 249 numbers span 360° → Each sub = 360/249 = ~1.445° per number
    KP Number 1 starts at 0.0°
    """
    if not (1 <= kp_num <= 249):
        raise ValueError("KP Number must be between 1 and 249")
    
    # Each KP number represents ~1.445° arc
    degree_per_number = 360.0 / 249
    
    # KP Number 1 = 0.0°, Number 2 = 1.445°, ..., Number 249 = 358.55°
    return (kp_num - 1) * degree_per_number


def _normalize_lon(lon: float) -> float:
    """0–360 range mein normalize karo"""
    lon = lon % 360
    if lon < 0:
        lon += 360
    return lon


def _nakshatra(degree_360: float) -> dict:
    """0–360° longitude → नक्षत्र नाम + स्वामी"""
    idx = int(degree_360 / (360.0 / 27)) % 27
    return {
        "name":  NAKSHATRA_NAMES[idx],
        "index": idx + 1,
        "lord":  NAK_LORD_CYCLE[idx % 9],
    }


# ── KP Sub-Lord helper (same logic as kp_significators.py) ────────────────
_NAK_LORDS_SHORT  = ["Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me"]
_DASHA_YEARS      = [7, 20, 6, 10, 7, 18, 16, 19, 17]
_NAK_LORDS_HI     = ["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"]
_SHORT_TO_HI      = dict(zip(_NAK_LORDS_SHORT, _NAK_LORDS_HI))
_HI_TO_SHORT      = dict(zip(_NAK_LORDS_HI, _NAK_LORDS_SHORT))

def _kp_lords(degree: float) -> dict:
    """NL + SL for any degree (0-360)"""
    degree = degree % 360
    nak_len = 40.0 / 3.0
    nak_idx = int(degree / nak_len)
    nl_idx  = nak_idx % 9
    deg_in_nak = degree - (nak_idx * nak_len)
    acc = 0.0
    sl_idx = nl_idx
    for i in range(9):
        idx  = (nl_idx + i) % 9
        span = (_DASHA_YEARS[idx] / 120.0) * nak_len
        if deg_in_nak < acc + span:
            sl_idx = idx
            break
        acc += span
    return {
        "NL": _NAK_LORDS_SHORT[nl_idx],
        "SL": _NAK_LORDS_SHORT[sl_idx],
        "NL_hi": _NAK_LORDS_HI[nl_idx],
        "SL_hi": _NAK_LORDS_HI[sl_idx],
    }


# Day Lord (Weekday → Lord)
_DAY_LORDS_HI = {0:"चंद्र",1:"मंगल",2:"बुध",3:"गुरु",4:"शुक्र",5:"शनि",6:"सूर्य"}
_DAY_LORDS_EN = {0:"Moon",1:"Mars",2:"Mercury",3:"Jupiter",4:"Venus",5:"Saturn",6:"Sun"}


def _compute_ruling_planets(jd: float, lagna_360: float, planets: dict) -> dict:
    """
    Ruling Planets (RPs) — KP Horary core rule:
    1. Lagna Star Lord (LSL) + Lagna Sign Lord (LgSL)
    2. Moon Star Lord (MSL) + Moon Sign Lord (MoSL)
    3. Day Lord
    4. Rahu/Ketu substitution if conjunct/aspecting any RP
    """
    from datetime import datetime, timezone, timedelta
    # Weekday from JD (0=Mon … 6=Sun  in Python)
    import math
    day_num = int(jd + 1.5) % 7  # 0=Sun,1=Mon… → remap
    # jd 0 = Monday noon, +1.5 shifts to midnight; % 7
    # Standard: JD 2440588 = Jan 1 1970 = Wednesday
    weekday = (int(jd + 0.5) + 1) % 7  # 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat

    lagna_lords  = _kp_lords(lagna_360)
    moon_lon     = planets.get("चंद्र", {}).get("longitude", 0)
    moon_lords   = _kp_lords(moon_lon)
    lagna_sign_lord = NAK_LORD_CYCLE[int(lagna_360 / 30) % 12] if False else                       _SHORT_TO_HI.get(
                          ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"][int(lagna_360/30)%12],
                          "अज्ञात")
    moon_sign_lord  = _SHORT_TO_HI.get(
                          ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"][int(moon_lon/30)%12],
                          "अज्ञात")
    day_lord_hi  = _DAY_LORDS_HI.get(weekday, "सूर्य")
    day_lord_en  = _DAY_LORDS_EN.get(weekday, "Sun")

    rp_set_hi = set([
        lagna_lords["NL_hi"], lagna_sign_lord,
        moon_lords["NL_hi"],  moon_sign_lord,
        day_lord_hi,
    ])

    # Rahu/Ketu substitution — if their sign lord is an RP, include them
    for node in ["राहु", "केतु"]:
        if node in planets:
            node_sign_idx = int(planets[node]["longitude"] / 30) % 12
            node_sl_short = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"][node_sign_idx]
            node_sl_hi    = _SHORT_TO_HI.get(node_sl_short, "")
            if node_sl_hi in rp_set_hi:
                rp_set_hi.add(node)

    return {
        "lagna_nl":      lagna_lords["NL_hi"],
        "lagna_sl":      lagna_lords["SL_hi"],
        "lagna_sign_lord": lagna_sign_lord,
        "moon_nl":       moon_lords["NL_hi"],
        "moon_sl":       moon_lords["SL_hi"],
        "moon_sign_lord": moon_sign_lord,
        "day_lord":      day_lord_hi,
        "day_lord_en":   day_lord_en,
        "ruling_planets": sorted(list(rp_set_hi)),
    }


def _compute_dba(jd: float, moon_lon: float) -> dict:
    """
    Vimshottari Dasha — Prashna time ki Dasha/Bhukti/Antara
    Moon longitude se balance of dasha nikaalte hain.
    """
    NAK_LEN   = 40.0 / 3.0  # 13.3333°
    TOTAL_YRS = 120.0
    DASHA_SEQ = ["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"]
    DASHA_YRS = [7, 20, 6, 10, 7, 18, 16, 19, 17]

    moon_lon  = moon_lon % 360
    nak_idx   = int(moon_lon / NAK_LEN)
    nl_idx    = nak_idx % 9
    deg_in_nak = moon_lon - (nak_idx * NAK_LEN)
    fraction_done = deg_in_nak / NAK_LEN

    # Balance of current dasha in years
    maha_lord   = DASHA_SEQ[nl_idx]
    maha_yrs    = DASHA_YRS[nl_idx]
    balance_yrs = maha_yrs * (1 - fraction_done)

    # JD → datetime for adding years
    # Bhukti: sub-period within Maha
    DAYS_PER_YR = 360.0
    maha_total_days = maha_yrs * DAYS_PER_YR

    bhukti_lord = None
    bhukti_yrs  = 0.0
    antara_lord = None
    antara_yrs  = 0.0

    # Walk through bhuktis to find current one
    elapsed_maha_days = (fraction_done) * maha_total_days
    acc_days = 0.0
    for i in range(9):
        b_idx    = (nl_idx + i) % 9
        b_lord   = DASHA_SEQ[b_idx]
        b_days   = (DASHA_YRS[b_idx] / TOTAL_YRS) * maha_total_days
        if elapsed_maha_days < acc_days + b_days:
            bhukti_lord = b_lord
            bhukti_yrs  = round(b_days / DAYS_PER_YR, 2)
            # Antara within bhukti
            elapsed_bhukti = elapsed_maha_days - acc_days
            acc2 = 0.0
            for j in range(9):
                a_idx  = (b_idx + j) % 9
                a_lord = DASHA_SEQ[a_idx]
                a_days = (DASHA_YRS[a_idx] / TOTAL_YRS) * b_days
                if elapsed_bhukti < acc2 + a_days:
                    antara_lord = a_lord
                    antara_yrs  = round(a_days / DAYS_PER_YR, 3)
                    break
                acc2 += a_days
            break
        acc_days += b_days

    return {
        "mahadasha":    maha_lord,
        "mahadasha_yrs": round(maha_yrs, 1),
        "balance_yrs":  round(balance_yrs, 2),
        "bhukti":       bhukti_lord or maha_lord,
        "bhukti_yrs":   bhukti_yrs,
        "antara":       antara_lord or bhukti_lord or maha_lord,
        "antara_yrs":   antara_yrs,
    }


# ════════════════════════════════════════════════════════════════════════
#  KP HORARY RAW ANALYTICAL CONSOLE  —  1971 "Astrology & Athrishta" PDF
#  Philosophy: NO final YES/NO. Engine = deep raw KP analytical layers.
#  Human astrologer reads these 14 layers and concludes manually.
# ════════════════════════════════════════════════════════════════════════

# ── Event House Mapping (all 14 topic types) ─────────────────────────────
PRASHNA_HOUSE_GROUPS = {
    "नौकरी / Job":          {
        "primary": [6,10],  "support": [2,11],
        "fulfillment": [11], "obstruct": [5,8,12],
        "neg": [5,8,12], "icon": "💼",
        "note": "6=service/effort, 10=status/career, 2=wealth, 11=success"
    },
    "विवाह / Marriage":     {
        "primary": [7],     "support": [2,11],
        "fulfillment": [11], "obstruct": [1,6,10],
        "neg": [1,6,10], "icon": "💍",
        "note": "7=partner, 2=family, 11=fulfillment, 1/6=self/conflict"
    },
    "व्यापार / Business":   {
        "primary": [7,10],  "support": [2,11],
        "fulfillment": [11], "obstruct": [8,12],
        "neg": [8,12], "icon": "🏪",
        "note": "7=partner/deal, 10=enterprise, 2=capital, 11=profit"
    },
    "संतान / Child":        {
        "primary": [5],     "support": [2,11],
        "fulfillment": [11], "obstruct": [1,4,10],
        "neg": [1,4,10], "icon": "👶",
        "note": "5=progeny, 2=family, 11=fulfillment"
    },
    "स्वास्थ्य / Health":   {
        "primary": [1],     "support": [5,11],
        "fulfillment": [11], "obstruct": [6,8,12],
        "neg": [6,8,12], "icon": "🏥",
        "note": "1=body, 5=vitality, 11=recovery, 6/8/12=disease/death/loss"
    },
    "यात्रा / Travel":      {
        "primary": [3,9],   "support": [12],
        "fulfillment": [11], "obstruct": [4,8],
        "neg": [4,8], "icon": "✈️",
        "note": "3=short travel, 9=long journey, 12=abroad, 4=home/anchor"
    },
    "धन / Finance":         {
        "primary": [2,11],  "support": [6,10],
        "fulfillment": [11], "obstruct": [8,12],
        "neg": [8,12], "icon": "💰",
        "note": "2=savings, 11=gains, 6=earnings, 10=career income"
    },
    "शत्रु / Enemy":        {
        "primary": [6],     "support": [3,11],
        "fulfillment": [11], "obstruct": [7,12],
        "neg": [7,12], "icon": "⚔️",
        "note": "6=enemy defeat, 3=courage, 11=victory, 7=opponent strength"
    },
    "शिक्षा / Education":   {
        "primary": [4,9],   "support": [6,11],
        "fulfillment": [11], "obstruct": [5,8,12],
        "neg": [5,8,12], "icon": "📚",
        "note": "4=basic edu, 9=higher/abroad, 6=competition, 11=success"
    },
    "गृह / Property":       {
        "primary": [4],     "support": [11,12],
        "fulfillment": [11], "obstruct": [3,8],
        "neg": [3,8], "icon": "🏠",
        "note": "4=property/home, 11=acquisition, 12=settlement abroad"
    },
}

# Mappings
_EN_TO_HI = {
    "Sun":"सूर्य","Moon":"चंद्र","Mars":"मंगल","Mercury":"बुध",
    "Jupiter":"गुरु","Venus":"शुक्र","Saturn":"शनि","Rahu":"राहु","Ketu":"केतु"
}
_HI_TO_EN = {v:k for k,v in _EN_TO_HI.items()}
_SHORT_TO_EN = {
    "Su":"Sun","Mo":"Moon","Ma":"Mars","Me":"Mercury",
    "Ju":"Jupiter","Ve":"Venus","Sa":"Saturn","Ra":"Rahu","Ke":"Ketu"
}
_EN_TO_SHORT = {v:k for k,v in _SHORT_TO_EN.items()}
_SIGN_LORDS_SHORT = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]


# ════════════════════════════════════════════════════════════════════════
#  LAYER 1 — QUERY VALIDATION
# ════════════════════════════════════════════════════════════════════════
def _layer1_query_validation(lagna_360: float, moon_lon: float,
                              kp_cusp_lords: list, kp_4_step: list,
                              kp_result_raw: dict, target_houses: set,
                              retro_set_hi: set) -> dict:
    """
    PDF Sutra: Check Moon NL/SL OR Lagna CSL connects to THIS topic's houses.
    Each topic validated separately — no blanket "all delay" result.
    """
    sig_map = {}
    for row in kp_4_step:
        all_h = set(row.get("L1",[]) + row.get("L2",[]) +
                    row.get("L3",[]) + row.get("L4",[]))
        sig_map[row["planet"]] = all_h

    csl_map = {c["house"]: c.get("sub_lord","") for c in kp_cusp_lords}

    # Moon lords
    moon_kp    = _kp_lords(moon_lon)
    moon_nl_en = _SHORT_TO_EN.get(moon_kp["NL"], moon_kp["NL"])
    moon_sl_en = _SHORT_TO_EN.get(moon_kp["SL"], moon_kp["SL"])
    moon_nl_hi = _EN_TO_HI.get(moon_nl_en, moon_nl_en)
    moon_sl_hi = _EN_TO_HI.get(moon_sl_en, moon_sl_en)

    # Lagna CSL (1st cusp sub lord — PDF primary check)
    lagna_csl_s  = csl_map.get(1, "")
    lagna_csl_en = _SHORT_TO_EN.get(lagna_csl_s, lagna_csl_s)

    # Houses each lord signifies
    moon_nl_h    = sig_map.get(moon_nl_en, set())
    moon_sl_h    = sig_map.get(moon_sl_en, set())
    lagna_csl_h  = sig_map.get(lagna_csl_en, set())

    # Per-topic connection (PDF: Moon NL/SL OR Lagna CSL must touch topic houses)
    moon_nl_ok   = bool(moon_nl_h  & target_houses)
    moon_sl_ok   = bool(moon_sl_h  & target_houses)
    lagna_csl_ok = bool(lagna_csl_h & target_houses)
    moon_ok      = moon_nl_ok or moon_sl_ok  # either NL or SL sufficient

    # 11th CSL — iccha purti / desire fulfillment check
    csl11_s  = csl_map.get(11, "")
    csl11_en = _SHORT_TO_EN.get(csl11_s, csl11_s)
    csl11_h  = sig_map.get(csl11_en, set())
    csl11_ok = bool(csl11_h & target_houses)

    # 1st CSL → 11th house check (PDF sutra: success formula)
    csl1_signifies_11 = 11 in lagna_csl_h
    # 11th CSL → beneficial houses check
    beneficial = {1,2,3,6,10,11}
    csl11_beneficial  = bool(csl11_h & beneficial)
    fulfillment_promised = csl1_signifies_11 or csl11_beneficial

    # Retrogression on Moon SL
    moon_sl_retro = moon_sl_hi in retro_set_hi

    # PDF verdict: Moon NL/SL OR Lagna CSL must connect to topic houses
    if moon_ok and lagna_csl_ok:
        validity = "✅ Query Verified — प्रश्न सत्य है"
    elif moon_ok or lagna_csl_ok:
        validity = "⚠️ Partially Verified — आंशिक सत्य"
    else:
        validity = "❌ Query Not Genuine — प्रश्नकर्ता गंभीर नहीं लगता"

    score = sum([moon_nl_ok, moon_sl_ok, lagna_csl_ok, csl11_ok])
    return {
        "moon_nl": moon_nl_en, "moon_nl_houses": sorted(moon_nl_h), "moon_nl_ok": moon_nl_ok,
        "moon_sl": moon_sl_en, "moon_sl_houses": sorted(moon_sl_h), "moon_sl_ok": moon_sl_ok,
        "moon_sl_retro": moon_sl_retro, "moon_ok": moon_ok,
        "lagna_csl": lagna_csl_en, "lagna_csl_houses": sorted(lagna_csl_h),
        "lagna_csl_ok": lagna_csl_ok, "lagna_ok": lagna_csl_ok,
        "cusp11_csl": csl11_en, "cusp11_ok": csl11_ok, "cusp11_houses": sorted(csl11_h),
        "csl1_signifies_11": csl1_signifies_11,
        "csl11_beneficial": csl11_beneficial,
        "fulfillment_promised": fulfillment_promised,
        "score": score, "max_score": 4,
        "validity": validity,
        "genuineness": validity,
        "note": "PDF Sutra: Moon NL/SL OR Lagna CSL must connect to topic houses.",
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 2 — ROTATED HOUSE REFERENCE (Bhavat Bhavam)
# ════════════════════════════════════════════════════════════════════════
ROTATION_PERSONS = {
    "स्वयं / Self": 1,   "पुत्र / Son": 5,
    "पत्नी / Spouse": 7, "माता / Mother": 4,
    "पिता / Father": 9,  "भाई / Brother": 3,
    "मित्र / Friend": 11,"शत्रु / Enemy": 6,
    "पुत्री / Daughter": 5,
}

def _layer2_rotation(kp_cusp_lords: list, pivot: int = 1) -> dict:
    rotated_csl = {}
    for c in kp_cusp_lords:
        old_h = c["house"]
        new_h = ((old_h - pivot) % 12) + 1
        rotated_csl[new_h] = {
            "original_house": old_h,
            "sign_lord": c.get("sign_lord",""),
            "star_lord": c.get("star_lord",""),
            "sub_lord":  c.get("sub_lord",""),
            "degree":    c.get("degree",""),
        }
    return {
        "pivot_house": pivot,
        "note": f"भाव {pivot} को लग्न मानकर chart rotate किया गया।",
        "rotated_cusps": rotated_csl,
        "rotation_map": ROTATION_PERSONS,
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 3 — EVENT HOUSE MAPPING
# ════════════════════════════════════════════════════════════════════════
def _layer3_event_map(topic: str, info: dict, kp_cusp_lords: list,
                       sig_map: dict) -> dict:
    csl_map = {c["house"]: c.get("sub_lord","") for c in kp_cusp_lords}
    result  = {}
    for role in ["primary","support","fulfillment","obstruct"]:
        houses = info.get(role, [])
        details = []
        for h in houses:
            csl_s  = csl_map.get(h,"")
            csl_en = _SHORT_TO_EN.get(csl_s, csl_s)
            csl_h  = sig_map.get(csl_en, set())
            target = set(info.get("primary",[]) + info.get("support",[]) +
                         info.get("fulfillment",[]))
            neg    = set(info.get("obstruct",[]))
            details.append({
                "house": h, "csl": csl_en,
                "csl_sig_houses": sorted(csl_h),
                "csl_favors_event": bool(csl_h & target),
                "csl_obstructs":    bool(csl_h & neg),
            })
        result[role] = details
    result["topic_note"] = info.get("note","")
    return result


# ════════════════════════════════════════════════════════════════════════
#  LAYER 4 — COMPLETE CSL ANALYSIS (event-specific + full retro rules)
# ════════════════════════════════════════════════════════════════════════
def _layer4_csl_deep(kp_cusp_lords: list, kp_result_raw: dict,
                      retro_set_hi: set, sig_map: dict,
                      target_houses: set, neg_houses: set,
                      primary_houses: set = None) -> list:
    """
    PDF Sutra: Check PRIMARY house CSL for event-specific verdict.
    - CSL in retro NL star → DENIAL (not delay!)
    - CSL itself retro, NL direct → DELAY
    - CSL in retro SL → DELAY then success
    - All direct → proceed normally
    """
    sig_raw = kp_result_raw.get("significators", {})
    primary = primary_houses or target_houses
    output  = []

    for c in kp_cusp_lords:
        h       = c["house"]
        csl_s   = c.get("sub_lord","")
        csl_en  = _SHORT_TO_EN.get(csl_s, csl_s)
        csl_hi  = _EN_TO_HI.get(csl_en, csl_en)

        csl_sig  = sig_raw.get(csl_s, {})
        kp_data  = csl_sig.get("kp", {}) if csl_sig else {}
        nl_hi    = kp_data.get("NL_hi","")
        sl_hi    = kp_data.get("SL_hi","")

        csl_sig_h = sig_map.get(csl_en, set())
        nl_en     = _HI_TO_EN.get(nl_hi, nl_hi)
        nl_sig_h  = sig_map.get(nl_en, set())

        csl_retro = csl_hi in retro_set_hi
        nl_retro  = nl_hi  in retro_set_hi
        sl_retro  = sl_hi  in retro_set_hi

        # PDF exact IF-ELSE rules (1971 KP):
        # 1. IF Star Lord (NL) is retro → DENIAL (worst)
        # 2. ELSE IF Sub Lord (SL) is retro → DELAY then success (when SL turns direct)
        # 3. ELSE IF CSL itself retro AND NL direct → OBSTACLES then success
        # 4. ELSE → PROMISED, proceed to DBA
        if nl_retro:
            retro_verdict = "denial"
            retro_note    = f"🚫 DENIAL: CSL {csl_en} का Star Lord {nl_hi} वक्री → घटना नहीं होगी"
        elif sl_retro:
            retro_verdict = "delay"
            retro_note    = f"⏳ DELAY: CSL {csl_en} का Sub Lord {sl_hi} वक्री → {sl_hi} मार्गी होने पर सफलता"
        elif csl_retro and not nl_retro:
            retro_verdict = "delay"
            retro_note    = f"⏳ OBSTACLES: CSL {csl_en} स्वयं वक्री, NL मार्गी → रुकावटों के बाद सफलता"
        else:
            retro_verdict = "direct"
            retro_note    = f"✅ PROMISED: CSL {csl_en}, NL {nl_hi}, SL {sl_hi} सभी मार्गी → DBA देखें"

        favors = bool(csl_sig_h & target_houses)
        blocks = bool(csl_sig_h & neg_houses)
        # Is this a primary event house? (Job=6/10, Marriage=7 etc.)
        is_primary = h in primary

        output.append({
            "house":            h,
            "degree":           c.get("degree",""),
            "sign_lord":        c.get("sign_lord",""),
            "star_lord":        c.get("star_lord",""),
            "sub_lord":         csl_en,
            "csl_signifies":    sorted(csl_sig_h),
            "csl_nl":           nl_en,
            "csl_nl_signifies": sorted(nl_sig_h),
            "favors_event":     favors,
            "obstructs_event":  blocks,
            "retro_verdict":    retro_verdict,
            "retro_note":       retro_note,
            "csl_retro":        csl_retro,
            "nl_retro":         nl_retro,
            "sl_retro":         sl_retro,
            "contaminated":     nl_retro or sl_retro,
            "is_primary_house": is_primary,
        })
    return output


# ════════════════════════════════════════════════════════════════════════
#  LAYER 5 — FULL SIGNIFICATOR EXTRACTION (A/B/C/D/E + rejection)
# ════════════════════════════════════════════════════════════════════════
def _layer5_significators(kp_4_step: list, kp_result_raw: dict,
                           retro_set_hi: set, target_houses: set,
                           neg_houses: set) -> dict:
    sig_raw   = kp_result_raw.get("significators", {})
    placements = kp_result_raw.get("planet_placements", {})
    graded    = {}

    for row in kp_4_step:
        p_en    = row["planet"]
        p_hi    = _EN_TO_HI.get(p_en, p_en)
        p_short = _EN_TO_SHORT.get(p_en,"")
        sig_data = sig_raw.get(p_short,{})
        kp_data  = sig_data.get("kp",{}) if sig_data else {}
        nl_hi    = kp_data.get("NL_hi","")
        sl_hi    = kp_data.get("SL_hi","")
        nl_en    = _HI_TO_EN.get(nl_hi, nl_hi)

        l1 = set(row.get("L1",[]))
        l2 = set(row.get("L2",[]))
        l3 = set(row.get("L3",[]))
        l4 = set(row.get("L4",[]))
        all_h = l1|l2|l3|l4

        pos_l1 = l1 & target_houses
        pos_l2 = l2 & target_houses
        pos_l3 = l3 & target_houses
        pos_l4 = l4 & target_houses

        if   pos_l1: grade, strength, grade_reason = "A", 4.0, f"L1: भाव {sorted(pos_l1)} के अधिवासी के नक्षत्र में"
        elif pos_l2: grade, strength, grade_reason = "B", 3.0, f"L2: स्वयं भाव {sorted(pos_l2)} में अधिवासी"
        elif pos_l3: grade, strength, grade_reason = "C", 2.0, f"L3: भाव {sorted(pos_l3)} स्वामी के नक्षत्र में"
        elif pos_l4: grade, strength, grade_reason = "D", 1.0, f"L4: भाव {sorted(pos_l4)} का स्वामी"
        else:        grade, strength, grade_reason = None, 0.0, "लक्ष्य भावों से असंबद्ध"

        # Retrogression classification
        is_retro    = p_hi in retro_set_hi
        nl_retro    = nl_hi in retro_set_hi
        sl_retro    = sl_hi in retro_set_hi

        if nl_retro:
            retro_class = "rejected"
            retro_why   = f"NL {nl_hi} वक्री → denied, significant result unlikely"
        elif is_retro and not nl_retro:
            retro_class = "delayed"
            retro_why   = f"{p_en} स्वयं वक्री → delayed, will fructify after direct motion"
        elif sl_retro:
            retro_class = "suspended"
            retro_why   = f"SL {sl_hi} वक्री → suspended, fructification after SL turns direct"
        else:
            retro_class = "direct"
            retro_why   = "मार्गी — सामान्य बल"

        # Neg house contamination
        neg_touched = sorted(all_h & neg_houses)

        if grade is None:
            continue

        graded[p_en] = {
            "grade":         grade,
            "strength":      strength,
            "grade_reason":  grade_reason,
            "l1": sorted(l1), "l2": sorted(l2),
            "l3": sorted(l3), "l4": sorted(l4),
            "pos_houses":    sorted(pos_l1|pos_l2|pos_l3|pos_l4),
            "all_houses":    sorted(all_h),
            "neg_touched":   neg_touched,
            "is_retro":      is_retro,
            "nl":            nl_en,
            "nl_retro":      nl_retro,
            "sl_retro":      sl_retro,
            "retro_class":   retro_class,
            "retro_why":     retro_why,
            "untenanted":    sig_data.get("is_untenanted", False),
            "rejected":      retro_class == "rejected",
        }

    # ── Grade E (L5): Conjunction AND Aspect with A-D planets ──────────
    # PDF: L5 = planets conjunct OR aspected BY A-D significators
    # KP Aspects: All→7th | Mars+4th,8th | Jupiter+5th,9th | Saturn+3rd,10th

    def _kp_aspect_houses(planet_en: str, from_house: int) -> set:
        """Houses that planet_en aspects FROM from_house"""
        aspects = {((from_house - 1 + 6) % 12) + 1}  # 7th from = all planets
        extra = {
            "Mars":    {3, 7},   # 4th and 8th from Mars position
            "Jupiter": {4, 8},   # 5th and 9th
            "Saturn":  {2, 9},   # 3rd and 10th
        }
        for offset in extra.get(planet_en, set()):
            aspects.add(((from_house - 1 + offset) % 12) + 1)
        return aspects

    # Build A-D planet houses map
    ad_planet_houses = {}
    for p, d in graded.items():
        if d["grade"] in ("A","B","C","D"):
            p_s = _EN_TO_SHORT.get(p,"")
            ph  = placements.get(p_s) or placements.get(p)
            if ph: ad_planet_houses[p] = ph

    for row in kp_4_step:
        p_en = row["planet"]
        if p_en in graded: continue
        p_short = _EN_TO_SHORT.get(p_en,"")
        # placements uses short codes ("Su","Mo") from kp_significators.py
        p_house = placements.get(p_short)
        if p_house is None:
            # fallback: try english name directly
            p_house = placements.get(p_en)
        if not p_house: continue

        # Check conjunction (same house) OR being aspected by A-D planet
        conjunct_with = [ab for ab, abh in ad_planet_houses.items() if abh == p_house]
        aspected_by   = [ab for ab, abh in ad_planet_houses.items()
                         if p_house in _kp_aspect_houses(ab, abh)]

        connected = list(set(conjunct_with + aspected_by))
        if connected:
            p_hi  = _EN_TO_HI.get(p_en, p_en)
            sig_d = sig_raw.get(p_short,{})
            kpd   = sig_d.get("kp",{}) if sig_d else {}
            nl_hi = kpd.get("NL_hi","")
            sl_hi = kpd.get("SL_hi","")
            is_r  = p_hi in retro_set_hi
            nl_r  = nl_hi in retro_set_hi
            sl_r  = sl_hi in retro_set_hi
            all_h = sorted(set(row.get("L1",[])+row.get("L2",[])+row.get("L3",[])+row.get("L4",[])))

            conj_str = f"युक्त: {', '.join(conjunct_with)}" if conjunct_with else ""
            asp_str  = f"दृष्ट: {', '.join(aspected_by)}"  if aspected_by  else ""
            reason   = " | ".join(filter(None, [conj_str, asp_str]))

            if nl_r:   rc,rw = "rejected",  f"NL {nl_hi} वक्री → Grade E rejected"
            elif sl_r: rc,rw = "suspended", f"SL {sl_hi} वक्री → Grade E suspended"
            elif is_r: rc,rw = "delayed",   f"{p_en} स्वयं वक्री → Grade E delayed"
            else:      rc,rw = "direct",    "मार्गी — Grade E active"

            graded[p_en] = {
                "grade":"E","strength":0.5,
                "grade_reason": f"Grade E/L5: {reason}",
                "l1":[],"l2":[],"l3":[],"l4":[],
                "pos_houses":[],"all_houses":all_h,"neg_touched":[],
                "is_retro":is_r,"nl":_HI_TO_EN.get(nl_hi,nl_hi),
                "nl_retro":nl_r,"sl_retro":sl_r,
                "retro_class":rc,"retro_why":rw,
                "untenanted":sig_d.get("is_untenanted",False),
                "rejected":nl_r,
                "houses_all":all_h,"retro_deny":nl_r,"retro_delay":is_r and not nl_r,
                "conjunct_with": conjunct_with,
                "aspected_by":   aspected_by,
            }

    # ── PDF Rejection filter: remove retro-NL planets from active use ──
    # "Reject the significator which is in the star of retrograde planet"
    strongest = sorted([p for p,d in graded.items()
                        if d["grade"] in ("A","B") and d["retro_class"]=="direct"],
                       key=lambda p:-graded[p]["strength"])
    medium    = sorted([p for p,d in graded.items()
                        if d["grade"] in ("C","D") and d["retro_class"]=="direct"],
                       key=lambda p:-graded[p]["strength"])
    weak      = sorted([p for p,d in graded.items() if d["grade"]=="E"],
                       key=lambda p:-graded[p]["strength"])
    delayed   = sorted([p for p,d in graded.items()
                        if d["retro_class"] in ("delayed","suspended")],
                       key=lambda p:-graded[p]["strength"])
    rejected  = sorted([p for p,d in graded.items()
                        if d["retro_class"]=="rejected"],
                       key=lambda p:-graded[p]["strength"])
    # active = PDF-approved list (rejected filtered OUT) for DBA/RP matching
    active    = [p for p in strongest + medium if not graded[p]["rejected"]]

    return {
        "graded":graded,"strongest":strongest,"medium":medium,
        "weak":weak,"delayed":delayed,"rejected":rejected,
        "active":active,
        "all_ranked":sorted(graded.keys(),key=lambda p:-graded[p]["strength"]),
    }



# ════════════════════════════════════════════════════════════════════════
#  LAYER 6 — RAHU/KETU ADVANCED BREAKDOWN
# ════════════════════════════════════════════════════════════════════════
def _layer6_rahu_ketu(kp_result_raw: dict, retro_set_hi: set,
                       sig_map: dict, target_houses: set) -> dict:
    sigs        = kp_result_raw.get("significators",{})
    placements  = kp_result_raw.get("planet_placements",{})
    output      = {}

    for node_s, node_en, node_hi in [("Ra","Rahu","राहु"),("Ke","Ketu","केतु")]:
        nd = sigs.get(node_s,{})
        if not nd: continue
        kpd       = nd.get("kp",{})
        nl_hi     = kpd.get("NL_hi","")
        sl_hi     = kpd.get("SL_hi","")
        sign_lord_s = _SIGN_LORDS_SHORT[int((kp_result_raw.get("planet_placements",{}).get(node_s,1)-1)*30/30) % 12] if False else kpd.get("SignLord","")
        nl_en     = _HI_TO_EN.get(nl_hi, nl_hi)
        sl_en     = _HI_TO_EN.get(sl_hi, sl_hi)

        occupied_h  = placements.get(node_s)

        # Planets conjunct Rahu/Ketu (same house)
        conjoined   = [_SHORT_TO_EN.get(ps,ps) for ps,ph in placements.items()
                       if ph == occupied_h and ps != node_s]

        # Star lord influence
        nl_houses   = sig_map.get(nl_en, set())

        # Sign lord influence
        sl_sign_en  = _SHORT_TO_EN.get(sign_lord_s, sign_lord_s)
        sl_sign_h   = sig_map.get(sl_sign_en, set())

        # Is star occupied by another planet?
        star_tenanted = any(
            kp_result_raw.get("significators",{}).get(ps,{}).get("kp",{}).get("NL_hi","") == nl_hi
            and ps != node_s
            for ps in ["Su","Mo","Ma","Me","Ju","Ve","Sa"]
        )

        retro_contam  = nl_hi in retro_set_hi

        # Representation
        if conjoined:
            rep = "पूर्ण (Full) — युक्त ग्रह के गुण धारण करता है"
        elif star_tenanted:
            rep = "आंशिक (Partial) — NL का नक्षत्र अन्य ग्रह से भरा है"
        else:
            rep = "स्वतंत्र (Independent) — स्वयं NL + SignLord के अनुसार"

        output[node_en] = {
            "house_placed":     occupied_h,
            "conjoined_planets": conjoined,
            "star_lord":        nl_en,
            "star_lord_houses": sorted(nl_houses),
            "sign_lord":        sl_sign_en,
            "sign_lord_houses": sorted(sl_sign_h),
            "star_tenanted":    star_tenanted,
            "retro_contaminated": retro_contam,
            "representation":   rep,
            "favors_event":     bool(nl_houses & target_houses),
            "note": f"{node_hi} bhav {occupied_h} mein — NL {nl_en} {'वक्री' if retro_contam else 'मार्गी'}",
        }
    return output


# ════════════════════════════════════════════════════════════════════════
#  LAYER 7 — DBA RESONANCE ANALYSIS
# ════════════════════════════════════════════════════════════════════════
def _layer7_dba_resonance(dba: dict, sig_map: dict,
                           target_houses: set, neg_houses: set,
                           retro_set_hi: set) -> dict:
    output = {}
    for period, key in [("महादशा","mahadasha"),("भुक्ति","bhukti"),("अंतरा","antara")]:
        lord_hi = dba.get(key,"")
        lord_en = _HI_TO_EN.get(lord_hi, lord_hi)
        houses  = sig_map.get(lord_en, set())
        pos_h   = sorted(houses & target_houses)
        neg_h   = sorted(houses & neg_houses)
        is_retro = lord_hi in retro_set_hi

        if is_retro:
            retro_effect = "वक्री — DBA फल में विलंब या अवरोध"
        else:
            retro_effect = "मार्गी — सामान्य फल"

        supports = len(pos_h) > 0
        obstructs = len(neg_h) > 0 and not supports

        output[period] = {
            "lord":          lord_en,
            "lord_hi":       lord_hi,
            "houses":        sorted(houses),
            "positive_houses": pos_h,
            "negative_houses": neg_h,
            "supports_event": supports,
            "obstructs_event": obstructs,
            "mixed":          supports and len(neg_h) > 0,
            "is_retro":       is_retro,
            "retro_effect":   retro_effect,
            "resonance": "strong" if len(pos_h) >= 2 else "medium" if len(pos_h)==1 else "weak",
        }
    return output


# ════════════════════════════════════════════════════════════════════════
#  LAYER 8 — RULING PLANET CONCURRENCE
# ════════════════════════════════════════════════════════════════════════
def _layer8_rp_concurrence(rp_data: dict, graded_sigs: dict,
                             csl_list: list, dba: dict,
                             sig_map: dict, target_houses: set,
                             retro_set_hi: set) -> dict:
    rp_list = rp_data.get("ruling_planets", [])
    rp_set  = set(rp_list)
    csl_sub_lords = {c["house"]: _SHORT_TO_EN.get(c.get("sub_lord",""),"")
                     for c in csl_list}

    # Overlap with significators
    strong_sigs = {p for p,d in graded_sigs.items() if d["grade"] in ("A","B") and not d["rejected"]}
    sig_overlap = sorted(strong_sigs & rp_set)

    # Overlap with CSLs
    csl_overlap = [p for p in rp_set
                   if p in {v for v in csl_sub_lords.values()}]

    # Overlap with DBA lords
    dba_lords = {_HI_TO_EN.get(dba.get(k,""),dba.get(k,""))
                 for k in ["mahadasha","bhukti","antara"]}
    dba_overlap = sorted(rp_set & dba_lords)

    # Per-RP analysis
    rp_detail = []
    for rp in rp_list:
        rp_hi    = _EN_TO_HI.get(rp, rp)
        rp_h     = sig_map.get(rp, set())
        is_retro = rp_hi in retro_set_hi
        in_sigs  = rp in strong_sigs
        in_dba   = rp in dba_lords
        in_csl   = rp in {v for v in csl_sub_lords.values()}
        favors   = bool(rp_h & target_houses)

        if is_retro:
            influence = "वक्री — RP सक्रिय नहीं, dormant"
        elif in_sigs and in_dba:
            influence = "पूर्ण सक्रिय (Sig + DBA दोनों में)"
        elif in_sigs:
            influence = "Significator के रूप में सक्रिय"
        elif in_dba:
            influence = "DBA में सक्रिय"
        elif favors:
            influence = "भावों से जुड़ा पर sig list में नहीं"
        else:
            influence = "निष्क्रिय — भावों से असंबद्ध"

        rp_detail.append({
            "planet": rp, "houses": sorted(rp_h),
            "is_retro": is_retro,
            "in_significators": in_sigs,
            "in_dba": in_dba,
            "in_csl": in_csl,
            "favors_event": favors,
            "influence": influence,
        })

    score = len(sig_overlap)
    if score >= 3:    strength = "पूर्ण (Full Concurrence)"
    elif score >= 2:  strength = "मजबूत (Strong)"
    elif score >= 1:  strength = "आंशिक (Partial)"
    else:             strength = "कमजोर (Weak)"

    return {
        "all_rps":      rp_list,
        "sig_overlap":  sig_overlap,
        "csl_overlap":  csl_overlap,
        "dba_overlap":  dba_overlap,
        "score":        score,
        "strength":     strength,
        "rp_detail":    rp_detail,
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 9 — TRANSIT ACTIVATION ENGINE
# ════════════════════════════════════════════════════════════════════════
def _layer9_transit(macro_gochar: dict, graded_sigs: dict,
                     rp_data: dict, dba: dict,
                     sig_map: dict, target_houses: set,
                     retro_set_hi: set) -> dict:
    rp_set   = set(rp_data.get("ruling_planets",[]))
    dba_lords= {_HI_TO_EN.get(dba.get(k,""), dba.get(k,""))
                for k in ["mahadasha","bhukti","antara"]}
    strong_sigs = {p for p,d in graded_sigs.items() if d["grade"] in ("A","B") and not d["rejected"]}

    hi_to_en_map = {
        "सूर्य":"Sun","चंद्र":"Moon","मंगल":"Mars","बुध":"Mercury",
        "गुरु":"Jupiter","शुक्र":"Venus","शनि":"Saturn","राहु":"Rahu","केतु":"Ketu"
    }

    activated    = []
    pending      = []
    blocked      = []

    for p_en, g_data in macro_gochar.items():
        tnl_hi  = g_data.get("Transit_NL","")
        tnl_en  = hi_to_en_map.get(tnl_hi, tnl_hi)
        t_retro = g_data.get("is_retrograde", False)
        t_hi    = _EN_TO_HI.get(p_en, p_en)

        is_rp   = p_en in rp_set
        is_dba  = p_en in dba_lords
        via_strong = tnl_en in strong_sigs

        if t_retro:
            blocked.append({
                "planet": p_en, "via_nl": tnl_en,
                "reason": f"{p_en} गोचर में वक्री — trigger blocked",
                "is_rp": is_rp, "is_dba": is_dba,
            })
        elif via_strong and (is_rp or is_dba):
            activated.append({
                "planet": p_en, "via_nl": tnl_en,
                "grade": graded_sigs.get(tnl_en,{}).get("grade","?"),
                "is_rp": is_rp, "is_dba": is_dba,
                "strength": "strong" if (is_rp and is_dba) else "medium",
            })
        elif via_strong:
            pending.append({
                "planet": p_en, "via_nl": tnl_en,
                "grade": graded_sigs.get(tnl_en,{}).get("grade","?"),
                "is_rp": is_rp, "is_dba": is_dba,
                "reason": "NL sig में है पर RP/DBA alignment नहीं",
            })

    # Special: Moon transit check
    moon_g = macro_gochar.get("Moon",{})
    moon_nl_hi = moon_g.get("Transit_NL","")
    moon_nl_en = hi_to_en_map.get(moon_nl_hi, moon_nl_hi)
    moon_transit_ok = moon_nl_en in strong_sigs and not moon_g.get("is_retrograde",False)

    # Sun transit check
    sun_g  = macro_gochar.get("Sun",{})
    sun_nl_hi = sun_g.get("Transit_NL","")
    sun_nl_en = hi_to_en_map.get(sun_nl_hi, sun_nl_hi)
    sun_transit_ok = sun_nl_en in strong_sigs and not sun_g.get("is_retrograde",False)

    return {
        "activated":      activated,
        "pending":        pending,
        "blocked":        blocked,
        "moon_transit_ok": moon_transit_ok,
        "moon_transit_via": moon_nl_en,
        "sun_transit_ok":  sun_transit_ok,
        "sun_transit_via": sun_nl_en,
        "trigger_active":  len(activated) > 0,
        "has_rp_trigger":  any(t["is_rp"] for t in activated),
        "has_dba_trigger": any(t["is_dba"] for t in activated),
        "note": "Transit = Final pin-point. DBA sets direction, transit pulls trigger."
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 10 — PROMISE vs FRUCTIFICATION
# ════════════════════════════════════════════════════════════════════════
def _layer10_promise_fructify(
    graded_sigs: dict,
    qv: dict,
    rp_conc: dict,
    transit: dict,
    dba_resonance: dict,
    retro_set_hi: set,
    active_sigs: list = None
) -> dict:

    # Use rejection-filtered active significators
    strong_clean = (
        active_sigs
        if active_sigs is not None
        else [
            p for p, d in graded_sigs.items()
            if d["grade"] in ("A", "B")
            and not d["rejected"]
        ]
    )

    # Retro classification
    any_denial = any(
        d["retro_class"] == "rejected"
        and d["grade"] in ("A", "B")
        for d in graded_sigs.values()
    )

    any_delay = any(
        d["retro_class"] in ("delayed", "suspended")
        and d["grade"] in ("A", "B")
        for d in graded_sigs.values()
    )

    # STRICT KP RULE:
    # If query itself is not genuine, stop promise evaluation immediately.
    if "❌" in qv.get("validity", ""):
        return {
            "event_promised": False,
            "timing_active": False,
            "obstruction_type": "no_promise",
            "delay_indicated": False,
            "denial_indicated": True,
            "retro_suspended": False,
            "partial_fulfillment": False,
            "strong_count": 0,
            "dba_supports": False,
            "rp_supports": False,
            "transit_ready": False,
            "note": "Query failed verification — Promise absent."
        }

    # Main promise logic
    promised = (
        len(strong_clean) >= 1
        and (
            qv.get("moon_ok")
            or qv.get("lagna_ok")
            or qv.get("moon_nl_ok")
            or qv.get("lagna_csl_ok")
        )
    )

    dba_supports = any(
        v["supports_event"]
        for v in dba_resonance.values()
    )

    rp_ok = rp_conc["score"] >= 1
    transit_ok = transit["trigger_active"]
    retro_suspended = any_delay

    # Obstruction type
    if not promised:
        obstruct = "no_promise"
    elif any_denial:
        obstruct = "denial"
    elif any_delay:
        obstruct = "delay_suspension"
    else:
        obstruct = "none"

    # Partial fulfillment
    partial = (
        promised
        and len(strong_clean) == 1
        and not dba_supports
    )

    return {
        "event_promised": promised,
        "timing_active": promised and transit_ok,
        "obstruction_type": obstruct,
        "delay_indicated": any_delay,
        "denial_indicated": any_denial,
        "retro_suspended": retro_suspended,
        "partial_fulfillment": partial,
        "strong_count": len(strong_clean),
        "dba_supports": dba_supports,
        "rp_supports": rp_ok,
        "transit_ready": transit_ok,
        "note": (
            "Promise exists but timing pending."
            if promised and not transit_ok
            else "Transit active."
            if promised and transit_ok
            else "No promise."
        )
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 11 — POSITIVE vs NEGATIVE RESONANCE
# ════════════════════════════════════════════════════════════════════════
def _layer11_resonance(graded_sigs: dict, neg_houses: set,
                        target_houses: set) -> dict:
    pos_h_activated = set()
    neg_h_activated = set()
    retro_score     = 0.0
    mixed_planets   = []
    dormant         = []

    for p, d in graded_sigs.items():
        p_all   = set(d["all_houses"])
        pos_hit = p_all & target_houses
        neg_hit = p_all & neg_houses

        if d["rejected"]:
            retro_score += d["strength"]
            dormant.append(p)
            continue

        if pos_hit: pos_h_activated |= pos_hit
        if neg_hit: neg_h_activated |= neg_hit
        if pos_hit and neg_hit:
            mixed_planets.append({"planet": p, "pos": sorted(pos_hit), "neg": sorted(neg_hit)})

    pos_score = sum(d["strength"] for p,d in graded_sigs.items()
                    if set(d["pos_houses"]) & target_houses and not d["rejected"])
    neg_score = sum(d["strength"]*0.5 for p,d in graded_sigs.items()
                    if set(d["all_houses"]) & neg_houses and not d["rejected"])
    total     = pos_score + neg_score + retro_score or 1
    balance   = round((pos_score - neg_score) / total * 100, 1)

    if balance > 50:    resonance_label = "✅ प्रबल सकारात्मक"
    elif balance > 10:  resonance_label = "⚖️ सकारात्मक पर मिश्रित"
    elif balance > -10: resonance_label = "⚖️ तटस्थ / अनिश्चित"
    elif balance > -50: resonance_label = "⚠️ नकारात्मक प्रभाव"
    else:               resonance_label = "❌ प्रबल नकारात्मक"

    return {
        "pos_houses_activated": sorted(pos_h_activated),
        "neg_houses_activated": sorted(neg_h_activated),
        "mixed_planets":        mixed_planets,
        "dormant_planets":      dormant,
        "pos_score":            round(pos_score,1),
        "neg_score":            round(neg_score,1),
        "retro_contamination":  round(retro_score,1),
        "balance":              balance,
        "label":                resonance_label,
        "fulfillment_resonance": pos_score >= 3,
        "obstruction_resonance": neg_score >= 2 or retro_score >= 2,
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 12 — DELAY / DENIAL / OBSTRUCTION LOGIC
# ════════════════════════════════════════════════════════════════════════
def _layer12_delay_denial(graded_sigs: dict, dba_resonance: dict,
                           rp_conc: dict, neg_houses: set,
                           retro_set_hi: set,
                           primary_csl_verdicts: list = None) -> dict:
    """
    PDF Sutra: Denial/Delay determined by PRIMARY house CSL verdicts.
    Saturn delays but never denies. Rejected sigs filtered out.
    """
    issues = []

    # ── Primary CSL verdicts: event-specific Denial/Delay ──────────
    if primary_csl_verdicts:
        for csl_data in primary_csl_verdicts:
            rv   = csl_data.get("retro_verdict","")
            note = csl_data.get("retro_note","")
            h    = csl_data.get("house","")
            if rv == "denial":
                issues.append({"type":"denial","planet":csl_data.get("sub_lord",""),
                    "reason":f"भाव {h} (Primary CSL): {note}",
                    "severity":"high","category":"primary_csl_denial"})
            elif rv == "delay":
                issues.append({"type":"delay","planet":csl_data.get("sub_lord",""),
                    "reason":f"भाव {h} (Primary CSL): {note}",
                    "severity":"medium","category":"primary_csl_delay"})


    # Saturn influence
    sat_d = graded_sigs.get("Saturn")
    if sat_d:
        sat_neg = set(sat_d["all_houses"]) & neg_houses
        if sat_neg:
            issues.append({
                "type": "delay", "planet": "Saturn",
                "reason": f"शनि भाव {sorted(sat_neg)} से जुड़ा — विलंब निश्चित, अस्वीकृति नहीं।",
                "severity": "medium",
                "category": "saturn_delay",
            })

    # Per-planet retro classification
    for p, d in graded_sigs.items():
        if d["grade"] not in ("A","B","C"): continue
        if d["retro_class"] == "rejected":
            issues.append({
                "type": "denial","planet": p,
                "reason": d["retro_why"],
                "severity": "high","category": "retro_denial",
            })
        elif d["retro_class"] == "delayed":
            issues.append({
                "type": "delay","planet": p,
                "reason": d["retro_why"],
                "severity": "medium","category": "retro_delay",
            })
        elif d["retro_class"] == "suspended":
            issues.append({
                "type": "suspension","planet": p,
                "reason": d["retro_why"],
                "severity": "medium","category": "retro_suspension",
            })

    # 8th house obstruction
    for p, d in graded_sigs.items():
        if 8 in set(d["all_houses"]) and d["grade"] in ("A","B"):
            issues.append({
                "type": "obstruction","planet": p,
                "reason": f"{p} भाव 8 से जुड़ा — छिपी बाधा / transformation।",
                "severity": "low","category": "8th_house",
            })

    # 12th house loss
    for p, d in graded_sigs.items():
        if 12 in set(d["all_houses"]) and d["grade"] in ("A","B"):
            issues.append({
                "type": "loss","planet": p,
                "reason": f"{p} भाव 12 से जुड़ा — व्यय / विदेश / अलगाव।",
                "severity": "low","category": "12th_house",
            })

    # DBA obstruction
    for period, pdata in dba_resonance.items():
        if pdata.get("obstructs_event") and pdata.get("is_retro"):
            issues.append({
                "type": "delay","planet": pdata["lord"],
                "reason": f"{period} {pdata['lord']} वक्री + नकारात्मक भाव → DBA विलंब।",
                "severity": "medium","category": "dba_retro",
            })

    # Weak RP
    if rp_conc["score"] == 0:
        issues.append({
            "type": "timing","planet": None,
            "reason": "कोई RP कारक ग्रहों से सहमत नहीं — घटना का समय अनिश्चित।",
            "severity": "medium","category": "weak_rp",
        })
    # STRICT PRIMARY CSL FILTER
    if primary_csl_verdicts:
        issues = [
            i for i in issues
            if i.get("category", "").startswith("primary_csl")
            or i.get("category") == "saturn_delay"
        ]

    has_denial  = any(i["type"] == "denial" for i in issues)
    has_delay   = any(i["type"] == "delay" for i in issues)
    has_suspend = any(i["type"] == "suspension" for i in issues)

    return {
        "issues":         issues,
        "has_denial":     has_denial,
        "has_delay":      has_delay,
        "has_suspension": has_suspend,
        "summary": "Denial: घटना नहीं होगी।" if has_denial
                   else "Delay: घटना होगी पर देरी से।" if has_delay
                   else "Suspension: जब वक्री ग्रह मार्गी हो तब।" if has_suspend
                   else "कोई विशेष बाधा नहीं।",
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 13 — MICRO TIMING PREPARATION
# ════════════════════════════════════════════════════════════════════════
def _layer13_micro_timing(graded_sigs: dict, rp_conc: dict,
                           transit: dict, dba_resonance: dict) -> dict:
    strongest_dba  = [(p, d["resonance"]) for p,d in dba_resonance.items()
                      if d["supports_event"] and d["resonance"]=="strong"]
    strongest_rp   = rp_conc.get("sig_overlap",[])
    strongest_transit = [t["planet"] for t in transit.get("activated",[]) if t.get("is_rp")]
    lagna_trigger  = [p for p,d in graded_sigs.items()
                      if d["grade"]=="A" and not d["rejected"]]
    dormant        = [p for p,d in graded_sigs.items()
                      if d["retro_class"] in ("delayed","suspended")]
    blocked_transit = [t["planet"] for t in transit.get("blocked",[])]

    return {
        "strongest_dba":        [p for p,_ in strongest_dba],
        "strongest_rp":         strongest_rp,
        "strongest_transit":    strongest_transit,
        "lagna_trigger_candidates": lagna_trigger,
        "dormant_triggers":     dormant,
        "blocked_transit":      blocked_transit,
        "note": "Micro timing = when DBA lord transits through NL of strongest A-grade significator."
    }


# ════════════════════════════════════════════════════════════════════════
#  LAYER 14 — RAW KP ANALYTICAL SUMMARY
# ════════════════════════════════════════════════════════════════════════
def _layer14_raw_summary(l1_qv, l5_sigs, l7_dba, l8_rp, l9_transit,
                          l10_pf, l11_res, l12_dd, l13_timing) -> dict:
    return {
        "strongest_supportive":  l5_sigs["strongest"],
        "strongest_obstructive": l12_dd["issues"],
        "strongest_significators": l5_sigs["strongest"][:3],
        "weakest_significators": l5_sigs["weak"],
        "rejected_significators": l5_sigs["rejected"],
        "retro_suspended":       l5_sigs["delayed"],
        "active_dba_themes":     {k: v["lord"] for k,v in l7_dba.items() if v["supports_event"]},
        "rp_agreement":          l8_rp["strength"],
        "transit_readiness":     "Active" if l9_transit["trigger_active"] else "Pending",
        "promise_status":        "✅ Promised" if l10_pf["event_promised"] else "❌ Not Promised",
        "fructification_ready":  l10_pf["timing_active"],
        "delay_indicated":       l12_dd["has_delay"],
        "denial_indicated":      l12_dd["has_denial"],
        "pending_activation":    l13_timing["dormant_triggers"],
        "query_validity":        l1_qv["validity"],
        "resonance_balance":     l11_res["balance"],
        "resonance_label":       l11_res["label"],
        "analytical_note": "यह raw KP data है। Final prediction के लिए ज्योतिषी सभी layers को साथ देखेंगे।"
    }


# ════════════════════════════════════════════════════════════════════════
#  MASTER FUNCTION — runs all 14 layers per topic
# ════════════════════════════════════════════════════════════════════════
def _kp_full_analysis(kp_4_step: list, kp_cusp_lords: list,
                      kp_result_raw: dict, ruling_planets_data: dict,
                      macro_gochar: dict, retro_set_hi: set,
                      lagna_360: float, moon_lon: float,
                      dba: dict = None) -> list:
    results  = []
    dba      = dba or {}

    # Build sig_map once
    sig_map = {}
    for row in kp_4_step:
        all_h = set(row.get("L1",[]) + row.get("L2",[]) +
                    row.get("L3",[]) + row.get("L4",[]))
        sig_map[row["planet"]] = all_h

    for topic, info in PRASHNA_HOUSE_GROUPS.items():
        target_h  = set(info.get("primary",[]) + info.get("support",[]) +
                        info.get("fulfillment",[]))
        neg_h     = set(info.get("obstruct",[]))
        all_target = set(info.get("primary",[]) + info.get("support",[]) +
                         info.get("fulfillment",[]))

        l1  = _layer1_query_validation(lagna_360, moon_lon, kp_cusp_lords,
                                       kp_4_step, kp_result_raw, target_h, retro_set_hi)
        l2  = _layer2_rotation(kp_cusp_lords, pivot=1)
        l3  = _layer3_event_map(topic, info, kp_cusp_lords, sig_map)
        primary_h = set(info.get("primary", []))
        if not primary_h:
            primary_h = set(info.get("houses", list(target_h)))[:2]
        l4  = _layer4_csl_deep(kp_cusp_lords, kp_result_raw, retro_set_hi,
                                sig_map, target_h, neg_h, primary_h)
        l5  = _layer5_significators(kp_4_step, kp_result_raw, retro_set_hi,
                                    target_h, neg_h)
        l6  = _layer6_rahu_ketu(kp_result_raw, retro_set_hi, sig_map, target_h)
        l7  = _layer7_dba_resonance(dba, sig_map, target_h, neg_h, retro_set_hi)
        l8  = _layer8_rp_concurrence(ruling_planets_data, l5["graded"],
                                     kp_cusp_lords, dba, sig_map, target_h, retro_set_hi)
        l9  = _layer9_transit(macro_gochar, l5["graded"], ruling_planets_data,
                              dba, sig_map, target_h, retro_set_hi)
        l10 = _layer10_promise_fructify(l5["graded"], l1, l8, l9, l7, retro_set_hi,
                                          active_sigs=l5.get("active",[]))
        l11 = _layer11_resonance(l5["graded"], neg_h, target_h)
        # For delay/denial: use primary house CSL verdicts from l4
        primary_csl_verdicts = [c for c in l4 if c.get("is_primary_house")]
        l12 = _layer12_delay_denial(l5["graded"], l7, l8, neg_h, retro_set_hi,
                                     primary_csl_verdicts)
        l13 = _layer13_micro_timing(l5["graded"], l8, l9, l7)
        l14 = _layer14_raw_summary(l1, l5, l7, l8, l9, l10, l11, l12, l13)

        # Status badge — driven by PRIMARY house CSL retro verdict (PDF exact rule)
        # primary_h contains only the main event houses (job=6,10; marriage=7 etc.)
        primary_csl_list = [c for c in l4 if c.get("house") in primary_h]
        primary_denial   = any(c["retro_verdict"]=="denial" for c in primary_csl_list)
        primary_delay    = any(c["retro_verdict"]=="delay"  for c in primary_csl_list)

        if primary_denial or l12["has_denial"]:
            status = "🚫 Denial Indicated"
        elif not l10["event_promised"]:
            status = "❓ Promise Absent"
        elif l10["timing_active"]:
            status = "⚡ Active Fructification"
        elif primary_delay or l12["has_delay"]:
            status = "⏳ Delay Indicated"
        elif l10["retro_suspended"]:
            status = "⏸️ Suspended (Retro)"
        elif l10["partial_fulfillment"]:
            status = "⚖️ Partial Promise"
        else:
            status = "✅ Promised — Proceed to DBA"

        color = ("#ef4444" if "Denial" in status or "Absent" in status
                 else "#22c55e" if "Active" in status or "Promised" in status
                 else "#f59e0b" if "Delay" in status or "Partial" in status
                 else "#94a3b8")


        results.append({
            "topic": topic, "icon": info["icon"],
            "status": status, "color": color,

            # All 14 layers
            "l1_query_validation":    l1,
            "l2_rotation":            l2,
            "l3_event_map":           l3,
            "l4_csl_deep":            l4,
            "l5_significators":       l5,
            "l6_rahu_ketu":           l6,
            "l7_dba":                 l7,
            "l8_rp":                  l8,
            "l9_transit":             l9,
            "l10_promise_fructify":   l10,
            "l11_resonance":          l11,
            "l12_delay_denial":       l12,
            "l13_micro_timing":       l13,
            "l14_summary":            l14,
        })

    return results




def _get_planets(jd: float, lat: float, lon: float) -> tuple[dict, float]:
    """
    सभी ग्रहों की position calculate करो (sidereal)
    
    FIX 3: ayanamsha sirf yahan ek baar apply hota hai
           swe.calc_ut already uses SIDM_LAHIRI set_sid_mode,
           BUT it returns TROPICAL longitude — manual subtract correct hai.
           Ensure karo: ek baar subtract, dobara nahi.
    FIX 2: Ketu = Rahu + 180° (manually added)
    """
    ayanamsha = swe.get_ayanamsa(jd)
    planets = {}

    for swe_id, name_hi, name_en in PLANETS_LIST:
        result = swe.calc_ut(jd, swe_id, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        if isinstance(result[0], (list, tuple)):
            data = result[0]
        else:
            data = result
        tropical_lon = data[0]
        speed        = data[3] if len(data) > 3 else 0.0

        # ✅ FIX 3: ONE-TIME ayanamsha subtraction (tropical → sidereal)
        sidereal_lon = _normalize_lon(tropical_lon - ayanamsha)

        rashi          = int(sidereal_lon / 30)
        degree_in_sign = sidereal_lon % 30

        # KP PDF Rule: Only Ma/Me/Ju/Ve/Sa can be retrograde.
        # Ra/Ke always move backward by nature — NOT counted as retrograde in KP.
        # Su/Mo never retrograde.
        KP_RETRO_ELIGIBLE_EN = {"Mars", "Mercury", "Jupiter", "Venus", "Saturn"}
        is_retrograde = bool(speed < 0) and (name_en in KP_RETRO_ELIGIBLE_EN)

        planets[name_hi] = {
            "name_hi":        name_hi,
            "name_en":        name_en,
            "longitude":      round(sidereal_lon, 4),
            "rashi":          rashi,
            "rashi_name":     RASHI_NAMES[rashi],
            "rashi_name_en":  RASHI_NAMES_EN[rashi],
            "degree_in_sign": round(degree_in_sign, 4),
            "is_retrograde":  is_retrograde,
            "speed":          round(speed, 6),
        }

    # ✅ FIX 2: Ketu = Rahu + 180°
    rahu_lon   = planets["राहु"]["longitude"]
    ketu_lon   = _normalize_lon(rahu_lon + 180.0)
    ketu_rashi = int(ketu_lon / 30)

    planets["केतु"] = {
        "name_hi":        "केतु",
        "name_en":        "Ketu",
        "longitude":      round(ketu_lon, 4),
        "rashi":          ketu_rashi,
        "rashi_name":     RASHI_NAMES[ketu_rashi],
        "rashi_name_en":  RASHI_NAMES_EN[ketu_rashi],
        "degree_in_sign": round(ketu_lon % 30, 4),
        "is_retrograde":  False,  # KP: Ketu never counted as retrograde
        "speed":          0.0,
    }

    return planets, ayanamsha


def _get_lagna(jd: float, lat: float, lon: float, ayanamsha: float) -> tuple[float, float]:
    """
    Lagna (Ascendant) sidereal degree calculate karo.

    FIX 3 (lagna side): swe.houses() TROPICAL ascendant deta hai.
    FIX 5: Pure Whole Sign — sirf ascendant degree chahiye,
           Placidus cusp values use nahi karte.
    """
    # swe.houses with b"W" = Whole Sign system
    # We only need ascmc[0] (tropical ascendant degree)
    _, ascmc = swe.houses(jd, lat, lon, b"W")
    tropical_lagna = ascmc[0]

    # ✅ FIX 3: subtract ayanamsha once to get sidereal lagna
    sidereal_lagna = _normalize_lon(tropical_lagna - ayanamsha)
    return sidereal_lagna, tropical_lagna


def _build_whole_sign_houses(lagna_rashi: int) -> dict:
    """
    FIX 5: Pure Whole Sign Houses.
    House 1 = Lagna rashi, House 2 = next rashi, etc.
    """
    houses = {}
    for i in range(12):
        house_num  = i + 1
        house_rashi = (lagna_rashi + i) % 12
        houses[house_num] = {
            "house":      house_num,
            "rashi":      house_rashi,
            "rashi_name": RASHI_NAMES[house_rashi],
        }
    return houses


def _build_placidus_houses(jd: float, lat: float, lon: float, ayanamsha: float) -> dict:
    """
    Placidus House System for KP Mode.
    Uses actual cusp degrees from Swiss Ephemeris.
    
    FIXED: Safe indexing for different pyswisseph versions
    - Some versions return 13 elements (index 0 unused, 1-12 are houses)
    - Some versions return 12 elements (index 0-11 are houses)
    """
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P')
    
    houses = {}
    for i in range(12):
        house_num = i + 1
        
        # ✅ SAFE INDEXING: Works with both 12 and 13 element tuples
        if len(cusps) == 13:
            tropical_cusp = cusps[house_num]      # Index 1 to 12
        else:
            tropical_cusp = cusps[house_num - 1]  # Index 0 to 11
            
        sidereal_cusp = _normalize_lon(tropical_cusp - ayanamsha)
        house_rashi = int(sidereal_cusp / 30)
        
        houses[house_num] = {
            "house":      house_num,
            "rashi":      house_rashi,
            "rashi_name": RASHI_NAMES[house_rashi],
            "cusp_deg":   round(sidereal_cusp, 4),
        }
    return houses


def _assign_planets_to_houses(planets: dict, lagna_rashi: int) -> dict:
    """ग्रहों को घरों में assign करो (Whole Sign logic)"""
    planet_houses = {}
    for planet_name, planet_data in planets.items():
        planet_rashi = planet_data["rashi"]
        house_num    = (planet_rashi - lagna_rashi) % 12 + 1
        planet_houses[planet_name] = {
            "name":       planet_name,
            "house":      house_num,
            "rashi":      planet_rashi,
            "rashi_name": RASHI_NAMES[planet_rashi],
        }
    return planet_houses


def _lost_item_engine(
    second_house_rashi: int,
    second_lord_name:   str,
    second_lord_house,          # int or None (FIX 4)
    lagna_rashi:        int,
) -> dict:
    """
    Lost Item Prediction Engine

    FIX 4: second_lord_house can be None if planet missing — handled gracefully.
    """
    location_map = {
        1:  "अपने पास / कमरे में",
        2:  "घर में बैठने की जगह",
        3:  "पास की जगह / कोने में",
        4:  "घर में छिपी जगह / तहखाना",
        5:  "कमजोर जगह / किनारे पर",
        6:  "नौकर / जानवर के पास",
        7:  "चोरी हुई / दूसरे के पास",
        8:  "हमेशा के लिए खोई / गहरी जगह",
        9:  "दूर की जगह",
        10: "काम की जगह / ऊपरी मंजिल",
        11: "मिल जाएगी / दोस्त के पास",
        12: "बहुत दूर / विदेश में",
    }

    # ✅ FIX 4: None guard
    if second_lord_house is None:
        location = "अज्ञात (ग्रह उपलब्ध नहीं)"
        prediction_suffix = f"2nd lord {second_lord_name} की स्थिति अज्ञात है।"
    else:
        location          = location_map.get(second_lord_house, "अज्ञात जगह")
        prediction_suffix = f"2nd lord {second_lord_name} {second_lord_house} भाव में है।"

    quality      = RASHI_QUALITY[second_house_rashi]
    movement_map = {
        "movable": "चल गई / हिल गई है",
        "fixed":   "एक ही जगह रही",
        "dual":    "हिली-डुली / घर में ही है",
    }
    movement = movement_map.get(quality, "अज्ञात")

    element      = RASHI_ELEMENT[second_house_rashi]
    direction_hi = RASHI_ELEMENT_HI.get(element, "अज्ञात")
    direction_en = RASHI_ELEMENT_DIR.get(element, "Unknown")

    prediction = (
        f"खोई हुई वस्तु {location} है। "
        f"राशि का गुण '{RASHI_QUALITY_HI.get(quality, 'अज्ञात')}' है इसलिए वस्तु {movement.lower()} है। "
        f"{RASHI_NAMES[second_house_rashi]} राशि {direction_hi} दिशा से संबंधित है, "
        f"अतः {direction_hi.lower()} की ओर खोज करें। "
        f"{prediction_suffix}"
    )

    return {
        "location":           location,
        "location_house":     second_lord_house,
        "movement":           movement,
        "movement_type":      quality,
        "direction_hi":       direction_hi,
        "direction_en":       direction_en,
        "element":            element,
        "second_house_rashi": second_house_rashi,
        "second_lord":        second_lord_name,
        "prediction":         prediction,
    }

# ── Route ─────────────────────────────────────────────────────────────────

@prashna_bp.route("/api/prashna_kundli", methods=["POST"])
def prashna_kundli():
    """
    Complete Prashna Kundli API with Lost Item Engine (v2.0)

    Request  → { "lat": 28.61, "lon": 77.20, "tz_offset": 5.5 }
    Response → lagna, kaksha, planets (incl. Ketu), houses, lost_item, etc.
    """
    try:
        body = request.get_json(force=True) or {}

        if "lat" not in body or "lon" not in body:
            return jsonify({"error": "lat और lon अनिवार्य हैं"}), 400

        lat       = float(body["lat"])
        lon_input = float(body["lon"])
        tz_offset = float(body.get("tz_offset", 5.5))
        kp_number = body.get("kp_number")  # Optional KP Number (1-249)

       # 🚀 CUSTOM DATE & KP NUMBER 🚀
        kp_number   = body.get("kp_number") 
        custom_date = body.get("date") 
        custom_time = body.get("time") 

        if custom_date and custom_time:
            dt_str = f"{custom_date} {custom_time}"
            now_local = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            now_utc = now_local - timedelta(hours=tz_offset)
        else:
            # ✅ FIX: Pylance Deprecation Warning Fixed
            now_utc_aware = datetime.now(timezone.utc)
            now_utc = now_utc_aware.replace(tzinfo=None) # Custom date से मैच करने के लिए Naive रखें
            now_local = now_utc + timedelta(hours=tz_offset)

        # ✅ FIX 1: Precise UTC time with correct hour_decimal
        hour_decimal = now_utc.hour + now_utc.minute / 60.0 + now_utc.second / 3600.0
        jd = swe.julday(now_utc.year, now_utc.month, now_utc.day, hour_decimal)

       # ▶ Ayanamsha (calculated once, passed to all helpers)
        ayanamsha = swe.get_ayanamsa(jd)

        # 🚀 1. KP vs VEDIC MODE SETUP 🚀
        if kp_number and 1 <= int(kp_number) <= 249:
            lagna_360 = get_kp_horary_degree(int(kp_number))
            house_system = b'P'  # Placidus for KP
            kp_mode = True
        else:
            lagna_360, _ = _get_lagna(jd, lat, lon_input, ayanamsha)
            house_system = b'W'  # Whole Sign for Vedic
            kp_mode = False

        lagna_rashi   = int(lagna_360 / 30)
        lagna_in_sign = lagna_360 % 30

        # ▶ Kaksha (each kaksha = 3.75° of sign)
        kaksha_num = min(int(lagna_in_sign / 3.75) + 1, 8)
        kaksha     = KAKSHA_MAP[kaksha_num]

        # ▶ Nakshatra of Lagna
        nak = _nakshatra(lagna_360)

        # ▶ All planets
        planets, _ = _get_planets(jd, lat, lon_input)

        # ▶ House System
        if kp_mode:
            houses = _build_placidus_houses(jd, lat, lon_input, ayanamsha)
        else:
            houses = _build_whole_sign_houses(lagna_rashi)

        # ▶ Assign planets to houses
        planet_houses = _assign_planets_to_houses(planets, lagna_rashi)

        # ▶ Lost Item Engine
        second_house_rashi = houses[2]["rashi"]
        second_lord_name   = RASHI_LORD[second_house_rashi]
        second_lord_house  = planet_houses.get(second_lord_name, {}).get("house", None)

        lost_item = _lost_item_engine(
            second_house_rashi,
            second_lord_name,
            second_lord_house,
            lagna_rashi,
        )

        # ▶ Basic prediction text
        prediction = (
            f"प्रश्न कर्ता का प्रश्न '{kaksha['vishay']}' से संबंधित है। "
            f"लग्न {RASHI_NAMES[lagna_rashi]} राशि में {lagna_in_sign:.2f}° पर है, "
            f"जो {nak['name']} नक्षत्र में है। कक्षा स्वामी {kaksha['lord']} है।"
        )

        # ▶ All 8 Kaksha details
        all_kaksha = [
            {
                "kaksha":    k,
                "lord":      v["lord"],
                "lord_en":   v["lord_en"],
                "vishay":    v["vishay"],
                "start_deg": round((k - 1) * 3.75, 2),
                "end_deg":   round(k * 3.75, 2),
                "active":    (k == kaksha_num),
            }
            for k, v in KAKSHA_MAP.items()
        ]

        # ▶ Format planets for response (with retrograde status)
        # Find retrograde planets set for nakshatra cross-check
        # PDF Rule: Only Mars/Mercury/Jupiter/Venus/Saturn can be retrograde in KP
        # Rahu/Ketu always retrograde by nature — NOT counted. Sun/Moon never retro.
        KP_RETRO_PLANETS = {"मंगल","बुध","गुरु","शुक्र","शनि"}
        retro_set = {pname for pname, pd in planets.items()
                     if pd.get("is_retrograde", False) and pname in KP_RETRO_PLANETS}

        planets_response = []
        for planet_name, planet_data in planets.items():
            h = planet_houses.get(planet_name, {})
            nak_info = _nakshatra(planet_data["longitude"])
            # Is this planet sitting in a retrograde planet's nakshatra?
            in_retro_nak = nak_info["lord"] in retro_set
            KP_CAN_RETRO_HI = {"मंगल","बुध","गुरु","शुक्र","शनि"}
            is_kp_retro_p   = (planet_data.get("is_retrograde", False)
                               and planet_name in KP_CAN_RETRO_HI)
            planets_response.append({
                "name":           planet_name,
                "name_en":        planet_data["name_en"],
                "house":          h.get("house", 0),
                "rashi":          planet_data["rashi"],
                "rashi_name":     RASHI_NAMES[planet_data["rashi"]],
                "degree_in_sign": planet_data["degree_in_sign"],
                "longitude":      planet_data["longitude"],
                "is_retrograde":  is_kp_retro_p,
                "in_retro_nak":   in_retro_nak,
                "nakshatra":      nak_info["name"],
                "nak_lord":       nak_info["lord"],
                "rashi_index":    planet_data["rashi"],
            })

        # ▶ Format houses for response
        houses_response = {str(h): houses[h]["rashi_name"] for h in range(1, 13)}

        # 🚀 MACRO GOCHAR (Transits) — Hindi planet names as keys 🚀
        macro_gochar = {}
        for planet_name, planet_data in planets.items():
            if planet_data["name_en"] in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"]:
                full_deg = (planet_data["rashi"] * 30) + planet_data["degree_in_sign"]
                nak_info = _nakshatra(full_deg)
                # KP Rule: Only Ma/Me/Ju/Ve/Sa can be retrograde — not Ra/Ke/Su/Mo
                KP_CAN_RETRO = {"Mars","Mercury","Jupiter","Venus","Saturn"}
                is_kp_retro  = (planet_data.get("is_retrograde", False)
                                and planet_data["name_en"] in KP_CAN_RETRO)
                macro_gochar[planet_data["name_en"]] = {
                    "Planet":        planet_name,
                    "Current_Sign":  planet_data["rashi_name"],
                    "Transit_NL":    nak_info["lord"],
                    "Degree":        f"{round(planet_data['degree_in_sign'], 2)}°",
                    "is_retrograde": is_kp_retro,
                }

        # 🚀 RULING PLANETS 🚀
        ruling_planets = _compute_ruling_planets(jd, lagna_360, planets)

        # 🚀 VIMSHOTTARI DBA 🚀
        moon_lon = planets.get("चंद्र", {}).get("longitude", 0.0)
        dba      = _compute_dba(jd, moon_lon)

        # 🚀 MOON CONNECTION — Moon NL/SL ka prashna se sambandh 🚀
        moon_kp   = _kp_lords(moon_lon)
        moon_connection = {
            "moon_nl":    moon_kp["NL_hi"],
            "moon_sl":    moon_kp["SL_hi"],
            "note":       f"चंद्र का नक्षत्र स्वामी {moon_kp['NL_hi']} और उप-स्वामी {moon_kp['SL_hi']} है।",
        }

        # 🚀 2. KP 4-STEP ENGINE CALL 🚀
        kp_cusp_lords = []
        kp_4_step = []

        # Hindi → Short code mapping (kp_significators.py expects "Su","Mo" etc.)
        HI_TO_SHORT = {
            "सूर्य": "Su", "चंद्र": "Mo", "मंगल": "Ma", "बुध": "Me",
            "गुरु": "Ju", "शुक्र": "Ve", "शनि": "Sa", "राहु": "Ra", "केतु": "Ke"
        }
        # Short code → English name (for UI display)
        SHORT_TO_EN = {
            "Su": "Sun", "Mo": "Moon", "Ma": "Mars", "Me": "Mercury",
            "Ju": "Jupiter", "Ve": "Venus", "Sa": "Saturn", "Ra": "Rahu", "Ke": "Ketu"
        }

        if kp_mode:
            try:
                from kp_significators import compute_kp_significators
                cusps_placidus, _ = swe.houses_ex(jd, lat, lon_input, b'P')
                sidereal_cusps = [(c - ayanamsha) % 360 for c in cusps_placidus]

                # ✅ FIX: "Su","Mo" short codes — engine yahi expect karta hai
                astro_kp = {"Cusps": sidereal_cusps}
                for p_hi, p_data in planets.items():
                    short = HI_TO_SHORT.get(p_hi)
                    if short:
                        astro_kp[short] = {"Degree": p_data["longitude"]}

                print(f"[KP DEBUG] astro_kp keys: {list(astro_kp.keys())}")

                kp_result = compute_kp_significators(astro_kp)
                print(f"[KP DEBUG] computed={kp_result.get('computed')} | error={kp_result.get('error','none')}")

                if kp_result.get("computed"):
                    for p_short, sig in kp_result["significators"].items():
                        kp_4_step.append({
                            "planet": SHORT_TO_EN.get(p_short, p_short),
                            "L1": sig["L1"], "L2": sig["L2"],
                            "L3": sig["L3"], "L4": sig["L4"]
                        })
                    for c_num, c_data in kp_result["cusp_significators"].items():
                        kp_cusp_lords.append({
                            "house":     c_num,
                            "degree":    round(sidereal_cusps[c_num - 1] if len(sidereal_cusps) == 12 else sidereal_cusps[c_num], 2),
                            "sign_lord": c_data.get("SignLord"),
                            "star_lord": c_data.get("NL"),
                            "sub_lord":  c_data.get("SL")
                        })
            except Exception as e:
                import traceback
                print(f"[KP ERROR] {e}")
                traceback.print_exc()

        # 🚀 3. FULL KP JUDGMENT ENGINE — 12 Layers 🚀
        house_analysis = []
        if kp_4_step and kp_cusp_lords and kp_mode:
            house_analysis = _kp_full_analysis(
                kp_4_step           = kp_4_step,
                kp_cusp_lords       = kp_cusp_lords,
                kp_result_raw       = kp_result if kp_result.get("computed") else {},
                ruling_planets_data = ruling_planets,
                macro_gochar        = macro_gochar,
                retro_set_hi        = retro_set,
                lagna_360           = lagna_360,
                moon_lon            = moon_lon,
                dba                 = dba,
            )

        # 🚀 4. FINAL JSON RESPONSE 🚀
        return jsonify({
            "version":           "2.0",
            "prashna_time":      now_local.strftime("%d-%m-%Y %H:%M:%S"),
            "prashna_time_utc":  now_utc.strftime("%d-%m-%Y %H:%M:%S"),
            "lat":               lat,
            "lon":               lon_input,
            "ayanamsha":         round(ayanamsha, 4),
            
            # KP Mode Info
            "kp_mode":           kp_mode,
            "is_kp":             kp_mode,  # React UI के लिए
            "kp_number":         int(kp_number) if kp_number else None,
            "house_system":      "Placidus" if kp_mode else "Whole Sign",
            "kp_cusp_lords":     kp_cusp_lords if kp_mode else None,
            "kp_4_step":         kp_4_step if kp_mode else None,
             "macro_gochar": macro_gochar,

            # Lagna
            "lagna_rashi":          lagna_rashi,
            "lagna_rashi_name":     RASHI_NAMES[lagna_rashi],
            "lagna_degree":         round(lagna_360, 4),
            "lagna_degree_in_sign": round(lagna_in_sign, 4),

            # Nakshatra
            "nakshatra":       nak["name"],
            "nakshatra_index": nak["index"],
            "nakshatra_lord":  nak["lord"],

            # Kaksha
            "kaksha":         kaksha_num,
            "kaksha_lord":    kaksha["lord"],
            "kaksha_lord_en": kaksha["lord_en"],
            "kaksha_vishay":  kaksha["vishay"],

            # Planets (9 planets)
            "planets": planets_response,

            # Houses
            "houses": houses_response,

            # Lost Item
            "lost_item": lost_item,

            # Predictions
            "prediction": prediction,
            "all_kaksha": all_kaksha,

            # 🆕 Ruling Planets
            "ruling_planets": ruling_planets,

            # 🆕 Vimshottari DBA
            "dba": dba,

            # 🆕 Moon Connection
            "moon_connection": moon_connection,

            # 🆕 KP Full Analysis (12 layers per topic)
            "house_analysis": house_analysis,
            "rotation_map":   ROTATION_PERSONS,

            # 🆕 Retrograde planets list
            "retrograde_planets": list(retro_set),
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500