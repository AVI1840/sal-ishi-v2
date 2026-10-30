// דירוג ספקים: חמישה רכיבים, מתג אחד (supplier_rating_enabled), והמשקלות ייקבעו
// בהמשך. עד אז ממוצע שווה של הרכיבים שיש עליהם הערכה. מוצג רק מעל מספר מינימלי
// של הערכות (supplier_rating_min_evaluations), אחרת "ספק חדש". לא חוסם שירות ולא
// נכנס לתקן קליטת המפעילים. הדירוג המחייב אצל ספק העל.

import type { Service, Supplier } from "../model";
import type { Settings } from "../seed";

/** חמשת רכיבי הדירוג, והשדה בהערכה שמזין כל אחד. */
export const SUPPLIER_RATING_COMPONENTS = [
  { key: "audienceFit", label: "התאמה לקהל היעד" },
  { key: "satisfaction", label: "דירוג לקוחות ושביעות רצון" },
  { key: "quality", label: "דירוג מלווה" },
  { key: "serviceLevel", label: "עמידה ברמת השירות שנקבעה" },
  { key: "outcomes", label: "תוצאות" },
] as const;

export type RatingComponentKey = (typeof SUPPLIER_RATING_COMPONENTS)[number]["key"];

export interface SupplierScore {
  /** ממוצע משוקלל, 1 עד 5. */
  score: number;
  quarter: string;
  evaluations: number;
  /** פחות הערכות מהמינימום: מציגים "ספק חדש". */
  newSupplier: boolean;
}

/**
 * הציון לפי ההערכה האחרונה: ממוצע שווה של הרכיבים (המשקלות ייקבעו), או משוקלל
 * כשנקבעו משקלות (supplier_rating_component_weights). null כשהדירוג כבוי.
 * newSupplier: פחות הערכות מהמינימום, ואז מציגים "ספק חדש" ולא ציון.
 */
export function supplierScore(
  supplier: Pick<Supplier, "evaluations">,
  settings: Pick<Settings, "supplier_rating_enabled" | "supplier_rating_component_weights" | "supplier_rating_min_evaluations">,
): SupplierScore | null {
  if (settings.supplier_rating_enabled === false) return null;
  const evals = [...(supplier.evaluations ?? [])].sort((a, b) => a.quarter.localeCompare(b.quarter));
  const last = evals[evals.length - 1];
  if (!last) return null;
  const weights = settings.supplier_rating_component_weights ?? null;
  const parts = SUPPLIER_RATING_COMPONENTS.map((c) => ({ key: c.key, v: last[c.key] })).filter((x): x is { key: RatingComponentKey; v: number } => typeof x.v === "number");
  const totalW = weights ? parts.reduce((n, x) => n + (weights[x.key] ?? 0), 0) : parts.length;
  const sum = weights ? parts.reduce((n, x) => n + x.v * (weights[x.key] ?? 0), 0) : parts.reduce((n, x) => n + x.v, 0);
  const score = totalW ? sum / totalW : 0;
  const min = settings.supplier_rating_min_evaluations ?? 1;
  return { score: Math.round(score * 10) / 10, quarter: last.quarter, evaluations: evals.length, newSupplier: evals.length < min };
}

export interface CompetitionFlag {
  authority: string;
  neighborhoodId: string;
  serviceTypeId: string;
  suppliers: number;
  max: number;
}

/**
 * מדד התחרות ממסמך הקטלוג: יותר מ-N ספקים לאותו סוג שירות בשכונה (מקומי), או
 * למוצר בערוץ הארצי. מדד בלבד.
 */
export function competitionFlags(services: readonly Service[], settings: Pick<Settings, "competition_max_suppliers_local" | "competition_max_suppliers_national">): CompetitionFlag[] {
  const groups = new Map<string, { s: Service; suppliers: Set<string> }>();
  for (const s of services) {
    const national = s.reach === "national";
    const key = national ? `national|${s.serviceTypeId}` : `${s.authority}|${s.neighborhoodId}|${s.serviceTypeId}`;
    const g = groups.get(key) ?? { s, suppliers: new Set<string>() };
    g.suppliers.add(`${s.authority}|${s.supplierCode}`);
    groups.set(key, g);
  }
  const flags: CompetitionFlag[] = [];
  for (const { s, suppliers } of groups.values()) {
    const national = s.reach === "national";
    const max = (national ? settings.competition_max_suppliers_national : settings.competition_max_suppliers_local) ?? (national ? 5 : 3);
    if (suppliers.size > max) {
      flags.push({ authority: national ? "ארצי" : s.authority, neighborhoodId: national ? "" : s.neighborhoodId, serviceTypeId: s.serviceTypeId, suppliers: suppliers.size, max });
    }
  }
  return flags;
}
