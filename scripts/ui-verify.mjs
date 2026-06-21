/**
 * Browser UI smoke test — requires: npx playwright install chromium
 * Run: node scripts/ui-verify.mjs
 */
import { chromium } from "playwright";

const FE = process.env.FE_BASE || "http://localhost:5173";
const TEST_PASSWORD = "E2eVerifyPass123!";

const routes = [
  { feature: "Login", path: "/login", public: true },
  { feature: "Projects", path: "/projects" },
  { feature: "Tasks", path: "/taskManager" },
  { feature: "Resources", path: "/resources" },
  { feature: "Chat", path: "/chat" },
  { feature: "Discussion", path: "/discussion" },
  { feature: "Workflow", path: "/workflow" },
  { feature: "Budget", path: "/budget" },
  { feature: "Audit", path: "/audit" },
  { feature: "City KPI", path: "/city-kpi" },
  { feature: "City Map", path: "/city-map" },
  { feature: "Announcements", path: "/announcements" },
  { feature: "ML Prefill", path: "/conflictprediction" },
  { feature: "Seminar Attendance", path: "/seminar" },
  { feature: "Integrations", path: "/integrations" },
];

async function login(page) {
  await page.goto(`${FE}/login`, { waitUntil: "networkidle" });
  const userField = page.locator('input[type="email"], input[name="username"], input[placeholder*="email" i]').first();
  const passField = page.locator('input[type="password"]').first();
  await userField.fill("mainadmin");
  await passField.fill(TEST_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
  await page.waitForTimeout(2500);
}

async function main() {
  console.log("\n=== UI BROWSER VERIFICATION ===\n");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (firstErr) {
    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: chromium.executablePath(),
      });
    } catch {
      console.log("SKIP UI tests — Playwright browsers not fully installed.");
      console.log(firstErr.message.split("\n")[0]);
      console.log("\nFrom D:\\Sangam\\Sangam-B run and wait until ALL downloads finish (Chrome + FFmpeg + Headless Shell):");
      console.log("  npx playwright install chromium");
      console.log("Then run: node scripts/ui-verify.mjs\n");
      return;
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const uiResults = [];

  // Login page (public)
  await page.goto(`${FE}/login`, { waitUntil: "domcontentloaded" });
  const loginRender = await page.locator("#root").count();
  uiResults.push({
    feature: "Login UI",
    ok: loginRender > 0,
    note: loginRender > 0 ? "login page renders" : "no root",
  });

  await login(page);
  const afterLogin = page.url();
  const loggedIn = !afterLogin.includes("/login");

  for (const r of routes.filter((x) => !x.public)) {
    consoleErrors.length = 0;
    pageErrors.length = 0;
    await page.goto(`${FE}${r.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const onLogin = page.url().includes("/login");
    const hasContent = (await page.locator("body").innerText()).length > 50;
    const errors = [...consoleErrors, ...pageErrors];

    let status = "BROKEN";
    if (onLogin && !loggedIn) status = "BROKEN";
    else if (onLogin) status = "PARTIALLY WORKING";
    else if (hasContent && errors.length === 0) status = "WORKING";
    else if (hasContent) status = "PARTIALLY WORKING";
    else status = "BROKEN";

    uiResults.push({
      feature: r.feature,
      status,
      note: onLogin ? "redirected to login" : `content=${hasContent} errors=${errors.length}${errors[0] ? `: ${errors[0].slice(0, 80)}` : ""}`,
    });
  }

  await browser.close();

  console.log("| Feature | UI Status | Notes |");
  console.log("|---------|-----------|-------|");
  for (const r of uiResults) {
    console.log(`| ${r.feature} | ${r.status || (r.ok ? "WORKING" : "BROKEN")} | ${r.note} |`);
  }
  console.log("");
}

main().catch((e) => {
  console.error("UI verify error:", e.message);
});
