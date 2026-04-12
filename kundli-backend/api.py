# ═══════════════════════════════════════════════════════════════════════════
#  नादी ज्योतिष — PURE JSON REST API
#  Original app.py logic 100% preserved (lines 1–2443 untouched).
#  Only change: render_template_string → jsonify
#  Frontend: React (Vite + Zustand + Framer Motion)
# ═══════════════════════════════════════════════════════════════════════════

from flask import Flask, request, jsonify
from flask_cors import CORS
import swisseph as swe
from datetime import datetime, timedelta
import requests as http_requests
import os

# ── Nadi AI imports (unchanged from original) ──────────────────────────────
from nadi_ai.core.interpretation_builder import build_interpretation
from nadi_ai.core.house_diagnostic_engine import HouseDiagnosticEngine
import nadi_master
try:
    from nadi_jyotish_engine import full_nadi_analysis as run_nadi_jyotish
    _NADI_JYOTISH_AVAILABLE = True
except ImportError:
    _NADI_JYOTISH_AVAILABLE = False
from nadi_ai.engine.aggregator import NadiAggregator
from nadi_ai.engine.weight_engine import WeightEngine
from nadi_ai.core.dignity_engine import DignityEngine
from nadi_ai.core.dasha_engine import DashaEngine
from nadi_ai.core.nakshatra_engine import NakshatraEngine
from nadi_ai.core.tara_milan_engine import TaraMilanEngine
from nadi_ai.core.ashtakavarga_engine import AshtakavargaEngine
from nadi_ai.events.career_module import CareerModule
from chalit_engine import get_bhav_chalit
from sudarshan_engine import get_sudarshan_data
from yearly_engine import get_yearly_prediction
from maitri_engine import compute_maitri


# ── Sunrise calculator ────────────────────────────────────────────────────
def _calc_sunrise(dt, lat, lon, tz_offset=5.5):
    """DOB ka Swiss Ephemeris sunrise. Returns HH:MM string ya None."""
    try:
        from datetime import timedelta
        birth_utc = dt - timedelta(hours=tz_offset)
        jd_utc = swe.julday(
            birth_utc.year, birth_utc.month, birth_utc.day,
            birth_utc.hour + birth_utc.minute / 60.0
        )
        geopos = (float(lon), float(lat), 0.0)
        rsmi   = swe.CALC_RISE | swe.BIT_DISC_CENTER
        res    = swe.rise_trans(jd_utc, swe.SUN, rsmi, geopos, 0.0, 0.0, swe.FLG_SWIEPH)
        sunrise_jd = res[1][0]
        if jd_utc < sunrise_jd:
            res = swe.rise_trans(jd_utc - 1.0, swe.SUN, rsmi, geopos, 0.0, 0.0, swe.FLG_SWIEPH)
            sunrise_jd = res[1][0]
        _, _, _, utc_h = swe.revjul(sunrise_jd)
        local_h = (utc_h + tz_offset) % 24
        h = int(local_h)
        m = round((local_h - h) * 60)
        if m == 60: h += 1; m = 0
        result = f"{h:02d}:{m:02d}"
        print(f"[Sunrise] ✅ {result}")
        return result
    except Exception as e:
        print(f"[Sunrise] Error: {e}")
        return None

app = Flask(__name__)
app.secret_key = "kundli_super_secret_key_123"
from prashna_route import prashna_bp
app.register_blueprint(prashna_bp)

# यहाँ हमने kundalimaker.com को लिस्ट में जोड़ दिया है
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",
    r"https://.*\.vercel\.app",  # Any Vercel deployment
    "https://kundalimaker.com",       # 👉 तुम्हारा नया डोमेन (बिना www के)
    "https://www.kundalimaker.com",   # 👉 तुम्हारा नया डोमेन (www के साथ)
    os.environ.get("FRONTEND_URL", ""),  # Custom domain from env
], supports_credentials=False)

# ═══════════════════════════════════════════════════════════════════════════
# ██  SECTION 1 — ALL CONSTANTS  (100% original, zero changes)
# ═══════════════════════════════════════════════════════════════════════════

RASHI = ["मेष (1)", "वृषभ (2)", "मिथुन (3)", "कर्क (4)", "सिंह (5)", "कन्या (6)",
         "तुला (7)", "वृश्चिक (8)", "धनु (9)", "मकर (10)", "कुंभ (11)", "मीन (12)"]

NAKSHATRA = ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु",
             "पुष्य", "आश्लेषा", "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी", "हस्त",
             "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा",
             "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्व भाद्रपद",
             "उत्तर भाद्रपद", "रेवती"]

AVAILABLE_CHARTS = {
    "D1": "D1 (लग्न)", "D2": "D2 (होरा)", "D3": "D3 (द्रेष्काण)", "D4": "D4 (चतुर्थांश)",
    "D7": "D7 (सप्तांश)", "D9": "D9 (नवांश)", "D10": "D10 (दशांश)", "D12": "D12 (द्वादशांश)",
    "D16": "D16 (षोडशांश)", "D20": "D20 (विंशांश)", "D24": "D24 (चतुर्विंशांश)",
    "D27": "D27 (सप्तविंशांश)", "D30": "D30 (त्रिंशांश)", "D40": "D40 (खवेदांश)",
    "D45": "D45 (अक्षवेदांश)", "D60": "D60 (षष्ट्यंश)"
}

DASHA_LORDS = ["केतु", "शुक्र", "सूर्य", "चंद्र", "मंगल", "राहु", "गुरु", "शनि", "बुध"]
DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]

AV_RULES = {
    "Su": {"Su":[1,2,4,7,8,9,10,11],"Mo":[3,6,10,11],"Ma":[1,2,4,7,8,9,10,11],"Me":[3,5,6,9,10,11,12],"Ju":[5,6,9,11],"Ve":[6,7,12],"Sa":[1,2,4,7,8,9,10,11],"La":[3,4,6,10,11,12]},
    "Mo": {"Su":[3,6,7,8,10,11],"Mo":[1,3,6,7,10,11],"Ma":[2,3,5,6,9,10,11],"Me":[1,3,4,5,7,8,10,11],"Ju":[1,4,7,8,10,11,12],"Ve":[3,4,5,7,9,10,11],"Sa":[3,5,6,11],"La":[3,6,10,11]},
    "Ma": {"Su":[3,5,6,10,11],"Mo":[3,6,11],"Ma":[1,2,4,7,8,10,11],"Me":[3,5,6,11],"Ju":[6,10,11,12],"Ve":[6,8,11,12],"Sa":[1,4,7,8,9,10,11],"La":[1,3,6,10,11]},
    "Me": {"Su":[5,6,9,11,12],"Mo":[2,4,6,8,10,11],"Ma":[1,2,4,7,8,9,10,11],"Me":[1,3,5,6,9,10,11,12],"Ju":[6,8,11,12],"Ve":[1,2,3,4,5,8,9,11],"Sa":[1,2,4,7,8,9,10,11],"La":[1,2,4,6,8,10,11]},
    "Ju": {"Su":[1,2,3,4,7,8,9,10,11],"Mo":[2,5,7,9,11],"Ma":[1,2,4,7,8,10,11],"Me":[1,2,4,5,6,9,10,11],"Ju":[1,2,3,4,7,8,10,11],"Ve":[2,5,6,9,10,11],"Sa":[3,5,6,12],"La":[1,2,4,5,6,9,10,11]},
    "Ve": {"Su":[8,11,12],"Mo":[1,2,3,4,5,8,9,11,12],"Ma":[3,5,6,9,11,12],"Me":[3,5,6,9,11],"Ju":[5,8,9,10,11],"Ve":[1,2,3,4,5,8,9,10,11],"Sa":[3,4,5,8,9,10,11],"La":[1,2,3,4,5,8,9,11]},
    "Sa": {"Su":[1,2,4,7,8,10,11],"Mo":[3,6,11],"Ma":[3,5,6,10,11],"Me":[6,8,9,10,11,12],"Ju":[5,6,11,12],"Ve":[6,11,12],"Sa":[3,5,6,11],"La":[1,3,4,6,10,11]}
}

SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]

RELATIONSHIPS = {
    "Su": {"Friends":["Mo","Ma","Ju"],"Enemies":["Ve","Sa"],"Neutral":["Me"]},
    "Mo": {"Friends":["Su","Me"],"Enemies":[],"Neutral":["Ma","Ju","Ve","Sa"]},
    "Ma": {"Friends":["Su","Mo","Ju"],"Enemies":["Me"],"Neutral":["Ve","Sa"]},
    "Me": {"Friends":["Su","Ve"],"Enemies":["Mo"],"Neutral":["Ma","Ju","Sa"]},
    "Ju": {"Friends":["Su","Mo","Ma"],"Enemies":["Me","Ve"],"Neutral":["Sa"]},
    "Ve": {"Friends":["Me","Sa"],"Enemies":["Su","Mo"],"Neutral":["Ma","Ju"]},
    "Sa": {"Friends":["Me","Ve"],"Enemies":["Su","Mo","Ma"],"Neutral":["Ju"]},
    "Ra": {"Friends":["Ve","Sa","Me"],"Enemies":["Su","Mo","Ma"],"Neutral":["Ju"]},
    "Ke": {"Friends":["Ma","Ju"],"Enemies":["Su","Mo"],"Neutral":["Ve","Sa","Me"]},
}

DIGNITY_SIGNS = {
    "Su": {"Uchcha":0,"Neecha":6,"Swa":[4]},
    "Mo": {"Uchcha":1,"Neecha":7,"Swa":[3]},
    "Ma": {"Uchcha":9,"Neecha":3,"Swa":[0,7]},
    "Me": {"Uchcha":5,"Neecha":11,"Swa":[2,5]},
    "Ju": {"Uchcha":3,"Neecha":9,"Swa":[8,11]},
    "Ve": {"Uchcha":11,"Neecha":5,"Swa":[1,6]},
    "Sa": {"Uchcha":6,"Neecha":0,"Swa":[9,10]},
    "Ra": {"Uchcha":1,"Neecha":7,"Swa":[]},
    "Ke": {"Uchcha":7,"Neecha":1,"Swa":[]}
}

HOUSE_KARAKAS = {
    1:["Su"],2:["Ju"],3:["Ma"],4:["Mo","Ve"],5:["Ju"],
    6:["Ma","Sa"],7:["Ve"],8:["Sa"],9:["Ju"],
    10:["Su","Me","Ju","Sa"],11:["Ju"],12:["Sa"]
}

DIGBALA_HOUSES = {"Su":10,"Mo":4,"Ma":10,"Me":1,"Ju":1,"Ve":4,"Sa":7}

MOOLATRIKONA = {"Su":4,"Mo":1,"Ma":0,"Me":5,"Ju":8,"Ve":6,"Sa":10,"Ra":None,"Ke":None}


# ═══════════════════════════════════════════════════════════════════════════
# ██  SECTION 2 — ALL HELPER FUNCTIONS  (100% original, zero changes)
#     Copy-pasted verbatim from app.py lines 119–2443
# ═══════════════════════════════════════════════════════════════════════════

def get_house_categories(house):
    categories = []
    if house in [1,4,7,10]: categories.append("केंद्र")
    if house in [1,5,9]:    categories.append("त्रिकोण")
    if house in [6,8,12]:   categories.append("त्रिक")
    if house in [2,7]:      categories.append("मारक")
    if house in [3,6,10,11]:categories.append("उपचय")
    if house in [2,5,8,11]: categories.append("पणफर")
    if house in [3,6,9,12]: categories.append("आपोक्लिम")
    if house in [3,6,11]:   categories.append("त्रिशडाय")
    return categories

def get_house_category(house):
    cats = get_house_categories(house)
    return ", ".join(cats) if cats else "सामान्य"

def get_badhak_house(lagna_sign_idx):
    movable = [0,3,6,9]; fixed = [1,4,7,10]; dual = [2,5,8,11]
    if lagna_sign_idx in movable: return 11
    elif lagna_sign_idx in fixed: return 9
    else: return 7

def get_house_lordships(planet_code):
    return [idx for idx, lord in enumerate(SIGN_LORDS) if lord == planet_code]

def get_nakshatra_lord(degree):
    nak_idx = int(degree / (360/27))
    nak_lords = ["Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me"]
    return nak_lords[nak_idx % 9]

def calculate_functional_nature(planet_code, lagna_sign_idx):
    result = {
        'benefic':False,'malefic':False,'maraka':False,'yogakaraka':False,
        'kendradhipati':False,'trishadaya_lord':False,'badhakesh':False,
        'neutral':False,'doshas':[],'reason':[]
    }
    sign_lordships  = get_house_lordships(planet_code)
    house_lordships = [((s - lagna_sign_idx) % 12) + 1 for s in sign_lordships]
    badhak_house    = get_badhak_house(lagna_sign_idx)

    is_lagnesh      = (1 in house_lordships)
    kendra_lord     = any(h in [1,4,7,10] for h in house_lordships)
    trikon_lord     = any(h in [1,5,9]    for h in house_lordships)
    dusthana_lord   = any(h in [6,8,12]   for h in house_lordships)
    maraka_lord     = any(h in [2,7]      for h in house_lordships)
    trishadaya_lord = any(h in [3,6,11]   for h in house_lordships)
    badhakesh       = (badhak_house in house_lordships)

    if is_lagnesh:
        result['benefic'] = True
        result['reason'].append("लग्नेश (सदा शुभ — 8/12 दोष नहीं लगता)")
        if dusthana_lord and not any(h == 6 for h in house_lordships):
            dusthana_lord = False
        elif dusthana_lord and any(h == 6 for h in house_lordships):
            dusthana_lord = True

    elif trikon_lord and any(h in [8,12] for h in house_lordships) and not any(h == 6 for h in house_lordships):
        mt_sign = MOOLATRIKONA.get(planet_code)
        if mt_sign is not None:
            mt_house = ((mt_sign - lagna_sign_idx) % 12) + 1
            if mt_house in [5,9]:
                dusthana_lord = False
                result['benefic'] = True
                result['reason'].append(f"मूलत्रिकोण बल (मूलत्रिकोण {mt_house}वें त्रिकोण में — 8/12 दोष निरस्त)")

    if kendra_lord and trikon_lord and not is_lagnesh:
        result['yogakaraka'] = True; result['benefic'] = True
        result['reason'].append("योगकारक (केंद्र+त्रिकोण स्वामी)")

    if trikon_lord and not result['yogakaraka'] and not is_lagnesh:
        if not result['benefic']: result['benefic'] = True
        if "मूलत्रिकोण" not in result['reason'] and "लग्नेश" not in result['reason']:
            result['reason'].append("शुभ (त्रिकोण स्वामी)")

    if dusthana_lord:
        result['malefic'] = True; result['reason'].append("अशुभ (त्रिक स्वामी: 6/8/12)")
    if trishadaya_lord:
        result['trishadaya_lord'] = True; result['doshas'].append("त्रिशडाय")
        if not dusthana_lord:
            result['malefic'] = True; result['reason'].append("सूक्ष्म अशुभ (त्रिशडाय: 3/6/11)")
    if maraka_lord:
        result['maraka'] = True; result['doshas'].append("मारक")
        result['reason'].append("मारक (2/7 स्वामी)")
    if badhakesh:
        result['badhakesh'] = True; result['doshas'].append("बाधकेश")
        result['malefic'] = True; result['reason'].append(f"बाधकेश ({badhak_house}वें का स्वामी)")

    kendradhipati_eligible = ["Ju","Ve","Me"]
    all_owned_are_kendra   = all(h in [1,4,7,10] for h in house_lordships)
    pure_kendra_only = (kendra_lord and all_owned_are_kendra
                        and not trishadaya_lord and not badhakesh and not is_lagnesh)
    if planet_code in kendradhipati_eligible and pure_kendra_only:
        result['kendradhipati'] = True; result['doshas'].append("केंद्राधिपति")
        result['reason'].append("केंद्राधिपति दोष (शुभ ग्रह — केवल केंद्र स्वामी)")

    has_any_malefic_tag = (result['malefic'] or result['trishadaya_lord']
                           or result['badhakesh'] or result['maraka'])
    kendra_neutral_ok = (kendra_lord and not result['yogakaraka'] and not is_lagnesh
                         and not has_any_malefic_tag and not result['kendradhipati'])
    if kendra_neutral_ok:
        result['neutral'] = True; result['reason'].append("तटस्थ (केवल केंद्र स्वामी)")

    if planet_code == "Ma":
        result['manglik_pending'] = True
        result['manglik'] = False
        result['manglik_house'] = None
        result['manglik_cancellations'] = []

    result['reason']          = " | ".join(result['reason']) if result['reason'] else "सामान्य"
    result['house_lordships'] = house_lordships
    return result

