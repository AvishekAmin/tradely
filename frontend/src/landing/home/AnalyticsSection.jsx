import React from "react";
import { PieChart, ArrowUpRight, Calculator, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsSection() {
  const allocation = [
    { sym: "RELIANCE", pct: 16, val: "₹29,405.00", color: "bg-cyan-400" },
    { sym: "TATAMOTORS", pct: 14, val: "₹25,612.50", color: "bg-amber-400" },
    { sym: "ICICIBANK", pct: 14, val: "₹25,308.00", color: "bg-rose-500" },
    { sym: "BHARTIARTL", pct: 13, val: "₹23,325.00", color: "bg-pink-500" },
    { sym: "INFY", pct: 12, val: "₹22,804.50", color: "bg-indigo-500" },
    { sym: "ITC", pct: 11, val: "₹20,488.00", color: "bg-emerald-400" },
    { sym: "HDFCBANK", pct: 10, val: "₹19,689.60", color: "bg-purple-500" },
    { sym: "TCS", pct: 10, val: "₹19,225.00", color: "bg-orange-500" },
  ];

  return (
    <section
      id="analytics"
      className="pt-8 pb-16 lg:pt-10 lg:pb-24 relative scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Clarity on every rupee invested.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Dynamic portfolio metrics computed on demand. Realized gains from
            closed trades stay strictly separated from paper profits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#171717] p-5 space-y-1">
            <span className="text-xs font-mono text-slate-400">
              INVESTED CAPITAL
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              ₹1,81,660.00
            </div>
            <div className="text-[11px] text-slate-500">
              Total Purchase Cost Basis
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#171717] p-5 space-y-1">
            <span className="text-xs font-mono text-slate-400">
              CURRENT VALUATION
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              ₹1,85,857.60
            </div>
            <div className="text-[11px] text-blue-400">
              Live @ ~1.5s Server Ticks
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#171717] p-5 space-y-1">
            <span className="text-xs font-mono text-slate-400">
              UNREALIZED P&L
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +₹4,197.60
            </div>
            <div className="text-[11px] text-emerald-400/80">
              +2.31% Open Gain
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#171717] p-5 space-y-1">
            <span className="text-xs font-mono text-slate-400">
              REALIZED P&L
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +₹3,420.00
            </div>
            <div className="text-[11px] text-slate-500">
              Executed Sells Only
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#171717] p-5 space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-mono text-slate-400">
              NET TOTAL RETURN
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              +₹7,617.60
            </div>
            <div className="text-[11px] text-emerald-400/80">
              +4.19% Portfolio Gain
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-white">
                Dynamic Asset Allocation
              </h4>
              <p className="text-xs text-slate-400">
                Computed live based on current market values
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Equities: 8
            </span>
          </div>

          <div className="h-4 w-full rounded-full bg-white/5 overflow-hidden flex">
            {allocation.map((item) => (
              <div
                key={item.sym}
                style={{ width: `${item.pct}%` }}
                className={`${item.color} h-full transition-all hover:opacity-80`}
                title={`${item.sym}: ${item.pct}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {allocation.map((item) => (
              <div key={item.sym} className="flex items-center gap-2 text-xs">
                <span
                  className={`size-3 rounded-full ${item.color} shrink-0`}
                />
                <span className="font-bold text-white">{item.sym}</span>
                <span className="text-slate-400 font-mono">({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
