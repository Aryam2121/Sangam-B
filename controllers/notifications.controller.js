import { Task } from "../models/tasks.model.js";
import { Project } from "../models/project.model.js";
import { InterDeptRequest } from "../models/interDeptRequest.model.js";
import { Announcement } from "../models/announcement.model.js";
import { NotificationRead } from "../models/notificationRead.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ADMIN_ROLES } from "../utils/roles.js";

const formatTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const buildNotifications = async (user, readSet) => {
  const now = new Date();
  const in72h = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const userId = user._id;
  const dept = user.department;

  const taskFilter = ADMIN_ROLES.includes(user.role)
    ? {}
    : user.role === "Worker"
      ? { assignedTo: userId }
      : dept
        ? { department: dept }
        : {};

  const [overdueTasks, upcomingTasks, recentProjects, workflowItems, announcements] =
    await Promise.all([
      Task.find({ ...taskFilter, status: { $ne: "Completed" }, dueDate: { $lt: now } })
        .sort({ dueDate: 1 })
        .limit(5)
        .select("title status dueDate"),
      Task.find({
        ...taskFilter,
        status: { $ne: "Completed" },
        dueDate: { $gte: now, $lte: in72h },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .select("title status dueDate"),
      Project.find()
        .sort({ updatedAt: -1 })
        .limit(3)
        .select("name status updatedAt"),
      InterDeptRequest.find(
        dept && !ADMIN_ROLES.includes(user.role)
          ? { $or: [{ toDepartment: dept }, { fromDepartment: dept }], status: { $in: ["pending", "in_review"] } }
          : { status: { $in: ["pending", "in_review"] } }
      )
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status fromDepartment toDepartment createdAt"),
      Announcement.find(
        dept && !ADMIN_ROLES.includes(user.role)
          ? { $or: [{ department: null }, { department: dept }] }
          : {}
      )
        .sort({ createdAt: -1 })
        .limit(3)
        .select("title createdAt department"),
    ]);

  return [
    ...overdueTasks.map((task) => ({
      id: `overdue-${task._id}`,
      type: "alert",
      title: "Overdue task",
      description: `${task.title} is past due (${task.status})`,
      time: task.dueDate ? formatTimeAgo(task.dueDate) : "Recently",
      path: "/taskManager",
      read: readSet.has(`overdue-${task._id}`),
    })),
    ...upcomingTasks.map((task) => ({
      id: `upcoming-${task._id}`,
      type: "task",
      title: "Upcoming deadline",
      description: `${task.title} due soon`,
      time: task.dueDate ? formatTimeAgo(task.dueDate) : "Soon",
      path: "/taskManager",
      read: readSet.has(`upcoming-${task._id}`),
    })),
    ...workflowItems.map((item) => ({
      id: `workflow-${item._id}`,
      type: "workflow",
      title: "Inter-dept request",
      description: `${item.fromDepartment} → ${item.toDepartment}: ${item.title}`,
      time: formatTimeAgo(item.createdAt),
      path: "/workflow",
      read: readSet.has(`workflow-${item._id}`),
    })),
    ...announcements.map((item) => ({
      id: `announcement-${item._id}`,
      type: "announcement",
      title: item.department ? `[${item.department}] ${item.title}` : item.title,
      description: "City announcement",
      time: formatTimeAgo(item.createdAt),
      path: "/announcements",
      read: readSet.has(`announcement-${item._id}`),
    })),
    ...recentProjects.map((project) => ({
      id: `project-${project._id}`,
      type: "project",
      title: "Project updated",
      description: `${project.name} — ${project.status}`,
      time: project.updatedAt ? formatTimeAgo(project.updatedAt) : "Recently",
      path: `/project/${project._id}`,
      read: readSet.has(`project-${project._id}`),
    })),
  ].slice(0, 20);
};

export const getNotifications = asyncHandler(async (req, res) => {
  const readRows = await NotificationRead.find({ userId: req.user._id }).select("notificationId").lean();
  const readSet = new Set(readRows.map((r) => r.notificationId));
  const notifications = await buildNotifications(req.user, readSet);
  const unreadCount = notifications.filter((n) => !n.read).length;

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    notifications,
  });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;
  const ids = Array.isArray(notificationIds) ? notificationIds : [];

  if (ids.length === 0) {
    return res.status(400).json({ success: false, message: "notificationIds required" });
  }

  await Promise.all(
    ids.map((notificationId) =>
      NotificationRead.findOneAndUpdate(
        { userId: req.user._id, notificationId },
        { readAt: new Date() },
        { upsert: true, new: true }
      )
    )
  );

  res.status(200).json({ success: true, marked: ids.length });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const readRows = await NotificationRead.find({ userId: req.user._id }).select("notificationId").lean();
  const readSet = new Set(readRows.map((r) => r.notificationId));
  const notifications = await buildNotifications(req.user, readSet);
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  await Promise.all(
    unreadIds.map((notificationId) =>
      NotificationRead.findOneAndUpdate(
        { userId: req.user._id, notificationId },
        { readAt: new Date() },
        { upsert: true }
      )
    )
  );

  res.status(200).json({ success: true, marked: unreadIds.length });
});
