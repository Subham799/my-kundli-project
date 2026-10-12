# kp_strength_engine.py
# ─────────────────────────────────────────────────────────
# ADVANCED KP STRENGTH & FILTERING ENGINE
# v5.0 — Multiplicative Chain Propagation | Quality-Weighted Node Delegation
#         | Per-Topic Stress | Manifestation Index | Deeper Recursion
# ─────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────
# SECTION 0: PER-TOPIC STRESS HOUSE CONFIGURATION
# ─────────────────────────────────────────────────────────

# Universal dusthana fallback
DEFAULT_STRESS_HOUSES = {6, 8, 12}

# Topic-specific stress configurations
# Each entry: "stress_houses" = houses that obstruct this topic
# "nuance" = explanatory note for the logic_trace
KP_TOPIC_STRESS_CONFIG = {
    "marriage": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=conflict/divorce, 8=transformation/break, 12=separation/loss",
    },
    "career": {
        "stress_houses": {5, 8, 12},
        "nuance": "5=speculation risk, 8=sudden loss/instability, 12=foreign/hidden obstruction; note 6=competition/service is POSITIVE for career",
    },
    "property": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=legal dispute, 8=blocked transfer/inheritance conflict, 12=loss of property",
    },
    "finance": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=debt/liability, 8=sudden reversal, 12=expenses/loss",
    },
    "health": {
        "stress_houses": {1, 6, 8, 12},
        "nuance": "1=physical body stress, 6=disease/enemies, 8=chronic/surgery, 12=hospitalisation",
    },
    "travel": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=delay/dispute, 8=accident risk, 12=isolation/confinement",
    },
    "children": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=illness/conflict, 8=loss, 12=grief/separation",
    },
    "education": {
        "stress_houses": {6, 8, 12},
        "nuance": "6=competition pressure, 8=interruption, 12=dropout/foreign study barrier",
    },
    "spirituality": {
        "stress_houses": {6, 8},
        "nuance": "6=distraction/conflict, 8=obsession/occult danger; 12 is often POSITIVE for spirituality",
    },
}


def get_stress_houses_for_topic(topic=None):
    """
    Returns (stress_houses_set, nuance_string) for the given topic.
    Falls back to DEFAULT_STRESS_HOUSES if topic unknown.
    """
    if topic and topic.lower() in KP_TOPIC_STRESS_CONFIG:
        cfg = KP_TOPIC_STRESS_CONFIG[topic.lower()]
        return cfg["stress_houses"], cfg["nuance"]
    return DEFAULT_STRESS_HOUSES, "Universal dusthana (6/8/12)"


# ─────────────────────────────────────────────────────────
# SECTION 1: CONJUNCTION CALCULATOR
# ─────────────────────────────────────────────────────────

def calculate_conjunctions(target_planet, astro_data, orb=3.33):
    conjunct_planets = []
    if target_planet not in astro_data:
        return conjunct_planets

    target_deg = astro_data[target_planet].get("Degree", 0) % 360
    for p, data in astro_data.items():
        if p in ("La", target_planet):
            continue
        p_deg = data.get("Degree", 0) % 360
        diff = abs(target_deg - p_deg)
        if diff > 180:
            diff = 360 - diff
        if diff <= orb:
            conjunct_planets.append(p)
    return conjunct_planets


# ─────────────────────────────────────────────────────────
# SECTION 2: NODE DELEGATION
# Includes aspect-based delegation (60°/90°/120°/180°) with orb
# ─────────────────────────────────────────────────────────

ASPECT_ORBS = {
    60:  2.0,   # Sextile
    90:  3.0,   # Square
    120: 3.0,   # Trine
    180: 3.33,  # Opposition
}

