import React from "react";
import { Link } from "react-router-dom";
import Menu from "./Menu";
import TradelyLogo from "./TradelyLogo";
import { TrendingUp } from "lucide-react";

const TopBar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0C0C0C]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left: Tradely Logo & Text, followed by Nifty & Sensex Indices Block */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          {/* Brand Logo & Text */}
          <Link
            to="/"
            className="flex items-center gap-2 text-decoration-none group shrink-0"
            aria-label="Tradely Dashboard Home"
          >
            <TradelyLogo size="small" showText={true} />
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />

          {/* Indices Tickers */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1 shrink-0">
            {/* NIFTY 50 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">NIFTY 50</span>
              <span className="font-bold text-white tabular-nums">24,850.30</span>
              <span className="flex items-center text-emerald-400 font-bold tabular-nums">
                <TrendingUp className="size-3 mr-0.5" />
                +0.42%
              </span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* SENSEX */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">SENSEX</span>
              <span className="font-bold text-white tabular-nums">81,420.50</span>
              <span className="flex items-center text-emerald-400 font-bold tabular-nums">
                <TrendingUp className="size-3 mr-0.5" />
                +0.38%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Navigation & User Menu */}
        <Menu />
      </div>
    </header>
  );
};

export default TopBar;
