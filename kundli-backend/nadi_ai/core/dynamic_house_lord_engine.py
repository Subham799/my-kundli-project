from nadi_ai.config.constants import SIGN_LORDS


class DynamicHouseLordEngine:

    def __init__(self, dignity_engine, nakshatra_engine):
        self.dignity_engine = dignity_engine
        self.nakshatra_engine = nakshatra_engine

    # ----------------------------------------------------

    def evaluate_house_lord(self, house_number, astro_data, lagna_sign):

        # 1️⃣ Determine house sign
        house_sign = (lagna_sign + house_number - 1) % 12

        # 2️⃣ Find lord
        lord = SIGN_LORDS[house_sign]

        if lord not in astro_data:
            return None

        lord_data = astro_data[lord]

        lord_sign_d1 = lord_data["Vargas"]["D1"]["Idx"]
        lord_sign_d9 = lord_data["Vargas"]["D9"]["Idx"]

        # 3️⃣ Dignity D1
        d1_report = self.dignity_engine.evaluate(
            lord,
            lord_sign_d1,
            lord_data.get("IsRetrograde", False),
            lord_data.get("IsCombust", False)
        )

        # 4️⃣ Dignity D9
        d9_report = self.dignity_engine.evaluate(
            lord,
            lord_sign_d9,
            lord_data.get("IsRetrograde", False),
            False
        )

        # 5️⃣ Bhav Placement
        lord_house = (lord_sign_d1 - lagna_sign) % 12 + 1

        house_type = self._classify_house(lord_house)

        # 6️⃣ Nakshatra Influence
        nak_report = self.nakshatra_engine.evaluate_supremacy(
            lord,
            astro_data,
            lagna_sign
        )

        # 7️⃣ Aspect Scan (Basic)
        aspects = self._scan_aspects(lord, astro_data)

        return {
            "house_number": house_number,
            "house_sign": house_sign,
            "lord": lord,
            "lord_current_house": lord_house,
            "house_type": house_type,
            "d1_dignity": d1_report["dignity"],
            "d9_dignity": d9_report["dignity"],
            "combust": lord_data.get("IsCombust", False),
            "retrograde": lord_data.get("IsRetrograde", False),
            "nakshatra_details": nak_report,
            "aspected_by": aspects
        }

    # ----------------------------------------------------

    def _classify_house(self, house):
        if house in [1, 4, 7, 10]:
            return "Kendra"
        elif house in [5, 9]:
            return "Trikon"
        elif house in [6, 8, 12]:
            return "Trik"
        elif house in [3, 11]:
            return "Upachaya"
        else:
            return "Neutral"

    # ----------------------------------------------------

    def _scan_aspects(self, lord, astro_data):
        results = []

        lord_sign = astro_data[lord]["Vargas"]["D1"]["Idx"]

        for p, pdata in astro_data.items():

            if p == lord:
                continue

            if "Vargas" not in pdata:
                continue

            p_sign = pdata["Vargas"]["D1"]["Idx"]

            diff = (p_sign - lord_sign) % 12

            # Saturn aspects
            if p == "Sa" and diff in [3, 7, 10]:
                results.append("Saturn Aspect")

            # Jupiter aspects
            if p == "Ju" and diff in [5, 7, 9]:
                results.append("Jupiter Aspect")

            # Mars aspects
            if p == "Ma" and diff in [4, 7, 8]:
                results.append("Mars Aspect")

        return results
