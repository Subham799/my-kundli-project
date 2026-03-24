# Asymmetric Natural Relationship Matrix (नैसर्गिक मैत्री चक्र)
# Format: "Planet": {"Friends": [...], "Enemies": [...], "Neutral": [...]}

NATURAL_RELATIONSHIPS = {
    "Su": {"Friends": ["Mo", "Ma", "Ju"], "Enemies": ["Ve", "Sa", "Ra", "Ke"], "Neutral": ["Me"]},
    "Mo": {"Friends": ["Su", "Me"], "Enemies": ["Ra", "Ke"], "Neutral": ["Ma", "Ju", "Ve", "Sa"]},
    "Ma": {"Friends": ["Su", "Mo", "Ju", "Ke"], "Enemies": ["Me", "Ra"], "Neutral": ["Ve", "Sa"]},
    "Me": {"Friends": ["Su", "Ve", "Ra"], "Enemies": ["Mo"], "Neutral": ["Ma", "Ju", "Sa", "Ke"]},
    "Ju": {"Friends": ["Su", "Mo", "Ma"], "Enemies": ["Me", "Ve"], "Neutral": ["Sa", "Ra", "Ke"]},
    "Ve": {"Friends": ["Me", "Sa", "Ra"], "Enemies": ["Su", "Mo"], "Neutral": ["Ma", "Ju", "Ke"]},
    "Sa": {"Friends": ["Me", "Ve", "Ra"], "Enemies": ["Su", "Mo", "Ma", "Ke"], "Neutral": ["Ju"]},
    "Ra": {"Friends": ["Ve", "Sa", "Me"], "Enemies": ["Su", "Mo", "Ma"], "Neutral": ["Ju", "Ke"]},
    "Ke": {"Friends": ["Ma", "Ve", "Sa"], "Enemies": ["Su", "Mo"], "Neutral": ["Me", "Ju", "Ra"]}
}