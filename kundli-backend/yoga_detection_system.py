# -*- coding: utf-8 -*-
"""
COMPREHENSIVE YOGA DETECTION SYSTEM
सम्पूर्ण योग निर्धारण प्रणाली

Detects all major Vedic astrology yogas across multiple categories.
"""

from typing import Dict, List, Any

# Planet and Sign mappings
PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 
         'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

# Exaltation and Debilitation
EXALTATION = {
    'Sun': 0,      # Aries
    'Moon': 1,     # Taurus
    'Mars': 9,     # Capricorn
    'Mercury': 5,  # Virgo
    'Jupiter': 3,  # Cancer
    'Venus': 11,   # Pisces
    'Saturn': 6    # Libra
}

DEBILITATION = {
    'Sun': 6,      # Libra
    'Moon': 7,     # Scorpio
    'Mars': 3,     # Cancer
    'Mercury': 11, # Pisces
    'Jupiter': 9,  # Capricorn
    'Venus': 5,    # Virgo
    'Saturn': 0    # Aries
}

# Own signs
OWN_SIGNS = {
    'Sun': [4],           # Leo
    'Moon': [3],          # Cancer
    'Mars': [0, 7],       # Aries, Scorpio
    'Mercury': [2, 5],    # Gemini, Virgo
    'Jupiter': [8, 11],   # Sagittarius, Pisces
    'Venus': [1, 6],      # Taurus, Libra
    'Saturn': [9, 10]     # Capricorn, Aquarius
}

# Kendra houses (1, 4, 7, 10)
KENDRAS = [0, 3, 6, 9]

# Trikona houses (1, 5, 9)
TRIKONAS = [0, 4, 8]

# Trik houses (6, 8, 12) - dusthana
TRIK_HOUSES = [5, 7, 11]

# Upachaya houses (3, 6, 10, 11)
UPACHAYA = [2, 5, 9, 10]

def get_house_from_lagna(planet_sign: int, lagna_sign: int) -> int:
    """Calculate house number from lagna."""
    house = (planet_sign - lagna_sign) % 12
    return house

def is_planet_in_kendra(planet_sign: int, lagna_sign: int) -> bool:
    """Check if planet is in Kendra from lagna."""
    house = get_house_from_lagna(planet_sign, lagna_sign)
    return house in KENDRAS

def is_planet_in_trikona(planet_sign: int, lagna_sign: int) -> bool:
    """Check if planet is in Trikona from lagna."""
    house = get_house_from_lagna(planet_sign, lagna_sign)
    return house in TRIKONAS

def get_planet_lordship(chart_data: Dict) -> Dict[str, List[int]]:
    """Get which houses each planet rules."""
    lagna = chart_data['lagna_sign']
    lordship = {}
    
    # House rulership mapping
    HOUSE_LORDS = {
        0: ['Mars'],           # Aries
        1: ['Venus'],          # Taurus
        2: ['Mercury'],        # Gemini
        3: ['Moon'],           # Cancer
        4: ['Sun'],            # Leo
        5: ['Mercury'],        # Virgo
        6: ['Venus'],          # Libra
        7: ['Mars'],           # Scorpio
        8: ['Jupiter'],        # Sagittarius
        9: ['Saturn'],         # Capricorn
        10: ['Saturn'],        # Aquarius
        11: ['Jupiter']        # Pisces
    }
    
    for planet in PLANETS:
        if planet in ['Rahu', 'Ketu']:
            lordship[planet] = []
            continue
        
        houses_ruled = []
        for house_num in range(12):
            sign_in_house = (lagna + house_num) % 12
            lords = HOUSE_LORDS.get(sign_in_house, [])
            if planet in lords:
                houses_ruled.append(house_num)
        
        lordship[planet] = houses_ruled
    
    return lordship

def is_benefic_planet(planet: str) -> bool:
    """Check if planet is natural benefic."""
    return planet in ['Jupiter', 'Venus', 'Moon', 'Mercury']

def is_malefic_planet(planet: str) -> bool:
    """Check if planet is natural malefic."""
    return planet in ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']


# ============================================================
# CATEGORY 1: RAJA YOGAS (राज योग)
# ============================================================

def _planet_relationship(p1: str, p2: str, chart_data: Dict) -> bool:
    """Central relationship test: conjunction, Parashari aspect, or exchange."""
    positions = chart_data.get('planet_positions', {})
    s1 = positions.get(p1, {}).get('sign_index', -1)
    s2 = positions.get(p2, {}).get('sign_index', -1)
    if s1 < 0 or s2 < 0:
        return False
    if s1 == s2:
        return True
    # Exchange / Parivartana.
    if s2 in OWN_SIGNS.get(p1, []) and s1 in OWN_SIGNS.get(p2, []):
        return True
    # Standard Parashari graha drishti.
    distance = (s2 - s1) % 12
    if distance == 6:  # all planets 7th
        return True
    if p1 == 'Mars' and distance in (3, 7):
        return True
    if p1 == 'Jupiter' and distance in (4, 8):
        return True
    if p1 == 'Saturn' and distance in (2, 9):
        return True
    return False


def detect_raja_yogas(chart_data: Dict) -> List[Dict]:
    """Detect canonical Kendra-Trikona Raja Yoga without duplicate aliases."""
    yogas = []
    lordship = get_planet_lordship(chart_data)

    seen = set()
    kendra_houses = set(KENDRAS)
    trikona_houses = set(TRIKONAS)

    for p1 in PLANETS[:7]:
        for p2 in PLANETS[:7]:
            if p1 >= p2:
                continue
            h1 = set(lordship.get(p1, []))
            h2 = set(lordship.get(p2, []))
            k1 = bool(h1 & kendra_houses)
            t1 = bool(h1 & trikona_houses)
            k2 = bool(h2 & kendra_houses)
            t2 = bool(h2 & trikona_houses)
            if not ((k1 and t2) or (t1 and k2)):
                continue
            if not _planet_relationship(p1, p2, chart_data):
                continue
            key = tuple(sorted((p1, p2)))
            if key in seen:
                continue
            seen.add(key)
            houses = sorted(set(lordship.get(p1, [])) | set(lordship.get(p2, [])))
            # Canonical name is determined by 9th/10th lord relation below.
            yogas.append({
                'id': 'RAJA_KENDRA_TRIKONA_' + '_'.join(key),
                'name': 'केंद्र-त्रिकोण राज योग',
                'name_en': 'Kendra-Trikona Raja Yoga',
                'description': f'{p1} और {p2} के बीच केंद्र-त्रिकोण स्वामित्व का संबंध',
                'effect': 'शक्ति, प्रतिष्ठा, पद और सफलता',
                'strength': 'उच्च',
                'planets': list(key),
                'houses': houses,
                'is_forming': True
            })

    # 9th + 10th lord relation is one canonical Dharma-Karmadhipati Yoga.
    ninth_lord = next((p for p in PLANETS[:7] if 8 in lordship.get(p, [])), None)
    tenth_lord = next((p for p in PLANETS[:7] if 9 in lordship.get(p, [])), None)
    if ninth_lord and tenth_lord and ninth_lord != tenth_lord and _planet_relationship(ninth_lord, tenth_lord, chart_data):
        pair = set((ninth_lord, tenth_lord))
        # Remove the generic alias for exactly the same pair; retain one canonical record.
        yogas = [y for y in yogas if set(y.get('planets', [])) != pair]
        yogas.append({
            'id': 'RAJA_DHARMA_KARMA_9_10',
            'name': 'धर्म-कर्माधिपति राज योग',
            'name_en': 'Dharma-Karmadhipati Raja Yoga',
            'description': f'9वें ({ninth_lord}) और 10वें ({tenth_lord}) भावेशों का परस्पर संबंध',
            'effect': 'उच्च पद, सम्मान, अधिकार और कर्म-भाग्य में सफलता',
            'strength': 'बहुत उच्च',
            'planets': [ninth_lord, tenth_lord],
            'houses': [9, 10],
            'is_forming': True
        })

    return yogas


