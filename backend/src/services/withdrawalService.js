import { WalletTransactionModel } from "../models/WalletTransactionModel.js";
import { UserModel } from "../models/UserModel.js";
import * as accountService from "./accountService.js";
import { runInTransaction } from "../utils/transactionHelper.js";

export const maskDestination = (method, rawDestination) => {
  if (!rawDestination || typeof rawDestination !== "string") {
    return "****";
  }
  const clean = rawDestination.trim();

  if (method === "UPI_SIMULATED") {
    const atIndex = clean.indexOf("@");
    if (atIndex > 0) {
      const handle = clean.slice(0, atIndex);
      const domain = clean.slice(atIndex);
      if (handle.length <= 2) {
        return `${handle[0]}****${domain}`;
      }
      return `${handle.slice(0, 2)}****${domain}`;
    }
    return `${clean.slice(0, 2)}****`;
  }

  if (clean.length > 4) {
    return `****${clean.slice(-4)}`;
  }
  return "****";
};

export const createWithdrawal = async (
  userId,
  { amount, method, destination },
) => {
  const numericAmount = Number(amount);
  if (
    !numericAmount ||
    isNaN(numericAmount) ||
    !isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw {
      status: 400,
      code: "INVALID_AMOUNT",
      message: "Withdrawal amount must be a positive number.",
    };
  }

  const normalizedAmount = Math.round(numericAmount * 100) / 100;
  const validMethods = ["UPI_SIMULATED", "BANK_SIMULATED"];
  if (!validMethods.includes(method)) {
    throw {
      status: 400,
      code: "INVALID_METHOD",
      message: `Invalid withdrawal method. Must be one of: ${validMethods.join(", ")}.`,
    };
  }

  if (!destination || typeof destination !== "string" || !destination.trim()) {
    throw {
      status: 400,
      code: "INVALID_DESTINATION",
      message: "A destination account or VPA is required.",
    };
  }

  const maskedDest = maskDestination(method, destination);

  const updatedUser = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      $expr: {
        $gte: [
          {
            $subtract: [
              { $ifNull: ["$balance", 0] },
              {
                $add: [
                  { $ifNull: ["$reservedBalance", 0] },
                  { $ifNull: ["$pendingWithdrawalAmount", 0] },
                ],
              },
            ],
          },
          normalizedAmount,
        ],
      },
    },
    {
      $inc: { pendingWithdrawalAmount: normalizedAmount },
    },
    { returnDocument: "after" },
  );

  if (!updatedUser) {
    throw {
      status: 400,
      code: "INSUFFICIENT_WITHDRAWABLE_FUNDS",
      message:
        "Requested withdrawal amount exceeds your available withdrawable cash.",
    };
  }

  let transaction;
  try {
    transaction = await WalletTransactionModel.create({
      userId,
      type: "WITHDRAWAL",
      provider: "INTERNAL",
      status: "PENDING",
      method,
      destination: maskedDest,
      amount: normalizedAmount,
      currency: "INR",
      description: `Simulated virtual withdrawal via ${method === "UPI_SIMULATED" ? "UPI" : "Bank Transfer"}`,
      metadata: {
        requestedAt: new Date(),
        simulated: true,
      },
    });
  } catch (err) {
    console.error(
      "Failed to create WalletTransaction for withdrawal, rolling back reservation:",
      err,
    );
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { pendingWithdrawalAmount: -normalizedAmount },
    });
    throw {
      status: 500,
      code: "WITHDRAWAL_CREATION_FAILED",
      message: "Failed to create withdrawal request. Reservation rolled back.",
    };
  }

  scheduleSimulatedProcessing(transaction._id);

  const funds = await accountService.getFunds(updatedUser);

  return {
    success: true,
    transaction,
    funds,
    message: "Virtual withdrawal requested successfully.",
  };
};

export const cancelWithdrawal = async (userId, withdrawalId) => {
  return runInTransaction(async (session) => {
    const cancelledTx = await WalletTransactionModel.findOneAndUpdate(
      {
        _id: withdrawalId,
        userId,
        type: "WITHDRAWAL",
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
          "metadata.cancelledAt": new Date(),
        },
      },
      { returnDocument: "after", session },
    );

    if (!cancelledTx) {
      const existing = await WalletTransactionModel.findOne({
        _id: withdrawalId,
        userId,
      }).session(session);

      if (!existing) {
        throw {
          status: 404,
          code: "WITHDRAWAL_NOT_FOUND",
          message: "Withdrawal not found or does not belong to you.",
        };
      }

      throw {
        status: 400,
        code: "CANNOT_CANCEL_WITHDRAWAL",
        message: `Cannot cancel withdrawal in ${existing.status} status. Only PENDING withdrawals can be cancelled.`,
      };
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { pendingWithdrawalAmount: -cancelledTx.amount },
      },
      { returnDocument: "after", session },
    );

    const funds = await accountService.getFunds(updatedUser);

    return {
      success: true,
      transaction: cancelledTx,
      funds,
      message:
        "Virtual withdrawal cancelled successfully. Reservation released.",
    };
  });
};

