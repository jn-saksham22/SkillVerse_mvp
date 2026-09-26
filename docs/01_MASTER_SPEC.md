# SKILLVERSE — MASTER PROJECT SPEC
## SIH26134 Functional Prototype

### 1. Product
SKILLVERSE is an agentic decision-support platform for aligning skill-development programs with industry demand.

### 2. USP
**Industry × Curriculum × Candidate → Action**

The system does not stop at identifying a skill gap. It:
1. detects industry demand,
2. compares it with curriculum coverage and candidate readiness,
3. prioritizes the gap,
4. recommends a curriculum/training intervention,
5. simulates resource/capacity impact,
6. sends the recommendation for human/employer validation.

### 3. MVP user journey
```text
Select Sector
  ↓
View Industry Demand
  ↓
AI extracts + normalizes skills
  ↓
Compare Industry × Course × Candidate
  ↓
Priority Skill Gap
  ↓
AI Curriculum Recommendation
  ↓
What-if Simulation
  ↓
Resource / Capacity Impact
  ↓
Approve / Modify / Reject
```

### 4. Flagship demo
Use **EV / Electric Mobility**.

Primary skills:
- Battery Management Systems (BMS)
- Battery Diagnostics
- EV Safety
- Power Electronics
- Vehicle Diagnostics

The prototype dataset may be curated/demo data. Clearly label it as such.

### 5. Product rule
**AI reasons. Python calculates. Humans approve.**

LLM is used for:
- extracting skills,
- semantic normalization,
- curriculum recommendation,
- explanation.

Python/backend is used for:
- scores,
- percentages,
- gap calculations,
- capacity,
- shortage,
- simulation.

### 6. MVP features
- Dashboard
- Job/industry demand data
- AI skill extraction
- Skill normalization
- Three-way gap analysis
- Priority ranking
- AI curriculum recommendation
- Evidence/confidence display
- What-if simulator
- Validation workflow
- Demo reset/seed data

### 7. Do NOT build initially
- Full workforce digital twin
- Skill passport
- Career twin
- employer contract marketplace
- nine independent AI agents
- live scraping as a hard dependency
- complex distributed infrastructure

### 8. Recommended stack
Frontend:
- React
- Tailwind CSS
- Recharts

Backend:
- Python
- FastAPI
- Pydantic
- SQLAlchemy

Database:
- PostgreSQL

AI:
- one LLM provider through a server-side API
- structured JSON outputs

Optional later:
- embeddings/vector database
- LangGraph

### 9. Success condition
A judge must be able to:
1. open EV dashboard,
2. see demand,
3. inspect BMS gap,
4. understand evidence,
5. see AI recommendation,
6. change a simulation parameter,
7. see before/after impact,
8. approve the recommendation.

### 10. Final pitch
> “SKILLVERSE turns changing industry demand into evidence-backed curriculum and training decisions by detecting skill gaps, recommending interventions, simulating their impact, and validating them with industry.”
