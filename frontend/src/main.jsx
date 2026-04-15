import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./styles.css";
import App from "./App";
import { AuthProvider } from "./lib/auth.jsx";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("boundary:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 20, color: "#fbbf24", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", background: "#0c0e0d", minHeight: "100vh" }}>
          <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 12 }}>RENDER CRASH</div>
          <div>{String(this.state.err?.message || this.state.err)}</div>
          <pre style={{ marginTop: 12, opacity: .7 }}>{this.state.err?.stack}</pre>
          <button style={{ marginTop: 16, padding: "8px 16px", background: "#d4ff3a", color: "#0c0e0d", border: "none", borderRadius: 8 }}
                  onClick={() => location.reload()}>reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
