import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// תנאי הקבלה של 0.5, על האתר הבנוי. כל בדיקה מתחילה בדפדפן נקי, ולכן בנתוני
// הפתיחה של ההדגמה.

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

const mainNav = (page: Page) => page.getByRole("navigation", { name: "ניווט ראשי" });

test("מבחן הסבתא: ארנק, הזמנה, ביטול ובקשת עזרה, בפחות מ-3 דקות", async ({ page }) => {
  const started = Date.now();
  await page.goto("./");
  await page.getByRole("link", { name: /שרה, 78/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "שלום, שרה" })).toBeVisible();
  await expect(page.getByText("נשארו לך")).toBeVisible();
  await noHorizontalScroll(page);

  await page.getByRole("link", { name: "למצוא חוג או שירות" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "שירותים שמתאימים לך" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2 }) })).toHaveCount(3);
  await page.getByRole("link", { name: /^לפרטים/ }).first().click();
  const name = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
  await page.getByRole("link", { name: "להזמין" }).click();
  const radios = page.getByRole("radio");
  if (await radios.count()) {
    expect(await radios.count()).toBeLessThanOrEqual(3);
    await radios.first().check();
    await page.getByRole("button", { name: "לבדוק ולאשר" }).click();
  }
  await page.getByRole("button", { name: "לאשר את ההזמנה" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה נקלטה" })).toBeVisible();

  await page.getByRole("link", { name: "לפעילויות שלי" }).click();
  await page.getByRole("link", { name: `לבטל: ${name}` }).click();
  await page.getByRole("button", { name: "כן, לבטל" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה בוטלה" })).toBeVisible();

  await mainNav(page).getByRole("link", { name: "עזרה" }).click();
  await page.getByRole("button", { name: "שיחזרו אליי" }).click();
  await expect(page.getByText(/קיבלה את הבקשה/)).toBeVisible();
  expect(Date.now() - started).toBeLessThan(180_000);
});

test("כל כפתור בצד האזרח לפחות 48 פיקסלים, ובכל מסך יש דרך למלווה", async ({ page }) => {
  for (const route of ["citizen", "citizen/find", "citizen/service/demoj-balance", "citizen/activities", "citizen/needs"]) {
    await page.goto(`./#/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "לדבר עם המלווה" })).toBeVisible();
    const small = await page.$$eval("main a, main button, main select, nav a, header button", (els) =>
      els
        .map((e) => ({ text: (e.textContent ?? "").trim().slice(0, 30), r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0 && (r.height < 48 || r.width < 48))
        .map(({ text }) => text),
    );
    expect(small, route).toEqual([]);
  }
});

test("שירות מותנה: האזרחית מבקשת, המלווה מאשרת בשלוש נגיעות, האזרחית רואה", async ({ page, context }) => {
  await page.goto("./#/citizen/service/demoj-care");
  await page.getByRole("button", { name: "לבקש מהמלווה" }).click();
  await expect(page.getByText("מחכה לתשובת המלווה")).toBeVisible();

  const companion = await context.newPage();
  await companion.goto("./#/companion/requests");
  await companion.getByRole("button", { name: "לאשר: סל טיפוח לשרה כ.", exact: true }).click(); // 1
  await companion.getByRole("radio", { name: "צורך שזוהה בביקור" }).check(); // 2
  await companion.getByRole("button", { name: "לאשר ולתעד" }).click(); // 3
  await expect(companion.getByText("אושר: צורך שזוהה בביקור").first()).toBeVisible();

  await page.bringToFront();
  await expect(page.getByText("המלווה אישרה")).toBeVisible();
  await expect(page.getByRole("link", { name: "להזמין: סל טיפוח" })).toBeVisible();
});

test("שירות שנדחה: האזרחית רואה את הסיבה ומה אפשר לעשות", async ({ page, context }) => {
  await page.goto("./#/citizen/service/demoj-care");
  await page.getByRole("button", { name: "לבקש מהמלווה" }).click();
  const companion = await context.newPage();
  await companion.goto("./#/companion/requests");
  await companion.getByRole("button", { name: "לא לאשר: סל טיפוח לשרה כ.", exact: true }).click();
  await companion.getByRole("radio", { name: "יש שירות אחר שעונה על הצורך" }).check();
  await companion.getByRole("button", { name: "לדחות ולתעד" }).click();
  await page.bringToFront();
  await expect(page.getByText("הסיבה: יש שירות אחר שעונה על הצורך")).toBeVisible();
  await expect(page.getByText("אפשר לדבר עם המלווה ולשאול מה עוד אפשר.")).toBeVisible();
});

test("יום בחיי מלווה: מי דורש פנייה היום, הזמנה בשם האזרחית עם אישור בעל פה", async ({ page }) => {
  await page.goto("./#/companion");
  await expect(page.getByRole("heading", { level: 1, name: "לפנות היום" })).toBeVisible();
  const today = page.getByRole("region", { name: /^היום/ }).or(page.locator("section", { has: page.getByRole("heading", { name: /^היום \(/ }) }));
  await expect(today.getByText("אשפוז").first()).toBeVisible();
  await noHorizontalScroll(page);

  await page.goto("./#/companion/person/c1");
  await page.getByRole("button", { name: "להזמין בשמו/ה" }).click();
  await page.getByRole("radio").first().check();
  await expect(page.getByText(/להקריא ל/)).toBeVisible();
  const submit = page.getByRole("button", { name: "להזמין ולתעד את האישור" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await submit.click();
  await expect(page.getByText("ההזמנה נרשמה, עם האישור בעל פה ביומן.")).toBeVisible();
  await page.goto("./#/companion/log");
  await expect(page.getByText("בשם האזרח/ית, אישור בעל פה.").first()).toBeVisible();
});

test("אשפוז: המלווה רושמת, והפעילויות של האזרחית מוקפאות", async ({ page, context }) => {
  await page.goto("./#/companion/person/c1");
  await page.getByRole("button", { name: "אשפוז" }).click();
  await page.getByRole("button", { name: "לרשום אשפוז" }).click();
  const citizen = await context.newPage();
  await citizen.goto("./#/citizen/activities");
  await expect(citizen.getByText("מוקפא בזמן האשפוז").first()).toBeVisible();
  await expect(citizen.getByText(/אנחנו יודעים שיש אשפוז/)).toBeVisible();
});

test("איפוס בלחיצה אחת מחזיר את נקודת ההתחלה", async ({ page }) => {
  await page.goto("./#/citizen/help");
  await page.getByRole("button", { name: "שיחזרו אליי" }).click();
  await page.goto("./#/companion/requests");
  await expect(page.getByRole("heading", { name: "פתוחות (3)" })).toBeVisible();
  await page.goto("./");
  await page.getByRole("main").getByRole("button", { name: "איפוס ההדגמה" }).click();
  await expect(page.getByText("ההדגמה אופסה")).toBeVisible();
  await page.goto("./#/companion/requests");
  await expect(page.getByRole("heading", { name: "פתוחות (2)" })).toBeVisible();
});

test("ברשת חלשה: שינויים ממתינים ומסתנכרנים כשהחיבור חוזר", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("checkbox", { name: "אין אינטרנט (הדמיה)" }).check();
  await page.goto("./#/companion/person/p004");
  await expect(page.getByText(/אין חיבור/)).toBeVisible();
  await page.getByRole("button", { name: "תיעוד ביקור" }).click();
  await page.getByRole("button", { name: "שיחת טלפון" }).click();
  await page.getByRole("button", { name: "לשמור ביומן" }).click();
  await expect(page.getByText("שינוי אחד ממתין לסנכרון")).toBeVisible();
  await page.goto("./");
  await page.getByRole("checkbox", { name: "אין אינטרנט (הדמיה)" }).uncheck();
  await page.goto("./#/companion");
  await expect(page.getByText("הכל מסונכרן")).toBeVisible({ timeout: 10_000 });
});

test("שפות: ערבית מימין לשמאל ורוסית משמאל לימין, עם תווית טיוטה", async ({ page }) => {
  await page.goto("./#/citizen");
  await page.getByRole("combobox", { name: "שפה" }).selectOption("ar");
  await expect(page.locator(".pilot")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText(/לאמת/)).toBeVisible();
  await page.getByRole("combobox").selectOption("ru");
  await expect(page.locator(".pilot")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Здравствуйте, שרה");
});

test("טקסט ב-200 אחוז בלי שבירה", async ({ page }) => {
  for (const route of ["citizen", "citizen/find", "citizen/service/demoj-balance", "companion", "companion/person/c1", ""]) {
    await page.goto(`./#/${route}`);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await noHorizontalScroll(page);
  }
});

test("נגישות: axe בלי ליקויים חמורים בכל המסכים", async ({ page }) => {
  const routes = [
    "./", "./#/scope", "./#/citizen", "./#/citizen/find", "./#/citizen/service/demoj-balance", "./#/citizen/book/demoj-balance",
    "./#/citizen/activities", "./#/citizen/help", "./#/citizen/needs", "./#/companion", "./#/companion/requests",
    "./#/companion/caseload", "./#/companion/person/c1", "./#/companion/log", "./hq/#/", "./hq/#/learning", "./hq/#/history",
    "./hq/#/rules", "./hq/#/export", "./hq/#/gaps", "./#/companion/session/c2", "./#/companion/review/c1", "./field/#/", "./field/#/learning",
  ];
  const problems: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of result.violations.filter((x) => x.impact === "serious" || x.impact === "critical")) problems.push(`${route}: ${v.id} (${v.nodes.length})`);
  }
  expect(problems).toEqual([]);
});

test("נתונים של 0.4 נטענים במטה של 0.5 בלי שגיאה", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./hq/#/");
  await expect(page.getByRole("heading", { level: 1, name: "סקירה" })).toBeVisible();
  // לוקחים את מה ש-0.5 שמר, מורידים את השדה החדש (audit), כותבים לשם המאגר של 0.4,
  // ומוחקים את המאגר של 0.5: כמו משתמש שעבד ב-0.4 ופותח את 0.5 בפעם הראשונה.
  const pilots = await page.evaluate(async () => {
    const open = (name: string) =>
      new Promise<IDBDatabase>((res, rej) => {
        const r = indexedDB.open(name, 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    const req = <T,>(r: IDBRequest<T>) => new Promise<T>((res, rej) => ((r.onsuccess = () => res(r.result)), (r.onerror = () => rej(r.error))));
    await new Promise((r) => setTimeout(r, 800));
    const v5 = await open("sal-ishi-hq-v05");
    const saved = (await req(v5.transaction("kv").objectStore("kv").get("hq-state"))) as { audit?: unknown; state: { neighborhoods: { authority: string }[] } };
    delete saved.audit;
    const legacy = await open("sal-ishi-hq");
    await req(legacy.transaction("kv", "readwrite").objectStore("kv").put(saved, "hq-state"));
    legacy.close();
    v5.close();
    await new Promise<void>((res) => {
      const d = indexedDB.deleteDatabase("sal-ishi-hq-v05");
      d.onsuccess = d.onerror = d.onblocked = () => res();
    });
    return new Set(saved.state.neighborhoods.map((n) => n.authority)).size;
  });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "סקירה" })).toBeVisible();
  await expect(page.getByText(`${pilots} פיילוטים`)).toBeVisible();
  expect(errors).toEqual([]);
});

