import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// בדיקות הקצה לקצה של 0.5 המאוחד: המסכים הקיימים, עם המנוע של 0.5 בתוכם.
// כל בדיקה מתחילה בדפדפן נקי, ולכן בנתוני הפתיחה של ההדגמה.

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** שירות רציף (מנוי חודשי): מצטרפים לקבוצה. */
const SERVICE = "demoj-balance";
/** שירות חד-פעמי עם מועדים (סדנה): מזמינים מועד ומבטלים לפי הכלל. */
const SINGLE = "demoj-cooking";

test("אזרחית: ארנק מהאירועים, הצטרפות ועזיבה, הזמנה וביטול, שיחזרו אליי", async ({ page }) => {
  await page.goto("./#/citizen");
  await expect(page.getByRole("heading", { level: 1, name: /, שרה$/ })).toBeVisible();
  // נתוני הפתיחה: מועדון (126 בחודש) עם 2 מפגשים מדווחים מתוך 4.
  const wallet = page.locator("[aria-labelledby=wallet-title]");
  await expect(wallet).toContainText("נשארו 374 נקודות");
  await expect(wallet).toContainText("שמור 63 נקודות");
  await expect(wallet).toContainText("נוצל 63 נקודות");
  await expect(page.getByText("נקודה = ₪1").first()).toBeVisible();
  await noHorizontalScroll(page);

  // שירות רציף: להצטרף לקבוצה, ולעזוב.
  await page.goto(`./#/citizen/services/${SERVICE}`);
  const name = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
  await expect(page.getByText(/נקודות בחודש, כ-4 מפגשים/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "אם רוצים לעזוב" })).toBeVisible();
  await page.getByRole("button", { name: "להצטרף לקבוצה" }).click();
  await page.getByRole("button", { name: "לאשר את ההצטרפות" }).click();
  await expect(page.getByRole("heading", { name: "הצטרפת לקבוצה" })).toBeVisible();
  await page.getByRole("link", { name: "לפעילויות שלי" }).click();
  await page.getByRole("button", { name: `לעזוב את הקבוצה: ${name}` }).click();
  await page.getByRole("button", { name: "כן, לעזוב" }).click();
  await expect(page.getByText(/עזבת את הקבוצה/)).toBeVisible();

  // חד-פעמי: מועד, אישור, ביטול לפי הכלל.
  await page.goto(`./#/citizen/services/${SINGLE}`);
  const single = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
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
  await page.getByRole("button", { name: `לבטל: ${single}` }).click();
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

test("חוט הזהב: שרה מצטרפת למקהלה, שמור, רונית רואה, המטה סופר, נוכחות, נוצל ודירוג", async ({ page, context }) => {
  await page.goto("./#/citizen");
  const first = page.locator(`section[aria-labelledby=rec-title] a[href^="#/citizen/services/"]`).first();
  await expect(first).toContainText("מקהלה קהילתית");
  await expect(first).toContainText("סיפרת שהחלום שלך הוא לחזור לשיר במקהלה");

  await page.goto("./#/citizen/services");
  await expect(page.getByRole("heading", { level: 1, name: "השוק בשכונה שלך" })).toBeVisible();
  await page.getByRole("link", { name: /מקהלה קהילתית/ }).first().click();
  await page.getByRole("button", { name: "להצטרף לקבוצה" }).click();
  await page.getByRole("button", { name: "לאשר את ההצטרפות" }).click();
  await expect(page.getByRole("heading", { name: "הצטרפת לקבוצה" })).toBeVisible();

  // הארנק: המקהלה (84 בחודש) שמורה, עוד לא נוצלה.
  await page.goto("./#/citizen");
  const wallet = page.locator("[aria-labelledby=wallet-title]");
  await expect(wallet).toContainText("נשארו 290 נקודות");
  await expect(wallet).toContainText("שמור 147 נקודות");

  // רונית רואה כרטיס "חדש בתיק" ואת המקהלה בתיק.
  const companion = await context.newPage();
  await companion.goto("./#/coordinator");
  await expect(companion.getByText(/נרשמה למקהלה קהילתית/)).toBeVisible();
  await companion.goto("./#/coordinator/patients/c1");
  await expect(companion.getByText(/מקהלה קהילתית:/).first()).toBeVisible();

  // המטה סופר.
  await companion.goto("./#/executive");
  await expect(companion.getByText(/[1-9]\d* הזמנות/)).toBeVisible();

  // הספק מדווח נוכחות: שמור הופך לנוצל, ומופיע דירוג.
  await companion.getByRole("button", { name: "הדגמה" }).click();
  await companion.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
  await page.goto("./#/citizen/activities");
  const choir = page.locator("li").filter({ hasText: "מקהלה קהילתית" });
  await expect(choir).toContainText("נוצל 21 נקודות");
  await expect(choir).toContainText("השתתפת במפגש אחד");
  await expect(choir.getByText(/דרג את מקהלה קהילתית/)).toBeVisible();
});

test("לספר מה חשוב לי: ארבע שאלות, וההמלצות מתעדכנות", async ({ page }) => {
  await page.goto("./#/citizen/needs");
  for (const label of ["ללמוד ולקרוא", "בקבוצה קטנה", "בבוקר", "להיות לבד"]) {
    await page.getByLabel(label).check();
    await page.getByRole("button", { name: /להמשיך|לשמור/ }).click();
  }
  await expect(page.getByText("ההמלצות עודכנו לפי מה שסיפרת.")).toBeVisible();
  await expect(page.getByText("סיפרת עכשיו שאת אוהבת ללמוד ולקרוא.")).toBeVisible();
  await expect(page.getByText(/מקהלה קהילתית/)).toBeVisible();
});

test("מספרים: בלי טענות לא מבוססות בדף הבית, אצל המלווה ובמטה", async ({ page }) => {
  for (const route of ["./", "./#/coordinator", "./#/executive", "./#/providers"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text, route).not.toMatch(/₪2B|2 מיליארד|4\.7\/5|65%|₪930K|80% לשירותי|Harvard|Bedrock|Nudges|Timeline/);
  }
});

test("הקהילה שלי ושוק האזרחית: אותו מספר שירותים", async ({ page }) => {
  await page.goto("./#/citizen/services");
  const citizen = (await page.locator("h1 + p").first().innerText()).match(/(\d+) שירותים מאושרים, (\d+) מהם/)!;
  await page.goto("./#/coordinator/community");
  const main = await page.locator("main").innerText();
  expect(main).toContain(`בשוק של התושבים: ${citizen[1]}`);
  expect(main).toMatch(new RegExp(`שירותים מאושרים בשכונה\\s+${citizen[2]}`));
});
