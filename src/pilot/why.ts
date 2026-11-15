/**
 * "למה זה מתאים לי" (תוספת 3): משפט אחד מהשכבות שתרמו הכי הרבה להמלצה,
 * לפי המשקלות שבהגדרות. בעברית פשוטה, בלי ציונים ובלי מונחי מערכת.
 */

import { getActiveWeights, type MatchResult } from "@/domain/matchingEngine";

type Layer = keyof MatchResult["layers"];

export const DOMAIN_PREVENTION: Record<string, string> = {
  belonging: "מפגש עם אנשים שומר על מצב הרוח והבריאות",
  health_function: "שומר על הגוף חזק ומונע נפילות",
  resilience: "תמיכה שעוזרת בתקופה לא פשוטה",
  digital: "עוזר להסתדר לבד עם הטלפון",
  prevention_products: "בטיחות בבית",
};

function phrase(layer: Layer, result: MatchResult, domain: string | undefined): string | null {
  switch (layer) {
    case "prevention":
      return domain ? DOMAIN_PREVENTION[domain] ?? null : "שומר על הבריאות והתפקוד";
    case "motivation":
      return "מתאים למה שאמרת שחשוב לך";
    case "profileFit":
      return result.explanations.includes("מתאים ליכולות שלך") ? "מתאים ליכולות שלך" : "מתאים לך";
    case "proximity":
      return result.explanations.includes("נכנס בסל של החודש") ? "קרוב, ונכנס בסל של החודש" : "קרוב אלייך";
    case "socialProof":
      return null;
  }
}

/** השכבות לפי תרומה: ציון השכבה כפול המשקל שלה בהגדרות. */
export function contributions(result: MatchResult): { layer: Layer; value: number }[] {
  const w = getActiveWeights();
  return (Object.keys(result.layers) as Layer[])
    .map((layer) => ({ layer, value: result.layers[layer] * (w[layer] ?? 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function whySentence(result: MatchResult, domain?: string): string {
  const parts = contributions(result)
    .map((c) => phrase(c.layer, result, domain))
    .filter((x): x is string => Boolean(x))
    .filter((x, i, all) => all.indexOf(x) === i)
    .slice(0, 2);
  if (parts.length === 0) return "שירות שמתאים לשכונה שלך";
  return parts.length === 1 ? parts[0]! : `${parts[0]}, ו${parts[1]}`;
}
