import React, { useState, useContext } from "react";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
} from "@mui/icons-material";
import { watchlist } from "../data/data";
import { DoughnutChart } from "./DoughnoutChart";

const WatchList = () => {
  const [search, setSearch] = useState("");
  const { getQuote, connectionStatus } = useMarketData();

  const filteredStocks = watchlist.filter((stock) =>
    stock.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const labels = filteredStocks.map((stock) => stock.name);

  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: filteredStocks.map((stock) => {
          const q = getQuote(stock.name);
          return q ? q.price : 0;
        }),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(239, 68, 68, 0.6)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(147, 51, 234, 0.6)",
          "rgba(236, 72, 153, 0.6)",
          "rgba(14, 165, 233, 0.6)",
          "rgba(249, 115, 22, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(34, 197, 94, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search stocks eg: infy, bse, tcs"
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div
          style={{
            position: "absolute",
            right: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor:
                connectionStatus === "connected"
                  ? "rgba(16, 185, 129, 0.15)"
                  : connectionStatus === "connecting"
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              color:
                connectionStatus === "connected"
                  ? "var(--profit, #10b981)"
                  : connectionStatus === "connecting"
                  ? "var(--warning, #f59e0b)"
                  : "var(--loss, #ef4444)",
            }}
            title={`Market Stream: ${connectionStatus}`}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  connectionStatus === "connected"
                    ? "var(--profit, #10b981)"
                    : connectionStatus === "connecting"
                    ? "var(--warning, #f59e0b)"
                    : "var(--loss, #ef4444)",
              }}
            />
            {connectionStatus === "connected"
              ? "LIVE"
              : connectionStatus === "connecting"
              ? "SYNC"
              : "OFFLINE"}
          </span>
          <span className="counts">
            {filteredStocks.length} / {watchlist.length}
          </span>
        </div>
      </div>

      <ul className="list">
        {filteredStocks.map((stock, index) => {
          return <WatchListItem stock={stock} key={index} />;
        })}
      </ul>

      <DoughnutChart data={data} />
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock }) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);
  const { getQuote } = useMarketData();
  const quote = getQuote(stock.name);

  const price = quote?.price ?? null;
  const changePercent = quote?.changePercent;
  const isDown = quote ? quote.change < 0 : false;
  const percentText =
    changePercent !== undefined && changePercent !== null
      ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
      : "—";

  const handleMouseEnter = () => {
    setShowWatchlistActions(true);
  };

  const handleMouseLeave = () => {
    setShowWatchlistActions(false);
  };

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={isDown ? "down" : "up"}>{stock.name}</p>
        <div className="item-info">
          <span className="percent">{percentText}</span>
          {price !== null && (
            isDown ? (
              <KeyboardArrowDown className="down" />
            ) : (
              <KeyboardArrowUp className="up" />
            )
          )}
          <span className="price">
            {price !== null ? price.toFixed(2) : "—"}
          </span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.name} />}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleBuyClick = (e) => {
    e.stopPropagation();
    openBuyWindow(uid);
  };

  const handleSellClick = (e) => {
    e.stopPropagation();
    openSellWindow(uid);
  };

  return (
    <span className="actions">
      <span>
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button type="button" className="buy" onClick={handleBuyClick}>
            Buy
          </button>
        </Tooltip>
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button type="button" className="sell" onClick={handleSellClick}>
            Sell
          </button>
        </Tooltip>
        <Tooltip
          title="Analytics"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button type="button" className="action">
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
          <button type="button" className="action">
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};
