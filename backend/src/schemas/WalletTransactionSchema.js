import { Schema } from "mongoose";

const WalletTransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required for wallet transactions"],
      index: true,
    },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL"],
      default: "DEPOSIT",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "PAYMENT_PENDING",
        "PENDING",
        "PROCESSING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "CREATED",
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: [
        "UPI_SIMULATED",
        "BANK_SIMULATED",
        "RAZORPAY_CHECKOUT",
        "INTERNAL_LEDGER",
      ],
      default: "RAZORPAY_CHECKOUT",
    },
    destination: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ["RAZORPAY", "INTERNAL"],
      default: "RAZORPAY",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    currency: {
      type: String,
      default: "INR",
      required: true,
    },
    providerOrderId: {
      type: String,
      trim: true,
    },
    providerPaymentId: {
      type: String,
      trim: true,
    },
    providerEventId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

WalletTransactionSchema.index(
  { providerOrderId: 1 },
  { unique: true, sparse: true },
);
WalletTransactionSchema.index(
  { providerPaymentId: 1 },
  { unique: true, sparse: true },
);
WalletTransactionSchema.index(
  { providerEventId: 1 },
  { unique: true, sparse: true },
);

export { WalletTransactionSchema };
