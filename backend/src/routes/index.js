import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import fundRoutes from "./fundRoutes.js";
import holdingRoutes from "./holdingRoutes.js";
import positionRoutes from "./positionRoutes.js";
import orderRoutes from "./orderRoutes.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// 1. Public routes (Health checks and Authentication)
router.use(healthRoutes);
router.use(authRoutes);

// 2. Protected routes (require valid JWT session)
router.use(authenticate, fundRoutes);
router.use(authenticate, holdingRoutes);
router.use(authenticate, positionRoutes);
router.use(authenticate, orderRoutes);

export default router;
