from pydantic import BaseModel, Field

class GapRequest(BaseModel):
    demand: float = Field(ge=0, le=1)
    coverage: float = Field(ge=0, le=1)
    readiness: float = Field(ge=0, le=1)

class CapacityRequest(BaseModel):
    current_capacity: int = Field(gt=0)
    demand: int = Field(gt=0)
    increase_pct: float = Field(ge=0, le=500)
