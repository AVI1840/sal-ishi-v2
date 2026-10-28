import { describe, expect, it } from "vitest";
import type { AuthorityData, Service } from "../model";
import {
  buildPilotPackage,
  diffPackage,
  emptyHqState,
  mergePackage,
  parsePilotPackage,
} from "../pilotPackage";
import { RESIDENT_FIELD_KEYS, findForbiddenKeys } from "../privacy";
import { defaultSeed as seed, withSettings } from "../seed";
import { AUTH, act, continuousMonths, demoAuthority, nGeneral, supplierExempt, supplierNpo, svc } from "./fixtures";

const T1 = new Date("2026-11-01T10:00:00Z");
const T2 = new Date("2026-11-02T10:00:00Z");

describe("חבילת פיילוט", () => {
  it("חתימת תוכן לא תלויה בזמן הייצוא", async () => {
    const a = await buildPilotPackage(demoAuthority(), seed, T1);
    const b = await buildPilotPackage(demoAuthority(), seed, T2);
    expect(a.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.exportedAt).not.toBe(b.exportedAt);
  });

  it("נקראת חזרה מטקסט בלי איבוד נתונים", async () => {
    const pkg = await buildPilotPackage(demoAuthority(), seed, T1);
    expect(await parsePilotPackage(JSON.stringify(pkg))).toEqual(pkg);
  });

  it("קובץ שנערך אחרי הייצוא נדחה", async () => {
    const pkg = await buildPilotPackage(demoAuthority(), seed, T1);
    const tampered = { ...pkg, services: pkg.services.map((s) => ({ ...s, unitPrice: 1 })) };
    await expect(parsePilotPackage(JSON.stringify(tampered))).rejects.toThrow(/חתימת התוכן/);
  });

  it("שדה של תושב חוסם את בניית החבילה", async () => {
    const data = demoAuthority();
    data.services[0] = { ...data.services[0]!, personId: "x" } as unknown as Service;
    await expect(buildPilotPackage(data, seed, T1)).rejects.toThrow();
  });

  it("אין שדה של תושב בחבילה", async () => {
    const pkg = await buildPilotPackage(demoAuthority(), seed, T1);
    expect(findForbiddenKeys(pkg, RESIDENT_FIELD_KEYS)).toEqual([]);
  });

  it("supplier_contact_to_hq = true: פרטי עוסק פטור עוברים למטה", async () => {
    const pkg = await buildPilotPackage(demoAuthority(), seed, T1);
    const exempt = pkg.suppliers.find((s) => s.code === supplierExempt.code);
    expect(exempt?.contact).toEqual(supplierExempt.contact);
    expect(exempt?.displayName).toBe(supplierExempt.displayName);
  });

  it("supplier_contact_to_hq = false: עוסק פטור כקוד וסוג בלבד, עמותה בלי פרטי קשר", async () => {
    const strict = withSettings(seed, { supplier_contact_to_hq: false });
    const pkg = await buildPilotPackage(demoAuthority(), strict, T1);
    const exempt = pkg.suppliers.find((s) => s.code === supplierExempt.code)!;
    const npo = pkg.suppliers.find((s) => s.code === supplierNpo.code)!;
    expect(exempt.contact).toBeUndefined();
    expect(exempt.displayName).toBeUndefined();
    expect(npo.contact).toBeUndefined();
    expect(npo.displayName).toBe(supplierNpo.displayName);
    expect(JSON.stringify(pkg)).not.toContain("000-0000000");
  });
});

