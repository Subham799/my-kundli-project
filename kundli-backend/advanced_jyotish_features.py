"""
Advanced Jyotish Features - Python Backend
===========================================

Features:
1. Punarjanma (Previous/Future Birth) - Based on Drekkana (D3)
2. Shani Gochar (Saturn Transit) - Sade Sati, Dhayya, Pada System
3. Comprehensive Prediction System - Shows both good and bad, user decides

Author: Vedic Astrology Engine
Date: 2025
"""

import pyswisseph as swe
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


# ═══════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════

PLANET_CODES = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mars': swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus': swe.VENUS,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,
    'Ketu': -1  # Calculated as opposite of Rahu
}

SIGN_LORDS = {
    0: 'Ma',  # Aries - Mars
    1: 've',  # Taurus - Venus
    2: 'Me',  # Gemini - Mercury
    3: 'Mo',  # Cancer - Moon
    4: 'Su',  # Leo - Sun
    5: 'Me',  # Virgo - Mercury
    6: 've',  # Libra - Venus
    7: 'Ma',  # Scorpio - Mars
    8: 'Ju',  # Sagittarius - Jupiter
    9: 'Sa',  # Capricorn - Saturn
    10: 'Sa', # Aquarius - Saturn
    11: 'Ju'  # Pisces - Jupiter
}

RASHI_NAMES = [
    "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
]

PLANET_HINDI = {
    'Su': 'सूर्य', 'Mo': 'चंद्र', 'Ma': 'मंगल', 'Me': 'बुध',
    'Ju': 'गुरु', 've': 'शुक्र', 'Sa': 'शनि', 'Ra': 'राहु', 'Ke': 'केतु'
}


# ═══════════════════════════════════════════════════════════════════
# 1. PUNARJANMA (PREVIOUS & FUTURE BIRTH) CALCULATION
# ═══════════════════════════════════════════════════════════════════

def calculate_drekkana_lord(degree: float) -> str:
    """
    Calculate D3 (Drekkana) lord for a given degree
    
    Drekkana divisions:
    - 0-10° → Sign's own lord
    - 10-20° → 5th sign's lord
    - 20-30° → 9th sign's lord
    
    Args:
        degree: Absolute degree (0-360)
    
    Returns:
        Planet code (Su, Mo, Ma, etc.)
    """
    sign_idx = int(degree / 30)
    sign_degree = degree % 30
    
    # Determine which third (drekkana)
    if sign_degree < 10:
        drekkana_sign = sign_idx
    elif sign_degree < 20:
        drekkana_sign = (sign_idx + 4) % 12  # 5th sign
    else:
        drekkana_sign = (sign_idx + 8) % 12  # 9th sign
    
    return SIGN_LORDS[drekkana_sign]


def get_exaltation_status(planet_code: str, sign_idx: int) -> str:
    """
    Get exaltation status of a planet
    
    Returns:
        'उच्च' (exalted), 'मध्य' (neutral), 'नीच' (debilitated)
    """
    exaltation_map = {
        'Su': 0,   # Aries
        'Mo': 1,   # Taurus
        'Ma': 9,   # Capricorn
        'Me': 5,   # Virgo
        'Ju': 3,   # Cancer
        've': 11,  # Pisces
        'Sa': 6    # Libra
    }
    
    debilitation_map = {
        'Su': 6,   # Libra
        'Mo': 7,   # Scorpio
        'Ma': 3,   # Cancer
        'Me': 11,  # Pisces
        'Ju': 9,   # Capricorn
        've': 5,   # Virgo
        'Sa': 0    # Aries
    }
    
    if planet_code in exaltation_map and exaltation_map[planet_code] == sign_idx:
        return 'उच्च'
    elif planet_code in debilitation_map and debilitation_map[planet_code] == sign_idx:
        return 'नीच'
    else:
        return 'मध्य'


