import React, { useState, useEffect } from "react";
import apiClient from "../config/api";
import { useMarketData } from "../context/MarketDataContext";

const Positions = () => {
  const { getQuote } = useMarketData();
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/allPositions")
      .then((res) => {
        setAllPositions(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching positions:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <h3 className="title">Positions ({allPositions.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  Loading positions...
                </td>
              </tr>
            ) : allPositions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No open positions found.
                </td>
              </tr>
            ) : (
              allPositions.map((stock, index) => {
                const quote = getQuote(stock.name);
                const livePrice = quote?.price ?? null;
                const curValue =
                  livePrice !== null ? livePrice * (stock.qty || 0) : null;
                const pnl =
                  curValue !== null
                    ? curValue - (stock.avg || 0) * (stock.qty || 0)
                    : null;
                const isProfit = pnl !== null ? pnl >= 0.0 : true;
                const profClass = isProfit ? "profit" : "loss";
                const dayChange =
                  quote && quote.changePercent !== undefined
                    ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`
                    : "—";
                const dayClass =
                  quote && quote.change !== undefined
                    ? quote.change < 0
                      ? "loss"
                      : "profit"
                    : "";

                return (
                  <tr key={index}>
                    <td>{stock.product}</td>
                    <td style={{ fontWeight: 600 }}>{stock.name}</td>
                    <td>{stock.qty}</td>
                    <td>₹{(stock.avg || 0).toFixed(2)}</td>
                    <td>
                      {livePrice !== null ? `₹${livePrice.toFixed(2)}` : "—"}
                    </td>
                    <td className={profClass}>
                      {pnl !== null
                        ? `${isProfit ? "+" : ""}₹${pnl.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className={dayClass}>{dayChange}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Positions;
