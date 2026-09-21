import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel.js";
import { AppError } from "../utils/AppError.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

const SALT_ROUNDS = 10;

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

export const signupUser = async ({ username, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.trim();

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(
      "An account with this email already exists.",
      409,
      "EMAIL_EXISTS",
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await UserModel.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    balance: 100000,
    initialBalance: 100000,
  });

  const token = generateToken(newUser);

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

export const loginUser = async ({ username, email, identifier, password }) => {
  const id = (username || email || identifier || "").trim();

  const user = await UserModel.findOne({
    $or: [
      { username: id },
      { email: id.toLowerCase() },
      {
        username: new RegExp(
          `^${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
    ],
  }).select("+passwordHash");

  if (!user) {
    throw new AppError(
      "Invalid username or password",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(
      "Invalid username or password",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const token = generateToken(user);

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
