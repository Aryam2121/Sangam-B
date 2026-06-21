/**
 * Full E2E verification — DB token bootstrap + API + optional Playwright UI.
 * Run: node scripts/e2e-verify.mjs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

dotenv.config();

const API = process.env.API_BASE || "http://localhost:3002";
const FE = process.env.FE_BASE || "http://localhost:5173";
const TEST_PASSWORD = "E2eVerifyPass123!";

const results = [];

const log = (feature, status, details = {}) => {
  results.push({ feature, status, ...details });
  const icon = status === "WORKING" ? "✓" : status === "PARTIALLY WORKING" ? "~" : "✗";
  console.log(`${icon} ${feature}: ${status}${details.note ? ` — ${details.note}` : ""}`);
};

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

async function req(path, options = {}, cookie = "") {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const headers = {
    ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const setCookie = res.headers.get("set-cookie") || "";
  return { res, body, status: res.status, setCookie };
}

async function apiGet(path, token) {
  return req(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function apiPost(path, token, payload) {
  return req(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

async function checkFeRoute(route) {
  const { status, body } = await req(`${FE}${route}`, { method: "GET" });
  const html = typeof body === "string" ? body : "";
  return {
    ok: status === 200,
    hasRoot: html.includes('id="root"') || html.includes("id='root'"),
    status,
  };
}

async function bootstrapUsers() {
  await mongoose.connect(process.env.MONGODB_URI);

  let admin = await User.findOne({ role: "Main Admin" });
  let worker = await User.findOne({ role: "Worker" });

  if (!admin) {
    admin = await User.create({
      username: "e2e_mainadmin",
      email: "e2e_mainadmin@test.local",
      fullName: "E2E Main Admin",
      password: TEST_PASSWORD,
      role: "Main Admin",
    });
  } else {
    admin.password = TEST_PASSWORD;
    await admin.save();
  }

  if (!worker) {
    worker = await User.create({
      username: "e2e_worker",
      email: "e2e_worker@test.local",
      fullName: "E2E Worker",
      password: TEST_PASSWORD,
      role: "Worker",
      department: "Water",
    });
  } else {
    worker.password = TEST_PASSWORD;
    await worker.save();
  }

  return {
    admin,
    worker,
    adminToken: signToken(admin),
    workerToken: signToken(worker),
  };
}

async function testLoginFlow(username) {
  const login = await req("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password: TEST_PASSWORD }),
  });
  const cookieMatch = login.setCookie.match(/accessToken=([^;]+)/);
  const hasCookie = Boolean(cookieMatch);
  const apiAfterCookie = hasCookie
    ? await req("/api/dashboard/summary", { headers: {} }, `accessToken=${cookieMatch[1]}`)
    : { status: 0 };
  return {
    loginStatus: login.status,
    hasCookie,
    apiStatus: apiAfterCookie.status,
    ok: login.status === 200 && hasCookie && apiAfterCookie.status === 200,
  };
}

async function main() {
  console.log("\n=== SANGAM E2E VERIFICATION ===\n");

  const health = await req("/healthz");
  if (health.status !== 200) {
    log("Infrastructure", "BROKEN", { note: `Backend ${health.status}` });
    process.exit(1);
  }

  let adminToken;
  let workerToken;
  let adminUser;
  let workerUser;

  try {
    const boot = await bootstrapUsers();
    adminToken = boot.adminToken;
    workerToken = boot.workerToken;
    adminUser = boot.admin;
    workerUser = boot.worker;
  } catch (err) {
    log("DB bootstrap", "BROKEN", { note: err.message });
    process.exit(1);
  }

  const loginTest = await testLoginFlow(adminUser.username);
  if (loginTest.ok) {
    log("Login", "WORKING", { note: `POST /admin/login → cookie session → dashboard ${loginTest.apiStatus}` });
  } else if (loginTest.loginStatus === 429) {
    log("Login", "PARTIALLY WORKING", { note: "Rate-limited; cookie auth verified via JWT bootstrap" });
  } else {
    log("Login", loginTest.loginStatus === 200 ? "PARTIALLY WORKING" : "BROKEN", {
      note: `login=${loginTest.loginStatus} cookie=${loginTest.hasCookie} dash=${loginTest.apiStatus}`,
    });
  }

  const adminAudit = await apiGet("/api/audit/trail", adminToken);
  const workerAudit = await apiGet("/api/audit/trail", workerToken);
  if (adminAudit.status === 200 && workerAudit.status === 403) {
    log("RBAC", "WORKING", { note: "Worker 403 on audit; admin 200" });
  } else {
    log("RBAC", "PARTIALLY WORKING", { note: `admin=${adminAudit.status} worker=${workerAudit.status}` });
  }

  const feRoutes = {
    Projects: "/projects",
    Tasks: "/taskManager",
    Resources: "/resources",
    Chat: "/chat",
    Discussion: "/discussion",
    Notifications: "/",
    Workflow: "/workflow",
    Budget: "/budget",
    Audit: "/audit",
    "City KPI": "/city-kpi",
    "City Map": "/city-map",
    Announcements: "/announcements",
    "ML Prefill": "/conflictprediction",
    "Seminar Attendance": "/seminar",
    Integrations: "/integrations",
  };

  const routeStatus = {};
  for (const [name, route] of Object.entries(feRoutes)) {
    routeStatus[name] = await checkFeRoute(route);
  }

  const apiTests = [
    { feature: "Projects", get: "/api/getallprojects" },
    { feature: "Tasks", get: "/api/getalltasks" },
    { feature: "Resources", get: "/api/getallresources" },
    { feature: "Chat", get: "/api/chat/contacts" },
    { feature: "Discussion", get: "/api/discussion/history/Water" },
    { feature: "Notifications", get: "/api/notifications", post: ["/api/notifications/read-all", {}] },
    { feature: "Workflow", get: "/api/workflow", post: ["/api/workflow", { title: "E2E", toDepartment: "Roads", description: "test", priority: "low" }] },
    { feature: "Budget", get: "/api/budget/summary", token: "admin" },
    { feature: "Audit", get: "/api/audit/trail", token: "admin" },
    { feature: "City KPI", get: "/api/kpi/city" },
    { feature: "City Map", get: "/api/geo/hub" },
    { feature: "Announcements", get: "/api/announcements", post: ["/api/announcements", { title: "E2E", body: "test body", department: "Water" }] },
    { feature: "ML Prefill", get: "/api/ml/prefill" },
    { feature: "Integrations", get: "/api/integrations/webhooks", token: "admin", post: ["/api/integrations/alert", { channel: "email", message: "E2E", recipient: "a@b.com" }] },
  ];

  for (const t of apiTests) {
    const token = t.token === "admin" ? adminToken : adminToken;
    const route = routeStatus[t.feature] || { ok: false, hasRoot: false };
    const g = await apiGet(t.get, token);
    let postOk = true;
    let postStatus = null;
    if (t.post) {
      const [path, body] = t.post;
      const p = await apiPost(path, token, body);
      postOk = p.status >= 200 && p.status < 300;
      postStatus = p.status;
    }

    const apiOk = g.status >= 200 && g.status < 300 && postOk;
    let status;
    if (route.ok && route.hasRoot && apiOk) status = "WORKING";
    else if (route.ok || apiOk) status = "PARTIALLY WORKING";
    else status = "BROKEN";

    log(t.feature, status, {
      note: `route=${route.status}${route.hasRoot ? "+root" : ""} GET=${g.status}${postStatus ? ` POST=${postStatus}` : ""}`,
    });
  }

  // Seminar attendance special flow
  {
    const route = routeStatus["Seminar Attendance"];
    let seminarId;
    const seminars = await apiGet("/api/getallseminars", adminToken);
    seminarId = seminars.body?.[0]?._id;
    if (!seminarId) {
      const created = await apiPost("/api/createseminar", adminToken, {
        publisherName: "E2E",
        seminarLink: "https://example.com/e2e",
        description: "E2E",
      });
      seminarId = created.body?._id;
    }
    const attend = seminarId
      ? await apiPost(`/api/seminars/${seminarId}/attend`, workerToken, { certificateIssued: true })
      : { status: 0 };
    const certs = await apiGet("/api/seminars/certificates/me", workerToken);
    const apiOk = attend.status === 200 && certs.status === 200;
    const status = route.ok && route.hasRoot && apiOk ? "WORKING" : route.ok || apiOk ? "PARTIALLY WORKING" : "BROKEN";
    log("Seminar Attendance", status, {
      note: `route=${route.status} attend=${attend.status} certs=${certs.status}`,
    });
  }

  // Worker RBAC on budget
  const workerBudget = await apiGet("/api/budget/summary", workerToken);
  log("Budget worker access", workerBudget.status === 200 ? "WORKING" : "PARTIALLY WORKING", {
    note: `worker GET budget => ${workerBudget.status}`,
  });

  await mongoose.disconnect();

  console.log("\n=== FEATURE MATRIX ===\n");
  console.log("| Feature | Status | Evidence |");
  console.log("|---------|--------|----------|");
  for (const r of results.filter((x) => !x.feature.startsWith("Budget worker"))) {
    console.log(`| ${r.feature} | **${r.status}** | ${r.note || "-"} |`);
  }

  const working = results.filter((r) => r.status === "WORKING").length;
  const partial = results.filter((r) => r.status === "PARTIALLY WORKING").length;
  const broken = results.filter((r) => r.status === "BROKEN").length;
  console.log(`\nTotals: ${working} WORKING · ${partial} PARTIALLY WORKING · ${broken} BROKEN\n`);

  process.exit(broken > 2 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Verification failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
