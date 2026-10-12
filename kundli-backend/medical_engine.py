"""
medical_diagnostic.py
=====================
KundaliMaker — Pre-Score Diagnostic Layer

PURPOSE:
    This module is the FIRST layer of the medical astrology pipeline.
    It answers only three questions, in order:

        1. Which planets are afflicted? Why?
        2. Which houses are damaged? Why?
        3. What protection exists?

    No risk scores. No disease names. No conclusions. No status labels.
    Only structured raw observations — exactly like a pathology report
    gives lab values before the doctor interprets them.

PIPELINE POSITION:
    RAW DATA
      ↓
    Planet Affliction Scan      ← THIS FILE
      ↓
    House Damage Scan           ← THIS FILE
      ↓
    Protection Assessment       ← THIS FILE
      ↓
    Body Systems (next layer)
      ↓
    Disease Probability (final layer, only if gates pass)

ADVANCED RULES IMPLEMENTED:
    • Nakshatra Trap        — planet gives 100% result of its nakshatra lord
    • Postman Rule          — good planet, bad nakshatra lord = bad result
    • Self-Star Maraka      — maraka in own nakshatra = unstoppable
    • Rahu-Ketu Brake       — lagnesh in Rahu/Ketu nakshatra = 99% block
    • SAV Black Hole        — house SAV < 15 = life black hole
    • 76-Point Debt Trap    — SAV(6+8+12) > 76 = chronic financial/health drain
    • Vargottam Fallacy     — vargottam + SAV < 30 = dignity is hollow
    • Vikritansh            — exalted/own in D1, debilitated in D9 = downfall
    • Papansh               — debilitated in D1 AND D9 = deepest affliction
    • Bhav Sandhi           — planet at 0–2° or 29–30° = unstable/explosive
    • Tara Mismatch         — MD→AD nakshatra gap = 3,5,7 = disaster period
    • Chalit Shift          — planet moves to trik in Chalit = negative result
    • Deadly Conjunction    — maraka + trishadayapati in 6/8/12 + BAV 0–2
    • Paap Kartari          — house hemmed by malefics both sides
    • Teekshna/Ugra nk.    — sharp/fierce nakshatra amplifies pain
    • Retrograde Exception  — retrograde in trik = energised, not weakened
    • Planetary War         — two planets within 1° = war, winner/loser obs.
    • Dispositor Afflicted  — planet's rashi lord in trik = hidden damage
    • Double Debilitation   — lagnesh neech + rashi lord also neech = chronic
    • Badhak Relief Rule    — badhak in 3/6/8/12 from badhak sthan = weakened
    • Sweet Enemy           — maraka/badhak exalted or own sign = more dangerous
    • Unprotected Affliction— malefic on house + zero benefic drishti = flagged
    • SAV Life Stage (112)  — three life phases: bala/yuva/vriddha SAV obs.

DATA CONTRACT (injected by your existing calculators):
    d1   : dict  — D1 planet placements + house lord entries
                   NEW keys per planet: "is_retrograde_in_trik", "planet_war_opponent",
                   "dispositor_in_trik", "badhak_sthan" (int, the badhak house number)
    d9   : dict  — D9 (Navamsha) placements for each planet
    sav  : dict  — SAV bindu for each house  {"1":28, "2":31, ..., "12":22}
    bav  : dict  — BAV for each planet in each house
    kp   : dict  — KP house CSLs, SSLs, planet significators
    dasha: dict  — {"MD": "Saturn", "AD": "Rahu", "PD": "Mars"}

LEGAL DISCLAIMER:
    Educational and astrological research purposes only.
    Not medical advice. Always consult a qualified medical professional.

Author  : KundaliMaker Backend Team
Version : 3.0.0  (Observation-Only Layer — No Scores, No Labels)
"""

from __future__ import annotations
from typing import Any

# =============================================================================
# CORE REFERENCE TABLES
# =============================================================================

ALL_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus",
               "Saturn", "Rahu", "Ketu"]

MALEFIC_PLANETS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}
BENEFIC_PLANETS = {"Jupiter", "Venus", "Moon", "Mercury"}
TRIK_HOUSES     = {6, 8, 12}
NODES           = {"Rahu", "Ketu"}

# Teekshna (sharp) nakshatras — amplify physical pain and acute suffering
TEEKSHNA_NAKSHATRAS = {"Ardra", "Jyeshtha", "Moola", "Ashlesha"}

# Ugra (fierce) nakshatras — aggressive, destructive energy
UGRA_NAKSHATRAS = {"Bharani", "Magha", "Purva_Phalguni", "Purva_Ashadha",
                   "Purva_Bhadrapada"}

# Rahu/Ketu nakshatras — when lagnesh lands here it creates 99% brake
RAHU_NAKSHATRAS = {"Ardra", "Swati", "Shatabhisha"}
KETU_NAKSHATRAS = {"Ashwini", "Magha", "Moola"}

# All 27 nakshatras mapped to their lords
NAKSHATRA_LORDS: dict[str, str] = {
    "Ashwini":           "Ketu",
    "Bharani":           "Venus",
    "Krittika":          "Sun",
    "Rohini":            "Moon",
    "Mrigashira":        "Mars",
    "Ardra":             "Rahu",
    "Punarvasu":         "Jupiter",
    "Pushya":            "Saturn",
    "Ashlesha":          "Mercury",
    "Magha":             "Ketu",
    "Purva_Phalguni":    "Venus",
    "Uttara_Phalguni":   "Sun",
    "Hasta":             "Moon",
    "Chitra":            "Mars",
    "Swati":             "Rahu",
    "Vishakha":          "Jupiter",
    "Anuradha":          "Saturn",
    "Jyeshtha":          "Mercury",
    "Moola":             "Ketu",
    "Purva_Ashadha":     "Venus",
    "Uttara_Ashadha":    "Sun",
    "Shravana":          "Moon",
    "Dhanishtha":        "Mars",
    "Shatabhisha":       "Rahu",
    "Purva_Bhadrapada":  "Jupiter",
    "Uttara_Bhadrapada": "Saturn",
    "Revati":            "Mercury",
}

# भावों के मेडिकल अर्थ (हिंदी में)
HOUSE_ROLE: dict[int, str] = {
    1:  "शारीरिक संरचना / जीवन शक्ति",
    2:  "पोषण / मुख / नेत्र",
    3:  "तंत्रिका तंत्र / श्वसन",
    4:  "छाती / हृदय / फेफड़े",
    5:  "पेट / पाचन / रीढ़",
    6:  "रोग का मूल / इम्युनिटी / आंतें",
    7:  "प्रजनन / किडनी / कमर",
    8:  "दीर्घकालिक रोग / सर्जरी / गुप्त अंग",
    9:  "कूल्हे / जांघें / लिवर",
    10: "हड्डियां / जोड़ / कंकाल",
    11: "रक्त संचार / पिंडलियां",
    12: "नींद / अस्पताल / लिम्फ",
}