# Aspect influence weights (1.0 = conjunction baseline)
# Opposition is strongest angular resonance; sextile mildest.
ASPECT_WEIGHTS = {
    180: 1.0,   # Opposition  — strongest angular resonance
    120: 0.85,  # Trine       — harmonious, strong
    90:  0.65,  # Square      — tense/activating, moderate
    60:  0.45,  # Sextile     — mild, supportive
}


def calculate_aspects(target_planet, astro_data):
    """
    Returns list of (planet, aspect_angle, aspect_weight) for all orb-valid aspects.
    Only exact KP-relevant aspects; no generic Vedic full-sign assumptions.
    aspect_weight reflects angular influence strength (180°=1.0 down to 60°=0.45).
    """
    aspect_pairs = []
    if target_planet not in astro_data:
        return aspect_pairs

    target_deg = astro_data[target_planet].get("Degree", 0) % 360
    for p, data in astro_data.items():
        if p in ("La", target_planet):
            continue
        p_deg = data.get("Degree", 0) % 360
        diff = abs(target_deg - p_deg)
        if diff > 180:
            diff = 360 - diff
        for angle, orb in ASPECT_ORBS.items():
            if abs(diff - angle) <= orb:
                weight = ASPECT_WEIGHTS.get(angle, 0.5)
                aspect_pairs.append((p, angle, weight))
    return aspect_pairs


def get_node_delegation(node, astro_data, significators):
    """
    Priority order (KP):
    1. Conjunction (strongest — weight 1.0)
    2. Exact aspect (weighted by aspect type: 180°=1.0 → 60°=0.45)
    3. Star Lord
    4. Sign Lord

    Returns (agents_list, sources_list)
    Each source string includes the aspect weight for traceability.
    """
    agents, sources = [], []

    # 1. Conjunction (weight 1.0)
    conjuncts = calculate_conjunctions(node, astro_data)
    for p in conjuncts:
        if p not in agents:
            agents.append(p)
            sources.append(f"Conjunction w=1.0: {p}")

    # 2. Exact aspects (weighted)
    aspects = calculate_aspects(node, astro_data)
    # Sort by weight descending so strongest aspect registers first
    aspects_sorted = sorted(aspects, key=lambda x: x[2], reverse=True)
    for p, angle, weight in aspects_sorted:
        if p not in agents:
            agents.append(p)
            sources.append(f"Aspect {angle}° w={weight}: {p}")

    # 3. Star Lord
    nl = significators.get(node, {}).get("NL")
    if nl and nl not in agents:
        agents.append(nl)
        sources.append(f"Star Lord: {nl}")

    # 4. Sign Lord
    sl = significators.get(node, {}).get("SignLord")
    if sl and sl not in agents:
        agents.append(sl)
        sources.append(f"Sign Lord: {sl}")

    return agents, sources


