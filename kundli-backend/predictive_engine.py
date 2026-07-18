# =====================================================================
# 🚀 MASTER PREDICTIVE ENGINE (Jaimini, Bhrigu Bindu, Argala, Hora Lagna
#     + Progressed Lagna + D-10/D-24 + D-9 Marriage + Deep Forensics
#     + Arudha Lagna + Jaimini Trinity + Ishta Devta + Viparita Argala
#     + Karakamsha/Upapada/D-10 Mool Lagna + Pushkar/Vish Navamsha
#     + D-9 Deva/Nara/Rakshasa Deities)
# =====================================================================
#
# NOTE ON CLASSICAL AMBIGUITY:
# Kuch sutra (जैसे ब्रह्मा/माहेश्वर/रुद्र, इष्ट देवता) alag-alag grantho
# mein alag tareeke se define hote hain. Yahan ek working/simplified
# model implement kiya gaya hai jo commonly followed rules par based hai.
# Isse "final truth" na maankar ek strong starting heuristic maanein.
# =====================================================================
from datetime import timedelta, datetime

SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]
RASHI_NAMES_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]

# शास्त्रीय उच्च/नीच राशि (sign-level, exact degree नहीं)
EXALTATION_SIGN = {"Su": 0, "Mo": 1, "Ma": 9, "Me": 5, "Ju": 3, "Ve": 11, "Sa": 6}
DEBILITATION_SIGN = {"Su": 6, "Mo": 7, "Ma": 3, "Me": 11, "Ju": 9, "Ve": 5, "Sa": 0}
MALEFICS = ["Su", "Ma", "Sa", "Ra", "Ke"]
BENEFICS = ["Ju", "Ve", "Me", "Mo"]

ISHTA_DEVTA_MAP = {
    "Su": "भगवान शिव", "Mo": "देवी दुर्गा / मातृशक्ति", "Ma": "हनुमान जी / कार्तिकेय",
    "Me": "भगवान विष्णु", "Ju": "भगवान विष्णु / दत्तात्रेय", "Ve": "देवी लक्ष्मी",
    "Sa": "शनि देव / भैरव", "Ra": "देवी काली / दुर्गा", "Ke": "भगवान गणेश",
}


def _sign_lord(sign_idx):
    return SIGN_LORDS[sign_idx % 12]


def get_planet_dignity(planet_code, sign_idx):
    """ ग्रह की उच्च/नीच स्थिति (sign-level check) """
    if sign_idx is None:
        return "अज्ञात"
    if EXALTATION_SIGN.get(planet_code) == sign_idx:
        return "उच्च का (Exalted) 💪"
    if DEBILITATION_SIGN.get(planet_code) == sign_idx:
        return "नीच का (Debilitated) ⚠️"
    return "सामान्य"


# =====================================================================
# 1. जैमिनी चर कारक (Jaimini Chara Karakas)
# =====================================================================
def calculate_chara_karakas(astro_data):
    valid_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]
    karaka_roles = [
        ("AK", "आत्मकारक (राजा)"), ("AmK", "अमात्यकारक (मंत्री)"),
        ("BK", "भ्रातृकारक (भाई/गुरु)"), ("MK", "मातृकारक (माता)"),
        ("PK", "पुत्रकारक (संतान/बुद्धि)"), ("GK", "ज्ञातिकारक (शत्रु/संघर्ष)"),
        ("DK", "दाराकारक (जीवनसाथी)")
    ]
    sorted_planets = sorted(
        [p for p in valid_planets if p in astro_data],
        key=lambda p: astro_data[p]["SignDegree"],
        reverse=True
    )
    chara_karakas = {}
    for i, p_code in enumerate(sorted_planets):
        if i < len(karaka_roles):
            role_code, role_name = karaka_roles[i]
            chara_karakas[role_code] = {
                "planet": p_code,
                "role_name": role_name,
                "degree": round(astro_data[p_code]["SignDegree"], 4)
            }
    return chara_karakas


# =====================================================================
# 2. वर्गोत्तम (Vargottama)
# =====================================================================
def check_vargottama(astro_data):
    vargottama_planets = []
    for p_code, p_data in astro_data.items():
        if p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La"]:
            d1_sign = p_data.get("Vargas", {}).get("D1", {}).get("Idx")
            d9_sign = p_data.get("Vargas", {}).get("D9", {}).get("Idx")
            if d1_sign is not None and d1_sign == d9_sign:
                vargottama_planets.append(p_code)
    return vargottama_planets


# =====================================================================
# 3. डेंजर ज़ोन: 64वाँ नवमांश और 22वाँ द्रेष्काण (खर)
#    FIXED: अब api.py द्वारा पहले से calculate किए गए D9/D3 वर्ग इंडेक्स
#    इस्तेमाल होते हैं (raw D1 डिग्री पर गलत गणित लगाने के बजाय, क्योंकि
#    नवमांश/द्रेष्काण की गिनती हर राशि-प्रकार पर अलग pada rule से चलती है)
# =====================================================================
def calculate_crisis_points(astro_data):
    crisis_data = {}

    # 64वाँ नवमांश = D-9 के चंद्रमा से चौथा भाव (यानी 3 राशि आगे)
    d9_moon_idx = astro_data.get("Mo", {}).get("Vargas", {}).get("D9", {}).get("Idx")
    if d9_moon_idx is not None:
        sign_64 = (d9_moon_idx + 3) % 12
        crisis_data["64th_Navamsha_Sign_Idx"] = sign_64
        crisis_data["64th_Navamsha_Lord"] = _sign_lord(sign_64)  # असली "मारक" ग्रह

    # 22वाँ द्रेष्काण (खर) = D-3 के लग्न से आठवाँ भाव (यानी 7 राशि आगे)
    d3_lagna_idx = astro_data.get("La", {}).get("Vargas", {}).get("D3", {}).get("Idx")
    if d3_lagna_idx is not None:
        sign_22 = (d3_lagna_idx + 7) % 12
        crisis_data["22nd_Dreshkana_Sign_Idx"] = sign_22
        crisis_data["22nd_Dreshkana_Lord"] = _sign_lord(sign_22)

    return crisis_data


# =====================================================================
# 4. कुंद (Kunda Point)
# =====================================================================
def calculate_kunda(lagna_degree):
    kunda_degree = (lagna_degree * 81) % 360
    return {"degree": round(kunda_degree, 4), "sign_idx": int(kunda_degree / 30)}


# =====================================================================
# 5. भृगु बिंदु (Bhrigu Bindu - BB)
# =====================================================================
def calculate_bhrigu_bindu(moon_deg, rahu_deg):
    diff = (rahu_deg - moon_deg) % 360
    bb_deg = (moon_deg + (diff / 2.0)) % 360
    return {"degree": round(bb_deg, 4), "sign_idx": int(bb_deg / 30)}


# =====================================================================
# 6. अर्गला और विरोध अर्गला
#    FIXED: distance formula + अब क्वार्टर (पाद) मैचिंग से यह भी बताता है
#    कि अर्गला असल में कैंसल (कट) हो रही है या नहीं (V.P. Goel नियम:
#    Argala planet का quarter + Virodh planet का quarter == 5 होने पर
#    ही अर्गला पूरी तरह कट जाती है)
# =====================================================================
def get_quarter(sign_degree):
    """ किसी राशि में ग्रह की डिग्री (0-30) से पाद/क्वार्टर (1-4) निकालना """
    if sign_degree is None:
        return None
    if sign_degree < 7.5:
        return 1
    elif sign_degree < 15:
        return 2
    elif sign_degree < 22.5:
        return 3
    else:
        return 4


def calculate_argala_and_virodh(planet_house_map, astro_data=None):
    argala_pairs = {2: 12, 4: 10, 11: 3, 5: 9}
    argala_data = {}

    for house in range(1, 13):
        givers = []
        cancellers = []
        for p_code, p_house in planet_house_map.items():
            if p_house == 0:
                continue
            distance = (p_house - house + 12) % 12 + 1
            if distance in argala_pairs.keys():
                givers.append(p_code)
            elif distance in argala_pairs.values():
                cancellers.append(p_code)

        house_influences = []
        for giver in givers:
            entry = {"planet": giver, "type": "Argala", "cancelled": False, "cancelled_by": None}
            if astro_data:
                giver_q = get_quarter(astro_data.get(giver, {}).get("SignDegree"))
                for canceller in cancellers:
                    canceller_q = get_quarter(astro_data.get(canceller, {}).get("SignDegree"))
                    if giver_q is not None and canceller_q is not None and (giver_q + canceller_q) == 5:
                        entry["cancelled"] = True
                        entry["cancelled_by"] = canceller
                        break
            house_influences.append(entry)

        for canceller in cancellers:
            house_influences.append({"planet": canceller, "type": "Virodh Argala"})

        argala_data[house] = house_influences

    return argala_data


def calculate_viparita_argala(astro_data, planet_house_map):
    """
    विपरीत अर्गला (Jackpot Yoga): अगर तीसरे भाव में 3 या उससे अधिक
    पाप ग्रह हों, तो यह महा-सफलता का योग बनाता है।
    """
    malefics_in_3rd = [p for p in MALEFICS if planet_house_map.get(p) == 3]
    is_present = len(malefics_in_3rd) >= 3
    return {
        "malefics_in_3rd_house": malefics_in_3rd,
        "count": len(malefics_in_3rd),
        "viparita_argala_present": is_present,
        "verdict": "महा-सफलता वाली विपरीत अर्गला बन रही है 🚀" if is_present else "विपरीत अर्गला नहीं बन रही"
    }


