import { InterDeptRequest } from "../models/interDeptRequest.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLogger.js";
import { emitWorkspaceEvent, emitToDepartment } from "../utils/socketEmitter.js";
import { ADMIN_ROLES } from "../utils/roles.js";

const SLA_HOURS = { low: 120, medium: 72, high: 48, critical: 24 };

const shapeRequest = (doc) => (doc?.toObject ? doc.toObject() : doc);

export const createInterDeptRequest = asyncHandler(async (req, res) => {
  const { title, description, toDepartment, priority, project, zone, ward, district } = req.body;
  if (!title?.trim() || !toDepartment?.trim()) {
    return res.status(400).json({ success: false, message: "Title and target department are required" });
  }

  const fromDepartment = req.user.department || req.body.fromDepartment || "General";
  const slaHours = SLA_HOURS[priority] || SLA_HOURS.medium;

  const request = await InterDeptRequest.create({
    title: title.trim(),
    description: description || "",
    fromDepartment,
    toDepartment: toDepartment.trim(),
    requestedBy: req.user._id,
    requestedByName: req.user.fullName || req.user.username,
    priority: priority || "medium",
    project: project || undefined,
    zone,
    ward,
    district,
    slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
  });

  await logActivity({
    entityType: "workflow",
    action: "created",
    entityId: request._id,
    title: `Inter-dept request: ${request.title}`,
    description: `${fromDepartment} → ${toDepartment}`,
    actorName: req.user.fullName || req.user.username,
    actorId: req.user._id,
  });

  const payload = { type: "workflow", request: shapeRequest(request) };
  emitToDepartment(toDepartment, "notification", payload);
  emitWorkspaceEvent("workflow:created", payload);

  res.status(201).json({ success: true, request: shapeRequest(request) });
});

export const getInterDeptRequests = asyncHandler(async (req, res) => {
  const filter = {};
  const { status, department } = req.query;

  if (status) filter.status = status;

  if (ADMIN_ROLES.includes(req.user.role)) {
    if (department) {
      filter.$or = [{ fromDepartment: department }, { toDepartment: department }];
    }
  } else if (req.user.department) {
    filter.$or = [{ fromDepartment: req.user.department }, { toDepartment: req.user.department }];
  }

  const requests = await InterDeptRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("requestedBy", "fullName username department")
    .populate("project", "name status");

  res.status(200).json({ success: true, requests });
});

export const updateInterDeptRequest = asyncHandler(async (req, res) => {
  const request = await InterDeptRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  const canManage =
    ADMIN_ROLES.includes(req.user.role) ||
    req.user.department === request.toDepartment ||
    req.user.department === request.fromDepartment;

  if (!canManage) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { status, assignedTo, comment, action } = req.body;

  if (action === "approve" || action === "reject") {
    request.approvals.push({
      userId: req.user._id,
      userName: req.user.fullName || req.user.username,
      action: action === "approve" ? "approved" : "rejected",
      comment: comment || "",
    });
    request.status = action === "approve" ? "approved" : "rejected";
  } else if (status) {
    request.status = status;
  }

  if (assignedTo) request.assignedTo = assignedTo;

  if (request.status === "pending" && action === "approve") {
    request.status = "in_review";
  }

  await request.save();

  await logActivity({
    entityType: "workflow",
    action: action === "approve" ? "approved" : action === "reject" ? "rejected" : "status_changed",
    entityId: request._id,
    title: request.title,
    description: `Status: ${request.status}`,
    actorName: req.user.fullName || req.user.username,
    actorId: req.user._id,
  });

  emitWorkspaceEvent("workflow:updated", { request: shapeRequest(request) });

  res.status(200).json({ success: true, request: shapeRequest(request) });
});

export const escalateOverdueRequests = asyncHandler(async (req, res) => {
  const now = new Date();
  const overdue = await InterDeptRequest.find({
    status: { $in: ["pending", "in_review"] },
    slaDeadline: { $lt: now },
    escalated: false,
  });

  const admins = await User.find({ role: "Main Admin" }).select("_id fullName");

  for (const request of overdue) {
    request.escalated = true;
    request.priority = request.priority === "critical" ? "critical" : "high";
    await request.save();

    await logActivity({
      entityType: "workflow",
      action: "escalated",
      entityId: request._id,
      title: request.title,
      description: "SLA breached — escalated to admin",
      actorName: "System",
    });

    emitWorkspaceEvent("workflow:escalated", { request: shapeRequest(request) });
  }

  res.status(200).json({
    success: true,
    escalated: overdue.length,
    notifiedAdmins: admins.length,
  });
});
