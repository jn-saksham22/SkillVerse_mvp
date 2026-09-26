"""API endpoints used by the Action Center workflow."""

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.engines.gap_engine import priority_gap
from app.final_features.models import DistrictTrainingPlan, EmployerValidation
from app.models.models import (
    Candidate,
    CandidateSkill,
    CourseSkill,
    Decision,
    Job,
    JobSkill,
    Skill,
)


router = APIRouter(prefix="/api", tags=["Action Center"])


class Scenario(BaseModel):
    name: str
    increase_pct: float = Field(ge=0, le=200)
    additional_trainers: int = Field(default=0, ge=0)
    additional_labs: int = Field(default=0, ge=0)


class WhatIfRequest(BaseModel):
    current_capacity: float = Field(gt=0)
    projected_demand: float = Field(gt=0)
    capacity_per_trainer: float = Field(default=100, gt=0)
    capacity_per_lab: float = Field(default=250, gt=0)
    scenarios: list[Scenario] = Field(min_length=1)


class EmployerReview(BaseModel):
    decision_id: int
    employer_name: str = Field(min_length=1, max_length=200)
    role: str | None = None
    verdict: str
    validation_score: float | None = Field(default=None, ge=0, le=100)
    note: str | None = None


class DistrictPlanRequest(BaseModel):
    district: str = Field(min_length=1)


@router.get("/curriculum/actions")
def curriculum_actions(db: Session = Depends(get_db)):
    actions = []
    skills = db.scalars(select(Skill).order_by(Skill.name)).all()

    for skill in skills:
        demand_values = db.scalars(
            select(JobSkill.demand).where(JobSkill.skill_id == skill.id)
        ).all()
        coverage_values = db.scalars(
            select(CourseSkill.coverage).where(CourseSkill.skill_id == skill.id)
        ).all()
        readiness_values = db.scalars(
            select(CandidateSkill.readiness).where(
                CandidateSkill.skill_id == skill.id
            )
        ).all()

        demand = sum(demand_values) / len(demand_values) if demand_values else None
        coverage = sum(coverage_values) / len(coverage_values) if coverage_values else None
        readiness = sum(readiness_values) / len(readiness_values) if readiness_values else None
        complete = all(value is not None for value in (demand, coverage, readiness))
        gap = priority_gap(demand, coverage, readiness) if complete else None

        if not complete:
            action, reason, hours, practical = (
                "KEEP", "Collect missing demand, curriculum, or readiness evidence before recommending a change.", 0, 0
            )
        elif demand >= 0.70 and coverage < 0.50:
            action, reason, hours, practical = (
                "ADD", "High industry demand with low curriculum coverage indicates a missing curriculum area.", 30, 20
            )
        elif demand >= 0.70 and coverage >= 0.50 and readiness < 0.60:
            action, reason, hours, practical = (
                "UPGRADE", "The skill is represented in curriculum, but candidate readiness remains below demand.", 20, 12
            )
        elif demand < 0.45 and coverage >= 0.70:
            action, reason, hours, practical = (
                "REDUCE", "Curriculum coverage is high relative to measured industry demand.", 8, 4
            )
        else:
            action, reason, hours, practical = (
                "KEEP", "Current coverage remains proportionate to observed demand and readiness.", 12, 6
            )

        category = (skill.category or "").lower()
        equipment = (
            "Battery test bench / BMS training kit" if "batter" in category else
            "EV diagnostics scanner / CAN training kit" if "diagnostic" in category else
            "EV safety PPE and isolation training equipment" if "safety" in category else
            "Power electronics laboratory kit" if "power" in category else
            "Standard practical training equipment"
        )
        actions.append({
            "skill_id": skill.id,
            "skill": skill.name,
            "category": skill.category,
            "action": action,
            "reason": reason,
            "industry_demand": round(float(demand), 3) if demand is not None else None,
            "curriculum_coverage": round(float(coverage), 3) if coverage is not None else None,
            "candidate_readiness": round(float(readiness), 3) if readiness is not None else None,
            "gap_score": round(float(gap), 3) if gap is not None else None,
            "recommended_hours": hours,
            "practical_hours": practical,
            "trainer_requirement": (
                "Trainer with relevant current industry experience."
                if action in ("ADD", "UPGRADE") else
                "Reallocate trainer capacity toward higher-demand skills."
                if action == "REDUCE" else
                "Retain existing qualified trainer capacity."
            ),
            "equipment_requirement": equipment,
            "job_count": len(demand_values),
            "course_count": len(coverage_values),
            "confidence": round(
                (sum(value is not None for value in (demand, coverage, readiness)) / 3)
                * min(1.0, (len(demand_values) + len(coverage_values) + len(readiness_values)) / 8),
                3,
            ),
        })

    return {"count": len(actions), "method": "deterministic_curriculum_rule_engine", "actions": actions}