test("עבודה בלי אינטרנט אחרי הכנה מראש", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: "הכנה לעבודה בלי אינטרנט" }).click();
  await expect(page.getByText(/מוכן לעבודה בלי אינטרנט/)).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "הדגמה: שלוש דמויות" })).toBeVisible();
  await page.getByRole("link", { name: /שרה, 78/ }).click();
  // הדמיית הרשת של Playwright לא משנה את navigator.onLine בדף שה-service worker משרת,
  // ולכן כאן בודקים שהמסלול עובד. הבאנר "אין חיבור" נבדק בבדיקת הרשת החלשה.
  await expect(page.getByRole("heading", { level: 1, name: "שלום, שרה" })).toBeVisible();
  await page.getByRole("link", { name: "למצוא חוג או שירות" }).click();
  await page.getByRole("link", { name: /^לפרטים/ }).first().click();
  await page.getByRole("link", { name: "להזמין" }).click();
  if (await page.getByRole("radio").count()) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "לבדוק ולאשר" }).click();
  }
  await page.getByRole("button", { name: "לאשר את ההזמנה" }).click();
  await expect(page.getByRole("heading", { name: "ההזמנה נקלטה" })).toBeVisible();

  // המטה בלי רשת: דרך קובץ ה-offline היחיד (dist/offline). דרך ה-service worker עוד לא נבדק (פער ידוע).
  await context.setOffline(false);
});

