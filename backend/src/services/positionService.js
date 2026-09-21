import { PositionsModel } from "../models/PositionsModel.js";
import { OrdersModel } from "../models/OrdersModel.js";

/**
 * Fetch all positions for a specific user.
 * Implements Same-Day Position Mirroring:
 * - Aggregates today's executed orders into active intraday/delivery positions.
 * - Computes open quantity, volume-weighted average price (FIFO), and realized P&L.
 * - Merges with any explicit positions saved in PositionsModel.
 * - Returns positions sorted alphabetically by symbol.
 */
export const getAllPositions = async (userId) => {
  // 1. Fetch any explicit positions stored in PositionsModel for this user
  const explicitPositions = await PositionsModel.find({ userId }).lean();

  // 2. Fetch all EXECUTED orders for the user from today's session
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const todayOrders = await OrdersModel.find({
    userId,
    status: "EXECUTED",
    $or: [
      { executedAt: { $gte: startOfDay } },
      { createdAt: { $gte: startOfDay } },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  // 3. Process orders with FIFO inventory matching
  const positionsMap = new Map();

  for (const order of todayOrders) {
    const symbol = order.name.toUpperCase();
    if (!positionsMap.has(symbol)) {
      positionsMap.set(symbol, {
        name: symbol,
        product: "CNC", // Delivery / CNC by default for equity trades
        lots: [], // { qty, price }
        dayBuyQty: 0,
        daySellQty: 0,
        totalBuyVal: 0,
        totalSellVal: 0,
        realizedPnL: 0,
        lastPrice: order.executionPrice || order.price || 0,
        lastExecutedAt: order.executedAt || order.createdAt,
      });
    }

    const pos = positionsMap.get(symbol);
    const price = order.executionPrice || order.price || 0;
    pos.lastPrice = price;
    pos.lastExecutedAt = order.executedAt || order.createdAt;

    if (order.mode === "BUY") {
      pos.dayBuyQty += order.qty;
      pos.totalBuyVal += order.qty * price;
      pos.lots.push({ qty: order.qty, price });
    } else if (order.mode === "SELL") {
      pos.daySellQty += order.qty;
      pos.totalSellVal += order.qty * price;

      // FIFO match against buy lots
      let sellQtyRemaining = order.qty;
      while (sellQtyRemaining > 0 && pos.lots.length > 0) {
        const firstLot = pos.lots[0];
        const matchQty = Math.min(sellQtyRemaining, firstLot.qty);
        pos.realizedPnL += (price - firstLot.price) * matchQty;
        firstLot.qty -= matchQty;
        sellQtyRemaining -= matchQty;
        if (firstLot.qty <= 0) {
          pos.lots.shift();
        }
      }

      // If sell order had explicit realizedPnL recorded, ensure it's not undercounted
      if (order.realizedPnL && pos.realizedPnL === 0) {
        pos.realizedPnL = order.realizedPnL;
      }
    }
  }

  // 4. Construct mirrored position objects
  const mirroredPositions = [];
  for (const [symbol, data] of positionsMap.entries()) {
    const openQty = data.lots.reduce((acc, lot) => acc + lot.qty, 0);
    const totalCostOfOpen = data.lots.reduce((acc, lot) => acc + lot.qty * lot.price, 0);

    // If open shares exist, avg price is the cost basis of remaining shares
    // If closed (openQty === 0), avg price is the average buy price during the day
    let avgPrice = 0;
    if (openQty > 0) {
      avgPrice = totalCostOfOpen / openQty;
    } else if (data.dayBuyQty > 0) {
      avgPrice = data.totalBuyVal / data.dayBuyQty;
    } else if (data.daySellQty > 0) {
      avgPrice = data.totalSellVal / data.daySellQty;
    }

    mirroredPositions.push({
      _id: `pos-${symbol}`,
      userId,
      name: symbol,
      product: "CNC",
      qty: openQty,
      avg: Math.round(avgPrice * 100) / 100,
      price: data.lastPrice,
      dayBuyQty: data.dayBuyQty,
      daySellQty: data.daySellQty,
      realizedPnL: Math.round(data.realizedPnL * 100) / 100,
      isClosed: openQty === 0,
      net: "0.00%",
      day: "0.00%",
      isLoss: false,
    });
  }

  // 5. Merge with explicit positions (if any exist in PositionsModel)
  const finalMap = new Map();
  for (const p of mirroredPositions) {
    finalMap.set(p.name, p);
  }
  for (const p of explicitPositions) {
    finalMap.set(p.name, {
      ...p,
      _id: p._id.toString(),
    });
  }

  return Array.from(finalMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
