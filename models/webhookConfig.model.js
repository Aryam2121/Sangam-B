import mongoose, { Schema } from "mongoose";

const webhookConfigSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    events: [{ type: String }],
    active: { type: Boolean, default: true },
    lastTriggeredAt: Date,
    lastStatus: String,
  },
  { timestamps: true }
);

export const WebhookConfig = mongoose.model("WebhookConfig", webhookConfigSchema);
