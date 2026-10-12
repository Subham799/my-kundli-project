"""
Comprehensive Vedic Analysis Engine - सम्पूर्ण ज्योतिष विश्लेषण
=================================================================
All classical sutras and perspectives in one system.
Multiple analysis methods for same question - user decides final answer.

Author: AI Assistant
Date: March 8, 2026
"""

from typing import Dict, List, Any, Tuple
import math


# ============================================================================
# MODULE 1: HEALTH & HAPPINESS ANALYZER (स्वास्थ्य और सुख विश्लेषण)
# ============================================================================

class HealthHappinessAnalyzer:
    """
    Analyzes lifelong health and happiness based on Lagna and Lagnesh.
    """
    
    @staticmethod
    def analyze_lifelong_health(chart_data: Dict) -> Dict[str, Any]:
        """
        Module 1: आजीवन सुखी और निरोगी योग
        """
        lagna_sign = chart_data.get('lagna_sign')
        lagnesh_position = chart_data.get('lagnesh_position', {})
        planet_positions = chart_data.get('planet_positions', {})
        
        # Get Lagnesh details
        lagnesh_planet = lagnesh_position.get('planet')
        lagnesh_sign = lagnesh_position.get('sign_index')
        lagnesh_house = lagnesh_position.get('house')
        lagnesh_is_exalted = lagnesh_position.get('is_exalted', False)
        lagnesh_is_own = lagnesh_position.get('is_own_sign', False)
        lagnesh_is_friend = lagnesh_position.get('is_friend_sign', False)
        
        # Check conditions for lifelong health
        conditions_met = []
        conditions_failed = []
        
        # Condition 1: No debilitated or enemy planet in Lagna
        lagna_planets = [p for p, data in planet_positions.items() 
                        if data.get('house') == 1]
        has_bad_planet_in_lagna = any(
            planet_positions[p].get('is_debilitated') or 
            planet_positions[p].get('is_enemy_sign')
            for p in lagna_planets if p in planet_positions
        )
        
        if not has_bad_planet_in_lagna:
            conditions_met.append("लग्न में कोई नीच या शत्रु ग्रह नहीं")
        else:
            conditions_failed.append("लग्न में नीच/शत्रु ग्रह मौजूद")
        
        # Condition 2: Lagnesh in own/exalted/friend sign
        if lagnesh_is_own or lagnesh_is_exalted or lagnesh_is_friend:
            conditions_met.append(f"लग्नेश {lagnesh_planet} अच्छी स्थिति में")
        else:
            conditions_failed.append("लग्नेश कमजोर स्थिति में")
        
        # Condition 3: Lagnesh not in 6, 8, 12
        if lagnesh_house not in [6, 8, 12]:
            conditions_met.append("लग्नेश 6/8/12 में नहीं")
        else:
            conditions_failed.append(f"लग्नेश {lagnesh_house}वें भाव में (दुष्ट भाव)")
        
        # Condition 4: Benefic aspect on Lagna/Lagnesh
        benefics = ['Jupiter', 'Venus', 'Moon', 'Mercury']
        has_benefic_aspect = False  # Simplified - would need aspect calculation
        
        is_healthy = len(conditions_met) >= 3
        
        return {
            "lifelong_health_yoga": is_healthy,
            "conditions_met": conditions_met,
            "conditions_failed": conditions_failed,
            "prediction": {
                "hindi": "जातक जीवन भर सुखी और बुढ़ापे तक निरोगी रहेगा" if is_healthy 
                        else "जातक शारीरिक सुख से हीन रहेगा या बीमार रहेगा",
                "english": "Native will remain happy and disease-free till old age" if is_healthy
                          else "Native will lack physical comforts or remain sick",
                "severity": "good" if is_healthy else "bad"
            }
        }
    
    @staticmethod
    def wealth_without_health_check(chart_data: Dict) -> Dict[str, Any]:
        """
        सुख का उपभोग न कर पाने का योग
        Wealth exists but can't enjoy it due to health issues
        """
        health_analysis = HealthHappinessAnalyzer.analyze_lifelong_health(chart_data)
        
        # Check if wealth yogas exist
        has_wealth_yoga = chart_data.get('has_wealth_yoga', False)
        is_unhealthy = not health_analysis['lifelong_health_yoga']
        
        if has_wealth_yoga and is_unhealthy:
            return {
                "yoga_present": True,
                "description_hindi": "सुख के साधन मिलेंगे लेकिन उपभोग नहीं कर पाएंगे",
                "description_english": "Wealth will come but cannot enjoy it",
                "example": "जब पैसे नहीं थे तो मिठाई नहीं खा सकते थे, जब पैसे आए तो डायबिटीज हो गई",
                "remedy": "स्वास्थ्य पर विशेष ध्यान दें, लग्नेश को बलवान करें"
            }
        
        return {
            "yoga_present": False,
            "description_hindi": "यह योग नहीं बन रहा",
            "description_english": "This combination is not forming"
        }


