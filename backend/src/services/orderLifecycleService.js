import { EventEmitter } from "events";
import { OrdersModel } from "../models/OrdersModel.js";
import { OcoGroupModel } from "../models/OcoGroupModel.js";
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

export const getAllOrders = async (userId) => {
  return OrdersModel.find({ userId }).sort({ createdAt: -1 });
};

export const createOrder = async (orderPayload, user) => {
  const cleanSymbol = (orderPayload.name || "").trim().toUpperCase();
  const qty = Number(orderPayload.qty);
  const mode = (orderPayload.mode || "").toUpperCase();
  const orderType = (orderPayload.orderType || "MARKET").toUpperCase();
  const limitPrice =
    orderPayload.limitPrice !== undefined && orderPayload.limitPrice !== null
      ? Number(orderPayload.limitPrice)
      : null;
  const stopPrice =
    orderPayload.stopPrice !== undefined && orderPayload.stopPrice !== null
      ? Number(orderPayload.stopPrice)
      : null;
  const trailPercent =
    orderPayload.trailPercent !== undefined &&
    orderPayload.trailPercent !== null
      ? Number(orderPayload.trailPercent)
      : null;
  const trailAmount =
    orderPayload.trailAmount !== undefined && orderPayload.trailAmount !== null
      ? Number(orderPayload.trailAmount)
      : null;

  const quote = getQuote(cleanSymbol);
  if (!quote) {
    throw new AppError(
      `Instrument not found in market feed: ${cleanSymbol}`,
      404,
      "INSTRUMENT_NOT_FOUND",
    );
  }

  return runInTransaction(async (session) => {
    if (orderType === "MARKET") {
      const executionPrice = quote.price;

      if (mode === "BUY") {
        const totalCost = Math.round(qty * executionPrice * 100) / 100;
        const updatedUser = await deductFunds(user._id, totalCost, session);
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds. Order requires ₹${totalCost.toFixed(2)}, but available balance is insufficient.`,
            400,
            "INSUFFICIENT_FUNDS",
          );
        }

        const holding = await applyBuyToHolding(
          user._id,
          cleanSymbol,
          qty,
          executionPrice,
          session,
        );

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
          data: { order: executedOrder, balance: updatedUser.balance, holding },
        };
      } else if (mode === "SELL") {
        const executionPrice = quote.price;
        const totalProceeds = Math.round(qty * executionPrice * 100) / 100;

        const holding = await getHoldingByName(user._id, cleanSymbol, session);
        const availableShares = holding
          ? holding.qty - (holding.reservedQty || 0)
          : 0;

        if (!holding || availableShares < qty) {
          throw new AppError(
            `Insufficient available shares. You have ${availableShares} available share(s) of ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY",
          );
        }

        const avgCost = holding.avg || 0;
        const realizedPnL =
          Math.round((executionPrice - avgCost) * qty * 100) / 100;

        const updatedHolding = await deductMarketSellHolding(
          user._id,
          cleanSymbol,
          qty,
          executionPrice,
          session,
        );
        const updatedUser = await creditFunds(user._id, totalProceeds, session);

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

    if (orderType === "LIMIT") {
      if (!limitPrice || limitPrice <= 0) {
        throw new AppError(
          "Limit price must be greater than zero.",
          400,
          "INVALID_LIMIT_PRICE",
        );
      }

      if (mode === "BUY") {
        const reservedAmount = Math.round(qty * limitPrice * 100) / 100;
        const updatedUser = await reserveFundsAtomic(
          user._id,
          reservedAmount,
          session,
        );
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds to place limit order. Required: ₹${reservedAmount.toFixed(2)}.`,
            400,
            "INSUFFICIENT_FUNDS",
          );
        }

        if (quote.price <= limitPrice) {
          const executionPrice = quote.price;
          const actualCost = Math.round(qty * executionPrice * 100) / 100;

          await consumeReservedFundsAtomic(
            user._id,
            reservedAmount,
            actualCost,
            session,
          );
          const holding = await applyBuyToHolding(
            user._id,
            cleanSymbol,
            qty,
            executionPrice,
            session,
          );

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
            data: { order: executedOrder, holding },
          };
        }

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
          data: { order: pendingOrder },
        };
      } else if (mode === "SELL") {
        const updatedHolding = await reserveHoldingQtyAtomic(
          user._id,
          cleanSymbol,
          qty,
          session,
        );
        if (!updatedHolding) {
          throw new AppError(
            `Insufficient available shares to place limit sell order for ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY",
          );
        }

        if (quote.price >= limitPrice) {
          const executionPrice = quote.price;
          const totalProceeds = Math.round(qty * executionPrice * 100) / 100;
          const realizedPnL =
            Math.round((executionPrice - updatedHolding.avg) * qty * 100) / 100;

          const finalHolding = await consumeReservedHoldingQty(
            user._id,
            cleanSymbol,
            qty,
            executionPrice,
            session,
          );
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
            data: { order: executedOrder, holding: finalHolding, realizedPnL },
          };
        }

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
          data: { order: pendingOrder },
        };
      }
    }

    if (orderType === "STOP_MARKET") {
      if (mode === "SELL") {
        const updatedHolding = await reserveHoldingQtyAtomic(
          user._id,
          cleanSymbol,
          qty,
          session,
        );
        if (!updatedHolding) {
          throw new AppError(
            `Insufficient available shares for stop-market order on ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY",
          );
        }

        const stopOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          stopPrice,
          limitPrice: null,
          mode: "SELL",
          orderType: "STOP_MARKET",
          status: "PENDING_STOP",
          totalValue: Math.round(qty * stopPrice * 100) / 100,
          realizedPnL: 0,
        });
        await stopOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: stopOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Stop-market sell order placed. Triggers at or below ₹${stopPrice.toFixed(2)}. Status: PENDING_STOP`,
          data: { order: stopOrder },
        };
      } else if (mode === "BUY") {
        const reservedAmount = Math.round(qty * stopPrice * 1.05 * 100) / 100;
        const updatedUser = await reserveFundsAtomic(
          user._id,
          reservedAmount,
          session,
        );
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds for buy stop-market order (requires ₹${reservedAmount.toFixed(2)} with risk buffer).`,
            400,
            "INSUFFICIENT_FUNDS",
          );
        }

        const stopOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          stopPrice,
          limitPrice: null,
          mode: "BUY",
          orderType: "STOP_MARKET",
          status: "PENDING_STOP",
          totalValue: reservedAmount,
          realizedPnL: 0,
        });
        await stopOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: stopOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Stop-market buy order placed. Triggers at or above ₹${stopPrice.toFixed(2)}. Status: PENDING_STOP`,
          data: { order: stopOrder },
        };
      }
    }

    if (orderType === "STOP_LIMIT") {
      if (mode === "SELL") {
        const updatedHolding = await reserveHoldingQtyAtomic(
          user._id,
          cleanSymbol,
          qty,
          session,
        );
        if (!updatedHolding) {
          throw new AppError(
            `Insufficient available shares for stop-limit order on ${cleanSymbol}.`,
            400,
            "INSUFFICIENT_QUANTITY",
          );
        }

        const stopLimitOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          stopPrice,
          limitPrice,
          mode: "SELL",
          orderType: "STOP_LIMIT",
          status: "PENDING_STOP",
          totalValue: Math.round(qty * limitPrice * 100) / 100,
          realizedPnL: 0,
        });
        await stopLimitOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: stopLimitOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Stop-limit sell order placed. Triggers @ ₹${stopPrice.toFixed(2)}, limit @ ₹${limitPrice.toFixed(2)}. Status: PENDING_STOP`,
          data: { order: stopLimitOrder },
        };
      } else if (mode === "BUY") {
        const reservedAmount = Math.round(qty * limitPrice * 100) / 100;
        const updatedUser = await reserveFundsAtomic(
          user._id,
          reservedAmount,
          session,
        );
        if (!updatedUser) {
          throw new AppError(
            `Insufficient funds for stop-limit buy order. Required: ₹${reservedAmount.toFixed(2)}.`,
            400,
            "INSUFFICIENT_FUNDS",
          );
        }

        const stopLimitOrder = new OrdersModel({
          userId: user._id,
          name: cleanSymbol,
          qty,
          price: null,
          executionPrice: null,
          stopPrice,
          limitPrice,
          mode: "BUY",
          orderType: "STOP_LIMIT",
          status: "PENDING_STOP",
          totalValue: reservedAmount,
          realizedPnL: 0,
        });
        await stopLimitOrder.save({ session });

        orderEventEmitter.emit("order:update", {
          userId: user._id.toString(),
          order: stopLimitOrder,
        });

        return {
          statusCode: 201,
          success: true,
          message: `Stop-limit buy order placed. Triggers @ ₹${stopPrice.toFixed(2)}, limit @ ₹${limitPrice.toFixed(2)}. Status: PENDING_STOP`,
          data: { order: stopLimitOrder },
        };
      }
    }

    if (orderType === "TRAILING_STOP") {
      const updatedHolding = await reserveHoldingQtyAtomic(
        user._id,
        cleanSymbol,
        qty,
        session,
      );
      if (!updatedHolding) {
        throw new AppError(
          `Insufficient available shares for trailing stop order on ${cleanSymbol}.`,
          400,
          "INSUFFICIENT_QUANTITY",
        );
      }

      const initialPeak = quote.price;
      let calculatedStopPrice = 0;
      if (trailPercent) {
        calculatedStopPrice =
          Math.round(initialPeak * (1 - trailPercent / 100) * 100) / 100;
      } else if (trailAmount) {
        calculatedStopPrice =
          Math.round((initialPeak - trailAmount) * 100) / 100;
      }

      const trailingOrder = new OrdersModel({
        userId: user._id,
        name: cleanSymbol,
        qty,
        price: null,
        executionPrice: null,
        stopPrice: calculatedStopPrice,
        highestPrice: initialPeak,
        trailPercent: trailPercent || null,
        trailAmount: trailAmount || null,
        mode: "SELL",
        orderType: "TRAILING_STOP",
        status: "PENDING_STOP",
        totalValue: Math.round(qty * calculatedStopPrice * 100) / 100,
        realizedPnL: 0,
      });
      await trailingOrder.save({ session });

      orderEventEmitter.emit("order:update", {
        userId: user._id.toString(),
        order: trailingOrder,
      });

      return {
        statusCode: 201,
        success: true,
        message: `Trailing stop order placed. Initial stop @ ₹${calculatedStopPrice.toFixed(2)} (Peak: ₹${initialPeak.toFixed(2)}). Status: PENDING_STOP`,
        data: { order: trailingOrder },
      };
    }

    throw new AppError("Invalid order type.", 400, "INVALID_ORDER_TYPE");
  });
};

export const createOCOGroup = async (ocoPayload, user) => {
  const { symbol, qty, takeProfitLimitPrice, stopLossPrice } = ocoPayload;
  const cleanSymbol = symbol.trim().toUpperCase();

  const quote = getQuote(cleanSymbol);
  if (!quote) {
    throw new AppError(
      `Instrument not found in market feed: ${cleanSymbol}`,
      404,
      "INSTRUMENT_NOT_FOUND",
    );
  }

  return runInTransaction(async (session) => {
    const updatedHolding = await reserveHoldingQtyAtomic(
      user._id,
      cleanSymbol,
      qty,
      session,
    );
    if (!updatedHolding) {
      throw new AppError(
        `Insufficient available shares to place OCO order for ${cleanSymbol}.`,
        400,
        "INSUFFICIENT_QUANTITY",
      );
    }

    const ocoGroup = new OcoGroupModel({
      userId: user._id,
      symbol: cleanSymbol,
      side: "SELL",
      quantity: qty,
      status: "ACTIVE",
      sharedReservation: {
        type: "SHARES",
        amount: qty,
      },
    });
    await ocoGroup.save({ session });

    const limitOrder = new OrdersModel({
      userId: user._id,
      name: cleanSymbol,
      qty,
      price: null,
      executionPrice: null,
      limitPrice: takeProfitLimitPrice,
      stopPrice: null,
      mode: "SELL",
      orderType: "LIMIT",
      status: "PENDING",
      totalValue: Math.round(qty * takeProfitLimitPrice * 100) / 100,
      ocoGroupId: ocoGroup._id,
      isOcoShared: true,
      realizedPnL: 0,
    });
    await limitOrder.save({ session });

    const stopOrder = new OrdersModel({
      userId: user._id,
      name: cleanSymbol,
      qty,
      price: null,
      executionPrice: null,
      limitPrice: null,
      stopPrice: stopLossPrice,
      mode: "SELL",
      orderType: "STOP_MARKET",
      status: "PENDING_STOP",
      totalValue: Math.round(qty * stopLossPrice * 100) / 100,
      ocoGroupId: ocoGroup._id,
      isOcoShared: true,
      realizedPnL: 0,
    });
    await stopOrder.save({ session });

    ocoGroup.limitOrderId = limitOrder._id;
    ocoGroup.stopOrderId = stopOrder._id;
    await ocoGroup.save({ session });

    orderEventEmitter.emit("order:update", {
      userId: user._id.toString(),
      order: limitOrder,
    });
    orderEventEmitter.emit("order:update", {
      userId: user._id.toString(),
      order: stopOrder,
    });

    return {
      statusCode: 201,
      success: true,
      message: `OCO group created successfully: Take-Profit @ ₹${takeProfitLimitPrice.toFixed(2)}, Stop-Loss @ ₹${stopLossPrice.toFixed(2)}.`,
      data: {
        ocoGroup,
        limitOrder,
        stopOrder,
      },
    };
  });
};

export const cancelOCOGroup = async (ocoGroupId, userId) => {
  return runInTransaction(async (session) => {
    const claimedGroup = await OcoGroupModel.findOneAndUpdate(
      { _id: ocoGroupId, userId, status: "ACTIVE" },
      { $set: { status: "CANCELLED" } },
      { session, new: true },
    );

    if (!claimedGroup) {
      const existing = await OcoGroupModel.findOne(
        { _id: ocoGroupId, userId },
        null,
        { session },
      );
      if (!existing) {
        throw new AppError("OCO group not found.", 404, "OCO_GROUP_NOT_FOUND");
      }
      throw new AppError(
        `Cannot cancel OCO group. Group is already ${existing.status}.`,
        400,
        "INVALID_OCO_STATE",
      );
    }

    const activeOrders = await OrdersModel.find(
      {
        ocoGroupId,
        userId,
        status: { $in: ["PENDING", "PENDING_STOP", "PENDING_LIMIT"] },
      },
      null,
      { session },
    );

    for (const order of activeOrders) {
      order.status = "CANCELLED";
      order.cancelledAt = new Date();
      await order.save({ session });

      orderEventEmitter.emit("order:update", {
        userId: userId.toString(),
        order,
      });
    }

    if (claimedGroup.sharedReservation?.type === "SHARES") {
      await releaseReservedHoldingQtyAtomic(
        userId,
        claimedGroup.symbol,
        claimedGroup.sharedReservation.amount,
        session,
      );
    } else if (claimedGroup.sharedReservation?.type === "FUNDS") {
      await releaseReservedFundsAtomic(
        userId,
        claimedGroup.sharedReservation.amount,
        session,
      );
    }

    return {
      success: true,
      message:
        "OCO group cancelled successfully and shared reservation released.",
      data: { ocoGroup: claimedGroup },
    };
  });
};

export const cancelOrder = async (orderId, userId) => {
  const existingOrder = await OrdersModel.findOne({ _id: orderId, userId });
  if (!existingOrder) {
    throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
  }

  if (existingOrder.ocoGroupId) {
    return cancelOCOGroup(existingOrder.ocoGroupId, userId);
  }

  return runInTransaction(async (session) => {
    const cancelledOrder = await OrdersModel.findOneAndUpdate(
      {
        _id: orderId,
        userId,
        status: { $in: ["PENDING", "PENDING_STOP", "PENDING_LIMIT"] },
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      },
      { session, new: true },
    );

    if (!cancelledOrder) {
      throw new AppError(
        `Cannot cancel order. Order is already ${existingOrder.status}.`,
        400,
        "INVALID_ORDER_STATE",
      );
    }

    if (cancelledOrder.mode === "BUY") {
      const reservedAmount =
        cancelledOrder.orderType === "STOP_MARKET"
          ? cancelledOrder.totalValue
          : Math.round(
              cancelledOrder.qty *
                (cancelledOrder.limitPrice || cancelledOrder.stopPrice) *
                100,
            ) / 100;
      await releaseReservedFundsAtomic(userId, reservedAmount, session);
    } else if (cancelledOrder.mode === "SELL") {
      await releaseReservedHoldingQtyAtomic(
        userId,
        cancelledOrder.name,
        cancelledOrder.qty,
        session,
      );
    }

    orderEventEmitter.emit("order:update", {
      userId: userId.toString(),
      order: cancelledOrder,
    });

    return {
      success: true,
      message: "Order cancelled successfully.",
      data: { order: cancelledOrder },
    };
  });
};

export const evaluatePendingOrders = async (quote) => {
  if (!quote || !quote.symbol || typeof quote.price !== "number") {
    return [];
  }

  const cleanSymbol = quote.symbol.toUpperCase();
  const currentPrice = quote.price;

  const activeOrders = await OrdersModel.find({
    name: cleanSymbol,
    status: { $in: ["PENDING", "PENDING_STOP", "PENDING_LIMIT"] },
  }).sort({ createdAt: 1 });

  const executedOrders = [];

  for (const order of activeOrders) {
    if (
      order.orderType === "TRAILING_STOP" &&
      order.status === "PENDING_STOP"
    ) {
      if (currentPrice > (order.highestPrice || 0)) {
        order.highestPrice = currentPrice;
        if (order.trailPercent) {
          order.stopPrice =
            Math.round(currentPrice * (1 - order.trailPercent / 100) * 100) /
            100;
        } else if (order.trailAmount) {
          order.stopPrice =
            Math.round((currentPrice - order.trailAmount) * 100) / 100;
        }
        await order.save();
        orderEventEmitter.emit("order:update", {
          userId: order.userId.toString(),
          order,
        });
      }
    }

    if (order.status === "PENDING_STOP") {
      let isTriggered = false;

      if (order.mode === "BUY") {
        isTriggered = currentPrice >= order.stopPrice;
      } else if (order.mode === "SELL") {
        isTriggered = currentPrice <= order.stopPrice;
      }

      if (!isTriggered) {
        continue;
      }

      if (order.orderType === "STOP_LIMIT") {
        try {
          const transitioned = await runInTransaction(async (session) => {
            const updated = await OrdersModel.findOneAndUpdate(
              { _id: order.id, status: "PENDING_STOP" },
              { $set: { status: "PENDING_LIMIT", triggeredAt: new Date() } },
              { session, new: true },
            );
            return updated;
          });

          if (transitioned) {
            order.status = "PENDING_LIMIT";
            order.triggeredAt = transitioned.triggeredAt;
            orderEventEmitter.emit("order:update", {
              userId: order.userId.toString(),
              order: transitioned,
            });
          }
        } catch (err) {
          console.error(
            `Failed to transition STOP_LIMIT order ${order._id}:`,
            err.message,
          );
          continue;
        }

        const isLimitMarketable =
          (order.mode === "BUY" && currentPrice <= order.limitPrice) ||
          (order.mode === "SELL" && currentPrice >= order.limitPrice);

        if (!isLimitMarketable) {
          continue;
        }
      }
    }

    if (order.status === "PENDING" || order.status === "PENDING_LIMIT") {
      const isBuyExec =
        order.mode === "BUY" && currentPrice <= order.limitPrice;
      const isSellExec =
        order.mode === "SELL" && currentPrice >= order.limitPrice;

      if (!isBuyExec && !isSellExec) {
        continue;
      }
    }

    try {
      const executed = await runInTransaction(async (session) => {
        if (order.ocoGroupId) {
          const claimedGroup = await OcoGroupModel.findOneAndUpdate(
            { _id: order.ocoGroupId, status: "ACTIVE" },
            { $set: { status: "WON", winningOrderId: order._id } },
            { session, new: true },
          );

          if (!claimedGroup) {
            return null;
          }

          const cancelledSibling = await OrdersModel.findOneAndUpdate(
            {
              ocoGroupId: order.ocoGroupId,
              _id: { $ne: order._id },
              status: { $in: ["PENDING", "PENDING_STOP", "PENDING_LIMIT"] },
            },
            {
              $set: {
                status: "CANCELLED",
                cancelledAt: new Date(),
              },
            },
            { session, new: true },
          );

          if (cancelledSibling) {
            orderEventEmitter.emit("order:update", {
              userId: order.userId.toString(),
              order: cancelledSibling,
            });
          }
        }

        const orderToExecute = await OrdersModel.findOneAndUpdate(
          {
            _id: order._id,
            status: { $in: ["PENDING", "PENDING_STOP", "PENDING_LIMIT"] },
          },
          {
            $set: {
              status: "EXECUTED",
              price: currentPrice,
              executionPrice: currentPrice,
              executedAt: new Date(),
            },
          },
          { session, new: true },
        );

        if (!orderToExecute) {
          return null;
        }

        if (orderToExecute.mode === "BUY") {
          const reservedAmount = orderToExecute.totalValue;
          const actualCost =
            Math.round(orderToExecute.qty * currentPrice * 100) / 100;
          orderToExecute.totalValue = actualCost;
          await orderToExecute.save({ session });

          await consumeReservedFundsAtomic(
            orderToExecute.userId,
            reservedAmount,
            actualCost,
            session,
          );
          await applyBuyToHolding(
            orderToExecute.userId,
            orderToExecute.name,
            orderToExecute.qty,
            currentPrice,
            session,
          );
        } else if (orderToExecute.mode === "SELL") {
          const holding = await getHoldingByName(
            orderToExecute.userId,
            orderToExecute.name,
            session,
          );
          const avgCost = holding ? holding.avg : 0;
          const totalProceeds =
            Math.round(orderToExecute.qty * currentPrice * 100) / 100;
          const realizedPnL =
            Math.round((currentPrice - avgCost) * orderToExecute.qty * 100) /
            100;

          orderToExecute.totalValue = totalProceeds;
          orderToExecute.realizedPnL = realizedPnL;
          await orderToExecute.save({ session });

          await consumeReservedHoldingQty(
            orderToExecute.userId,
            orderToExecute.name,
            orderToExecute.qty,
            currentPrice,
            session,
          );
          await creditFunds(orderToExecute.userId, totalProceeds, session);
        }

        return orderToExecute;
      });

      if (executed) {
        executedOrders.push(executed);
        orderEventEmitter.emit("order:update", {
          userId: executed.userId.toString(),
          order: executed,
        });
      }
    } catch (err) {
      console.error(`Failed to execute order ${order._id}:`, err.message);
    }
  }

  return executedOrders;
};

marketEventEmitter.on("quote:update", (quote) => {
  evaluatePendingOrders(quote).catch((err) => {
    console.error("Error during conditional pending order evaluation:", err);
  });
});
