from datetime import timedelta
from nadi_ai.core.bhav_chalit_engine import BhavChalitEngine
from nadi_ai.core.tara_milan_engine import TaraMilanEngine

class WeightEngine:
    """
    Production-safe deterministic scoring engine.
    Acts as a data provider for the Astrologer's Diagnostic Dashboard.
    """

    def __init__(self, dignity_engine, dasha_engine, nakshatra_engine, astro_data, dob_obj):
        self.dignity_engine = dignity_engine
        self.dasha_engine = dasha_engine
        self.nakshatra_engine = nakshatra_engine
        self.astro_data = astro_data
        self.dob = dob_obj
        
        # Initialize Information Engines
        lagna_deg = self.astro_data["La"]["Degree"]
        self.bhav_engine = BhavChalitEngine(lagna_deg)
        self.tara_engine = TaraMilanEngine() 

    def evaluate_signal(self, raw_signal):
        planet_code = raw_signal["source"]
        target_year = raw_signal["year"]
        
        # 1. Base Weight
        base_weight = raw_signal.get("base_strength", 2.0)

        # 2. Bhav Strength (Reporting Mode Only - Does NOT multiply)
        planet_deg = self.astro_data[planet_code]["Degree"]
        
        # 👈 FIX: Matching your exact evaluate_planet function
        bhav_data = self.bhav_engine.evaluate_planet(planet_deg)
        bhav_strength = bhav_data["bhav_strength"]

        # 3. Self Dignity Multiplier
        sign_idx = self.astro_data[planet_code]["Vargas"]["D1"]["Idx"]
        is_ret = self.astro_data[planet_code].get("IsRetrograde", False)
        is_com = self.astro_data[planet_code].get("IsCombust", False)

        dignity_data = self.dignity_engine.evaluate(
            planet_code, sign_idx, is_ret, is_com
        )
        m_self = dignity_data["final_multiplier"]

        # 4. Nakshatra Supremacy Multiplier
        lagna_sign_idx = self.astro_data["La"]["Vargas"]["D1"]["Idx"]
        nak_data = self.nakshatra_engine.evaluate_supremacy(
            base_planet=planet_code,
            astro_data=self.astro_data,
            lagna_sign_idx=lagna_sign_idx
        )
        m_nak = nak_data["final_multiplier"]

        # 5. Dasha Multiplier (Time Permission)
        target_date = self.dob + timedelta(days=target_year * 365.25)
        active_dasha = self.dasha_engine.get_current_mahadasha(target_date)
        m_dasha = self._calculate_dasha_multiplier(planet_code, active_dasha)

        # ======================================================
        # 6. TARA MILAN (INFORMATION ONLY MODE)
        # ======================================================
        tara_details = None
        if active_dasha and active_dasha.get("MD") and active_dasha.get("AD"):
            md_planet = active_dasha["MD"]
            ad_planet = active_dasha["AD"]

            # Safely get nakshatra indices
            try:
                md_nak_info = self.nakshatra_engine.get_nakshatra_info(self.astro_data[md_planet]["Degree"])
                ad_nak_info = self.nakshatra_engine.get_nakshatra_info(self.astro_data[ad_planet]["Degree"])
                
                md_nak = md_nak_info["index"]
                ad_nak = ad_nak_info["index"]

                tara_details = self.tara_engine.evaluate_tara(md_nak, ad_nak)
            except AttributeError:
                 tara_details = {"error": "Nakshatra info lookup not available yet"}

        # ======================================================
        # FINAL SCORE (NO TARA OR BHAV STRENGTH IMPACT)
        # ======================================================
        final_score = base_weight * m_self * m_nak * m_dasha

        # Return Enriched Signal (Lab Report Format)
        enriched = raw_signal.copy()
        enriched.update({
            "self_dignity_multiplier": round(m_self, 2),
            "nakshatra_multiplier": round(m_nak, 2),
            "dasha_multiplier": round(m_dasha, 2),
            "final_score": round(final_score, 3),
            "tara_details": tara_details,
            # 👈 FIX: Matching the exact keys from your BhavChalitEngine
            "bhav_chalit_report": {
                "distance_from_madhya": bhav_data["distance_from_madhya"],
                "bhav_strength": round(bhav_strength, 2),
                "is_sandhi": bhav_data["is_sandhi"]
            },
            "nakshatra_details": nak_data,
            "active_dasha": active_dasha
        })

        return enriched

    def _calculate_dasha_multiplier(self, planet_code, active_dasha):
        if not active_dasha:
            return 1.0

        multiplier = 1.0
        if active_dasha.get("MD") == planet_code:
            multiplier += 0.5  # +50%
        if active_dasha.get("AD") == planet_code:
            multiplier += 0.3  # +30%
        if active_dasha.get("PD") == planet_code:
            multiplier += 0.2  # +20%

        return multiplier