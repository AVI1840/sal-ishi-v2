// תנאי שירות לפי מודל התשלום של החשכ"ל (גרסה 0.4): שעות הודעה לביטול, חיוב
// באי-הגעה, החזר באשפוז, מחיר לשעה וחלוקת הנקודות בין הארנק לקשיש. תצוגה
// ותיעוד בלבד: הכלי לא מפעיל נקודות ולא מחייב. הכל נקרא מההגדרות.

import type { CopayBasis, Service, ServiceMode } from "../model";
import type { Seed, Settings } from "../seed";
import { QOL_LAYERS, seedIndex } from "../seed";
import { copayRate, noShowRule, qolMode } from "../settings";

/** מוצר בערוץ הארצי: אין לו שעות שירות, אופן מתן או כללי ביטול. */
export function isProduct(seed: Seed, categoryCode: string): boolean {
  const cc = seedIndex(seed).coreCategoryByCode.get(categoryCode);
  return Boolean(cc?.national_list_only);
}

/** האם שירות בקטגוריה נספר ברצפת המגוון (מוצרים לפי products_count_in_floor). */
export function countsInFloor(seed: Seed, categoryCode: string): boolean {
  const cc = seedIndex(seed).coreCategoryByCode.get(categoryCode);
  if (!cc) return false;
  return cc.national_list_only ? seed.settings.products_count_in_floor : true;
}

/** מחיר לשעה בשקלים: unitPrice / hoursPerUnit. null כשחסר אחד מהם. */
export function hourlyPrice(s: Pick<Service, "unitPrice" | "hoursPerUnit">): number | null {
  if (s.unitPrice === undefined || !s.hoursPerUnit) return null;
  return Math.round((s.unitPrice / s.hoursPerUnit) * 100) / 100;
}

/**
 * הצעה לאופן מתן השירות מתוך השדות הקיימים, לרשימת ההשלמות. הצעה בלבד:
 * המשתמש מאשר אותה, והשדה לא מתמלא לבד.
 */
export function suggestedServiceMode(s: Pick<Service, "format" | "deliveryMode">): ServiceMode {
  if (s.deliveryMode === "home") return "home";
  if (s.deliveryMode === "remote") return "remote";
  return s.format.includes("פרטני") && !s.format.includes("קבוצתי") ? "individual" : "group";
}

/**
 * הצעה לשער מלווה מתוך כללי איכות החיים: פריט שהזכאות אליו תלויה במלווה
 * (סל טיפוח, ארוחה חמה). מחזיר את הסיבה מתוך ה-seed, או null.
 */
export function suggestedGate(seed: Seed, categoryCode: string): string | null {
  const rule = seed.qol_rules.find(
    (r) => r.category === categoryCode && typeof r.eligibility === "string" && r.eligibility.includes("מלווה"),
  );
  return rule ? String(rule.eligibility) : null;
}

/** שעות הודעה מראש לביטול לפי אופן מתן השירות. null כשעוד לא נקבע. */
export function cancellationNoticeHours(settings: Settings, mode: ServiceMode): number | null {
  return settings.cancellation_notice_hours[mode] ?? null;
}

/**
 * האם אי-הגעה מחויבת. בכלל individual_or_capacity_limited_only: רק בשירות
 * פרטני או בבית, או בקבוצה מוגבלת מקום.
 */
export function noShowCharged(settings: Settings, mode: ServiceMode, capacityLimited: boolean): boolean {
  switch (noShowRule(settings)) {
    case "always":
      return true;
    case "never":
      return false;
    default:
      return mode === "individual" || mode === "home" || capacityLimited;
  }
}

/** כלל ההחזר באשפוז: קבוצה לפי group, וכל השאר (פרטני, בית, מרחוק) לפי individual. */
export function hospitalizationRefund(settings: Settings, mode: ServiceMode): string {
  return mode === "group" ? settings.hospitalization_refund.group : settings.hospitalization_refund.individual;
}

export const NO_SHOW_TEXT = {
  charged: "אי-הגעה מחויבת",
  free: "אי-הגעה לא מחויבת",
} as const;

