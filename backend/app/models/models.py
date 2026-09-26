from sqlalchemy import String, Float, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    company: Mapped[str] = mapped_column(String(160))
    district: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)

class JobSkill(Base):
    __tablename__ = "job_skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    demand: Mapped[float] = mapped_column(Float, default=0.0)

class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    provider: Mapped[str] = mapped_column(String(160))

class CourseSkill(Base):
    __tablename__ = "course_skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    coverage: Mapped[float] = mapped_column(Float, default=0.0)

class Candidate(Base):
    __tablename__ = "candidates"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    district: Mapped[str] = mapped_column(String(120))

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    readiness: Mapped[float] = mapped_column(Float, default=0.0)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    skill: Mapped[str] = mapped_column(String(160))
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

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

    gap_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(50),
    )

    recommendation: Mapped[str] = mapped_column(
        Text,
    )

    evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    rationale: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewer_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PROPOSED",
        index=True,
    )

class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[int] = mapped_column(primary_key=True)

    decision_id: Mapped[int] = mapped_column(
        ForeignKey("decisions.id"),
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
    )

    intervention_type: Mapped[str] = mapped_column(
        String(100),
    )

    objective: Mapped[str] = mapped_column(
        Text,
    )

    target: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    actions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PLANNED",
        index=True,
    )

    outcome: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    implementation_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
