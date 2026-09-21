import { sendError } from "../utils/apiResponse.js";

export const notFound = (req, res, next) => {
  return sendError(
    res,
    404,
    "NOT_FOUND",
    `Cannot ${req.method} ${req.originalUrl}`,
  );
};
