"""Deterministic skill matching for curated prototype job postings."""

import re


ALIASES = {
    "Battery Management Systems (BMS)": ("battery management system", "bms"),
    "Battery Diagnostics": ("battery diagnostic", "battery fault diagnosis"),
    "Lithium-ion Battery Technology": ("lithium ion battery", "lithium-ion battery"),
    "Battery Safety": ("battery safety",),
    "Battery Testing": ("battery test",),
    "High Voltage Safety": ("high voltage safety", "high-voltage safety"),
    "EV Safety": ("ev safety", "electric vehicle safety"),
    "Electrical Systems": ("electrical system",),
    "Electrical Troubleshooting": ("electrical troubleshooting",),
    "Power Electronics": ("power electronics",),
    "Inverter Systems": ("inverter",),
    "DC-DC Converters": ("dc dc converter", "dc-dc converter"),
    "Electric Motors": ("electric motor",),
    "Motor Controllers": ("motor controller",),
    "EV Diagnostics": ("ev diagnostic", "electric vehicle diagnostic"),
    "Vehicle Diagnostics": ("vehicle diagnostic",),
    "CAN Bus": ("can bus",),
    "CAN Bus Diagnostics": ("can bus diagnostic",),
    "Charging Systems": ("charging system",),
    "EV Charging Infrastructure": ("ev charging infrastructure", "charging station"),
    "AC Charging": ("ac charging", "ac charger"),
    "DC Fast Charging": ("dc fast charging", "fast charging"),
    "OCPP": ("ocpp",),
    "Thermal Management": ("thermal management",),
    "Regenerative Braking": ("regenerative braking",),
    "EV Maintenance": ("ev maintenance", "electric vehicle maintenance"),
    "EV Repair": ("ev repair", "electric vehicle repair"),
    "Automotive Electronics": ("automotive electronics",),
    "Automotive Electrical Systems": ("automotive electrical",),
    "Workshop Safety": ("workshop safety",),
    "Technical Documentation": ("technical documentation",),
    "Diagnostic Tools": ("diagnostic tool", "diagnostic scanner"),
}


def _normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


class SkillIntelligenceAgent:
    """Match known skill terms and aliases without inventing new skills."""

    name = "Skill Intelligence"

    def extract(self, description: str, skills: list) -> list[dict]:
        text = f" {_normalize(description)} "
        extracted = []
        for skill in skills:
            canonical_term = re.sub(r"\s*\([^)]*\)", "", skill.name)
            terms = (skill.name, canonical_term, *ALIASES.get(skill.name, ()))
            matches = [
                _normalize(term)
                for term in terms
                if f" {_normalize(term)}" in text
            ]
            if matches:
                extracted.append({
                    "skill_id": skill.id,
                    "skill": skill.name,
                    "confidence": (
                        0.98
                        if _normalize(skill.name) in matches
                        or _normalize(canonical_term) in matches
                        else 0.88
                    ),
                    "matched_terms": sorted(set(matches)),
                })
        return extracted
