import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const LANDING_URL =
  import.meta.env.VITE_LANDING_URL || "http://localhost:5173";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Centralized error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If request received 401 on protected trading endpoints, redirect to public login
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/me") && !url.includes("/auth/login")) {
        window.location.href = `${LANDING_URL}/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
