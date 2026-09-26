# SKILLVERSE — Database Schema & Seed Data (Prelims)

PostgreSQL. Run in order. Table shapes match `ARCHITECTURE.md` §4, expanded here with real column types and sample seed rows for the EV Technician vertical slice.

---

## 1. Schema

```sql
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100)
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  canonical_name VARCHAR(150) NOT NULL,
  category VARCHAR(80)
);

CREATE TABLE skill_aliases (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  alias_text VARCHAR(150) NOT NULL
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100),
  raw_text TEXT NOT NULL,
  role VARCHAR(150),
  district_id INTEGER REFERENCES districts(id),
  posted_at DATE
);

CREATE TABLE job_skills (
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(id),
  proficiency_required SMALLINT CHECK (proficiency_required BETWEEN 0 AND 100),
  trend NUMERIC(5,2),
  PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  district_id INTEGER REFERENCES districts(id),
  version VARCHAR(20) DEFAULT 'v1.0',
  status VARCHAR(30) DEFAULT 'active'
);

CREATE TABLE course_skills (
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(id),
  coverage_score SMALLINT CHECK (coverage_score BETWEEN 0 AND 100),
  PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES districts(id),
  qualification VARCHAR(150)
);

CREATE TABLE candidate_skills (
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(id),
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 0 AND 100),
  PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE gap_records (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) CHECK (entity_type IN ('industry','course','candidate')),
  skill_id INTEGER REFERENCES skills(id),
  required_score SMALLINT,
  current_score SMALLINT,
  gap_value SMALLINT,
  computed_at TIMESTAMP DEFAULT now()
);

CREATE TABLE curriculum_recommendations (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  action VARCHAR(10) CHECK (action IN ('ADD','UPGRADE','REDUCE','KEEP')),
  skill_id INTEGER REFERENCES skills(id),
  rationale TEXT,
  status VARCHAR(30) DEFAULT 'pending_review',
  created_by_agent VARCHAR(50),
  confidence SMALLINT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE capacity_scenarios (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES districts(id),
  scenario_pct SMALLINT,
  new_capacity INTEGER,
  shortage INTEGER,
  risk_level VARCHAR(10)
);

CREATE TABLE evidence_cards (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER REFERENCES curriculum_recommendations(id),
  metrics_json JSONB,
  confidence_score SMALLINT
);

CREATE TABLE employer_reviews (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER REFERENCES curriculum_recommendations(id),
  employer_id INTEGER,
  decision VARCHAR(10) CHECK (decision IN ('agree','modify','reject')),
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT now()
);

CREATE TABLE district_plans (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES districts(id),
  generated_at TIMESTAMP DEFAULT now(),
  summary_json JSONB,
  status VARCHAR(30) DEFAULT 'draft'
);

CREATE TABLE curriculum_versions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  version_number VARCHAR(20),
  changelog TEXT,
  approved_at TIMESTAMP
);
```

---

## 2. Seed Data — EV Technician Vertical Slice

```sql
-- Districts
INSERT INTO districts (name, region) VALUES
  ('Pune', 'Western Maharashtra'),
  ('Nashik', 'North Maharashtra'),
  ('Chhatrapati Sambhajinagar', 'Marathwada');

-- Skills (emerging EV-relevant + declining ICE-relevant)
INSERT INTO skills (name, canonical_name, category) VALUES
  ('Battery Diagnostics', 'BATTERY_DIAGNOSTICS', 'EV Technical'),
  ('High-Voltage Safety', 'HIGH_VOLTAGE_SAFETY', 'EV Technical'),
  ('EV Motor Servicing', 'EV_MOTOR_SERVICING', 'EV Technical'),
  ('Battery Management Systems (BMS)', 'BMS', 'EV Technical'),
  ('Charging Infrastructure', 'CHARGING_INFRA', 'EV Technical'),
  ('IoT/Telematics Diagnostics', 'IOT_TELEMATICS', 'EV Technical'),
  ('Carburetor Tuning', 'CARBURETOR_TUNING', 'Legacy ICE'),
  ('Manual Transmission Repair', 'MANUAL_TRANSMISSION', 'Legacy ICE'),
  ('General Electrical Safety', 'GEN_ELECTRICAL_SAFETY', 'Foundational');

INSERT INTO skill_aliases (skill_id, alias_text) VALUES
  (4, 'BMS'), (4, 'Battery Management System'),
  (1, 'Battery diagnosis'), (1, 'EV battery troubleshooting');

-- Courses
INSERT INTO courses (name, district_id, version, status) VALUES
  ('EV Maintenance Fundamentals', 1, 'v1.0', 'active'),
  ('Automotive Servicing (General)', 1, 'v2.3', 'active'),
  ('EV Maintenance Fundamentals', 2, 'v1.0', 'active'),
  ('Two-Wheeler Repair Basics', 3, 'v1.4', 'active');

-- Course skill coverage (low EV coverage on purpose — this is the gap the demo surfaces)
INSERT INTO course_skills (course_id, skill_id, coverage_score) VALUES
  (1, 1, 35), (1, 2, 20), (1, 3, 30), (1, 4, 15), (1, 9, 60),
  (2, 7, 70), (2, 8, 65), (2, 9, 55),
  (3, 1, 30), (3, 2, 18);

-- A few sample candidates
INSERT INTO candidates (district_id, qualification) VALUES
  (1, 'ITI Diploma - Automotive'),
  (1, 'ITI Diploma - Electrical'),
  (2, 'ITI Diploma - Automotive');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level) VALUES
  (1, 1, 28), (1, 2, 15), (1, 9, 55),
  (2, 2, 40), (2, 4, 10),
  (3, 1, 20), (3, 3, 22);
```

**Sample job posting text** (feed these through `POST /jobs/ingest` to exercise the Skill Intelligence Agent end-to-end):
```json
[
  { "source": "curated_batch_1", "district_hint": "Pune",
    "raw_text": "Hiring EV Technician: must have hands-on battery diagnostics experience, strong understanding of high-voltage safety protocols, and familiarity with BMS fault codes. 2+ years preferred." },
  { "source": "curated_batch_1", "district_hint": "Pune",
    "raw_text": "EV Service Engineer needed - charging infrastructure troubleshooting, motor servicing, IoT-based telematics diagnostics a plus." },
  { "source": "curated_batch_1", "district_hint": "Nashik",
    "raw_text": "Looking for automotive technician skilled in EV motor servicing and battery management systems, high voltage certification required." }
]
```

These three postings, once ingested, should produce a visible gap on `EV Maintenance Fundamentals` (course coverage 15–35 vs. industry proficiency typically 75–90 for the same skills) — this is the exact scenario the Capacity Simulator and Curriculum Advisor demo walks through.