# ============================================================
# CATEGORY 2: DHANA YOGAS (धन योग)
# ============================================================

def detect_dhana_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Dhana Yogas - wealth combinations."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    # Wealth houses: 2, 5, 9, 11
    wealth_houses = [1, 4, 8, 10]  # 2nd, 5th, 9th, 11th from lagna
    
    # 1. Jupiter-Venus conjunction (Guru-Shukra Yoga)
    jup_sign = planet_positions.get('Jupiter', {}).get('sign_index', -1)
    ven_sign = planet_positions.get('Venus', {}).get('sign_index', -1)
    
    if jup_sign >= 0 and ven_sign >= 0 and jup_sign == ven_sign:
        yogas.append({
            'name': 'गुरु-शुक्र योग',
            'name_en': 'Guru-Shukra Dhana Yoga',
            'description': 'गुरु और शुक्र की युति',
            'effect': 'अत्यधिक धन, विलासिता, समृद्धि',
            'strength': 'उच्च',
            'planets': ['Jupiter', 'Venus'],
            'is_forming': True
        })
    
    # 2. 2nd and 11th lord exchange (Dhana Parivartan)
    second_sign = (lagna + 1) % 12
    eleventh_sign = (lagna + 10) % 12
    
    second_lord = None
    eleventh_lord = None
    
    for planet in PLANETS[:7]:
        if second_sign in OWN_SIGNS.get(planet, []):
            second_lord = planet
        if eleventh_sign in OWN_SIGNS.get(planet, []):
            eleventh_lord = planet
    
    if second_lord and eleventh_lord:
        second_pos = planet_positions.get(second_lord, {}).get('sign_index', -1)
        eleventh_pos = planet_positions.get(eleventh_lord, {}).get('sign_index', -1)
        
        # Check exchange
        if second_pos == eleventh_sign and eleventh_pos == second_sign:
            yogas.append({
                'name': 'धन परिवर्तन योग',
                'name_en': 'Dhana Parivartan Yoga',
                'description': f'2रे ({second_lord}) और 11वें ({eleventh_lord}) भाव के स्वामी परस्पर परिवर्तन',
                'effect': 'अप्रत्याशित धन लाभ, संपत्ति वृद्धि',
                'strength': 'उच्च',
                'planets': [second_lord, eleventh_lord],
                'is_forming': True
            })
    
    # 3. Jupiter in 2nd, 5th, 9th, or 11th house
    if jup_sign >= 0:
        jup_house = get_house_from_lagna(jup_sign, lagna)
        if jup_house in wealth_houses:
            house_names = {1: '2रे', 4: '5वें', 8: '9वें', 10: '11वें'}
            yogas.append({
                'name': 'गुरु धन योग',
                'name_en': 'Jupiter Dhana Yoga',
                'description': f'गुरु {house_names[jup_house]} भाव में',
                'effect': 'धन, ज्ञान, समृद्धि',
                'strength': 'मध्यम',
                'planets': ['Jupiter'],
                'is_forming': True
            })
    
    
    return yogas


# ============================================================
# CATEGORY 3: PANCHA MAHAPURUSHA YOGAS (पंच महापुरुष योग)
# ============================================================

def detect_pancha_mahapurusha_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Pancha Mahapurusha Yogas - 5 great personality yogas."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    yoga_config = {
        'Mars': {
            'name': 'रुचक योग',
            'name_en': 'Ruchaka Yoga',
            'description': 'मंगल अपनी राशि या उच्च में केंद्र से',
            'effect': 'साहस, नेतृत्व, सैन्य कुशलता, शक्तिशाली व्यक्तित्व',
            'exalt': 9,  # Capricorn
            'own': [0, 7]  # Aries, Scorpio
        },
        'Mercury': {
            'name': 'भद्र योग',
            'name_en': 'Bhadra Yoga',
            'description': 'बुध अपनी राशि या उच्च में केंद्र से',
            'effect': 'बुद्धि, वाणी, व्यापार कुशलता, विद्वता',
            'exalt': 5,  # Virgo
            'own': [2, 5]  # Gemini, Virgo
        },
        'Jupiter': {
            'name': 'हंस योग',
            'name_en': 'Hamsa Yoga',
            'description': 'गुरु अपनी राशि या उच्च में केंद्र से',
            'effect': 'धर्म, ज्ञान, आध्यात्मिकता, सम्मान, धन',
            'exalt': 3,  # Cancer
            'own': [8, 11]  # Sagittarius, Pisces
        },
        'Venus': {
            'name': 'मालव्य योग',
            'name_en': 'Malavya Yoga',
            'description': 'शुक्र अपनी राशि या उच्च में केंद्र से',
            'effect': 'सौंदर्य, विलास, कला, सुख-समृद्धि, प्रेम',
            'exalt': 11,  # Pisces
            'own': [1, 6]  # Taurus, Libra
        },
        'Saturn': {
            'name': 'शश योग',
            'name_en': 'Sasa Yoga',
            'description': 'शनि अपनी राशि या उच्च में केंद्र से',
            'effect': 'नेतृत्व, अनुशासन, दीर्घायु, सेवा भाव',
            'exalt': 6,  # Libra
            'own': [9, 10]  # Capricorn, Aquarius
        }
    }
    
    for planet, config in yoga_config.items():
        planet_sign = planet_positions.get(planet, {}).get('sign_index', -1)
        if planet_sign < 0:
            continue
        
        # Check if in own sign or exaltation
        in_own = planet_sign in config['own']
        in_exalt = planet_sign == config['exalt']
        
        if in_own or in_exalt:
            # Check if in Kendra from lagna
            planet_house = get_house_from_lagna(planet_sign, lagna)
            if planet_house in KENDRAS:
                status = 'उच्च राशि' if in_exalt else 'स्व राशि'
                yogas.append({
                    'name': config['name'],
                    'name_en': config['name_en'],
                    'description': f"{config['description']} ({status})",
                    'effect': config['effect'],
                    'strength': 'बहुत उच्च',
                    'planets': [planet],
                    'is_forming': True
                })
    
    return yogas


