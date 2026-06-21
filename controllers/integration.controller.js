import { WebhookConfig } from "../models/webhookConfig.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ADMIN_ROLES } from "../utils/roles.js";

export const getWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await WebhookConfig.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, webhooks });
});

export const createWebhook = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const { name, url, events, active } = req.body;
  if (!name?.trim() || !url?.trim()) {
    return res.status(400).json({ success: false, message: "Name and URL required" });
  }

  const webhook = await WebhookConfig.create({
    name: name.trim(),
    url: url.trim(),
    events: Array.isArray(events) ? events : ["project.updated", "task.updated"],
    active: active !== false,
  });

  res.status(201).json({ success: true, webhook });
});

export const testWebhook = asyncHandler(async (req, res) => {
  const webhook = await WebhookConfig.findById(req.params.id);
  if (!webhook) {
    return res.status(404).json({ success: false, message: "Webhook not found" });
  }

  const payload = {
    event: "test.ping",
    timestamp: new Date().toISOString(),
    source: "sangam",
    message: "Test webhook from Sangam platform",
  };

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    webhook.lastTriggeredAt = new Date();
    webhook.lastStatus = `${response.status}`;
    await webhook.save();
    res.status(200).json({ success: true, status: response.status, payload });
  } catch (error) {
    webhook.lastStatus = "error";
    await webhook.save();
    res.status(200).json({
      success: false,
      message: error.message,
      simulated: true,
      payload,
    });
  }
});

export const sendIntegrationAlert = asyncHandler(async (req, res) => {
  const { channel, message, recipient } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: "Message required" });
  }

  res.status(200).json({
    success: true,
    simulated: true,
    channel: channel || "email",
    recipient: recipient || "configured-admin@city.gov.in",
    message: message.trim(),
    sentAt: new Date().toISOString(),
    note: "Configure SMTP/SMS provider in production",
  });
});
