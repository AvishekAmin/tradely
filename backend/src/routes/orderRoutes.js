import { Router } from "express";
import { getOrders, createOrder, cancelOrder } from "../controllers/orderController.js";
import { validateOrder } from "../validators/orderValidator.js";

const router = Router();

router.get("/allOrders", getOrders);
router.post("/newOrder", validateOrder, createOrder);
router.post("/orders/:orderId/cancel", cancelOrder);

export default router;

