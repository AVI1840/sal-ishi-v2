/**
 * matchingEngine.ts
 * ─────────────────
 * אלגוריתם התאמה 5 שכבות — Sal Ishi
 * מבוסס נתוני פיילוט פסגת זאב (286 אזרחים)
 *
 * INPUT:  CitizenProfile + ServiceCatalog
 * OUTPUT: Scored + ranked services with explanations
 *
 * LAYERS (משקלות מאומתות מהשדה):
 *   L1: Prevention (30%) — מניעת הידרדרות תפקודית
 *   L2: Motivation (25%) — רצונות ומוטיבציות אישיות
 *   L3: Profile fit (20%) — ניידות, שפה, מגזר
 *   L4: Proximity (10%) — שכונה, הסעות, שעות
 *   L5: Social proof (15%) — דירוגי עמיתים ורמת אמון
 */

import type { PersonalProfile, Motivation } from "@/data/types";
import { serviceCatalog, type CatalogService, type ServiceDimensions } from "@/data/serviceCatalog";

// ─── Types ──────────────────────────────────────────────────────

export interface MatchResult {
  service: CatalogService;
  totalScore: number;        // 0-100
  layers: LayerScores;
  explanations: string[];    // human-readable reasons
  pilotGoalsServed: number[];
  isTopMatch: boolean;
}

export interface LayerScores {
  prevention: number;    // 0-100
  motivation: number;    // 0-100
  profileFit: number;    // 0-100
  proximity: number;     // 0-100
  socialProof: number;   // 0-100
}

export interface MatchConfig {
  weights?: {
    prevention?: number;
    motivation?: number;
    profileFit?: number;
    proximity?: number;
    socialProof?: number;
  };
  topN?: number;
  minScore?: number;
}

// ─── Default weights ────────────────────────────────────────────

// משקלות מאומתות מנתוני פיילוט — סך 1.00
const DEFAULT_WEIGHTS = {
  prevention: 0.30,   // מניעת הידרדרות (הורד מ-40% → ממצאי שדה)
  motivation: 0.25,   // מוטיבציות ורצון אישי
  profileFit: 0.20,   // התאמת פרופיל: ניידות, שפה, מגזר
  proximity: 0.10,    // זמינות גיאוגרפית + הסעות
  socialProof: 0.15,  // המלצות עמיתים ואמינות (עלה מ-5% → מניע עיקרי)
};

// ─── Motivation → subcategory mapping ───────────────────────────

const MOTIVATION_KEYWORDS: Record<Motivation, string[]> = {
  health:        ["בריאות", "התעמלות", "פיזיו", "שחייה", "הידרו", "כושר", "נפילות", "שיקום", "תזונה"],
  belonging:     ["מועדון", "חברתי", "קהילתי", "מפגש", "שירה", "מקהלה", "חוג"],
  independence:  ["עצמאות", "ציוד", "תפקוד", "ריפוי בעיסוק", "בית", "הליכון"],
  meaning:       ["התנדבות", "העצמה", "סיפור חיים", "זיכרון", "תורה", "לימוד"],
  self_efficacy: ["סדנה", "אימון", "מוח", "קוגניטיב"],
  family:        ["משפחה", "מטפל", "תמיכה", "בני משפחה"],
  recognition:   ["התנדבות", "העצמה", "הוקרה"],
  curiosity:     ["דיגיטל", "מחשב", "סמארטפון", "טכנולוגיה", "אינטרנט"],
  comfort:       ["בית", "ביתי", "מרחוק", "ביקור בית"],
  growth:        ["סדנה", "חוג", "לימוד", "ציור", "אמנות", "יצירה"],
};

// ─── Layer 1: Prevention (40%) ──────────────────────────────────

