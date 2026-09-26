const API_BASE =
  (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = typeof data === "object" ? data?.detail : null;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join("; ")
      : typeof detail === "string"
        ? detail
        : `API request failed: ${response.status}`;

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   CORE DASHBOARD
========================================================= */

export function getDashboardSummary() {
  return request("/dashboard/summary");
}

export function getSkills(params = {}) {
  const query = new URLSearchParams();

  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/skills${suffix}`);
}

export function getGapMatrix() {
  return request("/skills/gap-matrix");
}

export function getSkillAnalysis(skillId) {
  return request(`/skills/${skillId}/analysis`);
}

export function getJobs(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/jobs${suffix}`);
}

export function getJob(jobId) {
  return request(`/jobs/${jobId}`);
}

export function createJob(payload) {
  return request("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCourses(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/courses${suffix}`);
}

export function getCandidates(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/candidates${suffix}`);
}

/* =========================================================
   AGENT INTELLIGENCE
========================================================= */

export function getMarketScout(limit = 5, district = "") {
  const query = new URLSearchParams();

  query.set("limit", limit);

  if (district) {
    query.set("district", district);
  }

  return request(`/agents/market-scout?${query}`);
}

export function getCurriculumMapper(limit = 5) {
  return request(`/agents/curriculum-mapper?limit=${limit}`);
}

export function getCandidateReadiness(limit = 5, district = "") {
  const query = new URLSearchParams();

  query.set("limit", limit);

  if (district) {
    query.set("district", district);
  }

  return request(`/agents/candidate-readiness?${query}`);
}

export function getDecisionSupport(limit = 10) {
  return request(`/agents/decision-support?limit=${limit}`);
}

export function getAgentReasoning(evidence) {
  return request("/agents/reason", {
    method: "POST",
    body: JSON.stringify(evidence),
  });
}

/* =========================================================
   DECISION REVIEW
========================================================= */

export function generateDecision(skillId) {
  return request("/decisions/generate", {
    method: "POST",
    body: JSON.stringify({ skill_id: skillId }),
  });
}

export function generateDecisionBatch(limit = 5) {
  return request(`/decisions/generate-batch?limit=${encodeURIComponent(limit)}`, {
    method: "POST",
  });
}

export async function getDecisions(status = "") {
  const suffix = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return request(`/decisions${suffix}`);
}

export async function getDecision(decisionId) {
  return request(`/decisions/${decisionId}`);
}

export async function updateDecision(decisionId, payload) {
  return request(`/decisions/${decisionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getDecisionEvidence(decisionId) {
  return request(`/decisions/${decisionId}/evidence`);
}

/* =========================================================
   INTERVENTION
========================================================= */

export function createInterventionFromDecision(decisionId) {
  return request(`/decisions/${decisionId}/intervention`, {
    method: "POST",
  });
}

export function getInterventions(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/interventions${suffix}`);
}

export function getIntervention(interventionId) {
  return request(`/interventions/${interventionId}`);
}

export function updateIntervention(interventionId, payload) {
  return request(`/interventions/${interventionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   CURRICULUM ACTIONS
========================================================= */

export async function getCurriculumActions(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/curriculum/actions${suffix}`);
}

export function recommendCurriculumActions() {
  return request("/final/curriculum/recommend", {
    method: "POST",
  });
}

export function updateCurriculumAction(actionId, payload) {
  return request(`/final/curriculum/actions/${actionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   WHAT-IF SIMULATION
========================================================= */

export function simulateWhatIf(payload) {
  return request("/what-if/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function simulateIntervention(payload) {
  return request("/final/simulate/intervention", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSimulationHistory() {
  return request("/final/simulate/intervention/history");
}

/* =========================================================
   EMPLOYER VALIDATION
========================================================= */

export function getEmployerValidations(decisionId = "") {
  const suffix = decisionId
    ? `?decision_id=${encodeURIComponent(decisionId)}`
    : "";

  return request(`/employer-validations${suffix}`);
}

export async function createEmployerValidation(payload) {
  return request("/employer-validations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   DISTRICT PLANNING
========================================================= */

export async function generateDistrictPlan(payload) {
  return request("/district-plans/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDistrictPlans(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query}` : "";

  return request(`/final/district/training-plans${suffix}`);
}

/* =========================================================
   LEGACY CAPACITY SIMULATION
========================================================= */

export function simulateCapacity(
  currentCapacity,
  demand,
  increasePct
) {
  return request("/simulate/capacity", {
    method: "POST",
    body: JSON.stringify({
      current_capacity: currentCapacity,
      demand,
      increase_pct: increasePct,
    }),
  });
}


/* District selector */
export async function getDistricts() {
  return request("/districts");
}
