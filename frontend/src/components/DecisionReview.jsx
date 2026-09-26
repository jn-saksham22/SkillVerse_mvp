import { useEffect, useState } from "react";

import {
  getDecisions,
  updateDecision,
} from "../api/skillverse";


const STATUSES = [
  "PROPOSED",
  "UNDER_REVIEW",
  "APPROVED",
  "MODIFIED",
  "REJECTED",
  "IMPLEMENTED",
];


export default function DecisionReview() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function loadDecisions() {
    try {
      setLoading(true);
      setError("");

      const data = await getDecisions();

      setDecisions(data);
    } catch (err) {
      console.error("Decision loading failed:", err);

      setError(
        "Unable to load human-validation decisions."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDecisions();
  }, []);


  async function changeStatus(
    decisionId,
    status
  ) {
    try {
      setUpdating(true);

      await updateDecision(
        decisionId,
        {
          status,
          reviewer_note: null,
        }
      );

      await loadDecisions();
    } catch (err) {
      console.error(
        "Decision update failed:",
        err
      );

      setError(
        "Unable to update decision."
      );
    } finally {
      setUpdating(false);
    }
  }


  if (loading) {
    return (
      <section className="panel decision-review-panel">
        <div className="eyebrow">
          HUMAN VALIDATION
        </div>

        <h2>
          Loading decisions...
        </h2>
      </section>
    );
  }


  return (
    <section className="panel decision-review-panel">

      <div className="panel-header">

        <div>
          <span className="eyebrow">
            HUMAN VALIDATION
          </span>

          <h2>
            Decision Review
          </h2>

          <p>
            Review AI-generated workforce decisions
            before implementation.
          </p>
        </div>

        <div className="matrix-summary">
          <strong>
            {decisions.length}
          </strong>

          <span>
            decisions
          </span>
        </div>

      </div>


      {error && (
        <div className="agent-error">
          {error}
        </div>
      )}


      {!decisions.length ? (
        <div className="empty-state">
          No decisions have been generated yet.
        </div>
      ) : (

        <div className="decision-list">

          {decisions.map((decision) => (

            <article
              className="decision-review-card"
              key={decision.id}
            >

              <div className="decision-review-main">

                <div className="decision-review-top">

                  <div>
                    <span className="eyebrow">
                      DECISION #{decision.id}
                    </span>

                    <h3>
                      {decision.skill}
                    </h3>

                    <span>
                      {decision.category}
                    </span>
                  </div>

                  <span
                    className={`priority priority-${String(
                      decision.priority
                    ).toLowerCase()}`}
                  >
                    {decision.priority}
                  </span>

                </div>


                <div className="decision-review-metrics">

                  <div>
                    <span>
                      Industry Demand
                    </span>

                    <strong>
                      {decision.industry_demand != null
                        ? `${(
                            decision.industry_demand * 100
                          ).toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Curriculum
                    </span>

                    <strong>
                      {decision.curriculum_coverage != null
                        ? `${(
                            decision.curriculum_coverage * 100
                          ).toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Readiness
                    </span>

                    <strong>
                      {decision.candidate_readiness != null
                        ? `${(
                            decision.candidate_readiness * 100
                          ).toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Gap Score
                    </span>

                    <strong>
                      {decision.gap_score != null
                        ? decision.gap_score.toFixed(4)
                        : "—"}
                    </strong>
                  </div>

                </div>


                <div className="decision-review-section">

                  <span className="eyebrow">
                    RECOMMENDATION
                  </span>

                  <p>
                    {decision.recommendation}
                  </p>

                </div>


                <div className="decision-review-section">

                  <span className="eyebrow">
                    EVIDENCE
                  </span>

                  <p>
                    {decision.evidence || "—"}
                  </p>

                </div>


                <div className="decision-review-section">

                  <span className="eyebrow">
                    RATIONALE
                  </span>

                  <p>
                    {decision.rationale || "—"}
                  </p>

                </div>


                <div className="decision-review-footer">

                  <div>

                    <span className="eyebrow">
                      CURRENT STATUS
                    </span>

                    <strong>
                      {decision.status}
                    </strong>

                  </div>


                  <div className="decision-actions">

                    <select
                      value={decision.status}
                      disabled={updating}
                      onChange={(event) =>
                        changeStatus(
                          decision.id,
                          event.target.value
                        )
                      }
                    >

                      {STATUSES.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}

                    </select>

                  </div>

                </div>

              </div>

            </article>

          ))}

        </div>

      )}

    </section>
  );
}
