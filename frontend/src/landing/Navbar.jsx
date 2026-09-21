import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  LogOut,
  ArrowRight,
} from "lucide-react";
import TradelyLogo from "./TradelyLogo";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { label: "Terminal", href: "/#terminal", id: "terminal" },
  { label: "How It Works", href: "/#how-it-works", id: "how-it-works" },
  { label: "Order Management", href: "/#order-management", id: "order-management" },
  { label: "Analytics", href: "/#analytics", id: "analytics" },
  { label: "Pricing", href: "/#pricing", id: "pricing" },
  { label: "Create Account", href: "/#create-account", id: "create-account" },
];

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [activeSection, setActiveSection] = React.useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return window.location.hash.replace(/^\/?#/, "");
    }
    return "";
  });

  const currentActiveSection = location.pathname === "/" ? activeSection : "";
  const isManualClickRef = React.useRef(false);
  const clickTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (isManualClickRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // If at or near the very bottom of the page, activate the last section
          if (scrollY + windowHeight >= documentHeight - 80) {
            setActiveSection("create-account");
            ticking = false;
            return;
          }

          // A section is considered active when its top is near/past the navbar threshold
          const offsetThreshold = 140;
          let current = "";
          for (const link of NAV_LINKS) {
            const el = document.getElementById(link.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= offsetThreshold) {
                current = link.id;
              }
            }
          }

          setActiveSection(current);
          ticking = false;
        });

        ticking = true;
      }
    };

    const initialTimer = setTimeout(() => {
      if (window.location.hash) {
        const hashId = window.location.hash.replace(/^\/?#/, "");
        if (NAV_LINKS.some((l) => l.id === hashId)) {
          setActiveSection(hashId);
          return;
        }
      }
      handleScroll();
    }, 0);

    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleUserInteraction = () => {
      if (isManualClickRef.current) {
        isManualClickRef.current = false;
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      }
    };
    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchmove", handleUserInteraction, { passive: true });

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchmove", handleUserInteraction);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [location.pathname]);

  const handleAnchorClick = (e, href, targetId) => {
    if (targetId) {
      setActiveSection(targetId);
      if (location.pathname === "/") {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          isManualClickRef.current = true;
          if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
          element.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `#${targetId}`);
          window.dispatchEvent(new Event("hashchange"));
          clickTimeoutRef.current = setTimeout(() => {
            isManualClickRef.current = false;
          }, 1000);
        }
      }
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 py-3 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto rounded-full border border-white/10 bg-[#0F0F0F]/85 backdrop-blur-xl px-4 py-2 sm:px-6 flex items-center justify-between gap-4 shadow-2xl shadow-black/60 transition-all">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => {
            setActiveSection("");
            if (location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 shrink-0 focus:outline-none group"
          aria-label="Tradely Homepage"
        >
          <TradelyLogo size="default" />
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => {
            const isActive = currentActiveSection === link.id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href, link.id)}
                className={`text-xs xl:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "text-[#00D8F6] font-bold drop-shadow-[0_0_8px_rgba(0,216,246,0.5)]"
                    : "text-slate-300 hover:text-white font-medium"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Auth State Handling */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                to="/signup"
                className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 shrink-0"
              >
                Sign Up
              </Link>

              <Link
                to="/login"
                className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 shrink-0"
              >
                Log In
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
              >
                <span>Start Trading</span>
                <ArrowRight className="size-3.5 sm:size-4 text-black stroke-[2.5]" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <a
                href={DASHBOARD_URL}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
              >
                <span>Start Trading</span>
                <ArrowRight className="size-3.5 sm:size-4 text-black stroke-[2.5]" />
              </a>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="size-9 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
                    aria-label="User profile menu"
                  >
                    {user?.name?.charAt(0)?.toUpperCase() ||
                      user?.username?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name || user?.username}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      @{user?.username}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      href={DASHBOARD_URL}
                      className="flex items-center gap-2 w-full cursor-pointer"
                    >
                      <LayoutDashboard className="size-3.5 text-blue-400" />
                      <span>Launch Terminal</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                  >
                    <LogOut className="size-3.5 mr-2" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Sheet Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden p-2 rounded-full border border-white/10 bg-[#1A1A1A] hover:bg-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
                aria-label="Open mobile navigation"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col justify-between">
              <div>
                <SheetHeader className="pb-4 border-b border-white/10">
                  <SheetTitle asChild>
                    <Link
                      to="/"
                      onClick={() => {
                        setMobileOpen(false);
                        setActiveSection("");
                        if (location.pathname === "/") {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <TradelyLogo size="default" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-2.5 pt-6" aria-label="Mobile Navigation">
                  {NAV_LINKS.map((link) => {
                    const isActive = currentActiveSection === link.id;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => handleAnchorClick(e, link.href, link.id)}
                        className={`text-sm rounded-lg px-3 py-2.5 transition-all cursor-pointer flex items-center justify-between ${
                          isActive
                            ? "text-[#00D8F6] font-bold bg-[#00D8F6]/10 border border-[#00D8F6]/20"
                            : "text-slate-200 hover:text-white hover:bg-white/5 font-medium"
                        }`}
                      >
                        <span>{link.label}</span>
                        {isActive && (
                          <span className="size-1.5 rounded-full bg-[#00D8F6] shadow-[0_0_8px_#00D8F6]" />
                        )}
                      </a>
                    );
                  })}
                  <Link
                    to="/about"
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm rounded-lg px-3 py-2.5 transition-colors ${
                      location.pathname === "/about"
                        ? "text-[#00D8F6] font-bold bg-[#00D8F6]/10 border border-[#00D8F6]/20"
                        : "text-slate-200 hover:text-white hover:bg-white/5 font-medium"
                    }`}
                  >
                    About Tradely
                  </Link>
                  <Link
                    to="/support"
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm rounded-lg px-3 py-2.5 transition-colors ${
                      location.pathname === "/support"
                        ? "text-[#00D8F6] font-bold bg-[#00D8F6]/10 border border-[#00D8F6]/20"
                        : "text-slate-200 hover:text-white hover:bg-white/5 font-medium"
                    }`}
                  >
                    Support & FAQs
                  </Link>
                </nav>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                {!isAuthenticated ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs py-2.5 text-center hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
                      >
                        Sign Up
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs py-2.5 text-center hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
                      >
                        Log In
                      </Link>
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs py-2.5 text-center shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      <span>Start Trading</span>
                      <ArrowRight className="size-3.5 text-black stroke-[2.5]" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <a
                      href={DASHBOARD_URL}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-xs py-2.5 text-center shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      <span>Start Trading</span>
                      <ArrowRight className="size-3.5 text-black stroke-[2.5]" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="w-full inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <LogOut className="size-4 mr-2" />
                      <span>Log Out</span>
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
