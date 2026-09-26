# SKILLVERSE — Design System & UI Specification

Consistent with the pitch deck's visual identity, so the product and the pitch look like the same thing.

---

## 1. Visual Identity

**Color palette**

| Token | Hex | Use |
|---|---|---|
| Navy (primary) | `#0B2E4E` | Headers, nav, primary buttons, dark cards |
| Navy Darker | `#071D33` | Hero/title surfaces only |
| Teal (secondary) | `#1C7293` | Section icons, links, secondary actions, active states |
| Steel (tertiary) | `#4E8FB0` | Chart lines/arrows, muted accents |
| Amber (sharp accent) | `#F2A93B` | Highlights, "Why?" evidence callouts, warnings-as-attention (not error) |
| Card tint | `#EEF4F8` | Card/section backgrounds on white |
| Text dark | `#16283B` | Headings, primary text |
| Text body | `#3B4C5B` | Body copy |
| Text muted | `#6B7C8C` | Captions, timestamps, placeholders |
| Success | `#1C7293` (teal, reuse) | Confirmed/approved states |
| Danger | `#C0392B` | Reject, high-risk, oversupply alerts |

Amber is reserved for "pay attention here" — evidence, confidence scores, alerts — never used as a generic decorative color, so it stays meaningful.

**Typography**
- Headings: a serif with presence (e.g. `Lora` or `Merriweather`, Google Fonts) — matches the pitch deck's Cambria feel in a web-safe way.
- Body/UI: `Inter` or `Source Sans 3` — clean, legible at small sizes for dense data tables.
- Scale: H1 28–32px, H2 22px, H3 16–18px, body 14px, caption 12px. Never below 12px for real content.

**Iconography**
- Feather or Font Awesome (via `react-icons`), always inside a filled circle badge (navy or teal), white icon — this is the repeated motif from the pitch deck; keep it identical in-product so the deck and the app read as one brand.

**Motifs to repeat everywhere**
- Icon-in-colored-circle badges next to every section header.
- Evidence Card: white card, amber left border, "Why?" expandable footer.
- Flow/pipeline diagrams use the same box-and-arrow style as the architecture diagram in the deck.

---

## 2. Layout Shell

- Left sidebar (fixed, navy): logo mark, nav items (Dashboard, Gap Explorer, Simulator, Recommendations, Employer Review, District Plans, Candidates [Phase 2]).
- Top bar: current district/domain filter, user role badge, notifications bell (skill-shock alerts).
- Main content: white background, `Card tint` (#EEF4F8) for grouped sections, generous padding (24px), max content width ~1280px centered on large screens.

---

## 3. Screens

### 3.1 Dashboard (landing)
- Top row: 3–4 KPI cards (Total Jobs Tracked, Districts Covered, Open Recommendations, Skill-Shock Alerts) — number + small trend arrow.
- Middle: demand-by-district map or bar chart (Recharts) + top 5 fastest-growing skills list.
- Bottom: recent alerts feed (obsolete/oversupply + skill shock), each row clickable into detail.

### 3.2 Skill Gap Explorer
- Filter bar: district, role, course (multi-select, sticky on scroll).
- Three-way gap visualization: grouped bar chart per skill (Industry / Course / Candidate), consistent with the deck's example table.
- Below chart: sortable data table — Skill | Industry Req. | Course Coverage | Candidate Level | Gap | Trend.
- Row click → side panel with the raw evidence behind that skill's numbers.

### 3.3 Capacity Simulator (flagship screen)
- Left: scenario controls — capacity increase slider (0–100%), district/course selector.
- Right: live-updating table (mirrors the deck's +10%/+30%/+50% table) — Scenario | New Capacity | Remaining Shortage | Risk — plus a line chart of shortage vs. capacity increase.
- "Recommend best option" panel below, pulled from the Decision Agent's ranked output, with its rationale text and an amber "Why?" expandable showing the underlying numbers.

### 3.4 Curriculum Recommendations
- Card list, one per course, grouped by district.
- Each card: course name, a tag row (ADD/UPGRADE/REDUCE/KEEP chips, color-coded — ADD teal, UPGRADE amber, REDUCE danger-muted, KEEP gray), one-line rationale, "Why?" expand → Evidence Card (metrics + confidence score, same layout as the deck's evidence example).
- Status badge: Pending Review / Employer Reviewed / Approved.

### 3.5 Employer Review (human-in-the-loop)
- Queue table: Recommendation | Course | District | Submitted | Status.
- Detail drawer: full Evidence Card + three actions — Agree / Modify (opens an edit form) / Reject, with a required one-line comment.
- Clear "AI recommends, you decide" framing at the top of every review screen — this is a trust cue, not just copy.

### 3.6 District Action Plan
- Report-style layout (printable/exportable): district header, growing-roles list, skill-gap summary, course-alignment %, recommended actions (courses to update, trainers to upskill, labs to add, capacity increase %) — mirrors the deck's Pune example layout exactly.
- Export to PDF button (maps to the `pdf` skill / a backend export endpoint).

### 3.7 Candidate Module (secondary, Phase 2-leaning but scaffold in Prelims)
- Simple form: qualification, current skills, district, target role.
- Result: readiness score (radial/gauge chart), gap list, suggested learning pathway as a horizontal step timeline (SQL → Python → Power BI → Project → Assessment style, per the deck example).

---

## 4. Shared Components

| Component | Notes |
|---|---|
| `EvidenceCard` | White card, amber left border, metrics list + confidence % + "Why?" toggle |
| `GapChart` | Recharts grouped bar chart, 3 series (Industry/Course/Candidate) |
| `ScenarioTable` | Sortable table + inline risk badges |
| `ActionTag` | Colored chip for ADD/UPGRADE/REDUCE/KEEP |
| `AlertBanner` | Amber (shock) or Danger (oversupply) left-border banner, dismissible |
| `FlowDiagram` | Reusable box+arrow renderer for pipeline/architecture views (admin/about page) |
| `FilterBar` | Sticky, district/role/course multi-select |
| `StatusBadge` | Pending / Reviewed / Approved / Rejected |

---

## 5. States & Accessibility

- Every data view needs an explicit **empty state** ("No jobs ingested for this district yet") and **loading state** (skeleton rows, not spinners over blank space) — the underlying data is curated/batch for Prelims, so empty states will happen often during the demo; design for it rather than showing a blank screen.
- Color is never the only signal: risk/status also gets a text label and/or icon (color-blind safe).
- Minimum tap target 40×40px for any interactive control (review actions especially — these are used by non-technical district staff).
- All charts need a data-table fallback view for screen readers / low-bandwidth contexts, given the target users include government field offices.

---

## 6. What NOT to build for Prelims

Full design-system tooling (Storybook, theming engine), animated transitions, dark mode, multi-language i18n scaffolding. Ship the 6 screens above, styled consistently, and stop — matches the "lean, defensible vertical slice" principle from `ARCHITECTURE.md`.
