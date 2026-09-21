import crypto from "crypto";
import Razorpay from "razorpay";
import {
  PAYMENT_PROVIDER,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from "../config/env.js";

/**
 * Isolated Razorpay Payment Gateway Service
 * 
 * Supports:
 * 1. PAYMENT_PROVIDER='razorpay': Official Razorpay Node SDK in TEST MODE.
 *    Throws configuration errors at startup/call time if credentials are missing.
 * 2. PAYMENT_PROVIDER='mock': Explicit mock adapter strictly for CI and automated unit testing.
 * 
 * NEVER exposes RAZORPAY_KEY_SECRET or RAZORPAY_WEBHOOK_SECRET to client code.
 */

let razorpayClient = null;

// Initialize official Razorpay SDK if configured
if (PAYMENT_PROVIDER === "razorpay") {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
} else if (PAYMENT_PROVIDER !== "mock") {
  throw new Error(
    `Unsupported PAYMENT_PROVIDER: '${PAYMENT_PROVIDER}'. Must be 'razorpay' or 'mock'.`
  );
}

/**
 * Ensure credentials are valid when running in razorpay mode
 */
const assertRazorpayConfigured = () => {
  if (PAYMENT_PROVIDER === "razorpay" && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
    throw new Error(
      "Missing Razorpay credentials: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured when PAYMENT_PROVIDER=razorpay."
    );
  }
};

/**
 * Get public Key ID safe for client-side Checkout
 */
export const getPublicKeyId = () => {
  if (PAYMENT_PROVIDER === "mock") {
    return "rzp_test_mock_key_id";
  }
  assertRazorpayConfigured();
  return RAZORPAY_KEY_ID;
};

/**
 * Create an order on the payment gateway
 * @param {Object} params - { amount (in paise), currency ("INR"), receipt, notes }
 * @returns {Promise<Object>} Created order object containing { id, amount, currency, receipt, ... }
 */
export const createOrder = async ({ amount, currency = "INR", receipt, notes = {} }) => {
  if (PAYMENT_PROVIDER === "mock") {
    const mockId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: mockId,
      entity: "order",
      amount,
      currency,
      receipt,
      status: "created",
      notes,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  assertRazorpayConfigured();
  return razorpayClient.orders.create({
    amount: Math.round(amount),
    currency,
    receipt,
    notes,
  });
};

/**
 * Fetch an order from Razorpay
 * @param {string} orderId - Razorpay order ID
 */
export const fetchOrder = async (orderId) => {
  if (PAYMENT_PROVIDER === "mock") {
    return {
      id: orderId,
      entity: "order",
      status: "paid",
    };
  }

  assertRazorpayConfigured();
  return razorpayClient.orders.fetch(orderId);
};

/**
 * Fetch a payment entity from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 */
export const fetchPayment = async (paymentId) => {
  if (PAYMENT_PROVIDER === "mock") {
    return {
      id: paymentId,
      entity: "payment",
      status: "captured",
      currency: "INR",
    };
  }

  assertRazorpayConfigured();
  return razorpayClient.payments.fetch(paymentId);
};

/**
 * Verify HMAC SHA256 payment signature
 * Uses timing-safe equality to prevent side-channel timing attacks
 * 
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) === signature
 * 
 * @param {Object} params - { order_id, payment_id, signature }
 * @returns {boolean}
 */
export const verifyPaymentSignature = ({ order_id, payment_id, signature }) => {
  if (!order_id || !payment_id || !signature) {
    return false;
  }

  if (PAYMENT_PROVIDER === "mock") {
    // In mock mode, validate against mock secret or explicit test signature
    if (signature === "mock_invalid_signature") {
      return false;
    }
    const mockSecret = RAZORPAY_KEY_SECRET || "mock_secret_key_1234567890";
    const expected = crypto
      .createHmac("sha256", mockSecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (signature === expected || signature === "mock_valid_signature") {
      return true;
    }
    return false;
  }

  assertRazorpayConfigured();

  try {
    const payload = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (err) {
    console.error("Error during payment signature verification:", err);
    return false;
  }
};

/**
 * Verify HMAC SHA256 webhook signature
 * @param {Buffer|string} rawBody - Unparsed request body
 * @param {string} signature - Value from x-razorpay-signature header
 * @returns {boolean}
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature) {
    return false;
  }

  const webhookSecret = RAZORPAY_WEBHOOK_SECRET || (PAYMENT_PROVIDER === "mock" ? "mock_webhook_secret" : "");
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET must be configured to verify webhooks.");
  }

  try {
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyBuffer)
      .digest("hex");

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (err) {
    console.error("Error during webhook signature verification:", err);
    return false;
  }
};
