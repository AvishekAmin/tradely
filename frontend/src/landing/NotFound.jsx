import React from "react";
import { Link } from "react-router-dom";
import { Home, HelpCircle } from "lucide-react";
import TradelyLogo from "./TradelyLogo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center text-center px-4 py-16">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center mb-2">
          <TradelyLogo size="large" />
        </div>
        <div className="space-y-2">
          <span className="text-6xl sm:text-7xl font-extrabold font-mono text-blue-500 tracking-tight">
            404
          </span>
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            The page or route you are attempting to view does not exist on
            Tradely.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="btn-tradely-gradient rounded-full px-6 text-xs font-bold text-white shadow-lg"
          >
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="size-4" />
              <span>Return Home</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/10 px-6 text-xs font-semibold"
          >
            <Link to="/support" className="inline-flex items-center gap-2">
              <HelpCircle className="size-4" />
              <span>Knowledge Base</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
