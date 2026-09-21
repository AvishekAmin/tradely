import { HoldingsModel } from "../models/HoldingsModel.js";
import { OrdersModel } from "../models/OrdersModel.js";
import { getQuote } from "./marketDataService.js";

export const getPortfolioAnalytics = async (userId) => {
  const holdings = await HoldingsModel.find({ userId });

  const executedSellOrders = await OrdersModel.find({
    userId,
    status: "EXECUTED",
    mode: "SELL",
  });

  const totalInvested =
    Math.round(
      holdings.reduce((sum, h) => sum + (h.qty || 0) * (h.avg || 0), 0) * 100,
    ) / 100;

  let valuationComplete = true;
  const unavailableSymbols = [];
  let currentValue = 0;
  const allocation = [];

  for (const holding of holdings) {
    const quote = getQuote(holding.name);

    if (quote && typeof quote.price === "number") {
      const holdingVal =
        Math.round((holding.qty || 0) * quote.price * 100) / 100;
      currentValue += holdingVal;

      allocation.push({
        symbol: holding.name,
        name: quote.name || holding.name,
        qty: holding.qty,
        price: quote.price,
        value: holdingVal,
        percentage: 0,
      });
    } else {
      valuationComplete = false;
      unavailableSymbols.push(holding.name);
    }
  }

  currentValue = Math.round(currentValue * 100) / 100;

  if (currentValue > 0 && valuationComplete) {
    for (const item of allocation) {
      item.percentage = Math.round((item.value / currentValue) * 10000) / 100;
    }
    allocation.sort((a, b) => b.value - a.value);
  }

  let unrealizedPnL = null;
  let unrealizedPnLPercent = null;

  if (valuationComplete) {
    unrealizedPnL = Math.round((currentValue - totalInvested) * 100) / 100;
    unrealizedPnLPercent =
      totalInvested > 0
        ? Math.round((unrealizedPnL / totalInvested) * 10000) / 100
        : 0;
  }

  const realizedPnL =
    Math.round(
      executedSellOrders.reduce(
        (sum, order) => sum + (order.realizedPnL || 0),
        0,
      ) * 100,
    ) / 100;

  let totalPnL = null;
  let totalReturnPercent = 0;

  if (valuationComplete) {
    totalPnL = Math.round((realizedPnL + (unrealizedPnL ?? 0)) * 100) / 100;
    totalReturnPercent =
      totalInvested > 0
        ? Math.round((totalPnL / totalInvested) * 10000) / 100
        : 0;
  }

  return {
    totalInvested,
    currentValue: valuationComplete ? currentValue : null,
    unrealizedPnL,
    unrealizedPnLPercent,
    realizedPnL,
    totalPnL,
    totalReturnPercent,
    holdingsCount: holdings.length,
    valuationComplete,
    unavailableSymbols,
    allocation: valuationComplete ? allocation : [],
  };
};
