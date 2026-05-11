def analyze_kp_event(csl_planet, significators, pos_houses, neg_houses):
    """
    Weighted KP Event Analysis Engine (V4 - Non-Stacking + Bonus & Multi-Score)
    """
    if not csl_planet or csl_planet not in significators:
        return 0, 0, [], [], "ग्रह का डेटा उपलब्ध नहीं है।"
        
    planet_data = significators[csl_planet]
    
    house_weights = {}
    house_hits = {}  # Track occurrences for Secondary Bonus
    explanation_dict = {}
    
    levels = {
        "L1": {"weight": 40, "name": "NL भाव"},
        "L2": {"weight": 30, "name": "ग्रह भाव"},
        "L3": {"weight": 20, "name": "NL राशि"},
        "L4": {"weight": 10, "name": "ग्रह राशि"}
    }
    
    # 1. Base Weight & Hit Tracking
    for lvl, info in levels.items():
        for h in planet_data.get(lvl, []):
            house_hits[h] = house_hits.get(h, 0) + 1
            if h not in house_weights or info["weight"] > house_weights[h]:
                house_weights[h] = info["weight"]
                explanation_dict[h] = f"{lvl} ({info['weight']} pts)"

    # 2. Secondary Bonus (+5 points if a house appears in multiple levels)
    for h in house_weights:
        if house_hits[h] > 1:
            house_weights[h] += 5
            explanation_dict[h] += " + 5 Bonus"

    promise_score = 0
    stress_score = 0
    pos_match = []
    neg_match = []
    explanation_lines = []

    # Specific Negative Weights for more accurate KP Stress reading
    neg_multiplier = {6: 0.8, 8: 1.0, 12: 1.2, 1: 0.6, 4: 0.8, 10: 0.8}

    # 3. Calculate Separate Scores
    for h, weight in house_weights.items():
        if h in pos_houses:
            promise_score += weight
            pos_match.append(h)
            explanation_lines.append(f"सकारात्मक भाव {h} [{explanation_dict[h]}]")
        if h in neg_houses:
            adjusted_stress = weight * neg_multiplier.get(h, 1.0)
            stress_score += adjusted_stress
            neg_match.append(h)
            explanation_lines.append(f"नकारात्मक भाव {h} [{explanation_dict[h]} - Adjusted: {adjusted_stress} pts]")

    # 4. Conditional Untenanted Modifier
    if planet_data.get("is_untenanted"):
        promise_score += 10
        # If stress is already dominant, strong planet amplifies stress too
        if stress_score > promise_score:
            stress_score += 10
        explanation_lines.append("⭐ ग्रह 'Untenanted' है: +10 Extra Power")

    promise_score = min(100, int(promise_score))
    stress_score = min(100, int(stress_score))
    
    explanation_str = " | ".join(explanation_lines) if explanation_lines else "कोई मजबूत प्रभाव नहीं।"
    
    return promise_score, stress_score, pos_match, neg_match, explanation_str


def check_dba_timing(md, bd, ad, pos_houses, neg_houses, significators):
    """
    Weighted DBA Timing Layer (V5 - Reusing analyze_kp_event for accurate L1-L4 weighting)
    """
    timing_logic = []
    
    # 1. Evaluate MD, BD, AD using the core weighted engine
    md_p, md_s, md_pos, md_neg, _ = analyze_kp_event(md, significators, pos_houses, neg_houses)
    bd_p, bd_s, bd_pos, bd_neg, _ = analyze_kp_event(bd, significators, pos_houses, neg_houses)
    ad_p, ad_s, ad_pos, ad_neg, _ = analyze_kp_event(ad, significators, pos_houses, neg_houses)
    
    # 2. Apply DBA Proportional Weights (MD: 50%, BD: 30%, AD: 20%)
    weighted_promise = (md_p * 0.5) + (bd_p * 0.3) + (ad_p * 0.2)
    weighted_stress  = (md_s * 0.5) + (bd_s * 0.3) + (ad_s * 0.2)
    
    # 3. Generating Probabilistic & Professional Explanations
    if md_p > 20:
        timing_logic.append(f"MD ({md}) सकारात्मक है (Score: {md_p})")
    elif md_s > 20:
        timing_logic.append(f"MD ({md}) संघर्ष/देरी दिखा रही है")
    
    if bd_p > 20:
        timing_logic.append(f"BD ({bd}) सपोर्ट कर रही है")
    if ad_p > 20:
        timing_logic.append(f"AD ({ad}) ट्रिगर दे रही है")
    
    # 4. Probabilistic Status Wording
    net_timing_score = max(0, min(100, int(weighted_promise - (weighted_stress * 0.5))))
    
    if net_timing_score >= 60:
        status = "🟢 Strong DBA Support (प्रबल संभावना)"
    elif net_timing_score >= 40:
        status = "🟡 Moderate Support (अनुकूल समय)"
    elif net_timing_score >= 20:
        status = "🟠 Weak/Delayed Support (धीमी प्रगति)"
    else:
        status = "🔴 Unsupportive DBA (प्रतिकूल समय)"
        
    return net_timing_score, status, " | ".join(timing_logic) if timing_logic else "DBA तटस्थ है।"


def generate_kp_predictions(kp_data, current_dba):
    """Master Prediction Output combining Promise & Timing"""
    if not kp_data or not kp_data.get("computed"):
        return {"error": "KP Data missing"}

    significators = kp_data.get("significators", {})
    cusps = kp_data.get("cusp_significators", {})
    
    md = current_dba.get("MD")
    bd = current_dba.get("BD")
    ad = current_dba.get("AD")
    
    predictions = []

    # ─── 1. विवाह (Marriage) ───
    pos_7, neg_7 = [2, 7, 11], [1, 6, 10]
    csl_7 = cusps.get(7, {}).get("SL")
    p_score_7, s_score_7, p_match_7, n_match_7, exp_7 = analyze_kp_event(csl_7, significators, pos_7, neg_7)
    t_score_7, t_status_7, t_logic_7 = check_dba_timing(md, bd, ad, pos_7, neg_7, significators)
    
    predictions.append({
        "topic": "💍 विवाह (Marriage Promise & Timing)",
        "promise_score": p_score_7,
        "stress_score": s_score_7,
        "timing_score": t_score_7,
        "timing_status": t_status_7,
        "positive_houses": p_match_7,
        "negative_houses": n_match_7,
        "logic": f"Promise: {exp_7}",
        "timing_logic": t_logic_7
    })

    # ─── 2. नौकरी/करियर (Career/Job) ───
    pos_10, neg_10 = [2, 6, 10, 11], [5, 9]
    csl_10 = cusps.get(10, {}).get("SL")
    p_score_10, s_score_10, p_match_10, n_match_10, exp_10 = analyze_kp_event(csl_10, significators, pos_10, neg_10)
    t_score_10, t_status_10, t_logic_10 = check_dba_timing(md, bd, ad, pos_10, neg_10, significators)
    
    predictions.append({
        "topic": "💼 करियर/नौकरी (Career Promise & Timing)",
        "promise_score": p_score_10,
        "stress_score": s_score_10,
        "timing_score": t_score_10,
        "timing_status": t_status_10,
        "positive_houses": p_match_10,
        "negative_houses": n_match_10,
        "logic": f"Promise: {exp_10}",
        "timing_logic": t_logic_10
    })

    return predictions