// תנאי השירות בכלי המרכזי (גרסה 0.4): המיפוי מהקטלוג המאושר, שער המלווה והטקסטים.

import { describe, expect, it } from "vitest";
import { defaultSeed, withSettings } from "@sal-ishi/core/citizen";
import { buildDemoCatalogs, toRawServices } from "@/data/catalogSource";
import { costNote, costType, needsCompanion, termLines } from "@/lib/serviceTerms";
import type { RealService } from "@/data/realServices";

const raw = (seed = defaultSeed) => toRawServices(buildDemoCatalogs(seed), seed) as unknown as RealService[];
const byType = (list: RealService[], type: string) => list.find((s) => s.serviceTypeId === type)!;

describe("מיפוי תנאי השירות לכלי המרכזי", () => {
  const list = raw();

  it("שירות קבוצתי מקבל אופן מתן, ביטול ואי-הגעה מההגדרות", () => {
    const s = byType(list, "T01");
    expect(s.serviceMode).toBe("group");
    expect(s.cancellationNoticeHours).toBe(24);
    expect(s.noShowCharged).toBe(false);
    expect(termLines(s).map((t) => t.term)).toEqual(expect.arrayContaining(["אופן מתן", "ביטול", "אי-הגעה", "חלוקת העלות"]));
  });

  it("שינוי שעות הביטול בהגדרות משתנה בקטלוג", () => {
    const changed = withSettings(defaultSeed, { cancellation_notice_hours: { ...defaultSeed.settings.cancellation_notice_hours, group: 12 } });
    expect(byType(raw(changed), "T01").cancellationNoticeHours).toBe(12);
  });

  it("שירות שנפתח באישור מלווה מסומן ולא נבחר ישירות", () => {
    const gated = list.filter((s) => needsCompanion(s));
    expect(gated.length).toBeGreaterThan(0);
    expect(gated.every((s) => Boolean(s.gateReason))).toBe(true);
    expect(termLines(gated[0]!).some((t) => t.term === "פתיחה" && t.text.startsWith("באישור המלווה"))).toBe(true);
    expect(needsCompanion(byType(list, "T01"))).toBe(false);
  });

  it("מוצר ארצי: בלי אופן מתן ובלי תנאי ביטול", () => {
    const product = byType(list, "T54");
    expect(product.serviceMode).toBeNull();
    expect(termLines(product).some((t) => t.term === "ביטול")).toBe(false);
  });

  it("איכות חיים בסכום קבוע: מה שמכוסה והשאר על האזרח", () => {
    const coffee = byType(list, "T48");
    // הערך בכלל איכות החיים הוא 50 נקודות, והמחיר בהדגמה של ירושלים מעט גבוה ממנו.
    expect(coffee.coveredPoints).toBe(50);
    expect(coffee.copayPoints).toBe((coffee.pricePoints as number) - 50);
    expect(coffee.cost_note).toContain("עליך");
    const percent = withSettings(defaultSeed, { qol_mode: { ...defaultSeed.settings.qol_mode, value: "percent" } });
    const c2 = byType(raw(percent), "T48");
    expect(c2.copayBasis).toBe("qol_percent");
    expect(c2.copayPoints).toBeGreaterThan(0);
    expect(c2.cost).toBe("subsidized");
  });
});

describe("טקסטי העלות והתנאים", () => {
  it("חלוקה שלא נקבעה מוצגת כטרם נקבעה", () => {
    expect(costNote({ pricePoints: 100, unit: "חודש", copayRate: 0.5, coveredPoints: null, copayPoints: null })).toContain("טרם נקבעה");
  });
  it("קטלוג ישן בלי חלוקה: לפי שיעור ההשתתפות", () => {
    expect(costNote({ pricePoints: 100, unit: "חודש", copayRate: 0.2 })).toContain("השתתפות עצמית 20%");
    expect(costType({ copayRate: 0 })).toBe("free");
    expect(costType({ copayRate: 0.2 })).toBe("subsidized");
  });
  it("שעות ביטול שלא נקבעו לא נעלמות", () => {
    const s = { serviceMode: "individual", cancellationNoticeHours: null, noShowCharged: true } as RealService;
    expect(termLines(s).find((t) => t.term === "ביטול")?.text).toContain("טרם נקבעו");
  });
  it("בלי em dash בטקסטים החדשים", () => {
    const dash = String.fromCharCode(0x2014);
    const all = raw().flatMap((s) => termLines(s).map((t) => t.text)).join("");
    expect(all.includes(dash)).toBe(false);
  });
});
