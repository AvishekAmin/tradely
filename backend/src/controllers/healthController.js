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
 * Health check endpoint
 */
export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};
