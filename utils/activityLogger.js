import { ActivityLog } from "../models/activityLog.model.js";
import { emitWorkspaceEvent } from "./socketEmitter.js";

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
    emitWorkspaceEvent("activity:new", {
      entityType,
      action,
      entityId: String(entityId),
      title,
      description,
      actorName,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Logging must never break the primary request flow.
  }
};
