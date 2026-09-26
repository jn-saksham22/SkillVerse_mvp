# SKILLVERSE — Agent Specifications

Companion to `ARCHITECTURE.md`. Each agent below is a plain Python function/class for Prelims (no agent framework) — see §5 for the orchestration pseudocode. Every agent that touches a number is paired with a deterministic engine; the agent itself never computes the number, only interprets it.

---

## Agent 1 — Market Scout Agent

**Purpose:** Turn raw curated job postings into a clean, deduplicated batch ready for skill extraction.

**Input:** `RawJobPosting[]` — `{source, raw_text, posted_at, district_hint}` from `data/raw/`.

**Processing:**
1. Deduplicate near-identical postings (hash of normalized title + first 200 chars).
2. Tag `role` via keyword/title match against a role taxonomy (`data/seed/roles.csv`).
3. Resolve `district_id` from free-text location using a lookup table.
4. Drop postings older than the configured freshness window (Prelims: no hard cutoff, batch is static).

**Output:** `Job[]` rows inserted into the `jobs` table.

**Tech:** Python, pandas. No LLM calls — this agent is pure data plumbing.

**Pseudocode:**
```python
def run_market_scout(raw_postings: list[dict]) -> list[Job]:
    deduped = dedupe(raw_postings)
    jobs = []
    for p in deduped:
        role = match_role(p["raw_text"], ROLE_TAXONOMY)
        district_id = resolve_district(p.get("district_hint"))
        jobs.append(Job(source=p["source"], raw_text=p["raw_text"],
                         role=role, district_id=district_id, posted_at=p["posted_at"]))
    return jobs
```

---

## Agent 2 — Skill Intelligence Agent

**Purpose:** Extract, normalize, and score the skills implied by each job posting.

**Input:** `Job.raw_text`

**Processing:**
1. **Skill extraction:** spaCy NER (custom-trained or phrase-matcher against a skill gazetteer) finds candidate skill mentions. Ambiguous/uncertain spans are sent to the LLM extractor (prompt below) as a fallback.
2. **Normalization:** each candidate string is embedded (Sentence Transformers, `all-MiniLM-L6-v2` is enough for Prelims) and matched to the nearest canonical skill in `skills`/`skill_aliases` by cosine similarity (threshold ≥ 0.82; below that, flag as `unmatched_skill` for manual review rather than silently guessing).
3. **Proficiency extraction:** rule-based — keywords like "expert", "3+ years", "advanced" map to a 0–100 scale via a fixed lookup table (not LLM-estimated).
4. **Trend tagging:** compare current-period mention frequency for a skill against the prior period (deterministic: `trend = (count_now - count_prev) / max(count_prev, 1)`).

**Output:** `NormalizedSkillDemand[]` — `{job_id, skill_id, proficiency_required, trend}` → `job_skills` table.

**LLM prompt (fallback extractor, used only on low-confidence spans):**
```
SYSTEM:
You are a skill-extraction assistant for a workforce-intelligence system.
Given a job description, extract only concrete, teachable skills (tools,
technologies, certifications, techniques). Do not extract soft traits like
"team player". Return strict JSON: a list of objects with "skill" and
"context_snippet" (the sentence it came from). No commentary, no markdown.

USER:
<job description text>
```

**Tech:** spaCy, Sentence Transformers, scikit-learn (for clustering aliases during dataset prep), LLM API (fallback only).

---

## Agent 3 — Curriculum Advisor Agent

**Purpose:** Turn a course's `CourseGap` records into an ADD/UPGRADE/REDUCE/KEEP recommendation.

**Input:** `CourseGap[]` for one course (from the deterministic Gap Engine — see `ARCHITECTURE.md` §3.4), plus current course metadata (skills taught, hours, projects).

**Processing:** the *classification* (ADD/UPGRADE/REDUCE/KEEP) is deterministic and rule-based, not LLM-guessed:
```python
def classify(skill_gap):
    if skill_gap.course_coverage == 0 and skill_gap.required >= 40:
        return "ADD"
    if skill_gap.gap >= 25:
        return "UPGRADE"
    if skill_gap.required <= 20 and skill_gap.course_coverage >= 40:
        return "REDUCE"
    return "KEEP"
```
The LLM is used only to turn the classified list into a readable rationale, suggested learning hours, project ideas, and trainer/equipment notes — grounded in the numbers it's given, not free-generating them.

