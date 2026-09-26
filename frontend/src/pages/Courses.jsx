import { useEffect, useMemo, useState } from "react";

import { getCourses } from "../api/skillverse";

function coverageClass(value) {
  if (value >= 0.85) return "coverage-strong";
  if (value >= 0.6) return "coverage-good";
  if (value >= 0.35) return "coverage-medium";
  return "coverage-low";
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const data = await getCourses({
        search: search.trim() || undefined,
      });

      setCourses(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load curriculum data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const totalSkillSignals = useMemo(() => {
    return courses.reduce(
      (total, course) => total + course.skills.length,
      0
    );
  }, [courses]);

  const averageCoverage = useMemo(() => {
    const values = courses.flatMap((course) =>
      course.skills.map((skill) => skill.coverage)
    );

    if (!values.length) return 0;

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    );
  }, [courses]);

  const providers = useMemo(() => {
    return new Set(
      courses.map((course) => course.provider)
    ).size;
  }, [courses]);

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
        <span className="eyebrow">CURRICULUM INTELLIGENCE</span>

        <h1>Understand what training actually covers.</h1>

        <p>
          Explore EV learning programs and see which industry
          skills are represented in the current curriculum.
        </p>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Courses</span>
          <strong className="metric-value">
            {loading ? "—" : courses.length}
          </strong>
          <span className="metric-description">
            Curriculum sources
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Providers</span>
          <strong className="metric-value">
            {loading ? "—" : providers}
          </strong>
          <span className="metric-description">
            Training organizations
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Skill Signals</span>
          <strong className="metric-value">
            {loading ? "—" : totalSkillSignals}
          </strong>
          <span className="metric-description">
            Course-skill relationships
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Avg Coverage</span>
          <strong className="metric-value">
            {loading
              ? "—"
              : `${Math.round(averageCoverage * 100)}%`}
          </strong>
          <span className="metric-description">
            Across displayed curriculum
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Curriculum Sources</h2>
            <p>
              Search training programs and inspect their skill
              coverage.
            </p>
          </div>

          <div className="matrix-count">
            {courses.length}
            <span> courses</span>
          </div>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search course or provider..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <div />

          <button
            className="secondary-button"
            onClick={() => setSearch("")}
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
            Loading curriculum intelligence...
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-analysis">
            No courses match the current search.
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => {
              const average =
                course.skills.length > 0
                  ? course.skills.reduce(
                      (sum, skill) =>
                        sum + skill.coverage,
                      0
                    ) / course.skills.length
                  : 0;

              return (
                <article
                  className="course-card"
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="course-card-top">
                    <div>
                      <span className="course-provider">
                        {course.provider}
                      </span>

                      <h3>{course.name}</h3>
                    </div>

                    <span
                      className={`coverage-badge ${coverageClass(
                        average
                      )}`}
                    >
                      {Math.round(average * 100)}%
                    </span>
                  </div>

                  <div className="course-summary">
                    <strong>
                      {course.skills.length}
                    </strong>
                    <span>skills covered</span>
                  </div>

                  <div className="course-skills">
                    {course.skills
                      .slice(0, 5)
                      .map((skill) => (
                        <span
                          className="course-skill-chip"
                          key={skill.id}
                        >
                          {skill.name}
                        </span>
                      ))}
                  </div>

                  <div className="course-footer">
                    <span>
                      Curriculum coverage profile
                    </span>

                    <strong>View details →</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedCourse && (
        <section className="panel course-detail-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                CURRICULUM PROFILE
              </span>

              <h2>{selectedCourse.name}</h2>

              <p>{selectedCourse.provider}</p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setSelectedCourse(null)}
            >
              Close
            </button>
          </div>

          <h3 className="subsection-title">
            Skill Coverage
          </h3>

          <div className="course-skill-list">
            {selectedCourse.skills.map((skill) => (
              <div
                className="course-skill-row"
                key={skill.id}
              >
                <div>
                  <strong>{skill.name}</strong>
                  <span>{skill.category}</span>
                </div>

                <div className="coverage-meter">
                  <div>
                    <span
                      style={{
                        width: `${skill.coverage * 100}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {Math.round(skill.coverage * 100)}%
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
