from sqlalchemy import text
from app.db.session import SessionLocal


def main():
    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # Read deterministic skill-gap matrix.
        #
        # We intentionally calculate this from the existing
        # SKILLVERSE database instead of relying on the LLM.
        # ---------------------------------------------------------
        query = text("""
            SELECT
                s.id AS skill_id,
                s.name AS skill,
                s.category AS category,

                COALESCE(
                    AVG(js.demand),
                    0
                ) AS industry_demand,

                COALESCE(
                    AVG(cs.coverage),
                    0
                ) AS curriculum_coverage,

                COALESCE(
                    AVG(csr.readiness),
                    0
                ) AS candidate_readiness

            FROM skills s

            LEFT JOIN job_skills js
                ON js.skill_id = s.id

            LEFT JOIN course_skills cs
                ON cs.skill_id = s.id

            LEFT JOIN candidate_skills csr
                ON csr.skill_id = s.id

            GROUP BY
                s.id,
                s.name,
                s.category

            ORDER BY s.id
        """)

        rows = db.execute(query).mappings().all()

        print(f"Found {len(rows)} skills.")

        evidence_count = 0

        for row in rows:

            skill_id = row["skill_id"]
            skill = row["skill"]
            category = row["category"]

            demand = float(row["industry_demand"] or 0)
            coverage = float(row["curriculum_coverage"] or 0)
            readiness = float(row["candidate_readiness"] or 0)

            # Same conceptual gap calculation already used by
            # the SKILLVERSE deterministic engine.
            gap_score = round(
                0.4 * demand
                + 0.3 * (1 - coverage)
                + 0.3 * (1 - readiness),
                4
            )

            if gap_score >= 0.65:
                priority = "CRITICAL"
            elif gap_score >= 0.50:
                priority = "HIGH"
            elif gap_score >= 0.30:
                priority = "MEDIUM"
            else:
                priority = "LOW"

            job_count = db.execute(
                text("""
                    SELECT COUNT(*)
                    FROM job_skills
                    WHERE skill_id = :skill_id
                """),
                {"skill_id": skill_id},
            ).scalar() or 0

            course_count = db.execute(
                text("""
                    SELECT COUNT(*)
                    FROM course_skills
                    WHERE skill_id = :skill_id
                """),
                {"skill_id": skill_id},
            ).scalar() or 0

            candidate_count = db.execute(
                text("""
                    SELECT COUNT(*)
                    FROM candidate_skills
                    WHERE skill_id = :skill_id
                """),
                {"skill_id": skill_id},
            ).scalar() or 0

            evidence_text = (
                f"{job_count} jobs reference {skill}; "
                f"{course_count} courses cover the skill; "
                f"{candidate_count} candidates assessed. "
                f"Industry demand={demand:.4f}; "
                f"curriculum coverage={coverage:.4f}; "
                f"candidate readiness={readiness:.4f}; "
                f"gap score={gap_score:.4f}."
            )

            # -----------------------------------------------------
            # UPSERT evidence.
            # -----------------------------------------------------
            db.execute(
                text("""
                    INSERT INTO evidence_records (
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
                        updated_at
                    )
                    VALUES (
                        :skill_id,
                        :skill,
                        :category,
                        :industry_demand,
                        :curriculum_coverage,
                        :candidate_readiness,
                        :gap_score,
                        :priority,
                        :job_count,
                        :course_count,
                        :candidate_count,
                        :evidence_text,
                        :confidence,
                        CURRENT_TIMESTAMP
                    )
                    ON CONFLICT (skill_id)
                    DO UPDATE SET
                        skill = EXCLUDED.skill,
                        category = EXCLUDED.category,
                        industry_demand = EXCLUDED.industry_demand,
                        curriculum_coverage = EXCLUDED.curriculum_coverage,
                        candidate_readiness = EXCLUDED.candidate_readiness,
                        gap_score = EXCLUDED.gap_score,
                        priority = EXCLUDED.priority,
                        job_count = EXCLUDED.job_count,
                        course_count = EXCLUDED.course_count,
                        candidate_count = EXCLUDED.candidate_count,
                        evidence_text = EXCLUDED.evidence_text,
                        confidence = EXCLUDED.confidence,
                        updated_at = CURRENT_TIMESTAMP
                """),
                {
                    "skill_id": skill_id,
                    "skill": skill,
                    "category": category,
                    "industry_demand": demand,
                    "curriculum_coverage": coverage,
                    "candidate_readiness": readiness,
                    "gap_score": gap_score,
                    "priority": priority,
                    "job_count": job_count,
                    "course_count": course_count,
                    "candidate_count": candidate_count,
                    "evidence_text": evidence_text,
                    "confidence": "medium",
                },
            )

            evidence_count += 1

        db.commit()

        print(f"Evidence records synchronized: {evidence_count}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
