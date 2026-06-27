/**
 * Idempotent demo data — fills pages that would otherwise show empty states.
 * Run: node scripts/seed-demo-data.mjs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Resource } from "../models/resources.model.js";
import { Message } from "../models/message.model.js";
import { DiscussionMessage } from "../models/discussionForum.model.js";
import { InterDeptRequest } from "../models/interDeptRequest.model.js";
import { BudgetEntry } from "../models/budgetEntry.model.js";
import { Bid } from "../models/bid.model.js";
import { WebhookConfig } from "../models/webhookConfig.model.js";
import { Announcement } from "../models/announcement.model.js";
import Seminar from "../models/training.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import { logActivity } from "../utils/activityLogger.js";

dotenv.config();

const ensureConnection = async () => {
  if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);
};

const seedDiscussion = async () => {
  await DiscussionMessage.updateMany(
    { department: "Water Department" },
    { $set: { department: "Water" } }
  );

  const count = await DiscussionMessage.countDocuments({ department: "Water" });
  if (count > 0) return { skipped: true, count };

  await DiscussionMessage.insertMany([
    { department: "Water", user: "Field Officer", content: "Pipe delivery arrived at site." },
    { department: "Water", user: "Site Worker One", content: "Sensor calibration scheduled for tomorrow." },
    { department: "Water", user: "Department Admin", content: "Safety briefing at 4 PM — all teams attend." },
    { department: "Roads", user: "Site Worker Two", content: "Asphalt mix delivered for resurfacing." },
  ]);
  return { created: 4 };
};

const seedChat = async () => {
  const pairs = [
    { sender: "Main Admin", receiver: "Field Officer", text: "Please review the weekly task checklist." },
    { sender: "Field Officer", receiver: "Main Admin", text: "Checklist updated — two items need approval." },
    { sender: "Department Admin", receiver: "Site Worker One", text: "Confirm pipe installation status by EOD." },
    { sender: "Site Worker One", receiver: "Department Admin", text: "Installation 80% complete on Block A." },
  ];

  let created = 0;
  for (const msg of pairs) {
    const exists = await Message.findOne({
      sender: msg.sender,
      receiver: msg.receiver,
      text: msg.text,
    });
    if (!exists) {
      await Message.create(msg);
      created += 1;
    }
  }
  return { created };
};

const seedWorkflow = async (users, projects) => {
  const waterOfficer = users.officer;
  const waterAdmin = users.deptadmin;
  const project = projects[0];

  const specs = [
    {
      title: "Coordinate drainage survey with Roads",
      description: "Need Roads team support for outer ring junction survey.",
      fromDepartment: "Water",
      toDepartment: "Roads",
      requestedBy: waterOfficer?._id,
      requestedByName: waterOfficer?.fullName || "Field Officer",
      status: "pending",
      priority: "high",
      project: project?._id,
    },
    {
      title: "Share traffic diversion plan",
      description: "Roads department requests Water team clearance near drain works.",
      fromDepartment: "Roads",
      toDepartment: "Water",
      requestedBy: users.worker2?._id || waterOfficer?._id,
      requestedByName: "Site Worker Two",
      status: "in_review",
      priority: "medium",
      project: project?._id,
    },
    {
      title: "Municipal facility access approval",
      description: "Temporary access to municipal yard for equipment staging.",
      fromDepartment: "Municipal",
      toDepartment: "Water",
      requestedBy: waterAdmin?._id,
      requestedByName: waterAdmin?.fullName || "Department Admin",
      status: "approved",
      priority: "low",
    },
  ];

  let created = 0;
  for (const spec of specs) {
    const exists = await InterDeptRequest.findOne({ title: spec.title });
    if (!exists) {
      await InterDeptRequest.create({
        ...spec,
        slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      });
      created += 1;
    }
  }
  return { created };
};

const seedBudget = async (users, projects) => {
  const count = await BudgetEntry.countDocuments();
  if (count > 0) return { skipped: true, count };

  const project = projects[0];
  const admin = users.deptadmin || users.mainadmin;
  if (!project || !admin) return { created: 0 };

  const entries = [
    { project: project._id, amount: 500000, type: "allocation", category: "infrastructure", description: "Initial project allocation", department: "Water", recordedBy: admin._id, recordedByName: admin.fullName },
    { project: project._id, amount: 125000, type: "expense", category: "materials", description: "PVC pipes procurement", department: "Water", recordedBy: admin._id, recordedByName: admin.fullName },
    { project: project._id, amount: 45000, type: "expense", category: "labour", description: "Site crew week 1", department: "Water", recordedBy: admin._id, recordedByName: admin.fullName },
  ];

  await BudgetEntry.insertMany(entries);
  await Project.findByIdAndUpdate(project._id, {
    budgetAllocated: 500000,
    budgetSpent: 170000,
  });

  return { created: entries.length };
};

const seedBids = async () => {
  const count = await Bid.countDocuments();
  if (count > 0) return { skipped: true, count };

  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Bid.insertMany([
    { contractor: "AquaBuild Pvt Ltd", resource: "PVC Pipes", price: 85000, expiresAt: expires },
    { contractor: "Metro Infra Co", resource: "Smart Sensors", price: 92000, expiresAt: expires },
    { contractor: "CityWorks LLC", resource: "Pump Units", price: 78000, expiresAt: expires },
  ]);
  return { created: 3 };
};

const seedWebhooks = async () => {
  const count = await WebhookConfig.countDocuments();
  if (count > 0) return { skipped: true, count };

  await WebhookConfig.insertMany([
    { name: "Slack Alerts", url: "https://hooks.example.com/slack/sangam", events: ["workflow", "budget"], active: true },
    { name: "Email Digest", url: "https://hooks.example.com/email/digest", events: ["announcement", "task"], active: true },
  ]);
  return { created: 2 };
};

const seedAnnouncements = async (users) => {
  const count = await Announcement.countDocuments();
  if (count > 0) return { skipped: true, count };

  const admin = users.mainadmin;
  await Announcement.insertMany([
    { title: "Monsoon preparedness drill", body: "All departments conduct readiness checks by Friday.", department: null, authorName: admin?.fullName || "Main Admin", authorId: admin?._id, pinned: true },
    { title: "Water zone maintenance window", body: "Scheduled maintenance in Ward 3 — expect brief supply interruptions.", department: "Water", authorName: admin?.fullName || "Main Admin", authorId: admin?._id },
  ]);
  return { created: 2 };
};

const seedSeminars = async () => {
  const count = await Seminar.countDocuments();
  if (count > 0) return { skipped: true, count };

  await Seminar.insertMany([
    { publisherName: "MoHUA Training", seminarLink: "https://example.com/seminar/smart-cities", description: "Smart city infrastructure best practices" },
    { publisherName: "Safety Board", seminarLink: "https://example.com/seminar/site-safety", description: "On-site safety certification module" },
  ]);
  return { created: 2 };
};

const seedLowStock = async () => {
  const low = await Resource.findOne({ $expr: { $lte: ["$stockLevel", "$minStockLevel"] } });
  if (low) return { skipped: true };

  const resources = await Resource.find().limit(3);
  let updated = 0;
  for (const r of resources) {
    await Resource.findByIdAndUpdate(r._id, { stockLevel: 5, minStockLevel: 20, unitCost: 1500 + updated * 500 });
    updated += 1;
  }
  return { updated };
};

const seedActivity = async (users) => {
  const count = await ActivityLog.countDocuments();
  if (count >= 5) return { skipped: true, count };

  const actor = users.mainadmin?.fullName || "Main Admin";
  const samples = [
    { entityType: "project", action: "created", entityId: "demo-project", title: "Metro Drain Upgrade created", actorName: actor },
    { entityType: "task", action: "assigned", entityId: "demo-task", title: "Pipe Installation assigned", actorName: actor },
    { entityType: "workflow", action: "created", entityId: "demo-workflow", title: "Inter-dept request opened", actorName: actor },
    { entityType: "budget", action: "budget_updated", entityId: "demo-budget", title: "Budget allocation recorded", actorName: actor },
    { entityType: "announcement", action: "created", entityId: "demo-announce", title: "City announcement published", actorName: actor },
  ];

  let created = 0;
  for (const s of samples) {
    const exists = await ActivityLog.findOne({ title: s.title });
    if (!exists) {
      await logActivity(s);
      created += 1;
    }
  }
  return { created };
};

const main = async () => {
  await ensureConnection();

  const users = {
    mainadmin: await User.findOne({ username: "mainadmin" }),
    deptadmin: await User.findOne({ username: "deptadmin" }),
    officer: await User.findOne({ username: "officer" }),
    worker1: await User.findOne({ username: "worker1" }),
    worker2: await User.findOne({ username: "worker2" }),
  };

  const projects = await Project.find().sort({ createdAt: 1 }).limit(5).lean();

  const results = {
    discussion: await seedDiscussion(),
    chat: await seedChat(),
    workflow: await seedWorkflow(users, projects),
    budget: await seedBudget(users, projects),
    bids: await seedBids(),
    webhooks: await seedWebhooks(),
    announcements: await seedAnnouncements(users),
    seminars: await seedSeminars(),
    lowStock: await seedLowStock(),
    activity: await seedActivity(users),
  };

  await mongoose.disconnect();
  console.log("Demo data seed complete:", JSON.stringify(results, null, 2));
};

main().catch(async (err) => {
  console.error("Demo seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
