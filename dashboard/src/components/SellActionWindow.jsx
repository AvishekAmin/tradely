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
  const reservedQty = holdingData ? (holdingData.reservedQty || 0) : 0;
  const availableShares = Math.max(0, ownedQty - reservedQty);
  const avgBuyPrice = holdingData ? holdingData.avg : 0;

  const parsedQty = parseInt(stockQuantity, 10) || 0;
  const parsedLimit = parseFloat(limitPrice) || 0;
  const executionPrice = orderType === "MARKET" ? (livePrice ?? 0) : parsedLimit;
  const isMarketPriceUnavailable =
    orderType === "MARKET" && (livePrice === null || livePrice <= 0);
  const isLimitInvalid = orderType === "LIMIT" && parsedLimit <= 0;

  const totalProceeds = Math.round(parsedQty * executionPrice * 100) / 100;
  const estimatedPnL =
    holdingData && parsedQty > 0 && executionPrice > 0
      ? Math.round((executionPrice - avgBuyPrice) * parsedQty * 100) / 100
      : 0;
  const isProfit = estimatedPnL >= 0;

  const handleSetMaxQty = () => {
    if (availableShares > 0) {
      setStockQuantity(availableShares);
    }
  };

  const handleSellClick = async (e) => {
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

    setIsSubmitting(true);

    try {
      const payload = {
        name: uid,
        qty: parsedQty,
        mode: "SELL",
        orderType,
      };

      if (orderType === "LIMIT") {
        payload.limitPrice = parsedLimit;
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
              borderColor: orderType === "MARKET" ? "var(--loss, #ef4444)" : "rgba(255,255,255,0.1)",
              backgroundColor: orderType === "MARKET" ? "rgba(239, 68, 68, 0.2)" : "transparent",
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
              borderColor: orderType === "LIMIT" ? "var(--loss, #ef4444)" : "rgba(255,255,255,0.1)",
              backgroundColor: orderType === "LIMIT" ? "rgba(239, 68, 68, 0.2)" : "transparent",
              color: orderType === "LIMIT" ? "#ffffff" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            LIMIT
          </button>
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
            ⚠️ No shares available to sell. {reservedQty > 0 ? `(${reservedQty} share(s) reserved in pending orders).` : `You do not own ${uid}.`}
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

          {orderType === "MARKET" ? (
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
                  color: livePrice !== null ? "var(--loss, #ef4444)" : "var(--loss, #ef4444)",
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
        </div>

        {/* Condition details for LIMIT orders */}
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
            <span style={{ color: "#ffffff", fontWeight: 600 }}>₹{parsedLimit ? parsedLimit.toFixed(2) : "..."}</span> or above.
            Shares ({parsedQty}) will be reserved until executed or cancelled.
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
              {loadingHolding ? "Checking..." : `${availableShares} shares ${reservedQty > 0 ? `(${reservedQty} reserved)` : ""}`}
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
              isLimitInvalid
            }
            style={{
              backgroundColor: "var(--loss, #ef4444)",
              color: "#ffffff",
              opacity:
                isSubmitting ||
                availableShares === 0 ||
                parsedQty > availableShares ||
                isMarketPriceUnavailable ||
                isLimitInvalid
                  ? 0.6
                  : 1,
              cursor:
                isSubmitting ||
                availableShares === 0 ||
                parsedQty > availableShares ||
                isMarketPriceUnavailable ||
                isLimitInvalid
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSubmitting ? "Placing..." : orderType === "LIMIT" ? "Place Limit Sell" : "Sell"}
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
