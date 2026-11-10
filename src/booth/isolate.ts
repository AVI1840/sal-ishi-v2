/**
 * בידוד האחסון של הדוכן. דפדפנים חולקים localStorage ו-IndexedDB בין כל קבצי file:// באותו מחשב,
 * ו"איפוס מבקר" של הדוכן מוחק את הנתונים של 0.5 לפי שם. בלי בידוד, הוא היה יכול למחוק עבודה של
 * כלי השטח והמטה (או של הכלי הראשי) שנפתחו באותו מחשב. כאן כל המפתחות והמאגרים של הדוכן
 * מקבלים קידומת, ולכן הדוכן רואה ומוחק רק את שלו. מופעל רק בגרסת הדוכן, ומיובא ראשון.
 */
import { IS_BOOTH } from "@/lib/edition";

const P = "booth::";

if (IS_BOOTH && typeof window !== "undefined") {
  try {
    const real = window.localStorage;
    const mine = () => Object.keys(real).filter((k) => k.startsWith(P));
    const wrapped = {
      get length() {
        return mine().length;
      },
      key: (i: number) => {
        const k = mine()[i];
        return k === undefined ? null : k.slice(P.length);
      },
      getItem: (k: string) => real.getItem(P + k),
      setItem: (k: string, v: string) => real.setItem(P + k, v),
      removeItem: (k: string) => real.removeItem(P + k),
      clear: () => mine().forEach((k) => real.removeItem(k)),
    } as Storage;
    Object.defineProperty(window, "localStorage", { value: wrapped, configurable: true });
  } catch {
    /* אחסון חסום: הדוכן ממשיך בלי שמירה */
  }
  try {
    const proto = IDBFactory.prototype;
    const open = proto.open;
    const del = proto.deleteDatabase;
    proto.open = function (name: string, version?: number) {
      return open.call(this, P + name, version);
    };
    proto.deleteDatabase = function (name: string) {
      return del.call(this, P + name);
    };
  } catch {
    /* אין IndexedDB */
  }
}
