// מבחן כיסוי: לכל שכונה ולכל קטגוריית ליבה, כמה שירותים רציפים שנכנסו או
// אושרו, מול core_floor. מוצרי מניעה הם ערוץ ארצי, ונבדקים ברצפה רק כש-
// products_count_in_floor = true (ואז נספרים המוצרים הארציים שנכנסו או אושרו).
// ההתראות (תת-תחום והתאמה קהילתית) לא חוסמות.

import type { Community, MonthlyActivity, Neighborhood, Service, UnmetDemand } from "../model";
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
  kind: "subarea" | "community" | "breadth";
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
  // ערוץ ארצי לא נבדק ברצפה של שכונה.
  const local = input.services.filter((s) => s.reach !== "national");
  const nationalProducts = input.services.filter((s) => s.reach === "national" && countsTowardCoverage(s, seed));
  const units = continuityUnits(local, input.activity, settings);
  const serviceById = new Map(local.map((s) => [s.id, s]));
  const authorityNeighborhoods = new Map<string, string[]>();
  for (const n of input.neighborhoods) authorityNeighborhoods.set(n.authority, [...(authorityNeighborhoods.get(n.authority) ?? []), n.id]);
  const breadthMin = settings.subcategory_breadth_min ?? 0;
  const subareaMin = settings.subarea_alert_min ?? floor;
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

  // שירות ברמת רשות נספר בכל שכונות הרשות, ושירות עם servesNeighborhoods גם בשכונות שסומנו.
  const served = new Map(
    qualifying.map((u) => {
      const set = new Set<string>([u.neighborhoodId]);
      for (const id of u.serviceIds) {
        const s = serviceById.get(id);
        if (!s) continue;
        if (s.reach === "authority" || s.reach === "regional") for (const nid of authorityNeighborhoods.get(s.authority) ?? []) set.add(nid);
        for (const nid of s.servesNeighborhoods ?? []) set.add(nid);
      }
      return [u, set] as const;
    }),
  );

  for (const n of input.neighborhoods) {
    const inNeighborhood = qualifying.filter((u) => served.get(u)?.has(n.id));

    for (const cc of seed.core_categories) {
      if (cc.national_list_only) {
        if (!settings.products_count_in_floor) {
          cells.push({ neighborhoodId: n.id, coreCategoryId: cc.id, count: 0, floor, missing: 0, level: "not_checked", unitKeys: [] });
        } else {
          const products = nationalProducts.filter((s) => cc.codes.includes(s.categoryCode));
          const missing = Math.max(0, floor - products.length);
          cells.push({ neighborhoodId: n.id, coreCategoryId: cc.id, count: products.length, floor, missing, level: levelForMissing(missing), unitKeys: products.map((s) => s.id) });
        }
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
        if (subCount < subareaMin) {
          alerts.push({
            neighborhoodId: n.id,
            coreCategoryId: cc.id,
            kind: "subarea",
            code: sub.code,
            message: subareaMin === 1 ? `${sub.name}: אין שירות רציף בתת-התחום` : `${sub.name}: ${subCount} שירותים רציפים, פחות מ-${subareaMin}`,
          });
        }
      }

      // רוחב: השירותים שנספרו מפוזרים על פני כמה תתי-קטגוריות, ולא כולם באחת.
      const needed = Math.min(breadthMin, cc.codes.length);
      const distinct = new Set(inCategory.map((u) => u.categoryCode)).size;
      if (needed > 1 && inCategory.length >= needed && distinct < needed) {
        alerts.push({
          neighborhoodId: n.id,
          coreCategoryId: cc.id,
          kind: "breadth",
          message: `${cc.name}: כל השירותים הרציפים בתת-קטגוריה אחת. כדאי לפחות ${needed} תתי-קטגוריות שונות`,
        });
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

/**
 * סוגי שירות מהספרייה להשלמת פער בקטגוריית ליבה. קודם תתי-קטגוריות שחסרות בתא
 * (כדי לעמוד גם במדד הרוחב), ובתוכן מה שנוסה בירושלים עם יותר משתתפים.
 * שירותים אזוריים, ארציים ומרחוק מופיעים כחלופה כשאין מענה מקומי.
 */
export function suggestServiceTypes(seed: Seed, coreCategoryId: string, limit = 3, opts: { presentCodes?: readonly string[] } = {}) {
  const cc = seed.core_categories.find((c) => c.id === coreCategoryId);
  if (!cc) return [];
  const present = new Set(opts.presentCodes ?? []);
  const outside = new Set(seed.categories.filter((c) => c.layer === "בחוץ").map((c) => c.code));
  return seed.service_types
    .filter((t) => cc.codes.includes(t.category) && !outside.has(t.category) && !(t.note ?? "").startsWith("בחוץ"))
    .sort(
      (a, b) =>
        Number(present.has(a.category)) - Number(present.has(b.category)) ||
        b.jerusalem.participants - a.jerusalem.participants,
    )
    .slice(0, limit);
}

/** ביקוש שלא נענה לפי שכונה וקטגוריית ליבה, מצטבר על כל החודשים. */
export function unmetByCell(unmet: readonly UnmetDemand[], seed: Seed) {
  const typeCategory = new Map(seed.service_types.map((t) => [t.id, t.category]));
  const out = new Map<string, { requests: number; types: Map<string, number> }>();
  for (const u of unmet) {
    const code = typeCategory.get(u.serviceTypeId);
    const cc = seed.core_categories.find((c) => code && c.codes.includes(code));
    if (!cc) continue;
    const key = `${u.neighborhoodId}|${cc.id}`;
    const cell = out.get(key) ?? { requests: 0, types: new Map<string, number>() };
    cell.requests += u.requests;
    cell.types.set(u.serviceTypeId, (cell.types.get(u.serviceTypeId) ?? 0) + u.requests);
    out.set(key, cell);
  }
  return out;
}
