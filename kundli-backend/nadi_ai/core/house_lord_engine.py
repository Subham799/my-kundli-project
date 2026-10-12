class HouseLordEngine:

    def __init__(self, dignity_engine):
        self.dignity_engine = dignity_engine

    def evaluate_house_lord(self, house_number, natal_data, lagna_sign_idx):
        """
        Returns diagnostic strength report of a house lord.
        Does NOT modify scoring.
        """

        # Step 1: Identify house sign
        house_sign_idx = (lagna_sign_idx + house_number - 1) % 12

        # Step 2: Find lord of that sign
        # Assuming you already have sign → lord mapping
        from nadi_ai.config.constants import SIGN_LORDS
        lord = SIGN_LORDS[house_sign_idx]

        if lord not in natal_data:
            return None

        lord_sign_idx = natal_data[lord]["Vargas"]["D1"]["Idx"]
        lord_d9_idx = natal_data[lord]["Vargas"]["D9"]["Idx"]

        is_ret = natal_data[lord].get("IsRetrograde", False)
        is_com = natal_data[lord].get("IsCombust", False)

        # D1 dignity
        d1_eval = self.dignity_engine.evaluate(
            lord, lord_sign_idx, is_ret, is_com
        )

        # D9 dignity
        d9_eval = self.dignity_engine.evaluate(
            lord, lord_d9_idx, is_ret, is_com
        )

        # Kendra / Trikon Check
        lord_house_from_lagna = (
            (lord_sign_idx - lagna_sign_idx) % 12
        ) + 1

        kendra_houses = [1, 4, 7, 10]
        trikon_houses = [1, 5, 9]
        dusthana_houses = [6, 8, 12]

        positional_strength = "neutral"

        if lord_house_from_lagna in kendra_houses:
            positional_strength = "kendra_support"
        elif lord_house_from_lagna in trikon_houses:
            positional_strength = "trikon_support"
        elif lord_house_from_lagna in dusthana_houses:
            positional_strength = "dusthana_challenge"

        return {
            "house_number": house_number,
            "house_lord": lord,
            "lord_house_from_lagna": lord_house_from_lagna,
            "d1_dignity": d1_eval["dignity"],
            "d9_dignity": d9_eval["dignity"],
            "is_retrograde": is_ret,
            "is_combust": is_com,
            "positional_strength": positional_strength
        }
