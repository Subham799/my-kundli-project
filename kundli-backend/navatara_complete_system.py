"""
Navatara Chakra & Complete Planetary Analysis System
====================================================
Implements all classical Vedic astrology rules including:
- Navatara Chakra (Vipat, Pratyari, Vadha Taras)
- Prohibited dates, plants, colors, days
- Arth Trikona (2nd, 6th, 10th house) analysis for all 9 planets
- Complete remedies system
- Classical yogas and combinations
"""

from typing import Dict, List, Any, Optional, Tuple
from enum import Enum

# ==================== NAKSHATRA DATABASE ====================

class NakshatraData:
    """Complete Nakshatra database with ruling planets, dates, plants"""
    
    NAKSHATRA_INFO = {
        1: {
            "name_hindi": "अश्विनी",
            "name_english": "Ashwini",
            "lord": "Ketu",
            "lord_hindi": "केतु",
            "prohibited_dates": [7, 16, 25],
            "prohibited_plant_hindi": "कुचला",
            "prohibited_plant_english": "Strychnos nux-vomica"
        },
        2: {
            "name_hindi": "भरणी",
            "name_english": "Bharani",
            "lord": "Venus",
            "lord_hindi": "शुक्र",
            "prohibited_dates": [6, 15, 24],
            "prohibited_plant_hindi": "आवला",
            "prohibited_plant_english": "Amla"
        },
        3: {
            "name_hindi": "कृत्तिका",
            "name_english": "Krittika",
            "lord": "Sun",
            "lord_hindi": "सूर्य",
            "prohibited_dates": [1, 10, 19, 28],
            "prohibited_plant_hindi": "गूलर",
            "prohibited_plant_english": "Gular/Cluster Fig"
        },
        4: {
            "name_hindi": "रोहिणी",
            "name_english": "Rohini",
            "lord": "Moon",
            "lord_hindi": "चंद्रमा",
            "prohibited_dates": [2, 11, 20, 29],
            "prohibited_plant_hindi": "जामुन",
            "prohibited_plant_english": "Jamun/Black Plum"
        },
        5: {
            "name_hindi": "मृगशिरा",
            "name_english": "Mrigashira",
            "lord": "Mars",
            "lord_hindi": "मंगल",
            "prohibited_dates": [9, 18, 27],
            "prohibited_plant_hindi": "खैर",
            "prohibited_plant_english": "Khair/Acacia"
        },
        6: {
            "name_hindi": "आर्द्रा",
            "name_english": "Ardra",
            "lord": "Rahu",
            "lord_hindi": "राहु",
            "prohibited_dates": [4, 13, 22, 31],
            "prohibited_plant_hindi": "अंगूर",
            "prohibited_plant_english": "Grapes"
        },
        7: {
            "name_hindi": "पुनर्वसु",
            "name_english": "Punarvasu",
            "lord": "Jupiter",
            "lord_hindi": "गुरु",
            "prohibited_dates": [3, 12, 21, 30],
            "prohibited_plant_hindi": "बांस",
            "prohibited_plant_english": "Bamboo"
        },
        8: {
            "name_hindi": "पुष्य",
            "name_english": "Pushya",
            "lord": "Saturn",
            "lord_hindi": "शनि",
            "prohibited_dates": [8, 17, 26],
            "prohibited_plant_hindi": "पीपल",
            "prohibited_plant_english": "Peepal/Sacred Fig"
        },
        9: {
            "name_hindi": "आश्लेषा",
            "name_english": "Ashlesha",
            "lord": "Mercury",
            "lord_hindi": "बुध",
            "prohibited_dates": [5, 14, 23],
            "prohibited_plant_hindi": "नागकेशर",
            "prohibited_plant_english": "Nagkesar"
        },
        10: {
            "name_hindi": "मघा",
            "name_english": "Magha",
            "lord": "Ketu",
            "lord_hindi": "केतु",
            "prohibited_dates": [7, 16, 25],
            "prohibited_plant_hindi": "बरगद",
            "prohibited_plant_english": "Banyan"
        },
        11: {
            "name_hindi": "पूर्वा फाल्गुनी",
            "name_english": "Purva Phalguni",
            "lord": "Venus",
            "lord_hindi": "शुक्र",
            "prohibited_dates": [6, 15, 24],
            "prohibited_plant_hindi": "पलाश",
            "prohibited_plant_english": "Palash"
        },
        12: {
            "name_hindi": "उत्तरा फाल्गुनी",
            "name_english": "Uttara Phalguni",
            "lord": "Sun",
            "lord_hindi": "सूर्य",
            "prohibited_dates": [1, 10, 19, 28],
            "prohibited_plant_hindi": "पाकड़",
            "prohibited_plant_english": "Pakar"
        },
        13: {
            "name_hindi": "हस्त",
            "name_english": "Hasta",
            "lord": "Moon",
            "lord_hindi": "चंद्रमा",
            "prohibited_dates": [2, 11, 20, 29],
            "prohibited_plant_hindi": "आम",
            "prohibited_plant_english": "Mango"
        },
        14: {
            "name_hindi": "चित्रा",
            "name_english": "Chitra",
            "lord": "Mars",
            "lord_hindi": "मंगल",
            "prohibited_dates": [9, 18, 27],
            "prohibited_plant_hindi": "बेल/अर्जुन",
            "prohibited_plant_english": "Bel/Arjun"
        },
        15: {
            "name_hindi": "स्वाति",
            "name_english": "Swati",
            "lord": "Rahu",
            "lord_hindi": "राहु",
            "prohibited_dates": [4, 13, 22, 31],
            "prohibited_plant_hindi": "अर्जुन",
            "prohibited_plant_english": "Arjun"
        },
        16: {
            "name_hindi": "विशाखा",
            "name_english": "Vishakha",
            "lord": "Jupiter",
            "lord_hindi": "गुरु",
            "prohibited_dates": [3, 12, 21, 30],
            "prohibited_plant_hindi": "कैथ",
            "prohibited_plant_english": "Kaith/Wood Apple"
        },
        17: {
            "name_hindi": "अनुराधा",
            "name_english": "Anuradha",
            "lord": "Saturn",
            "lord_hindi": "शनि",
            "prohibited_dates": [8, 17, 26],
            "prohibited_plant_hindi": "मौलसीरी",
            "prohibited_plant_english": "Maulsiri"
        },
        18: {
            "name_hindi": "ज्येष्ठा",
            "name_english": "Jyeshtha",
            "lord": "Mercury",
            "lord_hindi": "बुध",
            "prohibited_dates": [5, 14, 23],
            "prohibited_plant_hindi": "साल",
            "prohibited_plant_english": "Sal"
        },
        19: {
            "name_hindi": "मूल",
            "name_english": "Mula",
            "lord": "Ketu",
            "lord_hindi": "केतु",
            "prohibited_dates": [7, 16, 25],
            "prohibited_plant_hindi": "साल",
            "prohibited_plant_english": "Sal"
        },
        20: {
            "name_hindi": "पूर्वाषाढ़ा",
            "name_english": "Purva Ashadha",
            "lord": "Venus",
            "lord_hindi": "शुक्र",
            "prohibited_dates": [6, 15, 24],
            "prohibited_plant_hindi": "अशोक",
            "prohibited_plant_english": "Ashoka"
        },
        21: {
            "name_hindi": "उत्तराषाढ़ा",
            "name_english": "Uttara Ashadha",
            "lord": "Sun",
            "lord_hindi": "सूर्य",
            "prohibited_dates": [1, 10, 19, 28],
            "prohibited_plant_hindi": "कटहल",
            "prohibited_plant_english": "Jackfruit"
        },
        22: {
            "name_hindi": "श्रवण",
            "name_english": "Shravana",
            "lord": "Moon",
            "lord_hindi": "चंद्रमा",
            "prohibited_dates": [2, 11, 20, 29],
            "prohibited_plant_hindi": "मदार",
            "prohibited_plant_english": "Madar"
        },
        23: {
            "name_hindi": "धनिष्ठा",
            "name_english": "Dhanishta",
            "lord": "Mars",
            "lord_hindi": "मंगल",
            "prohibited_dates": [9, 18, 27],
            "prohibited_plant_hindi": "शमी",
            "prohibited_plant_english": "Shami"
        },
        24: {
            "name_hindi": "शतभिषा",
            "name_english": "Shatabhisha",
            "lord": "Rahu",
            "lord_hindi": "राहु",
            "prohibited_dates": [4, 13, 22, 31],
            "prohibited_plant_hindi": "कदंब",
            "prohibited_plant_english": "Kadamba"
        },
        25: {
            "name_hindi": "पूर्वाभाद्रपद",
            "name_english": "Purva Bhadrapada",
            "lord": "Jupiter",
            "lord_hindi": "गुरु",
            "prohibited_dates": [3, 12, 21, 30],
            "prohibited_plant_hindi": "आम",
            "prohibited_plant_english": "Mango"
        },
        26: {
            "name_hindi": "उत्तराभाद्रपद",
            "name_english": "Uttara Bhadrapada",
            "lord": "Saturn",
            "lord_hindi": "शनि",
            "prohibited_dates": [8, 17, 26],
            "prohibited_plant_hindi": "नीम",
            "prohibited_plant_english": "Neem"
        },
        27: {
            "name_hindi": "रेवती",
            "name_english": "Revati",
            "lord": "Mercury",
            "lord_hindi": "बुध",
            "prohibited_dates": [5, 14, 23],
            "prohibited_plant_hindi": "महुआ",
            "prohibited_plant_english": "Mahua"
        }
    }
    
    # Planet-wise colors and days
    PLANET_COLORS_DAYS = {
        "Sun": {
            "colors_hindi": ["लाल", "नारंगी", "गहरा पीला"],
            "colors_english": ["Red", "Orange", "Deep Yellow"],
            "day_hindi": "रविवार",
            "day_english": "Sunday"
        },
        "Moon": {
            "colors_hindi": ["सफेद", "मोती जैसा"],
            "colors_english": ["White", "Pearl-like"],
            "day_hindi": "सोमवार",
            "day_english": "Monday"
        },
        "Mars": {
            "colors_hindi": ["लाल", "गहरा लाल"],
            "colors_english": ["Red", "Deep Red"],
            "day_hindi": "मंगलवार",
            "day_english": "Tuesday"
        },
        "Mercury": {
            "colors_hindi": ["हरा", "पन्ना जैसा"],
            "colors_english": ["Green", "Emerald-like"],
            "day_hindi": "बुधवार",
            "day_english": "Wednesday"
        },
        "Jupiter": {
            "colors_hindi": ["पीला", "सुनहरा"],
            "colors_english": ["Yellow", "Golden"],
            "day_hindi": "गुरुवार",
            "day_english": "Thursday"
        },
        "Venus": {
            "colors_hindi": ["सफेद", "गुलाबी", "हल्का नीला"],
            "colors_english": ["White", "Pink", "Light Blue"],
            "day_hindi": "शुक्रवार",
            "day_english": "Friday"
        },
        "Saturn": {
            "colors_hindi": ["काला", "गहरा नीला", "बैंगनी"],
            "colors_english": ["Black", "Dark Blue", "Purple"],
            "day_hindi": "शनिवार",
            "day_english": "Saturday"
        },
        "Rahu": {
            "colors_hindi": ["बहुरंगी", "काला", "धुआंधार"],
            "colors_english": ["Multi-color", "Black", "Smoky"],
            "day_hindi": "शनिवार (केतु गोचर के समय)",
            "day_english": "Saturday (during Ketu transit)"
        },
        "Ketu": {
            "colors_hindi": ["बहुरंगी", "धुआंधार"],
            "colors_english": ["Multi-color", "Smoky"],
            "day_hindi": "शनिवार (केतु गोचर के समय)",
            "day_english": "Saturday (during Ketu transit)"
        }
    }


