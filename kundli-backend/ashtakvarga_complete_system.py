"""
Ashtakvarga Complete System - अष्टकवर्ग पूर्ण सिस्टम
===================================================
Complete Ashtakvarga analysis with all classical rules and calculations.

Based on Maharishi Parashara's formulas and Bindu/Rekha logic.
"""

from typing import Dict, List, Any, Tuple
import math


# ============================================================================
# MODULE 1: ASHTAKVARGA BASICS (अष्टकवर्ग आधार)
# ============================================================================

class AshtakvargaConstants:
    """Constants for Ashtakvarga calculations"""
    
    AVERAGE_POINTS = 28
    THRESHOLD_WEAK = 28
    EXTREME_WEAK = 14
    MAX_POINTS_PER_HOUSE = 56
    
    INCLUDED_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"]
    EXCLUDED_PLANETS = ["Rahu", "Ketu"]  # No Ashtakvarga for Rahu/Ketu
    
    MALEFIC_PLANETS = ["Saturn", "Mars", "Sun", "Rahu"]
    BENEFIC_PLANETS = ["Moon", "Mercury", "Jupiter", "Venus"]


# ============================================================================
# MODULE 2: LIFE PROSPERITY INDEX (जीवन संपन्नता सूचकांक)
# ============================================================================

