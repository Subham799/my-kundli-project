class TaraMilanEngine:
    """
    Calculates Tara Milan between Mahadasha (MD) and Antardasha (AD) Nakshatras.
    Pure deterministic math based on Vedic astrology rules.
    (Updated: Information Only Mode - Removed Multipliers for Safety)
    """

    def __init__(self):
        # Tara definitions based on 1-9 remainder (No multipliers)
        self.TARA_MEANING = {
            1: {"name": "Janma", "nature": "Physical/Mental focus", "is_dangerous": False},
            2: {"name": "Sampat", "nature": "Wealth/Prosperity", "is_dangerous": False},
            3: {"name": "Vipat", "nature": "Obstacle/Danger", "is_dangerous": True},
            4: {"name": "Kshema", "nature": "Well-being/Safety", "is_dangerous": False},
            5: {"name": "Pratyari", "nature": "Enmity/Opposition", "is_dangerous": True},
            6: {"name": "Sadhaka", "nature": "Achievement/Success", "is_dangerous": False},
            7: {"name": "Vadha", "nature": "Destruction/Critical", "is_dangerous": True},
            8: {"name": "Mitra", "nature": "Friendly/Supportive", "is_dangerous": False},
            9: {"name": "Ati-Mitra", "nature": "Very Friendly/Excellent", "is_dangerous": False}
        }

    def evaluate_tara(self, md_nak_idx, ad_nak_idx):
        """
        MD Nakshatra से AD Nakshatra तक गिनना है (Inclusive)।
        nak_idx 0-indexed (0 to 26) होता है।
        """
        if md_nak_idx is None or ad_nak_idx is None:
            return None

        # Inclusive distance: (Target - Source) % 27 + 1
        distance = (ad_nak_idx - md_nak_idx) % 27 + 1
        
        # Tara Remainder (Divide by 9)
        remainder = distance % 9
        
        # In Jyotish, remainder 0 is treated as 9 (Ati-Mitra)
        if remainder == 0:
            remainder = 9
            
        tara_info = self.TARA_MEANING[remainder]
        
        return {
            "tara_number": remainder,
            "tara_name": tara_info["name"],
            "nature": tara_info["nature"],
            "is_dangerous": tara_info["is_dangerous"]
        }