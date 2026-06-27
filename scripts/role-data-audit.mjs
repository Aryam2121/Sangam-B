/**
 * Audit API data counts per role — ensures pages won't show empty states.
 * Run: node scripts/role-data-audit.mjs
 */
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

dotenv.config();

const API = process.env.API_BASE || "http://localhost:3002";
const ROLES_TO_CHECK = [
  { username: "mainadmin", role: "Main Admin" },
  { username: "deptadmin", role: "Department Admin" },
  { username: "officer", role: "Officer" },
  { username: "worker1", role: "Worker" },
];

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

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function countItems(body, keys = []) {
  if (Array.isArray(body)) return body.length;
  if (Array.isArray(body?.data)) return body.data.length;
  for (const k of keys) {
    if (Array.isArray(body?.[k])) return body[k].length;
  }
  if (body?.requests) return body.requests.length;
  if (body?.entries) return body.entries.length;
  if (body?.webhooks) return body.webhooks.length;
  if (body?.bids) return body.bids.length;
  if (body?.trail) return body.trail.length;
  if (body?.audit) return body.audit.length;
  if (body?.events) return body.events.length;
  if (body?.items) return body.items.length;
  if (body?.counts) return Object.values(body.counts).reduce((a, b) => a + (Number(b) || 0), 0);
  return body ? 1 : 0;
}

const ENDPOINTS = [
  { name: "Dashboard", path: "/api/dashboard/summary", keys: ["counts"] },
  { name: "Worker Dashboard", path: "/api/worker/dashboard", roles: ["Worker"], keys: ["counts"] },
  { name: "Projects", path: "/api/getallprojects" },
  { name: "Tasks", path: "/api/getalltasks" },
  { name: "Resources", path: "/api/getallresources" },
  { name: "Departments", path: "/api/getalldep" },
  { name: "Chat contacts", path: "/api/chat/contacts", keys: ["data"] },
  { name: "Discussion (Water)", path: "/api/discussion/history/Water" },
  { name: "Workflow", path: "/api/workflow", keys: ["requests"] },
  { name: "Approvals pending", path: "/api/workflow?status=pending", keys: ["requests"] },
  { name: "Budget", path: "/api/budget/summary", keys: ["entries"] },
  { name: "Audit trail", path: "/api/audit/trail", roles: ["Main Admin", "Department Admin"], keys: ["audit"] },
  { name: "City KPI", path: "/api/kpi/city" },
  { name: "City Map", path: "/api/geo/hub" },
  { name: "Announcements", path: "/api/announcements" },
  { name: "Bids", path: "/api/bids" },
  { name: "Seminars", path: "/api/getallseminars" },
  { name: "Notifications", path: "/api/notifications" },
  { name: "Activity", path: "/api/activity/timeline" },
  { name: "Webhooks", path: "/api/integrations/webhooks", roles: ["Main Admin"], keys: ["webhooks"] },
  { name: "ML Prefill", path: "/api/ml/prefill" },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = {};
  for (const spec of ROLES_TO_CHECK) {
    const user = await User.findOne({ username: spec.username });
    if (!user) {
      console.log(`MISSING USER: ${spec.username}`);
      continue;
    }
    users[spec.role] = { user, token: signToken(user) };
  }

  console.log("\n=== ROLE DATA AUDIT ===\n");
  const empty = [];

  for (const ep of ENDPOINTS) {
    const allowedRoles = ep.roles || Object.keys(users);
    for (const role of allowedRoles) {
      const entry = users[role];
      if (!entry) continue;
      const { status, body } = await apiGet(ep.path, entry.token);
      const count = status === 200 ? countItems(body, ep.keys) : -1;
      const ok = status === 200 && count > 0;
      const flag = ok ? "OK" : status !== 200 ? "HTTP" : "EMPTY";
      if (!ok) empty.push({ role, endpoint: ep.name, path: ep.path, status, count });
      console.log(`${flag.padEnd(5)} | ${role.padEnd(18)} | ${ep.name.padEnd(20)} | status=${status} count=${count}`);
    }
  }

  await mongoose.disconnect();

  console.log(`\n=== EMPTY / FAILED: ${empty.length} ===\n`);
  for (const e of empty) {
    console.log(`- [${e.role}] ${e.endpoint} (${e.path}) → status=${e.status} count=${e.count}`);
  }
  process.exit(empty.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
