import { Router } from "express";
import { getPositions } from "../controllers/positionController.js";

const router = Router();

router.get("/allPositions", getPositions);

export default router;
