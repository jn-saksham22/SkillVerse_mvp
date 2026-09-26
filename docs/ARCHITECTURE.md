# SKILLVERSE — Structural & Architectural Specification
### SIH26134 · Prelims MVP + Full Hackathon Implementation

---

## 1. Scope of This Document

This is the engineering-level companion to the solution blueprint. It covers:
- System architecture (logical + physical)
- Data model / database schema
- API design
- Repository / folder structure
- Agent implementation details
- **Prelims build** (what is actually coded and demoed now)
- **Full/Finals-round build** (what gets added if selected beyond Prelims)

---

## 2. Logical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                              │
│   Curated job postings · Course catalog · Candidate records ·    │
│   Employer inputs · Placement/outcome data                       │
└───────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT LAYER                                │
│  Market Scout → Skill Intelligence → Curriculum Advisor →         │
│  Decision & Simulation                                            │
└───────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       ENGINE LAYER                                 │
│  Gap Engine (deterministic) · Capacity Engine (deterministic) ·   │
│  Evidence Engine · Simulation Engine                               │
└───────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER (FastAPI)                    │
│  REST API · Auth · Orchestration · Caching                        │
└───────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (React)                      │
│  Dashboards · Gap Explorer · Simulator UI · Employer Review ·     │
│  District Plan Viewer                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Market Scout Agent
- **Input:** raw curated job postings (CSV/JSON batches for Prelims)
- **Process:** filters/dedupes postings, tags role + location + posting date
- **Output:** structured `RawJobPosting` records → passed to Skill Intelligence Agent
- **Tech:** Python service, pandas for batch processing

### 3.2 Skill Intelligence Agent
- **Input:** `RawJobPosting.description`
- **Process:**
  1. Role extraction (rule-based + LLM classification)
  2. Skill extraction (spaCy NER + LLM extraction fallback)
  3. Skill normalization (Sentence Transformers embedding similarity against a canonical skill list, e.g. "PowerBI"/"Microsoft Power BI" → `POWER_BI`)
  4. Proficiency extraction (keyword/context heuristics → 0–100 scale)
  5. Location mapping (district lookup table)
- **Output:** `NormalizedSkillDemand(role, district, skill_id, proficiency_required, trend)`
- **Tech:** spaCy, Sentence Transformers, scikit-learn (clustering for normalization), LLM API for ambiguous cases

### 3.3 Skill Knowledge Graph
- Prelims: a relational table (`skills`, `skill_aliases`, `skill_relations`) — not a full graph DB
- Finals/scale: optional migration to a graph store or `pgvector`-backed semantic index for large-scale synonym/relation lookups

### 3.4 Gap Engine (deterministic)
- **Input:** industry proficiency requirement, course coverage, candidate level (all 0–100)
- **Formula:** `gap = required - current` (per skill, per entity)
- **Output:** `CourseGap`, `CandidateGap`, `OutcomeGap` records
- No LLM involvement — pure computation, fully auditable

### 3.5 Curriculum Advisor Agent
- **Input:** `CourseGap` records + course metadata
- **Process:** LLM-assisted classification into ADD / UPGRADE / REDUCE / KEEP, plus suggested learning hours, projects, assessments, trainer/equipment needs
- **Output:** `CurriculumRecommendation` draft (status = `pending_review`)

### 3.6 Capacity Engine (deterministic)
- **Input:** current training capacity, projected demand
- **Formula:** for each scenario `x%`: `new_capacity = capacity * (1 + x/100)`, `shortage = demand - new_capacity`
- **Output:** `CapacityScenario[]` with risk classification (rule-based thresholds, not ML)

### 3.7 Decision & Simulation Agent
- **Input:** candidate interventions (A/B/C/D) + their `CapacityScenario` / `CurriculumRecommendation` outputs
- **Process:** LLM ranks/explains trade-offs using the deterministic outputs as grounding (never generates its own numbers)
- **Output:** ranked `InterventionOption[]` with rationale

