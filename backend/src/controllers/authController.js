import * as authService from "../services/authService.js";
import { NODE_ENV } from "../config/env.js";

export const getCookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : NODE_ENV === "production",
  sameSite:
    process.env.COOKIE_SAME_SITE ||
    (NODE_ENV === "production" ? "none" : "lax"),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});

export const signup = async (req, res, next) => {
  try {
    const payload = req.sanitizedSignup || req.body;
    const { user, token } = await authService.signupUser(payload);

    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const payload = req.sanitizedLogin || req.body;
    const { user, token } = await authService.loginUser(payload);

    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

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

export const logout = async (req, res, next) => {
  try {
    const opts = getCookieOptions();
    delete opts.maxAge;
    res.clearCookie("token", opts);

    return res.status(200).json({
      success: true,

      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};