export const processSimulatedWithdrawal = async (
  withdrawalId,
  targetStatus = "SUCCESS",
) => {
  let tx = await WalletTransactionModel.findOneAndUpdate(
    {
      _id: withdrawalId,
      type: "WITHDRAWAL",
      status: "PENDING",
    },
    {
      $set: {
        status: "PROCESSING",
        "metadata.processingStartedAt": new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (!tx) {
    tx = await WalletTransactionModel.findById(withdrawalId);
    if (!tx || tx.status !== "PROCESSING") {
      return { success: false, reason: "TERMINAL_STATE", status: tx?.status };
    }
  }

  return runInTransaction(async (session) => {
    if (targetStatus === "SUCCESS") {
      const completedTx = await WalletTransactionModel.findOneAndUpdate(
        {
          _id: withdrawalId,
          type: "WITHDRAWAL",
          status: "PROCESSING",
        },
        {
          $set: {
            status: "SUCCESS",
            "metadata.completedAt": new Date(),
          },
        },
        { returnDocument: "after", session },
      );

      if (!completedTx) {
        return { success: false, reason: "ALREADY_FINALIZED" };
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: completedTx.userId },
        {
          $inc: {
            pendingWithdrawalAmount: -completedTx.amount,
            balance: -completedTx.amount,
          },
        },
        { returnDocument: "after", session },
      );

      const funds = await accountService.getFunds(updatedUser);

      return {
        success: true,
        transaction: completedTx,
        funds,
        message: "Virtual withdrawal completed successfully.",
      };
    } else {
      const failedTx = await WalletTransactionModel.findOneAndUpdate(
        {
          _id: withdrawalId,
          type: "WITHDRAWAL",
          status: { $in: ["PENDING", "PROCESSING"] },
        },
        {
          $set: {
            status: "FAILED",
            "metadata.failedAt": new Date(),
          },
        },
        { returnDocument: "after", session },
      );

      if (!failedTx) {
        return { success: false, reason: "ALREADY_FINALIZED" };
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: failedTx.userId },
        {
          $inc: { pendingWithdrawalAmount: -failedTx.amount },
        },
        { returnDocument: "after", session },
      );

      const funds = await accountService.getFunds(updatedUser);

      return {
        success: true,
        transaction: failedTx,
        funds,
        message: "Virtual withdrawal marked as failed. Reservation released.",
      };
    }
  });
};

export const scheduleSimulatedProcessing = (withdrawalId) => {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.PAYMENT_PROVIDER === "mock"
  ) {
    return;
  }

  setTimeout(async () => {
    try {
      await WalletTransactionModel.findOneAndUpdate(
        { _id: withdrawalId, status: "PENDING" },
        {
          $set: {
            status: "PROCESSING",
            "metadata.processingStartedAt": new Date(),
          },
        },
      );

      setTimeout(async () => {
        try {
          await processSimulatedWithdrawal(withdrawalId, "SUCCESS");
        } catch (err) {
          console.error(
            `Simulated withdrawal ${withdrawalId} completion error:`,
            err,
          );
        }
      }, 2000);
    } catch (err) {
      console.error(
        `Simulated withdrawal ${withdrawalId} processing step error:`,
        err,
      );
    }
  }, 1000);
};

export const recoverPendingWithdrawals = async () => {
  try {
    const staleThreshold = new Date(Date.now() - 30 * 1000);
    const staleWithdrawals = await WalletTransactionModel.find({
      type: "WITHDRAWAL",
      status: { $in: ["PENDING", "PROCESSING"] },
      createdAt: { $lte: staleThreshold },
    });

    for (const tx of staleWithdrawals) {
      console.log(
        `Reconciling orphaned withdrawal ${tx._id} (${tx.status})...`,
      );
      await processSimulatedWithdrawal(tx._id, "SUCCESS");
    }
  } catch (err) {
    console.warn("Orphaned withdrawal recovery warning:", err.message);
  }
};

export const getWithdrawals = async (userId) => {
  return WalletTransactionModel.find({
    userId,
    type: "WITHDRAWAL",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

export const getWithdrawalById = async (userId, withdrawalId) => {
  const withdrawal = await WalletTransactionModel.findOne({
    _id: withdrawalId,
    userId,
    type: "WITHDRAWAL",
  }).lean();

  if (!withdrawal) {
    throw {
      status: 404,
      code: "WITHDRAWAL_NOT_FOUND",
      message: "Withdrawal not found.",
    };
  }

  return withdrawal;
};
