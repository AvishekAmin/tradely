import { Router } from "express";
import {
  getAllQuotes,
  getQuoteBySymbol,
} from "../controllers/marketDataController.js";

const router = Router();

// Public read-only market data endpoints (no JWT required)
router.get("/market/quotes", getAllQuotes);
router.get("/market/quotes/:symbol", getQuoteBySymbol);

export default router;
