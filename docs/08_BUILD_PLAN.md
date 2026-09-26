# SKILLVERSE — BUILD PLAN

## Phase 0 — Setup
Create:
```text
skillverse/
├── backend/
├── frontend/
├── data/
└── docs/
```

Set environment variables:
```text
DATABASE_URL=
LLM_API_KEY=
```

Never commit secrets.

---

# Phase 1 — Backend skeleton

Build:
- FastAPI app
- PostgreSQL connection
- SQLAlchemy models
- Pydantic schemas
- `/health`

Test:
```text
GET /health → {"status":"ok"}
```

---

# Phase 2 — Seed demo data

Create EV seed dataset.

Minimum:
- 20–100 demo job postings
- 5–10 course modules
- candidate skill records
- 5 core skills

The dataset can initially be JSON/CSV and imported into PostgreSQL.

---

# Phase 3 — Gap Engine

Implement:
```text
demand
curriculum coverage
candidate readiness
gap score
priority
```

Write tests.

Do NOT involve the LLM in numerical calculations.

---

# Phase 4 — AI agents

Implement in this order:

### 1. Market Scout
Job text → skills.

### 2. Skill Intelligence
Skill aliases → canonical skills.

### 3. Curriculum Advisor
Gap → intervention.

### 4. Decision Agent
Simulation → explanation.

Start with direct Python service calls. Add LangGraph only if it genuinely helps.

---

# Phase 5 — API integration

Complete:
```text
/jobs
/skills/extract
/skills/normalize
/gaps/analyze
/gaps
/recommendations
/simulations
/validations
/dashboard/summary
```

---

# Phase 6 — Frontend

Build in this exact order:

1. Dashboard
2. Gap Explorer
3. Gap Detail
4. Recommendation
5. Simulator
6. Validation

Use mock data first, then connect APIs.

---

# Phase 7 — End-to-end integration

Test this exact path:

```text
EV
 ↓
Jobs
 ↓
Extract skills
 ↓
Normalize
 ↓
Calculate demand
 ↓
Compare course
 ↓
Compare candidate
 ↓
BMS priority gap
 ↓
Recommendation
 ↓
20% simulation
 ↓
Validation
```

---

# Phase 8 — Demo hardening

Add:
- loading states
- API error messages
- empty states
- deterministic seed/reset
- audit/evidence display
- responsive layout
- basic logging

Create one guaranteed demo scenario.

---

# Phase 9 — SIH demo

Demo order:

1. Problem
2. Dashboard
3. Industry demand
4. BMS gap
5. Evidence
6. AI recommendation
7. What-if simulation
8. Validation
9. USP

## Final statement

> “SKILLVERSE does not merely tell us which skills are missing. It tells us what to change, what resources that change may require, what happens if we change the capacity, and puts the recommendation through human/industry validation before action.”
