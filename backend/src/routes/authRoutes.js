import { Router } from "express";
import { signup, login, getMe, logout } from "../controllers/authController.js";
import { validateSignup, validateLogin } from "../validators/authValidator.js";
import { authenticate } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/auth/signup", authRateLimiter, validateSignup, signup);
router.post("/auth/login", authRateLimiter, validateLogin, login);
router.get("/auth/me", authenticate, getMe);
router.post("/auth/logout", logout);


export default router;
