export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL ||
  (import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5174`
    : "http://localhost:5174");