def calculate_prabal_maraka(lagna_sign_idx):
    planet_count = {}
    extended_bad = [2,3,6,7,8,11,12]
    for planet in ["Su","Mo","Ma","Me","Ju","Ve","Sa"]:
        sign_lordships  = get_house_lordships(planet)
        house_lordships = [((s - lagna_sign_idx) % 12) + 1 for s in sign_lordships]
        is_primary  = (2 in house_lordships and 7 in house_lordships)
        bad_count   = sum(1 for h in house_lordships if h in extended_bad)
        is_secondary= (bad_count >= 2 and not is_primary)
        if is_primary or is_secondary:
            planet_count[planet] = {
                'count':   bad_count,
                'houses':  [h for h in house_lordships if h in extended_bad],
                'primary': is_primary,
                'label':   f"{'2+7 प्रधान मारक' if is_primary else 'द्विगुण अशुभ'} ({','.join(str(h) for h in house_lordships if h in extended_bad)})"
            }
    return planet_count

def check_neechabhanga(planet_code, sign_idx, houses, all_planets_data, lagna_sign_idx):
    kendra = [1,4,7,10]
    short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    exalting_planet = None
    for p, signs in DIGNITY_SIGNS.items():
        if signs.get("Uchcha") == sign_idx and p != planet_code:
            exalting_planet = p; break
    sign_lord = SIGN_LORDS[sign_idx]
    if sign_lord in all_planets_data:
        for h, hd in houses.items():
            sl_short = short_names.get(sign_lord, "")
            if sl_short in hd.get("planets","").split(", "):
                if h in kendra: return True
    if exalting_planet:
        for h, hd in houses.items():
            ex_short = short_names.get(exalting_planet, "")
            if ex_short in hd.get("planets","").split(", "):
                if h in kendra: return True
    return False

def check_vipreet_rajyoga(planet_code, house_lordships, planet_house):
    trik_lord = any(h in [6,8,12] for h in house_lordships)
    return trik_lord and planet_house in [6,8,12]

def check_parivartan(planet_code, sign_idx, astro_data, lagna_sign_idx):
    dispositor = SIGN_LORDS[sign_idx]
    if dispositor == planet_code: return None
    if dispositor not in astro_data: return None
    disp_sign    = astro_data[dispositor]["Vargas"]["D1"]["Idx"]
    planet_signs = [i for i, lord in enumerate(SIGN_LORDS) if lord == planet_code]
    return dispositor if disp_sign in planet_signs else None

def evaluate_planet_strength(planet_code, planet_data, houses, lagna_sign_idx, all_planets_data=None):
    strength_score = 50
    weakness_factors = []; strength_factors = []; special_yogas = []

    sign_idx = planet_data["Vargas"]["D1"]["Idx"]
    degree   = planet_data["Degree"]
    short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    planet_house = next((h for h, hd in houses.items()
                         if short_names.get(planet_code,"") in hd.get("planets","").split(", ")), None)

    sign_lordships  = get_house_lordships(planet_code)
    house_lordships = [((s - lagna_sign_idx) % 12) + 1 for s in sign_lordships]
    is_lagnesh = (1 in house_lordships)

    if is_lagnesh:
        strength_score += 15; strength_factors.append("लग्नेश (+15)")
    if 9 in house_lordships:
        strength_score += 20; strength_factors.append("9वें का स्वामी (+20)")
    if 5 in house_lordships:
        strength_score += 15; strength_factors.append("5वें का स्वामी (+15)")
    if any(h in [4,7,10] for h in house_lordships):
        strength_score += 5; strength_factors.append("केंद्र स्वामी (+5)")

    for dh in [h for h in house_lordships if h in [6,8,12]]:
        if dh == 6:   strength_score -= 15; weakness_factors.append("6वें का स्वामी (-15)")
        elif dh == 8  and not is_lagnesh: strength_score -= 20; weakness_factors.append("8वें का स्वामी (-20)")
        elif dh == 12 and not is_lagnesh: strength_score -= 10; weakness_factors.append("12वें का स्वामी (-10)")

    if any(h in [2,7] for h in house_lordships):
        strength_score -= 20; weakness_factors.append("मारक (2/7) (-20)")

    badhak_house = get_badhak_house(lagna_sign_idx)
    if badhak_house in house_lordships:
        strength_score -= 15; weakness_factors.append(f"बाधकेश ({badhak_house}वें) (-15)")

    kendra_lord = any(h in [1,4,7,10] for h in house_lordships)
    trikon_lord = any(h in [1,5,9]    for h in house_lordships)
    if kendra_lord and trikon_lord and not is_lagnesh:
        strength_score += 25; strength_factors.append("योगकारक (+25)")

    dignity_data = DIGNITY_SIGNS.get(planet_code, {})
    is_neecha    = (sign_idx == dignity_data.get("Neecha"))

    if sign_idx == dignity_data.get("Uchcha"):
        strength_score += 25; strength_factors.append("उच्च राशि (+25)")
    elif sign_idx == MOOLATRIKONA.get(planet_code) and MOOLATRIKONA.get(planet_code) is not None:
        strength_score += 22; strength_factors.append("मूलत्रिकोण राशि (+22)")
    elif sign_idx in dignity_data.get("Swa", []):
        strength_score += 20; strength_factors.append("स्व राशि (+20)")
    elif is_neecha:
        strength_score -= 25; weakness_factors.append("नीच राशि (-25)")
    else:
        sign_lord = SIGN_LORDS[sign_idx]
        if planet_code in RELATIONSHIPS and planet_code != sign_lord:
            if sign_lord in RELATIONSHIPS[planet_code]["Friends"]:
                strength_score += 10; strength_factors.append("मित्र राशि (+10)")
            elif sign_lord in RELATIONSHIPS[planet_code]["Enemies"]:
                strength_score -= 10; weakness_factors.append("शत्रु राशि (-10)")

    if planet_house:
        if planet_house in [5,9]:      strength_score += 15; strength_factors.append(f"त्रिकोण ({planet_house}वें) (+15)")
        elif planet_house == 1:        strength_score += 12; strength_factors.append("लग्न में (+12)")
        elif planet_house in [4,7,10]: strength_score += 10; strength_factors.append(f"केंद्र ({planet_house}वें) (+10)")
        elif planet_house in [3,6,11]: strength_score += 5;  strength_factors.append(f"उपचय ({planet_house}वें) (+5)")
        elif planet_house == 8:        strength_score -= 20; weakness_factors.append("8वें भाव में (-20)")
        elif planet_house in [6,12]:   strength_score -= 15; weakness_factors.append(f"त्रिक ({planet_house}वें) (-15)")

    sign_degree = degree % 30
    if sign_degree < 3:   special_yogas.append(f"प्रवेश-द्वार (0–3°) — फल विलंबित पर सक्रिय")
    elif sign_degree > 27: special_yogas.append(f"संधि (27–30°) — दो राशियों का प्रभाव")

    digbala_house = DIGBALA_HOUSES.get(planet_code)
    if digbala_house and planet_house == digbala_house:
        strength_score += 10; strength_factors.append(f"दिग्बल ({planet_house}वें) (+10)")
    elif digbala_house and planet_house == ((digbala_house + 5) % 12 + 1):
        strength_score -= 10; weakness_factors.append("दिग्बल विपरीत (-10)")

    if all_planets_data and "Su" in all_planets_data and planet_code != "Su":
        sun_degree = all_planets_data["Su"]["Degree"]
        combust_orbs = {"Mo":12,"Ma":17,"Me":14,"Ju":11,"Ve":10,"Sa":15}
        orb  = combust_orbs.get(planet_code, 12)
        diff = abs(degree - sun_degree)
        if diff > 180: diff = 360 - diff
        if diff <= orb:
            strength_score -= 20
            weakness_factors.append(f"अस्त/दग्ध ({round(diff,1)}° सूर्य से) — बाहरी फल कम (-20)")
            special_yogas.append("अस्त (Bulb Theory — आंतरिक शक्ति सक्रिय)")

    if planet_data.get("Retrograde", False):
        if planet_house in [6,8,12]: strength_score -= 15; weakness_factors.append("वक्री + त्रिक (-15)")
        else:                        strength_score += 5;   strength_factors.append("वक्री (आंतरिक शक्ति +5)")

    if all_planets_data:
        nak_lord_code = get_nakshatra_lord(degree)
        if nak_lord_code in all_planets_data:
            nak_lord_data  = all_planets_data[nak_lord_code]
            nak_sign_idx   = nak_lord_data["Vargas"]["D1"]["Idx"]
            nak_house = next((h for h, hd in houses.items()
                              if short_names.get(nak_lord_code,"") in hd.get("planets","").split(", ")), None)
            if nak_house:
                if nak_house in [1,4,7,10]:
                    strength_score += 10; strength_factors.append(f"नक्षत्र स्वामी केंद्र में ({nak_house}वें) (+10)")
                elif nak_house in [5,9]:
                    strength_score += 15; strength_factors.append(f"नक्षत्र स्वामी त्रिकोण में ({nak_house}वें) (+15)")
                elif nak_house in [6,8,12]:
                    strength_score -= 15; weakness_factors.append(f"नक्षत्र स्वामी त्रिक में ({nak_house}वें) (-15)")
                nak_dig = DIGNITY_SIGNS.get(nak_lord_code, {})
                if nak_sign_idx == nak_dig.get("Uchcha"):
                    strength_score += 20; strength_factors.append("नक्षत्र स्वामी उच्च (+20) [70% नियम]")
                elif nak_sign_idx == nak_dig.get("Neecha"):
                    strength_score -= 25; weakness_factors.append("नक्षत्र स्वामी नीच (-25) [70% नियम]")

    if is_neecha and all_planets_data:
        if check_neechabhanga(planet_code, sign_idx, houses, all_planets_data, lagna_sign_idx):
            strength_score += 20; strength_factors.append("नीचभंग (+20)"); special_yogas.append("नीचभंग राजयोग")

    if planet_house and check_vipreet_rajyoga(planet_code, house_lordships, planet_house):
        strength_score += 15; strength_factors.append("विपरीत राजयोग (+15)"); special_yogas.append("विपरीत राजयोग")

    if all_planets_data:
        partner = check_parivartan(planet_code, sign_idx, all_planets_data, lagna_sign_idx)
        if partner:
            ph = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}
            strength_score += 12
            strength_factors.append(f"परावर्तन: {ph.get(partner,partner)} (+12)")
            special_yogas.append(f"परावर्तन योग ({ph.get(partner,partner)})")

    strength_score = max(0, min(150, strength_score))
    if strength_score >= 120:   strength_class = "अत्यंत बलवान"
    elif strength_score >= 95:  strength_class = "बलवान"
    elif strength_score >= 70:  strength_class = "सामान्य"
    elif strength_score >= 45:  strength_class = "कमजोर"
    else:                       strength_class = "अत्यंत कमजोर"

    return {
        'score': strength_score, 'class': strength_class,
        'weakness_factors': weakness_factors, 'strength_factors': strength_factors,
        'special_yogas': special_yogas, 'house': planet_house,
        'sign_idx': sign_idx, 'is_neecha': is_neecha
    }