# =====================================================================
# 7. Mathematical Hora Lagna
# =====================================================================
def calculate_mathematical_hora_lagna(sun_degree, birth_time_dt, sunrise_time_str):
    try:
        sr_h, sr_m = map(int, sunrise_time_str.split(':'))
        sr_total_mins = sr_h * 60 + sr_m
        bt_total_mins = birth_time_dt.hour * 60 + birth_time_dt.minute
        if bt_total_mins < sr_total_mins:
            bt_total_mins += 24 * 60
        tss_hours = (bt_total_mins - sr_total_mins) / 60.0
        hl_degree = (sun_degree + (tss_hours * 30)) % 360
        return {
            "degree": round(hl_degree, 4),
            "sign_idx": int(hl_degree / 30),
            "sign_name": RASHI_NAMES_HI[int(hl_degree / 30)]
        }
    except Exception:
        return None


# =====================================================================
# 8. काल होरा (Planetary Hour)
# =====================================================================
def calculate_kaal_hora(birth_time_dt, sunrise_time_str):
    try:
        sr_h, sr_m = map(int, sunrise_time_str.split(':'))
        astrological_date = birth_time_dt
        if birth_time_dt.hour * 60 + birth_time_dt.minute < sr_h * 60 + sr_m:
            astrological_date = birth_time_dt - timedelta(days=1)
        weekday = astrological_date.weekday()
        day_lords = {0: "Mo", 1: "Ma", 2: "Me", 3: "Ju", 4: "Ve", 5: "Sa", 6: "Su"}
        day_lord = day_lords[weekday]
        sequence = ["Su", "Ve", "Me", "Mo", "Sa", "Ju", "Ma"]
        start_idx = sequence.index(day_lord)

        sr_total_mins = sr_h * 60 + sr_m
        bt_total_mins = birth_time_dt.hour * 60 + birth_time_dt.minute
        if bt_total_mins < sr_total_mins:
            bt_total_mins += 24 * 60
        tss_hours = (bt_total_mins - sr_total_mins) / 60.0
        return sequence[(start_idx + int(tss_hours)) % 7]
    except Exception:
        return None


# =====================================================================
# 9. Progressed Lagna
#    (a) भृगु प्रोग्रेशन (1 वर्ष = 1 राशि) — जन्म आयु आधारित
#    (b) योगिनी दशा प्रोग्रेस्ड लग्न (V.P. Goel) — चल रहे दशा-नक्षत्र की
#        राशि, और अगर नक्षत्र दो राशियों में बंटा है तो अनुपात (proportion)
#        में समय के हिसाब से सही राशि। इनपुट (nakshatra_idx, dasha_start,
#        dasha_years) आपके मौजूदा Yogini Dasha मॉड्यूल से आएंगे — यहाँ सिर्फ
#        राशि-मैपिंग वाला हिस्सा है, दशा-अनुक्रम/36-वर्ष क्लबिंग लॉजिक नहीं।
# =====================================================================
NAKSHATRA_SPAN_DEG = 360.0 / 27.0  # 13.3333...


