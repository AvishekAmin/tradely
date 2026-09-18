import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LANDING_URL } from "../config/api";

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = `${LANDING_URL}/login`;
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "var(--bg-main, #212121)",
          color: "var(--text-primary, #ececec)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "var(--accent-blue, #3b82f6)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: "var(--text-secondary, #b4b4b4)", fontSize: "0.95rem" }}>
          Verifying trading session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
