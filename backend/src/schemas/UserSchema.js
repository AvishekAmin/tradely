import { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    balance: {
      type: Number,
      required: true,
      default: 100000,
      min: [0, "Balance cannot be negative"],
    },
    reservedBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Reserved balance cannot be negative"],
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 100000,
    },
  },
  { timestamps: true }
);

export { UserSchema };
