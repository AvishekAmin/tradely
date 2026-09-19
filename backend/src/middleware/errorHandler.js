import { NODE_ENV } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Centralized global error handling middleware
 * In production:
 * - Suppresses all stack traces from client responses
 * - Masks internal 500/non-operational errors to prevent credential or filesystem leaks
 * - Preserves friendly operational error messages for user feedback
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isOperational = Boolean(err.isOperational);

  // Determine client-safe error code and message
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred.";

  if (statusCode >= 500 || !isOperational) {
    // Log complete error details internally
    logger.error(`[Server Error] ${req.method} ${req.originalUrl}: ${err.message}`, {
      stack: err.stack,
      route: req.originalUrl,
      method: req.method,
      statusCode,
    });

    // In production, mask internal server error messages
    if (NODE_ENV === "production") {
      code = "INTERNAL_SERVER_ERROR";
      message = "An unexpected internal error occurred. Please try again later.";
    }
  } else if (NODE_ENV !== "production") {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode} ${code}): ${message}`);
  }

  // Safe structured response
  const responsePayload = {
    success: false,
    code,
    message,
  };

  // Only expose stack trace in non-production environments
  if (NODE_ENV !== "production" && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
