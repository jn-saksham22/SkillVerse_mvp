from sqlalchemy import String, Float, Integer, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


# ============================================================
# CURRICULUM ACTION
# ============================================================

class CurriculumAction(Base):
    __tablename__ = "curriculum_actions"

    id: Mapped[int] = mapped_column(primary_key=True)

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    skill: Mapped[str] = mapped_column(String(160))

    action: Mapped[str] = mapped_column(
        String(30),
        index=True,
    )

    rationale: Mapped[str] = mapped_column(Text)

    industry_demand: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    curriculum_coverage: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    candidate_readiness: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PROPOSED",
        index=True,
    )


# ============================================================
# EMPLOYER VALIDATION
# ============================================================

class EmployerValidation(Base):
    __tablename__ = "employer_validations"

    id: Mapped[int] = mapped_column(primary_key=True)

    decision_id: Mapped[int | None] = mapped_column(
        ForeignKey("decisions.id"),
        nullable=True,
        index=True,
    )

    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id"),
        nullable=True,
        index=True,
    )

    employer_name: Mapped[str] = mapped_column(
        String(200)
    )

    skill: Mapped[str] = mapped_column(
        String(160)
    )

    demand_rating: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    readiness_rating: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    curriculum_relevance: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    hiring_need: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    validated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )


# ============================================================
# DISTRICT TRAINING PLAN
# ============================================================

class DistrictTrainingPlan(Base):
    __tablename__ = "district_training_plans"

    id: Mapped[int] = mapped_column(primary_key=True)

    district: Mapped[str] = mapped_column(
        String(120),
        index=True,
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    skill: Mapped[str] = mapped_column(
        String(160)
    )

    priority: Mapped[str] = mapped_column(
        String(50)
    )

    target_candidates: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    recommended_courses: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    training_capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    duration_weeks: Mapped[int] = mapped_column(
        Integer,
        default=8,
    )

    delivery_mode: Mapped[str] = mapped_column(
        String(80),
        default="Blended",
    )

    actions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="DRAFT",
        index=True,
    )


# ============================================================
# WHAT-IF INTERVENTION SIMULATION
# ============================================================

class InterventionSimulation(Base):
    __tablename__ = "intervention_simulations"

    id: Mapped[int] = mapped_column(primary_key=True)

    decision_id: Mapped[int | None] = mapped_column(
        ForeignKey("decisions.id"),
        nullable=True,
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    skill: Mapped[str] = mapped_column(
        String(160)
    )

    current_readiness: Mapped[float] = mapped_column(
        Float
    )

    current_gap: Mapped[float] = mapped_column(
        Float
    )

    intervention_strength: Mapped[float] = mapped_column(
        Float
    )

    projected_readiness: Mapped[float] = mapped_column(
        Float
    )

    projected_gap: Mapped[float] = mapped_column(
        Float
    )

    estimated_candidates_impacted: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    intervention_type: Mapped[str] = mapped_column(
        String(100)
    )

    created_by: Mapped[str] = mapped_column(
        String(100),
        default="SIH_DEMO",
    )


# ============================================================
# EVIDENCE RECORD
# ============================================================

class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    decision_id: Mapped[int | None] = mapped_column(
        ForeignKey("decisions.id"),
        nullable=True,
        index=True,
    )

    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id"),
        nullable=True,
        index=True,
    )

    source_type: Mapped[str] = mapped_column(
        String(100)
    )

    source_name: Mapped[str] = mapped_column(
        String(200)
    )

    description: Mapped[str] = mapped_column(
        Text
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )
