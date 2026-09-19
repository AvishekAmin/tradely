import { EventEmitter } from "events";

export const marketEventEmitter = new EventEmitter();

// 15 supported equity instruments with realistic deterministic seed prices
const SEED_DATA = [
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3500.0 },
  { symbol: "INFY", name: "Infosys Ltd", price: 1550.0 },
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2900.0 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", price: 1700.0 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", price: 1200.0 },
  { symbol: "SBIN", name: "State Bank of India", price: 800.0 },
  { symbol: "ITC", name: "ITC Ltd", price: 450.0 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", price: 2500.0 },
  { symbol: "WIPRO", name: "Wipro Ltd", price: 550.0 },
  { symbol: "M&M", name: "Mahindra & Mahindra Ltd", price: 2800.0 },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", price: 240.0 },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", price: 1100.0 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1750.0 },
  { symbol: "KPITTECH", name: "KPIT Technologies", price: 1400.0 },
  { symbol: "QUICKHEAL", name: "Quick Heal Technologies", price: 450.0 },
];

// Common aliases for existing watchlist consistency
const SYMBOL_ALIASES = {
  HUL: "HINDUNILVR",
};

// In-memory quote state
const quotesMap = new Map();

// Initialize in-memory quote store from seed data
const initializeQuotes = () => {
  const now = new Date().toISOString();
  SEED_DATA.forEach((item) => {
    quotesMap.set(item.symbol, {
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      previousPrice: item.price,
      change: 0.0,
      changePercent: 0.0,
      timestamp: now,
    });
  });
};

initializeQuotes();

/**
 * Normalize input symbol and resolve any known aliases
 */
const normalizeSymbol = (symbol) => {
  if (!symbol || typeof symbol !== "string") return "";
  const cleaned = symbol.trim().toUpperCase();
  return SYMBOL_ALIASES[cleaned] || cleaned;
};

/**
 * Retrieve current market quote for a symbol
 */
export const getQuote = (symbol) => {
  const norm = normalizeSymbol(symbol);
  const quote = quotesMap.get(norm);
  if (!quote) return null;
  return { ...quote };
};

/**
 * Retrieve multiple quotes by array of symbols
 */
export const getQuotes = (symbols = []) => {
  return symbols.map((s) => getQuote(s)).filter(Boolean);
};

/**
 * Explicitly update quote price (useful for deterministic trigger tests and external feeds)
 */
export const setQuotePrice = (symbol, price) => {
  const norm = normalizeSymbol(symbol);
  const current = quotesMap.get(norm);
  if (!current) return null;
  const prevPrice = current.price;
  const updatedQuote = {
    ...current,
    previousPrice: prevPrice,
    price: Math.round(price * 100) / 100,
    change: Math.round((price - prevPrice) * 100) / 100,
    changePercent:
      prevPrice > 0 ? Math.round(((price - prevPrice) / prevPrice) * 10000) / 100 : 0.0,
    timestamp: new Date().toISOString(),
  };
  quotesMap.set(norm, updatedQuote);
  marketEventEmitter.emit("quote:update", { ...updatedQuote });
  return updatedQuote;
};


/**
 * Retrieve all 15 supported market quotes
 */
export const getAllQuotes = () => {
  return Array.from(quotesMap.values()).map((q) => ({ ...q }));
};

let simulationIntervalId = null;

/**
 * Execute a single simulation tick: pick 2-4 symbols and apply bounded movement (±0.1% to ±0.4%)
 */
export const simulateTick = () => {
  const allSymbols = Array.from(quotesMap.keys());
  if (allSymbols.length === 0) return [];

  // Pick between 2 and 4 random instruments to update per tick
  const updateCount = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...allSymbols].sort(() => 0.5 - Math.random());
  const selectedSymbols = shuffled.slice(0, updateCount);

  const updatedQuotes = [];

  for (const sym of selectedSymbols) {
    const current = quotesMap.get(sym);
    if (!current) continue;

    // Movement between -0.4% (-0.004) and +0.4% (+0.004)
    const movementPercent = Math.random() * 0.008 - 0.004;

    const prevPrice = current.price;
    // Calculate new price, bounded to minimum 0.01, rounded to 2 decimal places
    const rawNewPrice = prevPrice * (1 + movementPercent);
    const newPrice = Math.max(0.01, Math.round(rawNewPrice * 100) / 100);

    const change = Math.round((newPrice - prevPrice) * 100) / 100;
    const changePercent =
      prevPrice > 0 ? Math.round(((newPrice - prevPrice) / prevPrice) * 10000) / 100 : 0.0;

    const updatedQuote = {
      symbol: current.symbol,
      name: current.name,
      price: newPrice,
      previousPrice: prevPrice,
      change,
      changePercent,
      timestamp: new Date().toISOString(),
    };

    quotesMap.set(sym, updatedQuote);
    updatedQuotes.push(updatedQuote);

    // Emit event for socket transport layer (decoupled from Socket.IO)
    marketEventEmitter.emit("quote:update", { ...updatedQuote });
  }

  return updatedQuotes;
};

/**
 * Start the controlled server-side pseudo-random market simulation loop
 */
export const startMarketSimulation = (intervalMs = 1500) => {
  if (simulationIntervalId) {
    return; // Already running, prevent duplicate intervals
  }

  simulationIntervalId = setInterval(() => {
    simulateTick();
  }, intervalMs);

  console.log(`Market data simulation active (${intervalMs}ms tick interval)`);
};

/**
 * Stop the market simulation loop
 */
export const stopMarketSimulation = () => {
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
    console.log("Market data simulation stopped.");
  }
};
