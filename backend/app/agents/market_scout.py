from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.agents.base import BaseAgent
from app.models.models import Job, JobSkill, Skill


class MarketScoutAgent(BaseAgent):

    name = "Market Scout Agent"

    description = (
        "Analyzes industry job demand across skills, districts and companies."
    )

    def run(self, district=None, limit=10):

        query = (
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                func.avg(JobSkill.demand).label("demand"),
                func.count(JobSkill.job_id).label("job_count"),
            )
            .join(JobSkill, JobSkill.skill_id == Skill.id)
            .join(Job, Job.id == JobSkill.job_id)
        )

        if district:
            query = query.where(Job.district == district)

        query = (
            query
            .group_by(Skill.id, Skill.name, Skill.category)
            .order_by(func.avg(JobSkill.demand).desc())
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
                    "industry_demand": round(float(row.demand or 0), 4),
                    "job_count": int(row.job_count or 0),
                }
            )

        return {
            "agent": self.name,
            "district": district,
            "signals": skills,
            "signal_count": len(skills),
        }
