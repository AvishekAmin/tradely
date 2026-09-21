import { WalletTransactionModel } from "../models/WalletTransactionModel.js";
import { UserModel } from "../models/UserModel.js";
import * as accountService from "./accountService.js";
import { runInTransaction } from "../utils/transactionHelper.js";

/**
 * Mask payment destination for privacy and audit
 * Examples:
 *   "avishek@upi" -> "av****@upi"
 *   "123456789012" -> "****9012"
 */
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

  // Default / Bank account: show only last 4 digits
  if (clean.length > 4) {
    return `****${clean.slice(-4)}`;
  }
  return "****";
};

/**
 * Atomically create a withdrawal request
 * 
 * Concurrency & Double-Spending Protection:
 * Uses an atomic MongoDB conditional update on User document:
 * ($ifNull(balance, 0) - ($ifNull(reservedBalance, 0) + $ifNull(pendingWithdrawalAmount, 0))) >= requestedAmount
 * If multiple concurrent requests arrive, only the combination fitting the available withdrawable cash succeeds.
 * 
 * @param {string|ObjectId} userId
 * @param {Object} payload - { amount, method, destination }
 */
export const createWithdrawal = async (userId, { amount, method, destination }) => {
  const numericAmount = Number(amount);
  if (!numericAmount || isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
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

  // 1. Atomic reservation conditional on withdrawable balance
  // Null-safe expression guards against missing schema fields in existing documents
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
    { returnDocument: "after" }
  );

  if (!updatedUser) {
    throw {
      status: 400,
      code: "INSUFFICIENT_WITHDRAWABLE_FUNDS",
      message: "Requested withdrawal amount exceeds your available withdrawable cash.",
    };
  }

  // 2. Persist WalletTransaction in PENDING state
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
    // Roll back the pending reservation if transaction record creation fails
    console.error("Failed to create WalletTransaction for withdrawal, rolling back reservation:", err);
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { pendingWithdrawalAmount: -normalizedAmount },
    });
    throw {
      status: 500,
      code: "WITHDRAWAL_CREATION_FAILED",
      message: "Failed to create withdrawal request. Reservation rolled back.",
    };
  }

  // 3. Initiate simulated progressive processing in background
  scheduleSimulatedProcessing(transaction._id);

  const funds = await accountService.getFunds(updatedUser);

  return {
    success: true,
    transaction,
    funds,
    message: "Virtual withdrawal requested successfully.",
  };
};

/**
 * Cancel a PENDING withdrawal request
 * 
 * Concurrency Rule (Cancel vs Process Race):
 * Only a withdrawal currently in PENDING state may transition to CANCELLED.
 * If background processing has already transitioned it to PROCESSING or SUCCESS,
 * cancellation is rejected without touching the reservation.
 * 
 * @param {string|ObjectId} userId
 * @param {string} withdrawalId
 */
export const cancelWithdrawal = async (userId, withdrawalId) => {
  return runInTransaction(async (session) => {
    // 1. Atomically transition PENDING -> CANCELLED
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
      { returnDocument: "after", session }
    );

    if (!cancelledTx) {
      // Find existing to report descriptive error
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

    // 2. Atomically release pending withdrawal reservation
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { pendingWithdrawalAmount: -cancelledTx.amount },
      },
      { returnDocument: "after", session }
    );

    const funds = await accountService.getFunds(updatedUser);

    return {
      success: true,
      transaction: cancelledTx,
      funds,
      message: "Virtual withdrawal cancelled successfully. Reservation released.",
    };
  });
};

/**
 * Deterministically process a simulated withdrawal
 * Supports:
 * - targetStatus = "SUCCESS": PENDING -> PROCESSING -> SUCCESS (deducts balance and reservation)
 * - targetStatus = "FAILED": PENDING/PROCESSING -> FAILED (releases reservation, balance unchanged)
 * 
 * Terminal State Immutability:
 * Terminal states (SUCCESS, CANCELLED, FAILED) can never be processed twice.
 * 
 * @param {string|ObjectId} withdrawalId
 * @param {string} targetStatus - "SUCCESS" or "FAILED"
 */