def evaluate_dispositor_chain(planet_code, all_planets_data, houses, lagna_sign_idx, max_depth=8):
    PLANET_HINDI = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}
    RASHI_HINDI  = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]
    short_names  = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}

    path = []; path_set = set(); chain_nodes = {}
    current = planet_code; cycle_members = set(); cycle_entry = None

    for depth in range(max_depth):
        if current in path_set:
            cycle_start_idx = path.index(current)
            cycle_members   = set(path[cycle_start_idx:])
            cycle_entry     = current; break
        if current not in all_planets_data:
            chain_nodes[current] = {'planet':current,'hindi_name':PLANET_HINDI.get(current,current),'note':'डेटा उपलब्ध नहीं','is_terminal':True}
            path.append(current); path_set.add(current); break
        sign_idx   = all_planets_data[current]["Vargas"]["D1"]["Idx"]
        dispositor = SIGN_LORDS[sign_idx]
        rashi_name = RASHI_HINDI[sign_idx]
        dignity_data = DIGNITY_SIGNS.get(current, {})
        if dispositor == current:
            chain_nodes[current] = {'planet':current,'hindi_name':PLANET_HINDI.get(current,current),'sign_idx':sign_idx,'rashi_name':rashi_name,'note':f"स्वराशि ({rashi_name}) — चेन सफलतापूर्वक समाप्त",'is_terminal':True,'is_own_sign':True}
            path.append(current); path_set.add(current); break
        if sign_idx == dignity_data.get("Uchcha"):
            chain_nodes[current] = {'planet':current,'hindi_name':PLANET_HINDI.get(current,current),'sign_idx':sign_idx,'rashi_name':rashi_name,'note':f"उच्च राशि ({rashi_name}) — चेन उत्तम रूप से समाप्त",'is_terminal':True,'is_exalted':True}
            path.append(current); path_set.add(current); break
        disp_strength  = evaluate_planet_strength(dispositor, all_planets_data[dispositor], houses, lagna_sign_idx) if dispositor in all_planets_data else {}
        disp_sign_idx  = all_planets_data[dispositor]["Vargas"]["D1"]["Idx"] if dispositor in all_planets_data else 0
        disp_rashi     = RASHI_HINDI[disp_sign_idx]
        disp_house     = disp_strength.get('house', 0)
        disp_class     = disp_strength.get('class', '')
        disp_is_neecha = (disp_sign_idx == DIGNITY_SIGNS.get(dispositor, {}).get("Neecha"))
        disp_has_nb    = False
        if disp_is_neecha and all_planets_data:
            disp_has_nb = check_neechabhanga(dispositor, disp_sign_idx, houses, all_planets_data, lagna_sign_idx)
        if disp_is_neecha and not disp_has_nb:
            chain_nodes[current] = {'planet':current,'hindi_name':PLANET_HINDI.get(current,current),'sign_idx':sign_idx,'rashi_name':rashi_name,'dispositor':dispositor,'dispositor_hindi':PLANET_HINDI.get(dispositor,dispositor),'dispositor_sign':disp_rashi,'dispositor_house':disp_house,'dispositor_class':disp_class,'is_neecha_break':True,'note':f"चेन टूटी: {PLANET_HINDI.get(dispositor,dispositor)} नीच ({disp_rashi})",'is_terminal':False}
            path.append(current); path_set.add(current); break
        chain_nodes[current] = {'planet':current,'hindi_name':PLANET_HINDI.get(current,current),'sign_idx':sign_idx,'rashi_name':rashi_name,'dispositor':dispositor,'dispositor_hindi':PLANET_HINDI.get(dispositor,dispositor),'dispositor_sign':disp_rashi,'dispositor_house':disp_house,'dispositor_class':disp_class,'is_terminal':False}
        path.append(current); path_set.add(current); current = dispositor

    is_broken    = any(n.get('is_neecha_break') for n in chain_nodes.values())
    is_circular  = (len(cycle_members) > 0)
    chain_penalty= 0
    if is_broken:
        depth_of_break = len(path); chain_penalty = min(20, depth_of_break * 3)
    elif is_circular:
        has_neecha_in_cycle = any(DIGNITY_SIGNS.get(p,{}).get('Neecha') == all_planets_data.get(p,{}).get('Vargas',{}).get('D1',{}).get('Idx') for p in cycle_members if p in all_planets_data)
        chain_penalty = 5 if has_neecha_in_cycle else 0

    return {
        'chain': list(chain_nodes.values()), 'broken': is_broken,
        'is_circular': is_circular, 'cycle_members': list(cycle_members),
        'cycle_entry': cycle_entry, 'chain_penalty': chain_penalty,
        'break_reason': next((n.get('note') for n in chain_nodes.values() if n.get('is_neecha_break')), None)
    }

def calculate_malefic_influence(planet_code, planet_data, houses, all_planets_data, lagna_sign_idx):
    influence_score = 0; factors = []
    sign_idx = planet_data["Vargas"]["D1"]["Idx"]
    short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    planet_house = next((h for h, hd in houses.items() if short_names.get(planet_code,"") in hd.get("planets","").split(", ")), None)
    natural_malefics = ["Su","Sa","Ma","Ra","Ke"]
    if planet_house:
        for p_code, p_short in short_names.items():
            if p_code == planet_code: continue
            for h_num, h_data in houses.items():
                if p_short in h_data.get("planets","").split(", ") and h_num == planet_house:
                    if p_code in natural_malefics:
                        influence_score += 20; factors.append(f"युति: {p_code} (+20)")
                    else:
                        influence_score -= 10; factors.append(f"शुभ युति: {p_code} (-10)")
    if planet_house in [6,8,12]:
        label = {6:"षष्ठ",8:"अष्टम",12:"द्वादश"}[planet_house]
        influence_score += 15; factors.append(f"त्रिक भाव ({label}) +15")
    raw_score = influence_score
    influence_score = max(0, influence_score)
    if influence_score >= 50:   level = "अत्यधिक"
    elif influence_score >= 30: level = "उच्च"
    elif influence_score >= 15: level = "मध्यम"
    elif influence_score > 0:   level = "निम्न"
    else:                       level = "कोई नहीं"
    return {'score': influence_score,'raw_score': raw_score,'factors': factors,'level': level,'drishti_applied': False}

def get_house_aspects(houses, short_names):
    house_aspects = {i: [] for i in range(1, 13)}
    for p_code, p_short in short_names.items():
        p_house = next((h for h, hd in houses.items() if p_short in hd.get("planets","").split(", ")), None)
        if not p_house: continue
        aspects = [7]
        if p_code == "Ma":        aspects.extend([4,8])
        elif p_code == "Ju":      aspects.extend([5,9])
        elif p_code == "Sa":      aspects.extend([3,10])
        elif p_code in ["Ra","Ke"]: aspects.extend([5,9])
        for asp in aspects:
            target_h = (p_house + asp - 2) % 12 + 1
            nature = "अमृत" if p_code == "Ju" else ("पाप" if p_code in ["Sa","Ma","Ra","Ke","Su"] else "शुभ")
            house_aspects[target_h].append(f"{p_short} की {asp}वीं ({nature})")
    return house_aspects

def get_rahu_ketu_adopted_aspects(planet_code, sign_idx):
    sign_lord = SIGN_LORDS[sign_idx]
    if sign_lord == "Ma": return [4,8]
    elif sign_lord == "Sa": return [3,10]
    return []

def calculate_planet_aspects(planet_code, planet_house, sign_idx=None):
    base = [7]
    if planet_code == "Ma":        base.extend([4,8])
    elif planet_code == "Ju":      base.extend([5,9])
    elif planet_code == "Sa":      base.extend([3,10])
    elif planet_code in ["Ra","Ke"] and sign_idx is not None:
        base.extend([5,9])
        for a in get_rahu_ketu_adopted_aspects(planet_code, sign_idx):
            if a not in base: base.append(a)
    weight_map = {7:1.0}
    if planet_code == "Ju":         weight_map.update({5:1.0,9:1.0})
    elif planet_code == "Sa":       weight_map.update({3:1.2,10:1.2})
    elif planet_code == "Ma":       weight_map.update({4:1.1,8:1.1})
    elif planet_code in ["Ra","Ke"]:weight_map.update({5:0.8,9:0.8,3:0.6,4:0.6,8:0.6,10:0.6})
    seen = set(); aspected_houses = []
    for asp in base:
        target = (planet_house + asp - 2) % 12 + 1
        if target in seen: continue
        seen.add(target)
        aspected_houses.append({'house':target,'aspect_type':f"{asp}वीं",'aspect_num':asp,'is_7th':(asp==7),'is_special':(asp!=7),'weight':weight_map.get(asp,0.7)})
    return aspected_houses

def get_aspect_nature(planet_code):
    if planet_code == "Ju": return "अमृत"
    elif planet_code in ["Sa","Ma","Ra","Ke","Su"]: return "पाप"
    else: return "शुभ"

def generate_drishti_matrix(astro_data, houses, lagna_sign_idx):
    drishti_matrix = {}
    short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    for planet_code in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        planet_house = next((h for h, hd in houses.items() if short_names[planet_code] in hd.get("planets","").split(", ")), None)
        if not planet_house: continue
        sign_idx       = astro_data[planet_code]["Vargas"]["D1"]["Idx"]
        aspected_list  = calculate_planet_aspects(planet_code, planet_house, sign_idx)
        aspect_nature  = get_aspect_nature(planet_code)
        p_sign_lordships  = get_house_lordships(planet_code)
        p_house_lordships = [((s - lagna_sign_idx) % 12) + 1 for s in p_sign_lordships]
        dignity_data = DIGNITY_SIGNS.get(planet_code, {})
        is_p_neecha = (sign_idx == dignity_data.get("Neecha"))
        is_p_uchha  = (sign_idx == dignity_data.get("Uchcha"))
        is_p_own    = (sign_idx in dignity_data.get("Swa",[]))
        is_p_mt     = (sign_idx == MOOLATRIKONA.get(planet_code))
        if is_p_neecha:     dignity_mult = 0.5; planet_dig_label = "नीच"
        elif is_p_uchha:    dignity_mult = 1.3; planet_dig_label = "उच्च"
        elif is_p_own or is_p_mt: dignity_mult = 1.2; planet_dig_label = "स्वराशि/मूलत्रिकोण"
        else:               dignity_mult = 1.0; planet_dig_label = "सामान्य"
        aspects_list = []
        for asp_info in aspected_list:
            target_house = asp_info['house']
            special_flags = []
            is_own_house  = (target_house in p_house_lordships)
            if is_own_house:
                if asp_info['aspect_num'] == 7 and planet_code in ["Sa","Ma","Ra","Ke","Su"]:
                    special_flags.append("स्वराशि पर घातक दृष्टि ☠️ (7वीं धुरी नाशक)")
                else:
                    special_flags.append("स्वगृह दृष्टि (वृद्धि)")
            target_sign_idx = houses[target_house]["sign_index"]
            if target_sign_idx == dignity_data.get("Uchcha"):
                special_flags.append("उच्च दृष्टि (अति वृद्धि) 🔥" if not is_p_neecha else "उच्च दृष्टि (कमजोर — ग्रह स्वयं नीच है) ⚠️")
            if target_sign_idx == dignity_data.get("Neecha"):
                special_flags.append("नीच दृष्टि (घातक) ☠️")
            effective_weight = round(asp_info['weight'] * dignity_mult, 2)
            aspects_list.append({'target_house':target_house,'aspect_type':asp_info['aspect_type'],'aspect_num':asp_info['aspect_num'],'nature':aspect_nature,'special_flags':special_flags,'is_7th':asp_info['is_7th'],'is_own_house':is_own_house,'weight':effective_weight,'base_weight':asp_info['weight'],'planet_dignity':planet_dig_label})
        drishti_matrix[planet_code] = {'from_house':planet_house,'sign_idx':sign_idx,'planet_dignity':planet_dig_label,'dignity_mult':dignity_mult,'aspects':aspects_list}
    return drishti_matrix

def calculate_house_aspect_influence(house_num, drishti_matrix, lagna_sign_idx):
    benefic_score = 0.0; malefic_score = 0.0
    jupiter_aspect=False; own_house_protective=False; own_house_killer=False
    uchha_drishti=False; neecha_drishti=False; aspecting_details=[]
    natural_malefics=["Sa","Ma","Ra","Ke","Su"]; natural_benefics=["Ju","Ve","Me","Mo"]
    for planet_code, drishti_data in drishti_matrix.items():
        for asp in drishti_data['aspects']:
            if asp['target_house'] != house_num: continue
            weight     = asp.get('weight', 1.0)
            functional = calculate_functional_nature(planet_code, lagna_sign_idx)
            doshas     = functional.get('doshas', [])
            dosha_str  = f"({', '.join(doshas)})" if doshas else ""
            is_7th_killer     = "स्वराशि पर घातक दृष्टि ☠️ (7वीं धुरी नाशक)" in asp['special_flags']
            is_own_protective = "स्वगृह दृष्टि (वृद्धि)" in asp['special_flags']
            is_uchha     = any("उच्च दृष्टि (अति वृद्धि)" in f for f in asp['special_flags'])
            is_uchha_weak= any("कमजोर — ग्रह स्वयं नीच है" in f for f in asp['special_flags'])
            is_neecha    = any("नीच दृष्टि (घातक)" in f for f in asp['special_flags'])
            if is_7th_killer:
                malefic_score += 25*weight; own_house_killer=True
                if is_neecha: malefic_score += 20; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"स्वराशि पर घातक दृष्टि ☠️ {dosha_str}",'nature':"killer",'score_change':f"+{round(25*weight,1)} पाप"}); continue
            if is_own_protective:
                if planet_code in natural_malefics: benefic_score += 15*weight
                else: benefic_score += 12*weight
                if is_uchha and not is_uchha_weak: benefic_score += 20; uchha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"स्वराशि — रक्षक 🛡️ {dosha_str}",'nature':"protective",'score_change':"शुभ"}); continue
            if planet_code == "Ju":
                benefic_score += 20*weight; jupiter_aspect=True
                if is_uchha and not is_uchha_weak: benefic_score += 20; uchha_drishti=True
                if is_neecha: malefic_score += 20; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"अमृत दृष्टि 🌟 {dosha_str}",'nature':"jupiter",'score_change':"शुभ"}); continue
            if functional.get('yogakaraka'):
                benefic_score += 15*weight
                if is_uchha and not is_uchha_weak: benefic_score += 20; uchha_drishti=True
                if is_neecha: malefic_score += 20; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"योगकारक दृष्टि ⭐ {dosha_str}",'nature':"yogakaraka",'score_change':"शुभ"}); continue
            if functional.get('benefic') and not functional.get('malefic'):
                benefic_score += 12*weight
                if is_uchha and not is_uchha_weak: benefic_score += 20; uchha_drishti=True
                if is_neecha: malefic_score += 20; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"शुभ दृष्टि ✨ {dosha_str}",'nature':"benefic",'score_change':"शुभ"}); continue
            if functional.get('malefic') or functional.get('trishadaya_lord') or functional.get('badhakesh'):
                malefic_score += 15*weight
                if is_uchha and not is_uchha_weak: benefic_score += 10; uchha_drishti=True
                if is_neecha: malefic_score += 25; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"पाप 🎯 {dosha_str}",'nature':"malefic",'score_change':"पाप"}); continue
            if planet_code in natural_malefics:
                malefic_score += 10*weight
                if is_neecha: malefic_score += 25; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"पाप 🎯 {dosha_str}",'nature':"natural_malefic",'score_change':"पाप"}); continue
            if planet_code in natural_benefics:
                benefic_score += 8*weight
                if is_uchha and not is_uchha_weak: benefic_score += 20; uchha_drishti=True
                if is_neecha: malefic_score += 20; neecha_drishti=True
                aspecting_details.append({'planet':planet_code,'aspect_type':asp['aspect_type'],'display':f"शुभ ✨ {dosha_str}",'nature':"natural_benefic",'score_change':"शुभ"})
    net_score = benefic_score - malefic_score
    dominance = "शुभ प्रबल" if net_score > 15 else ("पाप प्रबल" if net_score < -15 else "संतुलित")
    return {'benefic_score':round(benefic_score,1),'malefic_score':round(malefic_score,1),'net_score':round(net_score,1),'dominance':dominance,'jupiter_aspect':jupiter_aspect,'own_house_protective':own_house_protective,'own_house_killer':own_house_killer,'uchha_drishti':uchha_drishti,'neecha_drishti':neecha_drishti,'aspecting_details':aspecting_details}

