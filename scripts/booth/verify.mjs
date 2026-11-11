// אימות הדוכן מקצה לקצה על הבנייה הלא מקוונת, בשלושה גדלים:
// החוט (שרה, רונית, מטה), הבחירה שמגיעה לרונית ולמטה, הפס שלא מכסה, נגישות בסיסית, ניסוח ובלי בקשות חוץ.
import { boothUrl, launch, outDir, report } from "./common.mjs";

const sizes = { d: [1280, 800], m: [390, 844], s: [360, 740], w: [1920, 1080] };
const issues = [];
const ext = [];
const bad = [/הוכחנו/, /מניעת הידרדרות/, /—/, /–/, /ROI/i, /חיסכון/, /nudge/i, /אין חיבור/, /[א-ת]\/[יתא]\b/];
const SHOTS = process.env.SHOTS === "1";

async function check(page, k, tag) {
  const r = await page.evaluate(() => {
    const bar = document.querySelector("[data-booth-tour]")?.getBoundingClientRect();
    const spot = document.querySelector(".booth-spot")?.getBoundingClientRect();
    const overlap = bar && spot && spot.bottom > bar.top + 2 && spot.top < bar.bottom && spot.right > bar.left && spot.left < bar.right;
    return {
      sw: document.documentElement.scrollWidth,
      iw: innerWidth,
      small: [...document.querySelectorAll("button,[role=button],[role=tab],select")]
        .filter((e) => e.offsetParent && e.getBoundingClientRect().height < (innerWidth < 640 ? 43 : 55) && e.getBoundingClientRect().width > 0)
        .map((e) => (e.innerText || e.ariaLabel || "").trim().slice(0, 18)),
      txt: document.body.innerText,
      overlap: !!overlap,
    };
  });
  if (r.sw > r.iw) issues.push(`${k} ${tag}: hscroll ${r.sw}>${r.iw}`);
  if (r.small.length) issues.push(`${k} ${tag}: <56px buttons: ${[...new Set(r.small)].join("|")}`);
  if (r.overlap) issues.push(`${k} ${tag}: tour bar covers the highlighted element`);
  for (const re of bad) if (re.test(r.txt)) issues.push(`${k} ${tag}: banned ${re}`);
}

/** עובר את כל המערכות ברצף עד מסך הסיום, מתעד את הטקסטים של הפס. */
async function walk(page, k, tag) {
  const seen = [];
  for (let i = 0; i < 40; i++) {
    const bar = page.locator("[data-booth-tour]");
    if (!(await bar.count())) break;
    await page.waitForTimeout(1100);
    seen.push((await bar.locator(".booth-tour__count").innerText()).trim());
    await check(page, k, `${tag}-${i}`);
    if (SHOTS) await page.screenshot({ path: `${outDir}/v3-${k}-${tag}-${String(i).padStart(2, "0")}.png` });
    await bar.locator(".booth-tour__btn:not(.booth-tour__btn--sec)").click();
    await page.waitForTimeout(900);
  }
  return seen;
}

const events = (page) =>
  page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("sal-ishi-pilot-v061-merge") || "{}").events ?? [];
    } catch {
      return [];
    }
  });

const b = await launch();
for (const [k, [w, h]] of Object.entries(sizes)) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, offline: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => issues.push(`${k} pageerror ${e.message}`));
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("file:") && !u.startsWith("data:") && !u.startsWith("blob:")) ext.push(u);
  });
  await page.goto(boothUrl + "#/");
  await page.waitForTimeout(1500);
  await check(page, k, "home");
  if (SHOTS) await page.screenshot({ path: `${outDir}/v3-${k}-home.png` });

  // החוט: שרה ← רונית ← מטה, בלי לחזור לדלתות.
  await page.click("text=אני שרה");
  await page.waitForTimeout(900);
  const seen = await walk(page, k, "thread");
  const acts = [...new Set(seen.map((s) => s.split(",")[0]))];
  if (acts.join("|") !== "שרה|רונית|המטה") issues.push(`${k}: expected thread שרה|רונית|המטה, got ${acts.join("|")}`);
  const ev = await events(page);
  if (!ev.some((e) => e.type === "booking.created" && e.citizenId === "c1" && e.actor === "citizen" && Date.now() - Date.parse(e.at) < 600000 && e.serviceName))
    issues.push(`${k}: no booking by the visitor`);
  if (!ev.some((e) => e.type === "request.created" && e.citizenId === "c1" && e.kind === "gated_service")) issues.push(`${k}: Sarah's request did not reach the companion`);
  if (!ev.some((e) => e.type === "request.decided" && e.citizenId === "c1")) issues.push(`${k}: the companion's approval of Sarah's request was not recorded`);

  // מסך הסיום: חמשת התפקידים, QR לכל אחד, והמונה.
  await page.waitForTimeout(500);
  const roles = await page.locator("#partners-h ~ ul button").count();
  if (roles !== 5) issues.push(`${k}: expected 5 role buttons, got ${roles}`);
  await page.locator("#partners-h ~ ul button").first().click();
  await page.waitForTimeout(300);
  if (!(await page.locator("svg[viewBox]").filter({ has: page.locator("path") }).count())) issues.push(`${k}: no QR after choosing a role`);
  await check(page, k, "end");
  if (SHOTS) await page.screenshot({ path: `${outDir}/v3-${k}-end.png` });
  await page.click("text=מבקר הבא");
  await page.waitForTimeout(1200);

  // כניסה מהמלווה: מלווה, מטה, שרה.
  await page.click("text=אני רונית");
  await page.waitForTimeout(900);
  const seen2 = await walk(page, k, "companion-first");
  const acts2 = [...new Set(seen2.map((s) => s.split(",")[0]))];
  if (acts2.join("|") !== "רונית|המטה|שרה") issues.push(`${k}: expected rotation רונית|המטה|שרה, got ${acts2.join("|")}`);
  await page.click("text=מבקר הבא");
  await page.waitForTimeout(1200);

  // מסלול שופטים.
  await page.click("text=מסלול שופטים");
  await page.waitForTimeout(900);
  await walk(page, k, "judges");
  await ctx.close();
}
const fontOk = await (async () => {
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await c.newPage();
  await p.goto(boothUrl + "#/");
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.fonts.load('800 1rem Heebo', 'שלום'));
  const ok = await p.evaluate(() => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Heebo' && f.status === 'loaded'));
  await c.close();
  return ok;
})();
if (!fontOk) issues.push("Heebo אינו נטען מהבנייה (הגופן הארוז)");
console.log("EXTERNAL REQUESTS:", ext.length ? ext.slice(0, 5) : "none");
const code = report("ISSUES", issues);
await b.close();
process.exit(code);