# ============================================================================
# MODULE 2: LAGNESH NATURE ANALYZER (लग्नेश स्वभाव विश्लेषण)
# ============================================================================

class LagneshNatureAnalyzer:
    """
    Analyzes personality and workplace dynamics based on Lagnesh position.
    """
    
    @staticmethod
    def comfort_vs_workaholic(lagnesh_house: int) -> Dict[str, str]:
        """
        चतुर्थ बनाम दशम भाव - आराम vs काम
        """
        if lagnesh_house == 4:
            return {
                "nature": "comfort_loving",
                "hindi": "व्यक्ति आराम पसंद होता है, सुखी जीवन जीता है",
                "english": "Person is comfort-loving, lives a relaxed life"
            }
        elif lagnesh_house == 10:
            return {
                "nature": "workaholic",
                "hindi": "व्यक्ति काम पसंद होता है, हमेशा काम में मगन रहता है",
                "english": "Person is workaholic, always engaged in work"
            }
        else:
            return {
                "nature": "balanced",
                "hindi": "संतुलित व्यक्तित्व",
                "english": "Balanced personality"
            }
    
    @staticmethod
    def workplace_betrayal_check(chart_data: Dict) -> Dict[str, Any]:
        """
        कार्यस्थल पर बॉस और विश्वासघात - Saturn aspect on Lagna/Lagnesh
        """
        saturn_aspects = chart_data.get('saturn_aspects', {})
        aspects_lagna = saturn_aspects.get('aspects_lagna', False)
        aspects_lagnesh = saturn_aspects.get('aspects_lagnesh', False)
        
        lagna_afflicted = chart_data.get('lagna_afflicted', False)
        
        has_betrayal_yoga = aspects_lagna or aspects_lagnesh
        
        if has_betrayal_yoga:
            severity = "extreme" if lagna_afflicted else "moderate"
            
            return {
                "betrayal_yoga": True,
                "severity": severity,
                "prediction_hindi": "कार्यस्थल पर अधिकारी/बॉस से अनबन होगी। विश्वासघात की संभावना है।",
                "prediction_english": "Conflicts with seniors at workplace. Betrayal possible.",
                "multiplier": "कई गुना बढ़ जाएगा" if lagna_afflicted else "सामान्य प्रभाव",
                "remedy": "शनि के उपाय करें, नीलम धारण करें (परीक्षण के बाद)"
            }
        
        return {
            "betrayal_yoga": False,
            "prediction_hindi": "कार्यस्थल पर सामान्य संबंध रहेंगे",
            "prediction_english": "Normal workplace relationships"
        }


# ============================================================================
# MODULE 3: AGE OF SUCCESS CALCULATOR (सफलता की आयु)
# ============================================================================

