# SKILLVERSE — FASTAPI API SPEC

Base:
`/api`

## Health
`GET /health`

Response:
```json
{"status":"ok"}
```

## Dashboard

`GET /dashboard/summary`

```json
{
  "skills_analyzed": 25,
  "critical_gaps": 3,
  "recommendations": 3,
  "pending_validations": 2
}
```

## Jobs

`GET /jobs`

`POST /jobs`

```json
{
  "title": "EV Technician",
  "sector": "EV",
  "region": "Maharashtra",
  "description": "..."
}
```

## AI extraction

`POST /skills/extract`

Input:
```json
{
  "job_id": "JOB001"
}
```

## Skill normalization

`POST /skills/normalize`

Input:
```json
{
  "skills": ["BMS", "Battery Management System"]
}
```

## Gap analysis

`POST /gaps/analyze`

Input:
```json
{
  "sector": "EV",
  "course_id": "COURSE001"
}
```

Response:
```json
{
  "skill": "Battery Management Systems",
  "demand_score": 0.85,
  "curriculum_score": 0.30,
  "candidate_readiness": 0.20,
  "gap_score": 0.80,
  "priority": "CRITICAL"
}
```

## Gap list

`GET /gaps?sector=EV`

## Recommendation

`POST /recommendations/{gap_id}`

`GET /recommendations/{id}`

## Simulation

`POST /simulations`

Input:
```json
{
  "recommendation_id": "REC001",
  "capacity_change_percent": 20
}
```

Response:
```json
{
  "baseline_capacity": 1000,
  "new_capacity": 1200,
  "projected_demand": 1400,
  "remaining_shortage": 200,
  "trainers_required": 12,
  "labs_required": 3
}
```

## Validation

`POST /validations`

```json
{
  "recommendation_id": "REC001",
  "reviewer_type": "employer",
  "decision": "approved",
  "comment": "Suitable for practical training."
}
```

## Security
AI API keys must remain server-side. Do not expose keys in React.