def inject_node_delegated_houses(effective_sigs, astro_data, significators, strength_report=None):
    """
    v5.0 — Quality-Weighted Node Delegation House Injection.

    Rahu/Ketu inherit agent houses at one tier lower (L1→L2, L2→L3, L3→L4).

    NEW in v5.0:
    delegation_power = agent_strength × aspect_weight × chain_quality

    Strong agents with clean chains inject at full tier-downgraded weight.
    Weak agents inject at reduced multiplier — their multiplier is attenuated
    BEFORE being merged into the node's effective_sigs.

    Houses cap: MAX_DELEGATED_HOUSES = 8 per node to prevent overload.
    """
    nodes = ["Ra", "Ke"]
    tier_downgrade = {"L1": "L2", "L2": "L3", "L3": "L4", "L4": None}
    MAX_DELEGATED_HOUSES = 8

    for node in nodes:
        if node not in significators:
            continue

        # Get agents with their aspect weights from get_node_delegation
        # We need aspect weights here — re-run with aspects
        agents_list, sources_list = get_node_delegation(node, astro_data, significators)

        # Build aspect_weight lookup for each agent
        aspect_weight_map = {}
        for src in sources_list:
            # Parse "Conjunction w=1.0: Ve" or "Aspect 120° w=0.85: Sa"
            for agent in agents_list:
                if f": {agent}" in src:
                    try:
                        w = float(src.split("w=")[1].split(":")[0])
                        aspect_weight_map[agent] = w
                    except (IndexError, ValueError):
                        aspect_weight_map.setdefault(agent, 0.5)
            # Star/Sign Lord default weight
            if agent not in aspect_weight_map:
                aspect_weight_map[agent] = 0.5

        for agent in agents_list:
            if agent not in effective_sigs:
                continue

            agent_sig    = effective_sigs[agent]
            agent_mult   = agent_sig.get("multiplier", 1.0)
            aspect_w     = aspect_weight_map.get(agent, 0.5)
            chain_q      = (strength_report or {}).get(agent, {}).get("chain_multiplier", 1.0)

            # delegation_power: how much of agent's signification transfers
            delegation_power = round(agent_mult * aspect_w * chain_q, 4)

            node_sig = effective_sigs.setdefault(node, {
                "L1": [], "L2": [], "L3": [], "L4": [],
                "strength_score": 100, "multiplier": 1.0,
                "is_untenanted": False, "logic_trace": "",
                "delegated_multiplier_adjustments": []
            })

            # Track total injected count
            total_injected = node_sig.get("_injected_count", 0)

            for tier in ["L1", "L2", "L3", "L4"]:
                target_tier = tier_downgrade[tier]
                if target_tier is None:
                    continue

                agent_houses = agent_sig.get(tier, [])
                if not agent_houses:
                    continue

                existing_higher = set(
                    node_sig.get("L1", []) + node_sig.get("L2", [])
                    if target_tier in ("L3", "L4")
                    else node_sig.get("L1", [])
                )

                for house in agent_houses:
                    if total_injected >= MAX_DELEGATED_HOUSES:
                        node_sig["logic_trace"] = (
                            node_sig.get("logic_trace", "")
                            + f" | [Cap@{MAX_DELEGATED_HOUSES}: skipped H{house} from {agent}]"
                        ).lstrip(" | ")
                        break
                    if house not in existing_higher and house not in node_sig.get(target_tier, []):
                        node_sig.setdefault(target_tier, []).append(house)
                        total_injected += 1
                        node_sig["logic_trace"] = (
                            node_sig.get("logic_trace", "")
                            + f" | Delegated H{house} from {agent} ({tier}→{target_tier}) dp={delegation_power}"
                        ).lstrip(" | ")
                        # Record per-house delegation power for scoring use
                        node_sig.setdefault("delegated_multiplier_adjustments", []).append({
                            "house": house, "agent": agent, "tier": target_tier,
                            "delegation_power": delegation_power
                        })

            node_sig["_injected_count"] = total_injected

    # Clean up internal counter
    for node in nodes:
        if node in effective_sigs:
            effective_sigs[node].pop("_injected_count", None)

    return effective_sigs


    return effective_sigs


# ─────────────────────────────────────────────────────────
# SECTION 3: PLANET STRENGTH CALCULATOR
# v5.0 — Multiplicative Chain Propagation (replaces additive penalties)
# ─────────────────────────────────────────────────────────

