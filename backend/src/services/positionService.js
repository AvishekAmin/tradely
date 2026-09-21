import { PositionsModel } from "../models/PositionsModel.js";
import { OrdersModel } from "../models/OrdersModel.js";

export const getAllPositions = async (userId) => {
  const explicitPositions = await PositionsModel.find({ userId }).lean();

  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

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

  const positionsMap = new Map();

  for (const order of todayOrders) {
    const symbol = order.name.toUpperCase();
    if (!positionsMap.has(symbol)) {
      positionsMap.set(symbol, {
        name: symbol,
        product: "CNC",
        lots: [],
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

      if (order.realizedPnL && pos.realizedPnL === 0) {
        pos.realizedPnL = order.realizedPnL;
      }
    }
  }

  const mirroredPositions = [];
  for (const [symbol, data] of positionsMap.entries()) {
    const openQty = data.lots.reduce((acc, lot) => acc + lot.qty, 0);
    const totalCostOfOpen = data.lots.reduce(
      (acc, lot) => acc + lot.qty * lot.price,
      0,
    );

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

  return Array.from(finalMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};
