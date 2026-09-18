import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel.js";
import { JWT_SECRET } from "../config/env.js";

/**
 * Authentication middleware to verify JWT from HttpOnly cookie or Bearer header
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from cookie (primary) or Bearer header (fallback)
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

    // 2. Verify JWT signature and expiration
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

    // 3. Verify user exists in database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // 4. Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
