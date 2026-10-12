# kp_cuspal_engine.py
# ─────────────────────────────────────────────────────────
# KP CUSPAL RESONANCE ENGINE
# v2.0 — Recursive Cusp Weakening | CSL Propagation | Cusp-to-Planet Attenuation
#         | Cuspal Stress Amplification | Dynamic Contextual Blending
# ─────────────────────────────────────────────────────────
#
# Core KP Philosophy:
#   Planets show TENDENCY.
#   Cuspal Sub Lords decide MANIFESTATION.
#
#   A strong planet with a WEAK primary CSL = event denied or heavily delayed.
#   A moderate planet with a STRONG CSL = event manifests cleanly.
#
# v2.0 additions:
#   1. CSL Strength Propagation — SL weakness multiplicatively suppresses cusp MI
#   2. Recursive Cusp Chain Weakening — weak primary cusp cascades into secondary
#   3. Cusp-to-Planet Attenuation — weak cusp gate attenuates planetary promise
#   4. Cuspal Stress Amplification — stress houses in CSL chain amplified
#   5. Dynamic blend already present (v1.5) — preserved as-is
#
# ─────────────────────────────────────────────────────────

from kp_strength_engine import (
    get_stress_houses_for_topic,
    DEFAULT_LEVEL_WEIGHTS,
    _score_house_set,
    _compute_manifestation_index,
)


# ─────────────────────────────────────────────────────────
# SECTION 0: TOPIC → RELEVANT CUSP MAPPING
# ─────────────────────────────────────────────────────────

KP_TOPIC_CUSP_MAP = {
    "marriage":     {"primary": [7],    "secondary": [2, 11]},
    "career":       {"primary": [10],   "secondary": [6, 11]},
    "property":     {"primary": [4],    "secondary": [11, 12]},
    "finance":      {"primary": [2],    "secondary": [11, 5]},
    "health":       {"primary": [1],    "secondary": [6, 8]},
    "children":     {"primary": [5],    "secondary": [2, 11]},
    "travel":       {"primary": [9],    "secondary": [3, 12]},
    "education":    {"primary": [9],    "secondary": [4, 5]},
    "spirituality": {"primary": [9],    "secondary": [12, 8]},
}

CUSP_PRIMARY_WEIGHT   = 0.65
CUSP_SECONDARY_WEIGHT = 0.35


# ─────────────────────────────────────────────────────────
# SECTION 0.5: CSL MANIFESTATION PROPAGATION ENGINE  ← NEW v2.0
# ─────────────────────────────────────────────────────────

# When SL strength is below these thresholds, cusp MI is attenuated multiplicatively.
# SL is the most decisive lord — its weakness must cascade into the cusp score.
CSL_STRENGTH_TIERS = [
    # (min_strength, max_strength, multiplier, label)
    (80,  150, 1.10, "Strong CSL — Manifestation Boosted"),       # strong SL boosts slightly
    (60,   79, 1.00, "Adequate CSL — Neutral"),                   # acceptable, no change
    (45,   59, 0.80, "Weak CSL — Manifestation Suppressed"),      # moderate suppression
    (30,   44, 0.60, "Very Weak CSL — Strong Suppression"),       # heavy suppression
    (0,    29, 0.40, "Severely Weak CSL — Near Denial"),          # near-denial
]

# Stress amplification: when CSL chain contains stress house lords,
# the stress score is amplified (because SL itself stresses the cusp).
# Applied only to the PRIMARY cusp's stress score.
CSL_STRESS_AMPLIFY_FACTOR = 1.35   # 35% amplification when SL signifies stress houses


def _resolve_csl_propagation_multiplier(cusp_sl, strength_report):
    """
    Computes the CSL propagation multiplier for a single cusp's Sub Lord.

    Returns (multiplier: float, label: str, sl_strength: int)

    This multiplier is applied multiplicatively to the cusp's computed
    manifestation_index BEFORE it enters the aggregate or blend.

    KP principle: weak SL = event denied even if planets are strong.
    """
    if not cusp_sl or cusp_sl not in strength_report:
        return 1.0, "CSL not found — neutral", 100

    sl_strength = strength_report[cusp_sl].get("effective_strength", 100)

    for lo, hi, mult, label in CSL_STRENGTH_TIERS:
        if lo <= sl_strength <= hi:
            return mult, label, sl_strength

    return 1.0, "CSL strength unclassified — neutral", sl_strength


