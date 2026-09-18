import { Router } from "express";
import { getFunds, resetFunds } from "../controllers/fundController.js";

const router = Router();

router.get("/funds", getFunds);
router.post("/funds/reset", resetFunds);

export default router;
