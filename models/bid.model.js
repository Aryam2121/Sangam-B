import mongoose, { Schema } from "mongoose";

const bidSchema = new Schema(
  {
    contractor: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Bid = mongoose.model("Bid", bidSchema);
