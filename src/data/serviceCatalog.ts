/**
 * serviceCatalog.ts
 * ─────────────────
 * מקור אמת למערכת — 102 שירותים עם מימדי התאמה (dimensions)
 * לשימוש ע"י אלגוריתם ההתאמה (matchingEngine.ts)
 *
 * כל שירות כולל:
 * - category (1-5)
 * - dimensions: functional_fit, emotional_fit, social_fit, accessibility_fit, urgency_fit (1-5)
 * - target_mobility, languages, sector
 *
 * ה-dimensions מיוצרים אוטומטית מנתוני ה-JSON + enrichment rules
 */

import catalog from "./services-research/services-catalog.json";
import type { RealService } from "./realServices";

// ─── Dimension Types ────────────────────────────────────────────

export interface ServiceDimensions {
  /** 1-5: How well does this service prevent functional decline? */
  functional_fit: number;
  /** 1-5: Does it address loneliness, meaning, belonging? */
  emotional_fit: number;
  /** 1-5: Involves group activity / community? */
  social_fit: number;
  /** 1-5: How accessible? (transport, location, hours, remote) */
  accessibility_fit: number;
  /** 1-5: Priority for at-risk individuals */
  urgency_fit: number;
}

export interface CatalogService {
  id: string;
  name: string;
  provider: string;
  category: 1 | 2 | 3 | 4 | 5;
  subcategory: string;
  neighborhood: string;
  address: string;
  days: string;
  hours: string;
  cost: "free" | "subsidized" | "paid";
  cost_note: string;
  target_age: string;
  target_mobility: string;
  languages: string[];
  phone: string;
  website: string;
  match_score: number;
  certainty: string;
  accessibility: string[];
  notes: string;
  // Optional service image (path under /public)
  image?: string;
  // Computed dimensions
  dimensions: ServiceDimensions;
  sector: "secular" | "arab" | "haredi" | "mixed";
  categoryLabel: string;
  pilotGoalsServed: number[]; // G1-G5
}

// ─── Dimension generation rules ─────────────────────────────────

function inferDimensions(raw: Record<string, unknown>): ServiceDimensions {
  const cat = raw.category as number;
  const mobility = raw.target_mobility as string;
  const accessibility = (raw.accessibility as string[]) || [];
  const subcategory = (raw.subcategory as string) || "";
  const notes = (raw.notes as string) || "";
  const cost = raw.cost as string;

  // Base by category
  let functional_fit = cat === 2 ? 4 : cat === 5 ? 3 : 2;
  let emotional_fit = cat === 1 ? 4 : cat === 3 ? 3 : 2;
  let social_fit = cat === 1 ? 5 : cat === 2 ? 3 : 2;
  let accessibility_fit = 3;
  let urgency_fit = 2;

  // Mobility adjustments
  if (mobility === "homebound") { accessibility_fit = 5; urgency_fit += 1; }
  if (mobility === "frail") { urgency_fit += 2; }
  if (mobility === "frail-light") { urgency_fit += 1; }

  // Accessibility features
  if (accessibility.includes("transport")) accessibility_fit += 1;
  if (accessibility.includes("wheelchair")) accessibility_fit += 1;
  if (accessibility.includes("home_visit")) { accessibility_fit = 5; urgency_fit += 1; }
  if (accessibility.includes("remote")) { accessibility_fit = 5; }
  if (accessibility.includes("emergency_button")) urgency_fit = 5;

  // Subcategory signals
  if (/דמנציה|קוגנ/.test(subcategory + notes)) { functional_fit = 5; urgency_fit = 5; }
  if (/בדידות|חברת|מועדון/.test(subcategory + notes)) { emotional_fit = 5; social_fit = 5; }
  if (/נפיל|שיקום|פיזיו/.test(subcategory + notes)) { functional_fit = 5; urgency_fit = 4; }
  if (/לחצן|חירום/.test(subcategory + notes)) { urgency_fit = 5; accessibility_fit = 5; }
  if (/מיצוי זכויות/.test(subcategory)) { emotional_fit += 1; }
  if (/התנדבות|העצמה/.test(subcategory)) { emotional_fit = 5; }
  if (/דיגיטל|מחשב|סמארטפון/.test(subcategory + notes)) { accessibility_fit += 1; }
  if (/ארוחה|ארוחות/.test(notes)) { social_fit += 1; urgency_fit += 1; }

  // Cost
  if (cost === "free") accessibility_fit = Math.min(5, accessibility_fit + 1);

  // Clamp all to 1-5
  const clamp = (v: number) => Math.max(1, Math.min(5, v));
  return {
    functional_fit: clamp(functional_fit),
    emotional_fit: clamp(emotional_fit),
    social_fit: clamp(social_fit),
    accessibility_fit: clamp(accessibility_fit),
    urgency_fit: clamp(urgency_fit),
  };
}

