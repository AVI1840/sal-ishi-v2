import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { applyCatalogs, buildDemoCatalogs } from "@/data/catalogSource";
import { defaultSeed } from "@sal-ishi/core";
import { derive, type PilotEvent } from "../model";
import { buildCaseload, reasonsFor, triage, PERSONA_PERSON } from "../caseload";
import { cancelRuleOf, lateCancelCharged, priceOf, recommend, serviceById, slotsFor, usedOf, walletOf } from "../services";
import { he } from "../i18n/he";
import { ar } from "../i18n/ar";
import { ru } from "../i18n/ru";
import { CITIZENS } from "@/data/mockData";

beforeAll(() => {
  applyCatalogs(buildDemoCatalogs(defaultSeed), defaultSeed, "demo");
});

let n = 0;
const ev = <T extends PilotEvent["type"]>(type: T, rest: Record<string, unknown>, citizenId = "c1"): PilotEvent =>
  ({ id: `e${++n}`, at: new Date(2026, 10, 1, 10, n).toISOString(), actor: "citizen", citizenId, type, ...rest }) as PilotEvent;

describe("derive: המצב נגזר מהאירועים", () => {
  it("הזמנה, ביטול ואשפוז", () => {
    const events = [
      ev("booking.created", { bookingId: "b1", serviceId: "s", serviceName: "חוג", slot: null, coveredShekel: 100, copayShekel: 0 }),
      ev("booking.created", { bookingId: "b2", serviceId: "s2", serviceName: "חוג 2", slot: null, coveredShekel: 50, copayShekel: 10 }),
      ev("booking.cancelled", { bookingId: "b1", charged: false, reason: "on_time" }),
      ev("hospitalization.started", {}),
    ];
    const d = derive(events);
    expect(d.bookings.find((b) => b.id === "b1")?.status).toBe("cancelled");
    expect(d.bookings.find((b) => b.id === "b2")?.status).toBe("paused");
    expect(d.hospitalized.has("c1")).toBe(true);
    const after = derive([...events, ev("hospitalization.ended", {})]);
    expect(after.bookings.find((b) => b.id === "b2")?.status).toBe("booked");
  });

  it("בקשה שנדחתה שומרת את הסיבה שהאזרח יראה", () => {
    const d = derive([
      ev("request.created", { requestId: "r1", kind: "gated_service", serviceId: "x", serviceName: "סל טיפוח" }),
      ev("request.decided", { requestId: "r1", decision: "rejected", reason: "יש שירות אחר שעונה על הצורך" }),
    ]);
    expect(d.requests[0]).toMatchObject({ status: "rejected", reason: "יש שירות אחר שעונה על הצורך" });
  });

  it("הזמנה בשם האזרח נשמרת עם האישור בעל פה", () => {
    const onBehalf = { consent: "verbal", readBack: "חוג, יום ראשון", confirmedAt: "2026-11-01T10:00:00Z" };
    const d = derive([ev("booking.created", { bookingId: "b9", serviceId: "s", serviceName: "חוג", slot: null, coveredShekel: 1, copayShekel: 0, actor: "companion", onBehalf })]);
    expect(d.bookings[0].onBehalf).toEqual(onBehalf);
    expect(d.bookings[0].createdBy).toBe("companion");
  });
});

describe("התיק של רונית", () => {
  it("שמות פרטיים בלי כפילויות, ובוריס נשאר בוריס", () => {
    const people = buildCaseload();
    const firsts = people.map((p) => p.name.split(" ")[0]);
    expect(new Set(firsts).size).toBe(firsts.length);
    expect(people.find((p) => p.id === "p017")?.name).toBe("בוריס ר.");
  });
});

