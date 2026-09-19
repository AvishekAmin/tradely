import { Router } from "express";
import {
  getWatchlist,
  addSymbol,
  removeSymbol,
  reorderWatchlist,
} from "../controllers/watchlistController.js";

const router = Router();

router.get("/watchlist", getWatchlist);
router.post("/watchlist", addSymbol);
router.delete("/watchlist/:symbol", removeSymbol);
router.put("/watchlist/reorder", reorderWatchlist);

export default router;
