import math
from nadi_ai.config.nakshatra_rules import (
    NAKSHATRAS, NAKSHATRA_LORDS_SEQ, TRIK_MULTIPLIERS, 
    EXALTED_IN_TRIK_BONUS
)
from nadi_ai.config.planet_relationships import NATURAL_RELATIONSHIPS

class NakshatraEngine:
    def __init__(self, dignity_engine):
        self.NAKSHATRA_SIZE = 360 / 27
        self.dignity_engine = dignity_engine 

    def get_nakshatra_info(self, degree):
        normalized_deg = degree % 360
        nak_idx = int(normalized_deg // self.NAKSHATRA_SIZE)
        return {
            "index": nak_idx,
            "name": NAKSHATRAS[nak_idx],
            "lord": NAKSHATRA_LORDS_SEQ[nak_idx]
        }

    def _check_conjunction_orb(self, deg1, deg2, orb=5.0):
        """ Checks if two planets are conjunct within a specific orb (handles 360 wrap) """
        diff = abs(deg1 - deg2)
        return diff <= orb or (360 - diff) <= orb

    def evaluate_supremacy(self, base_planet, astro_data, lagna_sign_idx):
        """ Refined & Production-Safe Supremacy Algorithm """
        
        base_deg = astro_data[base_planet]["Degree"]
        nak_info = self.get_nakshatra_info(base_deg)
        nak_lord = nak_info["lord"]
        
        # 1. House Placements
        base_sign_idx = astro_data[base_planet]["Vargas"]["D1"]["Idx"]
        base_house = (base_sign_idx - lagna_sign_idx + 12) % 12 + 1
        
        lord_d1_idx = astro_data[nak_lord]["Vargas"]["D1"]["Idx"]
        lord_d9_idx = astro_data[nak_lord]["Vargas"]["D9"]["Idx"]
        lord_house = (lord_d1_idx - lagna_sign_idx + 12) % 12 + 1
        
        # 2. Dignities
        is_ret = astro_data[nak_lord].get("IsRetrograde", False)
        is_com = astro_data[nak_lord].get("IsCombust", False)
        
        d1_eval = self.dignity_engine.evaluate(nak_lord, lord_d1_idx, is_ret, is_com)
        d9_eval = self.dignity_engine.evaluate(nak_lord, lord_d9_idx, is_ret, is_com)

        # 🚀 REFINEMENT 1: D9 Weighted Blend (0.6 D1 + 0.4 D9)
        d1_str = d1_eval["final_multiplier"]
        d9_str = d9_eval["final_multiplier"]
        
        blended_strength = (0.6 * d1_str) + (0.4 * d9_str)
        
        # Minimum floor if D9 is exalted
        if d9_eval["dignity"] == "Exalted" and blended_strength < 1.2:
            blended_strength = 1.2
            
        final_multiplier = blended_strength

        # 🚀 REFINEMENT 2: Trik Penalty & Double Trik
        house_mult = 1.0
        if lord_house in TRIK_MULTIPLIERS:
            house_mult = TRIK_MULTIPLIERS[lord_house]
            if d1_eval["dignity"] == "Exalted":
                house_mult += EXALTED_IN_TRIK_BONUS
                
        final_multiplier *= house_mult

        # Modified Double Trik Logic
        is_double_trik = False
        if base_house in [6, 8, 12] and lord_house in [6, 8, 12]:
            is_double_trik = True
            if d1_eval["dignity"] == "Debilitated" or astro_data[base_planet].get("Dignity") == "Debilitated":
                final_multiplier = 0.4  # Absolute disaster only if debilitated
            else:
                final_multiplier *= 0.6 # Softer penalty for normal double trik

        # 🚀 REFINEMENT 3: Asymmetric Enemy/Friend Override
        enemy_mod = 1.0
        nak_lord_relationships = NATURAL_RELATIONSHIPS.get(nak_lord, {})
        
        # We check how the NAKSHATRA LORD feels about the BASE PLANET
        if base_planet in nak_lord_relationships.get("Friends", []):
            enemy_mod = 1.1
        elif base_planet in nak_lord_relationships.get("Enemies", []):
            enemy_mod = 0.8
            
        final_multiplier *= enemy_mod

        # 🚀 REFINEMENT 4: Conjunction Reinforcement (Rule 7)
        is_conjunct = False
        lord_deg = astro_data[nak_lord]["Degree"]
        if self._check_conjunction_orb(base_deg, lord_deg, orb=5.0):
            is_conjunct = True
            final_multiplier *= 1.2  # Self-nakshatra reinforcement bonus

        # 🚀 REFINEMENT 5: Gochar Activation Hook (Rule 8)
        # If the Nakshatra Lord is strongly placed or forms a specific yoga, it becomes sensitive to Gochar
        activation_sensitive = True if final_multiplier > 1.2 or is_double_trik else False

        return {
            "nakshatra": nak_info["name"],
            "nakshatra_lord": nak_lord,
            "d1_strength": round(d1_str, 2),
            "d9_strength": round(d9_str, 2),
            "blended_strength": round(blended_strength, 2),
            "house_multiplier": house_mult,
            "enemy_modifier": enemy_mod,
            "is_double_trik": is_double_trik,
            "is_conjunct_with_lord": is_conjunct,
            "activation_sensitive": activation_sensitive,
            "final_multiplier": round(final_multiplier, 2)
        }