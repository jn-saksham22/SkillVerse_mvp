import { useEffect, useMemo, useState } from "react";
import { getJobs } from "../api/skillverse";

export default function JobsExplorer() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const data = await getJobs({
          search: search.trim() || undefined,
          district: district || undefined,
        });

        setJobs(data);
      } catch (err) {
        console.error("Jobs loading failed:", err);
        setError("Unable to load jobs.");
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [search, district]);

  const districts = useMemo(() => {
    return [...new Set(jobs.map((job) => job.district).filter(Boolean))].sort();
  }, [jobs]);

  return (
    <section className="panel jobs-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">INDUSTRY DEMAND</span>
          <h2>Jobs Explorer</h2>
          <p>
            Explore EV workforce demand across companies, districts and skills.
          </p>
        </div>

        <div className="matrix-count">
          {jobs.length}
          <span> jobs</span>
        </div>
      </div>

      <div className="jobs-filters">
        <input
          type="search"
          placeholder="Search job title or company..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

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

      {loading && (
        <div className="loading-state jobs-loading">
          Loading industry demand...
        </div>
      )}

      {error && !loading && (
        <div className="warning-box">
          <strong>Unable to load jobs</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="empty-state jobs-empty">
          No jobs match the selected filters.
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="jobs-layout">
          <div className="jobs-list">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className={`job-card ${
                  selectedJob?.id === job.id ? "job-card-selected" : ""
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="job-card-top">
                  <div>
                    <strong>{job.title}</strong>
                    <span>{job.company}</span>
                  </div>

                  <span className="job-district">{job.district}</span>
                </div>

                <p>{job.description}</p>

                <div className="job-skills-preview">
                  {job.skills.slice(0, 4).map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}

                  {job.skills.length > 4 && (
                    <span>+{job.skills.length - 4} more</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="job-detail">
            {!selectedJob ? (
              <div className="job-detail-empty">
                <span className="eyebrow">JOB DETAIL</span>
                <h3>Select a job</h3>
                <p>
                  Choose an opportunity from the list to inspect its required
                  skill profile.
                </p>
              </div>
            ) : (
              <>
                <div className="job-detail-heading">
                  <span className="eyebrow">JOB DETAIL</span>
                  <h3>{selectedJob.title}</h3>
                  <p>
                    {selectedJob.company} · {selectedJob.district}
                  </p>
                </div>

                <div className="job-description">
                  <span>Description</span>
                  <p>{selectedJob.description}</p>
                </div>

                <div className="job-required-skills">
                  <div className="job-section-heading">
                    <div>
                      <span className="eyebrow">REQUIRED SKILLS</span>
                      <h4>Industry skill profile</h4>
                    </div>

                    <strong>{selectedJob.skills.length}</strong>
                  </div>

                  <div className="required-skills-list">
                    {selectedJob.skills.map((skill) => (
                      <div className="required-skill" key={skill.id}>
                        <div>
                          <strong>{skill.name}</strong>
                          <span>{skill.category}</span>
                        </div>

                        <div className="demand-value">
                          <span>Demand</span>
                          <strong>
                            {Math.round(skill.demand * 100)}%
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
