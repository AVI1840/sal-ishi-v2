// סל משלים בלבד (הוכרע, תוספת 3): כשיש לשירות מממן אחר, הסל מממן רק את ההשלמה,
// ולא את מה שהמממן האחר משלם. על ההשלמה חלה מדרגת ההשתתפות הרגילה, ובמוצרים
// התקרה הרבעונית. מימון מלא של מממן אחר: ההשלמה 0, והשירות מוצג כהפניה עם
// משימת מיצוי למלווה.

import type { Service } from "../model";
import type { Seed } from "../seed";
import { copayRate, productsQuarterlyCapPoints } from "../settings";
import { isProduct } from "./terms";

export const OTHER_FUNDERS = ["סל בריאות", "משרד הבריאות", "גמלת סיעוד", "רווחה", "אחר", "אין"] as const;
export const OTHER_FUNDER_COVERAGE_KINDS = ["amount", "percent", "varies"] as const;

export type ComplementState =
  /** אין מממן אחר: הסל רגיל. */
  | "none"
  /** מממן אחר משלם חלק, הסל משלים. */
  | "partial"
  /** כמו partial, אבל קודם מגישים למממן האחר (משימת מיצוי למלווה). */
  | "prior_claim"
  /** המממן האחר משלם הכל: השלמה 0, הפניה בלבד. */
  | "full"
  /** הכיסוי משתנה לפי מקרה: ההשלמה נקבעת אחרי הבדיקה. */
  | "varies"
  /** יש מממן אחר בלי כיסוי מוגדר: חסרים נתונים. */
  | "missing";

export interface Complement {
  state: ComplementState;
  funder: string | null;
  price: number;
  /** כמה המממן האחר משלם (נקודות). null כשלא ידוע. */
  otherPays: number | null;
  /** ההשלמה שהסל אחראי לה, אחרי התקרות. */
  complement: number | null;
  /** מתוך ההשלמה: כמה מהארנק. */
  basketCovers: number | null;
  /** כמה משלם האזרח: השתתפות על ההשלמה, ומה שמעל התקרה. */
  citizenPays: number | null;
  requiresPriorClaim: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type ComplementInput = Pick<Service, "otherFunder" | "categoryCode" | "copayTier" | "pricePoints" | "unitPrice"> &
  Partial<Pick<Service, "otherFunderName" | "otherFunderCoverage" | "requiresPriorClaim">>;

export function complementOf(s: ComplementInput, seed: Seed): Complement {
  const { settings } = seed;
  const price = s.pricePoints ?? (s.unitPrice ?? 0) * settings.points_per_shekel;
  const funder = s.otherFunderName && s.otherFunderName !== "אין" ? s.otherFunderName : null;
  const requiresPriorClaim = Boolean(s.requiresPriorClaim);
  const base = { funder, price, requiresPriorClaim };
  const rate = copayRate(settings, s.copayTier);

  if (!s.otherFunder && !funder) {
    return { ...base, state: "none", otherPays: 0, complement: price, basketCovers: round2(price * (1 - rate)), citizenPays: round2(price * rate) };
  }
  const cov = s.otherFunderCoverage;
  if (!cov) return { ...base, state: "missing", otherPays: null, complement: null, basketCovers: null, citizenPays: null };
  if (cov.kind === "varies") return { ...base, state: "varies", otherPays: null, complement: null, basketCovers: null, citizenPays: null };

  const otherPays = Math.min(price, cov.kind === "amount" ? (cov.value ?? 0) * settings.points_per_shekel : price * ((cov.value ?? 0) / 100));
  const rest = round2(price - otherPays);
  if (rest <= 0) return { ...base, state: "full", otherPays: round2(otherPays), complement: 0, basketCovers: 0, citizenPays: 0 };

  const cap = isProduct(seed, s.categoryCode) ? productsQuarterlyCapPoints(settings) : Infinity;
  const complement = Math.min(rest, cap);
  const basketCovers = round2(complement * (1 - rate));
  return {
    ...base,
    state: requiresPriorClaim ? "prior_claim" : "partial",
    otherPays: round2(otherPays),
    complement: round2(complement),
    basketCovers,
    citizenPays: round2(rest - basketCovers),
  };
}

/** מוצר בלי מממן אחר שמחירו מעל התקרה הרבעונית (products_quarterly_cap_share). */
export function aboveQuarterlyCap(s: ComplementInput, seed: Seed): boolean {
  if (!isProduct(seed, s.categoryCode) || s.otherFunder || s.otherFunderName) return false;
  const price = s.pricePoints ?? (s.unitPrice ?? 0) * seed.settings.points_per_shekel;
  return price > productsQuarterlyCapPoints(seed.settings);
}

/** משפט לאזרח, בשקלים: מי מממן, כמה הסל משלים, כמה הוא משלם. */
export function complementSentence(c: Complement, pointsPerShekel = 1): string | null {
  const sh = (n: number | null) => `${Math.round((n ?? 0) / pointsPerShekel)} ש"ח`;
  const who = c.funder ?? "מממן אחר";
  switch (c.state) {
    case "partial":
      return `${who} מממן חלק. הסל משלים עד ${sh(c.basketCovers)}. אתה משלם ${sh(c.citizenPays)}.`;
    case "prior_claim":
      return `קודם מגישים ל${who}. אחרי זה הסל משלים עד ${sh(c.basketCovers)}, ואתה משלם ${sh(c.citizenPays)}.`;
    case "full":
      return `${who} מממן את זה. לא צריך את הסל. המלווה תעזור להגיש.`;
    case "varies":
      return `${who} מממן לפי המקרה. המלווה תבדוק, והסל ישלים את השאר.`;
    default:
      return null;
  }
}
