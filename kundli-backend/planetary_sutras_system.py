"""
Comprehensive Planetary Sutras System
======================================
Implements all planetary-specific rules from classical Vedic astrology texts:
- बीमारी (Disease indicators)
- फायदे नुकसान (Benefits and Losses)
- व्यभिचारी (Adultery/Extramarital)
- कामुक व्यक्ति (Lustful person)
- मारक (Death-causing)
- कष्ट (Suffering)
- Relatives effects (Mother, Father, Siblings, Spouse, Children)
- Body parts and health
- Psychological traits
- Career and wealth impacts
"""

from typing import Dict, List, Any, Optional
from enum import Enum

class PlanetaryEffect:
    """Base class for planetary effect categorization"""
    
    # Kalpurusha - Body parts ruled by signs (0=Aries to 11=Pisces)
    SIGN_BODY_PARTS = {
        0: {"hindi": "सिर, मस्तिष्क", "english": "Head, Brain"},
        1: {"hindi": "चेहरा, गर्दन, आंखें", "english": "Face, Neck, Eyes"},
        2: {"hindi": "भुजाएं, कंधे, हाथ", "english": "Arms, Shoulders, Hands"},
        3: {"hindi": "छाती, हृदय, फेफड़े", "english": "Chest, Heart, Lungs"},
        4: {"hindi": "पेट, पाचन तंत्र", "english": "Stomach, Digestive System"},
        5: {"hindi": "आंत, गुर्दे", "english": "Intestines, Kidneys"},
        6: {"hindi": "कमर, निचला पेट", "english": "Waist, Lower Abdomen"},
        7: {"hindi": "गुप्तांग, मलद्वार", "english": "Private Parts, Anus"},
        8: {"hindi": "जांघ, कूल्हे", "english": "Thighs, Hips"},
        9: {"hindi": "घुटने", "english": "Knees"},
        10: {"hindi": "पिंडली, टखने", "english": "Calves, Ankles"},
        11: {"hindi": "पैर, तलवे", "english": "Feet, Soles"}
    }
    
    # Planet-specific disease associations
    PLANET_DISEASES = {
        "Sun": {
            "hindi": [
                "बुखार और ताप संबंधी रोग",
                "हृदय रोग",
                "आंखों की समस्या (दाहिनी आंख)",
                "सिर दर्द, माइग्रेन",
                "हड्डियों की कमजोरी",
                "पित्त विकार",
                "त्वचा रोग (सोरायसिस)",
                "रक्तचाप",
                "आत्मविश्वास की कमी (मानसिक)"
            ],
            "english": [
                "Fever and heat-related diseases",
                "Heart diseases",
                "Eye problems (right eye)",
                "Headache, Migraine",
                "Bone weakness",
                "Bile disorders",
                "Skin diseases (Psoriasis)",
                "Blood pressure",
                "Lack of confidence (mental)"
            ],
            "body_parts": "हृदय, दायीं आंख, हड्डियाँ, पित्ताशय"
        },
        "Moon": {
            "hindi": [
                "मानसिक अवसाद, डिप्रेशन",
                "जल संबंधी रोग (एडिमा)",
                "पाचन समस्याएं",
                "महिलाओं में मासिक धर्म विकार",
                "कफ रोग, सर्दी-जुकाम",
                "छाती में दर्द",
                "बाईं आंख की समस्या",
                "नींद न आना (अनिद्रा)",
                "भावनात्मक अस्थिरता"
            ],
            "english": [
                "Mental depression",
                "Water retention diseases (Edema)",
                "Digestive problems",
                "Menstrual disorders in women",
                "Phlegm diseases, Cold-Cough",
                "Chest pain",
                "Left eye problems",
                "Insomnia",
                "Emotional instability"
            ],
            "body_parts": "मन, बायीं आंख, छाती, रक्त, महिला प्रजनन अंग"
        },
        "Mars": {
            "hindi": [
                "रक्त विकार, एनीमिया",
                "घाव, चोट, दुर्घटना",
                "शल्य क्रिया (सर्जरी)",
                "बवासीर, भगंदर",
                "पथरी, पित्ताशय की समस्या",
                "गुस्सा, क्रोध विकार",
                "बुखार (अचानक तेज)",
                "मांसपेशियों में दर्द",
                "त्वचा पर लाल चकत्ते"
            ],
            "english": [
                "Blood disorders, Anemia",
                "Wounds, Injuries, Accidents",
                "Surgery",
                "Piles, Fistula",
                "Stones, Gallbladder problems",
                "Anger, Rage disorders",
                "Fever (sudden high)",
                "Muscle pain",
                "Red rashes on skin"
            ],
            "body_parts": "रक्त, मांसपेशियाँ, अस्थि मज्जा, पुरुष प्रजनन अंग"
        },
        "Mercury": {
            "hindi": [
                "तंत्रिका तंत्र विकार",
                "त्वचा रोग (एक्जिमा, दाद)",
                "बोलने की समस्या (तुतलाना)",
                "श्वसन समस्याएं",
                "आंतों की समस्या",
                "एलर्जी",
                "मानसिक तनाव, चिंता",
                "नाक-कान-गला रोग",
                "स्मृति विकार"
            ],
            "english": [
                "Nervous system disorders",
                "Skin diseases (Eczema, Ringworm)",
                "Speech problems (Stammering)",
                "Respiratory problems",
                "Intestinal problems",
                "Allergies",
                "Mental stress, Anxiety",
                "ENT diseases",
                "Memory disorders"
            ],
            "body_parts": "तंत्रिका तंत्र, त्वचा, जीभ, आंत, श्वसन तंत्र"
        },
        "Jupiter": {
            "hindi": [
                "मोटापा, डायबिटीज",
                "यकृत (लीवर) रोग",
                "कान संबंधी समस्याएं",
                "ट्यूमर, कैंसर (बढ़ने वाले)",
                "रक्त में वसा की अधिकता",
                "पीलिया",
                "थायरॉइड विकार",
                "अत्यधिक आशावाद (मानसिक)",
                "अपव्यय की प्रवृत्ति"
            ],
            "english": [
                "Obesity, Diabetes",
                "Liver diseases",
                "Ear problems",
                "Tumors, Cancer (growing type)",
                "High blood fat",
                "Jaundice",
                "Thyroid disorders",
                "Excessive optimism (mental)",
                "Wasteful tendencies"
            ],
            "body_parts": "यकृत, कान, जांघ, वसा ऊतक"
        },
        "Venus": {
            "hindi": [
                "प्रजनन अंग रोग",
                "यौन संचारित रोग (STD)",
                "गुर्दे की समस्याएं",
                "मधुमेह (Type 2)",
                "मूत्र रोग",
                "महिलाओं में गर्भाशय विकार",
                "अत्यधिक भोग-विलास",
                "सौंदर्य प्रसाधनों से एलर्जी",
                "वीर्य विकार"
            ],
            "english": [
                "Reproductive organ diseases",
                "Sexually transmitted diseases",
                "Kidney problems",
                "Diabetes (Type 2)",
                "Urinary diseases",
                "Uterus disorders in women",
                "Excessive indulgence",
                "Cosmetic allergies",
                "Semen disorders"
            ],
            "body_parts": "गुर्दे, प्रजनन अंग, गर्भाशय, शुक्राणु, डिम्बाणु"
        },
        "Saturn": {
            "hindi": [
                "पुराने और असाध्य रोग",
                "गठिया, जोड़ों का दर्द",
                "दांत और हड्डी रोग",
                "लकवा, पक्षाघात",
                "कुष्ठ रोग, त्वचा विकार",
                "वात रोग",
                "अवसाद, निराशा",
                "कैंसर (धीमे बढ़ने वाले)",
                "दीर्घकालिक पीड़ा"
            ],
            "english": [
                "Chronic and incurable diseases",
                "Arthritis, Joint pain",
                "Teeth and bone diseases",
                "Paralysis",
                "Leprosy, Skin disorders",
                "Vata diseases",
                "Depression, Despair",
                "Cancer (slow growing)",
                "Chronic suffering"
            ],
            "body_parts": "हड्डियाँ, दांत, जोड़, घुटने, त्वचा (पुरानी)"
        },
        "Rahu": {
            "hindi": [
                "जहरीली चीजों से रोग",
                "कैंसर (घातक)",
                "मानसिक भ्रम, भ्रांति",
                "नशे की लत",
                "त्वचा पर काले धब्बे",
                "अज्ञात रोग (डायग्नोस न हो)",
                "संक्रामक रोग",
                "एलर्जी (अचानक)",
                "भूत-प्रेत बाधा (मानसिक)"
            ],
            "english": [
                "Poisoning diseases",
                "Cancer (malignant)",
                "Mental confusion, Delusion",
                "Drug addiction",
                "Black spots on skin",
                "Unknown diseases (undiagnosed)",
                "Infectious diseases",
                "Sudden allergies",
                "Paranormal disturbances (mental)"
            ],
            "body_parts": "कोई विशिष्ट अंग नहीं - जहां बैठा हो वहां"
        },
        "Ketu": {
            "hindi": [
                "रहस्यमय रोग",
                "कीड़े, परजीवी संक्रमण",
                "मानसिक अलगाव",
                "आध्यात्मिक संकट",
                "छोटी आंत की समस्या",
                "तंत्रिका तंत्र विकार",
                "अचानक दर्द",
                "घाव जो न भरें",
                "मोक्ष की अत्यधिक इच्छा"
            ],
            "english": [
                "Mysterious diseases",
                "Worm, Parasite infections",
                "Mental isolation",
                "Spiritual crisis",
                "Small intestine problems",
                "Nervous system disorders",
                "Sudden pain",
                "Wounds that don't heal",
                "Excessive desire for liberation"
            ],
            "body_parts": "कोई विशिष्ट अंग नहीं - आध्यात्मिक प्रभाव"
        }
    }