class AgeOfSuccessCalculator:
    """
    Calculates age when major success will come based on Jupiter/Venus in Kendras.
    """
    
    @staticmethod
    def calculate_success_age(chart_data: Dict) -> Dict[str, Any]:
        """
        30-35 वर्ष में पूर्ण सफलता का योग
        """
        planet_positions = chart_data.get('planet_positions', {})
        lagna_strong = chart_data.get('lagna_strong', False)
        lagnesh_strong = chart_data.get('lagnesh_strong', False)
        
        # Check Jupiter in Kendras (1, 4, 7, 10)
        jupiter_data = planet_positions.get('Jupiter', {})
        jupiter_house = jupiter_data.get('house')
        jupiter_in_kendra = jupiter_house in [1, 4, 7, 10]
        jupiter_not_combust = not jupiter_data.get('is_combust', False)
        jupiter_not_debilitated = not jupiter_data.get('is_debilitated', False)
        
        # Check Venus in Kendras
        venus_data = planet_positions.get('Venus', {})
        venus_house = venus_data.get('house')
        venus_in_kendra = venus_house in [1, 4, 7, 10]
        
        results = []
        
        if lagna_strong and lagnesh_strong and jupiter_in_kendra and jupiter_not_combust and jupiter_not_debilitated:
            results.append({
                "planet": "Jupiter",
                "age_range": "30-35 years",
                "prediction_hindi": "30-35 वर्ष की आयु में पूर्ण ऐश्वर्य, सुख और साधन प्राप्त होंगे। परिवार सुखी हो जाएगा।",
                "prediction_english": "Complete prosperity, happiness and resources at age 30-35. Family will be happy.",
                "level": "highest",
                "note": "बचपन दुखों में बीता हो तब भी यह योग काम करेगा"
            })
        
        if lagna_strong and lagnesh_strong and venus_in_kendra:
            results.append({
                "planet": "Venus",
                "age_range": "30-35 years",
                "prediction_hindi": "30-35 वर्ष में सफलता मिलेगी लेकिन गुरु से थोड़ा कम स्तर पर",
                "prediction_english": "Success at 30-35 but slightly lower scale than Jupiter",
                "level": "high",
                "note": "गुरु योग से कम लेकिन अच्छा परिणाम"
            })
        
        return {
            "success_yogas": results,
            "has_early_success": len(results) > 0
        }


# ============================================================================
# MODULE 4: TRIKONA EXECUTION LOGIC (त्रिकोण निष्पादन)
# ============================================================================

