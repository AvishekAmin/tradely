import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Info,
  ArrowUpRight,
} from "lucide-react";

const BuyActionWindow = ({ uid }) => {
  const { closeBuyWindow, triggerRefresh } = useContext(GeneralContext);
  const { getQuote } = useMarketData();

  const liveQuote = getQuote(uid);
  const livePrice = liveQuote?.price ?? null;

  const [orderType, setOrderType] = useState("MARKET");
  const [stockQuantity, setStockQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(() => (livePrice ? livePrice.toFixed(2) : ""));
  const [stopPrice, setStopPrice] = useState(() =>
    livePrice ? (Math.round(livePrice * 1.02 * 100) / 100).toFixed(2) : ""
  );
  const [availableBalance, setAvailableBalance] = useState(null);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch current available balance from backend
  useEffect(() => {
    apiClient
      .get("/funds")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setAvailableBalance(res.data.data.balance);
        }
        setLoadingFunds(false);
      })
      .catch((err) => {
        console.error("Error fetching available funds:", err);
        setLoadingFunds(false);
      });
  }, []);

  // Keyboard escape listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        closeBuyWindow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeBuyWindow, isSubmitting]);

  const parsedQty = parseInt(stockQuantity, 10) || 0;
  const parsedLimit = parseFloat(limitPrice) || 0;
  const parsedStop = parseFloat(stopPrice) || 0;

  let executionPrice = livePrice ?? 0;
  if (orderType === "LIMIT" || orderType === "STOP_LIMIT") {
    executionPrice = parsedLimit;
  }

  const totalCost = Math.round(parsedQty * executionPrice * 100) / 100;
  const remainingBalance =
    availableBalance !== null ? availableBalance - totalCost : null;
  const hasInsufficientFunds =
    availableBalance !== null && remainingBalance < 0;

  const isMarketPriceUnavailable =
    orderType === "MARKET" && (livePrice === null || livePrice <= 0);
  const isLimitInvalid =
    (orderType === "LIMIT" || orderType === "STOP_LIMIT") && parsedLimit <= 0;
  const isStopInvalid = orderType === "STOP_LIMIT" && parsedStop <= 0;
  const isStopDirectionInvalid =
    orderType === "STOP_LIMIT" && livePrice !== null && parsedStop <= livePrice;
  const isStopLimitRelationInvalid =
    orderType === "STOP_LIMIT" &&
    parsedLimit > 0 &&
    parsedStop > 0 &&
    parsedLimit < parsedStop;

  const handleBuyClick = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validations
    if (isMarketPriceUnavailable) {
      setErrorMessage("Live market price is currently unavailable for this instrument.");
      return;
    }
    if (isLimitInvalid) {
      setErrorMessage("Limit price must be greater than zero.");
      return;
    }
    if (isStopInvalid) {
      setErrorMessage("Stop price must be greater than zero.");
      return;
    }
    if (isStopDirectionInvalid) {
      setErrorMessage(
        `BUY Stop price (₹${parsedStop.toFixed(2)}) must be strictly above current market price (₹${livePrice.toFixed(2)}).`
      );
      return;
    }
    if (isStopLimitRelationInvalid) {
      setErrorMessage(
        `BUY Stop-Limit requires limit price (₹${parsedLimit.toFixed(2)}) to be greater than or equal to stop price (₹${parsedStop.toFixed(2)}).`
      );
      return;
    }
    if (!parsedQty || parsedQty <= 0) {
      setErrorMessage("Quantity must be a positive whole number.");
      return;
    }
    if (hasInsufficientFunds) {
      setErrorMessage(
        `Insufficient available funds. Order requires ₹${totalCost.toFixed(2)} but only ₹${availableBalance.toFixed(2)} is available.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: uid,
        qty: parsedQty,
        mode: "BUY",
        orderType,
      };

      if (orderType === "LIMIT") {
        payload.limitPrice = parsedLimit;
      } else if (orderType === "STOP_LIMIT") {
        payload.stopPrice = parsedStop;
        payload.limitPrice = parsedLimit;
      }

      const res = await apiClient.post("/newOrder", payload);

      if (res.data?.success) {
        setSuccessMessage(
          res.data.message ||
            `Successfully placed ${orderType} BUY order for ${parsedQty} share(s) of ${uid}!`
        );
        triggerRefresh();

        setTimeout(() => {
          closeBuyWindow();
        }, 800);
      } else {
        setErrorMessage(res.data?.message || "Order failed to execute.");
        setIsSubmitting(false);
      }
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "Failed to place buy order. Please try again.";
      setErrorMessage(serverMessage);
      setIsSubmitting(false);
    }
  };

  const isFormInvalid =
    isSubmitting ||
    hasInsufficientFunds ||
    isMarketPriceUnavailable ||
    isLimitInvalid ||
    isStopInvalid ||
    isStopDirectionInvalid ||
    isStopLimitRelationInvalid;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      {/* Modal Dialog Card */}
      <div
        className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-white animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 bg-[#171717] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  BUY ORDER
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-400 font-medium">NSE/BSE</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{uid}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {livePrice !== null ? (
              <Badge variant="live" className="gap-1.5 font-mono text-xs">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                ₹{livePrice.toFixed(2)}
              </Badge>
            ) : (
              <Badge variant="loss" className="text-xs">
                Price Unavailable
              </Badge>
            )}

            <button
              type="button"
              onClick={closeBuyWindow}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="p-4 border-b border-white/5 bg-[#141414]">
          <div className="grid grid-cols-3 gap-2 bg-[#1A1A1A] p-1 rounded-xl border border-white/5">
            {[
              { id: "MARKET", label: "Market" },
              { id: "LIMIT", label: "Limit" },
              { id: "STOP_LIMIT", label: "Stop-Limit" },
            ].map((tab) => {
              const active = orderType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setOrderType(tab.id);
                    if (tab.id === "LIMIT" && !limitPrice && livePrice) {
                      setLimitPrice(livePrice.toFixed(2));
                    }
                    if (tab.id === "STOP_LIMIT") {
                      if (!stopPrice && livePrice) {
                        setStopPrice((Math.round(livePrice * 1.02 * 100) / 100).toFixed(2));
                      }
                      if (!limitPrice && livePrice) {
                        setLimitPrice((Math.round(livePrice * 1.03 * 100) / 100).toFixed(2));
                      }
                    }
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Status Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Inputs Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
              <Input
                type="number"
                min="1"
                step="1"
                disabled={isSubmitting}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="font-mono text-sm"
                placeholder="1"
              />
            </div>

            {/* Price fields */}
            {orderType === "MARKET" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Market Price</label>
                <div className="h-10 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-between text-sm font-mono text-emerald-400 font-bold">
                  <span>{livePrice !== null ? `₹${livePrice.toFixed(2)}` : "Unavailable"}</span>
                  <Badge variant="live" className="text-[10px] py-0 px-1.5 h-4">
                    LTP
                  </Badge>
                </div>
              </div>
            )}

            {orderType === "LIMIT" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Limit Price (₹)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="e.g. 3400.00"
                />
              </div>
            )}

            {orderType === "STOP_LIMIT" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Stop Trigger (₹)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting}
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="font-mono text-sm"
                  placeholder={`> ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                />
              </div>
            )}
          </div>

          {orderType === "STOP_LIMIT" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Limit Price (₹)</label>
              <Input
                type="number"
                step="0.05"
                min="0.01"
                disabled={isSubmitting}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="font-mono text-sm"
                placeholder=">= Stop Trigger"
              />
            </div>
          )}

          {/* Condition Helper Card */}
          {orderType === "LIMIT" && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Executes when market reaches{" "}
                <strong className="text-white font-mono">
                  ₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}
                </strong>{" "}
                or below. Funds (₹{totalCost.toFixed(2)}) will be reserved upfront until filled or cancelled.
              </span>
            </div>
          )}

          {orderType === "STOP_LIMIT" && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                When market rises to{" "}
                <strong className="text-white font-mono">
                  ₹{parsedStop ? parsedStop.toFixed(2) : "..."}
                </strong>
                , triggers a Limit Buy at max{" "}
                <strong className="text-white font-mono">
                  ₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}
                </strong>
                .
              </span>
            </div>
          )}

          {/* Ledger Financial Summary Card */}
          <div className="bg-[#171717] rounded-xl p-3.5 border border-white/5 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400 font-sans">
              <span>Available Cash:</span>
              <span className="font-mono font-semibold text-white">
                {loadingFunds
                  ? "..."
                  : `₹${(availableBalance ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 font-sans">
              <span>Required Margin:</span>
              <span className="font-mono font-bold text-cyan-400">
                {orderType === "MARKET"
                  ? livePrice !== null
                    ? `₹${totalCost.toFixed(2)}`
                    : "—"
                  : `₹${totalCost.toFixed(2)}`}
              </span>
            </div>

            {availableBalance !== null && (orderType !== "MARKET" || livePrice !== null) && (
              <div className="flex justify-between items-center text-slate-400 font-sans pt-1 border-t border-white/5">
                <span>Remaining Cash:</span>
                <span
                  className={`font-mono font-bold ${
                    hasInsufficientFunds ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  ₹{remainingBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-[#171717] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Order Value: </span>
            <span className="font-mono font-bold text-white text-sm">
              ₹{totalCost.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              type="button"
              onClick={closeBuyWindow}
              disabled={isSubmitting}
              className="text-xs border-white/10 text-slate-300 hover:bg-white/5"
            >
              Cancel
            </Button>

            <Button
              variant="buy"
              type="button"
              onClick={handleBuyClick}
              disabled={isFormInvalid}
              className="text-xs px-5 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Placing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4" />
                  {orderType === "STOP_LIMIT"
                    ? "Place Stop-Limit Buy"
                    : orderType === "LIMIT"
                    ? "Place Limit Buy"
                    : "Buy Now"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
