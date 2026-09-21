import mongoose from "mongoose";

const VALID_METHODS = ["UPI_SIMULATED", "BANK_SIMULATED"];
const FORBIDDEN_FIELDS = ["pin", "password", "otp", "cvv", "cardNumber", "bankingPassword"];

/**
 * Validate incoming withdrawal request
 */
export const validateCreateWithdrawal = (req, res, next) => {
  const { amount, method, destination } = req.body || {};

  // 1. Enforce zero tolerance for sensitive banking credentials
  for (const forbidden of FORBIDDEN_FIELDS) {
    if (req.body && req.body[forbidden] !== undefined) {
      return res.status(400).json({
        success: false,
        code: "SENSITIVE_CREDENTIAL_REJECTED",
        message: `Sensitive credential field '${forbidden}' is strictly forbidden. Tradely never stores or processes banking secrets.`,
      });
    }
  }

  // 2. Amount validation
  if (amount === undefined || amount === null || amount === "") {
    return res.status(400).json({
      success: false,
      code: "MISSING_AMOUNT",
      message: "Withdrawal amount is required.",
    });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      code: "INVALID_AMOUNT",
      message: "Withdrawal amount must be a positive number greater than zero.",
    });
  }

  // 3. Method validation
  if (!method || !VALID_METHODS.includes(method)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_METHOD",
      message: `Withdrawal method must be one of: ${VALID_METHODS.join(", ")}.`,
    });
  }

  // 4. Destination validation
  if (!destination || typeof destination !== "string" || !destination.trim()) {
    return res.status(400).json({
      success: false,
      code: "MISSING_DESTINATION",
      message: "Destination identifier (UPI VPA or Bank Account Number) is required.",
    });
  }

  req.validatedWithdrawal = {
    amount: numericAmount,
    method,
    destination: destination.trim(),
  };

  next();
};

/**
 * Validate withdrawal ID param
 */
export const validateWithdrawalId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_ID_FORMAT",
      message: "Invalid withdrawal ID format.",
    });
  }

  next();
};
