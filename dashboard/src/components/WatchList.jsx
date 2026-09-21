import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
import {
  Search,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X,
} from "lucide-react";
import { DoughnutChart } from "./DoughnutChart";
import { cn } from "@/lib/utils";

const COMPANY_NAMES = {
  TCS: "Tata Consultancy Services",
  INFY: "Infosys Ltd",
  RELIANCE: "Reliance Industries",
  HDFCBANK: "HDFC Bank Ltd",
  ICICIBANK: "ICICI Bank Ltd",
  SBIN: "State Bank of India",
  ITC: "ITC Ltd",
  HINDUNILVR: "Hindustan Unilever Ltd",
  HUL: "Hindustan Unilever Ltd",
  WIPRO: "Wipro Ltd",
  "M&M": "Mahindra & Mahindra Ltd",
  ONGC: "Oil & Natural Gas Corp",
  AXISBANK: "Axis Bank Ltd",
  KOTAKBANK: "Kotak Mahindra Bank",
  KPITTECH: "KPIT Technologies",
  QUICKHEAL: "Quick Heal Technologies",
  TATAMOTORS: "Tata Motors Ltd",
  BHARTIARTL: "Bharti Airtel Ltd",
  LT: "Larsen & Toubro Ltd",
  BAJFINANCE: "Bajaj Finance Ltd",
  BAJAJFINSV: "Bajaj Finserv Ltd",
  HCLTECH: "HCL Technologies Ltd",
  SUNPHARMA: "Sun Pharmaceutical Industries",
  MARUTI: "Maruti Suzuki India Ltd",
  NTPC: "NTPC Ltd",
  POWERGRID: "Power Grid Corp of India",
  TITAN: "Titan Company Ltd",
  ASIANPAINT: "Asian Paints Ltd",
  ULTRACEMCO: "UltraTech Cement Ltd",
  TATASTEEL: "Tata Steel Ltd",
  COALINDIA: "Coal India Ltd",
  ADANIENT: "Adani Enterprises Ltd",
  ADANIPORTS: "Adani Ports and SEZ Ltd",
  JSWSTEEL: "JSW Steel Ltd",
  GRASIM: "Grasim Industries Ltd",
  TECHM: "Tech Mahindra Ltd",
  CIPLA: "Cipla Ltd",
  DRREDDY: "Dr. Reddy's Laboratories",
  NESTLEIND: "Nestle India Ltd",
  BRITANNIA: "Britannia Industries Ltd",
  EICHERMOT: "Eicher Motors Ltd",
  DIVISLAB: "Divi's Laboratories Ltd",
  APOLLOHOSP: "Apollo Hospitals Enterprise",
  INDUSINDBK: "IndusInd Bank Ltd",
  HEROMOTOCO: "Hero MotoCorp Ltd",
  HINDALCO: "Hindalco Industries Ltd",
  BPCL: "Bharat Petroleum Corp Ltd",
  IOC: "Indian Oil Corporation Ltd",
  ZOMATO: "Zomato Ltd",
  JIOFIN: "Jio Financial Services Ltd",
  PAYTM: "One97 Communications Ltd",
};

const CHART_COLORS = [
  "#00D8F6",
  "#7B61FF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
  "#F97316",
  "#84CC16",
  "#D946EF",
  "#06B6D4",
  "#EAB308",
];

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
  { name: "TATAMOTORS" },
  { name: "BHARTIARTL" },
  { name: "LT" },
  { name: "BAJFINANCE" },
  { name: "BAJAJFINSV" },
  { name: "HCLTECH" },
  { name: "SUNPHARMA" },
  { name: "MARUTI" },
  { name: "NTPC" },
  { name: "POWERGRID" },
  { name: "TITAN" },
  { name: "ASIANPAINT" },
  { name: "ULTRACEMCO" },
  { name: "TATASTEEL" },
  { name: "COALINDIA" },
  { name: "ADANIENT" },
  { name: "ADANIPORTS" },
  { name: "JSWSTEEL" },
  { name: "GRASIM" },
  { name: "TECHM" },
  { name: "CIPLA" },
  { name: "DRREDDY" },
  { name: "NESTLEIND" },
  { name: "BRITANNIA" },
  { name: "EICHERMOT" },
  { name: "DIVISLAB" },
  { name: "APOLLOHOSP" },
  { name: "INDUSINDBK" },
  { name: "HEROMOTOCO" },
  { name: "HINDALCO" },
  { name: "BPCL" },
  { name: "IOC" },
  { name: "ZOMATO" },
  { name: "JIOFIN" },
  { name: "PAYTM" },
];

