import sys
import os
import json
from datetime import datetime

# Path Fix
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from nadi_ai.core.dignity_engine import DignityEngine
from nadi_ai.core.dasha_engine import DashaEngine
from nadi_ai.core.nakshatra_engine import NakshatraEngine
from nadi_ai.core.tara_milan_engine import TaraMilanEngine
from nadi_ai.core.ashtakavarga_engine import AshtakavargaEngine
from nadi_ai.engine.aggregator import NadiAggregator
from nadi_ai.events.career_module import CareerModule

def get_amitabh_astro_data():
    """
    Amitabh Bachchan - Oct 11, 1942
    Lagna: Aquarius (10)
    Stellium in Virgo 8th House (Su, Ma, Me, Ve) -> Major struggles and ultimate transformation
    Jupiter Exalted in Cancer 6th House (3) -> Fights back enemies and debt
    Saturn in Taurus 4th House (1) -> Mass appeal
    """
    return {
        "La": {"Degree": 320.0, "Vargas": {"D1": {"Idx": 10}, "D9": {"Idx": 2}}}, 
        "Su": {"Degree": 175.0, "Vargas": {"D1": {"Idx": 5}, "D9": {"Idx": 1}}},  
        "Mo": {"Degree": 190.0, "Vargas": {"D1": {"Idx": 6}, "D9": {"Idx": 3}}},  
        "Ma": {"Degree": 170.0, "Vargas": {"D1": {"Idx": 5}, "D9": {"Idx": 11}}}, 
        "Me": {"Degree": 165.0, "Vargas": {"D1": {"Idx": 5}, "D9": {"Idx": 10}}}, 
        "Ju": {"Degree": 115.0, "Vargas": {"D1": {"Idx": 3}, "D9": {"Idx": 7}}, "IsRetrograde": False, "IsCombust": False}, 
        "Ve": {"Degree": 160.0, "Vargas": {"D1": {"Idx": 5}, "D9": {"Idx": 9}}, "IsRetrograde": False, "IsCombust": True}, 
        "Sa": {"Degree": 45.0,  "Vargas": {"D1": {"Idx": 1}, "D9": {"Idx": 5}}, "IsRetrograde": True, "IsCombust": False},  
        "Ra": {"Degree": 125.0, "Vargas": {"D1": {"Idx": 4}, "D9": {"Idx": 8}}},  
        "Ke": {"Degree": 305.0, "Vargas": {"D1": {"Idx": 10}, "D9": {"Idx": 2}}}  
    }

def get_amitabh_sav():
    """ Approximate SAV points to test exact age karmic triggers """
    return {
        "0": 25, "1": 30, "2": 28, "3": 35, "4": 22, "5": 31,
        "6": 29, "7": 24, "8": 27, "9": 33, "10": 26, "11": 27
    }

def run_amitabh_test():
    print("\n🎬 🚀 RUNNING REAL WORLD TEST: AMITABH BACHCHAN KUNDLI 🚀 🎬\n")

    astro_data = get_amitabh_astro_data()
    sav_bindus = get_amitabh_sav()
    dob = datetime(1942, 10, 11)

    # 1. Initialize Engines
    dignity_engine = DignityEngine()
    nakshatra_engine = NakshatraEngine(dignity_engine)
    dasha_engine = DashaEngine(moon_degree=astro_data["Mo"]["Degree"], dob=dob)
    ashtakavarga_engine = AshtakavargaEngine()

    # 2. Setup Modules
    modules = [CareerModule(astro_data, dob)]

    # 3. Create Aggregator
    aggregator = NadiAggregator(
        astro_data=astro_data, 
        dob_obj=dob, 
        modules=modules,
        dignity_engine=dignity_engine, 
        dasha_engine=dasha_engine, 
        nakshatra_engine=nakshatra_engine
    )

    # 4. Generate Karmic Triggers (Ashtakavarga)
    lagna_sign_idx = astro_data["La"]["Vargas"]["D1"]["Idx"]
    karmic_triggers = ashtakavarga_engine.generate_karmic_triggers(lagna_sign_idx, astro_data, sav_bindus)

    # 5. Run Pipeline
    result = aggregator.run(extra_signals=karmic_triggers)

    # 6. Display Output
    print(f"📊 Total Destiny Events Found: {result['total_events_detected']}\n")
    print("🏆 TOP IMPACT LIFE EVENTS (Destiny Turning Points):")
    
    for idx, event in enumerate(result['top_impact_events']):
        print(f"\n[{idx+1}] 🎯 Age Window: {event.get('center_year')} Years (Around Year {1942 + int(event.get('center_year'))})")
        print(f"    🌟 Resolved Theme: {event.get('resolved_theme')}")
        print(f"    📈 Life Impact Index: {event.get('life_impact_index')} / 100")
        print(f"    ⚖️ Net Score: {event.get('net_score')}")
        print(f"    🧩 Raw Signals Triggered: {[s.get('event_tag') for s in event.get('signals')]}")
        print("-" * 50)

if __name__ == "__main__":
    run_amitabh_test()