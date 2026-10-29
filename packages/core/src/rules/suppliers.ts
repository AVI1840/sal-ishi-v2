// דירוג ספקים ומדד תחרות. הדירוג מוצג ונכנס לשכבת "המלצות וניסיון" במנוע
// ההתאמה. הוא לא חוסם שירות ולא נכנס לתקן קליטת המפעילים. ניתן לכיבוי (supplier_rating_enabled).

import type { Service, Supplier } from "../model";
import type { Settings } from "../seed";

export const DEFAULT_RATING_WEIGHTS = { quality: 0.4, outcomes: 0.3, satisfaction: 0.2, value: 0.1 } as const;

export interface SupplierScore {
  /** ממוצע משוקלל, 1 עד 5. */
  score: number;
  quarter: string;
  evaluations: number;
}

/** הציון לפי ההערכה האחרונה, עם משקלות מההגדרות. null אם אין הערכות. */
export function supplierScore(supplier: Pick<Supplier, "evaluations">, settings: Pick<Settings, "supplier_rating_weights">): SupplierScore | null {
  const evals = [...(supplier.evaluations ?? [])].sort((a, b) => a.quarter.localeCompare(b.quarter));
  const last = evals[evals.length - 1];
  if (!last) return null;
  const w = settings.supplier_rating_weights ?? DEFAULT_RATING_WEIGHTS;
  const score = last.quality * w.quality + last.outcomes * w.outcomes + last.satisfaction * w.satisfaction + last.value * w.value;
  return { score: Math.round(score * 10) / 10, quarter: last.quarter, evaluations: evals.length };
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
