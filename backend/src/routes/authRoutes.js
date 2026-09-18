import { Router } from "express";
import { signup, login, getMe, logout } from "../controllers/authController.js";
import { validateSignup, validateLogin } from "../validators/authValidator.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/auth/signup", validateSignup, signup);
router.post("/auth/login", validateLogin, login);
router.get("/auth/me", authenticate, getMe);
router.post("/auth/logout", logout);

export default router;
