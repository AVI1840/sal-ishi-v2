// כלי עזר משותפים לבדיקות הדוכן: נתיבים יחסיים למאגר, ודפדפן (Edge, ואם אין: Chromium).
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "../..");
export const outDir = path.join(root, "docs/booth/screens");
export const boothUrl = pathToFileURL(path.join(root, "dist-booth-offline/index.html")).href;

const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("playwright");

export async function launch() {
  try {
    return await chromium.launch({ channel: "msedge" });
  } catch {
    return await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  }
}

/** מסכם בדיקה: מדפיס ומחזיר קוד יציאה. */
export function report(title, issues) {
  console.log(`${title}:`, issues.length ? "\n" + issues.join("\n") : "none");
  return issues.length ? 1 : 0;
}
