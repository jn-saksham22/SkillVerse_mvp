from sqlalchemy import select, func

from app.agents.base import BaseAgent
from app.models.models import Course, CourseSkill, Skill


class CurriculumMapperAgent(BaseAgent):

    name = "Curriculum Mapper Agent"

    description = (
        "Analyzes curriculum coverage of industry-relevant skills."
    )

    def run(self, limit=10):

        query = (
            select(
                Skill.id,
                Skill.name,
                Skill.category,
                func.avg(CourseSkill.coverage).label("coverage"),
                func.count(CourseSkill.course_id).label("course_count"),
            )
            .join(CourseSkill, CourseSkill.skill_id == Skill.id)
            .join(Course, Course.id == CourseSkill.course_id)
            .group_by(
                Skill.id,
                Skill.name,
                Skill.category,
            )
            .order_by(func.avg(CourseSkill.coverage).desc())
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
                    "curriculum_coverage": round(
                        float(row.coverage or 0), 4
                    ),
                    "course_count": int(row.course_count or 0),
                }
            )

        return {
            "agent": self.name,
            "signals": skills,
            "signal_count": len(skills),
        }
