import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";

const Holdings = () => {
  const { refreshKey, openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const { getQuote, lastOrderUpdate } = useMarketData();
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/allHoldings")
      .then((res) => {
        setAllHoldings(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching holdings:", err);
        setLoading(false);
      });
  }, [refreshKey, lastOrderUpdate]);

  const labels = allHoldings.map((stock) => stock.name);

  const data = {
    labels,
    datasets: [
      {
        label: "Live Stock Price",
        data: allHoldings.map((stock) => {
          const q = getQuote(stock.name);
          return q?.price ?? 0;
        }),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const totalInvestment = allHoldings.reduce(
    (acc, stock) => acc + (stock.avg || 0) * (stock.qty || 0),
    0
  );
  const totalCurrentValue = allHoldings.reduce((acc, stock) => {
    const q = getQuote(stock.name);
    return acc + (q?.price ?? 0) * (stock.qty || 0);
  }, 0);
  const totalPnl = totalCurrentValue - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
  const isOverallProfit = totalPnl >= 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="title">Holdings ({allHoldings.length})</h3>
      </div>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan="8" style={{ padding: "12px 14px" }}>
                    <div className="skeleton" style={{ height: "20px", width: "100%" }}></div>
                  </td>
                </tr>
              ))
            ) : allHoldings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Your portfolio is empty. Explore your watchlist and place your first simulated trade.
                </td>
              </tr>
            ) : (
              allHoldings.map((stock, index) => {
                const quote = getQuote(stock.name);
                const currentPrice = quote?.price ?? null;

                const curValue =
                  currentPrice !== null ? currentPrice * (stock.qty || 0) : null;
                const pnl =
                  curValue !== null
                    ? curValue - (stock.avg || 0) * (stock.qty || 0)
                    : null;
                const isProfit = pnl !== null ? pnl >= 0.0 : true;
                const profClass = isProfit ? "profit" : "loss";
                const pnlPercent =
                  stock.avg && stock.qty && pnl !== null
                    ? (pnl / (stock.avg * stock.qty)) * 100
                    : null;

                const reservedQty = stock.reservedQty || 0;

                return (
                  <tr key={stock._id || index}>
                    <td style={{ fontWeight: 600 }}>{stock.name}</td>
                    <td className="tabular-nums">
                      {stock.qty}
                      {reservedQty > 0 && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.68rem",
                            color: "var(--warning, #f59e0b)",
                          }}
                          title={`${reservedQty} share(s) reserved in pending limit sell orders`}
                        >
                          ({reservedQty} reserved)
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums">₹{(stock.avg || 0).toFixed(2)}</td>
                    <td className="tabular-nums">
                      {currentPrice !== null
                        ? `₹${currentPrice.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="tabular-nums">
                      {curValue !== null ? `₹${curValue.toFixed(2)}` : "—"}
                    </td>
                    <td className={`tabular-nums ${profClass}`}>
                      {pnl !== null
                        ? `${isProfit ? "+" : ""}₹${pnl.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className={`tabular-nums ${profClass}`}>
                      {pnlPercent !== null
                        ? `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`
                        : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => openBuyWindow(stock.name)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "var(--accent-blue, #3b82f6)",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => openSellWindow(stock.name)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "var(--loss, #ef4444)",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>
            ₹{totalInvestment.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            ₹{totalCurrentValue.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5 className={isOverallProfit ? "profit" : "loss"}>
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toFixed(2)} (
            {totalPnlPercent >= 0 ? "+" : ""}
            {totalPnlPercent.toFixed(2)}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>

      {allHoldings.length > 0 && <VerticalGraph data={data} />}
    </>
  );
};

export default Holdings;
