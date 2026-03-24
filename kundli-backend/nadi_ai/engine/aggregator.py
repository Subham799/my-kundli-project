from nadi_ai.engine.weight_engine import WeightEngine
from nadi_ai.engine.conflict_resolver import ConflictResolver
from nadi_ai.core.bhav_chalit_engine import BhavChalitEngine
from nadi_ai.core.dynamic_house_lord_engine import DynamicHouseLordEngine
from nadi_ai.core.gochar_engine import GocharEngine  # 👈 NEW IMPORT

CLUSTER_ORB_YEARS = 1.0


class NadiAggregator:

    def __init__(self, astro_data, dob_obj, modules,
                 dignity_engine, dasha_engine, nakshatra_engine):

        self.astro_data = astro_data
        self.dob_obj = dob_obj
        self.modules = modules

        # 🚀 NEW: Injecting Dynamic House Lord Engine & Gochar Engine
        self.house_lord_engine = DynamicHouseLordEngine(
            dignity_engine=dignity_engine,
            nakshatra_engine=nakshatra_engine
        )

        self.gochar_engine = GocharEngine(house_lord_engine=self.house_lord_engine)

        self.weight_engine = WeightEngine(
            dignity_engine,
            dasha_engine,
            nakshatra_engine,
            astro_data,
            dob_obj
        )

        self.conflict_resolver = ConflictResolver()

    # ======================================================
    # MAIN PIPELINE
    # ======================================================

    def run(self, extra_signals=None):

        raw_signals = []

        # 1️⃣ Collect signals
        for module in self.modules:
            raw_signals.extend(module.generate_signals())

        # Inject extra karmic signals (Ashtakavarga etc)
        if extra_signals:
            raw_signals.extend(extra_signals)

        # 2️⃣ Apply WeightEngine
        evaluated_signals = [
            self.weight_engine.evaluate_signal(s)
            for s in raw_signals
        ]

        # 3️⃣ Cluster
        clusters = self._cluster_signals(evaluated_signals)

        # 4️⃣ Resolve conflicts
        resolved_clusters = []

        for cluster in clusters:
            resolved = self.conflict_resolver.resolve_cluster(cluster)

            impact_index = abs(resolved.get("net_score", 0))

            if "DESTINY TURNING POINT" in resolved.get("resolved_theme", ""):
                impact_index += 10

            resolved["life_impact_index"] = round(impact_index, 2)
            resolved_clusters.append(resolved)

        timeline_map = sorted(resolved_clusters, key=lambda c: c["center_year"])
        ranked_events = sorted(resolved_clusters,
                               key=lambda c: c["life_impact_index"],
                               reverse=True)

        # ======================================================
        # 📐 Bhav Madhya Report (No scoring impact)
        # ======================================================

        lagna_deg = self.astro_data["La"]["Degree"]
        bhav_engine = BhavChalitEngine(lagna_deg)

        bhav_report = {}

        for planet, pdata in self.astro_data.items():
            if isinstance(pdata, dict) and "Degree" in pdata:
                bhav_report[planet] = bhav_engine.evaluate_planet(
                    pdata["Degree"]
                )

        # ======================================================

        return {
            "total_events_detected": len(resolved_clusters),
            "timeline_map": timeline_map,
            "top_impact_events": ranked_events[:5],
            "bhav_chalit_report": bhav_report  # 👈 Only reporting
        }

    # ======================================================
    # CLUSTER LOGIC
    # ======================================================

    def _cluster_signals(self, signals):

        clusters = []

        for signal in signals:
            placed = False

            for cluster in clusters:
                if abs(cluster["center_year"] - signal["year"]) <= CLUSTER_ORB_YEARS:
                    cluster["signals"].append(signal)
                    cluster["total_score"] += signal["final_score"]
                    placed = True
                    break

            if not placed:
                clusters.append({
                    "center_year": signal["year"],
                    "signals": [signal],
                    "total_score": signal["final_score"]
                })

        return clusters