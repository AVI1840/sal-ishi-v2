import { defineConfig, devices } from "@playwright/test";

// בדיקות קצה לקצה על האתר הבנוי (npm run build:all), כמו שהוא מתפרסם:
// הכלי לאזרח ולמלווה בשורש, המטה ב-/hq/ והשטח ב-/field/, כולל עבודה בלי רשת.
// הרצה: npm run test:e2e
// בלי חיבור להורדת דפדפן: PW_CHROMIUM=<נתיב ל-chrome.exe> משתמש בדפדפן קיים.

const executablePath = process.env.PW_CHROMIUM || undefined;
const PORT = 4174;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    launchOptions: executablePath ? { executablePath } : undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, launchOptions: executablePath ? { executablePath } : undefined } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, launchOptions: executablePath ? { executablePath } : undefined } },
  ],
});
