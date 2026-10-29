// מחיר ייחוס: חציון של unitPrice לפי סוג שירות ויחידה. מחושב רק כשיש
// לפחות reference_price_min_samples דגימות. חריגה: יותר מ-price_outlier_threshold
// מעל החציון. מסומנת ולא חוסמת. ההיקף (רשות אחת או כל הפיילוטים) נקבע לפי
// השירותים שמעבירים לפונקציה.

//
// גרסה 0.4, reference_price_mode:
// - monitor: חציון והתראה על חריגה, בלי חסימה (ההתנהגות עד עכשיו).
// - binding: בקטגוריה וברשות שב-reference_price_binding_scope הארנק מכסה עד
//   מחיר הייחוס, וההפרש על הקשיש.
// - preactivated_low_competition: כמו binding, אוטומטית בקטגוריה ושכונה שבהן
//   פחות מ-low_competition_operator_threshold ספקים.

import type { Service } from "../model";
import type { Seed, Settings } from "../seed";
import { referencePriceMode } from "../settings";

export interface ReferencePrice {
  serviceTypeId: string;
  unit: string;
  samples: number;
  median: number | null;
}

export interface PriceOutlier {
  serviceId: string;
  serviceTypeId: string;
  unit: string;
  unitPrice: number;
  median: number;
  /** כמה מעל החציון, כשבר (0.21 = 21%). */
  deviation: number;
}

type PriceSettings = Pick<Settings, "reference_price_min_samples" | "price_outlier_threshold">;

const keyOf = (s: Pick<Service, "serviceTypeId" | "unit">) => `${s.serviceTypeId}|${s.unit}`;

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function referencePrices(services: readonly Service[], settings: PriceSettings): ReferencePrice[] {
  const groups = new Map<string, { serviceTypeId: string; unit: string; prices: number[] }>();
  for (const s of services) {
    if (s.unitPrice === undefined || !s.serviceTypeId) continue;
    const k = keyOf(s);
    const g = groups.get(k) ?? { serviceTypeId: s.serviceTypeId, unit: s.unit, prices: [] };
    g.prices.push(s.unitPrice);
    groups.set(k, g);
  }
  return [...groups.values()]
    .map((g) => ({
      serviceTypeId: g.serviceTypeId,
      unit: g.unit,
      samples: g.prices.length,
      median: g.prices.length >= settings.reference_price_min_samples ? median(g.prices) : null,
    }))
    .sort((a, b) => a.serviceTypeId.localeCompare(b.serviceTypeId) || a.unit.localeCompare(b.unit));
}

export function priceOutliers(services: readonly Service[], settings: PriceSettings): PriceOutlier[] {
  const refs = new Map(referencePrices(services, settings).map((r) => [`${r.serviceTypeId}|${r.unit}`, r]));
  const outliers: PriceOutlier[] = [];
  for (const s of services) {
    if (s.unitPrice === undefined) continue;
    const ref = refs.get(keyOf(s));
    if (!ref || ref.median === null || ref.median <= 0) continue;
    // עיגול לשמונה ספרות כדי ש-20% בדיוק לא ייחשב חריגה בגלל שגיאת נקודה צפה.
    const deviation = Math.round((s.unitPrice / ref.median - 1) * 1e8) / 1e8;
    if (deviation > settings.price_outlier_threshold) {
      outliers.push({
        serviceId: s.id,
        serviceTypeId: s.serviceTypeId,
        unit: s.unit,
        unitPrice: s.unitPrice,
        median: ref.median,
        deviation,
      });
    }
  }
  return outliers;
}

export interface ReferenceBinding {
  /** האם הארנק מכסה רק עד מחיר הייחוס בשירות הזה. */
  binding: boolean;
  /** מחיר הייחוס בנקודות, או null כשאין מספיק דגימות. */
  referencePoints: number | null;
  reason: "scope" | "low_competition" | null;
  /** ספקים שונים באותה קטגוריה ושכונה (בערוץ הארצי: בכל הערוץ). */
  operators: number;
}

const competitionKey = (s: Pick<Service, "authority" | "neighborhoodId" | "categoryCode" | "reach">) =>
  s.reach === "national" ? `national|${s.categoryCode}` : `${s.authority}|${s.neighborhoodId}|${s.categoryCode}`;

/**
 * לכל שירות: האם מחיר הייחוס מחייב בו, ומה המחיר בנקודות. החציון והספירה
 * מחושבים על השירותים שמועברים (במטה: כל הפיילוטים).
 */
export function referenceBindings(services: readonly Service[], seed: Seed): (s: Service) => ReferenceBinding {
  const { settings } = seed;
  const mode = referencePriceMode(settings);
  const refs = new Map(referencePrices(services, settings).map((r) => [`${r.serviceTypeId}|${r.unit}`, r.median]));
  const operators = new Map<string, Set<string>>();
  for (const s of services) {
    const k = competitionKey(s);
    operators.set(k, (operators.get(k) ?? new Set()).add(`${s.authority}|${s.supplierCode}`));
  }
  const scope = new Set(settings.reference_price_binding_scope.map((b) => `${b.categoryCode}|${b.authority}`));

  return (s) => {
    const median = refs.get(keyOf(s)) ?? null;
    const referencePoints = median === null ? null : median * settings.points_per_shekel;
    const count = operators.get(competitionKey(s))?.size ?? 0;
    let reason: ReferenceBinding["reason"] = null;
    if (mode === "binding" && scope.has(`${s.categoryCode}|${s.authority}`)) reason = "scope";
    if (mode === "preactivated_low_competition" && count < settings.low_competition_operator_threshold) reason = "low_competition";
    return { binding: reason !== null, referencePoints, reason, operators: count };
  };
}