describe("איחוד חבילות במטה", () => {
  it("חבילה שנטענת פעמיים לא יוצרת כפילויות", async () => {
    const pkg = await buildPilotPackage(demoAuthority(), seed, T1);
    const once = mergePackage(emptyHqState(), pkg);
    const twice = mergePackage(once, pkg);
    expect(twice).toBe(once);
    expect(twice.services).toHaveLength(3);
    expect(twice.activity).toHaveLength(9);
    expect(diffPackage(once, pkg).alreadyLoaded).toBe(true);
  });

  it("אותה חבילה שיוצאה שוב (זמן אחר, אותו תוכן) לא משנה דבר", async () => {
    const state = mergePackage(emptyHqState(), await buildPilotPackage(demoAuthority(), seed, T1));
    expect(mergePackage(state, await buildPilotPackage(demoAuthority(), seed, T2))).toBe(state);
  });

  it("מציג הבדלים לפני מיזוג וממזג נכון", async () => {
    const v1 = demoAuthority();
    const state = mergePackage(emptyHqState(), await buildPilotPackage(v1, seed, T1));

    const v2: AuthorityData = {
      ...v1,
      services: [
        { ...v1.services[0]!, unitPrice: 130 },
        v1.services[1]!,
        svc("s4", { status: "הוגש" }),
      ],
      activity: [...v1.activity.filter((a) => a.serviceId !== "s3"), ...act("s4", continuousMonths)],
    };
    const pkg2 = await buildPilotPackage(v2, seed, T2);
    const diff = diffPackage(state, pkg2);
    expect(diff.alreadyLoaded).toBe(false);
    expect(diff.collisions).toEqual([]);
    expect(diff.added.map((s) => s.id)).toEqual(["s4"]);
    expect(diff.changed.map((c) => [c.after.id, c.fields])).toEqual([["s1", ["unitPrice"]]]);
    expect(diff.removed.map((s) => s.id)).toEqual(["s3"]);
    expect(diff.unchanged).toBe(1);

    const merged = mergePackage(state, pkg2);
    expect(merged.services.map((s) => s.id).sort()).toEqual(["s1", "s2", "s4"]);
    expect(merged.services.find((s) => s.id === "s1")?.unitPrice).toBe(130);
    expect(merged.activity.some((a) => a.serviceId === "s3")).toBe(false);
    expect(merged.activity).toHaveLength(9);
    expect(merged.packages).toHaveLength(1);
  });

  it("שתי רשויות נשמרות זו לצד זו", async () => {
    const other: AuthorityData = {
      authority: "רשות הדגמה ב",
      neighborhoods: [{ id: "n-b", authority: "רשות הדגמה ב", name: "שכונה ב", community: "arab" }],
      suppliers: [{ ...supplierNpo, authority: "רשות הדגמה ב" }],
      services: [svc("b1", { authority: "רשות הדגמה ב", neighborhoodId: "n-b" })],
      activity: act("b1", continuousMonths),
      enrollment: [],
    };
    let state = mergePackage(emptyHqState(), await buildPilotPackage(demoAuthority(), seed, T1));
    state = mergePackage(state, await buildPilotPackage(other, seed, T1));
    expect(state.services).toHaveLength(4);
    expect(state.suppliers).toHaveLength(3);
    expect(state.packages.map((p) => p.authority).sort()).toEqual([AUTH, "רשות הדגמה ב"].sort());
  });

  it("מזהה שירות שכבר שייך לרשות אחרת עוצר את המיזוג", async () => {
    const other: AuthorityData = {
      authority: "רשות הדגמה ב",
      neighborhoods: [{ id: "n-b", authority: "רשות הדגמה ב", name: "שכונה ב", community: "general" }],
      suppliers: [],
      services: [svc("s1", { authority: "רשות הדגמה ב", neighborhoodId: "n-b" })],
      activity: [],
      enrollment: [],
    };
    const state = mergePackage(emptyHqState(), await buildPilotPackage(demoAuthority(), seed, T1));
    const pkg = await buildPilotPackage(other, seed, T1);
    expect(diffPackage(state, pkg).collisions).toEqual(["שירות s1"]);
    expect(() => mergePackage(state, pkg)).toThrow(/רשות אחרת/);
  });

  it("חבילה של שכונה אחת לא מוחקת שכונה אחרת של אותה רשות", async () => {
    const full = demoAuthority();
    full.services.push(svc("h1", { neighborhoodId: "n-haredi", status: "אושר" }));
    const state = mergePackage(emptyHqState(), await buildPilotPackage(full, seed, T1));

    const partial: AuthorityData = {
      ...full,
      neighborhoods: [nGeneral],
      services: full.services.filter((s) => s.neighborhoodId === nGeneral.id),
      activity: full.activity,
    };
    const merged = mergePackage(state, await buildPilotPackage(partial, seed, T2));
    expect(merged.services.some((s) => s.id === "h1")).toBe(true);
  });
});
