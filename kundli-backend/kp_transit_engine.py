import math
# kp_transit_engine.py
# ─────────────────────────────────────────────────────────
# KP TRANSIT RESONANCE & TRIGGER WINDOW ENGINE
# v2.1 — CRITICAL FIXES:
#   [FIX 1] compute_final_transit_trigger now uses recursive_chain_quality_v2()
#           (old shallow recursive_transit_chain_quality() call removed)
#   [FIX 2] compute_exact_cusp_trigger now uses gaussian_orb_strength()
#           (old linear max(0.5, 1.5 - diff/orb) logic removed)
#   Both fixes ensure ONE consistent recursion engine and ONE consistent orb system.
# ─────────────────────────────────────────────────────────
#
# Core KP Philosophy:
#   Transits do NOT create events.
#   Transits TRIGGER events — but only when:
#       Natal Promise     (kp_strength_engine)
#       + DBA Support     (kp_dba)
#       + Transit Trigger (THIS module)
#       + RP Alignment    (THIS module)
#       = Manifestation Window
#
#   If natal promise is weak, no transit can force an event.
#
# v2.0 additions:
#   1. Transit SL/NL chain attenuation multiplier
#   2. RP weighted scoring (LSL > LRL > MSL > MRL > DL)
#   3. Transit duration window estimation
#   4. Repeated trigger reinforcement (multi-planet stacking)
#   5. Cuspal transit intensity (primary vs secondary cusp weighting)
#   6. Refined composite formula with RP amplification
#
# ─────────────────────────────────────────────────────────

from kp_strength_engine import (
    get_stress_houses_for_topic,
    DEFAULT_LEVEL_WEIGHTS,
    _score_house_set,
    _compute_manifestation_index,
    calculate_conjunctions,
)



# ─────────────────────────────────────────────────────────
# SECTION A — PLANETARY TRANSIT ARCHETYPES
# ─────────────────────────────────────────────────────────

TRANSIT_ARCHETYPES = {
    "Su": {"trigger_style": "authority_activation",       "stress_bias": 0.15, "expansion_bias": 0.20, "persistence": 0.45},
    "Mo": {"trigger_style": "temporary_emotional_trigger", "stress_bias": 0.10, "expansion_bias": 0.15, "persistence": 0.10},
    "Ma": {"trigger_style": "aggressive_activation",      "stress_bias": 0.40, "expansion_bias": 0.25, "persistence": 0.50},
    "Me": {"trigger_style": "communication_movement",     "stress_bias": 0.15, "expansion_bias": 0.20, "persistence": 0.35},
    "Ju": {"trigger_style": "expansion_growth",           "stress_bias": 0.10, "expansion_bias": 0.55, "persistence": 0.85},
    "Ve": {"trigger_style": "harmonization",              "stress_bias": 0.08, "expansion_bias": 0.30, "persistence": 0.45},
    "Sa": {"trigger_style": "pressure_delay_karma",       "stress_bias": 0.65, "expansion_bias": 0.15, "persistence": 1.00},
    "Ra": {"trigger_style": "amplification_disruption",   "stress_bias": 0.55, "expansion_bias": 0.45, "persistence": 0.80},
    "Ke": {"trigger_style": "detachment_spiritualization","stress_bias": 0.35, "expansion_bias": 0.12, "persistence": 0.70},
}

MAX_MANIFESTATION_SCORE = 1.0


# ─────────────────────────────────────────────────────────
# SECTION B — GAUSSIAN ORB FALLOFF
# ─────────────────────────────────────────────────────────

def gaussian_orb_strength(diff, orb):
    """
    Gaussian orb decay — exact hits MUCH stronger than boundary hits.
    0° → ~1.0 | orb/2 → medium | orb → weak
    """
    sigma    = orb / 2.5
    strength = math.exp(-(diff ** 2) / (2 * sigma ** 2))
    return round(max(0.0, min(1.0, strength)), 4)


# ─────────────────────────────────────────────────────────
# SECTION C — ADVANCED RECURSIVE PROPAGATION (NL + SL)
# ─────────────────────────────────────────────────────────

def recursive_chain_quality_v2(planet, transit_hierarchy, kp_strength_data, depth=0, visited=None):
    """
    v2: BOTH NL and SL recurse — deeper attenuation realism.
    Transit Jupiter → NL Venus → Venus SL Saturn → Saturn SL Rahu
    """
    if visited is None:
        visited = set()
    if depth >= 4 or planet in visited:
        return 1.0
    visited.add(planet)

    pdata      = transit_hierarchy.get(planet, {})
    nl         = pdata.get("NL")
    sl         = pdata.get("SL")
    total_mult = 1.0

    # NL recursion
    if nl and nl in kp_strength_data:
        nl_strength = kp_strength_data[nl].get("final_strength", 50)
        nl_mult     = max(0.45, min(1.15, nl_strength / 100.0))
        total_mult *= nl_mult
        total_mult *= (0.90 + (recursive_chain_quality_v2(nl, transit_hierarchy, kp_strength_data, depth+1, visited.copy()) - 0.90) * 0.35)

    # SL recursion
    if sl and sl in kp_strength_data:
        sl_strength = kp_strength_data[sl].get("final_strength", 50)
        sl_mult     = max(0.35, min(1.25, sl_strength / 100.0))
        total_mult *= sl_mult
        total_mult *= (0.85 + (recursive_chain_quality_v2(sl, transit_hierarchy, kp_strength_data, depth+1, visited.copy()) - 0.85) * 0.45)

    return round(max(0.25, min(1.35, total_mult)), 4)


# ─────────────────────────────────────────────────────────
# SECTION D — TRANSIT STRESS FLAVOR ENGINE
# ─────────────────────────────────────────────────────────

