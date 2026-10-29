import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  ACTIVITY_IMPORT_FIELDS,
  SERVICE_IMPORT_FIELDS,
  autoMapColumns,
  committeeWorkbook,
  isWorkbookRtl,
  missingRequiredMappings,
  normalizeMonth,
  readFirstSheet,
  rowsToActivity,
  rowsToServices,
  upsertActivity,
  writeWorkbook,
} from "../excel";
import { defaultSeed as seed } from "../seed";
import { AUTH, nGeneral, nHaredi, supplierNpo, svc } from "./fixtures";

function sheet(aoa: unknown[][]): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "גיליון1");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

describe("ייבוא Excel", () => {
  it.each([['ת"ז'], ["שם"], ["טלפון"]])("קובץ עם עמודה %s נחסם", (col) => {
    const r = readFirstSheet(sheet([["שם השירות", col], ["חוג", "x"]]));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.blockedColumns).toEqual([col]);
      expect(r.message).toContain("נחסם");
    }
  });

  it("קובץ תקין נקרא עם כותרות ושורות", () => {
    const r = readFirstSheet(sheet([["שם השירות", "שכונה"], ["חוג ציור", "שכונת הדגמה א"]]));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.headers).toEqual(["שם השירות", "שכונה"]);
      expect(r.rows[0]).toEqual({ "שם השירות": "חוג ציור", שכונה: "שכונת הדגמה א" });
    }
  });

  it("מיפוי עמודות אוטומטי לפי שם וכינויים", () => {
    const mapping = autoMapColumns(["שירות", "שכונה", "קוד סוג שירות", "ספק", "עלות ליחידה"], [...SERVICE_IMPORT_FIELDS]);
    expect(mapping).toMatchObject({ name: "שירות", neighborhood: "שכונה", serviceType: "קוד סוג שירות", supplier: "ספק", unitPrice: "עלות ליחידה" });
    expect(missingRequiredMappings([...SERVICE_IMPORT_FIELDS], mapping)).toEqual([]);
  });

  it("עמודות מודל התשלום (0.4) נקלטות, ותא ריק נשאר חסר", () => {
    let n = 0;
    const { services } = rowsToServices(
      [
        { שירות: "שיווי משקל", שכונה: "שכונת הדגמה ב", סוג: "T16", ספק: supplierNpo.code, שעות: "6", מתן: "קבוצתי", מקום: "כן", מלווה: "", סיבה: "" },
        { שירות: "סל טיפוח", שכונה: "שכונת הדגמה ב", סוג: "T51", ספק: supplierNpo.code, שעות: "", מתן: "לא ידוע", מקום: "", מלווה: "כן", סיבה: "צורך מתועד" },
      ],
      { name: "שירות", neighborhood: "שכונה", serviceType: "סוג", supplier: "ספק", hoursPerUnit: "שעות", serviceMode: "מתן", capacityLimited: "מקום", gatedByCompanion: "מלווה", gateReason: "סיבה" },
      { authority: AUTH, neighborhoods: [nGeneral, nHaredi], suppliers: [supplierNpo], seed, newId: () => `id${++n}`, defaultStartMonth: "2026-12" },
    );
    expect(services[0]).toMatchObject({ hoursPerUnit: 6, serviceMode: "group", capacityLimited: true });
    expect(services[1]).toMatchObject({ gatedByCompanion: true, gateReason: "צורך מתועד" });
    expect(services[1]!.hoursPerUnit).toBeUndefined();
    expect(services[1]!.serviceMode).toBeUndefined();
  });

  it("שורות הופכות לשירותים בטיוטה, ושורה עם שכונה לא מוכרת נדחית", () => {
    let n = 0;
    const { services, errors } = rowsToServices(
      [
        { שירות: "התעמלות", שכונה: "שכונת הדגמה ב", סוג: "T17", ספק: supplierNpo.code, מחיר: "120", קהילה: "חרדי" },
        { שירות: "חוג", שכונה: "לא קיימת", סוג: "T07", ספק: "x", מחיר: 1, קהילה: "" },
      ],
      { name: "שירות", neighborhood: "שכונה", serviceType: "סוג", supplier: "ספק", unitPrice: "מחיר", communityFit: "קהילה" },
      { authority: AUTH, neighborhoods: [nGeneral, nHaredi], suppliers: [supplierNpo], seed, newId: () => `id${++n}`, defaultStartMonth: "2026-12" },
    );
    expect(errors).toEqual([{ row: 3, message: 'שכונה "לא קיימת" לא מוגדרת ברשות' }]);
    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      neighborhoodId: nHaredi.id,
      categoryCode: "2.1",
      serviceTypeId: "T17",
      unitPrice: 120,
      pricePoints: 120,
      unit: "חודש",
      communityFit: ["haredi"],
      status: "טיוטה",
      startMonth: "2026-12",
    });
  });

  it("פעילות: מזהה שירות לפי שם, חודש בכמה פורמטים", () => {
    const services = [svc("a", { name: "התעמלות" })];
    const mapping = autoMapColumns(["שירות", "חודש", "משתתפים", "הוצאה"], [...ACTIVITY_IMPORT_FIELDS]);
    const { activity, errors } = rowsToActivity(
      [
        { שירות: "התעמלות", חודש: "01/2026", משתתפים: 12, הוצאה: 300 },
        { שירות: "לא קיים", חודש: "2026-01", משתתפים: 1, הוצאה: 0 },
      ],
      mapping,
      services,
    );
    expect(activity).toEqual([{ serviceId: "a", month: "2026-01", uniqueParticipants: 12, sessions: 0, walletSpent: 300 }]);
    expect(errors).toHaveLength(1);
  });

  it("נרמול חודש", () => {
    expect(normalizeMonth(new Date(2026, 10, 15))).toBe("2026-11");
    expect(normalizeMonth("2026-3")).toBe("2026-03");
    expect(normalizeMonth("3.2026")).toBe("2026-03");
    expect(normalizeMonth("מרץ")).toBeNull();
  });

  it("טעינה חוזרת של פעילות מחליפה ולא מכפילה", () => {
    const a = { serviceId: "a", month: "2026-01", uniqueParticipants: 5, sessions: 1 };
    expect(upsertActivity([a], [{ ...a, uniqueParticipants: 9 }])).toEqual([{ ...a, uniqueParticipants: 9 }]);
  });
});