class LifeProsperityCalculator:
    """
    Calculate overall life prosperity based on houses 1,2,4,9,10,11
    """
    
    @staticmethod
    def calculate_prosperity_index(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        Formula: Sum of points in houses 1+2+4+9+10+11
        If >= 164: Prosperous life
        If < 164: Proportional lack
        """
        target_houses = [1, 2, 4, 9, 10, 11]
        
        total_score = sum(ashtakvarga_points.get(h, 0) for h in target_houses)
        
        is_prosperous = total_score >= 164
        prosperity_percentage = (total_score / 164) * 100
        
        return {
            "total_score": total_score,
            "threshold": 164,
            "is_prosperous": is_prosperous,
            "prosperity_percentage": prosperity_percentage,
            "house_wise_contribution": {
                h: ashtakvarga_points.get(h, 0) for h in target_houses
            },
            "prediction_hindi": "जीवन अत्यंत सुखमय और संपन्नता से भरा रहेगा" if is_prosperous
                               else f"जीवन में संपन्नता {int(prosperity_percentage)}% होगी, अभाव रहेंगे",
            "prediction_english": "Life will be very prosperous and happy" if is_prosperous
                                else f"Life prosperity at {int(prosperity_percentage)}%, struggles expected"
        }


# ============================================================================
# MODULE 3: STRUGGLE METER (संघर्ष मापक)
# ============================================================================

class StruggleMeter:
    """
    Measures life struggles based on 6,8,12 vs Lagna comparison
    """
    
    @staticmethod
    def calculate_struggle_level(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        If ANY 2 houses from 6,8,12 have MORE points than Lagna (house 1),
        then extreme hardships
        """
        lagna_points = ashtakvarga_points.get(1, 0)
        house_6_points = ashtakvarga_points.get(6, 0)
        house_8_points = ashtakvarga_points.get(8, 0)
        house_12_points = ashtakvarga_points.get(12, 0)
        
        houses_greater_than_lagna = []
        
        if house_6_points > lagna_points:
            houses_greater_than_lagna.append((6, house_6_points))
        if house_8_points > lagna_points:
            houses_greater_than_lagna.append((8, house_8_points))
        if house_12_points > lagna_points:
            houses_greater_than_lagna.append((12, house_12_points))
        
        has_extreme_struggle = len(houses_greater_than_lagna) >= 2
        
        return {
            "lagna_points": lagna_points,
            "house_6_points": house_6_points,
            "house_8_points": house_8_points,
            "house_12_points": house_12_points,
            "houses_greater_than_lagna": houses_greater_than_lagna,
            "struggle_count": len(houses_greater_than_lagna),
            "has_extreme_struggle": has_extreme_struggle,
            "prediction_hindi": "जीवन में भयंकर मुसीबतें और संघर्ष रहेंगे" if has_extreme_struggle
                               else "सामान्य जीवन संघर्ष",
            "prediction_english": "Extreme hardships and struggles in life" if has_extreme_struggle
                                else "Normal life struggles"
        }


# ============================================================================
# MODULE 4: SPOUSE DOMINANCE CALCULATOR (दांपत्य प्रभुत्व)
# ============================================================================

class SpouseDominanceCalculator:
    """
    House 7 vs House 1 - Who dominates in marriage?
    """
    
    @staticmethod
    def calculate_dominance(ashtakvarga_points: Dict[int, int], gender: str = "male") -> Dict[str, Any]:
        """
        If House 7 > House 1: Spouse dominates
        If House 1 > House 7: Native dominates
        """
        house_1_points = ashtakvarga_points.get(1, 0)
        house_7_points = ashtakvarga_points.get(7, 0)
        
        spouse_dominates = house_7_points > house_1_points
        native_dominates = house_1_points > house_7_points
        equal = house_1_points == house_7_points
        
        prediction = {}
        
        if spouse_dominates:
            if gender == "male":
                prediction = {
                    "dominant_person": "Spouse (Wife)",
                    "description_hindi": "पत्नी हावी रहेगी। पुरुष अपनी पत्नी पर पूरा भरोसा करता है, सारी जिम्मेदारी पत्नी पर छोड़ देता है।",
                    "description_english": "Wife will dominate. Husband trusts wife completely, leaves all responsibilities to her."
                }
            else:
                prediction = {
                    "dominant_person": "Spouse (Husband)",
                    "description_hindi": "पति हावी रहेंगे। स्त्री अपने पति पर पूरा भरोसा करती है।",
                    "description_english": "Husband will dominate. Wife trusts husband completely."
                }
        elif native_dominates:
            prediction = {
                "dominant_person": "Native (Self)",
                "description_hindi": "जातक स्वयं हावी रहेगा, अपने विचार ऊपर रखेगा।",
                "description_english": "Native will dominate, impose own views."
            }
        else:
            prediction = {
                "dominant_person": "Equal",
                "description_hindi": "दोनों का बराबर प्रभाव",
                "description_english": "Equal influence"
            }
        
        return {
            "house_1_points": house_1_points,
            "house_7_points": house_7_points,
            **prediction
        }


# ============================================================================
# MODULE 5: CAREER TYPE PREDICTOR (करियर प्रकार)
# ============================================================================

class CareerTypePredictor:
    """
    Predicts if person should do Job or Business
    """
    
    @staticmethod
    def predict_career_type(ashtakvarga_points: Dict[int, int]) -> Dict[str, str]:
        """
        If House 6 > 28: Excellent for Job/Employment
        """
        house_6_points = ashtakvarga_points.get(6, 0)
        
        if house_6_points > 28:
            return {
                "recommended_type": "Job/Employment",
                "description_hindi": "नौकरी के लिए अत्यंत श्रेष्ठ। कर्मचारी के रूप में बहुत अच्छा रिजल्ट",
                "description_english": "Excellent for job. Very good results as employee.",
                "house_6_points": house_6_points
            }
        else:
            return {
                "recommended_type": "Business/Self-Employment",
                "description_hindi": "व्यवसाय या स्वरोजगार के लिए अच्छा",
                "description_english": "Good for business or self-employment",
                "house_6_points": house_6_points
            }


# ============================================================================
# MODULE 6: 8TH HOUSE DESTRUCTIVE LOGIC (अष्टम भाव विनाशक)
# ============================================================================

class EighthHouseDestructiveLogic:
    """
    Strong house destroys its 8th from itself (relative 8th)
    """
    
    RELATIVE_8TH_MAPPING = {
        1: {"destroys": "self", "relation": "स्वयं", "effect": "स्वास्थ्य समस्याएं"},
        2: {"destroys": 7, "relation": "पत्नी/spouse", "effect": "पत्नी को कष्ट"},
        4: {"destroys": 11, "relation": "माता", "note": "11वां धन के लिए अच्छा पर माता को कष्ट"},
        5: {"destroys": 12, "relation": "संतान", "effect": "संतान को कठिनाइयां"},
        11: {"destroys": 4, "relation": "माता", "effect": "माता के जीवन में कष्ट"},
        12: {"destroys": 5, "relation": "संतान", "effect": "संतान को हार्डशिप्स"}
    }
    
    @staticmethod
    def analyze_8th_house_destruction(ashtakvarga_points: Dict[int, int]) -> List[Dict[str, Any]]:
        """
        Check which houses are strong (>28) and what they destroy
        """
        destructive_effects = []
        
        for house, mapping in EighthHouseDestructiveLogic.RELATIVE_8TH_MAPPING.items():
            house_points = ashtakvarga_points.get(house, 0)
            
            if house_points > 28:
                destructive_effects.append({
                    "strong_house": house,
                    "points": house_points,
                    "destroys": mapping.get("destroys"),
                    "relation": mapping.get("relation"),
                    "effect": mapping.get("effect", mapping.get("note", "")),
                    "warning_hindi": f"{house}वां भाव मजबूत है ({house_points} अंक) लेकिन {mapping['relation']} को कष्ट देगा"
                })
        
        return destructive_effects


# ============================================================================
# MODULE 7: LUCKY DIRECTION FINDER (शुभ दिशा)
# ============================================================================

class LuckyDirectionFinder:
    """
    Find lucky directions based on sign-wise Ashtakvarga points
    """
    
    DIRECTION_MAPPING = {
        "East": [0, 4, 8],  # Aries, Leo, Sagittarius
        "South": [1, 5, 9],  # Taurus, Virgo, Capricorn
        "West": [2, 6, 10],  # Gemini, Libra, Aquarius
        "North": [3, 7, 11]  # Cancer, Scorpio, Pisces
    }
    
    @staticmethod
    def calculate_lucky_direction(sign_wise_points: Dict[int, int]) -> Dict[str, Any]:
        """
        Sum points for each direction, sort descending
        """
        direction_totals = {}
        
        for direction, signs in LuckyDirectionFinder.DIRECTION_MAPPING.items():
            total = sum(sign_wise_points.get(sign, 0) for sign in signs)
            direction_totals[direction] = total
        
        # Sort by total (descending)
        sorted_directions = sorted(direction_totals.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "direction_totals": direction_totals,
            "ranked_directions": [
                {
                    "rank": idx + 1,
                    "direction": direction,
                    "points": points,
                    "recommendation": "सबसे शुभ और लकी दिशा" if idx == 0
                                    else "दूसरी सबसे लकी दिशा" if idx == 1
                                    else "इस दिशा को avoid करें"
                }
                for idx, (direction, points) in enumerate(sorted_directions)
            ],
            "best_direction": sorted_directions[0][0],
            "worst_direction": sorted_directions[-1][0]
        }


# ============================================================================
# MODULE 8: TRANSIT PROTECTION ENGINE (गोचर सुरक्षा)
# ============================================================================

class TransitProtectionEngine:
    """
    Ashtakvarga overrides bad transits like Sade Sati
    """
    
    @staticmethod
    def check_transit_protection(transit_house: int, ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        If transit house has > 28 points, even Sade Sati won't harm
        """
        house_points = ashtakvarga_points.get(transit_house, 0)
        
        has_protection = house_points > 28
        
        return {
            "transit_house": transit_house,
            "house_points": house_points,
            "has_protection": has_protection,
            "prediction_hindi": "साढ़े साती/गोचर बिल्कुल परेशान नहीं करेगा, शुभ फल देगा" if has_protection
                               else "साढ़े साती भयंकर अशुभ फल देगी, बहुत कष्ट होंगे",
            "prediction_english": "Transit/Sade Sati won't harm, will give good results" if has_protection
                                else "Transit/Sade Sati will give very bad results",
            "note": "भले ही शनि नीच का हो, अधिक रेखाओं के कारण अशुभ फल खत्म" if has_protection else None
        }


# ============================================================================
# MODULE 9: AGE CALCULATOR (आयु गणक) - Sorrow & Happiness
# ============================================================================

class AgeCalculator:
    """
    Calculate ages of sorrow and happiness using (Sum * 7) / 27 formula
    """
    
    @staticmethod
    def calculate_age_of_sorrow(planet_house: int, ashtakvarga_points: Dict[int, int]) -> int:
        """
        Formula: (Sum of points from Lagna to planet's house) * 7 % 27
        Return the REMAINDER (modulo), not quotient - as per classical Jyotish
        """
        total_sum = sum(ashtakvarga_points.get(h, 0) for h in range(1, planet_house + 1))
        
        product = total_sum * 7
        remainder = product % 27
        age = remainder if remainder != 0 else 27
        
        return age
    
    @staticmethod
    def calculate_all_sorrow_ages(planet_positions: Dict[str, Dict], 
                                  ashtakvarga_points: Dict[int, int]) -> List[Dict[str, Any]]:
        """
        Calculate sorrow ages for all malefic planets
        """
        malefic_planets = AshtakvargaConstants.MALEFIC_PLANETS
        sorrow_ages = []
        
        for planet in malefic_planets:
            if planet == "Rahu":
                continue  # Rahu has no house in Ashtakvarga
            
            if planet in planet_positions:
                planet_house = planet_positions[planet].get('house', 1)
                age = AgeCalculator.calculate_age_of_sorrow(planet_house, ashtakvarga_points)
                
                sorrow_ages.append({
                    "planet": planet,
                    "planet_hindi": {"Saturn": "शनि", "Mars": "मंगल", "Sun": "सूर्य"}.get(planet, planet),
                    "house": planet_house,
                    "age": age,
                    "prediction_hindi": f"{age} वर्ष की आयु में घोर समस्याएं, दुख और कष्ट",
                    "prediction_english": f"Extreme problems, sorrow and suffering at age {age}"
                })
        
        return sorrow_ages
    
    @staticmethod
    def calculate_all_happiness_ages(planet_positions: Dict[str, Dict],
                                     ashtakvarga_points: Dict[int, int]) -> List[Dict[str, Any]]:
        """
        Calculate happiness ages for all benefic planets
        """
        benefic_planets = AshtakvargaConstants.BENEFIC_PLANETS
        happiness_ages = []
        
        for planet in benefic_planets:
            if planet in planet_positions:
                planet_house = planet_positions[planet].get('house', 1)
                age = AgeCalculator.calculate_age_of_sorrow(planet_house, ashtakvarga_points)
                
                happiness_ages.append({
                    "planet": planet,
                    "planet_hindi": {"Jupiter": "गुरु", "Venus": "शुक्र", "Mercury": "बुध", "Moon": "चंद्र"}.get(planet, planet),
                    "house": planet_house,
                    "age": age,
                    "prediction_hindi": f"{age} वर्ष की आयु में सुख, सफलता और खुशियां",
                    "prediction_english": f"Happiness, success and joy at age {age}"
                })
        
        return happiness_ages
    
    @staticmethod
    def resolve_age_conflict(sorrow_ages: List[Dict], happiness_ages: List[Dict],
                           current_dasha: str) -> Dict[str, Any]:
        """
        If same age appears in both sorrow and happiness, use dasha to decide
        """
        sorrow_age_values = {s['age'] for s in sorrow_ages}
        happiness_age_values = {h['age'] for h in happiness_ages}
        
        conflicts = sorrow_age_values & happiness_age_values
        
        if not conflicts:
            return {"has_conflict": False}
        
        # Use dasha to resolve
        is_malefic_dasha = current_dasha in AshtakvargaConstants.MALEFIC_PLANETS
        
        return {
            "has_conflict": True,
            "conflicting_ages": list(conflicts),
            "resolution": "sorrow" if is_malefic_dasha else "happiness",
            "explanation_hindi": f"दशा {current_dasha} की चल रही है, इसलिए {'दुख' if is_malefic_dasha else 'सुख'} प्रबल होगा",
            "explanation_english": f"Dasha of {current_dasha} running, so {'sorrow' if is_malefic_dasha else 'happiness'} will dominate"
        }


# ============================================================================
# MODULE 10: BUSINESS SUCCESS PREDICTOR (व्यवसाय सफलता)
# ============================================================================

class BusinessSuccessPredictor:
    """
    Predicts if person will become successful businessman
    """
    
    @staticmethod
    def predict_business_success(has_rajyoga: bool, ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        Kendra houses (1,4,7,10) with >= 30 points
        If 2+ kendras have 30+ points AND rajyoga exists = Big businessman
        """
        kendra_houses = [1, 4, 7, 10]
        strong_kendras = []
        
        for house in kendra_houses:
            points = ashtakvarga_points.get(house, 0)
            if points >= 30:
                strong_kendras.append({"house": house, "points": points})
        
        strong_kendra_count = len(strong_kendras)
        
        if has_rajyoga:
            if strong_kendra_count >= 2:
                level = "highest" if strong_kendra_count >= 3 else "high"
                
                return {
                    "will_become_businessman": True,
                    "level": level,
                    "strong_kendras": strong_kendras,
                    "prediction_hindi": "बहुत बड़ा व्यापार स्थापित करेगा, कई लोगों को रोजगार देगा" if level == "highest"
                                       else "सफल बिज़नेसमैन बनेगा, लोगों को नौकरी देगा",
                    "prediction_english": "Will establish very big business, employ many people" if level == "highest"
                                        else "Will become successful businessman, provide employment"
                }
            else:
                return {
                    "will_become_businessman": False,
                    "potential_only": True,
                    "strong_kendras": strong_kendras,
                    "prediction_hindi": "पोटेंशियल है लेकिन बहुत बड़ा राजयोग/चमत्कारिक परिणाम नहीं",
                    "prediction_english": "Potential exists but not huge rajyoga or miraculous results"
                }
        else:
            return {
                "will_become_businessman": False,
                "reason": "No Rajyoga in D1 chart",
                "strong_kendras": strong_kendras,
                "note": "राजयोग न होने से केवल सामान्य व्यवसाय"
            }


# ============================================================================
# MODULE 11: SUPREME JUPITER OVERRIDE (गुरु सुप्रीम अपवाद)
# ============================================================================

class JupiterOverrideChecker:
    """
    Jupiter in Ashtakvarga can cancel doshas in D1 chart
    """
    
    @staticmethod
    def check_jupiter_override(has_d1_dosha: bool, jupiter_ashtakvarga_strength: int) -> Dict[str, Any]:
        """
        If D1 has Vaidhavya Yoga or Childless Yoga,
        but Jupiter in Ashtakvarga has >28 points,
        then dosha is cancelled!
        """
        if has_d1_dosha and jupiter_ashtakvarga_strength > 28:
            return {
                "dosha_cancelled": True,
                "jupiter_strength": jupiter_ashtakvarga_strength,
                "prediction_hindi": "D1 के भयंकर दोष रद्द हो गए। दांपत्य सुख और संतान प्राप्ति होगी।",
                "prediction_english": "D1 doshas cancelled. Marital happiness and children will be obtained.",
                "note": "यह पराशर ऋषि का बहुत बड़ा अपवाद है"
            }
        
        return {
            "dosha_cancelled": False,
            "jupiter_strength": jupiter_ashtakvarga_strength,
            "note": "गुरु बल कम होने से दोष रद्द नहीं हुआ" if has_d1_dosha else "कोई दोष नहीं"
        }


# ============================================================================
# MODULE 12: REVERSE LOGIC HOUSES (6, 8, 12 अपवाद)
# ============================================================================

class ReversseLogicHouses:
    """
    For houses 6, 8, 12: MORE points = BAD (opposite of normal)
    """
    
    @staticmethod
    def analyze_sixth_house(house_6_points: int) -> Dict[str, Any]:
        """
        छठा भाव - रोग और शत्रु
        < 28 = Very good
        30-35 = Very bad
        """
        if house_6_points < 28:
            return {
                "house": 6,
                "points": house_6_points,
                "verdict": "बहुत शुभ",
                "prediction_hindi": "निरोगी रहेगा, कर्ज नहीं चढ़ेगा, दुश्मन कम होंगे",
                "prediction_english": "Will remain healthy, no debts, fewer enemies"
            }
        elif house_6_points >= 30:
            return {
                "house": 6,
                "points": house_6_points,
                "verdict": "बेहद अशुभ",
                "prediction_hindi": "दुश्मन बहुत ज्यादा, गंभीर बीमारियां, हमेशा कष्ट",
                "prediction_english": "Too many enemies, serious diseases, constant suffering"
            }
        else:
            return {"house": 6, "points": house_6_points, "verdict": "सामान्य"}
    
    @staticmethod
    def analyze_eighth_house(house_8_points: int, house_8_lord_strong: bool) -> Dict[str, Any]:
        """
        आठवां भाव - आयु और दरिद्रता
        < 28 = No poverty
        > 28 = Long life BUT only if 8th lord is strong
        """
        if house_8_points < 28:
            return {
                "house": 8,
                "points": house_8_points,
                "verdict": "शुभ",
                "prediction_hindi": "दरिद्रता नहीं होगी",
                "prediction_english": "No poverty"
            }
        else:
            if house_8_lord_strong:
                return {
                    "house": 8,
                    "points": house_8_points,
                    "verdict": "लंबी आयु",
                    "prediction_hindi": "आयु लंबी होगी (8वें का स्वामी बलवान है)",
                    "prediction_english": "Long life (8th lord is strong)"
                }
            else:
                return {
                    "house": 8,
                    "points": house_8_points,
                    "verdict": "कष्टकारी",
                    "prediction_hindi": "अधिक बिंदु भी कष्ट देंगे (8वें का स्वामी कमजोर)",
                    "prediction_english": "High points will still cause suffering (8th lord weak)"
                }
    
    @staticmethod
    def analyze_twelfth_house(house_12_points: int) -> Dict[str, Any]:
        """
        बारहवां भाव - खर्च
        < 28 = Saves money
        > 28 = Spends all income
        """
        if house_12_points < 28:
            return {
                "house": 12,
                "points": house_12_points,
                "verdict": "बहुत शुभ",
                "prediction_hindi": "पैसे को व्यर्थ बर्बाद नहीं करेगा, संभाल कर रखेगा",
                "prediction_english": "Will not waste money, will save"
            }
        else:
            return {
                "house": 12,
                "points": house_12_points,
                "verdict": "खुला खर्च",
                "prediction_hindi": "जितनी इनकम होगी उतना ही खर्च",
                "prediction_english": "Will spend all income"
            }


# ============================================================================
# MODULE 13: KARMA VS BHAGYA (कर्म vs भाग्य)
# ============================================================================

class KarmaBhagyaAnalyzer:
    """
    9th house (Bhagya) vs 10th house (Karma) comparison
    """
    
    @staticmethod
    def analyze(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        If 9th > 10th: More luck, less effort
        If 10th > 9th: More effort, less luck
        """
        house_9_points = ashtakvarga_points.get(9, 0)
        house_10_points = ashtakvarga_points.get(10, 0)
        
        if house_9_points > house_10_points:
            return {
                "dominant": "Bhagya (Luck)",
                "house_9_points": house_9_points,
                "house_10_points": house_10_points,
                "prediction_hindi": "कम मेहनत में ज्यादा भाग्य का साथ। कम परिश्रम पर अपार सफलता",
                "prediction_english": "More luck with less effort. Great success with minimal hard work"
            }
        elif house_10_points > house_9_points:
            return {
                "dominant": "Karma (Hard Work)",
                "house_9_points": house_9_points,
                "house_10_points": house_10_points,
                "prediction_hindi": "बहुत ज्यादा परिश्रम करना पड़ेगा, लाभ उस अनुपात में कम",
                "prediction_english": "Very hard work required, proportionally less profit"
            }
        else:
            return {
                "dominant": "Balanced",
                "prediction_hindi": "संतुलित कर्म और भाग्य",
                "prediction_english": "Balanced karma and luck"
            }


# ============================================================================
# MAIN EXPORT FUNCTION
# ============================================================================

def complete_ashtakvarga_analysis(ashtakvarga_points: Dict[int, int],
                                  sign_wise_points: Dict[int, int],
                                  planet_positions: Dict[str, Dict],
                                  has_rajyoga: bool = False,
                                  has_d1_dosha: bool = False,
                                  house_8_lord_strong: bool = False,
                                  current_dasha: str = "Jupiter",
                                  gender: str = "male") -> Dict[str, Any]:
    """
    Complete Ashtakvarga analysis with all 13 modules.

    ✅ ROTATION NOTE (important):
        ashtakvarga_points MUST already be lagna-rotated before calling this function.
        i.e. key 1 = Lagna ka score, key 2 = 2nd house score, etc.
        Rotation is done in engines_bridge.py → sav_to_house_dict(sav_points, lagna_rashi)
        Is function ke andar koi rotation nahi hoti — data as-is use hota hai.

        sign_wise_points (0-11) = rashi-wise (rotation nahi, lagna-independent)
        LuckyDirectionFinder isi se direction nikalta hai — sahi hai.

    Args:
        ashtakvarga_points : Lagna-rotated house-wise SAV points {1: score, 2: score, ...}
        sign_wise_points   : Rashi-wise SAV points {0: score (Mesha), ..., 11: score (Meena)}
        planet_positions   : Planet house positions {"Jupiter": {"house": 5}, ...}
        has_rajyoga        : D1 chart mein rajyoga hai?
        has_d1_dosha       : D1 chart mein dosha hai?
        house_8_lord_strong: 8th house ka lord strong hai?
        current_dasha      : Current mahadasha planet (English name)
        gender             : "male" or "female"

    Returns:
        Complete analysis dictionary with all 13 modules
    """
    results = {}
    
    # Module 1: Life Prosperity
    results['life_prosperity'] = LifeProsperityCalculator.calculate_prosperity_index(ashtakvarga_points)
    
    # Module 2: Struggle Meter
    results['struggle_meter'] = StruggleMeter.calculate_struggle_level(ashtakvarga_points)
    
    # Module 3: Spouse Dominance
    results['spouse_dominance'] = SpouseDominanceCalculator.calculate_dominance(ashtakvarga_points, gender)
    
    # Module 4: Career Type
    results['career_type'] = CareerTypePredictor.predict_career_type(ashtakvarga_points)
    
    # Module 5: 8th House Destruction
    results['8th_house_destruction'] = EighthHouseDestructiveLogic.analyze_8th_house_destruction(ashtakvarga_points)
    
    # Module 6: Lucky Direction
    results['lucky_direction'] = LuckyDirectionFinder.calculate_lucky_direction(sign_wise_points)
    
    # Module 7: Age Calculator
    sorrow_ages = AgeCalculator.calculate_all_sorrow_ages(planet_positions, ashtakvarga_points)
    happiness_ages = AgeCalculator.calculate_all_happiness_ages(planet_positions, ashtakvarga_points)
    age_conflict = AgeCalculator.resolve_age_conflict(sorrow_ages, happiness_ages, current_dasha)
    
    results['age_analysis'] = {
        "sorrow_ages": sorrow_ages,
        "happiness_ages": happiness_ages,
        "conflict_resolution": age_conflict
    }
    
    # Module 8: Business Success
    results['business_success'] = BusinessSuccessPredictor.predict_business_success(has_rajyoga, ashtakvarga_points)
    
    # Module 9: Jupiter Override
    # ✅ FIX: Jupiter ka actual house nikalo planet_positions se
    # Pehle "Jupiter" key try karo, phir "Ju" fallback
    _ju_data = planet_positions.get("Jupiter") or planet_positions.get("Ju") or {}
    _ju_house = _ju_data.get("house", 0)
    # Jupiter ke bhav ka SAV score = uski actual strength
    jupiter_strength = ashtakvarga_points.get(_ju_house, 0) if _ju_house else 0
    results['jupiter_override'] = JupiterOverrideChecker.check_jupiter_override(has_d1_dosha, jupiter_strength)
    
    # Module 10: Reverse Logic Houses
    results['reverse_logic_houses'] = {
        "house_6": ReversseLogicHouses.analyze_sixth_house(ashtakvarga_points.get(6, 0)),
        "house_8": ReversseLogicHouses.analyze_eighth_house(ashtakvarga_points.get(8, 0), house_8_lord_strong),
        "house_12": ReversseLogicHouses.analyze_twelfth_house(ashtakvarga_points.get(12, 0))
    }
    
    # Module 11: Karma vs Bhagya
    results['karma_bhagya'] = KarmaBhagyaAnalyzer.analyze(ashtakvarga_points)
    
    return {
        "success": True,
        "analysis": results,
        "version": "1.0.0"
    }


# Example usage
if __name__ == "__main__":
    sample_ashtakvarga = {
        1: 30, 2: 25, 3: 28, 4: 32, 5: 29, 6: 22,
        7: 27, 8: 26, 9: 31, 10: 33, 11: 30, 12: 20
    }
    
    sample_sign_points = {
        0: 28, 1: 30, 2: 25, 3: 29, 4: 31, 5: 27,
        6: 26, 7: 24, 8: 32, 9: 30, 10: 28, 11: 22
    }
    
    sample_planets = {
        "Saturn": {"house": 8},
        "Mars": {"house": 3},
        "Sun": {"house": 1},
        "Jupiter": {"house": 5},
        "Venus": {"house": 7}
    }
    
    result = complete_ashtakvarga_analysis(
        ashtakvarga_points=sample_ashtakvarga,
        sign_wise_points=sample_sign_points,
        planet_positions=sample_planets,
        has_rajyoga=True,
        current_dasha="Jupiter",
        gender="male"
    )
    
    print("Complete Ashtakvarga Analysis Done!")
    print(f"Modules analyzed: {len(result['analysis'])}")