def calculate_punarjanma(sun_degree: float, moon_degree: float, 
                        sun_sign: int, moon_sign: int,
                        event_type: str = 'birth') -> Dict:
    """
    Calculate previous or future birth based on Brihat Jataka 25.14
    
    Rule: The stronger of Sun/Moon determines the birth realm based on
    their Drekkana lord's identity.
    
    Args:
        sun_degree: Sun's absolute degree
        moon_degree: Moon's absolute degree
        sun_sign: Sun's sign index (0-11)
        moon_sign: Moon's sign index (0-11)
        event_type: 'birth' or 'death' (determines interpretation)
    
    Returns:
        Dictionary with birth realm details
    """
    
    # Determine stronger luminary (simplified - can be enhanced with Shadbala)
    # For now, use degree position (closer to middle = stronger)
    sun_sign_deg = sun_degree % 30
    moon_sign_deg = moon_degree % 30
    
    sun_strength = abs(15 - sun_sign_deg)  # Closer to 15° = stronger
    moon_strength = abs(15 - moon_sign_deg)
    
    if moon_strength < sun_strength:
        primary_degree = moon_degree
        primary_sign = moon_sign
        primary_planet = 'Mo'
        stronger = 'चंद्रमा'
    else:
        primary_degree = sun_degree
        primary_sign = sun_sign
        primary_planet = 'Su'
        stronger = 'सूर्य'
    
    # Get Drekkana lord
    drekkana_lord = calculate_drekkana_lord(primary_degree)
    
    # Determine realm based on Drekkana lord
    realm_map = {
        'Ju': {
            'realm': 'देवलोक',
            'realm_en': 'Devaloka',
            'description': 'स्वर्ग (Heaven)',
            'icon': '🌟'
        },
        'Mo': {
            'realm': 'पितृलोक',
            'realm_en': 'Pitriloka',
            'description': 'चंद्रलोक (Ancestral Realm)',
            'icon': '🌙'
        },
        've': {
            'realm': 'पितृलोक',
            'realm_en': 'Pitriloka',
            'description': 'चंद्रलोक (Ancestral Realm)',
            'icon': '🌙'
        },
        'Su': {
            'realm': 'मर्त्यलोक',
            'realm_en': 'Martyaloka',
            'description': 'पृथ्वी (Earth)',
            'icon': '🌍'
        },
        'Ma': {
            'realm': 'मर्त्यलोक',
            'realm_en': 'Martyaloka',
            'description': 'पृथ्वी (Earth)',
            'icon': '🌍'
        },
        'Sa': {
            'realm': 'नरकलोक',
            'realm_en': 'Narakloka',
            'description': 'नरक (Hell)',
            'icon': '🔥'
        },
        'Me': {
            'realm': 'नरकलोक',
            'realm_en': 'Narakloka',
            'description': 'नरक (Hell)',
            'icon': '🔥'
        }
    }
    
    realm_info = realm_map.get(drekkana_lord, realm_map['Su'])
    
    # Get quality based on exaltation status
    quality_status = get_exaltation_status(drekkana_lord, 
                                          int(primary_degree / 30))
    
    quality_map = {
        'उच्च': {'quality': 'उत्तम', 'level': 'उच्च श्रेणी', 'score': 100},
        'मध्य': {'quality': 'मध्यम', 'level': 'मध्यम श्रेणी', 'score': 60},
        'नीच': {'quality': 'अधम', 'level': 'निम्न श्रेणी', 'score': 30}
    }
    
    quality_info = quality_map[quality_status]
    
    # Event-specific interpretation
    if event_type == 'birth':
        interpretation = f"पूर्व जन्म में आप {realm_info['realm']} के {quality_info['quality']} वर्ग में थे"
        timeline = "पिछला जन्म"
    else:
        interpretation = f"मृत्यु के बाद आप {realm_info['realm']} के {quality_info['quality']} वर्ग में जाएंगे"
        timeline = "अगला जन्म"
    
    return {
        'stronger_luminary': stronger,
        'stronger_planet_code': primary_planet,
        'drekkana_lord': drekkana_lord,
        'drekkana_lord_hindi': PLANET_HINDI.get(drekkana_lord, drekkana_lord),
        'realm': realm_info['realm'],
        'realm_en': realm_info['realm_en'],
        'realm_description': realm_info['description'],
        'realm_icon': realm_info['icon'],
        'quality': quality_info['quality'],
        'quality_level': quality_info['level'],
        'quality_score': quality_info['score'],
        'exaltation_status': quality_status,
        'interpretation': interpretation,
        'timeline': timeline,
        'event_type': event_type,
        
        # Additional details for UI
        'details': {
            'primary_degree': round(primary_degree, 2),
            'primary_sign': RASHI_NAMES[primary_sign],
            'drekkana_division': f"{int((primary_degree % 30) / 10) + 1}/3"
        }
    }


