import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Lock,
  PieChart,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
} from "lucide-react";

const Funds = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { lastOrderUpdate } = useMarketData();
  const [funds, setFunds] = useState({
    balance: 0,
    reservedBalance: 0,
    totalBalance: 100000,
    initialBalance: 100000,
    availableMargin: 0,
    usedMargin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/funds")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setFunds(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading account funds:", err);
        setLoading(false);
      });
  }, [refreshKey, lastOrderUpdate]);

  const formattedBalance = (funds.balance || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedReserved = (funds.reservedBalance || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTotal = (
    funds.totalBalance || (funds.balance || 0) + (funds.reservedBalance || 0)
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedInitial = (funds.initialBalance || 100000).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedUsedMargin = (funds.usedMargin || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Funds & Margin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Institutional capital ledger, reserve pools, and margin allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            className="gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
            disabled
            title="Deposit functionality will be enabled in upcoming payment gateway release"
          >
            <ArrowDownLeft className="size-4" />
            Add Funds
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-slate-300 border-white/10 hover:bg-white/5"
            disabled
            title="Withdrawal functionality will be enabled in upcoming release"
          >
            <ArrowUpRight className="size-4" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Cash</span>
              <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              ₹{loading ? "..." : formattedBalance}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for instant market execution</p>
          </CardContent>
        </Card>

        {/* Reserved Cash */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Reserved Cash</span>
              <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
              ₹{loading ? "..." : formattedReserved}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Locked in pending limit & stop orders</p>
          </CardContent>
        </Card>

        {/* Total Ledger */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-indigo-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Cash Ledger</span>
              <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <PieChart className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              ₹{loading ? "..." : formattedTotal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Available + reserved balance</p>
          </CardContent>
        </Card>

        {/* Used Margin */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Used Margin</span>
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ₹{loading ? "..." : formattedUsedMargin}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Invested across open portfolio holdings</p>
          </CardContent>
        </Card>
      </div>

      {/* Equity & Derivatives Segment Breakdown - Full Width */}
      <Card className="w-full border-white/10 bg-[#141414]">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                <Building2 className="size-4 text-cyan-400" />
                Equity & Derivatives Segment
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                SEBI compliant margin ledger parameters and collateral accounting.
              </CardDescription>
            </div>
            <Badge variant="live" className="text-[11px]">
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-white/5 font-mono text-xs">
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-300 font-medium">Available Cash (Trading)</span>
              <span className="text-cyan-400 font-bold tabular-nums">
                ₹{loading ? "..." : formattedBalance}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-300 font-medium">
                Reserved Cash (Pending Triggers)
              </span>
              <span className="text-amber-400 font-bold tabular-nums">
                ₹{loading ? "..." : formattedReserved}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-300 font-medium">Total Cash Ledger</span>
              <span className="text-white font-bold tabular-nums">
                ₹{loading ? "..." : formattedTotal}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-300 font-medium">Used Margin (Holdings)</span>
              <span className="text-slate-300 tabular-nums">
                ₹{loading ? "..." : formattedUsedMargin}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] bg-white/[0.01]">
              <span className="font-sans text-slate-400">Opening Balance</span>
              <span className="text-slate-400 tabular-nums">
                ₹{loading ? "..." : formattedInitial}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-400">Collateral Margin</span>
              <span className="text-slate-500 tabular-nums">₹0.00</span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-400">SPAN Margin</span>
              <span className="text-slate-500 tabular-nums">₹0.00</span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-400">Delivery Margin</span>
              <span className="text-slate-500 tabular-nums">₹0.00</span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-400">Exposure</span>
              <span className="text-slate-500 tabular-nums">₹0.00</span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
              <span className="font-sans text-slate-400">Options Premium</span>
              <span className="text-slate-500 tabular-nums">₹0.00</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.02] font-semibold">
              <span className="font-sans text-slate-200">Total Collateral Liquid</span>
              <span className="text-white tabular-nums">₹0.00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Funds;
