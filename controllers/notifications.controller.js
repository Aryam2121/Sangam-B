import { Task } from "../models/tasks.model.js";
import { Project } from "../models/project.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const formatTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export const getNotifications = asyncHandler(async (req, res) => {
  const now = new Date();
  const in72h = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const [overdueTasks, upcomingTasks, recentProjects] = await Promise.all([
    Task.find({ status: { $ne: "Completed" }, dueDate: { $lt: now } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select("title status dueDate"),
    Task.find({
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
  ]);

  const notifications = [
    ...overdueTasks.map((task) => ({
      id: `overdue-${task._id}`,
      type: "alert",
      title: "Overdue task",
      description: `${task.title} is past due (${task.status})`,
      time: task.dueDate ? formatTimeAgo(task.dueDate) : "Recently",
      path: "/taskManager",
    })),
    ...upcomingTasks.map((task) => ({
      id: `upcoming-${task._id}`,
      type: "task",
      title: "Upcoming deadline",
      description: `${task.title} due soon`,
      time: task.dueDate ? formatTimeAgo(task.dueDate) : "Soon",
      path: "/taskManager",
    })),
    ...recentProjects.map((project) => ({
      id: `project-${project._id}`,
      type: "project",
      title: "Project updated",
      description: `${project.name} — ${project.status}`,
      time: project.updatedAt ? formatTimeAgo(project.updatedAt) : "Recently",
      path: `/project/${project._id}`,
    })),
  ].slice(0, 12);

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});
