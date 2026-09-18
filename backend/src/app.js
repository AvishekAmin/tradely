import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./middleware/cors.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Policy
app.use(corsMiddleware);

// 3. Request Body & Cookie Parsing
app.use(express.json());
app.use(cookieParser());

// 4. API Routes
app.use(routes);

// 5. 404 Catch-all Handler
app.use(notFound);

// 6. Centralized Error Handler
app.use(errorHandler);

export default app;
