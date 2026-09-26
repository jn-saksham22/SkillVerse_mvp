import React, { useEffect, useMemo, useState } from "react";

import {
  getMarketScout,
  getCurriculumMapper,
  getCandidateReadiness,
  getDecisionSupport,
  getAgentReasoning,
} from "../api/skillverse";


function percentage(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}


function AgentIcon({ type }) {
  const icons = {
    market: "⌁",
    curriculum: "▣",
    readiness: "◉",
    decision: "✦",
  };

  return (
    <div className={`agent-icon agent-icon-${type}`}>
      {icons[type]}
    </div>
  );
}


function AgentCard({
  type,
  title,
  description,
  status,
  children,
  selected,
  onClick,
}) {
  return (
    <button
      className={`agent-card ${selected ? "agent-card-selected" : ""}`}
      onClick={onClick}
    >
      <div className="agent-card-top">
        <AgentIcon type={type} />

        <div className="agent-status">
          <span className="status-dot" />
          {status}
        </div>
      </div>

      <div className="agent-card-title">
        {title}
      </div>

      <div className="agent-card-description">
        {description}
      </div>

      <div className="agent-card-content">
        {children}
      </div>
    </button>
  );
}


export default function AgentIntelligence() {
  const [market, setMarket] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [decision, setDecision] = useState(null);

  // LLM reasoning state
  const [reasoning, setReasoning] = useState(null);
  const [reasoningLoading, setReasoningLoading] = useState(false);
  const [reasoningError, setReasoningError] = useState("");

  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState("decision");

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        setError("");

        const [
          marketResult,
          curriculumResult,
          readinessResult,
          decisionResult,
        ] = await Promise.all([
          getMarketScout(5),
          getCurriculumMapper(5),
          getCandidateReadiness(5),
          getDecisionSupport(10),
        ]);

        setMarket(marketResult);
        setCurriculum(curriculumResult);
        setReadiness(readinessResult);
        setDecision(decisionResult);
      } catch (err) {
        console.error("Agent loading failed:", err);
        setError(
          "Unable to load agent intelligence. Make sure the FastAPI backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);


  const topDecision = decision?.signals?.[0];

  async function generateReasoning() {
    if (!topDecision) {
      return;
    }

    try {
      setReasoningLoading(true);
      setReasoningError("");

      const result = await getAgentReasoning({
        skill: topDecision.skill,
        category: topDecision.category,
        industry_demand: topDecision.industry_demand,
        curriculum_coverage: topDecision.curriculum_coverage,
        candidate_readiness: topDecision.candidate_readiness,
        gap_score: topDecision.gap_score,
        priority: topDecision.priority,
        job_count: topDecision.job_count,
        course_count: topDecision.course_count,
        candidate_count: topDecision.candidate_count,
      });

      setReasoning(result);
    } catch (err) {
      console.error("Reasoning generation failed:", err);

      setReasoningError(
        "Unable to generate AI reasoning. The deterministic agent data is still available."
      );
    } finally {
      setReasoningLoading(false);
    }
  }

  const highPriorityCount = useMemo(() => {
    if (!decision?.signals) {
      return 0;
    }

    return decision.signals.filter(
      (item) => item.priority === "HIGH" || item.priority === "CRITICAL"
    ).length;
  }, [decision]);


  if (loading) {
    return (
      <section className="agent-intelligence">
        <div className="section-heading">
          <div>
            <div className="eyebrow">AI AGENT INTELLIGENCE</div>
            <h2>Agents are analyzing the workforce dataset...</h2>
          </div>

          <div className="agent-live-pill">
            <span className="status-dot" />
            LIVE
          </div>
        </div>

        <div className="agent-loading">
          Loading Market Scout, Curriculum Mapper, Candidate Readiness
          and Decision Support...
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="agent-intelligence">
        <div className="section-heading">
          <div>
            <div className="eyebrow">AI AGENT INTELLIGENCE</div>
            <h2>Agent layer unavailable</h2>
          </div>
        </div>

        <div className="agent-error">
          {error}
        </div>
      </section>
    );
  }


  return (
    <section className="agent-intelligence">

      {/* HEADER */}
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            AI AGENT INTELLIGENCE
          </div>

          <h2>
            Evidence → Analysis → Decision
          </h2>

          <p>
            Four specialized agents continuously interpret industry demand,
            curriculum coverage and workforce readiness.
          </p>
        </div>

        <div className="agent-live-pill">
          <span className="status-dot" />
          AGENTS ACTIVE
        </div>
      </div>


      {/* AGENT CARDS */}
      <div className="agent-grid">

        <AgentCard
          type="market"
          title="Market Scout"
          description="Detects industry skill demand from the jobs dataset."
          status="ACTIVE"
          selected={selectedAgent === "market"}
          onClick={() => setSelectedAgent("market")}
        >
          <div className="agent-stat-label">
            Top demand signal
          </div>

          <div className="agent-stat-value">
            {market?.signals?.[0]?.skill || "—"}
          </div>

          <div className="agent-stat-meta">
            {percentage(market?.signals?.[0]?.industry_demand)}
            demand · {market?.signals?.[0]?.job_count || 0} jobs
          </div>
        </AgentCard>


        <AgentCard
          type="curriculum"
          title="Curriculum Mapper"
          description="Maps training programs against required EV skills."
          status="ACTIVE"
          selected={selectedAgent === "curriculum"}
          onClick={() => setSelectedAgent("curriculum")}
        >
          <div className="agent-stat-label">
            Highest curriculum coverage
          </div>

          <div className="agent-stat-value">
            {curriculum?.signals?.[0]?.skill || "—"}
          </div>

          <div className="agent-stat-meta">
            {percentage(
              curriculum?.signals?.[0]?.curriculum_coverage
            )}
            coverage · {curriculum?.signals?.[0]?.course_count || 0} course
          </div>
        </AgentCard>


        <AgentCard
          type="readiness"
          title="Candidate Readiness"
          description="Measures current workforce readiness for critical skills."
          status="ACTIVE"
          selected={selectedAgent === "readiness"}
          onClick={() => setSelectedAgent("readiness")}
        >
          <div className="agent-stat-label">
            Lowest readiness signal
          </div>

          <div className="agent-stat-value">
            {readiness?.signals?.[0]?.skill || "—"}
          </div>

          <div className="agent-stat-meta">
            {percentage(
              readiness?.signals?.[0]?.candidate_readiness
            )}
            readiness · {readiness?.signals?.[0]?.candidate_count || 0} candidates
          </div>
        </AgentCard>


        <AgentCard
          type="decision"
          title="Decision Support"
          description="Combines all signals into actionable workforce priorities."
          status="ACTIVE"
          selected={selectedAgent === "decision"}
          onClick={() => setSelectedAgent("decision")}
        >
          <div className="agent-stat-label">
            Highest-priority gap
          </div>

          <div className="agent-stat-value">
            {topDecision?.skill || "—"}
          </div>

          <div className="agent-stat-meta">
            {percentage(topDecision?.gap_score)}
            gap · {highPriorityCount} high priority
          </div>
        </AgentCard>

      </div>


      {/* DETAIL PANEL */}
      <div className="agent-detail-panel">

        {selectedAgent === "market" && (
          <>
            <div className="agent-detail-header">
              <div>
                <div className="eyebrow">MARKET SCOUT</div>
                <h3>Industry Demand Intelligence</h3>
              </div>

              <span className="agent-badge">
                {market?.signal_count || 0} signals
              </span>
            </div>

            <div className="agent-signal-list">
              {market?.signals?.map((item) => (
                <div className="agent-signal-row" key={item.skill_id}>
                  <div>
                    <strong>{item.skill}</strong>
                    <span>{item.category}</span>
                  </div>

                  <div className="signal-number">
                    {percentage(item.industry_demand)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {selectedAgent === "curriculum" && (
          <>
            <div className="agent-detail-header">
              <div>
                <div className="eyebrow">CURRICULUM MAPPER</div>
                <h3>Curriculum Coverage Intelligence</h3>
              </div>

              <span className="agent-badge">
                {curriculum?.signal_count || 0} signals
              </span>
            </div>

            <div className="agent-signal-list">
              {curriculum?.signals?.map((item) => (
                <div className="agent-signal-row" key={item.skill_id}>
                  <div>
                    <strong>{item.skill}</strong>
                    <span>{item.category}</span>
                  </div>

                  <div className="signal-number">
                    {percentage(item.curriculum_coverage)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {selectedAgent === "readiness" && (
          <>
            <div className="agent-detail-header">
              <div>
                <div className="eyebrow">CANDIDATE READINESS</div>
                <h3>Workforce Readiness Intelligence</h3>
              </div>

              <span className="agent-badge">
                {readiness?.signal_count || 0} signals
              </span>
            </div>

            <div className="agent-signal-list">
              {readiness?.signals?.map((item) => (
                <div className="agent-signal-row" key={item.skill_id}>
                  <div>
                    <strong>{item.skill}</strong>
                    <span>
                      {item.candidate_count} candidates assessed
                    </span>
                  </div>

                  <div className="signal-number">
                    {percentage(item.candidate_readiness)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}


        {selectedAgent === "decision" && (
          <>
            <div className="agent-detail-header">
              <div>
                <div className="eyebrow">DECISION SUPPORT</div>
                <h3>Priority Workforce Gaps</h3>
              </div>

              <span className="agent-badge">
                {decision?.total_skills_analyzed || 0} skills analyzed
              </span>
            </div>

            <div className="decision-feature">

              <div className="decision-main">
                <span className="decision-label">
                  TOP PRIORITY
                </span>

                <h4>
                  {topDecision?.skill || "—"}
                </h4>

                <p>
                  {topDecision?.recommendation ||
                    "No recommendation available."}
                </p>
              </div>

              <div className="decision-score">
                <span>GAP SCORE</span>

                <strong>
                  {percentage(topDecision?.gap_score)}
                </strong>

                <small>
                  {topDecision?.priority || "—"}
                </small>
              </div>

            </div>


            <div className="decision-metrics">

              <div>
                <span>Industry Demand</span>
                <strong>
                  {percentage(topDecision?.industry_demand)}
                </strong>
              </div>

              <div>
                <span>Curriculum Coverage</span>
                <strong>
                  {percentage(topDecision?.curriculum_coverage)}
                </strong>
              </div>

              <div>
                <span>Candidate Readiness</span>
                <strong>
                  {percentage(topDecision?.candidate_readiness)}
                </strong>
              </div>

            </div>

          </>
        )}

        {/* =========================================================
            DECISION REASONING
           ========================================================= */}
      <div className="reasoning-panel">

        <div className="reasoning-header">
          <div>
            <div className="reasoning-eyebrow">
              DECISION SUPPORT
            </div>

            <h3>
              Evidence → Signal → Decision
            </h3>

            <p>
              The decision layer connects industry demand, curriculum
              coverage and candidate readiness into a traceable reasoning chain.
            </p>
          </div>

          <div className="reasoning-status">
            <span className="status-dot" />
            ANALYSIS READY
          </div>
        </div>


        {topDecision ? (
          <>
            {/* PRIMARY SIGNAL */}

            <div className="reasoning-primary">

              <div className="reasoning-primary-copy">

                <div className="reasoning-label">
                  PRIMARY SIGNAL
                </div>

                <h4>
                  {topDecision.skill}
                </h4>

                <div className="reasoning-meta">
                  <span>{topDecision.category}</span>

                  <span className="reasoning-divider">
                    /
                  </span>

                  <span>
                    Skill ID {topDecision.skill_id}
                  </span>
                </div>

              </div>

              <div
                className={`reasoning-priority reasoning-priority-${String(
                  topDecision.priority || "unknown"
                ).toLowerCase()}`}
              >
                <span className="reasoning-priority-label">
                  PRIORITY
                </span>

                <strong>
                  {topDecision.priority || "—"}
                </strong>
              </div>

            </div>


            {/* SIGNAL SNAPSHOT */}

            <div className="reasoning-signals">

              <div className="reasoning-signal-card">
                <div className="reasoning-signal-top">
                  <span>Industry demand</span>
                  <span className="reasoning-signal-index">01</span>
                </div>

                <strong>
                  {percentage(topDecision.industry_demand)}
                </strong>

                <div className="reasoning-meter">
                  <span
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (topDecision.industry_demand || 0) * 100)
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Market requirement signal
                </small>
              </div>


              <div className="reasoning-signal-card">
                <div className="reasoning-signal-top">
                  <span>Curriculum coverage</span>
                  <span className="reasoning-signal-index">02</span>
                </div>

                <strong>
                  {percentage(topDecision.curriculum_coverage)}
                </strong>

                <div className="reasoning-meter">
                  <span
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          (topDecision.curriculum_coverage || 0) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Mapped learning coverage
                </small>
              </div>


              <div className="reasoning-signal-card">
                <div className="reasoning-signal-top">
                  <span>Candidate readiness</span>
                  <span className="reasoning-signal-index">03</span>
                </div>

                <strong>
                  {percentage(topDecision.candidate_readiness)}
                </strong>

                <div className="reasoning-meter">
                  <span
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          (topDecision.candidate_readiness || 0) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Workforce readiness signal
                </small>
              </div>


              <div className="reasoning-signal-card reasoning-gap-card">
                <div className="reasoning-signal-top">
                  <span>Gap score</span>
                  <span className="reasoning-signal-index">04</span>
                </div>

                <strong>
                  {topDecision.gap_score !== null &&
                  topDecision.gap_score !== undefined
                    ? topDecision.gap_score.toFixed(3)
                    : "—"}
                </strong>

                <div className="reasoning-gap-caption">
                  Composite decision signal
                </div>
              </div>

            </div>


            {/* REASONING CHAIN */}

            <div className="reasoning-chain-section">

              <div className="reasoning-section-heading">
                <div>
                  <span className="reasoning-label">
                    REASONING CHAIN
                  </span>

                  <h4>
                    How the signal becomes a decision
                  </h4>
                </div>

                <span className="reasoning-chain-count">
                  3 INPUTS
                </span>
              </div>


              <div className="reasoning-chain">

                <div className="reasoning-node">
                  <div className="reasoning-node-number">
                    01
                  </div>

                  <div>
                    <strong>
                      Demand
                    </strong>

                    <span>
                      {percentage(topDecision.industry_demand)}
                    </span>
                  </div>
                </div>


                <div className="reasoning-connector">
                  <span />
                </div>


                <div className="reasoning-node">
                  <div className="reasoning-node-number">
                    02
                  </div>

                  <div>
                    <strong>
                      Coverage
                    </strong>

                    <span>
                      {percentage(topDecision.curriculum_coverage)}
                    </span>
                  </div>
                </div>


                <div className="reasoning-connector">
                  <span />
                </div>


                <div className="reasoning-node">
                  <div className="reasoning-node-number">
                    03
                  </div>

                  <div>
                    <strong>
                      Readiness
                    </strong>

                    <span>
                      {percentage(topDecision.candidate_readiness)}
                    </span>
                  </div>
                </div>


                <div className="reasoning-connector">
                  <span />
                </div>


                <div className="reasoning-result-node">
                  <span>
                    DECISION
                  </span>

                  <strong>
                    {topDecision.priority || "—"}
                  </strong>
                </div>

              </div>

            </div>


            {/* EVIDENCE + DECISION */}

            <div className="reasoning-bottom-grid">

              <div className="reasoning-evidence">

                <div className="reasoning-section-heading">
                  <div>
                    <span className="reasoning-label">
                      EVIDENCE
                    </span>

                    <h4>
                      Signals supporting this analysis
                    </h4>
                  </div>
                </div>


                <div className="reasoning-evidence-list">

                  <div className="reasoning-evidence-row">
                    <span className="evidence-marker">
                      01
                    </span>

                    <div>
                      <strong>
                        Industry demand
                      </strong>

                      <p>
                        {percentage(topDecision.industry_demand)}
                        {" "}mapped demand signal for this skill.
                      </p>
                    </div>
                  </div>


                  <div className="reasoning-evidence-row">
                    <span className="evidence-marker">
                      02
                    </span>

                    <div>
                      <strong>
                        Curriculum coverage
                      </strong>

                      <p>
                        {percentage(topDecision.curriculum_coverage)}
                        {" "}of mapped curriculum coverage.
                      </p>
                    </div>
                  </div>


                  <div className="reasoning-evidence-row">
                    <span className="evidence-marker">
                      03
                    </span>

                    <div>
                      <strong>
                        Candidate readiness
                      </strong>

                      <p>
                        {percentage(topDecision.candidate_readiness)}
                        {" "}current readiness signal.
                      </p>
                    </div>
                  </div>

                </div>

              </div>


              <div className="reasoning-insight">

                <div className="reasoning-insight-header">
                  <span className="reasoning-label">
                    AI INSIGHT
                  </span>

                  <span className="reasoning-insight-icon">
                    ✦
                  </span>
                </div>

                <h4>
                  Decision interpretation
                </h4>

                <p>
                  {topDecision.recommendation ||
                    "The available evidence does not provide a decision recommendation."}
                </p>

                <div className="reasoning-insight-footer">
                  <span>
                    Gap score
                  </span>

                  <strong>
                    {topDecision.gap_score !== null &&
                    topDecision.gap_score !== undefined
                      ? topDecision.gap_score.toFixed(3)
                      : "INSUFFICIENT DATA"}
                  </strong>
                </div>

              </div>

            </div>


            {/* FOOTER META */}

            <div className="reasoning-footer">

              <span>
                Decision Support Agent
              </span>

              <span>
                {decision?.signals?.length || 0} signals analyzed
              </span>

              <span>
                {highPriorityCount} high-priority signals
              </span>

            </div>

          </>
        ) : (
          <div className="reasoning-empty">
            <span className="reasoning-empty-icon">
              ◌
            </span>

            <div>
              <strong>
                No decision signal available
              </strong>

              <p>
                Additional evidence is required before the decision layer can
                generate a reasoning chain.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  </section>
  );
}
