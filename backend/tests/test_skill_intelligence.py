from types import SimpleNamespace

from app.agents.skill_intelligence import SkillIntelligenceAgent


def test_matches_canonical_skill_and_common_alias():
    skills = [
        SimpleNamespace(id=1, name="Battery Management Systems (BMS)"),
        SimpleNamespace(id=2, name="EV Safety"),
    ]

    result = SkillIntelligenceAgent().extract(
        "Inspect battery management systems and BMS faults; follow EV safety procedures.",
        skills,
    )

    assert [item["skill_id"] for item in result] == [1, 2]
    assert result[0]["confidence"] == 0.98
    assert "bms" in result[0]["matched_terms"]


def test_does_not_guess_unknown_skill_terms():
    skills = [SimpleNamespace(id=1, name="Battery Diagnostics")]

    assert SkillIntelligenceAgent().extract(
        "Coordinate schedules and prepare weekly reports.", skills
    ) == []
