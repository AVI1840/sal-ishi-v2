// צילומי מסך סופיים (SHOTS=final): בית, מטה, סוכנים, ספקים, וחוט הזהב 2 שלב אחר שלב.
import { test } from "@playwright/test";
const tag = process.env.SHOTS;
test.skip(tag !== "final", "רק עם SHOTS=final");
test("צילומים סופיים", async ({ page }, info) => {
  const dev = info.project.name;
  const shot = async (name: string) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/screens/final-${dev}-${name}.png`, fullPage: true });
  };
  await page.emulateMedia({ reducedMotion: "reduce" });
  const go = async (url: string, name: string) => {
    await page.goto(url);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await shot(name);
  };
  await go("./#/", "01-home");
  await go("./#/citizen", "02-market");
  await page.goto("./#/citizen/services/demoj-choir");
  await page.getByRole("button", { name: "לבקש להצטרף לקבוצה" }).click();
  await page.getByRole("button", { name: "לשלוח בקשה לספק" }).click();
  await page.getByRole("heading", { name: "הבקשה נשלחה לספק" }).waitFor();
  await shot("03-requested");
  await go("./#/citizen/activities", "04-pending-in-my-services");
  await go("./#/providers", "05-provider-requests");
  await page.getByRole("button", { name: "לאשר הצטרפות: שרה כ., מקהלה קהילתית" }).click();
  await go("./#/citizen/activities", "06-approved");
  await go("./#/coordinator", "07-companion-new-in-caseload");
  await page.getByRole("button", { name: "הדגמה" }).click();
  await page.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
  await go("./#/executive/suppliers", "08-hq-suppliers-settlement");
  await go("./#/executive", "09-executive-timeline");
  await go("./#/executive/agents", "10-agents");
  await go("./#/providers", "11-provider-settlement");
});
