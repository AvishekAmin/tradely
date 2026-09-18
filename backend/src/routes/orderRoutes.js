import { Router } from "express";
import { getOrders, createOrder } from "../controllers/orderController.js";
import { validateOrder } from "../validators/orderValidator.js";

const router = Router();

router.get("/allOrders", getOrders);
router.post("/newOrder", validateOrder, createOrder);

export default router;
