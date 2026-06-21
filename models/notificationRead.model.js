import mongoose, { Schema } from "mongoose";

const notificationReadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    notificationId: { type: String, required: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export const NotificationRead = mongoose.model("NotificationRead", notificationReadSchema);
