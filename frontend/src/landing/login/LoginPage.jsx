import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DASHBOARD_URL } from "../../config/api";

function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Navigate to trading dashboard (cookie is already set via HttpOnly)
      window.location.href = DASHBOARD_URL;
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="container py-5 d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card p-4 p-md-5"
        style={{
          maxWidth: "440px",
          width: "100%",
          backgroundColor: "var(--bg-surface, #2f2f2f)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.09))",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          color: "var(--text-primary, #ececec)",
        }}
      >
        <div className="text-center mb-4">
          <img
            src="/media/logo.svg"
            alt="Tradely"
            style={{ maxHeight: "40px", marginBottom: "16px" }}
          />
          <h3 style={{ fontWeight: 700, letterSpacing: "-0.5px" }}>Welcome back</h3>
          <p style={{ color: "var(--text-secondary, #b4b4b4)", fontSize: "0.95rem" }}>
            Sign in to access your trading portfolio
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 px-3 mb-4"
            role="alert"
            style={{
              fontSize: "0.9rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label
              htmlFor="email"
              className="form-label"
              style={{ fontSize: "0.88rem", fontWeight: 500 }}
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              style={{
                backgroundColor: "var(--bg-main, #212121)",
                borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.15))",
                color: "var(--text-primary, #ececec)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="form-label"
              style={{ fontSize: "0.88rem", fontWeight: 500 }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              style={{
                backgroundColor: "var(--bg-main, #212121)",
                borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.15))",
                color: "var(--text-primary, #ececec)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mb-3"
            disabled={isSubmitting}
            style={{
              backgroundColor: "var(--accent-blue, #3b82f6)",
              borderColor: "var(--accent-blue, #3b82f6)",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            {isSubmitting ? (
              <span>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-secondary, #b4b4b4)" }}>
            Don't have an account?{" "}
          </span>
          <Link
            to="/signup"
            style={{
              color: "var(--accent-blue, #3b82f6)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
