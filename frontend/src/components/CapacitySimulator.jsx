import { useEffect, useState } from "react";
import { simulateIntervention } from "../api/skillverse";

export default function CapacitySimulator({ analysis, decisionId }) {
  const [strength, setStrength] = useState(60);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSimulation(null);
    setError("");
  }, [analysis?.skill?.id]);

  async function runSimulation() {
    if (!analysis?.skill?.id) {
      setError("Select a skill from the gap matrix first.");
      return;
    }
    if (!analysis.candidates_assessed) {
      setError("Candidate readiness evidence is required to simulate this skill.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await simulateIntervention({
        skill_id: analysis.skill.id,
        intervention_strength: strength / 100,
        estimated_candidates: analysis.candidates_assessed,
        intervention_type: "Targeted skill upskilling",
        decision_id: decisionId,
      });
      setSimulation(result);
    } catch (err) {
      setError(err.message || "Unable to run the skill intervention simulation.");
    } finally {
      setLoading(false);
    }
  }

  const before = simulation?.simulation?.current_readiness;
  const after = simulation?.simulation?.projected_readiness;
  const gapReduction = simulation?.impact?.gap_reduction;

  return (
    <section className="panel simulator">
      <div className="panel-header">
        <div>
          <span className="eyebrow">WHAT-IF MODEL</span>
          <h2>Skill intervention simulator</h2>
          <p>
            Model a readiness improvement for {analysis?.skill?.name || "a selected skill"}. The result is saved as a simulation record.
          </p>
        </div>

        <strong className="slider-value">{strength}%</strong>
      </div>

      <input
        className="capacity-slider"
        type="range"
        min="0"
        max="100"
        value={strength}
        onChange={(event) => setStrength(Number(event.target.value))}
      />

      <button className="primary-action" onClick={runSimulation} disabled={loading || !analysis?.skill?.id}>
        {loading ? "Calculating impact…" : "Run simulation"}
      </button>

      {error && <div className="warning-box" role="alert">{error}</div>}

      {simulation && (
        <div className="simulation-grid">
          <div><span>Readiness before</span><strong>{(before * 100).toFixed(1)}%</strong></div>
          <div><span>Readiness after</span><strong>{(after * 100).toFixed(1)}%</strong></div>
          <div><span>Gap reduction</span><strong>{(gapReduction * 100).toFixed(1)} pts</strong></div>
        </div>
      )}
    </section>
  );
}
