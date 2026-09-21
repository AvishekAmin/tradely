import { WalletTransactionModel } from "../models/WalletTransactionModel.js";
import { UserModel } from "../models/UserModel.js";
import * as razorpayService from "./razorpayService.js";
import * as accountService from "./accountService.js";
import { runInTransaction } from "../utils/transactionHelper.js";

// Sensible bounds for the simulated trading wallet deposits (in INR)
export const MIN_DEPOSIT_INR = 100;
export const MAX_DEPOSIT_INR = 500000;

/**
 * Create a Razorpay test mode deposit order and register pending ledger transaction
 * 
 * Boundary & Reconciliation:
 * Generating order on external gateway and persisting local DB record is subject to external
 * network boundaries. We generate a deterministic receipt, create the order, and persist
 * the local transaction with full error recovery.
 * 
 * @param {string|ObjectId} userId - Authenticated user ID
 * @param {number} rawAmount - Requested deposit amount in INR
 * @returns {Promise<Object>} Safe checkout payload with order ID and public Key ID
 */
export const createDepositOrder = async (userId, rawAmount) => {
  // 1. Amount validation & monetary normalization (2 decimal places)
  const amount = Number(rawAmount);
  if (!amount || isNaN(amount) || !isFinite(amount)) {
    throw { status: 400, code: "INVALID_AMOUNT", message: "Deposit amount must be a valid number." };
  }

  if (amount < MIN_DEPOSIT_INR || amount > MAX_DEPOSIT_INR) {
    throw {
      status: 400,
      code: "AMOUNT_OUT_OF_BOUNDS",
      message: `Deposit amount must be between ₹${MIN_DEPOSIT_INR.toLocaleString("en-IN")} and ₹${MAX_DEPOSIT_INR.toLocaleString("en-IN")}.`,
    };
  }

  const normalizedAmount = Math.round(amount * 100) / 100;
  const amountInPaise = Math.round(normalizedAmount * 100);

  // 2. Deterministic internal receipt for audit and reconciliation
  const receipt = `rcpt_${Date.now()}_${userId.toString().slice(-6)}`;

  // 3. Create Gateway Order in TEST MODE
  let gatewayOrder;
  try {
    gatewayOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: userId.toString(),
        environment: "test_mode",
        purpose: "tradely_wallet_deposit",
      },
    });
  } catch (err) {
    console.error("Failed to create order on payment gateway:", err);
    throw {
      status: 502,
      code: "PAYMENT_GATEWAY_ERROR",
      message: "Unable to initiate payment with the gateway. Please try again.",
    };
  }

  // 4. Persist local WalletTransaction in PAYMENT_PENDING state
  let transaction;
  try {
    transaction = await WalletTransactionModel.create({
      userId,
      type: "DEPOSIT",
      status: "PAYMENT_PENDING",
      provider: "RAZORPAY",
      amount: normalizedAmount,
      currency: "INR",
      providerOrderId: gatewayOrder.id,
      description: `Virtual trading funds deposit via Razorpay`,
      metadata: {
        receipt,
        gatewayCreatedAt: gatewayOrder.created_at,
      },
    });
  } catch (dbErr) {
    console.error(
      `CRITICAL: Gateway order ${gatewayOrder.id} created but failed to persist local transaction:`,
      dbErr
    );
    throw {
      status: 500,
      code: "LOCAL_TRANSACTION_CREATION_FAILED",
      message: "Failed to initialize local wallet ledger. Please retry.",
    };
  }

  // 5. Return strictly safe checkout initialization data (never secrets)
  return {
    orderId: gatewayOrder.id,
    keyId: razorpayService.getPublicKeyId(),
    amount: amountInPaise, // in paise for Razorpay Standard Checkout
    currency: "INR", // server-authoritative
    displayAmount: normalizedAmount,
    receipt,
    transactionId: transaction._id,
  };
};

/**
 * SINGLE PAYMENT CONFIRMATION OPERATION
 * 
 * Crucial Phase 10A Architecture:
 * Both POST /payments/verify and POST /webhooks/razorpay converge strictly on this method.
 * ONLY this operation executes the atomic state transition:
 *   WalletTransaction: PAYMENT_PENDING -> SUCCESS
 *   User: balance += amount
 * 
 * Guarantees strict idempotency: repeated calls for the same order/payment do not duplicate balance credit.
 * 
 * @param {Object} params - { providerOrderId, providerPaymentId, providerEventId, signatureVerified, fetchedPayment }
 * @returns {Promise<Object>} Result containing updated transaction, user, and funds
 */
