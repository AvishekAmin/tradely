import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/paymentController.js";

const router = Router();

// Public Webhook Endpoint (Protected via cryptographic HMAC SHA256 signature)
router.post("/webhooks/razorpay", handleRazorpayWebhook);

export default router;
