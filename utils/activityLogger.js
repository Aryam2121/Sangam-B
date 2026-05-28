import { ActivityLog } from "../models/activityLog.model.js";

export const logActivity = async ({
  entityType,
  action,
  entityId,
  title,
  description = "",
  actorName = "System",
  actorId = null,
}) => {
  try {
    if (!entityType || !action || !entityId || !title) return;
    await ActivityLog.create({
      entityType,
      action,
      entityId: String(entityId),
      title,
      description,
      actorName,
      actorId: actorId ? String(actorId) : null,
    });
  } catch {
    // Logging must never break the primary request flow.
  }
};
