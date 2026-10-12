class BaseEventModule:
    """
    Blueprint for all Event Modules (Career, Marriage, Health etc.)
    It standardizes how raw signals are generated before sending them to the Aggregator.
    """
    def __init__(self, astro_data, dob_obj):
        self.astro_data = astro_data
        self.dob_obj = dob_obj
        self.raw_signals = []

    def generate_signals(self):
        """ हर मॉड्यूल अपना-अपना लॉजिक यहाँ लिखेगा """
        raise NotImplementedError("Subclasses must implement generate_signals()")

    def add_signal(self, mode, source, target, year, event_tag, base_strength, explanation, domain="general", context=None):
        """ 
        Standard Signal Schema (DTO Pattern)
        Ensures all modules send uniform data to the WeightEngine.
        """
        signal = {
            "mode": mode,
            "source": source,
            "target": target,
            "year": round(year, 2),
            "event_tag": event_tag,
            "base_strength": base_strength,
            "explanation": explanation,
            "domain": domain,
            "context": context if context else {}
        }
        self.raw_signals.append(signal)
        return self.raw_signals