LEGAL_DISCLAIMER = (
    "अस्वीकरण: यह केवल शैक्षिक और ज्योतिषीय शोध के लिए है। "
    "यह चिकित्सकीय सलाह नहीं है। किसी योग्य चिकित्सक से अवश्य परामर्श लें।"
)


# =============================================================================
# HELPERS
# =============================================================================

def _nakshatra_lord(nakshatra: str) -> str:
    return NAKSHATRA_LORDS.get(nakshatra, "")


def _planet_house(planet: str, d1: dict) -> int:
    return d1.get(planet, {}).get("house", 0)


def _planet_nakshatra(planet: str, d1: dict) -> str:
    return d1.get(planet, {}).get("nakshatra", "")


def _occupants(house_num: int, d1: dict) -> list[str]:
    return [p for p in ALL_PLANETS if d1.get(p, {}).get("house", 0) == house_num]


def _tara_gap(md: str, ad: str, d1: dict) -> int:
    NK_ORDER = list(NAKSHATRA_LORDS.keys())
    md_nk = _planet_nakshatra(md, d1)
    ad_nk = _planet_nakshatra(ad, d1)
    if md_nk not in NK_ORDER or ad_nk not in NK_ORDER:
        return -1
    start = NK_ORDER.index(md_nk)
    end   = NK_ORDER.index(ad_nk)
    gap   = ((end - start) % 27) + 1
    return gap


# =============================================================================
# LAYER 1 — PLANET AFFLICTION SCANNER
# =============================================================================

