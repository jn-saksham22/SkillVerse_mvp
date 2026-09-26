from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from app.agents.market_scout import MarketScoutAgent
from app.agents.skill_intelligence import SkillIntelligenceAgent
from app.agents.curriculum_mapper import CurriculumMapperAgent
from app.agents.candidate_readiness import CandidateReadinessAgent
from app.agents.decision_support import DecisionSupportAgent
from app.agents.reasoning import ReasoningAgent

from app.db.session import get_db
from app.models.models import (
    Skill,
    Job,
    JobSkill,
    Course,
    CourseSkill,
    Candidate,
    CandidateSkill,
    Decision,
    Intervention,
)
from app.engines.gap_engine import (
    priority_gap,
    priority_label,
    capacity_scenario,
)
from app.schemas.gap import GapRequest, CapacityRequest
from app.schemas.decision import DecisionCreate, DecisionUpdate, DecisionGenerate
from app.schemas.intervention import InterventionCreate, InterventionUpdate
from app.schemas.job import JobCreate

router = APIRouter(prefix="/api")


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(select(1))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc

    return {
        "status": "ok",
        "service": "skillverse-api",
        "database": "connected",
    }


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    jobs = db.scalar(select(func.count(Job.id))) or 0
    skills = db.scalar(select(func.count(Skill.id))) or 0
    courses = db.scalar(select(func.count(Course.id))) or 0
    candidates = db.scalar(select(func.count(Candidate.id))) or 0

    job_skills = db.scalar(select(func.count(JobSkill.id))) or 0
    course_skills = db.scalar(select(func.count(CourseSkill.id))) or 0
    candidate_skills = (
        db.scalar(select(func.count(CandidateSkill.id))) or 0
    )

    return {
        "jobs_tracked": jobs,
        "skills_tracked": skills,
        "courses_tracked": courses,
        "candidates_tracked": candidates,
        "job_skill_relationships": job_skills,
        "course_skill_relationships": course_skills,
        "candidate_skill_relationships": candidate_skills,
        "sector": "Electric Mobility",
    }


# ============================================================
# SKILLS
# ============================================================

@router.get("/skills")
def get_skills(
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):

    query = select(Skill)

    if category:
        query = query.where(Skill.category == category)

    if search:
        query = query.where(
            Skill.name.ilike(f"%{search}%")
        )

    query = query.order_by(Skill.name)

    skills = db.scalars(query).all()

    return [
        {
            "id": skill.id,
            "name": skill.name,
            "category": skill.category,
        }
        for skill in skills
    ]
# ============================================================
# SKILL GAP MATRIX
# ============================================================

@router.get("/skills/gap-matrix")
def skill_gap_matrix(
    db: Session = Depends(get_db),
):
    skills = db.scalars(
        select(Skill).order_by(Skill.name)
    ).all()

    results = []

    for skill in skills:
        demand_values = db.scalars(
            select(JobSkill.demand)
            .where(JobSkill.skill_id == skill.id)
        ).all()

        coverage_values = db.scalars(
            select(CourseSkill.coverage)
            .where(CourseSkill.skill_id == skill.id)
        ).all()

        readiness_values = db.scalars(
            select(CandidateSkill.readiness)
            .where(CandidateSkill.skill_id == skill.id)
        ).all()

        demand = (
            float(sum(demand_values) / len(demand_values))
            if demand_values else None
        )

        coverage = (
            float(sum(coverage_values) / len(coverage_values))
            if coverage_values else None
        )

        readiness = (
            float(sum(readiness_values) / len(readiness_values))
            if readiness_values else None
        )

        missing_dimensions = []

        if demand is None:
            missing_dimensions.append("industry_demand")

        if coverage is None:
            missing_dimensions.append("curriculum_coverage")

        if readiness is None:
            missing_dimensions.append("candidate_readiness")

        if not missing_dimensions:
            gap_score = priority_gap(
                demand,
                coverage,
                readiness,
            )
            priority = priority_label(gap_score)
            data_status = "COMPLETE"
            confidence = "HIGH"

        else:
            gap_score = None
            priority = "INSUFFICIENT_DATA"

            if len(missing_dimensions) == 1:
                data_status = "PARTIAL"
                confidence = "MEDIUM"
            else:
                data_status = "INSUFFICIENT"
                confidence = "LOW"

        results.append({
            "skill_id": skill.id,
            "skill": skill.name,
            "category": skill.category,
            "demand": demand,
            "coverage": coverage,
            "readiness": readiness,
            "gap_score": gap_score,
            "priority": priority,
            "data_status": data_status,
            "confidence": confidence,
            "missing_dimensions": missing_dimensions,
            "jobs_using_skill": len(demand_values),
            "courses_covering_skill": len(coverage_values),
            "candidates_assessed": len(readiness_values),
        })

    results.sort(
        key=lambda item: (
            item["gap_score"] is not None,
            item["gap_score"] if item["gap_score"] is not None else -1,
        ),
        reverse=True,
    )

    return {
        "count": len(results),
        "skills": results,
    }


