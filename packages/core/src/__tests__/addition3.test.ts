import { describe, expect, it } from "vitest";
import { buildDemoAuthority, buildDemoNationalChannel } from "../demo";
import { coverage, gapAlternatives } from "../rules/coverage";
import { defaultSeed as seed, withSettings } from "../seed";

// תוספת 3, סעיף 3: רצפה עם גיוון ונגישות, יעד עושר כמדד, ופערים עם חלופות.
const data = buildDemoAuthority(2);
const national = buildDemoNationalChannel();
const source = { ...data, services: [...data.services, ...national.services] };
const hood = (name: string) => data.neighborhoods.find((n) => n.name === name)!;
const cell = (result: ReturnType<typeof coverage>, name: string, cc: string) => result.cells.find((c) => c.neighborhoodId === hood(name).id && c.coreCategoryId === cc)!;

describe("רצפה, גיוון, נגישות ויעד עושר", () => {
  const result = coverage(data, seed);

  it("פסגת זאב: ירוקה בכל הליבה, ובשייכות, בריאות ודיגיטל עומדת ביעד העושר (5)", () => {
    for (const cc of ["belonging", "health_function", "resilience", "digital"]) expect(cell(result, "פסגת זאב", cc).level, cc).toBe("green");
    // בחוסן יש בטבלה של תוספת 3 רק שלושה סוגים מקומיים, ולכן היעד לא מושג. זה מדד, לא חסימה.
    for (const cc of ["belonging", "health_function", "digital"]) {
      const c = cell(result, "פסגת זאב", cc);
      expect(c.count, cc).toBeGreaterThanOrEqual(c.target ?? 5);
    }
  });

  it("יעד העושר הוא מדד ולא חוסם: קטמון ירוקה עם 3, מתחת ליעד", () => {
    const c = cell(result, "קטמון", "belonging");
    expect(c.level).toBe("green");
    expect(c.count).toBeLessThan(c.target!);
  });

  it("גילה: בריאות ותפקוד בלי שירות נגיש להליכון מקבלת התראת נגישות", () => {
    expect(result.alerts.some((a) => a.neighborhoodId === hood("גילה").id && a.coreCategoryId === "health_function" && a.kind === "accessible")).toBe(true);
    expect(result.alerts.some((a) => a.neighborhoodId === hood("קטמון").id && a.kind === "accessible")).toBe(false);
  });

  it("עיר גדולה: שירות אזורי לא נספר ברצפה של שכונה אחרת; ברשות קטנה עד אחד", () => {
    expect(result.cells.filter((c) => c.neighborhoodId === hood("קטמון").id).every((c) => (c.nonlocal ?? 0) === 0)).toBe(true);
    const small = withSettings(seed, { large_city_authorities: [] });
    const r2 = coverage(data, small);
    expect(r2.cells.some((c) => c.neighborhoodId === hood("קטמון").id && (c.nonlocal ?? 0) === 1)).toBe(true);
    expect(r2.cells.every((c) => (c.nonlocal ?? 0) <= 1)).toBe(true);
  });

  it("שכונה דלה (רוממה): פערים אדומים, עם חלופות אזוריות ומרחוק", () => {
    expect(cell(result, "רוממה", "resilience").level).toBe("red");
    const alt = gapAlternatives(source, seed, hood("רוממה").id, "resilience");
    expect(alt.regional.length + alt.remote.length).toBeGreaterThan(0);
    expect(alt.remote.every((s) => s.serviceMode === "remote")).toBe(true);
  });

  it("מוצרים לא נספרים ברצפה", () => {
    expect(cell(result, "פסגת זאב", "prevention_products").level).toBe("not_checked");
  });
});
