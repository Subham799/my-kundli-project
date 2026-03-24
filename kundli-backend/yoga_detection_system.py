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

def detect_raja_yogas(chart_data: Dict) -> List[Dict]:
    """Detect Raja Yogas - combinations for power and authority."""
    yogas = []
    lagna = chart_data['lagna_sign']
    planet_positions = chart_data['planet_positions']
    lordship = get_planet_lordship(chart_data)
    
    # 1. Kendra-Trikona Raja Yoga
    # Lords of Kendra and Trikona houses together
    for p1 in PLANETS[:7]:  # Exclude Rahu/Ketu
        for p2 in PLANETS[:7]:
            if p1 == p2:
                continue
            
            p1_houses = lordship.get(p1, [])
            p2_houses = lordship.get(p2, [])
            
            p1_kendra = any(h in KENDRAS for h in p1_houses)
            p1_trikona = any(h in TRIKONAS for h in p1_houses)
            p2_kendra = any(h in KENDRAS for h in p2_houses)
            p2_trikona = any(h in TRIKONAS for h in p2_houses)
            
            if (p1_kendra and p2_trikona) or (p1_trikona and p2_kendra):
                # Check if planets are conjunct or aspecting
                p1_sign = planet_positions.get(p1, {}).get('sign_index', -1)
                p2_sign = planet_positions.get(p2, {}).get('sign_index', -1)
                
                if p1_sign == p2_sign:
                    yogas.append({
                        'name': 'केंद्राधिपति-त्रिकोणाधिपति राज योग',
                        'name_en': 'Kendra-Trikona Raja Yoga',
                        'description': f'{p1} और {p2} केंद्र व त्रिकोण के स्वामी युति में',
                        'effect': 'शक्ति, प्रतिष्ठा, सफलता',
                        'strength': 'उच्च',
                        'planets': [p1, p2],
                        'is_forming': True
                    })
    
    # 2. Dharma-Karmadhipati Raja Yoga
    # Lord of 9th and 10th together
    ninth_sign = (lagna + 8) % 12
    tenth_sign = (lagna + 9) % 12
    
    for planet in PLANETS[:7]:
        if ninth_sign in OWN_SIGNS.get(planet, []):
            ninth_lord = planet
        if tenth_sign in OWN_SIGNS.get(planet, []):
            tenth_lord = planet
    
    try:
        if ninth_lord and tenth_lord:
            ninth_pos = planet_positions.get(ninth_lord, {}).get('sign_index', -1)
            tenth_pos = planet_positions.get(tenth_lord, {}).get('sign_index', -1)
            
            if ninth_pos == tenth_pos:
                yogas.append({
                    'name': 'धर्म-कर्माधिपति राज योग',
                    'name_en': 'Dharma-Karmadhipati Raja Yoga',
                    'description': f'9वें ({ninth_lord}) और 10वें ({tenth_lord}) भाव के स्वामी युति में',
                    'effect': 'उच्च पद, सम्मान, धर्म-कर्म में सफलता',
                    'strength': 'बहुत उच्च',
                    'planets': [ninth_lord, tenth_lord],
                    'is_forming': True
                })
    except:
        pass
    
    # 3. Lagna and Moon in Kendra
    moon_sign = planet_positions.get('Moon', {}).get('sign_index', -1)
    if moon_sign >= 0:
        moon_house = get_house_from_lagna(moon_sign, lagna)
        if moon_house in KENDRAS:
            yogas.append({
                'name': 'लग्नेश-चंद्रमा केंद्र योग',
                'name_en': 'Lagna-Moon Kendra Yoga',
                'description': 'चंद्रमा लग्न से केंद्र में स्थित',
                'effect': 'मानसिक शक्ति, लोकप्रियता',
                'strength': 'मध्यम',
                'planets': ['Moon'],
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
    
    # 4. Lakshmi Yoga - Venus in Kendra from Moon
    moon_sign = planet_positions.get('Moon', {}).get('sign_index', -1)
    if moon_sign >= 0 and ven_sign >= 0:
        ven_house_from_moon = get_house_from_lagna(ven_sign, moon_sign)
        if ven_house_from_moon in KENDRAS:
            yogas.append({
                'name': 'लक्ष्मी योग',
                'name_en': 'Lakshmi Yoga',
                'description': 'शुक्र चंद्रमा से केंद्र में',
                'effect': 'धन-धान्य, सुख-समृद्धि, सौंदर्य',
                'strength': 'उच्च',
                'planets': ['Venus', 'Moon'],
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
    
    # 4. Kemadruma Yoga - No planets in 2nd and 12th from Moon (inauspicious)
    if not planets_in_2nd and not planets_in_12th:
        yogas.append({
            'name': 'केमद्रुम योग',
            'name_en': 'Kemadruma Yoga',
            'description': 'चंद्रमा के दोनों ओर कोई ग्रह नहीं',
            'effect': 'कठिनाई, मानसिक अशांति, संघर्ष (निवारण: गुरु-शुक्र की कृपा से)',
            'strength': 'अशुभ',
            'planets': ['Moon'],
            'is_forming': True
        })
    
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
    
    # 1. Mleccha Yoga - Foreign connections
    # Rahu in Kendra or with lagna lord
    rahu_sign = planet_positions.get('Rahu', {}).get('sign_index', -1)
    if rahu_sign >= 0:
        rahu_house = get_house_from_lagna(rahu_sign, lagna)
        if rahu_house in KENDRAS:
            yogas.append({
                'name': 'म्लेच्छ योग',
                'name_en': 'Mleccha Yoga',
                'description': 'राहु केंद्र में स्थित',
                'effect': 'विदेश यात्रा, विदेशी संपर्क, अपरंपरागत कार्य',
                'strength': 'मध्यम',
                'planets': ['Rahu'],
                'is_forming': True
            })
    
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
# MAIN YOGA DETECTION FUNCTION
# ============================================================

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
        'special_yogas': detect_special_yogas(chart_data)
    }
    
    # Calculate summary statistics
    total_yogas = sum(len(yogas) for yogas in all_yogas.values())
    auspicious_count = sum(len(yogas) for key, yogas in all_yogas.items() 
                          if key != 'arishta_yogas')
    inauspicious_count = len(all_yogas['arishta_yogas'])
    
    all_yogas['summary'] = {
        'total_yogas': total_yogas,
        'auspicious_yogas': auspicious_count,
        'inauspicious_yogas': inauspicious_count,
        'categories': len(all_yogas) - 1  # Exclude summary itself
    }
    
    return all_yogas
