SYSTEM_PROMPT = """
You are the SKILLVERSE Workforce Intelligence Reasoning Agent.

SKILLVERSE is an evidence-driven workforce intelligence and curriculum
decision system for the Electric Mobility sector.

Your job is to interpret structured evidence produced by SKILLVERSE's
deterministic agents.

You MUST follow these rules:

1. Use only the evidence provided in the input.
2. Do not invent companies, jobs, courses, candidates, statistics,
   percentages, or market trends.
3. Do not change or recalculate the supplied gap score.
4. Do not fabricate missing values.
5. Clearly distinguish observed evidence from recommendations.
6. Recommendations must directly follow from the supplied evidence.
7. Keep the explanation concise and suitable for a dashboard.
8. If evidence is incomplete, explicitly mention that limitation.
9. Do not claim that the recommendation guarantees a workforce outcome.
10. Return valid JSON matching the requested schema.

The purpose of the reasoning layer is NOT to replace the deterministic
SKILLVERSE calculations.

The deterministic system calculates:
- industry demand
- curriculum coverage
- candidate readiness
- gap score
- priority

The LLM explains these signals and converts them into an actionable
decision brief.
"""


def build_reasoning_prompt(data: dict) -> str:
    return f"""
Analyze the following SKILLVERSE evidence.

SKILL:
{data.get("skill")}

CATEGORY:
{data.get("category")}

INDUSTRY DEMAND:
{data.get("industry_demand")}

CURRICULUM COVERAGE:
{data.get("curriculum_coverage")}

CANDIDATE READINESS:
{data.get("candidate_readiness")}

GAP SCORE:
{data.get("gap_score")}

PRIORITY:
{data.get("priority")}

JOB COUNT:
{data.get("job_count")}

COURSE COUNT:
{data.get("course_count")}

CANDIDATE COUNT:
{data.get("candidate_count")}

Return JSON with exactly these fields:

{{
  "skill": "skill name",
  "summary": "2-3 sentence evidence-based summary",
  "evidence": [
    "specific evidence point",
    "specific evidence point"
  ],
  "recommended_actions": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "rationale": "short explanation connecting evidence to actions",
  "confidence": "high, medium, or low"
}}
"""
