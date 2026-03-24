class BhavChalitEngine:
    """
    Pure Bhav Madhya proximity calculator.
    No scoring.
    No interpretation.
    """

    def __init__(self, lagna_absolute_degree):
        self.lagna_deg = lagna_absolute_degree

    def evaluate_planet(self, planet_absolute_degree):
        lagna_relative = self.lagna_deg % 30
        planet_relative = planet_absolute_degree % 30

        distance = abs(planet_relative - lagna_relative)

        if distance > 15:
            distance = 30 - distance

        bhav_strength = (15.0 - distance) / 15.0

        is_sandhi = distance >= 13.5  # near junction threshold

        return {
            "lagna_degree": round(self.lagna_deg, 2),
            "planet_degree": round(planet_absolute_degree, 2),
            "distance_from_madhya": round(distance, 2),
            "bhav_strength": round(bhav_strength, 3),
            "is_sandhi": is_sandhi
        }