def compute_transit_stress_flavor(transit_planet, promise_score, stress_score):
    """
    Strong trigger ≠ pleasant trigger.
    Evaluates trigger quality: pleasant / mixed / stressful.
    """
    arch          = TRANSIT_ARCHETYPES.get(transit_planet, {})
    stress_bias   = arch.get("stress_bias", 0.2)
    adj_stress    = stress_score * (1 + stress_bias)
    net_quality   = promise_score - adj_stress

    if net_quality >= 25:
        flavor = "Pleasant / Supportive Trigger ✅"
    elif net_quality >= 5:
        flavor = "Mixed Trigger ⚠️"
    elif net_quality >= -10:
        flavor = "Stressful Trigger 🔥"
    else:
        flavor = "Highly Stressful / Obstructive Trigger ❌"

    return {"flavor": flavor, "net_quality": round(net_quality, 3), "stress_bias": stress_bias}


# ─────────────────────────────────────────────────────────
# SECTION E — MANIFESTATION SATURATION CONTROL
# ─────────────────────────────────────────────────────────

def normalize_manifestation_score(score):
    """Prevent multiplicative explosion — cap at MAX_MANIFESTATION_SCORE."""
    return round(min(score, MAX_MANIFESTATION_SCORE), 4)


# ─────────────────────────────────────────────────────────
# SECTION F — CONFIDENCE ENGINE
# ─────────────────────────────────────────────────────────

def compute_confidence_score(recursion_quality, cusp_hits, rp_alignment, dba_concurrence, data_completeness=1.0):
    """
    Confidence ≠ Resonance.
    Depends on: recursion stability, RP concurrence, cusp hits, DBA repetition, data completeness.
    """
    confidence  = 0.0
    confidence += recursion_quality            * 0.30
    confidence += min(cusp_hits / 5.0, 1.0)   * 0.20
    confidence += min(rp_alignment / 5.0, 1.0) * 0.20
    confidence += min(dba_concurrence/3.0, 1.0)* 0.20
    confidence += data_completeness            * 0.10
    confidence  = round(max(0.0, min(1.0, confidence)), 4)

    if confidence >= 0.80:   label = "Very High Confidence 🔥"
    elif confidence >= 0.60: label = "High Confidence ✅"
    elif confidence >= 0.40: label = "Moderate Confidence ⚠️"
    elif confidence >= 0.20: label = "Low Confidence 🔍"
    else:                    label = "Very Weak Confidence ❌"

    return {"confidence_score": confidence, "confidence_label": label}


# ─────────────────────────────────────────────────────────
# SECTION 0: CONSTANTS & CONFIG
# ─────────────────────────────────────────────────────────

TRANSIT_PLANET_SPEED = {
    "Mo": 13.2,   # Moon  — fast, short windows (~hours)
    "Su": 1.0,    # Sun
    "Me": 1.2,    # Mercury (avg)
    "Ve": 1.2,    # Venus (avg)
    "Ma": 0.52,   # Mars
    "Ju": 0.083,  # Jupiter
    "Sa": 0.033,  # Saturn
    "Ra": 0.053,  # Rahu (retrograde)
    "Ke": 0.053,  # Ketu (retrograde)
}

# Transit NL/SL level weights — same hierarchy as natal (SL most decisive)
TRANSIT_LEVEL_WEIGHTS = {"L1": 4.0, "L2": 3.0, "L3": 2.0, "L4": 1.0}

# Cuspal trigger orb
CUSPAL_TRIGGER_ORB = 1.5   # degrees
DEFAULT_CUSP_ORB   = 1.5   # alias for patch compatibility

DBA_CONCURRENCE_THRESHOLD = 2

MAX_TRANSIT_RECURSION_DEPTH = 3

TRANSIT_PLANET_WEIGHTS = {
    "Su": 1.05, "Mo": 0.85, "Ma": 1.00, "Me": 0.95,
    "Ju": 1.20, "Ve": 1.00, "Sa": 1.15, "Ra": 1.10, "Ke": 1.05
}

# ─────────────────────────────────────────────────────────
# SECTION 0.5: TRANSIT CHAIN ATTENUATION ENGINE  ← NEW v2.0
# ─────────────────────────────────────────────────────────

# KP Sutra: Transit chain quality determines trigger quality.
# Transit Jupiter with weak SL → trigger is weaker even if houses match.
#
# SL strength tiers for transit chain:
# Transit SL is looked up in NATAL strength report (natal planet strength
# governs how decisively SL acts — not transit chart strength).
#
# Attenuation table: (min_strength, max_strength, multiplier, label)
TRANSIT_SL_ATTENUATION_TIERS = [
    (80,  150, 1.10, "Strong SL — Transit trigger amplified"),
    (60,   79, 1.00, "Adequate SL — Neutral trigger"),
    (45,   59, 0.80, "Weak SL — Trigger partially suppressed"),
    (30,   44, 0.60, "Very Weak SL — Trigger heavily suppressed"),
    (0,    29, 0.40, "Severely Weak SL — Trigger near-nullified"),
]

# NL attenuation — softer than SL (NL sets event nature, SL decides delivery)
TRANSIT_NL_ATTENUATION_TIERS = [
    (80,  150, 1.05, "Strong NL — Event nature well-defined"),
    (50,   79, 1.00, "Adequate NL — Neutral"),
    (0,    49, 0.88, "Weak NL — Event nature unclear"),
]

# RP role weights — KP hierarchy: LSL most powerful, DayLord weakest
RP_ROLE_WEIGHTS = {
    "LSL":      1.00,   # Lagna Sub Lord — most powerful
    "LRL":      0.80,   # Lagna Star Lord
    "MSL":      0.65,   # Moon Sub Lord
    "MRL":      0.50,   # Moon Star Lord
    "DL":       0.30,   # Day Lord — weakest
    "DayLord":  0.30,   # alternate key name
}


