from pydantic import BaseModel, Field


class DecisionCreate(BaseModel):
    skill_id: int
    skill: str
    category: str | None = None

    industry_demand: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    curriculum_coverage: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    candidate_readiness: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    gap_score: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    priority: str
    recommendation: str

    evidence: str | None = None
    rationale: str | None = None

class DecisionGenerate(BaseModel):
    skill_id: int

class DecisionUpdate(BaseModel):
    status: str | None = None
    reviewer_note: str | None = None


class DecisionResponse(BaseModel):
    id: int
    skill_id: int
    skill: str
    category: str | None

    industry_demand: float | None
    curriculum_coverage: float | None
    candidate_readiness: float | None
    gap_score: float | None

    priority: str
    recommendation: str

    evidence: str | None
    rationale: str | None
    reviewer_note: str | None

    status: str
