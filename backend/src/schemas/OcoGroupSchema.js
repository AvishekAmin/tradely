import { Schema } from "mongoose";

const OcoGroupSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    side: {
      type: String,
      enum: ["SELL", "BUY"],
      required: true,
      default: "SELL",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "WON", "CANCELLED"],
      default: "ACTIVE",
    },
    winningOrderId: {
      type: Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    limitOrderId: {
      type: Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    stopOrderId: {
      type: Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    sharedReservation: {
      type: {
        type: String,
        enum: ["SHARES", "FUNDS"],
        default: "SHARES",
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  },
  { timestamps: true },
);

OcoGroupSchema.index({ userId: 1, status: 1 });

export { OcoGroupSchema };
