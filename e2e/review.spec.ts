import { test } from "@playwright/test";

// צילומי סקירה מהשרת המקומי (REVIEW=1, שרת פיתוח על 5173). לא חלק מהבדיקות.
test.skip(!process.env.REVIEW, "רק לסקירה");
const BASE = "http://localhost:5173/";
const OUT = process.env.REVIEW_OUT ?? "test-results/review";
const pages = (process.env.REVIEW_PAGES ?? "citizen,citizen/services,citizen/services/demoj-club").split(",");

for (const p of pages) {
  test(`review ${p}`, async ({ page }, info) => {
    await page.goto(BASE + "#/" + p);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${info.project.name}-${p.replace(/\//g, "_") || "home"}.png`, fullPage: true });
  });
}
