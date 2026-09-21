import "dotenv/config";

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = Number(process.env.PORT) || 8000;
export const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";

if (NODE_ENV === "production" && !MONGO_URI) {
  throw new Error(
    "MONGO_URI (or MONGODB_URI) environment variable is required in production.",
  );
}

export const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is missing. Please configure it in .env",
  );
}

if (NODE_ENV === "production" && JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long in production environments.",
  );
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const DASHBOARD_URL =
  process.env.DASHBOARD_URL || "http://localhost:5174";

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

const configuredOrigins = Array.from(
  new Set([FRONTEND_URL, DASHBOARD_URL, ...rawAllowedOrigins].filter(Boolean)),
);

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
];

export const ALLOWED_ORIGINS =
  NODE_ENV === "production"
    ? configuredOrigins
    : Array.from(new Set([...defaultDevOrigins, ...configuredOrigins]));

export const parseTrustProxy = () => {
  const tp = process.env.TRUST_PROXY;
  if (!tp || tp === "0" || tp.toLowerCase() === "false") {
    return 0;
  }
  if (tp.toLowerCase() === "true") {
    return true;
  }
  const numeric = Number(tp);
  if (!isNaN(numeric)) {
    return numeric;
  }
  return tp;
};

export const TRUST_PROXY = parseTrustProxy();

export const PAYMENT_PROVIDER = (
  process.env.PAYMENT_PROVIDER || "razorpay"
).toLowerCase();
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "";

if (PAYMENT_PROVIDER === "razorpay") {
  if (NODE_ENV === "production" && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required in production when PAYMENT_PROVIDER=razorpay.",
    );
  }
}
