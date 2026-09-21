import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} from "../controllers/paymentController.js";
import {
  validateCreatePaymentOrder,
  validateVerifyPayment,
} from "../validators/paymentValidator.js";

const router = Router();

router.post(
  "/payments/create-order",
  validateCreatePaymentOrder,
  createPaymentOrder,
);
router.post("/payments/verify", validateVerifyPayment, verifyPayment);
router.get("/payments/history", getPaymentHistory);

export default router;
