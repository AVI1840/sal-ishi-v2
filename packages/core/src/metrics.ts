// מדדים לפי metrics_definitions (גרסה 0.4). מיצוי הוא כסף (rules/utilization),
// חדירה היא אנשים פעילים, ושני המדדים נפרדים. כל המספרים מצטברים, ומתחת לסף
// התא הקטן הספירה לא מוצגת.

import type { NeighborhoodMonth, Service } from "./model";
import type { CoverageResult } from "./rules/coverage";
import { hourlyPrice } from "./rules/terms";
import type { Seed, Settings } from "./seed";
import { activeMinSessions, quarterOf } from "./settings";

/** שם המדד כפי שמוגדר ב-seed, למשל "חדירה". */
export function metricName(seed: Seed, id: string): string {
  return seed.metrics_definitions.find((m) => m.id === id)?.name ?? id;
}

/** פעיל: לפחות active_participant_min_sessions_month מפגשים בחודש. */
export function isActiveParticipant(sessionsInMonth: number, settings: Settings): boolean {
  return sessionsInMonth >= activeMinSessions(settings);
}

const latestUpTo = (rows: readonly NeighborhoodMonth[], asOfMonth?: string) =>
  [...rows].filter((r) => !asOfMonth || r.month <= asOfMonth).sort((a, b) => b.month.localeCompare(a.month));

export interface PenetrationResult {
  neighborhoodId: string;
  month: string | null;
  /** null כשאין נתון או כשהספירה מתחת לסף התא הקטן. */
  active: number | null;
  eligible: number | null;
  rate: number | null;
  suppressed: boolean;
}

/**
 * חדירה: משתתפים פעילים חלקי הזכאים ברמות 1 עד 3, בחודש האחרון שיש בו שני
 * הנתונים. הספירה מגיעה מדוח ספק העל, כי מנתוני השירותים לא ניתן לדעת מי
 * השתתף ביותר משירות אחד.
 */
export function penetration(
  neighborhoodId: string,
  enrollment: readonly NeighborhoodMonth[],
  settings: Settings,
  asOfMonth?: string,
): PenetrationResult {
  const row = latestUpTo(enrollment.filter((e) => e.neighborhoodId === neighborhoodId), asOfMonth).find(
    (e) => e.activeParticipants !== undefined && e.eligible !== undefined,
  );
  if (!row) return { neighborhoodId, month: null, active: null, eligible: null, rate: null, suppressed: false };
  const active = row.activeParticipants!;
  const eligible = row.eligible!;
  const suppressed = active > 0 && active < settings.small_cell_threshold;
  return {
    neighborhoodId,
    month: row.month,
    active: suppressed ? null : active,
    eligible,
    rate: suppressed || eligible === 0 ? null : active / eligible,
    suppressed,
  };
}

export interface SpreadResult {
  neighborhoods: number;
  meeting: number;
  rate: number | null;
  meetingIds: string[];
  /** יש לפחות מוצר ארצי אחד שנכנס או אושר (נבדק בנפרד כשמוצרים לא בריצפה). */
  productsAvailable: boolean;
}

/**
 * פריסה: שכונות שבהן כל קטגוריות הליבה שנבדקות ברצפה ירוקות, חלקי כל השכונות.
 * מוצרים לא נספרים ברצפה (products_count_in_floor), ולכן נבדקים בנפרד.
 */
export function spread(result: CoverageResult, productsAvailable: boolean): SpreadResult {
  const byNeighborhood = new Map<string, boolean>();
  for (const c of result.cells) {
    if (c.level === "not_checked") {
      if (!byNeighborhood.has(c.neighborhoodId)) byNeighborhood.set(c.neighborhoodId, true);
      continue;
    }
    byNeighborhood.set(c.neighborhoodId, (byNeighborhood.get(c.neighborhoodId) ?? true) && c.level === "green");
  }
  const meetingIds = [...byNeighborhood].filter(([, ok]) => ok).map(([id]) => id);
  const total = byNeighborhood.size;
  return { neighborhoods: total, meeting: meetingIds.length, rate: total ? meetingIds.length / total : null, meetingIds, productsAvailable };
}

export interface HourlyPriceRow {
  period: string;
  categoryCode: string;
  /** אזור: הרשות (אין ישות "אזור" במודל). בערוץ הארצי "ארצי". */
  authority: string;
  services: number;
  avgHourly: number;
}

/** תקופת המדד לפי price_index_period: רבעון (2026-Q4) או חודש. */
export function pricePeriod(month: string, settings: Settings): string {
  return settings.price_index_period === "quarter" ? quarterOf(month) : month;
}

/**
 * מדד מחיר לשעה: ממוצע של unitPrice / hoursPerUnit לפי קטגוריה ורשות, בתקופה
 * של asOfMonth. נכנסים שירותים שהתחילו עד סוף התקופה ולא נדחו.
 */
export function hourlyPriceIndex(services: readonly Service[], seed: Seed, asOfMonth: string): HourlyPriceRow[] {
  const period = pricePeriod(asOfMonth, seed.settings);
  const groups = new Map<string, { categoryCode: string; authority: string; prices: number[] }>();
  for (const s of services) {
    if (s.status === "נדחה" || s.startMonth > asOfMonth || pricePeriod(s.startMonth, seed.settings) > period) continue;
    const price = hourlyPrice(s);
    if (price === null) continue;
    const authority = s.reach === "national" ? "ארצי" : s.authority;
    const key = `${s.categoryCode}|${authority}`;
    const g = groups.get(key) ?? { categoryCode: s.categoryCode, authority, prices: [] };
    g.prices.push(price);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({
      period,
      categoryCode: g.categoryCode,
      authority: g.authority,
      services: g.prices.length,
      avgHourly: Math.round((g.prices.reduce((a, b) => a + b, 0) / g.prices.length) * 100) / 100,
    }))
    .sort((a, b) => a.categoryCode.localeCompare(b.categoryCode, undefined, { numeric: true }) || a.authority.localeCompare(b.authority));
}

export interface FirstServiceResult {
  neighborhoodId: string;
  month: string | null;
  avgDays: number | null;
  /** מעל first_service_max_days. */
  overMax: boolean;
  suppressed: boolean;
}

/** זמן לשירות ראשון: הממוצע בחודש האחרון שיש בו נתון, והתראה מעל הסף. */
export function timeToFirstService(
  neighborhoodId: string,
  enrollment: readonly NeighborhoodMonth[],
  settings: Settings,
  asOfMonth?: string,
): FirstServiceResult {
  const row = latestUpTo(enrollment.filter((e) => e.neighborhoodId === neighborhoodId), asOfMonth).find(
    (e) => e.firstServiceDaysAvg !== undefined,
  );
  if (!row) return { neighborhoodId, month: null, avgDays: null, overMax: false, suppressed: false };
  // ממוצע על פחות מסף התא הקטן לא מוצג (הוא חושף זמנים של אנשים בודדים).
  const suppressed = row.firstServiceCount !== undefined && row.firstServiceCount < settings.small_cell_threshold;
  const avgDays = suppressed ? null : row.firstServiceDaysAvg!;
  return { neighborhoodId, month: row.month, avgDays, overMax: avgDays !== null && avgDays > settings.first_service_max_days, suppressed };
}