# ============================================================
# CATEGORY 4: CHANDRA YOGAS (चंद्र योग)
# ============================================================

def detect_chandra_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Chandra (Moon-based) Yogas."""
    yogas = []
    planet_positions = chart_data['planet_positions']
    
    moon_sign = planet_positions.get('Moon', {}).get('sign_index', -1)
    if moon_sign < 0:
        return yogas
    
    # Get planets in 2nd and 12th from Moon
    planets_in_2nd = []
    planets_in_12th = []
    
    sign_2nd = (moon_sign + 1) % 12
    sign_12th = (moon_sign - 1) % 12
    
    for planet in PLANETS[:7]:  # Exclude Rahu/Ketu
        if planet == 'Moon':
            continue
        
        planet_sign = planet_positions.get(planet, {}).get('sign_index', -1)
        if planet_sign == sign_2nd:
            planets_in_2nd.append(planet)
        elif planet_sign == sign_12th:
            planets_in_12th.append(planet)
    
    # 1. Sunafa Yoga - Planet in 2nd from Moon
    if planets_in_2nd:
        yogas.append({
            'name': 'सुनफा योग',
            'name_en': 'Sunafa Yoga',
            'description': f'चंद्रमा से 2रे भाव में ग्रह: {", ".join(planets_in_2nd)}',
            'effect': 'धन, बुद्धि, स्वावलंबन, प्रतिष्ठा',
            'strength': 'उच्च',
            'planets': planets_in_2nd + ['Moon'],
            'is_forming': True
        })
    
    # 2. Anafa Yoga - Planet in 12th from Moon
    if planets_in_12th:
        yogas.append({
            'name': 'अनफा योग',
            'name_en': 'Anafa Yoga',
            'description': f'चंद्रमा से 12वें भाव में ग्रह: {", ".join(planets_in_12th)}',
            'effect': 'सुख, स्वास्थ्य, शारीरिक सुंदरता',
            'strength': 'उच्च',
            'planets': planets_in_12th + ['Moon'],
            'is_forming': True
        })
    
    # 3. Durudhara Yoga - Planets in both 2nd and 12th from Moon
    if planets_in_2nd and planets_in_12th:
        yogas.append({
            'name': 'दुरुधरा योग',
            'name_en': 'Durudhara Yoga',
            'description': 'चंद्रमा के दोनों ओर ग्रह',
            'effect': 'धन, यश, संपत्ति, संतुलित व्यक्तित्व',
            'strength': 'बहुत उच्च',
            'planets': planets_in_2nd + planets_in_12th + ['Moon'],
            'is_forming': True
        })
    
    # 4. Kemadruma is finalized in detect_additional_chart_yogas(), where
    # cancellation is checked. Do not emit an active Kemadruma here.

    # 5. Gaja Kesari Yoga - Jupiter in Kendra from Moon
    jup_sign = planet_positions.get('Jupiter', {}).get('sign_index', -1)
    if jup_sign >= 0:
        jup_house_from_moon = get_house_from_lagna(jup_sign, moon_sign)
        if jup_house_from_moon in KENDRAS:
            yogas.append({
                'name': 'गजकेसरी योग',
                'name_en': 'Gaja Kesari Yoga',
                'description': 'गुरु चंद्रमा से केंद्र में',
                'effect': 'बुद्धि, विद्या, यश, धन, नेतृत्व',
                'strength': 'बहुत उच्च',
                'planets': ['Jupiter', 'Moon'],
                'is_forming': True
            })
    
    return yogas


# ============================================================
# CATEGORY 5: NEECHA BHANGA RAJA YOGA (नीच भंग राज योग)
# ============================================================

def detect_neecha_bhanga_raja_yoga(chart_data: Dict) -> List[Dict]:
    """Detect Neecha Bhanga Raja Yoga - debilitation cancellation."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    for planet in PLANETS[:7]:  # Exclude Rahu/Ketu
        planet_sign = planet_positions.get(planet, {}).get('sign_index', -1)
        if planet_sign < 0:
            continue
        
        # Check if planet is debilitated
        debil_sign = DEBILITATION.get(planet, -1)
        if planet_sign != debil_sign:
            continue
        
        # Cancellation conditions:
        # 1. Debilitation lord in Kendra from Lagna or Moon
        # 2. Exaltation lord in Kendra
        # 3. Planet in own sign/exaltation from Lagna/Moon
        
        cancellation_reasons = []
        
        # Find debilitation sign lord
        debil_lord = None
        for p in PLANETS[:7]:
            if debil_sign in OWN_SIGNS.get(p, []):
                debil_lord = p
                break
        
        if debil_lord:
            debil_lord_sign = planet_positions.get(debil_lord, {}).get('sign_index', -1)
            if debil_lord_sign >= 0:
                # Check from lagna
                debil_lord_house = get_house_from_lagna(debil_lord_sign, lagna)
                if debil_lord_house in KENDRAS:
                    cancellation_reasons.append(f'नीच राशि का स्वामी ({debil_lord}) लग्न से केंद्र में')
        
        # Find exaltation sign lord
        exalt_sign = EXALTATION.get(planet, -1)
        if exalt_sign >= 0:
            exalt_lord = None
            for p in PLANETS[:7]:
                if exalt_sign in OWN_SIGNS.get(p, []):
                    exalt_lord = p
                    break
            
            if exalt_lord:
                exalt_lord_sign = planet_positions.get(exalt_lord, {}).get('sign_index', -1)
                if exalt_lord_sign >= 0:
                    exalt_lord_house = get_house_from_lagna(exalt_lord_sign, lagna)
                    if exalt_lord_house in KENDRAS:
                        cancellation_reasons.append(f'उच्च राशि का स्वामी ({exalt_lord}) केंद्र में')
        
        if cancellation_reasons:
            yogas.append({
                'name': 'नीच भंग राज योग',
                'name_en': 'Neecha Bhanga Raja Yoga',
                'description': f'{planet} नीच में लेकिन भंग: {"; ".join(cancellation_reasons)}',
                'effect': 'प्रारंभिक संघर्ष के बाद महान सफलता, उन्नति',
                'strength': 'बहुत उच्च',
                'planets': [planet],
                'is_forming': True
            })
    
    return yogas


# ============================================================
# CATEGORY 6: VIPARITA RAJA YOGAS (विपरीत राज योग)
# ============================================================

