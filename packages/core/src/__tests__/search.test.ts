import { describe, expect, it } from "vitest";
import { editDistance, normalizeHebrew, smartSearch } from "../search";

const SERVICES = [
  { id: "gym", name: "התעמלות מותאמת גיל", type: "פעילות גופנית" },
  { id: "phone", name: "קורס סמארטפון ואפליקציות", type: "אוריינות דיגיטלית" },
  { id: "club", name: "מועדון חברתי שכונתי", type: "חיבור חברתי וקהילה" },
  { id: "memory", name: "אימון זיכרון", type: "גירוי קוגניטיבי" },
  { id: "pool", name: "פעילות במים", type: "פעילות גופנית" },
];
const search = (q: string) => smartSearch(SERVICES, q, (s) => [{ text: s.name, weight: 2 }, { text: s.type, weight: 1 }]).map((h) => h.item.id);

describe("חיפוש חכם", () => {
  it("נרמול: ניקוד, אותיות סופיות וגרשיים", () => {
    expect(normalizeHebrew('שָׁלוֹם ת"ז')).toBe("שלומ תז");
  });

  it("מילה מדויקת", () => {
    expect(search("מועדון")).toEqual(["club"]);
  });

  it("מילים נרדפות: ספורט מוצא התעמלות", () => {
    expect(search("ספורט")).toContain("gym");
  });

  it("שגיאת הקלדה: סמרטפון בלי א", () => {
    expect(search("סמרטפון")).toEqual(["phone"]);
  });

  it("אותיות שימוש: לחוגי זיכרון", () => {
    expect(search("לזיכרון")).toEqual(["memory"]);
  });

  it("כל המילים בשאילתה צריכות להימצא", () => {
    expect(search("פעילות מים")).toEqual(["pool"]);
  });

  it("שאילתה ריקה מחזירה הכל בסדר המקורי", () => {
    expect(search("  ")).toEqual(SERVICES.map((s) => s.id));
  });

  it("בלי התאמה: רשימה ריקה", () => {
    expect(search("צלילה")).toEqual([]);
  });

  it("מרחק עריכה מוגבל", () => {
    expect(editDistance("סמרטפון", "סמארטפון")).toBe(1);
    expect(editDistance("abc", "xyzxyz", 2)).toBe(3);
  });
});
