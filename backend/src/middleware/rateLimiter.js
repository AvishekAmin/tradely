import { NODE_ENV } from "../config/env.js";

/**
 * In-Memory Sliding-Window Rate Limiter
 *
 * NOTE ON ARCHITECTURE:
 * This rate limiter stores request timestamps in memory and is designed for
 * single-instance deployments. For horizontally scaled, multi-replica container
 * deployments, a distributed store (e.g. Redis via `ioredis` or `rate-limit-redis`)
 * should be used to share rate-limiting state across worker pods.
 */

// In-memory hit storage: Map<string, number[]> (IP -> array of request timestamps)
const hitsMap = new Map();

// Periodic sweep to prevent memory leaks from inactive IPs (every 5 minutes)
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of hitsMap.entries()) {
    const validTimestamps = timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (validTimestamps.length === 0) {
      hitsMap.delete(ip);
    } else {
      hitsMap.set(ip, validTimestamps);
    }
  }
}, SWEEP_INTERVAL_MS);

// Allow the Node process to exit without waiting for the cleanup timer
if (sweepTimer.unref) {
  sweepTimer.unref();
}

/**
 * Factory to create rate-limiting middleware
 * @param {Object} options
 * @param {number} options.windowMs Window duration in milliseconds (default 15 minutes)
 * @param {number} options.max Maximum requests per window (default 20)
 * @param {string} options.message Custom error message
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    // In automated tests, bypass unless explicitly enabled
    if (NODE_ENV === "test" && req.headers["x-test-rate-limit"] !== "enable") {
      return next();
    }

    // Identify client IP (respects Express trust proxy setting)
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown_ip";
    const now = Date.now();

    const timestamps = hitsMap.get(clientIp) || [];
    const windowStart = now - windowMs;

    // Filter to requests within current sliding window
    const recentHits = timestamps.filter((t) => t > windowStart);

    // Standard rate limit headers
    const remaining = Math.max(0, max - recentHits.length);
    const resetTimeSec = Math.ceil((windowStart + windowMs - now) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.max(1, resetTimeSec));

    if (recentHits.length >= max) {
      res.setHeader("Retry-After", Math.max(1, resetTimeSec));
      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message,
        retryAfterSeconds: Math.max(1, resetTimeSec),
      });
    }

    // Record this hit
    recentHits.push(now);
    hitsMap.set(clientIp, recentHits);

    next();
  };
};

/**
 * Specialized rate limiter for authentication endpoints (login, signup)
 * 20 attempts per 15-minute window per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts from this IP. Please try again in 15 minutes.",
});

/**
 * Testing helper: reset rate limiter memory
 */
export const _resetRateLimiter = () => {
  hitsMap.clear();
};
