import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";

const Summary = () => {
  const { refreshKey } = useContext(GeneralContext);
  const [balance, setBalance] = useState(0);
  const [initialBalance, setInitialBalance] = useState(100000);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.get("/funds"), apiClient.get("/allHoldings")])
      .then(([fundsRes, holdingsRes]) => {
        if (fundsRes.data?.success && fundsRes.data?.data) {
          setBalance(fundsRes.data.data.balance || 0);
          setInitialBalance(fundsRes.data.data.initialBalance || 100000);
        }
        setHoldings(holdingsRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading summary metrics:", err);
        setLoading(false);
      });
  }, [refreshKey]);

  // Derived metrics
  const totalInvestment = holdings.reduce(
    (acc, stock) => acc + (stock.avg || 0) * (stock.qty || 0),
    0
  );
  const totalCurrentValue = holdings.reduce(
    (acc, stock) => acc + (stock.price || 0) * (stock.qty || 0),
    0
  );
  const totalPnl = totalCurrentValue - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
  const isProfit = totalPnl >= 0;
  const usedMargin = Math.max(0, initialBalance - balance);

  const formatCurrency = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(2)}k`;
    }
    return `₹${val.toFixed(2)}`;
  };

  return (
    <>
      <div className="username">
        <h6>Hi, Trader!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity Segment</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>{loading ? "..." : formatCurrency(balance)}</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>{loading ? "..." : formatCurrency(usedMargin)}</span>
            </p>
            <p>
              Opening balance <span>{loading ? "..." : formatCurrency(initialBalance)}</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({holdings.length})</p>
        </span>

        <div className="data">
          <div className="first">
            <h3 className={isProfit ? "profit" : "loss"}>
              {loading ? (
                "..."
              ) : (
                <>
                  {isProfit ? "+" : ""}
                  {formatCurrency(totalPnl)}{" "}
                  <small>
                    ({isProfit ? "+" : ""}
                    {totalPnlPercent.toFixed(2)}%)
                  </small>
                </>
              )}
            </h3>
            <p>Unrealized P&L</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Current Value <span>{loading ? "..." : formatCurrency(totalCurrentValue)}</span>
            </p>
            <p>
              Total Investment <span>{loading ? "..." : formatCurrency(totalInvestment)}</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;
