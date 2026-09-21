import cors from "cors";
import { ALLOWED_ORIGINS, NODE_ENV } from "../config/env.js";

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    if (NODE_ENV !== "production") {
      if (
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
    }

    const corsError = new Error(
      `CORS error: Origin ${origin} not permitted by policy.`,
    );
    corsError.statusCode = 403;
    corsError.code = "CORS_ORIGIN_DENIED";
    corsError.isOperational = true;
    return callback(corsError);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
