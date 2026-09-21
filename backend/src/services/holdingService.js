import { HoldingsModel } from "../models/HoldingsModel.js";

export const getAllHoldings = async (userId) => {
  return HoldingsModel.find({ userId }).sort({ name: 1 });
};

export const getHoldingByName = async (userId, symbol, session = null) => {
  const options = {};
  if (session) options.session = session;
  return HoldingsModel.findOne(
    { userId, name: symbol.toUpperCase() },
    null,
    options,
  );
};

export const reserveHoldingQtyAtomic = async (
  userId,
  symbol,
  qty,
  session = null,
) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  const options = { new: true };
  if (session) options.session = session;

  return HoldingsModel.findOneAndUpdate(
    {
      userId,
      name: cleanSymbol,
      $expr: {
        $gte: [{ $subtract: ["$qty", { $ifNull: ["$reservedQty", 0] }] }, qty],
      },
    },
    { $inc: { reservedQty: qty } },
    options,
  );
};

export const releaseReservedHoldingQtyAtomic = async (
  userId,
  symbol,
  qty,
  session = null,
) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  const options = { new: true };
  if (session) options.session = session;

  return HoldingsModel.findOneAndUpdate(
    { userId, name: cleanSymbol },
    { $inc: { reservedQty: -qty } },
    options,
  );
};

export const consumeReservedHoldingQty = async (
  userId,
  symbol,
  qty,
  executionPrice,
  session = null,
) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  const options = {};
  if (session) options.session = session;

  const holding = await HoldingsModel.findOne(
    { userId, name: cleanSymbol },
    null,
    options,
  );
  if (!holding) return null;

  const remainingQty = holding.qty - qty;
  const remainingReserved = Math.max(0, (holding.reservedQty || 0) - qty);

  if (remainingQty <= 0 && remainingReserved <= 0) {
    await HoldingsModel.deleteOne({ _id: holding._id }, options);
    return null;
  }

  holding.qty = Math.max(0, remainingQty);
  holding.reservedQty = remainingReserved;
  holding.price = executionPrice;
  if (holding.avg > 0) {
    const netChange = ((executionPrice - holding.avg) / holding.avg) * 100;
    holding.net = (netChange >= 0 ? "+" : "") + netChange.toFixed(2) + "%";
  }
  await holding.save(options);
  return holding;
};

export const deductMarketSellHolding = async (
  userId,
  symbol,
  qty,
  executionPrice,
  session = null,
) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  const options = { new: true };
  if (session) options.session = session;

  const holding = await HoldingsModel.findOneAndUpdate(
    {
      userId,
      name: cleanSymbol,
      $expr: {
        $gte: [{ $subtract: ["$qty", { $ifNull: ["$reservedQty", 0] }] }, qty],
      },
    },
    { $inc: { qty: -qty } },
    options,
  );

  if (!holding) {
    return null;
  }

  if (holding.qty <= 0 && (holding.reservedQty || 0) <= 0) {
    await HoldingsModel.deleteOne({ _id: holding._id }, options);
    return null;
  }

  holding.price = executionPrice;
  if (holding.avg > 0) {
    const netChange = ((executionPrice - holding.avg) / holding.avg) * 100;
    holding.net = (netChange >= 0 ? "+" : "") + netChange.toFixed(2) + "%";
  }
  await holding.save(options);
  return holding;
};

export const applyBuyToHolding = async (
  userId,
  symbol,
  qty,
  price,
  session = null,
) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  const options = {};
  if (session) options.session = session;

  let holding = await HoldingsModel.findOne(
    { userId, name: cleanSymbol },
    null,
    options,
  );

  if (holding) {
    const existingQty = holding.qty;
    const existingAvg = holding.avg;
    const newQty = existingQty + qty;
    const newAvg = (existingQty * existingAvg + qty * price) / newQty;

    holding.qty = newQty;
    holding.avg = Math.round(newAvg * 100) / 100;
    holding.price = price;
    const netChange = ((price - newAvg) / newAvg) * 100;
    holding.net = (netChange >= 0 ? "+" : "") + netChange.toFixed(2) + "%";
    await holding.save(options);
    return holding;
  }

  const created = await HoldingsModel.create(
    [
      {
        userId,
        name: cleanSymbol,
        qty,
        reservedQty: 0,
        avg: price,
        price,
        net: "+0.00%",
        day: "+0.00%",
      },
    ],
    options,
  );
  return created[0];
};
