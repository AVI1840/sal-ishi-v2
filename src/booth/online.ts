/**
 * הדוכן רץ בלי רשת, ולכן המוצר לא אמור להודיע "אין חיבור". כאן הדפדפן מדווח תמיד שיש חיבור
 * ואירוע offline נבלע. ההדמיה "אין אינטרנט" של מצב המציג (תפריט הדגמה) ממשיכה לעבוד:
 * היא נשענת על ההגדרה במוצר ולא על הדפדפן. מופעל רק בגרסת הדוכן, ומיובא ראשון.
 */
import { IS_BOOTH } from "@/lib/edition";

if (IS_BOOTH && typeof window !== "undefined") {
  try {
    Object.defineProperty(Navigator.prototype, "onLine", { get: () => true, configurable: true });
  } catch {
    /* אין אפשרות לדרוס: הפס יופיע רק בלי רשת */
  }
  window.addEventListener("offline", (e) => e.stopImmediatePropagation(), true);
}
