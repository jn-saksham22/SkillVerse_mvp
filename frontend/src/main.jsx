import React, { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";

import AppShell from "./components/AppShell";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Courses = lazy(() => import("./pages/Courses"));
const Candidates = lazy(() => import("./pages/Candidates"));
const Agents = lazy(() => import("./pages/Agents"));
const DecisionReview = lazy(() => import("./pages/DecisionReview"));
const ActionCenter = lazy(() => import("./pages/ActionCenter"));

import "./style.css";
import ErrorBoundary from "./components/ErrorBoundary";
import "./final-polish.css";


function App() {
  const [page, setPage] = useState("dashboard");

  function renderPage() {

    switch (page) {

      case "jobs":
        return <Jobs />;

      case "courses":
        return <Courses />;

      case "candidates":
        return <Candidates />;

      case "agents":
        return <Agents />;

      case "action-center":
        return <ActionCenter />;

      case "decisions":
        return <DecisionReview />;

      case "dashboard":
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  }


  return (
    <AppShell
      page={page}
      setPage={setPage}
    >
      <ErrorBoundary>
        <Suspense fallback={<div className="route-loading" role="status">Loading workspace…</div>}>
          {renderPage()}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}


createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