test("פנקס למידה: רשומות פתיחה ורישום דרישות למכרז", async ({ page }) => {
  await page.goto("./hq/#/learning");
  await expect(page.getByRole("heading", { level: 1, name: "פנקס למידה" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "רישום דרישות למכרז (Excel)" }).click();
  expect((await download).suggestedFilename()).toMatch(/^רישום_דרישות_למכרז_.*\.xlsx$/);
});

test("תוספת 3: פגישה משותפת, שאלון, המלצות עם למה ובדיקת תקציב חיה", async ({ page }) => {
  await page.goto("./#/companion/person/c2");
  await page.getByRole("link", { name: "פגישה משותפת: שאלון והמלצות" }).click();
  await expect(page.getByText("שאלה 1 מתוך 8")).toBeVisible();
  await page.getByRole("button", { name: "למלא תשובות לדוגמה (הדגמה)" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "מה מתאים לאהרון" })).toBeVisible();
  await expect(page.getByText("למה זה מתאים:").first()).toBeVisible();
  const box = page.getByRole("checkbox", { disabled: false }).first();
  await box.check();
  await expect(page.getByText(/נבחר החודש ₪[1-9]/)).toBeVisible();
  await page.getByRole("button", { name: /^לאשר את הבחירה/ }).click();
  await expect(page.getByRole("heading", { name: "הסל נבחר" })).toBeVisible();
  await page.getByRole("link", { name: "למעקב החודשי" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /מעקב חודשי/ })).toBeVisible();
});

