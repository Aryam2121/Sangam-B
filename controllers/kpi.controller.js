import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Resource } from "../models/resources.model.js";
import { Department } from "../models/department.model.js";
import { InterDeptRequest } from "../models/interDeptRequest.model.js";
import { BudgetEntry } from "../models/budgetEntry.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ADMIN_ROLES } from "../utils/roles.js";

const buildGeoFilter = (query = {}) => {
  const filter = {};
  if (query.zone) filter.zone = String(query.zone);
  if (query.ward) filter.ward = String(query.ward);
  if (query.district) filter.district = String(query.district);
  return filter;
};

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

export const getCityKpis = asyncHandler(async (req, res) => {
  const geoFilter = buildGeoFilter(req.query);
  const departmentFilter = req.query.department ? { department: String(req.query.department) } : {};
  const user = req.user;
  const isScoped =
    user?.department && !ADMIN_ROLES.includes(user.role);

  const projectFilter = { ...geoFilter };
  const taskFilter = { ...geoFilter, ...departmentFilter };

  if (isScoped) {
    projectFilter.$or = [
      { projectAdmin: user.username },
      { workerIds: user.username },
    ];
    taskFilter.department = user.department;
  } else if (req.query.department) {
    taskFilter.department = String(req.query.department);
  }

  const now = new Date();
  const [
    totalProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    onTimeTasks,
    resources,
    lowStockResources,
    departments,
    openRequests,
    budgetAgg,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: "completed" }),
    Task.countDocuments(taskFilter),
    Task.countDocuments({ ...taskFilter, status: "Completed" }),
    Task.countDocuments({
      ...taskFilter,
      status: { $ne: "Completed" },
      dueDate: { $lt: now },
    }),
    Task.countDocuments({
      ...taskFilter,
      status: "Completed",
      dueDate: { $gte: now },
    }),
    Resource.find().select("name stockLevel minStockLevel unitCost"),
    Resource.find({ $expr: { $lte: ["$stockLevel", "$minStockLevel"] } }).select("name stockLevel minStockLevel"),
    Department.find().select("name description"),
    InterDeptRequest.countDocuments({
      status: { $in: ["pending", "in_review"] },
      ...(isScoped ? { $or: [{ fromDepartment: user.department }, { toDepartment: user.department }] } : {}),
    }),
    BudgetEntry.aggregate([
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
  ]);

  const budgetMap = budgetAgg.reduce((acc, row) => {
    acc[row._id] = row.total;
    return acc;
  }, {});

  const deptBreakdown = await Task.aggregate([
    { $match: taskFilter },
    { $group: { _id: "$department", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } } },
    { $sort: { total: -1 } },
    { $limit: 12 },
  ]);

  const wardBreakdown = await Project.aggregate([
    { $match: { ...projectFilter, ward: { $exists: true, $ne: "" } } },
    { $group: { _id: "$ward", count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);

  res.status(200).json({
    success: true,
    filters: { ...geoFilter, department: req.query.department || (isScoped ? user.department : null) },
    kpis: {
      projects: { total: totalProjects, completed: completedProjects, completionRate: pct(completedProjects, totalProjects) },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        onTimeRate: pct(onTimeTasks, completedTasks || 1),
        completionRate: pct(completedTasks, totalTasks),
      },
      interDeptRequests: { open: openRequests },
      budget: {
        allocated: budgetMap.allocation || 0,
        spent: budgetMap.expense || 0,
        utilizationRate: pct(budgetMap.expense || 0, budgetMap.allocation || 1),
      },
      resources: {
        total: resources.length,
        lowStock: lowStockResources.length,
      },
    },
    departmentBreakdown: deptBreakdown.map((row) => ({
      department: row._id || "Unassigned",
      total: row.total,
      completed: row.completed,
      completionRate: pct(row.completed, row.total),
    })),
    wardBreakdown: wardBreakdown.map((row) => ({
      ward: row._id,
      projects: row.count,
      active: row.active,
    })),
    lowStockAlerts: lowStockResources,
    departments,
    generatedAt: new Date().toISOString(),
  });
});

export const exportKpiReport = asyncHandler(async (req, res) => {
  const geoFilter = buildGeoFilter(req.query);
  const projects = await Project.find(geoFilter)
    .select("name status zone ward district budgetAllocated budgetSpent startDate endDate")
    .lean();

  res.status(200).json({
    success: true,
    format: "json",
    exportedAt: new Date().toISOString(),
    rowCount: projects.length,
    rows: projects,
  });
});
