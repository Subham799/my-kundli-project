import traceback

SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]
NAK_LORDS  = ["Ke","Ve","Su","Mo","Ma","Ra","Ju","Sa","Me"]
# दशा वर्ष - विंशोत्तरी के लिए
DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]

def get_kp_lords(degree, levels=3):
    """
    KP Hierarchical Segmentation (NL -> SL -> SSL)
    Using exact fraction 40.0/3.0 to prevent floating precision loss.
    """
    degree = degree % 360
    nak_length = 40.0 / 3.0  # 13.3333333...
    
    nak_idx = int(degree / nak_length)
    nl_idx = nak_idx % 9
    
    lords = {"NL": NAK_LORDS[nl_idx]}
    if levels == 1: return lords
    
    # ─── SL (Sub-Lord) Calculation ───
    deg_in_nak = degree - (nak_idx * nak_length)
    accumulated_span = 0.0
    sl_idx = nl_idx
    sl_span = 0.0
    sl_start_offset = 0.0
    
    for i in range(9):
        idx = (nl_idx + i) % 9
        span = (DASHA_YEARS[idx] / 120.0) * nak_length
        # '<' instead of '<=' to prevent boundary overlap
        if deg_in_nak < accumulated_span + span:
            sl_idx = idx
            sl_span = span
            sl_start_offset = accumulated_span
            break
        accumulated_span += span
        
    lords["SL"] = NAK_LORDS[sl_idx]
    if levels == 2: return lords
    
    # ─── SSL (Sub-Sub-Lord) Calculation ───
    deg_in_sl = deg_in_nak - sl_start_offset
    accumulated_span_ssl = 0.0
    ssl_idx = sl_idx
    
    for i in range(9):
        idx = (sl_idx + i) % 9
        span = (DASHA_YEARS[idx] / 120.0) * sl_span
        if deg_in_sl < accumulated_span_ssl + span:
            ssl_idx = idx
            break
        accumulated_span_ssl += span
        
    lords["SSL"] = NAK_LORDS[ssl_idx]
    
    return lords

def get_kp_house_placement(planet_degree, placidus_cusps):
    planet_degree = planet_degree % 360
    # Safe check for tuple/list conversion & valid length
    if not placidus_cusps or len(list(placidus_cusps)) < 12:
        return None  # Silent 'return 1' fixed!

    for i in range(12):
        cusp_start = placidus_cusps[i] % 360
        cusp_end = placidus_cusps[(i + 1) % 12] % 360
        
        # Edge transition logic
        if cusp_start < cusp_end:
            if cusp_start <= planet_degree < cusp_end: return i + 1
        else:
            if planet_degree >= cusp_start or planet_degree < cusp_end: return i + 1
            
    return None