def integrate_drishti_into_malefic_influence(base_malefic_data, house_aspect_influence):
    base_raw    = base_malefic_data.get('raw_score', base_malefic_data['score'])
    factors     = list(base_malefic_data['factors'])
    net_aspect  = house_aspect_influence.get('net_score', 0)
    jupiter_ok  = house_aspect_influence.get('jupiter_aspect', False)
    combined_raw= float(base_raw); adjustments=[]
    if net_aspect > 0:
        adj = round(net_aspect * 0.6, 1); combined_raw -= adj; adjustments.append(f"शुभ दृष्टि प्रभाव (×0.6) -{adj}")
    elif net_aspect < 0:
        adj = round(abs(net_aspect) * 0.5, 1); combined_raw += adj; adjustments.append(f"पाप दृष्टि प्रभाव (×0.5) +{adj}")
    if jupiter_ok and combined_raw > 10:
        combined_raw -= 5; adjustments.append("गुरु दृष्टि — सर्वोच्च सुरक्षा -5")
    factors.extend(adjustments)
    final_score = max(0, combined_raw)
    if final_score >= 60:   level = "अत्यधिक"
    elif final_score >= 40: level = "उच्च"
    elif final_score >= 20: level = "मध्यम"
    elif final_score > 0:   level = "निम्न"
    else:                   level = "कोई नहीं"
    return {'original_score':base_malefic_data['score'],'combined_raw':round(combined_raw,1),'score':round(final_score,1),'level':level,'factors':factors,'drishti_applied':True,'dominance':house_aspect_influence.get('dominance','संतुलित')}

def generate_planet_evaluation_report(astro_data, houses, lagna_sign_idx):
    """Master evaluation — 100% original logic, untouched."""
    report = {}
    prabal_maraka = calculate_prabal_maraka(lagna_sign_idx)
    drishti_matrix = generate_drishti_matrix(astro_data, houses, lagna_sign_idx)

    for planet_code in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        if planet_code not in astro_data: continue
        planet_data  = astro_data[planet_code]
        functional   = calculate_functional_nature(planet_code, lagna_sign_idx)
        strength     = evaluate_planet_strength(planet_code, planet_data, houses, lagna_sign_idx, astro_data)

        if planet_code == "Ma":
            short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
            mars_house = next((h for h, hd in houses.items() if short_names.get("Ma","") in hd.get("planets","").split(", ")), None)
            if mars_house in [1,4,7,8,12]:
                functional['manglik'] = True; functional['manglik_house'] = mars_house
                cancellations = []
                for jup_h in range(1,13):
                    if short_names.get("Ju") in houses[jup_h].get("planets","").split(", "):
                        asp_houses = [(jup_h+4)%12 or 12,(jup_h+6)%12 or 12,(jup_h+8)%12 or 12]
                        if mars_house in asp_houses: cancellations.append("गुरु की दृष्टि"); break
                mars_sign_idx = planet_data["Vargas"]["D1"]["Idx"]
                if mars_sign_idx in [0,7]: cancellations.append("स्वराशि में मंगल")
                if mars_sign_idx == 9:     cancellations.append("उच्च मंगल")
                functional['manglik_cancellations'] = cancellations

        dispositor   = evaluate_dispositor_chain(planet_code, astro_data, houses, lagna_sign_idx)
        base_malefic = calculate_malefic_influence(planet_code, planet_data, houses, astro_data, lagna_sign_idx)
        planet_house = strength.get('house')
        house_aspect_influence = None; malefic_with_drishti = base_malefic.copy()
        if planet_house:
            house_aspect_influence = calculate_house_aspect_influence(planet_house, drishti_matrix, lagna_sign_idx)
            malefic_with_drishti   = integrate_drishti_into_malefic_influence(base_malefic, house_aspect_influence)
        malefic = malefic_with_drishti
        nak_lord = get_nakshatra_lord(planet_data["Degree"])
        nak_lord_strength = evaluate_planet_strength(nak_lord, astro_data[nak_lord], houses, lagna_sign_idx) if nak_lord in astro_data else None
        is_prabal_maraka  = planet_code in prabal_maraka
        rahu_ketu_override = None
        if planet_code in ["Ra","Ke"]:
            short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
            rk_house = planet_house
            conjunction_planet = None
            if rk_house:
                for p_short in [p.strip() for p in houses[rk_house].get("planets","").split(", ") if p.strip()]:
                    p_code = next((c for c, s in short_names.items() if s == p_short and c not in ["Ra","Ke"]), None)
                    if p_code: conjunction_planet = p_code; break
            is_double_sangati = (conjunction_planet == nak_lord)
            rahu_ketu_override = {'conjunction_planet':conjunction_planet,'nakshatra_lord':nak_lord,'is_double_sangati':is_double_sangati,'override_active':True}
            if is_double_sangati: strength['special_yogas'].append(f"⚠️ दोगुना संगति दोष: {planet_code} ने {nak_lord} का पूर्ण रूप धारण किया")
            functional['rahu_ketu_override'] = rahu_ketu_override

        risk_score = 0; risk_factors = []
        if planet_code not in ["Ra","Ke"]:
            if functional['malefic']:       risk_score += 20; risk_factors.append("अशुभ कार्यात्मक स्वामित्व (+20)")
            if functional.get('badhakesh'): risk_score += 15; risk_factors.append("बाधकेश (+15)")
            if functional.get('trishadaya_lord') and not functional['malefic']: risk_score += 10; risk_factors.append("त्रिशडाय (+10)")
            if functional['maraka']:        risk_score += 20; risk_factors.append("मारक (+20)")
            if is_prabal_maraka:
                pm_info = prabal_maraka.get(planet_code, {})
                risk_score += 25 if pm_info.get('primary') else 15
                risk_factors.append(f"{'2+7 प्रधान मारक' if pm_info.get('primary') else 'द्विगुण अशुभ'} ({pm_info.get('label','')}) (+{25 if pm_info.get('primary') else 15})")
            if functional.get('kendradhipati'): risk_score += 5; risk_factors.append("केंद्राधिपति (+5)")
            if strength['score'] < 40:      risk_score += 25; risk_factors.append(f"अत्यंत कमजोर (+25)")
            elif strength['score'] < 65:    risk_score += 15; risk_factors.append(f"कमजोर (+15)")
            if strength.get('is_neecha') and "नीचभंग" not in " ".join(strength.get('special_yogas',[])): risk_score += 15; risk_factors.append("नीच (बिना नीचभंग) (+15)")
            chain_pen = dispositor.get('chain_penalty', 0)
            if dispositor['broken'] and chain_pen > 0:    risk_score += min(20, chain_pen); risk_factors.append(f"चेन टूटी (+{min(20,chain_pen)})")
            elif chain_pen > 0 and not dispositor['broken']: risk_score += min(5, chain_pen); risk_factors.append(f"चेन चक्रीय (+{min(5,chain_pen)})")
            pap_asp = house_aspect_influence['malefic_score'] if house_aspect_influence else 0
            if pap_asp >= 40:   risk_score += 20; risk_factors.append("उच्च पाप दृष्टि (+20)")
            elif pap_asp >= 20: risk_score += 10; risk_factors.append("मध्यम पाप दृष्टि (+10)")
            if nak_lord_strength and nak_lord_strength['house'] in [6,8,12]: risk_score += 8; risk_factors.append("नक्षत्र स्वामी त्रिक (+8)")
            if house_aspect_influence and house_aspect_influence.get('jupiter_aspect'):    risk_score -= 15; risk_factors.append("गुरु दृष्टि (-15)")
            if "नीचभंग राजयोग" in " ".join(strength.get('special_yogas',[])):            risk_score -= 20; risk_factors.append("नीचभंग (-20)")
            if "विपरीत राजयोग" in " ".join(strength.get('special_yogas',[])):            risk_score -= 15; risk_factors.append("विपरीत राजयोग (-15)")
            if functional.get('yogakaraka'):                                               risk_score -= 10; risk_factors.append("योगकारक (-10)")
            if planet_code == "Ma" and functional.get('manglik'):
                mh = functional.get('manglik_house','?')
                cancel_list = functional.get('manglik_cancellations',[])
                if cancel_list:
                    if risk_score < 10: risk_score = 10
                    risk_factors.append(f"मांगलिक परिहार: {', '.join(cancel_list)} — न्यूनतम जोखिम")
                else:
                    risk_score += 20; risk_factors.append(f"मांगलिक दोष ({mh}वें) (+20)")
        else:
            risk_score = 0; risk_factors = ["🦎 राहु/केतु का स्वतंत्र जोखिम = 0 (गिरगिट नियम)"]

        risk_score = max(0, min(100, risk_score))
        if risk_score >= 80:   risk_level = "अत्यंत उच्च"
        elif risk_score >= 60: risk_level = "उच्च"
        elif risk_score >= 40: risk_level = "मध्यम"
        elif risk_score >= 20: risk_level = "निम्न"
        else:                  risk_level = "न्यूनतम"

        report[planet_code] = {
            'functional':functional,'strength':strength,'dispositor':dispositor,
            'malefic_influence':malefic,'house_aspect_influence':house_aspect_influence,
            'nakshatra_lord':nak_lord,'nakshatra_lord_strength':nak_lord_strength,
            'is_prabal_maraka':is_prabal_maraka,'prabal_maraka_info':prabal_maraka.get(planet_code),
            'risk_score':risk_score,'risk_level':risk_level,'risk_factors':risk_factors,
            'special_yogas':strength.get('special_yogas',[]),
        }

    PH = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}
    for rk_code in ["Ra","Ke"]:
        if rk_code in report and report[rk_code]['functional'].get('rahu_ketu_override'):
            override = report[rk_code]['functional']['rahu_ketu_override']
            conj = override.get('conjunction_planet'); nak = override.get('nakshatra_lord')
            is_double = override.get('is_double_sangati', False)
            conj_risk = report[conj]['risk_score'] if conj and conj in report else 0
            nak_risk  = report[nak]['risk_score']  if nak  and nak  in report else 0
            final_risk = (nak_risk * 0.7) + (conj_risk * 0.3)
            if is_double: final_risk *= 1.5
            final_risk = max(0, min(100, final_risk))
            report[rk_code]['risk_score'] = final_risk
            if final_risk >= 80:   report[rk_code]['risk_level'] = "अत्यंत उच्च"
            elif final_risk >= 60: report[rk_code]['risk_level'] = "उच्च"
            elif final_risk >= 40: report[rk_code]['risk_level'] = "मध्यम"
            elif final_risk >= 20: report[rk_code]['risk_level'] = "निम्न"
            else:                  report[rk_code]['risk_level'] = "न्यूनतम"

    return {
        'planets': report, 'drishti_matrix': drishti_matrix,
        'prabal_maraka_list': prabal_maraka,
        'yogakaraka_planets':  [p for p, d in report.items() if d['functional']['yogakaraka']],
        'weak_planets':        [p for p, d in report.items() if d['strength']['score'] < 60],
        'high_risk_planets':   [p for p, d in report.items() if d['risk_level'] in ["उच्च","अत्यंत उच्च"]]
    }

# ── Utility helpers (original) ──────────────────────────────────────────────
def is_shubh_ashubh(planet_code, house):
    cruel = ["Su","Ma","Sa"]
    if planet_code in cruel:
        if house in [1,5,9]: return "शुभ (त्रिकोण में)"
        if house in [1,4,7,10]: return "शुभ (केंद्र में)"
        return "अशुभ (क्रूर)"
    return "शुभ (नैसर्गिक)"

def get_tara_milan(janm_nakshatra, gochar_nakshatra):
    count = (gochar_nakshatra - janm_nakshatra) % 9 + 1
    if count in [2,4,6,8,9]: return "शुभ"
    if count in [3,5,7]:     return "अशुभ"
    return "Neutral"

def check_ashtakavarga_special(sav, houses):
    short_map = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    ph = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}
    results = {}
    for p_code, p_short in short_map.items():
        p_house = next((h for h, hd in houses.items() if p_short in hd.get("planets","").split(", ")), None)
        if p_house is None: continue
        total = sum(sav[h-1] for h in range(1, p_house + 1))
        raw = total * 7; age = raw // 27
        label = "बाल्यकाल" if age <= 12 else ("युवावस्था" if age <= 25 else ("प्रौढ़ता" if age <= 36 else ("मध्यावस्था" if age <= 50 else "परिपक्व आयु")))
        results[p_code] = {'house':p_house,'av_sum':total,'raw':raw,'age':age,'planet_hindi':ph.get(p_code,p_code),'label':label,'formula_shown':f"Σ(भाव 1→{p_house}) = {total} | {total}×7={raw} | {raw}÷27 = {age}वर्ष"}
    special_notes = []
    if "श" in houses[1].get("planets","") and "गु" in houses[1].get("planets",""):
        lagna_sum = sav[0]; _, _, age_sg = lagna_sum*7, lagna_sum*7//27, lagna_sum*7//27
        special_notes.append(f"शनि-गुरु लग्न: टर्निंग पॉइंट {age_sg}वें वर्ष")
    return results, special_notes

def check_disease_12th(astro, houses):
    diseases = []
    for p in astro:
        for h_num, house in houses.items():
            if p in house.get("planets","").split(", ") and h_num == 12:
                if p == "Su": diseases.append("हड्डी रोग")
                if p == "Sa": diseases.append("नसें/सायटिका")
    return diseases or ["कोई नहीं"]

CITY_CACHE = {}