# ═══════════════════════════════════════════════════════════════════
# 2. SHANI GOCHAR (SATURN TRANSIT) SYSTEM
# ═══════════════════════════════════════════════════════════════════

def get_saturn_position_jd(jd: float) -> Tuple[float, int]:
    """Get Saturn's position for given Julian Day"""
    saturn_pos = swe.calc_ut(jd, PLANET_CODES['Saturn'])[0][0]
    saturn_sign = int(saturn_pos / 30)
    return saturn_pos, saturn_sign


def calculate_sade_sati(moon_sign: int, saturn_sign: int) -> Dict:
    """
    Calculate Sade Sati (7.5 year Saturn transit)
    
    Sade Sati occurs when Saturn transits:
    - 12th house from Moon (ढैया - Dhayya starts)
    - 1st house from Moon (Peak Sade Sati)
    - 2nd house from Moon (Sade Sati ends)
    
    Args:
        moon_sign: Moon's birth sign (0-11)
        saturn_sign: Saturn's current transit sign (0-11)
    
    Returns:
        Dictionary with Sade Sati details
    """
    
    # Calculate house position from Moon
    house_from_moon = (saturn_sign - moon_sign) % 12 + 1
    
    sade_sati_houses = [12, 1, 2]
    dhayya_houses = [4, 8]
    
    is_sade_sati = house_from_moon in sade_sati_houses
    is_dhayya = house_from_moon in dhayya_houses
    
    result = {
        'active': is_sade_sati or is_dhayya,
        'type': None,
        'phase': None,
        'severity': 0,
        'description': '',
        'remedies': [],
        'house_from_moon': house_from_moon
    }
    
    if is_sade_sati:
        result['type'] = 'साढ़े साती'
        
        if house_from_moon == 12:
            result['phase'] = 'प्रथम चरण (ढैया प्रारंभ)'
            result['severity'] = 40
            result['description'] = 'शनि सिर पर है - मानसिक चिंता, खर्चे बढ़ेंगे'
            result['body_part'] = 'सिर (Head)'
            
        elif house_from_moon == 1:
            result['phase'] = 'द्वितीय चरण (मध्य - सबसे कठिन)'
            result['severity'] = 100
            result['description'] = 'शनि हृदय पर है - सबसे कठिन समय, स्वास्थ्य व करियर में चुनौतियां'
            result['body_part'] = 'हृदय (Heart)'
            
        elif house_from_moon == 2:
            result['phase'] = 'तृतीय चरण (समाप्ति)'
            result['severity'] = 40
            result['description'] = 'शनि पैर पर है - धन की समस्या, पर धीरे-धीरे सुधार'
            result['body_part'] = 'पैर (Feet)'
        
        # Common remedies
        result['remedies'] = [
            'शनिवार को हनुमान जी की पूजा',
            'तेल का दान (शनिवार)',
            'काले तिल व उड़द का दान',
            'शनि मंत्र: ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
            'नीलम रत्न (ज्योतिषी से परामर्श के बाद)'
        ]
    
    elif is_dhayya:
        result['type'] = 'ढैया (छोटी साढ़े साती)'
        result['severity'] = 50
        
        if house_from_moon == 4:
            result['phase'] = 'चतुर्थ भाव ढैया'
            result['description'] = '2.5 वर्ष - घर, माता, संपत्ति में समस्या'
        else:  # house 8
            result['phase'] = 'अष्टम भाव ढैया'
            result['description'] = '2.5 वर्ष - स्वास्थ्य, दुर्घटना की संभावना'
        
        result['remedies'] = [
            'शनिवार व्रत',
            'काले कपड़े का दान',
            'शनि देव को तेल चढ़ाना'
        ]
    
    return result


