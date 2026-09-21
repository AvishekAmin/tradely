import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import { useGeneralContext } from "../components/GeneralContext";
import { useToast } from "../components/ui/ToastContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  Lock,
  Clock,
  CheckCircle2,
  Building2,
  QrCode,
  Ban,
  History,
} from "lucide-react";

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

const maskDestinationPreview = (method, val) => {
  if (!val) return "";
  const clean = val.trim();
  if (method === "UPI_SIMULATED") {
    const at = clean.indexOf("@");
    if (at > 0) {
      const handle = clean.slice(0, at);
      const domain = clean.slice(at);
      if (handle.length <= 2) return `${handle[0]}****${domain}`;
      return `${handle.slice(0, 2)}****${domain}`;
    }
    return `${clean.slice(0, 2)}****`;
  }
  if (clean.length > 4) {
    return `****${clean.slice(-4)}`;
  }
  return "****";
};

const WithdrawPage = () => {
  const { refreshKey, triggerRefresh } = useGeneralContext();
  const { addToast } = useToast();

  const [funds, setFunds] = useState({
    balance: 0,
    reservedBalance: 0,
    pendingWithdrawalAmount: 0,
    withdrawableBalance: 0,
  });
  const [loadingFunds, setLoadingFunds] = useState(true);

  const [amount, setAmount] = useState(10000);
  const [inputVal, setInputVal] = useState("10000");
  const [method, setMethod] = useState("UPI_SIMULATED");
  const [destination, setDestination] = useState("trader@okhdfcbank");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Recent withdrawals in-page audit
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedTxToCancel, setSelectedTxToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .get("/funds")
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data) {
          setFunds({
            balance: res.data.data.balance || 0,
            reservedBalance: res.data.data.reservedBalance || 0,
            pendingWithdrawalAmount: res.data.data.pendingWithdrawalAmount || 0,
            withdrawableBalance: res.data.data.withdrawableBalance || 0,
          });
        }
        if (isMounted) setLoadingFunds(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load funds on withdraw page:", err);
          setLoadingFunds(false);
        }
      });

    apiClient
      .get("/withdrawals")
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data?.data)) {
          setRecentWithdrawals(res.data.data);
        }
        if (isMounted) setLoadingRecent(false);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load recent withdrawals:", err);
          setLoadingRecent(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setInputVal(val);
    setError("");
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleQuickSelect = (val) => {
    setAmount(val);
    setInputVal(val.toString());
    setError("");
  };

  const handleDestinationChange = (e) => {
    let val = e.target.value;
    if (method === "BANK_SIMULATED") {
      val = val.replace(/\D/g, "").slice(0, 10);
    }
    setDestination(val);
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("Please enter a valid withdrawal amount.");
      return;
    }

    if (amount > funds.withdrawableBalance) {
      setError(
        `Insufficient withdrawable cash. You have ₹${funds.withdrawableBalance.toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2 }
        )} available for withdrawal.`
      );
      return;
    }

    if (!destination || !destination.trim()) {
      setError("Please enter a destination account or UPI VPA.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteWithdrawal = async () => {
    setIsConfirmOpen(false);
    setSubmitting(true);
    setError("");

    try {
      const res = await apiClient.post("/withdrawals", {
        amount: Number(amount),
        method,
        destination: destination.trim(),
      });

      setSubmitting(false);

      if (res.data?.success) {
        addToast(
          "Withdrawal requested. Amount reserved as PENDING.",
          "success"
        );
        triggerRefresh();
      } else {
        throw new Error(res.data?.message || "Failed to process withdrawal.");
      }
    } catch (err) {
      setSubmitting(false);
      const msg =
        err.response?.data?.message || err.message || "Failed to process withdrawal.";
      setError(msg);
      addToast(msg, "error");
    }
  };

  // Open cancellation confirmation
  const handleCancelClick = (tx) => {
    setSelectedTxToCancel(tx);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedTxToCancel) return;
    setCancelling(true);

    try {
      const res = await apiClient.post(`/withdrawals/${selectedTxToCancel._id}/cancel`);
      setCancelling(false);
      setCancelModalOpen(false);

      if (res.data?.success) {
        addToast("Withdrawal cancelled. Reservation released.", "success");
        triggerRefresh();
      }
    } catch (err) {
      setCancelling(false);
      setCancelModalOpen(false);
      const msg = err.response?.data?.message || "Failed to cancel withdrawal.";
      addToast(msg, "error");
      triggerRefresh();
    }
  };

  const remainingWithdrawable = Math.max(0, funds.withdrawableBalance - (amount > 0 ? amount : 0));
  const maskedPreview = maskDestinationPreview(method, destination);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/funds"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Funds & Cash Management
        </Link>
      </div>

      {/* 4 KPI Strip: Available, Reserved Trading, Pending Withdrawal, Withdrawable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Available Cash</span>
              <Wallet className="size-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">
              ₹{loadingFunds ? "..." : funds.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Reserved Trading</span>
              <Lock className="size-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : funds.reservedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Pending Withdraw</span>
              <Clock className="size-3.5 text-orange-400" />
            </div>
            <div className="text-lg font-bold text-orange-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : funds.pendingWithdrawalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-[#141414] relative overflow-hidden ring-1 ring-emerald-500/20">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Withdrawable Cash</span>
              <CheckCircle2 className="size-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
              ₹{loadingFunds ? "..." : funds.withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Withdrawal Form Card */}
      <Card className="border-white/10 bg-[#141414] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="size-5 text-emerald-400" />
            Withdraw Funds
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Request capital withdrawal to your designated account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleOpenConfirm} className="space-y-5">
            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="withdraw-amount-input" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Withdrawal Amount (INR)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Available: ₹{funds.withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 font-mono">
                  ₹
                </span>
                <Input
                  id="withdraw-amount-input"
                  type="text"
                  value={inputVal}
                  onChange={handleAmountChange}
                  placeholder="10,000"
                  disabled={submitting}
                  className="pl-8 text-base font-mono font-bold text-white bg-[#0E0E0E] border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Quick Select:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((val) => {
                  const isSelected = amount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={submitting || val > funds.withdrawableBalance}
                      onClick={() => handleQuickSelect(val)}
                      className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      }`}
                    >
                      ₹{val.toLocaleString("en-IN")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method Selection */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Withdrawal Method:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMethod("UPI_SIMULATED");
                    setDestination("trader@okhdfcbank");
                  }}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    method === "UPI_SIMULATED"
                      ? "bg-cyan-500/10 border-cyan-500/50 text-white"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center ${method === "UPI_SIMULATED" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400"}`}>
                    <QrCode className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">UPI Transfer</div>
                    <div className="text-[11px] text-slate-400">Instant VPA transfer</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMethod("BANK_SIMULATED");
                    setDestination("8234567890");
                  }}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    method === "BANK_SIMULATED"
                      ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center ${method === "BANK_SIMULATED" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"}`}>
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Bank Account</div>
                    <div className="text-[11px] text-slate-400">Direct NEFT / IMPS transfer</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Destination Input & Masked Preview */}
            <div className="space-y-2">
              <label htmlFor="destination-input" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>{method === "UPI_SIMULATED" ? "UPI ID / VPA" : "Bank Account Number"}</span>
                {maskedPreview && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Masked: <span className="text-cyan-400 font-semibold">{maskedPreview}</span>
                  </span>
                )}
              </label>
              <Input
                id="destination-input"
                type="text"
                value={destination}
                onChange={handleDestinationChange}
                maxLength={method === "BANK_SIMULATED" ? 10 : undefined}
                placeholder={method === "UPI_SIMULATED" ? "e.g. user@upi" : "e.g. 8234567890"}
                disabled={submitting}
                className="text-xs font-mono text-white bg-[#0E0E0E] border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Review Summary Box */}
            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] pb-1 border-b border-white/5">
                Review Withdrawal
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Withdrawal Amount:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ₹{amount > 0 ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Method:</span>
                <span className="text-white font-medium">
                  {method === "UPI_SIMULATED" ? "UPI Transfer" : "Bank Account"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Destination:</span>
                <span className="font-mono text-cyan-400">{maskedPreview || "****"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/5">
                <span className="text-slate-200 font-medium">Est. Remaining Withdrawable:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                  ₹{remainingWithdrawable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="default"
              disabled={submitting || amount <= 0 || amount > funds.withdrawableBalance}
              className="w-full py-6 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Processing Withdrawal...
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4 mr-2" />
                  Withdraw ₹{amount > 0 ? amount.toLocaleString("en-IN") : "0"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* In-Page Recent Withdrawals Audit */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <History className="size-4 text-cyan-400" />
              Recent Withdrawals
            </CardTitle>
            <Link
              to="/funds"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View Full Cash Ledger
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRecent ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              Loading recent withdrawals...
            </div>
          ) : recentWithdrawals.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No recent withdrawals found.
            </div>
          ) : (
            <div className="divide-y divide-white/5 font-mono text-xs">
              {recentWithdrawals.slice(0, 5).map((tx) => {
                const isPending = tx.status === "PENDING";
                const isProcessing = tx.status === "PROCESSING";
                const isSuccess = tx.status === "SUCCESS";
                const isCancelled = tx.status === "CANCELLED";
                const isFailed = tx.status === "FAILED";

                let badgeVariant = "secondary";
                let badgeLabel = tx.status;
                if (isSuccess) {
                  badgeVariant = "profit";
                  badgeLabel = "SUCCESS";
                } else if (isProcessing) {
                  badgeVariant = "blue";
                  badgeLabel = "PROCESSING";
                } else if (isPending) {
                  badgeVariant = "warning";
                  badgeLabel = "PENDING";
                } else if (isFailed) {
                  badgeVariant = "loss";
                  badgeLabel = "FAILED";
                } else if (isCancelled) {
                  badgeVariant = "outline";
                  badgeLabel = "CANCELLED";
                }

                return (
                  <div key={tx._id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <div className="font-sans text-xs text-white font-medium flex items-center gap-2">
                        <span>₹{tx.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        <Badge variant={badgeVariant} className="text-[10px] font-bold">
                          {badgeLabel}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {tx.destination || "****"} &bull;{" "}
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>

                    <div>
                      {isPending ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(tx)}
                          className="h-6 px-2.5 text-[10px] text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-sans cursor-pointer"
                        >
                          Cancel
                        </Button>
                      ) : isProcessing ? (
                        <span className="text-cyan-400/70 text-[10px] italic font-sans">
                          In Flight
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-[#141414] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowUpRight className="size-4 text-emerald-400" />
              Confirm Withdrawal
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Please verify your withdrawal parameters before dispatching.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Withdrawal Amount:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Destination:</span>
              <span className="font-mono text-cyan-400">{maskedPreview}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Withdrawal Method:</span>
              <span className="text-white font-medium">
                {method === "UPI_SIMULATED" ? "UPI Transfer" : "Bank Account"}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-white/5">
              <span>Current Withdrawable Cash:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                ₹{funds.withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-slate-300">Est. Cash Remaining:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                ₹{remainingWithdrawable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="border-white/10 text-slate-300 hover:bg-white/5 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="button"
              onClick={handleExecuteWithdrawal}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog in Withdraw Page */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-base">
              <Ban className="size-4 text-rose-400" />
              Cancel Withdrawal?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Cancel this withdrawal of{" "}
              <span className="text-white font-mono font-bold">
                ₹{selectedTxToCancel?.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl border border-white/5 bg-black/40 text-xs space-y-1.5 text-slate-300">
            <p className="text-[11px] text-slate-400">
              No real money movement occurs. The pending withdrawal reservation will be released and withdrawable cash will become available again.
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
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawPage;
