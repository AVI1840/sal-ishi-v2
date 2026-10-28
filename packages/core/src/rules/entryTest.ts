// מבחן כניסה: רץ בכל שמירה, לפי הסדר, ועוצר בכישלון הראשון.
// מבחן הכיסוי (שלב 5 ב-seed) לא חוסם שירות ולכן לא נבדק כאן.

import type { MonthlyActivity, Service } from "../model";
import type { Seed } from "../seed";
import { OUTSIDE_LAYER, QOL_LAYERS, seedIndex } from "../seed";

export const ENTRY_STATUS = {
  outside: "בחוץ",
  otherFunder: "בחוץ: מממן אחר",
  remap: "מוחזר למיפוי",
  missingData: "חסרים נתונים",
  noMechanism: "לא נכנס עד שיש מנגנון",
  in: "נכנס",
} as const;

export type EntryStatus = (typeof ENTRY_STATUS)[keyof typeof ENTRY_STATUS];

export interface EntryResult {
  status: EntryStatus;
  /** מספר השלב שנכשל (לפי entry_test ב-seed), או null כשהשירות נכנס. */
  step: number | null;
  reason: string;
}

type EntryInput = Pick<
  Service,
  "categoryCode" | "serviceTypeId" | "otherFunder" | "unitPrice" | "marketPrice" | "enforceable"
>;

export function entryTest(service: EntryInput, seed: Seed): EntryResult {
  const { categories, serviceTypes } = seedIndex(seed);
  const category = service.categoryCode ? categories.get(service.categoryCode) : undefined;
  const type = service.serviceTypeId ? serviceTypes.get(service.serviceTypeId) : undefined;

  // 1. ברשימה הסגורה: קטגוריה וסוג שירות שקיימים ב-seed, לא בשכבת "בחוץ",
  //    ובאיכות חיים רק קטגוריות שיש להן כלל ב-qol_rules.
  if (service.categoryCode && !category) {
    return fail(ENTRY_STATUS.outside, 1, `קטגוריה ${service.categoryCode} לא ברשימה הסגורה של הסל`);
  }
  if (service.serviceTypeId && !type) {
    return fail(ENTRY_STATUS.outside, 1, `סוג שירות ${service.serviceTypeId} לא ברשימה הסגורה של הסל`);
  }
  if (category?.layer === OUTSIDE_LAYER) {
    return fail(ENTRY_STATUS.outside, 1, `${category.name} מחוץ לסל${category.outside ? ` (${category.outside})` : ""}`);
  }
  if (category && (QOL_LAYERS as readonly string[]).includes(category.layer)) {
    const hasRule = seed.qol_rules.some((r) => r.category === category.code);
    if (!hasRule) return fail(ENTRY_STATUS.outside, 1, `באיכות חיים נכנסים רק פריטים מכללי איכות החיים`);
  }

  // 2. מממן אחר
  if (service.otherFunder) {
    return fail(ENTRY_STATUS.otherFunder, 2, "יש לשירות מממן אחר (סל הבריאות, שב\"ן, רווחה או גמלה)");
  }

  // 3. קטגוריה וסוג שירות, ושהם מתאימים זה לזה
  if (!category || !type) {
    return fail(ENTRY_STATUS.remap, 3, !category ? "חסרה קטגוריה" : "חסר סוג שירות");
  }
  if (type.category !== category.code) {
    return fail(ENTRY_STATUS.remap, 3, `סוג השירות ${type.id} שייך לקטגוריה ${type.category} ולא ל-${category.code}`);
  }

  // 4. מחיר ליחידה ומחיר שוק לייחוס
  if (service.unitPrice === undefined || service.marketPrice === undefined) {
    const missing = [
      service.unitPrice === undefined ? "מחיר ליחידה" : null,
      service.marketPrice === undefined ? "מחיר שוק לייחוס" : null,
    ].filter(Boolean);
    return fail(ENTRY_STATUS.missingData, 4, `חסר ${missing.join(" ו")}`);
  }

  // 6. מנגנון מימוש ואימות
  if (!service.enforceable) {
    return fail(ENTRY_STATUS.noMechanism, 6, "אין עדיין מנגנון למימוש ולאימות (שובר או נקודות, וסימון נוכחות)");
  }

  return { status: ENTRY_STATUS.in, step: null, reason: "עומד בכל תנאי הכניסה" };
}

function fail(status: EntryStatus, step: number, reason: string): EntryResult {
  return { status, step, reason };
}

/** שירות נספר בכיסוי אם עבר את מבחן הכניסה או שכבר אושר. */
export function countsTowardCoverage(service: Service, seed: Seed): boolean {
  return service.status === "אושר" || entryTest(service, seed).status === ENTRY_STATUS.in;
}

// מיפוי משדות החובה שב-seed לשדות במודל. "attendance" הוא נוכחות חודשית
// מצטברת, ולכן נבדק מול רשומות הפעילות של השירות.
type FieldCheck = (service: Service, activity: readonly MonthlyActivity[]) => boolean;

const MANDATORY_CHECKS: Record<string, FieldCheck> = {
  unit_price: (s) => s.unitPrice !== undefined,
  supplier_code: (s) => s.supplierCode.trim() !== "",
  neighborhood: (s) => s.neighborhoodId.trim() !== "",
  languages: (s) => s.languages.length > 0,
  service_type_id: (s) => s.serviceTypeId.trim() !== "",
  attendance: (s, activity) => activity.some((a) => a.serviceId === s.id),
};

export interface MissingField {
  field: string;
  label: string;
}

/** שדות החובה שחסרים בשירות, לפי mandatory_fields ב-seed. */
export function missingMandatoryFields(
  service: Service,
  activity: readonly MonthlyActivity[],
  seed: Seed,
): MissingField[] {
  return seed.mandatory_fields.filter((f) => {
    const check = MANDATORY_CHECKS[f.field];
    // שדה חובה חדש ב-seed בלי בדיקה מתאימה: מסמנים כחסר כדי שלא ייפול בשקט.
    return check ? !check(service, activity) : true;
  });
}
