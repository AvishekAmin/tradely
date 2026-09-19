import { logger } from "../utils/logger.js";
import { NODE_ENV } from "../config/env.js";

/**
 * Structured HTTP request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const statusCode = res.statusCode;

    // Optional: down-prioritize high-frequency health probes in non-debug mode
    const isProbe = originalUrl === "/health" || originalUrl === "/ready";

    if (isProbe && NODE_ENV === "production" && statusCode === 200) {
      return; // Omit spammy 200 probe logs in production
    }

    const logMeta = {
      method,
      route: originalUrl,
      statusCode,
      durationMs,
      clientIp: ip,
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`, logMeta);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`, logMeta);
    }
  });

  next();
};
