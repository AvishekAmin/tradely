import "dotenv/config";

export const PORT = Number(process.env.PORT) || 8000;
export const MONGO_URI = process.env.MONGO_URI || "";
export const NODE_ENV = process.env.NODE_ENV || "development";

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing. Please configure it in .env");
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:5174";

// Construct allowed origins for CORS
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
];

const configuredOrigins = [FRONTEND_URL, DASHBOARD_URL].filter(Boolean);

export const ALLOWED_ORIGINS = Array.from(
  new Set([...defaultOrigins, ...configuredOrigins])
);
