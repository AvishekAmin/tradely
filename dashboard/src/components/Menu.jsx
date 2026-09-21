import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LANDING_URL } from "../config/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { ExternalLink, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/orders", label: "Orders" },
  { path: "/holdings", label: "Holdings" },
  { path: "/positions", label: "Positions" },
  { path: "/funds", label: "Funds" },
  { path: "/explore", label: "Explore" },
];

const Menu = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isCurrent = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "TR";

  return (
    <div className="flex items-center gap-4 lg:gap-6">
      {/* Nav Link Items */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isCurrent(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Avatar with ShadCN Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-[#171717] border border-white/10 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <div className="size-7 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-extrabold text-xs flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[100px] truncate">
              {user?.username || "Trader"}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 border-b border-white/10">
            <div className="font-semibold text-white text-sm">
              {user?.username || "Trading Account"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {user?.email || "Authenticated Session"}
            </div>
          </div>

          <div className="md:hidden py-1">
            {NAV_ITEMS.map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link to={item.path} className="text-xs font-medium">
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>

          <DropdownMenuItem asChild>
            <a
              href={LANDING_URL}
              className="flex items-center gap-2 text-xs font-medium text-slate-200 hover:text-white"
            >
              <ExternalLink className="size-3.5 text-cyan-400" />
              <span>Back To Home</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="flex items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="size-3.5 text-rose-400" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Menu;
