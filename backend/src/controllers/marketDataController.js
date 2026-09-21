import * as marketDataService from "../services/marketDataService.js";

export const getAllQuotes = (req, res) => {
  const quotes = marketDataService.getAllQuotes();
  return res.json({
    success: true,
    count: quotes.length,
    data: quotes,
  });
};

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
