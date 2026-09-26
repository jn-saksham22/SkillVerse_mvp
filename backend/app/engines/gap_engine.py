def priority_gap(demand: float, coverage: float, readiness: float) -> float:
    """Deterministic SKILLVERSE priority score. Inputs/outputs are 0..1."""
    values = [max(0.0, min(1.0, x)) for x in (demand, coverage, readiness)]
    d, c, r = values
    return round(0.50 * d + 0.30 * (1 - c) + 0.20 * (1 - r), 4)

def priority_label(score: float) -> str:
    if score >= 0.75: return "CRITICAL"
    if score >= 0.55: return "HIGH"
    if score >= 0.35: return "MEDIUM"
    return "LOW"

def capacity_scenario(current: int, demand: int, increase_pct: float) -> dict:
    capacity = round(current * (1 + increase_pct / 100))
    shortage = max(0, demand - capacity)
    return {"increase_pct": increase_pct, "capacity": capacity, "demand": demand, "shortage": shortage}