export const processSimulatedWithdrawal = async (withdrawalId, targetStatus = "SUCCESS") => {
  // Step A: Atomically transition PENDING -> PROCESSING (if still in PENDING)
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
    { returnDocument: "after" }
  );

  // If not in PENDING, fetch existing to check if already PROCESSING or terminal
  if (!tx) {
    tx = await WalletTransactionModel.findById(withdrawalId);
    if (!tx || tx.status !== "PROCESSING") {
      // Terminal state (e.g. CANCELLED, SUCCESS, FAILED) -> abort without touching balance
      return { success: false, reason: "TERMINAL_STATE", status: tx?.status };
    }
  }

  // Step B: Finalize transition inside transaction
  return runInTransaction(async (session) => {
    if (targetStatus === "SUCCESS") {
      // Atomically transition PROCESSING -> SUCCESS
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
        { returnDocument: "after", session }
      );

      if (!completedTx) {
        return { success: false, reason: "ALREADY_FINALIZED" };
      }

      // Atomically decrement pending reservation AND deduct available balance
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: completedTx.userId },
        {
          $inc: {
            pendingWithdrawalAmount: -completedTx.amount,
            balance: -completedTx.amount,
          },
        },
        { returnDocument: "after", session }
      );

      const funds = await accountService.getFunds(updatedUser);

      return {
        success: true,
        transaction: completedTx,
        funds,
        message: "Virtual withdrawal completed successfully.",
      };
    } else {
      // Explicit Failure Path (Safeguard 2): PROCESSING -> FAILED
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
        { returnDocument: "after", session }
      );

      if (!failedTx) {
        return { success: false, reason: "ALREADY_FINALIZED" };
      }

      // Release pending reservation; balance remains untouched
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: failedTx.userId },
        {
          $inc: { pendingWithdrawalAmount: -failedTx.amount },
        },
        { returnDocument: "after", session }
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

/**
 * Schedule background progression for realistic simulated user experience
 * PENDING (1s) -> PROCESSING (2s) -> SUCCESS
 */
export const scheduleSimulatedProcessing = (withdrawalId) => {
  // In automated test environments, allow tests to drive transitions deterministically
  if (process.env.NODE_ENV === "test" || process.env.PAYMENT_PROVIDER === "mock") {
    return;
  }

  setTimeout(async () => {
    try {
      // 1. Move to PROCESSING
      await WalletTransactionModel.findOneAndUpdate(
        { _id: withdrawalId, status: "PENDING" },
        {
          $set: {
            status: "PROCESSING",
            "metadata.processingStartedAt": new Date(),
          },
        }
      );

      // 2. Move to SUCCESS after short delay
      setTimeout(async () => {
        try {
          await processSimulatedWithdrawal(withdrawalId, "SUCCESS");
        } catch (err) {
          console.error(`Simulated withdrawal ${withdrawalId} completion error:`, err);
        }
      }, 2000);
    } catch (err) {
      console.error(`Simulated withdrawal ${withdrawalId} processing step error:`, err);
    }
  }, 1000);
};

/**
 * Startup Crash Recovery (Safeguard 3):
 * Reconciles any stale PENDING or PROCESSING withdrawals left over from server restarts.
 */
export const recoverPendingWithdrawals = async () => {
  try {
    const staleThreshold = new Date(Date.now() - 30 * 1000); // 30 seconds
    const staleWithdrawals = await WalletTransactionModel.find({
      type: "WITHDRAWAL",
      status: { $in: ["PENDING", "PROCESSING"] },
      createdAt: { $lte: staleThreshold },
    });

    for (const tx of staleWithdrawals) {
      console.log(`Reconciling orphaned withdrawal ${tx._id} (${tx.status})...`);
      await processSimulatedWithdrawal(tx._id, "SUCCESS");
    }
  } catch (err) {
    console.warn("Orphaned withdrawal recovery warning:", err.message);
  }
};

/**
 * Get user-scoped withdrawals
 */
export const getWithdrawals = async (userId) => {
  return WalletTransactionModel.find({
    userId,
    type: "WITHDRAWAL",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

/**
 * Get specific withdrawal by ID with strict user authorization
 */
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