class NavataraChakraAnalyzer:
    """Complete Navatara Chakra Analysis System"""
    
    def __init__(self, birth_nakshatra: int, chart_data: Dict = None):
        """
        Initialize with birth nakshatra (1-27) and optional chart data
        chart_data format:
        {
            'lagna_sign': 0-11,
            'planet_positions': {
                'Sun': {'sign_index': 0-11, 'degree': 0-30, 'nakshatra': 1-27},
                ... all 9 planets
            }
        }
        """
        self.birth_nakshatra = birth_nakshatra
        self.chart_data = chart_data or {}
        
    def calculate_taras(self) -> Dict[str, Any]:
        """Calculate Vipat, Pratyari, and Vadha Taras"""
        
        def get_nakshatra_number(offset: int) -> int:
            """Calculate nakshatra number with wraparound"""
            nak_num = ((self.birth_nakshatra - 1 + offset) % 27) + 1
            return nak_num
        
        # Vipat Tara: 3rd, 12th, 21st nakshatras
        vipat_nakshatras = [
            get_nakshatra_number(2),   # 3rd
            get_nakshatra_number(11),  # 12th
            get_nakshatra_number(20)   # 21st
        ]
        
        # Pratyari Tara: 5th, 14th, 23rd nakshatras
        pratyari_nakshatras = [
            get_nakshatra_number(4),   # 5th
            get_nakshatra_number(13),  # 14th
            get_nakshatra_number(22)   # 23rd
        ]
        
        # Vadha Tara: 7th, 16th, 25th nakshatras
        vadha_nakshatras = [
            get_nakshatra_number(6),   # 7th
            get_nakshatra_number(15),  # 16th
            get_nakshatra_number(24)   # 25th
        ]
        
        # Mitra Tara: 8th, 17th, 26th
        mitra_nakshatras = [
            get_nakshatra_number(7),   # 8th
            get_nakshatra_number(16),  # 17th
            get_nakshatra_number(25)   # 26th
        ]
        
        # Param Mitra (Atimitra) Tara: 9th, 18th, 27th
        param_mitra_nakshatras = [
            get_nakshatra_number(8),   # 9th
            get_nakshatra_number(17),  # 18th
            get_nakshatra_number(26)   # 27th
        ]
        
        # Get ruling planets for bad taras
        vipat_lord = NakshatraData.NAKSHATRA_INFO[vipat_nakshatras[0]]["lord"]
        pratyari_lord = NakshatraData.NAKSHATRA_INFO[pratyari_nakshatras[0]]["lord"]
        vadha_lord = NakshatraData.NAKSHATRA_INFO[vadha_nakshatras[0]]["lord"]
        
        return {
            "birth_nakshatra": {
                "number": self.birth_nakshatra,
                "name_hindi": NakshatraData.NAKSHATRA_INFO[self.birth_nakshatra]["name_hindi"],
                "name_english": NakshatraData.NAKSHATRA_INFO[self.birth_nakshatra]["name_english"]
            },
            "vipat_tara": {
                "nakshatras": vipat_nakshatras,
                "nakshatra_names": [NakshatraData.NAKSHATRA_INFO[n]["name_hindi"] for n in vipat_nakshatras],
                "ruling_planet": vipat_lord,
                "ruling_planet_hindi": NakshatraData.NAKSHATRA_INFO[vipat_nakshatras[0]]["lord_hindi"],
                "effect": "विपत्ति (Calamity, Distress)"
            },
            "pratyari_tara": {
                "nakshatras": pratyari_nakshatras,
                "nakshatra_names": [NakshatraData.NAKSHATRA_INFO[n]["name_hindi"] for n in pratyari_nakshatras],
                "ruling_planet": pratyari_lord,
                "ruling_planet_hindi": NakshatraData.NAKSHATRA_INFO[pratyari_nakshatras[0]]["lord_hindi"],
                "effect": "शारीरिक कष्ट (Physical Problems)"
            },
            "vadha_tara": {
                "nakshatras": vadha_nakshatras,
                "nakshatra_names": [NakshatraData.NAKSHATRA_INFO[n]["name_hindi"] for n in vadha_nakshatras],
                "ruling_planet": vadha_lord,
                "ruling_planet_hindi": NakshatraData.NAKSHATRA_INFO[vadha_nakshatras[0]]["lord_hindi"],
                "effect": "कार्य का अंत (End of Work/Project)"
            },
            "mitra_tara": {
                "nakshatras": mitra_nakshatras,
                "nakshatra_names": [NakshatraData.NAKSHATRA_INFO[n]["name_hindi"] for n in mitra_nakshatras],
                "effect": "मित्रवत (Friendly)"
            },
            "param_mitra_tara": {
                "nakshatras": param_mitra_nakshatras,
                "nakshatra_names": [NakshatraData.NAKSHATRA_INFO[n]["name_hindi"] for n in param_mitra_nakshatras],
                "effect": "अति शुभ (Very Auspicious)"
            }
        }
    
    def get_prohibited_items(self) -> Dict[str, Any]:
        """Get all prohibited dates, plants, colors, days"""
        
        taras = self.calculate_taras()
        
        prohibited = {
            "prohibited_dates": [],
            "prohibited_plants": [],
            "prohibited_colors": [],
            "prohibited_days": [],
            "lucky_dates": [],
            "lucky_plants": [],
            "lucky_colors": [],
            "lucky_days": []
        }
        
        # Collect prohibited items from bad taras
        bad_tara_planets = [
            taras["vipat_tara"]["ruling_planet"],
            taras["pratyari_tara"]["ruling_planet"],
            taras["vadha_tara"]["ruling_planet"]
        ]
        
        for planet in set(bad_tara_planets):  # Use set to avoid duplicates
            # Prohibited dates
            for nak_num in taras["vipat_tara"]["nakshatras"]:
                if NakshatraData.NAKSHATRA_INFO[nak_num]["lord"] == planet:
                    prohibited["prohibited_dates"].extend(
                        NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_dates"]
                    )
                    prohibited["prohibited_plants"].append({
                        "plant_hindi": NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_plant_hindi"],
                        "plant_english": NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_plant_english"],
                        "nakshatra": NakshatraData.NAKSHATRA_INFO[nak_num]["name_hindi"]
                    })
            
            # Prohibited colors and days
            if planet in NakshatraData.PLANET_COLORS_DAYS:
                prohibited["prohibited_colors"].extend(
                    NakshatraData.PLANET_COLORS_DAYS[planet]["colors_hindi"]
                )
                prohibited["prohibited_days"].append(
                    NakshatraData.PLANET_COLORS_DAYS[planet]["day_hindi"]
                )
        
        # Remove duplicates
        prohibited["prohibited_dates"] = sorted(list(set(prohibited["prohibited_dates"])))
        prohibited["prohibited_colors"] = list(set(prohibited["prohibited_colors"]))
        prohibited["prohibited_days"] = list(set(prohibited["prohibited_days"]))
        
        # Get lucky items from Mitra and Param Mitra taras
        lucky_planets = set()
        for nak_num in taras["mitra_tara"]["nakshatras"] + taras["param_mitra_tara"]["nakshatras"]:
            planet = NakshatraData.NAKSHATRA_INFO[nak_num]["lord"]
            lucky_planets.add(planet)
            
            prohibited["lucky_dates"].extend(
                NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_dates"]
            )
            prohibited["lucky_plants"].append({
                "plant_hindi": NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_plant_hindi"],
                "plant_english": NakshatraData.NAKSHATRA_INFO[nak_num]["prohibited_plant_english"],
                "nakshatra": NakshatraData.NAKSHATRA_INFO[nak_num]["name_hindi"]
            })
        
        for planet in lucky_planets:
            if planet in NakshatraData.PLANET_COLORS_DAYS:
                prohibited["lucky_colors"].extend(
                    NakshatraData.PLANET_COLORS_DAYS[planet]["colors_hindi"]
                )
                prohibited["lucky_days"].append(
                    NakshatraData.PLANET_COLORS_DAYS[planet]["day_hindi"]
                )
        
        # Remove duplicates from lucky items
        prohibited["lucky_dates"] = sorted(list(set(prohibited["lucky_dates"])))
        prohibited["lucky_colors"] = list(set(prohibited["lucky_colors"]))
        prohibited["lucky_days"] = list(set(prohibited["lucky_days"]))
        
        return prohibited
    
    def gemstone_recommendation(self) -> Dict[str, Any]:
        """
        Gemstone recommendation based on Navatara Chakra
        Rule: If a benefic planet is in bad tara (Vipat/Pratyari/Vadha), 
        its gemstone won't give miraculous results
        """
        if not self.chart_data or 'planet_positions' not in self.chart_data:
            return {
                "note": "Chart data required for gemstone recommendations"
            }
        
        taras = self.calculate_taras()
        recommendations = {
            "highly_beneficial": [],
            "moderate": [],
            "not_recommended": []
        }
        
        bad_tara_planets = set([
            taras["vipat_tara"]["ruling_planet"],
            taras["pratyari_tara"]["ruling_planet"],
            taras["vadha_tara"]["ruling_planet"]
        ])
        
        good_tara_planets = set()
        for nak_num in taras["mitra_tara"]["nakshatras"] + taras["param_mitra_tara"]["nakshatras"]:
            good_tara_planets.add(NakshatraData.NAKSHATRA_INFO[nak_num]["lord"])
        
        gemstone_map = {
            "Sun": {"hindi": "माणिक्य", "english": "Ruby"},
            "Moon": {"hindi": "मोती", "english": "Pearl"},
            "Mars": {"hindi": "मूंगा", "english": "Coral"},
            "Mercury": {"hindi": "पन्ना", "english": "Emerald"},
            "Jupiter": {"hindi": "पुखराज", "english": "Yellow Sapphire"},
            "Venus": {"hindi": "हीरा", "english": "Diamond"},
            "Saturn": {"hindi": "नीलम", "english": "Blue Sapphire"},
            "Rahu": {"hindi": "गोमेद", "english": "Hessonite"},
            "Ketu": {"hindi": "लहसुनिया", "english": "Cat's Eye"}
        }
        
        for planet in gemstone_map.keys():
            gem_info = {
                "planet": planet,
                "gemstone_hindi": gemstone_map[planet]["hindi"],
                "gemstone_english": gemstone_map[planet]["english"]
            }
            
            if planet in good_tara_planets:
                gem_info["reason"] = f"{planet} शुभ तारा (मित्र/परम मित्र) में है - रत्न अत्यंत लाभकारी होगा"
                recommendations["highly_beneficial"].append(gem_info)
            elif planet in bad_tara_planets:
                gem_info["reason"] = f"{planet} अशुभ तारा (विपत/प्रत्यरी/वध) में है - रत्न से विशेष लाभ नहीं मिलेगा"
                gem_info["note"] = "केवल शारीरिक परेशानियों से बचा सकता है, लेकिन तरक्की नहीं देगा"
                recommendations["not_recommended"].append(gem_info)
            else:
                gem_info["reason"] = "तटस्थ तारा में - मध्यम लाभ संभव"
                recommendations["moderate"].append(gem_info)
        
        return recommendations
    
    def dasha_predictions(self) -> Dict[str, Any]:
        """
        Dasha/Transit predictions based on Navatara Chakra
        """
        taras = self.calculate_taras()
        
        predictions = {
            "vipat_dasha": {
                "planet": taras["vipat_tara"]["ruling_planet"],
                "planet_hindi": taras["vipat_tara"]["ruling_planet_hindi"],
                "effect": "इस ग्रह की दशा/गोचर में विपत्ति और संकट आएगा",
                "advice": "सावधानी बरतें, कोई नया काम शुरू न करें"
            },
            "pratyari_dasha": {
                "planet": taras["pratyari_tara"]["ruling_planet"],
                "planet_hindi": taras["pratyari_tara"]["ruling_planet_hindi"],
                "effect": "इस ग्रह की दशा/गोचर में शारीरिक कष्ट और चोट संभव",
                "advice": "स्वास्थ्य का विशेष ध्यान रखें, दुर्घटनाओं से बचें"
            },
            "vadha_dasha": {
                "planet": taras["vadha_tara"]["ruling_planet"],
                "planet_hindi": taras["vadha_tara"]["ruling_planet_hindi"],
                "effect": "इस ग्रह की दशा/गोचर में कार्य/प्रोजेक्ट का अंत या रुकावट",
                "advice": "नए काम शुरू न करें, चल रहे काम को पूरा करने पर ध्यान दें"
            }
        }
        
        return predictions
    
    def get_complete_navatara_analysis(self) -> Dict[str, Any]:
        """Get complete Navatara Chakra analysis"""
        
        return {
            "taras": self.calculate_taras(),
            "prohibited_items": self.get_prohibited_items(),
            "gemstone_recommendations": self.gemstone_recommendation(),
            "dasha_predictions": self.dasha_predictions(),
            "important_rules": {
                "partnerships": "विपत, प्रत्यरी या वध नक्षत्र में जन्मे लोगों के साथ पार्टनरशिप न करें",
                "muhurta": "अशुभ तारों की तिथियों और दिनों में कोई शुभ कार्य न करें",
                "plants": "वर्जित पौधों को घर में न लगाएं, लेकिन हवन में उपयोग कर सकते हैं",
                "colors": "वर्जित रंगों का उपयोग फैशन/शौक के लिए न करें",
                "ketu_special": "केतु का कोई दिन नहीं - जब केतु लग्न/राशि पर गोचर करे तब शनिवार से बचें"
            }
        }


