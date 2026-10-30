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
  await page.getByRole("checkbox", { name: /שמע\/ה את הפרטים ואישר\/ה בעל פה/ }).check();
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
    "./#/citizen/needs", "./#/coordinator/community", "./#/coordinator/patients", "./#/executive", "./#/executive/algorithm", "./#/executive/catalog", "./#/executive/suppliers", "./#/executive/agents",
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
  await expect(page.getByRole("heading", { level: 1, name: "השירותים בשכונה שלך" })).toBeVisible();
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

test("מה חשוב לי: הפרופיל מהקליטה כבר מסומן, שרה מעדכנת, ההמלצות ורונית מתעדכנות", async ({ page }) => {
  await page.goto("./#/citizen/needs");
  await expect(page.getByRole("heading", { level: 1, name: "מה חשוב לי" })).toBeVisible();
  // מהקליטה: מה שסיפרה לרונית כבר מסומן.
  await expect(page.getByRole("button", { name: "לשיר ולשמוע מוזיקה", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "להכיר אנשים חדשים", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "אני חוששת ליפול" })).toBeVisible();
  for (const h of ["מה נותן לי משמעות", "החלום שלי", "מה אני אוהבת לעשות", "מה הייתי רוצה בחצי השנה הקרובה", "עם מי טוב לי", "מתי נוח לי", "באיזו שפה", "איפה נוח לי", "מה יעזור לי לצאת", "מה אני יכולה לתת"]) {
    await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
  }
  await page.getByRole("button", { name: "ללמוד ולקרוא", exact: true }).click();
  await page.getByRole("button", { name: /לשמור שינוי אחד ולראות המלצות/ }).click();
  await expect(page.getByText(/ההמלצות עודכנו לפי מה שסיפרת/)).toBeVisible();
  await expect(page.getByText("סיפרת עכשיו שאת אוהבת ללמוד ולקרוא.")).toBeVisible();
  await expect(page.getByText(/מקהלה קהילתית/)).toBeVisible();
  await page.goto("./#/coordinator/patients/c1");
  await page.getByRole("tab", { name: /תוכנית/ }).click();
  await expect(page.getByText(/עדכנ\/ה בעצמ\/ה: מה אוהב\/ת/)).toBeVisible();
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

test("תמריצים: כבויים עד הכרעה על המימון. לא אצל שרה ולא אצל רונית, ובמטה כהצעה", async ({ page }) => {
  await page.goto("./#/citizen");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/לתת לקהילה|נקודות על כל מפגש/)).toHaveCount(0);
  await page.goto("./#/coordinator/patients/c1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/תמריץ/)).toHaveCount(0);
  await page.goto("./#/executive");
  const inc = page.locator("section[aria-labelledby=inc-h]");
  await expect(inc.getByRole("heading", { name: "תמריצים לאזרחים: הצעה" })).toBeVisible();
  await expect(inc).toContainText("מקור המימון פתוח");
  await expect(inc).toContainText("עד ההכרעה לא מוצג לאזרחים ולמלווה");
});

test("0.6.2: בלי מספרים שלא אושרו, מקור אחד למספר השירותים, מונה ורשימה תואמים", async ({ page }) => {
  // רקע: כבוי עד אישור.
  for (const route of ["./", "./#/executive"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // הטענות עצמן (לא כל אחוז: מדד מהשטח יכול לצאת 37% במקרה).
    expect(await page.locator("body").innerText(), route).not.toMatch(/לא לפרסום|מיליון|120 אלף|קשרים חברתיים|מ-37% ל-94%|5\.5 חודשים|בהידרדרות/);
  }
  // מה הוכרע: המונה שווה למספר השורות.
  const decided = Number((await page.getByText(/\d+ הוכרעו \(מפגש 2/).innerText()).match(/(\d+) הוכרעו/)![1]);
  expect(await page.locator("section[aria-labelledby=decided-h] ul").first().locator("li").count()).toBe(decided);
  // מספר השירותים: המטה, השטח והשוק של שרה.
  const row = page.locator("section[aria-labelledby=hoods-h] tr", { hasText: "פסגת זאב" });
  const [reach, local] = (await row.locator("td").allInnerTexts()).slice(1, 3).map(Number);
  await page.goto("./#/citizen/services");
  await expect(page.locator("h1 + p").first()).toContainText(`${reach} שירותים מאושרים, ${local} מהם`);
  await page.goto("./field/#/");
  const fieldRow = page.locator("tr", { hasText: "פסגת זאב" }).first();
  await expect(fieldRow).toContainText(String(local));
  await expect(fieldRow).toContainText(String(reach));
  await expect(page.getByLabel("שם הרשות")).toHaveValue(/ירושלים/);
  // ייצוא במטה: עברית, ושמות שדות רק בגופן קוד. בלי שורות כפולות.
  await page.goto("./hq/#/export");
  const lists = page.locator(".grid--cards li");
  await expect(lists.first()).toBeVisible();
  for (const t of await lists.evaluateAll((els) => els.map((e) => [...e.childNodes].filter((n) => n.nodeName !== "CODE").map((n) => n.textContent).join("")))) expect(t).not.toMatch(/[a-z]{3,}/);
  const skipped = await page.locator(".alert li").allInnerTexts();
  expect(new Set(skipped).size).toBe(skipped.length);
  await expect(page.getByText(/פיילוט ירושלים, 5 שכונות/).first()).toBeVisible();
});

test("תפריט ההדגמה נסגר במעבר מסך", async ({ page }) => {
  await page.goto("./#/coordinator");
  await page.getByRole("button", { name: "הדגמה" }).click();
  await expect(page.locator("#demo-menu")).toBeVisible();
  await page.getByRole("link", { name: "סל אישי לאזרח" }).click();
  await expect(page.locator("#demo-menu")).toHaveCount(0);
});

// תחילת חודש: מנוי חודשי מתחדש, והנוכחות נספרת לפי חודש. אותם מספרים בשער (2.11),
// ביום ההדגמה (3.11), ובבוקר הראשון של החודש.
for (const day of ["2026-11-01T06:00:00Z", "2026-11-02T08:00:00Z", "2026-11-03T08:00:00Z"]) {
  test(`תחילת חודש (${day.slice(0, 10)}): הארנק, ההצטרפות וההתמדה כמו בתסריט`, async ({ page, context }) => {
    await context.clock.setFixedTime(new Date(day));
    await page.goto("./#/citizen");
    const wallet = page.locator("[aria-labelledby=wallet-title]");
    await expect(wallet).toContainText("נשארו 374 נקודות");
    await expect(wallet).toContainText("שמור 63 נקודות");
    await expect(wallet).toContainText("נוצל 63 נקודות");

    await page.goto("./#/citizen/services/demoj-choir");
    await page.getByRole("button", { name: "להצטרף לקבוצה" }).click();
    await page.getByRole("button", { name: "לאשר את ההצטרפות" }).click();
    await page.goto("./#/citizen");
    await expect(wallet).toContainText("נשארו 290 נקודות");
    await expect(wallet).toContainText("שמור 147 נקודות");

    const companion = await context.newPage();
    await companion.goto("./#/coordinator");
    await expect(companion.getByText(/נרשמה למקהלה קהילתית/)).toBeVisible();
    await companion.getByRole("button", { name: "הדגמה" }).click();
    await companion.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
    await page.goto("./#/citizen/activities");
    await expect(page.locator("li").filter({ hasText: "מועדון שכונתי" })).toContainText("השתתפת ב-3 מפגשים מתוך 4 החודש");
  });
}

// התסריט עצמו (docs/v05-merge/תסריט_הדגמה_מאוחד.md), שורה אחר שורה, ביום ההדגמה.
// כל מה שהמציג אומר על המסך נבדק כאן: אם התסריט והכלי נפרדים, הבדיקה נופלת.
test("התסריט: שבע דקות, שלוש דלתות, ביום ההדגמה", async ({ page, context }) => {
  await context.clock.setFixedTime(new Date("2026-11-03T08:00:00Z"));
  // 0:00 בית
  await page.goto("./#/");
  for (const t of ["מגמלה לצמיחה", "סל אישי להזדקנות מיטבית", "משעות לתוצאות", "שלוש דלתות", "מה המדינה מקבלת", "הצעד הבא"]) await expect(page.getByText(t).first()).toBeVisible();
  // 1:00 שרה: הארנק
  await page.goto("./#/citizen");
  const wallet = page.locator("[aria-labelledby=wallet-title]");
  await expect(wallet).toContainText("נשארו 374 נקודות מתוך 500");
  await expect(wallet).toContainText("שמור 63 נקודות");
  await expect(wallet).toContainText("נוצל 63 נקודות");
  // 1:30 ההמלצה מתחילה ממה שסיפרה, ואפשר להקריא
  const rec = page.locator(`section[aria-labelledby=rec-title] a[href^="#/citizen/services/"]`).first();
  await expect(rec).toContainText("מקהלה קהילתית");
  await expect(rec).toContainText("סיפרת שהחלום שלך הוא לחזור לשיר במקהלה");
  await expect(page.getByRole("button", { name: /להקריא/ }).first()).toBeVisible();
  // 2:00 השירותים בשכונה: המקהלה אצל המתנ"ס, 84 נקודות בחודש
  await page.goto("./#/citizen/services");
  await expect(page.getByRole("heading", { level: 1, name: "השירותים בשכונה שלך" })).toBeVisible();
  const card = page.getByRole("link", { name: /מקהלה קהילתית/ }).first();
  await expect(card).toContainText("84 נקודות בחודש");
  await expect(card).toContainText('המתנ"ס הקהילתי');
  // 2:30 להצטרף לקבוצה: שמור עולה, היתרה יורדת
  await card.click();
  await expect(page.getByText(/כל יום \S+ בשעה/).first()).toBeHidden();
  await page.getByRole("button", { name: "להצטרף לקבוצה" }).click();
  await expect(page.getByText(/כל יום \S+ בשעה/).first()).toBeVisible();
  await page.getByRole("button", { name: "לאשר את ההצטרפות" }).click();
  await page.goto("./#/citizen");
  await expect(wallet).toContainText("נשארו 290 נקודות");
  await expect(wallet).toContainText("שמור 147 נקודות");

  // 3:00 רונית: חדש בתיק
  const ronit = await context.newPage();
  await ronit.goto("./#/coordinator");
  await expect(ronit.getByText("שרה נרשמה למקהלה קהילתית.")).toBeVisible();
  await ronit.getByRole("button", { name: /^ראיתי: שרה/ }).click();
  await expect(ronit.getByText("שרה נרשמה למקהלה קהילתית.")).toHaveCount(0);
  // 3:30 לפנות היום: הבקשה של בוריס, לאשר, סיבה, לאשר ולתעד
  await ronit.getByRole("button", { name: /^לאשר: .*בוריס/ }).click();
  await ronit.getByRole("radio").first().check();
  await ronit.getByRole("button", { name: "לאשר ולתעד" }).click();
  await expect(ronit.getByRole("button", { name: /^לאשר: .*בוריס/ })).toHaveCount(0);
  // 4:00 הספק מדווח נוכחות: אצל שרה "נוצל", והדירוג נפתח
  await ronit.getByRole("button", { name: "הדגמה" }).click();
  await ronit.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
  await page.goto("./#/citizen/activities");
  const choir = page.locator("li").filter({ hasText: "מקהלה קהילתית" });
  await expect(choir).toContainText("נוצל 21 נקודות");
  await expect(choir.getByText(/דרג את מקהלה קהילתית/)).toBeVisible();
  // 4:45 הקהילה שלי: תקציב קהילה
  await ronit.goto("./#/coordinator/community");
  await expect(ronit.getByText("₪1,520 בחודש")).toBeVisible();
  await expect(ronit.getByText(/הוכרע במפגש 2/).first()).toBeVisible();
  // 5:15 מטה
  await ronit.goto("./#/executive");
  for (const t of ["מה הוכרע במפגש 2", "סל לאזרח בחודש: ₪760", "ארנק אישי בחודש: 500 נקודות בחודש", "דירוג ספק: חמישה רכיבים"]) await expect(ronit.getByText(t).first()).toBeVisible();
  // 6:00 ספקים ואטלס המטה
  await ronit.goto("./#/providers");
  await expect(ronit.getByText("מוכן").first()).toBeVisible();
  await ronit.goto("./hq/#/export");
  await expect(ronit.getByText(/גרסה 1\.2/).first()).toBeVisible();
  await ronit.goto("./hq/#/learning");
  await expect(ronit.getByText(/רישום דרישות למכרז/).first()).toBeVisible();
});

// אין רשת באולם: אחרי "הכנה לעבודה בלי אינטרנט", טעינה מחדש של שלוש האפליקציות בלי רשת.
test("בלי אינטרנט: אחרי ההכנה, האזרחית, המלווה והאטלסים נטענים מחדש בלי רשת", async ({ page, context }) => {
  await page.goto("./#/citizen");
  await page.getByRole("button", { name: "הדגמה" }).click();
  await page.getByRole("button", { name: /הכנה לעבודה בלי אינטרנט/ }).click();
  await expect(page.getByText(/מוכן לעבודה בלי אינטרנט/)).toBeVisible({ timeout: 20000 });
  await context.setOffline(true);
  // ניווט אמיתי (לא רק החלפת #), כדי שהדף ייטען מהמטמון.
  await page.goto("./?offline=1#/citizen");
  await expect(page.locator("[aria-labelledby=wallet-title]")).toContainText("נשארו 374 נקודות");
  await page.goto("./?offline=2#/coordinator");
  await expect(page.getByText("לפנות היום").first()).toBeVisible();
  await page.goto("./hq/?offline=3#/");
  await expect(page.getByRole("link", { name: /לסל האישי/ }).first()).toBeVisible();
  await page.goto("./field/?offline=4#/");
  await expect(page.locator("main")).not.toBeEmpty();
  await context.setOffline(false);
});

// טלפון צר (360) וטקסט מוגדל (137%): בלי גלילה לצדדים במסכים של האזרחית.
test("טקסט מוגדל בטלפון צר: בלי גלילה לצדדים", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("./#/citizen");
  const size = page.getByRole("button", { name: /גודל טקסט/ });
  await size.click();
  await size.click();
  await expect(size).toHaveAttribute("aria-label", /137 אחוז/);
  for (const r of ["citizen", "citizen/services", "citizen/services/demoj-choir", "citizen/activities", "citizen/needs", "citizen/profile"]) {
    await page.goto(`./#/${r}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test("השוק: חמש דרכים לחפש, נושאים, סינון ושתי תצוגות", async ({ page }) => {
  await page.goto("./#/citizen/services");
  await expect(page.getByRole("heading", { level: 1, name: "השירותים בשכונה שלך" })).toBeVisible();
  const how = page.getByRole("radiogroup", { name: "איך לחפש" });
  // ברירת המחדל: מומלץ לי, שלוש המלצות קודם, ואז "עוד".
  await expect(how.getByRole("radio", { name: /מומלץ לי/ })).toHaveAttribute("aria-checked", "true");
  const results = page.locator("section[aria-labelledby=results-h]");
  await expect(results.getByRole("link").first()).toContainText("מקהלה קהילתית");
  expect(await results.locator("ul > li").count()).toBe(3);
  await results.getByRole("button", { name: /עוד שירותים שמתאימים לך/ }).click();
  expect(await results.locator("ul > li").count()).toBeGreaterThan(3);
  // כל השירותים, קרוב לבית, פופולרי
  await how.getByRole("radio", { name: /כל השירותים/ }).click();
  await expect(results.getByRole("button", { name: /להראות עוד 12/ })).toBeVisible();
  await how.getByRole("radio", { name: /קרוב לבית/ }).click();
  await expect(results.getByText(/מגיע אלייך הביתה|בשכונה שלך/).first()).toBeVisible();
  await how.getByRole("radio", { name: /פופולרי בשכונה/ }).click();
  await expect(results.getByText(/פופולרי/).first()).toBeVisible();
  // לפי נושא: אריחים עם תמונה, ובחירה מסננת
  await how.getByRole("radio", { name: /לפי נושא/ }).click();
  const topics = page.getByRole("group", { name: "נושא" });
  await topics.getByRole("button", { name: /שייכות ומשמעות/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: /שייכות ומשמעות/ })).toBeVisible();
  // סינון מהיר ותצוגה
  await page.getByRole("button", { name: "בבית או בטלפון" }).click();
  await expect(page.getByRole("button", { name: "בבית או בטלפון" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "בבית או בטלפון" }).click();
  await page.getByRole("button", { name: "רשימה" }).click();
  await expect(page.getByRole("button", { name: "רשימה" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "כרטיסים" }).click();
  // חיפוש
  await page.getByRole("searchbox", { name: "חיפוש שירות" }).fill("מקהלה");
  await how.getByRole("radio", { name: /כל השירותים/ }).click();
  await topics.getByRole("button", { name: /שייכות ומשמעות/ }).isVisible();
  await expect(results.getByRole("link", { name: /מקהלה קהילתית/ })).toBeVisible();
});

test("הפס העליון בטלפון: כל הדלתות בתוך המסך, בלי חיתוך", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("./#/citizen");
  const nav = page.getByRole("navigation", { name: "שלוש הדלתות" });
  for (const name of ["בית", "סל אישי לאזרח", "מלווה", "מטה", "ספקים"]) {
    const box = (await nav.getByRole("link", { name, exact: true }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
  expect(await nav.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
});

test("המלווה: שם, תפריט מקיף, והאטלס בתוך הכלי", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("./#/coordinator");
  const side = page.locator("#app-sidebar");
  await expect(side.getByText("מלווה", { exact: true })).toBeVisible();
  for (const n of ["היום שלי", "האזרחים שלי", "השירותים בשכונה", "הקהילה שלי", "אטלס השכונה"]) await expect(side.getByRole("link", { name: n })).toBeVisible();
  await side.getByRole("link", { name: "אטלס השכונה" }).click();
  const atlas = page.frameLocator("iframe[title='אטלס השכונה']");
  await expect(atlas.getByText("הרשות שלי").first()).toBeVisible();
  await expect(atlas.getByRole("link", { name: "לסל האישי" })).toHaveCount(0);
  await page.goto("./#/executive/atlas");
  await expect(page.frameLocator("iframe[title='אטלס המטה']").getByText(/פיילוט ירושלים, 5 שכונות/).first()).toBeVisible();
});

test("מטה וספקים: מדדים מהשטח, ספריית הסל, אלגוריתם אמיתי, והספק מדווח נוכחות מהפורטל", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("./#/executive");
  await expect(page.getByRole("heading", { name: "מדדי הפיילוט לפי שכונה" })).toBeVisible();
  await expect(page.locator("section[aria-labelledby=kpi-h] tbody tr")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "התקציב החודשי של הפיילוט" })).toBeVisible();
  await page.goto("./#/executive/catalog");
  await expect(page.getByRole("heading", { level: 1, name: "ספריית הסל מול השטח" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /^ריקוד/ }).first()).toBeVisible();
  await page.goto("./#/executive/algorithm");
  await expect(page.getByText(/8 הראשונים בקטלוג של פסגת זאב/)).toBeVisible();
  // בלי Math.random: אותה רשימה בכל טעינה.
  const first = await page.locator(".libi-card").last().innerText();
  await page.reload();
  expect(await page.locator(".libi-card").last().innerText()).toBe(first);

  // שרה מצטרפת, והספק (המתנ"ס) רואה ומדווח.
  await page.goto("./#/citizen/services/demoj-choir");
  await page.getByRole("button", { name: "להצטרף לקבוצה" }).click();
  await page.getByRole("button", { name: "לאשר את ההצטרפות" }).click();
  await page.goto("./#/providers");
  await expect(page.getByText("גרסה 1.2").first()).toBeVisible();
  const market = page.locator("section[aria-labelledby=market-h]");
  await expect(market.getByRole("row", { name: /שרה כ\. מקהלה קהילתית/ })).toBeVisible();
  await market.getByRole("button", { name: "לדווח נוכחות: שרה כ., מקהלה קהילתית" }).click();
  await expect(market.getByRole("row", { name: /מקהלה קהילתית/ })).toContainText("1 מתוך 4");
  await page.goto("./#/citizen/activities");
  await expect(page.locator("li").filter({ hasText: "מקהלה קהילתית" })).toContainText("נוצל 21 נקודות");
});
