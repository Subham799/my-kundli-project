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
from datetime import datetime, timedelta

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
        result = swe.calc_ut(jd, swe_id)
        # swe.calc_ut returns (lon, lat, dist, ...) or a tuple
        tropical_lon = result[0] if isinstance(result[0], float) else result[0][0]

        # ✅ FIX 3: ONE-TIME ayanamsha subtraction (tropical → sidereal)
        sidereal_lon = _normalize_lon(tropical_lon - ayanamsha)

        rashi          = int(sidereal_lon / 30)
        degree_in_sign = sidereal_lon % 30

        planets[name_hi] = {
            "name_hi":       name_hi,
            "name_en":       name_en,
            "longitude":     round(sidereal_lon, 4),
            "rashi":         rashi,
            "rashi_name":    RASHI_NAMES[rashi],
            "rashi_name_en": RASHI_NAMES_EN[rashi],
            "degree_in_sign": round(degree_in_sign, 4),
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

        # ✅ FIX 1: Precise UTC time with correct hour_decimal
        now_utc = datetime.utcnow()
        hour_decimal = (
            now_utc.hour +
            now_utc.minute / 60.0 +
            now_utc.second / 3600.0
        )

        # Julian Day (always UTC)
        jd = swe.julday(now_utc.year, now_utc.month, now_utc.day, hour_decimal)

        now_local = now_utc + timedelta(hours=tz_offset)

        # ▶ Ayanamsha (calculated once, passed to all helpers)
        ayanamsha = swe.get_ayanamsa(jd)

        # ▶ Lagna (sidereal, FIX 3 + FIX 5)
        lagna_360, _ = _get_lagna(jd, lat, lon_input, ayanamsha)
        lagna_rashi   = int(lagna_360 / 30)
        lagna_in_sign = lagna_360 % 30

        # ▶ Kaksha (each kaksha = 3.75° of sign)
        kaksha_num = min(int(lagna_in_sign / 3.75) + 1, 8)
        kaksha     = KAKSHA_MAP[kaksha_num]

        # ▶ Nakshatra of Lagna
        nak = _nakshatra(lagna_360)

        # ▶ All planets (FIX 2: Ketu included; FIX 3: single ayanamsha subtraction)
        planets, _ = _get_planets(jd, lat, lon_input)

        # ▶ Pure Whole Sign houses (FIX 5)
        houses = _build_whole_sign_houses(lagna_rashi)

        # ▶ Assign planets to houses
        planet_houses = _assign_planets_to_houses(planets, lagna_rashi)

        # ▶ Lost Item Engine (FIX 4: safe .get())
        second_house_rashi = houses[2]["rashi"]
        second_lord_name   = RASHI_LORD[second_house_rashi]
        second_lord_house  = planet_houses.get(second_lord_name, {}).get("house", None)  # ✅ FIX 4

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

        # ▶ Format planets for response
        planets_response = []
        for planet_name, planet_data in planets.items():
            h = planet_houses.get(planet_name, {})
            planets_response.append({
                "name":           planet_name,
                "name_en":        planet_data["name_en"],
                "house":          h.get("house", 0),
                "rashi":          planet_data["rashi"],
                "rashi_name":     RASHI_NAMES[planet_data["rashi"]],
                "degree_in_sign": planet_data["degree_in_sign"],
            })

        # ▶ Format houses for response
        houses_response = {str(h): houses[h]["rashi_name"] for h in range(1, 13)}

        return jsonify({
            "version":           "2.0",
            "prashna_time":      now_local.strftime("%d-%m-%Y %H:%M:%S"),
            "prashna_time_utc":  now_utc.strftime("%d-%m-%Y %H:%M:%S"),
            "lat":               lat,
            "lon":               lon_input,
            "ayanamsha":         round(ayanamsha, 4),

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

            # Planets (9 planets: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
            "planets": planets_response,

            # Houses (Pure Whole Sign)
            "houses": houses_response,

            # Lost Item
            "lost_item": lost_item,

            # Predictions
            "prediction": prediction,
            "all_kaksha": all_kaksha,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500