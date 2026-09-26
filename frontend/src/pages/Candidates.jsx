import { useEffect, useMemo, useState } from "react";

import { getCandidates } from "../api/skillverse";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      try {
        setLoading(true);
        setError("");

        const data = await getCandidates(
          district ? { district } : {}
        );

        setCandidates(data);
      } catch (err) {
        console.error("Candidate loading failed:", err);
        setError("Unable to load candidate intelligence.");
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [district]);

  const districts = useMemo(() => {
    return [...new Set(candidates.map((candidate) => candidate.district))]
      .filter(Boolean)
      .sort();
  }, [candidates]);

  const stats = useMemo(() => {
    if (!candidates.length) {
      return {
        total: 0,
        avgReadiness: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    }

    const readinessValues = candidates.flatMap((candidate) =>
      candidate.skills.map((skill) => skill.readiness)
    );

    const avg =
      readinessValues.reduce((sum, value) => sum + value, 0) /
      readinessValues.length;

    let high = 0;
    let medium = 0;
    let low = 0;

    candidates.forEach((candidate) => {
      const values = candidate.skills.map((skill) => skill.readiness);

      const candidateAvg =
        values.reduce((sum, value) => sum + value, 0) /
        (values.length || 1);

      if (candidateAvg >= 0.65) {
        high++;
      } else if (candidateAvg >= 0.4) {
        medium++;
      } else {
        low++;
      }
    });

    return {
      total: candidates.length,
      avgReadiness: Math.round(avg * 100),
      high,
      medium,
      low,
    };
  }, [candidates]);

  const districtStats = useMemo(() => {
    const map = {};

    candidates.forEach((candidate) => {
      const name = candidate.district || "Unknown";

      if (!map[name]) {
        map[name] = {
          district: name,
          candidates: 0,
          readiness: [],
        };
      }

      map[name].candidates++;

      candidate.skills.forEach((skill) => {
        map[name].readiness.push(skill.readiness);
      });
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        avgReadiness: item.readiness.length
          ? Math.round(
              (item.readiness.reduce(
                (sum, value) => sum + value,
                0
              ) /
                item.readiness.length) *
                100
            )
          : 0,
      }))
      .sort((a, b) => b.candidates - a.candidates);
  }, [candidates]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand">SKILLVERSE</span>
          <p>
            Workforce Intelligence & Curriculum Decision System
          </p>
        </div>

        <div className="pilot-badge">
          <span />
          EV PILOT
        </div>
      </header>

      <section className="hero">
        <span className="eyebrow">WORKFORCE INTELLIGENCE</span>

        <h1>
          Understand the workforce behind the skill gap.
        </h1>

        <p>
          Explore candidate readiness across skills and districts
          to identify where existing workforce capacity can support
          industry demand.
        </p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">
            Candidates Assessed
          </span>

          <strong className="metric-value">
            {loading ? "—" : stats.total}
          </strong>

          <span className="metric-description">
            Workforce profiles
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Average Readiness
          </span>

          <strong className="metric-value">
            {loading ? "—" : `${stats.avgReadiness}%`}
          </strong>

          <span className="metric-description">
            Across assessed skills
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            High Readiness
          </span>

          <strong className="metric-value">
            {loading ? "—" : stats.high}
          </strong>

          <span className="metric-description">
            Candidate profiles
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Districts
          </span>

          <strong className="metric-value">
            {loading ? "—" : districtStats.length}
          </strong>

          <span className="metric-description">
            Workforce locations
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Candidate Intelligence</h2>
            <p>
              District-level workforce readiness and candidate
              capacity.
            </p>
          </div>

          <select
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option value="">All districts</option>

            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="warning-box">
            <strong>Data unavailable</strong>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            Loading candidate intelligence...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="gap-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Candidates</th>
                  <th>Avg Readiness</th>
                  <th>Workforce Signal</th>
                </tr>
              </thead>

              <tbody>
                {districtStats.map((item) => (
                  <tr key={item.district}>
                    <td>
                      <strong>{item.district}</strong>
                    </td>

                    <td>{item.candidates}</td>

                    <td>{item.avgReadiness}%</td>

                    <td>
                      <span
                        className={`priority ${
                          item.avgReadiness >= 65
                            ? "priority-low"
                            : item.avgReadiness >= 40
                              ? "priority-medium"
                              : "priority-high"
                        }`}
                      >
                        {item.avgReadiness >= 65
                          ? "HIGH READINESS"
                          : item.avgReadiness >= 40
                            ? "MODERATE READINESS"
                            : "LOW READINESS"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Candidate Readiness Distribution</h2>
            <p>
              Candidate profiles grouped by average skill readiness.
            </p>
          </div>
        </div>

        <div className="simulation-grid">
          <div>
            <span>High readiness</span>
            <strong>{stats.high}</strong>
          </div>

          <div>
            <span>Moderate readiness</span>
            <strong>{stats.medium}</strong>
          </div>

          <div>
            <span>Low readiness</span>
            <strong>{stats.low}</strong>
          </div>
        </div>
      </section>

      <footer>
        <span>SKILLVERSE MVP</span>
        <span>Candidate workforce intelligence</span>
      </footer>
    </main>
  );
}
