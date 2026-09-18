const DEFAULT_INITIAL_BALANCE = 100000;

/**
 * Get current user funds and margin information
 */
export const getFunds = async (user) => {
  const initial = user.initialBalance !== undefined ? user.initialBalance : DEFAULT_INITIAL_BALANCE;
  return {
    balance: user.balance,
    initialBalance: initial,
    availableMargin: user.balance,
    usedMargin: Math.max(0, initial - user.balance),
  };
};

/**
 * Reset user balance to default initial balance
 */
export const resetFunds = async (user, initialAmount = DEFAULT_INITIAL_BALANCE) => {
  user.balance = initialAmount;
  user.initialBalance = initialAmount;
  await user.save();
  return user;
};

/**
 * Deduct funds from user account
 */
export const deductFunds = async (user, amount) => {
  const roundedAmount = Math.round(amount * 100) / 100;
  user.balance = Math.round((user.balance - roundedAmount) * 100) / 100;
  await user.save();
  return user;
};

/**
 * Credit funds to user account
 */
export const creditFunds = async (user, amount) => {
  const roundedAmount = Math.round(amount * 100) / 100;
  user.balance = Math.round((user.balance + roundedAmount) * 100) / 100;
  await user.save();
  return user;
};