export const HOSPITALIZATION_TEXT: Record<string, string> = {
  full_to_participant: "החזר מלא למשתתף",
  by_contract: "לפי החוזה עם המפעיל",
};

export interface ServiceTerms {
  mode: ServiceMode;
  cancellationNoticeHours: number | null;
  noShowCharged: boolean;
  hospitalizationRefund: string;
  notifyCompanion: boolean;
}

/** כל התנאים של שירות. null למוצר או לשירות בלי אופן מתן. */
export function serviceTerms(
  s: Pick<Service, "serviceMode" | "capacityLimited" | "categoryCode">,
  seed: Seed,
): ServiceTerms | null {
  if (!s.serviceMode || isProduct(seed, s.categoryCode)) return null;
  const { settings } = seed;
  return {
    mode: s.serviceMode,
    cancellationNoticeHours: cancellationNoticeHours(settings, s.serviceMode),
    noShowCharged: noShowCharged(settings, s.serviceMode, s.capacityLimited ?? false),
    hospitalizationRefund: hospitalizationRefund(settings, s.serviceMode),
    notifyCompanion: settings.hospitalization_refund.notify_companion,
  };
}

/** כלל איכות החיים של שירות: לפי הקטגוריה, ובקטגוריה עם כמה פריטים לפי שם. */
export function qolRuleFor(seed: Seed, s: Pick<Service, "categoryCode" | "serviceTypeId" | "name">) {
  const rules = seed.qol_rules.filter((r) => r.category === s.categoryCode);
  if (rules.length <= 1) return rules[0];
  const typeName = seedIndex(seed).serviceTypes.get(s.serviceTypeId)?.name ?? s.name;
  return rules.find((r) => typeName.startsWith(r.item) || r.item.startsWith(typeName)) ?? rules[0];
}

export interface PointsSplit {
  coveredPoints: number | null;
  copayPoints: number | null;
  copayBasis: CopayBasis;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * כמה מהמחיר בנקודות מכוסה מהארנק וכמה משלם הקשיש.
 * - איכות חיים, fixed_amount: הערך ב-qol_rules מכוסה, והשאר על הקשיש.
 * - איכות חיים, percent: qol_copay על הקשיש, והארנק עד qol_cap_month.
 * - מחיר ייחוס מחייב: הארנק מכסה עד מחיר הייחוס (לפי דרגת ההשתתפות), וההפרש על הקשיש.
 * - אחרת: לפי דרגת ההשתתפות העצמית.
 */
export function pointsSplit(
  s: Pick<Service, "categoryCode" | "serviceTypeId" | "name" | "copayTier">,
  pricePoints: number,
  seed: Seed,
  reference: { binding: boolean; referencePoints: number | null } = { binding: false, referencePoints: null },
): PointsSplit {
  const { settings } = seed;
  const category = seedIndex(seed).categories.get(s.categoryCode);
  if (category && (QOL_LAYERS as readonly string[]).includes(category.layer)) {
    if (qolMode(settings) === "fixed_amount") {
      const value = qolRuleFor(seed, s)?.value;
      if (value === null || value === undefined) return { coveredPoints: null, copayPoints: null, copayBasis: "qol_fixed" };
      const covered = Math.min(pricePoints, value * settings.points_per_shekel);
      return { coveredPoints: round2(covered), copayPoints: round2(pricePoints - covered), copayBasis: "qol_fixed" };
    }
    const covered = Math.min(pricePoints * (1 - settings.qol_copay), settings.qol_cap_month * settings.points_per_shekel);
    return { coveredPoints: round2(covered), copayPoints: round2(pricePoints - covered), copayBasis: "qol_percent" };
  }
  const rate = copayRate(settings, s.copayTier);
  if (reference.binding && reference.referencePoints !== null) {
    const covered = Math.min(pricePoints, reference.referencePoints) * (1 - rate);
    return { coveredPoints: round2(covered), copayPoints: round2(pricePoints - covered), copayBasis: "reference_binding" };
  }
  return { coveredPoints: round2(pricePoints * (1 - rate)), copayPoints: round2(pricePoints * rate), copayBasis: "tier" };
}

export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  group: "קבוצתי",
  individual: "פרטני",
  home: "בבית",
  remote: "מרחוק",
};
