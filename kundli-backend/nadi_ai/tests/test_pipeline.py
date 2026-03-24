import sys
import os
import json
from datetime import datetime

# Path Fix: Project Root ko sys.path mein add karna
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

def build_dummy_astro_data():
    return {
        
        "La": {"Degree": 10.0, "Vargas": {"D1": {"Idx": 0}, "D9": {"Idx": 0}}},
        "Sa": {"Degree": 210.0, "Vargas": {"D1": {"Idx": 7}, "D9": {"Idx": 9}}, "IsRetrograde": False, "IsCombust": False},
        "Ma": {"Degree": 180.0, "Vargas": {"D1": {"Idx": 6}, "D9": {"Idx": 2}}, "IsRetrograde": False, "IsCombust": False},
        "Ra": {"Degree": 95.0, "Vargas": {"D1": {"Idx": 3}, "D9": {"Idx": 5}}},
        "Ke": {"Degree": 275.0, "Vargas": {"D1": {"Idx": 9}, "D9": {"Idx": 11}}},
        "Ju": {"Degree": 250.0, "Vargas": {"D1": {"Idx": 8}, "D9": {"Idx": 11}}, "IsRetrograde": False, "IsCombust": False},
        "Ve": {"Degree": 280.0, "Vargas": {"D1": {"Idx": 9}, "D9": {"Idx": 6}}, "IsRetrograde": False, "IsCombust": False},
        "Su": {"Degree": 120.0, "Vargas": {"D1": {"Idx": 4}, "D9": {"Idx": 1}}},
        "Mo": {"Degree": 33.0, "Vargas": {"D1": {"Idx": 1}, "D9": {"Idx": 4}}},
        "Me": {"Degree": 140.0, "Vargas": {"D1": {"Idx": 4}, "D9": {"Idx": 8}}}
    }

def build_dummy_sav():
    return {
        "0": 28, "1": 30, "2": 25, "3": 33, "4": 22, "5": 29, 
        "6": 31, "7": 24, "8": 27, "9": 35, "10": 26, "11": 27
    }

def run_full_pipeline():
    print("\n🚀 Running Full Nadi AI Backend Test...\n")

    astro_data = build_dummy_astro_data()
    sav_bindus = build_dummy_sav()
    dob = datetime(1990, 1, 1)

    # 1. Initialize Engines
    dignity_engine = DignityEngine()
    nakshatra_engine = NakshatraEngine(dignity_engine)
    dasha_engine = DashaEngine(moon_degree=astro_data["Mo"]["Degree"], dob=dob)
    ashtakavarga_engine = AshtakavargaEngine()
    tara_milan_engine = TaraMilanEngine()

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

    # 5. Run Pipeline (Injecting Ashtakavarga Triggers directly into Aggregator)
    result = aggregator.run(extra_signals=karmic_triggers)

    # 6. Display Output
    print("===== FINAL JSON OUTPUT =====\n")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    try:
        run_full_pipeline()
    except Exception as e:
        print("❌ ERROR during pipeline test:")
        print(str(e))