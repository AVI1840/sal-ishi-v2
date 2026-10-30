// בדיקה על הכתובת החיה, בטקסט שעל המסך: שהפריסה הגיעה (commit), שהטקסט הנכון
// מוצג, ושאין מונחים פנימיים או מספרים שהוסרו. מריץ דפדפן (Playwright).
// שימוש: node scripts/check-live.mjs [url] [commit]
//   url: ברירת מחדל https://avi1840.github.io/sal-ishi-v2/merge/
//   commit: ה-commit שמצופה (ברירת מחדל: HEAD מקומי)
//   PW_CHROMIUM=<נתיב לדפדפן> אם אין דפדפן של Playwright במכשיר.
import { execSync } from "node:child_process";
import { chromium } from "playwright";

const base = (process.argv[2] ?? "https://avi1840.github.io/sal-ishi-v2/merge/").replace(/\/?$/, "/");
const expected = process.argv[3] ?? execSync("git rev-parse --short HEAD").toString().trim();

/** מה חייב להופיע, לפי מסך. */
const MUST = {
  "#/": ["משעות לתוצאות", "שלוש דלתות"],
  "#/citizen": ["נשארו", "שמור", "נוצל", "מקהלה קהילתית"],
  "#/citizen/services": ["השוק בשכונה שלך"],
  "#/citizen/services/demoj-choir": ["להצטרף לקבוצה", "בחודש"],
  "#/coordinator": ["לפנות היום"],
  "#/executive": ["מה הוכרע במפגש 2", "₪760"],
};
/** מה אסור שיופיע באף מסך. */
const NEVER = /₪2B|הכסף מנוצל|ארנק בשקלים|760 נקודות|תוספת 3|supplier_|גרסת בסיס|\(השלמה\)|\(הפניה\)|Nudges|Timeline|—/;
const EXTRA = ["#/citizen/activities", "#/citizen/profile", "#/coordinator/patients/c1", "#/coordinator/community", "#/providers", "#/scope"];
const ATLAS = ["hq/#/", "hq/#/rules", "hq/#/export", "field/#/"];

const fails = [];
const res = await fetch(`${base}version.json?t=${Date.now()}`, { cache: "no-store" });
if (!res.ok) fails.push(`version.json: ${res.status} (פריסה ישנה, בלי חותמת בנייה)`);
const version = res.ok ? await res.json() : { version: "?", commit: "?", builtAt: "?" };
if (res.ok && !expected.startsWith(version.commit) && !version.commit.startsWith(expected)) fails.push(`בכתובת commit ${version.commit}, מצופה ${expected}`);

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
for (const route of [...Object.keys(MUST), ...EXTRA, ...ATLAS]) {
  await page.goto(base + route);
  await page.waitForTimeout(1200);
  const text = await page.locator("body").innerText();
  for (const m of MUST[route] ?? []) if (!text.includes(m)) fails.push(`${route}: חסר "${m}"`);
  const bad = text.split("\n").find((l) => NEVER.test(l));
  if (bad) fails.push(`${route}: "${bad.trim().slice(0, 80)}"`);
}
await browser.close();

console.log(`כתובת: ${base}\nגרסה ${version.version}, commit ${version.commit}, נבנה ${version.builtAt}`);
if (fails.length) {
  console.error(fails.map((f) => "  x " + f).join("\n"));
  process.exit(1);
}
console.log("  ok: הפריסה עדכנית והטקסט על המסך נכון");