def _resolve_transit_chain_multiplier(transit_nl, transit_sl, natal_strength_report, depth=0, visited=None):
    """
    Recursive transit chain attenuation multiplier (v2.0).
    Transit NL → SL → SL's own SL chain (depth-limited, loop-protected).
    """
    if visited is None:
        visited = set()
    if depth > 3 or transit_sl in visited:
        return 1.0, "Max recursion depth reached"
    visited.add(transit_sl)

    # SL attenuation
    sl_strength = natal_strength_report.get(transit_sl, {}).get("effective_strength", 70)
    sl_mult, sl_label = 1.0, "SL unknown"
    for lo, hi, mult, label in TRANSIT_SL_ATTENUATION_TIERS:
        if lo <= sl_strength <= hi:
            sl_mult, sl_label = mult, label
            break

    # NL attenuation
    nl_strength = natal_strength_report.get(transit_nl, {}).get("effective_strength", 70)
    nl_mult, nl_label = 1.0, "NL unknown"
    for lo, hi, mult, label in TRANSIT_NL_ATTENUATION_TIERS:
        if lo <= nl_strength <= hi:
            nl_mult, nl_label = mult, label
            break

    # Recursive: SL's own SL chain
    sl_own_sl = natal_strength_report.get(transit_sl, {}).get("SL")
    recursive_mult, recursive_label = 1.0, ""
    if sl_own_sl and sl_own_sl not in visited:
        recursive_mult, recursive_label = _resolve_transit_chain_multiplier(
            transit_nl=transit_sl, transit_sl=sl_own_sl,
            natal_strength_report=natal_strength_report,
            depth=depth + 1, visited=visited
        )
        recursive_mult = 0.85 + (recursive_mult - 0.85) * 0.4  # dampen recursive effect

    combined = round(nl_mult * sl_mult * recursive_mult, 4)
    combined  = max(0.35, min(1.15, combined))

    chain_label = (
        f"NL({transit_nl}) str={nl_strength} ×{nl_mult} [{nl_label}] | "
        f"SL({transit_sl}) str={sl_strength} ×{sl_mult} [{sl_label}] | "
        f"Recursive ×{round(recursive_mult,3)} | Combined ×{combined}"
    )
    return combined, chain_label


def _estimate_transit_duration(transit_planet, orb_degrees=1.5):
    """
    Estimates how many days a transit planet stays within orb of a point.

    duration_days = (2 × orb) / planet_speed_deg_per_day

    Useful for understanding trigger window length:
    - Moon: ~2-3 hours
    - Sun/Mercury/Venus: ~3 days
    - Mars: ~5-6 days
    - Jupiter: ~36 days
    - Saturn: ~90 days

    Returns duration_days (float)
    """
    speed = TRANSIT_PLANET_SPEED.get(transit_planet, 0.5)
    if speed <= 0:
        return 0.0
    return round((2 * orb_degrees) / speed, 2)





# ─────────────────────────────────────────────────────────
# SECTION 0.7: PATCH — Recursive Chain | Cusp Trigger | DBA/RP Amplifiers
# ─────────────────────────────────────────────────────────

def compute_exact_cusp_trigger(transit_hierarchy, cusp_degrees, orb=DEFAULT_CUSP_ORB):
    """
    Exact KP cusp-hit trigger logic.
    When transit planet is within orb of a cusp degree → activation boost.
    """
    trigger_hits    = []
    total_resonance = 1.0

    for planet, pdata in transit_hierarchy.items():
        tdeg = pdata.get("Degree", 0)
        for cusp_name, cdeg in cusp_degrees.items():
            diff = abs(tdeg - cdeg)
            diff = min(diff, 360 - diff)
            if diff <= orb:
                closeness = gaussian_orb_strength(diff, orb)
                trigger_hits.append({
                    "planet":   planet,
                    "cusp":     cusp_name,
                    "distance": round(diff, 3),
                    "boost":    round(closeness, 3)
                })
                total_resonance *= closeness

    return {"hits": trigger_hits, "resonance": round(total_resonance, 4)}


def compute_dba_repetition_boost(active_dba, significators):
    """
    Repeating KP significator amplification.
    Houses signified by 2+ DBA lords = stronger timing signal.
    """
    repeated = {}
    for lord in active_dba:
        for h in significators.get(lord, {}).get("all", []):
            repeated[h] = repeated.get(h, 0) + 1

    repeated_hits = {h: c for h, c in repeated.items() if c >= 2}
    boost = 1.0
    for h, c in repeated_hits.items():
        boost *= (1 + (0.08 * c))

    return {"repeated_houses": repeated_hits, "boost": round(boost, 4)}


def compute_rp_resonance_boost(transit_hierarchy, weighted_rps):
    """
    RP resonance amplification layer.
    Transit NL/SL matching RP planets → multiplicative boost.
    Input: weighted_rps from kp_transit_rp.compute_ruling_planets() output.
    """
    resonance = 1.0
    matches   = []

    rp_planets = {rp["planet"]: rp["weight"] for rp in weighted_rps}

    for tplanet, pdata in transit_hierarchy.items():
        nl = pdata.get("NL")
        sl = pdata.get("SL")

        if nl in rp_planets:
            mult = 1 + (rp_planets[nl] / 500.0)
            resonance *= mult
            matches.append({"transit": tplanet, "match": nl, "type": "NL", "mult": round(mult, 3)})

        if sl in rp_planets:
            mult = 1 + (rp_planets[sl] / 450.0)
            resonance *= mult
            matches.append({"transit": tplanet, "match": sl, "type": "SL", "mult": round(mult, 3)})

    return {"matches": matches, "resonance": round(resonance, 4)}


