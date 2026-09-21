import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowDownRight,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";

const SellActionWindow = ({ uid }) => {
  const { closeSellWindow, triggerRefresh } = useContext(GeneralContext);
  const { getQuote } = useMarketData();

  const liveQuote = getQuote(uid);
  const livePrice = liveQuote?.price ?? null;

  const [orderType, setOrderType] = useState("MARKET");
  const [stockQuantity, setStockQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(() => (livePrice ? livePrice.toFixed(2) : ""));
  const [stopPrice, setStopPrice] = useState(() =>
    livePrice ? (Math.round(livePrice * 0.95 * 100) / 100).toFixed(2) : ""
  );
  const [trailType, setTrailType] = useState("PERCENT"); // "PERCENT" | "AMOUNT"
  const [trailPercent, setTrailPercent] = useState("5.0");
  const [trailAmount, setTrailAmount] = useState(() =>
    livePrice ? (Math.round(livePrice * 0.05 * 100) / 100).toFixed(2) : "10.00"
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState(() =>
    livePrice ? (Math.round(livePrice * 1.05 * 100) / 100).toFixed(2) : ""
  );
  const [stopLossPrice, setStopLossPrice] = useState(() =>
    livePrice ? (Math.round(livePrice * 0.95 * 100) / 100).toFixed(2) : ""
  );

  const [holdingData, setHoldingData] = useState(null);
  const [loadingHolding, setLoadingHolding] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch holding and funds on mount
  useEffect(() => {
    Promise.all([apiClient.get("/allHoldings"), apiClient.get("/funds")])
      .then(([holdingsRes, fundsRes]) => {
        const holdingsList = holdingsRes.data || [];
        const found = holdingsList.find(
          (h) => h.name.toUpperCase() === uid.toUpperCase()
        );
        if (found) {
          setHoldingData(found);
          const available = Math.max(0, found.qty - (found.reservedQty || 0));
          setStockQuantity(Math.min(1, available));
        } else {
          setHoldingData(null);
        }

        if (fundsRes.data?.success && fundsRes.data?.data) {
          setAvailableBalance(fundsRes.data.data.balance);
        }
        setLoadingHolding(false);
      })
      .catch((err) => {
        console.error("Error fetching holding or funds for sell window:", err);
        setLoadingHolding(false);
      });
  }, [uid]);

  // Keyboard escape listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        closeSellWindow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSellWindow, isSubmitting]);

  const ownedQty = holdingData ? holdingData.qty : 0;
  const reservedQty = holdingData ? holdingData.reservedQty || 0 : 0;
  const availableShares = Math.max(0, ownedQty - reservedQty);
  const avgBuyPrice = holdingData ? holdingData.avg : 0;

  const parsedQty = parseInt(stockQuantity, 10) || 0;
  const parsedLimit = parseFloat(limitPrice) || 0;
  const parsedStop = parseFloat(stopPrice) || 0;
  const parsedTrailPct = parseFloat(trailPercent) || 0;
  const parsedTrailAmt = parseFloat(trailAmount) || 0;
  const parsedTakeProfit = parseFloat(takeProfitPrice) || 0;
  const parsedStopLoss = parseFloat(stopLossPrice) || 0;

  // Calculate trailing stop initial trigger
  let calculatedTrailingStop = 0;
  if (livePrice !== null) {
    if (trailType === "PERCENT" && parsedTrailPct > 0) {
      calculatedTrailingStop = Math.round(livePrice * (1 - parsedTrailPct / 100) * 100) / 100;
    } else if (trailType === "AMOUNT" && parsedTrailAmt > 0) {
      calculatedTrailingStop = Math.round((livePrice - parsedTrailAmt) * 100) / 100;
    }
  }

  // Determine estimated execution price for proceeds calculation
  let executionPrice = livePrice ?? 0;
  if (orderType === "LIMIT") {
    executionPrice = parsedLimit;
  } else if (orderType === "STOP_MARKET") {
    executionPrice = parsedStop;
  } else if (orderType === "STOP_LIMIT") {
    executionPrice = parsedLimit;
  } else if (orderType === "TRAILING_STOP") {
    executionPrice = calculatedTrailingStop;
  } else if (orderType === "OCO") {
    executionPrice = parsedTakeProfit;
  }

  const totalProceeds = Math.round(parsedQty * executionPrice * 100) / 100;
  const estimatedPnL =
    holdingData && parsedQty > 0 && executionPrice > 0
      ? Math.round((executionPrice - avgBuyPrice) * parsedQty * 100) / 100
      : 0;
  const isProfit = estimatedPnL >= 0;

  // Validation flags
  const isMarketPriceUnavailable =
    (orderType === "MARKET" || orderType === "TRAILING_STOP") &&
    (livePrice === null || livePrice <= 0);
  const isLimitInvalid =
    (orderType === "LIMIT" || orderType === "STOP_LIMIT") && parsedLimit <= 0;
  const isStopInvalid =
    (orderType === "STOP_MARKET" || orderType === "STOP_LIMIT") && parsedStop <= 0;
  const isStopDirectionInvalid =
    (orderType === "STOP_MARKET" || orderType === "STOP_LIMIT") &&
    livePrice !== null &&
    parsedStop >= livePrice;
  const isStopLimitRelationInvalid =
    orderType === "STOP_LIMIT" &&
    parsedLimit > 0 &&
    parsedStop > 0 &&
    parsedLimit > parsedStop;

  const isTrailInvalid =
    orderType === "TRAILING_STOP" &&
    (trailType === "PERCENT"
      ? parsedTrailPct <= 0 || parsedTrailPct >= 100
      : parsedTrailAmt <= 0 || (livePrice !== null && parsedTrailAmt >= livePrice));

  const isOcoInvalid =
    orderType === "OCO" &&
    (parsedTakeProfit <= 0 ||
      parsedStopLoss <= 0 ||
      (livePrice !== null && parsedTakeProfit <= livePrice) ||
      (livePrice !== null && parsedStopLoss >= livePrice));

  const handleSetMaxQty = () => {
    if (availableShares > 0) {
      setStockQuantity(availableShares);
    }
  };

  const handleSellClick = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // General validations
    if (availableShares <= 0) {
      setErrorMessage(
        `Cannot sell ${uid}: you do not have any unreserved shares of this instrument available to sell.`
      );
      return;
    }
    if (!parsedQty || parsedQty <= 0) {
      setErrorMessage("Quantity must be a positive whole number.");
      return;
    }
    if (parsedQty > availableShares) {
      setErrorMessage(
        `Cannot sell ${parsedQty} shares. You only have ${availableShares} available share(s) (${reservedQty} reserved in pending orders).`
      );
      return;
    }

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
        `SELL Stop price (₹${parsedStop.toFixed(2)}) must be strictly below current market price (₹${livePrice.toFixed(2)}).`
      );
      return;
    }
    if (isStopLimitRelationInvalid) {
      setErrorMessage(
        `SELL Stop-Limit requires limit price (₹${parsedLimit.toFixed(2)}) to be less than or equal to stop price (₹${parsedStop.toFixed(2)}).`
      );
      return;
    }
    if (isTrailInvalid) {
      setErrorMessage(
        trailType === "PERCENT"
          ? "Trail percent must be between 0 and 100%."
          : `Trail amount must be less than current market price (₹${livePrice?.toFixed(2)}).`
      );
      return;
    }
    if (isOcoInvalid) {
      setErrorMessage(
        `OCO requires Take-Profit (₹${parsedTakeProfit.toFixed(2)}) > market price (₹${livePrice?.toFixed(2)}) and Stop-Loss (₹${parsedStopLoss.toFixed(2)}) < market price.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (orderType === "OCO") {
        const ocoPayload = {
          symbol: uid,
          qty: parsedQty,
          takeProfitLimitPrice: parsedTakeProfit,
          stopLossPrice: parsedStopLoss,
        };

        const res = await apiClient.post("/orders/oco", ocoPayload);
        if (res.data?.success) {
          setSuccessMessage(
            res.data.message ||
              `Successfully created OCO bracket for ${parsedQty} share(s) of ${uid}!`
          );
          triggerRefresh();
          setTimeout(() => {
            closeSellWindow();
          }, 800);
        } else {
          setErrorMessage(res.data?.message || "OCO order failed to execute.");
          setIsSubmitting(false);
        }
        return;
      }

      // Single order types
      const payload = {
        name: uid,
        qty: parsedQty,
        mode: "SELL",
        orderType,
      };

      if (orderType === "LIMIT") {
        payload.limitPrice = parsedLimit;
      } else if (orderType === "STOP_MARKET") {
        payload.stopPrice = parsedStop;
      } else if (orderType === "STOP_LIMIT") {
        payload.stopPrice = parsedStop;
        payload.limitPrice = parsedLimit;
      } else if (orderType === "TRAILING_STOP") {
        if (trailType === "PERCENT") {
          payload.trailPercent = parsedTrailPct;
        } else {
          payload.trailAmount = parsedTrailAmt;
        }
      }

      const res = await apiClient.post("/newOrder", payload);

      if (res.data?.success) {
        setSuccessMessage(
          res.data.message ||
            `Successfully placed ${orderType} SELL order for ${parsedQty} share(s) of ${uid}!`
        );
        triggerRefresh();

        setTimeout(() => {
          closeSellWindow();
        }, 800);
      } else {
        setErrorMessage(res.data?.message || "Order failed to execute.");
        setIsSubmitting(false);
      }
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "Failed to place sell order. Please try again.";
      setErrorMessage(serverMessage);
      setIsSubmitting(false);
    }
  };

  const isFormInvalid =
    isSubmitting ||
    availableShares === 0 ||
    parsedQty > availableShares ||
    isMarketPriceUnavailable ||
    isLimitInvalid ||
    isStopInvalid ||
    isStopDirectionInvalid ||
    isStopLimitRelationInvalid ||
    isTrailInvalid ||
    isOcoInvalid;

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
            <div className="size-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  SELL ORDER
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
              onClick={closeSellWindow}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="p-4 border-b border-white/5 bg-[#141414]">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-[#1A1A1A] p-1 rounded-xl border border-white/5 text-center">
            {[
              { id: "MARKET", label: "Market" },
              { id: "LIMIT", label: "Limit" },
              { id: "STOP_MARKET", label: "SL-M" },
              { id: "STOP_LIMIT", label: "SL-L" },
              { id: "TRAILING_STOP", label: "Trail" },
              { id: "OCO", label: "OCO" },
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
                    if (tab.id === "STOP_MARKET" && livePrice) {
                      setStopPrice((Math.round(livePrice * 0.95 * 100) / 100).toFixed(2));
                    }
                    if (tab.id === "STOP_LIMIT" && livePrice) {
                      setStopPrice((Math.round(livePrice * 0.95 * 100) / 100).toFixed(2));
                      setLimitPrice((Math.round(livePrice * 0.94 * 100) / 100).toFixed(2));
                    }
                    if (tab.id === "OCO" && livePrice) {
                      setTakeProfitPrice((Math.round(livePrice * 1.05 * 100) / 100).toFixed(2));
                      setStopLossPrice((Math.round(livePrice * 0.95 * 100) / 100).toFixed(2));
                    }
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm font-bold"
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
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
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

          {/* Holdings Status Warning if zero shares available */}
          {!loadingHolding && availableShares === 0 && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                No available shares to sell.{" "}
                {reservedQty > 0
                  ? `(${reservedQty} share(s) locked in existing pending orders)`
                  : `You do not own ${uid}.`}
              </span>
            </div>
          )}

          {/* Inputs Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity with MAX button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Quantity</label>
                {availableShares > 0 && (
                  <button
                    type="button"
                    onClick={handleSetMaxQty}
                    className="text-[11px] font-bold text-cyan-400 hover:underline"
                  >
                    MAX ({availableShares})
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="1"
                max={availableShares || 1}
                step="1"
                disabled={isSubmitting || availableShares === 0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="font-mono text-sm"
                placeholder="1"
              />
            </div>

            {/* Dynamic Price fields based on Order Type */}
            {orderType === "MARKET" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Market Price</label>
                <div className="h-10 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-between text-sm font-mono text-rose-400 font-bold">
                  <span>{livePrice !== null ? `₹${livePrice.toFixed(2)}` : "Unavailable"}</span>
                  <Badge variant="loss" className="text-[10px] py-0 px-1.5 h-4">
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
                  disabled={isSubmitting || availableShares === 0}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="e.g. 3600.00"
                />
              </div>
            )}

            {orderType === "STOP_MARKET" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Stop Trigger (₹)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="font-mono text-sm"
                  placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
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
                  disabled={isSubmitting || availableShares === 0}
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="font-mono text-sm"
                  placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                />
              </div>
            )}

            {orderType === "TRAILING_STOP" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Trail Mechanism</label>
                <select
                  value={trailType}
                  onChange={(e) => setTrailType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="PERCENT">% Percentage Drop</option>
                  <option value="AMOUNT">₹ Fixed Rupee Drop</option>
                </select>
              </div>
            )}

            {orderType === "OCO" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400">
                  Take-Profit Limit (₹)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="font-mono text-sm border-emerald-500/30 text-emerald-400 font-bold"
                  placeholder={`> ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                />
              </div>
            )}
          </div>

          {/* Secondary inputs for compound types */}
          {orderType === "STOP_LIMIT" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Limit Price Floor (₹)</label>
              <Input
                type="number"
                step="0.05"
                min="0.01"
                disabled={isSubmitting || availableShares === 0}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="font-mono text-sm"
                placeholder="<= Stop Trigger"
              />
            </div>
          )}

          {orderType === "TRAILING_STOP" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {trailType === "PERCENT" ? "Trail Percentage (%)" : "Trail Distance (₹)"}
              </label>
              <Input
                type="number"
                step={trailType === "PERCENT" ? "0.5" : "1.0"}
                min="0.1"
                disabled={isSubmitting || availableShares === 0}
                value={trailType === "PERCENT" ? trailPercent : trailAmount}
                onChange={(e) =>
                  trailType === "PERCENT"
                    ? setTrailPercent(e.target.value)
                    : setTrailAmount(e.target.value)
                }
                className="font-mono text-sm"
                placeholder={trailType === "PERCENT" ? "5.0" : "15.00"}
              />
            </div>
          )}

          {orderType === "OCO" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-rose-400">Stop-Loss Trigger (₹)</label>
              <Input
                type="number"
                step="0.05"
                min="0.01"
                disabled={isSubmitting || availableShares === 0}
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="font-mono text-sm border-rose-500/30 text-rose-400 font-bold"
                placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
              />
            </div>
          )}

          {/* Explanatory notes */}
          {orderType === "LIMIT" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Executes when market reaches{" "}
                <strong className="text-white font-mono">
                  ₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}
                </strong>{" "}
                or higher. Shares ({parsedQty}) locked in reserve until triggered.
              </span>
            </div>
          )}

          {orderType === "STOP_MARKET" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Info className="size-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Protects downside: Triggers an instant market sell if price drops to{" "}
                <strong className="text-white font-mono">
                  ₹{parsedStop ? parsedStop.toFixed(2) : "..."}
                </strong>{" "}
                or lower.
              </span>
            </div>
          )}

          {orderType === "TRAILING_STOP" && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Sparkles className="size-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Initial stop triggers @{" "}
                <strong className="text-white font-mono">
                  ₹{calculatedTrailingStop > 0 ? calculatedTrailingStop.toFixed(2) : "..."}
                </strong>
                . Automatically ratchets upwards as market climbs, locking in profits.
              </span>
            </div>
          )}

          {orderType === "OCO" && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Layers className="size-4 shrink-0 text-purple-400 mt-0.5" />
              <span>
                Dual conditional bracket: Executes Take-Profit @{" "}
                <strong className="text-emerald-400 font-mono">
                  ₹{parsedTakeProfit ? parsedTakeProfit.toFixed(2) : "..."}
                </strong>{" "}
                OR Stop-Loss @{" "}
                <strong className="text-rose-400 font-mono">
                  ₹{parsedStopLoss ? parsedStopLoss.toFixed(2) : "..."}
                </strong>
                . When one leg executes, the other is automatically cancelled.
              </span>
            </div>
          )}

          {/* Ledger Financial Summary Card */}
          <div className="bg-[#171717] rounded-xl p-3.5 border border-white/5 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400 font-sans">
              <span>Available Shares:</span>
              <span className="font-mono font-semibold text-white">
                {loadingHolding
                  ? "..."
                  : `${availableShares} shares ${
                      reservedQty > 0 ? `(${reservedQty} reserved)` : ""
                    }`}
              </span>
            </div>

            {ownedQty > 0 && (
              <div className="flex justify-between items-center text-slate-400 font-sans">
                <span>Avg Buy Price:</span>
                <span className="font-mono text-slate-300">₹{avgBuyPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-400 font-sans">
              <span>Estimated Proceeds:</span>
              <span className="font-mono font-bold text-white">
                {executionPrice > 0 ? `₹${totalProceeds.toFixed(2)}` : "—"}
              </span>
            </div>

            {ownedQty > 0 && executionPrice > 0 && (
              <div className="flex justify-between items-center text-slate-400 font-sans pt-1 border-t border-white/5">
                <span>Estimated Realized P&L:</span>
                <span
                  className={`font-mono font-bold ${
                    isProfit ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isProfit ? "+" : ""}₹{estimatedPnL.toFixed(2)}
                </span>
              </div>
            )}

            {availableBalance !== null && executionPrice > 0 && (
              <div className="flex justify-between items-center text-slate-400 font-sans pt-1 border-t border-white/5">
                <span>Est. Cash After Sale:</span>
                <span className="font-mono font-bold text-cyan-400">
                  ₹{(availableBalance + totalProceeds).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-[#171717] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Est. Credit: </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {executionPrice > 0 ? `+₹${totalProceeds.toFixed(2)}` : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              type="button"
              onClick={closeSellWindow}
              disabled={isSubmitting}
              className="text-xs border-white/10 text-slate-300 hover:bg-white/5"
            >
              Cancel
            </Button>

            <Button
              variant="sell"
              type="button"
              onClick={handleSellClick}
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
                  <ArrowDownRight className="size-4" />
                  {orderType === "OCO"
                    ? "Place OCO Bracket"
                    : orderType === "TRAILING_STOP"
                    ? "Place Trailing Stop"
                    : orderType === "STOP_LIMIT"
                    ? "Place Stop-Limit Sell"
                    : orderType === "STOP_MARKET"
                    ? "Place Stop-Loss"
                    : orderType === "LIMIT"
                    ? "Place Limit Sell"
                    : "Sell Now"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;
