from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.models import (
    Skill,
    JobSkill,
    CourseSkill,
    CandidateSkill,
    Candidate,
    Decision,
)

from app.final_features.models import (
    CurriculumAction,
    EmployerValidation,
    DistrictTrainingPlan,
    InterventionSimulation,
    EvidenceRecord,
)


router = APIRouter(
    prefix="/api/final",
    tags=["SIH Final Prototype"],
)


# ============================================================
# HELPERS
# ============================================================

def clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def confidence_from_evidence(
    jobs,
    courses,
    candidates,
):
    total = jobs + courses + candidates

    if total >= 100:
        return 0.95

    if total >= 50:
        return 0.85

    if total >= 20:
        return 0.75

    if total > 0:
        return 0.65

    return 0.30


# ============================================================
# 1. CURRICULUM ADD / UPGRADE / REDUCE / KEEP
# ============================================================

class CurriculumActionCreate(BaseModel):
    skill_id: int

    action: str = Field(
        pattern="^(ADD|UPGRADE|REDUCE|KEEP)$"
    )

    rationale: str


@router.get("/curriculum/actions")
def get_curriculum_actions(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(CurriculumAction)
        .order_by(CurriculumAction.id.desc())
    ).all()


@router.post("/curriculum/recommend")
def recommend_curriculum_actions(
    db: Session = Depends(get_db),
):
    skills = db.scalars(
        select(Skill)
    ).all()

    results = []

    for skill in skills:

        demand = db.scalar(
            select(func.avg(JobSkill.demand))
            .where(JobSkill.skill_id == skill.id)
        ) or 0.0

        coverage = db.scalar(
            select(func.avg(CourseSkill.coverage))
            .where(CourseSkill.skill_id == skill.id)
        ) or 0.0

        readiness = db.scalar(
            select(func.avg(CandidateSkill.readiness))
            .where(CandidateSkill.skill_id == skill.id)
        ) or 0.0

        jobs = db.scalar(
            select(func.count(JobSkill.id))
            .where(JobSkill.skill_id == skill.id)
        ) or 0

        courses = db.scalar(
            select(func.count(CourseSkill.id))
            .where(CourseSkill.skill_id == skill.id)
        ) or 0

        candidates = db.scalar(
            select(func.count(CandidateSkill.id))
            .where(CandidateSkill.skill_id == skill.id)
        ) or 0

        confidence = confidence_from_evidence(
            jobs,
            courses,
            candidates,
        )

        # ----------------------------------------------------
        # Deterministic curriculum action
        # ----------------------------------------------------

        if coverage < 0.30 and demand >= 0.65:
            action = "ADD"
            rationale = (
                "High industry demand with limited curriculum "
                "coverage indicates a missing curriculum area."
            )

        elif coverage >= 0.30 and readiness < 0.55 and demand >= 0.65:
            action = "UPGRADE"
            rationale = (
                "The skill is already represented in curriculum, "
                "but candidate readiness remains below workforce demand."
            )

        elif coverage >= 0.75 and demand < 0.50:
            action = "REDUCE"
            rationale = (
                "Current curriculum coverage is relatively high "
                "while measured industry demand is comparatively lower."
            )

        else:
            action = "KEEP"
            rationale = (
                "Current curriculum coverage is reasonably aligned "
                "with measured industry demand and candidate readiness."
            )

        evidence = (
            f"{jobs} jobs; {courses} courses; "
            f"{candidates} candidates assessed."
        )

        existing = db.scalar(
            select(CurriculumAction)
            .where(
                CurriculumAction.skill_id == skill.id
            )
        )

        if existing:
            existing.action = action
            existing.rationale = rationale
            existing.industry_demand = float(demand)
            existing.curriculum_coverage = float(coverage)
            existing.candidate_readiness = float(readiness)
            existing.confidence = confidence
            existing.evidence = evidence

        else:
            existing = CurriculumAction(
                skill_id=skill.id,
                skill=skill.name,
                action=action,
                rationale=rationale,
                industry_demand=float(demand),
                curriculum_coverage=float(coverage),
                candidate_readiness=float(readiness),
                confidence=confidence,
                evidence=evidence,
                status="PROPOSED",
            )

            db.add(existing)

        results.append(existing)

    db.commit()

    for item in results:
        db.refresh(item)

    return {
        "generated": len(results),
        "actions": results,
    }


@router.patch("/curriculum/actions/{action_id}")
def update_curriculum_action(
    action_id: int,
    payload: CurriculumActionCreate,
    db: Session = Depends(get_db),
):
    item = db.get(CurriculumAction, action_id)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Curriculum action not found",
        )

    item.action = payload.action
    item.rationale = payload.rationale
    item.status = "MODIFIED"

    db.commit()
    db.refresh(item)

    return item


# ============================================================
# 2. WHAT-IF INTERVENTION SIMULATOR
# ============================================================

