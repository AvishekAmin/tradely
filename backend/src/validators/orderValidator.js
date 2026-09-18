/**
 * Validator middleware for incoming order placement requests
 */
export const validateOrder = (req, res, next) => {
  const { name, qty, price, mode, orderType } = req.body || {};

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

  // 3. Price Validation
  const parsedPrice = Number(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({
      success: false,
      code: "INVALID_PRICE",
      message: "Price must be a positive number greater than zero.",
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

  // Attach sanitized data for downstream consumption
  req.validatedOrder = {
    name: cleanSymbol,
    qty: parsedQty,
    price: parsedPrice,
    mode: normalizedMode,
    orderType: orderType || "MARKET",
  };

  next();
};