def scan_planet_afflictions(
    d1:    dict[str, Any],
    d9:    dict[str, Any],
    sav:   dict[str, Any],
    kp:    dict[str, Any],
    dasha: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Scan every planet for affliction.

    Returns for each planet:
        - planet name, house, sign, nakshatra, nakshatra lord, degree
        - affliction_reasons  : list of observed afflictions (WHY)
        - protection_reasons  : list of observed protections (WHY)
        - advanced_flags      : advanced rule observations

    NO SCORES. NO STATUS LABELS. Only raw observations.
    """
    results = []
    md = dasha.get("MD", "")
    ad = dasha.get("AD", "")
    asp_data = d1.get("planet_aspects", {})

    tara = _tara_gap(md, ad, d1)
    tara_disaster = tara in {3, 5, 7}

    for planet in ALL_PLANETS:
        pd = d1.get(planet, {})
        if not pd:
            continue

        house     = pd.get("house", 0)
        nakshatra = pd.get("nakshatra", "")
        nk_lord   = _nakshatra_lord(nakshatra)
        degree    = pd.get("degree_in_sign", pd.get("degree_absolute", 0) % 30)
        sign      = pd.get("sign", "")

        afflictions : list[str] = []
        protections : list[str] = []
        adv_flags   : list[str] = []

        # ── Basic afflictions ──────────────────────────────────────────────────

        if house in TRIK_HOUSES:
            afflictions.append(
                f"त्रिक भाव {house} में स्थित — "
                f"{'रोग का मूल स्थान' if house==6 else 'दीर्घकालिक रोग/सर्जरी क्षेत्र' if house==8 else 'हानि/अस्पताल क्षेत्र'}"
            )

        if pd.get("is_debilitated", False):
            afflictions.append("नीच का ग्रह — शक्ति और प्रतिरोधक क्षमता गंभीर रूप से कम है")

        if pd.get("is_combust", False):
            dist = pd.get("distance_from_sun", 0)
            afflictions.append(
                f"अस्त (सूर्य से {dist:.1f}° दूरी पर) — "
                f"{'गहरा दहन, लगभग निष्क्रिय' if dist <= 3 else 'सूर्य की गर्मी से ग्रह की कार्यक्षमता जल गई है'}"
            )

        if pd.get("is_retrograde", False):
            if planet in MALEFIC_PLANETS or house in TRIK_HOUSES:
                afflictions.append(
                    "वक्री पापी ग्रह — कर्मिक पीड़ा; बीमारी या क्षति बार-बार लौटकर आएगी"
                )
            if planet in MALEFIC_PLANETS and house in TRIK_HOUSES:
                afflictions.append(
                    "वक्री + त्रिक भाव — रोग की चक्रीय पुनरावृत्ति का संकेत"
                )

        if pd.get("in_papakartari", False):
            afflictions.append("पाप कर्तरी योग — दोनों तरफ पापी ग्रह हैं; यह ग्रह बंधा और घुट रहा है")

        if pd.get("maraka_connection", False):
            afflictions.append("मारक संबंध — मृत्यु/कष्ट का ट्रिगर")
        if pd.get("badhaka_connection", False):
            afflictions.append("बाधक संबंध — रोग और स्वास्थ्य लाभ में बाधा डालता है")

        if pd.get("mrityu_bhaga", False):
            afflictions.append("मृत्यु भाग डिग्री पर स्थित — तीव्र संकट का बिंदु")

        if pd.get("gulika_mandi_influence", False):
            afflictions.append("गुलिक/मांदी का प्रभाव — विषैला, ज़हर जैसा दुष्प्रभाव")

        deg_abs  = pd.get("degree_absolute", -1)
        rahu_abs = d1.get("Rahu", {}).get("degree_absolute", -1)
        ketu_abs = d1.get("Ketu", {}).get("degree_absolute", -1)
        if deg_abs >= 0:
            for node, node_deg in [("Rahu", rahu_abs), ("Ketu", ketu_abs)]:
                if node_deg >= 0 and planet != node:   # skip self-check
                    diff = abs(deg_abs - node_deg) % 360
                    if diff > 180: diff = 360 - diff
                    if diff <= 5.0:
                        node_hi = "राहु" if node == "Rahu" else "केतु"
                        afflictions.append(
                            f"{node_hi} से {diff:.1f}° दूरी पर (ग्रहण क्षेत्र) — छिपा हुआ विषैला प्रभाव"
                        )

        for asp_planet, asp_list in asp_data.items():
            for a in asp_list:
                if a.get("aspected_planet") != planet:
                    continue
                orb = a.get("orb_degrees", 9.0)
                if asp_planet in MALEFIC_PLANETS:
                    weight = "सटीक" if orb <= 3 else "मध्यम" if orb <= 7 else "विस्तृत"
                    detail = {
                        "Saturn": "दीर्घकालिक/जीर्ण दबाव",
                        "Mars":   "सूजन/शल्य चिकित्सा दबाव",
                        "Rahu":   "विषैला/अप्रत्याशित प्रभाव",
                        "Ketu":   "छिपा हुआ/स्वतः-प्रतिरक्षा व्यवधान",
                        "Sun":    "अहंकार/सत्ता का दबाव",
                    }.get(asp_planet, "पापी दबाव")
                    afflictions.append(
                        f"{asp_planet} की पापी दृष्टि ({orb:.1f}°, {weight} कक्षा) — {detail}"
                    )
                elif asp_planet in BENEFIC_PLANETS:
                    weight = "सटीक" if orb <= 3 else "मध्यम" if orb <= 7 else "विस्तृत"
                    detail = {
                        "Jupiter": "उपचारक/रक्षक",
                        "Venus":   "सुख/संतुलन",
                        "Moon":    "भावनात्मक सहारा",
                        "Mercury": "तार्किक उपचार",
                    }.get(asp_planet, "शुभ सहयोग")
                    protections.append(
                        f"{asp_planet} की शुभ दृष्टि ({orb:.1f}°, {weight} कक्षा) — {detail}"
                    )

        # ── ADVANCED RULES ──────────────────────────────────────────────────────

        # ADV-1: Nakshatra Trap
        if nk_lord:
            nk_lord_house = _planet_house(nk_lord, d1)
            if nk_lord_house in TRIK_HOUSES:
                adv_flags.append(
                    f"⚠ नक्षत्र जाल: {planet} नक्षत्र '{nakshatra}' में है "
                    f"जिसका स्वामी {nk_lord} भाव {nk_lord_house} (त्रिक) में है। "
                    f"{planet} उस त्रिक भाव के फल देगा — गुप्त रोग या हानि की संभावना।"
                )

        # ADV-2: Self-Star Maraka
        if pd.get("maraka_connection", False) or pd.get("badhaka_connection", False):
            if nk_lord == planet:
                adv_flags.append(
                    f"⚠ स्व-नक्षत्र मारक: {planet} मारक/बाधक है और अपने ही नक्षत्र में बैठा है — "
                    f"यह पूरी तरह स्वतंत्र और बेलगाम है। बिना किसी बाहरी कारण के "
                    f"कष्ट देने में सक्षम।"
                )

        # ADV-3: Rahu-Ketu Brake on Lagnesh
        lagnesh = d1.get("house_1_lord", {}).get("planet", "")
        if planet == lagnesh and nakshatra in (RAHU_NAKSHATRAS | KETU_NAKSHATRAS):
            node = "राहु" if nakshatra in RAHU_NAKSHATRAS else "केतु"
            adv_flags.append(
                f"⚠ राहु-केतु ब्रेक: लग्नेश {planet} {node} के नक्षत्र '{nakshatra}' में है। "
                f"शरीर और इम्युनिटी में अचानक रुकावट, भ्रम या 99% पर काम का थम जाना।"
            )

        # ADV-4: Vikritansh
        d9_data = d9.get(planet, {})
        is_strong_d1 = pd.get("is_exalted", False) or pd.get("is_own_sign", False)
        is_deb_d9    = d9_data.get("is_debilitated", False)
        if is_strong_d1 and is_deb_d9:
            state_hi = "उच्च का" if pd.get("is_exalted") else "स्वराशि का"
            adv_flags.append(
                f"⚠ विकटांश: {planet} D1 में {state_hi} दिखता है लेकिन "
                f"नवमांश (D9) में नीच का है — बाहर से शक्तिशाली, अंदर से खोखला। "
                f"जब यह ग्रह सक्रिय हो तो भारी गिरावट और संघर्ष।"
            )

        # ADV-5: Papansh
        is_deb_d1 = pd.get("is_debilitated", False)
        if is_deb_d1 and is_deb_d9:
            adv_flags.append(
                f"⚠ पापांश: {planet} D1 और D9 दोनों में नीच का है — "
                f"सबसे गहरी पीड़ा का स्तर। कोई पलायन मार्ग नहीं।"
            )

        # ADV-6: Bhav Sandhi
        if 0 <= degree <= 2:
            adv_flags.append(
                f"⚠ भाव संधि (बाल अवस्था): {planet} {degree:.1f}° पर — "
                f"शैशव अवस्था में, पकड़ कमज़ोर, परिणाम अस्थिर। विस्फोटक/उतार-चढ़ाव वाले फल।"
            )
        elif degree >= 29:
            adv_flags.append(
                f"⚠ भाव संधि (वृद्ध अवस्था): {planet} {degree:.1f}° पर — "
                f"राशि के अंत में, शक्ति क्षीण, अंतिम समय में अनिश्चित फल।"
            )

        # ADV-7: Teekshna / Ugra nakshatra
        if nakshatra in TEEKSHNA_NAKSHATRAS:
            adv_flags.append(
                f"⚠ तीक्ष्ण नक्षत्र: {planet} '{nakshatra}' में — तीखा, छेदने वाला स्वभाव। "
                f"यदि यह ग्रह किसी अंग को पीड़ित करे तो तेज़ दर्द या संक्रमण संभव।"
            )
        elif nakshatra in UGRA_NAKSHATRAS:
            adv_flags.append(
                f"⚠ उग्र नक्षत्र: {planet} '{nakshatra}' में — उग्र, विनाशकारी स्वभाव। "
                f"पीड़ा और सूजन/शल्य-घटनाओं को बढ़ाता है।"
            )

        # ADV-8: Tara Mismatch during active dasha
        if planet in {md, ad} and tara_disaster:
            tara_label = {3: "विपत् (विपत्ति)", 5: "प्रत्यरि (शत्रुता)", 7: "वध (मृत्यु-तुल्य)"}
            adv_flags.append(
                f"⚠ तारा मिलान दोष: सक्रिय दशा MD={md}/AD={ad} का नक्षत्र अंतर = "
                f"{tara} ({tara_label.get(tara, '')}). ग्रह मित्र होते हुए भी "
                f"तारा मिलान ओवरराइड करता है — यह काल कठोर फल देगा।"
            )

        # ADV-9: Retrograde Exception in Trik
        if pd.get("is_retrograde", False) and house in TRIK_HOUSES:
            adv_flags.append(
                f"⚠ वक्री त्रिक अपवाद: {planet} भाव {house} में वक्री है। "
                f"सामान्य नियम कहता है त्रिक = कमज़ोर, पर वक्री इसे पलट देता है — "
                f"यहाँ ग्रह ऊर्जावान और लगातार सक्रिय है। क्षति छिटपुट नहीं, निरंतर होगी।"
            )

        # ADV-10: Planetary War
        war_opponent = pd.get("planet_war_opponent", "")
        war_won      = pd.get("planet_war_won", None)
        if war_opponent:
            if war_won is False:
                adv_flags.append(
                    f"⚠ ग्रह युद्ध (पराजित): {planet} का {war_opponent} से ग्रह युद्ध हुआ और "
                    f"{planet} हार गया — गंभीर रूप से कमज़ोर, अपनी कारकत्व देने में असमर्थ। "
                    f"{planet} से जुड़ा शरीर का अंग या जीवन क्षेत्र दब गया है।"
                )
            elif war_won is True:
                adv_flags.append(
                    f"⚠ ग्रह युद्ध (विजेता): {planet} ने {war_opponent} को हराया "
                    f"पर तनावग्रस्त है — आक्रामक, अतिसक्रिय, सूजन/अधिकता की प्रवृत्ति।"
                )

        # ADV-11: Dispositor Afflicted
        dispositor = pd.get("dispositor", "")
        if not dispositor:
            SIGN_LORD = {
                "Aries":"Mars","Taurus":"Venus","Gemini":"Mercury","Cancer":"Moon",
                "Leo":"Sun","Virgo":"Mercury","Libra":"Venus","Scorpio":"Mars",
                "Sagittarius":"Jupiter","Capricorn":"Saturn","Aquarius":"Saturn","Pisces":"Jupiter",
            }
            dispositor = SIGN_LORD.get(sign, "")
        if dispositor and dispositor != planet:
            disp_house = _planet_house(dispositor, d1)
            if disp_house in TRIK_HOUSES:
                adv_flags.append(
                    f"⚠ डिस्पोज़िटर पीड़ित: {planet} {sign} राशि में है जिसका स्वामी "
                    f"{dispositor} भाव {disp_house} (त्रिक) में बैठा है। "
                    f"{planet} के फल त्रिक के फ़िल्टर से गुज़रेंगे — छिपा हुआ नुकसान।"
                )

        # ADV-12: Sweet Enemy
        is_maraka_or_badhak = pd.get("maraka_connection", False) or pd.get("badhaka_connection", False)
        if is_maraka_or_badhak and (pd.get("is_exalted", False) or pd.get("is_own_sign", False)):
            state_hi = "उच्च का" if pd.get("is_exalted", False) else "स्वराशि में"
            adv_flags.append(
                f"⚠ मीठा दुश्मन: {planet} मारक/बाधक है और {state_hi} है — "
                f"यह शक्तिशाली और सहज है। अपनी हानिकारक भूमिका पूरी ताकत से निभाएगा। "
                f"ताकतवर खलनायक, कमज़ोर से ज़्यादा खतरनाक।"
            )

        # ADV-13: Badhak Relief Rule
        badhak_sthan = d1.get("badhak_sthan", 0)
        if pd.get("badhaka_connection", False) and badhak_sthan:
            relative_pos = ((house - badhak_sthan) % 12) + 1
            if relative_pos in {3, 6, 8, 12}:
                adv_flags.append(
                    f"⚠ बाधक राहत: {planet} बाधक ग्रह है पर भाव {house} में है "
                    f"जो बाधक स्थान (भाव {badhak_sthan}) से {relative_pos}वाँ है (दुःस्थान)। "
                    f"अपने स्थान से दुःस्थान में होने से बाधक शक्ति कम हुई — आंशिक राहत।"
                )

        # ADV-14: Double Debilitation Chain
        NEECH_RASHI_LORD = {
            "Sun":"Libra->Venus","Moon":"Scorpio->Mars","Mars":"Cancer->Moon",
            "Mercury":"Pisces->Jupiter","Jupiter":"Capricorn->Saturn",
            "Venus":"Virgo->Mercury","Saturn":"Aries->Mars",
        }
        if planet == lagnesh and pd.get("is_debilitated", False):
            neech_chain = NEECH_RASHI_LORD.get(planet, "")
            if neech_chain:
                neech_rashi, neech_rashi_lord = neech_chain.split("->")
                nrl_data = d1.get(neech_rashi_lord, {})
                if nrl_data.get("is_debilitated", False):
                    adv_flags.append(
                        f"⚠ द्विगुण नीच श्रृंखला: लग्नेश {planet} {neech_rashi} में नीच है "
                        f"और उस राशि का स्वामी {neech_rashi_lord} भी D1 में नीच है। "
                        f"शरीर के मुख्य शासक का कोई पलायन मार्ग नहीं — दीर्घकालिक संवैधानिक दुर्बलता।"
                    )

        # ── Protections ─────────────────────────────────────────────────────────

        if pd.get("is_exalted", False) and not is_deb_d9 and not is_maraka_or_badhak:
            protections.append("D1 में उच्च का, D9 में नीच नहीं, मारक/बाधक नहीं — वास्तविक गरिमा")
        elif pd.get("is_exalted", False) and not is_deb_d9:
            pass  # exalted maraka — Sweet Enemy में नोट है
        if pd.get("is_own_sign", False) and not is_deb_d9 and not is_maraka_or_badhak:
            protections.append("स्वराशि में (D1) और D9 में नीच नहीं — स्थिर और कार्यकारी गरिमा")

        results.append({
            "planet":         planet,
            "house":          house,
            "sign":           sign,
            "nakshatra":      nakshatra,
            "nakshatra_lord": nk_lord,
            "degree_in_sign": round(degree, 2),
            "affliction_reasons": afflictions,
            "protection_reasons": protections,
            "advanced_flags":     adv_flags,
        })

    return results


# =============================================================================
# LAYER 2 — HOUSE DAMAGE SCANNER
# =============================================================================

def scan_house_damage(
    house_num:  int,
    d1:         dict[str, Any],
    d9:         dict[str, Any],
    sav:        dict[str, Any],
    bav:        dict[str, Any],
    kp:         dict[str, Any],
    chalit:     dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Scan a single house for structural damage observations.

    Returns:
        - house number + role
        - lord name + lord observations
        - occupants
        - damage_reasons  : list of observed damage factors (WHY)
        - protection_reasons : list of observed protections
        - advanced_flags  : advanced rule observations

    NO SCORES. NO STATUS LABELS. Only raw observations.
    """
    h_str    = str(house_num)
    asp_data = d1.get("planet_aspects", {})

    damage_reasons  : list[str] = []
    protect_reasons : list[str] = []
    adv_flags       : list[str] = []

    # ── House lord ─────────────────────────────────────────────────────────────
    lord_entry = d1.get(f"house_{house_num}_lord", {})
    lord_name  = lord_entry.get("planet", "")
    lord_house = lord_entry.get("house", 0)
    lord_deb   = lord_entry.get("is_debilitated", False)
    lord_comb  = lord_entry.get("is_combust", False)
    lord_retro = lord_entry.get("is_retrograde", False)
    lord_aff   = lord_entry.get("is_afflicted", False)
    lord_exalt = lord_entry.get("is_exalted", False)
    lord_own   = lord_entry.get("is_own_sign", False)

    if lord_house in TRIK_HOUSES:
        damage_reasons.append(
            f"Lord {lord_name} placed in House {lord_house} "
            f"({'disease root' if lord_house==6 else 'chronic/surgery' if lord_house==8 else 'loss/hospital'}) "
            f"— lord abandoned its own house"
        )

    if lord_deb:
        damage_reasons.append(f"Lord {lord_name} is debilitated — house has no capable ruler")

    if lord_comb:
        dist = lord_entry.get("distance_from_sun", 5.0)
        damage_reasons.append(
            f"Lord {lord_name} is combust ({dist:.1f}° from Sun) — lord paralyzed by Sun's heat"
        )

    if lord_retro and lord_aff:
        damage_reasons.append(
            f"Lord {lord_name} retrograde + afflicted — cyclic, recurring damage to this house"
        )

    if lord_exalt and not d9.get(lord_name, {}).get("is_debilitated", False):
        protect_reasons.append(
            f"Lord {lord_name} exalted in D1 (and intact in D9) — strong dignified ruler"
        )
    elif lord_own:
        protect_reasons.append(f"Lord {lord_name} in own sign — comfortable, functional ruler")

    # ── Occupants ──────────────────────────────────────────────────────────────
    occ = _occupants(house_num, d1)
    for planet in occ:
        if planet in MALEFIC_PLANETS:
            detail = {
                "Saturn": "chronic/degenerative pressure",
                "Mars":   "inflammatory/surgical pressure",
                "Rahu":   "toxic/unpredictable shadow-node",
                "Ketu":   "hidden/disconnecting shadow-node",
                "Sun":    "ego/authority pressure",
            }.get(planet, "malefic pressure")
            damage_reasons.append(f"{planet} occupies House {house_num} — {detail}")
        elif planet in BENEFIC_PLANETS:
            detail = {
                "Jupiter": "primary healer and protector",
                "Venus":   "comfort and hormonal balance",
                "Moon":    "emotional and fluid support",
                "Mercury": "signalling and nervous system support",
            }.get(planet, "benefic support")
            protect_reasons.append(f"{planet} occupies House {house_num} — {detail}")

    # ── Paap Kartari ───────────────────────────────────────────────────────────
    prev_h = 12 if house_num == 1 else house_num - 1
    next_h = 1  if house_num == 12 else house_num + 1
    prev_mal = any(d1.get(p, {}).get("house", 0) == prev_h for p in MALEFIC_PLANETS)
    next_mal = any(d1.get(p, {}).get("house", 0) == next_h for p in MALEFIC_PLANETS)
    if prev_mal and next_mal:
        damage_reasons.append(
            f"Paap Kartari Yoga — malefics in H{prev_h} & H{next_h} "
            f"hem this house like scissors. Cannot express its quality fully."
        )

    # ── Aspects on this house ───────────────────────────────────────────────────
    has_jupiter_aspect  = False
    has_benefic_aspect  = False
    has_malefic_aspect  = False
    for asp_planet, asp_list in asp_data.items():
        for a in asp_list:
            if a.get("aspected_house") != house_num:
                continue
            orb    = a.get("orb_degrees", 9.0)
            weight = "tight" if orb <= 3 else "medium" if orb <= 7 else "wide"
            if asp_planet in MALEFIC_PLANETS:
                has_malefic_aspect = True
                detail = {
                    "Saturn": "chronic/long-term pressure",
                    "Mars":   "inflammatory/acute pressure",
                    "Rahu":   "toxic/strange disease influence",
                    "Ketu":   "hidden/autoimmune influence",
                    "Sun":    "authority/drying influence",
                }.get(asp_planet, "malefic influence")
                damage_reasons.append(
                    f"{asp_planet} malefic aspect on House {house_num} "
                    f"({orb:.1f}°, {weight} orb) — {detail}"
                )
            elif asp_planet in BENEFIC_PLANETS:
                has_benefic_aspect = True
                if asp_planet == "Jupiter":
                    has_jupiter_aspect = True
                protect_reasons.append(
                    f"{asp_planet} benefic aspect on House {house_num} "
                    f"({orb:.1f}°, {weight} orb)"
                )

    if not has_benefic_aspect and has_malefic_aspect:
        damage_reasons.append(
            "No benefic shield — malefic pressure on this house is completely unprotected"
        )
    if has_jupiter_aspect:
        protect_reasons.append("Jupiter aspect — primary healer watches over this house")

    # ── SAV value ──────────────────────────────────────────────────────────────
    sav_val = sav.get(h_str, 28)

    # ── KP CSL/SSL ──────────────────────────────────────────────────────────────
    csl_lord = kp.get("house_csls", {}).get(h_str, {}).get("sub_lord", "")
    ssl_lord = kp.get("house_ssls", {}).get(h_str, {}).get("sub_sub_lord", "")
    kp_sigs  = kp.get("planet_significators", {})

    if csl_lord:
        csl_houses = set(kp_sigs.get(csl_lord, {}).get("signified_houses", []))
        if csl_houses & TRIK_HOUSES:
            damage_reasons.append(
                f"KP CSL of House {house_num} = {csl_lord}, "
                f"signifying trik houses {sorted(csl_houses & TRIK_HOUSES)} — disease activation link"
            )
    if ssl_lord:
        ssl_houses = set(kp_sigs.get(ssl_lord, {}).get("signified_houses", []))
        if ssl_houses & TRIK_HOUSES:
            damage_reasons.append(
                f"KP SSL of House {house_num} = {ssl_lord}, "
                f"signifying trik houses {sorted(ssl_houses & TRIK_HOUSES)} — sub-level activation"
            )

    # ── D6/D30 lord repeat ──────────────────────────────────────────────────────
    if d1.get(f"house_{house_num}_lord_d30_in_trik", False):
        damage_reasons.append(
            f"Lord {lord_name} also afflicted in D30 — suffering & chronicity layer confirmed"
        )
    if d1.get(f"house_{house_num}_lord_d6_in_trik", False):
        damage_reasons.append(
            f"Lord {lord_name} also afflicted in D6 — disease mechanics confirmed"
        )

    # ── ADVANCED RULES ──────────────────────────────────────────────────────────

    # ADV-1: SAV Black Hole
    if sav_val < 15:
        adv_flags.append(
            f"⚠ SAV BLACK HOLE: House {house_num} has only {sav_val} SAV points (< 15). "
            f"This house is a life black hole — when transit Saturn/Mars/Rahu pass through, "
            f"expect severe accidents, disgrace, or destruction related to this house."
        )
    elif sav_val < 25:
        adv_flags.append(
            f"⚠ WEAK SAV FOUNDATION: House {house_num} has {sav_val} SAV points (< 25). "
            f"Even a strong planet placed here cannot deliver — foundation too weak."
        )
    elif sav_val >= 33:
        protect_reasons.append(
            f"Strong SAV support: {sav_val} points in House {house_num} "
            f"(≥ 33) — solid foundation, resilient"
        )

    # ADV-2: 76-Point Debt Trap
    if house_num == 6:
        sav_6  = sav.get("6",  0)
        sav_8  = sav.get("8",  0)
        sav_12 = sav.get("12", 0)
        total_trik_sav = sav_6 + sav_8 + sav_12
        if total_trik_sav > 76:
            adv_flags.append(
                f"⚠ 76-POINT DEBT TRAP: SAV(6+8+12) = {sav_6}+{sav_8}+{sav_12} = "
                f"{total_trik_sav} > 76. Chronic resource drain — health expenditure, "
                f"debts, and losses will be a recurring theme."
            )

    # ADV-3: Chalit Shift
    if chalit:
        for planet in occ:
            chalit_house = chalit.get(planet, {}).get("house", 0)
            d1_house     = _planet_house(planet, d1)
            if d1_house not in TRIK_HOUSES and chalit_house in TRIK_HOUSES:
                adv_flags.append(
                    f"⚠ CHALIT SHIFT: {planet} appears in House {d1_house} in D1 "
                    f"but shifts to House {chalit_house} (trik) in Bhav Chalit. "
                    f"Result for this planet will be NEGATIVE despite good D1 position."
                )

    # ADV-4: Deadly Conjunction
    maraka_here    = [p for p in occ if d1.get(p, {}).get("maraka_connection", False)]
    trishad_here   = [p for p in occ if d1.get(p, {}).get("trishadaya_connection", False)]
    if maraka_here and trishad_here and house_num in TRIK_HOUSES:
        for mk in maraka_here:
            bav_val = bav.get(mk, {}).get(h_str, 99)
            if bav_val <= 2:
                adv_flags.append(
                    f"⚠ DEADLY CONJUNCTION: Maraka {mk} + Trishadayapati "
                    f"{trishad_here} in House {house_num} with BAV = {bav_val} (0–2). "
                    f"When transit Rahu/Ketu pass here — surgery/extreme suffering/death-like event."
                )

    # ADV-5: Vargottam Fallacy
    for planet in occ:
        if d1.get(planet, {}).get("is_vargottam", False):
            bav_sign = bav.get(planet, {}).get("sign_sav", 99)
            if bav_sign < 30:
                adv_flags.append(
                    f"⚠ VARGOTTAM FALLACY: {planet} is Vargottam (same sign D1+D9) "
                    f"which looks powerful, but sign SAV = {bav_sign} < 30 — "
                    f"the dignity is hollow. Will not deliver promised good results."
                )

    # ADV-6: Unprotected Affliction — explicit flag when malefic present, zero benefic drishti
    if has_malefic_aspect and not has_benefic_aspect and not any(p in BENEFIC_PLANETS for p in occ):
        adv_flags.append(
            f"⚠ UNPROTECTED AFFLICTION: House {house_num} has malefic pressure "
            f"(aspect or occupation) with absolutely no benefic planet present or aspecting. "
            f"No healer, no shield — affliction operates without resistance."
        )

    # ADV-7: Retrograde Exception for occupants in trik
    for planet in occ:
        pd_occ = d1.get(planet, {})
        if pd_occ.get("is_retrograde", False) and house_num in TRIK_HOUSES and planet in MALEFIC_PLANETS:
            adv_flags.append(
                f"⚠ RETROGRADE MALEFIC IN TRIK: {planet} (retrograde) in House {house_num} — "
                f"retrograde reversal means this planet's trik damage is persistent and "
                f"cyclic, not intermittent. It keeps coming back."
            )

    # ADV-8: Planetary War inside this house
    for planet in occ:
        war_opp = d1.get(planet, {}).get("planet_war_opponent", "")
        war_won  = d1.get(planet, {}).get("planet_war_won", None)
        if war_opp and war_opp in occ and war_won is False:
            adv_flags.append(
                f"⚠ PLANETARY WAR IN HOUSE {house_num}: {planet} lost the war against "
                f"{war_opp}. The losing planet's karakatva (body part / life area) is "
                f"suppressed — its contribution to this house is nullified."
            )

    # ADV-9: SAV Life Stage (112 Rule) — computed once for all 3 stages
    # Each stage covers 4 houses; observation shown on house 4, 8, 12 boundary
    if house_num == 4:
        bala_sav  = sum(int(sav.get(str(h), 0)) for h in range(1, 5))
        yuva_sav  = sum(int(sav.get(str(h), 0)) for h in range(5, 9))
        vridh_sav = sum(int(sav.get(str(h), 0)) for h in range(9, 13))
        for stage, total in [("Balavastha (H1-H4, childhood)", bala_sav),
                              ("Yuvavastha (H5-H8, youth/mid-life)", yuva_sav),
                              ("Vriddhavastha (H9-H12, old age)", vridh_sav)]:
            if total > 112:
                protect_reasons.append(
                    f"SAV LIFE STAGE — {stage}: total SAV = {total} (> 112). "
                    f"This life phase carries above-average fortune and resilience."
                )
            else:
                adv_flags.append(
                    f"⚠ SAV LIFE STAGE — {stage}: total SAV = {total} (≤ 112). "
                    f"This life phase shows below-average resource — struggle and "
                    f"reduced vitality observed in corresponding years."
                )

    return {
        "house":              house_num,
        "house_role":         HOUSE_ROLE.get(house_num, ""),
        "lord":               lord_name,
        "occupants":          occ,
        "sav_value":          sav_val,
        "kp_csl":             csl_lord,
        "kp_ssl":             ssl_lord,
        "damage_reasons":     damage_reasons,
        "protection_reasons": protect_reasons,
        "advanced_flags":     adv_flags,
    }


# =============================================================================
# LAYER 3 — FULL DIAGNOSTIC REPORT (Observation Only)
# =============================================================================

def generate_diagnostic_report(
    d1:     dict[str, Any],
    d9:     dict[str, Any],
    sav:    dict[str, Any],
    bav:    dict[str, Any],
    kp:     dict[str, Any],
    dasha:  dict[str, Any],
    chalit: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Generate the complete pre-score diagnostic report.

    Returns structured JSON with:
        - planet_scan   : list of planet observation dicts
        - house_scan    : list of house observation dicts
        - plain_text    : human-readable formatted report

    NO scores. NO status labels. NO disease names. Only structured observations.
    """

    # ── Layer 1: Planet scan ───────────────────────────────────────────────────
    planet_scan = scan_planet_afflictions(d1, d9, sav, kp, dasha)

    # ── Layer 2: House scan ────────────────────────────────────────────────────
    house_scan = []
    for h in range(1, 13):
        h_report = scan_house_damage(h, d1, d9, sav, bav, kp, chalit)
        house_scan.append(h_report)

    # ── Plain-text report ──────────────────────────────────────────────────────
    lines = [
        "=" * 60,
        "  KUNDALI DIAGNOSTIC REPORT — Raw Observation Layer",
        "=" * 60,
        "",
        "ACTIVE DASHA",
        f"  MD: {dasha.get('MD','?')}  |  AD: {dasha.get('AD','?')}  |  PD: {dasha.get('PD','?')}",
        "",
    ]

    # ── Planet section ─────────────────────────────────────────────────────────
    lines.append("─" * 60)
    lines.append("  PLANET AFFLICTION OBSERVATIONS")
    lines.append("─" * 60)

    for p in planet_scan:
        has_any = p["affliction_reasons"] or p["advanced_flags"] or p["protection_reasons"]
        if not has_any:
            lines.append(f"\n{p['planet']}  [House {p['house']}]  — No observations")
            continue

        lines.append(f"\n{p['planet']}  [House {p['house']}]  [{p['sign']}]")
        lines.append(f"  Nakshatra: {p['nakshatra']} (lord: {p['nakshatra_lord']})  |  Degree: {p['degree_in_sign']}°")

        if p["affliction_reasons"]:
            lines.append("  Affliction factors:")
            for r in p["affliction_reasons"]:
                lines.append(f"    - {r}")

        if p["advanced_flags"]:
            lines.append("  Advanced observations:")
            for f in p["advanced_flags"]:
                lines.append(f"    {f}")

        if p["protection_reasons"]:
            lines.append("  Protection factors:")
            for pr in p["protection_reasons"]:
                lines.append(f"    + {pr}")

    # ── House section ──────────────────────────────────────────────────────────
    lines.append("")
    lines.append("─" * 60)
    lines.append("  HOUSE DAMAGE OBSERVATIONS")
    lines.append("─" * 60)

    for h in house_scan:
        lines.append(f"\nHouse {h['house']}  —  {h['house_role']}")
        lines.append(f"  Lord: {h['lord']}  |  SAV: {h['sav_value']}  |  KP CSL: {h['kp_csl'] or '—'}  |  SSL: {h['kp_ssl'] or '—'}")
        if h["occupants"]:
            lines.append(f"  Occupants: {', '.join(h['occupants'])}")

        if h["damage_reasons"]:
            lines.append("  Damage observations:")
            for r in h["damage_reasons"]:
                lines.append(f"    - {r}")

        if h["advanced_flags"]:
            lines.append("  Advanced observations:")
            for f in h["advanced_flags"]:
                lines.append(f"    {f}")

        if h["protection_reasons"]:
            lines.append("  Protection factors:")
            for pr in h["protection_reasons"]:
                lines.append(f"    + {pr}")

        if not h["damage_reasons"] and not h["advanced_flags"]:
            lines.append("  — No damage observations for this house")

    lines += ["", LEGAL_DISCLAIMER, ""]

    return {
        "report_metadata": {
            "engine":   "KundaliMaker Diagnostic Layer v3.0.0",
            "pipeline": "RAW DATA → PLANET AFFLICTION → HOUSE DAMAGE → BODY DOMAINS",
            "note":     "No scores, no status labels, no disease names. Pure observations only.",
        },
        "dasha_context": {
            "MD": dasha.get("MD", ""),
            "AD": dasha.get("AD", ""),
            "PD": dasha.get("PD", ""),
        },
        "planet_scan": planet_scan,
        "house_scan":  house_scan,
        "plain_text":  "\n".join(lines),
        "legal_disclaimer": LEGAL_DISCLAIMER,
    }


# =============================================================================
# MOCK TEST
# =============================================================================

if __name__ == "__main__":

    mock_d1 = {
        "Saturn": {"house":6, "sign":"Scorpio", "nakshatra":"Jyeshtha",
                   "is_debilitated":False, "is_retrograde":True, "is_combust":False,
                   "in_papakartari":True, "maraka_connection":False,
                   "badhaka_connection":True, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":45.0,
                   "degree_in_sign":18.3, "is_afflicted":True,
                   "degree_absolute":245.0, "is_exalted":False, "is_own_sign":False},
        "Mars":   {"house":8, "sign":"Cancer", "nakshatra":"Ardra",
                   "is_debilitated":True, "is_retrograde":False, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":True,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":38.0,
                   "degree_in_sign":22.0, "is_afflicted":True,
                   "degree_absolute":112.0, "is_exalted":False, "is_own_sign":False,
                   "trishadaya_connection":True,
                   "planet_war_opponent":"Mercury", "planet_war_won":False},   # War loser
        "Moon":   {"house":12, "sign":"Gemini", "nakshatra":"Punarvasu",
                   "is_debilitated":False, "is_retrograde":False, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":42.0,
                   "degree_in_sign":5.4, "is_afflicted":True,
                   "degree_absolute":85.0, "is_exalted":False, "is_own_sign":False},
        "Jupiter":{"house":9, "sign":"Aquarius", "nakshatra":"Shatabhisha",
                   "is_debilitated":False, "is_retrograde":False, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":74.0,
                   "degree_in_sign":19.7, "is_afflicted":False,
                   "degree_absolute":310.0, "is_exalted":False, "is_own_sign":False},
        "Rahu":   {"house":6, "sign":"Scorpio", "nakshatra":"Jyeshtha",
                   "is_debilitated":False, "is_retrograde":True, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":50.0,
                   "degree_in_sign":10.0, "is_afflicted":True,
                   "degree_absolute":250.0},
        "Ketu":   {"house":12, "sign":"Taurus", "nakshatra":"Rohini",
                   "is_debilitated":False, "is_retrograde":True, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":50.0,
                   "degree_in_sign":10.0, "degree_absolute":70.0},
        "Sun":    {"house":6, "sign":"Sagittarius", "nakshatra":"Moola",
                   "is_debilitated":False, "is_retrograde":False, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":True,
                   "gulika_mandi_influence":False, "shadbala_percent":58.0,
                   "degree_in_sign":25.0, "is_afflicted":False,
                   "degree_absolute":265.0, "is_exalted":False, "is_own_sign":False},
        "Mercury":{"house":5, "sign":"Sagittarius", "nakshatra":"Moola",
                   "is_debilitated":True, "is_retrograde":False, "is_combust":True,
                   "distance_from_sun":4.5, "in_papakartari":False,
                   "maraka_connection":False, "badhaka_connection":False,
                   "mrityu_bhaga":False, "gulika_mandi_influence":True,
                   "shadbala_percent":32.0, "degree_in_sign":15.0,
                   "is_afflicted":True, "degree_absolute":275.0,
                   "is_exalted":False, "is_own_sign":False},
        "Venus":  {"house":7, "sign":"Sagittarius", "nakshatra":"Uttara_Ashadha",
                   "is_debilitated":False, "is_retrograde":False, "is_combust":False,
                   "in_papakartari":False, "maraka_connection":False,
                   "badhaka_connection":False, "mrityu_bhaga":False,
                   "gulika_mandi_influence":False, "shadbala_percent":62.0,
                   "degree_in_sign":20.0, "is_afflicted":False,
                   "degree_absolute":290.0, "is_exalted":False, "is_own_sign":False},
        "Lagna":       {"is_afflicted":True, "lord_shadbala_percent":52.0},
        "sixth_lord":  {"is_afflicted":True},
        "badhak_sthan": 7,   # For Aries lagna (char), badhak = 11th; mocked as 7 for test
        "house_1_lord":  {"planet":"Mars",   "house":8,  "shadbala_percent":38.0,
                          "is_debilitated":True,  "is_combust":False,
                          "is_retrograde":False, "is_afflicted":True,
                          "is_exalted":False, "is_own_sign":False},
        "house_6_lord":  {"planet":"Mars",   "house":8,  "shadbala_percent":38.0,
                          "is_debilitated":True,  "is_combust":False,
                          "is_retrograde":False, "is_afflicted":True,
                          "is_exalted":False, "is_own_sign":False},
        "house_8_lord":  {"planet":"Jupiter","house":9,  "shadbala_percent":74.0,
                          "is_debilitated":False, "is_combust":False,
                          "is_retrograde":False, "is_afflicted":False,
                          "is_exalted":False, "is_own_sign":False},
        "house_12_lord": {"planet":"Moon",   "house":12, "shadbala_percent":42.0,
                          "is_debilitated":False, "is_combust":False,
                          "is_retrograde":False, "is_afflicted":True,
                          "is_exalted":False, "is_own_sign":False},
        "house_4_lord":  {"planet":"Venus",  "house":7,  "shadbala_percent":62.0,
                          "is_debilitated":False, "is_combust":False,
                          "is_retrograde":False, "is_afflicted":False,
                          "is_exalted":False, "is_own_sign":False},
        "house_6_lord_d30_in_trik": True,
        "house_1_lord_d30_in_trik": True,
        "house_12_lord_d30_in_trik": True,
        "planet_aspects": {
            "Saturn": [
                {"aspected_planet":"Moon",  "aspected_house":12,
                 "orb_degrees":2.1, "aspect_distance":10,
                 "aspecting_degree":245.0, "aspected_degree":85.0},
                {"aspected_planet":None,    "aspected_house":8,
                 "orb_degrees":5.5, "aspect_distance":3,
                 "aspecting_degree":245.0, "aspected_degree":90.0},
            ],
            "Jupiter": [
                {"aspected_planet":"Sun",   "aspected_house":6,
                 "orb_degrees":1.8, "aspect_distance":5,
                 "aspecting_degree":310.0, "aspected_degree":265.0},
            ],
        },
    }

    mock_d9 = {
        "Saturn":  {"is_debilitated":True,  "sign":"Aries"},
        "Mars":    {"is_debilitated":True,  "sign":"Cancer"},
        "Moon":    {"is_debilitated":False, "sign":"Taurus"},
        "Jupiter": {"is_debilitated":False, "sign":"Cancer"},
        "Mercury": {"is_debilitated":False, "sign":"Pisces"},
        "Sun":     {"is_debilitated":False, "sign":"Libra"},
        "Venus":   {"is_debilitated":False, "sign":"Pisces"},
        "Rahu":    {"is_debilitated":False},
        "Ketu":    {"is_debilitated":False},
    }

    mock_sav = {
        "1":28, "2":31, "3":26, "4":29,
        "5":27, "6":36, "7":30, "8":22,
        "9":33, "10":28, "11":24, "12":18,
    }

    mock_bav: dict[str, Any] = {}

    mock_kp = {
        "house_csls": {
            "1": {"sub_lord":"Saturn"}, "6": {"sub_lord":"Saturn"},
            "8": {"sub_lord":"Rahu"},   "12":{"sub_lord":"Saturn"},
            "4": {"sub_lord":"Jupiter"},"7": {"sub_lord":"Venus"},
        },
        "house_ssls": {
            "1": {"sub_sub_lord":"Saturn"}, "6": {"sub_sub_lord":"Rahu"},
            "8": {"sub_sub_lord":"Saturn"}, "12":{"sub_sub_lord":"Ketu"},
        },
        "planet_significators": {
            "Saturn":  {"signified_houses":[1,6,8,12,10]},
            "Rahu":    {"signified_houses":[6,8,12]},
            "Mars":    {"signified_houses":[6,8,3]},
            "Moon":    {"signified_houses":[4,12,8]},
            "Jupiter": {"signified_houses":[5,9,1]},
            "Mercury": {"signified_houses":[3,6,12]},
            "Sun":     {"signified_houses":[6,5,10]},
            "Venus":   {"signified_houses":[7,2,11]},
            "Ketu":    {"signified_houses":[6,12,8]},
        },
    }

    mock_dasha = {"MD":"Saturn", "AD":"Rahu", "PD":"Mars"}

    report = generate_diagnostic_report(
        d1=mock_d1, d9=mock_d9, sav=mock_sav,
        bav=mock_bav, kp=mock_kp, dasha=mock_dasha,
    )

    print(report["plain_text"])