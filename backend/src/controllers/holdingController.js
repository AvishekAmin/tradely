import * as holdingService from "../services/holdingService.js";

export const getHoldings = async (req, res, next) => {
  try {
    const userHoldings = await holdingService.getAllHoldings(req.user._id);
    return res.json(userHoldings);
  } catch (err) {
    next(err);
  }
};