def calculate_pada_system(moon_sign: int, saturn_sign: int) -> Dict:
    """
    Calculate Pada (Foot) system when Saturn changes signs
    
    Based on Moon's house position from Saturn:
    - Houses 1,6,11 → Swarna Pada (Golden) - सुख देने वाला
    - Houses 2,5,9 → Rajat Pada (Silver) - सौभाग्य देने वाला
    - Houses 3,7,10 → Tamra Pada (Copper) - मध्यम फल
    - Houses 4,8,12 → Loha Pada (Iron) - धन-नाश
    
    Args:
        moon_sign: Moon's birth sign
        saturn_sign: Saturn's current transit sign
    
    Returns:
        Dictionary with Pada details
    """
    
    house_from_saturn = (moon_sign - saturn_sign) % 12 + 1
    
    pada_map = {
        'स्वर्ण पाद': {
            'houses': [1, 6, 11],
            'quality': 100,
            'description': 'सभी प्रकार के सुख प्राप्ति',
            'effects': ['सुख', 'समृद्धि', 'मान-सम्मान', 'लाभ'],
            'icon': '🌟',
            'color': '#FFD700'
        },
        'रजत पाद': {
            'houses': [2, 5, 9],
            'quality': 75,
            'description': 'सुख-सौभाग्य में वृद्धि',
            'effects': ['धन लाभ', 'सौभाग्य', 'पारिवारिक सुख'],
            'icon': '🥈',
            'color': '#C0C0C0'
        },
        'ताम्र पाद': {
            'houses': [3, 7, 10],
            'quality': 50,
            'description': 'मध्यम फल, मिश्रित परिणाम',
            'effects': ['साधारण फल', 'मेहनत से लाभ', 'उतार-चढ़ाव'],
            'icon': '🥉',
            'color': '#B87333'
        },
        'लौह पाद': {
            'houses': [4, 8, 12],
            'quality': 25,
            'description': 'धन-धान्य में नुकसान',
            'effects': ['खर्चे', 'हानि', 'कठिनाइयां', 'बाधाएं'],
            'icon': '⚫',
            'color': '#808080'
        }
    }
    
    pada_type = None
    pada_info = None
    
    for pada_name, pada_data in pada_map.items():
        if house_from_saturn in pada_data['houses']:
            pada_type = pada_name
            pada_info = pada_data
            break
    
    return {
        'pada_type': pada_type,
        'pada_quality': pada_info['quality'],
        'pada_description': pada_info['description'],
        'pada_effects': pada_info['effects'],
        'pada_icon': pada_info['icon'],
        'pada_color': pada_info['color'],
        'house_from_saturn': house_from_saturn,
        'interpretation': f"शनि परिवर्तन के समय {pada_type} - {pada_info['description']}"
    }


def comprehensive_saturn_analysis(birth_date: datetime, 
                                 moon_degree: float,
                                 current_date: Optional[datetime] = None) -> Dict:
    """
    Complete Saturn transit analysis
    
    Args:
        birth_date: Birth datetime
        moon_degree: Moon's degree at birth
        current_date: Date to analyze (default: today)
    
    Returns:
        Comprehensive Saturn analysis
    """
    
    if current_date is None:
        current_date = datetime.now()
    
    # Calculate Julian Days
    birth_jd = swe.julday(birth_date.year, birth_date.month, birth_date.day, 
                         birth_date.hour + birth_date.minute/60)
    current_jd = swe.julday(current_date.year, current_date.month, current_date.day, 12)
    
    # Get positions
    moon_sign = int(moon_degree / 30)
    saturn_pos, saturn_sign = get_saturn_position_jd(current_jd)
    
    # Calculate Sade Sati
    sade_sati_info = calculate_sade_sati(moon_sign, saturn_sign)
    
    # Calculate Pada
    pada_info = calculate_pada_system(moon_sign, saturn_sign)
    
    # Additional timing calculations
    # Saturn takes ~2.5 years per sign
    days_in_current_sign = 0  # Calculate based on when Saturn entered this sign
    
    return {
        'birth_moon_sign': RASHI_NAMES[moon_sign],
        'birth_moon_sign_idx': moon_sign,
        'current_saturn_sign': RASHI_NAMES[saturn_sign],
        'current_saturn_sign_idx': saturn_sign,
        'current_saturn_degree': round(saturn_pos, 2),
        
        'sade_sati': sade_sati_info,
        'pada': pada_info,
        
        'overall_status': {
            'active_transits': [],
            'severity_total': sade_sati_info['severity'],
            'quality_total': pada_info['pada_quality'],
            'net_effect': pada_info['pada_quality'] - sade_sati_info['severity']
        },
        
        'analysis_date': current_date.strftime('%Y-%m-%d')
    }


