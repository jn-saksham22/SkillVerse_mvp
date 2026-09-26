# SKILLVERSE — MVP Build

Evidence-first agentic workforce intelligence and curriculum decision system.

## Prototype capabilities
- Evidence dashboard with industry demand, curriculum coverage, candidate readiness, and ranked gaps
- Curated job intake with deterministic matching to the canonical EV skill catalog
- Curriculum action recommendations and capacity what-if scenarios
- Decision generation with optional Gemini explanations and a deterministic fallback
- Reviewer and employer validation, intervention tracking, and district training plans
- PostgreSQL persistence with an idempotent demo seed script

## Run
### 1. Database
```bash
docker compose up -d --wait postgres
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp -n .env.example .env
uvicorn app.main:app --reload --port 8000
```

In a second terminal, seed the demo dataset once:
```bash
cd backend
source .venv/bin/activate
python -m scripts.seed_database
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Verify
Run these from their respective directories:
```bash
# backend/
PYTHONPATH=. python -m pytest -q

# frontend/
npm run smoke:pages
npm run build
```

`smoke:pages` server-renders each active page to catch runtime rendering
errors that a successful production build cannot detect.

The backend loads `GEMINI_API_KEY` from `backend/.env`. Leave it blank to use
the deterministic fallback reasoning; never commit API credentials.

API docs: http://localhost:8000/docs

## Deploy
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the Docker Compose deployment,
TLS reverse proxy setup, backups, and security limitations.

## Prototype scope
The included dataset is curated demonstration data. Job skill matching uses a
known-skill dictionary and flags descriptions with no catalog matches; it does
not scrape live postings or claim open-ended AI extraction. Gemini is optional
and only explains deterministic evidence. This local prototype does not include
user authentication or production deployment controls.

## Guardrail
AI reasons; Python calculates; humans approve.
