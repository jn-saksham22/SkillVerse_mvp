import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      message: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error.",
    };
  }

  componentDidCatch(error, info) {
    console.error("SKILLVERSE UI ERROR:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <div className="error-card">
            <span className="section-label">
              SKILLVERSE SYSTEM
            </span>

            <h1>Something went wrong</h1>

            <p>
              The application encountered an unexpected UI error.
              Your saved decision data has not been deleted.
            </p>

            <code>{this.state.message}</code>

            <button
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
