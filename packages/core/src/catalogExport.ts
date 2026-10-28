// catalog_export לאינטגרטור והקטלוג שמתפרסם לאזרח, לפי export_contract.
// נכנסים רק שירותים מאושרים. ספק עובר כקוד וסוג בלבד, בלי שם ובלי פרטי קשר,
// גם כשפרטי הספק עוברים למטה. אין נתוני תושבים ואין פעילות גולמית.

import {
  catalogExportSchema,
  citizenCatalogIndexSchema,
  citizenCatalogSchema,
  type CatalogExport,
  type CatalogItem,
  type CitizenCatalog,
  type CitizenCatalogIndex,
  type CitizenCatalogItem,
  type DemandBand,
  type MonthlyActivity,
  type Neighborhood,
  type Service,
  type Supplier,
} from "./model";
import { contentHash } from "./hash";
import { EXPORT_FORBIDDEN_KEYS, findForbiddenKeys } from "./privacy";
import { isPublishable } from "./rules/publish";
import { supplierScore } from "./rules/suppliers";
import type { Seed, Settings } from "./seed";
import { seedIndex } from "./seed";
import { copayRate, windowMonths } from "./settings";

export interface SkippedService {
  serviceId: string;
  reason: string;
}

interface CatalogSource {
  neighborhoods: readonly Neighborhood[];
  suppliers: readonly Supplier[];
  services: readonly Service[];
  activity?: readonly MonthlyActivity[];
}

export const NATIONAL_AUTHORITY = "ארצי";

function toCatalogItems(source: CatalogSource, seed: Seed): { items: CatalogItem[]; skipped: SkippedService[] } {
  const { categories, serviceTypes } = seedIndex(seed);
  const neighborhoods = new Map(source.neighborhoods.map((n) => [n.id, n]));
  const suppliers = new Map(source.suppliers.map((s) => [`${s.authority}|${s.code}`, s]));
  const items: CatalogItem[] = [];
  const skipped: SkippedService[] = [];

  for (const s of source.services) {
    if (!isPublishable(s, seed.settings)) continue;
    const reach = s.reach ?? "neighborhood";
    const national = reach === "national";
    const neighborhood = neighborhoods.get(s.neighborhoodId);
    const supplier = suppliers.get(`${s.authority}|${s.supplierCode}`);
    const category = categories.get(s.categoryCode);
    const type = serviceTypes.get(s.serviceTypeId);
    const pricePoints =
      s.pricePoints ?? (s.unitPrice !== undefined ? s.unitPrice * seed.settings.points_per_shekel : undefined);

    const problem =
      !neighborhood && !national
        ? "שכונה לא מוכרת"
        : !supplier
          ? "ספק לא מוכר"
          : !category || !type
            ? "קטגוריה או סוג שירות לא מוכרים"
            : pricePoints === undefined
              ? "אין מחיר בנקודות"
              : null;
    if (problem || !supplier || !category || !type || pricePoints === undefined) {
      skipped.push({ serviceId: s.id, reason: problem ?? "נתונים חסרים" });
      continue;
    }

    items.push({
      serviceId: s.id,
      authority: s.authority,
      neighborhoodId: national ? "" : s.neighborhoodId,
      neighborhoodName: national ? NATIONAL_AUTHORITY : neighborhood!.name,
      name: s.name,
      categoryCode: s.categoryCode,
      categoryName: category.name,
      serviceTypeId: s.serviceTypeId,
      serviceTypeName: type.name,
      supplierCode: supplier.code,
      supplierType: supplier.type,
      format: s.format,
      unit: s.unit,
      languages: [...s.languages],
      pricePoints,
      copayTier: s.copayTier,
      copayRate: copayRate(seed.settings, s.copayTier),
      deliveryMode: s.deliveryMode,
      communityFit: [...s.communityFit],
      attendanceMethod: [...s.attendanceMethod],
      cancellationPolicy: s.cancellationPolicy ?? null,
      reach,
      startMonth: s.startMonth,
    });
  }

  items.sort((a, b) => a.authority.localeCompare(b.authority) || a.serviceId.localeCompare(b.serviceId));
  return { items, skipped };
}

/** בדיקת הסכמה והשדות האסורים. זורקת שגיאה עם הפירוט. */
export function validateCatalogExport(value: unknown): CatalogExport {
  const parsed = catalogExportSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`catalog_export לא עובר בדיקת סכמה: ${issues.join("; ")}`);
  }
  const forbidden = findForbiddenKeys(value, EXPORT_FORBIDDEN_KEYS);
  if (forbidden.length) throw new Error(`ב-catalog_export יש שדות אסורים: ${forbidden.join(", ")}`);
  return parsed.data;
}

