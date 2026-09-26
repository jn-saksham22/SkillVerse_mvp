from pydantic import BaseModel, Field


VALID_INTERVENTION_STATUSES = {
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
}


class InterventionCreate(BaseModel):
    decision_id: int

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    intervention_type: str = Field(
        min_length=1,
        max_length=100,
    )

    objective: str = Field(
        min_length=1,
    )

    target: str | None = None

    actions: str | None = None

    owner: str | None = None


class InterventionUpdate(BaseModel):
    status: str | None = None

    outcome: str | None = None

    implementation_note: str | None = None

    owner: str | None = None


class InterventionResponse(BaseModel):
    id: int

    decision_id: int

    title: str

    intervention_type: str

    objective: str

    target: str | None

    actions: str | None

    owner: str | None

    status: str

    outcome: str | None

    implementation_note: str | None
