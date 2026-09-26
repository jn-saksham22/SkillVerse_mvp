import { useEffect, useState } from "react";

import {
  getDecisions,
  generateDecisionBatch,
  updateDecision,
  createInterventionFromDecision,
  getInterventions,
  updateIntervention,
} from "../api/skillverse";


function percentage(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}


function priorityClass(priority) {
  return `decision-priority decision-priority-${String(
    priority || "unknown"
  ).toLowerCase()}`;
}


function statusClass(status) {
  return `decision-status decision-status-${String(
    status || "unknown"
  ).toLowerCase()}`;
}


function interventionStatusClass(status) {
  return `intervention-status intervention-status-${String(
    status || "unknown"
  ).toLowerCase()}`;
}


export default function DecisionReview() {
  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);

  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [creatingIntervention, setCreatingIntervention] = useState(false);
  const [updatingIntervention, setUpdatingIntervention] = useState(false);

  const [limit, setLimit] = useState(5);
  const [statusFilter, setStatusFilter] = useState("");

  const [reviewerNote, setReviewerNote] = useState("");

  const [implementationNote, setImplementationNote] = useState("");
  const [outcome, setOutcome] = useState("");
  const [owner, setOwner] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  async function loadDecisions() {
    try {
      setLoading(true);
      setError("");

      const data = await getDecisions(statusFilter);

      setDecisions(data);

      if (selectedDecision) {
        const refreshed = data.find(
          (item) => item.id === selectedDecision.id
        );

        setSelectedDecision(refreshed || null);
      }
    } catch (err) {
      console.error("Decision loading failed:", err);
      setError(
        "Unable to load decisions. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }


  async function loadInterventions() {
    try {
      const data = await getInterventions();
      setInterventions(data);

      if (selectedIntervention) {
        const refreshed = data.find(
          (item) => item.id === selectedIntervention.id
        );

        setSelectedIntervention(refreshed || null);
      }
    } catch (err) {
      console.error("Intervention loading failed:", err);
    }
  }


  useEffect(() => {
    loadDecisions();
    loadInterventions();
  }, [statusFilter]);


  function selectDecision(decision) {
    setSelectedDecision(decision);
    setReviewerNote(decision.reviewer_note || "");
    setSelectedIntervention(null);
    setImplementationNote("");
    setOutcome("");
    setOwner("");
    setMessage("");
    setError("");

    const existing = interventions.find(
      (item) => item.decision_id === decision.id
    );

    if (existing) {
      setSelectedIntervention(existing);
      setImplementationNote(existing.implementation_note || "");
      setOutcome(existing.outcome || "");
      setOwner(existing.owner || "");
    }
  }


  async function handleGenerateBatch() {
    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const result = await generateDecisionBatch(Number(limit));

      setMessage(
        `${result.generated} decision brief${result.generated === 1 ? "" : "s"} created; ${result.reused || 0} existing proposal${result.reused === 1 ? "" : "s"} reused.`
      );

      await loadDecisions();
    } catch (err) {
      console.error("Batch generation failed:", err);
      setError(
        err.message || "Unable to generate decision briefs. Check the backend."
      );
    } finally {
      setGenerating(false);
    }
  }


  async function handleStatusUpdate(status) {
    if (!selectedDecision) return;

    if (["MODIFIED", "REJECTED"].includes(status) && !reviewerNote.trim()) {
      setError("Add a reviewer note before modifying or rejecting a proposal.");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      const updated = await updateDecision(
        selectedDecision.id,
        {
          status,
          reviewer_note: reviewerNote,
        }
      );

      setSelectedDecision(updated);

      setMessage(
        `Decision for ${updated.skill} updated to ${updated.status}.`
      );

      await loadDecisions();
    } catch (err) {
      console.error("Decision update failed:", err);
      setError(err.message || "Unable to update this decision.");
    } finally {
      setUpdating(false);
    }
  }


  async function handleCreateIntervention() {
    if (!selectedDecision) return;

    try {
      setCreatingIntervention(true);
      setError("");
      setMessage("");

      const intervention = await createInterventionFromDecision(
        selectedDecision.id
      );

      setSelectedIntervention(intervention);

      setImplementationNote(
        intervention.implementation_note || ""
      );

      setOutcome(intervention.outcome || "");
      setOwner(intervention.owner || "");

      setMessage(
        `Intervention created for ${selectedDecision.skill}.`
      );

      await Promise.all([loadInterventions(), loadDecisions()]);
    } catch (err) {
      console.error("Intervention creation failed:", err);

      setError(err.message || "The decision must be approved or modified before creating an intervention.");
    } finally {
      setCreatingIntervention(false);
    }
  }


  async function handleInterventionUpdate(status) {
    if (!selectedIntervention) return;

    try {
      setUpdatingIntervention(true);
      setError("");
      setMessage("");

      const updated = await updateIntervention(
        selectedIntervention.id,
        {
          status,
          outcome: outcome || null,
          implementation_note: implementationNote || null,
          owner: owner || null,
        }
      );

      setSelectedIntervention(updated);

      setMessage(
        `Intervention moved to ${updated.status}.`
      );

      await loadInterventions();
    } catch (err) {
      console.error("Intervention update failed:", err);
      setError(err.message || "Unable to update intervention.");
    } finally {
      setUpdatingIntervention(false);
    }
  }


  const selectedExistingIntervention =
    selectedDecision &&
    interventions.find(
      (item) => item.decision_id === selectedDecision.id
    );


  return (
    <main className="decision-review-page">

      <header className="decision-review-header">

        <div>
          <div className="eyebrow">
            HUMAN VALIDATION · IMPLEMENTATION
          </div>

          <h1>
            Decision Review
          </h1>

          <p>
            Review evidence-backed workforce decisions, approve
            interventions, and track implementation outcomes.
          </p>
        </div>


        <div className="decision-review-actions">

          <select
            value={limit}
            onChange={(event) =>
              setLimit(Number(event.target.value))
            }
            aria-label="Number of decisions to generate"
          >
            <option value={3}>Generate 3</option>
            <option value={5}>Generate 5</option>
            <option value={10}>Generate 10</option>
          </select>


          <button
            className="primary-action"
            onClick={handleGenerateBatch}
            disabled={generating}
          >
            {generating
              ? "Generating..."
              : "Generate Decision Briefs"}
          </button>

        </div>

      </header>


      {message && (
        <div className="decision-message">
          {message}
        </div>
      )}

      {error && (
        <div className="decision-error">
          {error}
        </div>
      )}


      <section className="decision-summary-grid">

        <div className="decision-summary-card">
          <span>Total Decisions</span>
          <strong>{decisions.length}</strong>
        </div>

        <div className="decision-summary-card">
          <span>Proposed</span>
          <strong>
            {decisions.filter(
              (item) => item.status === "PROPOSED"
            ).length}
          </strong>
        </div>

        <div className="decision-summary-card">
          <span>Under Review</span>
          <strong>
            {decisions.filter(
              (item) => item.status === "UNDER_REVIEW"
            ).length}
          </strong>
        </div>

        <div className="decision-summary-card">
          <span>Implemented</span>
          <strong>
            {decisions.filter(
              (item) => item.status === "IMPLEMENTED"
            ).length}
          </strong>
        </div>

        <div className="decision-summary-card">
          <span>Interventions</span>
          <strong>{interventions.length}</strong>
        </div>

      </section>


      <section className="decision-toolbar">

        <div>
          <span className="eyebrow">
            DECISION QUEUE
          </span>

          <h2>
            Workforce intervention proposals
          </h2>
        </div>


        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filter decisions by status"
        >
          <option value="">All statuses</option>
          <option value="PROPOSED">Proposed</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="MODIFIED">Modified</option>
          <option value="REJECTED">Rejected</option>
          <option value="IMPLEMENTED">Implemented</option>
        </select>

      </section>


      <section className="decision-review-layout">

        <div className="decision-list-panel">

          <div className="decision-list-header">
            <span>{decisions.length} decisions</span>
          </div>


          {loading ? (
            <div className="decision-loading">
              Loading decision queue...
            </div>
          ) : decisions.length === 0 ? (

            <div className="decision-empty">
              <strong>No decisions available</strong>
              <p>
                Generate a decision batch to populate the
                human validation queue.
              </p>
            </div>

          ) : (

            <div className="decision-list">

              {decisions.map((decision) => (

                <button
                  key={decision.id}
                  className={`decision-list-item ${
                    selectedDecision?.id === decision.id
                      ? "decision-list-item-selected"
                      : ""
                  }`}
                  onClick={() => selectDecision(decision)}
                >

                  <div className="decision-list-top">

                    <strong>
                      {decision.skill}
                    </strong>

                    <span
                      className={priorityClass(
                        decision.priority
                      )}
                    >
                      {decision.priority}
                    </span>

                  </div>


                  <div className="decision-list-category">
                    {decision.category}
                  </div>


                  <div className="decision-list-meta">

                    <span>
                      Gap {percentage(decision.gap_score)}
                    </span>

                    <span>
                      {decision.status}
                    </span>

                  </div>

                </button>

              ))}

            </div>
          )}

        </div>


        <div className="decision-detail-panel">

          {!selectedDecision ? (

            <div className="decision-detail-empty">

              <div className="decision-empty-icon">
                ◇
              </div>

              <h3>
                Select a decision
              </h3>

              <p>
                Choose a workforce decision from the queue
                to inspect its evidence and implementation plan.
              </p>

            </div>

          ) : (

            <>

              <div className="decision-detail-header">

                <div>

                  <div className="eyebrow">
                    DECISION BRIEF · ID-{selectedDecision.id}
                  </div>

                  <h2>
                    {selectedDecision.skill}
                  </h2>

                  <p>
                    {selectedDecision.category}
                  </p>

                </div>


                <div className="decision-detail-badges">

                  <span
                    className={priorityClass(
                      selectedDecision.priority
                    )}
                  >
                    {selectedDecision.priority}
                  </span>

                  <span
                    className={statusClass(
                      selectedDecision.status
                    )}
                  >
                    {selectedDecision.status}
                  </span>

                </div>

              </div>


              <div className="decision-signal-grid">

                <div className="decision-signal-card">
                  <span>Industry Demand</span>
                  <strong>
                    {percentage(
                      selectedDecision.industry_demand
                    )}
                  </strong>
                </div>

                <div className="decision-signal-card">
                  <span>Curriculum Coverage</span>
                  <strong>
                    {percentage(
                      selectedDecision.curriculum_coverage
                    )}
                  </strong>
                </div>

                <div className="decision-signal-card">
                  <span>Candidate Readiness</span>
                  <strong>
                    {percentage(
                      selectedDecision.candidate_readiness
                    )}
                  </strong>
                </div>

                <div className="decision-signal-card decision-gap">
                  <span>Gap Score</span>
                  <strong>
                    {percentage(
                      selectedDecision.gap_score
                    )}
                  </strong>
                </div>

              </div>


              <div className="decision-section">

                <div className="eyebrow">
                  RECOMMENDATION
                </div>

                <h3>
                  {selectedDecision.recommendation}
                </h3>

                <p>
                  {selectedDecision.rationale}
                </p>

              </div>


              <div className="decision-section">

                <div className="eyebrow">
                  EVIDENCE
                </div>

                <div className="decision-evidence">
                  {selectedDecision.evidence}
                </div>

              </div>


              <div className="decision-review-section">

                <div>
                  <div className="eyebrow">
                    HUMAN REVIEW
                  </div>

                  <h3>
                    Reviewer decision
                  </h3>
                </div>


                <textarea
                  value={reviewerNote}
                  onChange={(event) =>
                    setReviewerNote(event.target.value)
                  }
                  placeholder="Add reviewer note..."
                  rows={3}
                />


                <div className="decision-review-buttons">

                  <button
                    onClick={() =>
                      handleStatusUpdate("UNDER_REVIEW")
                    }
                    disabled={updating}
                  >
                    Under Review
                  </button>

                  <button
                    onClick={() =>
                      handleStatusUpdate("MODIFIED")
                    }
                    disabled={updating}
                  >
                    Modify
                  </button>

                  <button
                    className="decision-approve-button"
                    onClick={() =>
                      handleStatusUpdate("APPROVED")
                    }
                    disabled={updating}
                  >
                    Approve
                  </button>

                  <button
                    className="decision-reject-button"
                    onClick={() =>
                      handleStatusUpdate("REJECTED")
                    }
                    disabled={updating}
                  >
                    Reject
                  </button>

                </div>

              </div>


              <div className="intervention-panel">

                <div className="intervention-header">

                  <div>
                    <div className="eyebrow">
                      IMPLEMENTATION
                    </div>

                    <h3>
                      Workforce Intervention
                    </h3>

                    <p>
                      Convert the reviewed decision into an
                      executable workforce intervention.
                    </p>
                  </div>


                  {selectedIntervention && (
                    <span
                      className={interventionStatusClass(
                        selectedIntervention.status
                      )}
                    >
                      {selectedIntervention.status}
                    </span>
                  )}

                </div>


                {!selectedIntervention ? (

                  <div className="intervention-create">

                    <div className="intervention-create-copy">
                      <strong>
                        No intervention created yet
                      </strong>

                      <span>
                        This decision can be converted into an
                        implementation plan once it is approved
                        or modified.
                      </span>
                    </div>


                    <button
                      className="primary-action"
                      onClick={handleCreateIntervention}
                      disabled={
                        creatingIntervention ||
                        !["APPROVED", "MODIFIED"].includes(
                          selectedDecision.status
                        )
                      }
                    >
                      {creatingIntervention
                        ? "Creating..."
                        : "Create Intervention"}
                    </button>

                  </div>

                ) : (

                  <div className="intervention-content">

                    <div className="intervention-title-row">

                      <div>
                        <span className="eyebrow">
                          INTERVENTION BRIEF
                        </span>

                        <h4>
                          {selectedIntervention.title}
                        </h4>
                      </div>

                      <span className="intervention-type">
                        {selectedIntervention.intervention_type}
                      </span>

                    </div>


                    <div className="intervention-objective">

                      <span>
                        OBJECTIVE
                      </span>

                      <p>
                        {selectedIntervention.objective}
                      </p>

                    </div>


                    <div className="intervention-grid">

                      <div>
                        <label>
                          Target
                        </label>

                        <p>
                          {selectedIntervention.target || "—"}
                        </p>
                      </div>


                      <div>
                        <label>
                          Owner
                        </label>

                        <input
                          value={owner}
                          onChange={(event) =>
                            setOwner(event.target.value)
                          }
                          placeholder="Assign owner"
                        />
                      </div>

                    </div>


                    <div className="intervention-actions">

                      <label>
                        ACTION PLAN
                      </label>

                      <div>
                        {selectedIntervention.actions ||
                          "No action plan provided."}
                      </div>

                    </div>


                    <div className="intervention-fields">

                      <div>

                        <label>
                          Implementation Note
                        </label>

                        <textarea
                          value={implementationNote}
                          onChange={(event) =>
                            setImplementationNote(
                              event.target.value
                            )
                          }
                          rows={3}
                          placeholder="Record implementation progress..."
                        />

                      </div>


                      <div>

                        <label>
                          Outcome
                        </label>

                        <textarea
                          value={outcome}
                          onChange={(event) =>
                            setOutcome(event.target.value)
                          }
                          rows={3}
                          placeholder="Record measurable outcome..."
                        />

                      </div>

                    </div>


                    <div className="intervention-controls">

                      <button
                        onClick={() =>
                          handleInterventionUpdate("PLANNED")
                        }
                        disabled={updatingIntervention}
                      >
                        Planned
                      </button>

                      <button
                        onClick={() =>
                          handleInterventionUpdate("IN_PROGRESS")
                        }
                        disabled={updatingIntervention}
                      >
                        Start
                      </button>

                      <button
                        className="intervention-complete-button"
                        onClick={() =>
                          handleInterventionUpdate("COMPLETED")
                        }
                        disabled={updatingIntervention}
                      >
                        Complete
                      </button>

                      <button
                        className="intervention-cancel-button"
                        onClick={() =>
                          handleInterventionUpdate("CANCELLED")
                        }
                        disabled={updatingIntervention}
                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                )}

              </div>

            </>

          )}

        </div>

      </section>

    </main>
  );
}
