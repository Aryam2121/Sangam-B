import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Resource } from "../models/resources.model.js";
import { Department } from "../models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) {
    return res.status(200).json({ success: true, query: q, results: [] });
  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const projectQuery = { $or: [{ name: regex }, { description: regex }] };
  if (mongoose.Types.ObjectId.isValid(q)) {
    projectQuery.$or.push({ _id: q });
  }

  const taskQuery = { $or: [{ title: regex }, { description: regex }] };
  if (mongoose.Types.ObjectId.isValid(q)) {
    taskQuery.$or.push({ _id: q });
  }

  const resourceQuery = { $or: [{ name: regex }, { description: regex }, { unit: regex }] };
  if (mongoose.Types.ObjectId.isValid(q)) {
    resourceQuery.$or.push({ _id: q });
  }

  const [projects, tasks, resources, departments] = await Promise.all([
    Project.find(projectQuery)
      .limit(8)
      .select("name status startDate projectAdmin"),
    Task.find(taskQuery)
      .limit(8)
      .populate("assignedTo", "fullName")
      .select("title status dueDate"),
    Resource.find(resourceQuery)
      .limit(8)
      .select("name unit description"),
    Department.find({ $or: [{ name: regex }, { description: regex }] })
      .limit(6)
      .select("name description"),
  ]);

  const results = [
    ...projects.map((p) => ({
      type: "project",
      id: p._id,
      title: p.name,
      subtitle: p.status,
      path: `/project/${p._id}`,
    })),
    ...tasks.map((t) => ({
      type: "task",
      id: t._id,
      title: t.title,
      subtitle: t.status,
      path: "/taskManager",
    })),
    ...resources.map((r) => ({
      type: "resource",
      id: r._id,
      title: r.name,
      subtitle: r.unit,
      path: "/resources",
    })),
    ...departments.map((d) => ({
      type: "department",
      id: d._id,
      title: d.name,
      subtitle: "Department",
      path: "/department",
    })),
  ];

  res.status(200).json({ success: true, query: q, results });
});
