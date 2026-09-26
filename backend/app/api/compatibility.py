from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Decision
from app.final_features.models import EmployerValidation
from app.models.models import JobSkill, CourseSkill, CandidateSkill


router = APIRouter(tags=["Frontend Compatibility"])


# ------------------------------------------------------------
# DECISION EVIDENCE
# ------------------------------------------------------------

@router.get("/decisions/{decision_id}/evidence")
def legacy_decision_evidence(
    decision_id: int,
    db: Session = Depends(get_db),
):
    """
    Compatibility alias.

    Frontend may use either:

        /decision-evidence/{id}

    or:

        /decisions/{id}/evidence
    """

    decision = db.get(Decision, decision_id)

    if decision is None:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    job_count = db.scalar(
        select(func.count(JobSkill.id)).where(JobSkill.skill_id == decision.skill_id)
    ) or 0
    course_count = db.scalar(
        select(func.count(CourseSkill.id)).where(CourseSkill.skill_id == decision.skill_id)
    ) or 0
    candidate_count = db.scalar(
        select(func.count(CandidateSkill.id)).where(CandidateSkill.skill_id == decision.skill_id)
    ) or 0
    validations = db.scalars(
        select(EmployerValidation)
        .where(EmployerValidation.decision_id == decision_id)
        .order_by(EmployerValidation.id.desc())
    ).all()

    evidence_items = [
        {"label": "Jobs referencing skill", "value": job_count, "source": "job_skills"},
        {"label": "Courses covering skill", "value": course_count, "source": "course_skills"},
        {"label": "Candidates assessed", "value": candidate_count, "source": "candidate_skills"},
        {"label": "Industry demand", "value": decision.industry_demand, "source": "deterministic aggregation"},
        {"label": "Curriculum coverage", "value": decision.curriculum_coverage, "source": "course evidence"},
        {"label": "Candidate readiness", "value": decision.candidate_readiness, "source": "candidate evidence"},
        {"label": "Gap score", "value": decision.gap_score, "source": "deterministic gap engine"},
    ]
    completeness = sum(
        value is not None
        for value in (
            decision.industry_demand,
            decision.curriculum_coverage,
            decision.candidate_readiness,
        )
    ) / 3
    employer_scores = [item.confidence for item in validations]
    confidence = (
        0.7 * completeness + 0.3 * (sum(employer_scores) / len(employer_scores))
        if employer_scores else completeness
    )
    confidence = round(max(0.0, min(1.0, confidence)), 3)

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
        "evidence": evidence_items,
        "confidence": confidence,
        "confidence_percent": round(confidence * 100, 1),
        "confidence_label": "HIGH" if confidence >= .8 else "MEDIUM" if confidence >= .6 else "LOW",
        "employer_validations": [
            {
                "id": item.id,
                "employer_name": item.employer_name,
                "skill": item.skill,
                "feedback": item.feedback,
                "validated": item.validated,
                "confidence": item.confidence,
            }
            for item in validations
        ],
        "status": decision.status,
        "reviewer_note": decision.reviewer_note,
    }