### 3.8 Evidence Engine
- Aggregates the supporting numbers (job counts, % mentions, demand growth, coverage, employer validation %) behind every recommendation
- **Output:** `EvidenceCard(recommendation_id, metrics[], confidence_score)`
- Confidence score: weighted deterministic formula (e.g. data volume × recency × employer agreement), not an LLM-generated number

### 3.9 Employer Review / Human-in-the-Loop
- Simple review queue: recommendation → employer marks Agree / Modify / Reject → status updates
- Prelims: simulated employer accounts (seeded reviewer users); Finals: real employer login/portal

### 3.10 District Action Plan Generator
- Aggregates approved recommendations + capacity scenarios by district
- **Output:** `DistrictPlan(district_id, courses_to_update[], trainers_to_upskill, labs_to_add, capacity_increase_pct)`

---

## 4. Data Model (Core Tables)

```
skills(id, name, canonical_name, category)
skill_aliases(id, skill_id, alias_text)

jobs(id, source, raw_text, role, district_id, posted_at)
job_skills(job_id, skill_id, proficiency_required, trend)

courses(id, name, district_id, version, status)
course_skills(course_id, skill_id, coverage_score)

candidates(id, district_id, qualification)
candidate_skills(candidate_id, skill_id, proficiency_level)

districts(id, name, region)

gap_records(id, entity_type[industry|course|candidate], skill_id,
            required_score, current_score, gap_value, computed_at)

curriculum_recommendations(id, course_id, action[ADD|UPGRADE|REDUCE|KEEP],
                            skill_id, rationale, status, created_by_agent)

capacity_scenarios(id, district_id, scenario_pct, new_capacity,
                    shortage, risk_level)

evidence_cards(id, recommendation_id, metrics_json, confidence_score)

employer_reviews(id, recommendation_id, employer_id, decision, comment, reviewed_at)

district_plans(id, district_id, generated_at, summary_json, status)

curriculum_versions(id, course_id, version_number, changelog, approved_at)
```

---

## 5. API Design (FastAPI — Prelims Set)

```
POST   /api/jobs/ingest                 — batch-load curated job postings
GET    /api/skills/demand               — ?district=&role=  → demand table
GET    /api/courses/{id}/gap            — three-way gap for a course
POST   /api/simulate/capacity           — {district_id, scenarios[]} → CapacityScenario[]
GET    /api/recommendations             — ?status=pending_review
GET    /api/recommendations/{id}/evidence
POST   /api/employer/review             — {recommendation_id, decision, comment}
GET    /api/district/{id}/plan
POST   /api/candidate/assess            — {candidate_id, target_role} → readiness + pathway
GET    /api/alerts/oversupply           — obsolete/oversupplied course list
GET    /api/alerts/skill-shock          — sudden demand-spike alerts
```

**Finals/scale additions:** auth endpoints (`/api/auth/*`), employer portal endpoints, admin endpoints for curriculum versioning approval, webhook endpoints for scheduled data refresh.

---

## 6. Repository Structure

```
skillverse/
├── frontend/                       # React app
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── SkillGapExplorer.jsx
│       │   ├── CapacitySimulator.jsx
│       │   ├── EmployerReview.jsx
│       │   └── DistrictPlan.jsx
│       ├── components/
│       │   ├── EvidenceCard.jsx
│       │   ├── GapChart.jsx          # Recharts
│       │   └── ScenarioTable.jsx
│       └── api/                     # API client wrappers
│
├── backend/                        # FastAPI app
│   └── app/
│       ├── agents/
│       │   ├── market_scout.py
│       │   ├── skill_intelligence.py
│       │   ├── curriculum_advisor.py
│       │   └── decision_simulation.py
│       ├── engines/
│       │   ├── gap_engine.py         # deterministic
│       │   ├── capacity_engine.py    # deterministic
│       │   └── evidence_engine.py
│       ├── models/                   # SQLAlchemy models (tables above)
│       ├── api/                      # routers per resource
│       ├── services/                 # orchestration glue
│       └── core/                     # config, db session, settings
│
├── ml/
│   ├── skill_extraction/             # spaCy pipeline, NER model
│   ├── normalization/                # Sentence-Transformers matcher
│   └── prompts/                      # LLM prompt templates (versioned)
│
├── data/
│   ├── raw/                          # curated source datasets
│   └── seed/                         # seed scripts for demo DB
│
└── docs/
    ├── SIH26134_SKILLVERSE_Final_Solution.md
    ├── SIH26134_SKILLVERSE_PPT_Slides.md
    └── SIH26134_SKILLVERSE_Architecture.md   (this file)
```