describe("ארנק ומחיר בשקלים", () => {
  it("היתרה מהאירועים בלבד: שמור, נוצל, ביטול בזמן חוזר, ביטול מאוחר מחויב", () => {
    const month = new Date().toISOString();
    const base = { citizenId: "c1", serviceId: "s", serviceName: "x", slot: null, createdBy: "citizen" as const, copayShekel: 0, createdAt: month };
    const w = walletOf(
      [
        { ...base, id: "1", coveredShekel: 100, status: "booked" },
        { ...base, id: "2", coveredShekel: 40, status: "cancelled", charged: false },
        { ...base, id: "3", coveredShekel: 30, status: "cancelled", charged: true },
        // מנוי חודשי: 4 מפגשים, השתתפה ב-2: חצי נוצל וחצי שמור.
        { ...base, id: "4", coveredShekel: 126, status: "booked", mode: "subscription", sessionsPerMonth: 4, attendedSessions: 2 },
      ],
      [{ citizenId: "c1", points: 20, at: month }],
      "c1",
    );
    expect(w.used).toBe(30 + 63);
    expect(w.reserved).toBe(100 + 63);
    expect(w.bonus).toBe(20);
    expect(w.left).toBe(500 + 20 - 93 - 163);
  });

  it("מנוי חודשי מתחדש בתחילת חודש: נוצל לפי הנוכחות של החודש בלבד", () => {
    // יום ההדגמה: 3.11. שרה הצטרפה ב-31.10.
    const now = new Date("2026-11-03T08:00:00Z");
    const base = { citizenId: "c1", serviceId: "s", serviceName: "x", slot: null, createdBy: "citizen" as const, copayShekel: 0, coveredShekel: 126, mode: "subscription" as const, sessionsPerMonth: 4 };
    const joined = { ...base, id: "1", createdAt: "2026-10-31T08:00:00Z", status: "booked" as const };
    // נוכחות בנובמבר: נספרת בנובמבר.
    const nov = walletOf([{ ...joined, attendedSessions: 2, attendance: [{ at: "2026-11-01T08:00:00Z", sessions: 2 }] }], [], "c1", now);
    expect([nov.used, nov.reserved, nov.left]).toEqual([63, 63, 374]);
    // נוכחות באוקטובר: בנובמבר המנוי שמור כולו מחדש.
    const oct = { ...joined, attendedSessions: 2, attendance: [{ at: "2026-10-31T12:00:00Z", sessions: 2 }] };
    expect(walletOf([oct], [], "c1", now)).toMatchObject({ used: 0, reserved: 126, left: 374 });
    expect(usedOf(oct, "2026-10")).toBe(63);
    // עזבה באוקטובר: לא בנובמבר. עזבה בנובמבר: מה שנוצל בנובמבר נשאר.
    expect(walletOf([{ ...oct, status: "cancelled", cancelledAt: "2026-10-31T20:00:00Z" }], [], "c1", now).left).toBe(500);
    const leftNov = { ...joined, status: "cancelled" as const, cancelledAt: "2026-11-02T08:00:00Z", attendedSessions: 1, attendance: [{ at: "2026-11-01T08:00:00Z", sessions: 1 }] };
    expect(walletOf([leftNov], [], "c1", now)).toMatchObject({ used: 32, reserved: 0 });
    // הזמנה חד-פעמית מהחודש הקודם לא נספרת.
    expect(walletOf([{ ...base, id: "2", mode: "single", createdAt: "2026-10-30T08:00:00Z", status: "booked", coveredShekel: 40 }], [], "c1", now).left).toBe(500);
  });

  it("נוכחות נגזרת מהאירועים עם תאריך", () => {
    const at = "2026-11-01T08:00:00Z";
    const ev = (e: Record<string, unknown>) => ({ id: String(Math.random()), at, actor: "citizen", citizenId: "c1", synced: true, ...e }) as PilotEvent;
    const d = derive([
      ev({ type: "booking.created", bookingId: "b", serviceId: "s", serviceName: "x", slot: null, coveredShekel: 126, copayShekel: 0, mode: "subscription", sessionsPerMonth: 4 }),
      ev({ type: "attendance.reported", actor: "system", bookingId: "b", sessions: 2 }),
    ]);
    expect(d.bookings[0].attendance).toEqual([{ at, sessions: 2 }]);
    expect(d.bookings[0].attendedSessions).toBe(2);
  });

  it("המחיר מתחלק לסל ולאזרח לפי הקטלוג", () => {
    const art = serviceById("demoj-crafts");
    expect(art).toBeDefined();
    const p = priceOf(art!);
    expect(p.covered + p.copay).toBe(p.total);
    expect(p.copay).toBeGreaterThan(0);
  });

  it("עד שלושה מועדים לשירות קבוצתי, אף אחד למוצר", () => {
    expect(slotsFor(serviceById("demoj-balance")!).length).toBe(3);
    expect(slotsFor(serviceById("nat-bath")!).length).toBe(0);
  });

  it("ביטול מאוחר מחויב רק בתוך חלון ההודעה ורק בשירות שאי-הגעה בו מחויבת", () => {
    const s = serviceById("demoj-balance")!;
    expect(cancelRuleOf(s)).toMatchObject({ noticeHours: 24, charged: true, proposal: true });
    const now = new Date("2026-11-01T08:00:00Z");
    const b = { id: "b", citizenId: "c1", serviceId: s.id, serviceName: s.name, createdAt: "", createdBy: "citizen" as const, coveredShekel: 1, copayShekel: 0, status: "booked" as const };
    expect(lateCancelCharged({ ...b, slot: "2026-11-01T20:00:00Z" }, s, now)).toBe(true);
    expect(lateCancelCharged({ ...b, slot: "2026-11-03T20:00:00Z" }, s, now)).toBe(false);
    expect(lateCancelCharged({ ...b, slot: "2026-11-01T20:00:00Z" }, serviceById("demoj-club")!, now)).toBe(false);
  });

  it("ההמלצה מגוונת בין תחומים ומעדיפה את מה שהאזרח בחר", () => {
    const sara = CITIZENS[0];
    const plain = recommend(sara, [], new Set());
    expect(new Set(plain.slice(0, 3).map((s) => s.coreCategoryId)).size).toBe(3);
    const digitalFirst = recommend(sara, ["digital"], new Set());
    expect(digitalFirst[0].coreCategoryId).toBe("digital");
  });
});

