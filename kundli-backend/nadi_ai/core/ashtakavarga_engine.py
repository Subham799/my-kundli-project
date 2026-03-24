class AshtakavargaEngine:
    """
    Pure Deterministic Karmic Timing Engine.
    Calculates exact age triggers based on Ashtakavarga bindus.
    No astrology interpretation here, only math.
    """

    def __init__(self):
        # Planets responsible for Major Struggle / Crisis
        self.DUKH_PLANETS = ["Sa", "Ma", "Ra"]
        
        # Planets responsible for Major Success / Bliss
        self.SUKH_PLANETS = ["Ju", "Ve"]

    def _sum_bindus(self, start_sign_idx, target_sign_idx, sav_bindus):
        """
        Sums the bindus from the starting sign (Lagna) to the target sign (Planet).
        sav_bindus: dict mapping sign index (0-11) to total bindus (int).
        """
        total = 0
        current_idx = start_sign_idx
        
        # Circular sum (inclusive of start and target signs)
        while True:
            total += sav_bindus.get(str(current_idx), 0)  # JSON keys are usually strings
            if current_idx == target_sign_idx:
                break
            current_idx = (current_idx + 1) % 12
            
        return total

    def calculate_exact_age(self, total_bindus):
        """ The Core File Sutra: (Total * 7) / 27 """
        exact_age = (total_bindus * 7) / 27.0
        return round(exact_age, 2)

    def generate_karmic_triggers(self, lagna_sign_idx, astro_data, sav_bindus):
        """
        Scans DUKH and SUKH planets and returns exact age triggers.
        Returns a list of raw signals to be consumed by the Aggregator.
        """
        triggers = []

      # 1️⃣ DUKH TRIGGERS (Struggle / Karma Cleansing)
        for planet in self.DUKH_PLANETS:
            if planet in astro_data:
                p_sign_idx = astro_data[planet]["Vargas"]["D1"]["Idx"]
                total_pts = self._sum_bindus(lagna_sign_idx, p_sign_idx, sav_bindus)
                age = self.calculate_exact_age(total_pts)
                
                triggers.append({
                    "mode": "ashtakavarga_karmic",
                    "source": planet,
                    "target": "karmic_dukh",
                    "year": age,
                    "event_tag": f"{planet}_karmic_crisis_point",
                    
                    "base_strength": -5.0, # 👈 FIX A: Changed from 5.0 to -5.0
                    
                    "domain": "general_crisis",
                    "context": {"total_bindus": total_pts, "sign_idx": p_sign_idx}
                })

        # 2️⃣ SUKH TRIGGERS (Destiny / Joy)
        for planet in self.SUKH_PLANETS:
            if planet in astro_data:
                p_sign_idx = astro_data[planet]["Vargas"]["D1"]["Idx"]
                total_pts = self._sum_bindus(lagna_sign_idx, p_sign_idx, sav_bindus)
                age = self.calculate_exact_age(total_pts)
                
                triggers.append({
                    "mode": "ashtakavarga_karmic",
                    "source": planet,
                    "target": "karmic_sukh",
                    "year": age,
                    "event_tag": f"{planet}_destiny_bliss_point",
                    "base_strength": 5.0,
                    "domain": "general_success",
                    "context": {"total_bindus": total_pts, "sign_idx": p_sign_idx}
                })

        return triggers