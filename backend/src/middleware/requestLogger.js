import { logger } from "../utils/logger.js";
import { NODE_ENV } from "../config/env.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const statusCode = res.statusCode;

    const isProbe = originalUrl === "/health" || originalUrl === "/ready";

    if (isProbe && NODE_ENV === "production" && statusCode === 200) {
      return;
    }

    const logMeta = {
      method,
      route: originalUrl,
      statusCode,
      durationMs,
      clientIp: ip,
    };

    if (statusCode >= 500) {
      logger.error(
        `HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
        logMeta,
      );
    } else if (statusCode >= 400) {
      logger.warn(
        `HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
        logMeta,
      );
    } else {
      logger.info(
        `HTTP ${method} ${originalUrl} ${statusCode} - ${durationMs}ms`,
        logMeta,
      );
    }
  });

  next();
};
