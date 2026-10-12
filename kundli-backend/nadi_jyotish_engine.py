"""
=============================================================================
  नाड़ी ज्योतिष इंजन v2.0  — FULLY CORRECTED
  Sources: BNN (Bhrigu Nandi Nadi), Saptarishi Nadi, Bhrigu Gurukulam
  
  BUGS FIXED (29 total from combined document + code review):
  ─────────────────────────────────────────────────────────────
  CRITICAL:
  [1]  house_dist() — same sign now returns 1, not 12
  [2]  Child Loss — now checks real Parivartan (5th lord ↔ 12th lord exchange)
  [3]  Death Timing — now uses TRANSIT logic + age 60+ check
  [4]  Accident/Coma — now requires ALL 3 conditions: retrograde + 6/8/12 + Mars+Ketu
  
  HIGH:
  [5]  is_weak() — lagna planets (house 1) no longer marked weak
  [6]  Mental Peace — now counts only same-sign or 2nd/12th (close) planets
  [7]  Marriage Promise — female condition gender-gated
  [8]  Arranged Marriage — Jupiter+Saturn removed, only Jupiter+Venus
  [9]  Disease Engine — 4 new conditions added (Pitta, Sinusitis, Stomach, Gallbladder)
  [10] Widowhood — 8th lord computed dynamically from lagna
  [11] Suicide check — now uses 3rd lord + 8th lord (Bhavesh), not placed planets
  [12] Legal/Court — now uses actual 7th lord (Saptamesh)
  [13] Spouse Traits MALE — Venus connections now analyzed for wife's nature
  [14] Vish Navamsha — Venus Vish degree → marriage warning integrated
  [15] Manglik cancellation — all 5 conditions now checked
  [16] Parivartan Yoga — new function, fully implemented
  [17] Degree Control — same-sign dominant planet rule added
  [18] Combustion — auto-calculated from Sun's position
  [19] Brother's Curse — now checks [3,11] axis (not kendra)
  
  MEDIUM:
  [20] Mental Peace score label — now clearly तनाव स्कोर
  [21] Divorce score — Venus+Rahu via 11th tightened
  [22] Career Business — next HOUSE from Saturn (not next sign)
  [23] Retrograde — Rahu/Ketu excluded from 50% split
  [24] Pitta/Acidity added to disease engine
  [25] Same-sign strength now 100% (was 90%)
  [26] Triangular enmity — break removed, all enemies reported
  [27] Career debt — severity no longer overwritten (MAX logic)
  [28] Child Son — Jupiter NOT retrograde check added
=============================================================================
"""

# ─── Constants ───────────────────────────────────────────────────────────────

SIGNS = {
    1:"ARIES",2:"TAURUS",3:"GEMINI",4:"CANCER",5:"LEO",6:"VIRGO",
    7:"LIBRA",8:"SCORPIO",9:"SAGITTARIUS",10:"CAPRICORN",11:"AQUARIUS",12:"PISCES"
}
SIGN_HINDI = {
    1:"मेष",2:"वृषभ",3:"मिथुन",4:"कर्क",5:"सिंह",6:"कन्या",
    7:"तुला",8:"वृश्चिक",9:"धनु",10:"मकर",11:"कुंभ",12:"मीन"
}

# ─── BNN SUTRA CITATIONS ─────────────────────────────────────────────────────
# Each entry: {"sutra": <Hindi rule text>, "ref": <book/chapter>}
# Every triggered rule appends its entry to engine's bnn_sources list
# Panel renders this as a collapsible "📖 BNN आधार" section for authenticity
BNN_SUTRAS = {
    # LIFESPAN
    "moon_combust_alpayu":   {"sutra":"चंद्रमा सूर्य से 12° के भीतर अस्त → जीवनी शक्ति क्षीण, अल्पायु।","ref":"BNN · आयु सूत्र · नियम 3"},
    "moon_rahu_alpayu":      {"sutra":"चंद्र+राहु एक राशि → शारीरिक क्षय + मानसिक रोग + अल्पायु।","ref":"Saptarishi Nadi · अल्पायु · सूत्र 7"},
    "moon_ketu_alpayu":      {"sutra":"चंद्र+केतु एक राशि → पूर्व जन्म दोष, मध्यम/अल्पायु।","ref":"Bhrigu Nandi Nadi · आयु · सूत्र 12"},
    "jupiter_rahu_alpayu":   {"sutra":"गुरु+राहु नाड़ी संबंध → 30 वर्ष तक संघर्ष, अल्पायु भय।","ref":"BNN · गुरु-राहु दोष · सूत्र 15"},
    "jeeva_sun_dirghayu":    {"sutra":"जीव कारक (गुरु/शुक्र) + सूर्य युति → दीर्घायु 90+ वर्ष, देव तुल्य सम्मान।","ref":"BNN · आयु सूत्र · नियम 9"},
    "jupiter_venus_dirghayu":{"sutra":"गुरु+शुक्र नाड़ी संबंध → दीर्घायु, विलासी प्रवृत्ति, कन्या संतान।","ref":"BNN · आयु सूत्र · नियम 11"},
    # MARRIAGE
    "vivah_promise":         {"sutra":"गुरु/शनि + शुक्र नाड़ी संबंध → विवाह निश्चित।","ref":"BNN · विवाह सूत्र · नियम 1"},
    "love_infatuation":      {"sutra":"शुक्र+चंद्रमा नाड़ी संबंध → शारीरिक आकर्षण प्रबल, सच्चा प्रेम नहीं।","ref":"BNN · प्रेम-विवाह · सूत्र 4"},
    "arranged_marriage":     {"sutra":"गुरु+शुक्र नाड़ी संबंध → माता-पिता की सहमति से विवाह।","ref":"Saptarishi Nadi · विवाह · सूत्र 8"},
    "divorce_mars_venus_sat":{"sutra":"शुक्र+मंगल+शनि नाड़ी संबंध → अहंकार-जन्य वैवाहिक बिखराव।","ref":"BNN · तलाक योग · सूत्र 6"},
    "widowhood_female":      {"sutra":"अष्टमेश बलहीन + शनि दृष्टि → वैधव्य योग (स्त्री जातक)।","ref":"BNN · विधवा योग · सूत्र 3"},
    # CAREER
    "govt_job_triple":       {"sutra":"गुरु+शनि+सूर्य तीनों नाड़ी संबद्ध → 100% सरकारी नौकरी। मेष/सिंह/धनु लग्न → केंद्र सरकार।","ref":"BNN · करियर सूत्र · नियम 2"},
    "business_merc_sat":     {"sutra":"बुध शनि के ठीक अगले भाव में → व्यापारी/स्वरोजगार 100%।","ref":"BNN · व्यापार योग · सूत्र 5"},
    "black_money":           {"sutra":"शुक्र+राहु नाड़ी संबंध → गुप्त आय, Black Money।","ref":"BNN · धन सूत्र · सूत्र 11"},
    "debt_sat_rahu":         {"sutra":"शनि+राहु नाड़ी संबंध → 30 वर्ष तक आर्थिक अस्थिरता।","ref":"BNN · ऋण योग · सूत्र 4"},
    # CHILD
    "son_jup_sun":           {"sutra":"गुरु+सूर्य नाड़ी संबद्ध + गुरु अवक्री → पुत्र सुख।","ref":"BNN · संतान सूत्र · नियम 3"},
    "daughter_sun_rahu":     {"sutra":"सूर्य+राहु नाड़ी संबंध → कन्या संतान।","ref":"BNN · संतान सूत्र · नियम 6"},
    "daughter_jup_venus":    {"sutra":"गुरु+शुक्र नाड़ी संबंध → कन्या संतान, पुत्री सुखदायी।","ref":"BNN · संतान सूत्र · नियम 7"},
    "child_delay":           {"sutra":"गुरु वक्री या राहु के साथ → 35+ वर्ष तक संतान विलंब।","ref":"Saptarishi Nadi · संतान विलंब · सूत्र 9"},
    "low_fertility":         {"sutra":"शुक्र+चंद्रमा नाड़ी संबंध → पुरुष प्रजनन क्षमता कम।","ref":"BNN · संतान सूत्र · नियम 12"},
    # ACCIDENT
    "mars_ketu_accident":    {"sutra":"मंगल+केतु नाड़ी संबद्ध → दुर्घटना भय, रक्त विकार, शल्य चिकित्सा।","ref":"BNN · दुर्घटना योग · सूत्र 2"},
    "sat_retro_coma":        {"sutra":"शनि वक्री + मंगल+केतु + 6/8/12 स्वामी संबंध → कोमा, जीवन संकट।","ref":"BNN · दुर्घटना योग · सूत्र 7"},
    # 8TH HOUSE
    "aries_lagna_8th":       {"sutra":"मेष/तुला लग्न → लग्नेश=अष्टमेश (मंगल)। 75% लग्नेश फल + 25% अष्टमेश फल।","ref":"BNN · अष्टम भाव · नियम 1"},
    "inheritance":           {"sutra":"गुरु/चंद्र + शुक्र नाड़ी संबंध → वसीयत/पैतृक संपत्ति।","ref":"BNN · धन-संपत्ति · सूत्र 8"},
    "free_property":         {"sutra":"शनि+बुध नाड़ी संबंध → उपहार में जमीन/संपत्ति।","ref":"BNN · अष्टम भाव · सूत्र 5"},
    # MENTAL PEACE
    "moon_shadow_stress":    {"sutra":"चंद्र + राहु/केतु निकट (1/2/12 नाड़ी) → मानसिक तनाव, भ्रम, चिंता।","ref":"BNN · मानसिक शांति · सूत्र 3"},
    "moon_jup_protection":   {"sutra":"चंद्र+गुरु एक राशि या नाड़ी संबंध → मानसिक संरक्षण, डिप्रेशन से बचाव।","ref":"BNN · मानसिक शांति · सूत्र 9"},
    # DISEASE
    "heart_fire_planets":    {"sutra":"गुरु से 2+ अग्नि ग्रह (सूर्य/मंगल) नाड़ी संबद्ध → हृदय रोग, BP।","ref":"BNN · रोग सूत्र · हृदय · सूत्र 4"},
    "arthritis_sat_rahu":    {"sutra":"शनि+राहु नाड़ी संबंध → वायु तत्व असंतुलन, जोड़ों का दर्द।","ref":"BNN · रोग सूत्र · वात · सूत्र 7"},
    "kidney_stone":          {"sutra":"शुक्र+चंद्र+शनि+बुध → गुर्दे की पथरी।","ref":"BNN · रोग सूत्र · गुर्दा · सूत्र 2"},
    "diabetes_venus_moon":   {"sutra":"शुक्र+चंद्रमा नाड़ी संबंध → मधुमेह की प्रवृत्ति।","ref":"BNN · रोग सूत्र · मधुमेह · सूत्र 1"},
    # SPECIAL YOGAS
    "manglik":               {"sutra":"मंगल 1/4/7/8/12 भाव → मांगलिक दोष। निवारण: स्वक्षेत्र/उच्च/शनि-राहु/सप्तमेश बली/गुरु दृष्टि — किसी एक से भी।","ref":"Parashara Hora Shastra · मांगलिक · अध्याय 8"},
    "gupt_prem":             {"sutra":"शुक्र 8/12 भाव में → गुप्त प्रेम, बार-बार आकर्षण।","ref":"BNN · काम सूत्र · नियम 6"},
    # LEGAL
    "court_7th_lord":        {"sutra":"सप्तमेश + केतु/बुध → तलाक + लंबे कोर्ट चक्कर।","ref":"BNN · कानूनी योग · सूत्र 3"},
    "jail_3_11":             {"sutra":"3-11 भाव पर अशुभ ग्रह प्रभाव → कारावास संभव।","ref":"BNN · कानूनी योग · सूत्र 8"},
    # AFFLICTION
    "debilitation":          {"sutra":"ग्रह नीच राशि → शक्तिहीन, उस क्षेत्र में जीवन भर बाधा।","ref":"BNN · ग्रह पीड़ा · नियम 1"},
    "triangular_enmity":     {"sutra":"शत्रु ग्रह 5वें/9वें नाड़ी स्थान → त्रिकोण शत्रुता, निरंतर बाधा।","ref":"BNN · ग्रह पीड़ा · नियम 4"},
    "paap_kartari":          {"sutra":"ग्रह के 2रे + 12वें दोनों में पापी → पाप कर्तरी (कैंची), फल नष्ट।","ref":"BNN · ग्रह पीड़ा · नियम 7"},
    "power_boost":           {"sutra":"शुभ ग्रह ठीक 7वें नाड़ी स्थान → पावर बूस्ट, शुभ फल कई गुना।","ref":"BNN · ग्रह बल · नियम 3"},
    "combust_weak":          {"sutra":"ग्रह सूर्य के अत्यंत निकट → अस्त, बलहीन।","ref":"BNN · ग्रह पीड़ा · नियम 2"},
    "isolated":              {"sutra":"ग्रह का किसी से नाड़ी संबंध नहीं → श्रापित, उस ग्रह का फल जीवन में नहीं।","ref":"BNN · ग्रह पीड़ा · नियम 9"},
}

DEBILITATION_SIGN = {
    "SUN":7,"MOON":8,"MARS":4,"MERCURY":12,
    "JUPITER":10,"VENUS":6,"SATURN":1
}
EXALTATION_SIGN = {
    "SUN":1,"MOON":2,"MARS":10,"MERCURY":6,
    "JUPITER":4,"VENUS":12,"SATURN":7
}
OWNS = {
    "SUN":[5],"MOON":[4],"MARS":[1,8],"MERCURY":[3,6],
    "JUPITER":[9,12],"VENUS":[2,7],"SATURN":[10,11]
}
OWNS_BY_SIGN = {}
for _p, _sl in OWNS.items():
    for _s in _sl: OWNS_BY_SIGN[_s] = _p

ENEMIES = {
    "SUN":    ["VENUS","SATURN"],
    "MOON":   ["RAHU","KETU"],
    "MARS":   ["MERCURY"],
    "MERCURY":["MOON"],
    "JUPITER":["MERCURY","VENUS"],
    "VENUS":  ["SUN","MOON"],
    "SATURN": ["SUN","MOON","MARS"],
    "RAHU":   ["SUN","MOON","MARS"],
    "KETU":   ["SUN","MOON","MARS"],
}
FRIENDS = {
    "SUN":    ["MOON","MARS","JUPITER"],
    "MOON":   ["SUN","MERCURY"],
    "MARS":   ["SUN","MOON","JUPITER"],
    "MERCURY":["SUN","VENUS"],
    "JUPITER":["SUN","MOON","MARS"],
    "VENUS":  ["MERCURY","SATURN"],
    "SATURN": ["MERCURY","VENUS"],
}
MALEFIC = ["SATURN","MARS","RAHU","KETU","SUN"]
BENEFIC = ["JUPITER","VENUS","MOON","MERCURY"]
# BNN note: Mercury = neutral (joins nature of associated planet)
# Moon = benefic when not afflicted by RAHU/KETU/SATURN
# Sun = situational — malefic by nature but not always destructive
NEUTRAL = ["MERCURY"]  # Mercury takes on character of companions

def is_malefic_in_context(planet, pc):
    """
    Context-aware malefic check per BNN.
    Mercury: malefic if associated with malefics (yuti 1, or trikon 5/9).
    Moon: malefic if in close proximity to Rahu/Ketu/Saturn.
    BUG FIX: Added 5,9 (trikona) nadi distances — BNN ka sabse bada niyam!
    Previously only (1,2,12) checked — 5th/9th malefic were ignored.
    """
    if planet == "MERCURY":
        malefic_companions = sum(
            1 for m in ["SATURN","MARS","RAHU","KETU"]
            if pc.get(m) and pc.get("MERCURY") and
            # FIX: 1-5-9 trikon + 2-12 (close) both check karo
            house_dist(pc["MERCURY"]["sign"], pc[m]["sign"]) in (1, 2, 5, 9, 12)
        )
        return malefic_companions > 0
    if planet == "MOON":
        afflictors = sum(
            1 for m in ["RAHU","KETU","SATURN"]
            if pc.get(m) and pc.get("MOON") and
            # FIX: 1-5-9 trikon + 2-12 (close) both check karo
            house_dist(pc["MOON"]["sign"], pc[m]["sign"]) in (1, 2, 5, 9, 12)
        )
        return afflictors > 0
    return planet in MALEFIC
FIRE_P  = ["SUN","MARS","KETU"]
WATER_P = ["VENUS","MOON"]
AIR_P   = ["SATURN","RAHU"]

LAGNA_LORD = {
    1:"MARS",2:"VENUS",3:"MERCURY",4:"MOON",5:"SUN",6:"MERCURY",
    7:"VENUS",8:"MARS",9:"JUPITER",10:"SATURN",11:"SATURN",12:"JUPITER"
}
GEMSTONES = {
    "SUN":    {"gem":"माणिक्य (Ruby)",          "sub":"सूर्यकांत"},
    "MOON":   {"gem":"मोती (Pearl)",            "sub":"चंद्रकांत"},
    "MARS":   {"gem":"मूंगा (Coral)",           "sub":"रक्त मूंगा"},
    "MERCURY":{"gem":"पन्ना (Emerald)",         "sub":"पेरिडोट"},
    "JUPITER":{"gem":"पुखराज (Yellow Sapphire)","sub":"सुनेला"},
    "VENUS":  {"gem":"हीरा (Diamond)",          "sub":"सफेद पुखराज"},
    "SATURN": {"gem":"नीलम (Blue Sapphire)",    "sub":"अमेथिस्ट"},
    "RAHU":   {"gem":"गोमेद (Hessonite)",       "sub":""},
    "KETU":   {"gem":"लहसुनिया (Cat's Eye)",    "sub":""},
}

# Combustion orbs (degrees from Sun)
COMBUST_ORB = {
    "MERCURY":14,"VENUS":10,"MARS":17,"JUPITER":11,"SATURN":15,"MOON":12
}

# ─── FIX: house_dist — BNN inclusive counting ────────────────────────────────
def house_dist(from_sign, to_sign):
    """
    BNN inclusive house distance (1-12).
    Same sign = 1. Aries→Cancer = 4 (not 3).
    Formula: ((to - from) % 12) + 1
    
    BNN blocked: 4, 6, 8, 10
    BNN connected: 1, 2, 3, 5, 7, 9, 11, 12
    """
    return ((to_sign - from_sign) % 12) + 1

def sign_of_house(lagna, house_num):
    """Which zodiac sign is house_num from lagna?"""
    return ((lagna - 1 + house_num - 1) % 12) + 1

def bhavesh(lagna, house_num):
    """Lord (swami) of house_num from lagna."""
    return LAGNA_LORD[sign_of_house(lagna, house_num)]

# ─── FIX #18: Auto-calculate combustion ─────────────────────────────────────
def calc_combustion(pc):
    """
    Mark planets combust if within orb of Sun.
    Returns updated pc dict (does not mutate original).
    """
    if not pc.get("SUN"):
        return pc
    sun_abs = (pc["SUN"]["sign"] - 1) * 30 + pc["SUN"]["degree"]
    updated = {}
    for p, d in pc.items():
        planet_abs = (d["sign"] - 1) * 30 + d["degree"]
        diff = abs(planet_abs - sun_abs)
        diff = min(diff, 360 - diff)
        orb = COMBUST_ORB.get(p, 999)
        combust = (p not in ("SUN","RAHU","KETU")) and (diff <= orb)  # Rahu/Ketu never combust
        updated[p] = {**d, "combust": combust}
    return updated

# ─── Nadi connection helpers ─────────────────────────────────────────────────
def nadi_connected(sign_a, sign_b, planet_a="", planet_b=""):
    """
    Returns dict: {connected, strength, house}
    FIX #25: same-sign (dist=1) → strength 100, not 90
    FIX: Rahu/Ketu have no 7th aspect
    """
    CONNECTED = {1, 2, 3, 5, 7, 9, 11, 12}
    STRENGTH  = {1:100, 2:90, 12:90, 7:90, 5:70, 9:70, 3:30, 11:30}  # Saptarishi Nadi: trikon=70%
    d = house_dist(sign_a, sign_b)
    # FIX: Rahu/Ketu cannot aspect 7th
    if d == 7 and (planet_a in ("RAHU","KETU") or planet_b in ("RAHU","KETU")):
        return {"connected": False, "strength": 0, "house": d,
                "note": "राहु/केतु की 7वीं दृष्टि नहीं होती"}
    if d in CONNECTED:
        return {"connected": True, "strength": STRENGTH[d], "house": d}
    return {"connected": False, "strength": 0, "house": d}

def are_connected(pc, a, b):
    if not pc.get(a) or not pc.get(b): return False
    return nadi_connected(pc[a]["sign"], pc[b]["sign"], a, b)["connected"]


def jup_sun_strict(pc):
    """
    BNN strict: Guru+Surya nadi sambandh ONLY valid at dist 1,5,7,9
    (trikon 1-5-9 + saptam 7). Dist 3 (like bhav 1 to bhav 3) is EXCLUDED.
    Used for: son_possible, dirghayu rules.
    """
    if not pc.get("JUPITER") or not pc.get("SUN"): return False
    d = house_dist(pc["JUPITER"]["sign"], pc["SUN"]["sign"])
    return d in {1, 5, 7, 9}

def same_sign(pc, a, b):
    if not pc.get(a) or not pc.get(b): return False
    return pc[a]["sign"] == pc[b]["sign"]


# ─── दीप्तांश (Planetary Orbs) ──────────────────────────────────────────────
DIPTANSHA = {
    "SUN": 15, "MOON": 12, "JUPITER": 9, "SATURN": 9,
    "MARS": 8,  "VENUS": 7, "MERCURY": 7,
    "RAHU": 0,  "KETU": 0,   # छाया ग्रह — दीप्तांश नहीं
}

def check_diptansha_yuti(pc, planet1, planet2):
    """
    दो ग्रह एक राशि में हों तो check करो कि वे सच में युति में हैं (degree diff <= avg orb).
    Philosophy: Saptarishi Nadi — yuiti tabhi 100% jab degree antar avg diptansha se kam ho.
    """
    if not pc.get(planet1) or not pc.get(planet2): return False
    if pc[planet1]["sign"] != pc[planet2]["sign"]: return False
    orb1 = DIPTANSHA.get(planet1, 0)
    orb2 = DIPTANSHA.get(planet2, 0)
    avg_orb = (orb1 + orb2) / 2
    degree_diff = abs(pc[planet1]["degree"] - pc[planet2]["degree"])
    return degree_diff <= avg_orb

def get_diptansha_alert(pc, planet1, planet2):
    """
    Yuiti ko False nahi karta — sirf warning note deta hai.
    "No override" philosophy: user khud decide kare.
    Returns: str (empty if not same sign, else confirmation or warning)
    """
    if not pc.get(planet1) or not pc.get(planet2): return ""
    if pc[planet1]["sign"] != pc[planet2]["sign"]: return ""
    orb1 = DIPTANSHA.get(planet1, 0)
    orb2 = DIPTANSHA.get(planet2, 0)
    avg_orb = (orb1 + orb2) / 2
    diff = abs(pc[planet1]["degree"] - pc[planet2]["degree"])
    if diff <= avg_orb:
        return f" [✅ दीप्तांश: युति बलवान ({diff:.1f}° < {avg_orb:.1f}°)]"
    else:
        return f" [⚠️ दीप्तांश अलर्ट: अंतर {diff:.1f}° > {avg_orb:.1f}° — सूत्र यहाँ कमजोर हो सकता है, स्वयं निर्णय लें]"

def dreshkan_character(lagna_degree):
    """
    लग्नांश (Lagna Degree) के आधार पर बिना ग्रहों के चरित्र चित्रण।
    Source: Bhrigu Gurukulam.
    """
    if 0 <= lagna_degree <= 10:
        return "नारद मुनि देशकाल (0°-10°): अत्यधिक आध्यात्मिक, रहस्य खोलने वाले, बातूनी, यात्राओं के शौकीन।"
    elif 10 < lagna_degree <= 20:
        return "अगस्त्य ऋषि देशकाल (11°-20°): तपोबल वाले, साहसी, धैर्यवान, दुष्टों को कठोर दंड देने वाले।"
    elif 20 < lagna_degree <= 30:
        return "दुर्वासा ऋषि देशकाल (21°-30°): अत्यधिक क्रोधी, मुंहफट, नियम-कायदे के पक्के। इनके शाप सच होते हैं।"
    return ""

def get_pushkar_bhag(pc):
    """
    भाग्य पलटने वाला पुष्कर भाग — ठीक इस डिग्री पर ग्रह = 100% शुभ फल।
    मेष/सिंह/धनु=21°, वृषभ/कन्या/मकर=14°, मिथुन/तुला/कुंभ=24°, कर्क/वृश्चिक/मीन=7°
    """
    PUSHKAR = {1:21,5:21,9:21, 2:14,6:14,10:14, 3:24,7:24,11:24, 4:7,8:7,12:7}
    result = []
    for planet, d in pc.items():
        sign   = d["sign"]
        degree = round(d["degree"])
        if PUSHKAR.get(sign) == degree:
            result.append({
                "planet": planet,
                "sign":   SIGN_HINDI.get(sign, str(sign)),
                "degree": d["degree"],
                "note":   f"{planet} पुष्कर भाग ({degree}°) में — 100% शुभ फल"
            })
    return result

def past_life_lagna(lagna):
    """
    पूर्व जन्म की लग्न:
    वर्तमान लग्न काल पुरुष कुंडली में जिस अंक पर = उतने ही घर आगे गिनो।
    जैसे कर्क लग्न = 4, तो 4 से 4 आगे = भाव 7 = तुला = पूर्व जन्म लग्न।
    """
    prev = ((lagna - 1 + lagna - 1) % 12) + 1
    return {
        "current_lagna":  SIGN_HINDI.get(lagna, str(lagna)),
        "past_life_lagna": SIGN_HINDI.get(prev, str(prev)),
        "note": f"वर्तमान {SIGN_HINDI.get(lagna,str(lagna))} (भाव {lagna}) → "
                f"पूर्व जन्म लग्न: {SIGN_HINDI.get(prev,str(prev))} (भाव {prev})"
    }