def _compute_csl_stress_amplification(cusp_sl, effective_significators, stress_houses):
    """
    Checks whether the CSL (SL of cusp) itself signifies stress houses.
    If yes, returns an amplification factor for the cusp's stress score.

    This models the KP reality that a stressed SL makes the cusp
    actively hostile to the topic — not just passive weakness.

    Returns (amplify: bool, factor: float, reason: str)
    """
    if not cusp_sl or cusp_sl not in effective_significators:
        return False, 1.0, "CSL not in effective significators"

    sl_sig = effective_significators[cusp_sl]
    sl_stress_houses = set()

    for level in ["L1", "L2", "L3", "L4"]:
        for h in sl_sig.get(level, []):
            if h in stress_houses:
                sl_stress_houses.add(h)

    if sl_stress_houses:
        return (
            True,
            CSL_STRESS_AMPLIFY_FACTOR,
            f"CSL ({cusp_sl}) signifies stress H{sorted(sl_stress_houses)} → stress amplified ×{CSL_STRESS_AMPLIFY_FACTOR}"
        )

    return False, 1.0, f"CSL ({cusp_sl}) does not signify stress houses — no amplification"


def _compute_cusp_gate_multiplier(primary_cusp_mi, topic):
    """
    Cusp-to-Planet Attenuation Gate.

    When the primary cusp's manifestation_index is weak, it acts as a gate
    that attenuates the planetary promise before blending.

    This ensures: strong planets + weak primary cusp = reduced final output.

    Returns (gate_multiplier: float, gate_label: str)

    Gate is computed from PRIMARY cusp MI only — secondary cusps do not gate.
    """
    if primary_cusp_mi >= 0.60:
        return 1.0,  "Cusp Gate: Open — full planetary promise passes ✅"
    elif primary_cusp_mi >= 0.40:
        return 0.85, "Cusp Gate: Partial — moderate planetary attenuation ⚠️"
    elif primary_cusp_mi >= 0.25:
        return 0.65, "Cusp Gate: Restricted — significant planetary attenuation 🔴"
    elif primary_cusp_mi >= 0.10:
        return 0.45, "Cusp Gate: Near-Closed — heavy planetary attenuation ❌"
    else:
        return 0.25, "Cusp Gate: Closed — planetary promise heavily suppressed 🚫"




# ─────────────────────────────────────────────────────────
# SECTION 1: SINGLE CUSP SIGNIFICATOR EXTRACTOR
# ─────────────────────────────────────────────────────────

def extract_cusp_significators(cusp_data, effective_significators):
    """
    Extracts the effective significator chain for a single cusp.

    A cusp has:  SignLord → NL (Star Lord) → SL (Sub Lord) → SSL

    Each lord is looked up in effective_significators to inherit
    their L1-L4 house significations + strength multiplier.
    Lord priority weight is combined with planet strength multiplier.
    """
    lords_priority = [
        ("SL",       4.0),   # Sub Lord — most decisive
        ("NL",       3.0),   # Star Lord — event nature
        ("SignLord", 2.0),   # Sign Lord — background context
        ("SSL",      1.0),   # SSL — fine detail
    ]

    cusp_lords = {}
    for key, base_weight in lords_priority:
        lord = cusp_data.get(key)
        if not lord:
            continue
        if lord not in effective_significators:
            continue
        if lord in cusp_lords:
            continue   # already registered at higher priority
        cusp_lords[lord] = {
            "role":        key,
            "base_weight": base_weight,
            "sig_data":    effective_significators[lord],
        }

    return cusp_lords


# ─────────────────────────────────────────────────────────
# SECTION 2: SINGLE CUSP RESONANCE SCORER  ← REFINED v2.0
# ─────────────────────────────────────────────────────────

