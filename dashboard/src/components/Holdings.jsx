import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";

const Holdings = () => {
  const { refreshKey, openBuyWindow, openSellWindow } = useContext(GeneralContext);
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
  }, [refreshKey]);

  const labels = allHoldings.map((stock) => stock.name);

  const data = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: allHoldings.map((stock) => stock.price),
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
  const totalCurrentValue = allHoldings.reduce(
    (acc, stock) => acc + (stock.price || 0) * (stock.qty || 0),
    0
  );
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
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                  Loading holdings...
                </td>
              </tr>
            ) : allHoldings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>
                  No holdings found. Use the watchlist on the left to buy stocks.
                </td>
              </tr>
            ) : (
              allHoldings.map((stock, index) => {
                const curValue = (stock.price || 0) * (stock.qty || 0);
                const pnl = curValue - (stock.avg || 0) * (stock.qty || 0);
                const isProfit = pnl >= 0.0;
                const profClass = isProfit ? "profit" : "loss";

                return (
                  <tr key={stock._id || index}>
                    <td style={{ fontWeight: 600 }}>{stock.name}</td>
                    <td>{stock.qty}</td>
                    <td>₹{(stock.avg || 0).toFixed(2)}</td>
                    <td>₹{(stock.price || 0).toFixed(2)}</td>
                    <td>₹{curValue.toFixed(2)}</td>
                    <td className={profClass}>
                      {isProfit ? "+" : ""}₹{pnl.toFixed(2)}
                    </td>
                    <td className={profClass}>{stock.net || "+0.00%"}</td>
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