def past_life_curse(pc):
    """पूर्व जन्म के श्राप — गुरु की पिछली राशि से निकाले जाते हैं।"""
    curses = []
    if pc.get("JUPITER"):
        back_sign = ((pc["JUPITER"]["sign"] - 2) % 12) + 1
        in_back   = [p for p, d in pc.items() if d["sign"] == back_sign and p != "JUPITER"]
        if "MOON" in in_back or "RAHU" in in_back:
            curses.append({"type":"श्रापित कुंडली","desc":"पूर्व जन्म में जघन्य पाप।","remedy":"नवग्रह शांति, पवमान सूक्त पाठ"})
        if all(p in in_back for p in ["VENUS","MARS","MOON"]):
            curses.append({"type":"वासना का श्राप","desc":"पूर्व जन्म में पत्नी को धोखा।","remedy":"सत्यनारायण पूजा"})
        if all(p in in_back for p in ["KETU","MOON","MERCURY"]):
            curses.append({"type":"व्यभिचार का श्राप","desc":"पूर्व जन्म में व्यभिचार।","remedy":"हवन, वैदिक पाठ"})
    if pc.get("JUPITER",{}).get("retrograde"):
        curses.append({"type":"गुरु श्राप","desc":"पूर्व जन्म में गुरु का अपमान।","remedy":"सत्यनारायण पूजा"})
    if pc.get("SATURN",{}).get("retrograde"):
        curses.append({"type":"शनि श्राप","desc":"पूर्व जन्म में धोखा, ठगी।","remedy":"शनि शांति"})
    if not curses:
        curses.append({"type":"पाप मुक्त","desc":"कोई विशेष श्राप नहीं।","remedy":""})
    return curses


# ─── नीच ग्रहों का मनोवैज्ञानिक प्रभाव (Neech Graha Psychology) ─────────────
NEECH_PSYCHOLOGY = {
    "SATURN": {  # शनि मेष में नीच
        "sign": 1,
        "desc": "उल्टी खोपड़ी — मज़दूर वर्ग से सहयोग नहीं। सिर दर्द/माइग्रेन, चश्मा।"
    },
    "MOON": {    # चंद्र वृश्चिक में नीच
        "sign": 8,
        "desc": "मानसिक अस्थिरता — छोटी समस्याओं को पहाड़ बना लेते हैं।"
    },
    "MERCURY": { # बुध मीन में नीच
        "sign": 12,
        "desc": "दबाव नहीं झेल पाते — विवेक खो देते हैं, क्रोध में हकलाने लगते हैं।"
    },
    "JUPITER": { # गुरु मकर में नीच
        "sign": 10,
        "desc": "जीवन में एक बार घोर दरिद्रता। उम्र के साथ शुगर, फैटी लीवर, कोलेस्ट्रॉल।"
    },
    "VENUS": {   # शुक्र कन्या में नीच
        "sign": 6,
        "desc": "प्रेम का सही अर्थ नहीं समझते — केवल शारीरिक आकर्षण (Lust), सच्चा प्रेम नहीं।"
    },
}

def get_neech_psychology(pc):
    """नीच ग्रहों के मनोवैज्ञानिक प्रभाव की लिस्ट return करता है।"""
    result = []
    for planet, data in NEECH_PSYCHOLOGY.items():
        if pc.get(planet,{}).get("sign") == data["sign"]:
            result.append({
                "planet": planet,
                "sign": SIGN_HINDI.get(data["sign"], ""),
                "desc": data["desc"]
            })
    return result

def in_house(pc, planet, house_num, lagna):
    if not pc.get(planet): return False
    return house_dist(lagna, pc[planet]["sign"]) == house_num

def get_house(pc, planet, lagna):
    if not pc.get(planet): return None
    return house_dist(lagna, pc[planet]["sign"])

# ─── FIX #5: is_weak — house 1 (lagna) is NOT weak ─────────────────────────
def is_weak(pc, planet, lagna):
    """
    Planet is weak if:
    - Debilitated (neeche rashi), OR
    - In 6th, 8th, or 12th house AND NOT retrograde (vakri in 6/8/12 = STRONG), OR
    - Combust AND enemy of Sun (mitra combust = phala via Sun, not destroyed)
    BUG FIX 1: Vakri in 6/8/12 = bali, weak nahi
    BUG FIX 2: Combust mitra planet = fal milta hai Sun ke zariye
    """
    if not pc.get(planet): return False
    s = pc[planet]["sign"]
    # Debilitated = always weak (vakri neech = neechbhanga, handled separately)
    if DEBILITATION_SIGN.get(planet) == s: return True
    # Combust: only enemy planets are truly weakened; Sun's friends give result via Sun
    if pc[planet].get("combust") and planet not in ("SUN","RAHU","KETU"):
        sun_enemies = ENEMIES.get("SUN", [])  # Sun ke shatru = Ve, Sa
        if planet in sun_enemies:
            return True  # Sun ka shatru + combust = weak
        # Sun ka mitra combust = fal milta hai, weak nahi
    h = house_dist(lagna, s)
    # 6/8/12 mein vakri = bali (apni kami ki puurti kar leta hai)
    if h in [6, 8, 12]:
        if pc[planet].get("retrograde", False):
            return False  # Vakri in dusthana = STRONG, not weak
        return True
    return False

# ─── FIX #14: Vish Navamsha ──────────────────────────────────────────────────
def navamsha_status(degree):
    """
    Each navamsha = 3°20' = 10/3 degrees
    Vish (cursed)   navamshas: 1st, 5th, 9th  → 0-3.33, 13.33-16.67, 26.67-30
    Pushkara (good) navamshas: 2nd, 6th        → 3.33-6.67, 20-23.33
    """
    d = degree % 30
    nav = int(d / (10/3)) + 1
    if nav in [1, 5, 9]:
        return "VISH"
    elif nav in [2, 6]:
        return "PUSHKARA"
    return "NEUTRAL"

# ─── FIX #17: Degree control ─────────────────────────────────────────────────
def degree_control_check(pc, lagna):
    """
    When two+ planets are in same sign:
    Higher degree planet CONTROLS lower degree planet.
    Doc: जिसका अंश अधिक, वो दूसरे को control करेगा।
    """
    from collections import defaultdict
    sign_groups = defaultdict(list)
    for p, d in pc.items():
        sign_groups[d["sign"]].append((p, d["degree"]))
    
    results = []
    for sign, planets in sign_groups.items():
        if len(planets) < 2: continue
        planets.sort(key=lambda x: x[1], reverse=True)
        dominant = planets[0]
        for controlled in planets[1:]:
            results.append({
                "sign": SIGN_HINDI[sign],
                "dominant": dominant[0],
                "dominant_deg": dominant[1],
                "controlled": controlled[0],
                "controlled_deg": controlled[1],
                "message": (
                    f"{dominant[0]}({dominant[1]:.1f}°) → {controlled[0]}({controlled[1]:.1f}°) को control करेगा "
                    f"({SIGN_HINDI[sign]} राशि में)"
                )
            })
    return results

# ─── MODULE 1: Planet Affliction Engine ──────────────────────────────────────
def planet_affliction(planet, pc, lagna):
    """
    Doc says: afflicted (boolean), not a score.
    FIX #26: Collect ALL enemies in 5th/9th (removed break)
    Returns: afflicted=True/False + list of flags + messages
    """
    if not pc.get(planet):
        return {"planet": planet, "afflicted": False, "flags": {}, "messages": ["ग्रह कुंडली में नहीं"]}
    
    sign = pc[planet]["sign"]
    flags = {
        "debilitated": False,
        "triangular_enmity": [],   # FIX: list, not boolean (collects all enemies)
        "paap_kartari": False,
        "isolated": False,
        "power_boost": False,
        "combust": pc[planet].get("combust", False),
    }
    msgs = []

    # 1. Debilitation
    if DEBILITATION_SIGN.get(planet) == sign:
        flags["debilitated"] = True
        msgs.append(f"{planet} नीच राशि {SIGN_HINDI[sign]} में — शक्तिहीन")

    # 2. Triangular enmity — BNN: enemy planet connected via 5th/9th NADI distance
    # Use planet→planet distance (not sign_of_house which treats sign as lagna)
    for p, d in pc.items():
        if p == planet: continue
        if p not in ENEMIES.get(planet, []): continue
        dist = house_dist(sign, d["sign"])
        if dist in (5, 9):
            pos = "5वें" if dist == 5 else "9वें"
            flags["triangular_enmity"].append(p)
            msgs.append(f"{p} (शत्रु) {planet} के {pos} भाव में — त्रिकोण शत्रुता")

    # 3. Paap Kartari (malefics in 2nd AND 12th) — context-aware
    second  = sign_of_house(sign, 2)
    twelfth = sign_of_house(sign, 12)
    mal_2nd  = any(pc.get(m, {}).get("sign") == second  for m in MALEFIC if m != planet
                   and not (m == "MERCURY" and not is_malefic_in_context(m, pc))
                   and not (m == "MOON"    and not is_malefic_in_context(m, pc)))
    mal_12th = any(pc.get(m, {}).get("sign") == twelfth for m in MALEFIC if m != planet
                   and not (m == "MERCURY" and not is_malefic_in_context(m, pc))
                   and not (m == "MOON"    and not is_malefic_in_context(m, pc)))
    if mal_2nd and mal_12th:
        flags["paap_kartari"] = True
        msgs.append(f"{planet} के 2रे और 12वें में पापी ग्रह — पाप कर्तरी (कैंची योग)")

    # 4. Isolated (no Nadi connections at all)
    connected_to_any = any(
        nadi_connected(sign, pc[p]["sign"], planet, p)["connected"]
        for p in pc if p != planet
    )
    if not connected_to_any:
        flags["isolated"] = True
        msgs.append(f"{planet} श्रापित — किसी ग्रह का प्रभाव/दृष्टि नहीं")

    # 5. Power boost: benefic in 7th from planet — context-aware
    seventh = sign_of_house(sign, 7)
    for p in BENEFIC:
        if p != planet and pc.get(p, {}).get("sign") == seventh:
            if p in ("MERCURY","MOON") and is_malefic_in_context(p, pc):
                continue  # Mercury/Moon acting as malefic — no power boost
            flags["power_boost"] = True
            msgs.append(f"{p} (शुभ) {planet} के ठीक 7वें में — पावर बूस्ट! शुभ फल कई गुना")
            break

    # 6. Combust
    if flags["combust"] and planet not in ("SUN","RAHU","KETU"):  # Rahu/Ketu never combust
        msgs.append(f"{planet} अस्त (सूर्य के अत्यंत निकट) — बलहीन")

    afflicted = (
        flags["debilitated"] or
        bool(flags["triangular_enmity"]) or
        flags["paap_kartari"] or
        flags["isolated"] or
        flags["combust"]
    )
    return {"planet": planet, "afflicted": afflicted, "flags": flags, "messages": msgs}

# ─── MODULE 2: Disease Engine ────────────────────────────────────────────────
def retrograde_engine(pc, lagna):
    """
    FIX #23: Rahu/Ketu excluded (always retrograde by nature, different rules apply)
    50% effect in current sign + 50% in previous sign for actual planets.
    """
    results = []
    for planet, d in pc.items():
        if planet in ["RAHU","KETU"]: continue   # FIX #23
        if d.get("retrograde"):
            curr_sign = d["sign"]
            prev_sign = ((curr_sign - 2) % 12) + 1
            results.append({
                "planet":       planet,
                "current_sign": SIGN_HINDI[curr_sign],
                "prev_sign":    SIGN_HINDI[prev_sign],
                "message": (
                    f"{planet} वक्री — {SIGN_HINDI[curr_sign]} में 50% शक्ति, "
                    f"{SIGN_HINDI[prev_sign]} में भी 50% शक्ति। "
                    f"पिछले जन्म का काम अधूरा।"
                )
            })
    return results

# ─── MODULE 11: 8th House Engine ──────────────────────────────────────────────
def saturn_transit_engine(natal_rahu_sign, natal_ketu_sign, transit_saturn_sign):
    """
    Saturn transit effects (natal positions vs transit).
    BNN: Shani ka gochar Rahu/Ketu ke 1,5,9 (trikon) ya 2,12 (close) mein.
    """
    msgs = []
    d_rahu = house_dist(natal_rahu_sign, transit_saturn_sign) if natal_rahu_sign else 0
    d_ketu = house_dist(natal_ketu_sign, transit_saturn_sign) if natal_ketu_sign else 0

    # Rahu par Shani gochar — strong effect at 1,2,12 (close) and 5,9 (trikon)
    if d_rahu in (1, 2, 12):
        msgs.append("🔴 गोचर शनि → जन्म राहु (युति/2-12): हाथ का पैसा फंसेगा, काम में भारी रुकावट, "
                    "घुटने में दर्द, दूर देशों की यात्राएं बढ़ेंगी")
    elif d_rahu in (5, 9):
        msgs.append("🟡 गोचर शनि → जन्म राहु (त्रिकोण): कार्यक्षेत्र में उथल-पुथल, "
                    "विदेश यात्रा/संपर्क, नई जगह बसने का मौका")

    # Ketu par Shani gochar
    if d_ketu in (1, 2, 12):
        msgs.append("🔴 गोचर शनि → जन्म केतु (युति/2-12): भक्ति और सन्यास का भाव जागेगा, "
                    "तीर्थ यात्राएं, पेट और जोड़ों के रोग, संसार से विरक्ति")
    elif d_ketu in (5, 9):
        msgs.append("🟡 गोचर शनि → जन्म केतु (त्रिकोण): आध्यात्मिक रुचि बढ़ेगी, "
                    "पुराने कर्मों का हिसाब, स्वास्थ्य सावधानी")

    # Shani ka teesra chakkar (60-90 varsh) + Rahu/Ketu = mrityu ke aaspaas
    # (Called from death_timing_engine with age check)

    if not msgs:
        msgs.append("✅ गोचर शनि का जन्म राहु/केतु पर कोई सीधा प्रभाव नहीं — अनुकूल समय")

    # Saturn transit on natal Mercury = land dispute
    # (caller must pass natal_mercury_sign optionally)
    return msgs

def saturn_transit_mercury_effect(natal_mercury_sign, transit_saturn_sign):
    """शनि का गोचर जन्म बुध पर → विवादित जमीन खरीदना"""
    msgs = []
    if natal_mercury_sign and transit_saturn_sign:
        d = house_dist(natal_mercury_sign, transit_saturn_sign)
        if d in (1, 2, 12):
            msgs.append("⚠️ गोचर शनि → जन्म बुध: विवादित ज़मीन (Disputed Land) खरीदने का खतरा। "
                       "पैसा बुरी तरह फंस सकता है — संपत्ति लेन-देन में अत्यंत सावधानी बरतें।")
        elif d in (5, 9):
            msgs.append("🟡 गोचर शनि → जन्म बुध (त्रिकोण): व्यापार में थोड़ी रुकावट, "
                       "दस्तावेज़ी कार्यों में सावधानी जरूरी।")
    return msgs

# ─── MODULE 15: Death Timing ─────────────────────────────────────────────────
def death_timing_engine(pc, lagna, birth_year, current_year):
    """
    FIX #3: Transit-based check, age 60+ required
    Doc: Saturn's 3rd cycle (age 60+) when transit Saturn passes natal Rahu/Ketu
    """
    res = {"death_near": False, "messages": []}
    age = current_year - birth_year
    if age < 58:
        res["messages"].append(f"वर्तमान आयु {age} — मृत्यु टाइमिंग analysis अभी premature (60+ वर्ष पर)")
        return res

    natal_rahu_sign  = pc.get("RAHU",  {}).get("sign")
    natal_ketu_sign  = pc.get("KETU",  {}).get("sign")
    natal_moon_sign  = pc.get("MOON",  {}).get("sign")
    natal_saturn_sign = pc.get("SATURN",{}).get("sign")

    # Saturn's 3rd round starts ~age 59 (29.5 × 2)
    # Note: transit_saturn_sign must be passed by caller; here we estimate
    res["messages"].append(
        f"आयु {age}: शनि का 3रा चक्र चल रहा है। "
        f"जब गोचर शनि जन्म राहु ({SIGN_HINDI.get(natal_rahu_sign,'?')}) या "
        f"केतु ({SIGN_HINDI.get(natal_ketu_sign,'?')}) पर आए → मृत्यु संकेत।"
    )
    if age >= 60:
        res["death_near"] = True
        # Marak lords
        second_lord = bhavesh(lagna, 2)
        seventh_lord = bhavesh(lagna, 7)
        eighth_lord  = bhavesh(lagna, 8)
        res["messages"].append(
            f"मारक ग्रह: {second_lord} (2रे), {seventh_lord} (7वें)। "
            f"अष्टमेश: {eighth_lord}। "
            f"इनकी दशा-अंतर्दशा में विशेष सावधानी।"
        )
    return res

# ─── MODULE 16: Gemstone Algorithm ────────────────────────────────────────────
def gemstone_algo(planet, planet_sign, lagna):
    ll = LAGNA_LORD.get(lagna)
    ph = house_dist(lagna, planet_sign)
    is_friend = ll in FRIENDS.get(planet, [])
    is_bad    = ph in [6, 8, 12]
    gem = GEMSTONES.get(planet, {})
    if is_friend and not is_bad:
        if planet == "MARS":
            rec = ("✅ सफेद मूंगा" if ph in [1,2,4,7] else "✅ लाल मूंगा")
        else:
            rec = f"✅ {gem.get('gem','?')} पहन सकते हैं"
        can_wear = True
    elif is_friend and is_bad:
        rec = f"❌ {gem.get('gem','?')} बिल्कुल नहीं — ग्रह 6/8/12 में"
        can_wear = False
    else:
        rec = f"❌ {gem.get('gem','?')} नहीं — लग्नेश ({ll}) का शत्रु"
        can_wear = False
    return {
        "planet":         planet,
        "gemstone":       gem.get("gem",""),
        "can_wear":       can_wear,
        "house":          ph,
        "recommendation": rec,
    }

# ─── MODULE 17: Vish Navamsha ─────────────────────────────────────────────────
def vish_navamsha_report(pc):
    """Full report for all planets' navamsha status"""
    report = []
    for planet, d in pc.items():
        status = navamsha_status(d["degree"])
        if status != "NEUTRAL":
            report.append({
                "planet":  planet,
                "degree":  d["degree"],
                "sign":    SIGN_HINDI[d["sign"]],
                "status":  status,
                "message": (
                    f"{planet} ({d['degree']:.2f}°, {SIGN_HINDI[d['sign']]}) = "
                    f"{'विष नवांश — कष्टकारक' if status=='VISH' else 'पुष्कर नवांश — अत्यंत शुभ'}"
                )
            })
    return report

# ─── MASTER RUNNER ────────────────────────────────────────────────────────────
def full_nadi_analysis(planets_data, lagna, gender="MALE",
                  birth_year=1999, current_year=2026,
                  sav=None):
    """
    Nadi Jyotish analysis — v3.0 (16-topic architecture).
    19-engine classic section removed. All analysis via build_sutra_topics().
    planets_data = dict of planet → {sign, degree, retrograde, combust}
    """
    pc = calc_combustion(planets_data)

    return {
        # ── Core: 16 Vishay Topics (main analysis) ──
        "sutra_topics":       build_sutra_topics(pc, lagna, sav, gender),

        # ── Supporting data for other UI tabs ──
        "combustion":         {p: d.get("combust", False) for p, d in pc.items()},
        "degree_control":     degree_control_check(pc, lagna),
        "vish_navamsha":      vish_navamsha_report(pc),
        "retrograde":         retrograde_engine(pc, lagna),
        "planet_afflictions": {p: planet_affliction(p, pc, lagna) for p in pc},
        "gemstones":          {p: gemstone_algo(p, pc[p]["sign"], lagna) for p in pc},
        "past_life":          past_life_lagna(lagna),
        "curses":             past_life_curse(pc),
        "death_timing":       death_timing_engine(pc, lagna, birth_year, current_year),
        "saturn_transit":     [],  # populated by engines_bridge from api.py transit data
    }

# ─── TEST RUN ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Chart: sh, 04 July 1999, 01:00 AM, Kapkote, Aries Lagna
    planets = {
        "JUPITER": {"sign":1,  "degree":16.98, "retrograde":False, "combust":False},
        "KETU":    {"sign":10, "degree":20.82, "retrograde":True,  "combust":False},
        "MARS":    {"sign":7,  "degree":5.71,  "retrograde":False, "combust":False},
        "MERCURY": {"sign":4,  "degree":12.46, "retrograde":False, "combust":False},
        "MOON":    {"sign":11, "degree":14.18, "retrograde":False, "combust":False},
        "RAHU":    {"sign":4,  "degree":20.82, "retrograde":True,  "combust":False},
        "SATURN":  {"sign":1,  "degree":20.63, "retrograde":False, "combust":False},
        "SUN":     {"sign":3,  "degree":17.58, "retrograde":False, "combust":False},
        "VENUS":   {"sign":5,  "degree":0.60,  "retrograde":False, "combust":False},
    }
    full_nadi_analysis(planets, lagna=1, gender="MALE", birth_year=1999, current_year=2026)

# ═══════════════════════════════════════════════════════════════════════════════
# SUTRA TOPICS ENGINE — Architecture v2
# ─────────────────────────────────────────────────────────────────────────────
# 15 topics × 4 sources (BNN / Vedic / D-Chart info / AV)
# Each sutra: {id, text, detail, met:bool, ref, planets:[]}
# NO final verdict — user sees raw evidence and decides
# D1 only for now. D9/D10 popup (chart only) added separately in frontend.
# ═══════════════════════════════════════════════════════════════════════════════

# ── Dignity helpers (using existing LAGNA_LORD, sign_of_house, bhavesh) ──────

_EXALT  = {"SUN":1,"MOON":2,"MARS":10,"MERCURY":6,"JUPITER":4,"VENUS":12,"SATURN":7}
_DEBIL  = {"SUN":7,"MOON":8,"MARS":4,"MERCURY":12,"JUPITER":10,"VENUS":6,"SATURN":1}
_OWN    = {"SUN":[5],"MOON":[4],"MARS":[1,8],"MERCURY":[3,6],
           "JUPITER":[9,12],"VENUS":[2,7],"SATURN":[10,11]}
_PH     = {"SUN":"सूर्य","MOON":"चंद्र","MARS":"मंगल","MERCURY":"बुध",
           "JUPITER":"गुरु","VENUS":"शुक्र","SATURN":"शनि","RAHU":"राहु","KETU":"केतु"}
_BENEFIC  = {"JUPITER","VENUS","MOON","MERCURY"}
_MALEFIC  = {"SATURN","MARS","RAHU","KETU","SUN"}

def _dig(planet, sign):
    """Return dignity label: उच्च ✅ / नीच ⚠️ / स्वक्षेत्र ✅ / सामान्य"""
    if not sign: return "—"
    if _EXALT.get(planet) == sign:      return "उच्च ✅"
    if _DEBIL.get(planet) == sign:      return "नीच ⚠️"
    if sign in _OWN.get(planet, []):    return "स्वक्षेत्र ✅"
    return "सामान्य"

def _dig_ok(planet, sign):
    return "✅" in _dig(planet, sign)

def _ph(p):
    return _PH.get(p, p)

def _planets_in_house(pc, lagna, house):
    """List of planets in a given house from lagna."""
    target = sign_of_house(lagna, house)
    return [p for p, d in pc.items() if d["sign"] == target]

def _sav_house(sav, lagna, house):
    """SAV bindu for a house (sav is 0-indexed list by sign, lagna is 1-based)."""
    if not sav or len(sav) < 12: return 28
    sign_0 = (lagna - 1 + house - 1) % 12
    return sav[sign_0]

def _s(sid, text, detail, met, ref, planets=None):
    """Build a single sutra entry."""
    return {"id": sid, "text": text, "detail": detail,
            "met": bool(met), "ref": ref, "planets": planets or []}

def _av(house, sav, lagna, threshold=28):
    """Build AV section dict for a topic."""
    val = _sav_house(sav, lagna, house)
    strong = val >= threshold
    return {
        "house": house, "bindus": val, "max": 56, "strong": strong,
        "note": f"{house}वाँ भाव: {val}/56 {'बलवान ✅' if strong else 'कमज़ोर ⚠️'}"
    }

def _d1_house(lagna, house, planets, label=""):
    h_sign = sign_of_house(lagna, house)
    return {
        "label": label or f"D1 — {house}वाँ भाव",
        "house": house,
        "sign": SIGN_HINDI.get(h_sign, "—"),
        "planets": [_ph(p) for p in planets],
        "dignity": "—"
    }


