from nadi_ai.events.base_module import BaseEventModule
from nadi_ai.core.math_engine import MathEngine
from nadi_ai.core.distance_engine import DistanceEngine

class CareerModule(BaseEventModule):
    def generate_signals(self):
        lagna_deg = self.astro_data["La"]["Degree"]
        saturn_deg = self.astro_data["Sa"]["Degree"]
        
        # 1. Saturn to Lagna
        age_sa_to_la = DistanceEngine.convert_distance_to_years(saturn_deg, lagna_deg)
        self.add_signal(
            mode="lagna", source="Sa", target="La", year=age_sa_to_la,
            event_tag="authority_politics_peak", base_strength=4.0,
            explanation="Sa (10th Lord) to Lagna distance indicates major status/political upgrade.",
            domain="career"  # 👈 FIXED: Changed from 'general' to 'career'
        )

        # 2. Aries to Saturn
        age_la_to_sa = DistanceEngine.convert_distance_to_years(0.0, saturn_deg)
        self.add_signal(
            mode="aries", source="Sa", target="aries", year=age_la_to_sa,
            event_tag="career_promotion", base_strength=3.0,
            explanation="Aries to Sa (10th Lord) indicates natural career milestone.",
            domain="career"  # 👈 FIXED: Changed from 'general' to 'career'
        )
        return self.raw_signals

    def _get_10th_lord(self):
        """ 10वें भाव का स्वामी निकालता है """
        lagna_sign_idx = self.astro_data["La"]["Vargas"]["D1"]["Idx"]
        tenth_house_sign_idx = (lagna_sign_idx + 9) % 12
        
        # SIGN_LORDS config से इम्पोर्ट किया जाएगा
        SIGN_LORDS = {0: "Ma", 1: "Ve", 2: "Me", 3: "Mo", 4: "Su", 5: "Me", 
                      6: "Ve", 7: "Ma", 8: "Ju", 9: "Sa", 10: "Sa", 11: "Ju"}
        
        return SIGN_LORDS[tenth_house_sign_idx]

    def _signal_10th_lord_lagna_mode(self):
        """ Mode 3: दशमेश से लग्न की दूरी (बड़ा पद / राजनीति) """
        tenth_lord = self._get_10th_lord()
        lagna_deg = self.astro_data["La"]["Degree"]
        lord_deg = self.astro_data[tenth_lord]["Degree"]
        
        # 10th Lord से Lagna की दूरी
        year_lagna = DistanceEngine.convert_distance_to_years(lord_deg, lagna_deg)
        
        # Context building for WeightEngine
        context = {
            "sign_idx": self.astro_data[tenth_lord]["Vargas"]["D1"]["Idx"],
            "is_retrograde": self.astro_data[tenth_lord].get("IsRetrograde", False),
            "is_combust": self.astro_data[tenth_lord].get("IsCombust", False)
        }
        
        self.add_signal(
            mode="lagna",
            source=tenth_lord,
            target="La",
            year=year_lagna,
            event_tag="authority_politics_peak",
            base_strength=4.0,  # 10th lord -> Lagna is very strong for status
            context=context,
            explanation=f"{tenth_lord} (10th Lord) to Lagna distance indicates major status/political upgrade."
        )

    def _signal_aries_to_10th_lord(self):
        """ Mode 1: मेष से दशमेश की दूरी (सामान्य प्रमोशन) """
        tenth_lord = self._get_10th_lord()
        lord_deg = self.astro_data[tenth_lord]["Degree"]
        
        year_aries = DistanceEngine.convert_distance_to_years(0.0, lord_deg)
        
        context = {
            "sign_idx": self.astro_data[tenth_lord]["Vargas"]["D1"]["Idx"],
            "is_retrograde": self.astro_data[tenth_lord].get("IsRetrograde", False),
            "is_combust": self.astro_data[tenth_lord].get("IsCombust", False)
        }
        
        self.add_signal(
            mode="aries",
            source=tenth_lord,
            target="aries",
            year=year_aries,
            event_tag="career_promotion",
            base_strength=3.0,
            context=context,
            explanation=f"Aries to {tenth_lord} (10th Lord) indicates natural career milestone."
        )

    def _signal_mars_role(self):
        """ 
        Special Logic: अगर मंगल 10वें घर का मालिक (योगकारक) है 
        (Source 20: अमिताभ बच्चन केस - 42वां वर्ष)
        """
        tenth_lord = self._get_10th_lord()
        
        if tenth_lord == "Ma":
            mars_deg = self.astro_data["Ma"]["Degree"]
            lagna_deg = self.astro_data["La"]["Degree"]
            
            year_mars = DistanceEngine.convert_distance_to_years(mars_deg, lagna_deg)
            
            context = {
                "sign_idx": self.astro_data["Ma"]["Vargas"]["D1"]["Idx"],
                "is_retrograde": self.astro_data["Ma"].get("IsRetrograde", False),
                "is_combust": self.astro_data["Ma"].get("IsCombust", False)
            }
            
            self.add_signal(
                mode="lagna",
                source="Ma",
                target="La",
                year=year_mars,
                event_tag="mars_yogakaraka_elevation",
                base_strength=4.5, # Special bonus for Mars as 10th Lord
                context=context,
                explanation="Mars as 10th Lord hitting Lagna signals aggressive career push / authoritative role."
            )