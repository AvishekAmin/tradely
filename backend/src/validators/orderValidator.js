import { getQuote } from "../services/marketDataService.js";

const VALID_ORDER_TYPES = ["MARKET", "LIMIT", "STOP_MARKET", "STOP_LIMIT", "TRAILING_STOP"];

/**
 * Validator middleware for incoming order placement requests
 */
export const validateOrder = (req, res, next) => {
  const { name, qty, limitPrice, stopPrice, trailPercent, trailAmount, mode, orderType } =
    req.body || {};

  // 1. Symbol Validation
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      code: "INVALID_SYMBOL",
      message: "Stock symbol is required.",
    });
  }

  const cleanSymbol = name.trim().toUpperCase();
  const quote = getQuote(cleanSymbol);
  if (!quote) {
    return res.status(404).json({
      success: false,
      code: "INSTRUMENT_NOT_FOUND",
      message: `Instrument not found in market feed: ${cleanSymbol}`,
    });
  }

  // 2. Quantity Validation
  const parsedQty = Number(qty);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({
      success: false,
      code: "INVALID_QUANTITY",
      message: "Quantity must be a positive integer greater than zero.",
    });
  }

  // 3. Order Type Validation
  const normalizedOrderType = (orderType || "MARKET").toUpperCase();
  if (!VALID_ORDER_TYPES.includes(normalizedOrderType)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_ORDER_TYPE",
      message: `Order type must be one of: ${VALID_ORDER_TYPES.join(", ")}.`,
    });
  }

  // 4. Mode Validation
  const normalizedMode = (mode || "").toUpperCase();
  if (normalizedMode !== "BUY" && normalizedMode !== "SELL") {
    return res.status(400).json({
      success: false,
      code: "INVALID_MODE",
      message: "Order mode must be either BUY or SELL.",
    });
  }

  // 5. Price & Direction Validations
  let parsedLimitPrice = null;
  let parsedStopPrice = null;
  let parsedTrailPercent = null;
  let parsedTrailAmount = null;

  // LIMIT orders
  if (normalizedOrderType === "LIMIT") {
    parsedLimitPrice = Number(limitPrice);
    if (!parsedLimitPrice || isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_LIMIT_PRICE",
        message: "Limit price must be a positive number greater than zero.",
      });
    }
    parsedLimitPrice = Math.round(parsedLimitPrice * 100) / 100;
  }

  // STOP_MARKET orders
  if (normalizedOrderType === "STOP_MARKET") {
    parsedStopPrice = Number(stopPrice);
    if (!parsedStopPrice || isNaN(parsedStopPrice) || parsedStopPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STOP_PRICE",
        message: "Stop price must be a positive number greater than zero.",
      });
    }
    parsedStopPrice = Math.round(parsedStopPrice * 100) / 100;

    // Server-side market direction checks
    if (normalizedMode === "BUY" && parsedStopPrice <= quote.price) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STOP_DIRECTION",
        message: `BUY STOP trigger price (₹${parsedStopPrice.toFixed(2)}) must be above current market price (₹${quote.price.toFixed(2)}).`,
      });
    }
    if (normalizedMode === "SELL" && parsedStopPrice >= quote.price) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STOP_DIRECTION",
        message: `SELL STOP trigger price (₹${parsedStopPrice.toFixed(2)}) must be below current market price (₹${quote.price.toFixed(2)}).`,
      });
    }
  }

  // STOP_LIMIT orders
  if (normalizedOrderType === "STOP_LIMIT") {
    parsedStopPrice = Number(stopPrice);
    parsedLimitPrice = Number(limitPrice);

    if (!parsedStopPrice || isNaN(parsedStopPrice) || parsedStopPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STOP_PRICE",
        message: "Stop price must be a positive number greater than zero.",
      });
    }
    if (!parsedLimitPrice || isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_LIMIT_PRICE",
        message: "Limit price must be a positive number greater than zero.",
      });
    }

    parsedStopPrice = Math.round(parsedStopPrice * 100) / 100;
    parsedLimitPrice = Math.round(parsedLimitPrice * 100) / 100;

    // Server-side market direction checks
    if (normalizedMode === "BUY") {
      if (parsedStopPrice <= quote.price) {
        return res.status(400).json({
          success: false,
          code: "INVALID_STOP_DIRECTION",
          message: `BUY STOP price (₹${parsedStopPrice.toFixed(2)}) must be above current market price (₹${quote.price.toFixed(2)}).`,
        });
      }
      if (parsedLimitPrice < parsedStopPrice) {
        return res.status(400).json({
          success: false,
          code: "INVALID_STOP_LIMIT_RELATION",
          message: `BUY STOP-LIMIT requires limitPrice (₹${parsedLimitPrice.toFixed(2)}) >= stopPrice (₹${parsedStopPrice.toFixed(2)}).`,
        });
      }
    } else if (normalizedMode === "SELL") {
      if (parsedStopPrice >= quote.price) {
        return res.status(400).json({
          success: false,
          code: "INVALID_STOP_DIRECTION",
          message: `SELL STOP price (₹${parsedStopPrice.toFixed(2)}) must be below current market price (₹${quote.price.toFixed(2)}).`,
        });
      }
      if (parsedLimitPrice > parsedStopPrice) {
        return res.status(400).json({
          success: false,
          code: "INVALID_STOP_LIMIT_RELATION",
          message: `SELL STOP-LIMIT requires limitPrice (₹${parsedLimitPrice.toFixed(2)}) <= stopPrice (₹${parsedStopPrice.toFixed(2)}).`,
        });
      }
    }
  }

  // TRAILING_STOP orders
  if (normalizedOrderType === "TRAILING_STOP") {
    // Phase 7 supports SELL trailing stop protection
    if (normalizedMode !== "SELL") {
      return res.status(400).json({
        success: false,
        code: "UNSUPPORTED_TRAILING_MODE",
        message: "Trailing stops currently support SELL side protection.",
      });
    }

    if (trailPercent !== undefined && trailPercent !== null && trailPercent !== "") {
      parsedTrailPercent = Number(trailPercent);
      if (isNaN(parsedTrailPercent) || parsedTrailPercent <= 0 || parsedTrailPercent >= 100) {
        return res.status(400).json({
          success: false,
          code: "INVALID_TRAIL_PERCENT",
          message: "Trail percent must be a positive number between 0 and 100.",
        });
      }
      parsedTrailPercent = Math.round(parsedTrailPercent * 100) / 100;
    } else if (trailAmount !== undefined && trailAmount !== null && trailAmount !== "") {
      parsedTrailAmount = Number(trailAmount);
      if (isNaN(parsedTrailAmount) || parsedTrailAmount <= 0 || parsedTrailAmount >= quote.price) {
        return res.status(400).json({
          success: false,
          code: "INVALID_TRAIL_AMOUNT",
          message: `Trail amount must be a positive number less than current market price (₹${quote.price.toFixed(2)}).`,
        });
      }
      parsedTrailAmount = Math.round(parsedTrailAmount * 100) / 100;
    } else {
      return res.status(400).json({
        success: false,
        code: "MISSING_TRAIL_SPECIFICATION",
        message: "Trailing stop order requires either trailPercent or trailAmount.",
      });
    }
  }

  req.validatedOrder = {
    name: cleanSymbol,
    qty: parsedQty,
    limitPrice: parsedLimitPrice,
    stopPrice: parsedStopPrice,
    trailPercent: parsedTrailPercent,
    trailAmount: parsedTrailAmount,
    mode: normalizedMode,
    orderType: normalizedOrderType,
  };

  next();
};

