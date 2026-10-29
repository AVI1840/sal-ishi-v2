import { describe, expect, it } from "vitest";
import { buildDemoAuthority } from "../demo";
import { authoritySummaries, nextSeedVersion, publishSeedVersion, settingsDiff, supplierDiversity } from "../hq";
import { buildPilotPackage, emptyHqState, mergePackage } from "../pilotPackage";
import { defaultSeed as seed, withSettings } from "../seed";

async function demoHq() {
  let state = emptyHqState();
  for (const v of [0, 1]) state = mergePackage(state, await buildPilotPackage(buildDemoAuthority(v), seed));
  return state;
}

describe("נתוני הדגמה", () => {
  it("שתי הוריאציות נבדלות במזהים ובמחירים, ושתיהן תקינות כחבילה", async () => {
    const a = buildDemoAuthority(0);
    const b = buildDemoAuthority(1);
    expect(a.authority).not.toBe(b.authority);
    const ids = new Set(a.services.map((s) => s.id));
    expect(b.services.some((s) => ids.has(s.id))).toBe(false);
    expect(b.services[0]!.unitPrice).toBeGreaterThan(a.services[0]!.unitPrice!);
    const state = await demoHq();
    expect(state.services).toHaveLength(a.services.length + b.services.length);
  });
});

describe("תמונה ארצית", () => {
  it("סיכום לכל פיילוט", async () => {
    const summaries = authoritySummaries(await demoHq(), seed);
    expect(summaries.map((s) => s.authority)).toEqual(["רשות הדגמה", "רשות הדגמה ב"]);
    const first = summaries[0]!;
    expect(first.neighborhoods).toBe(5);
    expect(first.coverage.green + first.coverage.orange + first.coverage.red).toBe(20);
    expect(first.suppliersByType.exempt).toBe(2);
    expect(first.asOfMonth).toBe("2026-10");
    expect(first.utilization).toHaveLength(5);
  });

  it("שינוי סף בהגדרות משנה מיד את התמונה הארצית", async () => {
    const state = await demoHq();
    const before = authoritySummaries(state, seed)[0]!;
    const after = authoritySummaries(state, withSettings(seed, { core_floor: 1 }))[0]!;
    expect(after.coverage.green).toBeGreaterThan(before.coverage.green);
    const strict = authoritySummaries(state, withSettings(seed, { red_flag_avg: 0.99, utilization_target: 0.99 }))[0]!;
    expect(strict.redFlags).toBe(5);
  });

  it("מגוון ספקים לפי קטגוריית ליבה", async () => {
    const state = await demoHq();
    const rows = supplierDiversity(state.services, seed);
    expect(rows).toHaveLength(10);
    expect(rows.find((r) => r.authority === "רשות הדגמה" && r.coreCategoryId === "belonging")!.suppliers).toBeGreaterThan(1);
  });
});

describe("גרסאות seed", () => {
  it("מספור גרסה", () => {
    expect(nextSeedVersion("0.3")).toBe("0.3.1");
    expect(nextSeedVersion("0.3.1")).toBe("0.3.2");
  });

  it("הבדלי הגדרות", () => {
    const changes = settingsDiff(seed.settings, withSettings(seed, { core_floor: 4 }).settings);
    expect(changes).toEqual([{ key: "core_floor", before: 3, after: 4 }]);
  });

  it("פרסום גרסה עם יומן שינויים, וקריאה חוזרת שלה כ-seed תקין", () => {
    const changed = withSettings(seed, { core_floor: 4 });
    const entry = { at: "2026-11-01T00:00:00.000Z", kind: "setting" as const, key: "core_floor", before: 3, after: 4 };
    const published = publishSeedVersion(changed, [entry], new Date("2026-11-02T00:00:00Z"));
    expect(published.meta.version).toBe("0.4.1");
    expect(published.settings.core_floor).toBe(4);
    expect((published.meta as { changelog?: unknown[] }).changelog).toEqual([
      { version: "0.4.1", published_at: "2026-11-02T00:00:00.000Z", changes: [entry] },
    ]);
  });
});
