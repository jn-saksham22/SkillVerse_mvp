from app.api.action_center import Scenario, WhatIfRequest, simulate_what_if


def test_what_if_calculates_and_ranks_capacity_scenarios():
    result = simulate_what_if(
        WhatIfRequest(
            current_capacity=100,
            projected_demand=150,
            scenarios=[
                Scenario(name="Small", increase_pct=10),
                Scenario(name="Close gap", increase_pct=50),
            ],
        )
    )

    assert result["baseline_shortage"] == 50
    assert result["recommended_scenario"]["name"] == "Close gap"
    assert result["recommended_scenario"]["remaining_shortage"] == 0
    assert result["recommended_scenario"]["coverage"] == 100
