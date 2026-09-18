import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_URL } from "../config/api";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg border-bottom custom-navbar">
      <div className="container p-2">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="/media/logo.svg"
            style={{ maxHeight: "36px", marginRight: "10px" }}
            alt="Tradely"
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/product">
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/pricing">
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/support">
                Support
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              style={{
                background: "transparent",
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.15))",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                color: "var(--text-primary, inherit)",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* Auth / Dashboard Navigation */}
            {isAuthenticated && user ? (
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-primary, inherit)",
                    padding: "4px 8px",
                  }}
                >
                  👤 {user.username}
                </span>

                <a
                  href={DASHBOARD_URL}
                  className="btn btn-primary btn-sm px-3"
                  style={{
                    backgroundColor: "var(--accent-blue, #3b82f6)",
                    borderColor: "var(--accent-blue, #3b82f6)",
                    borderRadius: "6px",
                  }}
                >
                  Dashboard ↗
                </a>

                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline-danger btn-sm px-2"
                  style={{ borderRadius: "6px", fontSize: "0.85rem" }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-link"
                  style={{ fontWeight: 500 }}
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className="btn btn-primary btn-sm px-3"
                  style={{
                    backgroundColor: "var(--accent-blue, #3b82f6)",
                    borderColor: "var(--accent-blue, #3b82f6)",
                    borderRadius: "6px",
                  }}
                >
                  Sign Up
                </Link>

                <a
                  href={DASHBOARD_URL}
                  className="btn btn-outline-primary btn-sm px-3"
                  style={{
                    borderColor: "var(--accent-blue, #3b82f6)",
                    color: "var(--accent-blue, #3b82f6)",
                    borderRadius: "6px",
                  }}
                >
                  Trading Terminal ↗
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
