import { Schema } from "mongoose";

const OrdersSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    mode: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT"],
      default: "MARKET",
    },
    status: {
      type: String,
      enum: ["EXECUTED", "REJECTED"],
      default: "EXECUTED",
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

OrdersSchema.index({ userId: 1, createdAt: -1 });

export { OrdersSchema };
