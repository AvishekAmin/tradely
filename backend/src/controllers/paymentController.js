import * as paymentService from "../services/paymentService.js";

/**
 * Initiate Razorpay test mode order creation
 * POST /payments/create-order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const amount = req.validatedAmount !== undefined ? req.validatedAmount : req.body.amount;

    const orderData = await paymentService.createDepositOrder(userId, amount);

    return res.status(201).json({
      success: true,
      data: orderData,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "PAYMENT_ORDER_ERROR",
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * Verify Razorpay payment signature and execute idempotent balance credit
 * POST /payments/verify
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyDepositPayment(userId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return res.json({
      success: true,
      message: result.message,
      data: {
        transaction: result.transaction,
        funds: result.funds,
        idempotent: result.idempotent,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "PAYMENT_VERIFICATION_ERROR",
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * Get authenticated user's wallet transactions
 * GET /payments/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type, status } = req.query;
    const transactions = await paymentService.getWalletTransactions(userId, {
      type,
      status,
    });

    return res.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle incoming Razorpay webhooks
 * POST /webhooks/razorpay
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({
        success: false,
        code: "MISSING_WEBHOOK_SIGNATURE",
        message: "Missing x-razorpay-signature header.",
      });
    }

    const result = await paymentService.processPaymentWebhook(rawBody, signature, req.body);

    return res.status(200).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "WEBHOOK_ERROR",
        message: err.message,
      });
    }
    next(err);
  }
};
