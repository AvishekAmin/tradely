/**
 * Validator middleware for incoming order placement requests (MARKET and LIMIT)
 */
export const validateOrder = (req, res, next) => {
  const { name, qty, limitPrice, mode, orderType } = req.body || {};

  // 1. Symbol Validation
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      code: "INVALID_SYMBOL",
      message: "Stock symbol is required.",
    });
  }

  const cleanSymbol = name.trim().toUpperCase();

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
  if (normalizedOrderType !== "MARKET" && normalizedOrderType !== "LIMIT") {
    return res.status(400).json({
      success: false,
      code: "INVALID_ORDER_TYPE",
      message: "Order type must be either MARKET or LIMIT.",
    });
  }

  // 4. Limit Price Validation
  let parsedLimitPrice = null;
  if (normalizedOrderType === "LIMIT") {
    if (limitPrice === undefined || limitPrice === null || limitPrice === "") {
      return res.status(400).json({
        success: false,
        code: "INVALID_LIMIT_PRICE",
        message: "Limit price is required for LIMIT orders.",
      });
    }
    parsedLimitPrice = Number(limitPrice);
    if (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
      return res.status(400).json({
        success: false,
        code: "INVALID_LIMIT_PRICE",
        message: "Limit price must be a positive number greater than zero.",
      });
    }
    parsedLimitPrice = Math.round(parsedLimitPrice * 100) / 100;
  }

  // 5. Mode Validation
  const normalizedMode = (mode || "").toUpperCase();
  if (normalizedMode !== "BUY" && normalizedMode !== "SELL") {
    return res.status(400).json({
      success: false,
      code: "INVALID_MODE",
      message: "Order mode must be either BUY or SELL.",
    });
  }

  // Attach sanitized data for downstream consumption
  req.validatedOrder = {
    name: cleanSymbol,
    qty: parsedQty,
    limitPrice: parsedLimitPrice,
    mode: normalizedMode,
    orderType: normalizedOrderType,
  };

  next();
};
