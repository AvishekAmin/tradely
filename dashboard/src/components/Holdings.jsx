import React, { useState, useEffect, useContext, useCallback } from "react";
import apiClient from "../config/api";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Holdings = () => {
  const { refreshKey, openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const { getQuote, lastOrderUpdate } = useMarketData();
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHoldings = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/allHoldings")
      .then((res) => {
        setAllHoldings(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching holdings:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/allHoldings")
      .then((res) => {
        if (!ignore) {
          setAllHoldings(res.data || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error fetching holdings:", err);
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

  const totalInvestment = allHoldings.reduce(
    (acc, stock) => acc + (stock.avg || 0) * (stock.qty || 0),
    0
  );
  const totalCurrentValue = allHoldings.reduce((acc, stock) => {
    const q = getQuote(stock.name);
    return acc + (q?.price ?? 0) * (stock.qty || 0);
  }, 0);
  const totalPnl = totalCurrentValue - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
  const isOverallProfit = totalPnl >= 0;

  const chartData = {
    labels: allHoldings.map((stock) => stock.name),
    datasets: [
      {
        label: "Live Stock Price (₹)",
        data: allHoldings.map((stock) => {
          const q = getQuote(stock.name);
          return q?.price ?? 0;
        }),
        backgroundColor: "rgba(0, 216, 246, 0.6)",
        borderColor: "#00D8F6",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Holdings Portfolio
            <Badge variant="secondary" className="font-mono">
              {allHoldings.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHoldings}
              disabled={loading}
              className="h-6 px-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg gap-1.5 cursor-pointer transition-colors"
              title="Refresh holdings"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              <span className="text-[11px] font-medium">Refresh</span>
            </Button>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Consolidated equity holdings, live asset valuation, and unrealized portfolio returns.
          </p>
        </div>
      </div>

      {/* KPI Header Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Investment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Total Investment</span>
            <Wallet className="size-4 text-cyan-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-white tabular-nums">
              ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Book cost basis</p>
          </CardContent>
        </Card>

        {/* Current Valuation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Current Valuation</span>
            <Layers className="size-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-white tabular-nums">
              ₹{totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Real-time live quotes</p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Total Holdings P&L</span>
            <Badge variant={isOverallProfit ? "profit" : "loss"} className="text-[10px] py-0 px-1.5 tabular-nums">
              {isOverallProfit ? "+" : ""}{totalPnlPercent.toFixed(2)}%
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                "text-xl font-black tabular-nums",
                isOverallProfit ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {isOverallProfit ? "+" : ""}₹
              {totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Unrealized position profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Financial Table */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="size-4 text-cyan-400" />
            Portfolio Assets ({allHoldings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Instrument</th>
                  <th className="py-3 px-4">Qty.</th>
                  <th className="py-3 px-4">Avg. Cost</th>
                  <th className="py-3 px-4">Cur. Cost</th>
                  <th className="py-3 px-4">Avg. Value</th>
                  <th className="py-3 px-4">Cur. Value</th>
                  <th className="py-3 px-4">P&L</th>
                  <th className="py-3 px-4">Net Chg.</th>
                  <th className="py-3 px-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan="9" className="py-4 px-5">
                        <div className="h-5 w-full bg-white/5 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : allHoldings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500">
                      Your portfolio is empty. Explore your watchlist on the left to place your first trade.
                    </td>
                  </tr>
                ) : (
                  allHoldings.map((stock) => {
                    const quote = getQuote(stock.name);
                    const currentPrice = quote?.price ?? null;
                    const curValue =
                      currentPrice !== null ? currentPrice * (stock.qty || 0) : null;
                    const avgValue = (stock.qty || 0) * (stock.avg || 0);
                    const pnl =
                      curValue !== null
                        ? curValue - avgValue
                        : null;
                    const isProfit = (pnl || 0) >= 0;
                    const netChangePercent =
                      stock.avg && currentPrice !== null
                        ? ((currentPrice - stock.avg) / stock.avg) * 100
                        : null;

                    return (
                      <tr
                        key={stock.name}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-white text-sm">
                            {stock.name}
                          </div>
                          <div className="text-[10px] text-slate-500">NSE EQ</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white tabular-nums">
                          {stock.qty}
                          {stock.reservedQty > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              {stock.reservedQty} res
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                          ₹{(stock.avg || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white tabular-nums">
                          {currentPrice !== null
                            ? `₹${currentPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200 tabular-nums">
                          ₹{avgValue.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white tabular-nums">
                          {curValue !== null
                            ? `₹${curValue.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-3.5 px-4 font-bold tabular-nums",
                            isProfit ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {pnl !== null
                            ? `${isProfit ? "+" : ""}₹${pnl.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums">
                          {netChangePercent !== null ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold",
                                isProfit
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400"
                              )}
                            >
                              {isProfit ? (
                                <ArrowUpRight className="size-3" />
                              ) : (
                                <ArrowDownRight className="size-3" />
                              )}
                              {netChangePercent >= 0 ? "+" : ""}
                              {netChangePercent.toFixed(2)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="buy"
                              onClick={() => openBuyWindow(stock.name)}
                              className="h-7 px-2.5 text-xs font-bold"
                            >
                              Buy
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="sell"
                              onClick={() => openSellWindow(stock.name)}
                              className="h-7 px-2.5 text-xs font-bold"
                            >
                              Sell
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Price Comparison Graph */}
      {allHoldings.length > 0 && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-cyan-400" />
              Holdings Market Price Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-64 w-full">
              <VerticalGraph data={chartData} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Holdings;
