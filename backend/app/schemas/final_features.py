from pydantic import BaseModel, Field


class WhatIfScenario(BaseModel):
    name: str
    increase_pct: float = Field(
        ge=0,
        le=200,
    )

    additional_trainers: int = Field(
        default=0,
        ge=0,
    )

    additional_labs: int = Field(
        default=0,
        ge=0,
    )


class WhatIfRequest(BaseModel):
    current_capacity: float = Field(
        gt=0,
    )

    projected_demand: float = Field(
        gt=0,
    )

    capacity_per_trainer: float = Field(
        default=100,
        gt=0,
    )

    capacity_per_lab: float = Field(
        default=250,
        gt=0,
    )

    scenarios: list[WhatIfScenario]


class EmployerValidationCreate(BaseModel):
    decision_id: int

    employer_name: str = Field(
        min_length=1,
        max_length=200,
    )

    role: str | None = None

    verdict: str

    validation_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    note: str | None = None


class DistrictPlanGenerate(BaseModel):
    district: str
