import { describe, expect, it } from "vitest";
import { complementOf, complementSentence, aboveQuarterlyCap } from "../rules/complement";
import { ENTRY_STATUS, entryTest } from "../rules/entryTest";
import { defaultSeed as seed } from "../seed";
import { svc } from "./fixtures";

// תוספת 3, סעיף 2: סל משלים בלבד. ארבעת המצבים מתנאי הקבלה.
const product = { categoryCode: "6", serviceTypeId: "T57", unit: "מוצר", format: "מוצר" };

describe("סל משלים בלבד", () => {
  it("השלמה חלקית: המממן האחר משלם חלק, הסל משלים, השתתפות על ההשלמה בלבד", () => {
    const c = complementOf(svc("a", { unitPrice: 300, pricePoints: 300, copayTier: "classes", otherFunder: true, otherFunderName: "משרד הבריאות", otherFunderCoverage: { kind: "amount", value: 200 } }), seed);
    expect(c.state).toBe("partial");
    expect(c.otherPays).toBe(200);
    expect(c.complement).toBe(100);
    expect(c.basketCovers).toBe(80); // 20% השתתפות על ההשלמה
    expect(c.citizenPays).toBe(20);
    expect(complementSentence(c)).toBe('משרד הבריאות מממן חלק. הסל משלים עד 80 ש"ח. אתה משלם 20 ש"ח.');
  });

  it("מימוש קודם נדרש: אותה השלמה, וקודם מגישים למממן", () => {
    const c = complementOf(svc("a", { unitPrice: 600, pricePoints: 600, otherFunder: true, otherFunderName: "גמלת סיעוד", otherFunderCoverage: { kind: "percent", value: 75 }, requiresPriorClaim: true }), seed);
    expect(c.state).toBe("prior_claim");
    expect(c.otherPays).toBe(450);
    expect(c.basketCovers).toBe(150);
    expect(complementSentence(c)).toMatch(/^קודם מגישים לגמלת סיעוד/);
  });

  it("מימון מלא: השלמה 0, הפניה בלבד", () => {
    const c = complementOf(svc("a", { unitPrice: 120, pricePoints: 120, otherFunder: true, otherFunderName: "סל בריאות", otherFunderCoverage: { kind: "percent", value: 100 } }), seed);
    expect(c).toMatchObject({ state: "full", complement: 0, basketCovers: 0, citizenPays: 0 });
    expect(complementSentence(c)).toContain("המלווה תעזור להגיש");
  });

  it("כיסוי חסר: חסרים נתונים", () => {
    const s = svc("a", { otherFunder: true, otherFunderName: "רווחה" });
    expect(complementOf(s, seed).state).toBe("missing");
    expect(entryTest(s, seed).status).toBe(ENTRY_STATUS.missingData);
  });

  it("מוצר עם מממן אחר: ההשלמה מוגבלת בתקרה הרבעונית, והשאר על האזרח", () => {
    const c = complementOf(svc("a", { ...product, unitPrice: 3000, pricePoints: 3000, otherFunder: true, otherFunderName: "משרד הבריאות", otherFunderCoverage: { kind: "amount", value: 2400 } }), seed);
    expect(c.complement).toBe(375);
    expect(c.basketCovers).toBe(375);
    expect(c.citizenPays).toBe(225);
  });

  it("מוצר בלי מממן אחר מעל התקרה הרבעונית: מעל התקרה", () => {
    const s = svc("a", { ...product, unitPrice: 450, pricePoints: 450 });
    expect(aboveQuarterlyCap(s, seed)).toBe(true);
    expect(entryTest(s, seed).status).toBe(ENTRY_STATUS.aboveCap);
    expect(aboveQuarterlyCap(svc("b", { ...product, unitPrice: 300, pricePoints: 300 }), seed)).toBe(false);
  });
});
