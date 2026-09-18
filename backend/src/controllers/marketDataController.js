import * as marketDataService from "../services/marketDataService.js";

/**
 * Controller to fetch all current market quotes (15 instruments)
 */
export const getAllQuotes = (req, res) => {
  const quotes = marketDataService.getAllQuotes();
  return res.json({
    success: true,
    count: quotes.length,
    data: quotes,
  });
};

/**
 * Controller to fetch a specific market quote by instrument symbol
 */
export const getQuoteBySymbol = (req, res) => {
  const { symbol } = req.params;
  const quote = marketDataService.getQuote(symbol);

  if (!quote) {
    return res.status(404).json({
      success: false,
      code: "INSTRUMENT_NOT_FOUND",
      message: `Instrument not found in market feed: ${symbol}`,
    });
  }

  return res.json({
    success: true,
    data: quote,
  });
};