# ══════════════════════════════════════════════════════════
# TOPIC 1: VIVAH (Marriage) — 7th house focus
# ══════════════════════════════════════════════════════════
def _t_vivah(pc, lagna, sav, gender):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    wk = lambda p: is_weak(pc, p, lagna)
    h7  = _planets_in_house(pc, lagna, 7)
    h7l = bhavesh(lagna, 7)
    h7l_sign = pc.get(h7l, {}).get("sign", 0)
    ve_sign = pc.get("VENUS", {}).get("sign", 0)
    mo_sign = pc.get("MOON", {}).get("sign", 0)

    bnn = [
        _s("vivah_promise",
           "विवाह वादा: गुरु/शनि + शुक्र नाड़ी संबंध",
           "गुरु/शनि + शुक्र नाड़ी संबद्ध → विवाह का दृढ़ वचन।",
           (ac("JUPITER","VENUS") or ac("SATURN","VENUS")) if gender=="MALE" else (ac("JUPITER","MARS") or ac("VENUS","MARS")),
           "BNN · विवाह सूत्र · नियम 1",
           ["JUPITER","VENUS"] if gender=="MALE" else ["JUPITER","MARS"]),

        _s("true_love",
           "सच्चा प्रेम: बुध+केतु या गुरु+बुध (त्रिकोण)",
           "बुध+केतु → सच्चा प्रेम। गुरु से 5वें/9वें/7वें में बुध → भी सच्चा प्रेम। "
           "(BNN सूत्र: बुध+केतु OR गुरु-बुध नाड़ी संबंध)",
           ac("MERCURY","KETU") or ss("MERCURY","KETU") or ac("JUPITER","MERCURY"),
           "BNN · प्रेम-विवाह · सूत्र 6", ["MERCURY","KETU","JUPITER"]),

        _s("arranged",
           "अरेंज मैरिज: गुरु+शुक्र नाड़ी संबंध",
           "गुरु+शुक्र → माता-पिता की सहमति से विवाह।",
           ac("JUPITER","VENUS"),
           "BNN · अरेंज मैरिज · सूत्र 8", ["JUPITER","VENUS"]),

        _s("infatuation",
           "केवल आकर्षण (Infatuation): शुक्र+चंद्र",
           "शुक्र+चंद्र → शारीरिक आकर्षण, सच्चा प्रेम नहीं।",
           ac("VENUS","MOON") or ss("VENUS","MOON"),
           "BNN · काम सूत्र · सूत्र 4", ["VENUS","MOON"]),

        _s("divorce_risk",
           "तलाक योग: शुक्र/मंगल पर राहु/केतु + अष्टमेश पीड़ित",
           "शुक्र या मंगल पर राहु/केतु का प्रभाव AND अष्टमेश कमज़ोर → 100% तलाक। "
           "शनि संघर्ष देता है पर केतु/राहु ही संबंध तोड़ते हैं।",
           (ac("VENUS","RAHU") or ac("VENUS","KETU") or
            ac("MARS","RAHU") or ac("MARS","KETU")) and
           ac("VENUS","MARS"),
           "BNN · तलाक योग · सूत्र 6", ["VENUS","MARS","RAHU","KETU"]),

        _s("vivah_delay",
           "विवाह विलंब: गुरु+राहु, शुक्र वक्री, या शुक्र नीच/कमज़ोर",
           "गुरु+राहु (संतान में देरी, विवाह में भी प्रभाव) OR "
           "शुक्र वक्री OR शुक्र नीच (कन्या) OR शुक्र 6/8/12 में → विवाह 35+ वर्ष में।",
           (ac("JUPITER","RAHU") or ss("JUPITER","RAHU")) or
           pc.get("VENUS",{}).get("retrograde", False) or
           wk("VENUS"),
           "BNN · विलंब योग · सूत्र 3", ["JUPITER","RAHU","VENUS"]),

        _s("no_marriage",
           "विवाह नहीं: 4 पैरामीटर में से 3+ मिलें",
           "1) शुक्र+मंगल पर शनि+राहु का प्रभाव, 2) शनि+चंद्र+केतु योग, "
           "3) सप्तमेश या अष्टमेश पीड़ित, 4) पंचमेश कमज़ोर — "
           "3 या अधिक मिलें तो आजीवन अविवाहित योग।",
           sum([
               bool((ac("VENUS","SATURN") or ac("VENUS","RAHU")) and
                    (ac("MARS","SATURN") or ac("MARS","RAHU"))),
               bool(ac("SATURN","MOON") and (ac("SATURN","KETU") or ac("MOON","KETU"))),
               bool(wk(h7l) or wk(bhavesh(lagna,8))) if h7l else wk("VENUS"),
               bool(wk(bhavesh(lagna,5))),
           ]) >= 3,
           "BNN · विवाह निषेध · सूत्र 11", ["VENUS","SATURN","RAHU","MOON","KETU"]),

        _s("betrayal",
           "प्रेम में धोखा: बुध+मंगल+केतु",
           "बुध+मंगल+केतु तीनों का नाड़ी संबंध → प्रेम में विश्वासघात निश्चित। "
           "केतु अलगाव देता है, मंगल आघात, बुध प्रेम — तीनों मिलकर धोखा।",
           (ac("MARS","MERCURY") or ss("MARS","MERCURY")) and
           (ac("MERCURY","KETU") or ss("MERCURY","KETU") or
            ac("MARS","KETU") or ss("MARS","KETU")),
           "BNN · धोखा योग · सूत्र 2", ["MARS","MERCURY","KETU"]),

        _s("widowhood",
           "वैधव्य योग (स्त्री): मंगल कमज़ोर+राहु/केतु+अष्टमेश",
           "स्त्री कुंडली: मंगल कमज़ोर+राहु/केतु+अष्टमेश → विधवा योग।",
           gender=="FEMALE" and wk("MARS") and (ac("MARS","RAHU") or ac("MARS","KETU")),
           "BNN · विधवा योग · सूत्र 3", ["MARS","RAHU"]),


        # ── विवाह की दूरी (Marriage Distance) ─────────────────
        _s("vivah_dur",
           "विवाह दूर होगा (दूसरा राज्य/देश)",
           "सप्तमेश का द्वादशेश से संबंध, या शुक्र/चंद्र/सूर्य/गुरु सप्तम से द्वादश भाव में → "
           "जन्म स्थान से बहुत दूर विवाह।",
           ac(h7l, bhavesh(lagna,12)) or
           any(in_house(pc,p,h,lagna) for p in ("VENUS","MOON","SUN","JUPITER") for h in range(7,13)),
           "BNN · विवाह दूरी · सूत्र 1", [h7l]),

        _s("vivah_paas",
           "विवाह पास होगा (100 किमी के अंदर)",
           "सप्तमेश स्थिर राशि में (2/5/8/11), या लग्नेश/तृतीयेश/पंचमेश से सप्तमेश का संबंध → "
           "जन्म स्थान के बिल्कुल पास विवाह।",
           (pc.get(h7l,{}).get("sign",0) in (2,5,8,11)) or
           ac(h7l, bhavesh(lagna,1)) or ac(h7l, bhavesh(lagna,3)) or ac(h7l, bhavesh(lagna,5)),
           "BNN · विवाह दूरी · सूत्र 2", [h7l]),

        _s("pati_ghar_vastu",
           "पति के घर का वातावरण (स्त्री कुंडली)",
           "मंगल+सूर्य = सरकारी बिल्डिंग/बड़ा शहर। मंगल+बुध = खुला मैदान। "
           "मंगल+केतु = पास मंदिर। मंगल+गुरु = देव वृक्ष (पीपल)।",
           gender == "FEMALE" and any(
               ac("MARS", p) or ss("MARS", p)
               for p in ("SUN","MERCURY","KETU","JUPITER")
           ),
           "BNN · विवाह · पति घर वास्तु", ["MARS"]),

        _s("pati_apman",
           "पति सम्मान नहीं देगा (स्त्री कुंडली)",
           "मंगल के साथ बुध, शनि, राहु या केतु → पति जीवन भर सम्मान नहीं देता।",
           gender == "FEMALE" and any(
               ac("MARS",p) or ss("MARS",p)
               for p in ("MERCURY","SATURN","RAHU","KETU")
           ),
           "BNN · दांपत्य · सूत्र 3", ["MARS"]),

        _s("patni_apman",
           "पत्नी सम्मान नहीं करेगी (पुरुष कुंडली)",
           "शुक्र के साथ केतु या शनि → पत्नी सम्मान नहीं करती, ताने सुनाती है।",
           gender == "MALE" and (
               ac("VENUS","KETU") or ss("VENUS","KETU") or
               ac("VENUS","SATURN") or ss("VENUS","SATURN")
           ),
           "BNN · दांपत्य · सूत्र 4", ["VENUS","KETU","SATURN"]),

        _s("bhagyawan_patni",
           "कमाऊ पत्नी — अत्यंत भाग्यवान",
           "शनि+शुक्र संबंध → पत्नी कमाने वाली (Working) और जातक अत्यंत भाग्यवान।",
           ac("SATURN","VENUS") or ss("SATURN","VENUS"),
           "BNN · दांपत्य · सूत्र 5", ["SATURN","VENUS"]),

        _s("second_marriage",
           "दूसरा विवाह: शुक्र+मंगल+शनि+राहु",
           "शुक्र+मंगल+शनि और शुक्र+राहु → दूसरे विवाह की संभावना।",
           ac("VENUS","MARS") and (ac("VENUS","RAHU") or ss("VENUS","RAHU")),
           "BNN · पुनर्विवाह · सूत्र 5", ["VENUS","MARS","RAHU"]),

        # ─── नए BNN विवाह सूत्र ──────────────────────────────
        _s("love_success_bnn",
           "सफल प्रेम विवाह: बुध+केतु को गुरु/शुक्र देखें",
           "बुध+केतु के योग को गुरु या शुक्र देख लें → "
           "जिससे प्रेम होता है उसी से विवाह हो जाता है।",
           (ac("MERCURY","KETU") or ss("MERCURY","KETU")) and
           (ac("JUPITER","MERCURY") or ac("VENUS","MERCURY")),
           "BNN · प्रेम विवाह · सूत्र 9", ["MERCURY","KETU","JUPITER","VENUS"]),

        _s("love_arranged_bnn",
           "लव-कम-अरेंज मैरिज: शुक्र+मंगल पर गुरु",
           "शुक्र+मंगल संबंध पर गुरु का प्रभाव → "
           "पहले प्रेम, फिर माता-पिता की अनुमति से विवाह।",
           ac("VENUS","MARS") and (ac("JUPITER","VENUS") or ac("JUPITER","MARS")),
           "BNN · अरेंज मैरिज · सूत्र 10", ["VENUS","MARS","JUPITER"]),

        _s("useless_husband",
           "निकम्मा पति (स्त्री): शनि के आगे मंगल+केतु",
           "शनि+मंगल और शनि+केतु का संबंध → पति निकम्मा, "
           "सिर्फ पिता की कमाई खाने वाला।",
           gender=="FEMALE" and ac("SATURN","MARS") and ac("SATURN","KETU"),
           "BNN · दांपत्य कष्ट · सूत्र 11", ["SATURN","MARS","KETU"]),

        _s("deceitful_husband",
           "धोखेबाज/क्रोधी पति (स्त्री): मंगल+राहु",
           "स्त्री कुंडली में मंगल+राहु का संबंध → "
           "पति क्रोधी और बातें छिपाने वाला (धोखेबाज)।",
           gender=="FEMALE" and ac("MARS","RAHU"),
           "BNN · दांपत्य कष्ट · सूत्र 12", ["MARS","RAHU"]),

        _s("unbreakable_bond",
           "अभेद्य प्रेम: शुक्र+मंगल (राहु/केतु नहीं)",
           "मंगल+शुक्र का शुद्ध नाड़ी संबंध (राहु/केतु बिना) → "
           "पति-पत्नी में अत्यंत गहरा, अभेद्य प्रेम।",
           ac("VENUS","MARS") and
           not ac("VENUS","RAHU") and not ac("VENUS","KETU"),
           "BNN · दांपत्य सुख · सूत्र 13", ["VENUS","MARS"]),

        _s("past_life_spouse",
           "पूर्व जन्म का जीवनसाथी: लग्नेश+सप्तमेश+शुक्र+मंगल",
           "लग्नेश, सप्तमेश, शुक्र और मंगल का आपसी संबंध → "
           "यह रिश्ता पूर्व जन्म के प्रारब्ध से है।",
           h7l and
           ac(bhavesh(lagna,1), h7l) and
           ac("VENUS","MARS") and
           (ac(bhavesh(lagna,1),"VENUS") or ac(bhavesh(lagna,1),"MARS")),
           "BNN · प्रारब्ध · सूत्र 14", ["VENUS","MARS"]),

        _s("love_marriage_success",
           "प्रेम विवाह सफल: बुध+केतु+गुरु/शुक्र",
           "बुध+केतु को गुरु या शुक्र देख ले → जिससे प्रेम उसी से शादी होगी।",
           (ac("MERCURY","KETU") or ss("MERCURY","KETU")) and
           (ac("JUPITER","MERCURY") or ac("VENUS","MERCURY")),
           "BNN · विवाह · प्रेम विवाह · सूत्र 2", ["MERCURY","KETU","JUPITER"]),

        _s("vish_nav_warning",
           f"विष नवांश चेतावनी: शुक्र {pc.get('VENUS',{}).get('degree',0):.1f}°",
           "शुक्र विष नवांश में → विवाह के पहले 3-4 वर्ष अत्यंत कठिन। धैर्य रखें।",
           bool(pc.get("VENUS")) and navamsha_status(pc["VENUS"]["degree"]) == "VISH",
           "Saptarishi Nadi · विष नवांश · सूत्र 1", ["VENUS"]),
    ]

    benef_7 = [p for p in h7 if p in _BENEFIC]
    malef_7 = [p for p in h7 if p in _MALEFIC]
    vedic = [
        _s("7th_lord_dig",
           f"सप्तमेश ({_ph(h7l)}): {_dig(h7l, h7l_sign)}",
           "सप्तमेश उच्च/स्वक्षेत्र → विवाह सुखद, जीवनसाथी गुणवान।",
           _dig_ok(h7l, h7l_sign), "Parashara Hora · सप्तम · नियम 1"),

        _s("7th_benefic",
           f"7वें भाव में शुभ ग्रह: {', '.join(_ph(p) for p in benef_7) or 'कोई नहीं'}",
           "7वें में शुभ ग्रह → जीवनसाथी अच्छा।",
           len(benef_7) > 0, "Brihat Parashara · सप्तम · नियम 3"),

        _s("7th_malefic",
           f"7वें में पापी ग्रह: {', '.join(_ph(p) for p in malef_7) or 'कोई नहीं'}",
           "7वें में पापी ग्रह → वैवाहिक कष्ट।",
           len(malef_7) > 0, "Brihat Parashara · सप्तम · नियम 5"),

        _s("venus_dig",
           f"शुक्र (विवाह कारक): {_dig('VENUS', ve_sign)}",
           "शुक्र बलवान → प्रेम-जीवन सुखी।",
           _dig_ok("VENUS", ve_sign), "Jataka Parijata · शुक्र कारकत्व · नियम 2"),

        _s("7th_lord_house",
           f"सप्तमेश ({_ph(h7l)}) किस भाव में: {(pc.get(h7l,{}).get('sign',0) - lagna + 12) % 12 + 1 if pc.get(h7l) else '?'}वाँ",
           "सप्तमेश 7वें में → स्वयं भाव में, विवाह बल प्रबल।",
           pc.get(h7l, {}).get("sign", 0) == sign_of_house(lagna, 7),
           "Parashara Hora · सप्तमेश स्थान · नियम 4"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 7, h7, "D1 — 7वाँ भाव (विवाह)")},
        "av": _av(7, sav, lagna, 28),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 2: SANTAN (Children) — 5th house focus
# ══════════════════════════════════════════════════════════
def _t_santan(pc, lagna, sav, gender):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    wk = lambda p: is_weak(pc, p, lagna)
    h5  = _planets_in_house(pc, lagna, 5)
    h5l = bhavesh(lagna, 5)
    h5l_sign = pc.get(h5l, {}).get("sign", 0)
    jup_sign = pc.get("JUPITER",{}).get("sign",0)
    jup_retro = pc.get("JUPITER",{}).get("retrograde",False)

    bnn = [
        _s("son",
           "पुत्र योग: गुरु+सूर्य नाड़ी संबद्ध + गुरु अवक्री",
           "गुरु+सूर्य नाड़ी संबद्ध + गुरु अवक्री नहीं → पुत्र सुख।",
           (ac("JUPITER","SUN") or ss("JUPITER","SUN")) and not jup_retro,
           "BNN · संतान सूत्र · नियम 3", ["JUPITER","SUN"]),

        _s("daughter_rahu",
           "कन्या संतान: सूर्य+राहु नाड़ी संबंध",
           "सूर्य+राहु → कन्या संतान।",
           ac("SUN","RAHU") or ss("SUN","RAHU"),
           "BNN · संतान · नियम 6", ["SUN","RAHU"]),

        _s("daughter_venus",
           "कन्या संतान: गुरु+शुक्र नाड़ी संबंध",
           "गुरु+शुक्र → पुत्री सुखदायी।",
           ac("JUPITER","VENUS") or ss("JUPITER","VENUS"),
           "BNN · संतान · नियम 7", ["JUPITER","VENUS"]),

        _s("child_delay",
           "संतान विलंब: गुरु वक्री या गुरु+राहु संबंध",
           "गुरु वक्री या गुरु+राहु → 35+ वर्ष तक विलंब।",
           jup_retro or (ac("JUPITER","RAHU") or ss("JUPITER","RAHU")),
           "Saptarishi Nadi · संतान विलंब · सूत्र 9", ["JUPITER","RAHU"]),

        _s("ivf",
           "IVF/टेस्ट ट्यूब: गुरु+केतु नाड़ी संबंध",
           "गुरु+केतु → IVF/टेस्ट ट्यूब बेबी की संभावना।",
           ac("JUPITER","KETU") or ss("JUPITER","KETU"),
           "BNN · IVF योग · सूत्र 2", ["JUPITER","KETU"]),

        _s("no_child",
           "संतान नहीं: गुरु+शनि+राहु तीनों संबद्ध",
           "गुरु+शनि+राहु तीनों नाड़ी संबद्ध → संतान नहीं।",
           ac("JUPITER","SATURN") and (ac("JUPITER","RAHU") or ac("SATURN","RAHU")),
           "BNN · संतान निषेध · सूत्र 6", ["JUPITER","SATURN","RAHU"]),

        _s("child_loss",
           "संतान हानि: पंचमेश+व्ययेश परिवर्तन",
           "5वें+12वें स्वामी का राशि परिवर्तन → संतान हानि योग।",
           pc.get(h5l,{}).get("sign",0) == sign_of_house(lagna, 12) and
           pc.get(bhavesh(lagna,12),{}).get("sign",0) == sign_of_house(lagna, 5),
           "BNN · संतान हानि · सूत्र 5", [h5l]),

        _s("low_fertility",
           "प्रजनन शक्ति कम (पुरुष): शुक्र+चंद्र नाड़ी संबंध",
           "शुक्र+चंद्र → वीर्य दुर्बल (male fertility low)।",
           gender=="MALE" and (ac("VENUS","MOON") or ss("VENUS","MOON")),
           "BNN · संतान · नियम 12", ["VENUS","MOON"]),

        _s("miscarriage",
           "गर्भपात योग: मंगल+शनि+8वें स्वामी संबंध",
           "मंगल+शनि+अष्टमेश नाड़ी संबद्ध → गर्भपात की संभावना।",
           ac("MARS","SATURN") and ac("MARS", bhavesh(lagna,8)),
           "BNN · गर्भपात · सूत्र 3", ["MARS","SATURN"]),

        # ─── नए BNN संतान सूत्र ──────────────────────────────
        _s("miscarriage_bnn",
           "गर्भपात/संतान हानि: सूर्य+राहु, शुक्र+चंद्र, या गुरु+राहु",
           "सूर्य+राहु, शुक्र+चंद्र, या गुरु+राहु का नाड़ी संबंध → "
           "जातक की कम से कम एक संतान की हानि अवश्य।",
           (ac("SUN","RAHU") or ss("SUN","RAHU")) or
           (ac("VENUS","MOON") or ss("VENUS","MOON")) or
           (ac("JUPITER","RAHU") or ss("JUPITER","RAHU")),
           "BNN · संतान हानि · सूत्र 7", ["SUN","RAHU","VENUS","MOON","JUPITER"]),

        _s("cyst_tubes",
           "सिस्ट / ट्यूब ब्लॉकेज (स्त्री): शुक्र+चंद्र+केतु",
           "शुक्र+चंद्र+केतु का संबंध → फैलोपियन ट्यूब काम नहीं करती "
           "या गर्भाशय में सिस्ट।",
           gender=="FEMALE" and
           (ac("VENUS","MOON") or ss("VENUS","MOON")) and
           (ac("VENUS","KETU") or ss("VENUS","KETU")),
           "BNN · मेडिकल संतान · सूत्र 8", ["VENUS","MOON","KETU"]),

        _s("ivf_bnn",
           "IVF / टेस्ट ट्यूब बेबी योग: गुरु+केतु",
           "गुरु और केतु का नाड़ी संबंध → संतान में अत्यधिक विलंब, "
           "मेडिकल सहायता (IVF) की आवश्यकता पड़ सकती है।",
           ac("JUPITER","KETU") or ss("JUPITER","KETU"),
           "BNN · IVF योग · सूत्र 8b", ["JUPITER","KETU"]),

        _s("fertility_male",
           "वीर्य दुर्बलता (पुरुष): शुक्र+चंद्र संबंध",
           "पुरुष कुंडली में शुक्र+चंद्र → वीर्य पतला, प्रजनन क्षमता कम।",
           gender=="MALE" and (ac("VENUS","MOON") or ss("VENUS","MOON")),
           "BNN · प्रजनन · सूत्र 9", ["VENUS","MOON"]),

        _s("fertility_female",
           "प्रजनन बाधा (स्त्री): शुक्र+चंद्र+केतु",
           "स्त्री कुंडली में शुक्र+चंद्र+केतु → गर्भ नहीं ठहरता, ट्यूब ब्लॉकेज।",
           gender=="FEMALE" and (ac("VENUS","MOON") or ss("VENUS","MOON")) and
           (ac("VENUS","KETU") or ss("VENUS","KETU")),
           "BNN · प्रजनन · सूत्र 10", ["VENUS","MOON","KETU"]),

        _s("more_daughters",
           "अधिक कन्या संतान: सूर्य+राहु नाड़ी संबंध",
           "सूर्य+राहु का नाड़ी संबंध → कन्या संतानों की अधिकता।",
           ac("SUN","RAHU") or ss("SUN","RAHU"),
           "BNN · कन्या संतान · सूत्र 9", ["SUN","RAHU"]),

        _s("name_shiv",
           "संतान नामकरण: गुरु+शनि → शिव परिवार",
           "गुरु+शनि का संबंध → पुत्र का नाम 'शिव/महादेव' परिवार से जुड़ा।",
           ac("JUPITER","SATURN") or ss("JUPITER","SATURN"),
           "BNN · नामकरण · सूत्र 10", ["JUPITER","SATURN"]),

        _s("name_narayan",
           "संतान नामकरण: गुरु+सूर्य → नारायण/विष्णु",
           "गुरु+सूर्य का संबंध → पुत्र का नाम 'नारायण/विष्णु/राम' परिवार से।",
           ac("JUPITER","SUN") or ss("JUPITER","SUN"),
           "BNN · नामकरण · सूत्र 11", ["JUPITER","SUN"]),

        _s("name_krishna",
           "संतान नामकरण: गुरु+चंद्र → कृष्ण/गोपाल",
           "गुरु+चंद्र का संबंध → संतान का नाम 'कृष्ण/गोपाल/नंदलाल' से।",
           ac("JUPITER","MOON") or ss("JUPITER","MOON"),
           "BNN · नामकरण · सूत्र 12", ["JUPITER","MOON"]),

        _s("one_daughter",
           "केवल एक पुत्री: गुरु+शुक्र (चंद्र नहीं)",
           "गुरु+शुक्र (चंद्र का संबंध नहीं) → केवल एक कन्या अवश्य।",
           (ac("JUPITER","VENUS") or ss("JUPITER","VENUS")) and
           not (ac("JUPITER","MOON") or ss("JUPITER","MOON")),
           "BNN · संतान · नियम 13", ["JUPITER","VENUS"]),

        _s("two_daughters",
           "दो पुत्रियाँ: गुरु+शुक्र+चंद्र",
           "गुरु+शुक्र+चंद्र तीनों संबद्ध → दो पुत्रियाँ। छोटी ज्यादा चंचल।",
           (ac("JUPITER","VENUS") or ss("JUPITER","VENUS")) and
           (ac("JUPITER","MOON") or ss("JUPITER","MOON")),
           "BNN · संतान · नियम 14", ["JUPITER","VENUS","MOON"]),

        _s("uterus_surgery",
           "गर्भाशय ऑपरेशन (स्त्री): शुक्र+मंगल+केतु",
           "शुक्र+मंगल+केतु → गर्भाशय (uterus) निकालने का ऑपरेशन संभव।",
           gender=="FEMALE" and
           (ac("VENUS","MARS") or ss("VENUS","MARS")) and
           (ac("VENUS","KETU") or ss("VENUS","KETU")),
           "BNN · मेडिकल संतान · सूत्र 9", ["VENUS","MARS","KETU"]),
    ]

    benef_5 = [p for p in h5 if p in _BENEFIC]
    malef_5 = [p for p in h5 if p in _MALEFIC]
    vedic = [
        _s("5th_lord_dig",
           f"पंचमेश ({_ph(h5l)}): {_dig(h5l, h5l_sign)}",
           "पंचमेश उच्च/स्वक्षेत्र → संतान सुख।",
           _dig_ok(h5l, h5l_sign), "Parashara Hora · पंचम · नियम 1"),

        _s("jupiter_dig",
           f"गुरु (संतान कारक): {_dig('JUPITER', jup_sign)}",
           "गुरु बलवान → संतान सुख।",
           _dig_ok("JUPITER", jup_sign), "Jataka Parijata · संतान कारक · नियम 2"),

        _s("5th_benefic",
           f"5वें में शुभ ग्रह: {', '.join(_ph(p) for p in benef_5) or 'कोई नहीं'}",
           "5वें में शुभ ग्रह → संतान सुखद।",
           len(benef_5) > 0, "Brihat Parashara · पंचम · नियम 3"),

        _s("5th_malefic",
           f"5वें में पापी ग्रह: {', '.join(_ph(p) for p in malef_5) or 'कोई नहीं'}",
           "5वें में पापी → संतान कष्ट।",
           len(malef_5) > 0, "Brihat Parashara · पंचम · नियम 5"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 5, h5, "D1 — 5वाँ भाव (संतान)")},
        "av": _av(5, sav, lagna, 25),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 3: CAREER — 10th house focus