# ═══════════════════════════════════════════════════════════════════
# 3. COMPREHENSIVE PREDICTION SYSTEM
# ═══════════════════════════════════════════════════════════════════

def calculate_comprehensive_prediction(
    chart_data: Dict,
    include_positive: bool = True,
    include_negative: bool = True,
    show_cancellations: bool = True
) -> Dict:
    """
    Generate comprehensive prediction showing BOTH good and bad aspects
    
    Philosophy: "लग्नेश का गुरु 1000 दोषों को नष्ट कर सकता है" - BUT we still
    show all doshas and yogas, letting user/astrologer make final decision
    
    Args:
        chart_data: Complete chart with planets, houses, aspects, etc.
        include_positive: Include positive yogas
        include_negative: Include doshas/afflictions
        show_cancellations: Show dosha cancellation factors
    
    Returns:
        Comprehensive prediction with both aspects
    """
    
    prediction = {
        'positive_factors': [],
        'negative_factors': [],
        'cancellation_factors': [],
        'net_analysis': {},
        'final_verdict': {
            'status': 'मिश्रित (तय करें)',
            'explanation': ''
        }
    }
    
    # This would integrate with your existing chart analysis
    # Here's the structure:
    
    if include_positive:
        # Collect all positive yogas
        positive_items = [
            {
                'category': 'राजयोग',
                'description': 'लग्नेश और 9वें भाव का स्वामी युति में',
                'strength': 90,
                'houses_involved': [1, 9],
                'planets_involved': ['Ju', 'Ve'],
                'benefits': ['धन', 'प्रतिष्ठा', 'सफलता']
            },
            # Add more positive factors from chart analysis
        ]
        prediction['positive_factors'] = positive_items
    
    if include_negative:
        # Collect all doshas/afflictions
        negative_items = [
            {
                'category': 'मांगलिक दोष',
                'description': 'मंगल 7वें भाव में',
                'severity': 70,
                'houses_involved': [7],
                'planets_involved': ['Ma'],
                'concerns': ['विवाह विलंब', 'साथी से मतभेद']
            },
            {
                'category': 'शनि की साढ़े साती',
                'description': 'शनि चंद्र राशि पर',
                'severity': 100,
                'duration': '2.5 वर्ष',
                'concerns': ['मानसिक तनाव', 'करियर चुनौतियां']
            },
            # Add more negative factors
        ]
        prediction['negative_factors'] = negative_items
    
    if show_cancellations:
        # Show which negative factors are cancelled/reduced
        cancellations = [
            {
                'dosha': 'मांगलिक दोष',
                'cancelled_by': 'गुरु की दृष्टि 7वें भाव पर',
                'cancellation_strength': 80,
                'result': 'दोष लगभग निष्प्रभावी',
                'remaining_effect': 20
            },
            {
                'dosha': 'शनि साढ़े साती',
                'cancelled_by': 'लग्नेश बली है',
                'cancellation_strength': 40,
                'result': 'कठिनाई कम होगी',
                'remaining_effect': 60
            }
        ]
        prediction['cancellation_factors'] = cancellations
    
    # Net analysis
    total_positive = sum(item['strength'] for item in prediction['positive_factors'])
    total_negative = sum(item['severity'] for item in prediction['negative_factors'])
    total_cancelled = sum(item['cancellation_strength'] for item in prediction['cancellation_factors'])
    
    net_effect = total_positive + total_cancelled - total_negative
    
    prediction['net_analysis'] = {
        'total_positive_strength': total_positive,
        'total_negative_severity': total_negative,
        'total_cancellation': total_cancelled,
        'net_effect': net_effect,
        'positive_percentage': round((total_positive / (total_positive + total_negative)) * 100, 1) if (total_positive + total_negative) > 0 else 50,
        'negative_percentage': round((total_negative / (total_positive + total_negative)) * 100, 1) if (total_positive + total_negative) > 0 else 50
    }
    
    # Final verdict (but user decides!)
    if net_effect > 50:
        status = 'अधिकतर अनुकूल'
        explanation = 'सकारात्मक योग बलवान हैं, लेकिन दोषों पर ध्यान आवश्यक है'
    elif net_effect > 0:
        status = 'हल्की अनुकूल'
        explanation = 'मिश्रित फल, कुछ चुनौतियां लेकिन सफलता संभव'
    elif net_effect > -50:
        status = 'हल्की प्रतिकूल'
        explanation = 'चुनौतियां हैं लेकिन उपाय से सुधार संभव'
    else:
        status = 'अधिक सावधानी आवश्यक'
        explanation = 'कई दोष सक्रिय हैं, उपाय और मार्गदर्शन लें'
    
    prediction['final_verdict'] = {
        'status': status,
        'explanation': explanation,
        'user_note': '⚠️ यह स्वचालित विश्लेषण है। अंतिम निर्णय आप या अनुभवी ज्योतिषी करें।'
    }
    
    return prediction