def compute_cusp_resonance(
    cusp_number,
    cusp_data,
    effective_significators,
    strength_report,
    topic=None,
    dba_planets=None,
    target_houses=None,
    stress_houses=None,
    house_weights=None,
    is_primary=False,       # NEW v2.0 — primary cusp gets stress amplification
):
    """
    v2.0 — Evaluates the resonance of a single cusp with full CSL propagation.

    Pipeline:
      1. Extract cusp lord chain (SL → NL → SignLord → SSL)
      2. Score promise + stress via _score_house_set() (same as planets)
      3. Apply CSL propagation multiplier to MI
             → weak SL multiplicatively suppresses manifestation
      4. Apply cuspal stress amplification (primary cusp only)
             → SL signifying stress houses amplifies stress score
      5. Recompute final MI after propagation + amplification
      6. Expose all intermediate values in logic_trace

    KP principle: strong planets + weak CSL = event denied.
    """
    if dba_planets is None:
        dba_planets = []

    if stress_houses is not None:
        resolved_stress = set(stress_houses)
        stress_nuance = "Manually overridden"
    else:
        resolved_stress, stress_nuance = get_stress_houses_for_topic(topic)

    if target_houses is None:
        target_houses = [cusp_number]

    level_weights = {**DEFAULT_LEVEL_WEIGHTS, **(house_weights or {})}

    dba_boost = {}
    for i, p in enumerate((dba_planets or [])[:3]):
        dba_boost[p] = [1.25, 1.15, 1.05][i]

    # ── Extract lord chain ────────────────────────────────
    cusp_lords = extract_cusp_significators(cusp_data, effective_significators)
    if not cusp_lords:
        return _empty_cusp_result(cusp_number, "No cusp lords found in effective significators")

    cusp_sl = cusp_data.get("SL")

    # ── Build synthetic effective sigs for this cusp ──────
    cusp_effective = {}
    logic_parts    = []

    for lord, info in cusp_lords.items():
        role        = info["role"]
        base_weight = info["base_weight"]
        sig_data    = info["sig_data"]
        planet_mult = sig_data.get("multiplier", 1.0)

        # role_norm: SL→1.0, NL→0.75, SignLord→0.50, SSL→0.25
        role_norm = base_weight / 4.0
        combined  = round(role_norm * planet_mult, 3)

        cusp_effective[f"{lord}_as_{role}"] = {
            "L1": sig_data.get("L1", []),
            "L2": sig_data.get("L2", []),
            "L3": sig_data.get("L3", []),
            "L4": sig_data.get("L4", []),
            "multiplier":  combined,
            "logic_trace": f"[H{cusp_number} {role}: {lord}] {sig_data.get('logic_trace', '')}",
        }

        planet_strength = strength_report.get(lord, {}).get("effective_strength", 100)
        logic_parts.append(
            f"{role}={lord} (str={planet_strength}, role_norm={role_norm:.2f}, mult={combined})"
        )

    # ── Raw promise + stress scoring ──────────────────────
    raw_promise, promise_breakdown = _score_house_set(
        target_houses           = set(target_houses),
        effective_significators = cusp_effective,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "promise",
    )

    raw_stress, stress_breakdown = _score_house_set(
        target_houses           = resolved_stress,
        effective_significators = cusp_effective,
        dba_boost               = dba_boost,
        level_weights           = level_weights,
        score_label             = "stress",
    )

    # ── v2.0: CSL Stress Amplification ───────────────────
    # Applied before propagation so propagation works on already-amplified stress.
    stress_amplified = False
    stress_amp_factor = 1.0
    stress_amp_reason = "No stress amplification"

    if is_primary:
        stress_amplified, stress_amp_factor, stress_amp_reason = _compute_csl_stress_amplification(
            cusp_sl, effective_significators, resolved_stress
        )

    effective_stress = round(raw_stress * stress_amp_factor, 3)

    # ── v2.0: CSL Propagation Multiplier ─────────────────
    # Weak SL multiplicatively suppresses the cusp's manifestation.
    # Applied to MI after scoring — does NOT change raw scores
    # (raw scores preserved for aggregate weighting accuracy).
    csl_mult, csl_label, sl_strength = _resolve_csl_propagation_multiplier(
        cusp_sl, strength_report
    )
    logic_parts.append(f"CSL propagation: SL={cusp_sl} str={sl_strength} → ×{csl_mult} [{csl_label}]")
    if stress_amplified:
        logic_parts.append(f"Stress amplification: {stress_amp_reason}")

    # ── Raw MI (pre-propagation) ──────────────────────────
    raw_mf = _compute_manifestation_index(raw_promise, effective_stress)

    # ── Propagated MI (post-CSL attenuation) ─────────────
    propagated_mi = round(raw_mf["manifestation_index"] * csl_mult, 4)
    propagated_mi = max(0.0, min(1.0, propagated_mi))

    # Propagation stress index: if CSL very weak, stress_index is raised
    propagated_stress_index = round(
        raw_mf["stress_index"] + (1.0 - csl_mult) * 0.30, 4
    )
    propagated_stress_index = min(1.0, propagated_stress_index)

    # ── Final verdict using propagated MI ────────────────
    if propagated_mi >= 0.65:
        cusp_verdict = f"Strong Cuspal Support — H{cusp_number} favours event ✅"
    elif propagated_mi >= 0.40:
        cusp_verdict = f"Moderate Cuspal Resonance — H{cusp_number} mixed ⚠️"
    elif propagated_mi >= 0.20:
        if propagated_stress_index > 0.5:
            cusp_verdict = f"Delayed Fulfilment — H{cusp_number} CSL stress dominant 🕐"
        else:
            cusp_verdict = f"Weak Cuspal Support — H{cusp_number} 🔍"
    else:
        cusp_verdict = f"Cuspal Denial — H{cusp_number} CSL weak/hostile ❌"

    supportive = [r["planet"] for r in promise_breakdown if r.get("promise_score", 0) > 0]
    stressful  = [r["planet"] for r in stress_breakdown  if r.get("stress_score",  0) > 0]

    return {
        "cusp_number":              cusp_number,
        "is_primary":               is_primary,
        # Raw scores (preserved for weighting)
        "cusp_promise":             raw_promise,
        "cusp_stress":              raw_stress,
        "cusp_stress_amplified":    round(effective_stress, 3),
        "cusp_net":                 round(raw_promise - effective_stress, 3),
        # Pre-propagation indices
        "cusp_promise_index":       raw_mf["promise_index"],
        "cusp_stress_index_raw":    raw_mf["stress_index"],
        # CSL propagation
        "csl_strength":             sl_strength,
        "csl_propagation_mult":     csl_mult,
        "csl_propagation_label":    csl_label,
        "stress_amp_factor":        stress_amp_factor,
        "stress_amp_reason":        stress_amp_reason,
        # Post-propagation (what actually matters)
        "cusp_manifestation_index": propagated_mi,
        "cusp_stress_index":        propagated_stress_index,
        "cusp_verdict":             cusp_verdict,
        "cusp_stress_label":        raw_mf["stress_label"],
        "cusp_manifestation_label": raw_mf["manifestation_label"],
        # Breakdowns
        "promise_breakdown":        promise_breakdown,
        "stress_breakdown":         stress_breakdown,
        "supportive_lords":         supportive,
        "stressful_lords":          stressful,
        "cusp_logic_trace": (
            " | ".join(logic_parts)
            + f" | Stress nuance: {stress_nuance}"
        ),
        "topic": topic or "generic",
    }


