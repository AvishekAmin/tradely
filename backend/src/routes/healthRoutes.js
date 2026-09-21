import { Router } from "express";
import {
  getRoot,
  getHealth,
  getReady,
} from "../controllers/healthController.js";

const router = Router();

router.get("/", getRoot);
router.get("/health", getHealth);
router.get("/ready", getReady);

export default router;
