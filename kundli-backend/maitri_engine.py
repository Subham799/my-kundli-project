# maitri_engine.py — ग्रह मैत्री इंजन (FINAL CORRECTED)
# नैसर्गिक + तात्कालिक → पंचधा मैत्री
# ═══════════════════════════════════════════════════════════════════

# =========================
# 1. NAISARGIK MAITRI
# =========================
NAISARGIK = {
    "Su": {"friend": ["Mo","Ma","Ju"], "enemy": ["Sa","Ve"], "neutral": ["Me"]},
    "Mo": {"friend": ["Su","Me"],      "enemy": [],           "neutral": ["Ma","Ju","Ve","Sa"]},
    "Ma": {"friend": ["Su","Mo","Ju"], "enemy": ["Me"],       "neutral": ["Ve","Sa"]},
    "Me": {"friend": ["Su","Ve"],      "enemy": ["Mo"],       "neutral": ["Ma","Ju","Sa"]},
    "Ju": {"friend": ["Su","Mo","Ma"], "enemy": ["Ve","Me"],  "neutral": ["Sa"]},
    "Ve": {"friend": ["Me","Sa"],      "enemy": ["Su","Mo"],  "neutral": ["Ma","Ju"]},
    "Sa": {"friend": ["Me","Ve"],      "enemy": ["Su","Mo","Ma"], "neutral": ["Ju"]},
    "Ra": {"friend": [],               "enemy": [],           "neutral": []},
    "Ke": {"friend": [],               "enemy": [],           "neutral": []},
}

# =========================
# 2. SIGN LORDS (1-based rashi)
# =========================
SIGN_LORDS = {
    1:"Ma", 2:"Ve", 3:"Me", 4:"Mo",  5:"Su",  6:"Me",
    7:"Ve", 8:"Ma", 9:"Ju", 10:"Sa", 11:"Sa", 12:"Ju",
}

# =========================
# 3. TATKALIK RULES
# =========================
FRIEND_HOUSES = {2, 3, 4, 10, 11, 12}
ENEMY_HOUSES  = {1, 5, 6, 7, 8, 9}


# =========================
# 4. HELPERS
# =========================
def get_relative_house(h1: int, h2: int) -> int:
    """Correct relative house (1–12) of h2 from h1."""
    return ((h2 - h1 + 12) % 12) + 1


def get_tatkalik(h1: int, h2: int) -> str:
    rel = get_relative_house(h1, h2)
    return "मित्र" if rel in FRIEND_HOUSES else "शत्रु"


def get_naisargik(p1: str, p2: str) -> str:
    data = NAISARGIK.get(p1, {})
    if p2 in data.get("friend",  []): return "मित्र"
    if p2 in data.get("enemy",   []): return "शत्रु"
    return "सम"


def combine(naisargik: str, tatkalik: str) -> str:
    """पंचधा मैत्री combination table."""
    if naisargik == "मित्र"  and tatkalik == "मित्र":  return "अधिमित्र"
    if naisargik == "सम"     and tatkalik == "मित्र":  return "मित्र"
    if naisargik == "मित्र"  and tatkalik == "शत्रु":  return "सम"
    if naisargik == "शत्रु"  and tatkalik == "मित्र":  return "सम"
    if naisargik == "सम"     and tatkalik == "शत्रु":  return "शत्रु"
    if naisargik == "शत्रु"  and tatkalik == "शत्रु":  return "अधिशत्रु"
    return "सम"


# =========================
# 5. MAIN FUNCTION
# =========================
def compute_maitri(planets_d1: dict) -> dict:
    """
    Compute Panchadha Maitri for all planets.

    Input
    -----
    planets_d1 : {
        "Su": {"house": 7, "sign": 10},  # sign = 1-based rashi
        ...
    }

    Output
    ------
    {
        "Su": {
            "final":     "अधिशत्रु",
            "lord":      "Sa",
            "tatkalik":  "शत्रु",
            "naisargik": "शत्रु"
        },
        ...
    }
    """
    result = {}

    for p1, d1 in planets_d1.items():

        # Rahu / Ketu — no maitri calculation
        if p1 in ("Ra", "Ke"):
            result[p1] = {"final": "लागू नहीं", "lord": None}
            continue

        h1   = int(d1.get("house", 1))
        sign = int(d1.get("sign",  1))

        sign_lord = SIGN_LORDS.get(sign)
        if not sign_lord:
            result[p1] = {"final": "लागू नहीं", "lord": None}
            continue

        # Own sign
        if p1 == sign_lord:
            result[p1] = {"final": "स्वराशि", "lord": sign_lord}
            continue

        # Lord's house — safe access
        lord_data = planets_d1.get(sign_lord)
        if not lord_data:
            result[p1] = {"final": "सम", "lord": sign_lord}
            continue

        h2 = int(lord_data.get("house", 1))

        naisargik = get_naisargik(p1, sign_lord)
        tatkalik  = get_tatkalik(h1, h2)
        final     = combine(naisargik, tatkalik)

        result[p1] = {
            "final":     final,
            "lord":      sign_lord,
            "tatkalik":  tatkalik,
            "naisargik": naisargik,
        }

    return result