def _empty_cusp_result(cusp_number, reason):
    return {
        "cusp_number":              cusp_number,
        "is_primary":               False,
        "cusp_promise":             0.0,
        "cusp_stress":              0.0,
        "cusp_stress_amplified":    0.0,
        "cusp_net":                 0.0,
        "cusp_promise_index":       0.0,
        "cusp_stress_index_raw":    0.0,
        "csl_strength":             0,
        "csl_propagation_mult":     0.0,
        "csl_propagation_label":    "N/A",
        "stress_amp_factor":        1.0,
        "stress_amp_reason":        "N/A",
        "cusp_manifestation_index": 0.0,
        "cusp_stress_index":        0.0,
        "cusp_verdict":             f"Cusp {cusp_number} — Data Unavailable ⚠️",
        "cusp_stress_label":        "N/A",
        "cusp_manifestation_label": "N/A",
        "promise_breakdown":        [],
        "stress_breakdown":         [],
        "supportive_lords":         [],
        "stressful_lords":          [],
        "cusp_logic_trace":         reason,
        "topic":                    "generic",
    }


# ─────────────────────────────────────────────────────────
# SECTION 3: MULTI-CUSP TOPIC EVALUATOR  ← REFINED v2.0
# ─────────────────────────────────────────────────────────

def compute_topic_cuspal_resonance(
    topic,
    all_cusp_data,
    effective_significators,
    strength_report,
    dba_planets=None,
    target_houses=None,
    stress_houses=None,
    house_weights=None,
):
    """
    v2.0 — Evaluates ALL relevant cusps with recursive cusp weakening.

    New in v2.0:
      - Primary cusp evaluated first with is_primary=True (stress amplification active)
      - Primary cusp MI is used to compute cusp_gate_multiplier
      - Secondary cusps' MI are attenuated by the gate if primary is weak
        (recursive cusp weakening: weak primary cascades into secondaries)
      - Aggregate uses propagated MIs, not raw scores, for cascade accuracy

    Primary cusp (e.g. 7th for marriage) weighted 65%.
    Secondary cusps (e.g. 2nd, 11th) share remaining 35%.
    """
    topic_lower     = topic.lower() if topic else "generic"
    cusp_cfg        = KP_TOPIC_CUSP_MAP.get(topic_lower, {"primary": [], "secondary": []})
    primary_cusps   = cusp_cfg.get("primary", [])
    secondary_cusps = cusp_cfg.get("secondary", [])
    all_relevant    = primary_cusps + secondary_cusps

    if not all_relevant:
        return {
            "topic":                              topic,
            "aggregate_cusp_promise":             0.0,
            "aggregate_cusp_stress":              0.0,
            "aggregate_cusp_net":                 0.0,
            "aggregate_cusp_promise_index":       0.0,
            "aggregate_cusp_stress_index":        0.0,
            "aggregate_cusp_manifestation_index": 0.0,
            "aggregate_cusp_verdict":             "No cusp config for topic",
            "aggregate_cusp_stress_label":        "N/A",
            "aggregate_cusp_manifestation_label": "N/A",
            "individual_cusp_results":            {},
            "cusp_weight_map":                    {},
            "cusp_gate_multiplier":               1.0,
            "cusp_gate_label":                    "N/A",
        }

    # Per-cusp weight map
    n_secondary = max(len(secondary_cusps), 1)
    cusp_weight_map = {}
    for c in primary_cusps:
        cusp_weight_map[c] = CUSP_PRIMARY_WEIGHT
    for c in secondary_cusps:
        cusp_weight_map[c] = round(CUSP_SECONDARY_WEIGHT / n_secondary, 4)

    individual_results = {}

    # ── Step 1: Evaluate PRIMARY cusps first ─────────────
    primary_mi_avg = 0.0
    n_primary_computed = 0

    for cusp_num in primary_cusps:
        cusp_data = all_cusp_data.get(cusp_num)
        if not cusp_data:
            individual_results[cusp_num] = _empty_cusp_result(
                cusp_num, f"No cusp_data for cusp {cusp_num}"
            )
            continue

        result = compute_cusp_resonance(
            cusp_number             = cusp_num,
            cusp_data               = cusp_data,
            effective_significators = effective_significators,
            strength_report         = strength_report,
            topic                   = topic,
            dba_planets             = dba_planets,
            target_houses           = target_houses,
            stress_houses           = stress_houses,
            house_weights           = house_weights,
            is_primary              = True,     # stress amplification ON
        )
        individual_results[cusp_num] = result
        primary_mi_avg += result["cusp_manifestation_index"]
        n_primary_computed += 1

    # Compute cusp gate from primary cusp MI
    if n_primary_computed > 0:
        primary_mi_avg /= n_primary_computed
    else:
        primary_mi_avg = 0.5   # neutral if no primary data

    cusp_gate_mult, cusp_gate_label = _compute_cusp_gate_multiplier(primary_mi_avg, topic)

    # ── Step 2: Evaluate SECONDARY cusps with gate applied ─
    for cusp_num in secondary_cusps:
        cusp_data = all_cusp_data.get(cusp_num)
        if not cusp_data:
            individual_results[cusp_num] = _empty_cusp_result(
                cusp_num, f"No cusp_data for cusp {cusp_num}"
            )
            continue

        result = compute_cusp_resonance(
            cusp_number             = cusp_num,
            cusp_data               = cusp_data,
            effective_significators = effective_significators,
            strength_report         = strength_report,
            topic                   = topic,
            dba_planets             = dba_planets,
            target_houses           = target_houses,
            stress_houses           = stress_houses,
            house_weights           = house_weights,
            is_primary              = False,    # stress amplification OFF for secondary
        )

        # Recursive cusp weakening: attenuate secondary MI by primary gate
        original_mi = result["cusp_manifestation_index"]
        attenuated_mi = round(original_mi * cusp_gate_mult, 4)
        result["cusp_manifestation_index"] = attenuated_mi
        result["cusp_logic_trace"] += (
            f" | [Gate ×{cusp_gate_mult} from primary — {cusp_gate_label}]"
            f" original_MI={original_mi}→attenuated={attenuated_mi}"
        )
        individual_results[cusp_num] = result

    # ── Step 3: Aggregate using propagated MIs ────────────
    # Weighted aggregate of cusp_manifestation_index (post-propagation)
    # rather than raw promise/stress, because propagation already applied.
    agg_promise  = 0.0
    agg_stress   = 0.0
    agg_mi_sum   = 0.0
    weight_total = 0.0

    for cusp_num in all_relevant:
        r = individual_results.get(cusp_num)
        if not r:
            continue
        w = cusp_weight_map.get(cusp_num, 0.0)
        agg_promise  += r["cusp_promise"] * w
        agg_stress   += r["cusp_stress_amplified"] * w
        agg_mi_sum   += r["cusp_manifestation_index"] * w
        weight_total += w

    agg_promise = round(agg_promise, 3)
    agg_stress  = round(agg_stress, 3)
    agg_mi      = round(agg_mi_sum, 4) if weight_total > 0 else 0.0

    # Recompute agg MI from aggregated scores for consistency
    agg_mf = _compute_manifestation_index(agg_promise, agg_stress)

    # Final MI: blend weighted MI sum with agg_mf MI (50/50 to avoid drift)
    final_agg_mi = round((agg_mi + agg_mf["manifestation_index"]) / 2.0, 4)

    # Aggregate verdict
    if final_agg_mi >= 0.65:
        agg_verdict = f"Strong Cuspal Resonance for {topic.title()} 🔥"
    elif final_agg_mi >= 0.40:
        agg_verdict = f"Moderate Cuspal Support for {topic.title()} ⚠️"
    elif final_agg_mi >= 0.20:
        agg_verdict = f"Delayed Fulfilment Possible — {topic.title()} Stressed 🕐"
    else:
        agg_verdict = f"Weak Cuspal Support — {topic.title()} Unlikely ❌"

    return {
        "topic":                              topic,
        "aggregate_cusp_promise":             agg_promise,
        "aggregate_cusp_stress":              agg_stress,
        "aggregate_cusp_net":                 round(agg_promise - agg_stress, 3),
        "aggregate_cusp_promise_index":       agg_mf["promise_index"],
        "aggregate_cusp_stress_index":        agg_mf["stress_index"],
        "aggregate_cusp_manifestation_index": final_agg_mi,
        "aggregate_cusp_verdict":             agg_verdict,
        "aggregate_cusp_stress_label":        agg_mf["stress_label"],
        "aggregate_cusp_manifestation_label": agg_mf["manifestation_label"],
        "individual_cusp_results":            individual_results,
        "cusp_weight_map":                    cusp_weight_map,
        # NEW v2.0 — gate exposure for combine() and debugging
        "primary_cusp_mi_avg":                round(primary_mi_avg, 4),
        "cusp_gate_multiplier":               cusp_gate_mult,
        "cusp_gate_label":                    cusp_gate_label,
    }


