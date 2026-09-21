import { WatchlistModel } from "../models/WatchlistModel.js";
import { getQuote } from "./marketDataService.js";
import { AppError } from "../utils/AppError.js";

export const DEFAULT_WATCHLIST = [
  "TCS",
  "INFY",
  "RELIANCE",
  "HDFCBANK",
  "ICICIBANK",
];

export const getWatchlist = async (userId) => {
  const watchlist = await WatchlistModel.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        symbols: DEFAULT_WATCHLIST,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
  return watchlist;
};

export const addSymbol = async (userId, symbol) => {
  if (!symbol || typeof symbol !== "string") {
    throw new AppError("Symbol is required.", 400, "INVALID_SYMBOL");
  }

  const cleanInput = symbol.trim().toUpperCase();
  const quote = getQuote(cleanInput);
  if (!quote) {
    throw new AppError(
      `Instrument not found in market feed: ${cleanInput}`,
      404,
      "INSTRUMENT_NOT_FOUND",
    );
  }

  const canonicalSymbol = quote.symbol;

  await getWatchlist(userId);

  const updated = await WatchlistModel.findOneAndUpdate(
    { userId },
    { $addToSet: { symbols: canonicalSymbol } },
    { new: true },
  );

  return updated;
};

export const removeSymbol = async (userId, symbol) => {
  if (!symbol || typeof symbol !== "string") {
    throw new AppError("Symbol is required.", 400, "INVALID_SYMBOL");
  }

  const cleanInput = symbol.trim().toUpperCase();
  const quote = getQuote(cleanInput);
  const targetSymbol = quote ? quote.symbol : cleanInput;

  await getWatchlist(userId);

  const updated = await WatchlistModel.findOneAndUpdate(
    { userId },
    { $pull: { symbols: targetSymbol } },
    { new: true },
  );

  return updated;
};

export const reorderSymbols = async (userId, symbols) => {
  if (!Array.isArray(symbols)) {
    throw new AppError(
      "Symbols must be provided as an array.",
      400,
      "INVALID_INPUT",
    );
  }

  const normalized = symbols.map((s) => {
    if (!s || typeof s !== "string") {
      throw new AppError(
        "All symbols in list must be non-empty strings.",
        400,
        "INVALID_SYMBOL",
      );
    }
    const q = getQuote(s.trim().toUpperCase());
    if (!q) {
      throw new AppError(
        `Instrument not found in market feed: ${s}`,
        404,
        "INSTRUMENT_NOT_FOUND",
      );
    }
    return q.symbol;
  });

  const unique = [...new Set(normalized)];
  if (unique.length !== normalized.length) {
    throw new AppError(
      "Duplicate symbols are not allowed in the reorder list.",
      400,
      "DUPLICATE_SYMBOLS",
    );
  }

  const current = await getWatchlist(userId);
  const currentSet = new Set(current.symbols);

  if (
    unique.length !== current.symbols.length ||
    !unique.every((sym) => currentSet.has(sym))
  ) {
    throw new AppError(
      "Reordered list must contain the exact set of symbols currently in the watchlist.",
      400,
      "INVALID_REORDER_LIST",
    );
  }

  current.symbols = unique;
  await current.save();
  return current;
};
