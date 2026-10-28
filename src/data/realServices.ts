/**
 * realServices.ts
 * רשימת השירותים שהאפליקציה מציגה. מתמלאת בעלייה מהקטלוג המאושר של האטלס
 * (src/data/catalogSource.ts), ולא מקובץ קבוע. בבדיקות היא מתמלאת מהקטלוג
 * הישן כדי לשמור על בדיקות ה-golden של מנוע ההתאמה.
 *
 * שימוש:
 *   import { realServices, getByNeighborhood, searchServices } from "@/data/realServices";
 */

import { smartSearch } from "@sal-ishi/core/citizen";

// ─── טיפוסים ───────────────────────────────────────────────────

export type CostType = "free" | "subsidized" | "paid";
export type MobilityTarget = "independent" | "frail-light" | "frail" | "homebound" | "any";
export type Certainty = "high" | "medium" | "low";

export interface RealService {
  id: string;
  name: string;
  provider: string;
  /** 1=חברתי 2=בריאות/תפקוד 3=קהילה/תמיכה 4=דיגיטל 5=ציוד/בית */
  category: 1 | 2 | 3 | 4 | 5;
  subcategory: string;
  neighborhood: string;
  address: string;
  days: string;
  hours: string;
  cost: CostType;
  cost_note: string;
  target_age: string;
  target_mobility: MobilityTarget;
  languages: string[];
  phone: string;
  website: string;
  match_score: number;
  certainty: Certainty;
  accessibility: string[];
  ratings: number[];
  notes: string;
  // computed
  avgRating: number | null;
  categoryLabel: string;
  costLabel: string;
  emoji: string;
  image?: string;
  // מהאטלס (קיים כשהמקור הוא הקטלוג המאושר)
  reach?: "neighborhood" | "authority" | "regional" | "national";
  /** שכונות נוספות שהשירות זמין בהן (שירות רשותי, אזורי או ארצי). */
  servesNeighborhoods?: string[];
  demand?: "high" | "medium" | "low" | null;
  supplierScore?: number | null;
  copayRate?: number;
  pricePoints?: number;
  unit?: string;
  serviceTypeId?: string;
  serviceTypeName?: string;
  categoryCode?: string;
  coreCategoryId?: string;
  coreCategoryName?: string;
  deliveryMode?: "community" | "home" | "remote";
  communityFit?: ("general" | "haredi" | "arab")[];
}

// ─── maps ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<number, string> = {
  1: "חברתי ופנאי",
  2: "בריאות ותפקוד",
  3: "קהילה ותמיכה",
  4: "דיגיטל וטכנולוגיה",
  5: "ציוד ובית",
};

const CATEGORY_EMOJI: Record<number, string> = {
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
};

const COST_LABELS: Record<CostType, string> = {
  free: "חינם",
  subsidized: "מסובסד",
  paid: "בתשלום",
};

// ─── עיבוד הקטלוג ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRealService(raw: any): RealService {
  const ratings: number[] = Array.isArray(raw.ratings) ? raw.ratings : [];
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  return {
    ...raw,
    ratings,
    avgRating,
    categoryLabel: CATEGORY_LABELS[raw.category as number] ?? "כללי",
    costLabel: COST_LABELS[raw.cost as CostType] ?? raw.cost,
    emoji: CATEGORY_EMOJI[raw.category as number] ?? "",
  } as RealService;
}

/** הרשימה החיה. setRawServices מחליף את התוכן שלה. */
export const realServices: RealService[] = [];

// ─── שכונות ────────────────────────────────────────────────────

export const NEIGHBORHOODS_LIST: string[] = ["הכל"];

/** האם השירות זמין לתושבי השכונה: בה עצמה, משרת אותה, או ארצי. */
export function servesNeighborhood(s: RealService, neighborhood: string): boolean {
  return s.neighborhood === neighborhood || s.reach === "national" || (s.servesNeighborhoods ?? []).includes(neighborhood);
}

/** שדות החיפוש החכם, לפי משקל. */
function searchFields(s: RealService) {
  return [
    { text: s.name, weight: 3 },
    { text: (s.serviceTypeName ?? "") + " " + s.subcategory, weight: 2 },
    { text: (s.coreCategoryName ?? "") + " " + s.categoryLabel, weight: 1.5 },
    { text: s.notes + " " + s.provider + " " + s.neighborhood, weight: 1 },
  ];
}

