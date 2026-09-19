import { Router } from "express";
import {
  getOrders,
  createOrder,
  cancelOrder,
  createOCOOrder,
  cancelOCOGroup,
} from "../controllers/orderController.js";
import { validateOrder, validateOCO } from "../validators/orderValidator.js";

const router = Router();

router.get("/allOrders", getOrders);
router.post("/newOrder", validateOrder, createOrder);
router.post("/orders/:orderId/cancel", cancelOrder);
router.post("/orders/oco", validateOCO, createOCOOrder);
router.post("/orders/oco/:ocoGroupId/cancel", cancelOCOGroup);

export default router;


