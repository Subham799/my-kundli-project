from nadi_ai.core.math_engine import MathEngine

class DistanceEngine:
    @staticmethod
    def convert_distance_to_years(source_deg, target_deg):
        """ 
        The actual Nadi logic: 1 Sign = 9 Years, 1 Navamsa = 1 Year 
        """
        dist = MathEngine.calculate_distance(source_deg, target_deg)
        signs_passed = int(dist // 30)
        degrees_rem = dist % 30
        
        # 3.3333... degree = 1 year => 1 degree = 0.3 years
        years = (signs_passed * 9) + (degrees_rem / (30/9))
        return round(years, 2)