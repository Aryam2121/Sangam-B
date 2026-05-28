import mongoose from "mongoose";
import { Task } from "../models/tasks.model.js";
import { Project } from "../models/project.model.js";
import { Resource } from "../models/resources.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getWorkerDashboard = asyncHandler(async (req, res) => {
  const userId = req.query.userId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Valid userId is required" });
  }

  const user = await User.findById(userId).select("fullName username role department");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const [myTasks, projectsCount, resourcesCount, allProjects] = await Promise.all([
    Task.find({ assignedTo: userId })
      .populate("project", "name status")
      .sort({ dueDate: 1 })
      .limit(20),
    Project.countDocuments(),
    Resource.countDocuments(),
    Project.find().sort({ updatedAt: -1 }).limit(5).select("name status startDate projectAdmin"),
  ]);

  const statusBreakdown = myTasks.reduce((acc, task) => {
    const key = task.status || "Pending";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusBreakdown).map(([name, count]) => ({ name, count }));

  const alerts = myTasks
    .filter((t) => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 86400000 * 3))
    .slice(0, 5)
    .map((t) => ({
      _id: t._id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      projectName: t.project?.name,
    }));

  res.status(200).json({
    success: true,
    user: {
      fullName: user.fullName,
      username: user.username,
      role: user.role,
    },
    counts: {
      myTasks: myTasks.length,
      projects: projectsCount,
      resources: resourcesCount,
      pending: statusBreakdown.Pending || 0,
      inProgress: statusBreakdown["In Progress"] || 0,
      completed: statusBreakdown.Completed || 0,
    },
    chartData,
    myTasks: myTasks.map((t) => ({
      _id: t._id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      description: t.description,
      projectName: t.project?.name || "—",
    })),
    recentProjects: allProjects,
    alerts,
  });
});