def compute_final_transit_trigger(
    transit_hierarchy, kp_strength_data,
    cusp_trigger_data, dba_boost_data, rp_boost_data
):
    """
    Final KP transit manifestation trigger.
    Multiplicative synthesis:
        Planet chain quality × DBA boost × RP resonance × Cusp trigger
    """
    final_score = 1.0
    logic_trace = []

    for planet, pdata in transit_hierarchy.items():
        chain_q      = recursive_chain_quality_v2(planet, transit_hierarchy, kp_strength_data)
        base_weight  = TRANSIT_PLANET_WEIGHTS.get(planet, 1.0)
        planet_trigger = base_weight * chain_q
        final_score *= planet_trigger
        logic_trace.append({
            "planet":        planet,
            "base_weight":   base_weight,
            "chain_quality": round(chain_q, 4),
            "trigger":       round(planet_trigger, 4)
        })

    final_score *= dba_boost_data.get("boost", 1.0)
    final_score *= rp_boost_data.get("resonance", 1.0)
    final_score *= cusp_trigger_data.get("resonance", 1.0)

    return {
        "final_trigger_score": normalize_manifestation_score(final_score),
        "logic_trace":         logic_trace,
        "dba_boost":           dba_boost_data,
        "rp_boost":            rp_boost_data,
        "cusp_trigger":        cusp_trigger_data
    }

# ─────────────────────────────────────────────────────────
# SECTION 1: TRANSIT SIGNIFICATOR EXTRACTOR
# ─────────────────────────────────────────────────────────

def extract_transit_significators(transit_planet, transit_significators):
    """
    Extracts the KP signification chain for a transit planet.
    Transit chain: Transit Planet → NL → SL → SSL → House significations.
    """
    if transit_planet not in transit_significators:
        return {}

    return {
        "planet":    transit_planet,
        "NL":        transit_significators[transit_planet].get("NL"),
        "SL":        transit_significators[transit_planet].get("SL"),
        "SSL":       transit_significators[transit_planet].get("SSL"),
        "SignLord":  transit_significators[transit_planet].get("SignLord"),
        "L1":        transit_significators[transit_planet].get("L1", []),
        "L2":        transit_significators[transit_planet].get("L2", []),
        "L3":        transit_significators[transit_planet].get("L3", []),
        "L4":        transit_significators[transit_planet].get("L4", []),
    }


# ─────────────────────────────────────────────────────────
# SECTION 2: SINGLE TRANSIT PLANET RESONANCE  ← REFINED v2.0
# ─────────────────────────────────────────────────────────

def compute_transit_planet_resonance(
    transit_planet,
    transit_significators,
    natal_strength_report,
    target_houses,
    topic=None,
    stress_houses=None,
    dba_planets=None,
    house_weights=None,
):
    """
    v2.0 — Evaluates transit planet trigger quality with chain attenuation.

    New in v2.0:
      - Transit SL/NL chain multiplier applied (NOT flat 1.0 anymore)
      - Weak transit SL → trigger attenuated even if houses match
      - Strong transit SL → trigger amplified
      - Duration window estimated from planet speed
      - Chain attenuation exposed in logic_trace for explainability

    KP Sutra:
      Transit with weak SL chain = weak trigger.
      Transit with strong SL chain = strong trigger.

    SL/NL strength is looked up from NATAL strength_report —
    how decisively these planets act in the natal chart.
    """
    if stress_houses is None:
        stress_houses, _ = get_stress_houses_for_topic(topic)

    level_weights = {**TRANSIT_LEVEL_WEIGHTS, **(house_weights or {})}
    dba_planets   = dba_planets or []

    t_sig = extract_transit_significators(transit_planet, transit_significators)
    if not t_sig:
        return _empty_transit_result(transit_planet, "Transit planet not in significators")

    nl  = t_sig.get("NL")
    sl  = t_sig.get("SL")
    ssl = t_sig.get("SSL")

    # ── v2.0: Transit chain attenuation ──────────────────
    if nl and sl:
        chain_mult, chain_label = _resolve_transit_chain_multiplier(
            nl, sl, natal_strength_report
        )
    else:
        chain_mult  = 0.80   # partial chain — moderate suppression
        chain_label = f"Incomplete chain (NL={nl}, SL={sl}) — default suppression ×0.80"

    # ── DBA concurrence boost ─────────────────────────────
    is_dba_concurrent = transit_planet in dba_planets
    dba_boost = {}
    if is_dba_concurrent:
        idx = dba_planets.index(transit_planet)
        dba_boost[transit_planet] = [1.25, 1.15, 1.05][min(idx, 2)]

    # ── Duration window estimation ────────────────────────
    duration_days = _estimate_transit_duration(transit_planet, CUSPAL_TRIGGER_ORB)

    chain_parts = [
        f"Transit {transit_planet} → NL={nl} → SL={sl} → SSL={ssl}",
        f"Chain: {chain_label}",
    ]

    # Build transit effective sig — apply chain multiplier here
    transit_eff = {
        transit_planet: {
            "L1": t_sig.get("L1", []),
            "L2": t_sig.get("L2", []),
            "L3": t_sig.get("L3", []),
            "L4": t_sig.get("L4", []),
            "multiplier":  chain_mult,   # v2.0: no longer flat 1.0
            "logic_trace": " | ".join(chain_parts),
        }
    }

    transit_promise, promise_bd = _score_house_set(
        target_houses           = set(target_houses),
        effective_significators = transit_eff,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "promise",
    )

    transit_stress, stress_bd = _score_house_set(
        target_houses           = set(stress_houses),
        effective_significators = transit_eff,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "stress",
    )

    trigger_mf = _compute_manifestation_index(transit_promise, transit_stress)
    ti = trigger_mf["manifestation_index"]

    # Trigger verdict
    if ti >= 0.65:
        trigger_verdict = f"Strong Trigger — {transit_planet} activates {topic or 'topic'} ✅"
    elif ti >= 0.40:
        trigger_verdict = f"Moderate Trigger — {transit_planet} partial resonance ⚠️"
    elif ti >= 0.20:
        trigger_verdict = f"Weak Trigger — {transit_planet} low activation 🔍"
    else:
        trigger_verdict = f"No Trigger — {transit_planet} does not activate {topic or 'topic'} ❌"

    return {
        "transit_planet":        transit_planet,
        "transit_promise":       transit_promise,
        "transit_stress":        transit_stress,
        "transit_net":           round(transit_promise - transit_stress, 3),
        "trigger_index":         ti,
        "trigger_promise_index": trigger_mf["promise_index"],
        "trigger_stress_index":  trigger_mf["stress_index"],
        "trigger_verdict":       trigger_verdict,
        "trigger_stress_label":  trigger_mf["stress_label"],
        "is_dba_concurrent":     is_dba_concurrent,
        "dba_boost_applied":     dba_boost.get(transit_planet, 1.0),
        # v2.0 chain quality
        "chain_multiplier":      chain_mult,
        "chain_label":           chain_label,
        "chain_nl":              nl,
        "chain_sl":              sl,
        "chain_ssl":             ssl,
        # v2.0 duration
        "duration_days":         duration_days,
        "duration_note": (
            f"{transit_planet} stays within {CUSPAL_TRIGGER_ORB}° orb for ~{duration_days} days"
        ),
        "promise_breakdown":     promise_bd,
        "stress_breakdown":      stress_bd,
        "chain_trace":           " | ".join(chain_parts),
    }