# ─────────────────────────────────────────────────────────
# SECTION 4: FINAL BLENDED RESONANCE
# Combines planetary score (kp_strength_engine) with cuspal score
# ─────────────────────────────────────────────────────────

PLANETARY_BLEND_WEIGHT = 0.60   # default fallback
CUSPAL_BLEND_WEIGHT    = 0.40   # default fallback

# ─────────────────────────────────────────────────────────
# Dynamic topic-aware blend weights
# KP reality: marriage/spirituality → cusp dominates
#             career/finance        → planetary cycles dominate
# ─────────────────────────────────────────────────────────
KP_TOPIC_BLEND = {
    "marriage":     {"planetary": 0.45, "cuspal": 0.55},   # 7th CSL decisive
    "career":       {"planetary": 0.65, "cuspal": 0.35},   # Saturn/Mercury cycles dominate
    "property":     {"planetary": 0.50, "cuspal": 0.50},   # balanced
    "finance":      {"planetary": 0.60, "cuspal": 0.40},   # planetary cycles important
    "health":       {"planetary": 0.55, "cuspal": 0.45},   # 1st/6th CSL matters
    "children":     {"planetary": 0.50, "cuspal": 0.50},   # 5th CSL critical
    "travel":       {"planetary": 0.60, "cuspal": 0.40},
    "education":    {"planetary": 0.55, "cuspal": 0.45},
    "spirituality": {"planetary": 0.40, "cuspal": 0.60},   # 9th/12th CSL dominant
}


