from datetime import datetime
import traceback
import swisseph as swe

# KP Base Constants
SIGN_LORDS = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"]
NAK_LORDS = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"]
WEEKDAY_LORDS = ["Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Su"]

def get_star_lord(degree):
    degree = float(degree) % 360.0
    nak_idx = int(degree / (360.0 / 27.0))
    return NAK_LORDS[nak_idx % 9]

def get_sign_lord(degree):
    degree = float(degree) % 360.0
    sign_idx = int(degree / 30.0) % 12
    return SIGN_LORDS[sign_idx]

# ─────────────────────────────────────────────────────────
# PHASE 1: RULING PLANETS (RP) ENGINE
# ─────────────────────────────────────────────────────────

def compute_ruling_planets(astro_data, birth_dt, sunrise_str=None):
    """
    Advanced KP Resonance Engine: Returns both Ordered and Weighted RPs.
    """
    if "La" not in astro_data or "Mo" not in astro_data:
        return {"error": "Lagna or Moon data missing. Cannot compute RPs."}

    lagna_deg = astro_data["La"]["Degree"]
    moon_deg = astro_data["Mo"]["Degree"]

    lsl = get_star_lord(lagna_deg)
    lrl = get_sign_lord(lagna_deg)
    msl = get_star_lord(moon_deg)
    mrl = get_sign_lord(moon_deg)

    day_idx = birth_dt.weekday()
    if sunrise_str:
        try:
            sr_hour, sr_min = map(int, sunrise_str.split(':'))
            if birth_dt.hour < sr_hour or (birth_dt.hour == sr_hour and birth_dt.minute < sr_min):
                day_idx = (day_idx - 1) % 7
        except Exception as e:
            print(f"⚠️ [RP Engine] Sunrise parse error for '{sunrise_str}': {e}")

    day_lord = WEEKDAY_LORDS[day_idx]

    rp_hierarchy = [
        {"planet": lsl, "source": "LSL", "weight": 100},
        {"planet": lrl, "source": "LRL", "weight": 80},
        {"planet": msl, "source": "MSL", "weight": 60},
        {"planet": mrl, "source": "MRL", "weight": 40},
        {"planet": day_lord, "source": "DayLord", "weight": 20}
    ]

    # Node Delegation (Sign-level currently)
    nodes_agents = {"Ra": {"agent_for": [], "reason": []}, "Ke": {"agent_for": [], "reason": []}}
    for node in ["Ra", "Ke"]:
        if node in astro_data:
            node_sign_lord = get_sign_lord(astro_data[node]["Degree"])
            for rp_obj in rp_hierarchy:
                if node_sign_lord == rp_obj["planet"] and node_sign_lord not in nodes_agents[node]["agent_for"]:
                    nodes_agents[node]["agent_for"].append(node_sign_lord)
                    nodes_agents[node]["reason"].append(f"Sign of {rp_obj['source']}")

    # 1. ORDERED RPs (For KP Practitioners - Preserves Hierarchy Context)
    ordered_rps = []
    seen_ordered = set()
    for item in rp_hierarchy:
        if item["planet"] not in seen_ordered:
            ordered_rps.append({"planet": item["planet"], "source": item["source"], "weight": item["weight"]})
            seen_ordered.add(item["planet"])
        for node in ["Ra", "Ke"]:
            if item["planet"] in nodes_agents[node]["agent_for"] and node not in seen_ordered:
                ordered_rps.append({"planet": node, "source": f"Agent for {item['source']}", "weight": item["weight"] - 5})
                seen_ordered.add(node)

    # 2. WEIGHTED RPs (Super RP Logic with Diminishing Returns & Node Caps)
    weighted_rps = []
    planet_tracker = {}
    reinforcement_counts = {}

    def add_to_weighted(planet, source, base_weight, is_node=False):
        if planet in planet_tracker:
            idx = planet_tracker[planet]
            count = reinforcement_counts[planet]
            multiplier = 0.5 if count == 1 else (0.3 if count == 2 else 0.2)
            bonus = base_weight * multiplier
            weighted_rps[idx]["source"] += f" + {source}"
            new_weight = weighted_rps[idx]["weight"] + bonus
            if is_node:
                new_weight = min(new_weight, 95.0)
            weighted_rps[idx]["weight"] = round(new_weight, 2)
            reinforcement_counts[planet] += 1
        else:
            planet_tracker[planet] = len(weighted_rps)
            reinforcement_counts[planet] = 1
            w = base_weight
            if is_node:
                w = min(w, 95.0)
            weighted_rps.append({"planet": planet, "source": source, "weight": round(w, 2)})

    for item in rp_hierarchy:
        add_to_weighted(item["planet"], item["source"], item["weight"])
        for node in ["Ra", "Ke"]:
            if item["planet"] in nodes_agents[node]["agent_for"]:
                add_to_weighted(node, f"Agent for {item['source']}", item["weight"] - 5, is_node=True)

    weighted_rps.sort(key=lambda x: x["weight"], reverse=True)

    return {
        "ordered_rps": ordered_rps,
        "weighted_rps": weighted_rps,
        "nodes_agents": nodes_agents,
        "metadata": {"engine_version": "v4_diminishing", "node_cap": 95.0}
    }