/**
 * Validator middleware for OCO (One-Cancels-the-Other) order groups
 */
export const validateOCO = (req, res, next) => {
  const { symbol, name, qty, takeProfitLimitPrice, stopLossPrice } = req.body || {};
  const targetSymbol = (symbol || name || "").trim().toUpperCase();

  if (!targetSymbol) {
    return res.status(400).json({
      success: false,
      code: "INVALID_SYMBOL",
      message: "Stock symbol is required for OCO order.",
    });
  }

  const quote = getQuote(targetSymbol);
  if (!quote) {
    return res.status(404).json({
      success: false,
      code: "INSTRUMENT_NOT_FOUND",
      message: `Instrument not found in market feed: ${targetSymbol}`,
    });
  }

  const parsedQty = Number(qty);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({
      success: false,
      code: "INVALID_QUANTITY",
      message: "Quantity must be a positive integer greater than zero.",
    });
  }

  const parsedTakeProfit = Number(takeProfitLimitPrice);
  if (!parsedTakeProfit || isNaN(parsedTakeProfit) || parsedTakeProfit <= quote.price) {
    return res.status(400).json({
      success: false,
      code: "INVALID_TAKE_PROFIT",
      message: `Take-profit limit price (₹${parsedTakeProfit || 0}) must be strictly higher than current market price (₹${quote.price.toFixed(2)}).`,
    });
  }

  const parsedStopLoss = Number(stopLossPrice);
  if (!parsedStopLoss || isNaN(parsedStopLoss) || parsedStopLoss >= quote.price) {
    return res.status(400).json({
      success: false,
      code: "INVALID_STOP_LOSS",
      message: `Stop-loss price (₹${parsedStopLoss || 0}) must be strictly lower than current market price (₹${quote.price.toFixed(2)}).`,
    });
  }

  req.validatedOCO = {
    symbol: targetSymbol,
    qty: parsedQty,
    side: "SELL",
    takeProfitLimitPrice: Math.round(parsedTakeProfit * 100) / 100,
    stopLossPrice: Math.round(parsedStopLoss * 100) / 100,
  };

  next();
};