def compute_kp_significators(astro):
    print("\n🔥 [DEBUG BACKEND] KP Engine Started (v2.0 Hierarchical)")
    try:
        if "Cusps" not in astro or len(list(astro["Cusps"])) < 12:
            return {"computed": False, "error": "Placidus cusps missing or invalid"}

        placidus_cusps = astro["Cusps"]
        cusp_owners = {}

        for i in range(12):
            cusp_degree = placidus_cusps[i] % 360
            sign_idx = int(cusp_degree / 30) % 12
            cusp_owners[i + 1] = SIGN_LORDS[sign_idx]

            # 👇 यहाँ से नया Cuspal Sub-Lord (भावों की 4-Step) का लॉजिक शुरू ───
        cusp_kp_info = {}
        for i in range(12):
            c_deg = placidus_cusps[i] % 360
            c_hier = get_kp_lords(c_deg, levels=3)
            c_hier["SignLord"] = SIGN_LORDS[int(c_deg / 30) % 12]
            cusp_kp_info[i + 1] = c_hier
            # 👆 नया कोड खत्म ────────────────────────────────────────────────────
        planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]
        planet_houses = {}
        planet_kp_info = {}  # Will store hierarchical dict {SignLord, NL, SL, SSL}

        for p in planets:
            if p in astro:
                deg = astro[p]["Degree"] % 360
                
                house_placement = get_kp_house_placement(deg, placidus_cusps)
                if house_placement is not None:
                    planet_houses[p] = house_placement
                    
                # ─── Hierarchy Generation ───
                kp_hier = get_kp_lords(deg, levels=3)
                kp_hier["SignLord"] = SIGN_LORDS[int(deg / 30)] # 👈 यहाँ SignLord जुड़ गया!
                planet_kp_info[p] = kp_hier

        significators = {}
        for p in planets:
            if p not in astro: continue
            
            # Skip if house placement failed (Safety First)
            if p not in planet_houses:
                continue

            # Fetch hierarchical data
            kp_data = planet_kp_info.get(p, {})
            star_lord = kp_data.get("NL")
            
            l1 = [planet_houses[star_lord]] if star_lord in planet_houses else []
            l2 = [planet_houses[p]]
            l3 = [house for house, owner in cusp_owners.items() if owner == star_lord]
            l4 = [house for house, owner in cusp_owners.items() if owner == p]

            # ─── Untenanted Check (क्या कोई और ग्रह इसके नक्षत्र में है?) ───
            # अगर 'p' किसी भी अन्य ग्रह का NL नहीं है, तो वह Untenanted है।
            is_untenanted = True
            for other_p in planets:
                if other_p in planet_kp_info and planet_kp_info[other_p].get("NL") == p:
                    is_untenanted = False
                    break

            # Structured Output
            significators[p] = {
                "kp":            kp_data,
                "L1":            l1,
                "L2":            l2,
                "L3":            l3,
                "L4":            l4,
                "strong":        sorted(list(set(l1 + l2))),
                "all":           sorted(list(set(l1 + l2 + l3 + l4))),
                "house_placed":  planet_houses[p],
                "is_untenanted": is_untenanted  # 👈 Gondhalkar Sir ka Master Rule
            }

        # 👇 राहु-केतु का 'गिरगिट नियम' (Chameleon Rule) ──────────────────────
        for rk in ["Ra", "Ke"]:
            if rk not in significators: continue

            rk_house  = planet_houses.get(rk)
            sign_lord = significators[rk]["kp"].get("SignLord")

            # 1. युति (Conjunction): उसी भाव में बैठे अन्य ग्रह
            conjoined_planets = [p for p in planets if p != rk and planet_houses.get(p) == rk_house]

            # 2. सोर्स: युति वाले ग्रह + राशि स्वामी
            sources = list(set(conjoined_planets + ([sign_lord] if sign_lord else [])))

            # राहु/केतु सभी सोर्स ग्रहों के भाव हड़प लेते हैं
            for src in sources:
                if src and src in significators:
                    significators[rk]["L1"].extend(significators[src]["L1"])
                    significators[rk]["L2"].extend(significators[src]["L2"])
                    significators[rk]["L3"].extend(significators[src]["L3"])
                    significators[rk]["L4"].extend(significators[src]["L4"])

            # डुप्लीकेट हटाओ
            for lvl in ["L1", "L2", "L3", "L4"]:
                significators[rk][lvl] = sorted(list(set(significators[rk][lvl])))
            significators[rk]["strong"] = sorted(list(set(significators[rk]["L1"] + significators[rk]["L2"])))
            significators[rk]["all"]    = sorted(list(set(significators[rk]["strong"] + significators[rk]["L3"] + significators[rk]["L4"])))
        # 👆 राहु-केतु नियम खत्म ──────────────────────────────────────────────

        print("🔥 [DEBUG BACKEND] SUCCESS! KP Data with SL/SSL and Rahu/Ketu Delegation generated.")
        return {
            "computed": True,
            "cusp_owners": cusp_owners,
            "planet_placements": planet_houses,
            "significators": significators,
            "cusp_significators": cusp_kp_info
        }
    except Exception as e:
        print(f"🔥 [DEBUG BACKEND] CRASH: {e}")
        traceback.print_exc()
        return {"computed": False, "error": f"Crash: {str(e)}"}