function inferSector(raw: Record<string, unknown>): "secular" | "arab" | "haredi" | "mixed" {
  const neighborhood = (raw.neighborhood as string) || "";
  const languages = (raw.languages as string[]) || [];
  const notes = (raw.notes as string) || "";

  if (/בית חנינא|ואדי ג'וז/.test(neighborhood)) return "arab";
  if (/נווה יעקב|בוכרים|בית וגן|חרדי/.test(neighborhood + notes)) return "haredi";
  if (languages.includes("arabic") && !languages.includes("hebrew")) return "arab";
  if (languages.includes("yiddish")) return "haredi";
  if (/עירוני/.test(neighborhood)) return "mixed";
  return "secular";
}

function inferPilotGoals(dims: ServiceDimensions, cat: number): number[] {
  const goals: number[] = [];
  if (dims.functional_fit >= 4 || cat === 2) goals.push(1); // G1: decline prevention
  if (dims.emotional_fit >= 4 || cat === 1) goals.push(2);  // G2: belonging
  if (dims.urgency_fit >= 4) goals.push(3);                  // G3: hospitalization
  if (dims.social_fit >= 4) goals.push(4);                   // G4: social engagement
  if (dims.accessibility_fit >= 4) goals.push(5);            // G5: satisfaction/access
  return goals;
}

const CATEGORY_LABELS: Record<number, string> = {
  1: "שייכות ומשמעות",
  2: "בריאות ותפקוד",
  3: "חוסן אישי וכלכלי",
  4: "נגישות דיגיטלית",
  5: "מוצרים מסייעים",
};

// ─── Build catalog ──────────────────────────────────────────────

export const serviceCatalog: CatalogService[] = (catalog as Record<string, unknown>[]).map((raw) => {
  const dimensions = inferDimensions(raw);
  const sector = inferSector(raw);
  const cat = raw.category as number;
  const pilotGoalsServed = inferPilotGoals(dimensions, cat);

  return {
    ...raw,
    dimensions,
    sector,
    categoryLabel: CATEGORY_LABELS[cat] ?? "כללי",
    pilotGoalsServed,
  } as CatalogService;
});

// ─── Stats & utilities ──────────────────────────────────────────

export const catalogAnalytics = {
  total: serviceCatalog.length,
  bySector: {
    secular: serviceCatalog.filter(s => s.sector === "secular").length,
    arab: serviceCatalog.filter(s => s.sector === "arab").length,
    haredi: serviceCatalog.filter(s => s.sector === "haredi").length,
    mixed: serviceCatalog.filter(s => s.sector === "mixed").length,
  },
  byCategory: Object.fromEntries(
    [1,2,3,4,5].map(c => [CATEGORY_LABELS[c], serviceCatalog.filter(s => s.category === c).length])
  ),
  avgDimensions: (() => {
    const sum = { functional_fit: 0, emotional_fit: 0, social_fit: 0, accessibility_fit: 0, urgency_fit: 0 };
    for (const s of serviceCatalog) {
      sum.functional_fit += s.dimensions.functional_fit;
      sum.emotional_fit += s.dimensions.emotional_fit;
      sum.social_fit += s.dimensions.social_fit;
      sum.accessibility_fit += s.dimensions.accessibility_fit;
      sum.urgency_fit += s.dimensions.urgency_fit;
    }
    const n = serviceCatalog.length || 1;
    return {
      functional_fit: +(sum.functional_fit / n).toFixed(1),
      emotional_fit: +(sum.emotional_fit / n).toFixed(1),
      social_fit: +(sum.social_fit / n).toFixed(1),
      accessibility_fit: +(sum.accessibility_fit / n).toFixed(1),
      urgency_fit: +(sum.urgency_fit / n).toFixed(1),
    };
  })(),
  pilotGoalsCoverage: [1,2,3,4,5].map(g => ({
    goal: g,
    count: serviceCatalog.filter(s => s.pilotGoalsServed.includes(g)).length,
  })),
};

/** Get services by sector */
export const getBySector = (sector: string) =>
  serviceCatalog.filter(s => s.sector === sector);

/** Get services matching specific dimension threshold */
export const getByDimension = (dim: keyof ServiceDimensions, minScore: number) =>
  serviceCatalog.filter(s => s.dimensions[dim] >= minScore);