def _chain_multiplier(planet, significators, occupancy_map,
                      strength_report=None, depth=0, max_depth=4, visited=None):
    """
    v5.0 — Multiplicative Recursive Chain Attenuation.

    Replaces additive penalty model with multiplicative propagation:
        final_strength = base × sl_mult × nl_mult × sl_sl_mult × ...

    Each weak/occupied link in the chain attenuates the multiplier.
    Strong/free links give a small boost.

    Returns (chain_multiplier: float, trace_list: list[str])

    Chain multiplier ranges:
        1.10  — all links free/strong (slight boost)
        1.00  — neutral
        0.7+  — some weakness in chain
        0.5   — minimum floor (severe chain obstruction)
    """
    if visited is None:
        visited = set()
    if depth >= max_depth or planet in visited:
        return 1.0, []

    visited.add(planet)
    running_mult = 1.0
    trace = []

    # ── SL chain ──────────────────────────────────────────
    sl = significators.get(planet, {}).get("SL")
    if sl and sl not in visited:
        sl_occ = occupancy_map.get(sl, [])
        sl_strength = (strength_report or {}).get(sl, {}).get("effective_strength", 100)

        if sl_occ:
            # Occupied SL — attenuate proportionally
            # More occupants = heavier attenuation; deeper depth = softer penalty
            depth_factor = max(0.5, 1.0 - depth * 0.1)
            attenuation = round(max(0.65, 1.0 - len(sl_occ) * 0.12 * depth_factor), 3)
            running_mult *= attenuation
            trace.append(f"SL({sl}) occupied×{len(sl_occ)} at d{depth+1} ×{attenuation}")
        elif sl_strength >= 80:
            running_mult *= 1.05
            trace.append(f"SL({sl}) strong at d{depth+1} ×1.05")
        else:
            trace.append(f"SL({sl}) neutral at d{depth+1} ×1.0")

        # Recurse into SL's chain
        sub_mult, sub_trace = _chain_multiplier(
            sl, significators, occupancy_map, strength_report, depth + 1, max_depth, visited
        )
        running_mult = round(running_mult * sub_mult, 4)
        trace.extend(sub_trace)

    # ── NL chain (independent branch) ────────────────────
    nl = significators.get(planet, {}).get("NL")
    if nl and nl != sl and nl not in visited:
        nl_occ = occupancy_map.get(nl, [])
        nl_strength = (strength_report or {}).get(nl, {}).get("effective_strength", 100)

        if nl_occ:
            depth_factor = max(0.5, 1.0 - depth * 0.1)
            attenuation = round(max(0.70, 1.0 - len(nl_occ) * 0.10 * depth_factor), 3)
            running_mult *= attenuation
            trace.append(f"NL({nl}) occupied×{len(nl_occ)} at d{depth+1} ×{attenuation}")
        elif nl_strength >= 80:
            running_mult *= 1.03
            trace.append(f"NL({nl}) strong at d{depth+1} ×1.03")
        else:
            trace.append(f"NL({nl}) neutral at d{depth+1} ×1.0")

    # Floor: chain can suppress but never eliminate
    running_mult = round(max(0.50, running_mult), 4)
    return running_mult, trace


