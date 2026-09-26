import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AgentIntelligence from "../components/AgentIntelligence";
import MetricCard from "../components/MetricCard";
import GapMatrix from "../components/GapMatrix";
import SkillAnalysis from "../components/SkillAnalysis";
import CapacitySimulator from "../components/CapacitySimulator";

import {
  getDashboardSummary,
  getGapMatrix,
  getSkillAnalysis,
  getDecisions,
  generateDecision,
} from "../api/skillverse";

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [skills, setSkills] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] =
    useState(null);

  const [decisions, setDecisions] =
    useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [generatingDecision, setGeneratingDecision] = useState(false);
  const [generatedDecision, setGeneratedDecision] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, matrixData, decisionData] = await Promise.all([
          getDashboardSummary(),
          getGapMatrix(),
          getDecisions(),
        ]);

        setSummary(summaryData);
        setSkills(matrixData.skills || []);
        setDecisions(Array.isArray(decisionData) ? decisionData : []);
      } catch (error) {
        console.error("Dashboard loading failed:", error);
        setLoadError(error.message || "Unable to load workforce data. Check the API and database connection.");
      } finally {
        setLoadingSummary(false);
        setLoadingSkills(false);
      }
    }

    loadDashboard();
  }, []);

  const criticalGaps =
    skills.filter(
      (skill) =>
        skill.priority === "CRITICAL" ||
        skill.priority === "HIGH"
    ).length;

  const pendingValidations =
    decisions.filter(
      (decision) =>
        decision.status === "PROPOSED" ||
        decision.status === "UNDER_REVIEW"
    ).length;

  const chartSkills = [...skills]
    .filter((skill) => skill.gap_score != null)
    .sort((a, b) => b.gap_score - a.gap_score)
    .slice(0, 8)
    .map((skill) => ({
      ...skill,
      shortName: skill.skill.length > 22 ? `${skill.skill.slice(0, 20)}…` : skill.skill,
      gap_percent: Math.round(skill.gap_score * 100),
    }));

  async function selectSkill(skillId) {
    setLoadingAnalysis(true);

    try {
      const analysis = await getSkillAnalysis(skillId);
      setSelectedAnalysis(analysis);
    } catch (error) {
      console.error("Skill analysis failed:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function createDecisionBrief() {
    const skillId = selectedAnalysis?.skill?.id;
    if (!skillId) return;

    setGeneratingDecision(true);
    setDecisionError("");
    try {
      const result = await generateDecision(skillId);
      setGeneratedDecision(result.decision || result);
    } catch (error) {
      setDecisionError(error.message || "Could not create a decision brief.");
    } finally {
      setGeneratingDecision(false);
    }
  }

  const activeDecision = generatedDecision?.skill_id === selectedAnalysis?.skill?.id
    ? generatedDecision
    : decisions.find((decision) =>
      decision.skill_id === selectedAnalysis?.skill?.id &&
      ["PROPOSED", "UNDER_REVIEW"].includes(decision.status)
    );

  return (
    <main className="dashboard-page">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <header className="dashboard-header">

        <div className="dashboard-header-main">

          <div className="eyebrow">
            ELECTRIC MOBILITY · WORKFORCE INTELLIGENCE
          </div>

          <h1>
            Workforce intelligence for better skill decisions.
          </h1>

          <p>
            Connect industry demand, curriculum coverage and candidate
            readiness through a single evidence-driven system.
          </p>

        </div>

        <div className="dashboard-context">

          <div className="context-status">
            <span className="status-dot" />
            SYSTEM ACTIVE
          </div>

          <div className="context-label">
            EV PILOT
          </div>

          <div className="context-value">
            Electric Mobility
          </div>

        </div>

      </header>


      {/* ======================================================
          EXECUTIVE METRICS
          ====================================================== */}

      <section className="metrics-grid">

        <MetricCard
          label="Jobs Tracked"
          value={
            loadingSummary
              ? "—"
              : summary?.jobs_tracked ?? 0
          }
          description="Industry demand signals"
        />

        <MetricCard
          label="Skills"
          value={
            loadingSummary
              ? "—"
              : summary?.skills_tracked ?? 0
          }
          description="Tracked EV skills"
        />

        <MetricCard
          label="Courses"
          value={
            loadingSummary
              ? "—"
              : summary?.courses_tracked ?? 0
          }
          description="Curriculum sources"
        />

        <MetricCard
          label="Candidates"
          value={
            loadingSummary
              ? "—"
              : summary?.candidates_tracked ?? 0
          }
          description="Assessed workforce pool"
        />

        <MetricCard
          label="Priority Gaps"
          value={
            loadingSkills
              ? "—"
              : criticalGaps
          }
          description="High / critical intervention signals"
        />

        <MetricCard
          label="Pending Validation"
          value={
            loadingSummary
              ? "—"
              : pendingValidations
          }
          description="Human review queue"
        />

      </section>

      {loadError && (
        <div className="warning-box" role="alert">
          <strong>Dashboard data unavailable</strong>
          <p>{loadError}</p>
        </div>
      )}

      <section className="dashboard-charts" aria-label="Demand and skill gap charts">
        <article className="dashboard-chart-panel">
          <div className="chart-heading">
            <span className="eyebrow">SKILL SIGNALS</span>
            <h2>Industry demand and workforce supply</h2>
            <p>Compare average job demand intensity, curriculum coverage, and candidate readiness.</p>
          </div>
          {chartSkills.length ? (
            <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSkills} margin={{ top: 8, right: 8, left: -18, bottom: 36 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="shortName" angle={-25} textAnchor="end" interval={0} height={58} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`} />
                  <Legend />
                  <Bar dataKey="demand" name="Industry" fill="#1c7293" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coverage" name="Curriculum" fill="#4e8fb0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="readiness" name="Readiness" fill="#f2a93b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty-analysis">Seed job, course, and candidate evidence to populate this chart.</div>}
        </article>

        <article className="dashboard-chart-panel">
          <div className="chart-heading">
            <span className="eyebrow">PRIORITY RANKING</span>
            <h2>Largest modeled skill gaps</h2>
            <p>Ranked using the documented demand, coverage, and readiness weights.</p>
          </div>
          {chartSkills.length ? (
            <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSkills} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="shortName" width={135} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="gap_percent" name="Gap score" fill="#0b2e4e" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty-analysis">No complete skill gaps to rank yet.</div>}
        </article>
      </section>


      <section
        className="workflow-strip"
        aria-label="SKILLVERSE decision workflow"
      >

        <div className="workflow-strip-heading">

          <span className="eyebrow">
            DECISION WORKFLOW
          </span>

          <strong>
            AI reasons · Python calculates · Humans approve
          </strong>

        </div>


        <div className="workflow-steps">

          {[
            ["01", "Evidence", "Industry signals"],
            ["02", "Skill Gap", "Demand × supply"],
            ["03", "Decision", "AI recommendation"],
            ["04", "Validation", "Human / employer"],
            ["05", "Intervention", "Curriculum + capacity"],
            ["06", "Simulation", "Before implementation"],
          ].map(
            ([number, title, detail]) => (

              <div
                className="workflow-step"
                key={number}
              >

                <span>
                  {number}
                </span>

                <div>
                  <strong>
                    {title}
                  </strong>

                  <small>
                    {detail}
                  </small>
                </div>

              </div>

            )
          )}

        </div>

      </section>


      {/* ======================================================
          AI AGENT INTELLIGENCE
          ====================================================== */}

      {/* ======================================================
          SKILL GAP MATRIX
          ====================================================== */}

      <GapMatrix
        skills={skills}
        loading={loadingSkills}
        onSelectSkill={selectSkill}
      />


      {/* ======================================================
          SELECTED SKILL ANALYSIS
          ====================================================== */}

        <SkillAnalysis
          analysis={selectedAnalysis}
          loading={loadingAnalysis}
          decisionId={activeDecision?.id}
          onOpenReview={() => onNavigate?.("decisions")}
        onGenerateDecision={createDecisionBrief}
        generatingDecision={generatingDecision}
        decisionError={decisionError}
      />

      <AgentIntelligence />


      {/* ======================================================
          CAPACITY SIMULATOR
          ====================================================== */}

      <CapacitySimulator analysis={selectedAnalysis} decisionId={activeDecision?.id} />


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="dashboard-footer">
        <span>SKILLVERSE MVP</span>
        <span>
          Evidence-driven workforce intelligence
        </span>
      </footer>

    </main>
  );
}
