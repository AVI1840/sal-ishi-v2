/**
 * realServices.ts
 * ───────────────
 * ממיר את services-catalog.json (102 שירותים אמיתיים)
 * לפורמט שהאפליקציה משתמשת בו (Service מ-types.ts + ServiceB מ-services.ts).
 *
 * שימוש:
 *   import { realServices, getByNeighborhood, searchServices } from "@/data/realServices";
 */

import catalog from "./services-research/services-catalog.json";

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
export const realServices: RealService[] = (catalog as any[]).map((raw) => {
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
    emoji: CATEGORY_EMOJI[raw.category as number] ?? "📋",
  } as RealService;
});

// ─── שכונות ────────────────────────────────────────────────────

export const NEIGHBORHOODS_LIST = [
  "הכל",
  "פסגת זאב",
  "תלפיות מזרח",
  "בית חנינא",
  "ואדי ג'וז",
  "נווה יעקב",
  "עין כרם",
  "עירוני",
  "רמות",
  "גילה",
  "קטמון",
  "תלפיות",
];

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
  return realServices.filter((s) => s.neighborhood === neighborhood);
}

/** סינון לפי קטגוריה */
export function getByCategory(category: number): RealService[] {
  if (category === 0) return realServices;
  return realServices.filter((s) => s.category === category);
}

/** חיפוש חופשי */
export function searchServices(query: string): RealService[] {
  const q = query.toLowerCase().trim();
  if (!q) return realServices;
  return realServices.filter(
    (s) =>
      s.name.includes(q) ||
      s.provider.includes(q) ||
      s.subcategory.includes(q) ||
      s.neighborhood.includes(q) ||
      s.notes.includes(q)
  );
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
    result = result.filter((s) => s.neighborhood === params.neighborhood);
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
  if (params.query) {
    const q = params.query.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.name.includes(q) ||
        s.provider.includes(q) ||
        s.subcategory.includes(q) ||
        s.neighborhood.includes(q)
    );
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

export const catalogStats = {
  total: realServices.length,
  byNeighborhood: Object.fromEntries(
    NEIGHBORHOODS_LIST.filter((n) => n !== "הכל").map((n) => [
      n,
      realServices.filter((s) => s.neighborhood === n).length,
    ])
  ),
  byCategory: Object.fromEntries(
    [1, 2, 3, 4, 5].map((c) => [
      CATEGORY_LABELS[c],
      realServices.filter((s) => s.category === c).length,
    ])
  ),
  free: realServices.filter((s) => s.cost === "free").length,
  subsidized: realServices.filter((s) => s.cost === "subsidized").length,
  paid: realServices.filter((s) => s.cost === "paid").length,
};
