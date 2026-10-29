// עזרים לקריאת ההגדרות: מה מסומן "הצעה", חלון המיצוי ושיעור ההשתתפות העצמית.

import type { CopayTier } from "./model";
import type { Seed, Settings } from "./seed";
import { QOL_LAYERS, seedIndex } from "./seed";

const STATUS_SUFFIX = "_status";

const isProposalText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().toLowerCase().startsWith("proposal");

/** סטטוס בתוך ההגדרה עצמה (הפורמט של 0.4: { value, status }). */
function nestedStatus(value: unknown): string | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const status = (value as { status?: unknown }).status;
    if (typeof status === "string") return status;
  }
  return undefined;
}

/**
 * מפתחות הגדרה שהסטטוס שלהם הוא הצעה. שני פורמטים: מפתח X_status שחל על כל
 * הגדרה ששמה מתחיל ב-X (points_rollover_status חל על points_rollover_months),
 * או status בתוך ההגדרה עצמה (qol_mode: { value, status }).
 */
export function proposalKeys(settings: Settings): string[] {
  const record = settings as Record<string, unknown>;
  const keys = Object.keys(settings);
  const result = new Set<string>();
  for (const key of keys) {
    if (isProposalText(nestedStatus(record[key]))) result.add(key);
    if (!key.endsWith(STATUS_SUFFIX) || !isProposalText(record[key])) continue;
    const prefix = key.slice(0, -STATUS_SUFFIX.length);
    for (const k of keys) if (k !== key && k.startsWith(prefix)) result.add(k);
  }
  return [...result].sort();
}

export function isProposal(settings: Settings, key: string): boolean {
  return proposalKeys(settings).includes(key);
}

/** טקסט הסטטוס של הגדרה (מהאובייקט עצמו או ממפתח X_status), להצגה ליד "הצעה". */
export function statusNote(settings: Settings, key: string): string {
  const record = settings as Record<string, unknown>;
  const nested = nestedStatus(record[key]);
  if (nested) return nested;
  const statusKey = Object.keys(record)
    .filter((k) => k.endsWith(STATUS_SUFFIX) && key.startsWith(k.slice(0, -STATUS_SUFFIX.length)))
    .sort((a, b) => b.length - a.length)[0];
  return statusKey ? String(record[statusKey] ?? "") : "";
}

// קריאת ההגדרות של 0.4 שמגיעות בפורמט { value, status }.
export const qolMode = (s: Settings) => s.qol_mode.value;
export const referencePriceMode = (s: Settings) => s.reference_price_mode.value;
export const activeMinSessions = (s: Settings) => s.active_participant_min_sessions_month.value;
export const productsCapShare = (s: Settings) => s.products_quarterly_cap_share.value;
export const noShowRule = (s: Settings) => s.no_show_charge_rule.value;
export const supplierRatingEnabled = (s: Settings) => s.supplier_rating_enabled ?? true;

/**
 * תקרת המוצרים ברבעון בנקודות: שיעור מהארנק הרבעוני
 * (0.25 כפול 500 כפול 3 = 375, הפירוש שאושר ב-29.10).
 */
export function productsQuarterlyCapPoints(s: Settings): number {
  return Math.round(productsCapShare(s) * s.personal_wallet * 3 * s.points_per_shekel);
}

/** הרבעון של חודש: 2026-10 הוא 2026-Q4. */
export function quarterOf(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${y}-Q${Math.ceil(m / 3)}`;
}

/** שלושת החודשים של רבעון, מהמוקדם למאוחר. */
export function quarterMonths(quarter: string): string[] {
  const [y, q] = quarter.split("-Q").map(Number) as [number, number];
  return [1, 2, 3].map((i) => `${y}-${String((q - 1) * 3 + i).padStart(2, "0")}`);
}

/** מספר החודשים בחלון המיצוי, מתוך ערך כמו "rolling_3_months". */
export function utilizationWindowMonths(settings: Settings): number {
  const match = /(\d+)/.exec(settings.utilization_window);
  return match ? Number(match[1]) : 3;
}

export function copayRate(settings: Settings, tier: CopayTier): number {
  return settings.copay_tiers[tier];
}

/**
 * דרגת השתתפות עצמית ברירת מחדל לפי קטגוריה. "חוגים" אינם מסומנים ב-seed,
 * ולכן הדרגה הזו נבחרת ידנית בטופס.
 */
export function defaultCopayTier(seed: Seed, categoryCode: string): CopayTier {
  const category = seedIndex(seed).categories.get(categoryCode);
  if (category && (QOL_LAYERS as readonly string[]).includes(category.layer)) return "qol";
  return "core_and_prevention";
}

/** החודש הקודם בפורמט YYYY-MM. */
export function previousMonth(month: string, steps = 1): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const total = y * 12 + (m - 1) - steps;
  const year = Math.floor(total / 12);
  const mon = (total % 12) + 1;
  return `${year}-${String(mon).padStart(2, "0")}`;
}

/** החודשים בחלון שמסתיים ב-asOfMonth, מהמוקדם למאוחר. */
export function windowMonths(asOfMonth: string, size: number): string[] {
  const months: string[] = [];
  for (let i = size - 1; i >= 0; i--) months.push(previousMonth(asOfMonth, i));
  return months;
}
