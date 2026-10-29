import { describe, expect, it } from "vitest";
import { detectIdentifyingColumns, findForbiddenKeys, formatCount, RESIDENT_FIELD_KEYS } from "../privacy";
import { defaultSeed as seed, parseSeed } from "../seed";
import { copayRate, defaultCopayTier, proposalKeys } from "../settings";
import { createMemoryStore, openStore } from "../storage";

describe("חסימת עמודות מזהות בייבוא", () => {
  it.each(['ת"ז', "ת.ז.", "תעודת זהות", "מס' זהות", "שם", "שם פרטי", "שם משפחה", "טלפון", "טלפון נייד", "כתובת", "Phone", "First Name"])(
    "חוסם: %s",
    (header) => {
      expect(detectIdentifyingColumns(["שם השירות", header, "משתתפים"])).toEqual([header]);
    },
  );

  it.each(["שם השירות", "שם הספק", "שכונה", "מחיר ליחידה", "משתתפים ייחודיים", "חודש", "קוד ספק"])("מתיר: %s", (header) => {
    expect(detectIdentifyingColumns([header])).toEqual([]);
  });
});

describe("תאים קטנים", () => {
  it("מספר קטן מ-5 מוצג כ-<5", () => {
    expect(formatCount(4, seed.settings)).toBe("<5");
    expect(formatCount(0, seed.settings)).toBe("<5");
    expect(formatCount(5, seed.settings)).toBe("5");
  });
});

describe("סריקת שדות אסורים", () => {
  it("מוצא שדה בכל עומק", () => {
    expect(findForbiddenKeys({ a: [{ b: { personId: "x" } }] }, RESIDENT_FIELD_KEYS)).toEqual(["$.a[0].b.personId"]);
  });
});

describe("seed", () => {
  it("נטען עם המבנה הצפוי", () => {
    expect(seed.meta.version).toBe("0.4");
    expect(seed.core_categories).toHaveLength(5);
    expect(seed.categories).toHaveLength(18);
    expect(seed.service_types).toHaveLength(57);
    expect(seed.entry_test).toHaveLength(6);
    expect(seed.mandatory_fields).toHaveLength(8);
    expect(seed.settings.supplier_contact_to_hq).toBe(true);
  });

  it("seed שבור נדחה עם הודעה", () => {
    expect(() => parseSeed({ ...seed, settings: { ...seed.settings, core_floor: "שלוש" } })).toThrow(/core_floor/);
  });

  it("ערכים בסטטוס הצעה מזוהים", () => {
    const keys = proposalKeys(seed.settings);
    expect(keys).toEqual(
      expect.arrayContaining(["points_rollover_months", "cancellation_notice_hours", "no_show_charge_rule", "qol_mode", "reference_price_mode", "active_participant_min_sessions_month", "hot_meal_entry_criteria"]),
    );
    expect(keys).not.toContain("min_participants");
    expect(keys).not.toContain("supplier_contact_to_hq");
  });

  it("השתתפות עצמית מההגדרות", () => {
    expect(copayRate(seed.settings, "core_and_prevention")).toBe(0);
    expect(copayRate(seed.settings, "classes")).toBe(0.2);
    expect(copayRate(seed.settings, "qol")).toBe(0.5);
    expect(defaultCopayTier(seed, "5.3")).toBe("qol");
    expect(defaultCopayTier(seed, "2.1")).toBe("core_and_prevention");
  });
});

describe("שמירה מקומית", () => {
  it("בלי IndexedDB ו-localStorage נופל לזיכרון ועדיין עובד", async () => {
    const store = await openStore("test");
    expect(store.kind).toBe("memory");
    await store.set("k", { a: 1 });
    expect(await store.get("k")).toEqual({ a: 1 });
  });

  it("מחיקה", async () => {
    const store = createMemoryStore();
    await store.set("k", 1);
    await store.delete("k");
    expect(await store.get("k")).toBeUndefined();
  });
});
