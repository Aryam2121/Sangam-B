import { ActivityLog } from "../models/activityLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAuditTrail = asyncHandler(async (req, res) => {
  const limitRaw = Number(req.query.limit || 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  const filter = {};

  if (req.query.entityType) filter.entityType = String(req.query.entityType);
  if (req.query.action) filter.action = String(req.query.action);
  if (req.query.actorId) filter.actorId = String(req.query.actorId);
  if (req.query.entityId) filter.entityId = String(req.query.entityId);

  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    count: items.length,
    audit: items,
  });
});

export const getAuditStats = asyncHandler(async (req, res) => {
  const [byEntity, byAction, recentActors] = await Promise.all([
    ActivityLog.aggregate([{ $group: { _id: "$entityType", count: { $sum: 1 } } }]),
    ActivityLog.aggregate([{ $group: { _id: "$action", count: { $sum: 1 } } }]),
    ActivityLog.aggregate([
      { $match: { actorName: { $ne: "System" } } },
      { $group: { _id: "$actorName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    byEntity: byEntity.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
    byAction: byAction.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
    topActors: recentActors.map((row) => ({ name: row._id, count: row.count })),
  });
});
