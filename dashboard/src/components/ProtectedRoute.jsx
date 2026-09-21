import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LANDING_URL } from "../config/api";
import TradelyLogo from "./TradelyLogo";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = `${LANDING_URL}/login`;
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white p-6">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <TradelyLogo size="large" showText={true} />
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <Loader2 className="size-4 animate-spin text-cyan-400" />
            <span>Verifying trading session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
