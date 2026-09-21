import { Router } from "express";
import {
  getAllQuotes,
  getQuoteBySymbol,
} from "../controllers/marketDataController.js";

const router = Router();

router.get("/market/quotes", getAllQuotes);
router.get("/market/quotes/:symbol", getQuoteBySymbol);

export default router;
