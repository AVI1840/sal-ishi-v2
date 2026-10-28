// מבחן כיסוי: לכל שכונה ולכל קטגוריית ליבה, כמה שירותים רציפים שנכנסו או
// אושרו, מול core_floor. מוצרי מניעה הם ערוץ ארצי ולא נבדקים ברצפה.
// ההתראות (תת-תחום והתאמה קהילתית) לא חוסמות.

import type { Community, MonthlyActivity, Neighborhood, Service } from "../model";
import type { Seed } from "../seed";
import { CONTINUITY_STATUS, continuityUnits, type ContinuityUnit } from "./continuity";
import { countsTowardCoverage } from "./entryTest";

export type CoverageLevel = "green" | "orange" | "red" | "not_checked";

export interface CoverageCell {
  neighborhoodId: string;
  coreCategoryId: string;
  count: number;
  floor: number;
  missing: number;
  level: CoverageLevel;
  unitKeys: string[];
}

export interface CoverageAlert {
  neighborhoodId: string;
  coreCategoryId: string;
  kind: "subarea" | "community";
  code?: string;
  community?: Community;
  message: string;
}

export interface CoverageResult {
  cells: CoverageCell[];
  alerts: CoverageAlert[];
  units: ContinuityUnit[];
}

export function levelForMissing(missing: number): Exclude<CoverageLevel, "not_checked"> {
  if (missing <= 0) return "green";
  if (missing === 1) return "orange";
  return "red";
}

export function coverage(
  input: {
    neighborhoods: readonly Neighborhood[];
    services: readonly Service[];
    activity: readonly MonthlyActivity[];
  },
  seed: Seed,
): CoverageResult {
  const { settings } = seed;
  const floor = settings.core_floor;
  const units = continuityUnits(input.services, input.activity, settings);
  const serviceById = new Map(input.services.map((s) => [s.id, s]));
  const communityNames = new Map(seed.community_profiles.map((c) => [c.id, c.name]));

  // יחידה נספרת אם היא רציפה ולפחות אחד השירותים בה נכנס או אושר.
  const qualifying = units.filter(
    (u) =>
      u.status === CONTINUITY_STATUS.continuous &&
      u.serviceIds.some((id) => {
        const s = serviceById.get(id);
        return s ? countsTowardCoverage(s, seed) : false;
      }),
  );

  const cells: CoverageCell[] = [];
  const alerts: CoverageAlert[] = [];

  for (const n of input.neighborhoods) {
    const inNeighborhood = qualifying.filter((u) => u.neighborhoodId === n.id);

    for (const cc of seed.core_categories) {
      if (cc.national_list_only) {
        cells.push({ neighborhoodId: n.id, coreCategoryId: cc.id, count: 0, floor, missing: 0, level: "not_checked", unitKeys: [] });
        continue;
      }
      const inCategory = inNeighborhood.filter((u) => cc.codes.includes(u.categoryCode));
      const missing = Math.max(0, floor - inCategory.length);
      cells.push({
        neighborhoodId: n.id,
        coreCategoryId: cc.id,
        count: inCategory.length,
        floor,
        missing,
        level: levelForMissing(missing),
        unitKeys: inCategory.map((u) => u.key),
      });

      for (const sub of cc.subareas) {
        if (!sub.alert_if_below_floor || !settings.subarea_alerts.includes(sub.code)) continue;
        const subCount = inCategory.filter((u) => u.categoryCode === sub.code).length;
        if (subCount < floor) {
          alerts.push({
            neighborhoodId: n.id,
            coreCategoryId: cc.id,
            kind: "subarea",
            code: sub.code,
            message: `${sub.name}: ${subCount} שירותים רציפים, מתחת לרצפה של ${floor}`,
          });
        }
      }

      if (n.community !== "general") {
        const fits = inCategory.some((u) =>
          u.serviceIds.some((id) => serviceById.get(id)?.communityFit.includes(n.community)),
        );
        if (!fits) {
          alerts.push({
            neighborhoodId: n.id,
            coreCategoryId: cc.id,
            kind: "community",
            community: n.community,
            message: `${cc.name}: אין שירות רציף שמותאם לפרופיל ${communityNames.get(n.community) ?? n.community}`,
          });
        }
      }
    }
  }

  return { cells, alerts, units };
}

/** סוגי שירות מהספרייה להשלמת פער, לפי קטגוריית ליבה. מעדיף סוגים שנוסו בירושלים. */
export function suggestServiceTypes(seed: Seed, coreCategoryId: string, limit = 3) {
  const cc = seed.core_categories.find((c) => c.id === coreCategoryId);
  if (!cc) return [];
  return seed.service_types
    .filter((t) => cc.codes.includes(t.category) && !(t.note ?? "").startsWith("בחוץ"))
    .sort((a, b) => b.jerusalem.participants - a.jerusalem.participants)
    .slice(0, limit);
}
