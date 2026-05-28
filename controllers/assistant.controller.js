import { Project } from "../models/project.model.js";
import { Task } from "../models/tasks.model.js";

const GEMINI_MODEL = "gemini-1.5-flash";

const languageDirective = {
  en: "Respond in English.",
  es: "Respond in Spanish.",
  fr: "Respond in French.",
  de: "Respond in German.",
  it: "Respond in Italian.",
  hi: "Respond in Hindi.",
};

const getAssistantKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const getStatusCounts = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || "Unknown"] = row.count;
    return acc;
  }, {});

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRealtimeSnapshot = async () => {
  const now = new Date();
  const next72Hours = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);

  const [
    projectCount,
    taskCount,
    projectStatusRows,
    taskStatusRows,
    overdueTasks,
    upcomingTasks,
    recentProjects,
    recentTasks,
  ] = await Promise.all([
    Project.countDocuments(),
    Task.countDocuments(),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.find({ status: { $ne: "Completed" }, dueDate: { $lt: now } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select("title status dueDate"),
    Task.find({ status: { $ne: "Completed" }, dueDate: { $gte: now, $lte: next72Hours } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select("title status dueDate"),
    Project.find().sort({ updatedAt: -1 }).limit(5).select("name status updatedAt"),
    Task.find().sort({ updatedAt: -1 }).limit(5).select("title status dueDate updatedAt"),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      projects: projectCount,
      tasks: taskCount,
    },
    status: {
      projects: getStatusCounts(projectStatusRows),
      tasks: getStatusCounts(taskStatusRows),
    },
    overdueTasks,
    upcomingTasks,
    recentProjects,
    recentTasks,
  };
};

const buildFallbackReply = (message, snapshot) => {
  const msg = (message || "").toLowerCase();
  const overdueCount = snapshot.overdueTasks.length;
  const upcomingCount = snapshot.upcomingTasks.length;
  const pendingCount = snapshot.status.tasks.Pending || 0;
  const inProgressCount = snapshot.status.tasks["In Progress"] || 0;
  const completedCount = snapshot.status.tasks.Completed || 0;

  if (msg.includes("risk") || msg.includes("delay") || msg.includes("issue")) {
    return [
      `Real-time risk snapshot (${snapshot.generatedAt}):`,
      `- Overdue tasks: ${overdueCount}`,
      `- Tasks due in next 72h: ${upcomingCount}`,
      `- Pending tasks: ${pendingCount}`,
      `- In progress tasks: ${inProgressCount}`,
      overdueCount > 0
        ? `Top overdue: ${snapshot.overdueTasks
            .map((task) => task.title)
            .slice(0, 3)
            .join(", ")}`
        : "No overdue tasks right now.",
      "Action: close overdue items first, then rebalance pending tasks with nearest deadlines.",
    ].join("\n");
  }

  if (msg.includes("status") || msg.includes("summary") || msg.includes("dashboard")) {
    return [
      `Real-time dashboard snapshot (${snapshot.generatedAt}):`,
      `- Projects: ${snapshot.counts.projects}`,
      `- Tasks: ${snapshot.counts.tasks}`,
      `- Project status: ${JSON.stringify(snapshot.status.projects)}`,
      `- Task status: ${JSON.stringify(snapshot.status.tasks)}`,
      `- Upcoming deadlines (72h): ${upcomingCount}`,
    ].join("\n");
  }

  if (msg.includes("project")) {
    const list = snapshot.recentProjects || [];
    if (list.length === 0) {
      return "No projects are available in the current snapshot.";
    }
    const quick = list
      .slice(0, 5)
      .map((p) => `- ${p.name} (${p.status || "unknown"})`)
      .join("\n");
    return [
      `Project snapshot (${snapshot.generatedAt}):`,
      quick,
      "Ask with exact project name/id (for example: 'details for project Metro Drain Upgrade') for targeted info.",
    ].join("\n");
  }

  return [
    `Real-time assistant snapshot (${snapshot.generatedAt}):`,
    `- Projects: ${snapshot.counts.projects}`,
    `- Tasks: ${snapshot.counts.tasks}`,
    `- Overdue: ${overdueCount}`,
    `- Upcoming 72h: ${upcomingCount}`,
    `- Completed tasks: ${completedCount}`,
    "Ask about risks, deadlines, or dashboard summary for deeper analysis.",
  ].join("\n");
};

const askGemini = async ({ message, language, snapshot }) => {
  const apiKey = getAssistantKey();
  if (!apiKey) {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const prompt = [
    "You are Sangam AI assistant for civic infrastructure operations.",
    "Use only the provided real-time snapshot for factual claims.",
    "If data is missing, say it clearly and give next best action.",
    "Keep output concise with action-first bullet points.",
    languageDirective[language] || languageDirective.en,
    "Real-time snapshot JSON:",
    JSON.stringify(snapshot),
    `User question: ${message}`,
  ].join("\n\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
};

export const assistantChat = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const language = String(req.body?.language || "en").trim().toLowerCase();

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const snapshot = await buildRealtimeSnapshot();
    const projectMatch =
      message.match(/project\s+id\s*[:#-]?\s*([a-f0-9]{6,24})/i) ||
      message.match(/project\s+([a-f0-9]{6,24})/i) ||
      message.match(/project\s+(.+)/i);

    let projectContext = null;
    if (projectMatch) {
      const candidate = String(projectMatch[1] || "").trim();
      if (candidate) {
        if (/^[a-f0-9]{6,24}$/i.test(candidate)) {
          projectContext = await Project.findById(candidate)
            .select("name description status startDate endDate workerIds taskIds resources projectAdmin")
            .lean();
        }
        if (!projectContext) {
          projectContext = await Project.findOne({
            name: { $regex: escapeRegex(candidate), $options: "i" },
          })
            .select("name description status startDate endDate workerIds taskIds resources projectAdmin")
            .lean();
        }
      }
    }

    let reply = null;
    let mode = "fallback";

    try {
      reply = await askGemini({
        message,
        language,
        snapshot: {
          ...snapshot,
          projectContext,
        },
      });
      if (reply) {
        mode = "gemini";
      }
    } catch (geminiError) {
      console.error("Gemini assistant error:", geminiError.message);
    }

    if (!reply) {
      if (projectContext) {
        reply = [
          `Project details for ${projectContext.name}:`,
          `- Status: ${projectContext.status || "unknown"}`,
          `- Project admin: ${projectContext.projectAdmin || "not set"}`,
          `- Start date: ${projectContext.startDate ? new Date(projectContext.startDate).toLocaleDateString() : "not set"}`,
          `- End date: ${projectContext.endDate ? new Date(projectContext.endDate).toLocaleDateString() : "not set"}`,
          `- Workers: ${Array.isArray(projectContext.workerIds) ? projectContext.workerIds.length : 0}`,
          `- Tasks: ${Array.isArray(projectContext.taskIds) ? projectContext.taskIds.length : 0}`,
          `- Resources: ${projectContext.resources || "not set"}`,
          projectContext.description ? `- Summary: ${projectContext.description}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        reply = buildFallbackReply(message, snapshot);
      }
    }

    return res.status(200).json({
      reply,
      mode,
      generatedAt: snapshot.generatedAt,
      snapshot: {
        counts: snapshot.counts,
        status: snapshot.status,
        overdueTasks: snapshot.overdueTasks.length,
        upcomingTasks: snapshot.upcomingTasks.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate assistant response.", error: error.message });
  }
};
