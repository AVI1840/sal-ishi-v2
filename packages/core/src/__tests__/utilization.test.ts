import { describe, expect, it } from "vitest";
import type { MonthlyActivity, NeighborhoodMonth, Service } from "../model";
import { servicesBelowThreshold, utilization } from "../rules/utilization";
import { defaultSeed as seed, withSettings, type Seed } from "../seed";
import { windowMonths } from "../settings";
import { nGeneral, svc } from "./fixtures";

const enrolled = (months: string[], n = 10): NeighborhoodMonth[] =>
  months.map((month) => ({ neighborhoodId: nGeneral.id, month, enrolled: n }));

const spend = (serviceId: string, month: string, walletSpent: number): MonthlyActivity => ({
  serviceId,
  month,
  uniqueParticipants: 10,
  sessions: 4,
  walletSpent,
});

const Q1 = ["2026-01", "2026-02", "2026-03"];

function run(services: Service[], activity: MonthlyActivity[], s: Seed = seed, enrollment = enrolled(Q1)) {
  return utilization({ neighborhoodId: nGeneral.id, asOfMonth: "2026-03", services, activity, enrollment }, s);
}

describe("מיצוי בחלון מתגלגל", () => {
  it("חלון של שלושה חודשים, כולל מעבר שנה", () => {
    expect(windowMonths("2026-03", 3)).toEqual(Q1);
    expect(windowMonths("2026-01", 3)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("הוצאה מחוץ לחלון לא נספרת", () => {
    const r = run([svc("a")], [spend("a", "2025-12", 9999), spend("a", "2026-02", 6000)]);
    expect(r.months).toEqual(Q1);
    expect(r.spent).toBe(6000);
    expect(r.capacity).toBe(15000);
    expect(r.rate).toBeCloseTo(0.4);
    expect(r.flag).toBe("below_target");
  });

  it("מתחת ל-35%: דגל אדום", () => {
    expect(run([svc("a")], [spend("a", "2026-03", 4500)]).flag).toBe("red");
  });

  it("מעל היעד: on_target", () => {
    expect(run([svc("a")], [spend("a", "2026-03", 11000)]).flag).toBe("on_target");
  });

  it("איכות חיים וליווי המלווה לא נספרים", () => {
    const services = [svc("a"), svc("q", { categoryCode: "5.1", serviceTypeId: "T48" }), svc("c", { categoryCode: "5.5", serviceTypeId: "T53" })];
    const r = run(services, [spend("a", "2026-03", 6000), spend("q", "2026-03", 5000), spend("c", "2026-03", 5000)]);
    expect(r.spent).toBe(6000);
  });

  it("כשמחליטים לספור איכות חיים, היא נספרת", () => {
    const services = [svc("q", { categoryCode: "5.1", serviceTypeId: "T48" })];
    const r = run(services, [spend("q", "2026-03", 5000)], withSettings(seed, { qol_counts_in_target: true }));
    expect(r.spent).toBe(5000);
  });

  it("שינוי סף הדגל האדום משנה את הדגל מיד", () => {
    const activity = [spend("a", "2026-02", 6000)];
    expect(run([svc("a")], activity).flag).toBe("below_target");
    expect(run([svc("a")], activity, withSettings(seed, { red_flag_avg: 0.45 })).flag).toBe("red");
  });

  it("שינוי גודל החלון", () => {
    const s = withSettings(seed, { utilization_window: "rolling_1_months" });
    const r = run([svc("a")], [spend("a", "2026-02", 6000), spend("a", "2026-03", 1000)], s);
    expect(r.months).toEqual(["2026-03"]);
    expect(r.spent).toBe(1000);
  });

  it("בלי מחזיקי סל בחלון: אין נתונים", () => {
    expect(run([svc("a")], [], seed, []).flag).toBe("no_data");
  });

  it("שירותים מתחת לסף המשתתפים בחודש האחרון", () => {
    const activity: MonthlyActivity[] = [
      { serviceId: "a", month: "2026-03", uniqueParticipants: 4, sessions: 2 },
      { serviceId: "b", month: "2026-03", uniqueParticipants: 15, sessions: 4 },
    ];
    expect(servicesBelowThreshold([svc("a"), svc("b")], activity, "2026-03", seed)).toEqual([
      { serviceId: "a", participants: 4 },
    ]);
  });
});
