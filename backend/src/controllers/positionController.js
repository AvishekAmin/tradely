import * as positionService from "../services/positionService.js";

/**
 * Controller to fetch authenticated user's positions (sorted by name)
 */
export const getPositions = async (req, res, next) => {
  try {
    const userPositions = await positionService.getAllPositions(req.user._id);
    return res.json(userPositions);
  } catch (err) {
    next(err);
  }
};
