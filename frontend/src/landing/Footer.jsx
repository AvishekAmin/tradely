import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer-container border-top mt-5" style={{ backgroundColor: "var(--bg-sidebar)", color: "var(--text-secondary)" }}>
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-3 col-md-6 mb-4">
            <img src="/media/logo.svg" alt="Tradely" style={{ width: "60%", maxWidth: "160px" }} />
            <p className="mt-3 text-muted" style={{ fontSize: "0.85rem" }}>
              &copy; 2024 - 2026 Tradely Technologies. All rights reserved.
            </p>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <p className="fw-semibold text-primary-emphasis">Company</p>
            <Link to="/about" className="d-block text-decoration-none text-muted mb-2">About</Link>
            <Link to="/product" className="d-block text-decoration-none text-muted mb-2">Products</Link>
            <Link to="/pricing" className="d-block text-decoration-none text-muted mb-2">Pricing</Link>
            <span className="d-block text-muted mb-2">Careers</span>
            <span className="d-block text-muted mb-2">Press & media</span>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <p className="fw-semibold text-primary-emphasis">Support</p>
            <Link to="/support" className="d-block text-decoration-none text-muted mb-2">Help Center</Link>
            <span className="d-block text-muted mb-2">Documentation</span>
            <span className="d-block text-muted mb-2">System Status</span>
            <span className="d-block text-muted mb-2">Community</span>
          </div>
          <div className="col-lg-3 col-md-6 mb-4">
            <p className="fw-semibold text-primary-emphasis">Account</p>
            <Link to="/signup" className="d-block text-decoration-none text-muted mb-2">Open an account</Link>
            <Link to="/signup" className="d-block text-decoration-none text-muted mb-2">Sign in</Link>
            <span className="d-block text-muted mb-2">Demo trading terminal</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-top text-muted" style={{ fontSize: "13px", lineHeight: "1.6" }}>
          <p>
            Tradely is an advanced stock-trading simulation and portfolio-management web platform designed for educational and demonstration purposes. All transactions, market values, and order executions are simulated and do not represent real financial transactions.
          </p>
          <p>
            Investments in securities market are subject to market risks; read all related documents carefully before investing. Tradely does not execute real stock exchange trades or provide registered investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
