import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export const LANDING_URL =
  import.meta.env.VITE_LANDING_URL ||
  (import.meta.env.PROD && typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5173`
    : "http://localhost:5173");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/me") && !url.includes("/auth/login")) {
        window.location.href = `${LANDING_URL}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