def get_coordinates(city_name):
    if not city_name:
        return None, None
    if city_name in CITY_CACHE:
        return CITY_CACHE[city_name]
    url = f"https://nominatim.openstreetmap.org/search?q={city_name}&format=json&limit=1"
    try:
        response = http_requests.get(url, headers={'User-Agent':'KundliApp/5.0'}, timeout=8).json()
        if response:
            lat, lon = float(response[0]['lat']), float(response[0]['lon'])
            CITY_CACHE[city_name] = (lat, lon)
            return lat, lon
        return (None, None)
    except:
        return None, None

def get_nakshatra_info(degree):
    rashi_idx = int(degree / 30); nak_idx = int(degree / (360/27))
    pada = int((degree % (360/27)) / (360/108)) + 1
    return f"{RASHI[rashi_idx].split(' ')[0]} | {NAKSHATRA[nak_idx]} (चरण {pada})"

def get_all_vargas(degree):
    sign = int(degree / 30); rem = degree % 30; v = {}
    v['D1']  = sign
    v['D2']  = (4 if rem < 15 else 3) if sign % 2 == 0 else (3 if rem < 15 else 4)
    v['D3']  = (sign + (int(rem/10)*4)) % 12
    v['D4']  = (sign + (int(rem/7.5)*3)) % 12
    v['D7']  = (sign + int(rem/(30/7))) % 12 if sign % 2 == 0 else (sign + 6 + int(rem/(30/7))) % 12
    v['D9']  = int(((degree * 9) % 360) / 30)
    v['D10'] = (sign + int(rem/3)) % 12 if sign % 2 == 0 else (sign + 8 + int(rem/3)) % 12
    v['D12'] = (sign + int(rem/2.5)) % 12
    v['D16'] = ([0,4,8][sign % 3] + int(rem/(30/16))) % 12
    v['D20'] = ([0,8,4][sign % 3] + int(rem/1.5)) % 12
    v['D24'] = ((4 if sign % 2 == 0 else 3) + int(rem/1.25)) % 12
    v['D27'] = ((sign % 4) * 3 + int(rem/(30/27))) % 12
    v['D30'] = (0 if rem<5 else (10 if rem<10 else (8 if rem<18 else (2 if rem<25 else 6)))) if sign%2==0 else (1 if rem<5 else (5 if rem<12 else (11 if rem<20 else (9 if rem<25 else 7))))
    v['D40'] = ((0 if sign % 2 == 0 else 6) + int(rem/0.75)) % 12
    v['D45'] = ([0,4,8][sign % 3] + int(rem/(30/45))) % 12
    v['D60'] = (sign + int(rem/0.5)) % 12
    for k in v.keys(): v[k] = {"Name": RASHI[v[k]], "Idx": v[k]}
    return v

def calculate_astrology(local_dt, lat, lon):
    utc_dt = local_dt - timedelta(hours=5, minutes=30)
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour + (utc_dt.minute/60.0))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    planets_map = {"Su":swe.SUN,"Mo":swe.MOON,"Ma":swe.MARS,"Me":swe.MERCURY,"Ju":swe.JUPITER,"Ve":swe.VENUS,"Sa":swe.SATURN}
    data = {}
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
    data["La"] = {"Degree":ascmc[0],"SignDegree":ascmc[0]%30,"Vargas":get_all_vargas(ascmc[0]),"Details":get_nakshatra_info(ascmc[0])}
    for name, code in planets_map.items():
        pos, _ = swe.calc_ut(jd, code, swe.FLG_SIDEREAL)
        data[name] = {"Degree":pos[0],"SignDegree":pos[0]%30,"Vargas":get_all_vargas(pos[0]),"Details":get_nakshatra_info(pos[0])}
    rahu_deg = swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SIDEREAL)[0][0]
    data["Ra"] = {"Degree":rahu_deg,"SignDegree":rahu_deg%30,"Vargas":get_all_vargas(rahu_deg),"Details":get_nakshatra_info(rahu_deg)}
    ketu_deg = (rahu_deg + 180) % 360
    data["Ke"] = {"Degree":ketu_deg,"SignDegree":ketu_deg%30,"Vargas":get_all_vargas(ketu_deg),"Details":get_nakshatra_info(ketu_deg)}
    return data

def calculate_sav(data):
    sav_points = [0] * 12
    for receiver, rules in AV_RULES.items():
        for donor, houses in rules.items():
            donor_idx = data[donor]["Vargas"]["D1"]["Idx"]
            for h in houses:
                target_idx = (donor_idx + h - 1) % 12
                sav_points[target_idx] += 1
    return sav_points

def calculate_vimshottari(moon_degree, birth_date):
    nak_idx = int(moon_degree / (360/27)); lord_idx = nak_idx % 9
    fraction_remaining = 1.0 - (moon_degree % (360/27)) / (360/27)
    current_date = birth_date; dashas = []
    first_end = current_date + timedelta(days=fraction_remaining * DASHA_YEARS[lord_idx] * 365.25)
    dashas.append({"planet":DASHA_LORDS[lord_idx],"start":current_date.strftime("%d-%m-%Y"),"end":first_end.strftime("%d-%m-%Y"),"idx":lord_idx})
    current_date = first_end
    for i in range(1, 9):
        idx = (lord_idx + i) % 9
        end  = current_date + timedelta(days=DASHA_YEARS[idx] * 365.25)
        dashas.append({"planet":DASHA_LORDS[idx],"start":current_date.strftime("%d-%m-%Y"),"end":end.strftime("%d-%m-%Y"),"idx":idx})
        current_date = end
    return dashas

def get_antardashas(md_lord_idx, md_start_date_str):
    ads = []; current_date = datetime.strptime(md_start_date_str, "%d-%m-%Y")
    md_years = DASHA_YEARS[md_lord_idx]
    for i in range(9):
        ad_lord_idx = (md_lord_idx + i) % 9
        ad_years    = DASHA_YEARS[ad_lord_idx]
        duration    = (md_years * ad_years) / 120.0
        end_date    = current_date + timedelta(days=duration * 365.25)
        ads.append({"planet":DASHA_LORDS[ad_lord_idx],"start":current_date.strftime("%d-%m-%Y"),"end":end_date.strftime("%d-%m-%Y"),"idx":ad_lord_idx})
        current_date = end_date
    return ads

def get_pratyantardashas(md_lord_idx, ad_lord_idx, ad_start_date_str):
    pds = []; current_date = datetime.strptime(ad_start_date_str, "%d-%m-%Y")
    md_years = DASHA_YEARS[md_lord_idx]; ad_years = DASHA_YEARS[ad_lord_idx]
    for i in range(9):
        pd_lord_idx = (ad_lord_idx + i) % 9; pd_years = DASHA_YEARS[pd_lord_idx]
        duration    = (md_years * ad_years * pd_years / (120.0 * 120.0)) * 365.25
        end_date    = current_date + timedelta(days=duration)
        pds.append({"planet":DASHA_LORDS[pd_lord_idx],"start":current_date.strftime("%d-%m-%Y"),"end":end_date.strftime("%d-%m-%Y")})
        current_date = end_date
    return pds

def get_dignity(planet, sign_idx):
    if planet == "La": return "-"
    info = DIGNITY_SIGNS.get(planet)
    if info:
        if sign_idx == info["Uchcha"]: return "⬆️ उच्च (Exalted)"
        if sign_idx == info["Neecha"]: return "⬇️ नीच (Debilitated)"
        if sign_idx in info["Swa"]:   return "🏠 स्वराशि (Own Sign)"
    lord = SIGN_LORDS[sign_idx]
    if lord in RELATIONSHIPS[planet]["Friends"]: return "🤝 मित्र (Friendly)"
    if lord in RELATIONSHIPS[planet]["Enemies"]: return "⚔️ शत्रु (Enemy)"
    return "😐 सम (Neutral)"

def get_all_dashas_for_year(moon_degree, birth_date, target_year):
    nak_idx = int(moon_degree/(360/27)); lord_idx = nak_idx % 9
    fraction_remaining = 1.0 - (moon_degree%(360/27))/(360/27)
    current_date = birth_date
    first_md_duration = fraction_remaining * DASHA_YEARS[lord_idx]
    md_end = current_date + timedelta(days=first_md_duration * 365.25)
    mahadashas = [{"planet":DASHA_LORDS[lord_idx],"idx":lord_idx,"start":current_date,"end":md_end}]
    current_date = md_end
    for i in range(1,9):
        md_idx = (lord_idx+i)%9; md_duration = DASHA_YEARS[md_idx]
        md_end = current_date + timedelta(days=md_duration*365.25)
        mahadashas.append({"planet":DASHA_LORDS[md_idx],"idx":md_idx,"start":current_date,"end":md_end})
        current_date = md_end
    target_start = datetime(target_year,1,1); target_end = datetime(target_year,12,31)
    active_dashas = []
    for md in mahadashas:
        if md['start'] <= target_end and md['end'] >= target_start:
            ad_current = md['start']; md_years = DASHA_YEARS[md['idx']]
            for i in range(9):
                ad_idx = (md['idx']+i)%9; ad_years = DASHA_YEARS[ad_idx]
                ad_duration = (md_years*ad_years)/120.0
                ad_end = ad_current + timedelta(days=ad_duration*365.25)
                if ad_current <= target_end and ad_end >= target_start:
                    pd_current = ad_current
                    for j in range(9):
                        pd_idx = (ad_idx+j)%9; pd_years = DASHA_YEARS[pd_idx]
                        pd_duration = (md_years*ad_years*pd_years/(120.0*120.0))*365.25
                        pd_end = pd_current + timedelta(days=pd_duration)
                        if pd_current <= target_end and pd_end >= target_start:
                            active_dashas.append({'mahadasha':md['planet'],'antardasha':DASHA_LORDS[ad_idx],'pratyantardasha':DASHA_LORDS[pd_idx],'start':pd_current,'end':pd_end})
                        pd_current = pd_end
                        if pd_current > target_end: break
                ad_current = ad_end
                if ad_current > target_end: break
    return active_dashas

def search_dasha_alignments(moon_degree, birth_date, search_criteria):
    nak_idx = int(moon_degree/(360/27)); lord_idx = nak_idx % 9
    fraction_remaining = 1.0 - (moon_degree%(360/27))/(360/27)
    current_date = birth_date; matches = []
    first_md_duration = fraction_remaining * DASHA_YEARS[lord_idx]
    md_end = current_date + timedelta(days=first_md_duration*365.25)
    mahadashas = [{"planet":DASHA_LORDS[lord_idx],"idx":lord_idx,"start":current_date,"end":md_end}]
    current_date = md_end
    for i in range(1,9):
        md_idx = (lord_idx+i)%9
        md_end = current_date + timedelta(days=DASHA_YEARS[md_idx]*365.25)
        mahadashas.append({"planet":DASHA_LORDS[md_idx],"idx":md_idx,"start":current_date,"end":md_end})
        current_date = md_end
    for md in mahadashas:
        if search_criteria.get('mahadasha') and md['planet'] != search_criteria['mahadasha']: continue
        ad_current = md['start']; md_years = DASHA_YEARS[md['idx']]
        for i in range(9):
            ad_idx = (md['idx']+i)%9; ad_planet = DASHA_LORDS[ad_idx]
            ad_years = DASHA_YEARS[ad_idx]; ad_duration = (md_years*ad_years)/120.0
            if search_criteria.get('antardasha') and ad_planet != search_criteria['antardasha']:
                ad_current += timedelta(days=ad_duration*365.25); continue
            ad_end = ad_current + timedelta(days=ad_duration*365.25)
            pd_current = ad_current
            for j in range(9):
                pd_idx = (ad_idx+j)%9; pd_planet = DASHA_LORDS[pd_idx]
                pd_years = DASHA_YEARS[pd_idx]; pd_duration = (md_years*ad_years*pd_years/(120.0*120.0))*365.25
                if search_criteria.get('pratyantardasha') and pd_planet != search_criteria['pratyantardasha']:
                    pd_current += timedelta(days=pd_duration); continue
                pd_end = pd_current + timedelta(days=pd_duration)
                matches.append({'mahadasha':md['planet'],'antardasha':ad_planet,'pratyantardasha':pd_planet,'start_date':pd_current,'end_date':pd_end,'duration_days':int((pd_end-pd_current).days)})
                pd_current = pd_end
            ad_current = ad_end
    return matches


# ═══════════════════════════════════════════════════════════════════════════
# ██  SECTION 3 — JSON API ROUTES  (replaces render_template_string)
# ═══════════════════════════════════════════════════════════════════════════

