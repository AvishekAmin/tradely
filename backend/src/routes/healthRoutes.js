import { Router } from "express";
import { getRoot, getHealth } from "../controllers/healthController.js";

const router = Router();

router.get("/", getRoot);
router.get("/health", getHealth);

export default router;
