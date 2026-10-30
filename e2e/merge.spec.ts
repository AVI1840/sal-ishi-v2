import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// בדיקות הקצה לקצה של 0.5 המאוחד: המסכים הקיימים, עם המנוע של 0.5 בתוכם.
// כל בדיקה מתחילה בדפדפן נקי, ולכן בנתוני הפתיחה של ההדגמה.

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** שירות קבוצתי עם מועדים, בלי אישור מלווה ובלי מממן אחר. */
const SERVICE = "demoj-balance";

test("אזרחית: ארנק בנקודות, הזמנה, ביטול ושיחזרו אליי", async ({ page }) => {
  await page.goto("./#/citizen");
  await expect(page.getByRole("heading", { level: 1, name: /, שרה$/ })).toBeVisible();
  await expect(page.getByText(/נשארו \d+ נקודות/).first()).toBeVisible();
  await expect(page.getByText("נקודה = ₪1").first()).toBeVisible();
  await noHorizontalScroll(page);

  await page.goto(`./#/citizen/services/${SERVICE}`);
  const name = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
  await expect(page.getByRole("heading", { name: "כמה זה עולה" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "אם צריך לבטל" })).toBeVisible();
  await page.getByRole("button", { name: "להזמין" }).click();
  const radios = page.getByRole("radio");
  if (await radios.count()) {
    expect(await radios.count()).toBeLessThanOrEqual(3);
    await radios.first().check();
    await page.getByRole("button", { name: "לבדוק ולאשר" }).click();
  }
  await page.getByRole("button", { name: "לאשר את ההזמנה" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה נקלטה" })).toBeVisible();

  await page.getByRole("link", { name: "לפעילויות שלי" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "הפעילויות שלי" })).toBeVisible();
  await page.getByRole("button", { name: `לבטל: ${name}` }).click();
  await expect(page.getByText(/הביטול בלי חיוב|הביטול מאוחר/)).toBeVisible();
  await page.getByRole("button", { name: "כן, לבטל" }).click();
  await expect(page.getByText(/ההזמנה בוטלה/)).toBeVisible();

  await page.getByRole("button", { name: "שיחזרו אליי" }).click();
  await expect(page.getByText(/קיבלה את הבקשה/)).toBeVisible();
});

test("בכל מסך של האזרחית יש שיחזרו אליי, ובלי גלילה לצדדים", async ({ page }) => {
  for (const route of ["citizen", "citizen/services", `citizen/services/${SERVICE}`, "citizen/activities", "citizen/profile"]) {
    await page.goto(`./#/${route}`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "שיחזרו אליי" })).toBeVisible();
    await noHorizontalScroll(page);
    // מול האזרחית: בלי תיוג וציונים. אלה כלים של המלווה. "נקודות" הן יחידת הארנק.
    const text = await page.locator("#main").innerText();
    expect(text, route).not.toMatch(/סיכון|ציון|נק'|ירידה תפקודית|חסמים|התמדה|מעורבות/);
  }
});

test("שירות מותנה: האזרחית מבקשת, המלווה מאשרת בתיק, האזרחית יכולה להזמין", async ({ page, context }) => {
  await page.goto("./#/citizen/services/demoj-care");
  await page.getByRole("button", { name: "לבקש מהמלווה" }).click();
  await expect(page.getByText("מחכה לתשובת המלווה")).toBeVisible();

  const companion = await context.newPage();
  await companion.goto("./#/coordinator/patients/c1");
  await expect(companion.getByRole("heading", { name: "פעולות בתיק" })).toBeVisible();
  await companion.getByRole("button", { name: /^לאשר:/ }).first().click();
  await companion.getByRole("radio").first().check();
  await companion.getByRole("button", { name: "לאשר ולתעד" }).click();

  await page.goto("./#/citizen/activities");
  await expect(page.getByText("המלווה אישרה")).toBeVisible();
  await expect(page.getByRole("link", { name: /^להזמין:/ })).toBeVisible();
});

test("מלווה: הזמנה בשם האזרחית עם אישור בעל פה, ותיעוד ביקור", async ({ page }) => {
  await page.goto("./#/coordinator/patients/c1");
  await page.getByRole("button", { name: /להזמין בשמו/ }).click();
  await page.locator("input[name=behalf-service]").first().check();
  const order = page.getByRole("button", { name: "להזמין ולתעד את האישור" });
  await expect(order).toBeDisabled();
  await page.getByRole("checkbox").check();
  await order.click();
  await expect(page.getByText("ההזמנה נרשמה, עם האישור בעל פה ביומן.")).toBeVisible();
  await expect(page.getByText("(הוזמן בשמו/ה)")).toBeVisible();

  await page.getByRole("button", { name: /תיעוד ביקור/ }).click();
  await page.getByRole("button", { name: "שיחת טלפון" }).click();
  await page.getByRole("button", { name: "לשמור ביומן" }).click();
  await expect(page.getByText("הביקור נשמר ביומן.")).toBeVisible();
});

test("אשפוז: המלווה רושמת, והפעילויות של האזרחית מוקפאות", async ({ page, context }) => {
  await page.goto("./#/coordinator/patients/c1");
  await page.getByRole("button", { name: /^אשפוז/ }).click();
  await page.getByRole("button", { name: "לרשום אשפוז" }).click();
  await expect(page.getByText("באשפוז: הפעילויות מוקפאות")).toBeVisible();

  const citizen = await context.newPage();
  await citizen.goto("./#/citizen/activities");
  await expect(citizen.getByText("מוקפא בזמן האשפוז").first()).toBeVisible();
  await citizen.goto(`./#/citizen/services/${SERVICE}`);
  await expect(citizen.getByText(/בזמן האשפוז לא מזמינים/)).toBeVisible();
});

test("פגישה משותפת ומעקב חודשי נפתחים מתוך התיק", async ({ page }) => {
  await page.goto("./#/coordinator/patients/c2");
  await page.getByRole("link", { name: "פגישה משותפת" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /פגישה משותפת/ })).toBeVisible();
  await page.goto("./#/coordinator/patients/c1/review");
  await expect(page.getByRole("heading", { level: 1, name: /מעקב חודשי/ })).toBeVisible();
});

test("עמוד מה הכלי כן ולא עושה, והנתיבים הישנים לא מובילים לדף שגיאה", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "מה הכלי כן ולא עושה" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "מה הכלי כן ולא עושה" })).toBeVisible();
  await page.goto("./#/coordinator/agents");
  await expect(page).toHaveURL(/#\/coordinator$/);
});

test("נגישות: axe בלי ליקויים חמורים במסכים המאוחדים", async ({ page }) => {
  const routes = [
    "./", "./#/scope", "./#/citizen", "./#/citizen/services", `./#/citizen/services/${SERVICE}`, "./#/citizen/activities",
    "./#/citizen/profile", "./#/coordinator", "./#/coordinator/patients/c1", "./#/coordinator/patients/c2/session",
    "./#/coordinator/patients/c1/review", "./#/providers",
    "./#/citizen/needs", "./#/coordinator/community", "./#/coordinator/patients", "./#/executive", "./#/executive/algorithm", "./#/executive/catalog",
  ];
  // בלי אנימציית הכניסה, כדי ש-axe ימדוד ניגודיות על הצבעים הסופיים.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const problems: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of result.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) problems.push(`${route}: ${v.id} (${v.nodes.length})`);
  }
  expect(problems).toEqual([]);
});
