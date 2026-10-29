/**
 * catalogSource.ts
 * מקור השירותים של הכלי המרכזי: הקטלוג המאושר שהמטה מפרסם מהאטלס.
 *
 * בעלייה: מנסים לקרוא catalog/index.json ואת הקטלוג של כל שכונה (SyncAdapter).
 * אם לא פורסם קטלוג, משתמשים בקטלוג הדגמה סינתטי שנבנה מאותה ליבה. כך אין
 * באתר הציבורי נתוני ספקים אמיתיים.
 *
 * כל פריט בקטלוג מומר לצורה שמנוע ההתאמה הקיים מכיר, וכל שכבה במנוע מקבלת
 * את הנתון המתאים מהאטלס (ראו MATCHING_LAYER_SOURCES).
 */

import {
  FileSyncAdapter,
  buildCitizenCatalog,
  buildDemoAuthority,
  buildDemoNationalChannel,
  createBrowserFileIO,
  defaultSeed,
  upgradeSeed,
  seedIndex,
  type CitizenCatalog,
  type CitizenCatalogItem,
  type Seed,
} from "@sal-ishi/core/citizen";
import { configureMatching } from "@/domain/matchingEngine";
import { setRawServices } from "./realServices";
import { setServiceCatalogRaw } from "./serviceCatalog";

export type CatalogOrigin = "published" | "demo";

export const catalogState: { seed: Seed; origin: CatalogOrigin; neighborhoods: number; services: number } = {
  seed: defaultSeed,
  origin: "demo",
  neighborhoods: 0,
  services: 0,
};

/** מאיפה כל שכבה במנוע ההתאמה מקבלת את הנתונים שלה מהאטלס. מוצג במסכים. */
export const MATCHING_LAYER_SOURCES = [
  { key: "prevention", label: "מניעת הידרדרות", source: "קטגוריה וסוג שירות מהספרייה (למשל שיווי משקל, גירוי קוגניטיבי)" },
  { key: "motivation", label: "רצון ומוטיבציה", source: "תחום הליבה של השירות מול המוטיבציות של האדם" },
  { key: "profileFit", label: "התאמה לפרופיל", source: "שפות, התאמה קהילתית (כללי, חרדי, ערבי) ואופן מסירה (בבית, מרחוק)" },
  { key: "socialProof", label: "המלצות וניסיון", source: "ביקוש בפועל בשכונה (מצטבר) ודירוג הספק" },
  { key: "proximity", label: "זמינות מעשית", source: "שכונה, היקף השירות (רשותי, אזורי, ארצי) והשתתפות עצמית" },
] as const;

const LANGUAGE_CODES: Record<string, string> = {
  עברית: "hebrew",
  ערבית: "arabic",
  יידיש: "yiddish",
  רוסית: "russian",
  אמהרית: "amharic",
  אנגלית: "english",
  צרפתית: "french",
};

/** חמש הקטגוריות של הכלי הקיים, מתוך קוד הקטגוריה בקטלוג. */
function legacyCategory(code: string): 1 | 2 | 3 | 4 | 5 {
  if (code.startsWith("1.")) return 1;
  if (code.startsWith("2.") || code === "5.3" || code === "5.4") return 2;
  if (code.startsWith("3.") || code === "5.5") return 3;
  if (code.startsWith("4.")) return 4;
  if (code === "5.1" || code === "5.2") return 1;
  return 5;
}

/**
 * שכבת "המלצות וניסיון": במקום דירוג מומצא, ביקוש בפועל בשכונה ודירוג הספק.
 * 50 בסיס, ביקוש גבוה מוסיף 30, בינוני 15, נמוך 5, וכל נקודת דירוג מעל 3 מוסיפה 10.
 */
