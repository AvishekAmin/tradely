import { Router } from "express";
import {
  createWithdrawal,
  getWithdrawals,
  getWithdrawalById,
  cancelWithdrawal,
} from "../controllers/withdrawalController.js";
import {
  validateCreateWithdrawal,
  validateWithdrawalId,
} from "../validators/withdrawalValidator.js";

const router = Router();

// Protected Withdrawal Endpoints
router.post("/withdrawals", validateCreateWithdrawal, createWithdrawal);
router.get("/withdrawals", getWithdrawals);
router.get("/withdrawals/:id", validateWithdrawalId, getWithdrawalById);
router.post("/withdrawals/:id/cancel", validateWithdrawalId, cancelWithdrawal);

export default router;
