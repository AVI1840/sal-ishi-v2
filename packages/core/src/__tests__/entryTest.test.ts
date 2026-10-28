import { describe, expect, it } from "vitest";
import { ENTRY_STATUS, countsTowardCoverage, entryTest, missingMandatoryFields } from "../rules/entryTest";
import { defaultSeed as seed } from "../seed";
import { act, svc } from "./fixtures";

describe("מבחן כניסה", () => {
  it("שירות תקין: נכנס", () => {
    const r = entryTest(svc("a"), seed);
    expect(r).toEqual({ status: ENTRY_STATUS.in, step: null, reason: expect.any(String) });
  });

  it("סוג שירות שלא ברשימה הסגורה: בחוץ", () => {
    const r = entryTest(svc("a", { serviceTypeId: "T99" }), seed);
    expect(r.status).toBe(ENTRY_STATUS.outside);
    expect(r.step).toBe(1);
  });

  it("קטגוריה בשכבת בחוץ (3.3): בחוץ", () => {
    expect(entryTest(svc("a", { categoryCode: "3.3", serviceTypeId: "T38" }), seed).status).toBe(ENTRY_STATUS.outside);
  });

  it("מממן אחר: בחוץ: מממן אחר", () => {
    const r = entryTest(svc("a", { otherFunder: true }), seed);
    expect(r.status).toBe(ENTRY_STATUS.otherFunder);
    expect(r.step).toBe(2);
  });

  it("בלי קטגוריה וסוג שירות: מוחזר למיפוי", () => {
    expect(entryTest(svc("a", { categoryCode: "", serviceTypeId: "" }), seed).status).toBe(ENTRY_STATUS.remap);
  });

  it("סוג שירות שלא שייך לקטגוריה: מוחזר למיפוי", () => {
    expect(entryTest(svc("a", { categoryCode: "2.1", serviceTypeId: "T21" }), seed).status).toBe(ENTRY_STATUS.remap);
  });

  it("בלי מחיר שוק: חסרים נתונים", () => {
    const r = entryTest(svc("a", { marketPrice: undefined }), seed);
    expect(r.status).toBe(ENTRY_STATUS.missingData);
    expect(r.reason).toContain("מחיר שוק");
  });

  it("בלי מנגנון מימוש: לא נכנס עד שיש מנגנון", () => {
    expect(entryTest(svc("a", { enforceable: false }), seed).status).toBe(ENTRY_STATUS.noMechanism);
  });

  it("עוצר בכישלון הראשון לפי הסדר", () => {
    const r = entryTest(svc("a", { otherFunder: true, unitPrice: undefined, enforceable: false }), seed);
    expect(r.status).toBe(ENTRY_STATUS.otherFunder);
  });

  it("איכות חיים מתוך qol_rules נכנסת", () => {
    expect(entryTest(svc("a", { categoryCode: "5.1", serviceTypeId: "T48" }), seed).status).toBe(ENTRY_STATUS.in);
  });

  it("שירות שאושר נספר בכיסוי גם אם חסר בו מחיר", () => {
    expect(countsTowardCoverage(svc("a", { status: "אושר", marketPrice: undefined }), seed)).toBe(true);
    expect(countsTowardCoverage(svc("a", { marketPrice: undefined }), seed)).toBe(false);
  });
});

describe("שדות חובה", () => {
  it("שירות בלי פעילות: חסרה הגעה", () => {
    const missing = missingMandatoryFields(svc("a"), [], seed);
    expect(missing.map((m) => m.field)).toEqual(["attendance"]);
  });

  it("שירות מלא: אין חסרים", () => {
    expect(missingMandatoryFields(svc("a"), act("a", [["2026-01", 3]]), seed)).toEqual([]);
  });

  it("שירות ריק: כל ששת השדות חסרים", () => {
    const empty = svc("a", { unitPrice: undefined, supplierCode: "", neighborhoodId: "", languages: [], serviceTypeId: "" });
    expect(missingMandatoryFields(empty, [], seed)).toHaveLength(6);
  });
});
