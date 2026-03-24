"""
Advanced Vedic Astrology Sutras - 100+ Classical Rules
========================================================
Additional modules covering wealth flow, rajyoga activation, Rahu mysteries,
Labhesh analysis, and 100 evergreen sutras.

Based on classical texts and advanced Vedic principles.
"""

from typing import Dict, List, Any, Tuple
import math


# ============================================================================
# MODULE 1: CONTINUOUS WEALTH FLOW (निरंतर धन आगमन)
# ============================================================================

class ContinuousWealthFlowAnalyzer:
    """
    Analyzes if wealth flows easily or with interruptions
    Formula: 11th > 10th AND 11th > 12th
    """
    
    @staticmethod
    def analyze(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        निरंतर धन आगमन की जांच
        """
        house_10_points = ashtakvarga_points.get(10, 0)
        house_11_points = ashtakvarga_points.get(11, 0)
        house_12_points = ashtakvarga_points.get(12, 0)
        
        has_continuous_wealth = (house_11_points > house_10_points and 
                                house_11_points > house_12_points)
        
        return {
            "house_10_points": house_10_points,
            "house_11_points": house_11_points,
            "house_12_points": house_12_points,
            "continuous_wealth_flow": has_continuous_wealth,
            "prediction_hindi": "धन का आगमन पर्याप्त रूप से और आसानी से बना रहेगा। कम मेहनत में भी आर्थिक स्थिति ठीक रहेगी।" 
                               if has_continuous_wealth
                               else "धन के लिए निरंतर प्रयास करना पड़ेगा, रुक-रुक कर आएगा।",
            "prediction_english": "Wealth will flow easily and continuously. Even with less effort, financial status remains good."
                                if has_continuous_wealth
                                else "Continuous effort needed for wealth, will come intermittently."
        }


# ============================================================================
# MODULE 2: AGE OF RAJYOGA ACTIVATION (राजयोग उदय की उम्र)
# ============================================================================

class RajyogaActivationAgeCalculator:
    """
    Calculates age when Rajyoga will activate
    Formula: Lagna points = Age of activation
    """
    
    @staticmethod
    def calculate(has_rajyoga_in_d1: bool, ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        राजयोग किस उम्र में चालू होगा
        """
        if not has_rajyoga_in_d1:
            return {
                "has_rajyoga": False,
                "message": "D1 कुंडली में कोई राजयोग/धन योग नहीं है"
            }
        
        lagna_points = ashtakvarga_points.get(1, 0)
        activation_age = lagna_points
        
        return {
            "has_rajyoga": True,
            "lagna_points": lagna_points,
            "activation_age": activation_age,
            "prediction_hindi": f"{activation_age} वर्ष की आयु में जातक किसी ऐसे कार्य में लगेगा जहाँ से राजयोग शुरू होगा और प्रसिद्धि मिलेगी।",
            "prediction_english": f"At age {activation_age}, native will engage in work that triggers Rajyoga and brings fame.",
            "advice": "इस उम्र के आसपास बड़े निर्णय लें और अवसरों को न चूकें"
        }


# ============================================================================
# MODULE 3: DREAM HOUSE & VEHICLE (ड्रीम हाउस और वाहन सुख)
# ============================================================================

class DreamPropertyAnalyzer:
    """
    Analyzes if person will get dream house, land, vehicle
    Formula: 4th house >= 30 points + benefic aspect
    """
    
    @staticmethod
    def analyze(ashtakvarga_points: Dict[int, int], 
               house_4_has_benefic: bool) -> Dict[str, Any]:
        """
        ड्रीम हाउस, जमीन, गाड़ी योग
        """
        house_4_points = ashtakvarga_points.get(4, 0)
        
        has_dream_property = (house_4_points >= 30 and house_4_has_benefic)
        
        benefics_list = ["चंद्रमा (शुक्ल पक्ष)", "बुध", "गुरु", "शुक्र"]
        
        return {
            "house_4_points": house_4_points,
            "has_benefic_influence": house_4_has_benefic,
            "will_get_dream_property": has_dream_property,
            "prediction_hindi": "मनमाफिक सुख मिलेगा। ड्रीम हाउस, ड्रीम लैंड और ड्रीम वाहन अवश्य प्राप्त होगा।"
                               if has_dream_property
                               else f"4थे भाव में {'30 से कम अंक' if house_4_points < 30 else 'शुभ ग्रह का प्रभाव नहीं'}",
            "required_benefics": benefics_list,
            "current_status": "योग पूर्ण" if has_dream_property else "योग अधूरा"
        }


# ============================================================================
# MODULE 4: VARGOTTAMA PLANET STRENGTH (वर्गोत्तम ग्रह प्रभाव)
# ============================================================================

class VargottamaPlanetAnalyzer:
    """
    Analyzes strength of Vargottama planets
    Vargottama = Same sign in D1 and D9
    """
    
    @staticmethod
    def analyze(planet: str, is_vargottama: bool, 
               sign_points: int) -> Dict[str, Any]:
        """
        वर्गोत्तम ग्रह का असर
        """
        if not is_vargottama:
            return {
                "is_vargottama": False,
                "message": f"{planet} वर्गोत्तम नहीं है"
            }
        
        strength_percentage = min(100, (sign_points / 30) * 100) if sign_points < 30 else 100
        
        if sign_points >= 30:
            verdict = "100% शुभ परिणाम"
            effect = "पूर्ण लाभ"
        else:
            verdict = f"{int(strength_percentage)}% शुभ परिणाम"
            effect = "धीमा लाभ"
        
        return {
            "planet": planet,
            "is_vargottama": True,
            "sign_points": sign_points,
            "strength_percentage": strength_percentage,
            "verdict": verdict,
            "effect": effect,
            "prediction_hindi": f"{planet} वर्गोत्तम है और {sign_points} अंक हैं, इसलिए {verdict} देगा।",
            "note": "30 से कम अंक होने पर शुभ प्रभाव धीमा हो जाता है" if sign_points < 30 else None
        }


# ============================================================================
# MODULE 5: 10TH HOUSE CAREER POWER (दशम भाव करियर शक्ति)
# ============================================================================

class TenthHouseCareerAnalyzer:
    """
    Career excellence through 10th house malefics
    Formula: 10th > 30 points + malefic planet
    """
    
    MALEFICS = ["Sun", "Mars", "Saturn", "Rahu"]
    
    @staticmethod
    def analyze(ashtakvarga_points: Dict[int, int],
               planets_in_10th: List[str]) -> Dict[str, Any]:
        """
        दशम भाव और करियर में चमक
        """
        house_10_points = ashtakvarga_points.get(10, 0)
        
        malefics_present = [p for p in planets_in_10th 
                          if p in TenthHouseCareerAnalyzer.MALEFICS]
        
        # CRITICAL EXCEPTION: Ketu alone is bad
        ketu_alone = planets_in_10th == ["Ketu"]
        
        has_career_yoga = (house_10_points > 30 and 
                          len(malefics_present) > 0 and 
                          not ketu_alone)
        
        if ketu_alone:
            return {
                "house_10_points": house_10_points,
                "planets": planets_in_10th,
                "special_case": "Ketu Alone",
                "verdict": "बहुत खराब",
                "prediction_hindi": "केतु अकेला 10वें में है - पूरा जीवन और करियर भारी उतार-चढ़ाव में गुजरेगा।",
                "prediction_english": "Ketu alone in 10th - entire life and career full of ups and downs."
            }
        
        if has_career_yoga:
            return {
                "house_10_points": house_10_points,
                "malefics_present": malefics_present,
                "has_career_excellence": True,
                "prediction_hindi": "करियर में चार चांद लग जाएंगे। पराक्रम और शूरवीरता से बहुत शुभ परिणाम।",
                "prediction_english": "Career will shine brilliantly. Great results through valor and hard work."
            }
        
        return {
            "house_10_points": house_10_points,
            "planets": planets_in_10th,
            "has_career_excellence": False,
            "reason": "10वें में 30 से कम अंक या पाप ग्रह नहीं"
        }


# ============================================================================
# MODULE 6: SUDDEN FORTUNE CALCULATOR (अचानक भाग्योदय)
# ============================================================================

class SuddenFortuneCalculator:
    """
    Analyzes sudden transformation from ₹1 to ₹100
    Formula: Lagna >= 25 AND 9th >= 29 + planets + malefic aspect
    """
    
    @staticmethod
    def analyze(ashtakvarga_points: Dict[int, int],
               lagna_has_planet: bool,
               house_9_has_planet: bool,
               has_malefic_aspect: bool) -> Dict[str, Any]:
        """
        अचानक कायाकल्प योग
        """
        lagna_points = ashtakvarga_points.get(1, 0)
        house_9_points = ashtakvarga_points.get(9, 0)
        
        all_conditions_met = (lagna_points >= 25 and
                             house_9_points >= 29 and
                             lagna_has_planet and
                             house_9_has_planet and
                             has_malefic_aspect)
        
        conditions = {
            "lagna_points_check": f"{lagna_points} >= 25" + (" ✓" if lagna_points >= 25 else " ✗"),
            "house_9_points_check": f"{house_9_points} >= 29" + (" ✓" if house_9_points >= 29 else " ✗"),
            "lagna_has_planet": "✓" if lagna_has_planet else "✗",
            "house_9_has_planet": "✓" if house_9_has_planet else "✗",
            "malefic_aspect": "✓" if has_malefic_aspect else "✗"
        }
        
        if all_conditions_met:
            return {
                "sudden_fortune_yoga": True,
                "conditions": conditions,
                "prediction_hindi": "अप्रत्याशित ढंग से कायाकल्प होता है। अचानक धन लाभ और उन्नति। मेहनत का कई गुना परिणाम मिलेगा।",
                "prediction_english": "Unexpected transformation. Sudden wealth and growth. Multiple times return on effort.",
                "multiplier": "Several times",
                "transformation_level": "₹1 → ₹100"
            }
        
        return {
            "sudden_fortune_yoga": False,
            "conditions": conditions,
            "missing_conditions": [k for k, v in conditions.items() if "✗" in str(v)]
        }


# ============================================================================
# MODULE 7: INCOME VS DEBT CALCULATOR (आय बनाम कर्ज)
# ============================================================================

class IncomeVsDebtCalculator:
    """
    Analyzes if income > expenses or debt will arise
    Formula: Sum(6+8+12) <= 76
    """
    
    @staticmethod
    def calculate(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        आय और व्यय का संतुलन
        """
        house_6 = ashtakvarga_points.get(6, 0)
        house_8 = ashtakvarga_points.get(8, 0)
        house_12 = ashtakvarga_points.get(12, 0)
        
        total_sum = house_6 + house_8 + house_12
        threshold = 76
        
        is_favorable = total_sum <= threshold
        
        return {
            "house_6_points": house_6,
            "house_8_points": house_8,
            "house_12_points": house_12,
            "total_sum": total_sum,
            "threshold": threshold,
            "is_favorable": is_favorable,
            "difference": abs(total_sum - threshold),
            "prediction_hindi": f"आय अधिक रहेगी, व्यय/खर्च कम रहेगा। (कुल {total_sum} <= {threshold})" 
                               if is_favorable
                               else f"खर्च का भार रहेगा। भारी कर्ज की संभावना। (कुल {total_sum} > {threshold})",
            "prediction_english": f"Income will be higher, expenses lower. (Total {total_sum} <= {threshold})"
                                if is_favorable
                                else f"Burden of expenses. High debt possibility. (Total {total_sum} > {threshold})",
            "financial_health": "Good" if is_favorable else "Needs Attention"
        }


# ============================================================================
# MODULE 8: LIFE GRAPH ANALYZER (जीवन का ग्राफ)
# ============================================================================

class LifeGraphAnalyzer:
    """
    Creates life graph like stock market based on transit
    Analyzes ups and downs in life
    """
    
    @staticmethod
    def calculate_graph(ashtakvarga_points: Dict[int, int]) -> Dict[str, Any]:
        """
        जीवन का ग्राफ बनाएं
        """
        # Calculate differences between consecutive houses
        differences = {}
        volatility_score = 0
        
        for house in range(1, 12):
            next_house = house + 1
            current_points = ashtakvarga_points.get(house, 0)
            next_points = ashtakvarga_points.get(next_house, 0)
            
            diff = abs(current_points - next_points)
            differences[f"{house}-{next_house}"] = {
                "house_pair": f"{house}th to {next_house}th",
                "current": current_points,
                "next": next_points,
                "difference": diff,
                "volatility": "High" if diff > 10 else "Low"
            }
            
            volatility_score += diff
        
        avg_volatility = volatility_score / 11
        
        return {
            "differences": differences,
            "total_volatility": volatility_score,
            "average_volatility": round(avg_volatility, 2),
            "life_stability": "Stable" if avg_volatility < 5 else "Moderate" if avg_volatility < 10 else "Highly Volatile",
            "prediction_hindi": "जीवन में उतार-चढ़ाव बहुत कम होंगे" if avg_volatility < 5
                               else "जीवन में मध्यम उतार-चढ़ाव" if avg_volatility < 10
                               else "जीवन में भारी उतार-चढ़ाव होंगे",
            "advice": "गोचर में low से high points वाली राशि की ओर जाना = Growth, high से low = Downfall"
        }
    
    @staticmethod
    def analyze_transit_direction(from_sign_points: int, 
                                  to_sign_points: int) -> Dict[str, str]:
        """
        गोचर की दिशा - उछाल या पतन
        """
        if to_sign_points > from_sign_points:
            return {
                "direction": "Low to High",
                "effect": "Growth/Up",
                "prediction_hindi": "गोचर व्यक्ति को करियर और जीवन में उछाल देगा",
                "prediction_english": "Transit will bring growth in career and life"
            }
        elif to_sign_points < from_sign_points:
            return {
                "direction": "High to Low",
                "effect": "Decline/Down",
                "prediction_hindi": "गोचर जीवन में पतन/downfall लाएगा",
                "prediction_english": "Transit will bring downfall in life"
            }
        else:
            return {
                "direction": "Equal",
                "effect": "Stable",
                "prediction_hindi": "स्थिर स्थिति",
                "prediction_english": "Stable situation"
            }


# ============================================================================
# MODULE 9: RAHU SPECIAL ANALYZER (राहु के रहस्य)
# ============================================================================

class RahuMysteryAnalyzer:
    """
    Complete Rahu analysis with all special yogas and effects
    """
    
    @staticmethod
    def pishach_yoga_check(rahu_in_lagna: bool, moon_in_lagna: bool,
                          malefic_in_5_or_9: bool) -> Dict[str, Any]:
        """
        पिशाच योग - भूत-प्रेत बाधा
        """
        has_pishach_yoga = (rahu_in_lagna and moon_in_lagna and malefic_in_5_or_9)
        
        if has_pishach_yoga:
            return {
                "pishach_yoga": True,
                "severity": "Extreme",
                "prediction_hindi": "भयंकर पिशाच योग! सफलता गलत कार्यों से मिलती है और अंत में बर्बादी। पिशाच बाधा की प्रबल संभावना।",
                "prediction_english": "Severe Pishach Yoga! Success through wrong means leads to destruction. Strong possibility of evil spirits.",
                "remedy": "देवी दुर्गा/महिषासुर मर्दिनी की पूजा करें",
                "warning": "दीपक की लौ में पतंगे की तरह जलकर बर्बाद होने का योग"
            }
        
        return {"pishach_yoga": False}
    
    @staticmethod
    def rahu_rajyoga_check(rahu_in_kendra: bool, rahu_in_trikona: bool,
                          conjunction_planet: str, is_kendra_lord: bool,
                          is_trikona_lord: bool) -> Dict[str, Any]:
        """
        राहु का अति-प्रबल राजयोग
        """
        # Kendra-Trikona lords
        eligible_planets = ["Mercury", "Venus", "Saturn"]
        
        # Condition A: Rahu in Kendra + Mercury/Venus/Saturn (who are Trikona lords)
        condition_a = (rahu_in_kendra and 
                      conjunction_planet in eligible_planets and 
                      is_trikona_lord)
        
        # Condition B: Rahu in Trikona + Mercury/Venus/Saturn (who are Kendra lords)
        condition_b = (rahu_in_trikona and 
                      conjunction_planet in eligible_planets and 
                      is_kendra_lord)
        
        if condition_a or condition_b:
            return {
                "rahu_rajyoga": True,
                "level": "Extreme",
                "prediction_hindi": "फर्श से अर्श तक (जीरो से हीरो) पहुंचाने वाला तगड़ा राजयोग",
                "prediction_english": "Extremely powerful Rajyoga taking from zero to hero",
                "conjunction_with": conjunction_planet,
                "transformation": "Complete life transformation"
            }
        
        return {"rahu_rajyoga": False}
    
    @staticmethod
    def rahu_house_effects(rahu_house: int) -> Dict[str, Any]:
        """
        राहु के भाव 1-12 तक का पूर्ण फलादेश
        """
        effects = {
            1: {
                "nature": "चतुर, स्वार्थी, रहस्यमई",
                "career": "नौकरी से विख्यात सफलता (signs 1-6, 10)",
                "danger_age": 5,
                "danger": "शारीरिक कष्ट"
            },
            2: {
                "nature": "निंदित वचन, बातों का जादूगर",
                "danger_age": "12-24",
                "danger": "पिता के धन का नाश, नशा/चर्म रोग",
                "warning": "झूठ से फंसाने वाला"
            },
            3: {
                "effect": "बहुत उत्तम - धन, यश, पराक्रम",
                "danger": "भाई और पशुओं को खतरा, श्वास नली संक्रमण",
                "special": "बुध के साथ हो तो डरपोक/कायर बनाता है"
            },
            4: {
                "effect": "यात्राएं",
                "danger_age": 8,
                "danger": "परिवार में प्रेम का अभाव, माता को चर्म रोग, भाई को खतरा"
            },
            5: {
                "nature": "राजनैतिक बुद्धि, दूसरों की चाल भांपना",
                "danger_age": 5,
                "danger": "निर्णय क्षमता कमजोर, गैस/पेट की बीमारी",
                "warning": "सरकारी अधिकारियों से पंगा न लें"
            },
            6: {
                "effect": "अति उत्तम - शत्रु का नाश",
                "special_yoga": "मंगल+राहु = लक्ष्मी योग",
                "danger_age": "21 या 37",
                "danger": "पशुओं से डर, कमर दर्द, बड़ी उम्र की स्त्री से अफेयर"
            },
            7: {
                "effect": "पति-पत्नी में मिसअंडरस्टैंडिंग",
                "danger_age": 37,
                "danger": "विधवा स्त्रियों से संबंध, पति/पत्नी को भारी कष्ट"
            },
            8: {
                "effect": "बिल्कुल अच्छा नहीं - काम में रुकावट",
                "danger_age": "25 या 32",
                "danger": "झूठे आरोप, धन हानि, सांप के सपने",
                "health": "जननेंद्रिय रोग, बवासीर, हाइड्रोसील"
            },
            9: {
                "nature": "नीच कर्म, धर्म में रुचि नहीं",
                "danger_age": "19 या 29",
                "danger": "स्वास्थ्य पर संकट"
            },
            10: {
                "effect": "धनवान, विद्वान, शास्त्रों का ज्ञाता",
                "danger_age": 54,
                "danger": "गैस की बीमारी, हथियार से भय, पैसा चोरी/फ्रॉड"
            },
            11: {
                "effect": "अति उत्तम - धन, वस्त्र, आभूषण, सम्मान",
                "danger_age": 45,
                "danger": "धन या संतान से भय"
            },
            12: {
                "nature": "कपटी, प्रपंची, विदेश यात्रा",
                "danger": "जन्मस्थान छुड़वाकर हॉस्टल/बाहर, चर्म रोग"
            }
        }
        
        return effects.get(rahu_house, {"effect": "Unknown house"})


# ============================================================================
# MODULE 10: LABHESH (11TH LORD) COMPLETE ANALYZER
# ============================================================================

class LabheshCompleteAnalyzer:
    """
    Complete 11th house lord analysis - desires fulfillment
    """
    
    @staticmethod
    def trikona_execution_advice(labhesh_house: int) -> Dict[str, str]:
        """
        त्रिकोण के अनुसार इच्छाएं कैसे पूरी होंगी
        """
        # Artha Trikona: 2, 6, 10
        if labhesh_house in [2, 6, 10]:
            return {
                "trikona": "Artha (अर्थ)",
                "method": "पैसे से इच्छाएं पूरी होंगी",
                "advice": "₹100 को ₹110 बनाने का सोचें। कर्म करें, धन आएगा।",
                "nature": "दिखावा अधिक करेगा"
            }
        
        # Dharma Trikona: 1, 5, 9
        elif labhesh_house in [1, 5, 9]:
            return {
                "trikona": "Dharma (धर्म)",
                "method": "धर्म पालन से लाभ",
                "advice": "चोरी, बेईमानी से इच्छाएं पूरी नहीं होंगी",
                "nature": "शो-बाजी/दिखावा नहीं करेगा"
            }
        
        # Moksha Trikona: 4, 8, 12
        elif labhesh_house in [4, 8, 12]:
            return {
                "trikona": "Moksha (मोक्ष)",
                "method": "निस्वार्थ भाव से काम",
                "advice": "फल की इच्छा न करें। दिखावे से दूर रहें।",
                "warning": "फल की इच्छा = दिक्कत शुरू"
            }
        
        # Kama Trikona: 3, 7, 11
        else:  # 3, 7, 11
            return {
                "trikona": "Kama (काम)",
                "method": "मैनपॉवर से काम",
                "advice": "अकेले काम न करें, दूसरों को लगाएं। यथार्थ सपने देखें।",
                "warning": "आसक्ति बहुत ज्यादा बढ़ेगी"
            }
    
    @staticmethod
    def labhesh_in_houses(labhesh_house: int) -> Dict[str, Any]:
        """
        लाभेश का भाव 1-12 में प्लेसमेंट
        """
        placements = {
            1: {
                "effect": "जन्म के बाद परिवार अमीर और सुखी",
                "detail": "पिता अधिक मेहनत करेंगे, बना-बनाया प्लेटफॉर्म मिलेगा"
            },
            2: {
                "effect": "धन से इच्छाएं पूरी",
                "upaya": "कुटुंबी जनों से बैर न करें, वाणी का अच्छा प्रयोग करें"
            },
            3: {
                "effect": "उम्र के साथ धीरे-धीरे पूर्ति",
                "upaya": "बिज़नेस में मैनपॉवर रखें, छोटे भाई-बहनों से संबंध अच्छे रखें"
            },
            4: {
                "effect_good": "भूमि, भवन, वाहन सब मिलेंगे",
                "effect_bad": "माता को कष्ट (11वां 4थे से 8वां)",
                "upaya": "लाभेश के ग्रह का रंग घर में guest की तरह सम्मान दें"
            },
            5: {
                "effect": "अति उत्तम! बुद्धि से लाभ",
                "detail": "संतान प्राप्ति के बाद इच्छाएं तेजी से बढ़ेंगी"
            },
            6: {
                "effect_bad": "लोन लेकर फंस जाएगा (षडाष्टक)",
                "exception": "हॉस्पिटल या loan-recovery में अच्छा",
                "warning": "बीमारी का कारण बनने वाली इच्छाएं"
            },
            7: {
                "effect": "विवाह चुनने में नखरे, व्यापार में सफल",
                "detail": "अच्छे साझेदार मिलेंगे, विवाह के बाद सुख-भोग बढ़ेगा"
            },
            8: {
                "effect": "गुप्त और छिपी इच्छाएं",
                "detail": "नंबर दो के काम से पैसे कमाना चाहेगा"
            },
            9: {
                "effect": "पिता का ख्याल + तीर्थ यात्रा",
                "upaya": "लाभ का हिस्सा गरीबों को दान करें"
            },
            10: {
                "effect": "अति महत्वाकांक्षी, अमीर बनने की चाहत",
                "medical": "पैर के घुटनों में तकलीफ"
            },
            11: {
                "effect": "अति उत्तम (स्वराशि)",
                "detail": "घर का बहुत अच्छा management"
            },
            12: {
                "effect": "सरकारी खजाने में टैक्स योगदान, विदेश",
                "upaya": "निस्वार्थ दान करें या अस्पताल में पैसे दें"
            }
        }
        
        return placements.get(labhesh_house, {"effect": "Unknown"})


# ============================================================================
# MAIN EXPORT FUNCTION
# ============================================================================

def advanced_sutras_analysis(chart_data: Dict[str, Any], 
                            ashtakvarga_points: Dict[int, int],
                            sign_points: Dict[int, int]) -> Dict[str, Any]:
    """
    Complete advanced sutras analysis
    
    Args:
        chart_data: Complete birth chart
        ashtakvarga_points: House-wise Ashtakvarga points
        sign_points: Sign-wise Ashtakvarga points
    
    Returns:
        All advanced analysis results
    """
    results = {}
    
    # Module 1: Continuous Wealth Flow
    results['continuous_wealth'] = ContinuousWealthFlowAnalyzer.analyze(ashtakvarga_points)
    
    # Module 2: Rajyoga Activation Age
    has_rajyoga = chart_data.get('has_rajyoga', False)
    results['rajyoga_age'] = RajyogaActivationAgeCalculator.calculate(has_rajyoga, ashtakvarga_points)
    
    # Module 3: Dream Property
    house_4_benefic = chart_data.get('house_4_has_benefic', False)
    results['dream_property'] = DreamPropertyAnalyzer.analyze(ashtakvarga_points, house_4_benefic)
    
    # Module 7: Income vs Debt
    results['income_vs_debt'] = IncomeVsDebtCalculator.calculate(ashtakvarga_points)
    
    # Module 8: Life Graph
    results['life_graph'] = LifeGraphAnalyzer.calculate_graph(ashtakvarga_points)
    
    return {
        "success": True,
        "analysis": results,
        "version": "2.0.0 - Advanced Sutras"
    }


if __name__ == "__main__":
    # Example usage
    sample_ashtakvarga = {
        1: 28, 2: 26, 3: 24, 4: 32, 5: 30, 6: 22,
        7: 27, 8: 25, 9: 31, 10: 34, 11: 35, 12: 20
    }
    
    sample_chart = {
        "has_rajyoga": True,
        "house_4_has_benefic": True
    }
    
    result = advanced_sutras_analysis(sample_chart, sample_ashtakvarga, {})
    print("Advanced Sutras Analysis Complete!")
    print(f"Modules: {len(result['analysis'])}")
