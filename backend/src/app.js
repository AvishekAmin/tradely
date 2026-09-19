import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { TRUST_PROXY } from "./config/env.js";

const app = express();

// 1. Configure Reverse Proxy Trust
// Configured conservatively: defaults to 0 (disabled) to prevent IP spoofing in direct deployments.
// Set via TRUST_PROXY (e.g. 1, true, or subnet) when behind Nginx, ALB, or Cloudflare.
if (TRUST_PROXY !== 0) {
  app.set("trust proxy", TRUST_PROXY);
}

// 2. Security Headers (Helmet)
app.use(helmet());

// 3. CORS Policy
app.use(corsMiddleware);

// 4. Structured HTTP Request Logging
app.use(requestLogger);

// 5. Request Body & Cookie Parsing (with 1mb payload limit to prevent DoS)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// 6. API Routes
app.use(routes);

// 7. 404 Catch-all Handler
app.use(notFound);

// 8. Centralized Error Handler
app.use(errorHandler);

export default app;
