// עזרים לקריאת ההגדרות: מה מסומן "הצעה", חלון המיצוי ושיעור ההשתתפות העצמית.

import type { CopayTier } from "./model";
import type { Seed, Settings } from "./seed";
import { QOL_LAYERS, seedIndex } from "./seed";

const STATUS_SUFFIX = "_status";

/**
 * מפתחות הגדרה שהסטטוס שלהם הוא הצעה. מפתח X_status חל על כל הגדרה ששמה
 * מתחיל ב-X (למשל points_rollover_status חל על points_rollover_months).
 */
export function proposalKeys(settings: Settings): string[] {
  const keys = Object.keys(settings);
  const result = new Set<string>();
  for (const key of keys) {
    if (!key.endsWith(STATUS_SUFFIX)) continue;
    const value = (settings as Record<string, unknown>)[key];
    if (typeof value !== "string" || !value.trim().toLowerCase().startsWith("proposal")) continue;
    const prefix = key.slice(0, -STATUS_SUFFIX.length);
    for (const k of keys) if (k !== key && k.startsWith(prefix)) result.add(k);
  }
  return [...result].sort();
}

export function isProposal(settings: Settings, key: string): boolean {
  return proposalKeys(settings).includes(key);
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
