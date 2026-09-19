import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import marketDataRoutes from "./marketDataRoutes.js";
import fundRoutes from "./fundRoutes.js";
import holdingRoutes from "./holdingRoutes.js";
import positionRoutes from "./positionRoutes.js";
import orderRoutes from "./orderRoutes.js";
import watchlistRoutes from "./watchlistRoutes.js";
import portfolioRoutes from "./portfolioRoutes.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// 1. Public routes (Health checks, Authentication, and Market Data)
router.use(healthRoutes);
router.use(authRoutes);
router.use(marketDataRoutes);

// 2. Protected routes (require valid JWT session)
router.use(authenticate, fundRoutes);
router.use(authenticate, holdingRoutes);
router.use(authenticate, positionRoutes);
router.use(authenticate, orderRoutes);
router.use(authenticate, watchlistRoutes);
router.use(authenticate, portfolioRoutes);

export default router;
