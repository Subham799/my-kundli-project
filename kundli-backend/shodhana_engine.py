"""
shodhana_engine.py — Ashtakavarga Shodhana Engine (Production Ready)
═══════════════════════════════════════════════════════════════════════
Pipeline:
  1. compute_bav()               → Raw BAV (planet-wise, 12 rashis)
  2. apply_trikona_shodhana()    → Trikona reduced BAV
  3. apply_ekadhipatya_shodhana()→ Ekadhipatya reduced BAV
  4. calculate_shodhya_pinda()   → Rashi Pinda + Graha Pinda per planet
  5. get_trigger_events()        → Transit Nakshatra & Rashi (Event Timing)

Public API:
  run_shodhana(astro, av_rules)  → complete dict for api.py
═══════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations
from typing import Dict, List, Any

# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — CONSTANTS
# ═══════════════════════════════════════════════════════════════════

PLANETS_7 = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"]   # Rahu/Ketu excluded

# त्रिकोण राशियां (0-based index)
TRINES = [
    [0, 4, 8],    # अग्नि  — मेष, सिंह, धनु
    [1, 5, 9],    # पृथ्वी — वृषभ, कन्या, मकर
    [2, 6, 10],   # वायु   — मिथुन, तुला, कुंभ
    [3, 7, 11],   # जल    — कर्क, वृश्चिक, मीन
]

# 5 ग्रहों की दो राशियां (0-based index)
DUAL_LORDSHIPS = [
    (0, 7),    # मंगल  — मेष, वृश्चिक
    (1, 6),    # शुक्र — वृषभ, तुला
    (2, 5),    # बुध   — मिथुन, कन्या
    (8, 11),   # गुरु  — धनु, मीन
    (9, 10),   # शनि   — मकर, कुंभ
]

# राशि गुणांक (मेष=0 से मीन=11)
RASHI_GUNAK = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12]

# ग्रह गुणांक (राहु-केतु नहीं)
GRAHA_GUNAK = {
    "Ju": 10, "Ma": 8, "Ve": 7,
    "Su": 5,  "Mo": 5, "Me": 5, "Sa": 5,
}

NAKSHATRAS = [
    "अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा",
    "पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी",
    "हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा",
    "मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा",
    "पूर्व भाद्रपद","उत्तर भाद्रपद","रेवती",
]

RASHIS = [
    "मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
    "तुला","वृश्चिक","धनु","मकर","कुंभ","मीन",
]

# जीवन घटनाएं — karaka + bhav offset
EVENTS = [
    {"name": "पिता का सुख/कष्ट", "karaka": "Su", "offset": 9},
    {"name": "माता का सुख/कष्ट", "karaka": "Mo", "offset": 4},
    {"name": "विवाह/जीवनसाथी",   "karaka": "Ve", "offset": 7},
    {"name": "संतान प्राप्ति",    "karaka": "Ju", "offset": 5},
    {"name": "करियर/कर्म",       "karaka": "Me", "offset": 10},
    {"name": "आयु/रोग/कष्ट",     "karaka": "Sa", "offset": 8},
]


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — BAV COMPUTATION (from api.py's AV_RULES)
# ═══════════════════════════════════════════════════════════════════

def compute_bav(astro: Dict, av_rules: Dict) -> Dict[str, List[int]]:
    """
    Planet-wise BAV compute करता है api.py के AV_RULES से।
    Returns: {"Su": [0..11 bindus], "Mo": [...], ...}
    Original astro dict mutate नहीं होता।
    """
    bav: Dict[str, List[int]] = {p: [0] * 12 for p in PLANETS_7}

    for receiver in PLANETS_7:
        if receiver not in av_rules:
            continue
        for donor, benefic_houses in av_rules[receiver].items():
            if donor == "La":
                donor_idx = int(astro["La"]["Vargas"]["D1"]["Idx"])
            elif donor in astro:
                donor_idx = int(astro[donor]["Vargas"]["D1"]["Idx"])
            else:
                continue
            for h in benefic_houses:
                target_idx = (donor_idx + h - 1) % 12
                bav[receiver][target_idx] += 1

    return bav


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — STEP 1: त्रिकोण शोधन
# ═══════════════════════════════════════════════════════════════════

def apply_trikona_shodhana(bav_data: Dict[str, List[int]]) -> Dict[str, List[int]]:
    """
    हर त्रिकोण की तीनों राशियों में से minimum घटाओ।
    Original bav_data mutate नहीं होता।
    """
    shodhita_bav = {}

    for planet, points in bav_data.items():
        shodhita = list(points)   # deep copy

        for trine in TRINES:
            min_val = min(shodhita[trine[0]], shodhita[trine[1]], shodhita[trine[2]])
            shodhita[trine[0]] -= min_val
            shodhita[trine[1]] -= min_val
            shodhita[trine[2]] -= min_val

        shodhita_bav[planet] = shodhita

    return shodhita_bav


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — STEP 2: एकाधिपत्य शोधन
# ═══════════════════════════════════════════════════════════════════

def apply_ekadhipatya_shodhana(
    trikona_bav: Dict[str, List[int]],
    planet_positions: Dict[str, int],
) -> Dict[str, List[int]]:
    """
    एकाधिपत्य शोधन — तीन नियम:

    नियम 1: दोनों राशियां भरी  → कोई बदलाव नहीं
    नियम 2: दोनों राशियां खाली → बराबर हैं तो दोनों 0,
                                  अलग हैं तो बड़े को छोटे के बराबर
    नियम 3: एक भरी, एक खाली   → खाली > भरी हो तो खाली = भरी
                                  खाली <= भरी हो तो खाली = 0

    ⚠️ Loop: DUAL_LORDSHIPS पर — planet-restricted नहीं है।
    planet_positions format: {"Su": 1, "Mo": 4, ...}  (1-based rashi)
    """
    # Occupied rashis (0-indexed) — Ra/Ke excluded (not treated as planets)
    VALID_PLANETS = {"Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"}
    occupied_signs: set = set()
    for p_code, sign in planet_positions.items():
        if sign and p_code in VALID_PLANETS:
            occupied_signs.add(sign - 1)

    ekadhipatya_bav: Dict[str, List[int]] = {}

    for planet, points in trikona_bav.items():
        shodhita = list(points)   # deep copy

        for sign1, sign2 in DUAL_LORDSHIPS:
            occ1 = sign1 in occupied_signs
            occ2 = sign2 in occupied_signs

            # नियम 1: दोनों भरी → skip
            if occ1 and occ2:
                continue

            # नियम 2: दोनों खाली
            elif not occ1 and not occ2:
                p1, p2 = shodhita[sign1], shodhita[sign2]
                if p1 == p2:
                    shodhita[sign1] = 0
                    shodhita[sign2] = 0
                elif p1 > p2:
                    shodhita[sign1] = p2
                else:
                    shodhita[sign2] = p1

            # नियम 3: एक भरी, एक खाली
            else:
                occ_sign = sign1 if occ1 else sign2
                emp_sign = sign2 if occ1 else sign1
                # विशेष नियम: भरी राशि के points = 0 हों तो खाली को मत छेड़ो
                if shodhita[occ_sign] == 0:
                    continue
                elif shodhita[emp_sign] > shodhita[occ_sign]:
                    shodhita[emp_sign] = shodhita[occ_sign]
                else:
                    shodhita[emp_sign] = 0

        ekadhipatya_bav[planet] = shodhita

    return ekadhipatya_bav


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — STEP 3: शोध्य पिण्ड
# ═══════════════════════════════════════════════════════════════════

def calculate_shodhya_pinda(
    ekadhipatya_bav: Dict[str, List[int]],
    planet_positions: Dict[str, int],
) -> Dict[str, int]:
    """
    शोध्य पिण्ड = राशि पिण्ड + ग्रह पिण्ड

    राशि पिण्ड = Σ (bindu × RASHI_GUNAK[i])
    ग्रह पिण्ड = Σ (bindu × GRAHA_GUNAK[ग्रह] for each ग्रह in that rashi)

    राहु-केतु को skip करते हैं।
    """
    # किस रashi में कौन-कौन से ग्रह बैठे हैं और उनका GRAHA_GUNAK
    sign_occupants: Dict[int, List[int]] = {i: [] for i in range(12)}
    for p_code, sign in planet_positions.items():
        if p_code in GRAHA_GUNAK:
            sign_occupants[sign - 1].append(GRAHA_GUNAK[p_code])

    pinda_data: Dict[str, int] = {}

    for planet in PLANETS_7:
        if planet not in ekadhipatya_bav:
            continue

        points     = ekadhipatya_bav[planet]
        rashi_pinda = 0
        graha_pinda = 0

        for sign_idx in range(12):
            pts = points[sign_idx]
            if pts <= 0:
                continue
            rashi_pinda += pts * RASHI_GUNAK[sign_idx]
            for g_gunak in sign_occupants[sign_idx]:
                graha_pinda += pts * g_gunak

        pinda_data[planet] = rashi_pinda + graha_pinda

    return pinda_data


# ═══════════════════════════════════════════════════════════════════
# SECTION 6 — STEP 4: गोचर ट्रिगर (Event Timing)
# ═══════════════════════════════════════════════════════════════════

def get_trigger_events(
    shodhya_pindas: Dict[str, int],
    original_bav: Dict[str, List[int]],
    planet_positions: Dict[str, int],
) -> List[Dict]:
    """
    शोध्य पिण्ड × (कारक ग्रह से Nवें भाव के original bindus) = total_val
    total_val % 27 → Nakshatra
    total_val % 12 → Rashi

    ⚠️ original_bav use होता है — refined नहीं।
    """
    event_triggers: List[Dict] = []

    for evt in EVENTS:
        k = evt["karaka"]
        if k not in shodhya_pindas or k not in original_bav:
            continue
        if k not in planet_positions:
            continue

        pinda      = shodhya_pindas[k]
        k_sign_idx = planet_positions[k] - 1                         # 0-based
        target_idx = (k_sign_idx + evt["offset"] - 1) % 12          # Nth bhav
        bindus     = original_bav[k][target_idx]

        total_val = pinda * bindus
        if total_val == 0:
            continue

        nak_rem   = total_val % 27
        nak_idx   = 27 if nak_rem == 0 else nak_rem

        rashi_rem = total_val % 12
        rashi_idx = 12 if rashi_rem == 0 else rashi_rem

        trigger_nak   = NAKSHATRAS[nak_idx - 1]
        trigger_rashi = RASHIS[rashi_idx - 1]

        event_triggers.append({
            "event"             : evt["name"],
            "karaka"            : k,
            "formula"           : f"पिण्ड({pinda}) × बिंदु({bindus}) = {total_val}",
            "trigger_nakshatra" : trigger_nak,
            "trigger_rashi"     : trigger_rashi,
            "prediction"        : (
                f"जब शनि/गुरु '{trigger_rashi}' राशि या "
                f"'{trigger_nak}' नक्षत्र से गुजरेंगे, "
                f"तब यह घटना घटित होगी।"
            ),
        })

    return event_triggers


# ═══════════════════════════════════════════════════════════════════
# SECTION 7 — MAIN PUBLIC API (called from api.py)
# ═══════════════════════════════════════════════════════════════════

def run_shodhana(astro: Dict, av_rules: Dict) -> Dict[str, Any]:
    """
    Full pipeline — api.py से यही call होगा।

    Parameters
    ----------
    astro     : api.py का astro dict
    av_rules  : api.py का AV_RULES constant

    Returns
    -------
    {
        "trikona_shodhana"     : {...},
        "ekadhipatya_shodhana" : {...},
        "shodhya_pinda"        : {...},
        "event_triggers"       : [...],
    }
    """
    try:
        # planet_positions: 1-based rashi
        planet_positions: Dict[str, int] = {}
        for p in PLANETS_7 + ["Ra", "Ke"]:
            if p in astro:
                planet_positions[p] = int(astro[p]["Vargas"]["D1"]["Idx"]) + 1

        original_bav  = compute_bav(astro, av_rules)
        trikona       = apply_trikona_shodhana(original_bav)
        ekadhipatya   = apply_ekadhipatya_shodhana(trikona, planet_positions)
        shodhya_pinda = calculate_shodhya_pinda(ekadhipatya, planet_positions)
        event_triggers = get_trigger_events(shodhya_pinda, original_bav, planet_positions)

        return {
            "trikona_shodhana"     : trikona,
            "ekadhipatya_shodhana" : ekadhipatya,
            "shodhya_pinda"        : shodhya_pinda,
            "event_triggers"       : event_triggers,
        }

    except Exception as e:
        print(f"[Shodhana Engine] Error: {e}")
        return {
            "trikona_shodhana"     : {},
            "ekadhipatya_shodhana" : {},
            "shodhya_pinda"        : {},
            "event_triggers"       : [],
            "error"                : str(e),
        }


# ═══════════════════════════════════════════════════════════════════
# SECTION 8 — SELF TEST
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Mock astro dict
    mock_positions = [4, 1, 7, 2, 9, 5, 10, 0, 6]   # La, Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
    planets_list   = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]

    mock_astro = {"La": {"Vargas": {"D1": {"Idx": 4}}, "Degree": 130.0}}
    for i, p in enumerate(planets_list):
        mock_astro[p] = {"Vargas": {"D1": {"Idx": mock_positions[i % len(mock_positions)]}}}

    mock_rules = {
        "Su": {"Su":[1,2,4,7,8,9,10,11],"Mo":[3,6,10,11],"Ma":[1,2,4,7,8,9,10,11],
               "Me":[3,5,6,9,10,11,12],"Ju":[5,6,9,11],"Ve":[6,7,12],
               "Sa":[1,2,4,7,8,9,10,11],"La":[3,4,6,10,11,12]},
        "Mo": {"Su":[3,6,7,8,10,11],"Mo":[1,3,6,7,10,11],"Ma":[2,3,5,6,9,10,11],
               "Me":[1,3,4,5,7,8,10,11],"Ju":[1,4,7,8,10,11,12],"Ve":[3,4,5,7,9,10,11],
               "Sa":[3,5,6,11],"La":[3,6,10,11]},
        "Ma": {"Su":[3,5,6,10,11],"Mo":[3,6,11],"Ma":[1,2,4,7,8,10,11],
               "Me":[3,5,6,11],"Ju":[6,10,11,12],"Ve":[6,8,11,12],
               "Sa":[1,4,7,8,9,10,11],"La":[1,3,6,10,11]},
        "Me": {"Su":[5,6,9,11,12],"Mo":[2,4,6,8,10,11],"Ma":[1,2,4,7,8,9,10,11],
               "Me":[1,3,5,6,9,10,11,12],"Ju":[6,8,11,12],"Ve":[1,2,3,4,5,8,9,11],
               "Sa":[1,2,4,7,8,9,10,11],"La":[1,2,4,6,8,10,11]},
        "Ju": {"Su":[1,2,3,4,7,8,9,10,11],"Mo":[2,5,7,9,11],"Ma":[1,2,4,7,8,10,11],
               "Me":[1,2,4,5,6,9,10,11],"Ju":[1,2,3,4,7,8,10,11],"Ve":[2,5,6,9,10,11],
               "Sa":[3,5,6,12],"La":[1,2,4,5,6,9,10,11]},
        "Ve": {"Su":[8,11,12],"Mo":[1,2,3,4,5,8,9,11,12],"Ma":[3,5,6,9,11,12],
               "Me":[3,5,6,9,11],"Ju":[5,8,9,10,11],"Ve":[1,2,3,4,5,8,9,10,11],
               "Sa":[3,4,5,8,9,10,11],"La":[1,2,3,4,5,8,9,11]},
        "Sa": {"Su":[1,2,4,7,8,10,11],"Mo":[3,6,11],"Ma":[3,5,6,10,11],
               "Me":[6,8,9,10,11,12],"Ju":[5,6,11,12],"Ve":[6,11,12],
               "Sa":[3,5,6,11],"La":[1,3,4,6,10,11]},
    }

    result = run_shodhana(mock_astro, mock_rules)

    print("═" * 65)
    print("  SHODHANA ENGINE — Self Test")
    print("═" * 65)

    print("\n  ── त्रिकोण शोधन (sample: Su) ──")
    su_t = result["trikona_shodhana"].get("Su", [])
    print(f"  {su_t}")

    print("\n  ── शोध्य पिण्ड ──")
    for p, v in result["shodhya_pinda"].items():
        print(f"  {p}: {v}")

    print("\n  ── गोचर ट्रिगर ──")
    for evt in result["event_triggers"]:
        print(f"  {evt['event']}: {evt['trigger_nakshatra']} / {evt['trigger_rashi']}")
        print(f"    {evt['formula']}")

    print("\n  ✅ Engine test complete.\n")