@router.get("/skills/{skill_id}")
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):

    skill = db.get(Skill, skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    return {
        "id": skill.id,
        "name": skill.name,
        "category": skill.category,
    }


# ============================================================
# SKILL ANALYSIS
# ============================================================

@router.get("/skills/{skill_id}/analysis")
def analyze_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    skill = db.get(Skill, skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    demand_values = db.scalars(
        select(JobSkill.demand)
        .where(JobSkill.skill_id == skill_id)
    ).all()

    coverage_values = db.scalars(
        select(CourseSkill.coverage)
        .where(CourseSkill.skill_id == skill_id)
    ).all()

    readiness_values = db.scalars(
        select(CandidateSkill.readiness)
        .where(CandidateSkill.skill_id == skill_id)
    ).all()

    demand = (
        float(sum(demand_values) / len(demand_values))
        if demand_values else None
    )

    coverage = (
        float(sum(coverage_values) / len(coverage_values))
        if coverage_values else None
    )

    readiness = (
        float(sum(readiness_values) / len(readiness_values))
        if readiness_values else None
    )

    missing_dimensions = []

    if demand is None:
        missing_dimensions.append("industry_demand")

    if coverage is None:
        missing_dimensions.append("curriculum_coverage")

    if readiness is None:
        missing_dimensions.append("candidate_readiness")

    if not missing_dimensions:
        gap_score = priority_gap(
            demand,
            coverage,
            readiness,
        )
        priority = priority_label(gap_score)
        data_status = "COMPLETE"
        confidence = "HIGH"

    else:
        gap_score = None
        priority = "INSUFFICIENT_DATA"

        if len(missing_dimensions) == 1:
            data_status = "PARTIAL"
            confidence = "MEDIUM"
        else:
            data_status = "INSUFFICIENT"
            confidence = "LOW"

    return {
        "skill": {
            "id": skill.id,
            "name": skill.name,
            "category": skill.category,
        },
        "industry_demand": demand,
        "curriculum_coverage": coverage,
        "candidate_readiness": readiness,
        "gap_score": gap_score,
        "priority": priority,
        "data_status": data_status,
        "confidence": confidence,
        "missing_dimensions": missing_dimensions,
        "jobs_using_skill": len(demand_values),
        "courses_covering_skill": len(coverage_values),
        "candidates_assessed": len(readiness_values),
    }


# ============================================================
# JOBS
# ============================================================

@router.post("/jobs")
def create_or_update_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
):
    """Save a curated job posting and match it to the known skill catalog."""
    job = db.scalar(
        select(Job).where(
            Job.title == payload.title.strip(),
            Job.company == payload.company.strip(),
            Job.district == payload.district.strip(),
        )
    )
    updated_existing = job is not None
    if job is None:
        job = Job(
            title=payload.title.strip(),
            company=payload.company.strip(),
            district=payload.district.strip(),
            description=payload.description.strip(),
        )
        db.add(job)
        db.flush()
    else:
        job.description = payload.description.strip()

    catalog = db.scalars(select(Skill).order_by(Skill.name)).all()
    extracted = SkillIntelligenceAgent().extract(job.description, catalog)

    db.query(JobSkill).filter(JobSkill.job_id == job.id).delete(
        synchronize_session=False
    )
    db.add_all(
        JobSkill(
            job_id=job.id,
            skill_id=item["skill_id"],
            demand=item["confidence"],
        )
        for item in extracted
    )
    db.commit()
    db.refresh(job)

    return {
        "job_id": job.id,
        "title": job.title,
        "company": job.company,
        "district": job.district,
        "updated_existing": updated_existing,
        "extraction_method": "canonical skill dictionary",
        "skills_extracted": extracted,
        "warning": None if extracted else "No known catalog skills matched; review the description or expand the skill catalog.",
    }

@router.get("/jobs")
def get_jobs(
    search: str | None = None,
    district: str | None = None,
    db: Session = Depends(get_db),
):

    query = select(Job)

    if search:
        query = query.where(
            Job.title.ilike(f"%{search}%")
            | Job.company.ilike(f"%{search}%")
        )

    if district:
        query = query.where(
            Job.district == district
        )

    jobs = db.scalars(
        query.order_by(Job.title)
    ).all()

    response = []

    for job in jobs:

        skills = db.execute(
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                JobSkill.demand,
            )
            .join(
                JobSkill,
                JobSkill.skill_id == Skill.id,
            )
            .where(
                JobSkill.job_id == job.id
            )
            .order_by(Skill.name)
        ).all()

        response.append(
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "district": job.district,
                "description": job.description,
                "skills": [
                    {
                        "id": row.id,
                        "name": row.name,
                        "category": row.category,
                        "demand": row.demand,
                    }
                    for row in skills
                ],
            }
        )

    return response