def get_blend_weights_for_topic(topic=None, override_planetary=None, override_cuspal=None):
    """
    Returns (planetary_weight, cuspal_weight) for the topic.
    Manual overrides take priority. Falls back to default 60/40.
    """
    if override_planetary is not None and override_cuspal is not None:
        total = override_planetary + override_cuspal
        return override_planetary / total, override_cuspal / total

    if topic and topic.lower() in KP_TOPIC_BLEND:
        cfg = KP_TOPIC_BLEND[topic.lower()]
        return cfg["planetary"], cfg["cuspal"]

    return PLANETARY_BLEND_WEIGHT, CUSPAL_BLEND_WEIGHT


def combine_planetary_cuspal_resonance(
    planetary_prediction,
    cuspal_resonance,
    topic=None,
    planetary_weight=None,
    cuspal_weight=None,
):
    """
    v2.0 — Dynamic topic-aware blending WITH cusp-to-planet attenuation gate.

    New in v2.0:
      - cusp_gate_multiplier (from cuspal_resonance) attenuates the
        PLANETARY promise BEFORE blending.
      - This implements: strong planets + weak primary CSL = reduced final output.
      - Gate is applied to planetary_promise only (not stress), because
        a weak cusp suppresses event delivery, not conflict.

    Blend weights resolved by priority:
      1. Explicit override
      2. Topic-specific config (KP_TOPIC_BLEND)
      3. Default 60/40 fallback
    """
    pw, cw = get_blend_weights_for_topic(topic, planetary_weight, cuspal_weight)

    # ── Cusp-to-Planet Attenuation ────────────────────────
    cusp_gate_mult  = cuspal_resonance.get("cusp_gate_multiplier", 1.0)
    cusp_gate_label = cuspal_resonance.get("cusp_gate_label", "Gate not available")

    raw_planetary_promise = planetary_prediction.get("promise_score", 0)
    gated_planetary_promise = round(raw_planetary_promise * cusp_gate_mult, 3)

    # Planetary stress unchanged — gate suppresses delivery, not conflict
    planetary_stress = planetary_prediction.get("stress_score", 0)

    final_promise = round(
        gated_planetary_promise * pw
        + cuspal_resonance.get("aggregate_cusp_promise", 0) * cw,
        3,
    )
    final_stress = round(
        planetary_stress * pw
        + cuspal_resonance.get("aggregate_cusp_stress", 0) * cw,
        3,
    )

    final_mf = _compute_manifestation_index(final_promise, final_stress)
    mi = final_mf["manifestation_index"]

    if mi >= 0.65:
        final_verdict = "High Resonance Window — Strong Manifestation Likely 🔥"
    elif mi >= 0.40:
        final_verdict = "Moderate Resonance — Conditional Manifestation ⚠️"
    elif mi >= 0.20:
        if final_mf["stress_index"] > 0.5:
            final_verdict = "Delayed Manifestation — Stress Dominant 🕐"
        else:
            final_verdict = "Low Resonance — Weak Promise 🔍"
    else:
        final_verdict = "Very Low Resonance — Likely Non-Event 🔕"

    blend_source = (
        "topic-dynamic" if (topic and topic.lower() in KP_TOPIC_BLEND)
        else "default-fallback"
    )

    blend_trace = (
        f"[Blend: {blend_source} — planetary={pw:.0%} (gated), cuspal={cw:.0%}] "
        f"Planetary raw_promise={raw_planetary_promise} "
        f"→ gate×{cusp_gate_mult}={gated_planetary_promise} | "
        f"Gate: {cusp_gate_label} | "
        f"Planetary stress={planetary_stress} | "
        f"Cuspal promise={cuspal_resonance.get('aggregate_cusp_promise')} "
        f"stress={cuspal_resonance.get('aggregate_cusp_stress')}"
    )

    return {
        "final_promise":             final_promise,
        "final_stress":              final_stress,
        "final_net":                 round(final_promise - final_stress, 3),
        "final_promise_index":       final_mf["promise_index"],
        "final_stress_index":        final_mf["stress_index"],
        "final_manifestation_index": mi,
        "final_verdict":             final_verdict,
        "final_stress_label":        final_mf["stress_label"],
        "final_manifestation_label": final_mf["manifestation_label"],
        # Gate exposure for explainability
        "cusp_gate_multiplier":      cusp_gate_mult,
        "cusp_gate_label":           cusp_gate_label,
        "gated_planetary_promise":   gated_planetary_promise,
        "raw_planetary_promise":     raw_planetary_promise,
        "blend_weights":             {"planetary": pw, "cuspal": cw, "source": blend_source},
        "blend_trace":               blend_trace,
        "topic":                     topic or "generic",
    }


