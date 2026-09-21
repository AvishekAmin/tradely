import * as positionService from "../services/positionService.js";

export const getPositions = async (req, res, next) => {
  try {
    const userPositions = await positionService.getAllPositions(req.user._id);
    return res.json(userPositions);
  } catch (err) {
    next(err);
  }
};
