import { NODE_ENV } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isOperational = Boolean(err.isOperational);

  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred.";

  if (statusCode >= 500 || !isOperational) {
    logger.error(
      `[Server Error] ${req.method} ${req.originalUrl}: ${err.message}`,
      {
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
        statusCode,
      },
    );

    if (NODE_ENV === "production") {
      code = "INTERNAL_SERVER_ERROR";
      message =
        "An unexpected internal error occurred. Please try again later.";
    }
  } else if (NODE_ENV !== "production") {
    logger.warn(
      `[Client Error] ${req.method} ${req.originalUrl} (${statusCode} ${code}): ${message}`,
    );
  }

  const responsePayload = {
    success: false,
    code,
    message,
  };

  if (NODE_ENV !== "production" && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
