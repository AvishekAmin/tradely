import React from "react";
import Menu from "./Menu";
import { useMarketData } from "../context/MarketDataContext";

const TopBar = () => {
  const { connectionStatus } = useMarketData();

  // If you had indices in market data, you could get them like this:
  // const nifty = getQuote("NIFTY 50") || { price: 24850.30, change: 0.42 };
  // const sensex = getQuote("SENSEX") || { price: 81420.50, change: 0.38 };

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points tabular-nums">24,850.30</p>
          <p className="percent profit">+0.42%</p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points tabular-nums">81,420.50</p>
          <p className="percent profit">+0.38%</p>
        </div>
        <div className="market-status" style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", paddingRight: "16px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: connectionStatus === "connected" ? "var(--profit)" : connectionStatus === "connecting" ? "var(--warning)" : "var(--loss)",
              boxShadow: connectionStatus === "connected" ? "0 0 8px var(--profit)" : "none",
              animation: connectionStatus === "connected" ? "pulse 2s infinite" : "none"
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>
            {connectionStatus === "connected" ? "Market Feed Live" : connectionStatus === "connecting" ? "Syncing..." : "Offline"}
          </span>
        </div>
      </div>

      <Menu />
    </div>
  );
};

export default TopBar;
