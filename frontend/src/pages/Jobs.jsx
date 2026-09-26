import { useEffect, useMemo, useRef, useState } from "react";

import { createJob, getJobs, getJob, getDistricts } from "../api/skillverse";

function demandClass(value) {
  if (value >= 0.9) return "demand-critical";
  if (value >= 0.75) return "demand-high";
  if (value >= 0.5) return "demand-medium";
  return "demand-low";
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [districts, setDistricts] = useState([]);
  const [draft, setDraft] = useState({
    title: "",
    company: "",
    district: "Jaipur",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const latestLoad = useRef(0);

  async function loadJobs() {
    const loadId = ++latestLoad.current;
    setLoading(true);
    setError("");

    try {
      const data = await getJobs({
        search: search.trim() || undefined,
        district:
          district === "All Districts"
            ? undefined
            : district,
      });

      if (loadId === latestLoad.current) setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      if (loadId === latestLoad.current) {
        setError(err.message || "Unable to load industry demand data.");
      }
    } finally {
      if (loadId === latestLoad.current) setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, district]);

  useEffect(() => {
    getDistricts()
      .then((data) => {
        const values = (Array.isArray(data) ? data : data?.districts || [])
          .map((item) => typeof item === "string" ? item : item.name)
          .filter(Boolean);
        setDistricts(values);
        if (values.length) {
          setDraft((current) => ({ ...current, district: current.district || values[0] }));
        }
      })
      .catch((error) => console.warn("District list unavailable:", error));
  }, []);

  async function submitJob(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await createJob(draft);
      const matched = result.skills_extracted?.length || 0;
      setNotice(
        `${result.updated_existing ? "Updated" : "Added"} ${result.title}. ${matched} known skill${matched === 1 ? "" : "s"} matched${result.warning ? ` — ${result.warning}` : "."}`
      );
      setDraft((current) => ({ ...current, title: "", company: "", description: "" }));
      await loadJobs();
    } catch (err) {
      setError(err.message || "Unable to save this job posting.");
    } finally {
      setSaving(false);
    }
  }

  async function openJob(job) {
    setSelectedJob(job);
    setDetailsLoading(true);
    setError("");

    try {
      const data = await getJob(job.id);
      setSelectedJob(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load job details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  const totalSkills = useMemo(() => {
    return jobs.reduce(
      (total, job) => total + (job.skills?.length || 0),
      0
    );
  }, [jobs]);

  const districtOptions = useMemo(
    () => ["All Districts", ...new Set([
      ...districts,
      ...jobs.map((job) => job.district).filter(Boolean),
    ])],
    [districts, jobs]
  );

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

      <section className="page-heading">
        <span className="eyebrow">INDUSTRY DEMAND</span>

        <h1>Understand what industry is asking for.</h1>

        <p>
          Explore EV job demand across districts and identify the
          skills employers require.
        </p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Jobs Tracked</span>
          <strong className="metric-value">
            {loading ? "—" : jobs.length}
          </strong>
          <span className="metric-description">
            Matching industry roles
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Skill Signals</span>
          <strong className="metric-value">
            {loading ? "—" : totalSkills}
          </strong>
          <span className="metric-description">
            Required skill relationships
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">District</span>
          <strong className="metric-value">
            {district === "All Districts" ? "ALL" : district}
          </strong>
          <span className="metric-description">
            Current geographic filter
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Sector</span>
          <strong className="metric-value">EV</strong>
          <span className="metric-description">
            Electric Mobility
          </span>
        </div>
      </section>

      <section className="panel job-intake-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">CURATED JOB INTAKE</span>
            <h2>Add an industry posting</h2>
            <p>Known EV skills are matched from the catalog. Review unmatched wording before using the result for decisions.</p>
          </div>
        </div>
        {notice && <div className="success-box" role="status">{notice}</div>}
        <form className="job-intake-form" onSubmit={submitJob}>
          <label>Role title<input required minLength={2} maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label>Employer<input required minLength={2} maxLength={160} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
          <label>District<input required list="job-district-options" value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} /><datalist id="job-district-options">{districts.map((item) => <option key={item} value={item} />)}</datalist></label>
          <label className="job-description-field">Job description<textarea required minLength={20} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Describe responsibilities, tools, technologies, and certifications…" /></label>
          <button className="primary-action" type="submit" disabled={saving || !draft.district}>{saving ? "Matching skills…" : "Save posting and match skills"}</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Industry Jobs</h2>
            <p>
              Search employer roles and inspect their required
              capabilities.
            </p>
          </div>

          <div className="matrix-count">
            {jobs.length}
            <span> roles</span>
          </div>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search job title or company..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={district}
            onChange={(event) =>
              setDistrict(event.target.value)
            }
          >
            {districtOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <button
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setDistrict("All Districts");
            }}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="warning-box">
            <strong>Data loading issue</strong>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="empty-analysis">
            Loading industry demand...
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-analysis">
            No jobs match the selected filters.
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <article
                className="job-card"
                key={job.id}
                onClick={() => openJob(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openJob(job);
                  }
                }}
                aria-label={`View ${job.title} at ${job.company}`}
              >
                <div className="job-card-top">
                  <div>
                    <span className="job-company">
                      {job.company}
                    </span>

                    <h3>{job.title}</h3>
                  </div>

                  <span className="district-pill">
                    {job.district}
                  </span>
                </div>

                <p className="job-description">
                  {job.description}
                </p>

                <div className="job-skills">
                  {(job.skills || []).slice(0, 5).map((skill) => (
                    <span
                      className={`skill-chip ${demandClass(
                        skill.demand
                      )}`}
                      key={skill.id}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>

                <div className="job-footer">
                  <span>
                    {(job.skills || []).length} required skills
                  </span>

                  <strong>View details →</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <section className="panel job-detail-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                JOB PROFILE
              </span>

              <h2>{selectedJob.title}</h2>

              <p>
                {selectedJob.company} ·{" "}
                {selectedJob.district}
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>

          {detailsLoading ? (
            <div className="empty-analysis">
              Loading job profile...
            </div>
          ) : (
            <>
              <p className="job-detail-description">
                {selectedJob.description}
              </p>

              <h3 className="subsection-title">
                Required Skills
              </h3>

              <div className="job-skill-list">
                {(selectedJob.skills || []).map((skill) => (
                  <div
                    className="job-skill-row"
                    key={skill.id}
                  >
                    <div>
                      <strong>{skill.name}</strong>
                      <span>{skill.category}</span>
                    </div>

                    <div className="demand-meter">
                      <div>
                        <span
                          style={{
                            width: `${skill.demand * 100}%`,
                          }}
                        />
                      </div>

                      <strong>
                        {Math.round(skill.demand * 100)}%
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
