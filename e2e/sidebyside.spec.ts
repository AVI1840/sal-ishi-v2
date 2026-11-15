import { test } from "@playwright/test";
import { readFileSync } from "node:fs";

// מחבר צילומי השוואה לתמונה אחת: קיים מימין, מאוחד משמאל. COMPARE=1 בלבד.
test.skip(!process.env.COMPARE, "רק להפקת צילומי השוואה");

const b64 = (f: string) => `data:image/png;base64,${readFileSync(`docs/v05-merge/screens/${f}`).toString("base64")}`;

for (const [name, a, b, w] of [
  ["citizen-mobile", "citizen-mobile-1-existing.png", "citizen-mobile-3-merged.png", 390],
  ["companion-desktop", "companion-desktop-1-existing.png", "companion-desktop-3-merged.png", 1280],
  ["home-desktop", "home-desktop-1-existing.png", "home-desktop-3-merged.png", 1280],
] as const) {
  test(`צד לצד ${name}`, async ({ page }) => {
    const col = w === 390 ? 420 : 900;
    await page.setViewportSize({ width: col * 2 + 60, height: 900 });
    await page.setContent(`<html dir="rtl"><body style="margin:0;font-family:Heebo,Arial;background:#eef2f7;display:flex;gap:20px;padding:20px">
      <figure style="margin:0;width:${col}px"><figcaption style="font-size:22px;font-weight:700;margin-bottom:8px">קיים (השורש היום)</figcaption><img src="${b64(a)}" style="width:100%;border:1px solid #b5c7e2"></figure>
      <figure style="margin:0;width:${col}px"><figcaption style="font-size:22px;font-weight:700;margin-bottom:8px">מאוחד (0.5, אותה שפה עיצובית)</figcaption><img src="${b64(b)}" style="width:100%;border:1px solid #b5c7e2"></figure>
    </body></html>`);
    await page.screenshot({ path: `docs/v05-merge/side-by-side-${name}.png`, fullPage: true });
  });
}
