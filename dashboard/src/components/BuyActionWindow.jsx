import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import "../index.css";

const BuyActionWindow = ({ uid }) => {
  const { closeBuyWindow, triggerRefresh } = useContext(GeneralContext);
  const { getQuote } = useMarketData();

  const liveQuote = getQuote(uid);
  const livePrice = liveQuote?.price ?? null;

  const [orderType, setOrderType] = useState("MARKET");
  const [stockQuantity, setStockQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(() => (livePrice ? livePrice.toFixed(2) : ""));
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

  const parsedQty = parseInt(stockQuantity, 10) || 0;
  const parsedLimit = parseFloat(limitPrice) || 0;
  const executionPrice = orderType === "MARKET" ? (livePrice ?? 0) : parsedLimit;
  const totalCost = Math.round(parsedQty * executionPrice * 100) / 100;
  const remainingBalance =
    availableBalance !== null ? availableBalance - totalCost : null;
  const hasInsufficientFunds =
    availableBalance !== null && remainingBalance < 0;
  const isMarketPriceUnavailable =
    orderType === "MARKET" && (livePrice === null || livePrice <= 0);
  const isLimitInvalid = orderType === "LIMIT" && parsedLimit <= 0;

  const handleBuyClick = async (e) => {
    e.preventDefault();
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
      }

      const res = await apiClient.post("/newOrder", payload);

      if (res.data?.success) {
        setSuccessMessage(
          res.data.message || `Successfully placed ${orderType} BUY order for ${parsedQty} share(s) of ${uid}!`
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

  return (
    <div className="buy-window-container" id="buy-window">
      <div className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ margin: 0 }}>Buy {uid}</h3>
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
            onClick={closeBuyWindow}
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
        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => setOrderType("MARKET")}
            style={{
              padding: "4px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "4px",
              border: "1px solid",
              borderColor: orderType === "MARKET" ? "var(--accent-blue, #3b82f6)" : "rgba(255,255,255,0.1)",
              backgroundColor: orderType === "MARKET" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: orderType === "MARKET" ? "#ffffff" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            MARKET
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("LIMIT");
              if (!limitPrice && livePrice) setLimitPrice(livePrice.toFixed(2));
            }}
            style={{
              padding: "4px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "4px",
              border: "1px solid",
              borderColor: orderType === "LIMIT" ? "var(--accent-blue, #3b82f6)" : "rgba(255,255,255,0.1)",
              backgroundColor: orderType === "LIMIT" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: orderType === "LIMIT" ? "#ffffff" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            LIMIT
          </button>
        </div>
      </div>

      <div className="regular-order">
        {/* Status Feedbacks */}
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

        {/* Input Fields */}
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="buy-qty"
              min="1"
              step="1"
              disabled={isSubmitting}
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>

          {orderType === "MARKET" ? (
            <fieldset>
              <legend>Live Price (₹)</legend>
              <input
                type="text"
                name="price"
                id="buy-price"
                readOnly
                disabled
                value={livePrice !== null ? `₹${livePrice.toFixed(2)} (Live)` : "Price unavailable"}
                style={{
                  cursor: "not-allowed",
                  color: livePrice !== null ? "var(--profit, #10b981)" : "var(--loss, #ef4444)",
                  fontWeight: 600,
                }}
              />
            </fieldset>
          ) : (
            <fieldset>
              <legend>Limit Price (₹)</legend>
              <input
                type="number"
                name="limitPrice"
                id="buy-limit-price"
                step="0.05"
                min="0.01"
                disabled={isSubmitting}
                onChange={(e) => setLimitPrice(e.target.value)}
                value={limitPrice}
                placeholder="e.g. 3400.00"
                style={{ fontWeight: 600 }}
              />
            </fieldset>
          )}
        </div>

        {/* Condition details for LIMIT orders */}
        {orderType === "LIMIT" && (
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
            💡 <strong>Condition:</strong> Executes when market price is{" "}
            <span style={{ color: "#ffffff", fontWeight: 600 }}>₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}</span> or below.
            Funds (₹{totalCost.toFixed(2)}) will be reserved until triggered or cancelled.
          </div>
        )}

        {/* Balance & Order Summary */}
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
            <span style={{ color: "var(--text-muted)" }}>Available Cash:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {loadingFunds
                ? "Loading..."
                : `₹${(availableBalance ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>
              {orderType === "LIMIT" ? "Estimated Reserved Cash:" : "Total Order Value:"}
            </span>
            <span style={{ fontWeight: 600, color: "var(--accent-blue, #3b82f6)" }}>
              {orderType === "MARKET"
                ? livePrice !== null
                  ? `₹${totalCost.toFixed(2)}`
                  : "—"
                : `₹${totalCost.toFixed(2)}`}
            </span>
          </div>

          {availableBalance !== null && (orderType === "LIMIT" || livePrice !== null) && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Est. Remaining Cash:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: hasInsufficientFunds
                    ? "var(--loss, #ef4444)"
                    : "var(--profit, #10b981)",
                }}
              >
                ₹{remainingBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="buttons">
        <span style={{ fontSize: "0.82rem" }}>
          Margin req:{" "}
          <strong>
            {orderType === "MARKET"
              ? livePrice !== null
                ? `₹${totalCost.toFixed(2)}`
                : "—"
              : `₹${totalCost.toFixed(2)}`}
          </strong>
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-blue"
            onClick={handleBuyClick}
            disabled={isSubmitting || hasInsufficientFunds || isMarketPriceUnavailable || isLimitInvalid}
            style={{
              opacity: isSubmitting || hasInsufficientFunds || isMarketPriceUnavailable || isLimitInvalid ? 0.6 : 1,
              cursor: isSubmitting || hasInsufficientFunds || isMarketPriceUnavailable || isLimitInvalid ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Placing..." : orderType === "LIMIT" ? "Place Limit Buy" : "Buy"}
          </button>
          <button
            type="button"
            className="btn btn-grey"
            onClick={closeBuyWindow}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
