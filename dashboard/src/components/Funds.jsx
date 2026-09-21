import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { useToast } from "./ui/ToastContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet,
  Lock,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Filter,
  Ban,
  Loader2,
} from "lucide-react";

const STATUS_FILTERS = [
  { id: "ALL", label: "All Statuses" },
  { id: "SUCCESS", label: "Success" },
  { id: "PENDING", label: "Pending" },
  { id: "PROCESSING", label: "Processing" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "REFUNDED", label: "Refunded" },
];

const TYPE_FILTERS = [
  { id: "ALL", label: "All Types" },
  { id: "DEPOSIT", label: "Deposits" },
  { id: "WITHDRAWAL", label: "Withdrawals" },
];

const Funds = () => {
  const navigate = useNavigate();
  const { refreshKey, triggerRefresh } = useContext(GeneralContext);
  const { lastOrderUpdate } = useMarketData();
  const { addToast } = useToast();

  const [funds, setFunds] = useState({
    balance: 0,
    reservedBalance: 0,
    pendingWithdrawalAmount: 0,
    withdrawableBalance: 0,
    totalBalance: 100000,
    initialBalance: 100000,
    availableMargin: 0,
    usedMargin: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [fundsError, setFundsError] = useState("");
  const [transactionsError, setTransactionsError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtering state
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Load on mount and on global refresh triggers
  useEffect(() => {
    let isMounted = true;

    apiClient
      .get("/funds")
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data) {
          setFunds(res.data.data);
          setFundsError("");
        }
        if (isMounted) setLoadingFunds(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error loading account funds:", err);
          setFundsError("Unable to load funds data. Please check your connection.");
          setLoadingFunds(false);
        }
      });

    const params = {};
    if (typeFilter !== "ALL") params.type = typeFilter;
    if (statusFilter !== "ALL") params.status = statusFilter;

    apiClient
      .get("/payments/history", { params })
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data?.data)) {
          setTransactions(res.data.data);
          setTransactionsError("");
        }
        if (isMounted) {
          setLoadingTransactions(false);
          setIsRefreshing(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error loading payment history:", err);
          setTransactionsError("Unable to load transaction history.");
          setLoadingTransactions(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [typeFilter, statusFilter, refreshKey, lastOrderUpdate]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
  };

  // Open cancellation confirmation dialog
  const openCancelConfirmation = (tx) => {
    setSelectedTx(tx);
    setCancelModalOpen(true);
  };

  // Execute cancellation
  const handleConfirmCancel = async () => {
    if (!selectedTx) return;
    setCancelling(true);

    try {
      const res = await apiClient.post(`/withdrawals/${selectedTx._id}/cancel`);
      setCancelling(false);
      setCancelModalOpen(false);

      if (res.data?.success) {
        addToast("Withdrawal cancelled. Reservation released.", "success");
        triggerRefresh();
      }
    } catch (err) {
      setCancelling(false);
      setCancelModalOpen(false);
      const msg =
        err.response?.data?.message || "Failed to cancel withdrawal.";
      addToast(msg, "error");
      // Refresh in case of race condition (e.g. moved to PROCESSING)
      triggerRefresh();
    }
  };

  const formattedBalance = (funds.balance || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedReserved = (funds.reservedBalance || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedPendingWithdrawal = (funds.pendingWithdrawalAmount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedWithdrawable = (funds.withdrawableBalance || 0).toLocaleString("en-IN", {
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Funds & Cash Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cash balance, active order reservations, and fund withdrawals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 text-xs text-slate-300 border-white/10 hover:bg-white/5 cursor-pointer"
            title="Refresh funds ledger"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/payment")}
            className="h-9 px-3.5 gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer font-medium text-xs"
            title="Add funds via Razorpay"
          >
            <ArrowDownLeft className="size-4" />
            Add Funds
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/withdraw")}
            className="h-9 px-3.5 gap-2 text-cyan-300 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer font-medium text-xs"
            title="Withdraw trading funds"
          >
            <ArrowUpRight className="size-4" />
            Withdraw
          </Button>
        </div>
      </div>

      {fundsError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{fundsError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerRefresh()}
            className="text-xs text-rose-300 hover:text-white hover:bg-rose-500/20 h-7 px-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4 Core Cash Management Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Available Cash */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Cash</span>
              <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              ₹{loadingFunds ? "..." : formattedBalance}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Available for active market trading</p>
          </CardContent>
        </Card>

        {/* 2. Reserved for Trading */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Reserved for Trading</span>
              <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : formattedReserved}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Locked in pending limit & stop triggers</p>
          </CardContent>
        </Card>

        {/* 3. Pending Withdrawal */}
        <Card className="border-white/10 bg-[#141414] relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-rose-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Withdrawal</span>
              <div className="size-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : formattedPendingWithdrawal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Reserved in pending withdrawal requests</p>
          </CardContent>
        </Card>

        {/* 4. Withdrawable Cash (Net Liquid) */}
        <Card className="border-emerald-500/30 bg-[#141414] relative overflow-hidden shadow-lg ring-1 ring-emerald-500/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-300 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Withdrawable Cash</span>
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : formattedWithdrawable}
            </div>
            <p className="text-[11px] text-emerald-500/80 mt-1 font-medium">Net unencumbered liquid balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Ledger Breakdown - Tradely Accounting */}
      <Card className="w-full border-white/10 bg-[#141414]">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                <Layers className="size-4 text-cyan-400" />
                Trading Cash Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Institutional portfolio collateral, margin pools, and unencumbered reserves.
              </CardDescription>
            </div>
            <Badge variant="profit" className="text-[11px]">
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-white/5 font-mono text-xs">
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Available Cash</span>
              <span className="text-cyan-400 font-bold tabular-nums">
                ₹{loadingFunds ? "..." : formattedBalance}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Reserved Cash</span>
              <span className="text-amber-400 font-bold tabular-nums">
                ₹{loadingFunds ? "..." : formattedReserved}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Pending Withdrawal</span>
              <span className="text-orange-400 font-bold tabular-nums">
                ₹{loadingFunds ? "..." : formattedPendingWithdrawal}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Withdrawable Cash</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                ₹{loadingFunds ? "..." : formattedWithdrawable}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Total Cash Ledger</span>
              <span className="text-white font-bold tabular-nums">
                ₹{loadingFunds ? "..." : formattedTotal}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Used Margin</span>
              <span className="text-slate-300 tabular-nums">
                ₹{loadingFunds ? "..." : formattedUsedMargin}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
              <span className="font-sans text-slate-300 font-medium">Account Opening Capital</span>
              <span className="text-slate-300 tabular-nums">
                ₹{loadingFunds ? "..." : formattedInitial}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Activity Section */}
      <Card className="w-full border-white/10 bg-[#141414]">
        <CardHeader className="pb-4 border-b border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                  <History className="size-4 text-cyan-400" />
                  Cash Activity
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {transactions.length} Records
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Audit log of all deposits, withdrawals, and ledger lifecycle events.
              </CardDescription>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/payment")}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 cursor-pointer h-8"
              >
                <ArrowDownLeft className="size-3.5" />
                Add Funds
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/withdraw")}
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1.5 cursor-pointer h-8"
              >
                <ArrowUpRight className="size-3.5" />
                Withdraw
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    typeFilter === t.id
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="size-3" />
                Status:
              </span>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all border cursor-pointer ${
                    statusFilter === s.id
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "border-white/5 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loadingTransactions ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3 font-mono">
              <Loader2 className="size-6 animate-spin text-cyan-400" />
              <span>Loading cash activity ledger...</span>
            </div>
          ) : transactionsError ? (
            <div className="p-8 text-center text-xs text-rose-400 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="size-5" />
              <span>{transactionsError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerRefresh()}
                className="mt-2 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
              >
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                <History className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-300 text-sm">No cash activity yet</p>
                <p className="text-slate-500">
                  Add funds or initiate a withdrawal to view your transaction ledger here.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/payment")}
                  className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  Add Funds
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/withdraw")}
                  className="text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  Withdraw
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium">
                  <tr>
                    <th className="p-3.5 pl-5">Date & Time</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Method / Channel</th>
                    <th className="p-3.5">Reference / Destination</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 pr-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {transactions.map((tx) => {
                    const isDeposit = tx.type === "DEPOSIT";
                    const isSuccess = tx.status === "SUCCESS";
                    const isProcessing = tx.status === "PROCESSING";
                    const isPending =
                      tx.status === "PENDING" ||
                      tx.status === "PAYMENT_PENDING" ||
                      tx.status === "CREATED";
                    const isCancelled = tx.status === "CANCELLED";
                    const isFailed = tx.status === "FAILED";
                    const isRefunded = tx.status === "REFUNDED";

                    // Semantic Status Treatment - Review Correction 1: Always SUCCESS, never COMPLETED
                    let statusVariant = "secondary";
                    let statusLabel = tx.status;

                    if (isSuccess) {
                      statusVariant = "profit";
                      statusLabel = "SUCCESS";
                    } else if (isProcessing) {
                      statusVariant = "blue";
                      statusLabel = "PROCESSING";
                    } else if (isPending) {
                      statusVariant = "warning";
                      statusLabel = tx.status === "PAYMENT_PENDING" ? "PAYMENT_PENDING" : "PENDING";
                    } else if (isFailed) {
                      statusVariant = "loss";
                      statusLabel = "FAILED";
                    } else if (isCancelled) {
                      statusVariant = "outline";
                      statusLabel = "CANCELLED";
                    } else if (isRefunded) {
                      statusVariant = "purple";
                      statusLabel = "REFUNDED";
                    }

                    return (
                      <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 pl-5 text-slate-300 font-sans whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3.5 font-sans">
                          <span
                            className={`font-medium ${
                              isDeposit ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {isDeposit ? "Deposit" : "Withdrawal"}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-sans whitespace-nowrap">
                          {isDeposit
                            ? "Razorpay"
                            : tx.method === "UPI_SIMULATED"
                            ? "UPI Transfer"
                            : "Bank Transfer"}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                          {isDeposit
                            ? tx.providerOrderId || tx.metadata?.receipt || tx._id
                            : tx.destination || "****"}
                        </td>
                        <td className="p-3.5 font-sans">
                          <Badge
                            variant={statusVariant}
                            className="text-[10px] uppercase font-bold tracking-wider"
                          >
                            {statusLabel}
                          </Badge>
                        </td>
                        <td
                          className={`p-3.5 text-right font-bold tabular-nums whitespace-nowrap ${
                            isDeposit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isDeposit ? "+" : "-"}₹
                          {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 pr-5 text-center">
                          {!isDeposit && isPending ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCancelConfirmation(tx)}
                              className="h-6 px-2.5 text-[10px] text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer font-sans"
                            >
                              Cancel
                            </Button>
                          ) : !isDeposit && isProcessing ? (
                            <span
                              className="text-cyan-400/70 text-[10px] font-sans italic"
                              title="Cancellation is unavailable while withdrawal is being processed"
                            >
                              In Flight
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Ban className="size-5 text-rose-400" />
              Cancel Withdrawal?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed pt-2">
              Are you sure you want to cancel this withdrawal of{" "}
              <span className="text-white font-mono font-bold">
                ₹{selectedTx?.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-3.5 rounded-xl border border-white/5 bg-black/40 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Destination:</span>
              <span className="font-mono text-slate-200">{selectedTx?.destination || "****"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ledger Effect:</span>
              <span className="text-emerald-400 font-medium">Pending reservation released back to cash</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-white/5">
              No real money movement occurs. Your withdrawable cash balance will be immediately restored.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
              className="text-xs border-white/10 text-slate-300"
            >
              Keep Withdrawal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-1.5"
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funds;
