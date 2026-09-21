import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel.js";
import { JWT_SECRET } from "../config/env.js";

export const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication is required to access this resource.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token.",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "The user belonging to this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