# ─────────────────────────────────────────────────────────
# SECTION 5: MASTER CUSPAL PIPELINE
# ─────────────────────────────────────────────────────────

def run_cuspal_pipeline(
    topic,
    all_cusp_data,
    effective_significators,
    strength_report,
    planetary_prediction,
    dba_planets=None,
    target_houses=None,
    stress_houses=None,
    house_weights=None,
    planetary_weight=PLANETARY_BLEND_WEIGHT,
    cuspal_weight=CUSPAL_BLEND_WEIGHT,
):
    """
    One-call master cuspal pipeline.

    Calls:
      1. compute_topic_cuspal_resonance()   → per-cusp + aggregate cuspal score
      2. combine_planetary_cuspal_resonance() → final blended score

    Parameters
    ----------
    topic              : str   — e.g. "marriage"
    all_cusp_data      : dict  — {cusp_number: {SignLord, NL, SL, SSL}}
    effective_significators : dict — from kp_strength_engine
    strength_report    : dict  — from kp_strength_engine
    planetary_prediction: dict — from kp_strength_engine.compute_prediction_score()
    dba_planets        : list
    target_houses      : list
    stress_houses      : set
    house_weights      : dict
    planetary_weight   : float — blend ratio (default 0.60)
    cuspal_weight      : float — blend ratio (default 0.40)

    Returns
    -------
    {
        cuspal_resonance  : output of compute_topic_cuspal_resonance(),
        final_resonance   : output of combine_planetary_cuspal_resonance(),
    }
    """
    cuspal_resonance = compute_topic_cuspal_resonance(
        topic                   = topic,
        all_cusp_data           = all_cusp_data,
        effective_significators = effective_significators,
        strength_report         = strength_report,
        dba_planets             = dba_planets,
        target_houses           = target_houses,
        stress_houses           = stress_houses,
        house_weights           = house_weights,
    )

    final_resonance = combine_planetary_cuspal_resonance(
        planetary_prediction = planetary_prediction,
        cuspal_resonance     = cuspal_resonance,
        topic                = topic,
        planetary_weight     = planetary_weight,
        cuspal_weight        = cuspal_weight,
    )

    return {
        "cuspal_resonance": cuspal_resonance,
        "final_resonance":  final_resonance,
    }


