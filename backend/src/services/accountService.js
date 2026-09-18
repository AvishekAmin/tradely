import { UserModel } from "../models/UserModel.js";

const DEFAULT_INITIAL_BALANCE = 100000;

/**
 * Get current user funds and margin information
 */
export const getFunds = async (user) => {
  const userId = user._id || user.id;
  const latestUser = await UserModel.findById(userId);
  const u = latestUser || user;

  const initial = u.initialBalance !== undefined ? u.initialBalance : DEFAULT_INITIAL_BALANCE;
  const available = Math.round((u.balance || 0) * 100) / 100;
  const reserved = Math.round((u.reservedBalance || 0) * 100) / 100;
  const total = Math.round((available + reserved) * 100) / 100;

  return {
    balance: available,
    reservedBalance: reserved,
    totalBalance: total,
    initialBalance: initial,
    availableMargin: available,
    usedMargin: Math.max(0, Math.round((initial - total) * 100) / 100),
  };
};

/**
 * Reset user balance to default initial balance
 */
export const resetFunds = async (user, initialAmount = DEFAULT_INITIAL_BALANCE) => {
  const userId = user._id || user.id;
  const updated = await UserModel.findByIdAndUpdate(
    userId,
    {
      balance: initialAmount,
      reservedBalance: 0,
      initialBalance: initialAmount,
    },
    { new: true }
  );
  return updated;
};

/**
 * Atomically reserve funds for a LIMIT BUY order
 * Guarantees balance >= amount at execution time
 */
export const reserveFundsAtomic = async (userId, amount, session = null) => {
  const roundedAmount = Math.round(amount * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  return UserModel.findOneAndUpdate(
    { _id: userId, balance: { $gte: roundedAmount } },
    {
      $inc: {
        balance: -roundedAmount,
        reservedBalance: roundedAmount,
      },
    },
    options
  );
};

/**
 * Atomically release reserved funds on LIMIT BUY order cancellation
 */
export const releaseReservedFundsAtomic = async (userId, amount, session = null) => {
  const roundedAmount = Math.round(amount * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  return UserModel.findOneAndUpdate(
    { _id: userId },
    {
      $inc: {
        balance: roundedAmount,
        reservedBalance: -roundedAmount,
      },
    },
    options
  );
};

/**
 * Atomically consume reserved funds and refund surplus on LIMIT BUY execution
 */
export const consumeReservedFundsAtomic = async (userId, reservedAmount, actualCost, session = null) => {
  const roundedReserved = Math.round(reservedAmount * 100) / 100;
  const roundedActual = Math.round(actualCost * 100) / 100;
  const refund = Math.max(0, Math.round((roundedReserved - roundedActual) * 100) / 100);

  const options = { new: true };
  if (session) options.session = session;

  return UserModel.findOneAndUpdate(
    { _id: userId },
    {
      $inc: {
        reservedBalance: -roundedReserved,
        balance: refund,
      },
    },
    options
  );
};

/**
 * Deduct funds from user account for MARKET BUY
 * Atomically guarantees balance >= amount
 */
export const deductFunds = async (userOrId, amount, session = null) => {
  const userId = userOrId._id || userOrId.id || userOrId;
  const roundedAmount = Math.round(amount * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  return UserModel.findOneAndUpdate(
    { _id: userId, balance: { $gte: roundedAmount } },
    { $inc: { balance: -roundedAmount } },
    options
  );
};

/**
 * Credit funds to user account on SELL order execution
 */
export const creditFunds = async (userOrId, amount, session = null) => {
  const userId = userOrId._id || userOrId.id || userOrId;
  const roundedAmount = Math.round(amount * 100) / 100;
  const options = { new: true };
  if (session) options.session = session;

  return UserModel.findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: roundedAmount } },
    options
  );
};