@router.get("/jobs/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
):

    job = db.get(Job, job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    skills = db.execute(
        select(
            Skill.id,
            Skill.name,
            Skill.category,
            JobSkill.demand,
        )
        .join(
            JobSkill,
            JobSkill.skill_id == Skill.id,
        )
        .where(JobSkill.job_id == job_id)
    ).all()

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "district": job.district,
        "description": job.description,
        "skills": [
            {
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "demand": row.demand,
            }
            for row in skills
        ],
    }


# ============================================================
# COURSES
# ============================================================

@router.get("/courses")
def get_courses(
    search: str | None = None,
    db: Session = Depends(get_db),
):

    query = select(Course)

    if search:
        query = query.where(
            Course.name.ilike(f"%{search}%")
            | Course.provider.ilike(f"%{search}%")
        )

    courses = db.scalars(
        query.order_by(Course.name)
    ).all()

    response = []

    for course in courses:

        skills = db.execute(
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                CourseSkill.coverage,
            )
            .join(
                CourseSkill,
                CourseSkill.skill_id == Skill.id,
            )
            .where(
                CourseSkill.course_id == course.id
            )
        ).all()

        response.append(
            {
                "id": course.id,
                "name": course.name,
                "provider": course.provider,
                "skills": [
                    {
                        "id": row.id,
                        "name": row.name,
                        "category": row.category,
                        "coverage": row.coverage,
                    }
                    for row in skills
                ],
            }
        )

    return response


# ============================================================
# CANDIDATES
# ============================================================

@router.get("/candidates")
def get_candidates(
    district: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):

    query = select(Candidate)

    if district:
        query = query.where(
            Candidate.district == district
        )

    candidates = db.scalars(
        query.order_by(Candidate.id).limit(limit)
    ).all()

    response = []

    for candidate in candidates:

        skills = db.execute(
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                CandidateSkill.readiness,
            )
            .join(
                CandidateSkill,
                CandidateSkill.skill_id == Skill.id,
            )
            .where(
                CandidateSkill.candidate_id
                == candidate.id
            )
        ).all()

        response.append(
            {
                "id": candidate.id,
                "name": candidate.name,
                "district": candidate.district,
                "skills": [
                    {
                        "id": row.id,
                        "name": row.name,
                        "category": row.category,
                        "readiness": row.readiness,
                    }
                    for row in skills
                ],
            }
        )

    return response


# ============================================================
# GAP ENGINE
# ============================================================

@router.post("/gaps/analyze")
def analyze_gap(req: GapRequest):

    score = priority_gap(
        req.demand,
        req.coverage,
        req.readiness,
    )

    return {
        "demand": req.demand,
        "coverage": req.coverage,
        "readiness": req.readiness,
        "gap_score": score,
        "priority": priority_label(score),
    }


# ============================================================
# CAPACITY SIMULATOR
# ============================================================

@router.post("/simulate/capacity")
def simulate(req: CapacityRequest):

    return capacity_scenario(
        req.current_capacity,
        req.demand,
        req.increase_pct,
    )
# ============================================================
# AGENT INTELLIGENCE
# ============================================================

