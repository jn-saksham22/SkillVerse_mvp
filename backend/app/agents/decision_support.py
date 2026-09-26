from sqlalchemy import select, func

from app.agents.base import BaseAgent
from app.models.models import (
    Skill,
    JobSkill,
    CourseSkill,
    CandidateSkill,
)
from app.engines.gap_engine import priority_gap, priority_label


class DecisionSupportAgent(BaseAgent):

    name = "Decision Support Agent"

    description = (
        "Combines industry demand, curriculum coverage and "
        "candidate readiness to identify workforce intervention priorities."
    )

    def run(self, limit=10):

        skills = self.db.scalars(
            select(Skill).order_by(Skill.id)
        ).all()

        results = []

        for skill in skills:

            demand = self.db.scalar(
                select(func.avg(JobSkill.demand))
                .where(JobSkill.skill_id == skill.id)
            )

            coverage = self.db.scalar(
                select(func.avg(CourseSkill.coverage))
                .where(CourseSkill.skill_id == skill.id)
            )

            readiness = self.db.scalar(
                select(func.avg(CandidateSkill.readiness))
                .where(CandidateSkill.skill_id == skill.id)
            )

            demand = float(demand) if demand is not None else None
            coverage = float(coverage) if coverage is not None else None
            readiness = float(readiness) if readiness is not None else None

            if (
                demand is not None
                and coverage is not None
                and readiness is not None
            ):
                gap = priority_gap(
                    demand,
                    coverage,
                    readiness,
                )

                priority = priority_label(gap)

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
                gap = None
                priority = "INSUFFICIENT_DATA"

                recommendation = (
                    "Collect additional evidence before making "
                    "a workforce decision."
                )

            results.append(
                {
                    "skill_id": skill.id,
                    "skill": skill.name,
                    "category": skill.category,
                    "industry_demand": (
                        round(demand, 4)
                        if demand is not None else None
                    ),
                    "curriculum_coverage": (
                        round(coverage, 4)
                        if coverage is not None else None
                    ),
                    "candidate_readiness": (
                        round(readiness, 4)
                        if readiness is not None else None
                    ),
                    "gap_score": gap,
                    "priority": priority,
                    "recommendation": recommendation,
                }
            )

        results.sort(
            key=lambda x: (
                x["gap_score"] is None,
                -(x["gap_score"] or 0),
            )
        )

        return {
            "agent": self.name,
            "signals": results[:limit],
            "total_skills_analyzed": len(results),
        }