const WatchList = () => {
  const { refreshKey } = useContext(GeneralContext);
  const { getQuote } = useMarketData();
  const [search, setSearch] = useState("");
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [feedback, setFeedback] = useState("");
  const watchlistRef = useRef(null);

  // Clear search and dismiss search list on click outside the watchlist sidebar
  useEffect(() => {
    if (!search) return;

    const handleOutsideClick = (e) => {
      if (watchlistRef.current && !watchlistRef.current.contains(e.target)) {
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [search]);

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
    setTimeout(() => setFeedback(""), 2500);
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
  const filteredSymbols = useMemo(
    () =>
      watchlistSymbols.filter((sym) =>
        sym.toLowerCase().includes(cleanSearch)
      ),
    [watchlistSymbols, cleanSearch]
  );

  // Discover unadded supported instruments matching search query
  const unaddedMatches = useMemo(
    () =>
      cleanSearch
        ? ALL_SUPPORTED_STOCKS.filter(
            (stock) =>
              !watchlistSymbols.includes(stock.name) &&
              stock.name.toLowerCase().includes(cleanSearch)
          )
        : [],
    [cleanSearch, watchlistSymbols]
  );

  const watchlistStockStats = useMemo(() => {
    const items = filteredSymbols.map((sym, index) => {
      const q = getQuote(sym);
      const price = q?.price !== undefined ? q.price : 0;
      const fullName = q?.name || COMPANY_NAMES[sym] || sym;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return {
        symbol: sym,
        name: fullName,
        price,
        color,
      };
    });

    const sum = items.reduce((acc, item) => acc + item.price, 0);

    return items.map((item) => ({
      ...item,
      percentage: sum > 0 ? ((item.price / sum) * 100).toFixed(1) : "0.0",
    }));
  }, [filteredSymbols, getQuote]);

  const totalPrice = useMemo(() => {
    return watchlistStockStats.reduce((sum, item) => sum + item.price, 0);
  }, [watchlistStockStats]);

  const chartData = useMemo(() => {
    return {
      labels: watchlistStockStats.map((item) => item.symbol),
      datasets: [
        {
          label: "Price",
          data: watchlistStockStats.map((item) => item.price),
          backgroundColor: watchlistStockStats.map((item) => item.color),
          borderWidth: 1,
          borderColor: "rgba(0, 0, 0, 0.5)",
        },
      ],
    };
  }, [watchlistStockStats]);

  return (
    <TooltipProvider delayDuration={200}>
      <div ref={watchlistRef} className="flex flex-col h-full select-none">
        {/* Search Header */}
        <div className="p-3 border-b border-white/10 bg-[#111111]/80 backdrop-blur sticky top-0 z-10">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              name="search"
              placeholder="Search stocks (e.g. INFY, TCS)"
              className="w-full h-9 pl-9 pr-24 rounded-xl border border-white/10 bg-[#1A1A1A] text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                }
              }}
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                {watchlistSymbols.length}/{ALL_SUPPORTED_STOCKS.length}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="px-3 py-1.5 text-xs font-semibold bg-cyan-500/10 text-cyan-300 border-b border-cyan-500/20 animate-in fade-in-0 duration-200">
            {feedback}
          </div>
        )}

        {/* Available to Add Search Results */}
        {cleanSearch && unaddedMatches.length > 0 && (
          <div className="p-3 border-b border-white/10 bg-white/[0.02]">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
              Available to Add ({unaddedMatches.length})
            </div>
            <div className="space-y-1.5">
              {unaddedMatches.map((stock) => {
                const quote = getQuote(stock.name);
                const isAdding = actionInProgress === `add-${stock.name}`;
                return (
                  <div
                    key={stock.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white">
                        {stock.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-400 tabular-nums">
                        {quote?.price !== undefined ? `₹${quote.price.toFixed(2)}` : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSymbol(stock.name)}
                      disabled={isAdding}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAdding ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Plus className="size-3" />
                      )}
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Watchlist Items & Price Distribution */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
              <Loader2 className="size-4 animate-spin text-cyan-400" />
              <span>Loading watchlist...</span>
            </div>
          ) : filteredSymbols.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {cleanSearch
                ? "No matching instruments in watchlist."
                : "Watchlist is empty. Search above to add stocks."}
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {filteredSymbols.map((symbol, index) => {
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
                })}
              </div>

              {/* Watchlist Price Distribution Chart & Breakdown */}
              {!cleanSearch && (
                <div className="p-4 border-t border-white/10 bg-[#0C0C0C]/50 flex flex-col items-center">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">
                    Watchlist Price Distribution
                  </div>

                  {/* Circular Chart */}
                  <div className="w-64 h-64 flex items-center justify-center relative">
                    <DoughnutChart data={chartData} />
                    {totalPrice > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Watchlist Total
                        </span>
                        <span className="text-base font-black text-white font-mono tabular-nums leading-tight mt-0.5">
                          ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                          {watchlistStockStats.length} Stocks
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock Companies List with Share Percentage & Name */}
                  <div className="w-full mt-4 space-y-1.5 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pb-1">
                      <span>Company</span>
                      <div className="flex items-center gap-3">
                        <span>Price</span>
                        <span className="w-12 text-right">Share</span>
                      </div>
                    </div>

                    {watchlistStockStats.map((item) => (
                      <div
                        key={item.symbol}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className="size-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                              {item.symbol}
                            </span>
                            <span
                              className="text-[10px] text-slate-400 truncate max-w-[110px]"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">
                            {item.price > 0 ? `₹${item.price.toFixed(2)}` : "—"}
                          </span>
                          <span
                            className="text-xs font-bold tabular-nums min-w-[48px] text-right px-1.5 py-0.5 rounded bg-white/5"
                            style={{ color: item.color }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
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
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-between px-3.5 py-2.5 transition-all group",
        isHovered
          ? "bg-[#181818]"
          : "hover:bg-white/[0.02]"
      )}
    >
      {/* Left side blue/cyan accent line only */}
      {isHovered && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none" />
      )}

      {/* Symbol & Name - always visible, highlighted on hover */}
      <div className="flex flex-col min-w-0 pr-2">
        <span
          className={cn(
            "text-xs font-bold transition-all truncate",
            isHovered
              ? "text-cyan-300 font-black tracking-wide drop-shadow-[0_0_8px_rgba(0,216,246,0.6)]"
              : isDown
              ? "text-rose-400"
              : "text-emerald-400"
          )}
        >
          {symbol}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium transition-colors",
            isHovered ? "text-cyan-400/80 font-semibold" : "text-slate-500"
          )}
        >
          NSE EQ
        </span>
      </div>

      {/* Right Side: Actions when hovered, Quotes when not hovered */}
      <div className="flex items-center shrink-0">
        {isHovered ? (
          <WatchListActions
            uid={symbol}
            index={index}
            totalCount={totalCount}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded",
                isDown
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-emerald-500/10 text-emerald-400"
              )}
            >
              {isDown ? (
                <ArrowDownRight className="size-3 mr-0.5" />
              ) : (
                <ArrowUpRight className="size-3 mr-0.5" />
              )}
              {percentText}
            </span>

            <span className="text-xs font-bold text-white tabular-nums min-w-[65px] text-right">
              {price !== null ? `₹${price.toFixed(2)}` : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
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
    <div className="flex items-center gap-1.5 z-10 animate-in fade-in-0 duration-150">
      {/* Buy Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleBuyClick}
            className="size-6 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer transition-all active:scale-95"
          >
            B
          </button>
        </TooltipTrigger>
        <TooltipContent>Buy {uid}</TooltipContent>
      </Tooltip>

      {/* Sell Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleSellClick}
            className="size-6 rounded bg-rose-500 hover:bg-rose-400 text-black font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer transition-all active:scale-95"
          >
            S
          </button>
        </TooltipTrigger>
        <TooltipContent>Sell {uid}</TooltipContent>
      </Tooltip>

      {/* Move Up */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={index === 0}
            onClick={handleMoveUpClick}
            className="size-6 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronUp className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Move Up</TooltipContent>
      </Tooltip>

      {/* Move Down */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={handleMoveDownClick}
            className="size-6 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Move Down</TooltipContent>
      </Tooltip>

      {/* Delete Symbol */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleRemoveClick}
            className="size-6 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Remove from Watchlist</TooltipContent>
      </Tooltip>
    </div>
  );
};
