import { test } from "@playwright/test";

// צילומי השוואה: הכלי הקיים (השורש באתר) מול הגרסה המאוחדת (הבנייה המקומית).
// רץ רק במפורש: COMPARE=1 npx playwright test compare
test.skip(!process.env.COMPARE, "רק להפקת צילומי השוואה");

const LIVE = "https://avi1840.github.io/sal-ishi-v2/";
const NEXT = "https://avi1840.github.io/sal-ishi-v2/next/";
const pages = [
  { name: "citizen", path: "#/citizen", next: "#/citizen" },
  { name: "companion", path: "#/coordinator", next: "#/companion" },
  { name: "home", path: "#/", next: "#/" },
];

for (const p of pages) {
  test(`השוואה ${p.name}`, async ({ page }, info) => {
    const size = info.project.name;
    const shot = async (url: string, label: string) => {
      await page.goto(url);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `docs/v05-merge/screens/${p.name}-${size}-${label}.png`, fullPage: false });
    };
    await shot(LIVE + p.path, "1-existing");
    await shot(NEXT + p.next, "2-next");
    await shot("./" + p.path, "3-merged");
  });
}
