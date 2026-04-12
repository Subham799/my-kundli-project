# transit_engine.py — v3 Final

import swisseph as swe
from datetime import datetime, timedelta

KETU_SENTINEL = "KETU_CALC"

PLANET_MAP = {
    "Su": swe.SUN,    "Mo": swe.MOON,    "Ma": swe.MARS,
    "Me": swe.MERCURY, "Ju": swe.JUPITER, "Ve": swe.VENUS,
    "Sa": swe.SATURN,  "Ra": swe.TRUE_NODE, "Ke": KETU_SENTINEL
}

PLANET_STEP = {
    "Su": 1, "Mo": 1, "Me": 1, "Ve": 1,
    "Ma": 2,
    "Ra": 3, "Ke": 3,
    "Ju": 5, "Sa": 5
}

HIGH_PRECISION = False


def _get_longitude(jd, planet_code, aya):
    """✅ Fix 1: aya बाहर से लो — per-planet swe call बंद"""
    if planet_code == KETU_SENTINEL:
        pos, _ = swe.calc_ut(jd, swe.TRUE_NODE)
        lon = (pos[0] + 180) % 360
    else:
        pos, _ = swe.calc_ut(jd, PLANET_MAP[planet_code])
        lon = pos[0]

    return (lon - aya) % 360


def _check_all_conditions(jd, conditions, aya):
    """✅ Fix 1: aya एक बार calculate, सबको pass"""
    for cond in conditions:
        planet_code = cond.get('planet')
        target_sign = int(cond.get('sign', 0))

        if planet_code not in PLANET_MAP or not (1 <= target_sign <= 12):
            return False

        sid_lon = _get_longitude(jd, planet_code, aya)
        current_sign = int(sid_lon / 30) + 1

        if current_sign != target_sign:
            return False

    return True


def search_transit_periods(start_date_str, end_date_str, conditions):
    try:
        # ✅ Fix 2: empty conditions guard
        if not conditions:
            return []

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date   = datetime.strptime(end_date_str,   "%Y-%m-%d")

        if start_date >= end_date:
            return []

        swe.set_sid_mode(swe.SIDM_LAHIRI)

        step = min(PLANET_STEP.get(c['planet'], 1) for c in conditions)

        results      = []
        current      = start_date
        in_period    = False
        period_start = None

        while current <= end_date:
            jd  = swe.julday(current.year, current.month, current.day, 12.0)
            aya = swe.get_ayanamsa_ut(jd)  # ✅ Fix 1: सिर्फ एक बार per day

            matched = _check_all_conditions(jd, conditions, aya)

            if matched and not in_period:
                in_period    = True
                period_start = current          # honest start — no fake backtrack

            elif not matched and in_period:
                in_period = False
                results.append({
                    "start": period_start.strftime("%d %b %Y"),
                    "end":   (current - timedelta(days=1)).strftime("%d %b %Y")
                })

            current += timedelta(days=step)

        if in_period:
            results.append({
                "start": period_start.strftime("%d %b %Y"),
                "end":   end_date.strftime("%d %b %Y")
            })

        return results

    except Exception as e:
        print(f"Transit Engine Error: {e}")
        return []