@router.get("/agents/market-scout")
def market_scout_agent(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Market Scout Agent

    Identifies high-demand EV skills from the job market dataset.
    """
    agent = MarketScoutAgent(db)
    return agent.run(limit=limit)


@router.get("/agents/curriculum-mapper")
def curriculum_mapper_agent(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Curriculum Mapper Agent

    Identifies how strongly EV skills are represented
    across available training programs.
    """
    agent = CurriculumMapperAgent(db)
    return agent.run(limit=limit)


@router.get("/agents/candidate-readiness")
def candidate_readiness_agent(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Candidate Readiness Agent

    Measures workforce readiness for EV skills.
    """
    agent = CandidateReadinessAgent(db)
    return agent.run(limit=limit)


@router.get("/agents/decision-support")
def decision_support_agent(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Decision Support Agent

    Combines industry demand, curriculum coverage,
    and candidate readiness to identify skill gaps.
    """
    agent = DecisionSupportAgent(db)
    return agent.run(limit=limit)


@router.get("/agents/overview")
def agents_overview(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Combined 4-agent intelligence view.

    This endpoint is designed for the SKILLVERSE
    workforce intelligence dashboard.
    """

    market = MarketScoutAgent(db).run(limit=limit)

    curriculum = CurriculumMapperAgent(db).run(limit=limit)

    readiness = CandidateReadinessAgent(db).run(limit=limit)

    decisions = DecisionSupportAgent(db).run(limit=limit)

    return {
        "system": "SKILLVERSE",
        "module": "Agent Intelligence",
        "sector": "Electric Mobility",

        "workflow": [
            "Market Scout",
            "Curriculum Mapper",
            "Candidate Readiness",
            "Decision Support",
        ],

        "agents": {
            "market_scout": market,
            "curriculum_mapper": curriculum,
            "candidate_readiness": readiness,
            "decision_support": decisions,
        },
    }


@router.post("/agents/reason")
async def agent_reasoning(payload: dict):
    """
    LLM reasoning layer.

    Receives structured evidence generated by the deterministic
    SKILLVERSE agents and produces an evidence-grounded decision brief.
    """

    agent = ReasoningAgent()

    result = await agent.run(payload)

    return {
        "agent": "SKILLVERSE Reasoning Agent",
        "model": settings.gemini_model,
        "result": result.model_dump(),
    }


# ============================================================
# HUMAN VALIDATION / DECISION WORKFLOW
# ============================================================

VALID_DECISION_STATUSES = {
    "PROPOSED",
    "UNDER_REVIEW",
    "APPROVED",
    "MODIFIED",
    "REJECTED",
    "IMPLEMENTED",
}


def decision_payload(decision: Decision) -> dict:
    """Serialize a Decision consistently inside generated API envelopes."""
    return {
        "id": decision.id,
        "skill_id": decision.skill_id,
        "skill": decision.skill,
        "category": decision.category,
        "industry_demand": decision.industry_demand,
        "curriculum_coverage": decision.curriculum_coverage,
        "candidate_readiness": decision.candidate_readiness,
        "gap_score": decision.gap_score,
        "priority": decision.priority,
        "recommendation": decision.recommendation,
        "evidence": decision.evidence,
        "rationale": decision.rationale,
        "reviewer_note": decision.reviewer_note,
        "status": decision.status,
    }

@router.post("/decisions/generate")
async def generate_decision(
    payload: DecisionGenerate,
    db: Session = Depends(get_db),
):
    """
    Generate a human-reviewable decision from authoritative
    SKILLVERSE database evidence.

    Flow:

    database evidence
        -> deterministic gap engine
        -> recommendation
        -> LLM reasoning
        -> PROPOSED decision
    """

    skill = db.get(Skill, payload.skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    demand = db.scalar(
        select(func.avg(JobSkill.demand))
        .where(JobSkill.skill_id == skill.id)
    )

    coverage = db.scalar(
        select(func.avg(CourseSkill.coverage))
        .where(CourseSkill.skill_id == skill.id)
    )

    readiness = db.scalar(
        select(func.avg(CandidateSkill.readiness))
        .where(CandidateSkill.skill_id == skill.id)
    )

    job_count = db.scalar(
        select(func.count(JobSkill.id))
        .where(JobSkill.skill_id == skill.id)
    ) or 0

    course_count = db.scalar(
        select(func.count(CourseSkill.id))
        .where(CourseSkill.skill_id == skill.id)
    ) or 0

    candidate_count = db.scalar(
        select(func.count(CandidateSkill.id))
        .where(CandidateSkill.skill_id == skill.id)
    ) or 0

    demand = float(demand) if demand is not None else None
    coverage = float(coverage) if coverage is not None else None
    readiness = float(readiness) if readiness is not None else None

    # --------------------------------------------------------
    # Deterministic decision calculation
    # --------------------------------------------------------

    if (
        demand is not None
        and coverage is not None
        and readiness is not None
    ):
        gap_score = priority_gap(
            demand,
            coverage,
            readiness,
        )

        priority = priority_label(gap_score)

        if readiness < coverage and readiness < demand:
            recommendation = (
                "Prioritize workforce upskilling."
            )
        elif coverage < demand:
            recommendation = (
                "Review and strengthen curriculum coverage."
            )
        else:
            recommendation = (
                "Monitor skill demand and workforce readiness."
            )

    else:
        gap_score = None
        priority = "INSUFFICIENT_DATA"

        recommendation = (
            "Collect additional evidence before making "
            "a workforce decision."
        )

    # --------------------------------------------------------
    # Evidence summary
    # --------------------------------------------------------

    evidence = (
        f"{job_count} jobs reference {skill.name}; "
        f"{course_count} courses cover the skill; "
        f"{candidate_count} candidates assessed."
    )

    existing = db.scalar(
        select(Decision)
        .where(Decision.skill_id == skill.id)
        .order_by(Decision.id.desc())
    )

    if existing and existing.status in {"PROPOSED", "UNDER_REVIEW"}:
        existing.category = skill.category
        existing.industry_demand = demand
        existing.curriculum_coverage = coverage
        existing.candidate_readiness = readiness
        existing.gap_score = gap_score
        existing.priority = priority
        existing.recommendation = recommendation
        existing.evidence = evidence
        reasoning = None
        if not existing.rationale:
            reasoning = await ReasoningAgent().run({
                "skill": skill.name,
                "category": skill.category,
                "industry_demand": demand,
                "curriculum_coverage": coverage,
                "candidate_readiness": readiness,
                "gap_score": gap_score,
                "priority": priority,
                "job_count": job_count,
                "course_count": course_count,
                "candidate_count": candidate_count,
            })
            existing.rationale = reasoning.rationale
        db.commit()
        db.refresh(existing)
        return {
            "decision": decision_payload(existing),
            "reasoning": reasoning.model_dump() if reasoning else None,
            "reused": True,
        }

    # --------------------------------------------------------
    # LLM reasoning
    # --------------------------------------------------------

    reasoning = await ReasoningAgent().run(
        {
            "skill": skill.name,
            "category": skill.category,
            "industry_demand": demand,
            "curriculum_coverage": coverage,
            "candidate_readiness": readiness,
            "gap_score": gap_score,
            "priority": priority,
            "job_count": job_count,
            "course_count": course_count,
            "candidate_count": candidate_count,
        }
    )

    # --------------------------------------------------------
    # Persist human-reviewable decision
    # --------------------------------------------------------

    decision = Decision(
        skill_id=skill.id,
        skill=skill.name,
        category=skill.category,
        industry_demand=demand,
        curriculum_coverage=coverage,
        candidate_readiness=readiness,
        gap_score=gap_score,
        priority=priority,
        recommendation=recommendation,
        evidence=evidence,
        rationale=reasoning.rationale,
        status="PROPOSED",
    )

    db.add(decision)
    db.commit()
    db.refresh(decision)

    return {
        "decision": decision_payload(decision),
        "reasoning": reasoning.model_dump(),
        "reused": False,
    }




@router.post("/decisions/generate-batch")
async def generate_decision_batch(
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Orchestrate decision generation for the top N
    Decision Support Agent signals.

    Flow:

    Decision Support Agent
        -> top N skill signals
        -> generate_decision()
        -> LLM reasoning
        -> persistent PROPOSED decisions
    """

    # Get the highest-priority signals from the
    # authoritative Decision Support Agent.
    decision_support = DecisionSupportAgent(db).run(
        limit=limit
    )

    signals = decision_support.get("signals", [])

    generated = []

    for signal in signals:
        skill_id = signal.get("skill_id")

        if not skill_id:
            continue

        # Reuse the existing single-skill orchestration.
        result = await generate_decision(
            DecisionGenerate(skill_id=skill_id),
            db,
        )

        generated.append(result)

    return {
        "requested": limit,
        "generated": sum(1 for item in generated if not item.get("reused")),
        "reused": sum(1 for item in generated if item.get("reused")),
        "source": "Decision Support Agent",
        "decisions": generated,
    }


@router.post("/decisions")
def create_decision(
    payload: DecisionCreate,
    db: Session = Depends(get_db),
):
    """
    Create or update the current decision for a skill.

    Decision records are intentionally idempotent by skill_id.
    Existing human-validation state is preserved.
    """

    existing = db.scalars(
        select(Decision)
        .where(Decision.skill_id == payload.skill_id)
        .order_by(Decision.id.desc())
    ).first()

    if existing:
        existing.skill = payload.skill
        existing.category = payload.category
        existing.industry_demand = payload.industry_demand
        existing.curriculum_coverage = payload.curriculum_coverage
        existing.candidate_readiness = payload.candidate_readiness
        existing.gap_score = payload.gap_score
        existing.priority = payload.priority
        existing.recommendation = payload.recommendation
        existing.evidence = payload.evidence
        existing.rationale = payload.rationale

        # Do NOT reset human-review state automatically.
        db.commit()
        db.refresh(existing)

        return existing

    decision = Decision(
        skill_id=payload.skill_id,
        skill=payload.skill,
        category=payload.category,
        industry_demand=payload.industry_demand,
        curriculum_coverage=payload.curriculum_coverage,
        candidate_readiness=payload.candidate_readiness,
        gap_score=payload.gap_score,
        priority=payload.priority,
        recommendation=payload.recommendation,
        evidence=payload.evidence,
        rationale=payload.rationale,
        status="PROPOSED",
    )

    db.add(decision)
    db.commit()
    db.refresh(decision)

    return decision


@router.get("/decisions")
def list_decisions(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """
    List persistent workforce decisions.

    Optional status filter:
    PROPOSED
    UNDER_REVIEW
    APPROVED
    MODIFIED
    REJECTED
    IMPLEMENTED
    """

    query = select(Decision).order_by(Decision.id.desc())

    if status:
        status = status.upper()

        if status not in VALID_DECISION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid decision status: {status}",
            )

        query = query.where(Decision.status == status)

    decisions = db.scalars(query).all()

    return decisions


@router.get("/decisions/{decision_id}")
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve one decision record.
    """

    decision = db.get(Decision, decision_id)

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    return decision


@router.patch("/decisions/{decision_id}")
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update decision lifecycle status and/or reviewer note.
    """

    decision = db.get(Decision, decision_id)

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    if payload.status is not None:
        new_status = payload.status.upper()

        if new_status not in VALID_DECISION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid decision status: {new_status}",
            )

        if new_status in {"MODIFIED", "REJECTED"} and not (
            payload.reviewer_note or decision.reviewer_note
        ):
            raise HTTPException(
                status_code=422,
                detail="A reviewer note is required when modifying or rejecting a decision.",
            )

        allowed_transitions = {
            "PROPOSED": {"UNDER_REVIEW", "APPROVED", "MODIFIED", "REJECTED"},
            "UNDER_REVIEW": {"APPROVED", "MODIFIED", "REJECTED"},
            "MODIFIED": {"UNDER_REVIEW", "APPROVED", "REJECTED"},
            "APPROVED": {"UNDER_REVIEW"},
            "REJECTED": {"UNDER_REVIEW"},
            "IMPLEMENTED": set(),
        }
        if new_status == "IMPLEMENTED":
            raise HTTPException(
                status_code=409,
                detail="Mark the linked intervention completed to implement this decision.",
            )
        if new_status != decision.status and new_status not in allowed_transitions.get(
            decision.status, set()
        ):
            raise HTTPException(
                status_code=409,
                detail=f"Cannot move a {decision.status} decision to {new_status}.",
            )

        decision.status = new_status

    if payload.reviewer_note is not None:
        decision.reviewer_note = payload.reviewer_note

    db.commit()
    db.refresh(decision)

    return decision


# ============================================================
# INTERVENTION EXECUTION WORKFLOW
# ============================================================

VALID_INTERVENTION_STATUSES = {
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
}


@router.post("/decisions/{decision_id}/intervention")
def create_intervention_from_decision(
    decision_id: int,
    db: Session = Depends(get_db),
):
    """
    Create an operational intervention plan from an
    approved or modified decision.
    """

    decision = db.get(Decision, decision_id)

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    if decision.status not in {
        "APPROVED",
        "MODIFIED",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "An intervention can only be created for "
                "APPROVED or MODIFIED decisions."
            ),
        )

    existing = db.scalar(
        select(Intervention)
        .where(
            Intervention.decision_id == decision_id
        )
    )

    if existing:
        return existing

    if (
        decision.recommendation
        and "curriculum" in decision.recommendation.lower()
    ):
        intervention_type = "CURRICULUM_IMPROVEMENT"

    elif (
        decision.recommendation
        and "upskill" in decision.recommendation.lower()
    ):
        intervention_type = "WORKFORCE_UPSKILLING"

    else:
        intervention_type = "WORKFORCE_MONITORING"

    title = f"{intervention_type.replace('_', ' ').title()} — {decision.skill}"

    objective = (
        f"Address the identified skill gap for {decision.skill} "
        f"using the evidence and recommendation from Decision "
        f"#{decision.id}."
    )

    target = (
        f"Candidates requiring improvement in {decision.skill} "
        f"readiness."
    )

    actions = (
        "1. Identify the target candidate group.\n"
        "2. Assign relevant learning or practical training.\n"
        "3. Conduct a post-intervention assessment.\n"
        "4. Compare readiness against the baseline.\n"
        "5. Record the implementation outcome."
    )

    intervention = Intervention(
        decision_id=decision.id,
        title=title,
        intervention_type=intervention_type,
        objective=objective,
        target=target,
        actions=actions,
        owner="SKILLVERSE Workforce Team",
        status="PLANNED",
    )

    db.add(intervention)
    db.commit()
    db.refresh(intervention)

    return intervention


@router.post("/interventions")
def create_intervention(
    payload: InterventionCreate,
    db: Session = Depends(get_db),
):
    """
    Manually create an intervention plan for a decision.
    """

    decision = db.get(
        Decision,
        payload.decision_id,
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    if decision.status not in {
        "APPROVED",
        "MODIFIED",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Interventions require an APPROVED "
                "or MODIFIED decision."
            ),
        )

    intervention = Intervention(
        decision_id=payload.decision_id,
        title=payload.title,
        intervention_type=payload.intervention_type,
        objective=payload.objective,
        target=payload.target,
        actions=payload.actions,
        owner=payload.owner,
        status="PLANNED",
    )

    db.add(intervention)
    db.commit()
    db.refresh(intervention)

    return intervention


@router.get("/interventions")
def list_interventions(
    status: str | None = None,
    decision_id: int | None = None,
    db: Session = Depends(get_db),
):
    """
    List intervention plans with optional filters.
    """

    query = select(
        Intervention
    ).order_by(
        Intervention.id.desc()
    )

    if status:
        status = status.upper()

        if status not in VALID_INTERVENTION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid intervention status: {status}",
            )

        query = query.where(
            Intervention.status == status
        )

    if decision_id is not None:
        query = query.where(
            Intervention.decision_id == decision_id
        )

    return db.scalars(query).all()