export function socialProofScore(item: Pick<CitizenCatalogItem, "demand" | "supplierScore">): number {
  let score = 50;
  if (item.demand === "high") score += 30;
  else if (item.demand === "medium") score += 15;
  else if (item.demand === "low") score += 5;
  if (item.supplierScore !== null) score += (item.supplierScore - 3) * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** ממיר את הקטלוגים לצורה הישנה, פריט אחד לכל שירות, עם השכונות שהוא זמין בהן. */
export function toRawServices(catalogs: CitizenCatalog[], seed: Seed): Record<string, unknown>[] {
  const { serviceTypes, coreCategoryByCode, supplierTypes } = seedIndex(seed);
  const byId = new Map<string, Record<string, unknown> & { servesNeighborhoods: string[] }>();

  for (const catalog of catalogs) {
    for (const item of catalog.services) {
      const existing = byId.get(item.serviceId);
      const here = catalog.neighborhood.name;
      if (existing) {
        if (item.reach !== "national" && existing.neighborhood !== here && !existing.servesNeighborhoods.includes(here)) {
          existing.servesNeighborhoods.push(here);
        }
        continue;
      }
      const type = serviceTypes.get(item.serviceTypeId);
      const core = coreCategoryByCode.get(item.categoryCode);
      const rate = item.copayRate;
      const home = item.reach === "national" ? "ארצי" : item.neighborhoodName;
      byId.set(item.serviceId, {
        id: item.serviceId,
        name: item.name,
        provider: `${supplierTypes.get(item.supplierType)?.name ?? item.supplierType} (קוד ${item.supplierCode})`,
        category: legacyCategory(item.categoryCode),
        subcategory: item.categoryName,
        neighborhood: home,
        servesNeighborhoods: home === here || item.reach === "national" ? [] : [here],
        address: "",
        days: "",
        hours: "",
        cost: rate === 0 ? "free" : "subsidized",
        cost_note: `${item.pricePoints} נקודות ל${item.unit}${rate > 0 ? `, השתתפות עצמית ${Math.round(rate * 100)}%` : ", בלי השתתפות עצמית"}`,
        target_age: "65+",
        target_mobility: item.deliveryMode === "home" ? "homebound" : "any",
        languages: item.languages.map((l) => LANGUAGE_CODES[l] ?? l),
        phone: "",
        website: "",
        match_score: socialProofScore(item),
        certainty: "high",
        accessibility: item.deliveryMode === "home" ? ["home_visit"] : item.deliveryMode === "remote" ? ["remote"] : [],
        ratings: [],
        // שם סוג השירות וההערה מהספרייה מזינים את כללי המניעה במנוע (נפילות, קוגניטיבי, מועדון).
        notes: [item.serviceTypeName, type?.note].filter(Boolean).join(". "),
        reach: item.reach,
        demand: item.demand,
        supplierScore: item.supplierScore,
        copayRate: rate,
        pricePoints: item.pricePoints,
        unit: item.unit,
        serviceTypeId: item.serviceTypeId,
        serviceTypeName: item.serviceTypeName,
        categoryCode: item.categoryCode,
        coreCategoryId: core?.id,
        coreCategoryName: core?.name ?? "איכות חיים",
        deliveryMode: item.deliveryMode,
        communityFit: item.communityFit,
      });
    }
  }
  return [...byId.values()];
}

/** קטלוג ההדגמה: הוריאציה של האטלס שמתאימה לשכונות של אזרחי ההדגמה, ועוד הערוץ הארצי. */
export function buildDemoCatalogs(seed: Seed): CitizenCatalog[] {
  const data = buildDemoAuthority(2);
  const national = buildDemoNationalChannel();
  const source = { ...data, suppliers: [...data.suppliers, ...national.suppliers], services: [...data.services, ...national.services] };
  return data.neighborhoods.map((n) => buildCitizenCatalog(source, n.id, seed).catalog);
}

export function applyCatalogs(catalogs: CitizenCatalog[], seed: Seed, origin: CatalogOrigin): void {
  const raw = toRawServices(catalogs, seed);
  setRawServices(raw);
  setServiceCatalogRaw(raw);
  configureMatching({ weights: seed.settings.matching_weights });
  Object.assign(catalogState, { seed, origin, neighborhoods: catalogs.length, services: raw.length });
}

async function loadPublishedSeed(): Promise<Seed | null> {
  try {
    const res = await fetch("./catalog/seed.json", { cache: "no-store" });
    if (!res.ok) return null;
    return upgradeSeed(await res.json());
  } catch {
    return null;
  }
}

/** נקרא פעם אחת לפני הציור הראשון. אף פעם לא זורק: במקרה הגרוע עולה קטלוג ההדגמה. */
export async function initCatalog(): Promise<void> {
  const seed = (await loadPublishedSeed()) ?? defaultSeed;
  const catalogs: CitizenCatalog[] = [];
  try {
    const sync = new FileSyncAdapter(createBrowserFileIO("./"));
    const index = await sync.loadCitizenCatalogIndex();
    for (const entry of index?.entries ?? []) {
      const catalog = await sync.loadCitizenCatalog(entry.authority, entry.neighborhoodId);
      if (catalog) catalogs.push(catalog);
    }
  } catch (e) {
    // שרת שמחזיר את דף האפליקציה במקום 404, או קובץ פגום: עוברים להדגמה.
    console.warn("[catalog] קטלוג מפורסם לא נקרא, עוברים לקטלוג ההדגמה", e);
    catalogs.length = 0;
  }
  if (catalogs.length) applyCatalogs(catalogs, seed, "published");
  else applyCatalogs(buildDemoCatalogs(seed), seed, "demo");
}
