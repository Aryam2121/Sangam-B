import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ["task", "project", "resource", "bid"],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "assigned", "status_changed"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    actorName: {
      type: String,
      trim: true,
      default: "System",
    },
    actorId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
