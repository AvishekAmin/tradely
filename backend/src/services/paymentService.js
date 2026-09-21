import { WalletTransactionModel } from "../models/WalletTransactionModel.js";
import { UserModel } from "../models/UserModel.js";
import * as razorpayService from "./razorpayService.js";
import * as accountService from "./accountService.js";
import { runInTransaction } from "../utils/transactionHelper.js";

export const MIN_DEPOSIT_INR = 100;
export const MAX_DEPOSIT_INR = 500000;

export const createDepositOrder = async (userId, rawAmount) => {
  const amount = Number(rawAmount);
  if (!amount || isNaN(amount) || !isFinite(amount)) {
    throw {
      status: 400,
      code: "INVALID_AMOUNT",
      message: "Deposit amount must be a valid number.",
    };
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

  const receipt = `rcpt_${Date.now()}_${userId.toString().slice(-6)}`;

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
      dbErr,
    );
    throw {
      status: 500,
      code: "LOCAL_TRANSACTION_CREATION_FAILED",
      message: "Failed to initialize local wallet ledger. Please retry.",
    };
  }

  return {
    orderId: gatewayOrder.id,
    keyId: razorpayService.getPublicKeyId(),
    amount: amountInPaise,
    currency: "INR",
    displayAmount: normalizedAmount,
    receipt,
    transactionId: transaction._id,
  };
};

export const confirmDeposit = async ({
  providerOrderId,
  providerPaymentId = null,
  providerEventId = null,
  signatureVerified = false,
  fetchedPayment = null,
}) => {
  if (!providerOrderId) {
    throw {
      status: 400,
      code: "MISSING_ORDER_ID",
      message: "providerOrderId is required.",
    };
  }

  const transaction = await WalletTransactionModel.findOne({ providerOrderId });
  if (!transaction) {
    throw {
      status: 404,
      code: "TRANSACTION_NOT_FOUND",
      message: "No matching wallet transaction found for this order.",
    };
  }

  if (transaction.status === "SUCCESS") {
    const user = await UserModel.findById(transaction.userId);
    const funds = await accountService.getFunds(user);
    return {
      success: true,
      idempotent: true,
      transaction,
      funds,
      message:
        "Transaction has already been successfully processed and credited.",
    };
  }

  if (["FAILED", "CANCELLED"].includes(transaction.status)) {
    throw {
      status: 400,
      code: "INVALID_TRANSACTION_STATE",
      message: `Cannot confirm payment for transaction in ${transaction.status} status.`,
    };
  }

  if (providerPaymentId) {
    try {
      const paymentInfo =
        fetchedPayment ||
        (await razorpayService.fetchPayment(providerPaymentId));
      if (paymentInfo) {
        if (paymentInfo.currency && paymentInfo.currency !== "INR") {
          throw {
            status: 400,
            code: "CURRENCY_MISMATCH",
            message: "Currency mismatch.",
          };
        }
        if (
          paymentInfo.amount !== undefined &&
          paymentInfo.amount !== Math.round(transaction.amount * 100)
        ) {
          throw {
            status: 400,
            code: "AMOUNT_MISMATCH",
            message: "Payment amount does not match order.",
          };
        }
      }
    } catch (fetchErr) {
      if (fetchErr.status) throw fetchErr;
      console.warn(
        "Could not fetch payment info from gateway, relying on verified signature:",
        fetchErr.message,
      );
    }
  }

  const result = await runInTransaction(async (session) => {
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
      { new: true, session },
    );

    if (!updatedTx) {
      const existingTx = await WalletTransactionModel.findById(
        transaction._id,
      ).session(session);
      const currentUser = await UserModel.findById(transaction.userId).session(
        session,
      );
      return {
        transaction: existingTx,
        user: currentUser,
        alreadyProcessed: true,
      };
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      transaction.userId,
      {
        $inc: { balance: transaction.amount },
      },
      { new: true, session },
    );

    return {
      transaction: updatedTx,
      user: updatedUser,
      alreadyProcessed: false,
    };
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

export const verifyDepositPayment = async (
  userId,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature },
) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw {
      status: 400,
      code: "MISSING_VERIFICATION_FIELDS",
      message:
        "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.",
    };
  }

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

  if (transaction.userId.toString() !== userId.toString()) {
    throw {
      status: 403,
      code: "FORBIDDEN_TRANSACTION",
      message: "You are not authorized to verify this transaction.",
    };
  }

  if (transaction.status === "SUCCESS") {
    return confirmDeposit({
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
    });
  }

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

  return confirmDeposit({
    providerOrderId: razorpay_order_id,
    providerPaymentId: razorpay_payment_id,
    signatureVerified: true,
  });
};

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
      ["SUCCESS", "PROCESSING", "FAILED", "CANCELLED", "REFUNDED"].includes(
        normStatus,
      )
    ) {
      query.status = normStatus;
    }
  }

  return WalletTransactionModel.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

export const failDepositPayment = async ({
  providerOrderId,
  providerPaymentId = null,
  providerEventId = null,
  failureReason = "Payment failed at gateway",
}) => {
  if (!providerOrderId) {
    throw {
      status: 400,
      code: "MISSING_ORDER_ID",
      message: "providerOrderId is required.",
    };
  }

  const transaction = await WalletTransactionModel.findOne({ providerOrderId });
  if (!transaction) {
    throw {
      status: 404,
      code: "TRANSACTION_NOT_FOUND",
      message: "No matching wallet transaction found.",
    };
  }

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
    { new: true },
  );

  return {
    success: true,
    idempotent: false,
    transaction: updatedTx || transaction,
    message:
      "Transaction successfully marked as FAILED based on provider failure signal.",
  };
};

export const processPaymentWebhook = async (
  rawBody,
  signature,
  eventPayload,
) => {
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

  if (eventId) {
    const existingEvent = await WalletTransactionModel.findOne({
      providerEventId: eventId,
    });
    if (existingEvent) {
      return {
        status: "duplicate",
        eventId,
        message: "Event already processed.",
      };
    }
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    const paymentEntity = eventPayload.payload?.payment?.entity;
    const orderId =
      paymentEntity?.order_id || eventPayload.payload?.order?.entity?.id;
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
        failureReason:
          paymentEntity?.error_description || "Payment failed at gateway",
      });
    }
  }

  return { status: "acknowledged", eventType };
};