# ─────────────────────────────────────────────────────────
# PHASE 2: TRANSIT LAYER (Positions & Significations Only)
# ─────────────────────────────────────────────────────────

def compute_transit_positions(target_date_utc):
    """
    Step 1: Raw Astronomical Transit Data (Degrees).
    Returns purely the current positions for the given timestamp.
    """
    try:
        jd = swe.julday(
            target_date_utc.year, target_date_utc.month, target_date_utc.day,
            target_date_utc.hour + (target_date_utc.minute / 60.0)
        )
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        planets = {
            "Su": swe.SUN, "Mo": swe.MOON, "Ma": swe.MARS,
            "Me": swe.MERCURY, "Ju": swe.JUPITER, "Ve": swe.VENUS,
            "Sa": swe.SATURN, "Ra": swe.MEAN_NODE
        }

        transit_data = {}
        for p_name, p_code in planets.items():
            res, _ = swe.calc_ut(jd, p_code, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
            transit_data[p_name] = {"Degree": round(float(res[0]) % 360.0, 4)}

        transit_data["Ke"] = {"Degree": round((transit_data["Ra"]["Degree"] + 180.0) % 360.0, 4)}

        return transit_data
    except Exception as e:
        print(f"⚠️ [Transit Layer] Position calculation failed: {e}")
        return {}

def compute_transit_kp_hierarchy(transit_positions):
    """
    Step 2: KP Mapping for Transit Planets (NL/SL extraction).
    Does NOT calculate triggers or resonance.
    """
    try:
        from kp_significators import get_kp_lords
    except ImportError:
        raise NotImplementedError("⚠️ Dependency missing: get_kp_lords from kp_significators.py")

    transit_kp = {}
    for p, data in transit_positions.items():
        deg = data["Degree"]
        lords = get_kp_lords(deg, levels=3)  # Get NL, SL, SSL

        transit_kp[p] = {
            "Degree": deg,
            "SignLord": get_sign_lord(deg),
            "NL": lords.get("NL"),
            "SL": lords.get("SL")
        }

    return transit_kp

def evaluate_transit_resonance(transit_hierarchy, ruling_planets, active_dba):
    """
    Step 3: Checking if Transit matches RPs and DBA.
    (To be built - Needs strict Over-Triggering Control)
    """
    raise NotImplementedError("This module requires strict calibration to prevent False Confidence (Over-triggering).")

def evaluate_trigger_window(event_type, resonance_data):
    """
    Step 4: Final Probabilistic Output Generation.
    """
    raise NotImplementedError("Final trigger generation logic pending.")