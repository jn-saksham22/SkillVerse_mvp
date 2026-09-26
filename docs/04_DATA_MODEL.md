# SKILLVERSE — DATA MODEL

## MVP database tables

### skills
```text
id
canonical_name
category
aliases_json
created_at
```

### job_postings
```text
id
title
sector
region
description
source
published_at
```

### job_skills
```text
id
job_id
skill_id
confidence
evidence_text
```

### courses
```text
id
name
institution
sector
region
```

### course_modules
```text
id
course_id
title
description
hours
coverage_level
```

`coverage_level` is normalized to 0–1.

### candidates
```text
id
course_id
anonymous_label
```

### candidate_skills
```text
id
candidate_id
skill_id
proficiency
evidence
```

`proficiency` is normalized to 0–1.

### skill_gaps
```text
id
skill_id
sector
demand_score
curriculum_score
readiness_score
gap_score
priority
evidence_json
created_at
```

### recommendations
```text
id
gap_id
intervention
learning_hours
trainer_count
lab_requirement
rationale
confidence
status
created_at
```

### simulations
```text
id
recommendation_id
baseline_capacity
capacity_change_percent
new_capacity
projected_demand
remaining_shortage
trainers_required
labs_required
assumptions_json
created_at
```

### validations
```text
id
recommendation_id
reviewer_type
decision
comment
created_at
```

## Demo seed

Sector: EV.

Skills:
- Battery Management Systems
- Battery Diagnostics
- EV Safety
- Power Electronics
- Vehicle Diagnostics

Use clearly labelled curated/demo values.

## Example relationships

```text
JobPosting → JobSkill → Skill
Course → CourseModule → Skill coverage
Candidate → CandidateSkill → Skill readiness
Skill → SkillGap → Recommendation → Simulation → Validation
```
