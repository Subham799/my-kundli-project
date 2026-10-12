from collections import defaultdict

class ConflictResolver:
    def resolve_cluster(self, cluster):
        signals = cluster["signals"]
        
        # Calculate Positives and Negatives
        total_positive = sum(s["final_score"] for s in signals if s["final_score"] > 0)
        total_negative = sum(s["final_score"] for s in signals if s["final_score"] < 0)
        net_score = total_positive + total_negative
        
        # Determine Dominant Domain
        domain_scores = {}
        for s in signals:
            d = s["domain"]
            domain_scores[d] = domain_scores.get(d, 0) + s["final_score"]
            
        # Sort domains by absolute magnitude
        sorted_domains = sorted(domain_scores.items(), key=lambda x: abs(x[1]), reverse=True)
        dominant_domain = sorted_domains[0][0] if sorted_domains else "general"

        # 👈 FIX B: Astrological Semantic Theme
        if net_score > 3.0:
            theme = f"Major Growth & Success in {dominant_domain.upper()}"
        elif net_score < -3.0:
            theme = f"Severe Crisis & Struggle in {dominant_domain.upper()}"
        elif total_positive > 0 and total_negative < 0:
            theme = f"Mixed Results: Success vs {dominant_domain.upper()} Challenges"
        elif net_score < 0:
            theme = f"Challenging phase focused on {dominant_domain.upper()}"
        else:
            theme = f"Normal phase focused on {dominant_domain.upper()}"

        # 👈 FIX C: Severity Index (Negative events hit harder)
        impact_multiplier = 1.3 if net_score < 0 else 1.0
        life_impact_index = abs(net_score) * impact_multiplier

        return {
            "center_year": round(cluster["center_year"], 2),
            "signals": signals,
            "net_score": round(net_score, 2),
            "resolved_theme": theme,
            "dominant_domain": dominant_domain,
            "life_impact_index": round(life_impact_index, 2)
        }