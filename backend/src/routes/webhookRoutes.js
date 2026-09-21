import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/paymentController.js";

const router = Router();

router.post("/webhooks/razorpay", handleRazorpayWebhook);

export default router;
