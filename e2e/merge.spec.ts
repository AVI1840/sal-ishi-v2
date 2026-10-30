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

test("תמריצים: הצעה אישית רק למי שסומן, התמדה באישור המלווה, והנקודות בארנק", async ({ page, context }) => {
  await page.goto("./#/citizen");
  const give = page.locator("[aria-labelledby=give-title]");
  await expect(give).toContainText("להוביל שירה בציבור במועדון השכונתי");
  await expect(give).toContainText("40 נקודות על כל מפגש");

  const companion = await context.newPage();
  await companion.goto("./#/coordinator");
  await companion.getByRole("button", { name: "הדגמה" }).click();
  await companion.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
  await companion.goto("./#/coordinator/patients/c1");
  await expect(companion.getByText(/שרה השתתפה ב-3 מתוך 4 מפגשים/)).toBeVisible();
  await companion.getByRole("button", { name: /להעניק תמריץ התמדה/ }).click();
  await expect(companion.getByText(/נוספו לשרה 20 נקודות/)).toBeVisible();

  await page.goto("./#/citizen");
  await expect(page.locator("[aria-labelledby=wallet-title]")).toContainText("כולל 20 נקודות שקיבלת כתמריץ");
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
    await companion.goto("./#/coordinator/patients/c1");
    await expect(companion.getByText(/שרה השתתפה ב-3 מתוך 4 מפגשים/)).toBeVisible();
  });
}

// התסריט עצמו (docs/v05-merge/תסריט_הדגמה_מאוחד.md), שורה אחר שורה, ביום ההדגמה.
// כל מה שהמציג אומר על המסך נבדק כאן: אם התסריט והכלי נפרדים, הבדיקה נופלת.
test("התסריט: שבע דקות, שלוש דלתות, ביום ההדגמה", async ({ page, context }) => {
  await context.clock.setFixedTime(new Date("2026-11-03T08:00:00Z"));
  // 0:00 בית
  await page.goto("./#/");
  for (const t of ["משעות לתוצאות", "שלוש דלתות", "מה המדינה מקבלת", "הצעד הבא"]) await expect(page.getByText(t).first()).toBeVisible();
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
  await ronit.getByRole("button", { name: /התקשרתי והצעתי ליווי/ }).first().click();
  // 3:30 לפנות היום: הבקשה של בוריס, לאשר, סיבה, לאשר ולתעד
  await ronit.getByRole("button", { name: /^לאשר: .*בוריס/ }).click();
  await ronit.getByRole("radio").first().check();
  await ronit.getByRole("button", { name: "לאשר ולתעד" }).click();
  await expect(ronit.getByRole("button", { name: /^לאשר: .*בוריס/ })).toHaveCount(0);
  // 4:00 הספק מדווח נוכחות, ובתיק של שרה: התמדה
  await ronit.getByRole("button", { name: "הדגמה" }).click();
  await ronit.getByRole("button", { name: "הספק מדווח נוכחות של שרה" }).click();
  await ronit.goto("./#/coordinator/patients/c1");
  await expect(ronit.getByText(/שרה השתתפה ב-3 מתוך 4 מפגשים/)).toBeVisible();
  await expect(ronit.getByRole("button", { name: /להעניק תמריץ התמדה/ })).toBeVisible();
  // 4:45 הקהילה שלי: תקציב קהילה
  await ronit.goto("./#/coordinator/community");
  await expect(ronit.getByText("₪1,520 בחודש")).toBeVisible();
  await expect(ronit.getByText(/הוכרע במפגש 2/).first()).toBeVisible();
  // 5:15 מטה
  await ronit.goto("./#/executive");
  for (const t of ["מה הוכרע במפגש 2", "חלוקת ₪760: ארנק 500, ליווי 181, קהילה 20, תפעול 59", "דירוג ספק: חמישה רכיבים"]) await expect(ronit.getByText(t).first()).toBeVisible();
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

test("השירותים בשכונה: בהתאמה אישית למעלה, ואז לפי קטגוריה", async ({ page }) => {
  await page.goto("./#/citizen/services");
  await expect(page.getByRole("heading", { level: 1, name: "השירותים בשכונה שלך" })).toBeVisible();
  const personal = page.locator("section[aria-labelledby=foryou-h]");
  await expect(personal.getByRole("heading", { level: 2, name: "שירותים בהתאמה אישית עבורך" })).toBeVisible();
  await expect(personal.getByRole("link").first()).toContainText("מקהלה קהילתית");
  const byCat = page.locator("section[aria-labelledby=bycat-h]");
  await expect(byCat.getByRole("heading", { level: 2, name: "שירותים לפי קטגוריה" })).toBeVisible();
  // ההתאמה האישית נשארת למעלה גם כשבוחרים קטגוריה.
  await byCat.getByRole("button", { name: "הכל" }).isVisible();
  const chips = byCat.getByRole("group", { name: "קטגוריה" }).getByRole("button");
  await chips.nth(1).click();
  await expect(personal.getByRole("link").first()).toContainText("מקהלה קהילתית");
  expect(await byCat.getByRole("heading", { level: 3 }).count()).toBe(1);
  // בחיפוש: גם מה שבהתאמה האישית מופיע בתוצאות.
  await chips.first().click();
  await byCat.getByRole("searchbox", { name: "חיפוש שירות" }).fill("מקהלה");
  await expect(byCat.getByRole("link", { name: /מקהלה קהילתית/ })).toBeVisible();
});

test("הפס העליון בטלפון: כל הדלתות בתוך המסך, בלי חיתוך", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("./#/citizen");
  const nav = page.getByRole("navigation", { name: "שלוש הדלתות" });
  for (const name of ["בית", "שרה", "רונית", "מטה", "ספקים"]) {
    const box = (await nav.getByRole("link", { name, exact: true }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
  expect(await nav.evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
});