@router.post("/what-if/simulate")
def simulate_what_if(payload: WhatIfRequest):
    baseline = max(0.0, payload.projected_demand - payload.current_capacity)
    scenarios = []
    for item in payload.scenarios:
        capacity = (
            payload.current_capacity * (1 + item.increase_pct / 100)
            + item.additional_trainers * payload.capacity_per_trainer
            + item.additional_labs * payload.capacity_per_lab
        )
        shortage = max(0.0, payload.projected_demand - capacity)
        coverage = min(1.0, capacity / payload.projected_demand)
        scenarios.append({
            "name": item.name,
            "increase_pct": item.increase_pct,
            "additional_trainers": item.additional_trainers,
            "additional_labs": item.additional_labs,
            "projected_capacity": round(capacity, 2),
            "remaining_shortage": round(shortage, 2),
            "coverage": round(coverage * 100, 1),
            "risk": "LOW" if coverage >= .90 else "MEDIUM" if coverage >= .65 else "HIGH",
        })
    scenarios.sort(key=lambda item: (item["remaining_shortage"], item["increase_pct"] + item["additional_trainers"] + item["additional_labs"]))
    for rank, item in enumerate(scenarios, start=1):
        item["rank"] = rank
    return {
        "current_capacity": payload.current_capacity,
        "projected_demand": payload.projected_demand,
        "baseline_shortage": round(baseline, 2),
        "scenarios": scenarios,
        "recommended_scenario": scenarios[0],
        "calculation": "Projected capacity = current capacity × (1 + increase %) + trainer capacity + lab capacity",
    }


@router.post("/employer-validations")
def create_employer_validation(payload: EmployerReview, db: Session = Depends(get_db)):
    decision = db.get(Decision, payload.decision_id)
    if decision is None:
        raise HTTPException(status_code=404, detail="Decision not found")
    verdict = payload.verdict.upper()
    if verdict not in {"AGREE", "MODIFY", "REJECT"}:
        raise HTTPException(status_code=422, detail="Verdict must be AGREE, MODIFY, or REJECT")

    score = payload.validation_score
    confidence = (score / 100) if score is not None else 0.0
    record = EmployerValidation(
        decision_id=decision.id,
        skill_id=decision.skill_id,
        employer_name=payload.employer_name.strip(),
        skill=decision.skill,
        demand_rating=float(decision.industry_demand or 0),
        readiness_rating=float(decision.candidate_readiness or 0),
        curriculum_relevance=float(decision.curriculum_coverage or 0),
        feedback=f"{verdict}; {payload.role or 'Industry reviewer'}; {payload.note or ''}".strip(),
        validated=verdict == "AGREE",
        confidence=confidence,
    )
    db.add(record)
    if verdict == "REJECT":
        decision.status = "REJECTED"
    elif verdict == "MODIFY":
        decision.status = "MODIFIED"
    else:
        decision.status = "UNDER_REVIEW"
    decision.reviewer_note = (
        f"Employer review by {payload.employer_name.strip()} "
        f"({payload.role or 'Industry reviewer'}): {verdict}. "
        f"Score: {score if score is not None else 'not provided'}. "
        f"{payload.note or ''}"
    ).strip()
    db.commit()
    db.refresh(record)
    return {"id": record.id, "decision_id": decision.id, "skill": decision.skill, "verdict": verdict, "validation_score": score}


@router.get("/employer-validations")
def employer_validations(decision_id: int | None = None, db: Session = Depends(get_db)):
    query = select(EmployerValidation).order_by(EmployerValidation.id.desc())
    if decision_id is not None:
        query = query.where(EmployerValidation.decision_id == decision_id)
    return db.scalars(query).all()


