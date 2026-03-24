# 27 Nakshatras Mapping (0 to 26)
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Lords of the 27 Nakshatras (Vimshottari Sequence)
NAKSHATRA_LORDS_SEQ = [
    "Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me",
    "Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me",
    "Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"
]

# --- Supremacy Hard Rules ---

# Rule 2: Trik Placement Penalty
TRIK_MULTIPLIERS = {
    6: 0.75,
    8: 0.50,
    12: 0.60
}
EXALTED_IN_TRIK_BONUS = 0.15

# Rule 3: D9 Dominance Overrides
D9_STRONG_OVERRIDE = 1.3  # If D1 weak but D9 Exalted/Own
D9_WEAK_OVERRIDE = 0.7    # If D1 strong but D9 Debilitated

# Rule 4: Enemy/Friend Modifiers
NAK_LORD_ENEMY_MODIFIER = 0.8
NAK_LORD_FRIEND_MODIFIER = 1.1

# Rule 5: Maraka Amplification
MARAKA_POSITIVE_MODIFIER = 0.8
MARAKA_NEGATIVE_MODIFIER = 1.4

# Rule 6: Double Trik Disaster
DOUBLE_TRIK_MULTIPLIER = 0.4