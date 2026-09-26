import React, { useEffect, useState } from "react";

import {
  getMarketScout,
  getCurriculumMapper,
  getCandidateReadiness,
  getDecisionSupport,
} from "../api/skillverse";

function AgentCard({ title, subtitle, icon, status, children }) {
  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <div className="agent-icon">{icon}</div>

        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <span className="agent-status">
          {status || "ACTIVE"}
        </span>
      </div>

      <div className="agent-card-body">
        {children}
      </div>
    </div>
  );
}

function SignalList({ signals = [], type }) {
  if (!signals.length) {
    return <div className="empty-agent">No signals available.</div>;
  }

  return (
    <div className="agent-signals">
      {signals.slice(0, 5).map((item, index) => (
        <div className="agent-signal" key={index}>
          <div>
            <strong>{item.skill}</strong>

            <div className="signal-meta">
              {type === "market" && (
                <>
                  Demand:{" "}
                  <b>
                    {Math.round(
                      (item.industry_demand || 0) * 100
                    )}
                    %
                  </b>
                  {" · "}
                  Jobs: <b>{item.job_count}</b>
                </>
              )}

              {type === "curriculum" && (
                <>
                  Coverage:{" "}
                  <b>
                    {Math.round(
                      (item.curriculum_coverage || 0) * 100
                    )}
                    %
                  </b>
                  {" · "}
                  Courses: <b>{item.course_count}</b>
                </>
              )}

              {type === "candidate" && (
                <>
                  Readiness:{" "}
                  <b>
                    {Math.round(
                      (item.candidate_readiness || 0) * 100
                    )}
                    %
                  </b>
                  {" · "}
                  Candidates: <b>{item.candidate_count}</b>
                </>
              )}

              {type === "decision" && (
                <>
                  Gap:{" "}
                  <b>
                    {item.gap_score != null
                      ? `${Math.round(item.gap_score * 100)}%`
                      : item.gap != null
                      ? `${Math.round(item.gap * 100)}%`
                      : "—"}
                  </b>
                  {" · "}
                  Priority: <b>{item.priority}</b>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Agents() {
  const [market, setMarket] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [decision, setDecision] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        setError("");

        const [
          marketResult,
          curriculumResult,
          candidateResult,
          decisionResult,
        ] = await Promise.all([
          getMarketScout(10),
          getCurriculumMapper(10),
          getCandidateReadiness(10),
          getDecisionSupport(10),
        ]);

        setMarket(marketResult);
        setCurriculum(curriculumResult);
        setCandidate(candidateResult);
        setDecision(decisionResult);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load agent intelligence. Check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="agent-loading">
          Loading SKILLVERSE intelligence agents...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="agent-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">

      <div className="page-header">
        <div>
          <div className="eyebrow">AI WORKFORCE INTELLIGENCE</div>

          <h1>SKILLVERSE Agents</h1>

          <p>
            Four specialized intelligence agents connect industry
            demand, curriculum coverage and workforce readiness to
            support evidence-driven skill decisions.
          </p>
        </div>

        <div className="agent-system-status">
          <span className="status-dot"></span>
          4 AGENTS ACTIVE
        </div>
      </div>

      <div className="agents-grid">

        <AgentCard
          title="Market Scout"
          subtitle="Industry demand intelligence"
          icon="⌁"
        >
          <SignalList
            signals={market?.signals}
            type="market"
          />
        </AgentCard>

        <AgentCard
          title="Curriculum Mapper"
          subtitle="Training coverage intelligence"
          icon="◈"
        >
          <SignalList
            signals={curriculum?.signals}
            type="curriculum"
          />
        </AgentCard>

        <AgentCard
          title="Candidate Readiness"
          subtitle="Workforce capability intelligence"
          icon="◎"
        >
          <SignalList
            signals={candidate?.signals}
            type="candidate"
          />
        </AgentCard>

        <AgentCard
          title="Decision Support"
          subtitle="Cross-signal workforce decisions"
          icon="◆"
        >
          <SignalList
            signals={decision?.signals}
            type="decision"
          />
        </AgentCard>

      </div>

      <div className="agent-flow">

        <div className="flow-title">
          INTELLIGENCE PIPELINE
        </div>

        <div className="flow">

          <div className="flow-node">
            <span>01</span>
            <strong>Market Scout</strong>
            <small>Industry demand</small>
          </div>

          <div className="flow-line"></div>

          <div className="flow-node">
            <span>02</span>
            <strong>Curriculum Mapper</strong>
            <small>Training coverage</small>
          </div>

          <div className="flow-line"></div>

          <div className="flow-node">
            <span>03</span>
            <strong>Candidate Readiness</strong>
            <small>Workforce capability</small>
          </div>

          <div className="flow-line"></div>

          <div className="flow-node decision-node">
            <span>04</span>
            <strong>Decision Support</strong>
            <small>Actionable skill priorities</small>
          </div>

        </div>

      </div>

    </div>
  );
}
