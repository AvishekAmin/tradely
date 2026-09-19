import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount using HttpOnly cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          } else {
            setUser(null);
          }
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

  const signup = async (firstArg, emailArg, passwordArg) => {
    let username, email, password;
    if (typeof firstArg === "object" && firstArg !== null) {
      ({ username, email, password } = firstArg);
    } else {
      username = firstArg;
      email = emailArg;
      password = passwordArg;
    }

    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Registration failed. Please try again.");
    }

    setUser(data.data.user);
    return { success: true, user: data.data.user };
  };

  const login = async (firstArg, passwordArg) => {
    let username, email, password;
    if (typeof firstArg === "object" && firstArg !== null) {
      ({ username, email, password } = firstArg);
    } else {
      username = firstArg;
      password = passwordArg;
    }

    const identifier = (username || email || "").trim();

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: identifier,
        email: identifier,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Invalid username or password.");
    }

    setUser(data.data.user);
    return { success: true, user: data.data.user };
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