def _build_chart_response(name, city, date_str, time_str, chart_type, lat=None, lon=None):
    """
    Core calculation pipeline — same as original home() POST handler,
    but returns a dict (not rendered HTML).
    lat/lon: frontend se aaye to use karo, warna Nominatim fallback.
    """
    if not lat or not lon:
        lat, lon = get_coordinates(city)
    if not lat or not lon:
        return None, f"शहर नहीं मिला: {city}"

    dt   = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    astro      = calculate_astrology(dt, lat, lon)
    sav_points = calculate_sav(astro)
    dashas     = calculate_vimshottari(astro["Mo"]["Degree"], dt)
    now        = datetime.now()

    # ── Bhav Chalit (Sri Pati Paddhati) ──────────────────────────
    try:
        _utc_dt = dt - timedelta(hours=5, minutes=30)
        _jd = swe.julday(_utc_dt.year, _utc_dt.month, _utc_dt.day,
                         _utc_dt.hour + _utc_dt.minute / 60.0)
        _asc_idx_d1 = astro["La"]["Vargas"]["D1"]["Idx"]
        _planets_d1_for_chalit = {}
        for _pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
            if _pc in astro:
                _p     = astro[_pc]
                _p_idx = _p["Vargas"]["D1"]["Idx"]
                _h     = (_p_idx - _asc_idx_d1 + 12) % 12 + 1
                # ✅ FIX: "Degree" = 0-360 absolute — already correct in astro dict
                # astro[pc]["Degree"] = swe.calc_ut output = 0-360 ✔️
                _sign = (_p_idx % 12) + 1   # 1-based rashi
                _planets_d1_for_chalit[_pc] = {"Degree": _p["Degree"], "house": _h, "sign": _sign}
        # engine returns: {"Su": {"house": X, "d1_house": Y, "is_changed": bool}}
        chalit_data = get_bhav_chalit(_jd, lat, lon, _planets_d1_for_chalit, include_house_data=True)
    except Exception as _ce:
        print(f"[Chalit Engine] Error: {_ce}")
        chalit_data = {}

    # ── Maitri (Panchadha) ───────────────────────────────────────────
    try:
        _maitri_input = {}
        for _pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
            if _pc in astro:
                _p     = astro[_pc]
                _p_idx = _p["Vargas"]["D1"]["Idx"]
                _h     = (_p_idx - astro["La"]["Vargas"]["D1"]["Idx"] + 12) % 12 + 1
                _sign  = (_p_idx % 12) + 1
                _maitri_input[_pc] = {"house": _h, "sign": _sign}
        maitri_data = compute_maitri(_maitri_input)
    except Exception as _me:
        print(f"[Maitri Engine] Error: {_me}")
        maitri_data = {}

    # ── Sudarshan Chakra ──────────────────────────────────────────
    try:
        sudarshan_data = get_sudarshan_data(astro, sav_points)
    except Exception as _se:
        print(f"[Sudarshan Engine] Error: {_se}")
        sudarshan_data = {}

    # ── Yearly Prediction (Sudarshan-based) ─────────────────────
    try:
        _age = int((request.get_json(silent=True) or {}).get("age", 0) or 0)
        if _age > 0 and sudarshan_data:
            yearly_data = get_yearly_prediction(_age, sudarshan_data, houses)
        else:
            yearly_data = {}
    except Exception as _ye:
        print(f"[Yearly Engine] Error: {_ye}")
        yearly_data = {}

    # ── Active dasha ──────────────────────────────────────────────
    current_md = dashas[0]
    for d in dashas:
        if datetime.strptime(d['start'], "%d-%m-%Y") <= now < datetime.strptime(d['end'], "%d-%m-%Y"):
            current_md = d; break

    current_ads = get_antardashas(current_md['idx'], current_md['start'])
    current_ad  = current_ads[0]
    for ad in current_ads:
        ad['is_current'] = datetime.strptime(ad['start'], "%d-%m-%Y") <= now < datetime.strptime(ad['end'], "%d-%m-%Y")
        if ad['is_current']: current_ad = ad

    current_pds = get_pratyantardashas(current_md['idx'], current_ad['idx'], current_ad['start'])
    for pd in current_pds:
        pd['is_current'] = datetime.strptime(pd['start'], "%d-%m-%Y") <= now < datetime.strptime(pd['end'], "%d-%m-%Y")

    # ── Houses ────────────────────────────────────────────────────
    houses     = {i: {"sign": "", "sign_index": 0, "planets": "", "av": 0} for i in range(1, 13)}
    asc_idx    = astro["La"]["Vargas"][chart_type]["Idx"]
    lagna_rashi = asc_idx

    for i in range(12):
        house_num = i + 1
        sign_idx  = (asc_idx + i) % 12
        houses[house_num]["sign_index"] = sign_idx
        houses[house_num]["sign"]       = RASHI[sign_idx]

    short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
    full_names  = {"La":"लग्न","Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}

    for p_code, p_hi in short_names.items():
        p_idx = astro[p_code]["Vargas"][chart_type]["Idx"]
        h_num = (p_idx - asc_idx + 12) % 12 + 1
        if houses[h_num]["planets"]: houses[h_num]["planets"] += f", {p_hi}"
        else:                        houses[h_num]["planets"]  = p_hi
        astro[p_code]["Dignity"] = get_dignity(p_code, p_idx)

    # Add lagna to house 1
    if houses[1]["planets"]: houses[1]["planets"] = "ल, " + houses[1]["planets"]
    else:                     houses[1]["planets"] = "ल"

    # Assign AV scores to houses
    # 🔥 FIX: Rotate SAV to lagna-based bhav order
    rotated_sav = sav_points[asc_idx:] + sav_points[:asc_idx]
    for i in range(12):
        houses[i+1]["av"] = rotated_sav[i]

    planet_house_map = {}
    for p_code, p_hi in short_names.items():
        planet_house_map[p_code] = 0
        for h_num, house in houses.items():
            if p_hi in [p.strip() for p in house.get("planets","").split(",")]:
                planet_house_map[p_code] = h_num; break

    # ── Tara Milan ────────────────────────────────────────────────
    janm_nak = int(astro["Mo"]["Degree"] / (360/27))
    try:
        now_utc = datetime.utcnow()
        jd_now  = swe.julday(now_utc.year, now_utc.month, now_utc.day, now_utc.hour + now_utc.minute/60.0)
        moon_pos_gochar = swe.calc_ut(jd_now, swe.MOON, swe.FLG_SIDEREAL)[0][0]
        gochar_nak      = int(moon_pos_gochar / (360/27))
        tara_milan      = get_tara_milan(janm_nak, gochar_nak)
    except Exception:
        tara_milan = "गोचर तारा मिलान उपलब्ध नहीं"

    av_age_data, ashtakavarga_special_notes = check_ashtakavarga_special(sav_points, houses)
    ashtakavarga_special = ' | '.join(ashtakavarga_special_notes) if ashtakavarga_special_notes else 'कोई विशेष नहीं'
    disease_12th = check_disease_12th(astro, houses)
    jyotish_evaluation = generate_planet_evaluation_report(astro, houses, lagna_rashi)
    house_aspects = get_house_aspects(houses, short_names)
    badhak_house_num = get_badhak_house(lagna_rashi)

    master_astro_data = {
        "meta":{"name":name,"dob":str(dt.date()),"time":str(dt.time()),"city":city},
        "planets":astro, "dashas":dashas, "sav":sav_points, "houses":houses
    }

    # ── Nadi AI ────────────────────────────────────────────────────
    nadi_ai_output = {}; house_diagnostic = []
    try:
        dignity_engine    = DignityEngine()
        dasha_engine      = DashaEngine(dashas)
        nakshatra_engine  = NakshatraEngine(dignity_engine)
        modules           = [CareerModule(astro, dt)]
        aggregator        = NadiAggregator(
            astro_data=master_astro_data["planets"], dob_obj=dt, modules=modules,
            dignity_engine=dignity_engine, dasha_engine=dasha_engine, nakshatra_engine=nakshatra_engine
        )
        nadi_ai_output = aggregator.run()
        hde = HouseDiagnosticEngine(master_astro_data, dasha_engine, gochar_engine=None)
        house_diagnostic = hde.generate_full_report()["houses_diagnostic"]
    except Exception as e:
        print("Nadi AI Error:", e)

    nadi_events = []
    try:
        nadi_events = nadi_master.run_master_analysis(astro, date_str)
    except Exception as e:
        print("Classic Nadi Error:", e)

    # ── Nadi Jyotish Engine (full_nadi_analysis) ───────────────────
    nadi_jyotish_output = {}
    try:
        if _NADI_JYOTISH_AVAILABLE:
            # Convert astro data → nadi engine format
            # astro keys: Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
            # nadi engine expects: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU
            _CODE_MAP = {
                "Su": "SUN", "Mo": "MOON", "Ma": "MARS",
                "Me": "MERCURY", "Ju": "JUPITER", "Ve": "VENUS",
                "Sa": "SATURN", "Ra": "RAHU", "Ke": "KETU"
            }
            _planets_for_nadi = {}
            for short, full in _CODE_MAP.items():
                if short in astro:
                    p = astro[short]
                    # sign: Vargas.D1.Idx is 0-based, nadi engine needs 1-12
                    sign_1based = (p["Vargas"]["D1"]["Idx"] % 12) + 1
                    _planets_for_nadi[full] = {
                        "sign":      sign_1based,
                        "degree":    round(p.get("SignDegree", p["Degree"] % 30), 2),
                        "retrograde": bool(p.get("Retrograde", False)),
                        "combust":   bool(p.get("Combust", False)),
                    }
            # lagna_rashi is 0-based in api.py, nadi engine needs 1-12
            _lagna_for_nadi = (lagna_rashi % 12) + 1
            # gender from request
            _gender = (request.get_json(silent=True) or {}).get("gender", "MALE").upper()
            _birth_year = dt.year
            _current_year = datetime.now().year

            nadi_jyotish_output = run_nadi_jyotish(
                planets_data = _planets_for_nadi,
                lagna        = _lagna_for_nadi,
                gender       = _gender,
                birth_year   = _birth_year,
                current_year = _current_year,
            )
    except Exception as e:
        print("Nadi Jyotish Engine Error:", e)
        nadi_jyotish_output = {"error": str(e)}

    # ── Assemble houses list for React (sign_index + planet list) ──
    houses_list = []
    for h_num in range(1, 13):
        h = houses[h_num]
        planet_codes = []
        for p_code, p_hi in short_names.items():
            if p_hi in [p.strip() for p in h.get("planets","").split(",")]:
                planet_codes.append(p_code)
        if "ल" in [p.strip() for p in h.get("planets","").split(",")]:
            planet_codes.insert(0, "La")
        rashi_en = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"]
        rashi_hi = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]
        si = h["sign_index"]
        houses_list.append({
            "num":        h_num,
            "sign":       rashi_en[si],
            "signHindi":  rashi_hi[si],
            "sign_index": si,
            "planets":    planet_codes,
            "category":   get_house_category(h_num),
            "av":         h["av"],  # Already rotated in houses dict
        })

    # ── Planet details for React (100% Safe & Complete) ──────────────────────
    DIGNITY_MAP = {
        "⬆️ उच्च (Exalted)":   {"key":"Uchcha",  "hindi":"उच्च"},
        "⬇️ नीच (Debilitated)": {"key":"Neecha",  "hindi":"नीच"},
        "🏠 स्वराशि (Own Sign)": {"key":"Swa",    "hindi":"स्वराशि"},
        "🤝 मित्र (Friendly)":  {"key":"Mitra",   "hindi":"मित्र"},
        "⚔️ शत्रु (Enemy)":    {"key":"Shatru",  "hindi":"शत्रु"},
        "😐 सम (Neutral)":     {"key":"Sama",    "hindi":"सम"},
    }

    RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]
    RASHI_EN = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"]
    NAK_LORDS = ["Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me"]
    PLANET_HINDI = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}

    # 🔥 मास्टर भाव वर्गीकरण फंक्शन
    def get_house_categories(house, lagna_idx):
        categories = []
        if house in [1,4,7,10]: categories.append("केंद्र")
        if house in [1,5,9]:    categories.append("त्रिकोण")
        if house in [6,8,12]:   categories.append("त्रिक")
        if house in [2,7]:      categories.append("मारक")
        if house in [3,6,10,11]:categories.append("उपचय")
        if house in [2,5,8,11]: categories.append("पणफर")
        if house in [3,6,9,12]: categories.append("आपोक्लिम")
        if house in [3,6,11]:   categories.append("त्रिशडाय")
        
        # बाधक भाव
        if lagna_idx in [0, 3, 6, 9] and house == 11: categories.append("बाधक")
        elif lagna_idx in [1, 4, 7, 10] and house == 9: categories.append("बाधक")
        elif lagna_idx in [2, 5, 8, 11] and house == 7: categories.append("बाधक")
        
        return " | ".join(categories)

    planets_out = {}
    
    # लग्न का इंडेक्स निकालना (ताकि बाधक भाव सही से काम करे)
    lagna_rashi_idx = 0
    if "La" in astro and "Vargas" in astro["La"] and "D1" in astro["La"]["Vargas"]:
        lagna_rashi_idx = astro["La"]["Vargas"]["D1"]["Idx"]

    for p_code in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        if p_code not in astro: continue
        p = astro[p_code]
        
        sign_idx   = p["Vargas"]["D1"]["Idx"]
        nak_idx    = int(p["Degree"] / (360/27))
        dignity_raw = p.get("Dignity", "-") 
        dm = DIGNITY_MAP.get(dignity_raw, {"key":"Sama","hindi":"सम"})
        
        evaluation  = jyotish_evaluation["planets"].get(p_code, {})
        strength    = evaluation.get("strength", {})
        functional  = evaluation.get("functional", {})
        
        # 1. बेस स्वभाव
        fn = "Yogakaraka" if functional.get("yogakaraka") else ("Malefic" if functional.get("malefic") else ("Functional Benefic" if functional.get("benefic") else "Neutral"))
        
        # 2. बाधकेश लॉजिक
        if functional.get("badhakesh"):
            fn = f"{fn} + बाधकेश"
            
        real_nak_lord_code = NAK_LORDS[nak_idx % 9]
        planet_house_num = planet_house_map.get(p_code, 0)

        planets_out[p_code] = {
            "name":           PLANET_HINDI.get(p_code, p_code),
            "hindi":          PLANET_HINDI.get(p_code, p_code),
            "sign":           RASHI_EN[sign_idx],
            "hindi_sign":     RASHI_HI[sign_idx],
            "degree":         f"{round(p['Degree'] % 30, 2)}°",
            "fullDegree":     round(p['Degree'], 2),
            "nakshatraPada":  int((p['Degree'] % (360/27)) / (360/108)) + 1,
            "house":          planet_house_num,
            "houseCategory":  get_house_categories(planet_house_num, lagna_rashi_idx),
            "dignity":        dm["key"],
            "dignityHindi":   dm["hindi"],
            "nakshatra":      NAKSHATRA[nak_idx] if nak_idx < 27 else "",
            "lord":           SIGN_LORDS[sign_idx], 
            "rashiLord":      PLANET_HINDI.get(SIGN_LORDS[sign_idx], ""),
            "nakshatraLord":  PLANET_HINDI.get(real_nak_lord_code, ""),
            "strength":       min(100, max(0, int(strength.get("score", 50) * 100 / 150))),
            "riskScore":      int(evaluation.get("risk_score", 0)),
            "functionalNature": fn,
            "dispositor":     SIGN_LORDS[sign_idx],
            "dispositorSign": RASHI_EN[astro.get(SIGN_LORDS[sign_idx], {}).get("Vargas", {}).get("D1", {}).get("Idx", 0)] if SIGN_LORDS[sign_idx] in astro else "",
            "maleficInfluence": evaluation.get("malefic_influence", {}).get("score", 0) > 20,
            "aspects":        [a["target_house"] for a in jyotish_evaluation.get("drishti_matrix", {}).get(p_code, {}).get("aspects", [])],
            "notes":          " | ".join(strength.get("strength_factors", []) + strength.get("weakness_factors", [])),
            "keyYogas":       strength.get("special_yogas", []),
            "riskFactors":    evaluation.get("risk_factors", []),
        
            
            # 👇 तुम्हारी ओरिजिनल 5 लाइनें जो मैंने वापस डाल दी हैं
            "dispositor":     SIGN_LORDS[sign_idx],
            "dispositorSign": RASHI_EN[astro.get(SIGN_LORDS[sign_idx], {}).get("Vargas", {}).get("D1", {}).get("Idx", 0)] if SIGN_LORDS[sign_idx] in astro else "",
            "maleficInfluence": evaluation.get("malefic_influence", {}).get("score", 0) > 20,
            "aspects":        [a["target_house"] for a in jyotish_evaluation.get("drishti_matrix", {}).get(p_code, {}).get("aspects", [])],
            "notes":          " | ".join(strength.get("strength_factors", []) + strength.get("weakness_factors", [])),
            "keyYogas":       strength.get("special_yogas", []),
            "riskFactors":    evaluation.get("risk_factors", []),
        }

    # ── Dasha response ─────────────────────────────────────────────
    md_start = datetime.strptime(current_md['start'], "%d-%m-%Y")
    md_end   = datetime.strptime(current_md['end'],   "%d-%m-%Y")
    md_total = (md_end - md_start).days
    md_done  = (now - md_start).days if now > md_start else 0
    md_pct   = int(min(100, (md_done / md_total * 100))) if md_total > 0 else 0

    PLANET_CODE_MAP = {v:k for k,v in {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}.items()}
    dasha_sequence = []
    for d in dashas:
        # ── Get full antardashas for this mahadasha ──
        ads_raw = get_antardashas(d["idx"], d["start"])
        antardashas = []
        
        for ad in ads_raw:
            # ── Get pratyantardashas for each antardasha ──
            pds_raw = get_pratyantardashas(d["idx"], ad["idx"], ad["start"])
            
            antardashas.append({
                "lord": ad["planet"],
                "start": ad["start"],
                "end": ad["end"],
                "pratyantardashas": [
                    {
                        "lord": pd["planet"],
                        "start": pd["start"],
                        "end": pd["end"]
                    }
                    for pd in pds_raw
                ]
            })
        
        dasha_sequence.append({
            "lord": d["planet"],
            "code": PLANET_CODE_MAP.get(d["planet"], ""),
            "start": d["start"].split("-")[2] if "-" in d["start"] else d["start"][:4],
            "end":   d["end"].split("-")[2]   if "-" in d["end"]   else d["end"][:4],
            "years": DASHA_YEARS[d["idx"]],
            "active": d["planet"] == current_md["planet"],
            "pct":  md_pct if d["planet"] == current_md["planet"] else 0,
            "antardashas": antardashas  # ← NEW FIELD
        })

    # ── Drishti for React ─────────────────────────────────────────
    drishti_out = {}
    for p_code, dm_data in jyotish_evaluation.get("drishti_matrix", {}).items():
        aspects = dm_data.get("aspects", [])
        drishti_out[p_code] = [a["target_house"] for a in aspects]

    # ── Bhav Drishti — reverse map: bhav → [{planet, aspect_type, nature}]
    bhav_drishti = {i: [] for i in range(1, 13)}
    for p_code, dm_data in jyotish_evaluation.get("drishti_matrix", {}).items():
        fn_p = jyotish_evaluation["planets"].get(p_code, {}).get("functional", {})
        is_benefic = fn_p.get("yogakaraka") or fn_p.get("benefic")
        is_malefic = fn_p.get("malefic") or fn_p.get("trishadaya")
        nature = "अमृत" if is_benefic else ("पाप" if is_malefic else "शुभ")
        for asp in dm_data.get("aspects", []):
            tgt = asp.get("target_house", 0)
            if 1 <= tgt <= 12:
                bhav_drishti[tgt].append({
                    "planet":      p_code,
                    "aspectType":  asp.get("aspect_type", ""),
                    "nature":      asp.get("nature", nature),
                    "display":     asp.get("display", ""),
                })

    # ── Master Conclusion ─────────────────────────────────────────
    all_risks = [(p, d["risk_score"]) for p, d in jyotish_evaluation["planets"].items()]
    yogas     = jyotish_evaluation.get("yogakaraka_planets", [])
    weak      = jyotish_evaluation.get("weak_planets", [])
    high_risk = jyotish_evaluation.get("high_risk_planets", [])
    overall_score = max(0, min(100, 75 - len(high_risk)*8 + len(yogas)*10 - len(weak)*5))

    PLANET_HINDI_MC = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}

    # ── Lagnesh ──────────────────────────────────────────────────
    lagna_lord_code = SIGN_LORDS[lagna_rashi]
    ll_eval = jyotish_evaluation["planets"].get(lagna_lord_code, {})
    ll_str  = ll_eval.get("strength", {})
    lagnesh_obj = {
        "code":             lagna_lord_code,
        "hindi":            PLANET_HINDI_MC.get(lagna_lord_code, lagna_lord_code),
        "house":            planet_house_map.get(lagna_lord_code, 0),
        "rashi":            RASHI_HI[astro[lagna_lord_code]["Vargas"]["D1"]["Idx"]] if lagna_lord_code in astro else "",
        "strength":         int(ll_str.get("score", 50)),
        "functionalNature": "लग्नेश (सदा शुभ — 8/12 दोष नहीं लगता)",
    }

    # ── Shubh / Ashubh ────────────────────────────────────────────
    shubh_list, ashubh_list = [], []
    for pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        ev  = jyotish_evaluation["planets"].get(pc, {})
        fn  = ev.get("functional", {})
        dosh_parts = []
        if fn.get("trishadaya"):      dosh_parts.append("त्रिशडाय")
        if fn.get("badhakesh"):       dosh_parts.append("बाधकेश")
        if fn.get("maraka"):          dosh_parts.append("मारक")
        if fn.get("yogakaraka"):
            shubh_list.append({"code":pc,"hindi":PLANET_HINDI_MC[pc],"dosha":"योगकारक"})
        elif fn.get("benefic") and not fn.get("maraka"):
            shubh_list.append({"code":pc,"hindi":PLANET_HINDI_MC[pc],"dosha":" · ".join(dosh_parts) or "शुभ"})
        elif fn.get("malefic") or fn.get("trishadaya") or fn.get("badhakesh") or fn.get("maraka"):
            ashubh_list.append({"code":pc,"hindi":PLANET_HINDI_MC[pc],"dosha":" · ".join(dosh_parts) or "अशुभ"})

    # ── Risk Table ────────────────────────────────────────────────
    risk_table = []
    RISK_LABEL = lambda r: "अत्यंत उच्च" if r>=70 else ("उच्च" if r>=50 else ("मध्यम" if r>=30 else ("निम्न" if r>=15 else "न्यूनतम")))
    for pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        ev  = jyotish_evaluation["planets"].get(pc, {})
        fn  = ev.get("functional", {})
        str_score = int(ev.get("strength", {}).get("score", 50))
        risk_val  = int(ev.get("risk_score", 0))
        dosh_parts = []
        if fn.get("trishadaya"): dosh_parts.append("त्रिशडाय")
        if fn.get("badhakesh"):  dosh_parts.append("बाधकेश")
        if fn.get("maraka"):     dosh_parts.append("मारक")
        risk_table.append({
            "code":       pc,
            "hindi":      PLANET_HINDI_MC[pc],
            "house":      planet_house_map.get(pc, 0),
            "strength":   str_score,
            "risk":       risk_val,
            "riskLabel":  RISK_LABEL(risk_val),
            "dosh":       " · ".join(dosh_parts) if dosh_parts else "—",
        })

    # ── Aspect Dominance ──────────────────────────────────────────
    guru_drishti, ghatak_list = [], []
    drishti_matrix = jyotish_evaluation.get("drishti_matrix", {})
    for pc, dm_data in drishti_matrix.items():
        for asp in dm_data.get("aspects", []):
            nature = asp.get("nature","")
            if "amrit" in nature.lower() or "amrut" in nature.lower():
                guru_drishti.append(f"{PLANET_HINDI_MC.get(pc,pc)} ({planet_house_map.get(pc,0)}वें भाव से) → भाव {asp['target_house']}")
            if "ghatak" in nature.lower() or "nishtak" in nature.lower() or "axis" in nature.lower():
                ghatak_list.append(f"{PLANET_HINDI_MC.get(pc,pc)} → {asp.get('display','घातक दृष्टि')}")

    # ── Special Yogas (structured with desc) ─────────────────────
    special_yogas_list = []
    for pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        ev  = jyotish_evaluation["planets"].get(pc, {})
        str_ev = ev.get("strength", {})
        for yoga in str_ev.get("special_yogas", []):
            special_yogas_list.append({
                "planet": pc,
                "title":  yoga,
                "desc":   str_ev.get("yoga_desc", {}).get(yoga, ""),
            })

    # ── AV Turning Points — Aayु Sutra calculated here ───────────
    # Sutra: Σ(bhav 1→graha_bhav) × 7 ÷ 27 = turning year (integer)
    AGE_GROUP = lambda y: (
        "बाल्यकाल"         if y <= 12  else
        "किशोरावस्था"       if y <= 20  else
        "युवावस्था"         if y <= 30  else
        "प्रौढ़ता प्रारंभ"  if y <= 40  else
        "मध्यावस्था"        if y <= 55  else
        "परिपक्व आयु"
    )
    av_turning = []
    for pc in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        h = planet_house_map.get(pc, 0)
        if h < 1: continue
        # 🔥 FIX: Sum bhav 1 to h using houses[]["av"] (already rotated)
        av_sum = sum(houses[i]["av"] for i in range(1, h+1))
        year   = int(av_sum * 7 / 27)
        formula_str = f"Σ(1→{h})={av_sum} | {av_sum}×7={av_sum*7} | {av_sum*7}÷27 = {year}वर्ष"
        nak_index = (av_sum * 7 % 27) if (av_sum * 7 % 27) > 0 else 27
        nakshatra = NAKSHATRA[nak_index - 1]
        av_turning.append({
            "code":      pc,
            "hindi":     PLANET_HINDI_MC[pc],
            "house":     h,
            "avSum":     av_sum,
            "year":      year,
            "ageGroup":  AGE_GROUP(year),
            "formula":   formula_str,
            "nakshatra": nakshatra,
        })

    # ── AV Bhavas (12 houses) ────────────────────────────────────
    RASHI_HI_MC = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]
    av_bhavas = [
        {"n": i+1, "rashi": RASHI_HI_MC[houses[i+1]["sign_index"]], "av": houses[i+1]["av"]}
        for i in range(12)
    ]

    # ── Dasha list (full sequence with functionalNature) ─────────
    dasha_list = []
    for d in dashas:
        dc    = PLANET_CODE_MAP.get(d["planet"], "")
        d_ev  = jyotish_evaluation["planets"].get(dc, {})
        d_fn  = d_ev.get("functional", {})
        fn_parts = []
        if d_fn.get("yogakaraka"):  fn_parts.append("योगकारक")
        if d_fn.get("benefic"):     fn_parts.append("शुभ")
        if d_fn.get("malefic"):     fn_parts.append("अशुभ")
        if d_fn.get("trishadaya"):  fn_parts.append("त्रिशडाय")
        if d_fn.get("badhakesh"):   fn_parts.append("बाधकेश")
        if d_fn.get("maraka"):      fn_parts.append("मारक")
        dasha_list.append({
            "code":             dc,
            "hindi":            d["planet"],
            "start":            d["start"],
            "end":              d["end"],
            "active":           d["planet"] == current_md["planet"],
            "functionalNature": " · ".join(fn_parts) if fn_parts else "सामान्य",
        })

    master_conclusion = {
        "overallScore":      overall_score,
        "summary":           f"{'बलवान' if overall_score >= 70 else 'सामान्य'} कुंडली। योगकारक: {', '.join([PLANET_HINDI_MC.get(y,y) for y in yogas]) or 'कोई नहीं'}। उच्च जोखिम: {', '.join([PLANET_HINDI_MC.get(p,p) for p in high_risk]) or 'कोई नहीं'}।",
        "bestPeriod":        f"{current_md['planet']} – {current_ad['planet']} ({current_ad['start'][:4]}–{current_ad['end'][:4]})",
        "caution":           f"सावधान: {', '.join([PLANET_HINDI_MC.get(p,p) for p in (weak[:2] + high_risk[:1])]) or 'कोई विशेष नहीं'}",
        "lagnesh":           lagnesh_obj,
        "lagnaMeta":         {"rashi": RASHI_HI[lagna_rashi], "desc": ""},
        "shubhPlanets":      shubh_list,
        "ashubhPlanets":     ashubh_list,
        "riskTable":         risk_table,
        "aspectDominance":   {"guruDrishti": guru_drishti, "ghatak": ghatak_list},
        "specialYogas":      special_yogas_list,
        "yogakaraka":        PLANET_HINDI_MC.get(yogas[0], None) if yogas else None,
        "avTurningPoints":   av_turning,
        "avBhavas":          av_bhavas,
        "avTotal":           sum(sav_points),
        "dasha":             dasha_list,
    }

    # ── All 7 Engines (Yoga, Sutras, Saturn, Navatara, AV, Vedic, Sutras) ──
    engines_data = {}
    try:
        from engines_bridge import run_all_engines
        _pc_rev = {"सूर्य":"Su","चंद्र":"Mo","मंगल":"Ma","बुध":"Me",
                   "गुरु":"Ju","शुक्र":"Ve","शनि":"Sa","राहु":"Ra","केतु":"Ke"}
        _current_dasha_code = _pc_rev.get(current_md["planet"], "")
        engines_data = run_all_engines(
            astro              = astro,
            lagna_rashi        = lagna_rashi,
            planet_house_map   = planet_house_map,
            sav_points         = sav_points,
            current_dasha      = _current_dasha_code,
            jyotish_evaluation = jyotish_evaluation,
            dob                = dt,
            moon_degree        = astro["Mo"]["Degree"],
        )
    except Exception as _e:
        engines_data = {"error": str(_e)}

    return {
        "meta": {
            "name":      name,
            "dob":       dt.strftime("%d %B %Y"),
            "time":      dt.strftime("%I:%M %p"),
            "city":      city,
            "lagna":     RASHI_EN[lagna_rashi],
            "lagnaSign": RASHI_HI[lagna_rashi],
            "lagnaSignIdx": lagna_rashi,
            "lagnaFullDegree": round(astro["La"]["Degree"], 2),
            "lagnaRashiDegree": round(astro["La"]["Degree"] % 30, 2),
            "lagnaNakshatra": NAKSHATRA[int(astro["La"]["Degree"] / (360/27)) % 27],
            "lagnaNakshatraPada": int((astro["La"]["Degree"] % (360/27)) / (360/108)) + 1,
            "chartType": chart_type,
            "sunrise": _calc_sunrise(dt, lat, lon),
            # BTR ke liye zaroori fields
            "birth_hour":     round(dt.hour + dt.minute / 60.0, 4),
            "sunrise_hour":   6.0,   # approximate — swisseph se calculate bhi ho sakta hai
            "nakshatra_index": int(astro["Mo"]["Degree"] / (360/27)) % 27 + 1,  # 1-27
        },
        "planets":     planets_out,
        "houses":      houses_list,
        "dasha": {
            "current": {
                "mahadasha":       current_md["planet"],
                "antardasha":      current_ad["planet"],
                "pratyantara":     current_pds[0]["planet"] if current_pds else "",
                "endDate":         current_md["end"][-4:] + "-" + current_md["end"][3:5],
                "progressPercent": md_pct,
            },
            "sequence": dasha_sequence,
        },
        "drishti":          drishti_out,
        "bhavDrishti":      bhav_drishti,
        "sav":              sav_points,
        "masterConclusion": master_conclusion,
        "nadiEvents":       nadi_events,
        "nadiAiOutput":     nadi_ai_output,
        "jyotishEvaluation": {
            "yogakaraka_planets": yogas,
            "weak_planets":       weak,
            "high_risk_planets":  high_risk,
        },
        "taraMilan":         tara_milan,
        "ashtakavargaSpecial": ashtakavarga_special,
        "disease12th":       disease_12th,
        "badhakHouse":       badhak_house_num,
        "enginesData":       {**engines_data, "nadi_jyotish": nadi_jyotish_output},
        "chalit":            chalit_data,
        "bhavSandhi":        chalit_data.get("_bhavSandhi", []),
        "planetStrength":    chalit_data.get("_planetStrength", {}),
        "maitri":            maitri_data,
        "sudarshan":         sudarshan_data,
        "yearly":            yearly_data,
    }, None


