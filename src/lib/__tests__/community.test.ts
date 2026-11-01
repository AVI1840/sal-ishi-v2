import { describe, expect, it } from "vitest";
import { communityFor } from "../community";

describe("הקהילה שלי: תמונה מצטברת מהאטלס", () => {
  it("פסגת זאב: עשירה, ירוקה בכל תחומי הליבה", () => {
    const c = communityFor("פסגת זאב")!;
    expect(c.services).toBeGreaterThan(20);
    expect(c.categories.map((x) => x.level)).toEqual(c.categories.map(() => "green"));
    expect(c.suppliers.reduce((n, s) => n + s.count, 0)).toBeGreaterThan(3);
  });

  it("רוממה: פער ברצפה, עם חלופות", () => {
    const c = communityFor("רוממה")!;
    const gaps = c.categories.filter((x) => x.level !== "green");
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.some((g) => g.alternatives.length > 0)).toBe(true);
  });

  it("בלי נתוני אזרחים: רק מספרים מצטברים ושמות שירותים", () => {
    const text = JSON.stringify(communityFor("פסגת זאב"));
    expect(text).not.toMatch(/citizen|שרה|"c1"/);
  });
});
