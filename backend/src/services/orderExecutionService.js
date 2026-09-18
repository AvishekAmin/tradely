import { OrdersModel } from "../models/OrdersModel.js";
import { AppError } from "../utils/AppError.js";
import { deductFunds, creditFunds } from "./accountService.js";
import {
  getHoldingByName,
  applyBuyToHolding,
  applySellToHolding,
} from "./holdingService.js";

/**
 * Fetch all orders for an authenticated user, sorted newest first
 */
export const getAllOrders = async (userId) => {
  return OrdersModel.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Execute BUY order logic scoped to the authenticated user
 */
const executeBuy = async ({ name, qty, price, orderType }, user) => {
  const totalCost = Math.round(qty * price * 100) / 100;

  // 1. Funds Check
  if (user.balance < totalCost) {
    const rejectedOrder = new OrdersModel({
      userId: user._id,
      name,
      qty,
      price,
      mode: "BUY",
      orderType: orderType || "MARKET",
      status: "REJECTED",
      totalValue: totalCost,
      realizedPnL: 0,
    });
    await rejectedOrder.save();

    throw new AppError(
      `Insufficient funds. Required: ₹${totalCost.toFixed(2)}, Available: ₹${user.balance.toFixed(2)}`,
      400,
      "INSUFFICIENT_FUNDS"
    );
  }

  // 2. Deduct Funds from User's balance
  await deductFunds(user, totalCost);

  // 3. Create or update holding for this user
  const holding = await applyBuyToHolding(user._id, name, qty, price);

  // 4. Record executed order for this user
  const executedOrder = new OrdersModel({
    userId: user._id,
    name,
    qty,
    price,
    mode: "BUY",
    orderType: orderType || "MARKET",
    status: "EXECUTED",
    totalValue: totalCost,
    realizedPnL: 0,
    executedAt: new Date(),
  });
  await executedOrder.save();

  return {
    statusCode: 201,
    success: true,
    message: `Buy order executed successfully: ${qty} share(s) of ${name}`,
    data: {
      order: executedOrder,
      balance: user.balance,
      holding,
    },
  };
};

/**
 * Execute SELL order logic scoped to the authenticated user
 */
const executeSell = async ({ name, qty, price, orderType }, user) => {
  const holding = await getHoldingByName(user._id, name);

  // 1. Verify holding exists and has quantity
  if (!holding || holding.qty <= 0) {
    const rejectedOrder = new OrdersModel({
      userId: user._id,
      name,
      qty,
      price,
      mode: "SELL",
      orderType: orderType || "MARKET",
      status: "REJECTED",
      totalValue: Math.round(qty * price * 100) / 100,
      realizedPnL: 0,
    });
    await rejectedOrder.save();

    throw new AppError(
      `Cannot sell ${name}: you do not own any shares of this instrument.`,
      404,
      "HOLDING_NOT_FOUND"
    );
  }

  // 2. Verify sufficient quantity is owned
  if (qty > holding.qty) {
    const rejectedOrder = new OrdersModel({
      userId: user._id,
      name,
      qty,
      price,
      mode: "SELL",
      orderType: orderType || "MARKET",
      status: "REJECTED",
      totalValue: Math.round(qty * price * 100) / 100,
      realizedPnL: 0,
    });
    await rejectedOrder.save();

    throw new AppError(
      `Cannot sell ${qty} shares of ${name}. You currently own ${holding.qty} shares.`,
      400,
      "INSUFFICIENT_QUANTITY"
    );
  }

  const totalProceeds = Math.round(qty * price * 100) / 100;
  const avgBuyPrice = holding.avg;
  // Realized P&L = (sellPrice - avgBuyPrice) * soldQty
  const realizedPnL = Math.round((price - avgBuyPrice) * qty * 100) / 100;

  // 3. Credit Funds to user balance
  await creditFunds(user, totalProceeds);

  // 4. Update or remove holding
  const updatedHolding = await applySellToHolding(holding, qty, price);

  // 5. Record executed sell order
  const executedOrder = new OrdersModel({
    userId: user._id,
    name,
    qty,
    price,
    mode: "SELL",
    orderType: orderType || "MARKET",
    status: "EXECUTED",
    totalValue: totalProceeds,
    realizedPnL,
    executedAt: new Date(),
  });
  await executedOrder.save();

  return {
    statusCode: 201,
    success: true,
    message: `Sell order executed successfully: ${qty} share(s) of ${name}`,
    data: {
      order: executedOrder,
      balance: user.balance,
      holding: updatedHolding,
      realizedPnL,
    },
  };
};

/**
 * Main order execution entry point for authenticated user
 */
export const executeOrder = async (orderPayload, user) => {
  const normalizedMode = (orderPayload.mode || "").toUpperCase();

  if (normalizedMode === "BUY") {
    return executeBuy(orderPayload, user);
  } else if (normalizedMode === "SELL") {
    return executeSell(orderPayload, user);
  }

  throw new AppError("Order mode must be either BUY or SELL.", 400, "INVALID_MODE");
};