@router.get("/interventions/{intervention_id}")
def get_intervention(
    intervention_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve one intervention plan.
    """

    intervention = db.get(
        Intervention,
        intervention_id,
    )

    if not intervention:
        raise HTTPException(
            status_code=404,
            detail="Intervention not found",
        )

    return intervention


@router.patch("/interventions/{intervention_id}")
def update_intervention(
    intervention_id: int,
    payload: InterventionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update intervention execution state.
    """

    intervention = db.get(
        Intervention,
        intervention_id,
    )

    if not intervention:
        raise HTTPException(
            status_code=404,
            detail="Intervention not found",
        )

    if payload.status is not None:
        new_status = payload.status.upper()

        if new_status not in VALID_INTERVENTION_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid intervention status: "
                    f"{new_status}"
                ),
            )

        intervention.status = new_status

    if payload.outcome is not None:
        intervention.outcome = payload.outcome

    if payload.implementation_note is not None:
        intervention.implementation_note = (
            payload.implementation_note
        )

    if payload.owner is not None:
        intervention.owner = payload.owner

    db.commit()
    db.refresh(intervention)

    # When the operational intervention is completed,
    # synchronize the parent decision lifecycle.
    if intervention.status == "COMPLETED":
        decision = db.get(
            Decision,
            intervention.decision_id,
        )

        if decision:
            decision.status = "IMPLEMENTED"
            db.commit()
            db.refresh(intervention)

    return intervention