def compute_planet_strength(astro_data, significators):
    """
    v5.0 — Multiplicative strength model.

    base_strength (additive: occupancy/untenanted/node)
    × chain_multiplier (multiplicative: recursive SL/NL chain quality)
    = final_strength

    chain_multiplier is also stored separately for use in
    quality-weighted node delegation.
    """
    planets = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]
    strength_report = {}
    occupancy_map = {p: [] for p in planets}

    # Build occupancy map: NL → planets whose star it is
    for p in planets:
        nl = significators.get(p, {}).get("NL")
        if nl in occupancy_map and p != nl:
            occupancy_map[nl].append(p)

    # First pass: compute base strengths (no chain yet — needed by chain itself)
    base_strengths = {}
    for p in planets:
        if p not in significators:
            continue
        occupants = occupancy_map.get(p, [])
        base = 100
        if len(occupants) == 0:
            base += 10
        else:
            base -= len(occupants) * 15
        base_strengths[p] = max(10, min(150, base))

    # Build a lightweight strength_report for chain lookups
    _proto_report = {p: {"effective_strength": s} for p, s in base_strengths.items()}

    # Second pass: full computation with multiplicative chain
    for p in planets:
        if p not in significators:
            continue

        is_node = p in ["Ra", "Ke"]
        occupants = occupancy_map.get(p, [])
        is_untenanted = len(occupants) == 0

        base_strength = base_strengths[p]
        supported_by, weakened_by = [], []

        # 1. Occupancy / Untenanted trace
        if is_untenanted:
            supported_by.append("Untenanted (Self-Strong base+10)")
        else:
            supported_by.append(f"Occupied by {', '.join(occupants)} (base-{len(occupants)*15})")

        # 2. Node Delegation trace
        if is_node:
            node_agents, node_sources = get_node_delegation(p, astro_data, significators)
            if node_agents:
                supported_by.append(
                    f"Delegates for: {', '.join(node_agents)} ({'; '.join(node_sources)})"
                )

        # 3. Multiplicative chain propagation
        chain_mult, chain_trace = _chain_multiplier(
            p, significators, occupancy_map, _proto_report, depth=0, max_depth=4
        )

        # Final strength = base × chain_multiplier
        final_strength = round(max(10.0, min(150.0, base_strength * chain_mult)), 2)

        # Classify chain quality in trace
        if chain_mult >= 1.05:
            supported_by.append(f"Chain quality strong ×{chain_mult}")
        elif chain_mult < 0.75:
            weakened_by.append(f"Chain attenuated ×{chain_mult}")
        else:
            supported_by.append(f"Chain quality neutral ×{chain_mult}")

        for t in chain_trace:
            if "occupied" in t:
                weakened_by.append(t)
            else:
                supported_by.append(t)

        multiplier = round(final_strength / 100.0, 3)

        strength_report[p] = {
            "planet":             p,
            "base_strength":      base_strength,
            "chain_multiplier":   chain_mult,       # NEW v5.0 — exposed for node delegation
            "effective_strength": final_strength,
            "is_strong":          final_strength >= 80,
            "is_weak":            final_strength < 50,
            "is_untenanted":      is_untenanted,
            "occupants":          occupants,
            "supported_by":       supported_by,
            "weakened_by":        weakened_by,
            "multiplier":         multiplier,
        }

    return strength_report



# ─────────────────────────────────────────────────────────
# SECTION 4: EFFECTIVE SIGNIFICATORS (Filtering Layer)
# ─────────────────────────────────────────────────────────

def compute_effective_significators(raw_significators, strength_report):
    """
    PHASE B: Filtering Engine.

    L1-L4 = significator strength hierarchy (occupation → star → sign → sub).
    These are NOT DBA tiers. DBA support is handled separately in the scoring engine.

    Weak planets (< 50 strength) suppressed to 0.3x power instead of deleted.
    """
    effective_sigs = {}

    for p, sig_data in raw_significators.items():
        strength_data = strength_report.get(p, {})
        is_weak = strength_data.get("is_weak", False)
        multiplier = strength_data.get("multiplier", 1.0)

        if is_weak:
            multiplier = min(multiplier, 0.3)

        effective_sigs[p] = {
            "kp":             sig_data.get("kp", {}),
            "L1":             sig_data.get("L1", []),   # Occupation level (strongest)
            "L2":             sig_data.get("L2", []),   # Star level
            "L3":             sig_data.get("L3", []),   # Sign level
            "L4":             sig_data.get("L4", []),   # Sub level (weakest)
            "strength_score": strength_data.get("effective_strength", 100),
            "multiplier":     multiplier,
            "is_untenanted":  strength_data.get("is_untenanted", False),
            "logic_trace":    " | ".join(
                strength_data.get("weakened_by", []) + strength_data.get("supported_by", [])
            ),
        }

    return effective_sigs


# ─────────────────────────────────────────────────────────
# SECTION 5: PREDICTION SCORING ENGINE
# v4.0 — Promise + Stress + Manifestation Index | De-duplicated | Per-topic stress
# ─────────────────────────────────────────────────────────

DEFAULT_LEVEL_WEIGHTS = {"L1": 4.0, "L2": 3.0, "L3": 2.0, "L4": 1.0}


