// בדיקת עשן על הכתובת החיה: שלוש הדלתות והחוט המרכזי. רץ רק עם LIVE=כתובת.
import { test, expect } from "@playwright/test";
const base = process.env.LIVE;
test.skip(!base, "רק עם LIVE");
test.use({ baseURL: base });
test("שלוש הדלתות על /merge/", async ({ page }) => {
  await page.goto("./#/citizen");
  await expect(page.getByRole("heading", { level: 1, name: "השירותים בשכונה שלך" })).toBeVisible();
  await expect(page.locator("[aria-labelledby=wallet-title]")).toContainText("מתוך 500");
  await page.locator("section[aria-labelledby=results-h] a[href^='#/citizen/services/']").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("./#/citizen/activities");
  await expect(page.getByRole("heading", { level: 1, name: "השירותים שלי" })).toBeVisible();
  await page.goto("./#/coordinator");
  await expect(page.getByText("לפנות היום").first()).toBeVisible();
  await page.goto("./#/coordinator/patients");
  await expect(page.getByRole("tablist").first()).toBeVisible();
  await page.goto("./#/executive");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await page.goto("./#/executive/suppliers");
  await expect(page.getByRole("heading", { level: 1, name: "ניהול ספקים" })).toBeVisible();
  await page.goto("./#/providers");
  await expect(page.getByText("גרסה 1.2").first()).toBeVisible();
});