# ============================================================
# EVIDENCE LAYER
# ============================================================

@router.get("/final/evidence")
def final_evidence(
    db: Session = Depends(get_db),
):
    """
    Return persisted deterministic evidence records.

    Evidence is the source layer for the downstream
    Skill Gap -> Decision -> Human Validation workflow.
    """

    rows = db.execute(
        text("""
            SELECT
                id,
                skill_id,
                skill,
                category,
                industry_demand,
                curriculum_coverage,
                candidate_readiness,
                gap_score,
                priority,
                job_count,
                course_count,
                candidate_count,
                evidence_text,
                confidence,
                created_at,
                updated_at
            FROM evidence_records
            ORDER BY gap_score DESC, id ASC
        """)
    ).mappings().all()

    return [dict(row) for row in rows]


@router.get("/final/evidence/{skill_id}")
def final_evidence_for_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    """
    Return evidence for one skill.
    """

    row = db.execute(
        text("""
            SELECT
                id,
                skill_id,
                skill,
                category,
                industry_demand,
                curriculum_coverage,
                candidate_readiness,
                gap_score,
                priority,
                job_count,
                course_count,
                candidate_count,
                evidence_text,
                confidence,
                created_at,
                updated_at
            FROM evidence_records
            WHERE skill_id = :skill_id
        """),
        {"skill_id": skill_id},
    ).mappings().first()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found for this skill",
        )

    return dict(row)


