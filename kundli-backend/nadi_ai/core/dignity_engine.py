class DignityEngine:
    def __init__(self):
        # 0=Aries, 1=Taurus, 2=Gemini, 3=Cancer, 4=Leo, 5=Virgo, 
        # 6=Libra, 7=Scorpio, 8=Sagittarius, 9=Capricorn, 10=Aquarius, 11=Pisces
        
        # ग्रहों की स्वराशि (Own Signs)
        self.OWN_SIGNS = {
            "Su": [4], "Mo": [3], "Ma": [0, 7], "Me": [2, 5], 
            "Ju": [8, 11], "Ve": [1, 6], "Sa": [9, 10]
        }
        
        # ग्रहों की उच्च (Exalted) और नीच (Debilitated) राशियां
        self.EXALTED_SIGNS = {
            "Su": 0, "Mo": 1, "Ma": 9, "Me": 5, "Ju": 3, "Ve": 11, "Sa": 6, "Ra": 1, "Ke": 7
        }
        self.DEBILITATED_SIGNS = {
            "Su": 6, "Mo": 7, "Ma": 3, "Me": 11, "Ju": 9, "Ve": 5, "Sa": 0, "Ra": 7, "Ke": 1
        }
        
        # नैसर्गिक मित्रता (Natural Friendship) - Simplified for Shadbala-lite
        # कौन सा ग्रह किन ग्रहों का मित्र है
        self.FRIENDS = {
            "Su": ["Mo", "Ma", "Ju"],
            "Mo": ["Su", "Me"],
            "Ma": ["Su", "Mo", "Ju"],
            "Me": ["Su", "Ve"],
            "Ju": ["Su", "Mo", "Ma"],
            "Ve": ["Me", "Sa"],
            "Sa": ["Me", "Ve"],
            "Ra": ["Ve", "Sa", "Me"],
            "Ke": ["Ma", "Ju", "Su"]
        }

    def evaluate(self, planet_code, sign_idx, is_retrograde=False, is_combust=False):
        """
        यह फंक्शन ग्रह का शुद्ध डेटा (Data) और मल्टीप्लायर (Multiplier) रिटर्न करेगा। 
        कोई प्रेडिक्शन या इंटरप्रिटेशन नहीं।
        """
        dignity_state = "Neutral"
        multiplier = 1.0

        # 1. Check Exalted / Debilitated / Own Sign
        if self.EXALTED_SIGNS.get(planet_code) == sign_idx:
            dignity_state = "Exalted"
            multiplier = 1.5
        elif self.DEBILITATED_SIGNS.get(planet_code) == sign_idx:
            dignity_state = "Debilitated"
            multiplier = 0.5
        elif planet_code in self.OWN_SIGNS and sign_idx in self.OWN_SIGNS[planet_code]:
            dignity_state = "Own"
            multiplier = 1.2
        else:
            # 2. Check Friendship with the Sign Lord
            # SIGN_LORDS config से इम्पोर्ट किया जाएगा, यहाँ उदाहरण के लिए:
            sign_lords = {0:"Ma", 1:"Ve", 2:"Me", 3:"Mo", 4:"Su", 5:"Me", 6:"Ve", 7:"Ma", 8:"Ju", 9:"Sa", 10:"Sa", 11:"Ju"}
            lord_of_sign = sign_lords.get(sign_idx)
            
            if lord_of_sign in self.FRIENDS.get(planet_code, []):
                dignity_state = "Friendly"
                multiplier = 1.1
            elif planet_code in self.FRIENDS.get(lord_of_sign, []): 
                # अगर साइन लॉर्ड इसे दोस्त मानता है तो सम (Neutral/Friendly)
                dignity_state = "Neutral"
                multiplier = 1.0
            else:
                dignity_state = "Enemy"
                multiplier = 0.7

        # 3. Apply Retrograde / Combust Modifiers
        if is_combust:
            multiplier *= 0.5  # अस्त ग्रह बलहीन हो जाता है
        if is_retrograde and dignity_state != "Debilitated":
            multiplier *= 1.2  # वक्री ग्रह चेष्टा बल के कारण स्ट्रॉन्ग होता है (नीच को छोड़कर)

        return {
            "planet": planet_code,
            "sign": sign_idx,
            "dignity": dignity_state,
            "is_retrograde": is_retrograde,
            "is_combust": is_combust,
            "final_multiplier": round(multiplier, 2)
        }