# ==================== ARTH TRIKONA (2ND, 6TH, 10TH) ANALYSIS ====================

class ArthTrikonaAnalyzer:
    """Complete Arth Trikona (Wealth Triangle) Analysis for all 9 planets"""
    
    # Complete database for all 9 planets in 2nd, 6th, 10th houses
    PLANET_EFFECTS = {
        "Sun": {
            "2nd_house": {
                "wealth_source": "सरकारी, प्रशासनिक क्षेत्र, अधिकार और जिम्मेदारी वाले कार्य, पारिवारिक प्रतिष्ठा, नेतृत्व ब्रांड",
                "speech": "वाणी में कठोरता",
                "warning": "अहंकार और 'मैं ही सही हूँ' वाली सोच से बचें। यदि पीड़ित हो तो सरकारी जुर्माना संभव।"
            },
            "6th_house": {
                "career": "सरकारी नौकरी, रक्षा क्षेत्र, प्रशासनिक सेवा। अनुशासन और टारगेट पूरे करने से आय।",
                "effect": "शत्रुओं पर विजय, लेकिन पिता से मतभेद संभव।",
                "warning": "वर्कहोलिज्म से बचें। तनाव, ब्लड प्रेशर, पित्त, हृदय रोगों को अनदेखा न करें।"
            },
            "10th_house": {
                "career": "दिगबली। नेतृत्व, उच्च पद, स्वतंत्र कार्य, प्रशासन, राजनीति, कंपनी डायरेक्टर। पिता के कर्म क्षेत्र से मिलता-जुलता।",
                "rule": "छोटे पदों के लिए नहीं बना है। स्वतंत्र निर्णय लेने वाले काम चाहिए।",
                "warning": "इमेज मैनेजमेंट पर ध्यान दें। नैतिकता न छोड़ें। ब्रांड टूटी तो अवसर भी टूट जाएंगे।"
            }
        },
        "Moon": {
            "2nd_house": {
                "wealth_source": "जनसमर्थन, नेटवर्किंग, फूड, डेयरी, होटल, हॉस्पिटलिटी, कस्टमर केयर",
                "speech": "मधुर वाणी",
                "warning": "धन अस्थिर रहेगा। मूड स्विंग में निवेश/खर्च न बदलें। भावना में बहकर खर्च न करें।"
            },
            "6th_house": {
                "career": "जलीय तत्व, दवा, नर्सिंग, हेल्थ केयर, काउंसलिंग, सपोर्ट फंक्शन",
                "effect": "मानसिक तनाव। गुप्त शत्रु सक्रिय। भावुकता से निर्णय कमजोर।",
                "warning": "ओवर-केयरिंग न बनें। दूसरों की समस्याएं अपने सिर पर न लें।"
            },
            "10th_house": {
                "career": "मीडिया, पब्लिक डीलिंग, ट्रैवल, महिलाओं से जुड़े क्षेत्र",
                "rule": "उतार-चढ़ाव स्वाभाविक है, परेशान न हों। लोगों की भावनाओं को टच करें।",
                "warning": "सामाजिक छवि/ब्रांड बार-बार न बदलें। स्थिरता सीखें।"
            }
        },
        "Mars": {
            "2nd_house": {
                "wealth_source": "भूमि, संपत्ति, मशीन, तकनीकी कार्य, प्रोडक्शन, रियल एस्टेट, इंजीनियरिंग",
                "speech": "वाणी में तीखापन",
                "warning": "जल्दबाजी न करें। उधार पर झगड़ा न करें, संयम रखें।"
            },
            "6th_house": {
                "career": "अत्यधिक शक्तिशाली। सेना, पुलिस, खेल, सर्जरी, टेक ऑपरेशंस, लिटिगेशन",
                "effect": "मुकदमे और विवाद में विजय। ऋण चुकाने की क्षमता।",
                "warning": "क्रोध से शत्रु बढ़ेंगे। दुर्घटना, चोट, सूजन से सावधान।"
            },
            "10th_house": {
                "career": "आक्रामक नेतृत्व, स्वतंत्र व्यवसाय, निर्माण, प्रोजेक्ट एग्जीक्यूशन",
                "effect": "अधीन काम करने वालों पर सख्ती।",
                "warning": "जल्दबाजी में फैसले न लें। सिस्टम से टकराव न बढ़ाएं।"
            }
        },
        "Mercury": {
            "2nd_house": {
                "wealth_source": "वाणी, बुद्धि, अकाउंटिंग, ट्रेडिंग, कंसल्टेंसी, डिजिटल मार्केटिंग, एजेंसी",
                "speech": "तर्कपूर्ण वाणी",
                "warning": "शॉर्टकट, ओवर-स्मार्टनेस और झूठे वादों से बचें। डाटा एकत्र करते रहें।"
            },
            "6th_house": {
                "career": "बैंकिंग, अकाउंटिंग, लॉ, इंश्योरेंस, डाटा एनालिसिस, ऑडिट",
                "effect": "विवादों को तर्क और रणनीति से जीतेंगे।",
                "warning": "ओवरथिंकिंग, नर्वस स्ट्रेन, स्किन और पेट की समस्या से बचें।"
            },
            "10th_house": {
                "career": "संचार, लेखन, मीडिया, आईटी, शिक्षण, टेक मैनेजमेंट, व्यापार प्रबंधन",
                "effect": "मल्टी-टैलेंटेड। एक से अधिक कार्यों से लाभ। नेटवर्किंग से पहचान।",
                "warning": "इमेज स्पष्ट रखें। जो बोलें वही deliver करें। झूठे वादे न करें।"
            }
        },
        "Jupiter": {
            "2nd_house": {
                "wealth_source": "शिक्षा, बैंकिंग, धर्म, न्याय, मैनेजमेंट, फाइनेंस एडवाइजरी",
                "speech": "गंभीर और सत्यनिष्ठ वाणी",
                "warning": "चोरी, बेईमानी, ईर्ष्या से धन कमाएंगे तो अमीर नहीं होंगे। अति-उदारता से बचें।"
            },
            "6th_house": {
                "career": "शिक्षा, प्रशासन, मैनेजमेंट, ट्रेनिंग, एचआर, न्याय, कंप्लायंस",
                "effect": "शत्रुओं को नैतिकता और ज्ञान से जीतेंगे। विवाद शांतिपूर्ण सुलझाएंगे।",
                "warning": "कर्ज लेने और कानूनी चूक से दूर रहें। एक चूक दूसरी चूक लाएगी।"
            },
            "10th_house": {
                "career": "उच्च पद, शिक्षण, न्याय, पॉलिसी मेकर, बड़े संस्थान में मेंटर",
                "effect": "कार्यक्षेत्र की अपार संभावनाएं। 24 घंटे काम संभव।",
                "warning": "ओवर कॉन्फिडेंस से बचें। बड़े फैसले अचानक न लें। नैतिकता न छोड़ें।"
            }
        },
        "Venus": {
            "2nd_house": {
                "wealth_source": "सुख-सुविधा, कला, सौंदर्य, फैशन, ज्वेलरी, कॉस्मेटिक, होटल, डेकोरेशन",
                "speech": "मधुर और आकर्षक",
                "warning": "विलासिता पर अंधाधुंध खर्च से बचें। कमाई के साथ खर्च अत्यधिक न बढ़ाएं। बुरे दिन न भूलें।"
            },
            "6th_house": {
                "career": "सेवा क्षेत्र में रचनात्मक कार्य, क्लाइंट मैनेजमेंट, ब्रांड सर्विस, एचआर",
                "effect": "कार्यस्थल पर आकर्षण से ईर्ष्या संभव। प्रजनन और शुगर की समस्या।",
                "warning": "ऑफिस रोमांस और अनुचित संबंधों से बचें। विवाद निजी स्तर पर सुलझाएं।"
            },
            "10th_house": {
                "career": "कला, मीडिया, फिल्म, फैशन डिजाइनिंग, विलासिता उद्योग, क्रिएटिव पीआर",
                "effect": "सार्वजनिक छवि आकर्षक। ग्राहकों का समर्थन।",
                "warning": "इमेज आधुनिक और अप-टू-डेट रखें। कोरे दिखावे से बचें, वास्तविकता में जिएं।"
            }
        },
        "Saturn": {
            "2nd_house": {
                "wealth_source": "धीरे-धीरे, अनुशासन और दीर्घकालिक बचत (Mutual Funds, SIP)",
                "speech": "कम लेकिन कसैला बोलेंगे",
                "warning": "कंजूसी से बचें। परिवार में भय का वातावरण न बनाएं। बिना परिश्रम के धन नहीं।"
            },
            "6th_house": {
                "career": "प्रशासन, कंप्लायंस, ऑडिट, लेबर मैनेजमेंट, प्रोडक्शन सिस्टम",
                "effect": "अत्यंत व्यावहारिक। धीरे लेकिन स्थायी विजय। ऋण योजनाबद्ध चुकता।",
                "warning": "ओवरवर्क न करें। गठिया, हड्डी, थकान को नजरअंदाज न करें।"
            },
            "10th_house": {
                "career": "सिस्टम बिल्डर, बड़े ऑपरेशंस, इंफ्रास्ट्रक्चर, एडमिनिस्ट्रेटर",
                "effect": "शुरुआत में देरी, मध्य आयु बाद स्थायी प्रतिष्ठा।",
                "warning": "धीमी प्रगति से निराश होकर बार-बार काम न बदलें। अनुशासन में रहें।"
            }
        },
        "Rahu": {
            "2nd_house": {
                "wealth_source": "विदेशी स्रोत, ऑनलाइन डोमेन, टेक मार्केटिंग, ट्रेंडिंग बिजनेस",
                "speech": "चालाक, झूठ बोलने की प्रवृत्ति",
                "warning": "लालच में न पड़ें। शॉर्टकट और झूठे वादों से बचें।"
            },
            "6th_house": {
                "career": "कॉरपोरेट पॉलिटिक्स, साइबर सुरक्षा, रिस्क मैनेजमेंट, लीगल डिफेंस",
                "effect": "प्रतिस्पर्धा में तेज। चालाकी से विरोधी पराजित।",
                "warning": "अनैतिक तरीकों से धन बिल्कुल न कमाएं। कोर्ट-कचहरी से सावधान।"
            },
            "10th_house": {
                "career": "अचानक बड़ा उछाल, पब्लिक विजिबिलिटी। नई तकनीक (AI) और विदेशी नेटवर्क।",
                "effect": "बड़ा प्लेटफॉर्म।",
                "warning": "इमेज सुरक्षित रखें। स्कैंडल, गलत संगति और ओवर-एम्बिशस से बचें।"
            }
        },
        "Ketu": {
            "2nd_house": {
                "wealth_source": "अपने लिए नहीं, दूसरों के लिए कमाते हैं। रोजगार देने के लिए।",
                "speech": "विरक्त",
                "warning": "धन से आसक्ति नहीं। दस्तावेज कमजोर न होने दें। पैसा गुम हो सकता है।"
            },
            "6th_house": {
                "career": "समस्या समाधान, एनालिटिक्स, बैक-एंड, हीलिंग, रिसर्च, वैकल्पिक चिकित्सा",
                "effect": "शत्रुओं का अचानक अंत। रहस्यमई रोग।",
                "warning": "ऑफिस पॉलिटिक्स और अनदेखे शत्रुओं से सतर्क।"
            },
            "10th_house": {
                "career": "शोध, आध्यात्मिक मार्गदर्शन, ज्योतिष, आईटी सुरक्षा, गुप्त विज्ञान",
                "effect": "कर्म में आंतरिक अर्थ खोजते हैं। बाहरी सफलता से संतुष्ट नहीं।",
                "warning": "बार-बार लक्ष्य न बदलें। हर 10 महीने में दिशा बदलना खतरनाक।"
            }
        }
    }
    
    def __init__(self, chart_data: Dict):
        """
        Initialize with chart data
        chart_data format:
        {
            'lagna_sign': 0-11,
            'planet_positions': {planet_name: {'sign_index': 0-11, 'degree': float}}
        }
        """
        self.chart_data = chart_data
        self.lagna_sign = chart_data.get('lagna_sign', 0)
        self.planets = chart_data.get('planet_positions', {})
    
    def get_house_from_lagna(self, sign_index: int) -> int:
        """Get bhava number from lagna (1-12)"""
        house = ((sign_index - self.lagna_sign) % 12) + 1
        return house
    
    def analyze_arth_trikona(self) -> Dict[str, Any]:
        """Analyze 2nd, 6th, and 10th houses for wealth and career"""
        
        analysis = {
            "second_house": {"planets": [], "lord_effect": None},
            "sixth_house": {"planets": [], "lord_effect": None},
            "tenth_house": {"planets": [], "lord_effect": None}
        }
        
        # Analyze planets in 2nd, 6th, 10th houses
        for planet, pos_data in self.planets.items():
            house = self.get_house_from_lagna(pos_data['sign_index'])
            
            if house == 2 and planet in self.PLANET_EFFECTS:
                analysis["second_house"]["planets"].append({
                    "planet": planet,
                    "analysis": self.PLANET_EFFECTS[planet]["2nd_house"]
                })
            elif house == 6 and planet in self.PLANET_EFFECTS:
                analysis["sixth_house"]["planets"].append({
                    "planet": planet,
                    "analysis": self.PLANET_EFFECTS[planet]["6th_house"]
                })
            elif house == 10 and planet in self.PLANET_EFFECTS:
                analysis["tenth_house"]["planets"].append({
                    "planet": planet,
                    "analysis": self.PLANET_EFFECTS[planet]["10th_house"]
                })
        
        return analysis


