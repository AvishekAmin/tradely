import * as authService from "../services/authService.js";
import { NODE_ENV } from "../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Handle user registration
 */
export const signup = async (req, res, next) => {
  try {
    const payload = req.sanitizedSignup || req.body;
    const { user, token } = await authService.signupUser(payload);

    // Set HttpOnly token cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user login
 */
export const login = async (req, res, next) => {
  try {
    const payload = req.sanitizedLogin || req.body;
    const { user, token } = await authService.loginUser(payload);

    // Set HttpOnly token cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id.toString(),
          username: req.user.username,
          email: req.user.email,
          balance: req.user.balance,
          initialBalance: req.user.initialBalance,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user logout and clear authentication cookie
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};
