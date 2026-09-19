import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Tooltip, Grow } from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Delete from "@mui/icons-material/Delete";
import Add from "@mui/icons-material/Add";
import { DoughnutChart } from "./DoughnoutChart";

const ALL_SUPPORTED_STOCKS = [
  { name: "TCS" },
  { name: "INFY" },
  { name: "RELIANCE" },
  { name: "HDFCBANK" },
  { name: "ICICIBANK" },
  { name: "SBIN" },
  { name: "ITC" },
  { name: "HINDUNILVR" },
  { name: "WIPRO" },
  { name: "M&M" },
  { name: "ONGC" },
  { name: "AXISBANK" },
  { name: "KOTAKBANK" },
  { name: "KPITTECH" },
  { name: "QUICKHEAL" },
];

const WatchList = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { getQuote, connectionStatus } = useMarketData();
  const [search, setSearch] = useState("");
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [feedback, setFeedback] = useState("");

  // 1. Fetch user's persistent watchlist on mount / refresh
  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/watchlist")
      .then((res) => {
        if (!ignore && res.data?.success && res.data?.data) {
          setWatchlistSymbols(res.data.data.symbols || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load user watchlist:", err);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2200);
  };

  // Add symbol to persistent watchlist
  const handleAddSymbol = async (symbol) => {
    if (actionInProgress) return;
    setActionInProgress(`add-${symbol}`);
    try {
      const res = await apiClient.post("/watchlist", { symbol });
      if (res.data?.success && res.data?.data) {
        setWatchlistSymbols(res.data.data.symbols || []);
        showFeedback(`Added ${symbol} to watchlist`);
      }
    } catch (err) {
      console.error("Error adding symbol:", err);
      showFeedback(err.response?.data?.message || "Failed to add symbol");
    } finally {
      setActionInProgress(null);
    }
  };

  // Remove symbol from persistent watchlist
  const handleRemoveSymbol = async (symbol) => {
    if (actionInProgress) return;
    setActionInProgress(`rem-${symbol}`);
    try {
      const res = await apiClient.delete(`/watchlist/${symbol}`);
      if (res.data?.success && res.data?.data) {
        setWatchlistSymbols(res.data.data.symbols || []);
        showFeedback(`Removed ${symbol} from watchlist`);
      }
    } catch (err) {
      console.error("Error removing symbol:", err);
      showFeedback(err.response?.data?.message || "Failed to remove symbol");
    } finally {
      setActionInProgress(null);
    }
  };

  // Reorder symbol up or down
  const handleMoveSymbol = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= watchlistSymbols.length) return;

    const newSymbols = [...watchlistSymbols];
    const [moved] = newSymbols.splice(index, 1);
    newSymbols.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setWatchlistSymbols(newSymbols);

    try {
      const res = await apiClient.put("/watchlist/reorder", { symbols: newSymbols });
      if (res.data?.success && res.data?.data) {
        setWatchlistSymbols(res.data.data.symbols || []);
      }
    } catch (err) {
      console.error("Error reordering watchlist:", err);
      setWatchlistSymbols(watchlistSymbols); // Revert on failure
      showFeedback("Failed to save reordered watchlist");
    }
  };

  // Filter existing watchlist symbols matching search
  const cleanSearch = search.toLowerCase().trim();
  const filteredSymbols = watchlistSymbols.filter((sym) =>
    sym.toLowerCase().includes(cleanSearch)
  );

  // Discover unadded supported instruments matching search query
  const unaddedMatches = cleanSearch
    ? ALL_SUPPORTED_STOCKS.filter(
        (stock) =>
          !watchlistSymbols.includes(stock.name) &&
          stock.name.toLowerCase().includes(cleanSearch)
      )
    : [];

  const data = {
    labels: filteredSymbols,
    datasets: [
      {
        label: "Price",
        data: filteredSymbols.map((sym) => {
          const q = getQuote(sym);
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
          placeholder="Search stocks eg: infy, tcs, sbin"
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
            {watchlistSymbols.length} / {ALL_SUPPORTED_STOCKS.length}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            fontSize: "0.75rem",
            padding: "4px 14px",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            color: "var(--accent-blue, #3b82f6)",
            borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          {feedback}
        </div>
      )}

      {/* Available to Add Search Results */}
      {cleanSearch && unaddedMatches.length > 0 && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--text-muted, #888)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Available to Add ({unaddedMatches.length})
          </div>
          {unaddedMatches.map((stock) => {
            const quote = getQuote(stock.name);
            return (
              <div
                key={stock.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {stock.name}
                  </span>
                  <span style={{ marginLeft: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {quote?.price !== undefined ? `₹${quote.price.toFixed(2)}` : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSymbol(stock.name)}
                  disabled={actionInProgress === `add-${stock.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--accent-blue, #3b82f6)",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    color: "var(--accent-blue, #3b82f6)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Add style={{ fontSize: "0.9rem" }} />
                  Add
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Watchlist Items */}
      <ul className="list">
        {loading ? (
          <li style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading watchlist...
          </li>
        ) : filteredSymbols.length === 0 ? (
          <li style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
            {cleanSearch ? "No matching instruments in watchlist." : "Watchlist is empty. Search above to add stocks."}
          </li>
        ) : (
          filteredSymbols.map((symbol, index) => {
            return (
              <WatchListItem
                key={symbol}
                symbol={symbol}
                index={index}
                totalCount={filteredSymbols.length}
                onMoveUp={() => handleMoveSymbol(index, "up")}
                onMoveDown={() => handleMoveSymbol(index, "down")}
                onRemove={() => handleRemoveSymbol(symbol)}
              />
            );
          })
        )}
      </ul>

      {filteredSymbols.length > 0 && <DoughnutChart data={data} />}
    </div>
  );
};

export default WatchList;

const WatchListItem = ({
  symbol,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);
  const { getQuote } = useMarketData();
  const quote = getQuote(symbol);

  const price = quote?.price ?? null;
  const changePercent = quote?.changePercent;
  const isDown = quote ? quote.change < 0 : false;
  const percentText =
    changePercent !== undefined && changePercent !== null
      ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
      : "—";

  return (
    <li
      onMouseEnter={() => setShowWatchlistActions(true)}
      onMouseLeave={() => setShowWatchlistActions(false)}
    >
      <div className="item">
        <p className={isDown ? "down" : "up"}>{symbol}</p>
        <div className="item-info">
          <span className="percent">{percentText}</span>
          {price !== null &&
            (isDown ? (
              <KeyboardArrowDown className="down" />
            ) : (
              <KeyboardArrowUp className="up" />
            ))}
          <span className="price">
            {price !== null ? price.toFixed(2) : "—"}
          </span>
        </div>
      </div>
      {showWatchlistActions && (
        <WatchListActions
          uid={symbol}
          index={index}
          totalCount={totalCount}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
        />
      )}
    </li>
  );
};

const WatchListActions = ({
  uid,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleBuyClick = (e) => {
    e.stopPropagation();
    openBuyWindow(uid);
  };

  const handleSellClick = (e) => {
    e.stopPropagation();
    openSellWindow(uid);
  };

  const handleMoveUpClick = (e) => {
    e.stopPropagation();
    if (onMoveUp) onMoveUp();
  };

  const handleMoveDownClick = (e) => {
    e.stopPropagation();
    if (onMoveDown) onMoveDown();
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  return (
    <span className="actions">
      <span>
        <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
          <button type="button" className="buy" onClick={handleBuyClick}>
            Buy
          </button>
        </Tooltip>

        <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
          <button type="button" className="sell" onClick={handleSellClick}>
            Sell
          </button>
        </Tooltip>

        {index > 0 && (
          <Tooltip title="Move Up" placement="top" arrow TransitionComponent={Grow}>
            <button
              type="button"
              className="action"
              onClick={handleMoveUpClick}
              style={{ padding: "4px" }}
            >
              <ArrowUpward style={{ fontSize: "0.95rem" }} />
            </button>
          </Tooltip>
        )}

        {index < totalCount - 1 && (
          <Tooltip title="Move Down" placement="top" arrow TransitionComponent={Grow}>
            <button
              type="button"
              className="action"
              onClick={handleMoveDownClick}
              style={{ padding: "4px" }}
            >
              <ArrowDownward style={{ fontSize: "0.95rem" }} />
            </button>
          </Tooltip>
        )}

        <Tooltip title="Remove from Watchlist" placement="top" arrow TransitionComponent={Grow}>
          <button
            type="button"
            className="action"
            onClick={handleRemoveClick}
            style={{ padding: "4px", color: "var(--loss, #ef4444)" }}
          >
            <Delete style={{ fontSize: "0.95rem" }} />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};
