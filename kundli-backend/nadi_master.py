import math
from datetime import datetime, timedelta
import swisseph as swe

# ==========================================
# 🌟 CONFIGURATION & CONSTANTS
# ==========================================
SIGN_LORDS = {
    0: "Ma", 1: "Ve", 2: "Me", 3: "Mo", 4: "Su", 5: "Me", 
    6: "Ve", 7: "Ma", 8: "Ju", 9: "Sa", 10: "Sa", 11: "Ju"
}

PLANET_NAMES_HI = {
    "Su": "सूर्य", "Mo": "चंद्र", "Ma": "मंगल", "Me": "बुध", 
    "Ju": "गुरु", "Ve": "शुक्र", "Sa": "शनि", "Ra": "राहु", "Ke": "केतु", "La": "लग्न"
}

DASHA_YEARS = {
    "Su": 6, "Mo": 10, "Ma": 7, "Ra": 18, "Ju": 16, 
    "Sa": 19, "Me": 17, "Ke": 7, "Ve": 20
}

AVASTHA_RESULTS = {
    1: "स्नान (सफलता, शुद्धि, नई शुरुआत) ✅ शुभ",
    2: "वस्त्र धारण (आभूषण, धन प्राप्ति) ✅ शुभ",
    3: "मोदक / गन्ध (विजय, सुगन्ध, कीर्ति) ✅ शुभ",
    4: "पुष्प / श्रृंगार (संपत्ति प्राप्ति, खुशी) ✅ शुभ",
    5: "प्रार्थना (मान-सम्मान की प्राप्ति) 🔸 मध्यम",
    6: "पूजा (सम्मान वृद्धि) ✅ शुभ",
    7: "यज्ञारम्भ (पिता/गुरु को कष्ट, धार्मिक व्यय) ⚠️ अशुभ",
    8: "प्रभु ध्यान (कार्यसिद्धि, सफलता) ✅ शुभ",
    9: "उपदेश (ज्ञान वृद्धि, उदारता) ✅ शुभ",
    10: "प्रदक्षिणा (पेट रोग, व्यर्थ की भागदौड़) ❌ अशुभ",
    11: "भावना (सफलता, मनोरथ पूर्ति) ✅ शुभ",
    12: "अतिथि सत्कार (जीवन स्तर में वृद्धि) ✅ शुभ",
    13: "भोजन (लाभ, सफलता, तृप्ति) ✅ शुभ",
    14: "जल सेवा (भोजन/रस में बाधा, रोग) ❌ अशुभ",
    15: "क्रोध (अपयश, बदनामी) ❌ अशुभ",
    16: "ताम्बूल (धन वृद्धि, विलासिता) ✅ शुभ",
    17: "वसति (धन लाभ, संपत्ति) ✅ शुभ",
    18: "राजपत्ति / मुकुट (राजपद, प्रमोशन, बड़ा पद) 👑 राजयोग",
    19: "मंत्र / निद्रा (आलस, कार्य में देरी) 🔸 मध्यम",
    20: "विलाप (हानि, रोना, दुख) ❌ अशुभ",
    21: "निद्रा / रोग (रोग, क्रोध, अस्पताल) ❌ अशुभ",
    22: "मद्यपान (नरक तुल्य कष्ट, पतन) 💀 क्रिटिकल",
    23: "मिष्ठान भोजन (विजय, सेलिब्रेशन) 🏆 सुपर शुभ",
    24: "धन आगमन (लाभ, पैसा आना) ✅ शुभ",
    25: "किरीट धारण (धन और सम्मान) 👑 राजयोग",
    26: "शयन (रोग, सुस्ती, हानि) ❌ अशुभ",
    27: "रति (दुश्मनी, हानि, व्यर्थ के झगड़े) ❌ अशुभ",
    0: "रति (दुश्मनी, हानि, व्यर्थ के झगड़े) ❌ अशुभ" 
}

# ==========================================
# 🛠️ HELPER FUNCTIONS (दूरी, उम्र और त्रिकोण)
# ==========================================
def calculate_distance_age(source_deg, target_deg):
    """ मूल दूरी (Target - Source) % 360 """
    dist = (target_deg - source_deg) % 360
    if dist < 0: dist += 360
    return (dist * 60) / 200.0