# ═══════════════════════════════════════════════════════════════════
# FLASK API ROUTES (Add to your backend)
# ═══════════════════════════════════════════════════════════════════

"""
Add these routes to your Flask app:

@app.route('/api/punarjanma', methods=['POST'])
def get_punarjanma():
    data = request.json
    
    result = calculate_punarjanma(
        sun_degree=data['sun_degree'],
        moon_degree=data['moon_degree'],
        sun_sign=data['sun_sign'],
        moon_sign=data['moon_sign'],
        event_type=data.get('event_type', 'birth')
    )
    
    return jsonify(result)


@app.route('/api/saturn-transit', methods=['POST'])
def get_saturn_transit():
    data = request.json
    
    birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d %H:%M')
    current_date = datetime.strptime(data['current_date'], '%Y-%m-%d') if 'current_date' in data else None
    
    result = comprehensive_saturn_analysis(
        birth_date=birth_date,
        moon_degree=data['moon_degree'],
        current_date=current_date
    )
    
    return jsonify(result)


@app.route('/api/comprehensive-prediction', methods=['POST'])
def get_comprehensive_prediction():
    data = request.json
    
    result = calculate_comprehensive_prediction(
        chart_data=data['chart_data'],
        include_positive=data.get('include_positive', True),
        include_negative=data.get('include_negative', True),
        show_cancellations=data.get('show_cancellations', True)
    )
    
    return jsonify(result)
"""


# ═══════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Example 1: Punarjanma calculation
    print("="*60)
    print("Example 1: Previous Birth Analysis")
    print("="*60)
    
    punarjanma = calculate_punarjanma(
        sun_degree=45.5,  # Sun at 15° Taurus
        moon_degree=120.8,  # Moon at 0.8° Leo
        sun_sign=1,
        moon_sign=4,
        event_type='birth'
    )
    
    print(f"Stronger Luminary: {punarjanma['stronger_luminary']}")
    print(f"Drekkana Lord: {punarjanma['drekkana_lord_hindi']}")
    print(f"Previous Birth Realm: {punarjanma['realm_icon']} {punarjanma['realm']}")
    print(f"Quality: {punarjanma['quality']} ({punarjanma['quality_level']})")
    print(f"Interpretation: {punarjanma['interpretation']}")
    print()
    
    # Example 2: Saturn Transit
    print("="*60)
    print("Example 2: Saturn Transit Analysis")
    print("="*60)
    
    saturn_analysis = comprehensive_saturn_analysis(
        birth_date=datetime(1990, 5, 15, 10, 30),
        moon_degree=135.5,  # Moon in Virgo
        current_date=datetime(2025, 3, 7)
    )
    
    print(f"Birth Moon Sign: {saturn_analysis['birth_moon_sign']}")
    print(f"Current Saturn Sign: {saturn_analysis['current_saturn_sign']}")
    print()
    
    if saturn_analysis['sade_sati']['active']:
        print(f"⚠️ {saturn_analysis['sade_sati']['type']} Active!")
        print(f"Phase: {saturn_analysis['sade_sati']['phase']}")
        print(f"Severity: {saturn_analysis['sade_sati']['severity']}/100")
        print(f"Description: {saturn_analysis['sade_sati']['description']}")
        print(f"Remedies: {', '.join(saturn_analysis['sade_sati']['remedies'][:3])}")
    
    print()
    print(f"Pada: {saturn_analysis['pada']['pada_icon']} {saturn_analysis['pada']['pada_type']}")
    print(f"Quality: {saturn_analysis['pada']['pada_quality']}/100")
    print(f"Effects: {', '.join(saturn_analysis['pada']['pada_effects'])}")
