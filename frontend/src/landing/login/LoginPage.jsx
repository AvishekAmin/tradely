import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import TradelyLogo from "../TradelyLogo";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      window.location.href = DASHBOARD_URL;
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res?.success || res?.user) {
        window.location.href = DASHBOARD_URL;
      } else {
        setError(res?.message || "Invalid username or password.");
      }
    } catch (err) {
      setError(
        err?.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar: Back to Home */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141414] border border-white/10 hover:bg-[#1C1C1C] rounded-full px-4 py-2 transition-all"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to home</span>
        </Link>
        <Link
          to="/"
          className="cursor-pointer group focus:outline-none"
          aria-label="Tradely Homepage"
        >
          <TradelyLogo size="small" />
        </Link>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-3xl border border-white/10 bg-[#121212]/95 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-1 mb-6">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00D8F6] via-[#6366F1] to-[#EC4899]">
              Tradely
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white pt-2">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 pt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Username
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="pl-10"
                />
                <User className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <Lock className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold h-12 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 text-sm sm:text-base gap-2 mt-4 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black mr-2" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="size-4 ml-1 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