# ── MAIN API ENDPOINT ────────────────────────────────────────────────────
# api.py में अन्य @app.route के साथ इसे जोड़ें
@app.route('/')
def home():
    # यह UptimeRobot को 200 OK का सिग्नल देगा
    return {"status": "online", "message": "Vedic Kundli Server is Active"}, 200
@app.route('/api/chart', methods=['POST'])
def api_chart():
    """
    POST /api/chart
    Body: { name, dob, time, city, chart_type }
    Returns: Full chart JSON consumed by React frontend
    """
    body       = request.get_json(force=True)
    name       = body.get('name', '')
    city       = body.get('city', '')
    date_str   = body.get('dob', '')
    time_str   = body.get('time', '')
    chart_type = body.get('chart_type', 'D1')
    lat        = body.get('lat')
    lon        = body.get('lon')

    if not all([name, city, date_str, time_str]):
        return jsonify({'error': 'Missing required fields: name, dob, time, city'}), 400

    result, err = _build_chart_response(name, city, date_str, time_str, chart_type, lat=lat, lon=lon)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result)


# ── FAST ROUTE — sirf chart+dasha+AV, NO engines (~0.5s) ─────────────────
@app.route('/api/chart/fast', methods=['POST'])
def api_chart_fast():
    """
    POST /api/chart/fast
    Body: { name, dob, time, city, chart_type }
    Returns: Kundali chart data WITHOUT heavy 7-engine analysis.
    enginesData = {} (empty). Frontend immediately renders chart.
    Second call /api/chart/engines fills enginesData.
    """
    body       = request.get_json(force=True)
    name       = body.get('name', '')
    city       = body.get('city', '')
    date_str   = body.get('dob', '')
    time_str   = body.get('time', '')
    chart_type = body.get('chart_type', 'D1')
    lat        = body.get('lat')
    lon        = body.get('lon')

    if not all([name, city, date_str, time_str]):
        return jsonify({'error': 'Missing required fields: name, dob, time, city'}), 400

    result, err = _build_chart_response(name, city, date_str, time_str, chart_type, lat=lat, lon=lon)
    if err:
        return jsonify({'error': err}), 400

    # Strip heavy engines data — frontend will fetch separately
    result['enginesData'] = {}
    result['_enginesReady'] = False
    return jsonify(result)