def compute_rp_alignment(
    ruling_planets,
    transit_significators,
    natal_effective_significators,
    target_houses,
    topic=None,
    stress_houses=None,
):
    """
    🔥 ADVANCED FUZZY RP ALIGNMENT (UI CLEANUP PATCH)
    Fixed: 'RP (): Promotes [None]' junk output.
    """
    if stress_houses is None: stress_houses = []

    # 1. Role mapping (ताकि LSL, MSL नाम दिखें)
    rp_dict_mapped = {}
    if isinstance(ruling_planets, dict):
        for role, val in ruling_planets.items():
            p = val.get("planet") if isinstance(val, dict) else val
            if p: rp_dict_mapped[str(role)] = str(p)
    elif isinstance(ruling_planets, list):
        for i, rp in enumerate(ruling_planets):
            p = rp.get("planet") if isinstance(rp, dict) else rp
            role = rp.get("role", f"RP-{i+1}") if isinstance(rp, dict) else f"RP-{i+1}"
            if p: rp_dict_mapped[str(role)] = str(p)

    rp_breakdown = []
    for role, rp_planet in rp_dict_mapped.items():
        rp_breakdown.append({"rp_role": role, "planet": rp_planet, "matched_target": [], "matched_stress": []})

    rp_list = list(set(rp_dict_mapped.values()))
    score = 0.0

    # 2. Fuzzy Scoring
    for t_planet, t_data in (transit_significators or {}).items():
        nl = str(t_data.get("NL", ""))
        sl = str(t_data.get("SL", ""))
        ssl = str(t_data.get("SSL", ""))

        if t_planet in rp_list: score += 20.0
        if nl in rp_list: score += 14.0
        if sl in rp_list: score += 18.0
        if ssl in rp_list: score += 10.0

        if natal_effective_significators and t_planet in natal_effective_significators:
            sig = natal_effective_significators[t_planet]
            houses = set()
            for lvl in ["L1", "L2", "L3", "L4"]:
                vals = sig.get(lvl, [])
                if isinstance(vals, list): houses.update(vals)
                elif isinstance(vals, int): houses.add(vals)
            
            overlap = houses.intersection(set(target_houses))
            if overlap:
                score += len(overlap) * 6.0
                for rb in rp_breakdown:
                    if rb["planet"] in [t_planet, nl, sl, ssl]:
                        rb["matched_target"] = list(set(rb["matched_target"] + list(overlap)))

    # 🚀 CLEANUP: सिर्फ वही RP दिखाएं जो सच में कुछ प्रमोट कर रहे हों 
    final_breakdown = [rb for rb in rp_breakdown if len(rb["matched_target"]) > 0]

    final_score = min(100.0, score) / 100.0

    if final_score >= 0.75: rp_label = "Strong RP Resonance 🔥"
    elif final_score >= 0.45: rp_label = "Moderate RP Resonance ✅"
    elif final_score >= 0.20: rp_label = "Weak RP Resonance ⚠️"
    else: rp_label = "Minimal RP Resonance 🔍"

    return {
        "rp_promise": final_score,
        "rp_stress": 0.0,
        "rp_net": final_score,
        "rp_alignment_score": final_score,
        "rp_alignment_label": rp_label,
        "rp_breakdown": final_breakdown,
        "topic": topic or "generic"
    }
# SECTION 4: CUSPAL TRIGGER PROXIMITY
# ─────────────────────────────────────────────────────────
def compute_cuspal_trigger_proximity(
    transit_positions,
    cusp_positions,
    topic_cusps,
    orb=3.2, # 🚀 CALIBRATION: Orb 1.5 से बढ़ाकर 3.2 कर दिया (KP Realistic)
):
    """
    🔥 ADVANCED CUSPAL TRIGGER (CALIBRATED)
    Increased orb and robust data extraction to fix 0% hits.
    """
    active_triggers = []

    for cusp_num in topic_cusps:
        cusp_info = cusp_positions.get(cusp_num) or cusp_positions.get(str(cusp_num)) or {}
        
        # 🚀 ROBUST EXTRACTION: अगर JSON में 'degree' की जगह 'longitude' हो
        cusp_degree = cusp_info.get("degree")
        if cusp_degree is None: cusp_degree = cusp_info.get("longitude")
        if cusp_degree is None: cusp_degree = cusp_info.get("normDegree")
        
        sl_planet = cusp_info.get("SL") or cusp_info.get("sub_lord")
        sl_degree = cusp_info.get("SL_degree")

        if cusp_degree is None:
            continue

        for t_planet, t_deg in (transit_positions or {}).items():
            try:
                t_deg_norm = float(t_deg) % 360
                c_deg_norm = float(cusp_degree) % 360

                diff_cusp = abs(t_deg_norm - c_deg_norm)
                if diff_cusp > 180: diff_cusp = 360 - diff_cusp

                diff_sl = None
                if sl_degree is not None:
                    diff_sl = abs(t_deg_norm - (float(sl_degree) % 360))
                    if diff_sl > 180: diff_sl = 360 - diff_sl

                trigger_type = None
                trigger_diff = None

                if diff_cusp <= orb:
                    trigger_type = "cusp_degree"
                    trigger_diff = round(diff_cusp, 3)
                elif diff_sl is not None and diff_sl <= orb:
                    trigger_type = "sl_degree"
                    trigger_diff = round(diff_sl, 3)

                if trigger_type:
                    proximity_strength = gaussian_orb_strength(trigger_diff, orb)
                    active_triggers.append({
                        "transit_planet": t_planet,
                        "cusp_number": cusp_num,
                        "trigger_type": trigger_type,
                        "orb_degrees": trigger_diff,
                        "proximity_strength": proximity_strength,
                        "cusp_sl": sl_planet,
                        "description": f"{t_planet} near H{cusp_num} (Δ {trigger_diff}°)"
                    })
            except Exception:
                pass

    active_triggers.sort(key=lambda x: x["proximity_strength"], reverse=True)
    strongest = active_triggers[0] if active_triggers else None

    # Frontend को 0.0 से 1.0 के बीच का स्कोर चाहिए
    final_score = (strongest["proximity_strength"] if strongest else 0.0)
    
    return {
        "active_triggers": active_triggers,
        "trigger_count": len(active_triggers),
        "strongest_trigger": strongest,
        "cuspal_trigger_active": len(active_triggers) > 0,
        "proximity_strength": final_score # 🚀 FIX: Frontend इसी Key को ढूंढ रहा था!
    }