class TrikonaExecutionAnalyzer:
    """
    Dharma, Artha, Kama, Moksha Trikona analysis and life purpose guidance.
    """
    
    TRIKONAS = {
        "dharma": {
            "houses": [1, 5, 9],
            "signs": [0, 4, 8],  # Aries, Leo, Sagittarius
            "element": "Fire",
            "purpose": "धर्म और कर्तव्य"
        },
        "artha": {
            "houses": [2, 6, 10],
            "signs": [1, 5, 9],  # Taurus, Virgo, Capricorn
            "element": "Earth",
            "purpose": "धन और सांसारिक सुख"
        },
        "kama": {
            "houses": [3, 7, 11],
            "signs": [2, 6, 10],  # Gemini, Libra, Aquarius
            "element": "Air",
            "purpose": "इच्छाएं और आकांक्षाएं"
        },
        "moksha": {
            "houses": [4, 8, 12],
            "signs": [3, 7, 11],  # Cancer, Scorpio, Pisces
            "element": "Water",
            "purpose": "मोक्ष और वैराग्य"
        }
    }
    
    @staticmethod
    def count_planets_in_trikonas(chart_data: Dict) -> Dict[str, int]:
        """
        Count planets in each Trikona
        """
        planet_positions = chart_data.get('planet_positions', {})
        
        counts = {
            "dharma": 0,
            "artha": 0,
            "kama": 0,
            "moksha": 0
        }
        
        for planet, data in planet_positions.items():
            house = data.get('house')
            
            if house in TrikonaExecutionAnalyzer.TRIKONAS['dharma']['houses']:
                counts['dharma'] += 1
            if house in TrikonaExecutionAnalyzer.TRIKONAS['artha']['houses']:
                counts['artha'] += 1
            if house in TrikonaExecutionAnalyzer.TRIKONAS['kama']['houses']:
                counts['kama'] += 1
            if house in TrikonaExecutionAnalyzer.TRIKONAS['moksha']['houses']:
                counts['moksha'] += 1
        
        return counts
    
    @staticmethod
    def analyze_trikona_execution(chart_data: Dict, current_dasha: str) -> Dict[str, Any]:
        """
        Analyze how to execute planet's energy based on its Trikona placement
        """
        planet_positions = chart_data.get('planet_positions', {})
        dasha_planet = current_dasha
        
        if dasha_planet not in planet_positions:
            return {"error": "Dasha planet not found"}
        
        dasha_house = planet_positions[dasha_planet].get('house')
        
        # Determine which Trikona
        trikona_type = None
        for ttype, tdata in TrikonaExecutionAnalyzer.TRIKONAS.items():
            if dasha_house in tdata['houses']:
                trikona_type = ttype
                break
        
        guidance = {}
        
        if trikona_type == "dharma":
            guidance = {
                "trikona": "धर्म त्रिकोण",
                "good_approach_hindi": "धार्मिक कार्यों से जुड़ें, स्वधर्म निभाएं, दान-पुण्य करें",
                "good_approach_english": "Engage in dharma, fulfill duties, do charity",
                "good_result": "ग्रह शानदार फल देगा",
                "bad_approach_hindi": "केवल धन के पीछे भागना",
                "bad_approach_english": "Only chasing money",
                "bad_result": "भारी मानसिक तनाव मिलेगा"
            }
        
        elif trikona_type == "moksha":
            guidance = {
                "trikona": "मोक्ष त्रिकोण",
                "good_approach_hindi": "बिना परिणाम की चिंता किए निस्वार्थ भाव से काम करें",
                "good_approach_english": "Work without attachment to results (Nishkam Karma)",
                "good_result": "तनाव खत्म, बड़ी सफलता मिलेगी",
                "bad_approach_hindi": "उम्मीद/लालच के साथ टारगेट बनाना",
                "bad_approach_english": "Setting targets with expectations",
                "bad_result": "चिड़चिड़ापन, टेंशन और असफलता"
            }
        
        elif trikona_type == "artha":
            guidance = {
                "trikona": "अर्थ त्रिकोण",
                "good_approach_hindi": "पैसे को पैसे से जोड़ें (निवेश करें)",
                "good_approach_english": "Money makes money (invest wisely)",
                "good_result": "धन घर में टिकेगा",
                "bad_approach_hindi": "व्यर्थ खर्च करना",
                "bad_approach_english": "Wasteful spending",
                "bad_result": "धन नहीं टिकेगा"
            }
        
        elif trikona_type == "kama":
            guidance = {
                "trikona": "काम त्रिकोण",
                "good_approach_hindi": "सांसारिक इच्छाओं को पूरा करने में लगें",
                "good_approach_english": "Pursue material desires and relationships",
                "good_result": "इच्छा पूर्ति होगी",
                "bad_approach_hindi": "वैराग्य या त्याग की कोशिश",
                "bad_approach_english": "Trying to renounce",
                "bad_result": "मन में द्वंद्व"
            }
        
        return {
            "dasha_planet": dasha_planet,
            "house": dasha_house,
            "guidance": guidance
        }
    
    @staticmethod
    def career_focus_calculator(chart_data: Dict) -> Dict[str, Any]:
        """
        करियर फोकस - Artha vs Kama planet count
        """
        counts = TrikonaExecutionAnalyzer.count_planets_in_trikonas(chart_data)
        
        artha_count = counts['artha']
        kama_count = counts['kama']
        
        if artha_count > kama_count:
            return {
                "dominant_trikona": "Artha",
                "prediction_hindi": "कम प्रयास में अधिक धन मिलेगा",
                "prediction_english": "More wealth with less effort",
                "career_advice": "Business या high-paying job के लिए उत्तम"
            }
        elif kama_count > artha_count:
            return {
                "dominant_trikona": "Kama",
                "prediction_hindi": "भयंकर प्रयास करना पड़ेगा, धन कम मिलेगा",
                "prediction_english": "Very hard work required, less proportional wealth",
                "career_advice": "Networking और relationships पर फोकस करें"
            }
        else:
            return {
                "dominant_trikona": "Balanced",
                "prediction_hindi": "संतुलित प्रयास और परिणाम",
                "prediction_english": "Balanced effort and results"
            }
    
    @staticmethod
    def trikona_clash_analysis(chart_data: Dict) -> Dict[str, Any]:
        """
        त्रिकोण संघर्ष विश्लेषण
        """
        counts = TrikonaExecutionAnalyzer.count_planets_in_trikonas(chart_data)
        
        clashes = []
        
        # Artha + Moksha = Very bad
        if counts['artha'] >= 2 and counts['moksha'] >= 2:
            clashes.append({
                "type": "Artha + Moksha",
                "severity": "extreme_bad",
                "description_hindi": "भयंकर खराब! पैसा मोक्ष को रोकेगा और मोक्ष पैसे को रोकेगा",
                "description_english": "Extremely bad! Money blocks spirituality, spirituality blocks money",
                "remedy": "एक को चुनें - या तो गृहस्थ जीवन या त्याग"
            })
        
        # Artha + Dharma = Good
        if counts['artha'] >= 2 and counts['dharma'] >= 2:
            clashes.append({
                "type": "Artha + Dharma",
                "severity": "good",
                "description_hindi": "अच्छा संयोग! धन के साथ धर्म",
                "description_english": "Good combination! Wealth with righteousness"
            })
        
        # Artha + Kama = Good for worldly life
        if counts['artha'] >= 2 and counts['kama'] >= 2:
            clashes.append({
                "type": "Artha + Kama",
                "severity": "good",
                "description_hindi": "सांसारिक जीवन के लिए उत्तम",
                "description_english": "Excellent for worldly life"
            })
        
        return {
            "clashes_found": len(clashes),
            "clash_details": clashes
        }