# ============================================================
# FINAL SIH ACTION LAYER - COMPATIBILITY ENDPOINTS
# ============================================================

from pydantic import BaseModel
from typing import Optional


# ------------------------------------------------------------
# ACTION LAYER SCHEMAS
# ------------------------------------------------------------

class WhatIfRequest(BaseModel):
    current_training_capacity: float = 0
    projected_market_demand: float = 0
    skill_id: Optional[int] = None
    skill: Optional[str] = None
    intervention: Optional[str] = None


class EmployerValidationRequest(BaseModel):
    decision_id: Optional[int] = None
    skill_id: Optional[int] = None
    skill: Optional[str] = None
    employer: Optional[str] = None
    role: Optional[str] = None
    verdict: Optional[str] = None
    validation_score: Optional[float] = None
    note: Optional[str] = None
    employer_note: Optional[str] = None


# ------------------------------------------------------------
# DECISION EVIDENCE
# ------------------------------------------------------------

@router.get("/decision-evidence/{decision_id}")
def decision_evidence(
    decision_id: int,
    db: Session = Depends(get_db),
):
    """
    Evidence-first view for one decision.
    """

    decision = db.get(Decision, decision_id)

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    return {
        "decision_id": decision.id,
        "skill_id": decision.skill_id,
        "skill": decision.skill,
        "category": decision.category,
        "industry_demand": decision.industry_demand,
        "curriculum_coverage": decision.curriculum_coverage,
        "candidate_readiness": decision.candidate_readiness,
        "gap_score": decision.gap_score,
        "priority": decision.priority,
        "recommendation": decision.recommendation,
        "rationale": decision.rationale,
        "evidence": decision.evidence,
        "confidence": "medium",
        "status": decision.status,
        "reviewer_note": decision.reviewer_note,
    }