# ─────────────────────────────────────────────────────────
# SECTION 5: DBA CONCURRENCE CHECKER
# ─────────────────────────────────────────────────────────

def compute_dba_concurrence(
    dba_planets,
    natal_effective_significators,
    target_houses,
    topic=None,
    stress_houses=None,
):
    """
    Evaluates repeating significator principle:
    When MD + BD + AD lords all signify the same target houses,
    timing is considered strongly activated.

    Parameters
    ----------
    dba_planets : list  — [MD_lord, BD_lord, AD_lord] (max 3)
    natal_effective_significators : dict
    target_houses : list
    topic : str
    stress_houses : set

    Returns
    -------
    dict with repeating_count, concurrence_score, concurrence_label,
    dba_breakdown
    """
    if stress_houses is None:
        stress_houses, _ = get_stress_houses_for_topic(topic)

    dba_breakdown = []
    repeating_target = {}   # house → count of DBA lords signifying it
    repeating_stress  = {}

    for i, planet in enumerate((dba_planets or [])[:3]):
        tier_label = ["MD", "BD", "AD"][i]
        if planet not in natal_effective_significators:
            continue

        sig = natal_effective_significators[planet]
        planet_target_houses = set()
        planet_stress_houses = set()

        for level in ["L1", "L2", "L3", "L4"]:
            for h in sig.get(level, []):
                if h in target_houses:
                    planet_target_houses.add(h)
                    repeating_target[h] = repeating_target.get(h, 0) + 1
                if h in stress_houses:
                    planet_stress_houses.add(h)
                    repeating_stress[h] = repeating_stress.get(h, 0) + 1

        dba_breakdown.append({
            "tier":          tier_label,
            "planet":        planet,
            "target_houses": sorted(planet_target_houses),
            "stress_houses": sorted(planet_stress_houses),
        })

    # Houses repeated by all 3 DBA lords = strongest timing signal
    all_three_repeat = {h for h, c in repeating_target.items() if c >= 3}
    two_repeat       = {h for h, c in repeating_target.items() if c == 2}
    stress_repeat    = {h for h, c in repeating_stress.items() if c >= 2}

    # DBA repetition amplification
    repetition_boost = 0.0
    if all_three_repeat:
        repetition_boost = 0.30 * len(all_three_repeat)
    elif two_repeat:
        repetition_boost = 0.15 * len(two_repeat)
    repetition_boost = min(repetition_boost, 0.60)

    if len(dba_breakdown) == 0:
        concurrence_score = 0
    elif all_three_repeat:
        concurrence_score = 3
    elif two_repeat:
        concurrence_score = 2
    elif any(repeating_target):
        concurrence_score = 1
    else:
        concurrence_score = 0

    if concurrence_score == 3:
        concurrence_label = "Maximum DBA Concurrence — All 3 lords repeat 🔥"
    elif concurrence_score == 2:
        concurrence_label = "Strong DBA Concurrence — 2 lords repeat ✅"
    elif concurrence_score == 1:
        concurrence_label = "Partial DBA Concurrence — 1 lord active ⚠️"
    else:
        concurrence_label = "No DBA Concurrence — Topic houses not repeated ❌"

    return {
        "dba_breakdown":       dba_breakdown,
        "repeating_target":    repeating_target,
        "repeating_stress":    repeating_stress,
        "all_three_repeat":    sorted(all_three_repeat),
        "two_repeat":          sorted(two_repeat),
        "stress_repeat":       sorted(stress_repeat),
        "concurrence_score":   concurrence_score,
        "concurrence_label":   concurrence_label,
        "repetition_boost":    round(repetition_boost, 3),
    }


# ─────────────────────────────────────────────────────────
# SECTION 6: FULL TRANSIT TRIGGER WINDOW EVALUATOR
# ─────────────────────────────────────────────────────────