# ==================== REMEDIES DATABASE ====================

class RemediesSystem:
    """Complete remedies for all 9 planets"""
    
    REMEDIES = {
        "Sun": {
            "mantra_tantric": "ॐ घृणिः सूर्याय नमः",
            "mantra_beej": "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
            "donation_items": ["गेहूँ", "गुड़", "कमल फूल", "लाल चन्दन", "लाल वस्त्र", "ताँबा", "माणिक्य", "सवत्सा गौ"],
            "donation_day": "रविवार",
            "gemstone": "माणिक्य (Ruby)",
            "upratna": "सूर्यकान्त मणि, लालड़ी, तामड़ा",
            "special": "गाय को रोटी, गुड़ और चारा। गोमाता के नेत्रों के दर्शन।"
        },
        "Moon": {
            "mantra_tantric": "ॐ सों सोमाय नमः",
            "mantra_beej": "ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः",
            "donation_items": ["सफेद चावल", "सफेद वस्त्र", "चीनी", "चाँदी", "दही", "घी", "शंख", "मोती", "कपूर"],
            "donation_day": "सोमवार",
            "gemstone": "मोती (Pearl)",
            "upratna": "चन्द्रकान्त मणि"
        },
        "Mars": {
            "mantra_tantric": "ॐ अं अङ्गारकाय नमः",
            "mantra_beej": "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
            "donation_items": ["मसूर की दाल", "गेहूँ", "लाल बैल", "गुड़", "लाल चन्दन", "लाल वस्त्र", "ताँबा", "केसर"],
            "donation_day": "मंगलवार",
            "gemstone": "मूँगा (Coral)",
            "upratna": "विद्रुम मणि, रतुआ, लाल अकीक",
            "special": "अत्यधिक पीड़ा हो तो अपने वजन के बराबर गुड़ का दान।"
        },
        "Mercury": {
            "mantra_tantric": "ॐ बुं बुधाय नमः",
            "mantra_beej": "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
            "donation_items": ["हरी मूँग", "हरा वस्त्र", "काँस्यपात्र", "हाथी-दाँत", "घी", "कपूर", "6 रस वाला भोजन"],
            "donation_day": "बुधवार",
            "gemstone": "पन्ना (Emerald)",
            "upratna": "मरगज, जबरजन्द"
        },
        "Jupiter": {
            "mantra_tantric": "ॐ बृं बृहस्पतये नमः",
            "mantra_beej": "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
            "donation_items": ["पीला धान्य (चने की दाल)", "पीला वस्त्र", "हल्दी", "पीला फल", "घी", "पुस्तक", "छाता"],
            "donation_day": "गुरुवार",
            "gemstone": "पुखराज (Yellow Sapphire)",
            "upratna": "सोनल, सुनेला",
            "special": "गाय के कूबड़ के दर्शन। गुड़ और चने की दाल खिलाएं।"
        },
        "Venus": {
            "mantra_tantric": "ॐ शुं शुक्राय नमः",
            "mantra_beej": "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
            "donation_items": ["सफेद चन्दन", "सफेद चावल", "सफेद वस्त्र", "सुगन्धित द्रव्य", "घी", "दही", "चाँदी"],
            "donation_day": "शुक्रवार",
            "gemstone": "हीरा (Diamond)",
            "upratna": "कुरंगी, दतला, सिम्मा, तुरमली, ओपल",
            "special": "सफेद गाय को प्रातःकाल भोजन से एक रोटी खिलाएं।"
        },
        "Saturn": {
            "mantra_tantric": "ॐ शं शनैश्चराय नमः",
            "mantra_beej": "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
            "donation_items": ["काले तिल", "उड़द", "तेल (सरसों)", "काला वस्त्र", "लोहा", "भैंस", "काली गाय", "जूते", "कस्तूरी"],
            "donation_day": "शनिवार",
            "gemstone": "नीलम (Blue Sapphire)",
            "upratna": "जमुनिया नीली, लाजवर्त, काला अकीक"
        },
        "Rahu": {
            "mantra_tantric": "ॐ रां राहवे नमः",
            "mantra_beej": "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
            "donation_items": ["सप्तधान्य", "उड़द", "नीला वस्त्र", "काला फूल", "खड्ग", "सूप", "तिल", "तेल", "लोहा", "गोमेद"],
            "donation_day": "बुधवार/शनिवार रात्रि",
            "gemstone": "गोमेद (Hessonite)",
            "upratna": "साफी, तुरसा",
            "special": "शिव तांडव स्तोत्र पाठ। शिवलिंग पर मिसरी-दूध। बहते जल में कोयले।"
        },
        "Ketu": {
            "mantra_tantric": "ॐ कें केतवे नमः",
            "mantra_beej": "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
            "donation_items": ["काले तिल", "कम्बल", "कस्तूरी", "उड़द", "काला फूल", "तिल का तेल", "लोहा", "बकरा"],
            "donation_day": "मंगलवार/शनिवार",
            "gemstone": "लहसुनिया (Cat's Eye)",
            "upratna": "फिरोजा, गोदन्त, संघीय"
        }
    }
    
    SUPREME_RULES = {
        "donation_vs_japa": "दान से ग्रह कमजोर होता है, जप से प्रसन्न होता है।",
        "gemstone_vs_rudraksha": "कारक ग्रहों का रत्न पहनें। मारक/बाधक ग्रहों का रुद्राक्ष पहनें।",
        "abhimanyu_jailer_rule": "यदि ग्रह किसी क्रूर ग्रह के नक्षत्र में फंसा हो, तो पीड़ित ग्रह का उपाय न करें, बल्कि जेलर ग्रह का दान करें।"
    }