describe("תיק המלווה", () => {
  it("76 אנשים, בדויים וקבועים בין הרצות", () => {
    const a = buildCaseload();
    const b = buildCaseload();
    expect(a).toHaveLength(76);
    expect(a.map((p) => p.name)).toEqual(b.map((p) => p.name));
    expect(a[0]).toEqual(PERSONA_PERSON);
  });

  it("ארבעת הכללים ובקשות פתוחות מזוהים, ואשפוז ראשון במיון", () => {
    const people = buildCaseload(76);
    const d = derive([
      ev("hospitalization.started", {}, "p010"),
      ev("request.created", { requestId: "r", kind: "callback" }, "p020"),
    ]);
    const ranked = triage(people, d);
    expect(ranked[0].person.id).toBe("p010");
    expect(ranked[0].bucket).toBe("today");
    expect(ranked[1].person.id).toBe("p020");
    const rules = new Set(ranked.flatMap((i) => i.reasons.map((r) => r.rule)));
    for (const r of ["hospitalization", "callback", "cognitive_alert", "no_first_service", "low_utilization"]) expect(rules.has(r as never)).toBe(true);
  });

  it("מיצוי נמוך לפי red_flag_avg מההגדרות", () => {
    const low = reasonsFor({ ...PERSONA_PERSON, utilization: 0.2 }, derive([]));
    const fine = reasonsFor({ ...PERSONA_PERSON, utilization: 0.6 }, derive([]));
    expect(low.some((r) => r.rule === "low_utilization")).toBe(true);
    expect(fine.some((r) => r.rule === "low_utilization")).toBe(false);
  });
});

// ── שפה ──────────────────────────────────────────────

function strings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (typeof obj === "function") {
    try {
      return strings((obj as (...a: unknown[]) => unknown)("X", 1, "Y", "Z"));
    } catch {
      return [];
    }
  }
  if (Array.isArray(obj)) return obj.flatMap(strings);
  if (obj && typeof obj === "object") return Object.values(obj).flatMap(strings);
  return [];
}

describe("עברית פשוטה בצד האזרח", () => {
  const all = strings(he);
  it("בלי מונחי מערכת", () => {
    // "נקודות" מותר: יחידת הארנק שהוחלטה (500 נקודות, נקודה = ₪1). ראו src/lib/wallet.ts.
    const banned = ["מיצוי", "חדירה", "ציון", "אלגוריתם", "יחידות", "מסובסד", "פרופיל"];
    for (const word of banned) expect(all.filter((s) => s.includes(word)), word).toEqual([]);
  });
  it("משפטים קצרים: עד 18 מילים במשפט", () => {
    const long = all.flatMap((s) => s.split(/[.?!]\s/)).filter((sentence) => sentence.trim().split(/\s+/).length > 18);
    expect(long).toEqual([]);
  });
  it("לערבית ולרוסית אותם מפתחות כמו לעברית", () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(ar)).toEqual(keys(he));
    expect(keys(ru)).toEqual(keys(he));
  });
});

describe("בלי em dash", () => {
  it("בקוד ובמסמכים של 0.5", () => {
    const root = path.resolve(__dirname, "../../..");
    const dirs = ["src/pilot", "docs/v05", "docs/handover", "docs/demo", "public"];
    const hits: string[] = [];
    const walk = (p: string) => {
      if (!statSync(p, { throwIfNoEntry: false })) return;
      if (statSync(p).isDirectory()) return readdirSync(p).forEach((f) => walk(path.join(p, f)));
      if (!/\.(tsx?|md|json|css|js)$/.test(p)) return;
      if (readFileSync(p, "utf8").includes(String.fromCharCode(0x2014))) hits.push(path.relative(root, p));
    };
    dirs.forEach((d) => walk(path.join(root, d)));
    expect(hits).toEqual([]);
  });
});
