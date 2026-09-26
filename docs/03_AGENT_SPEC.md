# SKILLVERSE — AGENT SPECIFICATION

## General agent rules

Every agent must:
- receive structured input,
- return structured JSON,
- include confidence where appropriate,
- preserve evidence IDs,
- never fabricate sources,
- never invent numerical facts,
- fail explicitly when evidence is insufficient.

---

# Agent 1 — MARKET SCOUT

## Purpose
Extract skills and role information from job postings.

## Input
```json
{
  "job_id": "JOB001",
  "title": "EV Technician",
  "description": "...",
  "sector": "EV",
  "region": "Maharashtra"
}
```

## Output
```json
{
  "job_id": "JOB001",
  "skills": [
    {
      "name": "Battery Management System",
      "confidence": 0.94
    }
  ],
  "evidence_ids": ["JOB001"]
}
```

## System prompt
```text
You are the Market Scout Agent.
Extract only skills explicitly or strongly supported by the supplied job text.
Do not invent skills.
Return valid JSON.
For every extracted skill provide confidence and preserve the job ID as evidence.
Separate technical skills from soft skills when possible.
```

---

# Agent 2 — SKILL INTELLIGENCE

## Purpose
Map aliases to canonical skills.

## Input
```json
{
  "skills": ["BMS", "Battery Management System", "Battery Diagnostics"]
}
```

## Output
```json
{
  "mappings": [
    {
      "input": "BMS",
      "canonical": "Battery Management Systems",
      "confidence": 0.98
    }
  ]
}
```

## System prompt
```text
You are the Skill Intelligence Agent.
Normalize skill names to a canonical skill taxonomy.
Merge obvious aliases but do not merge unrelated skills.
Return JSON.
If confidence is below the configured threshold, mark the mapping for human review.
```

---

# Agent 3 — CURRICULUM ADVISOR

## Purpose
Turn a verified priority gap into a practical intervention.

## Input
```json
{
  "skill": "Battery Management Systems",
  "demand_score": 0.85,
  "curriculum_score": 0.30,
  "candidate_readiness": 0.20,
  "evidence_ids": ["JOB001", "COURSE007"]
}
```

## Output
```json
{
  "skill": "Battery Management Systems",
  "intervention": "Add BMS diagnostics practical module",
  "learning_objectives": [
    "Understand BMS architecture",
    "Diagnose common BMS faults"
  ],
  "suggested_hours": 40,
  "lab_required": true,
  "rationale": "High demand with weak curriculum coverage.",
  "confidence": 0.88,
  "evidence_ids": ["JOB001", "COURSE007"]
}
```

## System prompt
```text
You are the Curriculum Advisor Agent.
Recommend a realistic curriculum or training intervention for the supplied verified skill gap.
Use only the evidence provided.
Clearly mark resource quantities and hours as recommendations/assumptions unless supported by source data.
Do not claim that your recommendation is an official government standard.
Return valid JSON.
```

---

# Agent 4 — DECISION AGENT

## Purpose
Explain deterministic simulation results.

## Input
```json
{
  "baseline_capacity": 1000,
  "capacity_change_percent": 20,
  "new_capacity": 1200,
  "projected_demand": 1400,
  "remaining_shortage": 200
}
```

## Output
```json
{
  "summary": "Capacity increases from 1000 to 1200 learners, reducing the remaining shortage to 200.",
  "tradeoffs": [
    "Additional trainer/lab resources may be required."
  ],
  "next_action": "Send intervention for expert validation."
}
```

## System prompt
```text
You are the Decision Agent.
Explain the supplied deterministic calculations.
Do not change, reinterpret, or invent numerical results.
Clearly state assumptions.
Return concise decision-ready JSON.
```

---

# ORCHESTRATOR

```text
1. Receive sector/data request
2. Run Market Scout
3. Run Skill Intelligence
4. Aggregate demand
5. Calculate curriculum coverage
6. Calculate candidate readiness
7. Calculate gap
8. If priority gap exists, call Curriculum Advisor
9. Run deterministic simulator
10. Call Decision Agent
11. Create validation package
```

If an agent fails, show the failure and preserve the original evidence. Never fabricate a fallback answer.
