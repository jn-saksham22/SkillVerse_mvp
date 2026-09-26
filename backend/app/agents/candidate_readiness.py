from sqlalchemy import select, func

from app.agents.base import BaseAgent
from app.models.models import Candidate, CandidateSkill, Skill


class CandidateReadinessAgent(BaseAgent):

    name = "Candidate Readiness Agent"

    description = (
        "Analyzes workforce readiness across skills and districts."
    )

    def run(self, district=None, limit=10):

        query = (
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                func.avg(CandidateSkill.readiness).label("readiness"),
                func.count(CandidateSkill.candidate_id).label(
                    "candidate_count"
                ),
            )
            .join(
                CandidateSkill,
                CandidateSkill.skill_id == Skill.id,
            )
            .join(
                Candidate,
                Candidate.id == CandidateSkill.candidate_id,
            )
        )

        if district:
            query = query.where(
                Candidate.district == district
            )

        query = (
            query
            .group_by(
                Skill.id,
                Skill.name,
                Skill.category,
            )
            .order_by(
                func.avg(CandidateSkill.readiness).asc()
            )
            .limit(limit)
        )

        rows = self.db.execute(query).all()

        skills = []

        for row in rows:
            skills.append(
                {
                    "skill_id": row.id,
                    "skill": row.name,
                    "category": row.category,
                    "candidate_readiness": round(
                        float(row.readiness or 0), 4
                    ),
                    "candidate_count": int(
                        row.candidate_count or 0
                    ),
                }
            )

        return {
            "agent": self.name,
            "district": district,
            "signals": skills,
            "signal_count": len(skills),
        }