def _score_house_set(target_houses, effective_significators, dba_boost, level_weights, score_label):
    """
    Internal scorer shared by promise and stress scoring.

    De-duplicates houses per planet: if same house appears at L1 AND L2,
    only the highest-weight level is counted (reinforcement, not double-count).
    """
    planet_breakdown = []
    total_score = 0.0

    for planet, sig_data in effective_significators.items():
        strength_multiplier = sig_data.get("multiplier", 1.0)
        dba_support = dba_boost.get(planet, 1.0)
        planet_score = 0.0
        matched_houses = []

        # De-duplicate: per planet, each house counted once at its highest-weight level
        house_best = {}
        for level in ["L1", "L2", "L3", "L4"]:
            bw = level_weights.get(level, DEFAULT_LEVEL_WEIGHTS[level])
            for house in sig_data.get(level, []):
                if house in target_houses:
                    if house not in house_best or bw > house_best[house][1]:
                        house_best[house] = (level, bw)

        for house, (level, base_weight) in house_best.items():
            effective_weight = base_weight * strength_multiplier * dba_support
            planet_score += effective_weight
            matched_houses.append({
                "house":              house,
                "level":              level,
                "base_weight":        round(base_weight, 2),
                "strength_multiplier": round(strength_multiplier, 2),
                "dba_support":        round(dba_support, 2),
                "effective_weight":   round(effective_weight, 3),
            })

        if planet_score > 0:
            total_score += planet_score
            planet_breakdown.append({
                "planet":              planet,
                f"{score_label}_score": round(planet_score, 3),
                "strength_multiplier": round(strength_multiplier, 2),
                "dba_support":         round(dba_support, 2),
                "in_dba":              dba_boost.get(planet, 1.0) > 1.0,
                "matched_houses":      matched_houses,
                "logic_trace":         sig_data.get("logic_trace", ""),
            })

    planet_breakdown.sort(key=lambda x: x[f"{score_label}_score"], reverse=True)
    return round(total_score, 3), planet_breakdown


def _compute_manifestation_index(promise_score, stress_score):
    """
    v4.0 — Manifestation Index (replaces raw net subtraction).

    Separates three orthogonal dimensions:
      promise_index    → how strong is the positive signification?
      stress_index     → how much obstruction/delay exists?
      manifestation_index → probabilistic delivery estimate

    manifestation_index logic:
      - High promise + Low stress  → strong delivery
      - High promise + High stress → partial/delayed delivery
      - Low promise  + Any stress  → weak/unlikely delivery

    Returns dict with all three indices and a qualitative manifestation_label.
    """
    # Normalise to 0–1 scale using soft sigmoid-like mapping
    # Promise reference range: 0–50  (typical real chart values)
    # Stress  reference range: 0–30

    promise_norm = min(promise_score / 50.0, 1.0)
    stress_norm  = min(stress_score  / 30.0, 1.0)

    # Manifestation = promise tempered by stress
    # When stress is high but promise is also high → partial manifestation
    if promise_norm < 0.15:
        manifestation_index = round(promise_norm * 0.4, 3)          # Very weak base
    elif stress_norm > 0.6 and promise_norm > 0.4:
        manifestation_index = round(promise_norm * 0.55, 3)          # Delayed/partial
    else:
        manifestation_index = round(promise_norm * (1 - 0.5 * stress_norm), 3)

    # Stress classification
    if stress_norm <= 0.2:
        stress_label = "Low Stress ✅"
    elif stress_norm <= 0.5:
        stress_label = "Moderate Stress ⚠️"
    elif stress_norm <= 0.75:
        stress_label = "High Stress 🔴"
    else:
        stress_label = "Severe Obstruction ❌"

    # Manifestation label
    if manifestation_index >= 0.65:
        manifestation_label = "Strong Manifestation Window 🔥"
    elif manifestation_index >= 0.40:
        manifestation_label = "Moderate Resonance — Monitor ⚠️"
    elif manifestation_index >= 0.20:
        if stress_norm > 0.5:
            manifestation_label = "Delayed Manifestation — Stress Dominant 🕐"
        else:
            manifestation_label = "Weak Promise — Conditions Unfavourable 🔍"
    else:
        manifestation_label = "Very Low Resonance — Likely Non-Event 🔕"

    return {
        "promise_index":        round(promise_norm, 3),
        "stress_index":         round(stress_norm, 3),
        "manifestation_index":  manifestation_index,
        "stress_label":         stress_label,
        "manifestation_label":  manifestation_label,
    }


