/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient, { LANDING_URL } from "../config/api";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticate on start using HttpOnly cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        if (res.data?.success && res.data?.data?.user) {
          setUser(res.data.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      const destination = LANDING_URL.endsWith("/") ? LANDING_URL : `${LANDING_URL}/`;
      window.location.href = destination;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