describe("ייצוא Excel", () => {
  it("נפתח מימין לשמאל עם עברית תקינה", () => {
    const data = writeWorkbook([{ name: "בדיקה", rows: [{ "שם השירות": "חוג שירה", מחיר: 80 }] }]);
    expect(isWorkbookRtl(data)).toBe(true);
    const r = readFirstSheet(data);
    expect(r.ok && r.rows[0]).toEqual({ "שם השירות": "חוג שירה", מחיר: 80 });
  });

  it("קובץ הוועדה כולל סטטוס ומבחן כניסה, בלי פרטי קשר", () => {
    const data = committeeWorkbook(
      [
        {
          service: svc("a", { status: "הוגש" }),
          neighborhoodName: nGeneral.name,
          supplierLabel: `${supplierNpo.code} - ${supplierNpo.displayName}`,
          entryStatus: "נכנס",
          entryReason: "עומד בכל תנאי הכניסה",
          missingFields: [],
          referenceMedian: null,
        },
      ],
      seed,
    );
    expect(isWorkbookRtl(data)).toBe(true);
    const r = readFirstSheet(data);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rows[0]).toMatchObject({ "שם השירות": "שירות a", סטטוס: "הוגש", "מבחן כניסה": "נכנס", קטגוריה: "פעילות גופנית" });
      expect(JSON.stringify(r.rows)).not.toContain(supplierNpo.contact!.phone!);
    }
  });
});