export async function buildCatalogExport(
  source: CatalogSource,
  seed: Seed,
  now = new Date(),
): Promise<{ export: CatalogExport; skipped: SkippedService[] }> {
  const { items, skipped } = toCatalogItems(source, seed);
  const contract = seed.export_contract;
  const result: CatalogExport = {
    schema: "catalog_export",
    version: "1.0",
    owner: contract.owner,
    generatedAt: now.toISOString(),
    seedVersion: seed.meta.version,
    contentHash: await contentHash(items),
    services: items,
  };
  if (contract.version !== result.version) {
    throw new Error(`גרסת החוזה ב-seed (${contract.version}) שונה מהגרסה שהקוד מייצר (${result.version})`);
  }
  return { export: validateCatalogExport(result), skipped };
}

/**
 * רמת ביקוש לשירות: שיא המשתתפים (כולל סבבים של אותה תוכנית) בחלון המיצוי.
 * מתחת לסף התא הקטן אין רמה, כך שלא נחשף מספר קטן.
 */
export function demandBand(
  service: Pick<Service, "id">,
  activity: readonly MonthlyActivity[],
  settings: Pick<Settings, "min_participants" | "small_cell_threshold" | "utilization_window">,
  asOfMonth?: string,
): DemandBand | null {
  const rows = activity.filter((a) => a.serviceId === service.id);
  if (!rows.length) return null;
  const months_ = rows.map((a) => a.month).sort();
  const latest = asOfMonth ?? months_[months_.length - 1]!;
  const size = Number(/(\d+)/.exec(settings.utilization_window)?.[1] ?? 3);
  const months = new Set(windowMonths(latest, size));
  const peak = Math.max(0, ...rows.filter((a) => months.has(a.month)).map((a) => a.uniqueParticipants));
  if (peak >= settings.min_participants * 2) return "high";
  if (peak >= settings.min_participants) return "medium";
  if (peak >= settings.small_cell_threshold) return "low";
  return null;
}

/** האם השירות זמין לתושבי השכונה: בשכונה עצמה, משרת אותה, ברמת רשות, אזורי או ארצי. */
export function servesNeighborhood(service: Service, neighborhood: Neighborhood): boolean {
  const reach = service.reach ?? "neighborhood";
  if (reach === "national") return true;
  if (service.neighborhoodId === neighborhood.id) return true;
  if (service.authority !== neighborhood.authority) return false;
  if (reach === "authority" || reach === "regional") return true;
  return (service.servesNeighborhoods ?? []).includes(neighborhood.id);
}

/** הקטלוג המאושר של שכונה אחת, כפי שהכלי לאזרח ולמלווה קורא אותו. */
export function buildCitizenCatalog(
  source: CatalogSource,
  neighborhoodId: string,
  seed: Seed,
  now = new Date(),
): { catalog: CitizenCatalog; skipped: SkippedService[] } {
  const neighborhood = source.neighborhoods.find((n) => n.id === neighborhoodId);
  if (!neighborhood) throw new Error(`שכונה ${neighborhoodId} לא נמצאה`);
  const visible = source.services.filter((s) => servesNeighborhood(s, neighborhood));
  const { items, skipped } = toCatalogItems({ ...source, services: visible }, seed);
  const byId = new Map(visible.map((s) => [s.id, s]));
  const suppliers = new Map(source.suppliers.map((s) => [`${s.authority}|${s.code}`, s]));
  const activity = source.activity ?? [];
  const sortedMonths = activity.map((a) => a.month).sort();
  const latest = sortedMonths[sortedMonths.length - 1];

  const services: CitizenCatalogItem[] = items.map((item) => {
    const s = byId.get(item.serviceId)!;
    const sup = suppliers.get(`${s.authority}|${s.supplierCode}`);
    return {
      ...item,
      demand: demandBand(s, activity, seed.settings, latest),
      supplierScore: sup ? (supplierScore(sup, seed.settings)?.score ?? null) : null,
    };
  });

  const catalog = citizenCatalogSchema.parse({
    schema: "citizen_catalog_v1",
    authority: neighborhood.authority,
    neighborhood,
    seedVersion: seed.meta.version,
    generatedAt: now.toISOString(),
    services,
  });
  const forbidden = findForbiddenKeys(catalog.services, EXPORT_FORBIDDEN_KEYS);
  if (forbidden.length) throw new Error(`בקטלוג לאזרח יש שדות אסורים: ${forbidden.join(", ")}`);
  return { catalog, skipped };
}

export function buildCitizenCatalogIndex(neighborhoods: readonly Neighborhood[], seed: Seed, now = new Date()): CitizenCatalogIndex {
  return citizenCatalogIndexSchema.parse({
    schema: "citizen_catalog_index_v1",
    generatedAt: now.toISOString(),
    seedVersion: seed.meta.version,
    entries: neighborhoods.map((n) => ({ authority: n.authority, neighborhoodId: n.id, neighborhoodName: n.name, community: n.community })),
  });
}
