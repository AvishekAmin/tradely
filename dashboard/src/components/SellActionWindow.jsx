import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import "../index.css";

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
  const isLimitInvalid = (orderType === "LIMIT" || orderType === "STOP_LIMIT") && parsedLimit <= 0;
  const isStopInvalid = (orderType === "STOP_MARKET" || orderType === "STOP_LIMIT") && parsedStop <= 0;
  const isStopDirectionInvalid =
    (orderType === "STOP_MARKET" || orderType === "STOP_LIMIT") &&
    livePrice !== null &&
    parsedStop >= livePrice;
  const isStopLimitRelationInvalid =
    orderType === "STOP_LIMIT" && parsedLimit > 0 && parsedStop > 0 && parsedLimit > parsedStop;

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
    e.preventDefault();
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
            res.data.message || `Successfully created OCO bracket for ${parsedQty} share(s) of ${uid}!`
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
          res.data.message || `Successfully placed ${orderType} SELL order for ${parsedQty} share(s) of ${uid}!`
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

  return (
    <div className="buy-window-container" id="sell-window">
      <div
        className="header"
        style={{
          borderTopLeftRadius: "var(--radius-md)",
          borderTopRightRadius: "var(--radius-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--loss, #ef4444)" }}>SELL</span> {uid}
            </h3>
            {livePrice !== null ? (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "var(--profit, #10b981)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--profit, #10b981)",
                  }}
                />
                ₹{livePrice.toFixed(2)} LIVE
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "var(--loss, #ef4444)",
                }}
              >
                Price unavailable
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeSellWindow}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Order Type Tabs */}
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          {[
            { id: "MARKET", label: "MARKET" },
            { id: "LIMIT", label: "LIMIT" },
            { id: "STOP_MARKET", label: "STOP-MARKET" },
            { id: "STOP_LIMIT", label: "STOP-LIMIT" },
            { id: "TRAILING_STOP", label: "TRAILING STOP" },
            { id: "OCO", label: "OCO BRACKET" },
          ].map((tab) => {
            const isSelected = orderType === tab.id;
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
                style={{
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: "1px solid",
                  borderColor: isSelected ? "var(--loss, #ef4444)" : "rgba(255,255,255,0.1)",
                  backgroundColor: isSelected ? "rgba(239, 68, 68, 0.2)" : "transparent",
                  color: isSelected ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="regular-order">
        {/* Status Messages */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "var(--loss, #ef4444)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "var(--profit, #10b981)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            ✓ {successMessage}
          </div>
        )}

        {/* Owned Status Banner */}
        {!loadingHolding && availableShares === 0 && (
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "var(--warning, #f59e0b)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            ⚠️ No shares available to sell.{" "}
            {reservedQty > 0
              ? `(${reservedQty} share(s) reserved in pending orders).`
              : `You do not own ${uid}.`}
          </div>
        )}

        {/* Input Fields */}
        <div className="inputs">
          <fieldset>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <legend>Qty.</legend>
              {availableShares > 0 && (
                <button
                  type="button"
                  onClick={handleSetMaxQty}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-blue, #3b82f6)",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontWeight: 600,
                  }}
                >
                  MAX ({availableShares})
                </button>
              )}
            </div>
            <input
              type="number"
              name="qty"
              id="sell-qty"
              min="1"
              max={availableShares || 1}
              step="1"
              disabled={isSubmitting || availableShares === 0}
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>

          {orderType === "MARKET" && (
            <fieldset>
              <legend>Live Price (₹)</legend>
              <input
                type="text"
                name="price"
                id="sell-price"
                readOnly
                disabled
                value={livePrice !== null ? `₹${livePrice.toFixed(2)} (Live)` : "Price unavailable"}
                style={{
                  cursor: "not-allowed",
                  color: "var(--loss, #ef4444)",
                  fontWeight: 600,
                }}
              />
            </fieldset>
          )}

          {orderType === "LIMIT" && (
            <fieldset>
              <legend>Limit Price (₹)</legend>
              <input
                type="number"
                name="limitPrice"
                id="sell-limit-price"
                step="0.05"
                min="0.01"
                disabled={isSubmitting || availableShares === 0}
                onChange={(e) => setLimitPrice(e.target.value)}
                value={limitPrice}
                placeholder="e.g. 3600.00"
                style={{ fontWeight: 600 }}
              />
            </fieldset>
          )}

          {orderType === "STOP_MARKET" && (
            <fieldset>
              <legend>Stop Trigger (₹)</legend>
              <input
                type="number"
                name="stopPrice"
                id="sell-stop-price"
                step="0.05"
                min="0.01"
                disabled={isSubmitting || availableShares === 0}
                onChange={(e) => setStopPrice(e.target.value)}
                value={stopPrice}
                placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                style={{ fontWeight: 600 }}
              />
            </fieldset>
          )}

          {orderType === "STOP_LIMIT" && (
            <>
              <fieldset>
                <legend>Stop Trigger (₹)</legend>
                <input
                  type="number"
                  name="stopPrice"
                  id="sell-stop-limit-trigger"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  onChange={(e) => setStopPrice(e.target.value)}
                  value={stopPrice}
                  placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                  style={{ fontWeight: 600 }}
                />
              </fieldset>
              <fieldset>
                <legend>Limit Floor (₹)</legend>
                <input
                  type="number"
                  name="limitPrice"
                  id="sell-stop-limit-floor"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  value={limitPrice}
                  placeholder={`<= Stop Price`}
                  style={{ fontWeight: 600 }}
                />
              </fieldset>
            </>
          )}

          {orderType === "TRAILING_STOP" && (
            <>
              <fieldset>
                <legend>Trail By</legend>
                <select
                  value={trailType}
                  onChange={(e) => setTrailType(e.target.value)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "var(--text-primary)",
                    border: "none",
                    outline: "none",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <option value="PERCENT">% Percentage</option>
                  <option value="AMOUNT">₹ Price Distance</option>
                </select>
              </fieldset>
              {trailType === "PERCENT" ? (
                <fieldset>
                  <legend>Trail %</legend>
                  <input
                    type="number"
                    name="trailPercent"
                    id="sell-trail-pct"
                    step="0.5"
                    min="0.1"
                    max="99.9"
                    disabled={isSubmitting || availableShares === 0}
                    onChange={(e) => setTrailPercent(e.target.value)}
                    value={trailPercent}
                    placeholder="e.g. 5.0"
                    style={{ fontWeight: 600 }}
                  />
                </fieldset>
              ) : (
                <fieldset>
                  <legend>Trail ₹ Amount</legend>
                  <input
                    type="number"
                    name="trailAmount"
                    id="sell-trail-amt"
                    step="0.5"
                    min="0.05"
                    disabled={isSubmitting || availableShares === 0}
                    onChange={(e) => setTrailAmount(e.target.value)}
                    value={trailAmount}
                    placeholder="e.g. 25.00"
                    style={{ fontWeight: 600 }}
                  />
                </fieldset>
              )}
            </>
          )}

          {orderType === "OCO" && (
            <>
              <fieldset>
                <legend>Take Profit Limit (₹)</legend>
                <input
                  type="number"
                  name="takeProfit"
                  id="sell-oco-tp"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  value={takeProfitPrice}
                  placeholder={`> ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                  style={{ fontWeight: 600, color: "var(--profit, #10b981)" }}
                />
              </fieldset>
              <fieldset>
                <legend>Stop Loss (₹)</legend>
                <input
                  type="number"
                  name="stopLoss"
                  id="sell-oco-sl"
                  step="0.05"
                  min="0.01"
                  disabled={isSubmitting || availableShares === 0}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  value={stopLossPrice}
                  placeholder={`< ₹${livePrice ? livePrice.toFixed(2) : "0"}`}
                  style={{ fontWeight: 600, color: "var(--loss, #ef4444)" }}
                />
              </fieldset>
            </>
          )}
        </div>

        {/* Condition helpers */}
        {orderType === "LIMIT" && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            💡 <strong>Condition:</strong> Executes when market price reaches{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>
              ₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}
            </span>{" "}
            or above. Shares ({parsedQty}) reserved until executed or cancelled.
          </div>
        )}

        {orderType === "STOP_MARKET" && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            💡 <strong>Stop-Loss Condition:</strong> Triggers a Market Sell if price drops to{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>
              ₹{parsedStop ? parsedStop.toFixed(2) : "..."}
            </span>{" "}
            or below. Shares ({parsedQty}) reserved.
          </div>
        )}

        {orderType === "STOP_LIMIT" && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            💡 <strong>Stop-Limit Condition:</strong> Activates when market drops to{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>
              ₹{parsedStop ? parsedStop.toFixed(2) : "..."}
            </span>
            , placing a Limit Sell with floor at{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>
              ₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}
            </span>
            .
          </div>
        )}

        {orderType === "TRAILING_STOP" && (
          <div
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            💡 <strong>Trailing Stop:</strong> Initial stop triggers @{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>
              ₹{calculatedTrailingStop > 0 ? calculatedTrailingStop.toFixed(2) : "..."}
            </span>
            . As market makes new highs, stop ratchets up. Triggers market sell when dropping by{" "}
            {trailType === "PERCENT" ? `${parsedTrailPct}%` : `₹${parsedTrailAmt.toFixed(2)}`} from peak.
          </div>
        )}

        {orderType === "OCO" && (
          <div
            style={{
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            💡 <strong>OCO Bracket:</strong> Single shared reservation of {parsedQty} share(s).
            Executes Take-Profit @{" "}
            <span style={{ color: "var(--profit, #10b981)", fontWeight: 600 }}>
              ₹{parsedTakeProfit ? parsedTakeProfit.toFixed(2) : "..."}
            </span>{" "}
            OR Stop-Loss @{" "}
            <span style={{ color: "var(--loss, #ef4444)", fontWeight: 600 }}>
              ₹{parsedStopLoss ? parsedStopLoss.toFixed(2) : "..."}
            </span>
            . When one executes, the other is immediately cancelled!
          </div>
        )}

        {/* Financial Details */}
        <div
          style={{
            background: "var(--bg-input, #1a1a1a)",
            borderRadius: "6px",
            padding: "10px 14px",
            fontSize: "0.82rem",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginTop: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Available Shares:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {loadingHolding
                ? "Checking..."
                : `${availableShares} shares ${reservedQty > 0 ? `(${reservedQty} reserved)` : ""}`}
            </span>
          </div>

          {ownedQty > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Avg Buy Price:</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                ₹{avgBuyPrice.toFixed(2)}
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Estimated Proceeds:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {executionPrice > 0 ? `₹${totalProceeds.toFixed(2)}` : "—"}
            </span>
          </div>

          {ownedQty > 0 && executionPrice > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Est. Realized P&L:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: isProfit ? "var(--profit, #10b981)" : "var(--loss, #ef4444)",
                }}
              >
                {isProfit ? "+" : ""}₹{estimatedPnL.toFixed(2)}
              </span>
            </div>
          )}

          {availableBalance !== null && executionPrice > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Est. Cash After Sale:</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                ₹{(availableBalance + totalProceeds).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="buttons">
        <span style={{ fontSize: "0.82rem" }}>
          Credit: <strong>{executionPrice > 0 ? `+₹${totalProceeds.toFixed(2)}` : "—"}</strong>
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn"
            onClick={handleSellClick}
            disabled={
              isSubmitting ||
              availableShares === 0 ||
              parsedQty > availableShares ||
              isMarketPriceUnavailable ||
              isLimitInvalid ||
              isStopInvalid ||
              isStopDirectionInvalid ||
              isStopLimitRelationInvalid ||
              isTrailInvalid ||
              isOcoInvalid
            }
            style={{
              backgroundColor: "var(--loss, #ef4444)",
              color: "#ffffff",
              opacity:
                isSubmitting ||
                availableShares === 0 ||
                parsedQty > availableShares ||
                isMarketPriceUnavailable ||
                isLimitInvalid ||
                isStopInvalid ||
                isStopDirectionInvalid ||
                isStopLimitRelationInvalid ||
                isTrailInvalid ||
                isOcoInvalid
                  ? 0.6
                  : 1,
              cursor:
                isSubmitting ||
                availableShares === 0 ||
                parsedQty > availableShares ||
                isMarketPriceUnavailable ||
                isLimitInvalid ||
                isStopInvalid ||
                isStopDirectionInvalid ||
                isStopLimitRelationInvalid ||
                isTrailInvalid ||
                isOcoInvalid
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSubmitting
              ? "Placing..."
              : orderType === "OCO"
              ? "Place OCO Bracket"
              : orderType === "TRAILING_STOP"
              ? "Place Trailing Stop"
              : orderType === "STOP_LIMIT"
              ? "Place Stop-Limit Sell"
              : orderType === "STOP_MARKET"
              ? "Place Stop-Loss"
              : orderType === "LIMIT"
              ? "Place Limit Sell"
              : "Sell"}
          </button>
          <button
            type="button"
            className="btn btn-grey"
            onClick={closeSellWindow}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;