def detect_viparita_raja_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Viparita Raja Yogas - lords of dusthana in dusthana."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    # Dusthana houses: 6, 8, 12
    dusthana_houses = [5, 7, 11]  # 6th, 8th, 12th from lagna
    
    # Get lords of 6th, 8th, 12th
    sixth_sign = (lagna + 5) % 12
    eighth_sign = (lagna + 7) % 12
    twelfth_sign = (lagna + 11) % 12
    
    lords = {}
    for planet in PLANETS[:7]:
        if sixth_sign in OWN_SIGNS.get(planet, []):
            lords['6th'] = planet
        if eighth_sign in OWN_SIGNS.get(planet, []):
            lords['8th'] = planet
        if twelfth_sign in OWN_SIGNS.get(planet, []):
            lords['12th'] = planet
    
    # Harsha Yoga: 6th lord in 6th, 8th, or 12th
    if '6th' in lords:
        lord_6 = lords['6th']
        lord_6_sign = planet_positions.get(lord_6, {}).get('sign_index', -1)
        if lord_6_sign >= 0:
            lord_6_house = get_house_from_lagna(lord_6_sign, lagna)
            if lord_6_house in dusthana_houses:
                yogas.append({
                    'name': 'हर्ष योग',
                    'name_en': 'Harsha Yoga',
                    'description': f'6ठे भाव का स्वामी ({lord_6}) दुस्थान में',
                    'effect': 'शत्रु पराजय, रोग नाश, साहस',
                    'strength': 'उच्च',
                    'planets': [lord_6],
                    'is_forming': True
                })
    
    # Sarala Yoga: 8th lord in 6th, 8th, or 12th
    if '8th' in lords:
        lord_8 = lords['8th']
        lord_8_sign = planet_positions.get(lord_8, {}).get('sign_index', -1)
        if lord_8_sign >= 0:
            lord_8_house = get_house_from_lagna(lord_8_sign, lagna)
            if lord_8_house in dusthana_houses:
                yogas.append({
                    'name': 'सरल योग',
                    'name_en': 'Sarala Yoga',
                    'description': f'8वें भाव का स्वामी ({lord_8}) दुस्थान में',
                    'effect': 'दीर्घायु, निर्भयता, बाधा नाश',
                    'strength': 'उच्च',
                    'planets': [lord_8],
                    'is_forming': True
                })
    
    # Vimala Yoga: 12th lord in 6th, 8th, or 12th
    if '12th' in lords:
        lord_12 = lords['12th']
        lord_12_sign = planet_positions.get(lord_12, {}).get('sign_index', -1)
        if lord_12_sign >= 0:
            lord_12_house = get_house_from_lagna(lord_12_sign, lagna)
            if lord_12_house in dusthana_houses:
                yogas.append({
                    'name': 'विमल योग',
                    'name_en': 'Vimala Yoga',
                    'description': f'12वें भाव का स्वामी ({lord_12}) दुस्थान में',
                    'effect': 'व्यय नियंत्रण, स्वतंत्रता, सुखद जीवन',
                    'strength': 'उच्च',
                    'planets': [lord_12],
                    'is_forming': True
                })
    
    return yogas


# ============================================================
# CATEGORY 7: ARISHTA YOGAS (अरिष्ट योग) - Inauspicious
# ============================================================

def detect_arishta_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Arishta (inauspicious) Yogas."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    # 1. All malefics in Kendras
    malefics_in_kendra = []
    for planet in ['Sun', 'Mars', 'Saturn']:
        planet_sign = planet_positions.get(planet, {}).get('sign_index', -1)
        if planet_sign >= 0:
            planet_house = get_house_from_lagna(planet_sign, lagna)
            if planet_house in KENDRAS:
                malefics_in_kendra.append(planet)
    
    if len(malefics_in_kendra) >= 3:
        yogas.append({
            'name': 'पाप केंद्र योग',
            'name_en': 'Malefics in Kendra',
            'description': f'पाप ग्रह केंद्र में: {", ".join(malefics_in_kendra)}',
            'effect': 'संघर्ष, बाधाएं (निवारण: शुभ ग्रहों की दृष्टि/युति से)',
            'strength': 'अशुभ',
            'planets': malefics_in_kendra,
            'is_forming': True
        })
    
    # 2. Moon with Rahu/Ketu (Grahan Yoga)
    moon_sign = planet_positions.get('Moon', {}).get('sign_index', -1)
    rahu_sign = planet_positions.get('Rahu', {}).get('sign_index', -1)
    ketu_sign = planet_positions.get('Ketu', {}).get('sign_index', -1)
    
    if moon_sign >= 0:
        if moon_sign == rahu_sign:
            yogas.append({
                'name': 'चंद्र-राहु ग्रहण योग',
                'name_en': 'Moon-Rahu Grahan Yoga',
                'description': 'चंद्रमा राहु के साथ युति',
                'effect': 'मानसिक अशांति, भ्रम (निवारण: मंत्र, ध्यान)',
                'strength': 'अशुभ',
                'planets': ['Moon', 'Rahu'],
                'is_forming': True
            })
        elif moon_sign == ketu_sign:
            yogas.append({
                'name': 'चंद्र-केतु ग्रहण योग',
                'name_en': 'Moon-Ketu Grahan Yoga',
                'description': 'चंद्रमा केतु के साथ युति',
                'effect': 'आध्यात्मिक झुकाव, वैराग्य, मानसिक विचलन',
                'strength': 'मिश्रित',
                'planets': ['Moon', 'Ketu'],
                'is_forming': True
            })
    
    return yogas


# ============================================================
# CATEGORY 8: SPECIAL YOGAS (विशेष योग)
# ============================================================

