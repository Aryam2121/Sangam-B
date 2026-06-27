import { ActivityLog } from "../models/activityLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActivityTimeline = asyncHandler(async (req, res) => {
  const limitRaw = Number(req.query.limit || 40);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 40;
  const entityType = req.query.entityType ? String(req.query.entityType) : null;
  const entityId = req.query.entityId ? String(req.query.entityId) : null;

  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  const items = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  res.status(200).json({ timeline: items });
});
