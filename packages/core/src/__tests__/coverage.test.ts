import { describe, expect, it } from "vitest";
import { coverage, suggestServiceTypes } from "../rules/coverage";
import { defaultSeed as seed, withSettings, type Seed } from "../seed";
import type { Service } from "../model";
import { act, continuousMonths, nGeneral, nHaredi, svc } from "./fixtures";

function cover(services: Service[], neighborhoods = [nGeneral], s: Seed = seed) {
  const activity = services.flatMap((x) => act(x.id, continuousMonths));
  return coverage({ neighborhoods, services, activity }, s);
}

const cell = (r: ReturnType<typeof coverage>, neighborhoodId: string, cc: string) =>
  r.cells.find((c) => c.neighborhoodId === neighborhoodId && c.coreCategoryId === cc)!;

const health = (n: number, o: Partial<Service> = {}) =>
  Array.from({ length: n }, (_, i) => svc(`h${i}`, o));

describe("מבחן כיסוי", () => {
  it("שלושה שירותים רציפים: ירוק", () => {
    expect(cell(cover(health(3)), nGeneral.id, "health_function").level).toBe("green");
  });

  it("חסר אחד: כתום", () => {
    const c = cell(cover(health(2)), nGeneral.id, "health_function");
    expect(c.level).toBe("orange");
    expect(c.missing).toBe(1);
  });

  it("חסרים שניים ומעלה: אדום", () => {
    expect(cell(cover(health(1)), nGeneral.id, "health_function").level).toBe("red");
    expect(cell(cover([]), nGeneral.id, "belonging").level).toBe("red");
  });

  it("מוצרי מניעה לא נבדקים ברצפה", () => {
    expect(cell(cover([]), nGeneral.id, "prevention_products").level).toBe("not_checked");
  });

  it("שירות רציף שלא עבר את מבחן הכניסה ולא אושר לא נספר", () => {
    const services = [...health(2), svc("x", { marketPrice: undefined })];
    expect(cell(cover(services), nGeneral.id, "health_function").count).toBe(2);
    const approved = [...health(2), svc("x", { marketPrice: undefined, status: "אושר" })];
    expect(cell(cover(approved), nGeneral.id, "health_function").count).toBe(3);
  });

  it("סבבים של אותה תוכנית נספרים פעם אחת", () => {
    expect(cell(cover(health(3, { programId: "P" })), nGeneral.id, "health_function").count).toBe(1);
  });

  it("התראת תת-תחום קוגניטיבי כשאין מספיק שירותי 2.2", () => {
    const r = cover(health(3));
    expect(r.alerts.some((a) => a.kind === "subarea" && a.code === "2.2")).toBe(true);
  });

  it("התראה קהילתית בשכונה חרדית בלי שירות מותאם", () => {
    const belonging = (fit: Service["communityFit"]) =>
      Array.from({ length: 3 }, (_, i) =>
        svc(`b${i}`, { neighborhoodId: nHaredi.id, categoryCode: "1.1", serviceTypeId: "T01", communityFit: i === 0 ? fit : ["general"] }),
      );
    const without = cover(belonging(["general"]), [nHaredi]);
    expect(without.alerts.some((a) => a.kind === "community" && a.coreCategoryId === "belonging")).toBe(true);
    const withFit = cover(belonging(["haredi"]), [nHaredi]);
    expect(withFit.alerts.some((a) => a.kind === "community" && a.coreCategoryId === "belonging")).toBe(false);
    expect(cell(withFit, nHaredi.id, "belonging").level).toBe("green");
  });

  it("שכונה כללית לא מקבלת התראה קהילתית", () => {
    expect(cover([]).alerts.some((a) => a.kind === "community")).toBe(false);
  });

  it("שינוי הרצפה בהגדרות משנה את הכיסוי מיד", () => {
    const services = health(2);
    expect(cell(cover(services), nGeneral.id, "health_function").level).toBe("orange");
    const lowered = withSettings(seed, { core_floor: 2 });
    expect(cell(cover(services, [nGeneral], lowered), nGeneral.id, "health_function").level).toBe("green");
  });

  it("לחיצה על פער: שלושה סוגי שירות מהספרייה, בלי מה שבחוץ", () => {
    const types = suggestServiceTypes(seed, "health_function");
    expect(types).toHaveLength(3);
    expect(types.map((t) => t.id)).not.toContain("T28");
  });
});