def detect_special_yogas(chart_data: Dict) -> List[Dict]:
    """Detect special yogas like Mleccha, Pravrajya, etc."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    
    # 2. Pravrajya Yoga - Renunciation
    # Moon and Saturn together, or 4 or more planets in one house
    moon_sign = planet_positions.get('Moon', {}).get('sign_index', -1)
    saturn_sign = planet_positions.get('Saturn', {}).get('sign_index', -1)
    
    if moon_sign >= 0 and saturn_sign >= 0 and moon_sign == saturn_sign:
        yogas.append({
            'name': 'प्रव्रज्या योग',
            'name_en': 'Pravrajya Yoga',
            'description': 'चंद्र-शनि युति',
            'effect': 'वैराग्य, संन्यास, आध्यात्मिकता',
            'strength': 'उच्च',
            'planets': ['Moon', 'Saturn'],
            'is_forming': True
        })
    
    # 3. Budhaditya Yoga - Sun-Mercury conjunction
    sun_sign = planet_positions.get('Sun', {}).get('sign_index', -1)
    merc_sign = planet_positions.get('Mercury', {}).get('sign_index', -1)
    
    if sun_sign >= 0 and merc_sign >= 0 and sun_sign == merc_sign:
        yogas.append({
            'name': 'बुधादित्य योग',
            'name_en': 'Budhaditya Yoga',
            'description': 'सूर्य-बुध युति',
            'effect': 'बुद्धि, विद्या, वाणी कौशल, लेखन',
            'strength': 'उच्च',
            'planets': ['Sun', 'Mercury'],
            'is_forming': True
        })
    
    # 4. Nipuna Yoga - Mercury and Venus in Kendra
    merc_house = -1
    venus_house = -1
    
    if merc_sign >= 0:
        merc_house = get_house_from_lagna(merc_sign, lagna)
    
    ven_sign = planet_positions.get('Venus', {}).get('sign_index', -1)
    if ven_sign >= 0:
        venus_house = get_house_from_lagna(ven_sign, lagna)
    
    if merc_house in KENDRAS and venus_house in KENDRAS:
        yogas.append({
            'name': 'निपुण योग',
            'name_en': 'Nipuna Yoga',
            'description': 'बुध और शुक्र केंद्र में',
            'effect': 'कला, संगीत, नृत्य में निपुणता',
            'strength': 'उच्च',
            'planets': ['Mercury', 'Venus'],
            'is_forming': True
        })
    
    # 5. Kalanidhi Yoga - Jupiter and Venus in 2nd house
    jup_sign = planet_positions.get('Jupiter', {}).get('sign_index', -1)
    
    if jup_sign >= 0 and ven_sign >= 0:
        jup_house = get_house_from_lagna(jup_sign, lagna)
        ven_house = get_house_from_lagna(ven_sign, lagna)
        
        if jup_house == 1 and ven_house == 1:  # Both in 2nd house
            yogas.append({
                'name': 'कलानिधि योग',
                'name_en': 'Kalanidhi Yoga',
                'description': 'गुरु और शुक्र 2रे भाव में',
                'effect': 'कला, संगीत में महारत, धन',
                'strength': 'उच्च',
                'planets': ['Jupiter', 'Venus'],
                'is_forming': True
            })
    
    return yogas



# ============================================================
# CATEGORY 9: SURYA YOGAS (सूर्य योग)
# ============================================================

def detect_surya_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Veshi, Voshi and Ubhayachari Yogas from Sun."""
    yogas = []
    positions = chart_data.get('planet_positions', {})
    sun_sign = positions.get('Sun', {}).get('sign_index', -1)
    if sun_sign < 0:
        return yogas

    # Classical rule: planets other than Moon, Rahu and Ketu.
    other_planets = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
    second_sign = (sun_sign + 1) % 12
    twelfth_sign = (sun_sign - 1) % 12

    in_2nd = [p for p in other_planets
              if positions.get(p, {}).get('sign_index', -1) == second_sign]
    in_12th = [p for p in other_planets
               if positions.get(p, {}).get('sign_index', -1) == twelfth_sign]

    if in_2nd:
        yogas.append({
            'name': 'वेशि योग',
            'name_en': 'Veshi Yoga',
            'description': f'सूर्य से 2रे भाव में ग्रह: {", ".join(in_2nd)}',
            'effect': 'व्यक्तित्व, आत्मविश्वास, प्रशासनिक क्षमता और प्रभाव',
            'strength': 'उच्च',
            'planets': ['Sun'] + in_2nd,
            'is_forming': True
        })

    if in_12th:
        yogas.append({
            'name': 'वोशि योग',
            'name_en': 'Voshi Yoga',
            'description': f'सूर्य से 12वें भाव में ग्रह: {", ".join(in_12th)}',
            'effect': 'व्यावहारिक बुद्धि, अनुशासन और कार्यक्षमता',
            'strength': 'उच्च',
            'planets': ['Sun'] + in_12th,
            'is_forming': True
        })

    if in_2nd and in_12th:
        yogas.append({
            'name': 'उभयचरी योग',
            'name_en': 'Ubhayachari Yoga',
            'description': 'सूर्य के दोनों ओर 2रे और 12वें स्थान पर ग्रह',
            'effect': 'संतुलित व्यक्तित्व, प्रतिष्ठा, नेतृत्व और कार्यक्षमता',
            'strength': 'बहुत उच्च',
            'planets': ['Sun'] + in_2nd + in_12th,
            'is_forming': True
        })

    return yogas


# ============================================================
# CATEGORY 10: SARASWATI / MAHA YOGA
# ============================================================

def detect_saraswati_yoga(chart_data: Dict) -> List[Dict]:
    """Detect Saraswati Yoga using Mercury, Jupiter and Venus."""
    yogas = []
    lagna = chart_data['lagna_sign']
    positions = chart_data.get('planet_positions', {})

    houses = {}
    for p in ['Mercury', 'Jupiter', 'Venus']:
        sign = positions.get(p, {}).get('sign_index', -1)
        if sign >= 0:
            houses[p] = get_house_from_lagna(sign, lagna)

    # Source rule: Mercury, Jupiter and Venus strong in Kendra/Trikona.
    favorable = KENDRAS + TRIKONAS
    if len(houses) == 3 and all(h in favorable for h in houses.values()):
        strong = []
        for p in ['Mercury', 'Jupiter', 'Venus']:
            sign = positions[p].get('sign_index', -1)
            if sign == EXALTATION.get(p) or sign in OWN_SIGNS.get(p, []):
                strong.append(p)

        yogas.append({
            'name': 'सरस्वती योग',
            'name_en': 'Saraswati Yoga',
            'description': 'बुध, गुरु और शुक्र केंद्र/त्रिकोण में स्थित',
            'effect': 'विद्या, वाणी, लेखन, कला, शोध और बौद्धिक क्षमता',
            'strength': 'बहुत उच्च' if len(strong) >= 2 else 'उच्च',
            'planets': ['Mercury', 'Jupiter', 'Venus'],
            'is_forming': True
        })
    return yogas


def detect_maha_yoga(chart_data: Dict) -> List[Dict]:
    """Detect Maha Yoga through exchanges among auspicious-house lords."""
    yogas = []
    lagna = chart_data['lagna_sign']
    positions = chart_data.get('planet_positions', {})
    lordship = get_planet_lordship(chart_data)

    # User/source rule: 1,2,4,5,7,9,10,11 are auspicious houses.
    auspicious_houses = [0, 1, 3, 4, 6, 8, 9, 10]
    lord_for_house = {}
    for h in auspicious_houses:
        sign = (lagna + h) % 12
        for p in PLANETS[:7]:
            if sign in OWN_SIGNS.get(p, []):
                lord_for_house[h] = p
                break

    seen = set()
    for h1 in auspicious_houses:
        for h2 in auspicious_houses:
            if h1 >= h2 or h1 not in lord_for_house or h2 not in lord_for_house:
                continue
            p1, p2 = lord_for_house[h1], lord_for_house[h2]
            key = tuple(sorted((p1, p2)))
            if key in seen or p1 == p2:
                continue
            s1 = positions.get(p1, {}).get('sign_index', -1)
            s2 = positions.get(p2, {}).get('sign_index', -1)
            if s1 == (lagna + h2) % 12 and s2 == (lagna + h1) % 12:
                seen.add(key)
                yogas.append({
                    'name': 'महा योग',
                    'name_en': 'Maha Yoga',
                    'description': f'{h1+1}वें और {h2+1}वें भावेशों का राशि परिवर्तन ({p1}-{p2})',
                    'effect': 'उच्च क्षमता, सफलता और महत्वपूर्ण उपलब्धियां',
                    'strength': 'बहुत उच्च',
                    'planets': [p1, p2],
                    'is_forming': True
                })
    return yogas


