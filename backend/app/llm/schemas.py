from pydantic import BaseModel, Field


class SkillEvidence(BaseModel):
    skill: str
    category: str | None = None

    industry_demand: float | None = None
    curriculum_coverage: float | None = None
    candidate_readiness: float | None = None
    gap_score: float | None = None
    priority: str | None = None


class ReasoningRequest(BaseModel):
    skill: str
    category: str | None = None

    industry_demand: float | None = None
    curriculum_coverage: float | None = None
    candidate_readiness: float | None = None
    gap_score: float | None = None
    priority: str | None = None

    job_count: int | None = None
    course_count: int | None = None
    candidate_count: int | None = None


class ReasoningResponse(BaseModel):
    skill: str
    summary: str
    evidence: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    rationale: str
    confidence: str