# ── ENGINES ROUTE — sirf 7 engines, chart data dobara calculate nahi ─────
@app.route('/api/chart/engines', methods=['POST'])
def api_chart_engines():
    """
    POST /api/chart/engines
    Body: { name, dob, time, city, chart_type }
    Returns: { enginesData: {...} } only.
    Frontend merges this into existing chartData.
    """
    body       = request.get_json(force=True)
    name       = body.get('name', '')
    city       = body.get('city', '')
    date_str   = body.get('dob', '')
    time_str   = body.get('time', '')
    chart_type = body.get('chart_type', 'D1')
    lat        = body.get('lat')
    lon        = body.get('lon')

    if not all([name, city, date_str, time_str]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        # Frontend se lat/lon aaya? Use karo. Warna Nominatim fallback (cached)
        if not lat or not lon:
            lat, lon = get_coordinates(city)
        if not lat or not lon:
            return jsonify({'error': f'शहर नहीं मिला: {city}'}), 400

        dt         = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        astro      = calculate_astrology(dt, lat, lon)
        sav_points = calculate_sav(astro)
        dashas     = calculate_vimshottari(astro["Mo"]["Degree"], dt)
        now        = datetime.now()

        asc_idx    = astro["La"]["Vargas"][chart_type]["Idx"]
        lagna_rashi = asc_idx
        short_names = {"Su":"सू","Mo":"चं","Ma":"मं","Me":"बु","Ju":"गु","Ve":"शु","Sa":"श","Ra":"रा","Ke":"के"}
        houses = {i: {"sign":"","sign_index":0,"planets":"","av":0} for i in range(1,13)}
        for i in range(12):
            houses[i+1]["sign_index"] = (asc_idx+i)%12
        for p_code, p_hi in short_names.items():
            p_idx = astro[p_code]["Vargas"][chart_type]["Idx"]
            h_num = (p_idx - asc_idx + 12) % 12 + 1
            if houses[h_num]["planets"]: houses[h_num]["planets"] += f", {p_hi}"
            else: houses[h_num]["planets"] = p_hi
            astro[p_code]["Dignity"] = get_dignity(p_code, p_idx)
        # 🔥 FIX: Rotate SAV to lagna-based bhav order
        # sav_points is rashi-wise (index 0 = Mesh, 1 = Vrishabh, etc.)
        # But houses are lagna-based (bhav 1 = lagna rashi)
        # So rotate: if Tula lagna (idx=6), rotate array by 6 positions
        rotated_sav = sav_points[asc_idx:] + sav_points[:asc_idx]
        for i in range(12): houses[i+1]["av"] = rotated_sav[i]

        planet_house_map = {}
        for p_code, p_hi in short_names.items():
            planet_house_map[p_code] = 0
            for h_num, house in houses.items():
                if p_hi in [p.strip() for p in house.get("planets","").split(",")]:
                    planet_house_map[p_code] = h_num; break

        current_md = dashas[0]
        for d in dashas:
            if datetime.strptime(d['start'],"%d-%m-%Y") <= now < datetime.strptime(d['end'],"%d-%m-%Y"):
                current_md = d; break

        # ── dasha inject करो astro में — engines_bridge को चाहिए ──
        # MD + AD + PD sab ke saath full sequence build karo
        _PC_MAP = {v:k for k,v in {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध",
                                    "Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}.items()}
        _dasha_seq_full = []
        for _d in dashas:
            _ads_raw = get_antardashas(_d["idx"], _d["start"])
            _antardashas = []
            for _ad in _ads_raw:
                _pds_raw = get_pratyantardashas(_d["idx"], _ad["idx"], _ad["start"])
                _antardashas.append({
                    "lord":  _ad["planet"],
                    "start": _ad["start"],
                    "end":   _ad["end"],
                    "pratyantardashas": [
                        {"lord": _pd["planet"], "start": _pd["start"], "end": _pd["end"]}
                        for _pd in _pds_raw
                    ],
                })
            _dasha_seq_full.append({
                "lord":        _d["planet"],
                "start":       _d["start"],
                "end":         _d["end"],
                "antardashas": _antardashas,
            })
        astro["dasha"] = {"sequence": _dasha_seq_full, "timeline": _dasha_seq_full}

        jyotish_evaluation = generate_planet_evaluation_report(astro, houses, lagna_rashi)

        _pc_rev = {"सूर्य":"Su","चंद्र":"Mo","मंगल":"Ma","बुध":"Me",
                   "गुरु":"Ju","शुक्र":"Ve","शनि":"Sa","राहु":"Ra","केतु":"Ke"}
        _current_dasha_code = _pc_rev.get(current_md["planet"], "")

        from engines_bridge import run_all_engines
        engines_data = run_all_engines(
            astro              = astro,
            lagna_rashi        = lagna_rashi,
            planet_house_map   = planet_house_map,
            sav_points         = sav_points,
            current_dasha      = _current_dasha_code,
            jyotish_evaluation = jyotish_evaluation,
            dob                = dt,
            moon_degree        = astro["Mo"]["Degree"],
        )

        # ── Nadi Jyotish Engine ───────────────────────────────────────
        nadi_jyotish_output = {}
        try:
            if _NADI_JYOTISH_AVAILABLE:
                _CODE_MAP = {
                    "Su": "SUN", "Mo": "MOON", "Ma": "MARS",
                    "Me": "MERCURY", "Ju": "JUPITER", "Ve": "VENUS",
                    "Sa": "SATURN", "Ra": "RAHU", "Ke": "KETU"
                }
                _planets_for_nadi = {}
                for short, full in _CODE_MAP.items():
                    if short in astro:
                        p = astro[short]
                        sign_1based = (p["Vargas"]["D1"]["Idx"] % 12) + 1
                        _planets_for_nadi[full] = {
                            "sign":       sign_1based,
                            "degree":     round(p.get("SignDegree", p["Degree"] % 30), 2),
                            "retrograde": bool(p.get("Retrograde", False)),
                            "combust":    bool(p.get("Combust", False)),
                        }
                _lagna_for_nadi = (lagna_rashi % 12) + 1
                _gender = body.get("gender", "MALE").upper()
                nadi_jyotish_output = run_nadi_jyotish(
                    planets_data = _planets_for_nadi,
                    lagna        = _lagna_for_nadi,
                    gender       = _gender,
                    birth_year   = dt.year,
                    current_year = datetime.now().year,
                )
        except Exception as _ne:
            print("Nadi Jyotish Engine Error (engines route):", _ne)
            nadi_jyotish_output = {"error": str(_ne)}

                # ── KP BTR Engine ─────────────────────────────────────────
        kp_btr_data = {}
        try:
            from kp_btr_engine import compute_kp_btr_full
            kp_btr_data = compute_kp_btr_full(astro)
            print(f"[KP BTR] ✅ {kp_btr_data.get('final_verdict','computed')}")
        except Exception as _kp_e:
            print(f"[KP BTR] Error: {_kp_e}")
            kp_btr_data = {"computed": False, "error": str(_kp_e)}

        return jsonify({'enginesData': {**engines_data, 'nadi_jyotish': nadi_jyotish_output, 'kp_btr': kp_btr_data}, '_enginesReady': True})

    except Exception as e:
        import traceback
        print(f"[ENGINES ROUTE 500] {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'enginesData': {}, '_enginesReady': False}), 500


# ── LEGACY / HELPER ROUTES (from original app.py) ───────────────────────
@app.route('/api/dashas_for_year', methods=['POST'])
def get_dashas_for_year_route():
    data = request.get_json()
    year          = int(data['year'])
    birth_date    = datetime.strptime(data['birth_date'], "%Y-%m-%d")
    moon_degree   = float(data['moon_degree'])
    dashas        = get_all_dashas_for_year(moon_degree, birth_date, year)
    return jsonify({
        'year': year, 'count': len(dashas),
        'dashas': [{'mahadasha':d['mahadasha'],'antardasha':d['antardasha'],
                    'pratyantardasha':d['pratyantardasha'],
                    'start_date':d['start'].isoformat(),'end_date':d['end'].isoformat()} for d in dashas]
    })

@app.route('/api/dasha_alignment', methods=['POST'])
def search_dasha_alignment_route():
    data          = request.get_json()
    birth_date    = datetime.strptime(data['birth_date'], "%Y-%m-%d")
    moon_degree   = float(data['moon_degree'])
    search_criteria = data['search_criteria']
    matches       = search_dasha_alignments(moon_degree, birth_date, search_criteria)
    return jsonify({
        'count': len(matches),
        'matches': [{'mahadasha':m['mahadasha'],'antardasha':m['antardasha'],
                     'pratyantardasha':m['pratyantardasha'],
                     'start_date':m['start_date'].isoformat(),'end_date':m['end_date'].isoformat(),
                     'duration_days':m['duration_days']} for m in matches]
    })

@app.route('/api/cities', methods=['GET'])
def cities_autocomplete():
    q = request.args.get('q', '')
    if len(q) < 2:
        return jsonify([])
    try:
        url  = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=5&addressdetails=1"
        resp = http_requests.get(url, headers={'User-Agent':'KundliApp/5.0'}, timeout=5).json()
        return jsonify([{'name':r.get('display_name',''),'lat':r['lat'],'lon':r['lon']} for r in resp])
    except Exception:
        return jsonify([])
    

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '2.0', 'engine': 'NadiJyotish'})




# ── YEARLY PREDICTION ROUTE ───────────────────────────────────────────────
@app.route('/api/yearly', methods=['POST'])
def api_yearly():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        age       = data.get("age")
        sudarshan = data.get("sudarshan")
        chart     = data.get("chart", {})

        if not age or not sudarshan:
            return jsonify({"error": "Missing required fields: age, sudarshan"}), 400

        age = int(age)
        if age < 1 or age > 120:
            return jsonify({"error": "Age must be between 1 and 120"}), 400

        # houses frontend से array आती है: [{num:1, sign_index:4,...}, ...]
        # yearly_engine को dict चाहिए: {1: {sign_index:4,...}, ...}
        houses = {}
        raw_houses = chart.get("houses", [])
        if isinstance(raw_houses, list):
            for h in raw_houses:
                try:
                    houses[int(h["num"])] = h
                except (KeyError, TypeError, ValueError):
                    pass
        elif isinstance(raw_houses, dict):
            for k, v in raw_houses.items():
                try:
                    houses[int(k)] = v
                except (ValueError, TypeError):
                    pass

        result = get_yearly_prediction(age, sudarshan, houses)
        return jsonify({"success": True, **result})

    except ValueError:
        return jsonify({"error": "Invalid age value"}), 400
    except Exception as e:
        print(f"[Yearly Route Error]: {e}")
        return jsonify({"error": str(e)}), 500


# ── ENTRY POINT ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, port=5001)