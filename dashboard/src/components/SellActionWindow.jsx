import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { watchlist } from "../data/data";
import "../index.css";

const SellActionWindow = ({ uid }) => {
  const { closeSellWindow, triggerRefresh } = useContext(GeneralContext);

  const initialStock = watchlist.find((item) => item.name === uid);
  const defaultPrice = initialStock ? initialStock.price : 100.0;

  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(defaultPrice);
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
          // Set default sell quantity to 1 or max owned
          setStockQuantity(Math.min(1, found.qty));
          if (found.price) {
            setStockPrice(found.price);
          }
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
  const avgBuyPrice = holdingData ? holdingData.avg : 0;

  const parsedQty = parseInt(stockQuantity, 10) || 0;
  const parsedPrice = parseFloat(stockPrice) || 0;
  const totalProceeds = Math.round(parsedQty * parsedPrice * 100) / 100;
  const estimatedPnL =
    holdingData && parsedQty > 0
      ? Math.round((parsedPrice - avgBuyPrice) * parsedQty * 100) / 100
      : 0;
  const isProfit = estimatedPnL >= 0;

  const handleSetMaxQty = () => {
    if (ownedQty > 0) {
      setStockQuantity(ownedQty);
    }
  };

  const handleSellClick = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validations
    if (ownedQty <= 0) {
      setErrorMessage(
        `Cannot sell ${uid}: you do not own any shares of this instrument.`
      );
      return;
    }
    if (!parsedQty || parsedQty <= 0) {
      setErrorMessage("Quantity must be a positive whole number.");
      return;
    }
    if (parsedQty > ownedQty) {
      setErrorMessage(
        `Cannot sell ${parsedQty} shares. You only own ${ownedQty} share(s).`
      );
      return;
    }
    if (!parsedPrice || parsedPrice <= 0) {
      setErrorMessage("Price must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.post("/newOrder", {
        name: uid,
        qty: parsedQty,
        price: parsedPrice,
        mode: "SELL",
        orderType: "MARKET",
      });

      if (res.data?.success) {
        setSuccessMessage(
          res.data.message || `Successfully sold ${parsedQty} shares of ${uid}!`
        );
        triggerRefresh();

        // Brief delay so user sees confirmation before window closes
        setTimeout(() => {
          closeSellWindow();
        }, 700);
      } else {
        setErrorMessage(res.data?.message || "Order failed to execute.");
        setIsSubmitting(false);
      }
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "Failed to execute sell order. Please try again.";
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
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--loss, #ef4444)" }}>SELL</span> {uid}
            <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>MARKET</span>
          </h3>
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
        {!loadingHolding && ownedQty === 0 && (
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
            ⚠️ You do not own any shares of {uid}. You must buy shares before you can sell them.
          </div>
        )}

        {/* Input Fields */}
        <div className="inputs">
          <fieldset>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <legend>Qty.</legend>
              {ownedQty > 0 && (
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
                  MAX ({ownedQty})
                </button>
              )}
            </div>
            <input
              type="number"
              name="qty"
              id="sell-qty"
              min="1"
              max={ownedQty || 1}
              step="1"
              disabled={isSubmitting || ownedQty === 0}
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price (₹)</legend>
            <input
              type="number"
              name="price"
              id="sell-price"
              step="0.05"
              min="0.05"
              disabled={isSubmitting || ownedQty === 0}
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>

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
            <span style={{ color: "var(--text-muted)" }}>Owned Shares:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {loadingHolding ? "Checking..." : `${ownedQty} shares`}
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
              ₹{totalProceeds.toFixed(2)}
            </span>
          </div>

          {ownedQty > 0 && (
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

          {availableBalance !== null && (
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
          Credit: <strong>+₹{totalProceeds.toFixed(2)}</strong>
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn"
            onClick={handleSellClick}
            disabled={isSubmitting || ownedQty === 0 || parsedQty > ownedQty}
            style={{
              backgroundColor: "var(--loss, #ef4444)",
              color: "#ffffff",
              opacity: isSubmitting || ownedQty === 0 || parsedQty > ownedQty ? 0.6 : 1,
              cursor:
                isSubmitting || ownedQty === 0 || parsedQty > ownedQty
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSubmitting ? "Selling..." : "Sell"}
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
