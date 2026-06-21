import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Resource } from "../models/resources.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ADMIN_ROLES } from "../utils/roles.js";
import { Department } from "../models/department.model.js";

const normalizeCounts = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || "Unknown"] = row.count;
    return acc;
  }, {});

const formatChartData = (statusMap = {}) =>
  Object.entries(statusMap).map(([name, count]) => ({ name, count }));

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

const buildScopedFilters = async (req) => {
  const user = req.user;
  const geoFilter = {};
  if (req.query.zone) geoFilter.zone = String(req.query.zone);
  if (req.query.ward) geoFilter.ward = String(req.query.ward);
  if (req.query.district) geoFilter.district = String(req.query.district);

  if (ADMIN_ROLES.includes(user.role)) {
    return { projectFilter: geoFilter, taskFilter: { ...geoFilter, ...(req.query.department ? { department: req.query.department } : {}) } };
  }

  if (user.role === "Officer" || user.role === "Department Admin") {
    const dept = user.department;
    const deptDoc = dept ? await Department.findOne({ name: dept }).select("_id") : null;
    return {
      projectFilter: {
        ...geoFilter,
        $or: [
          { projectAdmin: user.username },
          ...(deptDoc ? [{ departments: deptDoc._id }] : []),
        ],
      },
      taskFilter: { ...geoFilter, department: dept },
      department: dept,
    };
  }

  if (user.role === "Worker") {
    return {
      projectFilter: { ...geoFilter, workerIds: user.username },
      taskFilter: { ...geoFilter, assignedTo: user._id },
      department: user.department,
    };
  }

  return { projectFilter: geoFilter, taskFilter: geoFilter };
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { projectFilter, taskFilter, department } = await buildScopedFilters(req);

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
    Project.countDocuments(projectFilter),
    Task.countDocuments(taskFilter),
    Resource.countDocuments(),
    ADMIN_ROLES.includes(req.user.role) ? User.countDocuments() : Promise.resolve(null),
    Project.aggregate([{ $match: projectFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: taskFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Project.find(projectFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name status startDate projectAdmin zone ward district"),
    Task.find(taskFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "fullName")
      .select("title status dueDate assignedTo department"),
  ]);

  const alertTasks = await Task.find({
    ...taskFilter,
    status: { $ne: "Completed" },
    dueDate: { $lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
  })
    .limit(5)
    .select("title dueDate status department");

  const projectStatusMap = normalizeCounts(projectStatus);
  const taskStatusMap = normalizeCounts(taskStatus);

  const counts = {
    projects: projectsCount,
    tasks: tasksCount,
    resources: await Resource.countDocuments(),
  };
  if (usersCount != null) counts.users = usersCount;

  res.status(200).json({
    success: true,
    scope: {
      department: department || req.query.department || null,
      role: req.user.role,
    },
    counts,
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
