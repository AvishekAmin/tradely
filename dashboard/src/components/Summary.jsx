import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useAuth } from "../context/AuthContext";
import { useMarketData } from "../context/MarketDataContext";
import { DoughnutChart } from "./DoughnoutChart";

const Summary = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { user } = useAuth();
  const { getQuote, lastOrderUpdate } = useMarketData();

  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [analyticsBaseline, setAnalyticsBaseline] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial funds, holdings, and portfolio analytics from backend
  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.get("/funds"),
      apiClient.get("/allHoldings"),
      apiClient.get("/portfolio/analytics"),
    ])
      .then(([fundsRes, holdingsRes, analyticsRes]) => {
        if (!ignore) {
          if (fundsRes.data?.success && fundsRes.data?.data) {
            setBalance(fundsRes.data.data.balance || 0);
            setReservedBalance(fundsRes.data.data.reservedBalance || 0);
            setInitialBalance(fundsRes.data.data.initialBalance || 100000);
          }
          setHoldings(holdingsRes.data || []);
          if (analyticsRes.data?.success && analyticsRes.data?.data) {
            setAnalyticsBaseline(analyticsRes.data.data);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error loading portfolio analytics:", err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, lastOrderUpdate]);

  // Total Invested Capital (cost basis)
  const totalInvestment = Math.round(
    holdings.reduce((sum, h) => sum + (h.qty || 0) * (h.avg || 0), 0) * 100
  ) / 100;

  // Real-time valuation and completeness check
  let liveValuationComplete = true;
  const liveUnavailableSymbols = [];
  let liveCurrentValue = 0;
  const liveAllocation = [];

  for (const holding of holdings) {
    const quote = getQuote(holding.name);
    if (quote && typeof quote.price === "number") {
      const hVal = Math.round((holding.qty || 0) * quote.price * 100) / 100;
      liveCurrentValue += hVal;
      liveAllocation.push({
        symbol: holding.name,
        name: quote.name || holding.name,
        qty: holding.qty,
        value: hVal,
      });
    } else {
      liveValuationComplete = false;
      liveUnavailableSymbols.push(holding.name);
    }
  }

  liveCurrentValue = Math.round(liveCurrentValue * 100) / 100;

  // Realized P&L from executed SELL orders (authoritative from backend)
  const realizedPnL = analyticsBaseline?.realizedPnL || 0;

  // Unrealized P&L
  const unrealizedPnL = liveValuationComplete
    ? Math.round((liveCurrentValue - totalInvestment) * 100) / 100
    : null;

  const unrealizedPnLPercent =
    liveValuationComplete && totalInvestment > 0
      ? Math.round((unrealizedPnL / totalInvestment) * 10000) / 100
      : 0;

  // Total P&L
  const totalPnL = liveValuationComplete
    ? Math.round((realizedPnL + (unrealizedPnL || 0)) * 100) / 100
    : null;

  // Current Portfolio Return Metric (based on current holdings' invested cost basis)
  const totalReturnPercent =
    liveValuationComplete && totalInvestment > 0
      ? Math.round((totalPnL / totalInvestment) * 10000) / 100
      : 0;

  // Margin info
  const usedMargin = Math.max(0, initialBalance - (balance + reservedBalance));

  // Allocation Chart Data
  const allocationChartData = {
    labels: liveAllocation.map((a) => a.symbol),
    datasets: [
      {
        data: liveAllocation.map((a) => a.value),
        backgroundColor: [
          "rgba(59, 130, 246, 0.75)",
          "rgba(16, 185, 129, 0.75)",
          "rgba(245, 158, 11, 0.75)",
          "rgba(239, 68, 68, 0.75)",
          "rgba(168, 85, 247, 0.75)",
          "rgba(236, 72, 153, 0.75)",
          "rgba(14, 165, 233, 0.75)",
          "rgba(249, 115, 22, 0.75)",
          "rgba(20, 184, 166, 0.75)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "—";
    const absVal = Math.abs(val);
    const formatted =
      absVal >= 100000
        ? `₹${(absVal / 100000).toFixed(2)}L`
        : absVal >= 1000
        ? `₹${(absVal / 1000).toFixed(2)}k`
        : `₹${absVal.toFixed(2)}`;

    return val < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div style={{ paddingBottom: "32px" }}>
      {/* Header */}
      <div className="username">
        <h6>Hi, {user?.username || "Trader"}!</h6>
        <hr className="divider" />
      </div>

      {/* Valuation Completeness Warning */}
      {!liveValuationComplete && liveUnavailableSymbols.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "var(--warning, #f59e0b)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "6px",
            padding: "10px 16px",
            marginBottom: "16px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>Valuation Incomplete:</strong> Live market quote unavailable for{" "}
            <strong>{liveUnavailableSymbols.join(", ")}</strong>. Unrealized and total P&L are paused
            to avoid inaccurate estimates.
          </span>
        </div>
      )}

      {/* Portfolio Analytics Section */}
      <div className="section" style={{ marginBottom: "24px" }}>
        <span>
          <p style={{ fontWeight: 600, letterSpacing: "0.5px" }}>PORTFOLIO ANALYTICS</p>
        </span>

        {/* Top Metric Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginTop: "12px",
            marginBottom: "16px",
          }}
        >
          {/* Card 1: Total Invested */}
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #888)", fontWeight: 500 }}>
              Total Invested Capital
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, margin: "6px 0 2px" }}>
              {loading ? "..." : `₹${totalInvestment.toFixed(2)}`}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)" }}>
              Cost basis across {holdings.length} holding(s)
            </div>
          </div>

          {/* Card 2: Current Value */}
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #888)", fontWeight: 500 }}>
              Current Portfolio Value
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, margin: "6px 0 2px" }}>
              {loading
                ? "..."
                : liveValuationComplete
                ? `₹${liveCurrentValue.toFixed(2)}`
                : "Incomplete"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--profit, #10b981)" }}>
              ● Live valuation
            </div>
          </div>

          {/* Card 3: Unrealized P&L */}
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #888)", fontWeight: 500 }}>
              UNREALIZED P&L
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                margin: "6px 0 2px",
                color:
                  unrealizedPnL === null
                    ? "inherit"
                    : unrealizedPnL >= 0
                    ? "var(--profit, #10b981)"
                    : "var(--loss, #ef4444)",
              }}
            >
              {loading
                ? "..."
                : unrealizedPnL !== null
                ? `${unrealizedPnL >= 0 ? "+" : ""}${formatCurrency(unrealizedPnL)} (${unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnLPercent.toFixed(2)}%)`
                : "—"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)" }}>
              Open holdings at market price
            </div>
          </div>

          {/* Card 4: Realized P&L */}
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #888)", fontWeight: 500 }}>
              REALIZED P&L
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                margin: "6px 0 2px",
                color:
                  realizedPnL >= 0
                    ? "var(--profit, #10b981)"
                    : "var(--loss, #ef4444)",
              }}
            >
              {loading ? "..." : `${realizedPnL >= 0 ? "+" : ""}${formatCurrency(realizedPnL)}`}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)" }}>
              Closed positions from executed sells
            </div>
          </div>

          {/* Card 5: Total P&L */}
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #888)", fontWeight: 500 }}>
              TOTAL P&L (Realized + Unrealized)
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                margin: "6px 0 2px",
                color:
                  totalPnL === null
                    ? "inherit"
                    : totalPnL >= 0
                    ? "var(--profit, #10b981)"
                    : "var(--loss, #ef4444)",
              }}
            >
              {loading
                ? "..."
                : totalPnL !== null
                ? `${totalPnL >= 0 ? "+" : ""}${formatCurrency(totalPnL)}`
                : "—"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #888)" }}>
              Current Portfolio Return:{" "}
              <strong style={{ color: totalReturnPercent >= 0 ? "var(--profit, #10b981)" : "var(--loss, #ef4444)" }}>
                {totalReturnPercent >= 0 ? "+" : ""}
                {totalReturnPercent.toFixed(2)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Portfolio Asset Allocation Section */}
        {liveAllocation.length > 0 && (
          <div
            style={{
              backgroundColor: "var(--bg-surface, #1e1e1e)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: "8px",
              padding: "16px 20px",
              marginTop: "16px",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "12px" }}>
              Portfolio Asset Allocation
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div style={{ width: "160px", height: "160px" }}>
                <DoughnutChart data={allocationChartData} />
              </div>

              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                  {liveAllocation.map((item) => {
                    const pct =
                      liveCurrentValue > 0
                        ? ((item.value / liveCurrentValue) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={item.symbol}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.symbol}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {item.qty} share(s)
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                            {formatCurrency(item.value)}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--accent-blue, #3b82f6)", fontWeight: 600 }}>
                            {pct}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="divider" style={{ marginTop: "24px" }} />
      </div>

      {/* Equity & Margin Segment */}
      <div className="section">
        <span>
          <p style={{ fontWeight: 600, letterSpacing: "0.5px" }}>EQUITY & MARGIN ACCOUNT</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>{loading ? "..." : formatCurrency(balance)}</h3>
            <p>Available Trading Margin</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Reserved in Limit Orders:{" "}
              <span style={{ color: reservedBalance > 0 ? "var(--warning, #f59e0b)" : "inherit" }}>
                {loading ? "..." : formatCurrency(reservedBalance)}
              </span>
            </p>
            <p>
              Margins Used: <span>{loading ? "..." : formatCurrency(usedMargin)}</span>
            </p>
            <p>
              Opening Account Balance: <span>{loading ? "..." : formatCurrency(initialBalance)}</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </div>
  );
};

export default Summary;