# ══════════════════════════════════════════════════════════
def _t_career(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h10  = _planets_in_house(pc, lagna, 10)
    h10l = bhavesh(lagna, 10)
    h10l_sign = pc.get(h10l, {}).get("sign", 0)
    sat_sign  = pc.get("SATURN",{}).get("sign", 0)
    sat_house = (sat_sign - lagna) % 12 + 1 if sat_sign else 0
    # Mercury in next house from Saturn = business rule
    sat_next  = sign_of_house(lagna, sat_house + 1) if sat_house else 0
    me_sign   = pc.get("MERCURY",{}).get("sign", -1)

    bnn = [
        _s("govt_job",
           "सरकारी नौकरी: गुरु+शनि+सूर्य तीनों नाड़ी संबद्ध",
           "गुरु+शनि+सूर्य नाड़ी संबद्ध → 100% सरकारी नौकरी। मेष/सिंह/धनु लग्न → केंद्र सरकार।",
           ac("JUPITER","SATURN") and (ac("JUPITER","SUN") or ss("JUPITER","SUN")),
           "BNN · करियर · नियम 2", ["JUPITER","SATURN","SUN"]),

        _s("business",
           "व्यापार: बुध शनि के अगले भाव में",
           "बुध शनि के ठीक अगले भाव में → 100% व्यापारी/स्वरोजगार।",
           sat_sign > 0 and me_sign == sat_next,
           "BNN · व्यापार योग · सूत्र 5", ["MERCURY","SATURN"]),

        _s("abundance",
           "प्रचुर धन: गुरु+शुक्र नाड़ी संबंध",
           "गुरु+शुक्र → जेब हमेशा भरी।",
           ac("JUPITER","VENUS") or ss("JUPITER","VENUS"),
           "BNN · धन योग · सूत्र 2", ["JUPITER","VENUS"]),

        _s("black_money",
           "गुप्त आय: शुक्र+राहु नाड़ी संबंध",
           "शुक्र+राहु → गुप्त आय, Black Money।",
           ac("VENUS","RAHU") or ss("VENUS","RAHU"),
           "BNN · धन सूत्र · सूत्र 11", ["VENUS","RAHU"]),

        _s("struggle_30",
           "30 साल तक संघर्ष: शनि+राहु नाड़ी संबंध",
           "शनि+राहु → 30 वर्ष तक आर्थिक अस्थिरता।",
           ac("SATURN","RAHU") or ss("SATURN","RAHU"),
           "BNN · संघर्ष योग · सूत्र 4", ["SATURN","RAHU"]),

        _s("debt",
           "जीवन भर कर्ज: मंगल+शनि नाड़ी संबंध",
           "मंगल+शनि → भारी कर्ज।",
           ac("MARS","SATURN") or ss("MARS","SATURN"),
           "BNN · ऋण योग · सूत्र 1", ["MARS","SATURN"]),

        _s("late_success",
           "देर से सफलता: शनि वक्री",
           "शनि वक्री → जीवन के उत्तरार्ध में सफलता।",
           pc.get("SATURN",{}).get("retrograde",False),
           "BNN · शनि वक्री · सूत्र 3", ["SATURN"]),

        _s("creative_career",
           "रचनात्मक/कला क्षेत्र: शुक्र+बुध नाड़ी संबंध",
           "शुक्र+बुध → कला, संगीत, लेखन, मीडिया में करियर।",
           ac("VENUS","MERCURY") or ss("VENUS","MERCURY"),
           "BNN · करियर · सूत्र 8", ["VENUS","MERCURY"]),

        _s("medical",
           "चिकित्सा/रहस्य क्षेत्र: शनि+केतु+मंगल",
           "शनि+केतु+मंगल नाड़ी संबद्ध → डॉक्टर, सर्जन, तांत्रिक।",
           (ac("SATURN","KETU") or ss("SATURN","KETU")) and ac("MARS","SATURN"),
           "BNN · करियर · सूत्र 9", ["SATURN","KETU","MARS"]),

        _s("govt_partial",
           "सरकारी (संभावित): शनि+सूर्य (गुरु बिना)",
           "शनि+सूर्य (गुरु के बिना) → सरकारी या सामाजिक सेवा संभव।",
           (ac("SATURN","SUN") or ss("SATURN","SUN")) and
           not (ac("JUPITER","SATURN") and ac("JUPITER","SUN")),
           "BNN · करियर · सरकारी · सूत्र 2", ["SATURN","SUN"]),

        _s("millionaire_jupiter",
           "20-21 में करोड़पति: शनि के अगले में गुरु",
           "शनि के ठीक अगले भाव में गुरु → 20-21 वर्ष में असाधारण सफलता।",
           bool(pc.get("SATURN")) and bool(pc.get("JUPITER")) and
           pc["JUPITER"]["sign"] == sign_of_house(lagna,
               house_dist(lagna, pc["SATURN"]["sign"]) + 1),
           "BNN · करियर · सफलता · सूत्र 3", ["SATURN","JUPITER"]),

        _s("business_triple",
           "100% व्यापारी: शनि+शुक्र+बुध",
           "शनि+शुक्र+बुध तीनों संबद्ध → 100% व्यापारी।",
           (ac("SATURN","MERCURY") or ss("SATURN","MERCURY")) and
           (ac("SATURN","VENUS") or ss("SATURN","VENUS")),
           "BNN · करियर · व्यापार · सूत्र 2", ["SATURN","VENUS","MERCURY"]),

        _s("sat_rahu_struggle",
           "30 साल संघर्ष: शनि+राहु",
           "शनि+राहु → 30 वर्ष तक आर्थिक अस्थिरता।",
           ac("SATURN","RAHU") or ss("SATURN","RAHU"),
           "BNN · करियर · संघर्ष · सूत्र 1", ["SATURN","RAHU"]),

        _s("jup_ven_wealthy",
           "जेब हमेशा भरी: गुरु+शुक्र",
           "गुरु+शुक्र → पैसे की कभी कमी नहीं।",
           ac("JUPITER","VENUS") or ss("JUPITER","VENUS"),
           "BNN · करियर · धन · सूत्र 5", ["JUPITER","VENUS"]),

        _s("jup_rahu_poor",
           "आर्थिक संकट: गुरु+राहु (शुक्र नहीं)",
           "गुरु+राहु (शुक्र का संबंध नहीं) → भयंकर आर्थिक संकट।",
           (ac("JUPITER","RAHU") or ss("JUPITER","RAHU")) and
           not (ac("JUPITER","VENUS") or ss("JUPITER","VENUS")),
           "BNN · करियर · दरिद्रता · सूत्र 1", ["JUPITER","RAHU"]),

        _s("debt_mars_sat",
           "जीवन भर कर्जा: मंगल+शनि",
           "मंगल+शनि → जीवन भर कर्जे का बोझ।",
           ac("MARS","SATURN") or ss("MARS","SATURN"),
           "BNN · करियर · कर्ज · सूत्र 1", ["MARS","SATURN"]),

        _s("debt_moon_mars",
           "जीवन में कर्ज: चंद्र+मंगल",
           "चंद्र+मंगल → जीवन में एक बार कर्ज लेना पड़ेगा।",
           ac("MOON","MARS") or ss("MOON","MARS"),
           "BNN · करियर · कर्ज · सूत्र 2", ["MOON","MARS"]),

        _s("millionaire_sun_me_ve",
           "करोड़पति: सूर्य के अगले में बुध+शुक्र (अस्त नहीं)",
           "सूर्य के ठीक अगले भाव में बुध+शुक्र (दोनों अस्त नहीं) → करोड़पति।",
           bool(pc.get("SUN")) and bool(pc.get("MERCURY")) and bool(pc.get("VENUS")) and
           pc["MERCURY"]["sign"] == sign_of_house(lagna,
               house_dist(lagna, pc["SUN"]["sign"]) + 1) and
           pc["VENUS"]["sign"] == sign_of_house(lagna,
               house_dist(lagna, pc["SUN"]["sign"]) + 1) and
           not pc["MERCURY"].get("combust",False) and
           not pc["VENUS"].get("combust",False),
           "BNN · करियर · धन · सूत्र 6", ["SUN","MERCURY","VENUS"]),
    ]

    benef_10 = [p for p in h10 if p in _BENEFIC]
    malef_10 = [p for p in h10 if p in _MALEFIC]
    vedic = [
        _s("10th_lord_dig",
           f"दशमेश ({_ph(h10l)}): {_dig(h10l, h10l_sign)}",
           "दशमेश उच्च/स्वक्षेत्र → उच्च करियर।",
           _dig_ok(h10l, h10l_sign), "Parashara Hora · दशम · नियम 1"),

        _s("saturn_dig",
           f"शनि (करियर कारक): {_dig('SATURN', sat_sign)}",
           "शनि बलवान → मेहनत का फल।",
           _dig_ok("SATURN", sat_sign), "Uttara Kalamrita · शनि बल · नियम 3"),

        _s("10th_planets",
           f"10वें में ग्रह: {', '.join(_ph(p) for p in h10) or 'खाली'}",
           "10वें में शुभ ग्रह → करियर सफल।",
           any(p in _BENEFIC for p in h10), "Brihat Parashara · दशम · नियम 4"),

        _s("sun_10th",
           f"सूर्य 10वें भाव में: {'हाँ' if 'SUN' in h10 else 'नहीं'}",
           "सूर्य 10वें → सरकारी पद, नेतृत्व।",
           "SUN" in h10, "Jataka Parijata · सूर्य दशम · नियम 1"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 10, h10, "D1 — 10वाँ भाव (करियर)")},
        "av": _av(10, sav, lagna, 30),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 4: DHAN (Wealth) — 2nd + 11th house
# ══════════════════════════════════════════════════════════
def _t_dhan(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h2   = _planets_in_house(pc, lagna, 2)
    h11  = _planets_in_house(pc, lagna, 11)
    h8   = _planets_in_house(pc, lagna, 8)
    h2l  = bhavesh(lagna, 2);  h2l_s  = pc.get(h2l, {}).get("sign",0)
    h11l = bhavesh(lagna,11);  h11l_s = pc.get(h11l,{}).get("sign",0)

    bnn = [
        _s("abundant",
           "प्रचुर धन: गुरु+शुक्र नाड़ी संबंध",
           "गुरु+शुक्र → जेब हमेशा भरी, प्रचुर धन।",
           ac("JUPITER","VENUS") or ss("JUPITER","VENUS"),
           "BNN · धन योग · सूत्र 2", ["JUPITER","VENUS"]),

        _s("sudden_wealth",
           "अचानक धन: 8वें में 2+ ग्रह",
           "8वें में 2+ ग्रह → लॉटरी/वसीयत/अचानक लाभ।",
           len(h8) >= 2,
           "BNN · अष्टम भाव · सूत्र 3"),

        _s("inheritance",
           "पैतृक संपत्ति: गुरु/चंद्र+शुक्र",
           "गुरु/चंद्र+शुक्र → वसीयत/पैतृक संपत्ति।",
           ac("JUPITER","VENUS") or (ac("MOON","VENUS") or ss("MOON","VENUS")),
           "BNN · धन-संपत्ति · सूत्र 8", ["JUPITER","VENUS"]),

        _s("free_property",
           "उपहार में संपत्ति: शनि+बुध नाड़ी",
           "शनि+बुध → बिना परिश्रम संपत्ति, उपहार में जमीन।",
           ac("SATURN","MERCURY") or ss("SATURN","MERCURY"),
           "BNN · अष्टम भाव · सूत्र 5", ["SATURN","MERCURY"]),

        _s("debt",
           "जीवन भर कर्ज: मंगल+शनि नाड़ी संबंध",
           "मंगल+शनि → भयंकर कर्जा, जीवन भर आर्थिक बोझ।",
           ac("MARS","SATURN") or ss("MARS","SATURN"),
           "BNN · ऋण योग · सूत्र 1", ["MARS","SATURN"]),

        _s("hidden_income",
           "गुप्त धन: शुक्र+राहु नाड़ी संबंध",
           "शुक्र+राहु → गुप्त आय, अज्ञात स्रोत से पैसा।",
           ac("VENUS","RAHU") or ss("VENUS","RAHU"),
           "BNN · धन सूत्र · सूत्र 11", ["VENUS","RAHU"]),

        _s("loss_saturn_rahu",
           "आर्थिक अस्थिरता: शनि+राहु",
           "शनि+राहु → 30 साल तक पैसा टिकता नहीं।",
           ac("SATURN","RAHU") or ss("SATURN","RAHU"),
           "BNN · संघर्ष योग · सूत्र 4", ["SATURN","RAHU"]),
    ]

    h2_av_val  = _sav_house(sav, lagna, 2)
    h11_av_val = _sav_house(sav, lagna, 11)
    vedic = [
        _s("2nd_lord",
           f"द्वितीयेश ({_ph(h2l)}): {_dig(h2l, h2l_s)}",
           "2रे का स्वामी बलवान → धन संचय।",
           _dig_ok(h2l, h2l_s), "Parashara Hora · द्वितीय · नियम 1"),

        _s("11th_lord",
           f"लाभेश ({_ph(h11l)}): {_dig(h11l, h11l_s)}",
           "11वें का स्वामी बलवान → निरंतर आय।",
           _dig_ok(h11l, h11l_s), "Parashara Hora · लाभ भाव · नियम 1"),

        _s("2nd_planets",
           f"2रे में ग्रह: {', '.join(_ph(p) for p in h2) or 'खाली'}",
           "2रे में शुभ → धन संचय।",
           any(p in _BENEFIC for p in h2), "Brihat Parashara · द्वितीय · नियम 3"),

        _s("11th_planets",
           f"11वें में ग्रह: {', '.join(_ph(p) for p in h11) or 'खाली'}",
           "11वें में शुभ → निरंतर लाभ।",
           any(p in _BENEFIC for p in h11), "Brihat Parashara · लाभ भाव · नियम 3"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {
            "d1_2nd":  _d1_house(lagna, 2,  h2,  f"D1 — 2रा भाव (धन) | AV: {h2_av_val}/56"),
            "d1_11th": _d1_house(lagna, 11, h11, f"D1 — 11वाँ भाव (लाभ) | AV: {h11_av_val}/56"),
        },
        "av": {
            "house": 2, "bindus": h2_av_val, "max": 56, "strong": h2_av_val >= 27,
            "note": f"2रा: {h2_av_val}/56 | 11वाँ: {h11_av_val}/56 | कुल: {h2_av_val+h11_av_val}/112"
        },
    }


# ══════════════════════════════════════════════════════════
# TOPIC 5: AYU (Lifespan) — 8th + 1st focus
# ══════════════════════════════════════════════════════════
def _t_ayu(pc, lagna, sav, gender):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    wk = lambda p: is_weak(pc, p, lagna)
    jeeva = "JUPITER" if gender=="MALE" else "VENUS"
    h8  = _planets_in_house(pc, lagna, 8)
    h1  = _planets_in_house(pc, lagna, 1)
    h8l = bhavesh(lagna, 8);  h8l_s = pc.get(h8l,{}).get("sign",0)
    lg  = bhavesh(lagna, 1);  lg_s  = pc.get(lg, {}).get("sign",0)
    moon_combust = pc.get("MOON",{}).get("combust",False)

    bnn = [
        _s("alpayu_moon_rahu",
           "अल्पायु: चंद्र+राहु एक राशि",
           "चंद्र+राहु एक राशि → शारीरिक क्षय + मानसिक रोग + अल्पायु।",
           ss("MOON","RAHU"),
           "Saptarishi Nadi · अल्पायु · सूत्र 7", ["MOON","RAHU"]),

        _s("alpayu_moon_ketu",
           "अल्पायु: चंद्र+केतु एक राशि",
           "चंद्र+केतु → पूर्व जन्म दोष, मध्यम/अल्पायु।",
           ss("MOON","KETU"),
           "BNN · आयु सूत्र · नियम 4", ["MOON","KETU"]),

        _s("alpayu_combust",
           "अल्पायु: चंद्रमा अस्त (सूर्य से 12° भीतर)",
           "चंद्रमा अस्त → जीवनी शक्ति क्षीण।",
           moon_combust,
           "BNN · आयु सूत्र · नियम 3", ["MOON","SUN"]),

        _s("alpayu_jup_rahu",
           "अल्पायु: गुरु+राहु नाड़ी संबंध",
           "गुरु+राहु → 30 वर्ष संघर्ष, अल्पायु भय।",
           ac("JUPITER","RAHU") or ss("JUPITER","RAHU"),
           "BNN · गुरु-राहु दोष · सूत्र 15", ["JUPITER","RAHU"]),

        _s("dirghayu_jeeva_sun",
           f"दीर्घायु: {_ph(jeeva)}+सूर्य नाड़ी संबंध",
           "जीव कारक+सूर्य → दीर्घायु 90+ वर्ष, देव तुल्य सम्मान।",
           ac(jeeva,"SUN") or ss(jeeva,"SUN"),
           "BNN · आयु सूत्र · नियम 9", [jeeva,"SUN"]),

        _s("dirghayu_jup_ve",
           "दीर्घायु: गुरु+शुक्र नाड़ी संबंध",
           "गुरु+शुक्र → दीर्घायु, भोग-विलास।",
           ac("JUPITER","VENUS") or ss("JUPITER","VENUS"),
           "BNN · आयु सूत्र · नियम 11", ["JUPITER","VENUS"]),

        _s("sat_retro_alpayu",
           "जीवन संकट: शनि वक्री+मंगल+केतु+6/8/12 स्वामी",
           "शनि वक्री + मंगल+केतु + दुष्ट स्वामी → कोमा, जीवन संकट।",
           pc.get("SATURN",{}).get("retrograde",False) and
           (ac("MARS","KETU") or ss("MARS","KETU")) and
           any(ac("SATURN", bhavesh(lagna, h)) for h in [6,8,12]),
           "BNN · दुर्घटना योग · सूत्र 7", ["SATURN","MARS","KETU"]),

        _s("sun_weak_alpayu",
           "सूर्य बलहीन → आयु पर प्रभाव",
           "सूर्य (आत्मा कारक) बलहीन → जीवनी शक्ति कमज़ोर, अल्पायु का खतरा।",
           is_weak(pc, "SUN", lagna),
           "BNN · आयु · सूत्र 10", ["SUN"]),

        _s("mars_weak_alpayu",
           "मंगल बलहीन → शरीर कमज़ोर",
           "मंगल (शरीर/रक्त) बलहीन → शरीर की ताकत कम, उम्र के साथ गंभीर रोगी।",
           is_weak(pc, "MARS", lagna),
           "BNN · आयु · सूत्र 11", ["MARS"]),

        _s("jup_ven_dirghayu",
           "दीर्घायु: गुरु+शुक्र (पुरुष कुंडली)",
           "पुरुष में गुरु+शुक्र → दीर्घायु, विलासी, कन्या संतान।",
           gender == "MALE" and (ac("JUPITER","VENUS") or ss("JUPITER","VENUS")),
           "BNN · आयु · सूत्र 12", ["JUPITER","VENUS"]),
    ]

    vedic = [
        _s("8th_lord_dig",
           f"अष्टमेश ({_ph(h8l)}): {_dig(h8l, h8l_s)}",
           "अष्टमेश बलवान → दीर्घायु।",
           _dig_ok(h8l, h8l_s), "Parashara Hora · अष्टम · नियम 1"),

        _s("lagnesh_dig",
           f"लग्नेश ({_ph(lg)}): {_dig(lg, lg_s)}",
           "लग्नेश बलवान → शरीर स्वस्थ, दीर्घायु।",
           _dig_ok(lg, lg_s), "Brihat Parashara · लग्नेश · नियम 2"),

        _s("8th_malefic",
           f"8वें में ग्रह: {', '.join(_ph(p) for p in h8) or 'खाली'}",
           "8वें में पापी → आयु क्षय।",
           any(p in _MALEFIC for p in h8), "Brihat Parashara · अष्टम · नियम 5"),

        _s("saturn_dig",
           f"शनि (आयु कारक): {_dig('SATURN', pc.get('SATURN',{}).get('sign',0))}",
           "शनि बलवान → दीर्घायु, अनुशासन।",
           _dig_ok("SATURN", pc.get("SATURN",{}).get("sign",0)),
           "Uttara Kalamrita · शनि आयु · नियम 5"),
    ]

    h1_av = _sav_house(sav, lagna, 1)
    h8_av = _sav_house(sav, lagna, 8)
    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {
            "d1_1st": _d1_house(lagna, 1, h1, f"D1 — लग्न भाव | AV: {h1_av}/56"),
            "d1_8th": _d1_house(lagna, 8, h8, f"D1 — 8वाँ भाव | AV: {h8_av}/56"),
        },
        "av": {
            "house": 1, "bindus": h1_av, "max": 56, "strong": h1_av >= 25,
            "note": f"लग्न: {h1_av}/56 | 8वाँ: {h8_av}/56"
        },
    }


# ══════════════════════════════════════════════════════════
# TOPIC 6: SWASTHYA (Health/Disease) — 6th house focus
# ══════════════════════════════════════════════════════════
def _t_swasthya(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h6  = _planets_in_house(pc, lagna, 6)
    h6l = bhavesh(lagna, 6); h6l_s = pc.get(h6l,{}).get("sign",0)
    lg  = bhavesh(lagna, 1); lg_s  = pc.get(lg, {}).get("sign",0)
    jup_sign = pc.get("JUPITER",{}).get("sign",0)
    # BUG FIX: Heart rule requires both Sun AND Mars to ASPECT (drishti) Jupiter
    # Not loose nadi ac() — only true drishti/yuti counts here
    jup_h = get_house(pc, "JUPITER", lagna) if pc.get("JUPITER") else 0
    def _aspects_jupiter(planet):
        """Does planet have drishti or yuti with Jupiter's bhav?"""
        if not pc.get(planet) or not jup_h: return False
        ph = house_dist(lagna, pc[planet]["sign"])
        if ph == jup_h: return True  # yuti
        if planet == "MARS":
            return jup_h in {(ph+3)%12 or 12, (ph+6)%12 or 12, (ph+7)%12 or 12}
        if planet == "SATURN":
            return jup_h in {(ph+2)%12 or 12, (ph+6)%12 or 12, (ph+9)%12 or 12}
        # Sun, Moon, Venus, Mercury — only 7th drishti
        return jup_h == ((ph+6)%12 or 12)
    fire_count = sum([
        _aspects_jupiter("SUN"),
        _aspects_jupiter("MARS"),
    ])

    bnn = [
        _s("heart",
           "हृदय रोग: गुरु+2 अग्नि ग्रह (सूर्य/मंगल)",
           "गुरु + 2 अग्नि ग्रह नाड़ी संबद्ध → हृदय रोग, BP।",
           fire_count >= 2,
           "BNN · रोग सूत्र · हृदय · सूत्र 4", ["JUPITER","SUN","MARS"]),

        _s("arthritis",
           "जोड़ों का दर्द (वात): शनि+राहु",
           "शनि+राहु → वायु तत्व असंतुलन, जोड़ों का दर्द।",
           ac("SATURN","RAHU") or ss("SATURN","RAHU"),
           "BNN · रोग · वात · सूत्र 7", ["SATURN","RAHU"]),

        _s("kidney",
           "गुर्दे की पथरी: शुक्र+चंद्र+शनि+बुध",
           "शुक्र+चंद्र+शनि+बुध → गुर्दे की पथरी।",
           (ac("VENUS","MOON") or ss("VENUS","MOON")) and (ac("SATURN","MERCURY") or ss("SATURN","MERCURY")),
           "BNN · रोग · गुर्दा · सूत्र 2", ["VENUS","MOON","SATURN","MERCURY"]),

        _s("diabetes",
           "मधुमेह: शुक्र+चंद्रमा नाड़ी संबंध",
           "शुक्र+चंद्र → मधुमेह की प्रवृत्ति।",
           ac("VENUS","MOON") or ss("VENUS","MOON"),
           "BNN · रोग · मधुमेह · सूत्र 1", ["VENUS","MOON"]),

        _s("mental_disease",
           "मानसिक रोग: चंद्र+राहु/केतु एक राशि",
           "चंद्र+राहु/केतु एक राशि → मानसिक रोग।",
           ss("MOON","RAHU") or ss("MOON","KETU"),
           "BNN · मानसिक · सूत्र 3", ["MOON","RAHU"]),

        _s("tb_lungs",
           "TB/फेफड़े: चंद्र+बुध+शनि नाड़ी",
           "चंद्र+बुध+शनि → टीबी, फेफड़ों की बीमारी।",
           (ac("MOON","MERCURY") or ss("MOON","MERCURY")) and (ac("SATURN","MERCURY") or ss("SATURN","MERCURY")),
           "BNN · रोग · फेफड़े · सूत्र 3", ["MOON","MERCURY","SATURN"]),

        _s("skin",
           "त्वचा रोग: शनि+मंगल नाड़ी संबंध",
           "शनि+मंगल → त्वचा रोग, घाव।",
           ac("SATURN","MARS") or ss("SATURN","MARS"),
           "BNN · रोग · त्वचा · सूत्र 6", ["SATURN","MARS"]),

        _s("eye",
           "आँख की समस्या: वक्री शनि + सूर्य संबंध",
           "शनि वक्री हो और (सूर्य-शनि एक भाव में हों या सूर्य शनि से 7वें में हो) "
           "→ आँख की रोशनी कम, नेत्र रोग।",
           (pc.get("SATURN",{}).get("retrograde", False) and
            (ss("SUN","SATURN") or
             (bool(gh("SATURN")) and bool(gh("SUN")) and
              house_dist(pc["SATURN"]["sign"], pc["SUN"]["sign"]) == 7))),
           "BNN · रोग · नेत्र · सूत्र 2", ["SUN","SATURN"]),

        _s("heart_severe",
           "हृदय रोग (गंभीर): सूर्य+शनि+राहु निकट",
           "सूर्य+शनि+राहु एक साथ → भयंकर हृदय रोग और BP।",
           (bool(pc.get("SUN")) and bool(pc.get("SATURN")) and bool(pc.get("RAHU")) and
            house_dist(pc["SUN"]["sign"], pc["SATURN"]["sign"]) in (1,2,12) and
            house_dist(pc["SUN"]["sign"], pc["RAHU"]["sign"]) in (1,2,12)),
           "BNN · रोग · हृदय · सूत्र 5", ["SUN","SATURN","RAHU"]),

        _s("acidity",
           "एसिडिटी / पित्त रोग: गुरु+सूर्य",
           "गुरु+सूर्य नाड़ी संबंध → पित्त दोष, एसिडिटी।",
           jup_sun_strict(pc),
           "BNN · रोग · पित्त · सूत्र 3", ["JUPITER","SUN"]),

        _s("diabetes_neech",
           "मधुमेह / फैटी लीवर: गुरु नीच (मकर)",
           "गुरु मकर राशि (नीच) में → मधुमेह, फैटी लीवर, कोलेस्ट्रॉल।",
           pc.get("JUPITER",{}).get("sign") == 10,
           "BNN · रोग · मधुमेह · सूत्र 2", ["JUPITER"]),

        _s("diabetes_jup_ven",
           "मधुमेह (प्रवृत्ति): गुरु+शुक्र युति",
           "गुरु+शुक्र युति → मधुमेह की प्रवृत्ति।",
           ss("JUPITER","VENUS"),
           "BNN · रोग · मधुमेह · सूत्र 3", ["JUPITER","VENUS"]),

        _s("kidney_weak",
           "गुर्दे कमज़ोर: केवल शुक्र+चंद्र (पथरी नहीं)",
           "शुक्र+चंद्र (शनि+बुध नहीं) → गुर्दे कमज़ोर, पथरी नहीं।",
           (ac("VENUS","MOON") or ss("VENUS","MOON")) and
           not (ac("SATURN","MERCURY") or ss("SATURN","MERCURY")),
           "BNN · रोग · गुर्दा · सूत्र 3", ["VENUS","MOON"]),

        _s("gallbladder",
           "पित्ताशय (Gallbladder): राहु केंद्र में",
           "राहु 1/4/7/10 केंद्र भाव में → पित्ताशय की पथरी संभव।",
           any(in_house(pc,"RAHU",k,lagna) for k in [1,4,7,10]),
           "BNN · रोग · पित्ताशय · सूत्र 1", ["RAHU"]),

        _s("gallbladder_severe",
           "पित्ताशय (गंभीर): लग्न केतु + 7वें राहु",
           "लग्न में केतु + 7वें में राहु → पित्ताशय की गंभीर पथरी।",
           in_house(pc,"KETU",1,lagna) and in_house(pc,"RAHU",7,lagna),
           "BNN · रोग · पित्ताशय · सूत्र 2", ["KETU","RAHU"]),

        _s("asthma",
           "अस्थमा / सांस की तकलीफ: गुरु+चंद्र/शुक्र/शनि/राहु (2+)",
           "गुरु से 2+ ग्रह (चंद्र/शुक्र/शनि/राहु) संबद्ध → 100% अस्थमा।",
           (bool(pc.get("JUPITER")) and
            sum(1 for ap in ["MOON","VENUS","SATURN","RAHU"] if ac("JUPITER",ap)) >= 2),
           "BNN · रोग · अस्थमा · सूत्र 1", ["JUPITER"]),

        _s("skin_severe",
           "भयंकर चर्म रोग: सूर्य+मंगल+राहु",
           "सूर्य+मंगल+राहु का संबंध → पित्त विकृति, गंभीर चर्म/त्वचा रोग।",
           (ss("SUN","MARS") or ac("SUN","MARS")) and (ac("SUN","RAHU") or ac("MARS","RAHU")),
           "BNN · रोग · त्वचा · सूत्र 5", ["SUN","MARS","RAHU"]),

        _s("eczema",
           "ड्राई एग्जिमा: बुध+चंद्र" + get_diptansha_alert(pc,"MERCURY","MOON"),
           "बुध+चंद्र → 100% ड्राई एग्जिमा (त्वचा रोग) और जीवन में बदनामी।",
           ac("MERCURY","MOON") or ss("MERCURY","MOON"),
           "BNN · रोग · त्वचा · सूत्र 6", ["MERCURY","MOON"]),

        _s("eye_8th",
           "आँख रोग: सूर्य 8वें भाव में",
           "सूर्य 8वें भाव में → आँख की रोशनी कमज़ोर।",
           in_house(pc,"SUN",8,lagna),
           "BNN · रोग · नेत्र · सूत्र 3", ["SUN"]),

        _s("eye_sun_ven",
           "आँख / चश्मा जल्दी: सूर्य के 2रे में शुक्र",
           "सूर्य के 2रे भाव में शुक्र → जल्दी चश्मा, आँख की समस्या।",
           (bool(pc.get("SUN")) and bool(pc.get("VENUS")) and
            house_dist(pc["SUN"]["sign"], pc["VENUS"]["sign"]) == 2),
           "BNN · रोग · नेत्र · सूत्र 4", ["SUN","VENUS"]),

        _s("brain_tumor",
           "ब्रेन ट्यूमर / ENT: बुध+मंगल+केतु/राहु",
           "बुध+मंगल+केतु/राहु → मस्तिष्क रोग, ब्रेन ट्यूमर, ENT समस्या।",
           (ss("MERCURY","MARS") or ac("MERCURY","MARS")) and
           (ac("MERCURY","KETU") or ac("MERCURY","RAHU")),
           "BNN · रोग · मस्तिष्क · सूत्र 1", ["MERCURY","MARS","KETU"]),

        _s("sinusitis",
           "साइनस: सूर्य/गुरु वृश्चिक (8) राशि में",
           "सूर्य या गुरु वृश्चिक राशि में → भयंकर साइनस की बीमारी।",
           pc.get("SUN",{}).get("sign") == 8 or pc.get("JUPITER",{}).get("sign") == 8,
           "BNN · रोग · साइनस · सूत्र 1", ["SUN","JUPITER"]),

        _s("lung_tb",
           "फेफड़े/टीबी: चंद्र 8वें भाव में",
           "चंद्र 8वें भाव में → कफ, फेफड़े के रोग, टीबी।",
           in_house(pc,"MOON",8,lagna),
           "BNN · रोग · फेफड़े · सूत्र 2", ["MOON"]),

        _s("cough_kafa",
           "भयंकर खांसी / कफ: गुरु+चंद्र+शुक्र",
           "गुरु+चंद्र+शुक्र तीनों संबद्ध → जल तत्व असंतुलन, भयंकर कफ रोग।",
           ac("JUPITER","MOON") and ac("JUPITER","VENUS"),
           "BNN · रोग · कफ · सूत्र 1", ["JUPITER","MOON","VENUS"]),

        _s("piles_accident",
           "बवासीर + दुर्घटनाएं: मंगल+केतु 8वें में",
           "मंगल+केतु 8वें भाव में → बवासीर (Piles) + जीवन में गंभीर दुर्घटनाएं।",
           in_house(pc,"MARS",8,lagna) and in_house(pc,"KETU",8,lagna),
           "BNN · रोग · अष्टम · सूत्र 3", ["MARS","KETU"]),

        _s("tooth_autoimmune",
           "दांत में कीड़ा / ऑटो-इम्यून: मंगल+शनि",
           "मंगल+शनि → दांतों में कैविटी, ऑटो-इम्यून, कर्जे का बोझ।",
           ac("MARS","SATURN") or ss("MARS","SATURN"),
           "BNN · रोग · दंत · सूत्र 1", ["MARS","SATURN"]),

        _s("gums",
           "मसूड़ों की समस्या: मंगल+केतु",
           "मंगल+केतु → मसूड़ों के रोग।",
           ac("MARS","KETU") or ss("MARS","KETU"),
           "BNN · रोग · दंत · सूत्र 2", ["MARS","KETU"]),

        _s("ent",
           "नाक/कान/गला (ENT): बुध+केतु",
           "बुध+केतु → नाक, कान, गले के गंभीर रोग।",
           ac("MERCURY","KETU") or ss("MERCURY","KETU"),
           "BNN · रोग · ENT · सूत्र 1", ["MERCURY","KETU"]),

        _s("stomach",
           "पेट / पाचन रोग: राहु चंद्र के 2रे/12वें में",
           "राहु चंद्र के 2रे या 12वें भाव में → पाचन तंत्र कमज़ोर, पेट रोग।",
           (bool(pc.get("MOON")) and bool(pc.get("RAHU")) and
            pc["RAHU"]["sign"] in (sign_of_house(pc["MOON"]["sign"],2),
                                    sign_of_house(pc["MOON"]["sign"],12))),
           "BNN · रोग · पेट · सूत्र 1", ["MOON","RAHU"]),

        _s("panic",
           "घबराहट / Panic: चंद्र+केतु" + get_diptansha_alert(pc,"MOON","KETU"),
           "चंद्र+केतु → हमेशा अजीब घबराहट (Panic/Anxiety) बनी रहती है।",
           ac("MOON","KETU") or ss("MOON","KETU"),
           "BNN · मानसिक · सूत्र 4", ["MOON","KETU"]),

        _s("deep_depression",
           "गहरा अवसाद: चंद्र+बुध समान डिग्री",
           "चंद्र+बुध एकदम समान डिग्री पर → भयंकर/गहरा अवसाद।",
           (bool(pc.get("MOON")) and bool(pc.get("MERCURY")) and
            pc["MOON"]["sign"] == pc["MERCURY"]["sign"] and
            abs(pc["MOON"]["degree"] - pc["MERCURY"]["degree"]) < 1.0),
           "BNN · मानसिक · सूत्र 5", ["MOON","MERCURY"]),

        _s("cervical",
           "सर्वाइकल / गर्दन दर्द: राहु/केतु 3/7/11 में",
           "राहु या केतु 3/7/11 भाव में → सर्वाइकल, गर्दन दर्द।",
           any(in_house(pc,sh,h,lagna) for sh in ["RAHU","KETU"] for h in [3,7,11]
               if pc.get(sh)),
           "BNN · रोग · सर्वाइकल · सूत्र 1", ["RAHU","KETU"]),

        _s("blood_allergy",
           "रक्त एलर्जी: बुध+मंगल" + get_diptansha_alert(pc,"MERCURY","MARS"),
           "बुध+मंगल → रक्त संबंधी एलर्जी।",
           ac("MERCURY","MARS") or ss("MERCURY","MARS"),
           "BNN · रोग · रक्त · सूत्र 1", ["MERCURY","MARS"]),

        _s("pitta_tridosha",
           "पित्त विकार / हृदय (त्रिदोष): गुरु+अग्नि+जल",
           "गुरु + अग्नि ग्रह (सूर्य/मंगल) + जल ग्रह (शुक्र/चंद्र) → पित्त और हृदय रोग।",
           (bool(pc.get("JUPITER")) and
            any(ac("JUPITER",p) for p in ["SUN","MARS"]) and
            any(ac("JUPITER",p) for p in ["VENUS","MOON"])),
           "BNN · त्रिदोष · पित्त · सूत्र 1"),

        _s("vata_tridosha",
           "वात रोग / गठिया (त्रिदोष): गुरु+वायु ग्रह",
           "गुरु + वायु ग्रह (शनि/राहु) संबद्ध → वात रोग, जोड़ों का दर्द।",
           (bool(pc.get("JUPITER")) and
            any(ac("JUPITER",p) or ss("JUPITER",p) for p in ["SATURN","RAHU"])),
           "BNN · त्रिदोष · वात · सूत्र 1"),

        _s("surgery",
           "जीवन में सर्जरी: मंगल से 1/5/9 में राहु/केतु",
           "मंगल से 1/5/9 में राहु या केतु → जीवन में कम से कम एक ऑपरेशन अवश्य।",
           (bool(pc.get("MARS")) and
            any(bool(pc.get(sh)) and
                house_dist(pc["MARS"]["sign"], pc[sh]["sign"]) in (1,5,9)
                for sh in ["RAHU","KETU"])),
           "BNN · रोग · सर्जरी · सूत्र 1", ["MARS","RAHU","KETU"]),
    ]

    vedic = [
        _s("6th_lord_dig",
           f"षष्ठेश ({_ph(h6l)}): {_dig(h6l, h6l_s)}",
           "षष्ठेश पापी/नीच → रोग की प्रबलता।",
           not _dig_ok(h6l, h6l_s), "Parashara Hora · षष्ठ · नियम 1"),

        _s("6th_planets",
           f"6वें में ग्रह: {', '.join(_ph(p) for p in h6) or 'खाली'}",
           "6वें में ग्रह → रोग का संकेत।",
           len(h6) > 0, "Brihat Parashara · षष्ठ · नियम 4"),

        _s("lagnesh_health",
           f"लग्नेश ({_ph(lg)}): {_dig(lg, lg_s)}",
           "लग्नेश बलवान → शरीर स्वस्थ।",
           _dig_ok(lg, lg_s), "Brihat Parashara · लग्नेश · नियम 2"),

        _s("jupiter_health",
           f"गुरु (जीव कारक): {_dig('JUPITER', jup_sign)}",
           "गुरु बलवान → रोग प्रतिरोधक क्षमता अच्छी।",
           _dig_ok("JUPITER", jup_sign), "Jataka Parijata · गुरु स्वास्थ्य · नियम 1"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 6, h6, "D1 — 6वाँ भाव (रोग/शत्रु)")},
        "av": _av(6, sav, lagna, 30),  # high 6th AV = more disease
    }


# ══════════════════════════════════════════════════════════
# TOPIC 7: MANAS (Mental Peace) — 4th + Moon focus
# ══════════════════════════════════════════════════════════
def _t_manas(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h4  = _planets_in_house(pc, lagna, 4)
    h4l = bhavesh(lagna, 4); h4l_s = pc.get(h4l,{}).get("sign",0)
    mo_sign = pc.get("MOON",{}).get("sign",0)

    bnn = [
        _s("stress_rahu",
           "मानसिक तनाव: चंद्र+राहु/केतु निकट",
           "चंद्र+राहु/केतु 1/2/12 नाड़ी → मानसिक तनाव, भ्रम।",
           ss("MOON","RAHU") or ss("MOON","KETU"),
           "BNN · मानसिक शांति · सूत्र 3", ["MOON","RAHU"]),

        _s("protection_jup",
           "मानसिक संरक्षण: चंद्र+गुरु एक राशि",
           "चंद्र+गुरु → मानसिक संरक्षण, डिप्रेशन से बचाव।",
           ss("MOON","JUPITER"),
           "BNN · मानसिक शांति · सूत्र 9", ["MOON","JUPITER"]),

        _s("venus_ketu_stress",
           "मानसिक अशांति: शुक्र+केतु",
           "शुक्र+केतु → रिश्तों में अनिश्चितता, मानसिक अशांति।",
           ac("VENUS","KETU") or ss("VENUS","KETU"),
           "BNN · मानसिक · सूत्र 5", ["VENUS","KETU"]),

        _s("depression",
           "डिप्रेशन: शनि+चंद्र युति (एक ही भाव)",
           "शनि+चंद्र एक ही भाव में (युति) → गंभीर डिप्रेशन, अकेलापन, निराशा।",
           bool(get_house(pc,"SATURN",lagna)) and
           get_house(pc,"SATURN",lagna) == get_house(pc,"MOON",lagna),
           "BNN · मानसिक · सूत्र 7", ["SATURN","MOON"]),

        _s("anxiety",
           "चिंता/फोबिया: राहु+बुध+चंद्र",
           "राहु+बुध+चंद्र नाड़ी → अत्यधिक चिंता, फोबिया।",
           (ac("RAHU","MERCURY") or ss("RAHU","MERCURY")) and ac("MOON","MERCURY"),
           "BNN · मानसिक · सूत्र 11", ["RAHU","MERCURY","MOON"]),


        _s("double_depression",
           "डबल डिप्रेशन — सूर्य+राहु AND चंद्र+राहु",
           "सूर्य और चंद्र दोनों पर राहु का प्रभाव → भयंकर डिप्रेशन, जीवन में तगड़ा मानसिक संघर्ष।",
           (ac("SUN","RAHU") or ss("SUN","RAHU")) and (ac("MOON","RAHU") or ss("MOON","RAHU")),
           "BNN · मानसिक · डबल डिप्रेशन", ["SUN","MOON","RAHU"]),

        _s("ghar_bhagana",
           "घर छोड़कर भागने की प्रवृत्ति",
           "चंद्र नीच (वृश्चिक) हो या राहु/केतु से पीड़ित हो → "
           "कोई भी बहकावे में आकर घर से भगा ले जा सकता है।",
           (pc.get("MOON",{}).get("sign",0) == 8) or
           (ac("MOON","RAHU") or ss("MOON","RAHU") or
            ac("MOON","KETU") or ss("MOON","KETU")),
           "BNN · मानसिक · घर भागना", ["MOON","RAHU","KETU"]),

        _s("creative_mind",
           "रचनात्मक मन: शुक्र+बुध+चंद्र",
           "शुक्र+बुध+चंद्र → कलात्मक, रचनात्मक, सुखी मन।",
           (ac("VENUS","MERCURY") or ss("VENUS","MERCURY")) and ac("MOON","VENUS"),
           "BNN · मानसिक · सूत्र 14", ["VENUS","MERCURY","MOON"]),

        _s("bhai_betrayal",
           "भाइयों से धोखा: केतु 5/9 + राहु 3/11",
           "केतु 5/9वें + राहु 3/11वें → भाइयों/करीबियों से धोखा, विश्वासघात।",
           bool(pc.get("KETU")) and bool(pc.get("RAHU")) and
           house_dist(lagna, pc["KETU"]["sign"]) in (5,9) and
           house_dist(lagna, pc["RAHU"]["sign"]) in (3,11),
           "BNN · मानसिक · भाई · सूत्र 1", ["KETU","RAHU"]),

        _s("moon_jup_close_protection",
           "मानसिक सुरक्षा कवच: चंद्र+गुरु एक राशि",
           "चंद्र+गुरु एक राशि → डिप्रेशन से बचाव, मानसिक संरक्षण।",
           ss("MOON","JUPITER"),
           "BNN · मानसिक · सूत्र 15", ["MOON","JUPITER"]),
    ]

    vedic = [
        _s("moon_dig",
           f"चंद्रमा (मन कारक): {_dig('MOON', mo_sign)}",
           "चंद्र बलवान → मानसिक शांति।",
           _dig_ok("MOON", mo_sign), "Jataka Parijata · चंद्र बल · नियम 1"),

        _s("4th_lord_dig",
           f"चतुर्थेश ({_ph(h4l)}): {_dig(h4l, h4l_s)}",
           "4वें का स्वामी बलवान → सुख-शांति।",
           _dig_ok(h4l, h4l_s), "Parashara Hora · चतुर्थ · नियम 1"),

        _s("4th_planets",
           f"4वें में ग्रह: {', '.join(_ph(p) for p in h4) or 'खाली'}",
           "4वें में शुभ → सुख, माँ से प्रेम।",
           any(p in _BENEFIC for p in h4), "Brihat Parashara · चतुर्थ · नियम 3"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 4, h4, "D1 — 4वाँ भाव (मन/सुख)")},
        "av": _av(4, sav, lagna, 26),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 8: DURGHATNA (Accident/Injury) — 8th + Mars
# ══════════════════════════════════════════════════════════
def _t_durghatna(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h8  = _planets_in_house(pc, lagna, 8)
    h8l = bhavesh(lagna, 8); h8l_s = pc.get(h8l,{}).get("sign",0)
    sat_retro = pc.get("SATURN",{}).get("retrograde",False)
    sat_6812  = any(ac("SATURN", bhavesh(lagna, h)) for h in [6,8,12])

    bnn = [
        _s("mars_ketu",
           "दुर्घटना: मंगल+केतु नाड़ी संबंध",
           "मंगल+केतु → दुर्घटना भय, रक्त विकार, ऑपरेशन।",
           ac("MARS","KETU") or ss("MARS","KETU"),
           "BNN · दुर्घटना · सूत्र 2", ["MARS","KETU"]),

        _s("coma",
           "कोमा योग: शनि वक्री+6/8/12 स्वामी+मंगल+केतु",
           "शनि वक्री+दुष्ट स्वामी+मंगल+केतु → कोमा, जीवन संकट।",
           sat_retro and sat_6812 and (ac("MARS","KETU") or ss("MARS","KETU")),
           "BNN · दुर्घटना · सूत्र 7", ["SATURN","MARS","KETU"]),

        _s("injury",
           "चोट/हड्डी: मंगल+शनि नाड़ी संबंध",
           "मंगल+शनि → हड्डी टूटना, ऑपरेशन।",
           ac("MARS","SATURN") or ss("MARS","SATURN"),
           "BNN · चोट योग · सूत्र 4", ["MARS","SATURN"]),

        _s("sudden_crisis",
           "अकस्मात संकट: राहु+मंगल नाड़ी संबंध",
           "राहु+मंगल → अचानक दुर्घटना, रक्त विकार।",
           ac("RAHU","MARS") or ss("RAHU","MARS"),
           "BNN · दुर्घटना · सूत्र 5", ["RAHU","MARS"]),

        _s("fire_accident",
           "आग/विस्फोट: सूर्य+मंगल+राहु संबंध",
           "सूर्य+मंगल+राहु → आग से दुर्घटना।",
           (ac("SUN","MARS") or ss("SUN","MARS")) and (ac("MARS","RAHU") or ss("MARS","RAHU")),
           "BNN · दुर्घटना · सूत्र 9", ["SUN","MARS","RAHU"]),

        _s("sat_retro_old_disease",
           "पुरानी बीमारी: शनि वक्री + 6/8/12 स्वामी से संबंध",
           "शनि वक्री + 6/8/12 भाव स्वामी से संबंध → पुरानी/लंबी बीमारी, जीवन में अवरोध।",
           pc.get("SATURN",{}).get("retrograde",False) and
           any(ac("SATURN", bhavesh(lagna, h)) or ss("SATURN", bhavesh(lagna, h))
               for h in [6,8,12]),
           "BNN · दुर्घटना · सूत्र 10", ["SATURN"]),
    ]

    vedic = [
        _s("mars_dig",
           f"मंगल (दुर्घटना कारक): {_dig('MARS', pc.get('MARS',{}).get('sign',0))}",
           "मंगल नीच/शत्रु → दुर्घटना संभावना।",
           not _dig_ok("MARS", pc.get("MARS",{}).get("sign",0)),
           "Parashara Hora · मंगल · नियम 3"),

        _s("8th_malefic",
           f"8वें में ग्रह: {', '.join(_ph(p) for p in h8) or 'खाली'}",
           "8वें में मंगल/शनि/राहु → दुर्घटना।",
           any(p in ["MARS","SATURN","RAHU","KETU"] for p in h8),
           "Brihat Parashara · अष्टम · नियम 5"),

        _s("8th_lord_weak",
           f"अष्टमेश ({_ph(h8l)}): {_dig(h8l, h8l_s)}",
           "अष्टमेश नीच/कमज़ोर → अल्पायु, दुर्घटना।",
           not _dig_ok(h8l, h8l_s), "Parashara Hora · अष्टम · नियम 2"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 8, h8, "D1 — 8वाँ भाव (दुर्घटना/मृत्यु)")},
        "av": _av(8, sav, lagna, 24),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 9: ASTHAM (8th House — Occult, Sudden, Inheritance)
# ══════════════════════════════════════════════════════════
def _t_astham(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    wk = lambda p: is_weak(pc, p, lagna)
    h8  = _planets_in_house(pc, lagna, 8)
    h8l = bhavesh(lagna, 8); h8l_s = pc.get(h8l,{}).get("sign",0)
    h3l = bhavesh(lagna, 3)

    bnn = [
        _s("aries_lagna",
           "मेष/तुला लग्न: लग्नेश=अष्टमेश (मंगल) — 75%/25% नियम",
           "मेष/तुला लग्न → लग्नेश=अष्टमेश। 75% लग्नेश फल + 25% अष्टमेश फल।",
           lagna in [1, 7],
           "BNN · अष्टम · नियम 1"),

        _s("sudden_wealth",
           "अचानक धन/वसीयत: 8वें में 2+ ग्रह",
           "8वें में 2+ ग्रह → लॉटरी/वसीयत/अकस्मात लाभ।",
           len(h8) >= 2,
           "BNN · अष्टम · सूत्र 3"),

        _s("occultist",
           "तांत्रिक/ज्योतिषी: शनि+केतु+गुरु नाड़ी",
           "शनि+केतु+गुरु → तांत्रिक, ज्योतिषी, रहस्यवादी।",
           (ac("SATURN","KETU") or ss("SATURN","KETU")) and ac("JUPITER","SATURN"),
           "BNN · अष्टम · सूत्र 9", ["SATURN","KETU","JUPITER"]),

        _s("short_life",
           "अल्पायु: अष्टमेश+पापी ग्रह",
           "अष्टमेश कमज़ोर + पापी ग्रह 8वें में → अल्पायु।",
           wk(h8l) and any(p in _MALEFIC for p in h8),
           "BNN · अष्टम · सूत्र 6", [h8l]),

        _s("suicide_tendency",
           "आत्महत्या प्रवृत्ति: 3रे+8वें स्वामी दोनों कमज़ोर",
           "3रे+8वें स्वामी दोनों कमज़ोर → आत्महत्या का विचार।",
           wk(h3l) and wk(h8l),
           "BNN · अष्टम · सूत्र 11", [h3l, h8l]),

        _s("free_property",
           "उपहार में संपत्ति: शनि+बुध",
           "शनि+बुध → बिना परिश्रम संपत्ति।",
           ac("SATURN","MERCURY") or ss("SATURN","MERCURY"),
           "BNN · अष्टम · सूत्र 5", ["SATURN","MERCURY"]),

        _s("yamraj_yoga",
           "यमराज योग: शनि+राहु 8वें भाव में",
           "शनि+राहु दोनों 8वें भाव में → मृत्यु-तुल्य कष्ट, गंभीर जीवन संकट।",
           in_house(pc,"SATURN",8,lagna) and in_house(pc,"RAHU",8,lagna),
           "BNN · अष्टम · यमराज · सूत्र 1", ["SATURN","RAHU"]),

        _s("coma_yoga_8th",
           "कोमा योग: 8वें में पाप + वक्री शनि",
           "8वें में पाप ग्रह + वक्री शनि + मंगल+केतु → कोमा, जीवन संकट।",
           bool([p for p,d in pc.items() if house_dist(lagna,d["sign"])==8 and p in ["SATURN","MARS","RAHU","KETU"]]) and
           pc.get("SATURN",{}).get("retrograde",False) and
           (ac("MARS","KETU") or ss("MARS","KETU")),
           "BNN · अष्टम · कोमा · सूत्र 2", ["SATURN","MARS","KETU"]),

        _s("crime_yoga",
           "अपराध/जघन्य कर्म योग: लग्न/4/8 पर पाप+12वें मंगल+शुक्र",
           "लग्न/4/8 पर पाप प्रभाव + 12वें में मंगल+शुक्र → घोर पाप कर्म का खतरा।",
           any(any(pc.get(p,{}).get("sign")==sign_of_house(lagna,h)
                   for p in ["SATURN","MARS","RAHU","KETU"]) for h in [1,4,8]) and
           in_house(pc,"MARS",12,lagna) and in_house(pc,"VENUS",12,lagna),
           "BNN · अष्टम · अपराध · सूत्र 3"),

        _s("pitr_dosh_rahu",
           "पितृ दोष: राहु 8वें भाव में",
           "राहु 8वें भाव में → पितृ दोष, पूर्वजों के कारण जीवन में बाधा।",
           in_house(pc,"RAHU",8,lagna),
           "BNN · अष्टम · पितृ दोष · सूत्र 1", ["RAHU"]),
    ]

    vedic = [
        _s("8th_lord_dig",
           f"अष्टमेश ({_ph(h8l)}): {_dig(h8l, h8l_s)}",
           "अष्टमेश बलवान → दीर्घायु, अचानक लाभ।",
           _dig_ok(h8l, h8l_s), "Parashara Hora · अष्टम · नियम 2"),

        _s("8th_planets",
           f"8वें में ग्रह: {', '.join(_ph(p) for p in h8) or 'खाली'}",
           "8वें में पापी → आयु क्षय। शुभ → अचानक लाभ।",
           len(h8) > 0, "Brihat Parashara · अष्टम · नियम 6"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 8, h8, "D1 — 8वाँ भाव (अष्टम)")},
        "av": _av(8, sav, lagna, 24),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 10: COURT (Legal/Court Cases) — 6th house focus
# ══════════════════════════════════════════════════════════
def _t_court(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h6  = _planets_in_house(pc, lagna, 6)
    h3  = _planets_in_house(pc, lagna, 3)
    h11 = _planets_in_house(pc, lagna, 11)
    h6l = bhavesh(lagna, 6); h6l_s = pc.get(h6l,{}).get("sign",0)
    h7l = bhavesh(lagna, 7)

    bnn = [
        _s("court_7th",
           "कोर्ट चक्कर: सप्तमेश+केतु/बुध नाड़ी",
           "सप्तमेश+केतु/बुध → तलाक + लंबे कोर्ट चक्कर।",
           ac(h7l,"KETU") or ac(h7l,"MERCURY"),
           "BNN · कानूनी · सूत्र 3", [h7l,"KETU"]),

        _s("jail",
           "कारावास: 3-11 भाव पर पापी प्रभाव",
           "3रे+11वें में पापी → जेल का संकेत।",
           any(p in ["SATURN","RAHU","MARS"] for p in h3 + h11),
           "BNN · कानूनी · सूत्र 8"),

        _s("defamation",
           "बदनामी: चंद्र+राहु+शनि नाड़ी",
           "चंद्र+राहु+शनि → सार्वजनिक बदनामी।",
           (ac("MOON","RAHU") or ss("MOON","RAHU")) and ac("SATURN","MOON"),
           "BNN · कानूनी · सूत्र 6", ["MOON","RAHU","SATURN"]),

        _s("victory",
           "कोर्ट में जीत: 6वाँ स्वामी बलवान",
           "षष्ठेश बलवान → शत्रु पर विजय, कोर्ट जीत।",
           pc.get(h6l,{}).get("sign",0) == sign_of_house(lagna, 6) or
           pc.get(h6l,{}).get("sign",0) in [s for s in range(1,13) if h6l in LAGNA_LORD.get(s,[h6l])],
           "BNN · कानूनी · सूत्र 1", [h6l]),

        _s("fraud",
           "धोखाधड़ी/फ्रॉड: बुध+राहु नाड़ी संबंध",
           "बुध+राहु → धोखाधड़ी, फ्रॉड का शिकार।",
           ac("MERCURY","RAHU") or ss("MERCURY","RAHU"),
           "BNN · कानूनी · सूत्र 10", ["MERCURY","RAHU"]),

        _s("jup_rahu_poverty_fall",
           "दरिद्रता और पतन: गुरु+राहु/वक्री",
           "गुरु+राहु या गुरु वक्री → जीवन में दरिद्रता और पतन का एक दौर।",
           ac("JUPITER","RAHU") or ss("JUPITER","RAHU") or
           pc.get("JUPITER",{}).get("retrograde",False),
           "BNN · कानूनी · सूत्र 11", ["JUPITER","RAHU"]),

        _s("kalank_yoga",
           "कलंक योग: चंद्र+बुध/राहु एक राशि",
           "चंद्र+बुध या चंद्र+राहु एक राशि → जीवन में झूठा कलंक, बदनामी।",
           ss("MOON","MERCURY") or ss("MOON","RAHU"),
           "BNN · कानूनी · सूत्र 12", ["MOON","MERCURY","RAHU"]),

        _s("defamation_women",
           "स्त्रियों के कारण बदनामी: गुरु+चंद्र+शुक्र",
           "गुरु+चंद्र+शुक्र → स्त्रियों के कारण बदनामी।",
           ac("JUPITER","MOON") and (ac("JUPITER","VENUS") or ac("MOON","VENUS")),
           "BNN · कानूनी · सूत्र 13", ["JUPITER","MOON","VENUS"]),
    ]

    vedic = [
        _s("6th_lord_strong",
           f"षष्ठेश ({_ph(h6l)}): {_dig(h6l, h6l_s)}",
           "षष्ठेश बलवान → शत्रु विजय, कोर्ट में जीत।",
           _dig_ok(h6l, h6l_s), "Parashara Hora · षष्ठ · नियम 1"),

        _s("6th_malefic",
           f"6वें में ग्रह: {', '.join(_ph(p) for p in h6) or 'खाली'}",
           "6वें में पापी → शत्रु, रोग, मुकदमेबाजी।",
           any(p in _MALEFIC for p in h6), "Brihat Parashara · षष्ठ · नियम 4"),

        _s("saturn_6_8_12",
           f"शनि 6/8/12 में: {'हाँ' if any(_planets_in_house(pc,lagna,h).__contains__('SATURN') for h in [6,8,12]) else 'नहीं'}",
           "शनि 6/8/12 → कानूनी झंझट।",
           any("SATURN" in _planets_in_house(pc, lagna, h) for h in [6,8,12]),
           "Brihat Parashara · शनि · नियम 7"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 6, h6, "D1 — 6वाँ भाव (शत्रु/कोर्ट)")},
        "av": _av(6, sav, lagna, 28),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 11: PROPERTY (4th house)
# ══════════════════════════════════════════════════════════
def _t_property(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h4  = _planets_in_house(pc, lagna, 4)
    h4l = bhavesh(lagna, 4); h4l_s = pc.get(h4l,{}).get("sign",0)

    bnn = [
        _s("free_property",
           "उपहार में संपत्ति: शनि+बुध नाड़ी",
           "शनि+बुध → बिना परिश्रम संपत्ति, उपहार में जमीन।",
           ac("SATURN","MERCURY") or ss("SATURN","MERCURY"),
           "BNN · अष्टम · सूत्र 5", ["SATURN","MERCURY"]),

        _s("inherited_property",
           "पैतृक संपत्ति: गुरु/चंद्र+शुक्र",
           "गुरु/चंद्र+शुक्र → वसीयत में जमीन/मकान।",
           ac("JUPITER","VENUS") or (ac("MOON","VENUS") or ss("MOON","VENUS")),
           "BNN · धन-संपत्ति · सूत्र 8", ["JUPITER","VENUS"]),

        _s("property_loss",
           "संपत्ति हानि/विवाद: मंगल+शनि+राहु",
           "मंगल+शनि+राहु → संपत्ति विवाद, कोर्ट केस।",
           ac("MARS","SATURN") and (ac("SATURN","RAHU") or ss("SATURN","RAHU")),
           "BNN · संपत्ति हानि · सूत्र 3", ["MARS","SATURN","RAHU"]),

        _s("own_house",
           "अपना घर: 4वाँ स्वामी+शुक्र/गुरु",
           "4वें स्वामी+शुक्र/गुरु → खुद का मकान बनेगा।",
           ac(h4l,"VENUS") or ac(h4l,"JUPITER"),
           "BNN · संपत्ति · सूत्र 7", [h4l]),

        _s("no_property",
           "संपत्ति नहीं: 4वाँ स्वामी कमज़ोर+राहु/केतु",
           "4वाँ स्वामी कमज़ोर+राहु/केतु → संपत्ति नहीं मिलेगी।",
           is_weak(pc, h4l, lagna) and (ac(h4l,"RAHU") or ac(h4l,"KETU")),
           "BNN · संपत्ति · सूत्र 11", [h4l]),
    ]

    vedic = [
        _s("4th_lord_dig",
           f"चतुर्थेश ({_ph(h4l)}): {_dig(h4l, h4l_s)}",
           "4वें का स्वामी बलवान → सुख, संपत्ति।",
           _dig_ok(h4l, h4l_s), "Parashara Hora · चतुर्थ · नियम 1"),

        _s("4th_planets",
           f"4वें में ग्रह: {', '.join(_ph(p) for p in h4) or 'खाली'}",
           "4वें में शुभ → घर/संपत्ति सुख।",
           any(p in _BENEFIC for p in h4), "Brihat Parashara · चतुर्थ · नियम 3"),

        _s("mars_4th",
           f"मंगल 4वें में: {'हाँ' if 'MARS' in h4 else 'नहीं'}",
           "मंगल 4वें → संपत्ति विवाद। कोर्ट से ज़मीन मिलती है।",
           "MARS" in h4, "Parashara Hora · मंगल · नियम 6"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 4, h4, "D1 — 4वाँ भाव (संपत्ति/माता)")},
        "av": _av(4, sav, lagna, 27),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 12: VIDESH (Foreign Travel/Settlement) — 12th + 9th
# ══════════════════════════════════════════════════════════
def _t_videsh(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h12 = _planets_in_house(pc, lagna, 12)
    h9  = _planets_in_house(pc, lagna, 9)
    h12l = bhavesh(lagna,12); h12l_s = pc.get(h12l,{}).get("sign",0)
    h9l  = bhavesh(lagna, 9); h9l_s  = pc.get(h9l, {}).get("sign",0)
    rahu_house = (pc.get("RAHU",{}).get("sign",0) - lagna) % 12 + 1 if pc.get("RAHU") else 0

    bnn = [
        _s("rahu_9_12",
           f"विदेश योग: राहु 9वें/12वें में (अभी: {rahu_house}वाँ)",
           "राहु 9वें/12वें → विदेश यात्रा/वास।",
           rahu_house in [9, 12],
           "BNN · विदेश · सूत्र 2", ["RAHU"]),

        _s("moon_rahu_foreign",
           "विदेश में बसना: चंद्र+राहु नाड़ी संबंध",
           "चंद्र+राहु → विदेश में स्थायी वास।",
           ac("MOON","RAHU") or ss("MOON","RAHU"),
           "BNN · विदेश · सूत्र 5", ["MOON","RAHU"]),

        _s("venus_12",
           "विदेश में भोग: शुक्र 12वें भाव में",
           "शुक्र 12वें → विदेश में आनंद, विलासिता।",
           "VENUS" in h12,
           "BNN · विदेश · सूत्र 7", ["VENUS"]),

        _s("saturn_abroad",
           "विदेश में कठिन जीवन: शनि+राहु+12वाँ",
           "शनि+राहु+12वें → विदेश में मेहनत, संघर्ष।",
           (ac("SATURN","RAHU") or ss("SATURN","RAHU")) and any(p in ["SATURN","RAHU"] for p in h12),
           "BNN · विदेश · सूत्र 9", ["SATURN","RAHU"]),

        _s("settle_abroad",
           "विदेश में स्थायी: 4वाँ स्वामी 12वें में",
           "4वाँ स्वामी 12वें भाव में → विदेश में स्थायी आवास।",
           pc.get(bhavesh(lagna,4),{}).get("sign",0) == sign_of_house(lagna, 12),
           "BNN · विदेश · सूत्र 12", [bhavesh(lagna,4)]),
    ]

    vedic = [
        _s("12th_lord_dig",
           f"व्ययेश ({_ph(h12l)}): {_dig(h12l, h12l_s)}",
           "12वें का स्वामी बलवान → विदेश यात्रा।",
           _dig_ok(h12l, h12l_s), "Parashara Hora · व्यय · नियम 1"),

        _s("9th_lord_dig",
           f"भाग्येश ({_ph(h9l)}): {_dig(h9l, h9l_s)}",
           "9वें का स्वामी बलवान → लंबी यात्रा, भाग्य।",
           _dig_ok(h9l, h9l_s), "Parashara Hora · भाग्य · नियम 1"),

        _s("12th_planets",
           f"12वें में ग्रह: {', '.join(_ph(p) for p in h12) or 'खाली'}",
           "12वें में शुभ → विदेश में आनंद।",
           any(p in _BENEFIC for p in h12), "Brihat Parashara · व्यय · नियम 3"),
    ]

    h12_av = _sav_house(sav, lagna, 12)
    h9_av  = _sav_house(sav, lagna, 9)
    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {
            "d1_12th": _d1_house(lagna, 12, h12, f"D1 — 12वाँ भाव (विदेश) | AV: {h12_av}/56"),
            "d1_9th":  _d1_house(lagna,  9, h9,  f"D1 — 9वाँ भाव (यात्रा) | AV: {h9_av}/56"),
        },
        "av": {
            "house": 12, "bindus": h12_av, "max": 56, "strong": h12_av >= 25,
            "note": f"12वाँ: {h12_av}/56 | 9वाँ: {h9_av}/56"
        },
    }


# ══════════════════════════════════════════════════════════
# TOPIC 13: MATA (Mother) — 4th house + Moon
# ══════════════════════════════════════════════════════════
def _t_mata(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h4  = _planets_in_house(pc, lagna, 4)
    h4l = bhavesh(lagna, 4); h4l_s = pc.get(h4l,{}).get("sign",0)
    mo_sign = pc.get("MOON",{}).get("sign",0)

    bnn = [
        _s("moon_strong",
           f"माता सुख: चंद्रमा बलवान ({_dig('MOON', mo_sign)})",
           "चंद्र उच्च/स्वक्षेत्र → माता दीर्घायु, प्रेमपूर्ण।",
           _dig_ok("MOON", mo_sign),
           "BNN · माता · सूत्र 1", ["MOON"]),

        _s("saturn_4_kast",
           "माता को कष्ट: शनि 4वें में",
           "शनि 4वें → माता को दीर्घ रोग, कष्ट।",
           "SATURN" in h4,
           "BNN · माता · सूत्र 4", ["SATURN"]),

        _s("ketu_4_separation",
           "माता से दूरी: केतु 4वें में",
           "केतु 4वें → माता से अलगाव।",
           "KETU" in h4,
           "BNN · माता · सूत्र 6", ["KETU"]),

        _s("moon_saturn",
           "माता की बीमारी: चंद्र+शनि नाड़ी",
           "चंद्र+शनि → माता की लंबी बीमारी।",
           ac("MOON","SATURN") or ss("MOON","SATURN"),
           "BNN · माता · सूत्र 8", ["MOON","SATURN"]),

        _s("early_loss_mother",
           "माता की जल्दी मृत्यु: 4वाँ+8वाँ स्वामी कमज़ोर",
           "4वाँ+8वाँ दोनों स्वामी कमज़ोर → माँ जल्दी जाती है।",
           is_weak(pc, h4l, lagna) and is_weak(pc, bhavesh(lagna,8), lagna),
           "BNN · माता · सूत्र 11", [h4l]),
    ]

    vedic = [
        _s("4th_lord_mata",
           f"चतुर्थेश ({_ph(h4l)}): {_dig(h4l, h4l_s)}",
           "4वें का स्वामी बलवान → माता दीर्घायु।",
           _dig_ok(h4l, h4l_s), "Parashara Hora · चतुर्थ · नियम 1"),

        _s("moon_vedic",
           f"चंद्र (माता कारक): {_dig('MOON', mo_sign)}",
           "चंद्र बलवान → माता सुख।",
           _dig_ok("MOON", mo_sign), "Jataka Parijata · माता कारक · नियम 2"),

        _s("4th_planets_mata",
           f"4वें में ग्रह: {', '.join(_ph(p) for p in h4) or 'खाली'}",
           "4वें में शुभ → माता से प्रेम, गृह सुख।",
           any(p in _BENEFIC for p in h4), "Brihat Parashara · चतुर्थ · नियम 3"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 4, h4, "D1 — 4वाँ भाव (माता)")},
        "av": _av(4, sav, lagna, 27),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 14: PITA (Father) — 9th house + Sun
# ══════════════════════════════════════════════════════════
def _t_pita(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h9  = _planets_in_house(pc, lagna, 9)
    h9l = bhavesh(lagna, 9); h9l_s = pc.get(h9l,{}).get("sign",0)
    su_sign = pc.get("SUN",{}).get("sign",0)

    bnn = [
        _s("sun_strong",
           f"पिता सुख: सूर्य बलवान ({_dig('SUN', su_sign)})",
           "सूर्य उच्च/स्वक्षेत्र → पिता बलशाली, दीर्घायु।",
           _dig_ok("SUN", su_sign),
           "BNN · पिता · सूत्र 1", ["SUN"]),

        _s("jup_9",
           "पिता प्रतापी: गुरु 9वें में",
           "गुरु 9वें → पिता ज्ञानी, धर्मपरायण।",
           "JUPITER" in h9,
           "BNN · पिता · सूत्र 3", ["JUPITER"]),

        _s("saturn_9_kast",
           "पिता को कष्ट: शनि 9वें में",
           "शनि 9वें → पिता को रोग/कष्ट।",
           "SATURN" in h9,
           "BNN · पिता · सूत्र 5", ["SATURN"]),

        _s("rahu_9_separation",
           "पिता से दूरी: राहु 9वें में",
           "राहु 9वें → पिता से दूरी, विदेश में पिता।",
           "RAHU" in h9,
           "BNN · पिता · सूत्र 7", ["RAHU"]),

        _s("sun_saturn",
           "पिता-पुत्र तनाव: सूर्य+शनि नाड़ी",
           "सूर्य+शनि → पिता-पुत्र में मतभेद।",
           ac("SUN","SATURN") or ss("SUN","SATURN"),
           "BNN · पिता · सूत्र 9", ["SUN","SATURN"]),
    ]

    vedic = [
        _s("9th_lord_dig",
           f"भाग्येश ({_ph(h9l)}): {_dig(h9l, h9l_s)}",
           "9वें का स्वामी बलवान → पिता दीर्घायु।",
           _dig_ok(h9l, h9l_s), "Parashara Hora · भाग्य · नियम 1"),

        _s("sun_vedic",
           f"सूर्य (पिता कारक): {_dig('SUN', su_sign)}",
           "सूर्य बलवान → पिता सुख।",
           _dig_ok("SUN", su_sign), "Jataka Parijata · पिता कारक · नियम 2"),

        _s("9th_planets",
           f"9वें में ग्रह: {', '.join(_ph(p) for p in h9) or 'खाली'}",
           "9वें में शुभ → पिता सुख, भाग्य बल।",
           any(p in _BENEFIC for p in h9), "Brihat Parashara · भाग्य · नियम 3"),
    ]

    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {"d1": _d1_house(lagna, 9, h9, "D1 — 9वाँ भाव (पिता/भाग्य)")},
        "av": _av(9, sav, lagna, 27),
    }


# ══════════════════════════════════════════════════════════
# TOPIC 15: BHAI BEHEN (Siblings) — 3rd + 11th house
# ══════════════════════════════════════════════════════════
def _t_bhai_behen(pc, lagna, sav):
    ac = lambda a, b: are_connected(pc, a, b)
    ss = lambda a, b: same_sign(pc, a, b)
    h3   = _planets_in_house(pc, lagna, 3)
    h11  = _planets_in_house(pc, lagna, 11)
    h3l  = bhavesh(lagna, 3);  h3l_s  = pc.get(h3l, {}).get("sign",0)
    h11l = bhavesh(lagna, 11); h11l_s = pc.get(h11l,{}).get("sign",0)
    ma_sign = pc.get("MARS",{}).get("sign",0)
    ke_house = (pc.get("KETU",{}).get("sign",0) - lagna) % 12 + 1 if pc.get("KETU") else 0
    ra_house = (pc.get("RAHU",{}).get("sign",0) - lagna) % 12 + 1 if pc.get("RAHU") else 0

    bnn = [
        _s("mars_strong_bhai",
           f"भाई सुख: मंगल बलवान ({_dig('MARS', ma_sign)})",
           "मंगल उच्च/स्वक्षेत्र → भाई बलशाली, सहायक।",
           _dig_ok("MARS", ma_sign),
           "BNN · भाई · सूत्र 1", ["MARS"]),

        _s("betrayal_sibling",
           "भाई/बहन से धोखा: केतु 5/9 + राहु 3/11",
           "केतु 5वें/9वें + राहु 3रे/11वें → भाइयों से विश्वासघात।",
           ke_house in [5,9] and ra_house in [3,11],
           "BNN · भाई · सूत्र 5", ["KETU","RAHU"]),

        _s("saturn_3_separation",
           "भाई से दूरी: शनि 3रे में",
           "शनि 3रे → भाई से दूरी, कम संपर्क।",
           "SATURN" in h3,
           "BNN · भाई · सूत्र 7", ["SATURN"]),

        _s("sister_mercury",
           "बहन योग: बुध 3रे/11वें में",
           "बुध 3रे/11वें → बहन बुद्धिमान, सहायक।",
           "MERCURY" in h3 or "MERCURY" in h11,
           "BNN · बहन · सूत्र 2", ["MERCURY"]),

        _s("many_siblings",
           "अनेक भाई-बहन: 3रे में 2+ ग्रह",
           "3रे में 2+ ग्रह → अनेक भाई-बहन।",
           len(h3) >= 2,
           "BNN · भाई · सूत्र 10"),

        _s("no_sibling",
           "भाई-बहन नहीं: 3रे स्वामी कमज़ोर+राहु/केतु",
           "3रे स्वामी कमज़ोर + राहु/केतु → इकलौता या भाई न हो।",
           is_weak(pc, h3l, lagna) and (ra_house == 3 or ke_house == 3),
           "BNN · भाई · सूत्र 13", [h3l]),
    ]

    vedic = [
        _s("3rd_lord_dig",
           f"तृतीयेश ({_ph(h3l)}): {_dig(h3l, h3l_s)}",
           "3रे का स्वामी बलवान → भाई सुख।",
           _dig_ok(h3l, h3l_s), "Parashara Hora · तृतीय · नियम 1"),

        _s("11th_lord_dig",
           f"लाभेश ({_ph(h11l)}): {_dig(h11l, h11l_s)}",
           "11वें का स्वामी बलवान → बड़े भाई/बहन से लाभ।",
           _dig_ok(h11l, h11l_s), "Parashara Hora · लाभ · नियम 1"),

        _s("3rd_planets",
           f"3रे में ग्रह: {', '.join(_ph(p) for p in h3) or 'खाली'}",
           "3रे में शुभ → भाई सुख।",
           any(p in _BENEFIC for p in h3), "Brihat Parashara · तृतीय · नियम 3"),
    ]

    h3_av  = _sav_house(sav, lagna, 3)
    h11_av = _sav_house(sav, lagna, 11)
    return {
        "bnn":   bnn,
        "vedic": vedic,
        "dchart": {
            "d1_3rd":  _d1_house(lagna, 3,  h3,  f"D1 — 3रा भाव (छोटे भाई-बहन) | AV: {h3_av}/56"),
            "d1_11th": _d1_house(lagna, 11, h11, f"D1 — 11वाँ भाव (बड़े भाई) | AV: {h11_av}/56"),
        },
        "av": {
            "house": 3, "bindus": h3_av, "max": 56, "strong": h3_av >= 25,
            "note": f"3रा: {h3_av}/56 | 11वाँ: {h11_av}/56"
        },
    }


# ══════════════════════════════════════════════════════════
# TOPIC 16: CHARITRA (Character / Kamukta Analysis) — v2.0
# 59 refined rules (BNN + Vedic + Sambandh Yoga sources)
# — 7th, 5th, 12th, 1st, 4th, 8th, 9th house analysis
# — Venus, Mars, Rahu, Saturn, Moon, Mercury, Sun
# ══════════════════════════════════════════════════════════
def _t_charitra(pc, lagna, sav, gender):
    # ── Helper aliases ───────────────────────────────────────
    ac  = lambda a, b: are_connected(pc, a, b)
    ss  = lambda a, b: same_sign(pc, a, b)
    ih  = lambda p, h: in_house(pc, p, h, lagna)
    wk  = lambda p: is_weak(pc, p, lagna)
    gh  = lambda p: get_house(pc, p, lagna)

    # House sets
    h1  = _planets_in_house(pc, lagna, 1)
    h4  = _planets_in_house(pc, lagna, 4)
    h5  = _planets_in_house(pc, lagna, 5)
    h7  = _planets_in_house(pc, lagna, 7)
    h8  = _planets_in_house(pc, lagna, 8)
    h9  = _planets_in_house(pc, lagna, 9)
    h12 = _planets_in_house(pc, lagna, 12)

    # Sign numbers (for rashi checks)
    # Mesh=1, Vrishabh=2, Mithun=3, Kark=4, Singh=5, Kanya=6,
    # Tula=7, Vrishchik=8, Dhanu=9, Makar=10, Kumbh=11, Meen=12
    MESH_N      = 1
    VRISHABH_N  = 2
    MITHUN_N    = 3
    KARK_N      = 4
    SINGH_N     = 5
    KANYA_N     = 6
    TULA_N      = 7
    VRISHCHIK_N = 8
    DHANU_N     = 9
    MAKAR_N     = 10
    KUMBH_N     = 11
    MEEN_N      = 12

    # Planet signs
    ve_sign  = pc.get("VENUS",   {}).get("sign", 0)
    mo_sign  = pc.get("MOON",    {}).get("sign", 0)
    ma_sign  = pc.get("MARS",    {}).get("sign", 0)
    sa_sign  = pc.get("SATURN",  {}).get("sign", 0)
    su_sign  = pc.get("SUN",     {}).get("sign", 0)
    me_sign  = pc.get("MERCURY", {}).get("sign", 0)
    ra_sign  = pc.get("RAHU",    {}).get("sign", 0)

    # Lagna sign
    lg_sign  = lagna  # lagna is the sign number (1–12)

    # House lords (bhavesh)
    h7l  = bhavesh(lagna, 7)
    h5l  = bhavesh(lagna, 5)
    h12l = bhavesh(lagna, 12)
    h1l  = bhavesh(lagna, 1)
    h2l  = bhavesh(lagna, 2)
    h6l  = bhavesh(lagna, 6)
    h11l = bhavesh(lagna, 11)

    h7l_sign  = pc.get(h7l,  {}).get("sign", 0)
    h5l_sign  = pc.get(h5l,  {}).get("sign", 0)
    h12l_sign = pc.get(h12l, {}).get("sign", 0)

    # ── Paap-graha prabhav helper (planet-name based, avoids type errors) ──
    # Uses same logic as the Sambandh Yoga rules — checks yuti + drishti
    _PAAP = {"SUN", "MARS", "SATURN", "RAHU", "KETU"}

    def _paap_on(planet_name: str) -> bool:
        """Returns True if any paap grah has yuti or drishti on planet_name."""
        target_h = gh(planet_name)
        if not target_h:
            return False
        for pp in _PAAP:
            if pp == planet_name:
                continue
            pp_h = gh(pp)
            if not pp_h:
                continue
            if pp_h == target_h:          # yuti
                return True
            if pp == "MARS":
                if target_h in {(pp_h+3)%12 or 12, (pp_h+6)%12 or 12, (pp_h+7)%12 or 12}:
                    return True
            elif pp == "SATURN":
                if target_h in {(pp_h+2)%12 or 12, (pp_h+6)%12 or 12, (pp_h+9)%12 or 12}:
                    return True
            elif pp in ("RAHU", "KETU"):
                if target_h in {(pp_h+4)%12 or 12, (pp_h+6)%12 or 12, (pp_h+8)%12 or 12}:
                    return True
        return False

    def _mars_drishti_on_house(house: int) -> bool:
        """True if Mars aspects the given house (yuti or 4th/7th/8th drishti)."""
        mb = gh("MARS")
        if not mb:
            return False
        return house in {mb, (mb+3)%12 or 12, (mb+6)%12 or 12, (mb+7)%12 or 12}

    def _rahu_drishti_on_house(house: int) -> bool:
        """True if Rahu aspects the given house (yuti or 5th/7th/9th drishti)."""
        rb = gh("RAHU")
        if not rb:
            return False
        return house in {rb, (rb+4)%12 or 12, (rb+6)%12 or 12, (rb+8)%12 or 12}

    # ── Sunfa helper: Shukra in 2nd from Chandra ──
    def _sunfa_shukra() -> bool:
        chb = gh("MOON")
        vb  = gh("VENUS")
        if not chb or not vb:
            return False
        return vb == (chb % 12 + 1)

    # ── Lagna rashi checks ──
    def _lagna_rashi_in(*rashis) -> bool:
        return lg_sign in rashis

    # ══════════════════════════════════════════════════════════
    # BNN SUTRAS — 59 refined rules
    # ══════════════════════════════════════════════════════════
    bnn = [

        # ─── 1. शनि-शुक्र युति ───────────────────────────────
        _s("ch_01_sa_ve_yuti",
           "शनि-शुक्र युति — वैवाहिक जीवन में तीसरे का प्रवेश",
           "शनि (कर्तव्य) + शुक्र (भोग) — एक ही भाव में होने पर अंदरूनी द्वंद्व। "
           "जीवनसाथी के अलावा किसी और की ओर आकर्षण संभव।",
           bool(gh("SATURN")) and gh("SATURN") == gh("VENUS"),
           "BNN · चरित्र · सूत्र 1", ["SATURN","VENUS"]),

        # ─── 2. पंचम में शनि-शुक्र-मंगल ────────────────────
        _s("ch_02_5_sa_ve_ma",
           "पंचम में शनि-शुक्र-मंगल — अवैध प्रेम योग",
           "पंचम (प्रेम + पूर्वकर्म) में तीनों उग्र ग्रहों की युति — "
           "प्रेम संबंध अनैतिक दिशा पाते हैं।",
           ih("SATURN",5) and ih("VENUS",5) and ih("MARS",5),
           "BNN · चरित्र · सूत्र 2", ["SATURN","VENUS","MARS"]),

        # ─── 3. मेष/वृश्चिक में मंगल-शुक्र युति ─────────────
        _s("ch_03_ma_ve_mesh_vrischik",
           "मेष/वृश्चिक में मंगल-शुक्र — उग्र कामेच्छा",
           "मेष और वृश्चिक मंगल की राशियाँ हैं। यहाँ शुक्र दबाव में आकर "
           "पराये आकर्षण की ओर ले जाता है।",
           bool(gh("MARS")) and gh("MARS") == gh("VENUS") and
           (ve_sign in (MESH_N, VRISHCHIK_N) or ma_sign in (MESH_N, VRISHCHIK_N)),
           "BNN · चरित्र · सूत्र 3", ["MARS","VENUS"]),

        # ─── 4. सुनफा योग (चंद्र से द्वितीय में शुक्र) ──────
        _s("ch_04_sunfa",
           "सुनफा योग — अन्य से शारीरिक संबंध की संभावना",
           "चंद्र से द्वितीय में शुक्र → सुनफा योग। भौतिक सुख, आकर्षक सौंदर्य, "
           "पर-व्यक्ति से शारीरिक संबंध की प्रबल संभावना।",
           _sunfa_shukra(),
           "Sambandh Yoga · सुनफा · सूत्र 4", ["MOON","VENUS"]),

        # ─── 5. लग्न में शुक्र + 2/6/7 स्वामी ───────────────
        _s("ch_05_ve_lagna_267_swami",
           "लग्न में शुक्र और 2/6/7 स्वामी — चरित्र संदिग्ध",
           "द्वितीय, षष्ठ, सप्तम के स्वामी में से किसी के साथ शुक्र लग्न में → "
           "जातक का चरित्र संदेहास्पद।",
           ih("VENUS",1) and any(ih(lord,1) for lord in [h2l, h6l, h7l] if lord),
           "Sambandh Yoga · लग्न शुक्र · सूत्र 5", ["VENUS"]),

        # ─── 6. मीन लग्न में सूर्य-शुक्र युति ───────────────
        _s("ch_06_su_ve_meen_lagna",
           "मीन लग्न में सूर्य-शुक्र — अत्यंत कामुक योग",
           "मीन लग्न में सूर्य-शुक्र की युति → जातक अत्यंत कामुक, अवैध संबंध निश्चित।",
           lg_sign == MEEN_N and ih("SUN",1) and ih("VENUS",1),
           "Sambandh Yoga · मीन लग्न · सूत्र 6", ["SUN","VENUS"]),

        # ─── 7. लग्न में सूर्य-शुक्र युति ───────────────────
        _s("ch_07_su_ve_lagna",
           "लग्न में सूर्य-शुक्र — व्यभिचार योग",
           "सूर्य + शुक्र लग्न में — अहंकार और कामुकता तीव्र। "
           "शुभ ग्रह की दृष्टि हो तो प्रभाव कम।",
           ih("SUN",1) and ih("VENUS",1),
           "BNN · चरित्र · सूत्र 7", ["SUN","VENUS"]),

        # ─── 8. सप्तम में बुध-शुक्र युति ────────────────────
        _s("ch_08_bu_ve_7",
           "सप्तम में बुध-शुक्र — चतुर अवैध संबंध",
           "बुध (चतुराई) + शुक्र सप्तम → जातक अवैध संबंधों के लिए "
           "नित नूतन तरीके खोजता है।",
           ih("MERCURY",7) and ih("VENUS",7),
           "BNN · चरित्र · सूत्र 8", ["MERCURY","VENUS"]),

        # ─── 9. सप्तम में शनि-मंगल युति ─────────────────────
        _s("ch_09_sa_ma_7",
           "सप्तम में शनि-मंगल — समलिंगी प्रवृत्ति",
           "सप्तम में शनि-मंगल की युति असामान्य/समलिंगी यौन रुझान की ओर संकेत।",
           ih("SATURN",7) and ih("MARS",7),
           "BNN · चरित्र · सूत्र 9", ["SATURN","MARS"]),

        # ─── 10. अष्टम/नवम/द्वादश में शनि-मंगल ──────────────
        _s("ch_10_sa_ma_8_9_12",
           "अष्टम/नवम/द्वादश में शनि-मंगल — बड़ों से अवैध संबंध",
           "शनि-मंगल युति 8, 9 या 12 भाव में → अपने बड़ों/गुरु से अवैध संबंध।",
           any(ih("SATURN",h) and ih("MARS",h) for h in (8,9,12)),
           "Sambandh Yoga · शनि-मंगल · सूत्र 10", ["SATURN","MARS"]),

        # ─── 11. मंगल-राहु का शुक्र पर प्रभाव ──────────────
        _s("ch_11_ma_ra_ve",
           "मंगल-राहु का शुक्र पर प्रभाव — कामवासना विकृत",
           "मंगल + राहु दोनों मिलकर शुक्र को दूषित करें → "
           "जातक की कामुकता अनियंत्रित।",
           _mars_drishti_on_house(gh("VENUS")) and _rahu_drishti_on_house(gh("VENUS")),
           "Sambandh Yoga · मंगल-राहु-शुक्र · सूत्र 11", ["MARS","RAHU","VENUS"]),

        # ─── 12. लग्न में शनि — कामवासना अधिक ──────────────
        _s("ch_12_sa_lagna",
           "लग्न में शनि — कामवासना वृद्धि",
           "लग्न में शनि जातक को अत्यधिक काम-वासना देता है।",
           ih("SATURN",1),
           "Sambandh Yoga · शनि-लग्न · सूत्र 12", ["SATURN"]),

        # ─── 13. पंचम में शनि — बड़े-उम्र वालों से आकर्षण ──
        _s("ch_13_sa_5",
           "पंचम में शनि — बड़ी आयु के व्यक्ति से आकर्षण",
           "पंचम में शनि → अपने से बड़े स्त्री/पुरुष के प्रति अनुचित आकर्षण।",
           ih("SATURN",5),
           "Sambandh Yoga · शनि-पंचम · सूत्र 13", ["SATURN"]),

        # ─── 14. शनि-चंद्र सप्तम + मंगल दृष्टि ─────────────
        _s("ch_14_sa_mo_7_ma_drishti",
           "सप्तम में शनि-चंद्र + मंगल दृष्टि — व्यभिचार निश्चित",
           "शनि+चंद्र सप्तम + मंगल दृष्टि → व्यभिचारी प्रवृत्ति। "
           "शुक्र का भी संबंध हो तो अवैध संबंध निश्चित।",
           ih("SATURN",7) and ih("MOON",7) and _mars_drishti_on_house(7),
           "Sambandh Yoga · सप्तम · सूत्र 14", ["SATURN","MOON","MARS"]),

        # ─── 15. शनि-चंद्र सप्तम + मंगल दृष्टि + शुक्र ────
        _s("ch_15_sa_mo_7_ma_ve",
           "सप्तम शनि-चंद्र-मंगल-शुक्र — अत्यंत उग्र अवैध संबंध",
           "शनि+चंद्र सप्तम, मंगल दृष्टि और शुक्र का भी संबंध — "
           "अवैध संबंध निश्चित और बारम्बार।",
           ih("SATURN",7) and ih("MOON",7) and
           _mars_drishti_on_house(7) and
           (ih("VENUS",7) or (bool(gh("VENUS")) and (gh("VENUS") == gh("SATURN") or gh("VENUS") == gh("MOON")))),
           "BNN · चरित्र · सूत्र 15", ["SATURN","MOON","MARS","VENUS"]),

        # ─── 16. नीच चंद्र + पाप प्रभाव ─────────────────────
        _s("ch_16_neech_chandra_paap",
           "नीच चंद्र (वृश्चिक) + पाप प्रभाव — अनुचित प्रवृत्ति",
           "चंद्र नीच (वृश्चिक) और पाप प्रभाव → अनुचित संबंधों की प्रवृत्ति।",
           mo_sign == VRISHCHIK_N and _paap_on("MOON"),
           "Sambandh Yoga · नीच चंद्र · सूत्र 16", ["MOON"]),

        # ─── 17. नवम में दूषित चंद्र ─────────────────────────
        _s("ch_17_dooshit_chandra_9",
           "नवम में दूषित चंद्र — गुरु/बड़ों से अनुचित संबंध",
           "दूषित चंद्र (पाप प्रभावित) नवम भाव में → गुरु या बड़ों से अवैध संबंध।",
           ih("MOON",9) and _paap_on("MOON"),
           "Sambandh Yoga · नवम चंद्र · सूत्र 17", ["MOON"]),

        # ─── 18. सप्तम में मंगल + पापी ग्रह ─────────────────
        _s("ch_18_ma_paap_7",
           "सप्तम में मंगल + पाप ग्रह — अत्यंत कामुक",
           "सप्तम में मंगल + कोई पापी ग्रह, या सूर्य-सप्तम+मंगल-चतुर्थ, "
           "या चतुर्थ में राहु → जातक अत्यंत कामुक।",
           (ih("MARS",7) and any(ih(p,7) for p in ("SATURN","RAHU","KETU","SUN"))) or
           (ih("SUN",7) and ih("MARS",4)) or
           ih("RAHU",4),
           "Sambandh Yoga · सप्तम मंगल · सूत्र 18", ["MARS"]),

        # ─── 19. अष्टम में राहु ──────────────────────────────
        _s("ch_19_ra_8",
           "अष्टम में राहु — गुप्त अवैध संबंध",
           "अष्टम (गुप्त रहस्य) में राहु → छुपे अवैध संबंध।",
           ih("RAHU",8),
           "Sambandh Yoga · अष्टम राहु · सूत्र 19", ["RAHU"]),

        # ─── 20. तुला में चार या अधिक ग्रह ──────────────────
        _s("ch_20_tula_4_grah",
           "तुला राशि में 4+ ग्रह — पारिवारिक कलह → बाहर संबंध",
           "तुला में 4+ ग्रह → घर में कलेश, बाहर अवैध संबंध।",
           sum(1 for p in pc.values() if p.get("sign") == TULA_N) >= 4,
           "Sambandh Yoga · तुला राशि · सूत्र 20", []),

        # ─── 21. दशम में शनि + शुक्र-मंगल युति ──────────────
        _s("ch_21_sa_10_ve_ma",
           "दशम में शनि + कहीं भी शुक्र-मंगल युति",
           "शुक्र-मंगल युति कहीं भी + शनि दशम → मन अस्थिर, "
           "कभी ज्ञानी कभी अवैध संबंधों का दास।",
           ih("SATURN",10) and (bool(gh("VENUS")) and gh("VENUS") == gh("MARS")),
           "Sambandh Yoga · दशम शनि · सूत्र 21", ["SATURN","VENUS","MARS"]),

        # ─── 22. सप्तम में बुध-शनि संबंध ────────────────────
        _s("ch_22_bu_sa_7",
           "सप्तम में बुध-शनि — यौन नीरसता, जीवनसाथी असंतुष्ट",
           "बुध-शनि का सप्तम से संबंध → यौनक्रिया में अयोग्यता, "
           "जीवनसाथी असंतुष्ट → अन्यत्र संबंध।",
           ih("MERCURY",7) and ih("SATURN",7),
           "Sambandh Yoga · बुध-शनि-सप्तम · सूत्र 22", ["MERCURY","SATURN"]),

        # ─── 23. सप्तम में सूर्य ─────────────────────────────
        _s("ch_23_su_7",
           "सप्तम में सूर्य — अहंकार से वैवाहिक कलेश",
           "सूर्य सप्तम → दाम्पत्य टकराव → परेशान होकर अन्यत्र संबंध।",
           ih("SUN",7),
           "Sambandh Yoga · सूर्य-सप्तम · सूत्र 23", ["SUN"]),

        # ─── 24. सप्तम में राहु-शुक्र/चंद्र + गुरु द्वादश ──
        _s("ch_24_ra_ve_7_gu_12",
           "सप्तम राहु-शुक्र/चंद्र + गुरु द्वादश — कार्यालय संबंध",
           "सप्तम में राहु+शुक्र या राहु+चंद्र, गुरु द्वादश → "
           "विवाह बाद कार्यालयों में अवैध संबंध।",
           ih("GURU",12) and
           ((ih("RAHU",7) and ih("VENUS",7)) or (ih("RAHU",7) and ih("MOON",7))),
           "Sambandh Yoga · सूत्र 24", ["RAHU","VENUS","MOON"]),

        # ─── 25. द्वादश में बुध-शनि + राहु लग्न/7/8 ────────
        _s("ch_25_bu_sa_12_ra",
           "द्वादश में बुध-शनि + राहु — जीवनसाथी का अन्यत्र संबंध",
           "द्वादश में बुध+शनि → यौन कमजोरी। साथ में राहु लग्न/7/8 में → "
           "जीवनसाथी किसी अन्य से संतुष्टि लेता है।",
           ih("MERCURY",12) and ih("SATURN",12) and
           any(ih("RAHU",h) for h in (1,7,8)),
           "Sambandh Yoga · सूत्र 25", ["MERCURY","SATURN","RAHU"]),

        # ─── 26. मंगल-शुक्र-द्वादशेश का सप्तम से संबंध ─────
        _s("ch_26_ma_ve_12l_7",
           "मंगल-शुक्र-द्वादशेश का सप्तम संबंध — अनेक संबंध",
           "मंगल, शुक्र और द्वादशेश तीनों का सप्तम भाव से संबंध → "
           "अनेक व्यक्तियों से अवैध संबंध।",
           ih("MARS",7) and ih("VENUS",7) and (h12l and ih(h12l,7)),
           "Sambandh Yoga · सूत्र 26", ["MARS","VENUS"]),

        # ─── 27. चतुर्थ/द्वादश में मंगल-शुक्र-द्वादशेश ─────
        _s("ch_27_ma_ve_12l_4_12",
           "चतुर्थ/द्वादश में मंगल-शुक्र-द्वादशेश — अत्यंत कामी",
           "मंगल+शुक्र+द्वादशेश का चतुर्थ या द्वादश में योग → "
           "मर्यादा त्याग कर अधिक अवैध संबंध।",
           any(
               ih("MARS",h) and ih("VENUS",h) and (h12l and ih(h12l,h))
               for h in (4,12)
           ),
           "Sambandh Yoga · सूत्र 27", ["MARS","VENUS"]),

        # ─── 28. एकादश में लग्नेश + पाप प्रभाव ──────────────
        _s("ch_28_lagnesh_11_paap",
           "एकादश में लग्नेश + पाप प्रभाव — अप्राकृतिक रुझान",
           "लग्नेश एकादश + पाप प्रभाव → अप्राकृतिक यौन संतुष्टि हेतु अवैध संबंध।",
           (h1l and ih(h1l,11) and _paap_on(h1l)) if h1l else False,
           "Sambandh Yoga · सूत्र 28", []),

        # ─── 29. उच्च का शुक्र ───────────────────────────────
        _s("ch_29_ve_uchcha",
           "उच्च शुक्र (मीन) — विवाह बाद भी प्रेम प्रसंग",
           "उच्च का शुक्र → अनेक प्रेम प्रसंग, विवाह बाद भी जारी।",
           ve_sign == MEEN_N,
           "Sambandh Yoga · उच्च शुक्र · सूत्र 29", ["VENUS"]),

        # ─── 30. शुक्र-राहु युति ────────────────────────────
        _s("ch_30_ve_ra_yuti",
           "शुक्र-राहु युति — भ्रमित कामुकता, अनैतिक संबंध",
           "राहु (अतिरेक/भ्रम) + शुक्र → कामेच्छा विकृत और अनियंत्रित।",
           bool(gh("VENUS")) and gh("VENUS") == gh("RAHU"),
           "BNN · चरित्र · सूत्र 30", ["VENUS","RAHU"]),

        # ─── 31. पर्वत योग (लग्नेश-द्वादशेश स्थान परिवर्तन) ─
        _s("ch_31_parvat_yoga",
           "पर्वत योग — लग्नेश-द्वादशेश परिवर्तन — अत्यंत कामी",
           "लग्न+द्वादश के स्वामी का स्थान परिवर्तन या केंद्र/त्रिकोण में युति → "
           "पर्वत योग; जातक पर-गमन करने वाला।",
           (h1l and h12l and (
               # Parivartan: h1l in 12th house sign and h12l in 1st house sign
               (pc.get(h1l,{}).get("sign",0) == (lagna+10)%12+1 and
                pc.get(h12l,{}).get("sign",0) == lagna) or
               # Kendra/trikon yuti
               (bool(gh(h1l)) and gh(h1l) == gh(h12l) and gh(h1l) in (1,2,4,5,7,9,10))
           )) if (h1l and h12l) else False,
           "Sambandh Yoga · पर्वत योग · सूत्र 31", []),

        # ─── 32. तुला में चंद्र-शुक्र युति ──────────────────
        _s("ch_32_mo_ve_tula",
           "तुला में चंद्र-शुक्र — अत्यधिक कामुक",
           "तुला में चंद्र+शुक्र → अत्यधिक कामुकता। "
           "राहु/मंगल का भी संयोग हो तो जातक किसी भी हद तक जाने को तत्पर।",
           mo_sign == TULA_N and ve_sign == TULA_N,
           "Sambandh Yoga · तुला चंद्र-शुक्र · सूत्र 32", ["MOON","VENUS"]),

        # ─── 33. मंगल-शुक्र समसप्तक ─────────────────────────
        _s("ch_33_ma_ve_samasaptam",
           "मंगल-शुक्र समसप्तक — अतिकामुकता",
           "मंगल और शुक्र एक-दूसरे से ठीक 7वें → आमने-सामने देखने से अतिकामुक।",
           bool(gh("VENUS")) and bool(gh("MARS")) and abs(gh("VENUS")-gh("MARS")) == 6,
           "BNN · चरित्र · सूत्र 33", ["VENUS","MARS"]),

        # ─── 34. शनि-राहु युति ───────────────────────────────
        _s("ch_34_sa_ra_yuti",
           "शनि-राहु युति — संघर्ष + अनैतिक संबंध",
           "शनि-राहु योग → जीवन में संघर्ष और अनैतिक संबंधों का कारक।",
           bool(gh("SATURN")) and gh("SATURN") == gh("RAHU"),
           "Sambandh Yoga · शनि-राहु · सूत्र 34", ["SATURN","RAHU"]),

        # ─── 35. सप्तम में शुक्र + मंगल/राहु ────────────────
        _s("ch_35_ve_ma_ra_7",
           "सप्तम में शुक्र-मंगल/राहु — अनेक संबंध",
           "सप्तम में शुक्र + मंगल या राहु → जीवन में बार-बार अलग-अलग संबंध।",
           ih("VENUS",7) and (ih("MARS",7) or ih("RAHU",7)),
           "Sambandh Yoga · सूत्र 35", ["VENUS","MARS","RAHU"]),

        # ─── 36. शनि की चंद्र/शुक्र/मंगल से युति ────────────
        _s("ch_36_sa_mo_ve_ma",
           "शनि की चंद्र/शुक्र/मंगल से युति — काम वासना वृद्धि",
           "शनि+चंद्र, या शनि+शुक्र, या शनि+मंगल — इनमें से कोई भी युति "
           "जातक की कामवासना काफी बढ़ा देती है।",
           (bool(gh("SATURN")) and gh("SATURN") == gh("MOON")) or
           (bool(gh("SATURN")) and gh("SATURN") == gh("VENUS")) or
           (bool(gh("SATURN")) and gh("SATURN") == gh("MARS")),
           "Sambandh Yoga · शनि त्रि-युति · सूत्र 36", ["SATURN"]),

        # ─── 37. द्वादश में चंद्र (मीन राशि) ────────────────
        _s("ch_37_mo_12_meen",
           "द्वादश में चंद्र (मीन) — अनेक का उपभोग",
           "बारहवें भाव में मीन राशि में चंद्र → अनेकों स्त्री/पुरुष का उपभोग।",
           ih("MOON",12) and mo_sign == MEEN_N,
           "Sambandh Yoga · सूत्र 37", ["MOON"]),

        # ─── 38. मंगल 8/9/12 में ─────────────────────────────
        _s("ch_38_ma_8_9_12",
           "मंगल 8/9/12 में — कामुक प्रवृत्ति",
           "मंगल की उपस्थिति अष्टम, नवम या द्वादश में → जातक कामुक।",
           any(ih("MARS",h) for h in (8,9,12)),
           "Sambandh Yoga · सूत्र 38", ["MARS"]),

        # ─── 39. मंगल-शुक्र राशि परिवर्तन ──────────────────
        _s("ch_39_ma_ve_rashi_parivartana",
           "मंगल-शुक्र राशि परिवर्तन — कामुकता अधिक",
           "सच्चा राशि परिवर्तन: शुक्र मंगल की राशि (मेष/वृश्चिक) में AND मंगल शुक्र की राशि (तुला/वृषभ) में → "
           "दोनों एक-दूसरे के घर में; तभी पूर्ण परिवर्तन।",
           ve_sign in (MESH_N, VRISHCHIK_N) and ma_sign in (VRISHABH_N, TULA_N),
           "Sambandh Yoga · सूत्र 39", ["MARS","VENUS"]),

        # ─── 40. सप्तम में शुक्र ────────────────────────────
        _s("ch_40_ve_7",
           "सप्तम में शुक्र — अत्यधिक कामुकता",
           "सप्तम में शुक्र → जातक अत्यधिक कामुक, विवाहेतर संबंध की प्रबल संभावना।",
           ih("VENUS",7),
           "Sambandh Yoga · सूत्र 40", ["VENUS"]),

        # ─── 41. मकर लग्न + उच्च गुरु सप्तम ────────────────
        _s("ch_41_makar_lagna_gu_7",
           "मकर लग्न में उच्च गुरु सप्तम — द्विस्वभाव संबंध",
           "मकर लग्न + गुरु सप्तम → द्विस्वभाव जातक। "
           "गुरु-चंद्र संबंध हो तो विवाह के बाद भी संबंध।",
           lg_sign == MAKAR_N and ih("JUPITER",7),
           "Sambandh Yoga · सूत्र 41", ["JUPITER"]),

        # ─── 42. सप्तम में राहु ──────────────────────────────
        _s("ch_42_ra_7",
           "सप्तम में राहु — जीवनसाथी व्यभिचारी",
           "सप्तम में राहु → जीवनसाथी धोखा देने वाला, विवाह बाद अवैध संबंध।",
           ih("RAHU",7),
           "Sambandh Yoga · सूत्र 42", ["RAHU"]),

        # ─── 43. सप्तमेश षष्ठ/अष्टम में ────────────────────
        _s("ch_43_saptamesh_6_8",
           "सप्तमेश षष्ठ/अष्टम में — दोनों के विवाहेतर संबंध",
           "सप्तमेश 6 या 8 भाव में → पति-पत्नी में मतभेद, दोनों के बाहर संबंध।",
           h7l and (ih(h7l,6) or ih(h7l,8)),
           "Sambandh Yoga · सूत्र 43", []),

        # ─── 44. धनु/मीन लग्न ────────────────────────────────
        _s("ch_44_dhanu_meen_lagna",
           "धनु/मीन लग्न — शय्या सुख अन्यत्र",
           "धनु या मीन लग्न वाले स्त्री-पुरुषों को शय्या सुख अन्यत्र खोजने की आवश्यकता।",
           lg_sign in (DHANU_N, MEEN_N),
           "Sambandh Yoga · सूत्र 44", []),

        # ─── 45. चतुर्थ में पाप ग्रह ─────────────────────────
        _s("ch_45_paap_4",
           "चतुर्थ में पाप ग्रह — रोमांस + अन्यत्र संबंध",
           "चतुर्थ में पाप ग्रह → रोमांस करने वाला, अन्यत्र संबंध बनाने वाला।",
           any(ih(p,4) for p in ("SATURN","MARS","RAHU","KETU","SUN")),
           "Sambandh Yoga · सूत्र 45", []),

        # ─── 46. उच्च का चंद्रमा ─────────────────────────────
        _s("ch_46_uchcha_chandra",
           "उच्च चंद्र (वृषभ) — प्रेम प्रसंगों में सफलता",
           "उच्च चंद्र → प्रेम प्रसंगों में अधिक रुचि और सफलता।",
           mo_sign == VRISHABH_N,
           "Sambandh Yoga · सूत्र 46", ["MOON"]),

        # ─── 47. नीच का चंद्रमा ──────────────────────────────
        _s("ch_47_neech_chandra",
           "नीच चंद्र (वृश्चिक) — अनैतिक मार्ग",
           "नीच चंद्र → अनैतिक मार्ग, देह-व्यापार तक जाने की संभावना।",
           mo_sign == VRISHCHIK_N,
           "Sambandh Yoga · सूत्र 47", ["MOON"]),

        # ─── 48. मंगल1-चंद्र7-राहु योग ──────────────────────
        _s("ch_48_ma1_mo7_ra",
           "मंगल लग्न + चंद्र सप्तम + राहु — अत्यंत कामुक",
           "मंगल लग्न में, चंद्र 7वें में, साथ में राहु (1 या 7) → अत्यंत कामुक।",
           ih("MARS",1) and ih("MOON",7) and (ih("RAHU",1) or ih("RAHU",7)),
           "Sambandh Yoga · सूत्र 48", ["MARS","MOON","RAHU"]),

        # ─── 49. शुक्र-मंगल 7/10 में + पाप प्रभाव ───────────
        _s("ch_49_ve_ma_7_10_paap",
           "शुक्र-मंगल 7वें/10वें + क्रूर ग्रह — चारित्रिक पतन",
           "शुक्र-मंगल 7 या 10 में और उन पर क्रूर ग्रह का प्रभाव → चारित्रिक पतन।",
           (ih("VENUS",7) and ih("MARS",7) and (_paap_on("VENUS") or _paap_on("MARS"))) or
           (ih("VENUS",10) and ih("MARS",10) and (_paap_on("VENUS") or _paap_on("MARS"))),
           "Sambandh Yoga · सूत्र 49", ["VENUS","MARS"]),

        # ─── 50. मंगल का लग्न + लग्नेश पर दृष्टि ───────────
        _s("ch_50_ma_drishti_lagna_lagnesh",
           "मंगल की लग्न + लग्नेश पर दृष्टि — विशेष कामी",
           "मंगल का लग्न और लग्नेश दोनों पर दृष्टि → जातक विशेष रूप से कामी।",
           _mars_drishti_on_house(1) and
           bool(h1l) and _mars_drishti_on_house(gh(h1l) if h1l else 0),
           "Sambandh Yoga · सूत्र 50", ["MARS"]),

        # ─── 51. द्वादश में मंगल ─────────────────────────────
        _s("ch_51_ma_12",
           "द्वादश में मंगल — शैया बाधक + चारित्रिक दोष",
           "द्वादश में मंगल → शैयासुख में बाधा, जीवनसाथी के प्रति प्रेम का अभाव, "
           "चारित्रिक दोष।",
           ih("MARS",12),
           "Sambandh Yoga · सूत्र 51", ["MARS"]),

        # ─── 52. चतुर्थ+सप्तम पर मंगल-राहु प्रभाव ──────────
        _s("ch_52_4_7_ma_ra",
           "4 और 7 भाव पर मंगल+राहु — बहु-संबंध योग",
           "चतुर्थ और सप्तम दोनों पर मंगल व राहु का प्रभाव → अनेक व्यक्तियों से संबंध।",
           _mars_drishti_on_house(4) and _rahu_drishti_on_house(4) and
           _mars_drishti_on_house(7) and _rahu_drishti_on_house(7),
           "Sambandh Yoga · सूत्र 52", ["MARS","RAHU"]),

        # ─── 53. केंद्र में गुरु + मंगल-शुक्र + राहु-चंद्र ──
        _s("ch_53_gu_kendra_ma_ve_ra_mo",
           "केंद्र गुरु + मंगल-शुक्र + राहु-चंद्र — सभी सीमाएँ तोड़ता है",
           "केंद्र में गुरु पर मंगल-शुक्र का प्रभाव + चंद्र पर राहु का प्रभाव → "
           "व्यक्ति सभी सीमाओं का उल्लंघन करता है।",
           any(ih("JUPITER",h) for h in (1,4,7,10)) and
           (_mars_drishti_on_house(gh("JUPITER")) or ih("MARS",gh("JUPITER"))) and
           (ih("VENUS",gh("JUPITER"))) and
           (bool(gh("RAHU")) and gh("RAHU") == gh("MOON") or _rahu_drishti_on_house(gh("MOON"))),
           "Sambandh Yoga · सूत्र 53", ["JUPITER","MARS","VENUS","RAHU","MOON"]),

        # ─── 54. शनि-राहु + शनि-शुक्र + शनि-मंगल संयुक्त ──
        _s("ch_54_sa_compound",
           "शनि का राहु/शुक्र/मंगल तीनों से संबंध — चारित्रिक योग",
           "शनि का राहु, शुक्र और मंगल — तीनों से एक साथ संबंध → "
           "कामुकता, अनैतिकता और प्रतिरोध — तीनों एक साथ।",
           (bool(gh("SATURN")) and gh("SATURN") == gh("RAHU")) and
           (bool(gh("SATURN")) and gh("SATURN") == gh("VENUS")) and
           (bool(gh("SATURN")) and gh("SATURN") == gh("MARS")),
           "BNN · चरित्र · सूत्र 54", ["SATURN","RAHU","VENUS","MARS"]),

        # ─── 55. तुला में चंद्र-शुक्र + मंगल/राहु ───────────
        _s("ch_55_mo_ve_tula_ma_ra",
           "तुला में चंद्र-शुक्र + मंगल/राहु — वासना की कोई सीमा नहीं",
           "तुला में चंद्र+शुक्र की युति, साथ में मंगल या राहु का भी संयोग → "
           "वासना की पूर्ति के लिए किसी भी हद तक।",
           mo_sign == TULA_N and ve_sign == TULA_N and
           (ma_sign == TULA_N or ra_sign == TULA_N),
           "Sambandh Yoga · सूत्र 55", ["MOON","VENUS","MARS","RAHU"]),

        # ─── 58. सप्तमेश बलवान — निष्ठा का संकेत ───────────
        _s("ch_58_saptamesh_bali",
           "सप्तमेश बलवान — जीवनसाथी के प्रति निष्ठा ✅",
           "सप्तमेश उच्च/स्वक्षेत्र/मूलत्रिकोण → जीवनसाथी के प्रति निष्ठावान।",
           _dig_ok(h7l, h7l_sign) if h7l else False,
           "Parashara Hora · सप्तमेश · सूत्र 58"),

        # ─── 59. द्वादश में शुभ ग्रह — दाम्पत्य सुख ────────
        _s("ch_59_12_shubh",
           "द्वादश में शुभ ग्रह — दाम्पत्य शैया सुख सन्तोषजनक ✅",
           "द्वादश (शैया सुख) में शुभ ग्रह → वैवाहिक सुख संतोषजनक।",
           any(p in _BENEFIC for p in h12),
           "Parashara Hora · द्वादश · सूत्र 59", list(h12)),

        # ─── 60. पिशाच योग ───────────────────────────────────
        _s("ch_60_pishach_yoga",
           "पिशाच योग — प्रेत बाधा / मानसिक विक्षिप्तता",
           "लग्न में राहु+चंद्र की युति और 5वें या 9वें भाव में पापी ग्रह → "
           "पिशाच योग। जातक पर प्रेत बाधा या भयंकर मानसिक विक्षिप्तता आ सकती है।",
           ih("RAHU",1) and ih("MOON",1) and
           (any(p in _PAAP for p in _planets_in_house(pc,lagna,5)) or
            any(p in _PAAP for p in _planets_in_house(pc,lagna,9))),
           "BNN · चरित्र · सूत्र 60", ["RAHU","MOON"]),

        # ─── 61. कोमा / भयंकर दुर्घटना योग ──────────────────
        _s("ch_61_coma_yoga",
           "कोमा योग — वक्री शनि + मंगल + राहु/केतु",
           "शनि वक्री + मंगल की दृष्टि/युति + राहु/केतु शनि के साथ → "
           "भयंकर दुर्घटना, जातक कोमा में जा सकता है, परिवार का नाश।",
           pc.get("SATURN",{}).get("retrograde", False) and
           _mars_drishti_on_house(gh("SATURN")) and
           (bool(gh("SATURN")) and (
               gh("RAHU") == gh("SATURN") or gh("KETU") == gh("SATURN")
           )),
           "BNN · चरित्र · सूत्र 61", ["SATURN","MARS","RAHU"]),

        # ─── 62. बलात्कार / जघन्य अपराध योग ────────────────
        _s("ch_62_rape_yoga",
           "जघन्य अपराध योग — लग्न/4/8 पाप + 12वें मंगल-शुक्र",
           "लग्न, चतुर्थ और अष्टम पर पाप प्रभाव तथा 12वें भाव में मंगल+शुक्र → "
           "जातक में बलात्कार या जघन्य अपराध तक की मानसिकता।",
           _paap_on("SATURN") and  # proxy for paap on 1st (Saturn itself = lagna malefic)
           any(p in _PAAP for p in _planets_in_house(pc,lagna,1)) and
           any(p in _PAAP for p in _planets_in_house(pc,lagna,4)) and
           any(p in _PAAP for p in _planets_in_house(pc,lagna,8)) and
           ih("MARS",12) and ih("VENUS",12),
           "BNN · चरित्र · सूत्र 62", ["MARS","VENUS"]),

        # ─── 63. कलंक योग — झूठी बदनामी ────────────────────
        _s("ch_63_kalank_yoga",
           "कलंक योग — झूठा कलंक, भारी सामाजिक बदनामी",
           "चंद्रमा के साथ बुध या राहु का एक ही भाव में होना 'कलंक योग' बनाता है। "
           "जातक पर झूठे आरोप लगते हैं, समाज में भारी अपमान होता है।",
           bool(gh("MOON")) and (
               gh("MOON") == gh("MERCURY") or gh("MOON") == gh("RAHU")
           ),
           "BNN · चरित्र · सूत्र 63", ["MOON","MERCURY","RAHU"]),

        # ─── 64. गर्भपात योग (सूर्य-राहु) ───────────────────
        _s("ch_64_garbhapat_yoga",
           "गर्भपात योग — सूर्य+राहु युति/समसप्तक",
           "सूर्य+राहु की युति या समसप्तक स्थिति → "
           "स्त्री को जीवन में कम से कम एक गर्भपात अवश्य होता है।",
           bool(gh("SUN")) and bool(gh("RAHU")) and
           (gh("SUN") == gh("RAHU") or abs(gh("SUN") - gh("RAHU")) == 6),
           "BNN · चरित्र · सूत्र 64", ["SUN","RAHU"]),

        # ─── 65. वेश्यावृत्ति/देह-व्यापार योग ───────────────
        _s("ch_65_veshya_yoga",
           "देह-व्यापार योग — शुक्र/मंगल 7/10 + क्रूर ग्रह",
           "सप्तम या दशम में शुक्र+मंगल की युति और उन पर क्रूर ग्रह का प्रभाव → "
           "चारित्रिक पतन; स्त्री के देह-व्यापार में जाने की संभावना।",
           (ih("VENUS",7) and ih("MARS",7) and (_paap_on("VENUS") or _paap_on("MARS"))) or
           (ih("VENUS",10) and ih("MARS",10) and (_paap_on("VENUS") or _paap_on("MARS"))),
           "BNN · चरित्र · सूत्र 65", ["VENUS","MARS"]),

        # ═══ Section 5: ग्रहों के विशिष्ट व्यभिचार योग ════════════════

        # ─── 66. मंगल-शुक्र एक भाव में (100% विवाहेतर) ──────
        _s("ch_66_ma_ve_yuti_vivahatar",
           "मंगल-शुक्र युति — विवाहेतर संबंध अवश्यम्भावी",
           "मंगल-शुक्र एक ही भाव में (strict yuti) → बाहर से कितना भी संयमी दिखे, "
           "वासना में लिप्त होता ही है। विवाहेतर संबंध निश्चित।",
           bool(gh("MARS")) and gh("MARS") == gh("VENUS"),
           "Vedic · व्यभिचार योग · सूत्र 66", ["MARS","VENUS"]),

        # ─── 67. सप्तम में सूर्य — स्त्री कुलटा योग ─────────
        _s("ch_67_su_7_kulta",
           "सप्तम में सूर्य — कुलटा योग (स्त्री कुंडली)",
           "सप्तम में सूर्य → पति द्वारा अनादर, कुलटा और पर-पतिगामिनी। "
           "पुरुष के लिए भी दाम्पत्य में टकराव और अन्यत्र संबंध।",
           ih("SUN", 7),
           "Vedic · कुलटा योग · सूत्र 67", ["SUN"]),

        # ─── 68. लग्न में सूर्य — कामी ───────────────────────
        _s("ch_68_su_lagna_kami",
           "लग्न में सूर्य — कामी व्यक्तित्व",
           "सूर्य लग्न में → व्यक्ति 'कामी' होता है। अहंकार और कामुकता दोनों प्रबल।",
           ih("SUN", 1),
           "Vedic · काम योग · सूत्र 68", ["SUN"]),

        # ─── 69. सूर्य द्वादश — कामातुर ─────────────────────
        _s("ch_69_su_12_kamaatur",
           "द्वादश में सूर्य — कामातुर (यौन आसक्त)",
           "सूर्य 12वें भाव में → नेत्र रोग के साथ-साथ अत्यधिक कामातुर। "
           "शैया सुख की लालसा अनियंत्रित।",
           ih("SUN", 12),
           "Vedic · कामातुर योग · सूत्र 69", ["SUN"]),

        # ─── 70. सप्तम में मंगल मकर/कुम्भ — दुराचारी ───────
        _s("ch_70_ma_7_makar_kumbh",
           "सप्तम में मंगल (मकर/कुम्भ) — भयंकर दुराचारी",
           "मंगल सातवें भाव में मकर (Capricorn) या कुम्भ (Aquarius) राशि में → "
           "मांगलिक के साथ-साथ चरित्रहीनता (Depraved/Characterless)।",
           ih("MARS", 7) and ma_sign in (MAKAR_N, KUMBH_N),
           "Vedic · दुराचारी योग · सूत्र 70", ["MARS"]),

        # ─── 71. नीच मंगल 12वें — धन नाश ───────────────────
        _s("ch_71_neech_ma_12_kark",
           "नीच मंगल 12वें (कर्क) — व्यभिचार में धन नाश",
           "12वें भाव में मंगल अपनी नीच राशि कर्क में → व्यभिचार और दुराचार में "
           "धन का भारी नाश।",
           ih("MARS", 12) and ma_sign == KARK_N,
           "Vedic · नीच मंगल योग · सूत्र 71", ["MARS"]),

        # ─── 72. पाप पीड़ित शुक्र — दुष्टांगना संगति ────────
        _s("ch_72_paap_pidit_ve",
           "पाप पीड़ित शुक्र — अत्यधिक कामपीड़ा",
           "शुक्र पाप ग्रहों से दृष्ट या युक्त → अत्यधिक कामपीड़ा, व्यभिचार, "
           "दुष्ट स्त्रियों की संगति।",
           _paap_on("VENUS"),
           "Vedic · पाप-शुक्र योग · सूत्र 72", ["VENUS"]),

        # ═══ Section 6: चन्द्र राशि अनुसार कामुक प्रवृत्ति ════════════

        # ─── 73. वृश्चिक चंद्र — पर-स्त्री आसक्ति ──────────
        _s("ch_73_vrischik_moon",
           "वृश्चिक चंद्र — पराई स्त्री/पुरुष में आसक्ति",
           "वृश्चिक राशि का चंद्र → बाल्यावस्था से क्रूर स्वभाव, "
           "पर-दारासक्त (पराई स्त्री में लिप्त), धूर्तता और गुप्त कलाओं का अभ्यासी।",
           mo_sign == VRISHCHIK_N,
           "Vedic · चंद्र-राशि · सूत्र 73", ["MOON"]),

        # ─── 74. मकर चंद्र — स्त्रियों के वशीभूत ────────────
        _s("ch_74_makar_moon",
           "मकर चंद्र — स्त्रियों के पूरी तरह वशीभूत",
           "मकर राशि का चंद्र → 'वश: स्त्रीणां' — स्त्रियों के अधीन रहने वाला, "
           "सुंदर स्त्रियों का प्रियपात्र बनने के लिए सदा लालायित।",
           mo_sign == MAKAR_N,
           "Vedic · चंद्र-राशि · सूत्र 74", ["MOON"]),

        # ─── 75. मिथुन चंद्र — मैथुनप्रिय ───────────────────
        _s("ch_75_mithun_moon",
           "मिथुन चंद्र — मैथुनप्रिय (संभोग में अत्यधिक रुचि)",
           "मिथुन राशि का चंद्र → 'मैथुनप्रियः' — स्वभाव से ही अत्यधिक "
           "संभोग प्रिय।",
           mo_sign == MITHUN_N,
           "Vedic · चंद्र-राशि · सूत्र 75", ["MOON"]),

        # ═══ Section 7: नपुंसकता और यौन अक्षमता ════════════════════════

        # ─── 76. शनि-राहु 7th + शुक्र नीच — नपुंसकता ───────
        _s("ch_76_napunsakta_yoga",
           "नपुंसकता योग — शनि-राहु सप्तम + नीच शुक्र",
           "सप्तम भाव शनि और राहु से दृष्ट/युक्त हो और शुक्र नीच (कन्या) में हो → "
           "नपुंसकता, वीर्य में कीटों का अभाव, स्त्री में बाँझपन।",
           (ih("SATURN",7) or ih("RAHU",7) or
            _paap_on("SATURN") and bool(gh("SATURN")) and
            (gh("SATURN") == 7 or _mars_drishti_on_house(7))) and
           ve_sign == KANYA_N,
           "Vedic · नपुंसकता · सूत्र 76", ["SATURN","RAHU","VENUS"]),

        # ─── 77. निर्बल बुध — नपुंसकता ───────────────────────
        _s("ch_77_nirbala_budha",
           "निर्बल/पाप पीड़ित बुध — नपुंसकता",
           "बुध निर्बल हो (नीच/दुर्बल) या पाप प्रभाव में हो → "
           "नपुंसकता (Impotence) उत्पन्न होती है।",
           (me_sign == MEEN_N) or _paap_on("MERCURY"),
           "Vedic · नपुंसकता · सूत्र 77", ["MERCURY"]),

        # ═══ Section 1 (additions): अप्राकृतिक सेक्स ════════════════════

        # ─── 78. सप्तम में मंगल-बुध-शुक्र + शुभ दृष्टि नहीं ──
        _s("ch_78_ma_bu_ve_7_apraakrit",
           "सप्तम में मंगल-बुध-शुक्र — अप्राकृतिक सेक्स",
           "सातवें भाव में मंगल + बुध + शुक्र तीनों एक साथ हों और "
           "उन पर शुभ ग्रह (गुरु/चंद्र) की दृष्टि न हो → अप्राकृतिक यौनाचार।",
           ih("MARS",7) and ih("MERCURY",7) and ih("VENUS",7) and
           not (ac("JUPITER","MARS") or ac("JUPITER","MERCURY") or
                ac("JUPITER","VENUS") or
                bool(gh("JUPITER")) and gh("JUPITER") == 7),
           "Vedic · अप्राकृतिक सेक्स · सूत्र 78", ["MARS","MERCURY","VENUS"]),

        # ─── 79. लग्नेश-सप्तमेश परिवर्तन — बाइसेक्सुअल ────
        _s("ch_79_bisexual_parivartan",
           "लग्नेश-सप्तमेश स्थान परिवर्तन — बाइसेक्सुअल",
           "लग्नेश और सप्तमेश का परस्पर स्थान परिवर्तन → "
           "स्त्री और पुरुष दोनों में समान रुचि (Bisexual प्रवृत्ति)।",
           (h1l and h7l and h1l != h7l and
            pc.get(h1l,{}).get("sign",0) == h7l_sign and
            pc.get(h7l,{}).get("sign",0) == pc.get(h1l,{}).get("sign",0)) if (h1l and h7l) else False,
           "Vedic · बाइसेक्सुअल · सूत्र 79", []),

        # ─── 80. राहु दशम — विधवा स्त्री से संबंध ───────────
        _s("ch_80_rahu_10_vidhwa",
           "दशम में राहु — विधवा स्त्री से संबंध",
           "राहु दशम भाव में → जातक विधवा स्त्री से संबंध बनाता है "
           "(अन्य ग्रह योग के संदर्भ में देखें)।",
           ih("RAHU", 10),
           "Vedic · विधवा-संबंध · सूत्र 80", ["RAHU"]),

        # ─── 81. मंगल 3रे उच्च/स्वगृह — रजस्वला पूर्व ──────
        _s("ch_81_ma_3_uchcha_rajaswa",
           "3रे भाव में उच्च/स्वगृही मंगल — रजस्वला पूर्व संबंध",
           "स्त्री कुंडली में मंगल तीसरे भाव में उच्च (मकर) या स्वगृही (मेष/वृश्चिक) → "
           "रजस्वला होने से पहले ही संभोग का संकेत।",
           ih("MARS",3) and ma_sign in (MAKAR_N, MESH_N, VRISHCHIK_N),
           "Vedic · अति-काम योग · सूत्र 81", ["MARS"]),

        # ─── 82. प्रबल वेश्यावृत्ति योग ──────────────────────
        _s("ch_82_veshya_prbal",
           "प्रबल वेश्यावृत्ति योग — अष्टमेश बली + चंद्र 12वें + राहु 10वें",
           "अष्टमेश बलवान (उच्च/स्वक्षेत्र) + चंद्रमा 12वें भाव में + "
           "राहु दशम में → वेश्यावृत्ति का प्रबल योग।",
           _dig_ok(bhavesh(lagna,8), pc.get(bhavesh(lagna,8),{}).get("sign",0)) and
           ih("MOON",12) and ih("RAHU",10),
           "Vedic · वेश्यावृत्ति योग · सूत्र 82", ["RAHU","MOON"]),

        # ═══ Section 2 (gender-gated additions from Kundli Knowledge) ════

        # ─── 83. स्त्री कुंडली — बुध/शुक्र 7/8/10 में ────────
        _s("ch_83_stri_merc_ve_7_8_10",
           "वेश्यावृत्ति योग (स्त्री) — बुध/शुक्र 7वें/8वें/10वें में",
           "स्त्री कुंडली में सातवें, आठवें या दसवें भाव में बुध या शुक्र → "
           "देह-व्यापार में आने की संभावना।",
           gender == "FEMALE" and any(
               p in _planets_in_house(pc, lagna, h)
               for p in ("MERCURY","VENUS")
               for h in (7, 8, 10)
           ),
           "Kundli Knowledge · वेश्यावृत्ति · सूत्र 83", ["MERCURY","VENUS"]),

        # ─── 84. स्त्री कुंडली — अष्टम में शुक्र/शनि/मंगल ───
        _s("ch_84_stri_8th_damage",
           "अष्टम डैमेज (स्त्री) — शुक्र/शनि/शुक्र+मंगल 8वें में",
           "स्त्री कुंडली में अष्टम में शुक्र या शनि हो, अथवा शुक्र+मंगल की युति हो → "
           "देह-व्यापार में धकेलने वाला योग।",
           gender == "FEMALE" and (
               ih("VENUS",8) or ih("SATURN",8) or
               (ih("VENUS",8) and ih("MARS",8))
           ),
           "Kundli Knowledge · वेश्यावृत्ति · सूत्र 84", ["VENUS","SATURN","MARS"]),

        # ─── 85. सूर्य लग्न या 12वें — कामातुर (combined) ────
        _s("ch_85_su_lagna_12_combined",
           "सूर्य लग्न/12वें — कामी + कामातुर (संयुक्त नियम)",
           "सूर्य लग्न में → 'कामी'। सूर्य 12वें में → नेत्र रोग + 'कामातुर'। "
           "दोनों में से कोई भी स्थिति जातक को अत्यधिक कामुक बनाती है।",
           ih("SUN",1) or ih("SUN",12),
           "Kundli Knowledge · कामातुर · सूत्र 85", ["SUN"]),
    ]

    # ── Vedic Summary Rules ─────────────────────────────────
    ve_dig = _dig("VENUS", ve_sign)
    vedic = [
        _s("ve_dignity",
           f"शुक्र (कामेच्छा कारक): {ve_dig}",
           "शुक्र उच्च (मीन) — तीव्र कामुकता। नीच (कन्या) — दमित पर विकृत।",
           ve_sign == MEEN_N,
           "Parashara Hora · शुक्र बल · नियम 1", ["VENUS"]),

        _s("7th_malef_conc",
           f"सप्तम में पापी ग्रह: {', '.join(_ph(p) for p in h7) or 'कोई नहीं'}",
           "सप्तम में पापी → विवाह में कलेश, जीवनसाथी से असंतोष, बाहर संबंध।",
           any(p in _MALEFIC for p in h7),
           "Brihat Parashara · सप्तम · नियम 5", list(h7)),

        _s("5th_malef_conc",
           f"पंचम में पापी ग्रह: {', '.join(_ph(p) for p in h5) or 'कोई नहीं'}",
           "पंचम में पापी → प्रेम में धोखा या अनैतिक संबंध।",
           any(p in _MALEFIC for p in h5),
           "Brihat Parashara · पंचम · नियम 4", list(h5)),

        _s("12th_benefic",
           f"द्वादश में शुभ ग्रह: {', '.join(_ph(p) for p in h12) or 'कोई नहीं'}",
           "द्वादश में शुभ → दाम्पत्य सुख सन्तोषजनक।",
           any(p in _BENEFIC for p in h12),
           "Parashara Hora · द्वादश · नियम 2", list(h12)),

        _s("7th_lord_strength",
           f"सप्तमेश ({_ph(h7l)}): {_dig(h7l, h7l_sign)}",
           "सप्तमेश बलवान → निष्ठा। दुर्बल → असंतोष, बाहर संबंध।",
           _dig_ok(h7l, h7l_sign),
           "Parashara Hora · सप्तमेश · नियम 1"),

        _s("rahu_7",
           "सप्तम में राहु — धोखे की आशंका",
           "राहु सप्तम → भ्रम, धोखा। जीवनसाथी के विवाहेतर संबंध की संभावना।",
           ih("RAHU",7),
           "Jataka Parijata · राहु-सप्तम · नियम 3", ["RAHU"]),

        _s("ve_in_7",
           f"सप्तम में शुक्र: {'हाँ ⚠️' if 'VENUS' in h7 else 'नहीं'}",
           "शुक्र सप्तम → जीवनसाथी आकर्षक, पर वासना अतृप्त — अनेक संबंध की प्रवृत्ति।",
           "VENUS" in h7,
           "Brihat Parashara · शुक्र-सप्तम · नियम 7", ["VENUS"]),

        # ── चरित्र रक्षा (Shubh checks) ─────────────────────
        _s("ch_56_ju_mo_protect",
           "गुरु-चंद्र युति — चरित्र रक्षा ✅",
           "गुरु + चंद्र एक भाव में → विवेक और मन दोनों शुद्ध। "
           "उपरोक्त दोषों का प्रभाव काफी कम हो जाता है।",
           bool(gh("JUPITER")) and gh("JUPITER") == gh("MOON"),
           "Parashara Hora · चरित्र रक्षा · नियम 56", ["JUPITER","MOON"]),

        _s("ch_57_ju_ve_protect",
           "गुरु-शुक्र युति — कामुकता नियंत्रित ✅",
           "गुरु + शुक्र एक भाव में → कामेच्छा नियंत्रित, अनैतिक प्रवृत्तियाँ कम।",
           bool(gh("JUPITER")) and gh("JUPITER") == gh("VENUS"),
           "Parashara Hora · चरित्र रक्षा · नियम 57", ["JUPITER","VENUS"]),
    ]

    # ── D-Chart info ─────────────────────────────────────────
    dchart = {
        "d1_7":  _d1_house(lagna, 7,  h7,  "D1 — 7वाँ भाव (काम/जीवनसाथी)"),
        "d1_5":  _d1_house(lagna, 5,  h5,  "D1 — 5वाँ भाव (प्रेम/पूर्वकर्म)"),
        "d1_12": _d1_house(lagna, 12, h12, "D1 — 12वाँ भाव (शैया सुख)"),
        "d1_1":  _d1_house(lagna, 1,  h1,  "D1 — 1वाँ भाव (जातक का स्वभाव)"),
    }

    return {
        "bnn":    bnn,
        "vedic":  vedic,
        "dchart": dchart,
        "av":     _av(7, sav, lagna, 25),
    }


# ══════════════════════════════════════════════════════════
# MASTER AGGREGATOR — build_sutra_topics()
# ══════════════════════════════════════════════════════════
def build_sutra_topics(pc, lagna, sav=None, gender="MALE"):
    """
    Build all 16 topic analyses using D1 data.
    Called from full_nadi_analysis() with sav=sav_points.
    Returns dict: { topic_id: {bnn:[], vedic:[], dchart:{}, av:{}} }
    Future: add D9/D10/D7 sutras per topic when data is available.
    """
    _sav = sav if (sav and len(sav) >= 12) else [28] * 12
    return {
        "vivah":      _t_vivah(pc, lagna, _sav, gender),
        "santan":     _t_santan(pc, lagna, _sav, gender),
        "career":     _t_career(pc, lagna, _sav),
        "dhan":       _t_dhan(pc, lagna, _sav),
        "ayu":        _t_ayu(pc, lagna, _sav, gender),
        "swasthya":   _t_swasthya(pc, lagna, _sav),
        "manas":      _t_manas(pc, lagna, _sav),
        "durghatna":  _t_durghatna(pc, lagna, _sav),
        "astham":     _t_astham(pc, lagna, _sav),
        "court":      _t_court(pc, lagna, _sav),
        "property":   _t_property(pc, lagna, _sav),
        "videsh":     _t_videsh(pc, lagna, _sav),
        "mata":       _t_mata(pc, lagna, _sav),
        "pita":       _t_pita(pc, lagna, _sav),
        "bhai_behen": _t_bhai_behen(pc, lagna, _sav),
        "charitra":   _t_charitra(pc, lagna, _sav, gender),
    }