def compute_transit_trigger_window(
    topic,
    transit_planets_to_check,
    transit_significators,
    natal_effective_significators,
    natal_strength_report,
    natal_planetary_prediction,
    target_houses,
    dba_planets=None,
    ruling_planets=None,
    transit_positions=None,
    cusp_positions=None,
    topic_cusps=None,
    stress_houses=None,
    house_weights=None,
):
    """
    Full transit trigger window evaluation.

    Combines:
      1. Per-transit-planet resonance scores
      2. DBA concurrence (repeating significators)
      3. RP alignment
      4. Cuspal trigger proximity
      5. Natal promise gate — weak natal promise suppresses transit activation

    IMPORTANT: Transit cannot override natal promise.
    If natal manifestation_index < 0.25, transit trigger is suppressed.

    Parameters
    ----------
    topic                         : str
    transit_planets_to_check      : list[str]  — e.g. ["Ju", "Sa", "Mo"]
    transit_significators         : dict
    natal_effective_significators : dict
    natal_strength_report         : dict
    natal_planetary_prediction    : dict  — from kp_strength_engine
    target_houses                 : list[int]
    dba_planets                   : list[str]
    ruling_planets                : dict  — {"LSL": ..., "LRL": ..., ...}
    transit_positions             : dict  — {planet: degree}
    cusp_positions                : dict  — {cusp_num: {degree, SL, SL_degree}}
    topic_cusps                   : list[int]
    stress_houses                 : set
    house_weights                 : dict

    Returns
    -------
    dict — complete trigger window assessment
    """
    if stress_houses is None:
        stress_houses, stress_nuance = get_stress_houses_for_topic(topic)
    else:
        stress_nuance = "Manually overridden"

    # ── Natal Promise Gate ────────────────────────────────
    natal_mi = natal_planetary_prediction.get("manifestation_index", 0.0)
    if natal_mi < 0.15:
        natal_gate = "blocked"
        natal_gate_note = f"Natal promise too weak (MI={natal_mi}) — transit activation suppressed"
    elif natal_mi < 0.25:
        natal_gate = "weak"
        natal_gate_note = f"Natal promise weak (MI={natal_mi}) — transit trigger heavily discounted"
    else:
        natal_gate = "open"
        natal_gate_note = f"Natal promise active (MI={natal_mi}) — transit evaluation proceeding"

    natal_gate_multiplier = {"open": 1.0, "weak": 0.5, "blocked": 0.1}[natal_gate]

    # ── 1. Per-transit-planet resonance ───────────────────
    transit_results = {}
    for tp in (transit_planets_to_check or []):
        transit_results[tp] = compute_transit_planet_resonance(
            transit_planet        = tp,
            transit_significators = transit_significators,
            natal_strength_report = natal_strength_report,
            target_houses         = target_houses,
            topic                 = topic,
            stress_houses         = stress_houses,
            dba_planets           = dba_planets,
            house_weights         = house_weights,
        )

    # Best trigger planet
    best_trigger = max(
        transit_results.values(),
        key=lambda x: x.get("trigger_index", 0),
        default=None,
    )

    # ── 2. DBA Concurrence ────────────────────────────────
    dba_concurrence = compute_dba_concurrence(
        dba_planets                   = dba_planets,
        natal_effective_significators = natal_effective_significators,
        target_houses                 = target_houses,
        topic                         = topic,
        stress_houses                 = stress_houses,
    )

    # ── 3. RP Alignment ───────────────────────────────────
    rp_alignment = compute_rp_alignment(
        ruling_planets                = ruling_planets,
        transit_significators         = transit_significators,
        natal_effective_significators = natal_effective_significators,
        target_houses                 = target_houses,
        topic                         = topic,
        stress_houses                 = stress_houses,
    ) if ruling_planets else {"rp_alignment_score": 0, "rp_alignment_label": "RP data not provided"}

    # ── 4. Cuspal trigger proximity ───────────────────────
    cuspal_triggers = compute_cuspal_trigger_proximity(
        transit_positions = transit_positions or {},
        cusp_positions    = cusp_positions or {},
        topic_cusps       = topic_cusps or [],
        orb               = CUSPAL_TRIGGER_ORB,
    ) if transit_positions and cusp_positions else {
        "active_triggers": [], "trigger_count": 0,
        "strongest_trigger": None, "cuspal_trigger_active": False
    }

    # ── 5. Composite Trigger Score ────────────────────────
    # Components:
    #   A. Best transit trigger index        (0-1)
    #   B. DBA concurrence score             (0-3, normalised to 0-1)
    #   C. RP alignment score                (0-5, normalised to 0-1)
    #   D. Cuspal trigger bonus              (0 or proximity_strength)
    #
    # Weighted composite:
    #   trigger_composite = A×0.40 + B×0.25 + C×0.25 + D×0.10
    # Then gated by natal promise multiplier.

    A = (best_trigger or {}).get("trigger_index", 0.0)
    B = min((dba_concurrence.get("concurrence_score", 0) / 3.0)
            + dba_concurrence.get("repetition_boost", 0.0), 1.0)
    C = min(rp_alignment.get("rp_alignment_score", 0) / 5.0, 1.0)
    D = (cuspal_triggers.get("strongest_trigger") or {}).get("proximity_strength", 0.0)

    # RP amplifier: strong RP alignment amplifies overall trigger (up to +20%)
    rp_amplifier  = 1.0 + (C * 0.20)
    raw_composite = round(A * 0.40 + B * 0.25 + C * 0.25 + D * 0.10, 4)
    trigger_composite = round(raw_composite * natal_gate_multiplier * rp_amplifier, 4)
    trigger_composite = min(trigger_composite, 1.0)

    # Verdict
    if natal_gate == "blocked":
        trigger_verdict = "Activation Blocked — Natal Promise Insufficient 🚫"
    elif trigger_composite >= 0.60:
        trigger_verdict = "Active Trigger Window — High Resonance 🔥"
    elif trigger_composite >= 0.40:
        trigger_verdict = "Possible Trigger Window — Moderate Resonance ⚠️"
    elif trigger_composite >= 0.20:
        trigger_verdict = "Weak Trigger Window — Monitor Closely 🔍"
    else:
        trigger_verdict = "No Active Trigger Window 🔕"

    return {
        # Summary
        "topic":                  topic,
        "trigger_composite":      trigger_composite,
        "raw_composite":          raw_composite,
        "rp_amplifier":           round(rp_amplifier, 4),
        "natal_gate":             natal_gate,
        "natal_gate_note":        natal_gate_note,
        "natal_gate_multiplier":  natal_gate_multiplier,
        "trigger_verdict":        trigger_verdict,
        # Component scores
        "component_scores": {
            "best_transit_trigger": round(A, 4),
            "dba_concurrence":      round(B, 4),
            "rp_alignment":         round(C, 4),
            "cuspal_trigger":       round(D, 4),
        },
        # Detailed sub-results
        "transit_planet_results": transit_results,
        "best_trigger_planet":    best_trigger,
        "dba_concurrence":        dba_concurrence,
        "rp_alignment":           rp_alignment,
        "cuspal_triggers":        cuspal_triggers,
        # Meta
        "target_houses":          list(target_houses),
        "stress_houses":          sorted(stress_houses),
        "stress_nuance":          stress_nuance,
        "dba_planets":            dba_planets or [],
    }


