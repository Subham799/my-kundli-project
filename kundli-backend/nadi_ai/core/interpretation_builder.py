# nadi_ai/core/interpretation_builder.py

def build_interpretation(report):
    """
    Engine से आए raw data को UI-friendly interpretation में बदलता है
    """
    dignity_clean = report.get("dignity_clean", "सम")
    is_own_house = report.get("is_own_house", False)
    lord_code = report.get("lord_code", "Unknown")
    lord_house_num = report.get("lord_house_num", 0)

    # 1. Dignity comment + badge type
    if "Exalted" in dignity_clean or "उच्च" in dignity_clean:
        dignity_comment = "⬆️ उच्च – बहुत मजबूत शुभ फल"
        badge_type = "exalted"
    elif "Debilitated" in dignity_clean or "नीच" in dignity_clean:
        dignity_comment = "⬇️ नीच – कमजोर फल, योग से सुधार संभव"
        badge_type = "debilitated"
    elif "Own Sign" in dignity_clean or "स्वराशि" in dignity_clean:
        dignity_comment = "🏠 स्वराशि – भाव का स्वामी स्वयं बहुत मजबूत"
        badge_type = "own_sign"
    elif "Friendly" in dignity_clean or "मित्र" in dignity_clean:
        dignity_comment = "🤝 मित्र – अच्छा सहयोग और फल"
        badge_type = "friendly"
    elif "Enemy" in dignity_clean or "शत्रु" in dignity_clean:
        dignity_comment = "⚔️ शत्रु – कठिनाइयाँ और संघर्ष"
        badge_type = "enemy"
    else:
        dignity_comment = "😐 सम (Neutral)"
        badge_type = "neutral"

    # 2. Placement comment
    if is_own_house:
        placement_comment = f"{lord_code} अपने ही भाव में स्थित – अत्यंत शुभ"
    else:
        placement_comment = f"{lord_code} {lord_house_num}वें भाव में स्थित – प्रभाव अन्य भाव से"

    # 3. Special yogas hint
    special_yogas = report.get("special_yogas", [])
    if "नीच" in dignity_comment and is_own_house:
        special_yogas.append("नीचभंग योग संभावना (स्वराशि में नीच)")

    # Return enhanced report
    report.update({
        "dignity_comment": dignity_comment,
        "badge_type": badge_type,
        "placement_comment": placement_comment,
        "special_yogas": special_yogas,
    })

    return report