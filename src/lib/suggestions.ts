/**
 * הצעות לפי תחום: 2 עד 3 שירותים לכל תחום ליבה, עם הסבר קצר (מסמך הקטלוג, מפגש 2).
 * אין כאן אלגוריתם חדש: הדירוג הוא של מנוע ההתאמה הקיים, וכאן רק מחלקים אותו
 * לתחומים ומעדיפים תתי-קטגוריות שונות בתוך תחום, כדי שההצעה תהיה מגוונת.
 */

import type { PersonalProfile } from "@/data/types";
import { realServices, type RealService } from "@/data/realServices";
import { catalogState } from "@/data/catalogSource";
import { matchServicesForCitizen, type MatchResult } from "@/domain/matchingEngine";

export interface DomainSuggestion {
  domainId: string;
  domainName: string;
  items: { service: RealService; result: MatchResult }[];
}

export interface SelectionRules {
  minPerDomain: number;
  maxActive: number;
  changeMonths: number;
  perDomain: number;
  isProposal: boolean;
}

export function selectionRules(): SelectionRules {
  const s = catalogState.seed.settings;
  return {
    minPerDomain: s.selection_min_per_domain ?? 1,
    maxActive: s.selection_max_active ?? 8,
    changeMonths: s.selection_change_months ?? 1,
    perDomain: s.suggestions_per_domain ?? 3,
    isProposal: String((s as Record<string, unknown>).selection_status ?? "").startsWith("proposal"),
  };
}

export function suggestByDomain(citizen: PersonalProfile, neighborhood?: string): DomainSuggestion[] {
  const { perDomain } = selectionRules();
  const byId = new Map(realServices.map((s) => [s.id, s]));
  const ranked = matchServicesForCitizen(citizen, { topN: 500, minScore: 0 })
    .map((result) => ({ result, service: byId.get(result.service.id) }))
    .filter((x): x is { result: MatchResult; service: RealService } => Boolean(x.service))
    .filter(({ service }) => !neighborhood || service.neighborhood === neighborhood || service.reach === "national" || (service.servesNeighborhoods ?? []).includes(neighborhood));

  const domains = catalogState.seed.core_categories.map((c) => ({ id: c.id, name: c.name }));
  return domains
    .map((d) => {
      const inDomain = ranked.filter(({ service }) => service.coreCategoryId === d.id);
      // קודם הטוב ביותר מכל תת-קטגוריה, ואחר כך משלימים בסוגי שירות אחרים.
      // אותו סוג שירות לא מוצע פעמיים (למשל שני סבבים של אותה תוכנית).
      const picked: typeof inDomain = [];
      const categories = new Set<string>();
      const types = new Set<string>();
      const take = (x: (typeof inDomain)[number]) => {
        picked.push(x);
        categories.add(x.service.categoryCode ?? "");
        types.add(x.service.serviceTypeId ?? x.service.name);
      };
      for (const x of inDomain) {
        if (picked.length >= perDomain) break;
        if (!categories.has(x.service.categoryCode ?? "") && !types.has(x.service.serviceTypeId ?? x.service.name)) take(x);
      }
      for (const x of inDomain) {
        if (picked.length >= perDomain) break;
        if (!types.has(x.service.serviceTypeId ?? x.service.name)) take(x);
      }
      picked.sort((a, b) => b.result.totalScore - a.result.totalScore);
      return { domainId: d.id, domainName: d.name, items: picked };
    })
    .filter((d) => d.items.length > 0);
}

export const DEMAND_LABEL: Record<string, string> = { high: "ביקוש גבוה בשכונה", medium: "ביקוש בינוני", low: "ביקוש נמוך" };
export const REACH_LABEL: Record<string, string> = { authority: "בכל הרשות", regional: "אזורי", national: "ארצי" };
