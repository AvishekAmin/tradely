import React, { useState, useContext, useEffect } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { watchlist } from "../data/data";
import "../index.css";

const BuyActionWindow = ({ uid }) => {
  const { closeBuyWindow, triggerRefresh } = useContext(GeneralContext);

  const initialStock = watchlist.find((item) => item.name === uid);
  const defaultPrice = initialStock ? initialStock.price : 100.0;

  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(defaultPrice);
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
  const parsedPrice = parseFloat(stockPrice) || 0;
  const totalCost = Math.round(parsedQty * parsedPrice * 100) / 100;
  const remainingBalance =
    availableBalance !== null ? availableBalance - totalCost : null;
  const hasInsufficientFunds =
    availableBalance !== null && remainingBalance < 0;

  const handleBuyClick = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validations
    if (!parsedQty || parsedQty <= 0) {
      setErrorMessage("Quantity must be a positive whole number.");
      return;
    }
    if (!parsedPrice || parsedPrice <= 0) {
      setErrorMessage("Price must be greater than zero.");
      return;
    }
    if (hasInsufficientFunds) {
      setErrorMessage(
        `Insufficient funds. Order requires ₹${totalCost.toFixed(2)} but only ₹${availableBalance.toFixed(2)} is available.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.post("/newOrder", {
        name: uid,
        qty: parsedQty,
        price: parsedPrice,
        mode: "BUY",
        orderType: "MARKET",
      });

      if (res.data?.success) {
        setSuccessMessage(
          res.data.message || `Successfully bought ${parsedQty} shares of ${uid}!`
        );
        triggerRefresh();

        // Brief delay so user sees the confirmation message before window closes
        setTimeout(() => {
          closeBuyWindow();
        }, 700);
      } else {
        setErrorMessage(res.data?.message || "Order failed to execute.");
        setIsSubmitting(false);
      }
    } catch (err) {
      const serverMessage =
        err.response?.data?.message || "Failed to execute buy order. Please try again.";
      setErrorMessage(serverMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="buy-window-container" id="buy-window">
      <div className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            Buy {uid} <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>MARKET</span>
          </h3>
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
          <fieldset>
            <legend>Price (₹)</legend>
            <input
              type="number"
              name="price"
              id="buy-price"
              step="0.05"
              min="0.05"
              disabled={isSubmitting}
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>

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
            <span style={{ color: "var(--text-muted)" }}>Total Order Value:</span>
            <span style={{ fontWeight: 600, color: "var(--accent-blue, #3b82f6)" }}>
              ₹{totalCost.toFixed(2)}
            </span>
          </div>

          {availableBalance !== null && (
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
          Margin req: <strong>₹{totalCost.toFixed(2)}</strong>
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-blue"
            onClick={handleBuyClick}
            disabled={isSubmitting || hasInsufficientFunds}
            style={{
              opacity: isSubmitting || hasInsufficientFunds ? 0.6 : 1,
              cursor: isSubmitting || hasInsufficientFunds ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Executing..." : "Buy"}
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
