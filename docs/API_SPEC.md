# SKILLVERSE — API Specification (Prelims)

Base URL: `http://localhost:8000/api`. All responses `application/json`. This is the contract the frontend (`DESIGN.md` screens) is built against.

---

### `POST /jobs/ingest`
Batch-load curated job postings (runs the Market Scout + Skill Intelligence pipeline).

**Request**
```json
{
  "domain": "EV Technician",
  "postings": [
    { "source": "curated_batch_1", "raw_text": "Looking for an EV technician skilled in battery diagnostics...", "district_hint": "Pune", "posted_at": "2026-08-01" }
  ]
}
```
**Response `202 Accepted`**
```json
{ "ingested": 42, "job_ids": [101, 102, "..."], "status": "processing" }
```

---

### `GET /skills/demand?district=Pune&role=EV+Technician`
**Response `200`**
```json
{
  "district": "Pune",
  "role": "EV Technician",
  "skills": [
    { "skill": "Battery Diagnostics", "proficiency_required": 82, "trend": 0.34, "job_count": 214 },
    { "skill": "High-Voltage Safety", "proficiency_required": 90, "trend": 0.51, "job_count": 187 }
  ]
}
```

---

### `GET /courses/{id}/gap`
**Response `200`**
```json
{
  "course_id": 12,
  "course_name": "EV Maintenance Fundamentals",
  "gaps": [
    { "skill": "Battery Diagnostics", "industry": 82, "course": 35, "candidate_avg": 28, "gap": 47 },
    { "skill": "High-Voltage Safety", "industry": 90, "course": 20, "candidate_avg": 15, "gap": 70 }
  ]
}
```

---

### `POST /simulate/capacity`
**Request**
```json
{ "district_id": 3, "current_capacity": 2100, "projected_demand": 4500, "scenarios_pct": [10, 30, 50] }
```
**Response `200`**
```json
{
  "district_id": 3,
  "scenarios": [
    { "pct": 10, "new_capacity": 2310, "shortage": 2190, "risk": "Low" },
    { "pct": 30, "new_capacity": 2730, "shortage": 1770, "risk": "Medium" },
    { "pct": 50, "new_capacity": 3150, "shortage": 1350, "risk": "High" }
  ],
  "recommended_pct": 30,
  "rationale": "30% capacity increase gives the best shortage reduction without crossing into high-risk resourcing."
}
```

---

### `GET /recommendations?status=pending_review`
**Response `200`**
```json
{
  "recommendations": [
    {
      "id": 501, "course_id": 12, "skill": "Power BI", "action": "ADD",
      "rationale": "1,842 relevant jobs, 73% mention Power BI, demand +34%, current coverage 18%.",
      "status": "pending_review", "confidence": 91
    }
  ]
}
```

---

### `GET /recommendations/{id}/evidence`
**Response `200`**
```json
{
  "recommendation_id": 501,
  "metrics": [
    { "label": "Relevant job postings", "value": 1842 },
    { "label": "Mention rate", "value": "73%" },
    { "label": "Demand growth", "value": "+34%" },
    { "label": "Current course coverage", "value": "18%" },
    { "label": "Employer validation rate (similar past recs)", "value": "82%" }
  ],
  "confidence": 91
}
```

---

### `POST /employer/review`
**Request**
```json
{ "recommendation_id": 501, "employer_id": 9, "decision": "agree", "comment": "Matches what we're hiring for." }
```
**Response `200`**
```json
{ "recommendation_id": 501, "status": "employer_reviewed", "decision": "agree" }
```
`decision` is one of `agree | modify | reject`. `modify` requires a `proposed_change` string in the body.

---

### `GET /district/{id}/plan`
**Response `200`**
```json
{
  "district": "Pune",
  "growing_roles": ["Data Analyst", "Cloud Engineer", "EV Technician"],
  "skill_gaps": ["Python", "Cloud", "Power BI", "BMS"],
  "course_alignment": { "Data Analytics": 42, "Cloud Computing": 51, "EV Technician": 37 },
  "actions": { "courses_to_update": 8, "trainers_to_upskill": 14, "labs_to_add": 5, "capacity_increase_pct": 23 }
}
```

---

### `POST /candidate/assess`
**Request**
```json
{ "candidate_id": 77, "target_role": "EV Technician" }
```
**Response `200`**
```json
{
  "readiness_score": 47,
  "gaps": [{ "skill": "High-Voltage Safety", "gap": 55 }],
  "pathway": ["Electrical Fundamentals", "Battery Systems", "High-Voltage Safety Cert", "Industry Project", "Assessment"]
}
```

---

### `GET /alerts/oversupply` and `GET /alerts/skill-shock`
**Response `200`** (same shape for both, `type` differs)
```json
{
  "alerts": [
    { "type": "oversupply", "course": "Legacy ICE Mechanics", "demand_trend": -0.68, "supply_trend": 0.20, "placement_trend": -0.42, "severity": "high" },
    { "type": "skill_shock", "skill": "Battery Management Systems", "demand_change": 0.63, "roles_affected": 7, "courses_affected": 12, "districts_affected": 3 }
  ]
}
```

---

## Error format (all endpoints)
```json
{ "error": { "code": "NOT_FOUND", "message": "Course 999 not found" } }
```
Standard status codes: `400` validation, `404` not found, `409` version conflict (e.g. reviewing an already-decided recommendation), `500` server error.

## Auth (Finals-round addition, not required for Prelims)
Bearer token in `Authorization` header; roles: `admin | district_officer | employer | trainer`. Endpoints under `/employer/*` require `employer` or `admin`.
