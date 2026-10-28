import { describe, expect, it } from "vitest";
import { CONTINUITY_STATUS, continuityUnits } from "../rules/continuity";
import { defaultSeed as seed, withSettings } from "../seed";
import { act, continuousMonths, svc } from "./fixtures";

const run = (services: ReturnType<typeof svc>[], activity: ReturnType<typeof act>, s = seed) =>
  continuityUnits(services, activity, s.settings);

describe("שירות רציף", () => {
  it("10 משתתפים בשיא ו-3 חודשים: רציף", () => {
    const [u] = run([svc("a")], act("a", [["2026-01", 4], ["2026-02", 10], ["2026-03", 6]]));
    expect(u?.status).toBe(CONTINUITY_STATUS.continuous);
    expect(u?.peakParticipants).toBe(10);
    expect(u?.activeMonths).toBe(3);
  });

  it("9 משתתפים בשיא: לא רציף", () => {
    const [u] = run([svc("a")], act("a", [["2026-01", 9], ["2026-02", 9], ["2026-03", 9]]));
    expect(u?.status).toBe(CONTINUITY_STATUS.notContinuous);
  });

  it("רק שני חודשים פעילים: לא רציף", () => {
    const [u] = run([svc("a")], act("a", [["2026-01", 20], ["2026-02", 20]]));
    expect(u?.status).toBe(CONTINUITY_STATUS.notContinuous);
  });

  it("חודש אחד בלבד: אירוע", () => {
    const [u] = run([svc("a")], act("a", [["2026-01", 200]]));
    expect(u?.status).toBe(CONTINUITY_STATUS.event);
  });

  it("בלי פעילות: אין פעילות", () => {
    expect(run([svc("a")], [])[0]?.status).toBe(CONTINUITY_STATUS.noActivity);
  });

  it("סבבים עם אותו programId נספרים כשירות רציף אחד", () => {
    const services = [svc("r1", { programId: "P" }), svc("r2", { programId: "P" })];
    const activity = [
      ...act("r1", [["2026-01", 12], ["2026-02", 12]]),
      ...act("r2", [["2026-03", 12], ["2026-04", 12]]),
    ];
    const units = run(services, activity);
    expect(units).toHaveLength(1);
    expect(units[0]?.status).toBe(CONTINUITY_STATUS.continuous);
    expect(units[0]?.serviceIds).toEqual(["r1", "r2"]);
  });

  it("אותו programId בשתי שכונות: יחידה לכל שכונה", () => {
    const services = [svc("r1", { programId: "P" }), svc("r2", { programId: "P", neighborhoodId: "other" })];
    expect(run(services, [])).toHaveLength(2);
  });

  it("שינוי סף המשתתפים משנה את התוצאה מיד", () => {
    const services = [svc("a")];
    const activity = act("a", continuousMonths);
    expect(run(services, activity)[0]?.status).toBe(CONTINUITY_STATUS.continuous);
    expect(run(services, activity, withSettings(seed, { min_participants: 20 }))[0]?.status).toBe(
      CONTINUITY_STATUS.notContinuous,
    );
  });
});
