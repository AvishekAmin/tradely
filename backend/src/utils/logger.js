import { NODE_ENV } from "../config/env.js";

/**
 * Lightweight Zero-Dependency Structured Logger
 * Produces structured JSON output with automatic sensitive field redaction.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwordhash/i,
  /secret/i,
  /token/i,
  /jwt/i,
  /cookie/i,
  /authorization/i,
  /mongo_uri/i,
  /mongodb_uri/i,
];

/**
 * Recursively deep-sanitize an object or value, replacing sensitive keys with "[REDACTED]"
 */
export const sanitizeData = (data) => {
  if (!data) return data;

  if (typeof data === "string") {
    // Redact Bearer tokens in strings
    return data.replace(/(Bearer\s+)[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, "$1[REDACTED]");
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        cleaned[key] = "[REDACTED]";
      } else if (value && typeof value === "object") {
        cleaned[key] = sanitizeData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  return data;
};

const formatLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === "string" ? sanitizeData(message) : message,
    ...sanitizeData(meta),
  };

  return JSON.stringify(logEntry);
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(formatLog("info", message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatLog("warn", message, meta));
  },
  error: (message, meta = {}) => {
    console.error(formatLog("error", message, meta));
  },
  debug: (message, meta = {}) => {
    if (NODE_ENV !== "production") {
      console.log(formatLog("debug", message, meta));
    }
  },
};