# ============================================================================
# MODULE 5: DIPTANSHU CONJUNCTION ANALYZER (दीप्तांशु युति विश्लेषक)
# ============================================================================

class DiptanshuAnalyzer:
    """
    Analyzes conjunction strength using Orb of Influence (दीप्तांशु).
    """
    
    # Orb values in degrees
    DIPTANSHU = {
        "Sun": 15,
        "Moon": 12,
        "Mars": 8,
        "Mercury": 7,
        "Jupiter": 9,
        "Venus": 7,
        "Saturn": 9,
        "Rahu": 9,  # शनिवत
        "Ketu": 8   # कुजवत
    }
    
    @staticmethod
    def calculate_conjunction_strength(planet1: str, planet2: str, 
                                       degree1: float, degree2: float) -> Dict[str, Any]:
        """
        Calculate if conjunction is Prime (100%) or Dim (weak)
        
        Formula: (Dip1 + Dip2) / 2 = Max Effective Distance
        If actual difference <= Max, then Prime (100%)
        Else Dim (weak)
        """
        dip1 = DiptanshuAnalyzer.DIPTANSHU.get(planet1, 0)
        dip2 = DiptanshuAnalyzer.DIPTANSHU.get(planet2, 0)
        
        max_effective_distance = (dip1 + dip2) / 2
        actual_difference = abs(degree1 - degree2)
        
        is_prime = actual_difference <= max_effective_distance
        strength_percentage = 100 if is_prime else int((max_effective_distance / actual_difference) * 100)
        
        return {
            "planet1": planet1,
            "planet2": planet2,
            "planet1_degree": degree1,
            "planet2_degree": degree2,
            "max_effective_distance": max_effective_distance,
            "actual_difference": actual_difference,
            "is_prime_conjunction": is_prime,
            "strength_percentage": strength_percentage,
            "description_hindi": f"युति का प्रभाव {strength_percentage}% है" + 
                               (" (चरम स्तर/Prime Time)" if is_prime else " (कमजोर/Dim)"),
            "description_english": f"Conjunction strength is {strength_percentage}%" +
                                 (" (Prime Time)" if is_prime else " (Dim/Weak)"),
            "effect": "भयंकर और स्पष्ट परिणाम देगा" if is_prime else "फल के लिए तरसता रहेगा"
        }
    
    @staticmethod
    def analyze_multi_planet_conjunction(planets_data: List[Dict]) -> List[Dict]:
        """
        For 3+ planets in same house, analyze all pairwise combinations
        """
        results = []
        
        for i in range(len(planets_data)):
            for j in range(i+1, len(planets_data)):
                p1 = planets_data[i]
                p2 = planets_data[j]
                
                result = DiptanshuAnalyzer.calculate_conjunction_strength(
                    p1['planet'], p2['planet'],
                    p1['degree'], p2['degree']
                )
                results.append(result)
        
        return results
    
    @staticmethod
    def sun_combustion_analysis(sun_degree: float, planet: str, 
                                planet_degree: float, is_friend: bool) -> Dict[str, Any]:
        """
        सूर्य अस्तंगत विश्लेषण - Sun Combustion Override Logic
        """
        conjunction = DiptanshuAnalyzer.calculate_conjunction_strength(
            "Sun", planet, sun_degree, planet_degree
        )
        
        if not conjunction['is_prime_conjunction']:
            return {
                "is_combust": False,
                "description": "ग्रह सूर्य से दूर है, अस्त नहीं है"
            }
        
        if is_friend:
            return {
                "is_combust": True,
                "effect": "positive",
                "description_hindi": f"सूर्य {planet} की शुभता को स्वयं प्रदान करेगा",
                "description_english": f"Sun will provide the positive effects of {planet}",
                "example": "सूर्य-गुरु युति में समाज में सम्मान मिलेगा"
            }
        else:
            return {
                "is_combust": True,
                "effect": "negative",
                "description_hindi": f"{planet} सूर्य को पीड़ित करेगा, दुष्प्रभाव देगा",
                "description_english": f"{planet} will afflict Sun, giving bad effects",
                "example": "सूर्य-शनि युति में पिता-पुत्र संघर्ष"
            }
    
    @staticmethod
    def check_angarak_dosha(mars_degree: float, rahu_degree: float) -> Dict[str, Any]:
        """
        अंगारक दोष फ़िल्टर - True vs Fake Dosha
        """
        conjunction = DiptanshuAnalyzer.calculate_conjunction_strength(
            "Mars", "Rahu", mars_degree, rahu_degree
        )
        
        if conjunction['actual_difference'] > 8.5:
            return {
                "dosha_present": True,
                "dosha_severity": "weak",
                "description_hindi": "अंगारक दोष बन रहा है लेकिन अंशों की दूरी अधिक होने से जटिल या हानिकारक नहीं",
                "description_english": "Angarak Dosha is forming but not harmful due to degree distance",
                "advice": "डरने की आवश्यकता नहीं, सामान्य उपाय करें"
            }
        else:
            return {
                "dosha_present": True,
                "dosha_severity": "extreme",
                "description_hindi": "अंगारक दोष अपने पूर्ण चरम पर है",
                "description_english": "Angarak Dosha at full peak",
                "advice": "तत्काल उपाय करें - मंगल और राहु दोनों के उपाय"
            }


