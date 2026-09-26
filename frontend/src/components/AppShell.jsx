import { useState } from "react";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "jobs", label: "Jobs", icon: "◫" },
  { id: "courses", label: "Curriculum", icon: "▣" },
  { id: "candidates", label: "Candidates", icon: "◉" },
  { id: "agents", label: "Agents", icon: "✦" },
  { id: "decisions", label: "Decision Review", icon: "✓" },
  { id: "action-center", label: "Action Center", icon: "◆" },
];

export default function AppShell({ page, setPage, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(nextPage) {
    setPage(nextPage);
    setSidebarOpen(false);
  }

  return (
    <div className="skillverse-app">

      <aside className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`}>

        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">S</div>

          <div>
            <strong>SKILLVERSE</strong>
            <span>Workforce Intelligence</span>
          </div>
        </div>

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${
                page === item.id ? "sidebar-nav-item-active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <span className="sidebar-nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>

              {page === item.id && (
                <span className="sidebar-active-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-pilot">
            <span className="status-dot" />

            <div>
              <strong>EV PILOT</strong>
              <span>Electric Mobility</span>
            </div>
          </div>

          <div className="sidebar-version">
            SKILLVERSE MVP · v0.1
          </div>

        </div>

      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">

        <header className="mobile-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>

          <strong>SKILLVERSE</strong>

          <span className="mobile-status">
            <span className="status-dot" />
            LIVE
          </span>
        </header>

        {children}

      </div>

    </div>
  );
}
