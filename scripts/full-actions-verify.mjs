/**
 * Tests all major API actions (buttons/forms) per role.
 * Run: node scripts/full-actions-verify.mjs
 */
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";
import { Bid } from "../models/bid.model.js";
import { InterDeptRequest } from "../models/interDeptRequest.model.js";
import { Announcement } from "../models/announcement.model.js";

dotenv.config();

const API = process.env.API_BASE || "http://localhost:3002";
const ROLES = ["mainadmin", "deptadmin", "officer", "worker1"];

function signToken(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  };
  if (user.department) payload.department = user.department;
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
  });
}

async function req(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const results = [];
const log = (action, role, ok, note = "") => {
  results.push({ action, role, ok, note });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} [${role}] ${action}${note ? ` — ${note}` : ""}`);
};

async function main() {
  const health = await req("/healthz");
  if (health.status !== 200) {
    console.error("Backend not running");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const tokens = {};
  for (const username of ROLES) {
    const user = await User.findOne({ username });
    if (user) tokens[user.role] = { user, token: signToken(user) };
  }

  const project = await Project.findOne().lean();
  const task = await Task.findOne().lean();
  const worker = tokens.Worker?.user;

  // --- Read endpoints (all roles) ---
  const reads = [
    ["/api/dashboard/summary", "Dashboard"],
    ["/api/getallprojects", "List projects"],
    ["/api/getalltasks", "List tasks"],
    ["/api/getallresources", "List resources"],
    ["/api/chat/contacts", "Chat contacts"],
    ["/api/discussion/history/Water", "Discussion"],
    ["/api/workflow", "Workflow"],
    ["/api/announcements", "Announcements"],
    ["/api/kpi/city", "City KPI"],
    ["/api/geo/hub", "City map"],
    ["/api/bids", "Bids"],
    ["/api/getallseminars", "Seminars"],
    ["/api/notifications", "Notifications"],
    ["/api/activity/timeline", "Activity"],
    ["/api/ml/prefill", "ML prefill"],
    ["/api/budget/summary", "Budget"],
  ];

  for (const [path, name] of reads) {
    for (const [role, { token }] of Object.entries(tokens)) {
      const { status } = await req(path, { token });
      log(`GET ${name}`, role, status === 200, `status=${status}`);
    }
  }

  // Worker dashboard
  {
    const { status } = await req("/api/worker/dashboard", { token: tokens.Worker.token });
    log("GET Worker dashboard", "Worker", status === 200, `status=${status}`);
  }

  // Admin-only reads
  for (const role of ["Main Admin", "Department Admin", "Officer", "Worker"]) {
    const { status } = await req("/api/audit/trail", { token: tokens[role]?.token });
    const expectedOk = role === "Main Admin" || role === "Department Admin";
    log("GET Audit trail", role, expectedOk ? status === 200 : status === 403, `status=${status}`);
  }

  for (const role of ["Main Admin", "Department Admin", "Officer", "Worker"]) {
    const { status } = await req("/api/integrations/webhooks", { token: tokens[role]?.token });
    const expect = role === "Main Admin" ? 200 : role === "Department Admin" ? 200 : role === "Officer" ? 403 : 403;
    // Actually integrations is adminOnly - Main Admin and Dept Admin
    const expectedOk = role === "Main Admin" || role === "Department Admin";
    log("GET Webhooks", role, expectedOk ? status === 200 : status === 403, `status=${status}`);
  }

  // --- Mutations ---
  // Workflow create (all authenticated)
  for (const role of ["Officer", "Worker"]) {
    const { status, data } = await req("/api/workflow", {
      method: "POST",
      token: tokens[role].token,
      body: { title: `E2E action ${role} ${Date.now()}`, toDepartment: "Roads", description: "test", priority: "low" },
    });
    log("POST Workflow request", role, status === 201, `status=${status}`);
    if (data?.request?._id) {
      await InterDeptRequest.findByIdAndDelete(data.request._id);
    }
  }

  // Workflow approve (officer on Water dept)
  const pendingReq = await InterDeptRequest.findOne({ status: "pending", toDepartment: "Water" });
  if (pendingReq) {
    const { status } = await req(`/api/workflow/${pendingReq._id}`, {
      method: "PATCH",
      token: tokens.Officer.token,
      body: { action: "approve" },
    });
    log("PATCH Workflow approve", "Officer", status === 200, `status=${status}`);
  }

  // Announcement create (managers)
  for (const role of ["Main Admin", "Department Admin", "Officer"]) {
    const { status, data } = await req("/api/announcements", {
      method: "POST",
      token: tokens[role].token,
      body: { title: `E2E ${role}`, body: "Action test announcement" },
    });
    log("POST Announcement", role, status === 201, `status=${status}`);
    if (data?.announcement?._id) await Announcement.findByIdAndDelete(data.announcement._id);
  }

  // Worker cannot create announcement
  {
    const { status } = await req("/api/announcements", {
      method: "POST",
      token: tokens.Worker.token,
      body: { title: "Fail", body: "Should fail" },
    });
    log("POST Announcement (denied)", "Worker", status === 403, `status=${status}`);
  }

  // Budget entry (managers)
  if (project) {
    for (const role of ["Main Admin", "Department Admin", "Officer"]) {
      const { status } = await req("/api/budget/entry", {
        method: "POST",
        token: tokens[role].token,
        body: { project: project._id, amount: 100, type: "expense", description: "E2E test" },
      });
      log("POST Budget entry", role, status === 201, `status=${status}`);
    }
  }

  // Bid create (managers)
  for (const role of ["Main Admin", "Officer"]) {
    const { status, data } = await req("/api/bids", {
      method: "POST",
      token: tokens[role].token,
      body: {
        contractor: "E2E Co",
        resource: "Test Mat",
        price: 1000,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    log("POST Bid", role, status === 201, `status=${status}`);
    if (data?.bid?._id) await Bid.findByIdAndDelete(data.bid._id);
  }

  // Chat send
  {
    const { status } = await req("/api/chat/send", {
      method: "POST",
      token: tokens.Worker.token,
      body: { receiver: "Field Officer", text: `E2E ping ${Date.now()}` },
    });
    log("POST Chat message", "Worker", status === 201, `status=${status}`);
  }

  // Discussion send
  {
    const { status } = await req("/api/discussion/send", {
      method: "POST",
      token: tokens.Worker.token,
      body: { department: "Water", content: `E2E discuss ${Date.now()}` },
    });
    log("POST Discussion message", "Worker", status === 201, `status=${status}`);
  }

  // Task status update (worker)
  if (task && worker) {
    const assigned = task.assignedTo?.toString() === worker._id.toString();
    if (assigned) {
      const { status } = await req(`/api/project/task/${task._id}`, {
        method: "PATCH",
        token: tokens.Worker.token,
        body: { status: task.status || "Pending" },
      });
      log("PATCH Task status", "Worker", status === 200, `status=${status}`);
    } else {
      log("PATCH Task status", "Worker", true, "skipped (no assigned task)");
    }
  }

  // Department create (admin only)
  for (const role of ["Main Admin", "Officer"]) {
    const uniqueName = `E2E Dept ${Date.now()}`;
    const { status, data } = await req("/api/createDepartment", {
      method: "POST",
      token: tokens[role].token,
      body: { name: uniqueName, description: "Temporary department for action verification" },
    });
    const expectOk = role === "Main Admin";
    log("POST Department", role, expectOk ? status === 201 : status === 403, `status=${status}`);
    const deptId = data?._id || data?.data?._id;
    if (deptId) {
      const { Department } = await import("../models/department.model.js");
      await Department.findByIdAndDelete(deptId);
    }
  }

  // Webhook test (main admin)
  const webhooks = await req("/api/integrations/webhooks", { token: tokens["Main Admin"].token });
  const whId = webhooks.data?.webhooks?.[0]?._id;
  if (whId) {
    const { status } = await req(`/api/integrations/webhooks/${whId}/test`, {
      method: "POST",
      token: tokens["Main Admin"].token,
    });
    log("POST Webhook test", "Main Admin", status === 200, `status=${status}`);
  }

  // Integration alert
  {
    const { status } = await req("/api/integrations/alert", {
      method: "POST",
      token: tokens.Officer.token,
      body: { channel: "email", message: "E2E alert", recipient: "test@test.com" },
    });
    log("POST Integration alert", "Officer", status === 200, `status=${status}`);
  }

  // Notifications mark all read
  for (const role of Object.keys(tokens)) {
    const { status } = await req("/api/notifications/read-all", {
      method: "POST",
      token: tokens[role].token,
      body: {},
    });
    log("POST Mark notifications read", role, status === 200, `status=${status}`);
  }

  // Escalate workflow (admin)
  {
    const { status } = await req("/api/workflow/escalate", {
      method: "POST",
      token: tokens["Department Admin"].token,
    });
    log("POST Workflow escalate", "Department Admin", status === 200, `status=${status}`);
  }

  await mongoose.disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== SUMMARY: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - [${f.role}] ${f.action}: ${f.note}`);
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
