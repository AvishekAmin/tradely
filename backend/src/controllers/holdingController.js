import * as holdingService from "../services/holdingService.js";

/**
 * Controller to fetch authenticated user's holdings (sorted by name)
 */
export const getHoldings = async (req, res, next) => {
  try {
    const userHoldings = await holdingService.getAllHoldings(req.user._id);
    return res.json(userHoldings);
  } catch (err) {
    next(err);
  }
};