# ============================================================================
# MODULE 6: BHAVAT BHAVAM TIMING CALCULATOR (भावत भावम समय गणना)
# ============================================================================

class BhavatBhavamCalculator:
    """
    Calculates timing of events using Bhav, Bhavesh, Karak, Bhavat Bhavam logic.
    """
    
    # Default Karaks for each house
    HOUSE_KARAKS = {
        2: ["Jupiter"],  # Wealth
        4: ["Venus", "Moon"],  # Property, happiness
        5: ["Jupiter"],  # Children
        6: ["Mars", "Saturn"],  # Disease, enemies
        7: {"male": ["Venus"], "female": ["Jupiter"]},  # Marriage
        10: ["Mercury", "Sun", "Saturn"]  # Career
    }
    
    @staticmethod
    def extract_candidate_planets(target_house: int, chart_data: Dict, 
                                  gender: str = "male") -> List[str]:
        """
        Extract candidate planets for event timing
        
        5-step process:
        1. Bhavesh (Lord of target house)
        2. Karak (Significator)
        3. Bhavat Bhavam (Nth from Nth)
        4. Bhavesh placement (Nth from Bhavesh)
        5. Karak placement (Nth from Karak)
        """
        candidates = []
        planet_positions = chart_data.get('planet_positions', {})
        house_lords = chart_data.get('house_lords', {})
        
        # Step 1: Bhavesh
        bhavesh = house_lords.get(target_house)
        if bhavesh:
            candidates.append({
                "planet": bhavesh,
                "role": "Bhavesh",
                "description": f"{target_house}वें भाव का स्वामी"
            })
        
        # Step 2: Karak
        karaks = BhavatBhavamCalculator.HOUSE_KARAKS.get(target_house, [])
        if isinstance(karaks, dict):
            karaks = karaks.get(gender, [])
        
        for karak in karaks:
            candidates.append({
                "planet": karak,
                "role": "Karak",
                "description": f"{target_house}वें भाव का कारक ग्रह"
            })
        
        # Step 3: Bhavat Bhavam (Nth from Nth)
        bhavat_bhavam_house = ((target_house - 1) + (target_house - 1)) % 12 + 1
        bhavat_bhavam_lord = house_lords.get(bhavat_bhavam_house)
        if bhavat_bhavam_lord:
            candidates.append({
                "planet": bhavat_bhavam_lord,
                "role": "Bhavat Bhavam",
                "description": f"{target_house}वें से {target_house}वां = {bhavat_bhavam_house}वें भाव का स्वामी"
            })
        
        # Step 4: Bhavesh placement (Nth from where Bhavesh sits)
        if bhavesh and bhavesh in planet_positions:
            bhavesh_house = planet_positions[bhavesh].get('house', 1)
            nth_from_bhavesh = ((bhavesh_house - 1) + (target_house - 1)) % 12 + 1
            lord_of_nth = house_lords.get(nth_from_bhavesh)
            if lord_of_nth:
                candidates.append({
                    "planet": lord_of_nth,
                    "role": "Bhavesh Placement",
                    "description": f"भावेश से {target_house}वां = {nth_from_bhavesh}वें भाव का स्वामी"
                })
        
        # Step 5: Karak placement
        for karak in karaks:
            if karak in planet_positions:
                karak_house = planet_positions[karak].get('house', 1)
                nth_from_karak = ((karak_house - 1) + (target_house - 1)) % 12 + 1
                lord_of_nth = house_lords.get(nth_from_karak)
                if lord_of_nth:
                    candidates.append({
                        "planet": lord_of_nth,
                        "role": "Karak Placement",
                        "description": f"कारक से {target_house}वां = {nth_from_karak}वें भाव का स्वामी"
                    })
        
        return candidates
    
    @staticmethod
    def evaluate_planet_strength(planet: str, chart_data: Dict) -> Dict[str, Any]:
        """
        Evaluate if planet will give good or bad results
        
        Checks:
        - Dead degrees (0, 3, 27, 30)
        - Bad houses (6, 8, 12)
        - Retrograde exception (makes 6/8/12 good!)
        - Debilitation
        - Enemy sign
        """
        planet_positions = chart_data.get('planet_positions', {})
        
        if planet not in planet_positions:
            return {"error": "Planet not found"}
        
        p_data = planet_positions[planet]
        degree = p_data.get('degree', 0)
        house = p_data.get('house', 1)
        is_retrograde = p_data.get('is_retrograde', False)
        is_debilitated = p_data.get('is_debilitated', False)
        is_exalted = p_data.get('is_exalted', False)
        is_own_sign = p_data.get('is_own_sign', False)
        is_friend_sign = p_data.get('is_friend_sign', False)
        is_enemy_sign = p_data.get('is_enemy_sign', False)
        
        strength_points = 0
        weakness_points = 0
        
        # Check dead degrees
        if degree in [0, 3, 27, 30] or (0 <= degree <= 3) or (27 <= degree <= 30):
            weakness_points += 3
        
        # Check bad houses - CRITICAL EXCEPTION
        if house in [6, 8, 12]:
            if is_retrograde:
                # OVERRIDE: Retrograde in 6/8/12 is GOOD!
                strength_points += 2
            else:
                weakness_points += 2
        
        # Sign placement
        if is_exalted or is_own_sign:
            strength_points += 2
        elif is_friend_sign:
            strength_points += 1
        elif is_enemy_sign or is_debilitated:
            weakness_points += 2
        
        is_strong = strength_points > weakness_points
        
        return {
            "planet": planet,
            "strength_points": strength_points,
            "weakness_points": weakness_points,
            "is_strong": is_strong,
            "verdict": "शुभ फल देगा" if is_strong else "अशुभ फल/नुकसान देगा",
            "details": {
                "degree": degree,
                "house": house,
                "is_retrograde": is_retrograde,
                "retrograde_benefit": "वक्री होने से 6/8/12 में भी बलवान" if (house in [6,8,12] and is_retrograde) else None
            }
        }
    
    @staticmethod
    def predict_event_timing(target_house: int, chart_data: Dict, 
                            current_dashas: List[Dict], gender: str = "male") -> Dict[str, Any]:
        """
        Complete event timing prediction
        """
        # Get candidate planets
        candidates = BhavatBhavamCalculator.extract_candidate_planets(
            target_house, chart_data, gender
        )
        
        # Evaluate each candidate
        evaluated_candidates = []
        for candidate in candidates:
            planet = candidate['planet']
            strength = BhavatBhavamCalculator.evaluate_planet_strength(planet, chart_data)
            
            evaluated_candidates.append({
                **candidate,
                "strength_analysis": strength
            })
        
        # Find best candidate
        strong_candidates = [c for c in evaluated_candidates 
                           if c['strength_analysis']['is_strong']]
        
        # Check if any dasha matches
        matching_dashas = []
        for dasha in current_dashas:
            dasha_planet = dasha.get('planet')
            if any(c['planet'] == dasha_planet for c in strong_candidates):
                matching_dashas.append(dasha)
        
        return {
            "target_house": target_house,
            "all_candidates": evaluated_candidates,
            "strong_candidates": strong_candidates,
            "matching_dashas": matching_dashas,
            "prediction": "Event will happen in dasha of: " + 
                        ", ".join([c['planet'] for c in strong_candidates]) if strong_candidates
                        else "No strong candidate found"
        }


