import { Schema } from "mongoose";

const HoldingsSchema = new Schema(
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
      min: 0,
    },
    reservedQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    avg: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    net: {
      type: String,
      default: "0.00%",
    },
    day: {
      type: String,
      default: "0.00%",
    },
  },
  { timestamps: true }
);

HoldingsSchema.index({ userId: 1, name: 1 });

export { HoldingsSchema };
