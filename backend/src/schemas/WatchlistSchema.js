import { Schema } from "mongoose";

const WatchlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbols: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

WatchlistSchema.index({ userId: 1 }, { unique: true });

export { WatchlistSchema };
