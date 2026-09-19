import { Router } from "express";
import { getAnalytics } from "../controllers/portfolioController.js";

const router = Router();

router.get("/portfolio/analytics", getAnalytics);

export default router;
