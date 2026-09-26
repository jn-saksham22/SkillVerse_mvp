# SKILLVERSE — SIH26134
### Agentic Workforce Intelligence & Curriculum Decision System

Government of Maharashtra PS: *Challenges in aligning skill development programs with industry requirements and emerging job market demands.*

---

## Documentation Index

| File | What it's for |
|---|---|
| `CONVERSATION_LOG.md` | How the team got here — problem, direction decision, key choices |
| `SIH26134_SKILLVERSE_Final_Solution.md` | Full solution narrative |
| `ARCHITECTURE.md` | System components, repo structure, Prelims-vs-Finals build plan |
| `AGENTS.md` | The 4 agents — inputs, outputs, prompts, pseudocode |
| `DESIGN.md` | UI/UX design system and screen-by-screen spec |
| `API_SPEC.md` | REST API contract with request/response examples |
| `DATABASE_SEED.md` | SQL schema + sample seed data for the EV Technician slice |
| `SKILLVERSE_SIH26134_Final_PPT.pptx` | The pitch deck |

Read them in that order if you're new to the project.

---

## Prerequisites

- Node.js ≥ 18, npm
- Python ≥ 3.10
- PostgreSQL ≥ 14
- An LLM API key (for the Skill Intelligence fallback extractor, Curriculum Advisor, and Decision Agent prompts in `AGENTS.md`)

## Repo Structure

See `ARCHITECTURE.md` §6 for the full tree. Quick summary:
```
skillverse/
├── frontend/   # React app (DESIGN.md screens)
├── backend/    # FastAPI app (API_SPEC.md endpoints)
├── ml/         # skill extraction / normalization / prompt templates
├── data/       # raw + seed data (DATABASE_SEED.md)
└── docs/       # this documentation set
```

## Backend Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary spacy sentence-transformers scikit-learn python-dotenv
python -m spacy download en_core_web_sm
cp .env.example .env   # fill in DATABASE_URL and LLM_API_KEY
uvicorn app.main:app --reload --port 8000
```

**`.env.example`**
```
DATABASE_URL=postgresql://skillverse:skillverse@localhost:5432/skillverse
LLM_API_KEY=your_key_here
LLM_MODEL=your_model_name
ENV=development
```

## Database Setup

```bash
createdb skillverse
psql skillverse -f docs/DATABASE_SEED.md   # or extract the SQL blocks into a .sql file first
```
(The SQL is embedded in `DATABASE_SEED.md` as fenced code blocks — extract to `schema.sql` and `seed.sql` for a real repo rather than piping the markdown directly.)

## Frontend Setup

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```
Point the frontend's API base URL (`.env` → `VITE_API_BASE_URL`) at `http://localhost:8000/api`.

## Running the Prelims Demo Pipeline

1. Start Postgres, load schema + seed data (above).
2. Start the backend.
3. `POST /jobs/ingest` with the sample postings from `DATABASE_SEED.md` §2 (or via the Dashboard's ingest action once built).
4. Open the frontend → Dashboard → Skill Gap Explorer → Capacity Simulator → Curriculum Recommendations → Employer Review → District Plan, in that order — this is the exact demo path described in `CONVERSATION_LOG.md` and the pitch deck.

## Design Principle Reminder

Every score, gap, and simulation number is deterministic code — never LLM-invented. See `AGENTS.md` §6 "Guardrails" before adding any new agent behavior.

## Current Status / Next Steps

See `CONVERSATION_LOG.md` §9 for the live open-items list (Team ID/Name on the deck, comparison-table verification, and actually standing up this Prelims slice).
