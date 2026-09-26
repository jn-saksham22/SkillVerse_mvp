import { useEffect, useState } from "react";

import {
  getCurriculumActions,
  simulateWhatIf,
  getDecisions,
  createEmployerValidation,
  getDecisionEvidence,
  getDistricts,
  generateDistrictPlan,
} from "../api/skillverse";

import "./ActionCenter.css";


function pct(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(Number(value) * 100).toFixed(1)}%`;
}


export default function ActionCenter() {

  const [tab, setTab] = useState("curriculum");

  const [curriculum, setCurriculum] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState("");

  const [evidence, setEvidence] = useState(null);

  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState("");
  const [districtPlan, setDistrictPlan] = useState(null);

  const [simulator, setSimulator] = useState({
    capacity: 2100,
    demand: 4500,
  });

  const [simulation, setSimulation] = useState(null);

  const [employer, setEmployer] = useState({
    employer_name: "",
    role: "EV Technician",
    verdict: "AGREE",
    validation_score: 85,
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  useEffect(() => {
    loadInitial();
  }, []);


  async function loadInitial() {
    try {
      setLoading(true);

      const [
        curriculumData,
        decisionData,
        districtData,
      ] = await Promise.all([
        getCurriculumActions(),
        getDecisions(),
        getDistricts(),
      ]);

      setCurriculum(
        Array.isArray(curriculumData?.actions)
          ? curriculumData.actions
          : Array.isArray(curriculumData)
            ? curriculumData
            : []
      );

      const normalizedDecisions = Array.isArray(decisionData)
        ? decisionData
        : Array.isArray(decisionData?.decisions)
          ? decisionData.decisions
          : [];

      setDecisions(normalizedDecisions);

      const districtList = Array.isArray(districtData?.districts)
        ? districtData.districts
        : Array.isArray(districtData)
          ? districtData
          : [];

      setDistricts(districtList);

      if (normalizedDecisions.length) {
        setSelectedDecision(
          String(normalizedDecisions[0].id)
        );
      }

      if (districtList.length) {
        setDistrict(districtList[0].name || String(districtList[0]));
      }

    } catch (err) {
      console.error(err);
      setError(
        "Unable to load Action Center data."
      );
    } finally {
      setLoading(false);
    }
  }


  async function runSimulation() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await simulateWhatIf({
        current_capacity: Number(
          simulator.capacity
        ),
        projected_demand: Number(
          simulator.demand
        ),
        capacity_per_trainer: 100,
        capacity_per_lab: 250,
        scenarios: [
          {
            name: "+10% Capacity",
            increase_pct: 10,
            additional_trainers: 0,
            additional_labs: 0,
          },
          {
            name: "+30% Capacity",
            increase_pct: 30,
            additional_trainers: 0,
            additional_labs: 0,
          },
          {
            name: "+50% Capacity",
            increase_pct: 50,
            additional_trainers: 0,
            additional_labs: 0,
          },
        ],
      });

      setSimulation(result);

      setMessage(
        "What-If intervention scenarios calculated."
      );

    } catch (err) {
      console.error(err);
      setError(
        "Simulation failed."
      );
    } finally {
      setLoading(false);
    }
  }


  async function loadEvidence() {
    if (!selectedDecision) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getDecisionEvidence(
          selectedDecision
        );

      setEvidence(result);

    } catch (err) {
      console.error(err);
      setError(
        "Unable to load evidence."
      );
    } finally {
      setLoading(false);
    }
  }


  async function submitEmployerValidation() {
    if (!selectedDecision) {
      setError(
        "Select a decision first."
      );
      return;
    }

    if (!employer.employer_name.trim()) {
      setError("Enter the employer or industry partner name.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await createEmployerValidation({
        decision_id: Number(
          selectedDecision
        ),
        ...employer,
        validation_score: Number(
          employer.validation_score
        ),
      });

      setMessage(
        "Employer validation recorded successfully."
      );

      await loadEvidence();

    } catch (err) {
      console.error(err);
      setError(
        "Unable to record employer validation."
      );
    } finally {
      setLoading(false);
    }
  }


  async function loadDistrictPlan() {
    if (!district) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await generateDistrictPlan({
          district,
        });

      setDistrictPlan(result);

    } catch (err) {
      console.error(err);
      setError(
        "Unable to generate district plan."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="action-center">

      <header className="action-header">

        <div>
          <div className="action-eyebrow">
            ACTION CENTER
          </div>

          <h1>
            Intervention & Planning Center
          </h1>

          <p>
            Convert skill-gap evidence into curriculum,
            capacity, employer validation and district-level
            action.
          </p>
        </div>

      </header>


      {message && (
        <div className="action-message">
          {message}
        </div>
      )}

      {error && (
        <div className="action-error">
          {error}
        </div>
      )}


      <nav className="action-tabs">

        <button
          className={tab === "curriculum" ? "active" : ""}
          onClick={() => setTab("curriculum")}
        >
          Curriculum
        </button>

        <button
          className={tab === "simulator" ? "active" : ""}
          onClick={() => setTab("simulator")}
        >
          What-If Simulator
        </button>

        <button
          className={tab === "employer" ? "active" : ""}
          onClick={() => setTab("employer")}
        >
          Employer Validation
        </button>

        <button
          className={tab === "district" ? "active" : ""}
          onClick={() => setTab("district")}
        >
          District Plan
        </button>

        <button
          className={tab === "evidence" ? "active" : ""}
          onClick={() => setTab("evidence")}
        >
          Evidence
        </button>

      </nav>


      {tab === "curriculum" && (

        <section className="action-panel">

          <div className="panel-heading">
            <div>
              <div className="action-eyebrow">
                CURRICULUM INTELLIGENCE
              </div>

              <h2>
                ADD / UPGRADE / REDUCE / KEEP
              </h2>
            </div>

            <span className="method-badge">
              Deterministic
            </span>
          </div>


          <div className="curriculum-grid">

            {curriculum.map((item) => (

              <article
                className={`curriculum-card action-${item.action.toLowerCase()}`}
                key={item.skill_id}
              >

                <div className="curriculum-top">

                  <div>
                    <h3>
                      {item.skill}
                    </h3>

                    <span>
                      {item.category || "General"}
                    </span>
                  </div>

                  <strong>
                    {item.action}
                  </strong>

                </div>


                <div className="metric-row">

                  <div>
                    <small>Demand</small>
                    <b>{pct(item.industry_demand)}</b>
                  </div>

                  <div>
                    <small>Coverage</small>
                    <b>{pct(item.curriculum_coverage)}</b>
                  </div>

                  <div>
                    <small>Readiness</small>
                    <b>{pct(item.candidate_readiness)}</b>
                  </div>

                  <div>
                    <small>Gap</small>
                    <b>{pct(item.gap_score)}</b>
                  </div>

                </div>


                <p>
                  {item.reason}
                </p>


                <div className="resource-box">

                  <span>
                    {item.recommended_hours} total hours
                  </span>

                  <span>
                    {item.practical_hours} practical
                  </span>

                  <span>
                    {item.trainer_requirement}
                  </span>

                  <span>
                    {item.equipment_requirement}
                  </span>

                </div>


                <div className="confidence-line">
                  Confidence {pct(item.confidence)}
                </div>

              </article>

            ))}

          </div>

        </section>
      )}


      {tab === "simulator" && (

        <section className="action-panel">

          <div className="panel-heading">
            <div>
              <div className="action-eyebrow">
                WHAT-IF ENGINE
              </div>

              <h2>
                Test intervention scenarios before implementation
              </h2>
            </div>
          </div>


          <div className="simulator-controls">

            <label>
              Current training capacity

              <input
                type="number"
                value={simulator.capacity}
                onChange={(e) =>
                  setSimulator({
                    ...simulator,
                    capacity: e.target.value,
                  })
                }
              />
            </label>


            <label>
              Projected market demand

              <input
                type="number"
                value={simulator.demand}
                onChange={(e) =>
                  setSimulator({
                    ...simulator,
                    demand: e.target.value,
                  })
                }
              />
            </label>


            <button
              className="primary-button"
              onClick={runSimulation}
              disabled={loading}
            >
              {loading
                ? "Calculating..."
                : "Run What-If Simulation"}
            </button>

          </div>


          {simulation && (

            <>

              <div className="baseline-card">

                <span>
                  Baseline shortage
                </span>

                <strong>
                  {simulation.baseline_shortage}
                </strong>

              </div>


              <div className="scenario-grid">

                {(simulation?.scenarios ?? []).map(
                  (scenario) => (

                    <article
                      className={
                        scenario.rank === 1
                          ? "scenario-card recommended"
                          : "scenario-card"
                      }
                      key={scenario.name}
                    >

                      <div className="scenario-rank">
                        #{scenario.rank}
                      </div>

                      <h3>
                        {scenario.name}
                      </h3>

                      <div className="scenario-value">
                        {scenario.projected_capacity}
                      </div>

                      <span>
                        projected capacity
                      </span>

                      <div className="scenario-shortage">
                        Shortage:{" "}
                        {scenario.remaining_shortage}
                      </div>

                      <div>
                        Coverage:{" "}
                        {scenario.coverage}%
                      </div>

                      <div>
                        Risk: {scenario.risk}
                      </div>

                    </article>

                  )
                )}

              </div>

            </>

          )}

        </section>
      )}


      {tab === "employer" && (

        <section className="action-panel">

          <div className="panel-heading">

            <div>
              <div className="action-eyebrow">
                INDUSTRY VALIDATION
              </div>

              <h2>
                Employer Review
              </h2>
            </div>

          </div>


          <div className="form-grid">

            <label>
              Decision

              <select
                value={selectedDecision}
                onChange={(e) =>
                  setSelectedDecision(
                    e.target.value
                  )
                }
              >

                {(decisions || []).map(
                  (decision) => (

                    <option
                      key={decision.id}
                      value={decision.id}
                    >
                      {decision.skill}
                    </option>

                  )
                )}

              </select>

            </label>


            <label>
              Employer

              <input
                value={employer.employer_name}
                onChange={(e) =>
                  setEmployer({
                    ...employer,
                    employer_name:
                      e.target.value,
                  })
                }
                placeholder="Employer / Industry Partner"
              />
            </label>


            <label>
              Role

              <input
                value={employer.role}
                onChange={(e) =>
                  setEmployer({
                    ...employer,
                    role: e.target.value,
                  })
                }
              />
            </label>


            <label>
              Verdict

              <select
                value={employer.verdict}
                onChange={(e) =>
                  setEmployer({
                    ...employer,
                    verdict: e.target.value,
                  })
                }
              >
                <option value="AGREE">
                  Agree
                </option>

                <option value="MODIFY">
                  Modify
                </option>

                <option value="REJECT">
                  Reject
                </option>
              </select>

            </label>


            <label>
              Validation score

              <input
                type="number"
                min="0"
                max="100"
                value={employer.validation_score}
                onChange={(e) =>
                  setEmployer({
                    ...employer,
                    validation_score:
                      e.target.value,
                  })
                }
              />
            </label>

          </div>


          <label className="full-field">
            Employer note

            <textarea
              rows="5"
              value={employer.note}
              onChange={(e) =>
                setEmployer({
                  ...employer,
                  note: e.target.value,
                })
              }
              placeholder="Why does the employer agree, modify or reject the recommendation?"
            />

          </label>


      <button
            className="primary-button"
            onClick={submitEmployerValidation}
            disabled={loading || !selectedDecision || !employer.employer_name.trim()}
          >
            Record Employer Validation
          </button>

        </section>
      )}


      {tab === "district" && (

        <section className="action-panel">

          <div className="panel-heading">

            <div>
              <div className="action-eyebrow">
                DISTRICT ACTION
              </div>

              <h2>
                District Training Plan
              </h2>
            </div>

          </div>


          <div className="simulator-controls">

            <label>
              District

              <select
                value={district}
                onChange={(e) =>
                  setDistrict(e.target.value)
                }
              >

                {(districts || []).map(
                  (item) => (
                    <option
                      key={item.id || item.name || item}
                      value={item.name || item}
                    >
                      {item.name || item}
                    </option>
                  )
                )}

              </select>

            </label>


            <button
              className="primary-button"
              onClick={loadDistrictPlan}
              disabled={loading}
            >
              Generate District Plan
            </button>

          </div>


          {districtPlan && (

            <div className="district-plan">

              <h2>
                {districtPlan.title}
              </h2>

              <p>
                {districtPlan.summary}
              </p>


              <div className="district-block">

                <h3>
                  Priority Skills
                </h3>

                <div className="tag-row">

                  {(districtPlan?.priority_skills || []).map(
                    (skill) => (
                      <span key={skill}>
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </div>


              <div className="district-block">

                <h3>
                  Curriculum Actions
                </h3>

                {(districtPlan?.curriculum_actions || []).map(
                  (item) => (
                    <div
                      className="district-line"
                      key={item}
                    >
                      {item}
                    </div>
                  )
                )}

              </div>


              <div className="district-resource-grid">

                <div>
                  <h3>Trainers</h3>
                  <p>
                    {districtPlan.trainer_requirement}
                  </p>
                </div>

                <div>
                  <h3>Equipment / Labs</h3>
                  <p>
                    {districtPlan.equipment_requirement}
                  </p>
                </div>

                <div>
                  <h3>Capacity</h3>
                  <p>
                    {districtPlan.capacity_recommendation}
                  </p>
                </div>

              </div>


              <div className="district-block">

                <h3>
                  Evidence
                </h3>

                {(districtPlan?.evidence || []).map(
                  (item) => (
                    <div
                      className="district-line"
                      key={item}
                    >
                      {item}
                    </div>
                  )
                )}

              </div>


              <div className="confidence-banner">
                Confidence{" "}
                {districtPlan.confidence_percent}%
              </div>

            </div>

          )}

        </section>
      )}


      {tab === "evidence" && (

        <section className="action-panel">

          <div className="panel-heading">

            <div>
              <div className="action-eyebrow">
                EVIDENCE-FIRST AI
              </div>

              <h2>
                Evidence → Confidence → Reason
              </h2>
            </div>

          </div>


          <div className="simulator-controls">

            <label>
              Decision

              <select
                value={selectedDecision}
                onChange={(e) =>
                  setSelectedDecision(
                    e.target.value
                  )
                }
              >

                {(decisions || []).map(
                  (decision) => (

                    <option
                      key={decision.id}
                      value={decision.id}
                    >
                      {decision.skill}
                    </option>

                  )
                )}

              </select>

            </label>


            <button
              className="primary-button"
              onClick={loadEvidence}
              disabled={loading}
            >
              Inspect Evidence
            </button>

          </div>


          {evidence && (
            <div className="evidence-layout">

              <div className="evidence-identity">

                <span className="action-eyebrow">
                  DECISION
                </span>

                <h3>
                  {evidence.skill || "Selected decision"}
                </h3>

                <span className="evidence-status">
                  {evidence.priority ||
                    evidence.confidence_label ||
                    "REVIEW"}
                </span>

              </div>


              <div className="confidence-card">

                <span>
                  Confidence
                </span>

                <strong>
                  {evidence.confidence_percent != null
                    ? `${evidence.confidence_percent}%`
                    : evidence.confidence != null
                      ? `${(
                          Number(evidence.confidence) * 100
                        ).toFixed(1)}%`
                      : "—"}
                </strong>

                <small>
                  {evidence.confidence_label ||
                    (
                      evidence.confidence != null
                        ? "MODELLED"
                        : "MEDIUM"
                    )}
                </small>

              </div>


              <div className="evidence-metric-grid">

                {[
                  [
                    "Industry Demand",
                    evidence.industry_demand,
                  ],
                  [
                    "Curriculum Coverage",
                    evidence.curriculum_coverage,
                  ],
                  [
                    "Candidate Readiness",
                    evidence.candidate_readiness,
                  ],
                  [
                    "Gap Score",
                    evidence.gap_score,
                  ],
                ].map(([label, value]) => (

                  <div key={label}>

                    <span>
                      {label}
                    </span>

                    <strong>
                      {value != null
                        ? pct(value)
                        : "—"}
                    </strong>

                  </div>

                ))}

              </div>


              <div className="evidence-list">

                {(Array.isArray(evidence.evidence)
                  ? evidence.evidence
                  : evidence.evidence
                    ? [
                        {
                          label: "Evidence",
                          value: evidence.evidence,
                          source: "decision evidence",
                        },
                      ]
                    : []
                ).map((item, index) => (

                  <div
                    className="evidence-item"
                    key={`${item.label || "evidence"}-${index}`}
                  >

                    <div>

                      <strong>
                        {item.label || "Evidence"}
                      </strong>

                      <small>
                        {item.source ||
                          "decision evidence"}
                      </small>

                    </div>

                    <b>
                      {typeof item.value === "number" &&
                      item.value <= 1
                        ? pct(item.value)
                        : String(
                            item.value ?? "—"
                          )}
                    </b>

                  </div>

                ))}

              </div>


              <div className="reason-card">

                <div className="action-eyebrow">
                  AI RECOMMENDATION
                </div>

                <h3>
                  {evidence.recommendation ||
                    "Recommendation pending"}
                </h3>


                <div className="evidence-reason">

                  <strong>
                    Why this decision?
                  </strong>

                  <p>
                    {evidence.reason ||
                      evidence.rationale ||
                      "No rationale available."}
                  </p>

                </div>


                {evidence.method && (
                  <div className="evidence-method">
                    Method: {evidence.method}
                  </div>
                )}

              </div>

            </div>
          )}

        </section>
      )}

    </main>
  );
}
