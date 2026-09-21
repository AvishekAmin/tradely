import { NODE_ENV } from "../config/env.js";

const hitsMap = new Map();

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

if (sweepTimer.unref) {
  sweepTimer.unref();
}

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    if (NODE_ENV === "test" && req.headers["x-test-rate-limit"] !== "enable") {
      return next();
    }

    const clientIp = req.ip || req.connection?.remoteAddress || "unknown_ip";
    const now = Date.now();

    const timestamps = hitsMap.get(clientIp) || [];
    const windowStart = now - windowMs;

    const recentHits = timestamps.filter((t) => t > windowStart);

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

    recentHits.push(now);
    hitsMap.set(clientIp, recentHits);

    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message:
    "Too many authentication attempts from this IP. Please try again in 15 minutes.",
});

export const _resetRateLimiter = () => {
  hitsMap.clear();
};