export const confirmDeposit = async ({
  providerOrderId,
  providerPaymentId = null,
  providerEventId = null,
  signatureVerified = false,
  fetchedPayment = null,
}) => {
  if (!providerOrderId) {
    throw { status: 400, code: "MISSING_ORDER_ID", message: "providerOrderId is required." };
  }

  // 1. Locate local WalletTransaction
  const transaction = await WalletTransactionModel.findOne({ providerOrderId });
  if (!transaction) {
    throw {
      status: 404,
      code: "TRANSACTION_NOT_FOUND",
      message: "No matching wallet transaction found for this order.",
    };
  }

  // 2. Idempotency check: If already SUCCESS, return immediately without re-crediting
  if (transaction.status === "SUCCESS") {
    const user = await UserModel.findById(transaction.userId);
    const funds = await accountService.getFunds(user);
    return {
      success: true,
      idempotent: true,
      transaction,
      funds,
      message: "Transaction has already been successfully processed and credited.",
    };
  }

  if (["FAILED", "CANCELLED"].includes(transaction.status)) {
    throw {
      status: 400,
      code: "INVALID_TRANSACTION_STATE",
      message: `Cannot confirm payment for transaction in ${transaction.status} status.`,
    };
  }

  // 3. Optional: Verify payment attributes with gateway if payment details exist
  if (providerPaymentId) {
    try {
      const paymentInfo = fetchedPayment || (await razorpayService.fetchPayment(providerPaymentId));
      if (paymentInfo) {
        // Enforce server-authoritative currency
        if (paymentInfo.currency && paymentInfo.currency !== "INR") {
          throw { status: 400, code: "CURRENCY_MISMATCH", message: "Currency mismatch." };
        }
        // Enforce exact amount matching in paise
        if (
          paymentInfo.amount !== undefined &&
          paymentInfo.amount !== Math.round(transaction.amount * 100)
        ) {
          throw { status: 400, code: "AMOUNT_MISMATCH", message: "Payment amount does not match order." };
        }
      }
    } catch (fetchErr) {
      if (fetchErr.status) throw fetchErr;
      console.warn("Could not fetch payment info from gateway, relying on verified signature:", fetchErr.message);
    }
  }

  // 4. Atomic MongoDB Transaction: Transition state and increment User.balance
  const result = await runInTransaction(async (session) => {
    // Atomic conditional transition: only if still pending
    const updatedTx = await WalletTransactionModel.findOneAndUpdate(
      {
        _id: transaction._id,
        status: { $in: ["CREATED", "PAYMENT_PENDING"] },
      },
      {
        $set: {
          status: "SUCCESS",
          providerPaymentId: providerPaymentId || transaction.providerPaymentId,
          ...(providerEventId ? { providerEventId } : {}),
          "metadata.confirmedAt": new Date(),
          "metadata.signatureVerified": signatureVerified,
        },
      },
      { new: true, session }
    );

    // If another concurrent thread updated it to SUCCESS, resolve idempotently
    if (!updatedTx) {
      const existingTx = await WalletTransactionModel.findById(transaction._id).session(session);
      const currentUser = await UserModel.findById(transaction.userId).session(session);
      return { transaction: existingTx, user: currentUser, alreadyProcessed: true };
    }

    // Atomically increment user available cash
    const updatedUser = await UserModel.findByIdAndUpdate(
      transaction.userId,
      {
        $inc: { balance: transaction.amount },
      },
      { new: true, session }
    );

    return { transaction: updatedTx, user: updatedUser, alreadyProcessed: false };
  });

  const funds = await accountService.getFunds(result.user);

  return {
    success: true,
    idempotent: result.alreadyProcessed,
    transaction: result.transaction,
    funds,
    message: `₹${transaction.amount.toLocaleString("en-IN")} credited successfully.`,
  };
};

/**
 * Verify client-submitted payment signature and execute confirmation
 * 
 * @param {string|ObjectId} userId - Authenticated user ID (must match transaction owner)
 * @param {Object} payload - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyDepositPayment = async (
  userId,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw {
      status: 400,
      code: "MISSING_VERIFICATION_FIELDS",
      message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.",
    };
  }

  // 1. Locate local transaction and verify ownership
  const transaction = await WalletTransactionModel.findOne({
    providerOrderId: razorpay_order_id,
  });

  if (!transaction) {
    throw {
      status: 404,
      code: "TRANSACTION_NOT_FOUND",
      message: "No transaction found matching this order.",
    };
  }

  // Strict ownership check: User A cannot verify User B's order
  if (transaction.userId.toString() !== userId.toString()) {
    throw {
      status: 403,
      code: "FORBIDDEN_TRANSACTION",
      message: "You are not authorized to verify this transaction.",
    };
  }

  // Idempotency: If already confirmed, return success without re-verification
  if (transaction.status === "SUCCESS") {
    return confirmDeposit({
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
    });
  }

  // 2. Cryptographic signature check: HMAC SHA256 (order_id + "|" + payment_id)
  const isValidSignature = razorpayService.verifyPaymentSignature({
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValidSignature) {
    throw {
      status: 400,
      code: "INVALID_PAYMENT_SIGNATURE",
      message: "Invalid payment signature. Payment cannot be verified.",
    };
  }

  // 3. Delegate to the single confirmation path
  return confirmDeposit({
    providerOrderId: razorpay_order_id,
    providerPaymentId: razorpay_payment_id,
    signatureVerified: true,
  });
};

/**
 * Fetch wallet transactions for the authenticated user with optional filtering
 * 
 * Filter Semantics:
 * - type: "DEPOSIT" | "WITHDRAWAL"
 * - status:
 *   - "PENDING": Grouped pending filter: ["PENDING", "CREATED", "PAYMENT_PENDING"]
 *   - "SUCCESS": "SUCCESS"
 *   - "PROCESSING": "PROCESSING"
 *   - "FAILED": "FAILED"
 *   - "CANCELLED": "CANCELLED"
 *   - "REFUNDED": "REFUNDED"
 * 
 * @param {string|ObjectId} userId
 * @param {Object} [filters={}] - Optional { type, status }
 */
