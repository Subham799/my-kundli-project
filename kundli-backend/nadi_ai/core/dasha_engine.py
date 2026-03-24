# nadi_ai/core/dasha_engine.py
# Clean version: Accepts pre-computed dashas (no moon_degree calculation)

from datetime import datetime, timedelta
from typing import List, Dict, Optional

DASHA_SEQUENCE = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"]

DASHA_YEARS = {
    "Ke": 7, "Ve": 20, "Su": 6, "Mo": 10,
    "Ma": 7, "Ra": 18, "Ju": 16, "Sa": 19, "Me": 17
}

class DashaEngine:
    def __init__(self, precomputed_timeline: List[Dict]):
        """
        precomputed_timeline: List from calculate_vimshottari()
        Expected format per entry:
            {
                "planet": str (or "lord"),    # e.g. "Ju" or "गुरु" — adjust if needed
                "start":  str,                # "DD-MM-YYYY"
                "end":    str,                # "DD-MM-YYYY"
                "idx":    int                 # optional, 0-8
            }
        """
        if not isinstance(precomputed_timeline, list) or not precomputed_timeline:
            raise ValueError("DashaEngine requires a non-empty list of precomputed dashas")

        self.timeline = self._normalize_and_validate(precomputed_timeline)

    def _normalize_and_validate(self, timeline: List[Dict]) -> List[Dict]:
        """
        Normalize keys (planet → lord if needed) and sort chronologically
        """
        normalized = []
        for entry in timeline:
            lord = entry.get("planet") or entry.get("lord")
            if not lord:
                raise ValueError("Each dasha entry must have 'planet' or 'lord' key")
            
            start_str = entry.get("start")
            end_str   = entry.get("end")
            if not start_str or not end_str:
                raise ValueError(f"Missing start/end in dasha: {entry}")
            
            # Optional: convert dates to datetime for easier comparison
            try:
                start_dt = datetime.strptime(start_str, "%d-%m-%Y")
                end_dt   = datetime.strptime(end_str,   "%d-%m-%Y")
            except ValueError:
                raise ValueError(f"Invalid date format in dasha: {entry}")
            
            normalized.append({
                "lord": lord,
                "start_str": start_str,
                "end_str": end_str,
                "start_dt": start_dt,
                "end_dt": end_dt,
                "idx": entry.get("idx")
            })
        
        # Sort by start date (safety)
        normalized.sort(key=lambda x: x["start_dt"])
        
        # Basic continuity check
        for i in range(1, len(normalized)):
            prev_end = normalized[i-1]["end_dt"]
            curr_start = normalized[i]["start_dt"]
            if prev_end != curr_start:
                print(f"Warning: Gap/overlap between dashas {i-1} and {i}")
        
        return normalized

    def get_current_mahadasha(self, target_date: Optional[datetime] = None) -> Optional[Dict]:
        if target_date is None:
            target_date = datetime.now()
        
        for d in self.timeline:
            if d["start_dt"] <= target_date < d["end_dt"]:
                return {
                    "lord": d["lord"],
                    "start": d["start_str"],
                    "end": d["end_str"],
                    "idx": d.get("idx")
                }
        return None

    def get_mahadasha_at_age(self, years_from_birth: float, birth_date: datetime) -> Optional[Dict]:
        target = birth_date + timedelta(days=years_from_birth * 365.2425)
        return self.get_current_mahadasha(target)

    def get_all_mahadashas(self) -> List[Dict]:
        return [
            {"lord": d["lord"], "start": d["start_str"], "end": d["end_str"]}
            for d in self.timeline
        ]

    # Add antardasha logic if needed in future
    # For now keeping minimal — you can expand later