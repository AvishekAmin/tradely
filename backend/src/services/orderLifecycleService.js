import { EventEmitter } from "events";
import { OrdersModel } from "../models/OrdersModel.js";
import { AppError } from "../utils/AppError.js";
import { runInTransaction } from "../utils/transactionHelper.js";
import {
  reserveFundsAtomic,
  releaseReservedFundsAtomic,
  consumeReservedFundsAtomic,
  deductFunds,
  creditFunds,
} from "./accountService.js";
import {
  getHoldingByName,
  reserveHoldingQtyAtomic,
  releaseReservedHoldingQtyAtomic,
  consumeReservedHoldingQty,
  deductMarketSellHolding,
  applyBuyToHolding,
} from "./holdingService.js";
import { getQuote, marketEventEmitter } from "./marketDataService.js";

export const orderEventEmitter = new EventEmitter();

/**
 * Fetch all orders for an authenticated user, sorted newest first
 */
export const getAllOrders = async (userId) => {
  return OrdersModel.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Place and orchestrate a new order (MARKET or LIMIT)
 */
export const createOrder = async (orderPayload, user) => {
  const cleanSymbol = (orderPayload.name || "").trim().toUpperCase();
  const qty = Number(orderPayload.qty);
  const mode = (orderPayload.mode || "").toUpperCase();
  const orderType = (orderPayload.orderType || "MARKET").toUpperCase();
  const limitPrice =
    orderPayload.limitPrice !== undefined && orderPayload.limitPrice !== null
      ? Number(orderPayload.limitPrice)
      : null;

  // Retrieve current server market quote
  const quote = getQuote(cleanSymbol);
  if (!quote) {
    throw new AppError(
      `Instrument not found in market feed: ${cleanSymbol}`,
      404,
      "INSTRUMENT_NOT_FOUND"
    );
  }

  return runInTransaction(async (session) => {
    // ========================================================
    // 1. MARKET ORDER EXECUTION PATH
    // ========================================================
    if (orderType === "MARKET") {
      const executionPrice = quote.price;

      if (mode === "BUY") {
        const totalCost = Math.round(qty * executionPrice * 100) / 100;

        // Atomically deduct funds from available balance
        const updatedUser = await deductFunds(user._id, totalCost, session);
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds. Order requires ₹${totalCost.toFixed(2)}, but available balance is insufficient.`,
            400,
            "INSUFFICIENT_FUNDS"
          );
        }

        // Apply purchase to user's holdings
        const holding = await applyBuyToHolding(user._id, cleanSymbol, qty, executionPrice, session);

        // Persist executed market buy order
        const executedOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: executionPrice,
          executionPrice,
          limitPrice: null,
          mode: "BUY",
          orderType: "MARKET",
          status: "EXECUTED",
          totalValue: totalCost,
          realizedPnL: 0,
          executedAt: new Date(),
        });
        await executedOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: executedOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Buy order executed successfully: ${qty} share(s) of ${cleanSymbol} @ ₹${executionPrice.toFixed(2)}`,
          data: {
            order: executedOrder,
            balance: updatedUser.balance,
            holding,
          },
        };
      } else if (mode === "SELL") {
        const executionPrice = quote.price;
        const totalProceeds = Math.round(qty * executionPrice * 100) / 100;

        // Fetch holding to inspect avg cost for realized PnL
        const holding = await getHoldingByName(user._id, cleanSymbol, session);
        const availableShares = holding ? holding.qty - (holding.reservedQty || 0) : 0;

        if (!holding || availableShares < qty) {
          throw new AppError(
            `Insufficient available shares. You have ${availableShares} available share(s) of ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY"
          );
        }

        const avgCost = holding.avg || 0;
        const realizedPnL = Math.round((executionPrice - avgCost) * qty * 100) / 100;

        // Deduct unreserved shares from holding
        const updatedHolding = await deductMarketSellHolding(user._id, cleanSymbol, qty, executionPrice, session);

        // Credit proceeds to balance
        const updatedUser = await creditFunds(user._id, totalProceeds, session);

        // Persist executed market sell order
        const executedOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: executionPrice,
          executionPrice,
          limitPrice: null,
          mode: "SELL",
          orderType: "MARKET",
          status: "EXECUTED",
          totalValue: totalProceeds,
          realizedPnL,
          executedAt: new Date(),
        });
        await executedOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: executedOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Sell order executed successfully: ${qty} share(s) of ${cleanSymbol} @ ₹${executionPrice.toFixed(2)}`,
          data: {
            order: executedOrder,
            balance: updatedUser ? updatedUser.balance : user.balance,
            holding: updatedHolding,
            realizedPnL,
          },
        };
      }
    }

    // ========================================================
    // 2. LIMIT ORDER EXECUTION PATH
    // ========================================================
    if (orderType === "LIMIT") {
      if (!limitPrice || limitPrice <= 0) {
        throw new AppError("Limit price must be greater than zero.", 400, "INVALID_LIMIT_PRICE");
      }

      if (mode === "BUY") {
        const reservedAmount = Math.round(qty * limitPrice * 100) / 100;

        // Atomically reserve funds (guarantees balance >= reservedAmount)
        const updatedUser = await reserveFundsAtomic(user._id, reservedAmount, session);
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds to place limit order. Required: ₹${reservedAmount.toFixed(2)}.`,
            400,
            "INSUFFICIENT_FUNDS"
          );
        }

        // Check if limit is immediately marketable against current server quote
        if (quote.price <= limitPrice) {
          const executionPrice = quote.price;
          const actualCost = Math.round(qty * executionPrice * 100) / 100;

          // Consume reservation and refund difference
          await consumeReservedFundsAtomic(user._id, reservedAmount, actualCost, session);

          // Update/create holding
          const holding = await applyBuyToHolding(user._id, cleanSymbol, qty, executionPrice, session);

          const executedOrder = new OrdersModel({
            userId: user._id,
            name: cleanSymbol,
            qty,
            price: executionPrice,
            executionPrice,
            limitPrice,
            mode: "BUY",
            orderType: "LIMIT",
            status: "EXECUTED",
            totalValue: actualCost,
            realizedPnL: 0,
            executedAt: new Date(),
          });
          await executedOrder.save({ session });

          orderEventEmitter.emit("order:update", {
            userId: user._id.toString(),
            order: executedOrder,
          });

          return {
            statusCode: 201,
            success: true,
            message: `Limit buy executed immediately @ ₹${executionPrice.toFixed(2)}`,
            data: {
              order: executedOrder,
              holding,
            },
          };
        }

        // Create PENDING limit buy order
        const pendingOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          limitPrice,
          mode: "BUY",
          orderType: "LIMIT",
          status: "PENDING",
          totalValue: reservedAmount,
          realizedPnL: 0,
          executedAt: null,
          cancelledAt: null,
        });
        await pendingOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: pendingOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Limit buy order placed successfully @ ₹${limitPrice.toFixed(2)}. Status: PENDING`,
          data: {
            order: pendingOrder,
          },
        };
      } else if (mode === "SELL") {
        // Atomically reserve shares (guarantees qty - reservedQty >= requestedQty)
        const updatedHolding = await reserveHoldingQtyAtomic(user._id, cleanSymbol, qty, session);
        if (!updatedHolding) {
          throw new AppError(
            `Insufficient available shares to place limit sell order for ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY"
          );
        }

        // Check if limit is immediately marketable
        if (quote.price >= limitPrice) {
          const executionPrice = quote.price;
          const totalProceeds = Math.round(qty * executionPrice * 100) / 100;
          const realizedPnL = Math.round((executionPrice - updatedHolding.avg) * qty * 100) / 100;

          // Consume reserved shares
          const finalHolding = await consumeReservedHoldingQty(user._id, cleanSymbol, qty, executionPrice, session);

          // Credit proceeds
          await creditFunds(user._id, totalProceeds, session);

          const executedOrder = new OrdersModel({
            userId: user._id,
            name: cleanSymbol,
            qty,
            price: executionPrice,
            executionPrice,
            limitPrice,
            mode: "SELL",
            orderType: "LIMIT",
            status: "EXECUTED",
            totalValue: totalProceeds,
            realizedPnL,
            executedAt: new Date(),
          });
          await executedOrder.save({ session });

          orderEventEmitter.emit("order:update", {
            userId: user._id.toString(),
            order: executedOrder,
          });

          return {
            statusCode: 201,
            success: true,
            message: `Limit sell executed immediately @ ₹${executionPrice.toFixed(2)}`,
            data: {
              order: executedOrder,
              holding: finalHolding,
              realizedPnL,
            },
          };
        }

        // Create PENDING limit sell order
        const pendingOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          limitPrice,
          mode: "SELL",
          orderType: "LIMIT",
          status: "PENDING",
          totalValue: Math.round(qty * limitPrice * 100) / 100,
          realizedPnL: 0,
          executedAt: null,
          cancelledAt: null,
        });
        await pendingOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: pendingOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Limit sell order placed successfully @ ₹${limitPrice.toFixed(2)}. Status: PENDING`,
          data: {
            order: pendingOrder,
          },
        };
      }
    }

    throw new AppError("Invalid order type. Supported types: MARKET, LIMIT", 400, "INVALID_ORDER_TYPE");
  });
};

/**
 * Cancel an open PENDING order and release reserved funds/shares
 */
export const cancelOrder = async (orderId, userId) => {
  return runInTransaction(async (session) => {
    // Concurrency check: Atomically transition status from PENDING to CANCELLED
    const cancelledOrder = await OrdersModel.findOneAndUpdate(
      {
        _id: orderId,
        userId,
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      },
      { session, new: true }
    );

    if (!cancelledOrder) {
      // Order is either not found or already in a terminal state
      const existing = await OrdersModel.findOne({ _id: orderId, userId }, null, { session });
      if (!existing) {
        throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
      }
      throw new AppError(
        `Cannot cancel order. Order is already ${existing.status}.`,
        400,
        "INVALID_ORDER_STATE"
      );
    }

    // Release reservations
    if (cancelledOrder.mode === "BUY") {
      const reservedAmount = Math.round(cancelledOrder.qty * cancelledOrder.limitPrice * 100) / 100;
      await releaseReservedFundsAtomic(userId, reservedAmount, session);
    } else if (cancelledOrder.mode === "SELL") {
      await releaseReservedHoldingQtyAtomic(userId, cancelledOrder.name, cancelledOrder.qty, session);
    }

    orderEventEmitter.emit("order:update", {
      userId: userId.toString(),
      order: cancelledOrder,
    });

    return {
      success: true,
      message: "Order cancelled successfully.",
      data: {
        order: cancelledOrder,
      },
    };
  });
};

/**
 * Deterministic evaluation of pending limit orders on price update.
 * Exported directly for deterministic testing without random tick waits.
 */
export const evaluatePendingOrders = async (quote) => {
  if (!quote || !quote.symbol || typeof quote.price !== "number") {
    return [];
  }

  const cleanSymbol = quote.symbol.toUpperCase();
  const currentPrice = quote.price;

  // Find all pending limit orders for this symbol
  const pendingOrders = await OrdersModel.find({
    name: cleanSymbol,
    status: "PENDING",
  }).sort({ createdAt: 1 });

  const executedOrders = [];

  for (const pendingOrder of pendingOrders) {
    const isBuyTrigger = pendingOrder.mode === "BUY" && currentPrice <= pendingOrder.limitPrice;
    const isSellTrigger = pendingOrder.mode === "SELL" && currentPrice >= pendingOrder.limitPrice;

    if (!isBuyTrigger && !isSellTrigger) {
      continue;
    }

    try {
      const result = await runInTransaction(async (session) => {
        // Concurrency-safe transition: ensure status is STILL "PENDING"
        const orderToExecute = await OrdersModel.findOneAndUpdate(
          {
            _id: pendingOrder._id,
            status: "PENDING",
          },
          {
            $set: {
              status: "EXECUTED",
              price: currentPrice,
              executionPrice: currentPrice,
              executedAt: new Date(),
            },
          },
          { session, new: true }
        );

        if (!orderToExecute) {
          // Concurrently cancelled or executed by another evaluation cycle
          return null;
        }

        if (orderToExecute.mode === "BUY") {
          const reservedAmount = Math.round(orderToExecute.qty * orderToExecute.limitPrice * 100) / 100;
          const actualCost = Math.round(orderToExecute.qty * currentPrice * 100) / 100;
          orderToExecute.totalValue = actualCost;
          await orderToExecute.save({ session });

          // Consume reservation and refund surplus
          await consumeReservedFundsAtomic(orderToExecute.userId, reservedAmount, actualCost, session);

          // Update holdings
          await applyBuyToHolding(orderToExecute.userId, orderToExecute.name, orderToExecute.qty, currentPrice, session);
        } else if (orderToExecute.mode === "SELL") {
          const holding = await getHoldingByName(orderToExecute.userId, orderToExecute.name, session);
          const avgCost = holding ? holding.avg : 0;
          const totalProceeds = Math.round(orderToExecute.qty * currentPrice * 100) / 100;
          const realizedPnL = Math.round((currentPrice - avgCost) * orderToExecute.qty * 100) / 100;

          orderToExecute.totalValue = totalProceeds;
          orderToExecute.realizedPnL = realizedPnL;
          await orderToExecute.save({ session });

          // Consume reserved shares
          await consumeReservedHoldingQty(orderToExecute.userId, orderToExecute.name, orderToExecute.qty, currentPrice, session);

          // Credit funds
          await creditFunds(orderToExecute.userId, totalProceeds, session);
        }

        return orderToExecute;
      });

      if (result) {
        executedOrders.push(result);
        orderEventEmitter.emit("order:update", {
          userId: result.userId.toString(),
          order: result,
        });
      }
    } catch (err) {
      console.error(`Failed to execute pending order ${pendingOrder._id}:`, err.message);
    }
  }

  return executedOrders;
};

// Subscribe to marketDataService ticks directly
marketEventEmitter.on("quote:update", (quote) => {
  evaluatePendingOrders(quote).catch((err) => {
    console.error("Error during background pending order evaluation:", err);
  });
});
