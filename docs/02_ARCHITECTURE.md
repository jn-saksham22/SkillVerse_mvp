# SKILLVERSE — ARCHITECTURE

## 1. High-level architecture

```text
                         ┌───────────────────┐
                         │ React Frontend    │
                         │ Dashboard         │
                         └─────────┬─────────┘
                                   │ REST
                                   ↓
                         ┌───────────────────┐
                         │ FastAPI Backend   │
                         │ API + Orchestrator│
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ↓                     ↓                     ↓
      ┌────────────┐       ┌──────────────┐      ┌──────────────┐
      │ PostgreSQL │       │ AI Services  │      │ Gap/Sim      │
      │ Data       │       │ LLM Agents   │      │ Python       │
      └────────────┘       └──────────────┘      └──────────────┘
```

## 2. AI flow

```text
Job descriptions
      ↓
Market Scout
      ↓
Skill Intelligence
      ↓
Canonical Skills
      ↓
Deterministic Gap Engine
      ↓
Curriculum Advisor
      ↓
Decision / Simulation
```

## 3. Agent boundaries

### Market Scout
Unstructured job text → extracted skills.

### Skill Intelligence
Skill names → canonical taxonomy.

### Curriculum Advisor
Verified gap → recommended intervention.

### Decision Agent
Simulation results → human-readable decision summary.

### Orchestrator
Controls sequence and failures.

## 4. Deterministic services
These are NOT AI agents:
- demand aggregation
- curriculum coverage calculation
- candidate readiness calculation
- gap scoring
- capacity calculation
- simulation
- database
- API

## 5. Backend modules

```text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── api/
│   ├── services/
│   │   ├── gap_engine.py
│   │   ├── simulator.py
│   │   ├── demand_service.py
│   │   └── validation_service.py
│   ├── agents/
│   │   ├── market_scout.py
│   │   ├── skill_intelligence.py
│   │   ├── curriculum_advisor.py
│   │   └── decision_agent.py
│   └── orchestrator.py
└── seed/
```

## 6. Frontend modules

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard
│   │   ├── GapExplorer
│   │   ├── Recommendation
│   │   ├── Simulator
│   │   └── Validation
│   ├── components/
│   ├── services/api.js
│   └── App.jsx
```

## 7. Data flow
All recommendations should retain:
- source evidence,
- calculation inputs,
- formula version,
- AI confidence,
- validation state.

This gives the prototype traceability.
