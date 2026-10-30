/**
 * "הקהילה שלי" אצל המלווה: תמונה מצטברת של השכונה מהאטלס, באותם כללים שהמטה
 * ואטלס השטח מפעילים (תוספת 3): רצפה בכל תחום ליבה, גיוון, נגישות, יעד עושר
 * כמדד, ופערים עם חלופות. מספרים מצטברים בלבד: שירותים, מפעילים לפי סוג,
 * פערים. אין כאן נתוני אזרחים.
 *
 * המקור: אותו קטלוג הדגמה שממנו נבנה השוק של האזרחית (DEMO_JERUSALEM).
 */
import {
  DEMO_JERUSALEM,
  buildDemoAuthority,
  buildDemoNationalChannel,
  coverage,
  gapAlternatives,
  type CoverageLevel,
} from "@sal-ishi/core";
import { catalogState } from "@/data/catalogSource";
import { servicesFor } from "@/pilot/services";

const SUPPLIER_TYPE_LABEL: Record<string, string> = {
  authority: "מתנ\"ס או גוף ציבורי",
  npo: "עמותות",
  company: "חברות",
  exempt: "מדריכים עצמאיים",
  licensed: "אנשי מקצוע עצמאיים",
};

export interface CommunityCategory {
  id: string;
  name: string;
  count: number;
  floor: number;
  target: number | null;
  accessible: number | null;
  level: CoverageLevel;
  alerts: string[];
  /** חלופות כשיש פער ברצפה: שירות אזורי, מרחוק, או ברשות אחרת. */
  alternatives: string[];
}

export interface Community {
  neighborhood: string;
  /** שירותים בשכונה ובאזור, כמו בשוק של האזרח. */
  services: number;
  /** כל מה שזמין לתושבי השכונה, כולל ארציים ומרחוק: אותו מספר שהאזרח רואה בשוק. */
  reachable: number;
  suppliers: { label: string; count: number }[];
  categories: CommunityCategory[];
}

let cache: ReturnType<typeof source> | null = null;
function source() {
  const data = buildDemoAuthority(DEMO_JERUSALEM);
  const national = buildDemoNationalChannel();
  return { data, all: { ...data, services: [...data.services, ...national.services] } };
}

export function communityFor(neighborhoodName: string): Community | null {
  cache ??= source();
  const { data, all } = cache;
  const seed = catalogState.seed;
  const n = data.neighborhoods.find((x) => x.name === neighborhoodName);
  if (!n) return null;
  const result = coverage(data, seed);
  // אותו כלל כמו בשוק של האזרח: רק שירות בסטטוס שמתפרסם לאזרח (publish_to_citizen_statuses).
  const published = new Set(seed.settings.publish_to_citizen_statuses);
  const here = data.services.filter((s) => published.has(s.status) && (s.neighborhoodId === n.id || (s.servesNeighborhoods ?? []).includes(n.id)));
  const bySupplierType = new Map<string, Set<string>>();
  for (const s of here) {
    const sup = data.suppliers.find((x) => x.code === s.supplierCode);
    const type = sup?.type ?? "other";
    if (!bySupplierType.has(type)) bySupplierType.set(type, new Set());
    bySupplierType.get(type)!.add(s.supplierCode);
  }
  const categories = seed.core_categories
    .filter((c) => !("national_list_only" in c && c.national_list_only))
    .map((c) => {
      const cell = result.cells.find((x) => x.neighborhoodId === n.id && x.coreCategoryId === c.id);
      const alt = cell && cell.missing > 0 ? gapAlternatives(all, seed, n.id, c.id, 2) : null;
      return {
        id: c.id,
        name: c.name,
        count: cell?.count ?? 0,
        floor: cell?.floor ?? seed.settings.core_floor,
        target: cell?.target ?? null,
        accessible: cell?.accessible ?? null,
        level: cell?.level ?? "not_checked",
        alerts: result.alerts.filter((a) => a.neighborhoodId === n.id && a.coreCategoryId === c.id).map((a) => a.message),
        alternatives: alt ? [...alt.regional, ...alt.remote, ...alt.otherAuthority].map((s) => s.name).slice(0, 3) : [],
      };
    });
  return {
    neighborhood: n.name,
    // אותם מספרים כמו בשוק של האזרח: אותה פונקציה (servicesFor) על אותו קטלוג.
    services: servicesFor(n.name).filter((s) => s.reach !== "national").length,
    reachable: servicesFor(n.name).length,
    suppliers: [...bySupplierType.entries()].map(([type, codes]) => ({ label: SUPPLIER_TYPE_LABEL[type] ?? type, count: codes.size })),
    categories,
  };
}
