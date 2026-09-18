import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel.js";
import { AppError } from "../utils/AppError.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

const SALT_ROUNDS = 10;

/**
 * Generate a signed JWT token with minimal identity payload
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user with initial simulated balance of ₹100,000
 */
export const signupUser = async ({ username, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.trim();

  // 1. Check if email already registered
  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      409,
      "EMAIL_EXISTS"
    );
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create user
  const newUser = await UserModel.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    balance: 100000,
    initialBalance: 100000,
  });

  // 4. Generate JWT
  const token = generateToken(newUser);

  // 5. Return safe user object (no passwordHash)
  return {
    user: {
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      balance: newUser.balance,
      initialBalance: newUser.initialBalance,
      createdAt: newUser.createdAt,
    },
    token,
  };
};

/**
 * Authenticate user credentials and return safe user with JWT
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find user by email and explicitly include passwordHash
  const user = await UserModel.findOne({ email: normalizedEmail }).select(
    "+passwordHash"
  );
  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // 3. Generate JWT
  const token = generateToken(user);

  // 4. Return safe user object
  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      balance: user.balance,
      initialBalance: user.initialBalance,
      createdAt: user.createdAt,
    },
    token,
  };
};
