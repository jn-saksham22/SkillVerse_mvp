import asyncio

from app.llm.client import GeminiClient
from app.llm.schemas import ReasoningRequest


def test_fallback_reasoning():

    client = GeminiClient()

    request = ReasoningRequest(
        skill="EV Diagnostics",
        category="Diagnostics",
        industry_demand=0.90,
        curriculum_coverage=0.75,
        candidate_readiness=0.5121,
        gap_score=0.6226,
        priority="HIGH",
        job_count=3,
        course_count=2,
        candidate_count=100,
    )

    result = client._fallback_reasoning(
        request,
        "test fallback",
    )

    assert result.skill == "EV Diagnostics"
    assert result.confidence == "medium"
    assert len(result.evidence) > 0
    assert len(result.recommended_actions) > 0
