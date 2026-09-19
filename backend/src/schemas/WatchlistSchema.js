import { Schema } from "mongoose";

const WatchlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    symbols: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

// Ensure exactly one watchlist document exists per user
WatchlistSchema.index({ userId: 1 }, { unique: true });

export { WatchlistSchema };