# ------------------------------------------------------------
# WHAT-IF SIMULATOR
# ------------------------------------------------------------

@router.post("/simulate/what-if")
def simulate_what_if(
    payload: WhatIfRequest,
):
    """
    Deterministic what-if capacity simulation.

    This intentionally does not use the LLM.
    """

    capacity = max(float(payload.current_training_capacity), 0)
    demand = max(float(payload.projected_market_demand), 0)

    if demand <= 0:
        coverage = 1.0
        capacity_gap = 0.0
    else:
        coverage = min(capacity / demand, 1.0)
        capacity_gap = max(demand - capacity, 0.0)

    projected_capacity = capacity

    intervention = (payload.intervention or "").lower()

    # Deterministic intervention assumptions.
    if "increase" in intervention or "expand" in intervention:
        projected_capacity = capacity * 1.25
    elif "trainer" in intervention:
        projected_capacity = capacity * 1.15
    elif "equipment" in intervention:
        projected_capacity = capacity * 1.10
    elif "upgrade" in intervention:
        projected_capacity = capacity * 1.15

    if demand > 0:
        projected_coverage = min(
            projected_capacity / demand,
            1.0,
        )
    else:
        projected_coverage = 1.0

    projected_gap = max(
        demand - projected_capacity,
        0.0,
    )

    return {
        "simulation": "what-if",
        "skill_id": payload.skill_id,
        "skill": payload.skill,
        "intervention": payload.intervention,
        "current_training_capacity": round(capacity, 4),
        "projected_market_demand": round(demand, 4),
        "current_coverage": round(coverage, 4),
        "current_capacity_gap": round(capacity_gap, 4),
        "projected_training_capacity": round(
            projected_capacity,
            4,
        ),
        "projected_coverage": round(
            projected_coverage,
            4,
        ),
        "projected_capacity_gap": round(
            projected_gap,
            4,
        ),
        "capacity_improvement": round(
            projected_capacity - capacity,
            4,
        ),
        "status": (
            "CAPACITY_ALIGNED"
            if projected_capacity >= demand
            else "CAPACITY_GAP_REMAINS"
        ),
    }


# ------------------------------------------------------------
# EMPLOYER VALIDATION
# ------------------------------------------------------------

@router.post("/final/employer/validate")
def final_employer_validation(
    payload: EmployerValidationRequest,
    db: Session = Depends(get_db),
):
    """
    Record employer validation against a decision.

    Validation is persisted as a decision reviewer note/status
    so the MVP remains auditable without requiring another table.
    """

    decision = None

    if payload.decision_id is not None:
        decision = db.get(
            Decision,
            payload.decision_id,
        )

    if decision is None and payload.skill_id is not None:
        decision = (
            db.query(Decision)
            .filter(
                Decision.skill_id == payload.skill_id
            )
            .order_by(Decision.id.desc())
            .first()
        )

    if decision is None:
        raise HTTPException(
            status_code=404,
            detail="Decision not found for employer validation",
        )

    verdict = (
        payload.verdict or "AGREE"
    ).upper()

    note = (
        payload.note
        or payload.employer_note
        or ""
    )

    employer_name = (
        payload.employer
        or "Employer Reviewer"
    )

    role = payload.role or "Industry Reviewer"

    score = (
        payload.validation_score
        if payload.validation_score is not None
        else 0
    )

    validation_note = (
        f"Employer validation: {verdict}. "
        f"Reviewer: {employer_name}. "
        f"Role: {role}. "
        f"Validation score: {score}. "
        f"Note: {note}"
    )

    decision.reviewer_note = validation_note

    # Employer validation does not automatically mean final approval.
    # Keep the human approval lifecycle explicit.
    if verdict == "REJECT":
        decision.status = "REJECTED"
    elif verdict == "MODIFY":
        decision.status = "MODIFIED"
    else:
        decision.status = "UNDER_REVIEW"

    db.commit()
    db.refresh(decision)

    return {
        "success": True,
        "message": "Employer validation recorded",
        "decision_id": decision.id,
        "skill_id": decision.skill_id,
        "skill": decision.skill,
        "verdict": verdict,
        "validation_score": score,
        "status": decision.status,
        "reviewer_note": decision.reviewer_note,
    }


# ------------------------------------------------------------
# DISTRICT PLAN COMPATIBILITY
# ------------------------------------------------------------

@router.get("/districts")
def list_action_layer_districts(
    db: Session = Depends(get_db),
):
    """
    Lightweight district selector for the Action Center.

    District plans remain generated through the district-plan
    workflow.
    """

    names = db.scalars(
        select(Job.district)
        .where(Job.district.is_not(None))
        .distinct()
        .order_by(Job.district)
    ).all()

    return [
        {
            "id": index,
            "name": name,
            "state": "Rajasthan",
            "sector": "Electric Mobility",
        }
        for index, name in enumerate(names, start=1)
    ]