/** חיפוש חכם: נרמול עברית, מילים נרדפות ושגיאות הקלדה. מחזיר מהמתאים ביותר. */
export function smartSearchServices(services: RealService[], query: string): RealService[] {
  return smartSearch(services, query, searchFields).map((h) => h.item);
}

export const CATEGORY_FILTERS = [
  { value: 0, label: "הכל" },
  { value: 1, label: "חברתי" },
  { value: 2, label: "בריאות" },
  { value: 3, label: "תמיכה" },
  { value: 4, label: "דיגיטל" },
  { value: 5, label: "ציוד/בית" },
];

export const COST_FILTERS: { value: CostType | "all"; label: string }[] = [
  { value: "all", label: "כל העלויות" },
  { value: "free", label: "חינם" },
  { value: "subsidized", label: "מסובסד" },
  { value: "paid", label: "בתשלום" },
];

// ─── פונקציות עזר ──────────────────────────────────────────────

/** סינון לפי שכונה */
export function getByNeighborhood(neighborhood: string): RealService[] {
  if (neighborhood === "הכל") return realServices;
  return realServices.filter((s) => servesNeighborhood(s, neighborhood));
}

/** סינון לפי קטגוריה */
export function getByCategory(category: number): RealService[] {
  if (category === 0) return realServices;
  return realServices.filter((s) => s.category === category);
}

/** חיפוש חופשי */
export function searchServices(query: string): RealService[] {
  return smartSearchServices(realServices, query);
}

/** סינון משולב */
export function filterServices(params: {
  neighborhood?: string;
  category?: number;
  cost?: CostType | "all";
  query?: string;
  mobility?: MobilityTarget | "all";
}): RealService[] {
  let result = realServices;

  if (params.neighborhood && params.neighborhood !== "הכל") {
    result = result.filter((s) => servesNeighborhood(s, params.neighborhood!));
  }
  if (params.category && params.category !== 0) {
    result = result.filter((s) => s.category === params.category);
  }
  if (params.cost && params.cost !== "all") {
    result = result.filter((s) => s.cost === params.cost);
  }
  if (params.mobility && params.mobility !== "all") {
    result = result.filter(
      (s) => s.target_mobility === params.mobility || s.target_mobility === "any"
    );
  }
  if (params.query && params.query.trim()) {
    result = smartSearchServices(result, params.query);
  }

  return result;
}

/** מיון לפי match_score */
export function sortByScore(services: RealService[]): RealService[] {
  return [...services].sort((a, b) => b.match_score - a.match_score);
}

/** שירותים מומלצים לפרופיל (לפי שכונה + ניידות) */
export function getRecommendedForProfile(params: {
  neighborhood: string;
  mobility: MobilityTarget;
  topN?: number;
}): RealService[] {
  const filtered = filterServices({
    neighborhood: params.neighborhood,
    mobility: params.mobility,
  });
  return sortByScore(filtered).slice(0, params.topN ?? 10);
}

// ─── סטטיסטיקות ────────────────────────────────────────────────

function computeStats() {
  return {
    total: realServices.length,
    byNeighborhood: Object.fromEntries(
      NEIGHBORHOODS_LIST.filter((n) => n !== "הכל").map((n) => [n, realServices.filter((s) => servesNeighborhood(s, n)).length])
    ),
    byCategory: Object.fromEntries(
      [1, 2, 3, 4, 5].map((c) => [CATEGORY_LABELS[c], realServices.filter((s) => s.category === c).length])
    ),
    free: realServices.filter((s) => s.cost === "free").length,
    subsidized: realServices.filter((s) => s.cost === "subsidized").length,
    paid: realServices.filter((s) => s.cost === "paid").length,
  };
}

export const catalogStats = computeStats();

/** מחליף את רשימת השירותים (בעלייה מהקטלוג המאושר, או בבדיקות). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setRawServices(raw: any[]): void {
  realServices.splice(0, realServices.length, ...raw.map(toRealService));
  const names = new Set<string>();
  for (const s of realServices) {
    if (s.reach !== "national") names.add(s.neighborhood);
    for (const n of s.servesNeighborhoods ?? []) names.add(n);
  }
  NEIGHBORHOODS_LIST.splice(1, NEIGHBORHOODS_LIST.length - 1, ...[...names].sort((a, b) => a.localeCompare(b, "he")));
  Object.assign(catalogStats, computeStats());
}
