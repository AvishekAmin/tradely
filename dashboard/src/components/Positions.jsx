import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

const Positions = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { getQuote, lastOrderUpdate } = useMarketData();
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPositions = useCallback(() => {
    setLoading(true);
    return apiClient
      .get("/allPositions")
      .then((res) => {
        setAllPositions(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching positions:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/allPositions")
      .then((res) => {
        if (!ignore) {
          setAllPositions(res.data || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error fetching positions:", err);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, lastOrderUpdate]);

  let totalInvestment = 0;
  let currentTotalValue = 0;
  let totalPnL = 0;

  allPositions.forEach((pos) => {
    const quote = getQuote(pos.name);
    const livePrice = quote?.price ?? pos.avg ?? 0;
    const inv = (pos.avg || 0) * (pos.qty || 0);
    const curVal = livePrice * (pos.qty || 0);
    totalInvestment += inv;
    currentTotalValue += curVal;
    const rowPnL =
      pos.qty === 0
        ? pos.realizedPnL || 0
        : curVal - inv + (pos.realizedPnL || 0);
    totalPnL += rowPnL;
  });

  const isOverallProfit = totalPnL >= 0;

  const openCount = allPositions.filter((p) => (p.qty || 0) > 0).length;
  const closedCount = allPositions.filter((p) => (p.qty || 0) === 0).length;

  const filteredPositions = allPositions.filter((p) => {
    if (statusFilter === "OPEN") return (p.qty || 0) > 0;
    if (statusFilter === "CLOSED") return (p.qty || 0) === 0;
    return true;
  });

  if (loading && allPositions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="size-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Loading trading positions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Day Positions
            <Badge variant="secondary" className="font-mono">
              {allPositions.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPositions}
              disabled={loading}
              className="h-6 px-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg gap-1.5 cursor-pointer transition-colors"
              title="Refresh positions"
            >
              <RefreshCw
                className={`size-3 ${loading ? "animate-spin text-cyan-400" : ""}`}
              />
              <span className="text-[11px] font-medium">Refresh</span>
            </Button>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time active positions and executions from today's trading
            session.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allPositions.length > 0 && (
            <>
              <div className="bg-[#171717] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Invested:
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  ₹{totalInvestment.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#171717] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Current:
                </span>
                <span className="font-mono text-sm font-semibold text-white">
                  ₹{currentTotalValue.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#171717] px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Total P&L:
                </span>
                <span
                  className={`font-mono text-sm font-bold flex items-center gap-1 ${
                    isOverallProfit ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isOverallProfit ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {isOverallProfit ? "+" : ""}₹{totalPnL.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {allPositions.length > 0 && (
        <div className="flex items-center gap-2 bg-[#171717] p-1 rounded-xl border border-white/5 text-xs font-semibold w-fit">
          {[
            { id: "ALL", label: "All Positions", count: allPositions.length },
            { id: "OPEN", label: "Open", count: openCount },
            { id: "CLOSED", label: "Closed", count: closedCount },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  active
                    ? "bg-white/10 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {allPositions.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-[#141414]/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
              <Briefcase className="size-8 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              No open positions
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              You currently have no open intraday or derivative positions in
              this trading account.
            </p>
            <Link to="/">
              <Button variant="gradient" className="gap-2">
                Browse Watchlist
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-white/10 bg-[#141414]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#171717]/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4 text-right">Qty.</th>
                  <th className="py-3 px-4 text-right">Avg. Price</th>
                  <th className="py-3 px-4 text-right">LTP</th>
                  <th className="py-3 px-4 text-right">P&L</th>
                  <th className="py-3 px-4 text-right">Day Chg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-slate-500 font-sans"
                    >
                      No positions match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((stock, index) => {
                    const quote = getQuote(stock.name);
                    const livePrice = quote?.price ?? null;
                    const isClosed = (stock.qty || 0) === 0;
                    const curValue =
                      livePrice !== null ? livePrice * (stock.qty || 0) : null;
                    const unrealizedPnL =
                      curValue !== null
                        ? curValue - (stock.avg || 0) * (stock.qty || 0)
                        : null;
                    const pnl = isClosed
                      ? stock.realizedPnL || 0
                      : unrealizedPnL !== null
                        ? unrealizedPnL + (stock.realizedPnL || 0)
                        : null;
                    const isProfit = (pnl || 0) >= 0.0;
                    const dayChangePercent = quote?.changePercent;
                    const isDayPositive =
                      dayChangePercent !== undefined
                        ? dayChangePercent >= 0
                        : true;

                    return (
                      <tr
                        key={stock._id || index}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                          <Badge
                            variant="secondary"
                            className="bg-white/5 text-slate-300 border-white/10 text-[11px]"
                          >
                            {stock.product || "CNC"}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 font-sans font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{stock.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-200 tabular-nums">
                          {stock.qty}
                          {isClosed && (
                            <span className="ml-1.5 text-[10px] text-slate-500 font-medium font-sans">
                              (Closed)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-300 tabular-nums">
                          ₹{(stock.avg || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-white font-bold tabular-nums">
                          {livePrice !== null
                            ? `₹${livePrice.toFixed(2)}`
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums">
                          {pnl !== null ? (
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-bold inline-flex items-center gap-0.5 ${
                                  isProfit
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {isProfit ? "+" : ""}₹{pnl.toFixed(2)}
                              </span>
                              {!isClosed &&
                                stock.realizedPnL !== undefined &&
                                stock.realizedPnL !== 0 && (
                                  <span className="text-[10px] text-slate-500 font-sans">
                                    Realized:{" "}
                                    {stock.realizedPnL >= 0 ? "+" : ""}₹
                                    {stock.realizedPnL.toFixed(2)}
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums">
                          {dayChangePercent !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isDayPositive
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {isDayPositive ? (
                                <ArrowUpRight className="size-3.5" />
                              ) : (
                                <ArrowDownRight className="size-3.5" />
                              )}
                              {isDayPositive ? "+" : ""}
                              {dayChangePercent.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Positions;
