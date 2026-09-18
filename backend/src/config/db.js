import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

/**
 * Connect to MongoDB database
 */
export const connectDB = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
  }

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host || "replica set"}`);
    return conn;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error.message);
    throw error;
  }
};
