# SKILLVERSE — GAP ENGINE

## Purpose
Calculate a reproducible priority score from three dimensions:

- D = Industry demand
- C = Curriculum coverage
- R = Candidate readiness

All values are normalized to [0,1].

## Prototype formula

```text
gap_score =
    0.50 × D
  + 0.30 × (1 - C)
  + 0.20 × (1 - R)
```

Weights are configurable.

### Example

```text
D = 0.85
C = 0.30
R = 0.20

gap =
0.50(0.85)
+ 0.30(0.70)
+ 0.20(0.80)

= 0.425 + 0.210 + 0.160
= 0.795
```

Priority:
```text
>= 0.75 → CRITICAL
>= 0.55 → HIGH
>= 0.35 → MEDIUM
< 0.35  → LOW
```

These thresholds are prototype configuration, not official policy.

## Demand score

Prototype:
```text
demand_score =
number_of_relevant_jobs_containing_skill
/
total_relevant_jobs
```

## Curriculum coverage

For MVP:
Use the maximum/weighted coverage of course modules mapped to the skill.

Example:
```text
0 = not covered
0.25 = mentioned
0.50 = basic
0.75 = strong
1.00 = comprehensive/practical
```

## Candidate readiness

For MVP:
Normalize assessment/proficiency to 0–1.

## Required implementation
Create pure functions:

```python
calculate_demand(...)
calculate_curriculum_coverage(...)
calculate_readiness(...)
calculate_gap_score(...)
classify_priority(...)
```

Write unit tests for each.

## Explainability
Store D, C, R, weights and final score. The UI must show why the skill received its priority.
