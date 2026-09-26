# SKILLVERSE — UI SPEC

## Design direction
Professional SIH technical dashboard:
- white canvas
- dark technical typography
- restrained accent color
- clean borders
- dense architecture/data visuals
- strong cards
- no unnecessary decoration

## Screen 1 — Dashboard

Top cards:
```text
Skills Analyzed | Critical Gaps | Recommendations | Pending Validation
```

Charts:
- Industry skill demand
- Top priority gaps

Filters:
- Sector
- Region
- Course

Primary CTA:
**Analyze Skill Gaps**

---

## Screen 2 — Gap Explorer

Table:

```text
Skill
Demand
Course Coverage
Candidate Readiness
Gap Score
Priority
Evidence
```

Click a row → Gap Detail.

---

## Screen 3 — Gap Detail

Header:
```text
Battery Management Systems
CRITICAL
```

Three large meters:
```text
Industry Demand       85%
Course Coverage       30%
Candidate Readiness   20%
```

Then:
- calculation breakdown
- evidence
- source records
- AI explanation

CTA:
**Generate Curriculum Recommendation**

---

## Screen 4 — Recommendation

Show:
- intervention
- learning objectives
- suggested hours
- practical/lab requirement
- trainer suggestion
- rationale
- AI confidence
- evidence

CTA:
**Run What-If Simulation**

---

## Screen 5 — Simulator

Inputs:
- capacity change %
- trainer ratio
- lab capacity
- projected demand

Outputs:
```text
Before → After
Capacity
Shortage
Trainers
Labs
```

Use a simple before/after chart.

CTA:
**Send for Validation**

---

## Screen 6 — Validation

Show recommendation + evidence + simulation.

Actions:
```text
APPROVE
MODIFY
REJECT
```

Require a comment for Modify/Reject.

---

## Demo UX rule
The full EV demo should be completable in under 3 minutes after data is seeded.
