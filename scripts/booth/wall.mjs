// הקיר: בחירה של מבקר בחלון אחד מופיעה בחלון שני (אותו דפדפן) תוך כמה שניות, וסיכום היום נפתח.
import { boothUrl, launch, outDir, report } from "./common.mjs";

const issues = [];
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, offline: true });
const wall = await ctx.newPage();
await wall.goto(boothUrl + "#/booth/wall");
await wall.waitForTimeout(1200);
if (!(await wall.getByText("היו הראשונים לבחור").count())) issues.push("wall: missing the invitation when the board is empty");

const page = await ctx.newPage();
await page.goto(boothUrl + "#/");
await page.waitForTimeout(1200);
await page.click("text=אני שרה");
for (let i = 0; i < 12 && (await page.locator("[data-booth-tour]").count()); i++) {
  await page.waitForTimeout(900);
  await page.locator("[data-booth-tour] .booth-tour__btn:not(.booth-tour__btn--sec)").click();
}
await page.waitForTimeout(800);
await wall.waitForTimeout(3500);
const txt = await wall.locator("main").innerText();
if (!/סלים נבנו היום/.test(txt) || !/עכשיו נבחר/.test(txt)) issues.push("wall: the visitor's choice did not reach the wall");
await wall.screenshot({ path: `${outDir}/v3-wall.png` });

await page.goto(boothUrl + "#/booth/summary");
await page.waitForTimeout(800);
if (!(await page.getByText("סיכום היום בדוכן").count())) issues.push("summary: page missing");
const code = report("WALL", issues);
await b.close();
process.exit(code);