# ==================== API FUNCTION ====================

def complete_navatara_planetary_analysis(
    birth_nakshatra: int,
    chart_data: Dict = None
) -> Dict[str, Any]:
    """
    Complete analysis combining Navatara Chakra and Planetary Analysis
    
    Args:
        birth_nakshatra: Birth nakshatra number (1-27)
        chart_data: Optional chart data for detailed analysis
        
    Returns:
        Complete analysis dictionary
    """
    
    # Navatara Chakra Analysis
    navatara_analyzer = NavataraChakraAnalyzer(birth_nakshatra, chart_data)
    navatara_analysis = navatara_analyzer.get_complete_navatara_analysis()
    
    # Arth Trikona Analysis (if chart data available)
    arth_trikona_analysis = None
    if chart_data:
        arth_analyzer = ArthTrikonaAnalyzer(chart_data)
        arth_trikona_analysis = arth_analyzer.analyze_arth_trikona()
    
    return {
        "navatara_chakra": navatara_analysis,
        "arth_trikona": arth_trikona_analysis,
        "remedies": RemediesSystem.REMEDIES,
        "remedy_rules": RemediesSystem.SUPREME_RULES
    }


# Example usage
if __name__ == "__main__":
    # Test with Uttara Bhadrapada nakshatra (26)
    test_chart = {
        "lagna_sign": 3,  # Cancer
        "planet_positions": {
            "Sun": {"sign_index": 0, "degree": 15.0, "nakshatra": 3},
            "Moon": {"sign_index": 9, "degree": 10.0, "nakshatra": 26},  # Birth nakshatra
            "Mars": {"sign_index": 6, "degree": 20.0, "nakshatra": 14},
            "Mercury": {"sign_index": 0, "degree": 25.0, "nakshatra": 3},
            "Jupiter": {"sign_index": 8, "degree": 5.0, "nakshatra": 20},
            "Venus": {"sign_index": 11, "degree": 12.0, "nakshatra": 27},
            "Saturn": {"sign_index": 6, "degree": 18.0, "nakshatra": 14},
            "Rahu": {"sign_index": 5, "degree": 22.0, "nakshatra": 11},
            "Ketu": {"sign_index": 11, "degree": 22.0, "nakshatra": 25}
        }
    }
    
    result = complete_navatara_planetary_analysis(26, test_chart)
    
    import json
    print(json.dumps(result, ensure_ascii=False, indent=2))
