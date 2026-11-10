// קיוסק: ספירה לאחור אחרי חוסר פעילות, איפוס במגע ובלחיצה ארוכה, מצב מציג.
import { boothUrl, launch } from "./common.mjs";

const url = boothUrl + "#/";
const issues = [];
const expect = (ok, msg) => { console.log(ok ? "ok  " : "FAIL", msg); if (!ok) issues.push(msg); };

const b = await launch();
const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.clock.install(); await page.goto(url); await page.clock.runFor(1500);
await page.click("text=אני שרה"); await page.clock.runFor(1000);
await page.clock.runFor(51000);
expect((await page.locator(".booth-idle").count()) === 1, "ספירה לאחור מופיעה אחרי כ-50 שניות");
await page.clock.runFor(10000);
expect((await page.locator("[data-booth-door]").count()) === 3, "אחרי 60 שניות חוזרים לשלוש הדלתות");
await page.click("text=אני שרה"); await page.clock.runFor(1000);
await page.clock.runFor(40000); await page.mouse.click(640, 400); await page.clock.runFor(40000);
expect((await page.locator("[data-booth-tour]").count()) === 1, "מגע מאפס את הטיימר והסיור נשאר");
await b.close();

const b2 = await launch();
const p2 = await (await b2.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p2.goto(url); await p2.waitForTimeout(1500); await p2.click("text=אני שרה"); await p2.waitForTimeout(800);
const box = await p2.locator("[data-booth-logo]").boundingBox();
await p2.mouse.move(box.x + 20, box.y + 20); await p2.mouse.down(); await p2.waitForTimeout(1500); await p2.mouse.up();
expect((await p2.locator("[data-booth-tour]").count()) === 1, "לחיצה קצרה על הלוגו משאירה את הסיור");
await p2.mouse.move(box.x + 20, box.y + 20); await p2.mouse.down(); await p2.waitForTimeout(3300); await p2.mouse.up();
await p2.waitForTimeout(800);
expect((await p2.locator("[data-booth-door]").count()) === 3 && (await p2.locator("[data-booth-tour]").count()) === 0, "לחיצה ארוכה של 3 שניות מחזירה לדלתות");
for (let i = 0; i < 5; i++) await p2.locator(".booth-badge").first().click();
await p2.waitForTimeout(500);
expect((await p2.getByText("הדגמה", { exact: true }).count()) > 0, "5 הקשות על התווית מפעילות מצב מציג");
await b2.close();
process.exit(issues.length ? 1 : 0);
