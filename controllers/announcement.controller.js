import { Announcement } from "../models/announcement.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLogger.js";
import { emitWorkspaceEvent } from "../utils/socketEmitter.js";
import { ADMIN_ROLES } from "../utils/roles.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = {};
  const { department } = req.query;

  if (department) {
    filter.$or = [{ department: null }, { department }];
  } else if (req.user?.department && !ADMIN_ROLES.includes(req.user.role)) {
    filter.$or = [{ department: null }, { department: req.user.department }];
  }

  const announcements = await Announcement.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, announcements });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role) && req.user.role !== "Officer") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const { title, body, department, pinned } = req.body;
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ success: false, message: "Title and body are required" });
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    body: body.trim(),
    department: department || null,
    pinned: Boolean(pinned),
    authorName: req.user.fullName || req.user.username,
    authorId: req.user._id,
  });

  await logActivity({
    entityType: "announcement",
    action: "created",
    entityId: announcement._id,
    title: announcement.title,
    actorName: req.user.fullName || req.user.username,
    actorId: req.user._id,
  });

  emitWorkspaceEvent("announcement:created", { announcement });

  res.status(201).json({ success: true, announcement });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }

  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  res.status(200).json({ success: true, message: "Deleted" });
});
