from app.engines.gap_engine import priority_gap, priority_label


def test_decision_support_gap_formula():
    demand = 0.90
    coverage = 0.75
    readiness = 0.5121

    gap = priority_gap(
        demand,
        coverage,
        readiness,
    )

    assert gap == 0.6226
    assert priority_label(gap) == "HIGH"


def test_decision_support_bms_gap():
    demand = 0.91
    coverage = 0.84
    readiness = 0.461

    gap = priority_gap(
        demand,
        coverage,
        readiness,
    )

    assert gap == 0.6108
    assert priority_label(gap) == "HIGH"
