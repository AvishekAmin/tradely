import {
  MIN_DEPOSIT_INR,
  MAX_DEPOSIT_INR,
} from "../services/paymentService.js";

export const validateCreatePaymentOrder = (req, res, next) => {
  const { amount, currency } = req.body || {};

  if (
    currency !== undefined &&
    currency !== null &&
    String(currency).toUpperCase() !== "INR"
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_CURRENCY",
      message: "Only INR currency is supported by the payment gateway.",
    });
  }

  if (amount === undefined || amount === null || amount === "") {
    return res.status(400).json({
      success: false,
      code: "MISSING_AMOUNT",
      message: "Deposit amount is required.",
    });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_AMOUNT",
      message: "Deposit amount must be a valid numeric value.",
    });
  }

  if (numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      code: "AMOUNT_MUST_BE_POSITIVE",
      message: "Deposit amount must be greater than zero.",
    });
  }

  if (numericAmount < MIN_DEPOSIT_INR || numericAmount > MAX_DEPOSIT_INR) {
    return res.status(400).json({
      success: false,
      code: "AMOUNT_OUT_OF_BOUNDS",
      message: `Deposit amount must be between ₹${MIN_DEPOSIT_INR.toLocaleString("en-IN")} and ₹${MAX_DEPOSIT_INR.toLocaleString("en-IN")}.`,
    });
  }

  req.validatedAmount = numericAmount;
  next();
};

export const validateVerifyPayment = (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body || {};

  if (
    !razorpay_order_id ||
    typeof razorpay_order_id !== "string" ||
    !razorpay_order_id.trim()
  ) {
    return res.status(400).json({
      success: false,
      code: "MISSING_ORDER_ID",
      message: "razorpay_order_id is required.",
    });
  }

  if (
    !razorpay_payment_id ||
    typeof razorpay_payment_id !== "string" ||
    !razorpay_payment_id.trim()
  ) {
    return res.status(400).json({
      success: false,
      code: "MISSING_PAYMENT_ID",
      message: "razorpay_payment_id is required.",
    });
  }

  if (
    !razorpay_signature ||
    typeof razorpay_signature !== "string" ||
    !razorpay_signature.trim()
  ) {
    return res.status(400).json({
      success: false,
      code: "MISSING_SIGNATURE",
      message: "razorpay_signature is required.",
    });
  }

  next();
};
