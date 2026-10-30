// צילומי מסך לפני/אחרי של צד האזרח. רץ רק עם SHOTS=before|after.
import { test } from "@playwright/test";
const tag = process.env.SHOTS;
test.skip(!tag, "רק עם SHOTS");
const ROUTES: [string, string][] = [
  ["citizen", "./#/citizen"],
  ["services", "./#/citizen/services"],
  ["activities", "./#/citizen/activities"],
  ["profile", "./#/citizen/profile"],
  ["companion", "./#/citizen/companion"],
];
test("צילומים", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, url] of ROUTES) {
    await page.goto(url);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `docs/screens/${tag}-${info.project.name}-${name}.png`, fullPage: true });
  }
});
