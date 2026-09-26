import React from "react";

function percentage(value, digits = 1) {
  return typeof value === "number"
    ? `${(value * 100).toFixed(digits)}%`
    : "—";
}

function signalClass(value) {
  if (typeof value !== "number") return "signal-neutral";
  if (value >= 0.8) return "signal-strong";
  if (value >= 0.5) return "signal-medium";
  return "signal-low";
}

function SignalCard({ label, value, description, meta }) {
  return (
    <div className="analysis-card signal-card">
      <div className="signal-card-header">
        <span>{label}</span>
        <strong>{percentage(value)}</strong>
      </div>

      <div className="signal-track">
        <div
          className={`signal-fill ${signalClass(value)}`}
          style={{
            width:
              typeof value === "number"
                ? `${Math.max(0, Math.min(value * 100, 100))}%`
                : "0%",
          }}
        />
      </div>

      <small>{meta}</small>

      {description && (
        <p className="signal-description">
          {description}
        </p>
      )}
    </div>
  );
}

export default function SkillAnalysis({
  analysis,
  loading,
  onGenerateDecision,
  generatingDecision = false,
  decisionError = "",
  decisionId,
  onOpenReview,
}) {
  if (loading) {
    return (
      <section className="panel decision-center">
        <div className="panel-header">
          <div>
            <span className="eyebrow">DECISION INTELLIGENCE</span>
            <h2>Skill Decision Center</h2>
            <p>
              Analyzing industry, curriculum and workforce evidence...
            </p>
          </div>
        </div>

        <div className="loading-state">
          Loading evidence...
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="panel decision-center">
        <div className="panel-header">
          <div>
            <span className="eyebrow">DECISION INTELLIGENCE</span>
            <h2>Skill Decision Center</h2>
            <p>
              Select a skill from the Gap Matrix to inspect the evidence
              behind its priority.
            </p>
          </div>
        </div>

        <div className="empty-analysis">
          <strong>Select a skill from the Gap Matrix</strong>
          <p>
            SKILLVERSE will combine industry demand, curriculum coverage
            and candidate readiness to explain the skill gap.
          </p>
        </div>
      </section>
    );
  }

  const {
    skill,
    industry_demand,
    curriculum_coverage,
    candidate_readiness,
    gap_score,
    priority,
    jobs_using_skill,
    courses_covering_skill,
    candidates_assessed,
    data_status,
    confidence,
    missing_dimensions,
  } = analysis;

  const skillName = skill?.name || "Selected Skill";
  const category = skill?.category || "Unknown category";

  const priorityClass =
    priority?.toLowerCase().replaceAll("_", "-") ||
    "insufficient-data";

  return (
    <section className="panel decision-center">

      {/* HEADER */}
      <div className="decision-heading">
        <div>
          <span className="eyebrow">DECISION INTELLIGENCE</span>

          <div className="decision-title-row">
            <div>
              <h2>{skillName}</h2>

              <div className="skill-category-label">
                {category}
              </div>
            </div>

            <span className={`priority priority-${priorityClass}`}>
              {priority || "INSUFFICIENT DATA"}
            </span>
          </div>

          <p>
            Evidence-based analysis of the selected EV workforce skill.
          </p>
        </div>

        <div className="decision-score">
          <span>GAP SCORE</span>

          <strong>
            {percentage(gap_score, 2)}
          </strong>

          <small>
            {confidence
              ? `${confidence} confidence`
              : "Confidence unavailable"}
          </small>
        </div>
      </div>


      {/* SIGNALS */}
      <div className="analysis-grid">

        <SignalCard
          label="Industry Demand"
          value={industry_demand}
          meta={`${jobs_using_skill ?? 0} jobs using skill`}
          description="How strongly the skill appears in the tracked industry demand."
        />

        <SignalCard
          label="Curriculum Coverage"
          value={curriculum_coverage}
          meta={`${courses_covering_skill ?? 0} courses covering skill`}
          description="How strongly the current curriculum covers this skill."
        />

        <SignalCard
          label="Candidate Readiness"
          value={candidate_readiness}
          meta={`${candidates_assessed ?? 0} candidates assessed`}
          description="Current readiness across the assessed workforce pool."
        />

        <div className="analysis-card confidence-card">
          <span>Evidence Quality</span>

          <strong>
            {confidence
              ? confidence.toUpperCase()
              : "—"}
          </strong>

          <small>
            Data status: {data_status || "Unknown"}
          </small>

          <div className="confidence-status">
            <span className="status-dot" />
            {data_status === "COMPLETE"
              ? "All required dimensions available"
              : "Additional evidence may be required"}
          </div>
        </div>

      </div>


      {/* EVIDENCE INTERPRETATION */}
      <div className="decision-evidence-grid">

        <div className="evidence-card">
          <span className="evidence-label">
            INDUSTRY SIGNAL
          </span>

          <h3>Market demand</h3>

          <p>
            {typeof industry_demand === "number"
              ? `${skillName} appears in ${percentage(
                  industry_demand
                )} of the modeled industry-demand signal.`
              : "Industry demand data is currently unavailable."}
          </p>
        </div>


        <div className="evidence-card">
          <span className="evidence-label">
            CURRICULUM SIGNAL
          </span>

          <h3>Training coverage</h3>

          <p>
            {typeof curriculum_coverage === "number"
              ? `Current curriculum coverage is ${percentage(
                  curriculum_coverage
                )}.`
              : "Curriculum coverage data is currently unavailable."}
          </p>
        </div>


        <div className="evidence-card">
          <span className="evidence-label">
            WORKFORCE SIGNAL
          </span>

          <h3>Candidate readiness</h3>

          <p>
            {typeof candidate_readiness === "number"
              ? `Assessed candidate readiness is ${percentage(
                  candidate_readiness
                )}.`
              : "Candidate readiness data is currently unavailable."}
          </p>
        </div>

      </div>


      {/* RECOMMENDATION */}
      <div className="recommendation-box">

        <div>
          <span className="evidence-label">
            RECOMMENDED ACTION
          </span>

          <h3>
            {priority === "CRITICAL"
              ? `Prioritize ${skillName} immediately.`
              : priority === "HIGH"
              ? `Strengthen ${skillName} training.`
              : priority === "MEDIUM"
              ? `Monitor and improve ${skillName} coverage.`
              : priority === "LOW"
              ? `Maintain current ${skillName} coverage.`
              : `Collect additional evidence for ${skillName}.`}
          </h3>

          <p>
            This recommendation is derived from the available
            industry, curriculum and workforce signals.
          </p>
        </div>

        {missing_dimensions?.length > 0 && (
          <div className="missing-data">
            <span>Missing data</span>

            <strong>
              {missing_dimensions.join(", ")}
            </strong>
          </div>
        )}

        <div className="recommendation-actions">
          <button
            type="button"
            className="primary-action"
            onClick={onGenerateDecision}
            disabled={generatingDecision || priority === "INSUFFICIENT_DATA"}
          >
            {generatingDecision ? "Preparing decision…" : "Generate review brief"}
          </button>
          {decisionId && (
            <>
              <p className="workflow-handoff">
                Review brief saved. Run the simulation below, then send it for human review.
              </p>
              <button type="button" className="secondary-button" onClick={onOpenReview}>
                Continue to human review
              </button>
            </>
          )}
          {decisionError && <p role="alert">{decisionError}</p>}
        </div>

      </div>


      {/* FOOTER */}
      <div className="analysis-footer">

        <div>
          <span>Jobs</span>
          <strong>{jobs_using_skill ?? 0}</strong>
        </div>

        <div>
          <span>Courses</span>
          <strong>{courses_covering_skill ?? 0}</strong>
        </div>

        <div>
          <span>Candidates</span>
          <strong>{candidates_assessed ?? 0}</strong>
        </div>

        <div>
          <span>Priority</span>
          <strong>{priority || "—"}</strong>
        </div>

      </div>

    </section>
  );
}
