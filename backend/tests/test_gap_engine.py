from app.engines.gap_engine import (
    priority_gap,
    priority_label,
    capacity_scenario,
)


def test_priority_gap_workshop_safety():
    score = priority_gap(0.95, 0.0, 0.0)
    assert score == 0.975


def test_priority_gap_bms():
    score = priority_gap(0.91, 0.84, 0.461)
    assert score == 0.6108


def test_priority_gap_clamps_values():
    score = priority_gap(1.5, -0.5, 2.0)
    assert score == 0.8


def test_priority_labels():
    assert priority_label(0.975) == "CRITICAL"
    assert priority_label(0.75) == "CRITICAL"
    assert priority_label(0.70) == "HIGH"
    assert priority_label(0.55) == "HIGH"
    assert priority_label(0.50) == "MEDIUM"
    assert priority_label(0.35) == "MEDIUM"
    assert priority_label(0.34) == "LOW"


def test_capacity_scenario():
    result = capacity_scenario(
        current=100,
        demand=130,
        increase_pct=20,
    )

    assert result == {
        "increase_pct": 20,
        "capacity": 120,
        "demand": 130,
        "shortage": 10,
    }