function scorePrevention(citizen: PersonalProfile, service: CatalogService): { score: number; reasons: string[] } {
  const dims = service.dimensions;
  const reasons: string[] = [];
  let score = 0;

  // Base from catalog match_score
  score += (service.match_score / 100) * 30;

  // Functional fit × citizen risk
  const riskMultiplier = citizen.riskLevel === "critical" ? 2.0 : citizen.riskLevel === "high" ? 1.5 : citizen.riskLevel === "medium" ? 1.2 : 1.0;
  score += dims.functional_fit * 4 * riskMultiplier;

  // Urgency fit
  if (citizen.riskLevel === "critical" || citizen.riskLevel === "high") {
    score += dims.urgency_fit * 6;
    if (dims.urgency_fit >= 4) reasons.push("מענה ישיר לרמת הסיכון שלך");
  }

  // Specific risk signals
  if (citizen.loneliness >= 4 && dims.emotional_fit >= 4) {
    score += 15;
    reasons.push("ממתן בדידות — מזוהה כגורם סיכון");
  }
  if (citizen.activityLevel <= 2 && dims.functional_fit >= 4) {
    score += 10;
    reasons.push("מונע ירידה תפקודית");
  }

  if (reasons.length === 0 && score > 40) reasons.push("תומך בשמירה על תפקוד");

  return { score: Math.min(100, Math.round(score)), reasons };
}

// ─── Layer 2: Motivation (25%) ──────────────────────────────────

function scoreMotivation(citizen: PersonalProfile, service: CatalogService): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const text = `${service.name} ${service.subcategory} ${service.notes}`.toLowerCase();

  for (const mot of citizen.motivations) {
    const keywords = MOTIVATION_KEYWORDS[mot] || [];
    const hit = keywords.some(kw => text.includes(kw));
    if (hit) {
      score += 25;
      reasons.push(`מתאים למוטיבציה: ${MOTIVATION_LABELS_LOCAL[mot]}`);
    }
  }

  // Interests match
  for (const interest of citizen.interests) {
    if (text.includes(interest.toLowerCase())) {
      score += 10;
      reasons.push(`מתאים לתחום עניין: ${interest}`);
      break;
    }
  }

  // Dream match
  if (citizen.dream && text.includes(citizen.dream.split(" ").slice(0, 2).join(" ").toLowerCase())) {
    score += 20;
    reasons.push("קשור לחלום האישי שלך");
  }

  if (reasons.length === 0) score = 20; // baseline

  return { score: Math.min(100, Math.round(score)), reasons };
}

// ─── Layer 3: Profile Fit (20%) ─────────────────────────────────

