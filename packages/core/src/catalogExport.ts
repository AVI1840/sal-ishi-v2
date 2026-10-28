// catalog_export לאינטגרטור והקטלוג שמתפרסם לאזרח, לפי export_contract.
// נכנסים רק שירותים מאושרים. ספק עובר כקוד וסוג בלבד, בלי שם ובלי פרטי קשר,
// גם כשפרטי הספק עוברים למטה. אין נתוני תושבים ואין פעילות גולמית.

import {
  catalogExportSchema,
  citizenCatalogSchema,
  type CatalogExport,
  type CatalogItem,
  type CitizenCatalog,
  type Neighborhood,
  type Service,
  type Supplier,
} from "./model";
import { contentHash } from "./hash";
import { EXPORT_FORBIDDEN_KEYS, findForbiddenKeys } from "./privacy";
import { isPublishable } from "./rules/publish";
import type { Seed } from "./seed";
import { seedIndex } from "./seed";
import { copayRate } from "./settings";

export interface SkippedService {
  serviceId: string;
  reason: string;
}

interface CatalogSource {
  neighborhoods: readonly Neighborhood[];
  suppliers: readonly Supplier[];
  services: readonly Service[];
}

function toCatalogItems(source: CatalogSource, seed: Seed): { items: CatalogItem[]; skipped: SkippedService[] } {
  const { categories, serviceTypes } = seedIndex(seed);
  const neighborhoods = new Map(source.neighborhoods.map((n) => [n.id, n]));
  const suppliers = new Map(source.suppliers.map((s) => [`${s.authority}|${s.code}`, s]));
  const items: CatalogItem[] = [];
  const skipped: SkippedService[] = [];

  for (const s of source.services) {
    if (!isPublishable(s, seed.settings)) continue;
    const neighborhood = neighborhoods.get(s.neighborhoodId);
    const supplier = suppliers.get(`${s.authority}|${s.supplierCode}`);
    const category = categories.get(s.categoryCode);
    const type = serviceTypes.get(s.serviceTypeId);
    const pricePoints =
      s.pricePoints ?? (s.unitPrice !== undefined ? s.unitPrice * seed.settings.points_per_shekel : undefined);

    const problem = !neighborhood
      ? "שכונה לא מוכרת"
      : !supplier
        ? "ספק לא מוכר"
        : !category || !type
          ? "קטגוריה או סוג שירות לא מוכרים"
          : pricePoints === undefined
            ? "אין מחיר בנקודות"
            : null;
    if (problem || !neighborhood || !supplier || !category || !type || pricePoints === undefined) {
      skipped.push({ serviceId: s.id, reason: problem ?? "נתונים חסרים" });
      continue;
    }

    items.push({
      serviceId: s.id,
      authority: s.authority,
      neighborhoodId: s.neighborhoodId,
      neighborhoodName: neighborhood.name,
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

/** הקטלוג המאושר של שכונה אחת, כפי שהכלי לאזרח קורא אותו. */
export function buildCitizenCatalog(
  source: CatalogSource,
  neighborhoodId: string,
  seed: Seed,
  now = new Date(),
): { catalog: CitizenCatalog; skipped: SkippedService[] } {
  const neighborhood = source.neighborhoods.find((n) => n.id === neighborhoodId);
  if (!neighborhood) throw new Error(`שכונה ${neighborhoodId} לא נמצאה`);
  const { items, skipped } = toCatalogItems(
    { ...source, services: source.services.filter((s) => s.neighborhoodId === neighborhoodId) },
    seed,
  );
  const catalog = citizenCatalogSchema.parse({
    schema: "citizen_catalog_v1",
    authority: neighborhood.authority,
    neighborhood,
    seedVersion: seed.meta.version,
    generatedAt: now.toISOString(),
    services: items,
  });
  const forbidden = findForbiddenKeys(catalog.services, EXPORT_FORBIDDEN_KEYS);
  if (forbidden.length) throw new Error(`בקטלוג לאזרח יש שדות אסורים: ${forbidden.join(", ")}`);
  return { catalog, skipped };
}