class SimulationRequest(BaseModel):
    skill_id: int
    intervention_strength: float = Field(
        ge=0,
        le=1,
    )
    estimated_candidates: int = Field(
        default=50,
        ge=1,
    )
    intervention_type: str = "Targeted Upskilling"
    decision_id: int | None = None


@router.post("/simulate/intervention")
def simulate_intervention(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    skill = db.get(Skill, payload.skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    demand = db.scalar(
        select(func.avg(JobSkill.demand))
        .where(JobSkill.skill_id == skill.id)
    ) or 0.0

    readiness = db.scalar(
        select(func.avg(CandidateSkill.readiness))
        .where(CandidateSkill.skill_id == skill.id)
    ) or 0.0

    current_gap = clamp(
        demand - readiness
    )

    # Intervention effect:
    # stronger intervention -> larger readiness improvement
    improvement = (
        payload.intervention_strength
        * 0.45
    )

    projected_readiness = clamp(
        readiness + improvement
    )

    projected_gap = clamp(
        demand - projected_readiness
    )

    simulation = InterventionSimulation(
        decision_id=payload.decision_id,
        skill_id=skill.id,
        skill=skill.name,
        current_readiness=float(readiness),
        current_gap=float(current_gap),
        intervention_strength=payload.intervention_strength,
        projected_readiness=float(projected_readiness),
        projected_gap=float(projected_gap),
        estimated_candidates_impacted=payload.estimated_candidates,
        intervention_type=payload.intervention_type,
    )

    db.add(simulation)
    db.commit()
    db.refresh(simulation)

    return {
        "simulation": {
            "id": simulation.id,
            "decision_id": simulation.decision_id,
            "skill_id": simulation.skill_id,
            "skill": simulation.skill,
            "current_readiness": simulation.current_readiness,
            "current_gap": simulation.current_gap,
            "intervention_strength": simulation.intervention_strength,
            "projected_readiness": simulation.projected_readiness,
            "projected_gap": simulation.projected_gap,
            "estimated_candidates_impacted": simulation.estimated_candidates_impacted,
            "intervention_type": simulation.intervention_type,
            "created_by": simulation.created_by,
        },
        "impact": {
            "readiness_gain": round(
                projected_readiness - readiness,
                4,
            ),
            "gap_reduction": round(
                current_gap - projected_gap,
                4,
            ),
            "gap_reduction_percentage": round(
                (
                    (
                        current_gap - projected_gap
                    )
                    / current_gap
                    * 100
                )
                if current_gap > 0
                else 0,
                1,
            ),
        },
    }


@router.get("/simulate/intervention/history")
def simulation_history(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(InterventionSimulation)
        .order_by(InterventionSimulation.id.desc())
        .limit(50)
    ).all()


# ============================================================
# 3. EMPLOYER VALIDATION
# ============================================================

class EmployerValidationCreate(BaseModel):
    decision_id: int | None = None
    skill_id: int | None = None

    employer_name: str
    skill: str

    demand_rating: float = Field(
        ge=0,
        le=1,
    )

    readiness_rating: float = Field(
        ge=0,
        le=1,
    )

    curriculum_relevance: float = Field(
        ge=0,
        le=1,
    )

    hiring_need: str | None = None
    feedback: str | None = None


@router.post("/employer/validate")
def create_employer_validation(
    payload: EmployerValidationCreate,
    db: Session = Depends(get_db),
):
    confidence = (
        payload.demand_rating
        + payload.curriculum_relevance
        + (
            1 - payload.readiness_rating
        )
    ) / 3

    item = EmployerValidation(
        decision_id=payload.decision_id,
        skill_id=payload.skill_id,
        employer_name=payload.employer_name,
        skill=payload.skill,
        demand_rating=payload.demand_rating,
        readiness_rating=payload.readiness_rating,
        curriculum_relevance=payload.curriculum_relevance,
        hiring_need=payload.hiring_need,
        feedback=payload.feedback,
        validated=True,
        confidence=round(confidence, 4),
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/employer/validations")
def employer_validations(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(EmployerValidation)
        .order_by(EmployerValidation.id.desc())
    ).all()


# ============================================================
# 4. DISTRICT TRAINING PLAN
# ============================================================

class DistrictPlanRequest(BaseModel):
    district: str = "Jaipur"
    max_skills: int = Field(
        default=5,
        ge=1,
        le=20,
    )


@router.post("/district/training-plan")
def generate_training_plan(
    payload: DistrictPlanRequest,
    db: Session = Depends(get_db),
):
    # Candidate count in selected district
    district_candidates = db.scalar(
        select(func.count(Candidate.id))
        .where(
            Candidate.district == payload.district
        )
    ) or 0

    skills = db.scalars(
        select(Skill)
    ).all()

    scored = []

    for skill in skills:

        demand = db.scalar(
            select(func.avg(JobSkill.demand))
            .where(JobSkill.skill_id == skill.id)
        ) or 0.0

        readiness = db.scalar(
            select(func.avg(CandidateSkill.readiness))
            .where(CandidateSkill.skill_id == skill.id)
        ) or 0.0

        coverage = db.scalar(
            select(func.avg(CourseSkill.coverage))
            .where(CourseSkill.skill_id == skill.id)
        ) or 0.0

        gap = clamp(
            demand - readiness
        )

        score = (
            0.50 * demand
            + 0.35 * gap
            + 0.15 * (1 - coverage)
        )

        scored.append(
            (
                score,
                skill,
                demand,
                readiness,
                coverage,
                gap,
            )
        )

    scored.sort(
        key=lambda x: x[0],
        reverse=True,
    )

    plans = []

    for (
        score,
        skill,
        demand,
        readiness,
        coverage,
        gap,
    ) in scored[:payload.max_skills]:

        target = max(
            10,
            round(
                district_candidates
                * min(0.30, gap)
            )
        )

        capacity = max(
            target,
            round(target * 1.15),
        )

        priority = (
            "CRITICAL"
            if score >= 0.75
            else "HIGH"
            if score >= 0.55
            else "MEDIUM"
            if score >= 0.35
            else "LOW"
        )

        confidence = confidence_from_evidence(
            int(demand * 10),
            int(coverage * 10),
            district_candidates,
        )

        evidence = (
            f"District: {payload.district}; "
            f"candidate pool: {district_candidates}; "
            f"demand: {demand:.2f}; "
            f"readiness: {readiness:.2f}; "
            f"coverage: {coverage:.2f}."
        )

        plan = DistrictTrainingPlan(
            district=payload.district,
            skill_id=skill.id,
            skill=skill.name,
            priority=priority,
            target_candidates=target,
            recommended_courses=2 if gap > 0.35 else 1,
            training_capacity=capacity,
            duration_weeks=8 if gap > 0.50 else 6,
            delivery_mode="Blended",
            actions=(
                "Targeted practical training; "
                "industry mentor sessions; "
                "assessment and employer validation."
            ),
            evidence=evidence,
            confidence=confidence,
            status="DRAFT",
        )

        db.add(plan)
        plans.append(plan)

    db.commit()

    for plan in plans:
        db.refresh(plan)

    return {
        "district": payload.district,
        "candidate_pool": district_candidates,
        "plans_generated": len(plans),
        "plans": plans,
    }


@router.get("/district/training-plans")
def get_training_plans(
    district: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(
        DistrictTrainingPlan
    ).order_by(
        DistrictTrainingPlan.id.desc()
    )

    if district:
        query = query.where(
            DistrictTrainingPlan.district == district
        )

    return db.scalars(query).all()


# ============================================================
# 5. EVIDENCE + CONFIDENCE
# ============================================================

class EvidenceCreate(BaseModel):
    decision_id: int | None = None
    skill_id: int | None = None

    source_type: str
    source_name: str
    description: str

    confidence: float = Field(
        ge=0,
        le=1,
    )

    verified: bool = False


@router.post("/evidence")
def create_evidence(
    payload: EvidenceCreate,
    db: Session = Depends(get_db),
):
    item = EvidenceRecord(
        decision_id=payload.decision_id,
        skill_id=payload.skill_id,
        source_type=payload.source_type,
        source_name=payload.source_name,
        description=payload.description,
        confidence=payload.confidence,
        verified=payload.verified,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/evidence")
def get_evidence(
    decision_id: int | None = None,
    skill_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = select(
        EvidenceRecord
    ).order_by(
        EvidenceRecord.id.desc()
    )

    if decision_id is not None:
        query = query.where(
            EvidenceRecord.decision_id == decision_id
        )

    if skill_id is not None:
        query = query.where(
            EvidenceRecord.skill_id == skill_id
        )

    return db.scalars(query).all()


# ============================================================
# FINAL SYSTEM SUMMARY
# ============================================================

@router.get("/summary")
def final_feature_summary(
    db: Session = Depends(get_db),
):
    return {
        "curriculum_actions": db.scalar(
            select(func.count(CurriculumAction.id))
        ) or 0,

        "employer_validations": db.scalar(
            select(func.count(EmployerValidation.id))
        ) or 0,

        "district_training_plans": db.scalar(
            select(func.count(DistrictTrainingPlan.id))
        ) or 0,

        "simulations": db.scalar(
            select(func.count(InterventionSimulation.id))
        ) or 0,

        "evidence_records": db.scalar(
            select(func.count(EvidenceRecord.id))
        ) or 0,

        "workflow": [
            "Evidence",
            "Skill Gap",
            "Decision",
            "Human Validation",
            "Intervention",
            "Simulation",
            "Employer Validation",
            "District Training Plan",
            "Implementation",
        ],
    }
