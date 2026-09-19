import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import apiClient, { API_BASE_URL, SOCKET_URL } from "../config/api";

const SYMBOL_ALIASES = {
  HUL: "HINDUNILVR",
};

const MarketDataContext = createContext({
  quotes: {},
  connectionStatus: "connecting",
  getQuote: () => null,
  error: null,
});

export const MarketDataProvider = ({ children }) => {
  const [quotes, setQuotes] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Normalize symbol lookup
  const normalizeSymbol = useCallback((symbol) => {
    if (!symbol || typeof symbol !== "string") return "";
    const clean = symbol.trim().toUpperCase();
    return SYMBOL_ALIASES[clean] || clean;
  }, []);

  // Fast quote lookup
  const getQuote = useCallback(
    (symbol) => {
      const normalized = normalizeSymbol(symbol);
      return quotes[normalized] || null;
    },
    [quotes, normalizeSymbol]
  );

  useEffect(() => {
    let isMounted = true;

    // 1. Initial snapshot fetch via public REST endpoint
    const fetchInitialQuotes = async () => {
      try {
        const res = await apiClient.get("/market/quotes");
        if (res.data?.success && Array.isArray(res.data?.data) && isMounted) {
          const map = {};
          res.data.data.forEach((q) => {
            map[q.symbol] = q;
          });
          setQuotes((prev) => ({ ...prev, ...map }));
          setError(null);
        }
      } catch (err) {
        console.warn("Could not fetch initial market quotes:", err.message);
        if (isMounted) setError("Failed to fetch initial quotes");
      }
    };

    fetchInitialQuotes();

    // 2. Establish Socket.IO real-time connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],

      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      if (isMounted) {
        setConnectionStatus("connected");
        setError(null);
      }
    });

    socket.on("disconnect", () => {
      if (isMounted) {
        setConnectionStatus("disconnected");
      }
    });

    socket.on("connect_error", (err) => {
      if (isMounted) {
        setConnectionStatus("disconnected");
        console.warn("Socket connection error:", err.message);
      }
    });

    socket.on("market:initial", (initialQuotes) => {
      if (isMounted && Array.isArray(initialQuotes)) {
        const map = {};
        initialQuotes.forEach((q) => {
          map[q.symbol] = q;
        });
        setQuotes((prev) => ({ ...prev, ...map }));
      }
    });

    socket.on("price:update", (updatedQuote) => {
      if (isMounted && updatedQuote?.symbol) {
        setQuotes((prev) => ({
          ...prev,
          [updatedQuote.symbol]: updatedQuote,
        }));
      }
    });

    socket.on("order:update", (order) => {
      if (isMounted && order) {
        setLastOrderUpdate(order);
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const value = useMemo(
    () => ({
      quotes,
      connectionStatus,
      getQuote,
      lastOrderUpdate,
      error,
    }),
    [quotes, connectionStatus, getQuote, lastOrderUpdate, error]
  );

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => useContext(MarketDataContext);
export default MarketDataContext;