def apply_trine_logic(base_age):
    """ 
    🌟 नाड़ी त्रिकोण सिद्धांत 🌟
    अगर उम्र 18 से कम या 70 से ज्यादा है, तो त्रिकोण दृष्टि (36, 54, 72) लगाकर प्रैक्टिकल उम्र निकालना 
    """
    offsets = [0, -72, -54, -36, 36, 54, 72]
    valid_ages = []
    
    for offset in offsets:
        age = base_age + offset
        if 18 <= age <= 70:
            valid_ages.append((age, offset))
            
    if not valid_ages:
        return base_age, 0
        
    # जो उम्र जीवन के सबसे सक्रिय समय (लगभग 30-35 वर्ष) के सबसे करीब हो, उसे प्राथमिकता दें
    best_age = min(valid_ages, key=lambda x: abs(x[0] - 32))
    return best_age[0], best_age[1]

def decimal_to_ymd(age_decimal):
    y = int(age_decimal)
    total_days = (age_decimal - y) * 365.25
    m = int(total_days // 30.4375)
    d = int(total_days % 30.4375)
    return y, m, d

def calculate_event_date(dob_obj, age_decimal):
    return dob_obj + timedelta(days=(age_decimal * 365.25))

# ==========================================
# 🛠️ DASHA AVASTHA & BHRIGU BINDU
# ==========================================
def get_dasha_avastha(lagna_sign_num, planet_sign_num, planet_code):
    if planet_code not in DASHA_YEARS: return "N/A"
    d_years = DASHA_YEARS[planet_code]
    math_val = (lagna_sign_num + planet_sign_num) * 2 * d_years
    rem = math_val % 27
    code = rem if rem != 0 else 27
    return f"[{code}] {AVASTHA_RESULTS.get(code, 'अज्ञात')}"

def validate_event_via_transit(event_date_obj, bb_deg):
    try:
        jd = swe.julday(event_date_obj.year, event_date_obj.month, event_date_obj.day, 12.0)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        ju_transit_deg, _ = swe.calc_ut(jd, swe.JUPITER, swe.FLG_SIDEREAL)
        sa_transit_deg, _ = swe.calc_ut(jd, swe.SATURN, swe.FLG_SIDEREAL)
        
        ju_diff = abs((ju_transit_deg[0] - bb_deg + 180) % 360 - 180)
        sa_diff = abs((sa_transit_deg[0] - bb_deg + 180) % 360 - 180)
        
        if ju_diff <= 10 or abs(ju_diff - 120) <= 10 or abs(ju_diff - 240) <= 10 or abs(ju_diff - 180) <= 10:
            return "✅ Confirmed: गुरु गोचर द्वारा सत्यापित (महा-सफलता पक्की)"
        elif sa_diff <= 10:
            return "⚠️ Alert: शनि गोचर द्वारा सत्यापित (भारी कष्ट/संघर्ष पक्का)"
        return "⚪ सामान्य प्रभाव (गोचर का विशेष ट्रिगर नहीं)"
    except Exception:
        return "⚪ गोचर गणना उपलब्ध नहीं"

# ==========================================
# 🚀 CORE NADI MASTER ENGINE
# ==========================================
def run_master_analysis(astro_data, dob_str):
    dob_obj = datetime.strptime(dob_str, "%Y-%m-%d")
    events = []
    
    lagna_deg = astro_data["La"]["Degree"]
    lagna_sign = astro_data["La"]["Vargas"]["D1"]["Idx"] + 1
    moon_deg = astro_data["Mo"]["Degree"]
    rahu_deg = astro_data["Ra"]["Degree"]
    
    # भृगु बिंदु (BB)
    bb_deg = ((rahu_deg + moon_deg) % 360) / 2.0
    
    # ---------------------------------------------------------
    # 🛑 64वां नवांश (मृत्यु / बड़ा परिवर्तन)
    # ---------------------------------------------------------
    d9_lagna_idx = astro_data["La"]["Vargas"]["D9"]["Idx"]
    khara_lord_code = SIGN_LORDS[(d9_lagna_idx + 3) % 12]
    khara_deg = astro_data[khara_lord_code]["Degree"]
    khara_sign = astro_data[khara_lord_code]["Vargas"]["D1"]["Idx"] + 1
    
    base_age = calculate_distance_age(0.0, khara_deg)
    # 64वें नवांश में त्रिकोण नियम नहीं लगाते, क्योंकि यह मेष से फिक्स होता है (Indira Gandhi Case)
    y, m, d = decimal_to_ymd(base_age)
    ev_date = calculate_event_date(dob_obj, base_age)
    
    events.append({
        "Mode": f"मेष (0°) से दूरी (64वां नवांश: {PLANET_NAMES_HI[khara_lord_code]})",
        "Event": "⚠️ मृत्यु तुल्य कष्ट / जीवन का बड़ा बदलाव",
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, khara_sign, khara_lord_code),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })
    
    # ---------------------------------------------------------
    # 🎯 MODE 1: अश्विनी (मेष 0°) से दूरी (Standard Mode)
    # ---------------------------------------------------------
    # राहु से दुर्घटना 
    base_age = calculate_distance_age(0.0, rahu_deg)
    prac_age, offset = apply_trine_logic(base_age)
    y, m, d = decimal_to_ymd(prac_age)
    ev_date = calculate_event_date(dob_obj, prac_age)
    events.append({
        "Mode": f"मेष (0°) से राहु की दूरी (Mode 1)",
        "Event": "🤕 अचानक एक्सीडेंट / धोखा / भारी संघर्ष" + (f" (त्रिकोण {offset})" if offset != 0 else ""),
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, astro_data["Ra"]["Vargas"]["D1"]["Idx"] + 1, "Ra"),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })
    
    # चंद्र से करियर वापसी/प्रॉपर्टी
    base_age = calculate_distance_age(0.0, moon_deg)
    prac_age, offset = apply_trine_logic(base_age)
    y, m, d = decimal_to_ymd(prac_age)
    ev_date = calculate_event_date(dob_obj, prac_age)
    events.append({
        "Mode": f"मेष (0°) से चंद्र की दूरी (Mode 1)",
        "Event": "🏡 संपत्ति प्राप्ति / करियर में वापसी" + (f" (त्रिकोण {offset})" if offset != 0 else ""),
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, astro_data["Mo"]["Vargas"]["D1"]["Idx"] + 1, "Mo"),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })

    # ---------------------------------------------------------
    # 💍 MODE 2: ग्रह से ग्रह की दूरी (Yoga / Special Event)
    # ---------------------------------------------------------
    # गुरु से चंद्र (विवाह / महा-सफलता) -> 92 साल वाला फिक्स यहीं है!
    ju_deg = astro_data["Ju"]["Degree"]
    base_age = calculate_distance_age(ju_deg, moon_deg)
    prac_age, offset = apply_trine_logic(base_age)
    y, m, d = decimal_to_ymd(prac_age)
    ev_date = calculate_event_date(dob_obj, prac_age)
    events.append({
        "Mode": f"गुरु से चंद्र की दूरी (Mode 2: Special Yoga)",
        "Event": "💍 विवाह / महा-सफलता (Breakthrough)" + (f" (त्रिकोण {offset} वर्ष)" if offset != 0 else ""),
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, astro_data["Mo"]["Vargas"]["D1"]["Idx"] + 1, "Mo"),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })

    # ---------------------------------------------------------
    # 👑 MODE 3: ग्रह से लग्न की दूरी (Status / Career Mode)
    # ---------------------------------------------------------
    # दशमेश से लग्न
    tenth_lord_idx = (astro_data["La"]["Vargas"]["D1"]["Idx"] + 9) % 12
    tenth_lord_code = SIGN_LORDS[tenth_lord_idx]
    tenth_lord_deg = astro_data[tenth_lord_code]["Degree"]
    
    base_age = calculate_distance_age(tenth_lord_deg, lagna_deg)
    prac_age, offset = apply_trine_logic(base_age)
    y, m, d = decimal_to_ymd(prac_age)
    ev_date = calculate_event_date(dob_obj, prac_age)
    events.append({
        "Mode": f"दशमेश ({PLANET_NAMES_HI[tenth_lord_code]}) से लग्न की दूरी (Mode 3)",
        "Event": "🚀 राजनीति या करियर में बड़ा पद" + (f" (त्रिकोण {offset})" if offset != 0 else ""),
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, astro_data[tenth_lord_code]["Vargas"]["D1"]["Idx"] + 1, tenth_lord_code),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })

    # ---------------------------------------------------------
    # 🧠 MODE 4: चंद्र से ग्रह की दूरी (Mental/Physical Impact)
    # ---------------------------------------------------------
    # चंद्र से शनि (मानसिक तनाव)
    sa_deg = astro_data["Sa"]["Degree"]
    base_age = calculate_distance_age(moon_deg, sa_deg)
    prac_age, offset = apply_trine_logic(base_age)
    y, m, d = decimal_to_ymd(prac_age)
    ev_date = calculate_event_date(dob_obj, prac_age)
    events.append({
        "Mode": "चंद्र से शनि की दूरी (Mode 4)",
        "Event": "🧠 मानसिक तनाव / बड़ा डिप्रेशन" + (f" (त्रिकोण {offset})" if offset != 0 else ""),
        "Age": f"{y} वर्ष, {m} माह, {d} दिन",
        "Avastha": get_dasha_avastha(lagna_sign, astro_data["Sa"]["Vargas"]["D1"]["Idx"] + 1, "Sa"),
        "Validation": validate_event_via_transit(ev_date, bb_deg)
    })
    
    return events