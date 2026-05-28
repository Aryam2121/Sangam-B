import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Department } from "../models/department.model.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Resource } from "../models/resources.model.js";
import { Message } from "../models/message.model.js";
import { DiscussionMessage } from "../models/discussionForum.model.js";
import { Path } from "../models/totalpath.model.js";
import { CompletedPath } from "../models/completePath.models.js";

dotenv.config();

const seedPath = path.resolve("./data/seed.json");

const loadSeed = () => {
  const raw = fs.readFileSync(seedPath, "utf-8");
  return JSON.parse(raw);
};

const ensureConnection = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
};

const seed = async () => {
  const payload = loadSeed();
  const shouldReset = process.env.SEED_RESET === "true";
  const size = Number(process.env.SEED_SIZE || 3);
  const projectCount = Number(process.env.SEED_PROJECTS) || Math.max(6, size * 6);
  const taskCount = Number(process.env.SEED_TASKS) || Math.max(24, size * 20);
  const resourceCount = Number(process.env.SEED_RESOURCES) || Math.max(10, size * 8);

  if (shouldReset) {
    await Promise.all([
      Department.deleteMany({}),
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Resource.deleteMany({}),
      Message.deleteMany({}),
      DiscussionMessage.deleteMany({}),
      Path.deleteMany({}),
      CompletedPath.deleteMany({}),
    ]);
  }

  const departmentDocs = await Department.insertMany(payload.departments || []);
  for (let i = 0; i < size; i += 1) {
    await Department.create({
      name: `Dept-${i + 1}`,
      description: `Auto-generated department ${i + 1}.`,
    });
  }

  const allDepartments = await Department.find();
  const departmentsByName = departmentDocs.reduce((acc, dept) => {
    acc[dept.name] = dept;
    return acc;
  }, {});

  const userDocs = [];
  for (const user of payload.users || []) {
    const created = new User({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: user.password,
      role: user.role,
      department: user.department || undefined,
    });
    await created.save();
    userDocs.push(created);
  }
  for (let i = 0; i < size * 8; i += 1) {
    const dept = allDepartments[i % allDepartments.length];
    const role = i % 3 === 0 ? "Officer" : "Worker";
    const created = new User({
      username: `user${i + 1}`,
      email: `user${i + 1}@sangam.local`,
      fullName: `User ${i + 1}`,
      password: "Sangam123",
      role,
      department: dept?.name,
    });
    await created.save();
    userDocs.push(created);
  }
  const usersByUsername = userDocs.reduce((acc, user) => {
    acc[user.username] = user;
    return acc;
  }, {});

  const projectDocs = [];
  const taskDocs = [];
  let taskCounter = 1;

  for (const project of payload.projects || []) {
    const departmentIds = (project.departments || [])
      .map((deptName) => departmentsByName[deptName]?._id)
      .filter(Boolean);

    const workerUsernames = project.workerIds || [];
    const projectDoc = await Project.create({
      name: project.name,
      description: project.description,
      departments: departmentIds,
      resources: project.resources,
      projectAdmin: project.projectAdmin,
      workerIds: workerUsernames,
      taskIds: [],
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
    });

    const tasksForProject = [];
    for (const title of project.taskTitles || []) {
      const assignedUsername = workerUsernames[0] || payload.users?.[0]?.username;
      const assignedUser = usersByUsername[assignedUsername];
      if (!assignedUser) continue;

      const task = await Task.create({
        title,
        taskId: taskCounter++,
        description: `${title} for ${project.name}`,
        assignedTo: assignedUser._id,
        project: projectDoc._id,
        status: "Pending",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      });
      tasksForProject.push(task._id);
      taskDocs.push(task);
    }

    projectDoc.taskIds = tasksForProject;
    await projectDoc.save();
    projectDocs.push(projectDoc);
  }

  // Auto-generate projects
  for (let i = 0; i < projectCount; i += 1) {
    const departmentIds = allDepartments
      .slice(i % allDepartments.length, (i % allDepartments.length) + 2)
      .map((dept) => dept._id);
    const workerUsernames = userDocs
      .filter((user) => user.role !== "Main Admin")
      .slice(i, i + 3)
      .map((user) => user.username);
    const admin = userDocs.find((user) => user.role === "Department Admin") || userDocs[0];

    const projectDoc = await Project.create({
      name: `Project ${i + 1}`,
      description: `Auto-generated project ${i + 1} for functional testing.`,
      departments: departmentIds,
      resources: "Steel, Concrete, Sensors",
      projectAdmin: admin?.username || "mainadmin",
      workerIds: workerUsernames,
      taskIds: [],
      status: i % 3 === 0 ? "completed" : i % 2 === 0 ? "pending" : "active",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 2)),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (i + 14)),
    });

    projectDocs.push(projectDoc);
  }

  // Auto-generate tasks and attach to projects
  for (let i = 0; i < taskCount; i += 1) {
    const project = projectDocs[i % projectDocs.length];
    const assignedUser = userDocs.find((user) => user.role === "Worker") || userDocs[0];
    const task = await Task.create({
      title: `Task ${i + 1}`,
      taskId: taskCounter++,
      description: `Auto-generated task ${i + 1} for ${project.name}.`,
      assignedTo: assignedUser._id,
      project: project._id,
      status: i % 4 === 0 ? "Completed" : i % 3 === 0 ? "In Progress" : "Pending",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (i + 2)),
    });
    taskDocs.push(task);
    project.taskIds.push(task._id);
    await project.save();
  }

  for (const resource of payload.resources || []) {
    const assignments = [];
    if (resource.assignToProject) {
      const project = projectDocs.find((proj) => proj.name === resource.assignToProject);
      if (project) {
        assignments.push({ project: project._id, quantity: resource.quantity || 0 });
      }
    }

    await Resource.create({
      name: resource.name,
      description: resource.description,
      unit: resource.unit,
      assignments,
    });
  }

  for (let i = 0; i < resourceCount; i += 1) {
    const project = projectDocs[i % projectDocs.length];
    await Resource.create({
      name: `Resource ${i + 1}`,
      description: `Auto-generated resource ${i + 1}.`,
      unit: i % 2 === 0 ? "units" : "meters",
      assignments: [{ project: project._id, quantity: (i + 1) * 5 }],
    });
  }

  if (payload.chat?.length) {
    await Message.insertMany(payload.chat);
  }

  if (payload.discussion?.length) {
    await DiscussionMessage.insertMany(
      payload.discussion.map((item) => ({
        department: item.department,
        user: item.user,
        content: item.content,
        isFavorite: Boolean(item.isFavorite),
      }))
    );
  }

  // Create GIS path data for each project
  for (const project of projectDocs) {
    const baseLat = 28.61 + Math.random() * 0.1;
    const baseLng = 77.20 + Math.random() * 0.1;
    const points = Array.from({ length: 5 }, (_, index) => ({
      lat: baseLat + index * 0.002,
      lng: baseLng + index * 0.002,
    }));

    await Path.create({
      _id: project._id,
      totalpath: [{ points }],
      timestamp: new Date(),
      distance: 2.5,
    });

    await CompletedPath.create({
      _id: project._id,
      completedPath: [{ points: points.slice(0, 3) }],
      timestamp: new Date(),
      distance: 1.5,
    });
  }

  return {
    departments: departmentDocs.length,
    users: userDocs.length,
    projects: projectDocs.length,
    tasks: taskDocs.length,
    resources: resourceCount,
  };
};

ensureConnection()
  .then(seed)
  .then((result) => {
    console.log("Seed complete:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