# ─────────────────────────────────────────────────────────
# SECTION 7: FINAL MASTER RESONANCE
# Combines natal + cuspal + transit into one probability estimate
# ─────────────────────────────────────────────────────────

def compute_final_event_resonance(
    natal_final_resonance,
    transit_trigger_window,
):
    """
    Top-level combination of ALL resonance layers.

    KP Formula:
        Natal Promise × Planetary Strength × Cuspal Manifestation × Transit Trigger
        = Final Event Resonance

    Implemented as:
        final_event_mi =
            final_manifestation_index (from cuspal blend)  ×  0.70
            + trigger_composite (from transit engine)       ×  0.30

    Transit contributes 30% — it can boost or confirm, but cannot override
    weak natal promise (already gated in trigger window computation).

    Parameters
    ----------
    natal_final_resonance  : dict — from kp_cuspal_engine.combine_planetary_cuspal_resonance()
    transit_trigger_window : dict — from compute_transit_trigger_window()

    Returns
    -------
    dict with final_event_resonance_index, final_event_verdict, synthesis_trace
    """
    natal_mi    = natal_final_resonance.get("final_manifestation_index", 0.0)
    trigger_ci  = transit_trigger_window.get("trigger_composite", 0.0)
    natal_gate  = transit_trigger_window.get("natal_gate", "open")

    final_event_mi = round(natal_mi * 0.70 + trigger_ci * 0.30, 4)

    if natal_gate == "blocked":
        final_verdict = "Event Unlikely — Natal Promise Insufficient 🚫"
    elif final_event_mi >= 0.65:
        final_verdict = "Strong Resonance Window — Event Probable 🔥"
    elif final_event_mi >= 0.45:
        final_verdict = "Moderate Resonance — Conditional Event ⚠️"
    elif final_event_mi >= 0.25:
        final_verdict = "Delayed Manifestation Possible — Low Resonance 🕐"
    else:
        final_verdict = "Very Low Resonance — Event Unlikely 🔕"

    synthesis_trace = (
        f"Natal MI={natal_mi} ×0.70 + Transit CI={trigger_ci} ×0.30 "
        f"= Final={final_event_mi} | Gate={natal_gate} | "
        f"Natal verdict: {natal_final_resonance.get('final_verdict', 'N/A')} | "
        f"Transit verdict: {transit_trigger_window.get('trigger_verdict', 'N/A')}"
    )

    confidence_data = compute_confidence_score(
        recursion_quality = min(trigger_ci, 1.0),
        cusp_hits         = transit_trigger_window.get("cuspal_triggers", {}).get("trigger_count", 0),
        rp_alignment      = transit_trigger_window.get("rp_alignment", {}).get("rp_alignment_score", 0),
        dba_concurrence   = transit_trigger_window.get("dba_concurrence", {}).get("concurrence_score", 0),
        data_completeness = 1.0,
    )

    return {
        "final_event_resonance_index": final_event_mi,
        "final_event_verdict":         final_verdict,
        "natal_manifestation_index":   natal_mi,
        "transit_trigger_composite":   trigger_ci,
        "natal_gate":                  natal_gate,
        "synthesis_trace":             synthesis_trace,
        "confidence":                  confidence_data,
        "blend_note": (
            "Transit cannot override natal promise. "
            "Weak natal = trigger window suppressed regardless of transit quality."
        ),
    }


# ─────────────────────────────────────────────────────────
# USAGE EXAMPLE
# ─────────────────────────────────────────────────────────
#
#   # Step 1: Natal pipeline (kp_strength_engine)
#   natal = run_kp_prediction_pipeline(...)
#
#   # Step 2: Cuspal pipeline (kp_cuspal_engine)
#   cuspal = run_cuspal_pipeline(...)
#
#   # Step 3: Transit trigger window (this module)
#   transit = compute_transit_trigger_window(
#       topic                         = "marriage",
#       transit_planets_to_check      = ["Ju", "Ve", "Sa", "Mo"],
#       transit_significators         = transit_raw_sigs,   # from kp_significators for transit chart
#       natal_effective_significators = natal["effective_significators"],
#       natal_strength_report         = natal["strength_report"],
#       natal_planetary_prediction    = natal["prediction"],
#       target_houses                 = [2, 7, 11],
#       dba_planets                   = ["Ju", "Ve", "Mo"],
#       ruling_planets                = {"LSL": "Ve", "LRL": "Mo", "MSL": "Ju", "MRL": "Sa", "DL": "Me"},
#       transit_positions             = {"Ju": 45.5, "Ve": 112.3, "Sa": 290.1, "Mo": 178.4},
#       cusp_positions                = {7: {"degree": 44.2, "SL": "Ve", "SL_degree": 115.0}},
#       topic_cusps                   = [7, 2, 11],
#   )
#
#   # Step 4: Final composite (this module)
#   final = compute_final_event_resonance(
#       natal_final_resonance  = cuspal["final_resonance"],
#       transit_trigger_window = transit,
#   )
#
#   print(final["final_event_verdict"])
#   print(f"Final Resonance Index: {final['final_event_resonance_index']}")
#   print(final["synthesis_trace"])
#
# ─────────────────────────────────────────────────────────