---

## 7. Prelims Implementation Plan

**Goal:** one complete, defensible vertical slice — EV Technician domain only.

| Item | Prelims decision |
|---|---|
| Domain | EV Technician only |
| Dataset | 10K–50K curated job records (static batch load, not live scraping) |
| Districts | 2–3 sample districts |
| Courses | 5–10 sample courses |
| Orchestration | Plain sequential Python calls between agents — no agent framework |
| Auth | Minimal/seeded users (no real employer onboarding) |
| Skill Knowledge Graph | Flat relational tables, not a graph DB |
| Simulation | 3 fixed capacity scenarios (+10/+30/+50%) |
| Employer review | Simulated reviewer accounts with Agree/Modify/Reject |
| Deployment | Single-instance deployment (e.g. Render/Railway + Vercel), no scaling infra |

**Demo path:** ingest sample data → run pipeline once (batch) → walk through Dashboard → Gap Explorer → Simulator → Evidence Card → Employer Review → District Plan, end to end, live.

---

## 8. Full Hackathon / Finals Implementation Plan

If advancing beyond Prelims, extend along these axes — each is additive, not a rewrite:

| Item | Finals-round extension |
|---|---|
| Domain | Add 2–3 more sectors beyond EV Technician (e.g. Data Analytics, Cloud) |
| Dataset | Larger curated corpus; scheduled batch refresh job (still not unverified "real-time" scraping) |
| Districts | Expand to a representative set across Maharashtra |
| Orchestration | Migrate to LangGraph (or equivalent) only where it measurably simplifies agent hand-offs |
| Auth | Real employer accounts, role-based access (admin / district officer / employer / trainer) |
| Skill Knowledge Graph | Migrate skill relations to `pgvector`-backed semantic index for faster large-scale matching |
| Skill Shock Detection | Live trigger workflow — a demand-spike crosses threshold → auto-opens a curriculum review task |
| Curriculum Versioning | Full v1.0 → v1.1 → v1.2 changelog + approval workflow in the UI |
| Candidate Module | Full readiness scoring + pathway recommendations at scale, candidate self-service portal |
| Notifications | Email/SMS alerts to district officers on oversupply/skill-shock alerts |
| Deployment | Containerized (Docker) services, managed Postgres, basic horizontal scaling for API layer |

**Explicitly still deferred beyond Finals (Phase 2 vision only):** full workforce digital twin, advanced forecasting models, live government API integrations, Skill Passport, Career Twin, blockchain certificates, voice assistant, large-scale automated employer outreach.

---

## 9. Design Principles Carried Through Both Phases

1. **Deterministic math, AI reasoning** — every score/percentage traceable to a formula, never an LLM guess (Section 7 of the solution doc)
2. **Human-in-the-loop is mandatory** — no recommendation auto-implements without employer + human approval
3. **Evidence-first** — every recommendation must carry its supporting metrics and a confidence score
4. **Honest data labeling** — curated/available data is always visually distinguished from future/planned integrations, in both the UI and the pitch
5. **Vertical-slice discipline** — new scope is only added once the current slice works end-to-end
