import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useAuth } from "../context/AuthContext";
import { useMarketData } from "../context/MarketDataContext";
import { DoughnutChart } from "./DoughnutChart";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  LayoutGrid,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Summary = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { user } = useAuth();
  const { getQuote, lastOrderUpdate } = useMarketData();

  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [analyticsBaseline, setAnalyticsBaseline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.get("/funds"),
      apiClient.get("/allHoldings"),
      apiClient.get("/portfolio/analytics"),
    ])
      .then(([fundsRes, holdingsRes, analyticsRes]) => {
        if (!ignore) {
          if (fundsRes.data?.success && fundsRes.data?.data) {
            setBalance(fundsRes.data.data.balance || 0);
            setReservedBalance(fundsRes.data.data.reservedBalance || 0);
            setInitialBalance(fundsRes.data.data.initialBalance || 100000);
          }
          setHoldings(holdingsRes.data || []);
          if (analyticsRes.data?.success && analyticsRes.data?.data) {
            setAnalyticsBaseline(analyticsRes.data.data);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error loading portfolio analytics:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, lastOrderUpdate]);

  // Total Invested Capital (cost basis)
  const totalInvestment =
    Math.round(
      holdings.reduce((sum, h) => sum + (h.qty || 0) * (h.avg || 0), 0) * 100
    ) / 100;

  // Real-time valuation and completeness check
  let liveValuationComplete = true;
  const liveUnavailableSymbols = [];
  let liveCurrentValue = 0;
  const liveAllocation = [];

  for (const holding of holdings) {
    const quote = getQuote(holding.name);
    if (quote && typeof quote.price === "number") {
      const hVal = Math.round((holding.qty || 0) * quote.price * 100) / 100;
      liveCurrentValue += hVal;
      liveAllocation.push({
        symbol: holding.name,
        name: quote.name || holding.name,
        qty: holding.qty,
        value: hVal,
      });
    } else {
      liveValuationComplete = false;
      liveUnavailableSymbols.push(holding.name);
    }
  }

  liveCurrentValue = Math.round(liveCurrentValue * 100) / 100;

  // Realized P&L from executed SELL orders (authoritative from backend)
  const realizedPnL = analyticsBaseline?.realizedPnL || 0;

  // Unrealized P&L
  const unrealizedPnL = liveValuationComplete
    ? Math.round((liveCurrentValue - totalInvestment) * 100) / 100
    : null;

  // Total P&L
  const totalPnL = liveValuationComplete
    ? Math.round((realizedPnL + (unrealizedPnL || 0)) * 100) / 100
    : null;

  const totalPnLPercent =
    liveValuationComplete && totalInvestment > 0
      ? Math.round((totalPnL / totalInvestment) * 10000) / 100
      : 0;

  const isProfit = (totalPnL || 0) >= 0;

  const totalAccountEquity =
    Math.round((balance + reservedBalance + liveCurrentValue) * 100) / 100;
  const deployedCapital =
    Math.round((totalInvestment + reservedBalance) * 100) / 100;
  const totalCapitalBasis =
    Math.round((balance + reservedBalance + totalInvestment) * 100) / 100;
  const marginUtilization =
    totalCapitalBasis > 0
      ? Math.min(100, Math.max(0, Math.round((deployedCapital / totalCapitalBasis) * 1000) / 10))
      : 0;

  // Chart dataset
  const allocationColors = [
    "#00D8F6",
    "#7B61FF",
    "#10B981",
    "#F59E0B",
    "#EC4899",
    "#3B82F6",
    "#8B5CF6",
    "#14B8A6",
  ];

  const chartData = {
    labels: liveAllocation.map((a) => a.symbol),
    datasets: [
      {
        data: liveAllocation.map((a) => a.value),
        backgroundColor: liveAllocation.map(
          (_, i) => allocationColors[i % allocationColors.length]
        ),
        borderColor: "#0A0A0A",
        borderWidth: 2,
      },
    ],
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (loading && holdings.length === 0 && balance === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="size-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Loading portfolio summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="size-6 sm:size-7 text-cyan-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Hi! {user?.username || "Trader"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor live market movements, manage your portfolio, and start your trading journey.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <Clock className="size-3.5 text-cyan-400" />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Incomplete Valuation Alert Banner */}
      {!liveValuationComplete && liveUnavailableSymbols.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-bold">Valuation Alert:</span> Live market quotes are currently unavailable for{" "}
            <span className="font-semibold text-white">
              {liveUnavailableSymbols.join(", ")}
            </span>
            . Overall valuation is paused to protect mathematical precision.
          </div>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash */}
        <Card className="hover:border-white/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Available Cash</span>
            <div className="size-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-white tabular-nums">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Locked in orders: ₹{reservedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Value */}
        <Card className="hover:border-white/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Holdings Value</span>
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black text-white tabular-nums">
              {liveValuationComplete
                ? `₹${liveCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "Calculating..."}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Cost basis: ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Realized P&L */}
        <Card className="hover:border-white/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Realized P&L</span>
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center",
                realizedPnL >= 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              )}
            >
              {realizedPnL >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                "text-xl font-black tabular-nums",
                realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {realizedPnL >= 0 ? "+" : ""}₹
              {realizedPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From closed trades
            </p>
          </CardContent>
        </Card>

        {/* Total Net P&L */}
        <Card className="hover:border-white/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <span className="text-xs font-semibold text-slate-400">Total Net Return</span>
            <Badge
              variant={isProfit ? "profit" : "loss"}
              className="text-[10px] py-0 px-1.5 tabular-nums"
            >
              {isProfit ? "+" : ""}{totalPnLPercent.toFixed(2)}%
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                "text-xl font-black tabular-nums",
                isProfit ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {liveValuationComplete && totalPnL !== null
                ? `${totalPnL >= 0 ? "+" : ""}₹${totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Unrealized: {unrealizedPnL !== null ? `${unrealizedPnL >= 0 ? "+" : ""}₹${unrealizedPnL.toFixed(2)}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Asset Allocation & Ledger Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Asset Allocation Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="size-4 text-cyan-400" />
                Asset Allocation & Weighting
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Real-time breakdown of capital distribution across active portfolio holdings
              </p>
            </div>
            <Link to="/holdings">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                All Holdings <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {liveAllocation.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active holdings. Build a position from your watchlist to view dynamic asset allocation.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto relative flex items-center justify-center">
                  <DoughnutChart data={chartData} />
                  {/* Centered Portfolio Valuation Inside Doughnut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Holdings Value
                    </span>
                    <span className="text-xl font-black text-white font-mono tabular-nums leading-tight mt-1">
                      ₹{liveCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-cyan-400 font-semibold mt-1">
                      {liveAllocation.length} Instrument{liveAllocation.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {liveAllocation.map((item, idx) => {
                    const pct =
                      liveCurrentValue > 0
                        ? ((item.value / liveCurrentValue) * 100).toFixed(1)
                        : "0.0";
                    const color = allocationColors[idx % allocationColors.length];
                    return (
                      <div
                        key={item.symbol}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-white truncate">{item.symbol}</span>
                          <span
                            className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tabular-nums shrink-0"
                            title={`${item.qty} shares`}
                          >
                            {item.qty}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white tabular-nums">
                            ₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-bold text-cyan-400 tabular-nums min-w-[40px] text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capital Ledger Summary */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              Capital & Margin Summary
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Real-time capital reserves, purchasing power & margin health
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Initial Grant:</span>
                <span className="font-semibold text-white tabular-nums">
                  ₹{initialBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Ledger Total:</span>
                <span className="font-semibold text-white tabular-nums">
                  ₹{(balance + reservedBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Committed in Active Orders:</span>
                <span className="font-semibold text-amber-400 tabular-nums">
                  ₹{reservedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Real-Time Margin Utilization & Net Equity */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <PieChart className="size-3.5 text-cyan-400" />
                  <span>Margin Utilization</span>
                </div>
                <span className="font-bold text-cyan-400 tabular-nums">
                  {marginUtilization}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(marginUtilization, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Free Margin</span>
                  <span className="text-white font-bold tabular-nums">
                    ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Total Net Worth</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    ₹{totalAccountEquity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <Link to="/funds" className="w-full block">
              <Button variant="outline" className="w-full text-xs gap-2">
                Manage Margin & Ledger <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Holdings Quick Table Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
          <div>
            <CardTitle className="text-base">Portfolio Snapshot</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Current positions and active valuations
            </p>
          </div>
          <Link to="/holdings">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <span>View All ({holdings.length})</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y border-white/10 bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Instrument</th>
                  <th className="py-3 px-4">Qty.</th>
                  <th className="py-3 px-4">Avg. Cost</th>
                  <th className="py-3 px-4">LTP</th>
                  <th className="py-3 px-4">Avg. Value</th>
                  <th className="py-3 px-4">Current Value</th>
                  <th className="py-3 px-5 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No active holdings. Place your first trade from the watchlist on the left.
                    </td>
                  </tr>
                ) : (
                  holdings.slice(0, 5).map((stock) => {
                    const quote = getQuote(stock.name);
                    const ltp = quote?.price ?? null;
                    const avgVal = (stock.qty || 0) * (stock.avg || 0);
                    const val = ltp !== null ? ltp * (stock.qty || 0) : null;
                    const pnl =
                      val !== null ? val - avgVal : null;
                    const isRowProfit = (pnl || 0) >= 0;

                    return (
                      <tr
                        key={stock.name}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-5 font-bold text-white">
                          {stock.name}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-slate-200">
                          {stock.qty}
                          {stock.reservedQty > 0 && (
                            <span className="ml-1.5 text-[10px] text-amber-400 font-medium">
                              ({stock.reservedQty} res)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-slate-300">
                          ₹{(stock.avg || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums font-semibold text-white">
                          {ltp !== null
                            ? `₹${ltp.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-200">
                          ₹{avgVal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums font-semibold text-white">
                          {val !== null
                            ? `₹${val.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-3.5 px-5 text-right font-bold tabular-nums",
                            isRowProfit ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {pnl !== null
                            ? `${isRowProfit ? "+" : ""}₹${pnl.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
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
    </div>
  );
};

export default Summary;
