import { BudgetEntry } from "../models/budgetEntry.model.js";
import { Project } from "../models/project.model.js";
import { Resource } from "../models/resources.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLogger.js";
import { emitWorkspaceEvent } from "../utils/socketEmitter.js";

const syncProjectBudget = async (projectId) => {
  const [allocated, spent] = await Promise.all([
    BudgetEntry.aggregate([
      { $match: { project: projectId, type: "allocation" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    BudgetEntry.aggregate([
      { $match: { project: projectId, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  await Project.findByIdAndUpdate(projectId, {
    budgetAllocated: allocated[0]?.total || 0,
    budgetSpent: spent[0]?.total || 0,
  });
};

export const getBudgetSummary = asyncHandler(async (req, res) => {
  const { projectId, department } = req.query;
  const filter = {};
  if (projectId) filter.project = projectId;
  if (department) filter.department = department;

  const [entries, projects, lowStock] = await Promise.all([
    BudgetEntry.find(filter).sort({ createdAt: -1 }).limit(100).populate("project", "name status"),
    Project.find(projectId ? { _id: projectId } : {})
      .select("name budgetAllocated budgetSpent status zone ward district")
      .limit(50),
    Resource.find({ $expr: { $lte: ["$stockLevel", "$minStockLevel"] } }).select("name stockLevel minStockLevel unitCost"),
  ]);

  const totals = entries.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.amount;
      return acc;
    },
    {}
  );

  const overruns = projects.filter((p) => p.budgetSpent > p.budgetAllocated && p.budgetAllocated > 0);

  res.status(200).json({
    success: true,
    totals: {
      allocated: totals.allocation || 0,
      spent: totals.expense || 0,
      adjustments: totals.adjustment || 0,
    },
    projects,
    entries,
    overruns,
    lowStockResources: lowStock,
  });
});

export const createBudgetEntry = asyncHandler(async (req, res) => {
  const { project, amount, type, category, description, department } = req.body;
  if (!project || amount == null) {
    return res.status(400).json({ success: false, message: "Project and amount are required" });
  }

  const entry = await BudgetEntry.create({
    project,
    amount: Number(amount),
    type: type || "expense",
    category: category || "general",
    description: description || "",
    department: department || req.user.department,
    recordedBy: req.user._id,
    recordedByName: req.user.fullName || req.user.username,
  });

  await syncProjectBudget(project);

  await logActivity({
    entityType: "budget",
    action: "budget_updated",
    entityId: entry._id,
    title: `Budget ${entry.type}: ₹${entry.amount}`,
    description: entry.description,
    actorName: req.user.fullName || req.user.username,
    actorId: req.user._id,
  });

  emitWorkspaceEvent("budget:updated", { entry });

  res.status(201).json({ success: true, entry });
});

export const updateProjectBudgetCap = asyncHandler(async (req, res) => {
  const { budgetAllocated } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    { budgetAllocated: Number(budgetAllocated) || 0 },
    { new: true }
  );

  if (!project) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  res.status(200).json({ success: true, project });
});
