import { Schema } from "mongoose";

const OrdersSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      default: null,
    },
    limitPrice: {
      type: Number,
      default: null,
    },
    executionPrice: {
      type: Number,
      default: null,
    },
    mode: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT", "STOP_MARKET", "STOP_LIMIT", "TRAILING_STOP"],
      required: true,
      default: "MARKET",
    },
    status: {
      type: String,
      enum: ["PENDING", "PENDING_STOP", "PENDING_LIMIT", "EXECUTED", "CANCELLED", "REJECTED"],
      required: true,
    },
    stopPrice: {
      type: Number,
      default: null,
    },
    trailPercent: {
      type: Number,
      default: null,
    },
    trailAmount: {
      type: Number,
      default: null,
    },
    highestPrice: {
      type: Number,
      default: null,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    ocoGroupId: {
      type: Schema.Types.ObjectId,
      ref: "ocogroup",
      default: null,
    },
    isOcoShared: {
      type: Boolean,
      default: false,
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
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

OrdersSchema.index({ userId: 1, createdAt: -1 });
OrdersSchema.index({ status: 1, name: 1 });
OrdersSchema.index({ ocoGroupId: 1 });

export { OrdersSchema };