export const getWalletTransactions = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.type && typeof filters.type === "string") {
    const normType = filters.type.trim().toUpperCase();
    if (["DEPOSIT", "WITHDRAWAL"].includes(normType)) {
      query.type = normType;
    }
  }

  if (filters.status && typeof filters.status === "string") {
    const normStatus = filters.status.trim().toUpperCase();
    if (normStatus === "PENDING") {
      query.status = { $in: ["PENDING", "CREATED", "PAYMENT_PENDING"] };
    } else if (
      ["SUCCESS", "PROCESSING", "FAILED", "CANCELLED", "REFUNDED"].includes(normStatus)
    ) {
      query.status = normStatus;
    }
  }

  return WalletTransactionModel.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

/**
 * Authoritative provider-confirmed payment failure transition
 * 
 * Invoked by provider webhooks (e.g. payment.failed) or authoritative gateway reconciliation.
 * Strictly transitions non-terminal deposit transactions (e.g. PAYMENT_PENDING) to FAILED.
 * 
 * @param {Object} params - { providerOrderId, providerPaymentId, providerEventId, failureReason }
 * @returns {Promise<Object>}
 */
export const failDepositPayment = async ({
  providerOrderId,
  providerPaymentId = null,
  providerEventId = null,
  failureReason = "Payment failed at gateway",
}) => {
  if (!providerOrderId) {
    throw { status: 400, code: "MISSING_ORDER_ID", message: "providerOrderId is required." };
  }

  const transaction = await WalletTransactionModel.findOne({ providerOrderId });
  if (!transaction) {
    throw { status: 404, code: "TRANSACTION_NOT_FOUND", message: "No matching wallet transaction found." };
  }

  // Idempotency: Do not mutate terminal SUCCESS transactions
  if (transaction.status === "SUCCESS") {
    return {
      success: false,
      transaction,
      message: "Cannot fail an already successfully confirmed transaction.",
    };
  }

  if (transaction.status === "FAILED") {
    return {
      success: true,
      idempotent: true,
      transaction,
      message: "Transaction is already marked as FAILED.",
    };
  }

  const updatedTx = await WalletTransactionModel.findOneAndUpdate(
    {
      _id: transaction._id,
      status: { $in: ["CREATED", "PAYMENT_PENDING"] },
    },
    {
      $set: {
        status: "FAILED",
        providerPaymentId: providerPaymentId || transaction.providerPaymentId,
        ...(providerEventId ? { providerEventId } : {}),
        "metadata.failureReason": failureReason,
        "metadata.failedAt": new Date(),
      },
    },
    { new: true }
  );

  return {
    success: true,
    idempotent: false,
    transaction: updatedTx || transaction,
    message: "Transaction successfully marked as FAILED based on provider failure signal.",
  };
};

/**
 * Handle Razorpay Webhooks idempotently
 * 
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - Value of x-razorpay-signature header
 * @param {Object} eventPayload - Parsed JSON webhook payload
 */
export const processPaymentWebhook = async (rawBody, signature, eventPayload) => {
  // 1. Verify webhook signature
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    throw {
      status: 400,
      code: "INVALID_WEBHOOK_SIGNATURE",
      message: "Webhook signature verification failed.",
    };
  }

  const eventId = eventPayload?.id || eventPayload?.event_id;
  const eventType = eventPayload?.event;

  // 2. Idempotency via providerEventId
  if (eventId) {
    const existingEvent = await WalletTransactionModel.findOne({
      providerEventId: eventId,
    });
    if (existingEvent) {
      return { status: "duplicate", eventId, message: "Event already processed." };
    }
  }

  // 3. Process payment events
  if (eventType === "payment.captured" || eventType === "order.paid") {
    const paymentEntity = eventPayload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || eventPayload.payload?.order?.entity?.id;
    const paymentId = paymentEntity?.id;

    if (orderId) {
      return confirmDeposit({
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        providerEventId: eventId,
        signatureVerified: true,
        fetchedPayment: paymentEntity,
      });
    }
  } else if (eventType === "payment.failed") {
    const paymentEntity = eventPayload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;
    if (orderId) {
      await failDepositPayment({
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        providerEventId: eventId,
        failureReason: paymentEntity?.error_description || "Payment failed at gateway",
      });
    }
  }

  return { status: "acknowledged", eventType };
};
