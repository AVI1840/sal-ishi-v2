// הנגשה בטלפון (390px): לוח הנגישות בכל מסך, גודל טקסט שנשמר בין מסכים, ניגודיות, ללא איפוס אוטומטי בקישור משותף.
import { boothUrl, launch, report } from "./common.mjs";

const issues = [];
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, offline: true });
const page = await ctx.newPage();
const fontPx = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
const open = async () => {
  await page.getByRole("button", { name: /נגישות/ }).first().click();
  await page.waitForTimeout(250);
};

await page.goto(boothUrl + "#/");
await page.waitForTimeout(1500);
if (!(await page.getByRole("button", { name: /נגישות/ }).count())) issues.push("home: no accessibility button");
if (!(await page.getByText("לדלג לתוכן").count())) issues.push("home: no skip link");
if ((await page.evaluate(() => getComputedStyle(document.body).userSelect)) === "none") issues.push("shared link: text selection is blocked outside the kiosk");

const base = await fontPx();
await open();
const panel = page.locator("#booth-a11y-panel");
const small = await panel.locator("button").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 43).map((e) => e.innerText || e.ariaLabel));
if (small.length) issues.push(`a11y panel: <56px buttons: ${small.join("|")}`);
await panel.getByRole("button", { name: /הגדלת טקסט/ }).click();
await panel.getByRole("button", { name: /הגדלת טקסט/ }).click();
const bigger = await fontPx();
if (!(bigger > base * 1.2)) issues.push(`text size did not grow (${base} -> ${bigger})`);
await panel.getByRole("button", { name: "ניגודיות גבוהה" }).click();
if (!(await page.evaluate(() => document.documentElement.classList.contains("hc")))) issues.push("contrast toggle did not apply");
await page.keyboard.press("Escape");
if (await panel.count()) issues.push("Escape did not close the accessibility panel");

// ההגדרות נשמרות במעבר בין מסכים, ובטעינה מחדש.
await page.click("text=אני שרה");
await page.waitForTimeout(1200);
if (Math.abs((await fontPx()) - bigger) > 0.6) issues.push("text size was lost when moving to the citizen screens");
if (!(await page.evaluate(() => document.documentElement.classList.contains("hc")))) issues.push("contrast was lost when moving to the citizen screens");
await page.reload();
await page.waitForTimeout(1500);
if (!(await page.evaluate(() => document.documentElement.classList.contains("hc")))) issues.push("contrast was not kept after reload");

// בקישור משותף אין איפוס אוטומטי: דקה וחצי בלי מגע והסיור נשאר.
await page.goto(boothUrl + "#/");
await page.waitForTimeout(1000);
await page.click("text=אני שרה");
await page.waitForTimeout(1000);
await page.clock?.install?.().catch(() => undefined);
const clock = page.clock;
await clock.fastForward(95000).catch(() => undefined);
if (!(await page.locator("[data-booth-tour]").count()) || (await page.locator(".booth-idle").count())) issues.push("shared link: the idle reset fired without kiosk=1");

const code = report("A11Y", issues);
await b.close();
process.exit(code);
