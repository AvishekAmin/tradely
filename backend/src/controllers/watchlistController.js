import * as watchlistService from "../services/watchlistService.js";

/**
 * GET /watchlist - Retrieve authenticated user's watchlist
 */
export const getWatchlist = async (req, res, next) => {
  try {
    const watchlist = await watchlistService.getWatchlist(req.user._id);
    res.status(200).json({
      success: true,
      data: watchlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /watchlist - Add a symbol to authenticated user's watchlist
 */
export const addSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    const watchlist = await watchlistService.addSymbol(req.user._id, symbol);
    res.status(200).json({
      success: true,
      message: `Instrument added to watchlist.`,
      data: watchlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /watchlist/:symbol - Remove a symbol from authenticated user's watchlist
 */
export const removeSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const watchlist = await watchlistService.removeSymbol(req.user._id, symbol);
    res.status(200).json({
      success: true,
      message: `Instrument removed from watchlist.`,
      data: watchlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /watchlist/reorder - Reorder authenticated user's watchlist symbols
 */
export const reorderWatchlist = async (req, res, next) => {
  try {
    const { symbols } = req.body;
    const watchlist = await watchlistService.reorderSymbols(req.user._id, symbols);
    res.status(200).json({
      success: true,
      message: "Watchlist reordered successfully.",
      data: watchlist,
    });
  } catch (err) {
    next(err);
  }
};
