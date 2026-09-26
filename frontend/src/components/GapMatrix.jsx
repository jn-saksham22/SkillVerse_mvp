import { useMemo, useState } from "react";

function percentage(value) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function priorityClass(priority) {
  return `priority priority-${priority
    .toLowerCase()
    .replaceAll("_", "-")}`;
}

function metricClass(value) {
  if (value == null) return "metric-na";
  if (value < 0.5) return "metric-low";
  if (value < 0.75) return "metric-mid";
  return "metric-high";
}

export default function GapMatrix({
  skills,
  loading,
  onSelectSkill,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const categories = useMemo(() => {
    return [
      "ALL",
      ...new Set(
        skills
          .map((skill) => skill.category)
          .filter(Boolean)
      ),
    ];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch = skill.skill
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "ALL" ||
        skill.category === category;

      const matchesPriority =
        priority === "ALL" ||
        skill.priority === priority;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPriority
      );
    });
  }, [skills, search, category, priority]);

  return (
    <section className="panel gap-matrix-panel">

      {/* HEADER */}
      <div className="panel-header gap-matrix-header">

        <div>
          <span className="eyebrow">
            SKILL INTELLIGENCE
          </span>

          <h2>Skill Gap Matrix</h2>

          <p>
            Industry demand, curriculum coverage and
            candidate readiness across the EV workforce
            dataset.
          </p>
        </div>

        <div className="matrix-summary">
          <strong>
            {filteredSkills.length}
          </strong>

          <span>
            / {skills.length} skills
          </span>

          <small>
            {filteredSkills.length === skills.length
              ? "FULL DATASET"
              : "FILTERED VIEW"}
          </small>
        </div>

      </div>


      {/* FILTER BAR */}
      <div className="matrix-toolbar">

        <div className="matrix-search">

          <span className="search-icon">
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search skills..."
            aria-label="Search skills"
          />

        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          aria-label="Filter by category"
        >
          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item === "ALL"
                ? "All categories"
                : item}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value)
          }
          aria-label="Filter by priority"
        >
          <option value="ALL">
            All priorities
          </option>
          <option value="CRITICAL">
            Critical
          </option>
          <option value="HIGH">
            High
          </option>
          <option value="MEDIUM">
            Medium
          </option>
          <option value="LOW">
            Low
          </option>
          <option value="INSUFFICIENT_DATA">
            Insufficient data
          </option>
        </select>

      </div>


      {/* TABLE */}
      {loading ? (
        <div className="loading-state">
          Loading skill intelligence...
        </div>
      ) : (

        <div className="table-wrapper matrix-table-wrapper">

          <table className="gap-table">

            <thead>
              <tr>
                <th>Skill</th>
                <th>Category</th>
                <th>Industry</th>
                <th>Curriculum</th>
                <th>Readiness</th>
                <th>Gap</th>
                <th>Priority</th>
              </tr>
            </thead>

            <tbody>

              {filteredSkills.map((skill) => (

                <tr
                  key={skill.skill_id}
                  onClick={() =>
                    onSelectSkill(
                      skill.skill_id
                    )
                  }
                  className="clickable-row"
                >

                  <td className="skill-name-cell">

                    <strong>
                      {skill.skill}
                    </strong>

                    <span>
                      ID-{String(
                        skill.skill_id
                      ).padStart(2, "0")}
                    </span>

                  </td>


                  <td>

                    <span className="category-pill">
                      {skill.category}
                    </span>

                  </td>


                  <td>
                    <span
                      className={`matrix-metric ${metricClass(
                        skill.demand
                      )}`}
                    >
                      {percentage(
                        skill.demand
                      )}
                    </span>
                  </td>


                  <td>
                    <span
                      className={`matrix-metric ${metricClass(
                        skill.coverage
                      )}`}
                    >
                      {percentage(
                        skill.coverage
                      )}
                    </span>
                  </td>


                  <td>
                    <span
                      className={`matrix-metric ${metricClass(
                        skill.readiness
                      )}`}
                    >
                      {percentage(
                        skill.readiness
                      )}
                    </span>
                  </td>


                  <td>

                    {skill.gap_score == null ? (
                      <span className="matrix-na">
                        —
                      </span>
                    ) : (
                      <strong className="gap-score">
                        {(
                          skill.gap_score * 100
                        ).toFixed(2)}
                        %
                      </strong>
                    )}

                  </td>


                  <td>

                    <span
                      className={priorityClass(
                        skill.priority
                      )}
                    >
                      {skill.priority.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                  </td>

                </tr>

              ))}


              {!filteredSkills.length && (

                <tr>

                  <td
                    colSpan="7"
                    className="empty-state"
                  >
                    No matching skills found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </section>
  );
}
