import React from "react";
import { ArrowUpRight } from "lucide-react";
import { DASHBOARD_URL } from "@/config/api";
import { Button } from "@/components/ui/button";

export default function TerminalShowcaseSection() {
  return (
    <section
      id="terminal"
      className="pt-8 pb-16 lg:pt-10 lg:pb-24 border-t border-white/[0.08] bg-[#0C0C0C] scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Professional execution on every screen.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Designed with a dark-mode first aesthetic, tabular numerals for
              high-speed reading, and clear visibility into pending
              reservations.
            </p>
          </div>

          <div>
            <Button
              asChild
              className="btn-tradely-gradient rounded-full px-6 h-11 text-sm font-bold text-white shadow-lg"
            >
              <a
                href={DASHBOARD_URL}
                className="inline-flex items-center gap-2"
              >
                <span>Launch Terminal</span>
                <ArrowUpRight className="size-4 stroke-[2.5]" />
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141414] p-4 sm:p-7 lg:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-white tracking-wider">
                TRADELY TERMINAL
              </span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Market Feed Live</span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">NIFTY 50:</span>
                <span className="font-bold tabular-nums">24,380.20</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +0.48%
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-slate-500">SENSEX:</span>
                <span className="font-bold tabular-nums">80,125.40</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  +0.41%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#181818] p-5 space-y-4 overflow-x-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>HOLDINGS (8)</span>
                  <span className="text-xs font-normal text-slate-400">
                    • Equity Delivery
                  </span>
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  P&L UPDATING LIVE
                </span>
              </div>

              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-2.5 font-semibold">Instrument</th>
                    <th className="pb-2.5 font-semibold text-right">Qty</th>
                    <th className="pb-2.5 font-semibold text-right">
                      Avg Cost
                    </th>
                    <th className="pb-2.5 font-semibold text-right">LTP</th>
                    <th className="pb-2.5 font-semibold text-right">Cur Val</th>
                    <th className="pb-2.5 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {[
                    {
                      sym: "RELIANCE",
                      qty: "10",
                      avg: "2,850.00",
                      ltp: "2,940.50",
                      val: "29,405.00",
                      pnl: "+905.00",
                      pct: "+3.17%",
                      pos: true,
                    },
                    {
                      sym: "TCS",
                      qty: "5",
                      avg: "3,720.00",
                      ltp: "3,845.00",
                      val: "19,225.00",
                      pnl: "+625.00",
                      pct: "+3.36%",
                      pos: true,
                    },
                    {
                      sym: "INFY",
                      qty: "15",
                      avg: "1,540.00",
                      ltp: "1,520.30",
                      val: "22,804.50",
                      pnl: "-295.50",
                      pct: "-1.28%",
                      pos: false,
                    },
                    {
                      sym: "HDFCBANK",
                      qty: "12",
                      avg: "1,605.00",
                      ltp: "1,640.80",
                      val: "19,689.60",
                      pnl: "+429.60",
                      pct: "+2.23%",
                      pos: true,
                    },
                    {
                      sym: "ICICIBANK",
                      qty: "20",
                      avg: "1,210.00",
                      ltp: "1,265.40",
                      val: "25,308.00",
                      pnl: "+1,108.00",
                      pct: "+4.58%",
                      pos: true,
                    },
                    {
                      sym: "TATAMOTORS",
                      qty: "25",
                      avg: "980.00",
                      ltp: "1,024.50",
                      val: "25,612.50",
                      pnl: "+1,112.50",
                      pct: "+4.54%",
                      pos: true,
                    },
                    {
                      sym: "ITC",
                      qty: "40",
                      avg: "495.00",
                      ltp: "512.20",
                      val: "20,488.00",
                      pnl: "+688.00",
                      pct: "+3.47%",
                      pos: true,
                    },
                    {
                      sym: "BHARTIARTL",
                      qty: "15",
                      avg: "1,580.00",
                      ltp: "1,555.00",
                      val: "23,325.00",
                      pnl: "-375.00",
                      pct: "-1.58%",
                      pos: false,
                    },
                  ].map((row) => (
                    <tr key={row.sym} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 font-sans font-bold text-white">
                        {row.sym}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-200">
                        {row.qty}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-400">
                        ₹{row.avg}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-white font-bold">
                        ₹{row.ltp}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-200">
                        ₹{row.val}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-bold ${row.pos ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {row.pnl} ({row.pct})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#181818] p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  PORTFOLIO SNAPSHOT
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400">
                      Total Invested
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-200 tabular-nums">
                      ₹1,81,660.00
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400">
                      Current Valuation
                    </span>
                    <span className="text-sm font-mono font-bold text-white tabular-nums">
                      ₹1,85,857.60
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400">
                      Unrealized P&L
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                      +₹4,197.60 (+2.31%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-400">
                      Available Cash
                    </span>
                    <span className="text-sm font-mono font-bold text-blue-400 tabular-nums">
                      ₹24,550.00
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    MARGIN & ALLOCATION
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    88.1% Deployed
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
                    <div
                      style={{ width: "88.1%" }}
                      className="bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] h-full rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Invested: ₹1.81L</span>
                    <span>Free Cash: ₹24.5K</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">
                      Day Realized P&L
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      +₹1,240.00
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-medium">
                      Order Execution
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      8 Filled (100%)
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
