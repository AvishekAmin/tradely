import mongoose from "mongoose";

export const getRoot = (req, res) => {
  res.json({
    status: "ok",
    app: "Tradely API",
    version: "1.0.0",
    engine: "Core Trading Engine Active",
  });
};

export const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "tradely-backend",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

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
