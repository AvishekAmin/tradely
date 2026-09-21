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

if (TRUST_PROXY !== 0) {
  app.set("trust proxy", TRUST_PROXY);
}

app.use(helmet());

app.use(corsMiddleware);

app.use(requestLogger);

app.use(
  "/webhooks/razorpay",
  express.raw({ type: "*/*", limit: "1mb" }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
      try {
        req.body = JSON.parse(req.body.toString("utf8"));
      } catch (err) {
        req.body = {};
      }
    }
    next();
  },
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      if (!req.rawBody && buf) {
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(routes);

app.use(notFound);

app.use(errorHandler);

export default app;
