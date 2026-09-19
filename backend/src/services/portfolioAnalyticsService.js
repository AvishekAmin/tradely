import { HoldingsModel } from "../models/HoldingsModel.js";
import { OrdersModel } from "../models/OrdersModel.js";
import { getQuote } from "./marketDataService.js";

/**
 * Dynamically calculate user-specific portfolio analytics.
 * 
 * NOTE: Analytics are never stored in MongoDB as market prices change continuously.
 * They are computed on-demand using:
 * 1. Authenticated user's holdings
 * 2. Authenticated user's executed SELL orders (for realized P&L)
 * 3. Live server quotes from marketDataService
 */
export const getPortfolioAnalytics = async (userId) => {
  // 1. Fetch current user holdings
  const holdings = await HoldingsModel.find({ userId });

  // 2. Fetch user's executed SELL orders (only executed SELLs generate realized P&L)
  const executedSellOrders = await OrdersModel.find({
    userId,
    status: "EXECUTED",
    mode: "SELL",
  });

  // 3. Calculate total invested capital from holdings' cost basis (qty * avg)
  const totalInvested =
    Math.round(
      holdings.reduce((sum, h) => sum + (h.qty || 0) * (h.avg || 0), 0) * 100
    ) / 100;

  // 4. Calculate current portfolio value and verify valuation completeness
  let valuationComplete = true;
  const unavailableSymbols = [];
  let currentValue = 0;
  const allocation = [];

  for (const holding of holdings) {
    const quote = getQuote(holding.name);

    if (quote && typeof quote.price === "number") {
      const holdingVal = Math.round((holding.qty || 0) * quote.price * 100) / 100;
      currentValue += holdingVal;

      allocation.push({
        symbol: holding.name,
        name: quote.name || holding.name,
        qty: holding.qty,
        price: quote.price,
        value: holdingVal,
        percentage: 0, // Calculated after total currentValue is known
      });
    } else {
      // Missing quote: never substitute 0 or stale prices
      valuationComplete = false;
      unavailableSymbols.push(holding.name);
    }
  }

  currentValue = Math.round(currentValue * 100) / 100;

  // 5. Calculate asset allocation percentages
  if (currentValue > 0 && valuationComplete) {
    for (const item of allocation) {
      item.percentage =
        Math.round((item.value / currentValue) * 10000) / 100;
    }
    // Sort allocation descending by value
    allocation.sort((a, b) => b.value - a.value);
  }

  // 6. Calculate Unrealized P&L
  let unrealizedPnL = null;
  let unrealizedPnLPercent = null;

  if (valuationComplete) {
    unrealizedPnL = Math.round((currentValue - totalInvested) * 100) / 100;
    unrealizedPnLPercent =
      totalInvested > 0
        ? Math.round((unrealizedPnL / totalInvested) * 10000) / 100
        : 0;
  }

  // 7. Calculate Realized P&L (strictly from executed SELL orders)
  const realizedPnL =
    Math.round(
      executedSellOrders.reduce(
        (sum, order) => sum + (order.realizedPnL || 0),
        0
      ) * 100
    ) / 100;

  // 8. Calculate Total P&L and Total Return %
  let totalPnL = null;
  let totalReturnPercent = 0;

  if (valuationComplete) {
    totalPnL = Math.round((realizedPnL + (unrealizedPnL ?? 0)) * 100) / 100;
    // Current portfolio return metric based on current holdings' invested cost basis
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
