import swisseph as swe
from datetime import datetime


class GocharEngine:

    ORB = 5.0

    def __init__(self, house_lord_engine=None):
        """
        house_lord_engine is optional.
        If not provided → house lord analysis will be skipped safely.
        """
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        self.house_lord_engine = house_lord_engine

        self.PLANETS = {
            "Su": swe.SUN,
            "Mo": swe.MOON,
            "Ma": swe.MARS,
            "Me": swe.MERCURY,
            "Ju": swe.JUPITER,
            "Ve": swe.VENUS,
            "Sa": swe.SATURN,
            "Ra": swe.MEAN_NODE
        }

    # -----------------------------------------------------

    def _jd(self, dt):
        return swe.julday(
            dt.year,
            dt.month,
            dt.day,
            dt.hour + dt.minute / 60.0
        )

    # -----------------------------------------------------

    def _degree_diff(self, d1, d2):
        diff = abs(d1 - d2)
        return min(diff, 360 - diff)

    # -----------------------------------------------------

    def _aspect_check(self, planet, tr_sign, target_sign):
        diff = (tr_sign - target_sign) % 12

        if planet == "Sa":
            return diff in [3, 7, 10]
        if planet == "Ju":
            return diff in [5, 7, 9]
        if planet == "Ma":
            return diff in [4, 7, 8]

        return diff == 7  # generic 7th aspect

    # -----------------------------------------------------

    def evaluate(self, natal_data, target_date):

        jd = self._jd(target_date)

        # =============================
        # Transit Positions
        # =============================
        transit = {}

        for key, swe_id in self.PLANETS.items():
            calc_flag = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
            pos, _ = swe.calc_ut(jd, swe_id, calc_flag)

            degree = pos[0]

            transit[key] = {
                "degree": degree,
                "sign": int(degree / 30)
            }

        conjunctions = []
        aspects = []
        combust_flags = []
        sade_sati_phase = None

        # =============================
        # Conjunction + Aspect
        # =============================
        for tr_p, tr_data in transit.items():

            for nat_p, nat_data in natal_data.items():

                if nat_p not in self.PLANETS:
                    continue

                nat_deg = nat_data["Degree"]
                nat_sign = nat_data["Vargas"]["D1"]["Idx"]

                # Conjunction
                if self._degree_diff(tr_data["degree"], nat_deg) <= self.ORB:
                    conjunctions.append(f"{tr_p} conjunct Natal {nat_p}")

                # Aspect
                if self._aspect_check(tr_p, tr_data["sign"], nat_sign):
                    aspects.append(f"{tr_p} aspect Natal {nat_p}")

        # =============================
        # Combust Check
        # =============================
        sun_deg = transit["Su"]["degree"]

        for p in ["Ve", "Ju"]:
            if self._degree_diff(transit[p]["degree"], sun_deg) <= 8:
                combust_flags.append(f"{p} Combust in Transit")

        # =============================
        # Sade Sati
        # =============================
        if "Mo" in natal_data:
            moon_sign = natal_data["Mo"]["Vargas"]["D1"]["Idx"]
            diff = (transit["Sa"]["sign"] - moon_sign) % 12

            if diff == 11:
                sade_sati_phase = "Phase 1"
            elif diff == 0:
                sade_sati_phase = "Phase 2"
            elif diff == 1:
                sade_sati_phase = "Phase 3"

        # =============================
        # Double Transit House Activation
        # =============================
        double_house_activation = self.detect_double_transit_house_activation(
            natal_data, transit
        )

        return {
            "transit_signs": {k: v["sign"] for k, v in transit.items()},
            "conjunctions": conjunctions,
            "aspects": aspects,
            "combust_flags": combust_flags,
            "sade_sati_phase": sade_sati_phase,
            "double_transit_houses": double_house_activation
        }

    # ======================================================
    # DOUBLE TRANSIT + OWNERSHIP REFINED
    # ======================================================
    def detect_double_transit_house_activation(self, natal_data, transit):

        activated_houses = []

        lagna_sign = natal_data["La"]["Vargas"]["D1"]["Idx"]

        for house in range(1, 13):

            house_sign = (lagna_sign + house - 1) % 12

            guru_hit = False
            shani_hit = False

            # ---------------------------
            # Occupation
            # ---------------------------
            if transit["Ju"]["sign"] == house_sign:
                guru_hit = True

            if transit["Sa"]["sign"] == house_sign:
                shani_hit = True

            # ---------------------------
            # Aspect
            # ---------------------------
            if self._aspect_check("Ju", transit["Ju"]["sign"], house_sign):
                guru_hit = True

            if self._aspect_check("Sa", transit["Sa"]["sign"], house_sign):
                shani_hit = True

            # ---------------------------
            # Double Activation
            # ---------------------------
            if guru_hit and shani_hit:

                house_report = {
                    "house_number": house,
                    "house_sign": house_sign,
                    "activation_type": "double_transit",
                    "house_lord_analysis": None
                }

                # Safe integration (no crash if engine not provided)
                if self.house_lord_engine:
                    house_report["house_lord_analysis"] = (
                        self.house_lord_engine.evaluate_house_lord(
                            house,
                            natal_data,
                            lagna_sign
                        )
                    )

                activated_houses.append(house_report)

        return activated_houses