def compute_prediction_score(
    target_houses,
    effective_significators,
    dba_planets,
    topic=None,
    stress_houses=None,
    house_weights=None,
):
    """
    PHASE C: Multiplier-integrated Prediction Scoring.

    Evaluates BOTH promise (positive houses) AND stress (topic-aware dusthana).
    Computes promise_index, stress_index, and manifestation_index separately.

    Formula per planet per house:
        effective_weight = base_weight × strength_multiplier × dba_support

    Parameters
    ----------
    target_houses : list[int]
        Positive houses for this topic (e.g. [2, 7, 11] for marriage).
    effective_significators : dict
        Output of compute_effective_significators() + inject_node_delegated_houses().
    dba_planets : list[str]
        Active Dasha-Bhukti-Antara lords.
    topic : str or None
        Topic key (e.g. "marriage", "career") for per-topic stress selection.
        If None, falls back to DEFAULT_STRESS_HOUSES or explicit stress_houses param.
    stress_houses : set[int] or None
        Override stress houses directly (overrides topic config when provided).
    house_weights : dict or None
        Optional override for L1-L4 level weights.

    Returns
    -------
    dict with:
        promise_score, stress_score, net_resonance,
        promise_index, stress_index, manifestation_index,
        verdict, manifestation_label, stress_label,
        promise_breakdown, stress_breakdown,
        target_houses, stress_houses, stress_nuance,
        dba_planets, topic
    """
    # Resolve stress houses
    stress_nuance = ""
    if stress_houses is not None:
        resolved_stress = set(stress_houses)
        stress_nuance = "Manually overridden stress houses"
    else:
        resolved_stress, stress_nuance = get_stress_houses_for_topic(topic)

    level_weights = {**DEFAULT_LEVEL_WEIGHTS, **(house_weights or {})}

    # Softer DBA boosts — prevent score explosion
    dba_boost = {}
    if dba_planets:
        for i, p in enumerate(dba_planets[:3]):
            dba_boost[p] = [1.25, 1.15, 1.05][i]

    promise_score, promise_breakdown = _score_house_set(
        target_houses           = set(target_houses),
        effective_significators = effective_significators,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "promise",
    )

    stress_score, stress_breakdown = _score_house_set(
        target_houses           = resolved_stress,
        effective_significators = effective_significators,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "stress",
    )

    net_resonance = round(promise_score - stress_score, 3)

    # Legacy verdict (for backward compatibility)
    if net_resonance >= 15.0:
        verdict = "Strong Promise ✅"
    elif net_resonance >= 7.0:
        verdict = "Moderate Promise ⚠️"
    elif net_resonance >= 0:
        verdict = "Weak Promise — Monitor 🔍"
    else:
        verdict = "Stress Dominant — Likely Denial ❌"

    # v4.0 Manifestation Index
    manifestation = _compute_manifestation_index(promise_score, stress_score)

    return {
        # Scores
        "promise_score":        promise_score,
        "stress_score":         stress_score,
        "net_resonance":        net_resonance,
        # Indices (v4.0)
        "promise_index":        manifestation["promise_index"],
        "stress_index":         manifestation["stress_index"],
        "manifestation_index":  manifestation["manifestation_index"],
        # Labels
        "verdict":              verdict,
        "stress_label":         manifestation["stress_label"],
        "manifestation_label":  manifestation["manifestation_label"],
        # Breakdowns
        "promise_breakdown":    promise_breakdown,
        "stress_breakdown":     stress_breakdown,
        # Meta
        "target_houses":        list(target_houses),
        "stress_houses":        sorted(resolved_stress),
        "stress_nuance":        stress_nuance,
        "dba_planets":          dba_planets,
        "topic":                topic or "generic",
    }