def get_nakshatra_sign_split(nakshatra_idx):
    """
    कोई नक्षत्र (0-26) एक ही राशि में पूरा आता है, या दो राशियों में बंटा है —
    यह सिर्फ नक्षत्र और राशि की fixed डिग्री-सीमाओं पर निर्भर करता है
    (जन्म-कुंडली specific नहीं, सार्वभौमिक/universal गणित है)।
    """
    start_deg = (nakshatra_idx % 27) * NAKSHATRA_SPAN_DEG
    end_deg = start_deg + NAKSHATRA_SPAN_DEG
    start_sign = int(start_deg // 30)
    end_sign = int((end_deg - 1e-9) // 30) % 12

    if start_sign == end_sign:
        return {"split": False, "sign_idx": start_sign}

    boundary_deg = (start_sign + 1) * 30
    deg_in_first = boundary_deg - start_deg
    deg_in_second = end_deg - boundary_deg
    total = deg_in_first + deg_in_second
    return {
        "split": True,
        "first_sign_idx": start_sign,
        "second_sign_idx": end_sign,
        "first_proportion": deg_in_first / total,
        "second_proportion": deg_in_second / total,
    }


def calculate_progressed_lagna(current_yogini_md, as_of_date=None):
    """
    V.P. Goel की 'योगिनी दशा प्रोग्रेस्ड लग्न' विधि — अब यही एकमात्र (sole)
    प्रोग्रेस्ड लग्न प्रणाली है। पुराना गणितीय/भृगु (lagna + age×30) तरीका
    पूरी तरह हटा दिया गया है।

    चल रही योगिनी महादशा का नक्षत्र जिस राशि में पड़ता है वही प्रोग्रेस्ड लग्न है।
    अगर नक्षत्र दो राशियों में बंटा है (कृत्तिका, मृगशिरा, पुनर्वसु, उत्तरा फाल्गुनी,
    चित्रा, विशाखा, उत्तराषाढ़ा, धनिष्ठा, पूर्वा भाद्रपद), तो दशा की अवधि उसी
    अनुपात में बंटती है — यानी दशा के पहले हिस्से में लग्न पहली राशि, बाद के
    हिस्से में दूसरी राशि।

    Params:
      current_yogini_md — calculate_yogini_dasha() से मिला current MD dict
                           (nakshatra, nakshatra_idx, star_lord, table_position,
                           start, end, duration_years रखता है) — single source
                           of truth, यहाँ कोई अलग गणना नहीं होती।
      as_of_date         — किस तारीख पर प्रोग्रेस्ड लग्न चाहिए (default: आज)
    """
    if not current_yogini_md:
        return None

    nakshatra_idx = current_yogini_md.get("nakshatra_idx")
    if nakshatra_idx is None:
        return None

    if as_of_date is None:
        as_of_date = datetime.now()

    dasha_start_date = datetime.strptime(current_yogini_md["start"], "%d-%m-%Y")
    dasha_end_date   = datetime.strptime(current_yogini_md["end"], "%d-%m-%Y")
    dasha_duration_years = current_yogini_md.get("duration_years", 0)

    total_days   = max((dasha_end_date - dasha_start_date).days, 1)
    elapsed_days = min(max((as_of_date - dasha_start_date).days, 0), total_days)
    progress_percent  = round((elapsed_days / total_days) * 100, 1)
    remaining_percent = round(100 - progress_percent, 1)

    base = {
        "method":          "VP Goel Yogini",
        "nakshatra":       current_yogini_md.get("nakshatra"),
        "nakshatra_idx":   nakshatra_idx,
        "star_lord":       current_yogini_md.get("star_lord"),
        "table_position":  current_yogini_md.get("table_position"),
        "start_date":      current_yogini_md.get("start"),
        "end_date":        current_yogini_md.get("end"),
        "duration_years":  dasha_duration_years,
        "progress_percent":  progress_percent,
        "remaining_percent": remaining_percent,
    }

    split_info = get_nakshatra_sign_split(nakshatra_idx)

    if not split_info["split"]:
        sign_idx = split_info["sign_idx"]
        sign_name = RASHI_NAMES_HI[sign_idx]
        base.update({
            "current_sign":    sign_name,
            "transition_date": None,
            "split": {
                "is_split":     False,
                "first_sign":   None,
                "second_sign":  None,
                "current_sign": sign_name,
            },
        })
        return base

    first_days = total_days * split_info["first_proportion"]
    transition_date = dasha_start_date + timedelta(days=first_days)
    current_sign_idx = (
        split_info["first_sign_idx"] if as_of_date < transition_date else split_info["second_sign_idx"]
    )
    current_sign_name = RASHI_NAMES_HI[current_sign_idx]

    base.update({
        "current_sign":    current_sign_name,
        "transition_date": transition_date.strftime("%d-%m-%Y"),
        "split": {
            "is_split":     True,
            "first_sign":   RASHI_NAMES_HI[split_info["first_sign_idx"]],
            "second_sign":  RASHI_NAMES_HI[split_info["second_sign_idx"]],
            "current_sign": current_sign_name,
        },
    })
    return base


# =====================================================================
# 10. D-10 दशमांश देवता (FIXED: डिग्री D-1 से, सम/विषम गिनती D-10 राशि से)
# =====================================================================
def get_d10_career_deities(astro_data):
    odd_deities = ["इन्द्र", "अग्नि", "यम", "राक्षस", "वरुण", "वायु", "कुबेर", "ईशान", "ब्रह्मा", "अनन्त"]
    even_deities = odd_deities[::-1]

    deities = {}
    for p_code, p_data in astro_data.items():
        if p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La"]:
            d10_sign = p_data.get("Vargas", {}).get("D10", {}).get("Idx")
            degree = p_data.get("SignDegree", 0)  # D-1 डिग्री
            if d10_sign is None:
                continue
            part = min(int(degree / 3), 9)  # 0 से 9 भाग, 30 डिग्री में

            # राशि सम है तो count उल्टे क्रम में, विषम है तो सीधे क्रम में
            if d10_sign % 2 == 0:
                deity = odd_deities[part]
            else:
                deity = even_deities[part]
            deities[p_code] = deity
    return deities


# =====================================================================
# 11. D-10 (करियर) और D-24 (शिक्षा) का मिलान
# =====================================================================
def check_d10_d24_match(astro_data):
    if "La" not in astro_data:
        return {}
    d10_lagna = astro_data["La"].get("Vargas", {}).get("D10", {}).get("Idx")
    d24_lagna = astro_data["La"].get("Vargas", {}).get("D24", {}).get("Idx")

    if d10_lagna is None or d24_lagna is None:
        return {"match": "Unknown"}

    diff = abs(d10_lagna - d24_lagna)
    if diff == 0:
        match_status = "Excellent (शिक्षा ही करियर है)"
    elif diff in [4, 8]:
        match_status = "Very Good (शिक्षा से करियर को भाग्य का साथ)"
    elif diff in [3, 9]:
        match_status = "Good (मेहनत से ज्ञान का इस्तेमाल)"
    else:
        match_status = "Unconventional (शिक्षा अलग, करियर का रास्ता अलग)"

    return {"d10_asc_idx": d10_lagna, "d24_asc_idx": d24_lagna, "match_status": match_status}


# =====================================================================
# 12. D-9 विवाह भाव — पूर्ण पोस्टमार्टम (dignity + conjunctions सहित)
# =====================================================================
def analyze_d9_marriage_lords(astro_data):
    if "La" not in astro_data:
        return {}
    d9_lagna_idx = astro_data["La"].get("Vargas", {}).get("D9", {}).get("Idx")
    if d9_lagna_idx is None:
        return {}

    d9_lagna_lord = SIGN_LORDS[d9_lagna_idx]
    d9_7th_lord = SIGN_LORDS[(d9_lagna_idx + 6) % 12]
    d9_9th_lord = SIGN_LORDS[(d9_lagna_idx + 8) % 12]

    all_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]

    analysis = {}
    for role, lord in [("Lagna Lord", d9_lagna_lord), ("7th Lord", d9_7th_lord), ("9th Lord", d9_9th_lord)]:
        if lord in astro_data:
            lord_d9_sign = astro_data[lord].get("Vargas", {}).get("D9", {}).get("Idx")
            if lord_d9_sign is None:
                continue
            house_in_d9 = (lord_d9_sign - d9_lagna_idx + 12) % 12 + 1
            is_malefic_house = house_in_d9 in [6, 8, 12]

            # इस ग्रह के साथ D-9 में कौन-कौन बैठा है (conjunctions)
            conjunct_with = []
            for other in all_planets:
                if other == lord or other not in astro_data:
                    continue
                other_sign = astro_data[other].get("Vargas", {}).get("D9", {}).get("Idx")
                if other_sign == lord_d9_sign:
                    conjunct_with.append(other)

            dignity = get_planet_dignity(lord, lord_d9_sign)
            has_benefic_company = any(c in BENEFICS for c in conjunct_with)
            has_malefic_company = any(c in MALEFICS for c in conjunct_with)

            summary = f"{house_in_d9} भाव ({RASHI_NAMES_HI[lord_d9_sign]}) में, {dignity}"
            if conjunct_with:
                summary += f", साथ में: {', '.join(conjunct_with)}"

            analysis[role] = {
                "planet": lord,
                "house_in_d9": house_in_d9,
                "sign_name": RASHI_NAMES_HI[lord_d9_sign],
                "dignity": dignity,
                "conjunct_with": conjunct_with,
                "in_6_8_12": is_malefic_house,
                "benefic_company": has_benefic_company,
                "malefic_company": has_malefic_company,
                "warning": "पाप/दुस्थान प्रभाव ⚠️" if is_malefic_house else "सुरक्षित ✅",
                "summary": summary
            }
    return analysis


# =====================================================================
# 13. आरूढ़ लग्न (Arudha Lagna - AL) — दुनिया के सामने हैसियत
# =====================================================================
def calculate_arudha_lagna(astro_data):
    if "La" not in astro_data:
        return {}
    lagna_idx = astro_data["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    if lagna_idx is None:
        return {}

    lagna_lord = _sign_lord(lagna_idx)
    if lagna_lord not in astro_data:
        return {}
    lord_sign = astro_data[lagna_lord].get("Vargas", {}).get("D1", {}).get("Idx")
    if lord_sign is None:
        return {}

    distance = (lord_sign - lagna_idx) % 12  # लग्न से लग्नेश तक कितने घर आगे
    al_sign = (lord_sign + distance) % 12

    # अपवाद: अगर AL लग्न (1st) या 7वें भाव में गिरे, तो 10 भाव और आगे गिनें
    exception_applied = False
    if al_sign == lagna_idx or al_sign == (lagna_idx + 6) % 12:
        al_sign = (al_sign + 9) % 12  # 10वां भाव आगे (9 राशियाँ आगे)
        exception_applied = True

    return {
        "sign_idx": al_sign,
        "sign_name": RASHI_NAMES_HI[al_sign],
        "lagna_lord": lagna_lord,
        "exception_applied": exception_applied,
        "note": "यह बताता है कि दुनिया आपकी हैसियत/इमेज को कैसे देखती है (असली स्थिति से अलग हो सकती है)"
    }


# =====================================================================
# 13B. कारकांश लग्न (Karakamsha Lagna — KL)
#      आत्मकारक (AK) D-9 (नवमांश) में जिस राशि में बैठा है, वही KL है।
#      यह "आत्मा का लग्न" है — असली हैसियत/सुख इसी से तय होती है
#      (आरूढ़ लग्न सिर्फ दुनिया की नज़र बताता है)
# =====================================================================
def calculate_karakamsha_lagna(astro_data, chara_karakas):
    ak_info = chara_karakas.get("AK") if chara_karakas else None
    if not ak_info:
        return {}
    ak_planet = ak_info["planet"]
    d9_sign = astro_data.get(ak_planet, {}).get("Vargas", {}).get("D9", {}).get("Idx")
    if d9_sign is None:
        return {}
    return {
        "sign_idx": d9_sign,
        "sign_name": RASHI_NAMES_HI[d9_sign],
        "atmakaraka": ak_planet,
        "note": "आत्मा की वास्तविक इच्छा और सुख/हैसियत का सूचक — जन्म लग्न या आरूढ़ लग्न से अलग हो सकता है"
    }


# =====================================================================
# 13C. उपपद लग्न (Upapada Lagna — UL)
#      12वें भाव का स्वामी 12वें भाव से जितनी दूर बैठा है, वहाँ से उतना ही
#      आगे गिनने पर UL आता है (Arudha-style गणना, 12वें भाव पर लागू)।
#      जैमिनी ज्योतिष का प्रमुख विवाह/जीवनसाथी सूचक।
# =====================================================================
def calculate_upapada_lagna(astro_data):
    if "La" not in astro_data:
        return {}
    lagna_idx = astro_data["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    if lagna_idx is None:
        return {}

    twelfth_idx = (lagna_idx - 1) % 12  # लग्न से 12वाँ भाव
    twelfth_lord = _sign_lord(twelfth_idx)
    if twelfth_lord not in astro_data:
        return {}
    lord_sign = astro_data[twelfth_lord].get("Vargas", {}).get("D1", {}).get("Idx")
    if lord_sign is None:
        return {}

    distance = (lord_sign - twelfth_idx) % 12
    ul_sign = (lord_sign + distance) % 12

    # अपवाद: UL अपने ही भाव (1st) या 7वें भाव में गिरे, तो 10 भाव और आगे
    exception_applied = False
    if ul_sign == twelfth_idx or ul_sign == (twelfth_idx + 6) % 12:
        ul_sign = (ul_sign + 9) % 12
        exception_applied = True

    return {
        "sign_idx": ul_sign,
        "sign_name": RASHI_NAMES_HI[ul_sign],
        "twelfth_lord": twelfth_lord,
        "exception_applied": exception_applied,
        "note": "जैमिनी ज्योतिष का प्रमुख विवाह-सूचक — जीवनसाथी व वैवाहिक स्थायित्व की वास्तविक स्थिति दर्शाता है"
    }


# =====================================================================
# 13D. D-10 मूल लग्न (D-10 का असली पहला भाव — Internal Work Drive)
#      (10वें भाव को लग्न मानकर निकाला गया "करियर लग्न" get_d10_career_deities
#      में पहले से है — यह उससे अलग है: D-10 का असली/मूल 1st house)
# =====================================================================
def calculate_d10_mool_lagna(astro_data):
    if "La" not in astro_data:
        return {}
    d10_lagna_idx = astro_data["La"].get("Vargas", {}).get("D10", {}).get("Idx")
    if d10_lagna_idx is None:
        return {}

    occupants = []
    for p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
        p_data = astro_data.get(p_code)
        if not p_data:
            continue
        p_d10_sign = p_data.get("Vargas", {}).get("D10", {}).get("Idx")
        if p_d10_sign == d10_lagna_idx:
            occupants.append(p_code)

    # शनि पीड़ित है या नहीं (नीच का, या राहु/केतु के साथ)
    saturn_afflicted = False
    if "Sa" in occupants:
        sa_d1_sign = astro_data.get("Sa", {}).get("Vargas", {}).get("D1", {}).get("Idx")
        saturn_afflicted = (DEBILITATION_SIGN.get("Sa") == sa_d1_sign) or any(m in occupants for m in ["Ra", "Ke"])

    if "Ma" in occupants or any(b in occupants for b in ["Ju", "Ve"]):
        drive = "अत्यधिक महत्वाकांक्षी (Highly Ambitious / Workaholic)"
    elif "Ke" in occupants or saturn_afflicted:
        drive = "अंदर से विरक्त — मजबूरी में काम (Reluctant / Detached Worker)"
    elif occupants:
        drive = "संतुलित कार्य-प्रवृत्ति (Balanced Work Drive)"
    else:
        drive = "तटस्थ — इस भाव में कोई ग्रह नहीं (Neutral)"

    return {
        "sign_idx": d10_lagna_idx,
        "sign_name": RASHI_NAMES_HI[d10_lagna_idx],
        "occupants": occupants,
        "internal_work_drive": drive,
        "note": "D-10 का मूल/असली लग्न — काम करने की आंतरिक इच्छा (Internal Drive) दर्शाता है, 'दृश्य/अदृश्य प्रोफेशन' वाले D-10 विश्लेषण से अलग"
    }


# =====================================================================
# 13E. पुष्कर नवमांश (Pushkar Navamsha) — कुण्डली का 'लकी चार्म'
#      हर राशि में 24 विशेष नवमांश होते हैं (तत्व/Element आधारित) जहाँ
#      बैठा ग्रह अपनी पूरी शक्ति व शुभता प्राप्त कर लेता है, चाहे वह
#      नीच/पीड़ित ही क्यों न हो।
#      नियम (तत्व अनुसार, नवमांश क्रमांक 1-9):
#        अग्नि तत्व (मेष/सिंह/धनु)   → नवमांश 7, 9
#        पृथ्वी तत्व (वृषभ/कन्या/मकर) → नवमांश 3, 5
#        वायु तत्व (मिथुन/तुला/कुंभ)  → नवमांश 6, 8
#        जल तत्व (कर्क/वृश्चिक/मीन)  → नवमांश 1, 3
# =====================================================================
FIRE_SIGNS  = [0, 4, 8]    # मेष, सिंह, धनु
EARTH_SIGNS = [1, 5, 9]    # वृषभ, कन्या, मकर
AIR_SIGNS   = [2, 6, 10]   # मिथुन, तुला, कुंभ
WATER_SIGNS = [3, 7, 11]   # कर्क, वृश्चिक, मीन

PUSHKAR_NAVAMSHA_NUMS = {}
for s in FIRE_SIGNS:  PUSHKAR_NAVAMSHA_NUMS[s] = [7, 9]
for s in EARTH_SIGNS: PUSHKAR_NAVAMSHA_NUMS[s] = [3, 5]
for s in AIR_SIGNS:   PUSHKAR_NAVAMSHA_NUMS[s] = [6, 8]
for s in WATER_SIGNS: PUSHKAR_NAVAMSHA_NUMS[s] = [1, 3]

# विष नवमांश (Vish Navamsha) — साइलेंट किलर
#   मेष/वृषभ/कन्या/धनु        → 1st नवमांश
#   मिथुन/सिंह/तुला/कुंभ       → 5वाँ नवमांश
#   कर्क/वृश्चिक/मकर/मीन       → 9वाँ नवमांश
VISH_NAVAMSHA_GROUP_1 = [0, 1, 5, 8]    # मेष, वृषभ, कन्या, धनु → नवमांश 1
VISH_NAVAMSHA_GROUP_5 = [2, 4, 6, 10]   # मिथुन, सिंह, तुला, कुंभ → नवमांश 5
VISH_NAVAMSHA_GROUP_9 = [3, 7, 9, 11]   # कर्क, वृश्चिक, मकर, मीन → नवमांश 9

VISH_NAVAMSHA_MAP = {}
for s in VISH_NAVAMSHA_GROUP_1: VISH_NAVAMSHA_MAP[s] = 1
for s in VISH_NAVAMSHA_GROUP_5: VISH_NAVAMSHA_MAP[s] = 5
for s in VISH_NAVAMSHA_GROUP_9: VISH_NAVAMSHA_MAP[s] = 9

# ग्रह से जुड़ा रिश्तेदार (विष नवमांश में ग्रह पीड़ित हो तो किसे कष्ट)
VISH_RELATIVE_MAP = {
    "Su": "पिता", "Mo": "माता", "Ma": "भाई", "Me": "मामा/बुआ",
    "Ju": "गुरु/संतान", "Ve": "जीवनसाथी", "Sa": "नौकर/सेवक",
    "Ra": "ननिहाल पक्ष", "Ke": "ददिहाल पक्ष",
}


def _navamsha_number(sign_degree):
    """0-30° की SignDegree से नवमांश क्रमांक (1-9) निकालता है"""
    if sign_degree is None:
        return None
    step = 30.0 / 9.0  # 3°20'
    n = int(sign_degree / step) + 1
    return min(max(n, 1), 9)


def get_pushkar_navamsha_planets(astro_data):
    """कौन-कौन से ग्रह पुष्कर नवमांश (शुभ) में बैठे हैं"""
    result = {}
    for p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La"]:
        p_data = astro_data.get(p_code)
        if not p_data:
            continue
        d1_sign = p_data.get("Vargas", {}).get("D1", {}).get("Idx")
        sign_degree = p_data.get("SignDegree")
        if d1_sign is None or sign_degree is None:
            continue
        navamsha_num = _navamsha_number(sign_degree)
        pushkar_nums = PUSHKAR_NAVAMSHA_NUMS.get(d1_sign, [])
        if navamsha_num in pushkar_nums:
            result[p_code] = {
                "sign_idx": d1_sign,
                "sign_name": RASHI_NAMES_HI[d1_sign],
                "navamsha_number": navamsha_num,
                "sign_degree": round(sign_degree, 4),
                "label": "पुष्कर ग्रह — छप्पर फाड़ भाग्य का सूचक 🌟"
            }
    return result


def get_vish_navamsha_planets(astro_data):
    """कौन-कौन से ग्रह विष नवमांश (हानिकारक) में बैठे हैं"""
    result = {}
    for p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La"]:
        p_data = astro_data.get(p_code)
        if not p_data:
            continue
        d1_sign = p_data.get("Vargas", {}).get("D1", {}).get("Idx")
        sign_degree = p_data.get("SignDegree")
        if d1_sign is None or sign_degree is None:
            continue
        navamsha_num = _navamsha_number(sign_degree)
        vish_num = VISH_NAVAMSHA_MAP.get(d1_sign)
        if vish_num is not None and navamsha_num == vish_num:
            result[p_code] = {
                "sign_idx": d1_sign,
                "sign_name": RASHI_NAMES_HI[d1_sign],
                "navamsha_number": navamsha_num,
                "sign_degree": round(sign_degree, 4),
                "affected_relative": VISH_RELATIVE_MAP.get(p_code, "संबंधित व्यक्ति"),
                "label": "🚨 विष नवमांश — साइलेंट किलर"
            }
    return result


# =====================================================================
# 13F. नवमांश के 3 देवता (Deva / Nara / Rakshasa) — D-9 का मनोवैज्ञानिक स्वभाव
#      ग्रह D-9 में चर राशि में हो → देव, स्थिर राशि में हो → नर,
#      द्विस्वभाव राशि में हो → राक्षस
# =====================================================================
CHARA_SIGNS       = [0, 3, 6, 9]    # मेष, कर्क, तुला, मकर (movable)
STHIRA_SIGNS      = [1, 4, 7, 10]   # वृषभ, सिंह, वृश्चिक, कुंभ (fixed)
DWISWABHAVA_SIGNS = [2, 5, 8, 11]   # मिथुन, कन्या, धनु, मीन (dual)

D9_DEITY_NOTES = {
    "देव": "शांत स्वभाव, दूसरों को देने वाला, सात्विक प्रवृत्ति",
    "नर":  "अत्यंत व्यावहारिक (Practical) और ज़मीनी इंसान, राजसिक प्रवृत्ति",
    "राक्षस": "अत्यधिक भौतिकवादी (Materialistic), लक्ष्य के लिए कठोर परिश्रमी, तामसिक प्रवृत्ति",
}


def get_navamsha_deva_nara_rakshasa(astro_data):
    result = {}
    for p_code in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "La"]:
        p_data = astro_data.get(p_code)
        if not p_data:
            continue
        d9_sign = p_data.get("Vargas", {}).get("D9", {}).get("Idx")
        if d9_sign is None:
            continue
        if d9_sign in CHARA_SIGNS:
            deity = "देव"
        elif d9_sign in STHIRA_SIGNS:
            deity = "नर"
        else:
            deity = "राक्षस"
        result[p_code] = {
            "d9_sign_idx": d9_sign,
            "d9_sign_name": RASHI_NAMES_HI[d9_sign],
            "deity": deity,
            "note": D9_DEITY_NOTES[deity],
        }
    return result


# =====================================================================
# 14. ब्रह्मा, माहेश्वर, रुद्र (Jaimini Trinity) — आयु व कष्ट संकेतक
#     (सरलीकृत मॉडल — ग्रंथों में विविधता है)
# =====================================================================
def analyze_jaimini_trinity(astro_data, chara_karakas):
    if "AK" not in chara_karakas:
        return {}
    ak_planet = chara_karakas["AK"]["planet"]
    ak_sign = astro_data.get(ak_planet, {}).get("Vargas", {}).get("D1", {}).get("Idx")
    if ak_sign is None:
        return {}

    # AK से 6, 8, 12वें भाव के स्वामी
    candidates = {
        6: _sign_lord((ak_sign + 5) % 12),
        8: _sign_lord((ak_sign + 7) % 12),
        12: _sign_lord((ak_sign + 11) % 12),
    }

    # सबसे ज़्यादा डिग्री वाला (Jaimini नियम: ज़्यादा डिग्री = ज़्यादा बली) -> ब्रह्मा
    strongest_house, strongest_planet = None, None
    best_degree = -1
    for house, planet in candidates.items():
        deg = astro_data.get(planet, {}).get("SignDegree", 0)
        if deg > best_degree:
            best_degree = deg
            strongest_house, strongest_planet = house, planet

    brahma = {"planet": strongest_planet, "from_house": strongest_house, "role": "ब्रह्मा (आयु व मुक्ति का सूचक)"}

    # माहेश्वर: बचे हुए दो में से जो अधिक बली
    remaining = {h: p for h, p in candidates.items() if h != strongest_house}
    maheshwara_house, maheshwara_planet, best_deg2 = None, None, -1
    for house, planet in remaining.items():
        deg = astro_data.get(planet, {}).get("SignDegree", 0)
        if deg > best_deg2:
            best_deg2 = deg
            maheshwara_house, maheshwara_planet = house, planet
    maheshwara = {"planet": maheshwara_planet, "from_house": maheshwara_house, "role": "माहेश्वर (रक्षक/उद्धारक सूचक)"}

    # रुद्र: 8वें भाव का स्वामी (कष्ट व संकट का प्रत्यक्ष सूचक)
    rudra_planet = candidates.get(8)
    rudra = {"planet": rudra_planet, "from_house": 8, "role": "रुद्र (कष्ट व संकट सूचक)"}

    return {"brahma": brahma, "maheshwara": maheshwara, "rudra": rudra}


# =====================================================================
# 15. इष्ट देवता (Ishta Devta) — D-9 के 5वें भाव के आधार पर
# =====================================================================
def get_ishta_devta(astro_data):
    if "La" not in astro_data:
        return {}
    d9_lagna_idx = astro_data["La"].get("Vargas", {}).get("D9", {}).get("Idx")
    if d9_lagna_idx is None:
        return {}
    fifth_sign_d9 = (d9_lagna_idx + 4) % 12

    occupants = []
    for p in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
        p_d9_sign = astro_data.get(p, {}).get("Vargas", {}).get("D9", {}).get("Idx")
        if p_d9_sign == fifth_sign_d9:
            occupants.append(p)

    if occupants:
        deities = [ISHTA_DEVTA_MAP.get(p, p) for p in occupants]
        source = f"D-9 के 5वें भाव में बैठे ग्रह: {', '.join(occupants)}"
    else:
        # 5वां भाव खाली है तो उसके स्वामी के आधार पर
        fifth_lord = _sign_lord(fifth_sign_d9)
        deities = [ISHTA_DEVTA_MAP.get(fifth_lord, fifth_lord)]
        source = f"5वां भाव खाली, अतः 5वें स्वामी ({fifth_lord}) के आधार पर"

    return {"ishta_devta": deities, "fifth_sign_d9": fifth_sign_d9, "basis": source}


# =====================================================================
# सहायक: मानक ज्योतिषीय दृष्टि (Vedic Aspects) — सभी ग्रह 7वें को देखते हैं,
# मंगल 4th/8th, गुरु 5th/9th, शनि 3rd/10th अतिरिक्त देखते हैं (special drishti)
# =====================================================================
def _get_aspected_signs(planet_code, sign_idx):
    aspects = [(sign_idx + 6) % 12]  # सभी ग्रह — 7वीं दृष्टि
    if planet_code == "Ma":
        aspects += [(sign_idx + 3) % 12, (sign_idx + 7) % 12]   # 4th, 8th
    elif planet_code == "Ju":
        aspects += [(sign_idx + 4) % 12, (sign_idx + 8) % 12]   # 5th, 9th
    elif planet_code == "Sa":
        aspects += [(sign_idx + 2) % 12, (sign_idx + 9) % 12]   # 3rd, 10th
    return aspects


# =====================================================================
# 15B. संन्यास योग व धर्म परिवर्तन (Sanyas Yoga & Change of Religion)
# =====================================================================
def check_sanyas_yoga(astro_data):
    """कट्टर संन्यास योग — D-9 में चंद्रमा मंगल/शनि की राशि में उसी ग्रह के साथ"""
    if "Mo" not in astro_data or "Sa" not in astro_data or "Ma" not in astro_data:
        return {"present": False}
    moon_d9 = astro_data["Mo"].get("Vargas", {}).get("D9", {}).get("Idx")
    sat_d9  = astro_data["Sa"].get("Vargas", {}).get("D9", {}).get("Idx")
    mars_d9 = astro_data["Ma"].get("Vargas", {}).get("D9", {}).get("Idx")
    if moon_d9 is None:
        return {"present": False}

    MARS_SIGNS    = [0, 7]    # मेष, वृश्चिक
    SATURN_SIGNS  = [9, 10]   # मकर, कुंभ

    present, reason = False, None
    if moon_d9 in MARS_SIGNS and sat_d9 == moon_d9:
        present = True
        reason = f"चंद्रमा मंगल की राशि ({RASHI_NAMES_HI[moon_d9]}) में शनि के साथ D-9 में बैठा है"
    elif moon_d9 in SATURN_SIGNS and mars_d9 == moon_d9:
        present = True
        reason = f"चंद्रमा शनि की राशि ({RASHI_NAMES_HI[moon_d9]}) में मंगल के साथ D-9 में बैठा है"

    return {
        "present": present,
        "reason": reason,
        "note": "क्लासिकल 'संन्यास योग' — भयंकर मानसिक सहनशक्ति (Mental Endurance) व वैराग्य की प्रवृत्ति देता है"
    }


def check_dharma_parivartan(astro_data):
    """धर्म परिवर्तन — D-9 का 8वाँ स्वामी 9वें भाव पर, D-1 का 2रा स्वामी पीड़ित, गुरु 9वें से 6/8/12 में"""
    if "La" not in astro_data:
        return {"present": False}
    d9_lagna_idx = astro_data["La"].get("Vargas", {}).get("D9", {}).get("Idx")
    d1_lagna_idx = astro_data["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    if d9_lagna_idx is None or d1_lagna_idx is None:
        return {"present": False}

    d9_8th_lord = SIGN_LORDS[(d9_lagna_idx + 7) % 12]
    d9_9th_sign = (d9_lagna_idx + 8) % 12
    lord8_d9_sign = astro_data.get(d9_8th_lord, {}).get("Vargas", {}).get("D9", {}).get("Idx")
    lord8_influences_9th = (lord8_d9_sign == d9_9th_sign)

    d1_2nd_lord = SIGN_LORDS[(d1_lagna_idx + 1) % 12]
    lord2_d1_sign = astro_data.get(d1_2nd_lord, {}).get("Vargas", {}).get("D1", {}).get("Idx")
    lord2_afflicted = False
    if lord2_d1_sign is not None:
        is_debilitated = DEBILITATION_SIGN.get(d1_2nd_lord) == lord2_d1_sign
        conj_with_malefic = any(
            m != d1_2nd_lord and astro_data.get(m, {}).get("Vargas", {}).get("D1", {}).get("Idx") == lord2_d1_sign
            for m in MALEFICS
        )
        lord2_afflicted = is_debilitated or conj_with_malefic

    ju_d1_sign = astro_data.get("Ju", {}).get("Vargas", {}).get("D1", {}).get("Idx")
    d1_9th_sign = (d1_lagna_idx + 8) % 12
    jupiter_in_dusthana_from_9th = False
    if ju_d1_sign is not None:
        house_from_9th = (ju_d1_sign - d1_9th_sign + 12) % 12 + 1
        jupiter_in_dusthana_from_9th = house_from_9th in [6, 8, 12]

    present = lord8_influences_9th and lord2_afflicted and jupiter_in_dusthana_from_9th

    return {
        "present": present,
        "d9_8th_lord_influences_9th": lord8_influences_9th,
        "d1_2nd_lord_afflicted": lord2_afflicted,
        "jupiter_in_dusthana_from_9th": jupiter_in_dusthana_from_9th,
        "note": "तीनों शर्तें पूरी होने पर व्यक्ति जन्म का धर्म छोड़कर दूसरा धर्म अपना सकता है"
    }


# =====================================================================
# 15C. त्रिशांश (D-30) से विवाह का फैसला — जल्दी शादी / शादी से इनकार
# =====================================================================
def check_d30_marriage_timing(astro_data):
    if "La" not in astro_data:
        return {}
    d1_lagna_idx  = astro_data["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    d30_lagna_idx = astro_data["La"].get("Vargas", {}).get("D30", {}).get("Idx")
    if d1_lagna_idx is None or d30_lagna_idx is None:
        return {}

    all_planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]

    # ── जल्दी शादी (Early Marriage) ──
    matching_planets = []
    for p in all_planets:
        p_data = astro_data.get(p)
        if not p_data:
            continue
        d1_sign  = p_data.get("Vargas", {}).get("D1", {}).get("Idx")
        d30_sign = p_data.get("Vargas", {}).get("D30", {}).get("Idx")
        if d1_sign is None or d30_sign is None:
            continue
        d1_touches_lagna  = (d1_sign == d1_lagna_idx) or (d1_lagna_idx in _get_aspected_signs(p, d1_sign))
        d30_touches_lagna = (d30_sign == d30_lagna_idx) or (d30_lagna_idx in _get_aspected_signs(p, d30_sign))
        if d1_touches_lagna and d30_touches_lagna:
            matching_planets.append(p)

    early_marriage = {
        "present": len(matching_planets) > 0,
        "matching_planets": matching_planets,
        "note": "D-1 लग्न व D-30 लग्न दोनों को छूने वाले ग्रह — तय उम्र से पहले विवाह के सूचक"
    }

    # ── शादी से इनकार (Denial of Marriage) ──
    d30_7th_sign = (d30_lagna_idx + 6) % 12
    d30_8th_sign = (d30_lagna_idx + 7) % 12
    occupants_7, occupants_8, benefic_aspecting = [], [], []
    for p in all_planets:
        p_data = astro_data.get(p)
        if not p_data:
            continue
        d30_sign = p_data.get("Vargas", {}).get("D30", {}).get("Idx")
        if d30_sign is None:
            continue
        if d30_sign == d30_7th_sign:
            occupants_7.append(p)
        if d30_sign == d30_8th_sign:
            occupants_8.append(p)
        if p in BENEFICS:
            aspected = _get_aspected_signs(p, d30_sign)
            if d30_7th_sign in aspected or d30_8th_sign in aspected:
                benefic_aspecting.append(p)

    malefics_in_7 = [p for p in occupants_7 if p in MALEFICS]
    malefics_in_8 = [p for p in occupants_8 if p in MALEFICS]
    marriage_denial = {
        "present": bool(malefics_in_7) and bool(malefics_in_8) and not benefic_aspecting,
        "malefics_in_7th": malefics_in_7,
        "malefics_in_8th": malefics_in_8,
        "benefic_aspect_present": bool(benefic_aspecting),
        "note": "D-30 के 7वें व 8वें भाव में पाप ग्रह, शुभ दृष्टि रहित — विवाह में देरी/इनकार का संकेत"
    }

    return {"early_marriage": early_marriage, "marriage_denial": marriage_denial}


# =====================================================================
# 15D. D-9 से यौन प्रवृत्ति (Sexual Desire Patterns)
# =====================================================================
def analyze_d9_sexual_patterns(astro_data):
    if "Ma" not in astro_data or "Ve" not in astro_data:
        return {}
    ma_d9 = astro_data["Ma"].get("Vargas", {}).get("D9", {}).get("Idx")
    ve_d9 = astro_data["Ve"].get("Vargas", {}).get("D9", {}).get("Idx")
    if ma_d9 is None or ve_d9 is None:
        return {}

    result = {}

    # 1. अत्यधिक वासना — मंगल-शुक्र D-9 युति या समसप्तक
    conjunct = (ma_d9 == ve_d9)
    opposition = (abs(ma_d9 - ve_d9) % 12 == 6)
    result["excessive_desire"] = {
        "present": conjunct or opposition,
        "type": ("युति (Conjunction)" if conjunct else "सम्मुख/समसप्तक (Opposition)") if (conjunct or opposition) else None,
        "note": "मंगल-शुक्र का D-9 संबंध — सेक्स की अत्यधिक इच्छा व इसी विषय पर केंद्रित सोच"
    }

    # 2. असामान्य/विचित्र इच्छाएं — वक्री मंगल/शुक्र राहु के साथ, D-9 में D-1 के 6/8/12 भाव की राशि में
    d1_lagna_idx = astro_data.get("La", {}).get("Vargas", {}).get("D1", {}).get("Idx")
    ra_d9 = astro_data.get("Ra", {}).get("Vargas", {}).get("D9", {}).get("Idx")
    abnormal_planets = []
    if d1_lagna_idx is not None and ra_d9 is not None:
        dusthana_signs_d1 = [(d1_lagna_idx + 5) % 12, (d1_lagna_idx + 7) % 12, (d1_lagna_idx + 11) % 12]
        for p, p_d9 in [("Ma", ma_d9), ("Ve", ve_d9)]:
            is_retro = astro_data.get(p, {}).get("Retrograde", False)
            with_rahu = (p_d9 == ra_d9)
            in_dusthana = p_d9 in dusthana_signs_d1
            if is_retro and with_rahu and in_dusthana:
                abnormal_planets.append(p)
    result["abnormal_desire"] = {
        "present": bool(abnormal_planets),
        "planets": abnormal_planets,
        "note": "असामान्य/विचित्र यौन रुचियाँ (जैसे उम्र में बड़ा/छोटा पार्टनर) का सूचक"
    }

    # 3. इच्छा का अभाव — शुक्र-शनि D-9 युति या दृष्टि संबंध
    sa_d9 = astro_data.get("Sa", {}).get("Vargas", {}).get("D9", {}).get("Idx")
    lack_of_desire = False
    if sa_d9 is not None:
        ve_sa_conjunct = (ve_d9 == sa_d9)
        ve_aspects_sa = sa_d9 in _get_aspected_signs("Ve", ve_d9)
        sa_aspects_ve = ve_d9 in _get_aspected_signs("Sa", sa_d9)
        lack_of_desire = ve_sa_conjunct or ve_aspects_sa or sa_aspects_ve
    result["lack_of_desire"] = {
        "present": lack_of_desire,
        "note": "शुक्र-शनि का सीधा D-9 संबंध — यौन इच्छाएं कमज़ोर या न्यून"
    }

    return result


# =====================================================================
# 15E. विदेशी जीवनसाथी व विदेश में बसना (Foreign Spouse & Settlement Abroad)
# =====================================================================
def analyze_foreign_settlement(astro_data, chara_karakas):
    result = {}

    # 1. विदेशी जीवनसाथी — दाराकारक (DK) राहु/केतु युक्त या केतु-दृष्ट
    dk_info = chara_karakas.get("DK") if chara_karakas else None
    if dk_info:
        dk_planet = dk_info["planet"]
        dk_d1_sign = astro_data.get(dk_planet, {}).get("Vargas", {}).get("D1", {}).get("Idx")
        ra_d1_sign = astro_data.get("Ra", {}).get("Vargas", {}).get("D1", {}).get("Idx")
        ke_d1_sign = astro_data.get("Ke", {}).get("Vargas", {}).get("D1", {}).get("Idx")

        with_rahu = dk_d1_sign is not None and dk_d1_sign == ra_d1_sign
        with_ketu = dk_d1_sign is not None and dk_d1_sign == ke_d1_sign
        aspected_by_ketu = (
            ke_d1_sign is not None and dk_d1_sign is not None
            and dk_d1_sign in _get_aspected_signs("Ke", ke_d1_sign)
        )
        result["foreign_spouse"] = {
            "present": with_rahu or with_ketu or aspected_by_ketu,
            "dara_karaka": dk_planet,
            "with_ketu": with_ketu,
            "with_rahu": with_rahu,
            "note": "दाराकारक राहु/केतु-युक्त या केतु-दृष्ट — विदेशी/भिन्न धर्म-जाति में विवाह का संकेत (केतु विशेष प्रबल)"
        }
    else:
        result["foreign_spouse"] = {"present": False}

    # 2. विदेश में बसना — D-9 का 7वाँ स्वामी 9वें/12वें स्वामी से जुड़े, D-9 का 4था स्वामी भी जुड़े
    if "La" in astro_data:
        d9_lagna_idx = astro_data["La"].get("Vargas", {}).get("D9", {}).get("Idx")
        if d9_lagna_idx is not None:
            d9_7th_lord  = SIGN_LORDS[(d9_lagna_idx + 6) % 12]
            d9_9th_lord  = SIGN_LORDS[(d9_lagna_idx + 8) % 12]
            d9_12th_lord = SIGN_LORDS[(d9_lagna_idx + 11) % 12]
            d9_4th_lord  = SIGN_LORDS[(d9_lagna_idx + 3) % 12]

            def _d9_sign_of(p):
                return astro_data.get(p, {}).get("Vargas", {}).get("D9", {}).get("Idx")

            lord7_sign, lord9_sign  = _d9_sign_of(d9_7th_lord), _d9_sign_of(d9_9th_lord)
            lord12_sign, lord4_sign = _d9_sign_of(d9_12th_lord), _d9_sign_of(d9_4th_lord)

            lord7_joins = lord7_sign is not None and (lord7_sign == lord9_sign or lord7_sign == lord12_sign)
            lord4_joins = lord4_sign is not None and (lord4_sign == lord9_sign or lord4_sign == lord12_sign)

            result["settle_abroad"] = {
                "present": lord7_joins and lord4_joins,
                "d9_7th_lord_joins_9_12": lord7_joins,
                "d9_4th_lord_joins_9_12": lord4_joins,
                "note": "शादी के बाद स्वदेश छोड़कर विदेश में स्थायी रूप से बसने का संकेत"
            }
    if "settle_abroad" not in result:
        result["settle_abroad"] = {"present": False}

    return result


# =====================================================================
# 🔥 16. DEEP FORENSICS ENGINE (romance, career, education, mind, dhurta yoga)
# =====================================================================
def analyze_deep_forensics(astro_data, chara_karakas, planet_house_map=None):
    if "La" not in astro_data:
        return {}

    lagna_idx = astro_data["La"].get("Vargas", {}).get("D1", {}).get("Idx", 0)
    d9_lagna_idx = astro_data["La"].get("Vargas", {}).get("D9", {}).get("Idx", 0)

    def get_house(planet_code, varga="D1", asc_idx=lagna_idx):
        if planet_code not in astro_data:
            return 0
        sign = astro_data[planet_code].get("Vargas", {}).get(varga, {}).get("Idx", 0)
        return (sign - asc_idx + 12) % 12 + 1

    forensics = {
        "romance_and_marriage": {},
        "career_and_success": {},
        "danger_and_accidents": {},
        "mind_and_spirituality": {}
    }

    # ---------------------------------------------------------
    # ROMANCE, AFFAIRS & MARRIAGE
    # ---------------------------------------------------------
    if "Ma" in astro_data and "Ve" in astro_data:
        ma_sign_d9 = astro_data["Ma"].get("Vargas", {}).get("D9", {}).get("Idx")
        ve_sign_d9 = astro_data["Ve"].get("Vargas", {}).get("D9", {}).get("Idx")
        sa_sign_d9 = astro_data.get("Sa", {}).get("Vargas", {}).get("D9", {}).get("Idx")
        if ma_sign_d9 is not None and ve_sign_d9 is not None:
            if ma_sign_d9 == ve_sign_d9 or abs(ma_sign_d9 - ve_sign_d9) == 6:
                forensics["romance_and_marriage"]["intensity"] = "मंगल-शुक्र का प्रबल प्रभाव"
            elif ve_sign_d9 == sa_sign_d9:
                forensics["romance_and_marriage"]["intensity"] = "शुक्र-शनि का ठंडा/संयमित प्रभाव"

    lord_5th = SIGN_LORDS[(lagna_idx + 4) % 12]
    lord_7th = SIGN_LORDS[(lagna_idx + 6) % 12]
    l5_d1_house = get_house(lord_5th, "D1")
    l7_d1_house = get_house(lord_7th, "D1")
    l5_d9_house = get_house(lord_5th, "D9", d9_lagna_idx)
    l7_d9_house = get_house(lord_7th, "D9", d9_lagna_idx)

    if l5_d1_house == l7_d1_house or l5_d1_house == 7 or l7_d1_house == 5:
        if l5_d9_house == l7_d9_house or l5_d9_house == 7 or l7_d9_house == 5:
            forensics["romance_and_marriage"]["love_to_marriage"] = "प्रेम संबंध शादी में बदलने का संकेत (D1 और D9 दोनों में) ✅"
        else:
            forensics["romance_and_marriage"]["love_to_marriage"] = "रिश्ता शादी तक पहुंचने में रुकावट हो सकती है ⚠️"

    if "DK" in chara_karakas:
        dk_planet = chara_karakas["DK"]["planet"]
        dk_d9_sign = astro_data.get(dk_planet, {}).get("Vargas", {}).get("D9", {}).get("Idx")
        ra_d9_sign = astro_data.get("Ra", {}).get("Vargas", {}).get("D9", {}).get("Idx")
        sa_d9_sign = astro_data.get("Sa", {}).get("Vargas", {}).get("D9", {}).get("Idx")
        if dk_d9_sign is not None and ra_d9_sign is not None:
            if dk_d9_sign == ra_d9_sign or dk_d9_sign == (ra_d9_sign + 6) % 12:
                forensics["romance_and_marriage"]["spouse_background"] = "अलग पृष्ठभूमि/विदेशी संबंध की संभावना 🌍"
            elif dk_d9_sign == sa_d9_sign:
                forensics["romance_and_marriage"]["spouse_background"] = "उम्र/बैकग्राउंड में बड़ा अंतर हो सकता है ⚠️"

    # ---------------------------------------------------------
    # CAREER, WEALTH & SUCCESS
    # ---------------------------------------------------------
    if "AK" in chara_karakas and "AmK" in chara_karakas:
        ak_p = chara_karakas["AK"]["planet"]
        amk_p = chara_karakas["AmK"]["planet"]
        ak_sign = astro_data.get(ak_p, {}).get("Vargas", {}).get("D1", {}).get("Idx")
        amk_sign = astro_data.get(amk_p, {}).get("Vargas", {}).get("D1", {}).get("Idx")
        if ak_sign is not None and amk_sign is not None:
            distance = (amk_sign - ak_sign + 12) % 12 + 1
            if distance in [1, 4, 7, 10, 5, 9, 11]:
                forensics["career_and_success"]["effort_level"] = "अपेक्षाकृत आसान सफलता (राजयोग जैसा संकेत) 👑"
            elif distance in [6, 8, 12]:
                forensics["career_and_success"]["effort_level"] = "संघर्ष के बाद सफलता का संकेत 🧗‍♂️"

    if planet_house_map:
        viparita = calculate_viparita_argala(astro_data, planet_house_map)
        if viparita["viparita_argala_present"]:
            forensics["career_and_success"]["viparita_argala"] = viparita["verdict"]

    # करियर हैक (V.P. Goel): D-1 का दशमेश D-10 में कहाँ बैठा है?
    d10_lagna_idx = astro_data.get("La", {}).get("Vargas", {}).get("D10", {}).get("Idx")
    dashamesh_planet = SIGN_LORDS[(lagna_idx + 9) % 12]
    if d10_lagna_idx is not None and dashamesh_planet in astro_data:
        dashamesh_house_d10 = get_house(dashamesh_planet, "D10", d10_lagna_idx)
        if dashamesh_house_d10 in [6, 8, 12]:
            forensics["career_and_success"]["dashamesh_in_d10"] = (
                f"दशमेश ({dashamesh_planet}) D-10 के {dashamesh_house_d10} भाव में — करियर में संघर्ष का संकेत 🧗"
            )
        elif dashamesh_house_d10 in [1, 4, 7, 10]:
            forensics["career_and_success"]["dashamesh_in_d10"] = (
                f"दशमेश ({dashamesh_planet}) D-10 के {dashamesh_house_d10} भाव (केंद्र) में — करियर में मजबूती का संकेत 👑"
            )

    # D-10 दृश्य/अदृश्य भाग (Job बनाम Business): D-10 के 10वें भाव को लग्न मानकर
    # बाकी ग्रह 7-12वें (दृश्य/स्वतंत्र) में हैं या 1-6वें (अदृश्य/सेवा) में
    if d10_lagna_idx is not None:
        d10_10th_sign = (d10_lagna_idx + 9) % 12
        visible_count, invisible_count = 0, 0
        for p in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
            p_d10_sign = astro_data.get(p, {}).get("Vargas", {}).get("D10", {}).get("Idx")
            if p_d10_sign is None:
                continue
            distance_from_10th = (p_d10_sign - d10_10th_sign) % 12 + 1
            if 7 <= distance_from_10th <= 12:
                visible_count += 1
            else:
                invisible_count += 1
        if visible_count or invisible_count:
            if visible_count > invisible_count:
                forensics["career_and_success"]["d10_visibility"] = (
                    "D-10 के दृश्य भाग में अधिक ग्रह — स्वतंत्र कार्य/व्यापार की ओर झुकाव 🧭"
                )
            else:
                forensics["career_and_success"]["d10_visibility"] = (
                    "D-10 के अदृश्य भाग में अधिक ग्रह — नौकरी/सेवा में अधिक स्थिरता और सफलता 🧭"
                )

    # D-24 ↔ D-10 तत्व मिलान (Element clash) — शिक्षा और करियर की दिशा अलग तो नहीं
    d24_lagna_idx = astro_data.get("La", {}).get("Vargas", {}).get("D24", {}).get("Idx")
    if d24_lagna_idx is not None and d10_lagna_idx is not None:
        if (d24_lagna_idx % 4) != (d10_lagna_idx % 4):
            forensics["career_and_success"]["d24_d10_element_clash"] = (
                "D-24 और D-10 के तत्व अलग हैं — पढ़ाई का विषय और असली करियर क्षेत्र अलग हो सकता है"
            )

    # ---------------------------------------------------------
    # DANGER & RISK — अमात्यकारक D-10 में पीड़ित है क्या?
    # ---------------------------------------------------------
    if "AmK" in chara_karakas and d10_lagna_idx is not None:
        amk_planet = chara_karakas["AmK"]["planet"]
        amk_d10_sign = astro_data.get(amk_planet, {}).get("Vargas", {}).get("D10", {}).get("Idx")
        if amk_d10_sign is not None:
            amk_dignity = get_planet_dignity(amk_planet, amk_d10_sign)
            amk_conjunct_malefics = []
            for p in MALEFICS:
                if p == amk_planet or p not in astro_data:
                    continue
                p_d10_sign = astro_data[p].get("Vargas", {}).get("D10", {}).get("Idx")
                if p_d10_sign == amk_d10_sign:
                    amk_conjunct_malefics.append(p)
            if amk_dignity == "नीच का (Debilitated) ⚠️" or amk_conjunct_malefics:
                note = f"अमात्यकारक ({amk_planet}) D-10 में {amk_dignity}"
                if amk_conjunct_malefics:
                    note += f", पाप ग्रहों ({', '.join(amk_conjunct_malefics)}) के साथ"
                forensics["danger_and_accidents"]["career_risk"] = note + " — करियर में जोखिम/बाधा संभव ⚠️"

    # भौतिक/दुर्घटना जोखिम — 8वें भाव (D1) में पाप ग्रहों की भीड़
    malefics_in_8th = [p for p in MALEFICS if planet_house_map and planet_house_map.get(p) == 8]
    if len(malefics_in_8th) >= 2:
        forensics["danger_and_accidents"]["accident_risk"] = (
            f"8वें भाव में {len(malefics_in_8th)} पाप ग्रह ({', '.join(malefics_in_8th)}) — सेहत/दुर्घटना में सतर्कता ज़रूरी ⚠️"
        )

    # ---------------------------------------------------------
    # EDUCATION & PEACE OF MIND
    # ---------------------------------------------------------
    if l5_d1_house == 6:
        lord_12th = SIGN_LORDS[(lagna_idx + 11) % 12]
        if get_house(lord_12th, "D1") == 6:
            forensics["mind_and_spirituality"]["education_break"] = "शिक्षा में रुकावट का संकेत 🛑"

    lagna_planets = sum(1 for p in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"] if get_house(p, "D1") == 1)
    fourth_planets = sum(1 for p in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"] if get_house(p, "D1") == 4)
    if lagna_planets > 0 and lagna_planets == fourth_planets:
        forensics["mind_and_spirituality"]["mental_peace"] = "मानसिक संतुलन और शांति का अच्छा संकेत 🧘‍♂️"

    # ---------------------------------------------------------
    # धूर्त योग (Dhurta Yoga) — लग्नेश केवल पाप ग्रहों से घिरा, कोई शुभ प्रभाव नहीं
    # ---------------------------------------------------------
    lagna_lord = _sign_lord(lagna_idx)
    if lagna_lord in astro_data:
        ll_sign = astro_data[lagna_lord].get("Vargas", {}).get("D1", {}).get("Idx")
        conjunct = []
        for p in ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]:
            if p == lagna_lord or p not in astro_data:
                continue
            p_sign = astro_data[p].get("Vargas", {}).get("D1", {}).get("Idx")
            if p_sign == ll_sign:
                conjunct.append(p)
        malefic_only = conjunct and all(p in MALEFICS for p in conjunct)
        if malefic_only:
            forensics["mind_and_spirituality"]["dhurta_yoga"] = (
                f"लग्नेश ({lagna_lord}) केवल पाप ग्रहों ({', '.join(conjunct)}) के साथ है, "
                "कोई शुभ प्रभाव नहीं — निर्णयों में कठोरता/धूर्तता की प्रवृत्ति संभव ⚠️"
            )

    # ---------------------------------------------------------
    # INNER NATURE (देव/नर/राक्षस अंश)
    # ---------------------------------------------------------
    d9_lagna_type = d9_lagna_idx % 3
    if d9_lagna_type == 0:
        forensics["mind_and_spirituality"]["inner_nature"] = "शांत, सहयोगी स्वभाव की प्रधानता 😇"
    elif d9_lagna_type == 1:
        forensics["mind_and_spirituality"]["inner_nature"] = "व्यावहारिक और जमीनी सोच की प्रधानता 🚶‍♂️"
    else:
        forensics["mind_and_spirituality"]["inner_nature"] = "महत्वाकांक्षी और तीव्र स्वभाव की प्रधानता 👿"

    return forensics


# =====================================================================
# MASTER EXPORT FUNCTION — api.py में इसे एक बार कॉल करो
# =====================================================================
def run_advanced_predictions(
    astro_data, lagna_degree, planet_house_map, birth_time_dt, sunrise_time_str, age=0,
    current_yogini_md=None
):
    """
    सारे modules (dono documents + latest fixes) एक साथ, एक ही कॉल में।

    current_yogini_md:
      calculate_yogini_dasha() के return dict का "current" key — यानी चल
      रही योगिनी महादशा का पूरा dict (nakshatra, nakshatra_idx, star_lord,
      table_position, start, end, duration_years सहित)। यही अब एकमात्र
      Progressed Lagna प्रणाली (VP Goel Yogini) का single source of truth है।
      None आने पर "progressed_lagna" भी None रहेगा।
    """
    moon_degree = astro_data["Mo"]["Degree"] if "Mo" in astro_data else 0
    rahu_degree = astro_data["Ra"]["Degree"] if "Ra" in astro_data else 0
    sun_degree = astro_data["Su"]["Degree"] if "Su" in astro_data else 0

    if not age:
        today = datetime.now()
        age = today.year - birth_time_dt.year - (
            (today.month, today.day) < (birth_time_dt.month, birth_time_dt.day)
        )

    chara_karakas = calculate_chara_karakas(astro_data)
    d10_deities = get_d10_career_deities(astro_data)

    # दशमेश (10th Lord from D1 Lagna) का देवता सीधे निकालकर सुविधा के लिए अलग से भी दे दो
    dashamesh_deity = None
    lagna_idx_d1 = astro_data.get("La", {}).get("Vargas", {}).get("D1", {}).get("Idx")
    if lagna_idx_d1 is not None:
        dashamesh_planet = _sign_lord((lagna_idx_d1 + 9) % 12)
        dashamesh_deity = {"planet": dashamesh_planet, "deity": d10_deities.get(dashamesh_planet)}

    return {
        "chara_karakas": chara_karakas,
        "vargottama": check_vargottama(astro_data),
        "crisis_points": calculate_crisis_points(astro_data),
        "kunda": calculate_kunda(lagna_degree),
        "bhrigu_bindu": calculate_bhrigu_bindu(moon_degree, rahu_degree),
        "argala_details": calculate_argala_and_virodh(planet_house_map, astro_data),
        "viparita_argala": calculate_viparita_argala(astro_data, planet_house_map),
        "mathematical_hora_lagna": calculate_mathematical_hora_lagna(sun_degree, birth_time_dt, sunrise_time_str),
        "kaal_hora_lord": calculate_kaal_hora(birth_time_dt, sunrise_time_str),

        # 🌟 Progressed Lagna — अब सिर्फ VP Goel Yogini विधि (गणितीय lagna+age×30 हटा दिया गया)
        "progressed_lagna": calculate_progressed_lagna(current_yogini_md) if current_yogini_md else None,
        "age_used": age,
        "d10_deities": d10_deities,
        "d10_dashamesh_deity": dashamesh_deity,
        "d10_d24_education_match": check_d10_d24_match(astro_data),
        "d9_marriage_analysis": analyze_d9_marriage_lords(astro_data),

        "arudha_lagna": calculate_arudha_lagna(astro_data),
        "karakamsha_lagna": calculate_karakamsha_lagna(astro_data, chara_karakas),
        "upapada_lagna": calculate_upapada_lagna(astro_data),
        "d10_mool_lagna": calculate_d10_mool_lagna(astro_data),
        "pushkar_navamsha_planets": get_pushkar_navamsha_planets(astro_data),
        "vish_navamsha_planets": get_vish_navamsha_planets(astro_data),
        "navamsha_deities": get_navamsha_deva_nara_rakshasa(astro_data),
        "sanyas_yoga": check_sanyas_yoga(astro_data),
        "dharma_parivartan": check_dharma_parivartan(astro_data),
        "d30_marriage_timing": check_d30_marriage_timing(astro_data),
        "d9_sexual_patterns": analyze_d9_sexual_patterns(astro_data),
        "foreign_settlement": analyze_foreign_settlement(astro_data, chara_karakas),
        "jaimini_trinity": analyze_jaimini_trinity(astro_data, chara_karakas),
        "ishta_devta": get_ishta_devta(astro_data),

        # 🔥 Deep Forensics module (includes dhurta yoga + viparita argala flag)
        "deep_forensics": analyze_deep_forensics(astro_data, chara_karakas, planet_house_map)
    }

# =====================================================================
# 17. जन्म-दशा मिलान (V.P. Goel Dasha-Lord Matching) — Guna Milan/मंगल
#     दोष का विकल्प। ⚠️ यह run_advanced_predictions() में जुड़ा नहीं है
#     क्योंकि इसे DO charts चाहिए (लड़का + लड़की) — इसे अलग से, एक नए
#     "matching" endpoint से कॉल करना होगा:
#
#         result = match_kundlis_dasha_rule(boy_astro_data, girl_astro_data)
#
#     दोनों astro_data वही format होना चाहिए जो run_advanced_predictions()
#     को मिलता है (यानी api.py के astro dict, दोनों व्यक्तियों के लिए अलग-अलग
#     चार्ट calculate करके)।
# =====================================================================
NAKSHATRA_LORDS_SEQUENCE = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"]  # विंशोत्तरी क्रम, 27/9=3 चक्र दोहराता है


def get_birth_dasha_lord(astro_data):
    """
    जन्म के समय चल रहे विंशोत्तरी महादशा का स्वामी।
    (परिभाषा से यह हमेशा जन्म-नक्षत्र के स्वामी के बराबर होता है, इसलिए
    पूरी दशा-सूची निकालने की ज़रूरत नहीं — सीधे चंद्र-नक्षत्र से मिल जाता है)
    """
    moon_degree = astro_data.get("Mo", {}).get("Degree")
    if moon_degree is None:
        return None
    nak_idx = int(moon_degree / (360 / 27))
    return NAKSHATRA_LORDS_SEQUENCE[nak_idx % 9]


def match_kundlis_dasha_rule(chart_a, chart_b):
    """
    V.P. Goel की 'जन्म दशा मिलान' पद्धति:
    लड़के के जन्म-दशा-स्वामी का लड़की के 7वें भाव/स्वामी से जुड़ाव होना चाहिए,
    और लड़की के जन्म-दशा-स्वामी का लड़के के 7वें भाव/स्वामी से जुड़ाव होना चाहिए।
    दोनों शर्तें पूरी न हों तो — गोयल जी के अनुसार — 36 गुण मिलने पर भी शादी
    संभव नहीं मानी जाती (गुण मिलान/मंगल दोष को यह गणित replace करता है)।
    """
    if "La" not in chart_a or "La" not in chart_b:
        return {"compatible": False, "reason": "अधूरा डेटा"}

    lord_a = get_birth_dasha_lord(chart_a)
    lord_b = get_birth_dasha_lord(chart_b)
    if not lord_a or not lord_b:
        return {"compatible": False, "reason": "जन्म दशा स्वामी नहीं निकल सका"}

    a_lagna_idx = chart_a["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    b_lagna_idx = chart_b["La"].get("Vargas", {}).get("D1", {}).get("Idx")
    if a_lagna_idx is None or b_lagna_idx is None:
        return {"compatible": False, "reason": "लग्न डेटा अनुपलब्ध"}

    a_7th_sign, a_7th_lord = (a_lagna_idx + 6) % 12, SIGN_LORDS[(a_lagna_idx + 6) % 12]
    b_7th_sign, b_7th_lord = (b_lagna_idx + 6) % 12, SIGN_LORDS[(b_lagna_idx + 6) % 12]

    # A का जन्म-दशा-स्वामी, B के 7वें भाव/स्वामी से जुड़ा है या नहीं
    lord_a_sign = chart_a.get(lord_a, {}).get("Vargas", {}).get("D1", {}).get("Idx")
    a_connects_to_b7 = False
    if lord_a_sign is not None:
        a_connects_to_b7 = (
            lord_a_sign == b_7th_sign or lord_a == b_7th_lord
            or b_7th_sign in _get_aspected_signs(lord_a, lord_a_sign)
        )

    # B का जन्म-दशा-स्वामी, A के 7वें भाव/स्वामी से जुड़ा है या नहीं
    lord_b_sign = chart_b.get(lord_b, {}).get("Vargas", {}).get("D1", {}).get("Idx")
    b_connects_to_a7 = False
    if lord_b_sign is not None:
        b_connects_to_a7 = (
            lord_b_sign == a_7th_sign or lord_b == a_7th_lord
            or a_7th_sign in _get_aspected_signs(lord_b, lord_b_sign)
        )

    compatible = a_connects_to_b7 and b_connects_to_a7

    return {
        "compatible": compatible,
        "person_a_birth_dasha_lord": lord_a,
        "person_b_birth_dasha_lord": lord_b,
        "person_a_dasha_connects_to_b_7th": a_connects_to_b7,
        "person_b_dasha_connects_to_a_7th": b_connects_to_a7,
        "note": "V.P. Goel के अनुसार — यह शर्त पूरी न होने पर, 36 गुण मिलने पर भी विवाह संभव नहीं माना जाता"
    }