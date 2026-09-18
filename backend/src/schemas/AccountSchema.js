import { Schema } from "mongoose";

const AccountSchema = new Schema(
  {
    balance: {
      type: Number,
      required: true,
      default: 100000, // ₹100,000 initial simulated trading capital
      min: 0,
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 100000,
    },
  },
  { timestamps: true }
);

export { AccountSchema };
