// אחרי build במצב offline: מעביר את index.html לשם קובץ ברור בעברית ומוחק את התיקייה הזמנית.
import { copyFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const NAMES = { field: "אטלס-סל-אישי-שטח.html", hq: "אטלס-סל-אישי-מטה.html" };
const app = process.argv[2];
if (!NAMES[app]) throw new Error(`app לא מוכר: ${app}`);
const dir = resolve(import.meta.dirname, "../dist/offline", app);
copyFileSync(resolve(dir, "index.html"), resolve(dir, "..", NAMES[app]));
rmSync(dir, { recursive: true, force: true });
console.log(`dist/offline/${NAMES[app]}`);
