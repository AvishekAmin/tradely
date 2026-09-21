import { EventEmitter } from "events";

export const marketEventEmitter = new EventEmitter();

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
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", price: 980.0 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", price: 1520.0 },
  { symbol: "LT", name: "Larsen & Toubro Ltd", price: 3600.0 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", price: 7100.0 },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd", price: 1850.0 },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", price: 1780.0 },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries", price: 1880.0 },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", price: 12400.0 },
  { symbol: "NTPC", name: "NTPC Ltd", price: 410.0 },
  { symbol: "POWERGRID", name: "Power Grid Corp of India", price: 340.0 },
  { symbol: "TITAN", name: "Titan Company Ltd", price: 3450.0 },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", price: 3150.0 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd", price: 11200.0 },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", price: 155.0 },
  { symbol: "COALINDIA", name: "Coal India Ltd", price: 510.0 },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", price: 3050.0 },
  { symbol: "ADANIPORTS", name: "Adani Ports and SEZ Ltd", price: 1450.0 },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd", price: 960.0 },
  { symbol: "GRASIM", name: "Grasim Industries Ltd", price: 2650.0 },
  { symbol: "TECHM", name: "Tech Mahindra Ltd", price: 1620.0 },
  { symbol: "CIPLA", name: "Cipla Ltd", price: 1580.0 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", price: 6600.0 },
  { symbol: "NESTLEIND", name: "Nestle India Ltd", price: 2500.0 },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd", price: 5800.0 },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd", price: 4850.0 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd", price: 5200.0 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise", price: 6900.0 },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd", price: 1460.0 },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd", price: 5600.0 },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd", price: 680.0 },
  { symbol: "BPCL", name: "Bharat Petroleum Corp Ltd", price: 350.0 },
  { symbol: "IOC", name: "Indian Oil Corporation Ltd", price: 175.0 },
  { symbol: "ZOMATO", name: "Zomato Ltd", price: 260.0 },
  { symbol: "JIOFIN", name: "Jio Financial Services Ltd", price: 340.0 },
  { symbol: "PAYTM", name: "One97 Communications Ltd", price: 680.0 },
];

const SYMBOL_ALIASES = {
  HUL: "HINDUNILVR",
};

const quotesMap = new Map();

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

const normalizeSymbol = (symbol) => {
  if (!symbol || typeof symbol !== "string") return "";
  const cleaned = symbol.trim().toUpperCase();
  return SYMBOL_ALIASES[cleaned] || cleaned;
};

export const getQuote = (symbol) => {
  const norm = normalizeSymbol(symbol);
  const quote = quotesMap.get(norm);
  if (!quote) return null;
  return { ...quote };
};

export const getQuotes = (symbols = []) => {
  return symbols.map((s) => getQuote(s)).filter(Boolean);
};

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
      prevPrice > 0
        ? Math.round(((price - prevPrice) / prevPrice) * 10000) / 100
        : 0.0,
    timestamp: new Date().toISOString(),
  };
  quotesMap.set(norm, updatedQuote);
  marketEventEmitter.emit("quote:update", { ...updatedQuote });
  return updatedQuote;
};

export const getAllQuotes = () => {
  return Array.from(quotesMap.values()).map((q) => ({ ...q }));
};

let simulationIntervalId = null;

export const simulateTick = () => {
  const allSymbols = Array.from(quotesMap.keys());
  if (allSymbols.length === 0) return [];

  const updateCount = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...allSymbols].sort(() => 0.5 - Math.random());
  const selectedSymbols = shuffled.slice(0, updateCount);

  const updatedQuotes = [];

  for (const sym of selectedSymbols) {
    const current = quotesMap.get(sym);
    if (!current) continue;

    const movementPercent = Math.random() * 0.008 - 0.004;

    const prevPrice = current.price;
    const rawNewPrice = prevPrice * (1 + movementPercent);
    const newPrice = Math.max(0.01, Math.round(rawNewPrice * 100) / 100);

    const change = Math.round((newPrice - prevPrice) * 100) / 100;
    const changePercent =
      prevPrice > 0
        ? Math.round(((newPrice - prevPrice) / prevPrice) * 10000) / 100
        : 0.0;

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

    marketEventEmitter.emit("quote:update", { ...updatedQuote });
  }

  return updatedQuotes;
};

export const startMarketSimulation = (intervalMs = 1500) => {
  if (simulationIntervalId) {
    return;
  }

  simulationIntervalId = setInterval(() => {
    simulateTick();
  }, intervalMs);

  console.log(`Market data simulation active (${intervalMs}ms tick interval)`);
};

export const stopMarketSimulation = () => {
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
    console.log("Market data simulation stopped.");
  }
};
