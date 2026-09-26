from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    company: str = Field(min_length=2, max_length=160)
    district: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=20)
