class MathEngine:
    @staticmethod
    def normalize_angle(angle):
        """ Ensures angle is always between 0 and 360 """
        return angle % 360

    @staticmethod
    def calculate_distance(source_deg, target_deg):
        """ Absolute angular distance from source to target """
        dist = (target_deg - source_deg) % 360
        if dist < 0: 
            dist += 360
        return dist