**LLM prompt (rationale generation):**
```
SYSTEM:
You are a curriculum advisor. You will be given a list of skill gap
classifications (ADD/UPGRADE/REDUCE/KEEP) with their numeric gap values.
For each one, write a one-sentence rationale a district training officer
could act on, and suggest realistic learning hours and one practical
project idea. Use ONLY the numbers provided — never invent a percentage,
job count, or statistic that wasn't given to you. Return strict JSON.

USER:
Course: {course_name}
Classifications: {json list of {skill, action, required, current, gap}}
```

**Output:** `CurriculumRecommendation[]` (status = `pending_review`) → `curriculum_recommendations` table.

---

## Agent 4 — Decision & Simulation Agent

**Purpose:** Rank intervention options (curriculum-only / curriculum+capacity / new course / trainer upskilling) using the deterministic Capacity Engine's scenario outputs, and explain the trade-offs.

**Input:** `CapacityScenario[]` (from the deterministic Capacity Engine) + `CurriculumRecommendation[]` for the same district/course.

**Processing:** scenario numbers (new capacity, remaining shortage, risk level) are 100% deterministic — see `ARCHITECTURE.md` §3.6 formula. The agent's only job is to rank the given options against a fixed weighted scoring rule and produce a human-readable comparison:
```python
def score(scenario):
    # lower shortage and lower risk is better; capacity cost is a soft penalty
    risk_penalty = {"Low": 0, "Medium": 1, "High": 2}[scenario.risk_level]
    return scenario.shortage * 1.0 + risk_penalty * 500  # tune weights with real data
```
The LLM turns the ranked list into a short comparison narrative for the Evidence Card — again, grounded only in the numbers it receives.

**LLM prompt (comparison narrative):**
```
SYSTEM:
You compare training-capacity intervention scenarios for a government
skilling decision-maker. You will receive a ranked list of scenarios with
their computed capacity, shortage, and risk level. Write a 2-3 sentence
recommendation naming the best option and why, and one sentence on the
main trade-off of the next-best option. Use ONLY the numbers given.

USER:
Scenarios (ranked best to worst): {json list}
```

**Output:** `InterventionOption[]` ranked list, feeding the Evidence Engine.

---

## Evidence Engine (not an "agent" — pure computation)

Confidence score is a weighted deterministic formula, e.g.:
```
confidence = 0.4 * data_volume_score + 0.3 * recency_score + 0.3 * employer_agreement_rate
```
Each sub-score is 0–1, computed from real counts (job volume, days since last data refresh, % of past recommendations of this type that employers approved). Never LLM-estimated.

---

## 5. Orchestration (Prelims — plain sequential Python)

```python
def run_pipeline(domain="EV Technician", district_ids=[...]):
    raw = load_curated_jobs(domain)
    jobs = run_market_scout(raw)
    save(jobs)

    for job in jobs:
        demand = run_skill_intelligence(job)
        save(demand)

    for course in get_courses(domain):
        gaps = gap_engine.compute(course)              # deterministic
        recs = run_curriculum_advisor(gaps, course)     # LLM rationale, rule-based classification
        save(recs)

    for district_id in district_ids:
        scenarios = capacity_engine.simulate(district_id)   # deterministic
        options = run_decision_agent(scenarios, recs)       # LLM narrative, deterministic ranking
        evidence = evidence_engine.build(options)            # deterministic confidence score
        save(options, evidence)

    for rec in pending_recommendations():
        route_to_employer_review(rec)   # human-in-the-loop, no auto-approval
```

**Finals-round note:** if migrating to LangGraph, each function above becomes a node; `run_pipeline` becomes the graph's edges. Only do this if it genuinely simplifies branching/retry logic — see `ARCHITECTURE.md` §8.

## 6. Guardrails for Every Agent

1. Never output a number that wasn't given to it in the prompt/context.
2. Never auto-implement a recommendation — everything lands in `pending_review`.
3. Low-confidence extractions/matches are flagged, not silently guessed.
4. Every LLM call is logged with its exact input, so a recommendation can be traced back to the raw evidence it came from (needed for the "Why?" button).
