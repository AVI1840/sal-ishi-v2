import { test } from "@playwright/test";

// צילומי מסך לגיבוי ההדגמה (docs/demo/screens). רץ רק במפורש: CAPTURE=1 npx playwright test capture --project=mobile
test.skip(!process.env.CAPTURE, "רק להפקת צילומי הגיבוי");

test("צילומי המסלול המלא", async ({ page, context }) => {
  const shot = (name: string) => page.screenshot({ path: `docs/demo/screens/${name}.png`, fullPage: true });
  await page.goto("./");
  await shot("01-דמויות");
  await page.getByRole("link", { name: /שרה, 78/ }).click();
  await shot("02-אזרחית-בית");
  await page.getByRole("link", { name: "למצוא חוג או שירות" }).click();
  await shot("03-המלצות");
  await page.getByRole("link", { name: /^לפרטים/ }).first().click();
  await shot("04-שירות");
  await page.getByRole("link", { name: "להזמין" }).click();
  if (await page.getByRole("radio").count()) {
    await page.getByRole("radio").first().check();
    await shot("05-מועד");
    await page.getByRole("button", { name: "לבדוק ולאשר" }).click();
  }
  await shot("06-אישור");
  await page.getByRole("button", { name: "לאשר את ההזמנה" }).click();
  await shot("07-נקלטה");
  await page.getByRole("link", { name: "לפעילויות שלי" }).click();
  await page.getByRole("link", { name: /^לבטל/ }).last().click();
  await shot("08-ביטול");
  await page.getByRole("button", { name: "כן, לבטל" }).click();
  await shot("09-בוטלה");
  await page.goto("./#/citizen/help");
  await shot("10-עזרה");
  await page.goto("./#/citizen/service/demoj-care");
  await page.getByRole("button", { name: "לבקש מהמלווה" }).click();
  await page.goto("./#/companion");
  await shot("11-מלווה-היום");
  await page.goto("./#/companion/requests");
  await page.getByRole("button", { name: "לאשר: סל טיפוח לשרה כ.", exact: true }).click();
  await page.getByRole("radio", { name: "צורך שזוהה בביקור" }).check();
  await shot("12-מלווה-אישור");
  await page.getByRole("button", { name: "לאשר ולתעד" }).click();
  await page.goto("./#/companion/person/c1");
  await page.getByRole("button", { name: "להזמין בשמו/ה" }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("checkbox").check();
  await shot("13-הרשאת-פעולה");
  await page.goto("./#/companion/log");
  await shot("14-יומן");
  await page.goto("./hq/#/");
  await page.waitForTimeout(1500);
  await shot("15-מטה-סקירה");
  await page.goto("./hq/#/learning");
  await shot("16-פנקס-למידה");
  await page.goto("./#/scope");
  await shot("17-כן-ולא");
  void context;
});
