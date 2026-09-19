import mongoose from "mongoose";

/**
 * Root information endpoint
 */
export const getRoot = (req, res) => {
  res.json({
    status: "ok",
    app: "Tradely API",
    version: "1.0.0",
    engine: "Core Trading Engine Active",
  });
};

/**
 * Liveness probe (GET /health)
 * Simple, low-overhead check indicating the Express process is running and accepting requests.
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "tradely-backend",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Readiness probe (GET /ready)
 * Verifies that critical dependencies (MongoDB) are available before routing traffic.
 * Used for Docker container healthchecks and orchestrator readiness probes.
 * Minimal details exposed: no database hostnames, credentials, or topology leaked.
 */
export const getReady = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    return res.status(200).json({
      status: "ready",
      database: { status: "connected" },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: "unavailable",
    database: { status: "disconnected" },
    timestamp: new Date().toISOString(),
  });
};
