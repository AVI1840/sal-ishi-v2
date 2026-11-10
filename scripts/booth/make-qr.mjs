// יוצר חמישה קודי QR (SVG) למייל עם נושא מוכן לפי תפקיד: src/booth/qr/<id>.svg.
// הספרייה qrcode אינה תלות של המאגר. נתיב אליה: QRCODE_MODULE (תיקיית node_modules/qrcode).
// הקבצים שנוצרים נשמרים במאגר, ולכן הבנייה עצמה לא צריכה את הספרייה.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./common.mjs";

const mod = process.env.QRCODE_MODULE;
if (!mod) {
  console.error("הגדירו QRCODE_MODULE לתיקיית qrcode (למשל .../node_modules/qrcode)");
  process.exit(1);
}
const QRCode = createRequire(path.join(mod, "package.json"))(mod);

// התוכן נקרא מהמקור היחיד (content.ts), כדי שהנושאים לא ייכתבו פעמיים.
const src = readFileSync(path.join(root, "src/booth/content.ts"), "utf8");
const mail = /CONTACT_MAIL = "([^"]+)"/.exec(src)?.[1];
const roles = [...src.matchAll(/id: "(\w+)",[^\n]*subject: "([^"]+)"/g)].map((m) => ({ id: m[1], subject: m[2] }));
if (!mail || roles.length !== 5) throw new Error("לא נמצאו פרטי הקשר או חמשת התפקידים ב-content.ts");

const out = path.join(root, "src/booth/qr");
mkdirSync(out, { recursive: true });
for (const r of roles) {
  const svg = await QRCode.toString(`mailto:${mail}?subject=${encodeURIComponent(r.subject)}`, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  writeFileSync(path.join(out, `${r.id}.svg`), svg);
  console.log("qr", r.id);
}
