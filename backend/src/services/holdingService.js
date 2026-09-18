import { HoldingsModel } from "../models/HoldingsModel.js";

/**
 * Fetch all holdings for a specific authenticated user (sorted by name)
 */
export const getAllHoldings = async (userId) => {
  return HoldingsModel.find({ userId }).sort({ name: 1 });
};

/**
 * Find a specific holding by user ID and symbol name
 */
export const getHoldingByName = async (userId, symbol) => {
  return HoldingsModel.findOne({ userId, name: symbol.toUpperCase() });
};

/**
 * Apply a BUY order to a user's holdings (update existing or create new)
 */
export const applyBuyToHolding = async (userId, symbol, qty, price) => {
  const cleanSymbol = symbol.toUpperCase();
  let holding = await HoldingsModel.findOne({ userId, name: cleanSymbol });

  if (holding) {
    const existingQty = holding.qty;
    const existingAvg = holding.avg;
    const newQty = existingQty + qty;
    // Weighted average formula: (Q1*A1 + Q2*P2) / (Q1 + Q2)
    const newAvg = (existingQty * existingAvg + qty * price) / newQty;

    holding.qty = newQty;
    holding.avg = Math.round(newAvg * 100) / 100;
    holding.price = price;
    const netChange = ((price - newAvg) / newAvg) * 100;
    holding.net = (netChange >= 0 ? "+" : "") + netChange.toFixed(2) + "%";
    await holding.save();
    return holding;
  }

  // Create new holding for this user
  return HoldingsModel.create({
    userId,
    name: cleanSymbol,
    qty,
    avg: price,
    price,
    net: "+0.00%",
    day: "+0.00%",
  });
};

/**
 * Apply a SELL order to a user's holding (reduce quantity or delete if zero)
 */
export const applySellToHolding = async (holding, qty, price) => {
  const remainingQty = holding.qty - qty;

  if (remainingQty === 0) {
    await HoldingsModel.deleteOne({ _id: holding._id, userId: holding.userId });
    return null;
  }

  holding.qty = remainingQty;
  holding.price = price;
  const netChange = ((price - holding.avg) / holding.avg) * 100;
  holding.net = (netChange >= 0 ? "+" : "") + netChange.toFixed(2) + "%";
  await holding.save();
  return holding;
};
