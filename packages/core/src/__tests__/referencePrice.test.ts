import { describe, expect, it } from "vitest";
import { median, priceOutliers, referencePrices } from "../rules/referencePrice";
import { defaultSeed as seed, withSettings } from "../seed";
import { svc } from "./fixtures";

const priced = (prices: number[], o = {}) => prices.map((p, i) => svc(`p${i}`, { unitPrice: p, ...o }));

describe("מחיר ייחוס", () => {
  it("פחות משלוש דגימות: לא מחושב ואין חריגות", () => {
    const services = priced([100, 300]);
    expect(referencePrices(services, seed.settings)[0]).toMatchObject({ samples: 2, median: null });
    expect(priceOutliers(services, seed.settings)).toEqual([]);
  });

  it("חציון לפי סוג שירות ויחידה", () => {
    const services = [...priced([90, 100, 110]), ...priced([500, 500, 500], { unit: "מפגש" }).map((s) => ({ ...s, id: `m-${s.id}` }))];
    const refs = referencePrices(services, seed.settings);
    expect(refs).toHaveLength(2);
    expect(refs.find((r) => r.unit === "חודש")?.median).toBe(100);
    expect(refs.find((r) => r.unit === "מפגש")?.median).toBe(500);
  });

  it("חריגה של 21% מסומנת, 20% לא", () => {
    const flagged = priceOutliers(priced([100, 100, 100, 121]), seed.settings);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ unitPrice: 121, median: 100, deviation: 0.21 });
    expect(priceOutliers(priced([100, 100, 100, 120]), seed.settings)).toEqual([]);
  });

  it("שינוי סף החריגה בהגדרות משנה את הסימון מיד", () => {
    const services = priced([100, 100, 100, 121]);
    expect(priceOutliers(services, withSettings(seed, { price_outlier_threshold: 0.25 }).settings)).toEqual([]);
  });

  it("שינוי מספר הדגימות המינימלי", () => {
    const services = priced([100, 300]);
    expect(referencePrices(services, withSettings(seed, { reference_price_min_samples: 2 }).settings)[0]?.median).toBe(200);
  });

  it("חציון של מספר זוגי של ערכים", () => {
    expect(median([1, 4, 2, 3])).toBe(2.5);
  });
});