class PlanetarySutras:
    """Comprehensive planetary sutras implementation"""
    
    def __init__(self, chart_data: Dict[str, Any]):
        """
        Initialize with chart data
        chart_data should contain:
        - lagna_sign: 0-11
        - planet_positions: {planet_name: {sign_index: 0-11, degree: float}}
        """
        self.chart_data = chart_data
        self.lagna_sign = chart_data.get('lagna_sign', 0)
        self.planets = chart_data.get('planet_positions', {})
    
    def get_house_from_lagna(self, sign_index: int) -> int:
        """Get bhava number from lagna (1-12)"""
        house = ((sign_index - self.lagna_sign) % 12) + 1
        return house
    
    def is_planet_in_house(self, planet: str, house: int) -> bool:
        """Check if planet is in specific bhava"""
        if planet not in self.planets:
            return False
        planet_sign = self.planets[planet]['sign_index']
        planet_house = self.get_house_from_lagna(planet_sign)
        return planet_house == house
    
    def get_planet_house(self, planet: str) -> Optional[int]:
        """Get bhava where planet is placed"""
        if planet not in self.planets:
            return None
        planet_sign = self.planets[planet]['sign_index']
        return self.get_house_from_lagna(planet_sign)
    
    def planets_in_same_house(self, planet1: str, planet2: str) -> bool:
        """Check if two planets are in same bhava (conjunction)"""
        house1 = self.get_planet_house(planet1)
        house2 = self.get_planet_house(planet2)
        return house1 == house2 if house1 and house2 else False
    
    # ==================== DISEASE ANALYSIS ====================
    
    def analyze_disease_potential(self) -> Dict[str, Any]:
        """
        Comprehensive disease analysis based on planetary positions
        Returns: Dictionary with disease indicators per planet and body parts
        """
        results = {
            "overall_health_status": "अच्छी",  # Good/Average/Poor
            "disease_indicators": [],
            "body_parts_at_risk": [],
            "remedies": []
        }
        
        disease_count = 0
        
        # Check each planet for disease-causing positions
        for planet, data in self.planets.items():
            sign_index = data['sign_index']
            house = self.get_house_from_lagna(sign_index)
            
            # Disease-causing houses: 6 (disease), 8 (chronic), 12 (hospitalization)
            if house in [6, 8, 12]:
                disease_info = {
                    "planet": planet,
                    "planet_hindi": self._get_planet_hindi(planet),
                    "house": house,
                    "house_meaning": self._get_house_disease_meaning(house),
                    "possible_diseases": PlanetaryEffect.PLANET_DISEASES[planet]["hindi"],
                    "body_parts": PlanetaryEffect.PLANET_DISEASES[planet]["body_parts"],
                    "severity": self._calculate_disease_severity(planet, house)
                }
                results["disease_indicators"].append(disease_info)
                disease_count += 1
            
            # Check afflicted signs (body parts at risk)
            body_part_info = PlanetaryEffect.SIGN_BODY_PARTS[sign_index]
            
            # Malefic planets (Sun, Mars, Saturn, Rahu, Ketu) in any sign = body part risk
            if planet in ["Sun", "Mars", "Saturn", "Rahu", "Ketu"]:
                results["body_parts_at_risk"].append({
                    "sign": sign_index,
                    "sign_name": self._get_sign_name(sign_index),
                    "body_part_hindi": body_part_info["hindi"],
                    "body_part_english": body_part_info["english"],
                    "afflicting_planet": planet,
                    "risk_level": "उच्च" if planet in ["Saturn", "Rahu", "Ketu"] else "मध्यम"
                })
        
        # Specific disease yogas
        disease_yogas = self._check_disease_yogas()
        results["specific_disease_yogas"] = disease_yogas
        
        # Overall health status
        if disease_count == 0:
            results["overall_health_status"] = "उत्तम"
            results["health_description"] = "कोई गंभीर रोग योग नहीं। अच्छा स्वास्थ्य।"
        elif disease_count <= 2:
            results["overall_health_status"] = "सामान्य"
            results["health_description"] = "कुछ मामूली स्वास्थ्य चुनौतियाँ संभव।"
        else:
            results["overall_health_status"] = "सावधानी आवश्यक"
            results["health_description"] = "स्वास्थ्य पर विशेष ध्यान की आवश्यकता।"
        
        return results
    
    def _check_disease_yogas(self) -> List[Dict]:
        """Check specific disease-causing yogas"""
        yogas = []
        
        # 1. Heart Disease Yoga: Sun afflicted in 4th house or with malefics
        if self.is_planet_in_house("Sun", 4):
            if self.planets_in_same_house("Sun", "Mars") or \
               self.planets_in_same_house("Sun", "Saturn"):
                yogas.append({
                    "name": "हृदय रोग योग",
                    "description": "सूर्य चतुर्थ भाव में पाप ग्रह से युक्त",
                    "disease": "हृदय रोग की संभावना",
                    "severity": "उच्च"
                })
        
        # 2. TB/Lung Disease: Moon + Saturn in 4th or Moon in 6th with Mars
        if self.is_planet_in_house("Moon", 4) and self.planets_in_same_house("Moon", "Saturn"):
            yogas.append({
                "name": "क्षय रोग योग",
                "description": "चंद्रमा-शनि चतुर्थ भाव में",
                "disease": "फेफड़ों की बीमारी, TB संभावना",
                "severity": "उच्च"
            })
        
        # 3. Cancer Yoga: Jupiter + Rahu together, especially in 6/8/12
        if self.planets_in_same_house("Jupiter", "Rahu"):
            house = self.get_planet_house("Jupiter")
            if house in [6, 8, 12]:
                yogas.append({
                    "name": "कर्क रोग योग",
                    "description": "गुरु-राहु दुष्ट भाव में",
                    "disease": "ट्यूमर या कैंसर की संभावना",
                    "severity": "अति उच्च"
                })
        
        # 4. Mental Disorder: Moon + Saturn + Rahu connection
        moon_house = self.get_planet_house("Moon")
        saturn_house = self.get_planet_house("Saturn")
        rahu_house = self.get_planet_house("Rahu")
        
        if moon_house and saturn_house and rahu_house:
            # If all three in kendras or all afflicting each other
            if self.planets_in_same_house("Moon", "Saturn") or \
               self.planets_in_same_house("Moon", "Rahu"):
                yogas.append({
                    "name": "मानसिक रोग योग",
                    "description": "चंद्रमा पाप ग्रहों से पीड़ित",
                    "disease": "मानसिक अवसाद, भ्रम, चिंता",
                    "severity": "उच्च"
                })
        
        # 5. Infertility Yoga: Venus + Saturn in 5th house
        if self.is_planet_in_house("Venus", 5) and self.planets_in_same_house("Venus", "Saturn"):
            yogas.append({
                "name": "संतान बाधा योग",
                "description": "शुक्र-शनि पंचम भाव में",
                "disease": "संतान प्राप्ति में कठिनाई, प्रजनन समस्या",
                "severity": "मध्यम"
            })
        
        # 6. Suicide Tendency: Moon in 8th + afflicted
        if self.is_planet_in_house("Moon", 8):
            if self.planets_in_same_house("Moon", "Saturn") or \
               self.planets_in_same_house("Moon", "Rahu"):
                yogas.append({
                    "name": "आत्महत्या प्रवृत्ति योग",
                    "description": "चंद्रमा अष्टम में पाप युत",
                    "disease": "गहन अवसाद, आत्मघाती विचार",
                    "severity": "अति उच्च",
                    "warning": "तुरंत मानसिक स्वास्थ्य विशेषज्ञ से संपर्क करें"
                })
        
        return yogas
    
    def _calculate_disease_severity(self, planet: str, house: int) -> str:
        """Calculate severity of disease indication"""
        # 8th house = most severe (chronic, life-threatening)
        # 6th house = moderate (manageable diseases)
        # 12th house = hospitalization, expenses
        
        severity_map = {
            6: "मध्यम",
            8: "उच्च",
            12: "मध्यम से उच्च"
        }
        
        base_severity = severity_map.get(house, "निम्न")
        
        # Saturn, Rahu, Ketu increase severity
        if planet in ["Saturn", "Rahu", "Ketu"]:
            if base_severity == "मध्यम":
                return "उच्च"
            elif base_severity == "उच्च":
                return "अति उच्च"
        
        return base_severity
    
    # ==================== BENEFITS AND LOSSES ====================
    
    def analyze_benefits_losses(self) -> Dict[str, Any]:
        """
        Analyze फायदे (benefits) and नुकसान (losses) from each planet
        """
        results = {
            "planetary_effects": [],
            "net_balance": "संतुलित"
        }
        
        benefit_score = 0
        loss_score = 0
        
        for planet, data in self.planets.items():
            sign_index = data['sign_index']
            house = self.get_house_from_lagna(sign_index)
            
            planet_effect = {
                "planet": planet,
                "planet_hindi": self._get_planet_hindi(planet),
                "house": house,
                "benefits": [],
                "losses": [],
                "net_effect": ""
            }
            
            # Get benefits and losses based on house placement
            benefits, losses = self._get_planet_house_effects(planet, house)
            
            planet_effect["benefits"] = benefits
            planet_effect["losses"] = losses
            
            # Calculate net effect
            if len(benefits) > len(losses):
                planet_effect["net_effect"] = "लाभकारी"
                benefit_score += (len(benefits) - len(losses))
            elif len(losses) > len(benefits):
                planet_effect["net_effect"] = "हानिकारक"
                loss_score += (len(losses) - len(benefits))
            else:
                planet_effect["net_effect"] = "संतुलित"
            
            results["planetary_effects"].append(planet_effect)
        
        # Overall balance
        if benefit_score > loss_score + 3:
            results["net_balance"] = "अत्यधिक लाभकारी"
        elif benefit_score > loss_score:
            results["net_balance"] = "लाभकारी"
        elif loss_score > benefit_score + 3:
            results["net_balance"] = "अत्यधिक हानिकारक"
        elif loss_score > benefit_score:
            results["net_balance"] = "हानिकारक"
        else:
            results["net_balance"] = "संतुलित"
        
        results["benefit_score"] = benefit_score
        results["loss_score"] = loss_score
        
        return results
    
    def _get_planet_house_effects(self, planet: str, house: int) -> tuple:
        """Get benefits and losses for planet in specific house"""
        
        # Comprehensive house-wise effects for each planet
        PLANET_HOUSE_EFFECTS = {
            "Sun": {
                1: (["आत्मविश्वास", "नेतृत्व क्षमता", "प्रसिद्धि", "पिता का सहयोग"], 
                    ["अहंकार", "पत्नी से विवाद"]),
                2: (["धन प्राप्ति", "वाणी की शक्ति", "परिवार में प्रतिष्ठा"], 
                    ["पारिवारिक तनाव", "आंखों की समस्या"]),
                3: (["भाई-बहनों से लाभ", "साहस", "कला कौशल"], 
                    ["भाई से विवाद संभव", "ऊर्जा की कमी"]),
                4: (["संपत्ति", "मातृ सुख"], 
                    ["माता का स्वास्थ्य", "मानसिक शांति में कमी", "हृदय रोग"]),
                5: (["संतान सुख", "बुद्धि", "सट्टे में लाभ"], 
                    ["संतान में अहंकार", "प्रेम संबंधों में समस्या"]),
                6: (["शत्रु पराजय", "रोग नाश", "प्रतियोगिता में सफलता"], 
                    ["स्वास्थ्य चुनौतियाँ", "मामा से दूरी"]),
                7: (["जीवनसाथी प्रभावशाली"], 
                    ["वैवाहिक कलह", "साझेदारी में समस्या"]),
                8: (["गुप्त विद्या", "दीर्घायु"], 
                    ["स्वास्थ्य समस्याएं", "आयु में कमी", "दुर्घटना"]),
                9: (["भाग्य उदय", "पिता का सहयोग", "धर्म में रुचि"], 
                    ["पिता के साथ मतभेद"]),
                10: (["उच्च पद", "सरकारी नौकरी", "प्रसिद्धि"], 
                    ["अत्यधिक काम का दबाव"]),
                11: (["धन लाभ", "बड़ी आय", "इच्छा पूर्ति"], 
                    ["पिता का स्वास्थ्य"]),
                12: (["विदेश यात्रा", "आध्यात्मिकता"], 
                    ["खर्च अधिक", "पिता से दूरी", "अपमान"])
            },
            "Moon": {
                1: (["सुंदर व्यक्तित्व", "मातृ सुख", "लोकप्रियता", "कल्पनाशीलता"], 
                    ["मानसिक चंचलता", "अति भावुकता"]),
                2: (["धन", "मधुर वाणी", "परिवार प्रेम"], 
                    ["धन का अभाव (यदि पीड़ित)", "मां से तनाव"]),
                3: (["साहस", "भाई-बहन सुख", "कला में रुचि"], 
                    ["मानसिक अस्थिरता", "यात्रा में परेशानी"]),
                4: (["माता का आशीर्वाद", "मानसिक शांति", "संपत्ति", "वाहन सुख"], 
                    ["अति भावुकता", "स्त्री रोग (महिलाओं में)"]),
                5: (["संतान सुख", "बुद्धि", "रचनात्मकता", "मां का आशीर्वाद"], 
                    ["संतान के प्रति अति लगाव"]),
                6: (["शत्रु नाश", "मातृ पक्ष से सहायता"], 
                    ["माता का स्वास्थ्य", "मानसिक तनाव", "कफ रोग"]),
                7: (["सुंदर जीवनसाथी", "लोकप्रियता"], 
                    ["पत्नी के प्रति अति निर्भरता", "भावनात्मक उतार-चढ़ाव"]),
                8: (["गुप्त विद्या", "मनोविज्ञान में रुचि"], 
                    ["मां की आयु", "मानसिक अवसाद", "दुर्घटना"]),
                9: (["भाग्यशाली", "धार्मिक", "मां का सहयोग"], 
                    ["धर्म में अंधविश्वास"]),
                10: (["प्रसिद्धि", "जन सेवा", "लोकप्रियता"], 
                    ["माता से दूरी", "कार्य में भावनाओं का हस्तक्षेप"]),
                11: (["बड़ी आय", "मां से धन लाभ", "इच्छा पूर्ति"], 
                    ["मित्रों पर अति निर्भरता"]),
                12: (["विदेश में सफलता", "आध्यात्मिक उन्नति"], 
                    ["माता से दूरी", "खर्च अधिक", "नींद की समस्या"])
            },
            "Mars": {
                1: (["साहस", "नेतृत्व", "शारीरिक शक्ति", "भाई का सहयोग"], 
                    ["आक्रामकता", "सिर में चोट", "भाई से विवाद"]),
                2: (["कठोर परिश्रम से धन", "स्पष्ट वाणी"], 
                    ["कटु वाणी", "पारिवारिक कलह", "धन की हानि"]),
                3: (["भाई-बहन सुख", "अपार साहस", "संघर्ष क्षमता"], 
                    ["भाइयों से विवाद", "दुर्घटना", "अति उग्रता"]),
                4: (["संपत्ति लाभ (संघर्ष के बाद)", "वाहन"], 
                    ["माता का स्वास्थ्य", "घरेलू कलह", "अचल संपत्ति विवाद"]),
                5: (["संतान में साहस", "बुद्धि की तीक्ष्णता"], 
                    ["संतान हानि", "सट्टे में नुकसान", "प्रेम में विफलता"]),
                6: (["शत्रु विनाश", "रोग पर विजय", "प्रतियोगिता में सफलता"], 
                    ["शल्य क्रिया", "दुर्घटना", "मामा से विवाद"]),
                7: (["जीवनसाथी में साहस"], 
                    ["वैवाहिक कलह", "साझेदारी विवाद", "कुजदोष"]),
                8: (["गुप्त धन", "विरासत"], 
                    ["दुर्घटना", "शल्य क्रिया", "भाई की आयु", "हिंसक प्रवृत्ति"]),
                9: (["भाग्य से संघर्ष", "विदेश यात्रा"], 
                    ["पिता से विवाद", "धर्म में उग्रता"]),
                10: (["उच्च पद (संघर्ष से)", "सेना/पुलिस में सफलता"], 
                    ["कार्य में संघर्ष", "वरिष्ठों से विवाद"]),
                11: (["बड़ी आय", "भाइयों से लाभ", "इच्छा पूर्ति"], 
                    ["लाभ में देरी", "मित्रों से विवाद"]),
                12: (["विदेश में सफलता", "गुप्त लाभ"], 
                    ["अत्यधिक खर्च", "शारीरिक पीड़ा", "भाई से दूरी"])
            },
            "Mercury": {
                1: (["बुद्धि", "व्यापार कौशल", "वाणी शक्ति", "युवा दिखना"], 
                    ["अति चतुरता", "चंचलता"]),
                2: (["धन लाभ", "व्यापार में सफलता", "मधुर वाणी"], 
                    ["धन का दुरुपयोग", "झूठ बोलना"]),
                3: (["भाई-बहन सुख", "लेखन कौशल", "यात्रा लाभ"], 
                    ["भाइयों में प्रतिस्पर्धा"]),
                4: (["शिक्षा", "बौद्धिक संपत्ति", "वाहन"], 
                    ["माता से वाद-विवाद", "मानसिक अशांति"]),
                5: (["प्रतिभाशाली संतान", "बुद्धिमत्ता", "शिक्षा में सफलता"], 
                    ["संतान में चतुराई अधिक"]),
                6: (["शत्रु पर बौद्धिक विजय", "रोग की समझ"], 
                    ["तनाव से रोग", "मामा से विवाद"]),
                7: (["बुद्धिमान जीवनसाथी", "व्यापार में साझेदारी"], 
                    ["वैवाहिक चतुराई", "विश्वास की कमी"]),
                8: (["गुप्त ज्ञान", "अनुसंधान में सफलता"], 
                    ["तनाव", "गुप्त शत्रु"]),
                9: (["उच्च शिक्षा", "विदेश यात्रा", "धार्मिक ज्ञान"], 
                    ["धर्म में शंका"]),
                10: (["कार्य में बुद्धि", "व्यापार", "संचार में सफलता"], 
                    ["अति व्यस्तता"]),
                11: (["बड़ी आय", "व्यापार लाभ", "नेटवर्किंग"], 
                    ["मित्रों से छल"]),
                12: (["विदेश में व्यापार", "आध्यात्मिक ज्ञान"], 
                    ["व्यर्थ खर्च", "चिंता"])
            },
            "Jupiter": {
                1: (["ज्ञान", "सकारात्मकता", "गुरु का आशीर्वाद", "प्रसिद्धि"], 
                    ["अति आशावाद", "मोटापा"]),
                2: (["धन", "शिक्षा", "परिवार में सम्मान", "मधुर वाणी"], 
                    ["अपव्यय"]),
                3: (["भाई-बहन सुख", "साहस", "धार्मिक यात्रा"], 
                    ["भाइयों में प्रतिस्पर्धा"]),
                4: (["माता सुख", "संपत्ति", "शिक्षा", "मानसिक शांति"], 
                    ["घर में अति खर्च"]),
                5: (["संतान सुख", "बुद्धि", "पूर्व पुण्य", "रचनात्मकता"], 
                    ["संतान में अति अपेक्षाएं"]),
                6: (["रोग नाश", "शत्रु पराजय", "सेवा में सफलता"], 
                    ["गुरु का अपमान", "यकृत रोग"]),
                7: (["सुयोग्य जीवनसाथी", "धार्मिक साझेदार"], 
                    ["पत्नी में अति अपेक्षाएं"]),
                8: (["दीर्घायु", "विरासत", "गुप्त ज्ञान"], 
                    ["स्वास्थ्य चुनौती", "गुरु से दूरी"]),
                9: (["भाग्य", "पिता सुख", "धर्म", "उच्च शिक्षा", "तीर्थयात्रा"], 
                    ["धर्म में कट्टरता"]),
                10: (["उच्च पद", "प्रसिद्धि", "शिक्षक/सलाहकार"], 
                    ["कार्य में दबाव"]),
                11: (["बड़ी आय", "बड़े लाभ", "इच्छा पूर्ति"], 
                    ["अति इच्छाएं"]),
                12: (["विदेश सफलता", "आध्यात्मिकता", "दान-पुण्य"], 
                    ["धन व्यय", "गुरु से दूरी"])
            },
            "Venus": {
                1: (["सुंदरता", "आकर्षण", "कला", "पत्नी सुख"], 
                    ["अति भोग", "आलस्य"]),
                2: (["धन", "वाहन", "परिवार सुख", "मधुर वाणी"], 
                    ["विलासिता में खर्च"]),
                3: (["बहन सुख", "कला कौशल", "सुखद यात्रा"], 
                    ["अति भोग"]),
                4: (["माता सुख", "वाहन", "सुख-सुविधा", "संपत्ति"], 
                    ["घर में अति खर्च"]),
                5: (["संतान सुख", "प्रेम", "रचनात्मकता", "सट्टे में लाभ"], 
                    ["प्रेम में अति लगाव"]),
                6: (["शत्रु में कमजोरी", "चाचा/चाची सुख"], 
                    ["स्वास्थ्य (गुर्दे)", "ऋण"]),
                7: (["सुंदर पत्नी", "सुखी विवाह", "साझेदारी सफलता"], 
                    ["अति काम भावना"]),
                8: (["विरासत", "पत्नी का धन"], 
                    ["स्वास्थ्य समस्या", "यौन रोग"]),
                9: (["भाग्य", "विदेश यात्रा", "धार्मिक कला"], 
                    ["धर्म में शंका"]),
                10: (["कार्य में कला", "प्रसिद्धि", "सुंदर कार्यस्थल"], 
                    ["भोग-विलास में रुचि"]),
                11: (["बड़ी आय", "वाहन लाभ", "इच्छा पूर्ति"], 
                    ["विलासिता खर्च"]),
                12: (["विदेश सुख", "विलासिता", "बिस्तर सुख"], 
                    ["अति खर्च", "गुप्त संबंध"])
            },
            "Saturn": {
                1: (["अनुशासन", "कड़ी मेहनत", "दीर्घायु", "जिम्मेदारी"], 
                    ["निराशा", "आत्मविश्वास कमी", "विलंब"]),
                2: (["कठिन परिश्रम से धन", "बचत"], 
                    ["धन कमी", "कठोर वाणी", "परिवार से दूरी"]),
                3: (["भाई-बहनों में जिम्मेदारी"], 
                    ["भाई से दूरी", "साहस में कमी", "यात्रा में बाधा"]),
                4: (["संपत्ति (विलंब से)", "माता की सेवा"], 
                    ["माता का स्वास्थ्य", "मानसिक पीड़ा", "घरेलू दुख"]),
                5: (["संतान में अनुशासन"], 
                    ["संतान देरी/हानि", "प्रेम में निराशा", "सट्टे में हानि"]),
                6: (["रोग पर नियंत्रण", "शत्रु नाश", "सेवा में सफलता"], 
                    ["पुराने रोग", "नौकर समस्या"]),
                7: (["जीवनसाथी में जिम्मेदारी"], 
                    ["विवाह में देरी", "वैवाहिक कष्ट", "साझेदारी समस्या"]),
                8: (["दीर्घायु", "गुप्त विद्या", "विरासत (विलंब से)"], 
                    ["स्वास्थ्य समस्या", "दुर्घटना", "पुराना दर्द"]),
                9: (["धर्म में गंभीरता", "कर्म सिद्धांत"], 
                    ["भाग्य में बाधा", "पिता का कष्ट"]),
                10: (["उच्च पद (मेहनत से)", "प्रसिद्धि (विलंब से)"], 
                    ["कार्य में कठिनाई", "जिम्मेदारी भार"]),
                11: (["बड़ी आय (विलंब से)", "बड़े भाई सुख"], 
                    ["लाभ में देरी", "बड़े भाई की समस्या"]),
                12: (["विदेश में कड़ी मेहनत", "एकांत"], 
                    ["खर्च", "अलगाव", "दुख"])
            },
            "Rahu": {
                1: (["आकर्षक व्यक्तित्व", "तकनीकी कौशल", "विदेशी संपर्क"], 
                    ["भ्रम", "अति महत्वाकांक्षा", "पहचान संकट"]),
                2: (["अचानक धन", "विदेशी संपर्क से धन"], 
                    ["धन का गलत उपयोग", "झूठी बातें"]),
                3: (["अचानक साहस", "तकनीकी यात्रा"], 
                    ["भाई से अलगाव", "दुर्घटना"]),
                4: (["विदेशी संपत्ति", "तकनीकी शिक्षा"], 
                    ["माता का स्वास्थ्य", "घर में अशांति"]),
                5: (["अचानक बुद्धि", "तकनीकी ज्ञान"], 
                    ["संतान में बाधा", "सट्टे में जोखिम"]),
                6: (["शत्रु भ्रमित", "विदेशी रोग उपचार"], 
                    ["अज्ञात रोग", "संक्रमण"]),
                7: (["विदेशी जीवनसाथी", "अनोखा रिश्ता"], 
                    ["वैवाहिक भ्रम", "विश्वासघात"]),
                8: (["अचानक विरासत", "गुप्त तकनीकी ज्ञान"], 
                    ["अचानक दुर्घटना", "रहस्यमय रोग"]),
                9: (["विदेश यात्रा", "अपरंपरागत विश्वास"], 
                    ["धर्म में भ्रम", "पिता से अलगाव"]),
                10: (["अचानक प्रसिद्धि", "तकनीकी करियर"], 
                    ["बदनामी", "अप्रत्याशित पतन"]),
                11: (["बड़ी आय (अचानक)", "विदेशी मित्र"], 
                    ["लाभ में धोखा"]),
                12: (["विदेश निवास", "गुप्त लाभ"], 
                    ["अत्यधिक खर्च", "गुप्त शत्रु"])
            },
            "Ketu": {
                1: (["आध्यात्मिकता", "गहन ज्ञान", "अनासक्ति"], 
                    ["पहचान संकट", "भ्रम", "स्वास्थ्य समस्या"]),
                2: (["आध्यात्मिक वाणी", "अनासक्ति"], 
                    ["धन में रुचि नहीं", "परिवार से दूरी"]),
                3: (["आध्यात्मिक यात्रा"], 
                    ["भाई से अलगाव", "साहस में कमी"]),
                4: (["आध्यात्मिक शांति"], 
                    ["माता से दूरी", "घरेलू अलगाव"]),
                5: (["आध्यात्मिक बुद्धि", "पूर्व जन्म ज्ञान"], 
                    ["संतान में देरी", "सांसारिकता से विमुखता"]),
                6: (["रोग से मुक्ति (आध्यात्मिक)", "शत्रु भय"], 
                    ["रहस्यमय रोग"]),
                7: (["आध्यात्मिक साझेदार"], 
                    ["वैवाहिक अलगाव", "रिश्ते में दूरी"]),
                8: (["मोक्ष", "गुप्त ज्ञान", "तंत्र विद्या"], 
                    ["अचानक दुर्घटना", "रहस्यमय पीड़ा"]),
                9: (["गहन आध्यात्मिकता", "मोक्ष मार्ग"], 
                    ["पिता से दूरी", "धर्म में संदेह"]),
                10: (["आध्यात्मिक कार्य"], 
                    ["सांसारिक करियर में रुचि नहीं"]),
                11: (["आध्यात्मिक लाभ"], 
                    ["धन लाभ में रुचि नहीं"]),
                12: (["मोक्ष", "विदेश में आध्यात्मिकता"], 
                    ["सांसारिक से पूर्ण अलगाव"])
            }
        }
        
        planet_effects = PLANET_HOUSE_EFFECTS.get(planet, {})
        house_effects = planet_effects.get(house, ([], []))
        
        return house_effects
    
    # ==================== ADULTERY/EXTRAMARITAL INDICATORS ====================
    
    def analyze_adultery_indicators(self) -> Dict[str, Any]:
        """
        व्यभिचारी योग - Extramarital/Adultery indicators
        """
        results = {
            "adultery_yogas": [],
            "risk_level": "निम्न",
            "description": ""
        }
        
        yogas = []
        
        # 1. Mars + Venus conjunction (especially in 7th, 12th)
        if self.planets_in_same_house("Mars", "Venus"):
            house = self.get_planet_house("Mars")
            severity = "उच्च" if house in [7, 12] else "मध्यम"
            yogas.append({
                "name": "मंगल-शुक्र युति योग",
                "description": f"मंगल और शुक्र {house} भाव में साथ",
                "indication": "कामुकता, विवाहेतर संबंध की प्रवृत्ति",
                "severity": severity
            })
        
        # 2. Venus in 12th house (bed pleasures, secret affairs)
        if self.is_planet_in_house("Venus", 12):
            yogas.append({
                "name": "शुक्र द्वादश योग",
                "description": "शुक्र द्वादश भाव में",
                "indication": "गुप्त प्रेम संबंध, अति भोग-विलास",
                "severity": "मध्यम"
            })
        
        # 3. Rahu in 7th house (unconventional relationships)
        if self.is_planet_in_house("Rahu", 7):
            yogas.append({
                "name": "राहु सप्तम योग",
                "description": "राहु सप्तम भाव में",
                "indication": "अपरंपरागत संबंध, विवाह में धोखा संभव",
                "severity": "उच्च"
            })
        
        # 4. Moon + Venus (especially if afflicted)
        if self.planets_in_same_house("Moon", "Venus"):
            yogas.append({
                "name": "चंद्र-शुक्र युति",
                "description": "चंद्रमा और शुक्र साथ",
                "indication": "भावनात्मक और शारीरिक आकर्षण, रोमांटिक प्रवृत्ति",
                "severity": "निम्न से मध्यम"
            })
        
        # 5. Saturn + Venus in 7th (dissatisfaction in marriage)
        if self.is_planet_in_house("Saturn", 7) and self.is_planet_in_house("Venus", 7):
            yogas.append({
                "name": "शनि-शुक्र सप्तम योग",
                "description": "शनि और शुक्र दोनों सप्तम भाव में",
                "indication": "वैवाहिक असंतोष, बाहरी संबंध की तलाश",
                "severity": "उच्च"
            })
        
        # 6. 7th lord in 12th or 12th lord in 7th (secret relationships)
        # This requires more complex calculation - simplified version:
        venus_house = self.get_planet_house("Venus")
        if venus_house == 12:
            yogas.append({
                "name": "सातवें भाव का संबंध द्वादश से",
                "description": "प्रेम/विवाह ग्रह गुप्त भाव में",
                "indication": "गुप्त प्रेम, छिपे संबंध",
                "severity": "मध्यम"
            })
        
        results["adultery_yogas"] = yogas
        
        # Risk level assessment
        if len(yogas) == 0:
            results["risk_level"] = "निम्न"
            results["description"] = "कोई स्पष्ट व्यभिचार योग नहीं।"
        elif len(yogas) <= 2:
            results["risk_level"] = "मध्यम"
            results["description"] = "कुछ संकेत हैं, लेकिन आत्म-नियंत्रण संभव।"
        else:
            results["risk_level"] = "उच्च"
            results["description"] = "मजबूत संकेत। नैतिकता और आत्म-अनुशासन आवश्यक।"
        
        return results
    
    # ==================== LUSTFUL PERSON INDICATORS ====================
    
    def analyze_lustful_indicators(self) -> Dict[str, Any]:
        """
        कामुक व्यक्ति योग - Indicators of lustful/sensual nature
        """
        results = {
            "lustful_yogas": [],
            "intensity": "सामान्य",
            "description": ""
        }
        
        yogas = []
        
        # 1. Venus dominant (in Lagna, strong)
        if self.is_planet_in_house("Venus", 1):
            yogas.append({
                "name": "शुक्र लग्न योग",
                "description": "शुक्र लग्न में",
                "indication": "सुंदरता प्रिय, भोग-विलास में रुचि, कामुक प्रवृत्ति",
                "intensity": "मध्यम"
            })
        
        # 2. Mars + Venus (strong sexual desire)
        if self.planets_in_same_house("Mars", "Venus"):
            yogas.append({
                "name": "मंगल-शुक्र काम योग",
                "description": "मंगल-शुक्र युति",
                "indication": "तीव्र यौन इच्छा, कामुकता",
                "intensity": "उच्च"
            })
        
        # 3. Moon in water signs (Cancer, Scorpio, Pisces) + Venus influence
        moon_sign = self.planets.get("Moon", {}).get("sign_index")
        if moon_sign in [3, 7, 11]:  # Cancer, Scorpio, Pisces
            yogas.append({
                "name": "चंद्र जल राशि योग",
                "description": "चंद्रमा जल राशि में (कर्क/वृश्चिक/मीन)",
                "indication": "भावनात्मक और शारीरिक आवश्यकताएं तीव्र",
                "intensity": "मध्यम"
            })
        
        # 4. Rahu + Venus (obsessive desires)
        if self.planets_in_same_house("Rahu", "Venus"):
            yogas.append({
                "name": "राहु-शुक्र काम योग",
                "description": "राहु-शुक्र युति",
                "indication": "असामान्य यौन इच्छाएं, जुनून",
                "intensity": "अति उच्च"
            })
        
        # 5. Venus in Scorpio (intense passion)
        venus_sign = self.planets.get("Venus", {}).get("sign_index")
        if venus_sign == 7:  # Scorpio (neecha for Venus)
            yogas.append({
                "name": "शुक्र वृश्चिक योग",
                "description": "शुक्र वृश्चिक राशि में (नीच)",
                "indication": "तीव्र यौन इच्छाएं, जुनूनी प्रेम",
                "intensity": "उच्च"
            })
        
        # 6. Multiple planets in 7th or 12th (relationship/bed focus)
        seventh_house_count = sum(1 for p in self.planets if self.get_planet_house(p) == 7)
        twelfth_house_count = sum(1 for p in self.planets if self.get_planet_house(p) == 12)
        
        if seventh_house_count >= 3:
            yogas.append({
                "name": "सप्तम भाव बहुग्रह योग",
                "description": f"{seventh_house_count} ग्रह सप्तम भाव में",
                "indication": "संबंधों और साझेदारी में अत्यधिक रुचि",
                "intensity": "मध्यम"
            })
        
        if twelfth_house_count >= 3:
            yogas.append({
                "name": "द्वादश भाव बहुग्रह योग",
                "description": f"{twelfth_house_count} ग्रह द्वादश भाव में",
                "indication": "बिस्तर सुख, भोग-विलास में अत्यधिक रुचि",
                "intensity": "उच्च"
            })
        
        results["lustful_yogas"] = yogas
        
        # Intensity assessment
        if len(yogas) == 0:
            results["intensity"] = "सामान्य"
            results["description"] = "सामान्य यौन प्रवृत्ति।"
        elif len(yogas) <= 2:
            results["intensity"] = "मध्यम"
            results["description"] = "औसत से अधिक कामुक प्रवृत्ति।"
        else:
            results["intensity"] = "उच्च"
            results["description"] = "तीव्र कामुक प्रवृत्ति। आत्म-नियंत्रण आवश्यक।"
        
        return results
    
    # ==================== MARAK (DEATH-CAUSING) ANALYSIS ====================
    
    def analyze_marak_planets(self) -> Dict[str, Any]:
        """
        मारक ग्रह विश्लेषण - Death-causing planet analysis
        """
        results = {
            "marak_houses": [2, 7],  # 2nd and 7th are marak houses
            "marak_planets": [],
            "danger_periods": [],
            "critical_combinations": []
        }
        
        # Marak houses are 2nd and 7th from Lagna
        # Lords of these houses are marak
        # Planets placed in these houses also gain marak powers
        
        # Planets in 2nd house
        second_house_planets = [p for p in self.planets if self.get_planet_house(p) == 2]
        for planet in second_house_planets:
            results["marak_planets"].append({
                "planet": planet,
                "planet_hindi": self._get_planet_hindi(planet),
                "reason": "द्वितीय भाव (मारक स्थान) में स्थित",
                "severity": "मध्यम"
            })
        
        # Planets in 7th house
        seventh_house_planets = [p for p in self.planets if self.get_planet_house(p) == 7]
        for planet in seventh_house_planets:
            results["marak_planets"].append({
                "planet": planet,
                "planet_hindi": self._get_planet_hindi(planet),
                "reason": "सप्तम भाव (मारक स्थान) में स्थित",
                "severity": "मध्यम से उच्च"
            })
        
        # Critical marak combinations
        
        # 1. Saturn in 8th house (lord of longevity in house of death)
        if self.is_planet_in_house("Saturn", 8):
            results["critical_combinations"].append({
                "name": "शनि अष्टम मारक योग",
                "description": "शनि (आयु कारक) अष्टम भाव (मृत्यु स्थान) में",
                "indication": "दीर्घकालिक स्वास्थ्य समस्याएं, आयु पर प्रभाव",
                "severity": "उच्च"
            })
        
        # 2. Mars in 8th (violent death possibility)
        if self.is_planet_in_house("Mars", 8):
            results["critical_combinations"].append({
                "name": "मंगल अष्टम मारक योग",
                "description": "मंगल अष्टम भाव में",
                "indication": "दुर्घटना, शल्य क्रिया, हिंसक मृत्यु का भय",
                "severity": "उच्च"
            })
        
        # 3. Sun in 8th (father's longevity, self vitality)
        if self.is_planet_in_house("Sun", 8):
            results["critical_combinations"].append({
                "name": "सूर्य अष्टम योग",
                "description": "सूर्य अष्टम भाव में",
                "indication": "पिता की आयु, स्वयं की जीवन शक्ति पर प्रभाव",
                "severity": "मध्यम से उच्च"
            })
        
        # 4. Multiple malefics in 8th
        eighth_house_malefics = [p for p in ["Sun", "Mars", "Saturn", "Rahu", "Ketu"] 
                                 if self.is_planet_in_house(p, 8)]
        if len(eighth_house_malefics) >= 2:
            results["critical_combinations"].append({
                "name": "अष्टम पाप ग्रह योग",
                "description": f"{len(eighth_house_malefics)} पाप ग्रह अष्टम भाव में",
                "indication": "गंभीर स्वास्थ्य संकट, दुर्घटना योग",
                "severity": "अति उच्च"
            })
        
        # 5. Moon in 8th with malefics (mental death, depression)
        if self.is_planet_in_house("Moon", 8):
            if any(self.planets_in_same_house("Moon", mal) for mal in ["Saturn", "Rahu", "Ketu"]):
                results["critical_combinations"].append({
                    "name": "चंद्र अष्टम पाप योग",
                    "description": "चंद्रमा अष्टम में पाप ग्रह से युक्त",
                    "indication": "गंभीर मानसिक समस्या, आत्महत्या विचार",
                    "severity": "अति उच्च",
                    "warning": "तुरंत मानसिक स्वास्थ्य सहायता लें"
                })
        
        # General recommendations
        if len(results["marak_planets"]) > 0 or len(results["critical_combinations"]) > 0:
            results["recommendation"] = "मारक ग्रहों की दशा/अंतर्दशा में सावधानी। स्वास्थ्य की नियमित जांच। उपाय करें।"
        else:
            results["recommendation"] = "कोई विशेष मारक योग नहीं। सामान्य सावधानी पर्याप्त।"
        
        return results
    
    # ==================== SUFFERING (KASTHA) ANALYSIS ====================
    
    def analyze_suffering_indicators(self) -> Dict[str, Any]:
        """
        कष्ट विश्लेषण - Suffering and hardship indicators
        """
        results = {
            "suffering_yogas": [],
            "suffering_areas": [],
            "intensity": "निम्न"
        }
        
        yogas = []
        areas = []
        
        # Dusthanas (6, 8, 12) cause suffering
        # Malefics in angular houses also cause suffering
        
        # 1. Saturn in Lagna (lifelong struggle)
        if self.is_planet_in_house("Saturn", 1):
            yogas.append({
                "name": "शनि लग्न कष्ट योग",
                "description": "शनि लग्न में",
                "suffering": "जीवन भर संघर्ष, कठिन परिश्रम, विलंबित सफलता",
                "intensity": "उच्च"
            })
            areas.append("जीवन संघर्ष")
        
        # 2. Saturn in 4th (mother's suffering, mental peace loss)
        if self.is_planet_in_house("Saturn", 4):
            yogas.append({
                "name": "शनि चतुर्थ कष्ट योग",
                "description": "शनि चतुर्थ भाव में",
                "suffering": "माता को कष्ट, मानसिक शांति की कमी, घरेलू दुख",
                "intensity": "उच्च"
            })
            areas.append("माता और मानसिक शांति")
        
        # 3. Saturn in 7th (marital suffering, delayed marriage)
        if self.is_planet_in_house("Saturn", 7):
            yogas.append({
                "name": "शनि सप्तम कष्ट योग",
                "description": "शनि सप्तम भाव में",
                "suffering": "विवाह में देरी, वैवाहिक कष्ट, साझेदारी में समस्या",
                "intensity": "उच्च"
            })
            areas.append("विवाह और साझेदारी")
        
        # 4. Rahu-Ketu axis on Lagna-7th (identity and relationship crisis)
        rahu_house = self.get_planet_house("Rahu")
        ketu_house = self.get_planet_house("Ketu")
        
        if (rahu_house == 1 and ketu_house == 7) or (rahu_house == 7 and ketu_house == 1):
            yogas.append({
                "name": "राहु-केतु लग्न-सप्तम अक्ष योग",
                "description": "राहु-केतु लग्न-सप्तम अक्ष पर",
                "suffering": "पहचान संकट, संबंधों में भ्रम, जीवन-साथी चयन में कठिनाई",
                "intensity": "उच्च"
            })
            areas.append("पहचान और संबंध")
        
        # 5. Moon afflicted by Saturn (emotional suffering)
        if self.planets_in_same_house("Moon", "Saturn"):
            yogas.append({
                "name": "चंद्र-शनि कष्ट योग (विष योग)",
                "description": "चंद्रमा-शनि युति",
                "suffering": "भावनात्मक कष्ट, अवसाद, निराशा, माता को कष्ट",
                "intensity": "अति उच्च"
            })
            areas.append("भावनात्मक और मानसिक")
        
        # 6. Mars in 12th (hospitalization, expenses, anger issues)
        if self.is_planet_in_house("Mars", 12):
            yogas.append({
                "name": "मंगल द्वादश कष्ट योग",
                "description": "मंगल द्वादश भाव में",
                "suffering": "अस्पताल, दुर्घटना, क्रोध से हानि, भाइयों से दूरी",
                "intensity": "मध्यम से उच्च"
            })
            areas.append("स्वास्थ्य और भाई")
        
        # 7. Sun in 8th (father's suffering, vitality loss)
        if self.is_planet_in_house("Sun", 8):
            yogas.append({
                "name": "सूर्य अष्टम कष्ट योग",
                "description": "सूर्य अष्टम भाव में",
                "suffering": "पिता को कष्ट, जीवन शक्ति में कमी, अचानक संकट",
                "intensity": "उच्च"
            })
            areas.append("पिता और जीवन शक्ति")
        
        # 8. Jupiter in 6th (guru's disrespect, health issues)
        if self.is_planet_in_house("Jupiter", 6):
            yogas.append({
                "name": "गुरु षष्ठ कष्ट योग",
                "description": "गुरु षष्ठ भाव में",
                "suffering": "गुरु का अपमान, ऋण, स्वास्थ्य समस्या, संतान कष्ट",
                "intensity": "मध्यम"
            })
            areas.append("गुरु और स्वास्थ्य")
        
        # 9. Ketu in 4th (home detachment, mother separation)
        if self.is_planet_in_house("Ketu", 4):
            yogas.append({
                "name": "केतु चतुर्थ कष्ट योग",
                "description": "केतु चतुर्थ भाव में",
                "suffering": "घर से अलगाव, माता से दूरी, मानसिक अशांति",
                "intensity": "मध्यम से उच्च"
            })
            areas.append("घर और माता")
        
        results["suffering_yogas"] = yogas
        results["suffering_areas"] = list(set(areas))
        
        # Intensity assessment
        if len(yogas) == 0:
            results["intensity"] = "निम्न"
            results["description"] = "जीवन में सामान्य चुनौतियाँ।"
        elif len(yogas) <= 2:
            results["intensity"] = "मध्यम"
            results["description"] = "कुछ क्षेत्रों में कष्ट, लेकिन प्रबंधनीय।"
        elif len(yogas) <= 4:
            results["intensity"] = "उच्च"
            results["description"] = "जीवन में महत्वपूर्ण कष्ट। धैर्य और उपाय आवश्यक।"
        else:
            results["intensity"] = "अति उच्च"
            results["description"] = "गंभीर जीवन चुनौतियाँ। मजबूत मानसिकता और आध्यात्मिक सहारा आवश्यक।"
        
        return results
    
    # ==================== RELATIVES ANALYSIS ====================
    
    def analyze_relatives_effects(self) -> Dict[str, Any]:
        """
        Analyze effects on various relatives based on planetary positions
        """
        results = {
            "mother": self._analyze_mother(),
            "father": self._analyze_father(),
            "siblings": self._analyze_siblings(),
            "spouse": self._analyze_spouse(),
            "children": self._analyze_children(),
            "maternal_relatives": self._analyze_maternal_relatives(),
            "paternal_relatives": self._analyze_paternal_relatives()
        }
        
        return results
    
    def _analyze_mother(self) -> Dict:
        """Mother = 4th house and Moon"""
        result = {
            "significators": "चतुर्थ भाव और चंद्रमा",
            "status": "अच्छी",
            "effects": []
        }
        
        # Moon analysis
        moon_house = self.get_planet_house("Moon")
        if moon_house:
            if moon_house in [1, 4, 5, 9, 10]:
                result["effects"].append("माता का आशीर्वाद और सुख")
            elif moon_house in [6, 8, 12]:
                result["effects"].append("माता के स्वास्थ्य में चुनौती")
                result["status"] = "सावधानी"
        
        # Planets in 4th house
        fourth_house_planets = [p for p in self.planets if self.get_planet_house(p) == 4]
        for planet in fourth_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से माता को सुख और समृद्धि")
            elif planet in ["Saturn", "Mars", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से माता को कष्ट या स्वास्थ्य चुनौती")
                result["status"] = "चुनौतीपूर्ण"
        
        # Moon-Saturn conjunction (mother's suffering)
        if self.planets_in_same_house("Moon", "Saturn"):
            result["effects"].append("माता को कष्ट, माता की लंबी आयु लेकिन कठिन जीवन")
            result["status"] = "कष्टदायक"
        
        if not result["effects"]:
            result["effects"].append("माता के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_father(self) -> Dict:
        """Father = 9th house and Sun"""
        result = {
            "significators": "नवम भाव और सूर्य",
            "status": "अच्छी",
            "effects": []
        }
        
        # Sun analysis
        sun_house = self.get_planet_house("Sun")
        if sun_house:
            if sun_house in [1, 5, 9, 10, 11]:
                result["effects"].append("पिता का सहयोग और आशीर्वाद")
            elif sun_house in [6, 8, 12]:
                result["effects"].append("पिता के स्वास्थ्य या संबंध में चुनौती")
                result["status"] = "सावधानी"
        
        # Planets in 9th house
        ninth_house_planets = [p for p in self.planets if self.get_planet_house(p) == 9]
        for planet in ninth_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से पिता का सुख और भाग्य")
            elif planet in ["Saturn", "Mars", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से पिता को कष्ट या मतभेद")
                result["status"] = "चुनौतीपूर्ण"
        
        # Sun in 8th (father's longevity affected)
        if self.is_planet_in_house("Sun", 8):
            result["effects"].append("पिता की आयु पर प्रभाव, पिता से दूरी")
            result["status"] = "कष्टदायक"
        
        if not result["effects"]:
            result["effects"].append("पिता के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_siblings(self) -> Dict:
        """Siblings = 3rd house and Mars"""
        result = {
            "significators": "तृतीय भाव और मंगल",
            "status": "अच्छी",
            "effects": []
        }
        
        # Mars analysis
        mars_house = self.get_planet_house("Mars")
        if mars_house:
            if mars_house in [1, 3, 5, 10, 11]:
                result["effects"].append("भाई-बहनों से सहयोग और लाभ")
            elif mars_house in [6, 8, 12]:
                result["effects"].append("भाई-बहनों से विवाद या दूरी")
                result["status"] = "चुनौतीपूर्ण"
        
        # Planets in 3rd house
        third_house_planets = [p for p in self.planets if self.get_planet_house(p) == 3]
        for planet in third_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से भाई-बहनों का सुख")
            elif planet == "Mars":
                result["effects"].append("भाई-बहनों में साहस, लेकिन विवाद भी संभव")
            elif planet in ["Saturn", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से भाई-बहनों को कष्ट")
                result["status"] = "कष्टदायक"
        
        if not result["effects"]:
            result["effects"].append("भाई-बहनों के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_spouse(self) -> Dict:
        """Spouse = 7th house and Venus (for men) / Jupiter (for women)"""
        result = {
            "significators": "सप्तम भाव, शुक्र (पुरुष के लिए), गुरु (स्त्री के लिए)",
            "status": "अच्छी",
            "effects": []
        }
        
        # Planets in 7th house
        seventh_house_planets = [p for p in self.planets if self.get_planet_house(p) == 7]
        for planet in seventh_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से सुखी वैवाहिक जीवन")
            elif planet == "Mars":
                result["effects"].append("मंगल दोष - वैवाहिक कलह संभव (उपाय से ठीक)")
                result["status"] = "चुनौतीपूर्ण"
            elif planet in ["Saturn", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से विवाह में देरी या कष्ट")
                result["status"] = "कष्टदायक"
        
        # Venus analysis (general spouse indicator)
        venus_house = self.get_planet_house("Venus")
        if venus_house:
            if venus_house in [1, 4, 5, 7, 9, 10, 11]:
                result["effects"].append("शुक्र शुभ स्थान में - सुंदर और सुखी वैवाहिक जीवन")
            elif venus_house in [6, 8, 12]:
                result["effects"].append("शुक्र दुष्ट स्थान में - वैवाहिक चुनौतियाँ")
                result["status"] = "सावधानी"
        
        if not result["effects"]:
            result["effects"].append("पति/पत्नी के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_children(self) -> Dict:
        """Children = 5th house and Jupiter"""
        result = {
            "significators": "पंचम भाव और गुरु",
            "status": "अच्छी",
            "effects": []
        }
        
        # Jupiter analysis
        jupiter_house = self.get_planet_house("Jupiter")
        if jupiter_house:
            if jupiter_house in [1, 2, 4, 5, 9, 10, 11]:
                result["effects"].append("गुरु से संतान सुख और बुद्धिमान संतान")
            elif jupiter_house in [6, 8, 12]:
                result["effects"].append("गुरु दुष्ट स्थान में - संतान प्राप्ति में देरी")
                result["status"] = "सावधानी"
        
        # Planets in 5th house
        fifth_house_planets = [p for p in self.planets if self.get_planet_house(p) == 5]
        for planet in fifth_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से संतान सुख")
            elif planet == "Sun":
                result["effects"].append("सूर्य से संतान में नेतृत्व गुण, लेकिन अहंकार भी")
            elif planet in ["Saturn", "Mars", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से संतान हानि या देरी का योग")
                result["status"] = "कष्टदायक"
        
        # Saturn + Venus in 5th (infertility yoga)
        if self.is_planet_in_house("Saturn", 5) and self.is_planet_in_house("Venus", 5):
            result["effects"].append("संतान प्राप्ति में गंभीर चुनौती - चिकित्सा सहायता लें")
            result["status"] = "अति कष्टदायक"
        
        if not result["effects"]:
            result["effects"].append("संतान के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_maternal_relatives(self) -> Dict:
        """Maternal relatives = 4th house (mainly mother's brother/uncle)"""
        result = {
            "significators": "चतुर्थ भाव (मामा, नाना)",
            "status": "अच्छी",
            "effects": []
        }
        
        fourth_house_planets = [p for p in self.planets if self.get_planet_house(p) == 4]
        for planet in fourth_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से मातृपक्ष का सुख और सहयोग")
            elif planet in ["Saturn", "Mars", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से मातृपक्ष से दूरी या विवाद")
                result["status"] = "चुनौतीपूर्ण"
        
        if not result["effects"]:
            result["effects"].append("मातृपक्ष के साथ सामान्य संबंध")
        
        return result
    
    def _analyze_paternal_relatives(self) -> Dict:
        """Paternal relatives = 9th house (mainly father's brother/uncle)"""
        result = {
            "significators": "नवम भाव (चाचा, दादा)",
            "status": "अच्छी",
            "effects": []
        }
        
        ninth_house_planets = [p for p in self.planets if self.get_planet_house(p) == 9]
        for planet in ninth_house_planets:
            if planet in ["Jupiter", "Venus", "Mercury", "Moon", "Sun"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से पितृपक्ष का सुख और सहयोग")
            elif planet in ["Saturn", "Mars", "Rahu", "Ketu"]:
                result["effects"].append(f"{self._get_planet_hindi(planet)} से पितृपक्ष से दूरी या विवाद")
                result["status"] = "चुनौतीपूर्ण"
        
        if not result["effects"]:
            result["effects"].append("पितृपक्ष के साथ सामान्य संबंध")
        
        return result
    
    # ==================== HELPER METHODS ====================
    
    def _get_planet_hindi(self, planet: str) -> str:
        """Get Hindi name for planet"""
        names = {
            "Sun": "सूर्य",
            "Moon": "चंद्रमा",
            "Mars": "मंगल",
            "Mercury": "बुध",
            "Jupiter": "गुरु",
            "Venus": "शुक्र",
            "Saturn": "शनि",
            "Rahu": "राहु",
            "Ketu": "केतु"
        }
        return names.get(planet, planet)
    
    def _get_sign_name(self, sign_index: int) -> str:
        """Get sign name in Hindi"""
        signs = [
            "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
            "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"
        ]
        return signs[sign_index]
    
    def _get_house_disease_meaning(self, house: int) -> str:
        """Get disease significance of house"""
        meanings = {
            6: "रोग भाव (Diseases, enemies)",
            8: "आयु भाव (Longevity, chronic diseases)",
            12: "व्यय भाव (Hospitalization, expenses)"
        }
        return meanings.get(house, "")
    
    # ==================== COMPREHENSIVE ANALYSIS ====================
    
    def get_complete_analysis(self) -> Dict[str, Any]:
        """
        Get complete planetary sutras analysis
        Returns all analyses in one comprehensive result
        """
        return {
            "disease_analysis": self.analyze_disease_potential(),
            "benefits_losses": self.analyze_benefits_losses(),
            "adultery_indicators": self.analyze_adultery_indicators(),
            "lustful_indicators": self.analyze_lustful_indicators(),
            "marak_analysis": self.analyze_marak_planets(),
            "suffering_analysis": self.analyze_suffering_indicators(),
            "relatives_analysis": self.analyze_relatives_effects()
        }


# ==================== FLASK API ENDPOINT ====================

def analyze_planetary_sutras(chart_data: Dict) -> Dict:
    """
    Main API function to analyze all planetary sutras
    
    Args:
        chart_data: Dictionary containing lagna_sign and planet_positions
        
    Returns:
        Complete analysis of all planetary sutras
    """
    analyzer = PlanetarySutras(chart_data)
    return analyzer.get_complete_analysis()


# Example usage and testing
if __name__ == "__main__":
    # Test data
    test_chart = {
        "lagna_sign": 0,  # Aries
        "planet_positions": {
            "Sun": {"sign_index": 0, "degree": 15.0},
            "Moon": {"sign_index": 3, "degree": 10.0},
            "Mars": {"sign_index": 6, "degree": 20.0},
            "Mercury": {"sign_index": 0, "degree": 25.0},
            "Jupiter": {"sign_index": 8, "degree": 5.0},
            "Venus": {"sign_index": 11, "degree": 12.0},
            "Saturn": {"sign_index": 6, "degree": 18.0},
            "Rahu": {"sign_index": 5, "degree": 22.0},
            "Ketu": {"sign_index": 11, "degree": 22.0}
        }
    }
    
    result = analyze_planetary_sutras(test_chart)
    
    import json
    print(json.dumps(result, ensure_ascii=False, indent=2))