function scoreProfileFit(citizen: PersonalProfile, service: CatalogService): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50; // baseline

  // Mobility match
  const mobilityLevel = citizen.independence;
  const serviceMobility = service.target_mobility;
  if (serviceMobility === "any") {
    score += 10;
  } else if (serviceMobility === "independent" && mobilityLevel >= 4) {
    score += 20;
    reasons.push("מתאים לרמת העצמאות שלך");
  } else if (serviceMobility === "frail" && mobilityLevel <= 2) {
    score += 20;
    reasons.push("מותאם למצב תפקודי");
  } else if (serviceMobility === "homebound" && mobilityLevel <= 1) {
    score += 25;
    reasons.push("שירות ביתי — ללא צורך ביציאה");
  } else if (serviceMobility === "frail-light" && mobilityLevel <= 3) {
    score += 15;
  } else {
    score -= 10;
  }

  // Language match
  const citizenLang = citizen.language.toLowerCase();
  const langMap: Record<string, string> = { "עברית": "hebrew", "ערבית": "arabic", "רוסית": "russian", "אנגלית": "english" };
  const citizenLangCode = langMap[citizenLang] || "hebrew";
  if (service.languages.includes(citizenLangCode)) {
    score += 15;
    if (citizenLangCode !== "hebrew") reasons.push(`זמין בשפה שלך (${citizenLang})`);
  } else {
    score -= 15;
    reasons.push("שפה לא ודאית — לבדוק");
  }

  // Age match
  if (service.target_age.includes("60+") || service.target_age.includes("65+")) {
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

// ─── Layer 4: Proximity (10%) ───────────────────────────────────

const ADJACENT_NEIGHBORHOODS: Record<string, string[]> = {
  "פסגת זאב": ["נווה יעקב", "רמות"],
  "תלפיות מזרח": ["תלפיות", "קטמון", "גילה", "ארנונה"],
  "בית חנינא": ["ואדי ג'וז", "נווה יעקב"],
  "ואדי ג'וז": ["בית חנינא"],
  "נווה יעקב": ["פסגת זאב", "בית חנינא"],
  "עין כרם": ["גילה"],
  "רמות": ["פסגת זאב", "נווה יעקב"],
};

function scoreProximity(citizen: PersonalProfile, service: CatalogService): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 40; // baseline for city-wide

  const citizenNeighborhood = citizen.neighborhood;
  const serviceNeighborhood = service.neighborhood;

  if (serviceNeighborhood === citizenNeighborhood) {
    score = 100;
    reasons.push("בשכונה שלך");
  } else if (serviceNeighborhood === "עירוני") {
    score = 60;
    reasons.push("שירות עירוני");
  } else if (ADJACENT_NEIGHBORHOODS[citizenNeighborhood]?.includes(serviceNeighborhood)) {
    score = 75;
    reasons.push("שכונה סמוכה");
  }

  // Transport bonus
  if (service.accessibility.includes("transport")) {
    score = Math.min(100, score + 15);
    if (score < 90) reasons.push("כולל הסעות");
  }
  if (service.accessibility.includes("home_visit")) {
    score = 100;
    reasons.push("מגיע אליך הביתה");
  }
  if (service.accessibility.includes("remote")) {
    score = 95;
    reasons.push("זמין מרחוק");
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

// ─── Layer 5: Social Proof (5%) ─────────────────────────────────

function scoreSocialProof(service: CatalogService): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50; // baseline — no ratings yet

  // Certainty as proxy for now
  if (service.certainty === "high") {
    score = 80;
    reasons.push("מאומת במלואו");
  } else if (service.certainty === "medium") {
    score = 60;
  }

  // match_score from original research
  if (service.match_score >= 80) score = Math.max(score, 85);

  return { score: Math.min(100, Math.round(score)), reasons };
}

// ─── Main matching function ─────────────────────────────────────

const MOTIVATION_LABELS_LOCAL: Record<string, string> = {
  health: "בריאות", belonging: "שייכות", independence: "עצמאות",
  meaning: "משמעות", self_efficacy: "מסוגלות", family: "משפחה",
  recognition: "הכרה", curiosity: "סקרנות", comfort: "נוחות", growth: "התפתחות",
};

export function matchServicesForCitizen(
  citizen: PersonalProfile,
  config: MatchConfig = {}
): MatchResult[] {
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const topN = config.topN ?? 10;
  const minScore = config.minScore ?? 20;

  const results: MatchResult[] = serviceCatalog.map((service) => {
    const l1 = scorePrevention(citizen, service);
    const l2 = scoreMotivation(citizen, service);
    const l3 = scoreProfileFit(citizen, service);
    const l4 = scoreProximity(citizen, service);
    const l5 = scoreSocialProof(service);

    const layers: LayerScores = {
      prevention: l1.score,
      motivation: l2.score,
      profileFit: l3.score,
      proximity: l4.score,
      socialProof: l5.score,
    };

    const totalScore = Math.round(
      layers.prevention * weights.prevention +
      layers.motivation * weights.motivation +
      layers.profileFit * weights.profileFit +
      layers.proximity * weights.proximity +
      layers.socialProof * weights.socialProof
    );

    const explanations = [
      ...l1.reasons.slice(0, 2),
      ...l2.reasons.slice(0, 2),
      ...l3.reasons.slice(0, 1),
      ...l4.reasons.slice(0, 1),
    ].filter(Boolean);

    return {
      service,
      totalScore: Math.min(100, totalScore),
      layers,
      explanations,
      pilotGoalsServed: service.pilotGoalsServed,
      isTopMatch: false,
    };
  });

  // Sort and mark top
  const sorted = results
    .filter(r => r.totalScore >= minScore)
    .sort((a, b) => b.totalScore - a.totalScore);

  // Mark top 3 as "top match"
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    sorted[i].isTopMatch = true;
  }

  return sorted.slice(0, topN);
}

/**
 * Quick utility: get top N services for a citizen with explanations
 */
export function getTopRecommendations(citizen: PersonalProfile, n = 5): MatchResult[] {
  return matchServicesForCitizen(citizen, { topN: n });
}

/**
 * Get category breakdown for citizen
 */
export function getCategoryBreakdown(citizen: PersonalProfile): Record<string, number> {
  const all = matchServicesForCitizen(citizen, { topN: 102, minScore: 0 });
  const byCategory: Record<string, number> = {};
  for (const r of all.slice(0, 20)) { // top 20
    const cat = r.service.categoryLabel;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  return byCategory;
}