# ─────────────────────────────────────────────────────────
# SECTION 6: MASTER PIPELINE
# v4.0 — Includes node delegation injection step
# ─────────────────────────────────────────────────────────

def run_kp_prediction_pipeline(
    astro_data,
    raw_significators,
    target_houses,
    dba_planets,
    topic=None,
    stress_houses=None,
    house_weights=None,
):
    """
    One-call master pipeline (v4.0):

        astro_data + raw_significators
            → strength_report
            → effective_significators
            → [NEW] node delegation injection (Rahu/Ketu inherit agent houses)
            → prediction (promise + stress + manifestation index)

    Parameters
    ----------
    astro_data         : dict  — planet degrees and positions
    raw_significators  : dict  — output of kp_significators.py
    target_houses      : list  — positive houses for topic (e.g. [2,7,11])
    dba_planets        : list  — active DBA lords
    topic              : str   — e.g. "marriage", "career", "property"
    stress_houses      : set   — manual override (skips topic config)
    house_weights      : dict  — override L1-L4 weights

    Returns
    -------
    {strength_report, effective_significators, prediction}
    """
    strength_report = compute_planet_strength(astro_data, raw_significators)

    effective_sigs = compute_effective_significators(raw_significators, strength_report)

    # v5.0: inject delegated houses with quality-weighted delegation power
    effective_sigs = inject_node_delegated_houses(
        effective_sigs, astro_data, raw_significators, strength_report
    )

    prediction = compute_prediction_score(
        target_houses           = target_houses,
        effective_significators = effective_sigs,
        dba_planets             = dba_planets,
        topic                   = topic,
        stress_houses           = stress_houses,
        house_weights           = house_weights,
    )

    return {
        "strength_report":         strength_report,
        "effective_significators": effective_sigs,
        "prediction":              prediction,
    }


# ─────────────────────────────────────────────────────────
# QUICK USAGE EXAMPLES
# ─────────────────────────────────────────────────────────
#
#   # Marriage prediction
#   result = run_kp_prediction_pipeline(
#       astro_data        = my_astro_data,
#       raw_significators = my_raw_sigs,
#       target_houses     = [2, 7, 11],
#       dba_planets       = ["Ju", "Ve", "Mo"],
#       topic             = "marriage",        # ← uses {6,8,12} stress
#   )
#
#   # Career prediction
#   result = run_kp_prediction_pipeline(
#       astro_data        = my_astro_data,
#       raw_significators = my_raw_sigs,
#       target_houses     = [6, 10, 11],
#       dba_planets       = ["Sa", "Me", "Su"],
#       topic             = "career",          # ← uses {5,8,12} stress (6 is POSITIVE here)
#   )
#
#   pred = result["prediction"]
#
#   # v3-style output still works:
#   print(pred["verdict"])
#   print(f"Promise: {pred['promise_score']}  Stress: {pred['stress_score']}  Net: {pred['net_resonance']}")
#
#   # v4.0 Manifestation Index:
#   print(pred["manifestation_label"])
#   print(f"Promise Index: {pred['promise_index']}  Stress Index: {pred['stress_index']}")
#   print(f"Manifestation Index: {pred['manifestation_index']}")
#   print(f"Stress Config: {pred['stress_nuance']}")
#
#   for row in pred["promise_breakdown"]:
#       print(row["planet"], row["promise_score"], row["logic_trace"])
#
# ─────────────────────────────────────────────────────────