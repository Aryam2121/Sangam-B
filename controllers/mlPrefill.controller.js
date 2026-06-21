import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMlPrefillData = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.query;

  let project = null;
  let task = null;

  if (projectId) {
    project = await Project.findById(projectId).lean();
  }
  if (taskId) {
    task = await Task.findById(taskId).populate("project", "name zone ward district").lean();
    if (!project && task?.project) project = task.project;
  }

  const priorityMap = { Pending: 2, "In Progress": 3, Completed: 1, Submitted: 2 };
  const taskPriority = priorityMap[task?.status] || 2;

  res.status(200).json({
    success: true,
    prefill: {
      task_priority: taskPriority,
      task_complexity: task?.description?.length > 100 ? 4 : 2,
      resources_allocated: project?.resources ? 3 : 1,
      communication_frequency: 3,
      resource_utilization: 0.65,
      complexity_to_priority_ratio: taskPriority > 0 ? 1.2 : 1,
      adjusted_frequency: 2.5,
      delay_factor: task?.dueDate && new Date(task.dueDate) < new Date() ? 1.5 : 0.5,
      site_location: project?.ward || project?.zone || "central",
      department: task?.department || project?.departments?.[0] || "General",
      zone: project?.zone || task?.zone || "",
      ward: project?.ward || task?.ward || "",
      district: project?.district || task?.district || "",
      project_name: project?.name || "",
      task_title: task?.title || "",
    },
  });
});
