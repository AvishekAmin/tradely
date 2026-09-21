import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  AlertCircle,
  CheckCircle2,
  Send,
  Terminal,
  ExternalLink,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReportIssuePage() {
  useEffect(() => {
    document.title = "Tradely — Report an Issue";
  }, []);

  const [category, setCategory] = useState("Matching Engine & Order Execution");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && steps && actual) {
      const generatedId = `TRD-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedId);
      setSubmitted(true);
      setTitle("");
      setSteps("");
      setExpected("");
      setActual("");
    }
  };

  const categories = [
    "Matching Engine & Order Execution",
    "Socket.IO Live Price Stream",
    "Portfolio Valuation & Ledger",
    "Watchlist & Stock Search",
    "UI / Responsive Terminal Layout",
    "Authentication & Session Cookies",
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between pt-4 pb-20">
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141414] border border-white/10 hover:bg-[#1C1C1C] rounded-full px-4 py-2 transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 py-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Report a Platform Issue
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Discovered an order matching glitch, tick calculation error, or UI anomaly? Help us maintain high-fidelity trading execution.
          </p>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex items-start gap-3.5">
          <Info className="size-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p className="font-bold text-white">Tips for a fast resolution:</p>
            <p className="text-slate-400">
              Please include the exact stock ticker (e.g. RELIANCE, TCS), the order type (MARKET, LIMIT, STOP, or OCO), and your approximate steps before the glitch occurred.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-8 space-y-6 shadow-2xl">
          {submitted ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Issue Filed Successfully</h3>
                <p className="text-xs text-slate-400">
                  Ticket Reference ID:{" "}
                  <code className="text-cyan-400 font-mono font-bold bg-[#181818] px-2.5 py-1 rounded-md border border-white/10">
                    {ticketId}
                  </code>
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you for contributing to Tradely's reliability. Our engineering team has received your report and will investigate the reported conditions.
              </p>
              <div className="pt-3">
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="rounded-full border-white/15 text-xs text-slate-300 hover:text-white"
                >
                  File Another Report
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Issue Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        category === cat
                          ? "bg-blue-600/20 border-blue-500/50 text-white shadow-sm"
                          : "bg-[#181818] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Issue Title / Short Summary *
                  </label>
                  <Input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. OCO limit leg executed but stop leg remained pending"
                    className="bg-[#181818] border-white/10 text-sm text-white placeholder:text-slate-500 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full h-10 px-3 bg-[#181818] border border-white/10 text-xs text-white rounded-xl outline-none focus:border-white/30"
                  >
                    <option value="Low">Low — Minor UI issue</option>
                    <option value="Medium">Medium — Platform glitch</option>
                    <option value="High">High — Matching or ledger flaw</option>
                    <option value="Critical">Critical — Engine lockup</option>
                  </select>
                </div>
              </div>

              {/* Steps to Reproduce */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Steps to Reproduce *
                </label>
                <textarea
                  required
                  rows={4}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder={"1. Placed OCO bracket buy order on RELIANCE at ₹2,900...\n2. Waited for price tick to touch ₹2,920...\n3. Observed order status in ledger..."}
                  className="w-full rounded-xl border border-white/10 bg-[#181818] p-3 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none font-mono"
                />
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Expected Behavior
                  </label>
                  <textarea
                    rows={3}
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    placeholder="Stop loss leg should be cancelled atomically."
                    className="w-full rounded-xl border border-white/10 bg-[#181818] p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Actual Behavior Observed *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder="Stop loss leg remained in PENDING status."
                    className="w-full rounded-xl border border-white/10 bg-[#181818] p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-sm h-11 hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-cyan-500/20 gap-2"
              >
                <span>Submit Issue Report</span>
                <Send className="size-4 text-black" />
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