# ============================================================================
# EXPORT MAIN FUNCTION
# ============================================================================

def comprehensive_vedic_analysis(chart_data: Dict, analysis_type: str = "all") -> Dict[str, Any]:
    """
    Main function to perform comprehensive multi-perspective analysis
    
    Args:
        chart_data: Complete birth chart data
        analysis_type: "all" or specific module name
    
    Returns:
        Dictionary with all analysis results from different perspectives
    """
    results = {}
    
    if analysis_type in ["all", "health"]:
        health_analyzer = HealthHappinessAnalyzer()
        results['health_happiness'] = {
            "lifelong_health": health_analyzer.analyze_lifelong_health(chart_data),
            "wealth_without_health": health_analyzer.wealth_without_health_check(chart_data)
        }
    
    if analysis_type in ["all", "lagnesh"]:
        lagnesh_analyzer = LagneshNatureAnalyzer()
        lagnesh_position = chart_data.get('lagnesh_position', {})
        lagnesh_house = lagnesh_position.get('house', 1)
        
        results['lagnesh_nature'] = {
            "comfort_vs_work": lagnesh_analyzer.comfort_vs_workaholic(lagnesh_house),
            "workplace_betrayal": lagnesh_analyzer.workplace_betrayal_check(chart_data)
        }
    
    if analysis_type in ["all", "success_age"]:
        success_calc = AgeOfSuccessCalculator()
        results['age_of_success'] = success_calc.calculate_success_age(chart_data)
    
    if analysis_type in ["all", "trikona"]:
        trikona_analyzer = TrikonaExecutionAnalyzer()
        results['trikona_analysis'] = {
            "planet_counts": trikona_analyzer.count_planets_in_trikonas(chart_data),
            "career_focus": trikona_analyzer.career_focus_calculator(chart_data),
            "trikona_clashes": trikona_analyzer.trikona_clash_analysis(chart_data)
        }
    
    if analysis_type in ["all", "diptanshu"]:
        results['diptanshu_constants'] = DiptanshuAnalyzer.DIPTANSHU
    
    return {
        "success": True,
        "analysis": results,
        "timestamp": "2026-03-08",
        "version": "1.0.0"
    }


# Example usage
if __name__ == "__main__":
    sample_chart = {
        "lagna_sign": 3,  # Cancer
        "lagnesh_position": {
            "planet": "Moon",
            "sign_index": 9,
            "house": 10,
            "degree": 12.5,
            "is_exalted": False,
            "is_own_sign": False,
            "is_friend_sign": True
        },
        "planet_positions": {
            "Sun": {"house": 1, "degree": 15.0, "is_combust": False},
            "Moon": {"house": 10, "degree": 12.5},
            "Jupiter": {"house": 4, "degree": 20.0, "is_debilitated": False, "is_combust": False}
        },
        "saturn_aspects": {
            "aspects_lagna": False,
            "aspects_lagnesh": True
        },
        "lagna_strong": True,
        "lagnesh_strong": True,
        "house_lords": {
            1: "Moon", 2: "Sun", 4: "Venus", 7: "Saturn", 10: "Mars"
        }
    }
    
    result = comprehensive_vedic_analysis(sample_chart, "all")
    print("Comprehensive Analysis Complete!")
    print(f"Modules analyzed: {len(result['analysis'])}")
