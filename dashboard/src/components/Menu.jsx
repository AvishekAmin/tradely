import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { LANDING_URL } from "../config/api";
import {
  LightMode,
  DarkMode,
  Logout,
  OpenInNew,
} from "@mui/icons-material";
import TradelyLogo from "./TradelyLogo";

const Menu = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleProfileClick = () => {
    setIsProfileDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
  };

  const isCurrent = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }} aria-label="Tradely Dashboard Home">
        <TradelyLogo size="small" />
      </Link>
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to="/">
              <p className={isCurrent("/") ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/orders">
              <p className={isCurrent("/orders") ? activeMenuClass : menuClass}>
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/holdings">
              <p className={isCurrent("/holdings") ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/positions">
              <p className={isCurrent("/positions") ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/funds">
              <p className={isCurrent("/funds") ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/apps">
              <p className={isCurrent("/apps") ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
              borderRadius: "8px",
              cursor: "pointer",
              padding: "6px 8px",
              color: "var(--text-primary, inherit)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {theme === "dark" ? (
              <LightMode style={{ fontSize: "1.1rem", color: "#f59e0b" }} />
            ) : (
              <DarkMode style={{ fontSize: "1.1rem", color: "#64748b" }} />
            )}
          </button>

          <hr style={{ height: "24px", margin: "0 4px", opacity: 0.2 }} />

          {/* Profile Badge */}
          <div
            className="profile"
            onClick={handleProfileClick}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <div className="avatar">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : "TR"}
            </div>
            <p className="username">{user?.username || "Trader"}</p>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div
                className="profile-dropdown"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "var(--bg-surface, #2f2f2f)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.4))",
                  minWidth: "180px",
                  zIndex: 200,
                  padding: "8px 0",
                  color: "var(--text-primary, #ececec)",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{user?.username || "Trading Account"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #888)" }}>
                    {user?.email || "Authenticated"}
                  </div>
                </div>

                <a
                  href={LANDING_URL}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    color: "inherit",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  <OpenInNew style={{ fontSize: "1rem" }} />
                  Landing Page
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "var(--loss, #ef4444)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Logout style={{ fontSize: "1rem" }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