# ─────────────────────────────────────────────────────────
# USAGE EXAMPLE — v2.0
# ─────────────────────────────────────────────────────────
#
#   # Step 1: Run planetary pipeline (kp_strength_engine)
#   planetary_result = run_kp_prediction_pipeline(
#       astro_data        = my_astro_data,
#       raw_significators = my_raw_sigs,
#       target_houses     = [2, 7, 11],
#       dba_planets       = ["Ju", "Ve", "Mo"],
#       topic             = "marriage",
#   )
#
#   # Step 2: Run cuspal pipeline (this module)
#   cusp_result = run_cuspal_pipeline(
#       topic                   = "marriage",
#       all_cusp_data           = {
#           7:  {"SL": "Ve", "NL": "Mo", "SignLord": "Me", "SSL": "Su"},
#           2:  {"SL": "Ju", "NL": "Sa", "SignLord": "Mo", "SSL": "Ma"},
#           11: {"SL": "Ra", "NL": "Ve", "SignLord": "Su", "SSL": "Me"},
#       },
#       effective_significators = planetary_result["effective_significators"],
#       strength_report         = planetary_result["strength_report"],
#       planetary_prediction    = planetary_result["prediction"],
#       dba_planets             = ["Ju", "Ve", "Mo"],
#       target_houses           = [2, 7, 11],
#   )
#
#   final = cusp_result["final_resonance"]
#   print(final["final_verdict"])
#   print(f"Final MI: {final['final_manifestation_index']}")
#   print(f"Cusp Gate: {final['cusp_gate_label']} ×{final['cusp_gate_multiplier']}")
#   print(f"Planetary promise: {final['raw_planetary_promise']} → gated: {final['gated_planetary_promise']}")
#   print(f"Blend: {final['blend_trace']}")
#
#   # Per-cusp detail:
#   for cn, cr in cusp_result["cuspal_resonance"]["individual_cusp_results"].items():
#       print(f"\nCusp {cn} ({'PRIMARY' if cr['is_primary'] else 'secondary'}):")
#       print(f"  Verdict: {cr['cusp_verdict']}")
#       print(f"  MI: {cr['cusp_manifestation_index']}  (CSL ×{cr['csl_propagation_mult']} — {cr['csl_propagation_label']})")
#       print(f"  Stress amp: {cr['stress_amp_factor']}× — {cr['stress_amp_reason']}")
#       print(f"  Trace: {cr['cusp_logic_trace']}")
#
#   # Cuspal resonance aggregate:
#   cr = cusp_result["cuspal_resonance"]
#   print(f"\nPrimary cusp MI avg: {cr['primary_cusp_mi_avg']}")
#   print(f"Cusp gate: {cr['cusp_gate_label']} ×{cr['cusp_gate_multiplier']}")
#   print(f"Aggregate verdict: {cr['aggregate_cusp_verdict']}")
#
# ─────────────────────────────────────────────────────────