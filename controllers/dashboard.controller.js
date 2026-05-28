import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Resource } from "../models/resources.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeCounts = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || "Unknown"] = row.count;
    return acc;
  }, {});

const formatChartData = (statusMap = {}) =>
  Object.entries(statusMap).map(([name, count]) => ({
    name,
    count,
  }));

const shapeRecentProjects = async (projects = []) => {
  const usernames = [
    ...new Set(
      projects
        .map((project) => project.projectAdmin)
        .filter((value) => typeof value === "string" && value.trim())
    ),
  ];

  const admins = usernames.length
    ? await User.find({ username: { $in: usernames } }).select("username fullName")
    : [];

  const adminMap = admins.reduce((acc, user) => {
    acc[user.username] = user.fullName || user.username;
    return acc;
  }, {});

  return projects.map((project) => {
    const row = project.toObject ? project.toObject() : project;
    return {
      ...row,
      projectAdmin: adminMap[row.projectAdmin] || row.projectAdmin || "-",
    };
  });
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    projectsCount,
    tasksCount,
    resourcesCount,
    usersCount,
    projectStatus,
    taskStatus,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    Project.countDocuments(),
    Task.countDocuments(),
    Resource.countDocuments(),
    User.countDocuments(),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name status startDate projectAdmin"),
    Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "fullName")
      .select("title status dueDate assignedTo"),
  ]);

  const alertTasks = await Task.find({
    status: { $ne: "Completed" },
    dueDate: { $lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
  })
    .limit(3)
    .select("title dueDate status");

  const projectStatusMap = normalizeCounts(projectStatus);
  const taskStatusMap = normalizeCounts(taskStatus);

  res.status(200).json({
    success: true,
    counts: {
      projects: projectsCount,
      tasks: tasksCount,
      resources: resourcesCount,
      users: usersCount,
    },
    status: {
      projects: projectStatusMap,
      tasks: taskStatusMap,
    },
    chartData: formatChartData(projectStatusMap),
    recentProjects: await shapeRecentProjects(recentProjects),
    recentTasks,
    alerts: alertTasks,
  });
});