@router.post("/district-plans/generate")
def generate_district_plan(payload: DistrictPlanRequest, db: Session = Depends(get_db)):
    district = payload.district.strip()
    if not district:
        raise HTTPException(status_code=422, detail="District is required")

    job_rows = db.execute(
        select(JobSkill.skill_id, JobSkill.demand)
        .join(Job, Job.id == JobSkill.job_id)
        .where(Job.district == district)
    ).all()
    if not job_rows:
        raise HTTPException(status_code=404, detail=f"No job evidence found for district: {district}")

    by_skill = {}
    for skill_id, demand in job_rows:
        by_skill.setdefault(skill_id, []).append(float(demand))
    rows = []
    for skill_id, demands in by_skill.items():
        skill = db.get(Skill, skill_id)
        if skill is None:
            continue
        coverage = db.scalar(select(func.avg(CourseSkill.coverage)).where(CourseSkill.skill_id == skill_id))
        readiness = db.scalar(select(func.avg(CandidateSkill.readiness)).where(CandidateSkill.skill_id == skill_id))
        if coverage is None or readiness is None:
            continue
        demand = sum(demands) / len(demands)
        gap = priority_gap(demand, float(coverage), float(readiness))
        rows.append((gap, skill_id, skill.name, demand, float(coverage), float(readiness)))
    rows.sort(reverse=True)
    rows = rows[:10]
    priority_skills = [name for gap, _, name, *_ in rows if gap >= .65][:5]
    actions = []
    trainers = labs = 0
    evidence = []
    district_candidate_count = db.scalar(
        select(func.count(Candidate.id)).where(Candidate.district == district)
    ) or 0
    confidence = round(min(1.0, .60 + len(rows) * .04), 3)

    for gap, skill_id, name, demand, coverage, readiness in rows:
        action = "ADD" if demand >= .70 and coverage < .50 else "UPGRADE" if demand >= .70 and readiness < .60 else "REDUCE" if demand < .45 and coverage >= .70 else "KEEP"
        actions.append(f"{name}: {action}")
        trainers += 2 if action == "ADD" else 1 if action == "UPGRADE" else 0
        labs += 1 if action in ("ADD", "UPGRADE") else 0
        evidence.append(f"{name}: demand={demand:.2f}, coverage={coverage:.2f}, readiness={readiness:.2f}, gap={gap:.2f}")

        plan = db.scalar(
            select(DistrictTrainingPlan).where(
                DistrictTrainingPlan.district == district,
                DistrictTrainingPlan.skill_id == skill_id,
            )
        )
        if plan is None:
            plan = DistrictTrainingPlan(
                district=district,
                skill_id=skill_id,
                skill=name,
                status="DRAFT",
            )
            db.add(plan)

        plan.skill = name
        plan.priority = "CRITICAL" if gap >= .75 else "HIGH" if gap >= .55 else "MEDIUM" if gap >= .35 else "LOW"
        plan.target_candidates = round(district_candidate_count * min(.30, gap))
        plan.recommended_courses = 2 if gap > .35 else 1
        plan.training_capacity = round(plan.target_candidates * 1.15)
        plan.duration_weeks = 8 if gap > .50 else 6
        plan.delivery_mode = "Blended"
        plan.actions = f"{action}: targeted practical training, trainer allocation, and employer validation."
        plan.evidence = evidence[-1]
        plan.confidence = confidence

    db.commit()
    return {
        "district": district,
        "title": f"{district} District Training Plan",
        "summary": f"{district} district plan identifies {len(priority_skills)} priority skills from industry, course, and candidate evidence.",
        "priority_skills": priority_skills,
        "curriculum_actions": actions,
        "trainer_requirement": f"Indicative trainer requirement: {trainers} targeted trainer allocations.",
        "equipment_requirement": f"Indicative requirement: {labs} targeted practical lab/resource allocations.",
        "capacity_recommendation": f"Prioritize targeted capacity expansion for {len(priority_skills)} high-gap skills.",
        "evidence": evidence,
        "confidence": confidence,
        "confidence_percent": round(confidence * 100, 1),
        "method": "deterministic district aggregation",
        "plans_generated": len(rows),
    }
