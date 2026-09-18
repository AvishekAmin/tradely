import { Router } from "express";
import { getHoldings } from "../controllers/holdingController.js";

const router = Router();

router.get("/allHoldings", getHoldings);

export default router;