# ============================================================
# CATEGORY 11: DAINYA / KHALA YOGAS
# ============================================================

def detect_dainya_khala_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Dainya and Khala Parivartana patterns."""
    yogas = []
    lagna = chart_data['lagna_sign']
    positions = chart_data.get('planet_positions', {})
    lordship = get_planet_lordship(chart_data)

    def lord_of_house(h):
        for p in PLANETS[:7]:
            if h in lordship.get(p, []):
                return p
        return None

    # Dainya: 6/8/12 lord exchanges with a non-dusthana lord.
    dusthana = {5, 7, 11}
    other_houses = set(range(12)) - dusthana
    for dh in dusthana:
        dp = lord_of_house(dh)
        if not dp:
            continue
        dp_sign = positions.get(dp, {}).get('sign_index', -1)
        for oh in other_houses:
            op = lord_of_house(oh)
            if not op or op == dp:
                continue
            op_sign = positions.get(op, {}).get('sign_index', -1)
            if dp_sign == (lagna + oh) % 12 and op_sign == (lagna + dh) % 12:
                yogas.append({
                    'name': 'दैन्य योग',
                    'name_en': 'Dainya Parivartana Yoga',
                    'description': f'{dh+1}वें त्रिकेश {dp} और {oh+1}वें भावेश {op} का राशि परिवर्तन',
                    'effect': 'संघर्ष, उतार-चढ़ाव और विपरीत परिस्थितियों से सीख',
                    'strength': 'अशुभ',
                    'planets': [dp, op],
                    'is_forming': True
                })

    # Khala: 3rd lord exchanges with another non-trik/dusthana auspicious lord.
    third = lord_of_house(2)
    favorable = {0, 1, 3, 4, 6, 8, 9, 10}
    if third:
        third_sign = positions.get(third, {}).get('sign_index', -1)
        for oh in favorable:
            op = lord_of_house(oh)
            if not op or op == third:
                continue
            op_sign = positions.get(op, {}).get('sign_index', -1)
            if third_sign == (lagna + oh) % 12 and op_sign == (lagna + 2) % 12:
                yogas.append({
                    'name': 'खल योग',
                    'name_en': 'Khala Parivartana Yoga',
                    'description': f'3रे भावेश {third} और {oh+1}वें भावेश {op} का राशि परिवर्तन',
                    'effect': 'अति-उत्साह, अस्थिरता और सफलता-असफलता का चक्र',
                    'strength': 'मिश्रित',
                    'planets': [third, op],
                    'is_forming': True
                })
    return yogas


# ============================================================
# CATEGORY 12: TECHNICAL / RESEARCH + CHART-SPECIFIC YOGAS
# ============================================================


def detect_lakshmi_yoga(chart_data: Dict) -> List[Dict]:
    """
    Audited Lakshmi Yoga:
    - strong Lagna lord
    - 9th lord in Kendra/Trikona
    - 9th lord in own or exaltation sign
    Venus-Mars conjunction alone is never sufficient.
    """
    yogas = []
    try:
        lagna = chart_data['lagna_sign']
        positions = chart_data.get('planet_positions', {})
        lordship = get_planet_lordship(chart_data)

        def house_of(planet):
            s = positions.get(planet, {}).get('sign_index', -1)
            return get_house_from_lagna(s, lagna) if s >= 0 else -1

        lagna_lord = next((p for p in PLANETS[:7] if 0 in lordship.get(p, [])), None)
        ninth_lord = next((p for p in PLANETS[:7] if 8 in lordship.get(p, [])), None)

        if not lagna_lord or not ninth_lord:
            return yogas

        lagna_pos = positions.get(lagna_lord, {})
        ninth_pos = positions.get(ninth_lord, {})
        ninth_house = house_of(ninth_lord)

        own_sign = ninth_pos.get('sign_index', -1) in lordship.get(ninth_lord, [])
        exalted = bool(ninth_pos.get('is_exalted', False) or ninth_pos.get('exalted', False))

        # Prefer existing strength helper when available.
        try:
            lagna_strong = bool(is_strong_planet(lagna_lord, chart_data))
        except Exception:
            lagna_strong = bool(
                lagna_pos.get('is_exalted', False)
                or lagna_pos.get('exalted', False)
                or lagna_pos.get('is_own_sign', False)
                or lagna_pos.get('own_sign', False)
            )

        if (
            lagna_strong
            and ninth_house in (KENDRAS | TRIKONAS)
            and (own_sign or exalted)
        ):
            yogas.append({
                'name': 'लक्ष्मी योग',
                'name_en': 'Lakshmi Yoga',
                'description': 'बलवान लग्नेश तथा केंद्र/त्रिकोण में स्वराशि या उच्चस्थ नवमेश',
                'effect': 'समृद्धि, भाग्य, प्रतिष्ठा और संसाधनों की वृद्धि',
                'strength': 'उच्च',
                'planets': [lagna_lord, ninth_lord],
                'is_forming': True
            })
    except Exception:
        pass
    return yogas

def detect_additional_chart_yogas(chart_data: Dict) -> List[Dict]:
    """Detect requested additional/chart-specific yoga patterns."""
    yogas = []
    lagna = chart_data['lagna_sign']
    positions = chart_data.get('planet_positions', {})
    lordship = get_planet_lordship(chart_data)

    def house_of(planet):
        s = positions.get(planet, {}).get('sign_index', -1)
        return get_house_from_lagna(s, lagna) if s >= 0 else -1
    # Budhaditya is already emitted by detect_special_yogas().
    # Do not emit it again here.

    # Technical / Innovation pattern requested from source:
    # Rahu in 5th with Lagna lord and/or 9th lord (Bhagyesh).
    fifth_lord = next((p for p in PLANETS[:7] if 4 in lordship.get(p, [])), None)
    ninth_lord = next((p for p in PLANETS[:7] if 8 in lordship.get(p, [])), None)
    lagna_lord = next((p for p in PLANETS[:7] if 0 in lordship.get(p, [])), None)
    rahu_house = house_of('Rahu')
    rahu_sign = positions.get('Rahu', {}).get('sign_index', -1)

    if rahu_house == 4 and rahu_sign >= 0:
        associated = [p for p in [lagna_lord, ninth_lord, 'Mercury']
                      if p and house_of(p) == 4]
        if associated:
            yogas.append({
                'name': 'तकनीकी एवं शोध योग',
                'name_en': 'Technical & Innovation / Research Yoga',
                'description': f'5वें भाव में राहु के साथ: {", ".join(associated)}',
                'effect': 'IT, AI, Software, Data Analytics, आधुनिक तकनीक और शोध की ओर विशेष झुकाव',
                'strength': 'उच्च',
                'planets': ['Rahu'] + associated,
                'is_forming': True
            })

    # Kemadruma Bhanga: first verify Kemadruma-like emptiness,
    # then check common cancellation evidence from the supplied rule.
    moon_sign = positions.get('Moon', {}).get('sign_index', -1)
    if moon_sign >= 0:
        second = (moon_sign + 1) % 12
        twelfth = (moon_sign - 1) % 12
        side_planets = []
        for p in PLANETS[:7]:
            if p == 'Moon':
                continue
            ps = positions.get(p, {}).get('sign_index', -1)
            if ps in (second, twelfth):
                side_planets.append(p)

        benefics = ['Jupiter', 'Venus', 'Mercury']
        benefic_kendra_from_moon = []
        for p in benefics:
            ps = positions.get(p, {}).get('sign_index', -1)
            if ps >= 0 and get_house_from_lagna(ps, moon_sign) in KENDRAS:
                benefic_kendra_from_moon.append(p)

        # Common practical cancellation evidence: benefic in Kendra from Moon
        # or Moon itself in Kendra from Lagna.
        moon_house = house_of('Moon')
        if not side_planets and (benefic_kendra_from_moon or moon_house in KENDRAS):
            reasons = []
            if benefic_kendra_from_moon:
                reasons.append('चंद्र से केंद्र में शुभ ग्रह')
            if moon_house in KENDRAS:
                reasons.append('चंद्रमा लग्न से केंद्र में')
            yogas.append({
                'name': 'केमद्रुम भंग',
                'name_en': 'Kemadruma Bhanga',
                'description': 'केमद्रुम की मूल स्थिति के साथ भंगकारी शुभ प्रभाव: ' + '; '.join(reasons),
                'effect': 'मानसिक स्थिरता, अंतर्दृष्टि और अकेलेपन/अस्थिरता में कमी',
                'strength': 'उच्च',
                'planets': ['Moon'] + benefic_kendra_from_moon,
                'is_forming': True
            })

    # 5th-house affliction requested in source: Sun + Rahu in 5th.
    if house_of('Sun') == 4 and house_of('Rahu') == 4:
        yogas.append({
            'name': 'पंचम भाव बाधक प्रभाव',
            'name_en': '5th House Affliction / Mild Obstruction',
            'description': '5वें भाव में सूर्य-राहु युति',
            'effect': 'शिक्षा, निर्णय और रचनात्मक कार्यों में कभी-कभी overthinking या distraction',
            'strength': 'मध्यम',
            'planets': ['Sun', 'Rahu'],
            'is_forming': True
        })

    return yogas


# ============================================================
# CATEGORY 13: MARAKA ANALYSIS
# ============================================================

def detect_maraka_analysis(chart_data: Dict) -> List[Dict]:
    """Analyze 2nd/7th lord and occupants as requested."""
    yogas = []
    lagna = chart_data['lagna_sign']
    positions = chart_data.get('planet_positions', {})
    lordship = get_planet_lordship(chart_data)

    maraka_houses = [1, 6]  # zero-based: 2nd and 7th
    trik = set(TRIK_HOUSES)
    trikonas = set(TRIKONAS)
    kendras = set(KENDRAS)

    def house_of(p):
        s = positions.get(p, {}).get('sign_index', -1)
        return get_house_from_lagna(s, lagna) if s >= 0 else -1

    maraka_lords = []
    for p in PLANETS[:7]:
        if any(h in lordship.get(p, []) for h in maraka_houses):
            maraka_lords.append(p)

    occupants = []
    for p in PLANETS:
        h = house_of(p)
        if h in maraka_houses:
            occupants.append(p)

    # One structured entry is easier for the frontend than one card per planet.
    if maraka_lords or occupants:
        details = []
        for p in dict.fromkeys(maraka_lords + occupants):
            h = house_of(p)
            sign = positions.get(p, {}).get('sign_index', -1)
            state = []
            if sign == EXALTATION.get(p):
                state.append('उच्च')
            if sign == DEBILITATION.get(p):
                state.append('नीच')
            if sign in OWN_SIGNS.get(p, []):
                state.append('स्वराशि')
            if h in trikonas:
                state.append('त्रिकोण')
            elif h in kendras:
                state.append('केंद्र')
            elif h in trik:
                state.append('त्रिक')
            if h == 6:
                state.append('7वें मारक भाव')
            if h == 1:
                state.append('2रे मारक भाव')
            details.append({
                'planet': p,
                'house': h + 1 if h >= 0 else None,
                'role': 'मारकेश' if p in maraka_lords else 'मारक भाव स्थित',
                'strength_factors': state
            })

        yogas.append({
            'name': 'मारक विश्लेषण',
            'name_en': 'Maraka Analysis',
            'description': '2रे/7वें भावेश तथा इन भावों में स्थित ग्रहों का बल और स्थिति',
            'effect': 'मारकत्व का मूल्यांकन दशा, बल, उच्च-नीच, केंद्र/त्रिकोण/त्रिक स्थिति के साथ किया जाना चाहिए',
            'strength': 'विश्लेषण',
            'planets': list(dict.fromkeys(maraka_lords + occupants)),
            'details': details,
            'is_forming': True
        })
    return yogas

# ============================================================
# MAIN YOGA DETECTION FUNCTION
# ============================================================

def _dedup_yoga_records(records):
    seen = set()
    out = []
    for y in records or []:
        if not isinstance(y, dict):
            continue
        sig = (y.get('id') or y.get('name_en') or y.get('name'), tuple(sorted(y.get('planets', []) or [])), tuple(sorted(y.get('houses', []) or [])))
        if sig not in seen:
            seen.add(sig)
            out.append(y)
    return out

def audit_yoga_results(all_yogas):
    for k, v in list(all_yogas.items()):
        if isinstance(v, list):
            all_yogas[k] = _dedup_yoga_records(v)
    # Maraka analysis is not a Yoga category for total counting.
    # Placement/supporting-factor records must remain outside Yoga counts.
    return all_yogas


# ============================================================
# COMPLETE YOGA CHECKLIST
# Every supported named yoga gets an explicit ✓ / ✗ status.
# This is display/audit metadata and is excluded from Yoga counts.
# ============================================================

YOGA_CHECKLIST_CATALOG = [
    ('Raj Yoga', 'raja_yogas', None),
    ('Dharma-Karmadhipati Raja Yoga', 'raja_yogas', 'Dharma-Karmadhipati Raja Yoga'),
    ('Kendra-Trikona Raja Yoga', 'raja_yogas', 'Kendra-Trikona Raja Yoga'),

    ('Dhana Yoga', 'dhana_yogas', None),
    ('Guru-Shukra Dhana Yoga', 'dhana_yogas', 'Guru-Shukra Dhana Yoga'),
    ('Dhana Parivartana Yoga', 'dhana_yogas', 'Dhana Parivartan Yoga'),
    ('Jupiter Dhana Yoga', 'dhana_yogas', 'Jupiter Dhana Yoga'),

    ('Ruchaka Yoga', 'pancha_mahapurusha_yogas', 'Ruchaka Yoga'),
    ('Bhadra Yoga', 'pancha_mahapurusha_yogas', 'Bhadra Yoga'),
    ('Hamsa Yoga', 'pancha_mahapurusha_yogas', 'Hamsa Yoga'),
    ('Malavya Yoga', 'pancha_mahapurusha_yogas', 'Malavya Yoga'),
    ('Shasha Yoga', 'pancha_mahapurusha_yogas', 'Sasa Yoga'),

    ('Gaja Kesari Yoga', 'chandra_yogas', 'Gaja Kesari Yoga'),
    ('Sunapha Yoga', 'chandra_yogas', 'Sunafa Yoga'),
    ('Anapha Yoga', 'chandra_yogas', 'Anafa Yoga'),
    ('Durudhara Yoga', 'chandra_yogas', 'Durudhara Yoga'),
    ('Kemadruma Yoga', 'chandra_yogas', 'Kemadruma Yoga'),

    ('Veshi Yoga', 'surya_yogas', 'Veshi Yoga'),
    ('Voshi Yoga', 'surya_yogas', 'Voshi Yoga'),
    ('Ubhayachari Yoga', 'surya_yogas', 'Ubhayachari Yoga'),

    ('Saraswati Yoga', 'saraswati_yogas', 'Saraswati Yoga'),
    ('Maha Yoga', 'maha_yogas', 'Maha Yoga'),

    ('Neecha Bhanga Raja Yoga', 'neecha_bhanga_raja_yoga', 'Neecha Bhanga Raja Yoga'),

    ('Viparita Raja Yoga', 'viparita_raja_yogas', None),
    ('Harsha Yoga', 'viparita_raja_yogas', 'Harsha Yoga'),
    ('Sarala Yoga', 'viparita_raja_yogas', 'Sarala Yoga'),
    ('Vimala Yoga', 'viparita_raja_yogas', 'Vimala Yoga'),

    ('Arishta Yoga', 'arishta_yogas', None),
    ('Moon-Rahu Grahan Yoga', 'arishta_yogas', 'Moon-Rahu Grahan Yoga'),
    ('Moon-Ketu Grahan Yoga', 'arishta_yogas', 'Moon-Ketu Grahan Yoga'),

    ('Dainya Yoga', 'dainya_khala_yogas', 'Dainya Parivartana Yoga'),
    ('Khala Yoga', 'dainya_khala_yogas', 'Khala Parivartana Yoga'),

    ('Budhaditya Yoga', 'special_yogas', 'Budhaditya Yoga'),
    ('Pravrajya Yoga', 'special_yogas', 'Pravrajya Yoga'),
    ('Nipuna Yoga', 'special_yogas', 'Nipuna Yoga'),
    ('Kalanidhi Yoga', 'special_yogas', 'Kalanidhi Yoga'),

    ('Technical & Innovation / Research Yoga', 'additional_yogas', 'Technical & Innovation / Research Yoga'),
    ('Kemadruma Bhanga', 'additional_yogas', 'Kemadruma Bhanga'),
    ('5th House Affliction / Mild Obstruction', 'additional_yogas', '5th House Affliction / Mild Obstruction'),

    ('Lakshmi Yoga', 'lakshmi_yogas', 'Lakshmi Yoga'),

    # Source/project-specific items retained for audit visibility,
    # but explicitly marked as supporting/non-classical rather than
    # silently promoted to a classical named Yoga.
    ('Malefics in Kendra', 'additional_yogas', 'Malefics in Kendra'),
]

def build_yoga_checklist(all_yogas):
    """
    Return every supported Yoga with explicit check/cross status.

    ✓ = the corresponding detector found the Yoga.
    ✗ = the detector did not find it.
    No item is inferred merely from a similar/alias combination.
    """
    checklist = []

    for label, category, expected_name in YOGA_CHECKLIST_CATALOG:
        records = all_yogas.get(category, []) or []

        if expected_name is None:
            formed = len(records) > 0
        else:
            formed = any(
                isinstance(y, dict)
                and (
                    y.get('name_en') == expected_name
                    or y.get('name') == expected_name
                )
                for y in records
            )

        checklist.append({
            'name': label,
            'name_en': label,
            'status': '✓' if formed else '✗',
            'is_forming': formed,
            'category': category,
            'classical_status': 'named_yoga',
        })

    return checklist

def detect_all_yogas(chart_data: Dict) -> Dict[str, List[Dict]]:
    """
    Detect all yogas across all categories.
    
    Returns:
        Dictionary with categories as keys and list of yogas as values
    """
    all_yogas = {
        'raja_yogas': detect_raja_yogas(chart_data),
        'dhana_yogas': detect_dhana_yogas(chart_data),
        'pancha_mahapurusha_yogas': detect_pancha_mahapurusha_yogas(chart_data),
        'chandra_yogas': detect_chandra_yogas(chart_data),
        'neecha_bhanga_raja_yoga': detect_neecha_bhanga_raja_yoga(chart_data),
        'viparita_raja_yogas': detect_viparita_raja_yogas(chart_data),
        'arishta_yogas': detect_arishta_yogas(chart_data),
        'special_yogas': detect_special_yogas(chart_data),
        'surya_yogas': detect_surya_yogas(chart_data),
        'saraswati_yogas': detect_saraswati_yoga(chart_data),
        'maha_yogas': detect_maha_yoga(chart_data),
        'dainya_khala_yogas': detect_dainya_khala_yogas(chart_data),
        'additional_yogas': detect_additional_chart_yogas(chart_data),
        'lakshmi_yogas': detect_lakshmi_yoga(chart_data),
        'maraka_analysis': detect_maraka_analysis(chart_data)
    }
    
    all_yogas = audit_yoga_results(all_yogas)

    # Complete ✓ / ✗ audit list. This is NOT counted as Yoga records.
    all_yogas['yoga_checklist'] = build_yoga_checklist(all_yogas)

    # Calculate summary statistics.
    # Maraka Analysis is an assessment block, not a Yoga.
    summary_excluded = {'maraka_analysis', 'yoga_checklist'}
    yoga_categories = {
        key: value for key, value in all_yogas.items()
        if key not in summary_excluded
    }

    total_yogas = sum(len(yogas) for yogas in yoga_categories.values())

    # Explicitly adverse groups.
    inauspicious_count = (
        len(all_yogas.get('arishta_yogas', [])) +
        len(all_yogas.get('dainya_khala_yogas', []))
    )
    auspicious_count = max(total_yogas - inauspicious_count, 0)

    all_yogas['summary'] = {
        'total_yogas': total_yogas,
        'auspicious_yogas': auspicious_count,
        'inauspicious_yogas': inauspicious_count,
        'categories': len(yoga_categories)
    }

    return all_yogas
