import { model } from "mongoose";
import { WalletTransactionSchema } from "../schemas/WalletTransactionSchema.js";

const WalletTransactionModel = model(
  "walletTransaction",
  WalletTransactionSchema,
);

export { WalletTransactionModel };
