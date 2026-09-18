import { NODE_ENV } from "../config/env.js";

/**
 * Centralized global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred.";

  if (statusCode >= 500 || !err.isOperational) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  } else if (NODE_ENV !== "production") {
    console.log(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode} ${code}): ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {}),
  });
};
