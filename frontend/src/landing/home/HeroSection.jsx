import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const [activeStock, setActiveStock] = useState("RELIANCE");

  const stocks = [
    { sym: "RELIANCE", name: "Reliance Industries", price: "2,940.50", change: "+18.25", pct: "+0.62%", pos: true, open: "2,925.00", high: "2,955.80", low: "2,918.40" },
    { sym: "TCS", name: "Tata Consultancy Services", price: "3,845.00", change: "+32.10", pct: "+0.84%", pos: true, open: "3,815.00", high: "3,860.00", low: "3,810.00" },
    { sym: "INFY", name: "Infosys Ltd", price: "1,520.30", change: "-8.40", pct: "-0.55%", pos: false, open: "1,530.00", high: "1,535.00", low: "1,515.20" },
    { sym: "HDFCBANK", name: "HDFC Bank", price: "1,640.80", change: "+12.60", pct: "+0.77%", pos: true, open: "1,630.00", high: "1,648.00", low: "1,626.50" },
    { sym: "SBIN", name: "State Bank of India", price: "782.40", change: "-4.20", pct: "-0.53%", pos: false, open: "788.00", high: "791.50", low: "780.00" },
  ];

  const current = stocks.find((s) => s.sym === activeStock) || stocks[0];

  return (
    <section className="relative overflow-hidden pt-3 pb-12 sm:pt-4 sm:pb-16 lg:pt-6 lg:pb-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Start your trading <br />
              journey with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D8F6] via-[#6366F1] to-[#EC4899]">
                Tradely
              </span>
            </h1>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold px-8 h-12 shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] gap-2 text-base rounded-full transition-all"
              >
                <Link to="/signup">
                  <span>Start Trading — Free Virtual Capital</span>
                  <ArrowRight className="size-4 text-black stroke-[2.5]" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Connekt-Inspired Simulated Trading Terminal Preview Window */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/25 via-indigo-600/25 to-purple-600/25 rounded-3xl blur-xl -z-10" />

              {/* Terminal Window Card */}
              <div className="rounded-3xl border border-white/15 bg-[#121212]/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-black/90">
                
                {/* Window Top Controls */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-500/80" />
                      <span className="size-2.5 rounded-full bg-yellow-500/80" />
                      <span className="size-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      terminal: tradely-dashboard-engine
                    </span>
                  </div>

                  <Badge variant="live" className="text-[11px] px-2.5 py-0.5 gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </Badge>
                </div>

                {/* Simulated Content Area */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 my-3.5">
                  {/* Left Mini-Watchlist */}
                  <div className="sm:col-span-5 space-y-1 bg-[#171717] rounded-2xl p-2.5 border border-white/[0.07]">
                    <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 flex items-center justify-between">
                      <span>WATCHLIST</span>
                      <span className="font-mono text-slate-500">NSE EQ</span>
                    </div>

                    {stocks.map((item) => {
                      const isSelected = item.sym === activeStock;
                      return (
                        <button
                          key={item.sym}
                          type="button"
                          onClick={() => setActiveStock(item.sym)}
                          className={`w-full text-left flex items-center justify-between p-2 rounded-xl transition-all ${
                            isSelected
                              ? "bg-blue-600/20 border border-blue-500/30 text-white"
                              : "hover:bg-white/5 text-slate-300 border border-transparent"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{item.sym}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[80px]">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold tabular-nums">
                              ₹{item.price}
                            </div>
                            <div
                              className={`text-[10px] font-mono tabular-nums ${
                                item.pos ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {item.pct}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Chart & Instrument Details */}
                  <div className="sm:col-span-7 bg-[#171717] rounded-2xl p-3.5 border border-white/[0.07] flex flex-col justify-between">
                    <div>
                      {/* Active Symbol Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-extrabold text-white">
                            {current.sym}
                          </div>
                          <div className="text-xs text-slate-400">
                            {current.name} • NSE
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-mono font-bold text-white tabular-nums">
                            ₹{current.price}
                          </div>
                          <div
                            className={`text-xs font-mono font-semibold tabular-nums ${
                              current.pos ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {current.change} ({current.pct})
                          </div>
                        </div>
                      </div>

                      {/* Mini Trend SVG Graphic */}
                      <div className="h-28 w-full mt-2 relative overflow-hidden rounded-lg bg-[#0F0F0F] border border-white/[0.05] p-2 flex items-end">
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 200 80"
                          preserveAspectRatio="none"
                          className="overflow-visible"
                        >
                          <defs>
                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor={current.pos ? "#10B981" : "#EF4444"}
                                stopOpacity="0.35"
                              />
                              <stop
                                offset="100%"
                                stopColor={current.pos ? "#10B981" : "#EF4444"}
                                stopOpacity="0.0"
                              />
                            </linearGradient>
                          </defs>

                          {current.pos ? (
                            <>
                              <polygon
                                points="0,60 30,55 60,65 90,40 120,48 150,25 180,30 200,12 200,80 0,80"
                                fill="url(#chartGlow)"
                              />
                              <polyline
                                points="0,60 30,55 60,65 90,40 120,48 150,25 180,30 200,12"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </>
                          ) : (
                            <>
                              <polygon
                                points="0,20 30,28 60,22 90,45 120,40 150,65 180,58 200,75 200,80 0,80"
                                fill="url(#chartGlow)"
                              />
                              <polyline
                                points="0,20 30,28 60,22 90,45 120,40 150,65 180,58 200,75"
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            </>
                          )}
                        </svg>
                      </div>

                      {/* Buy and Sell Action Buttons below the graph */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          Buy (B)
                        </button>
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-bold border border-red-500/30 transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          Sell (S)
                        </button>
                      </div>
                    </div>

                    {/* KPI Strip */}
                    <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2.5 border-t border-white/10 text-center">
                      <div className="bg-[#0F0F0F] rounded-lg p-1.5">
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Open</div>
                        <div className="text-xs font-mono font-bold text-slate-200 tabular-nums">₹{current.open}</div>
                      </div>
                      <div className="bg-[#0F0F0F] rounded-lg p-1.5">
                        <div className="text-[10px] text-slate-500 uppercase font-medium">High</div>
                        <div className="text-xs font-mono font-bold text-slate-200 tabular-nums">₹{current.high}</div>
                      </div>
                      <div className="bg-[#0F0F0F] rounded-lg p-1.5">
                        <div className="text-[10px] text-slate-500 uppercase font-medium">Low</div>
                        <div className="text-xs font-mono font-bold text-slate-200 tabular-nums">₹{current.low}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
