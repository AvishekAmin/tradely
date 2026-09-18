import { PositionsModel } from "../models/PositionsModel.js";

/**
 * Fetch all positions for a specific user, sorted alphabetically by name
 */
export const getAllPositions = async (userId) => {
  return PositionsModel.find({ userId }).sort({ name: 1 });
};