test("תוספת 3: סל משלים בלבד בצד האזרח, והפניה עם משימת מיצוי למלווה", async ({ page }) => {
  await page.goto("./#/citizen/service/demoj-nutrition");
  await expect(page.getByText(/סל בריאות מממן חלק. הסל משלים עד ₪/)).toBeVisible();
  await page.goto("./#/citizen/service/demoj-checkups");
  await expect(page.getByText("סל בריאות מממן את זה. לא צריך את הסל.")).toBeVisible();
  await expect(page.getByRole("link", { name: "להזמין" })).toHaveCount(0);
  await page.getByRole("button", { name: "לבקש עזרה בהגשה" }).click();
  await page.goto("./#/companion/person/c1");
  await expect(page.getByText(/משימת מיצוי: בדיקות מונעות/)).toBeVisible();
});

test("תוספת 3: פערים וחלופות במטה, ויעד עושר כמדד", async ({ page }) => {
  await page.goto("./hq/#/gaps");
  await expect(page.getByRole("heading", { level: 1, name: "פערים וחלופות" })).toBeVisible();
  await expect(page.getByText(/יעד עושר:/)).toBeVisible();
  await expect(page.getByRole("row", { name: /רוממה/ }).first()).toBeVisible();
  await expect(page.getByText(/^מרחוק:/).first()).toBeVisible();
});
