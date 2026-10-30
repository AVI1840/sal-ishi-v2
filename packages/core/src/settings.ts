// עזרים לקריאת ההגדרות: מה מסומן "הצעה", חלון המיצוי ושיעור ההשתתפות העצמית.

import type { CopayTier } from "./model";
import type { Seed, Settings } from "./seed";
import { QOL_LAYERS, seedIndex } from "./seed";

const STATUS_SUFFIX = "_status";

const isProposalText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().toLowerCase().startsWith("proposal");

/** סטטוס בתוך ההגדרה עצמה (הפורמט של 0.4: { value, status }). */
function nestedStatus(value: unknown): string | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const status = (value as { status?: unknown }).status;
    if (typeof status === "string") return status;
  }
  return undefined;
}

/**
 * מקור אחד לסטטוס הכללים בכל המסכים (המטה, השטח והכלי המרכזי): מה שהוכרע במפגש 2
 * (סיכום מפגש 2), ומה שסומן "הוכרע" או "סופי" אחר כך. כל השאר הצעה.
 */
export const DECIDED_MEETING_2: Record<string, string> = {
  personal_wallet: "הוכרע במפגש 2: ארנק אישי 500",
  companion: "הוכרע במפגש 2: חלוקת ₪760",
  community: "הוכרע במפגש 2: חלוקת ₪760",
  overhead: "הוכרע במפגש 2: חלוקת ₪760",
  total: "הוכרע במפגש 2: ₪760 לאזרח בחודש",
  core_floor: "הוכרע במפגש 2: רצפה של 3",
  copay_tiers: "הוכרע במפגש 2: השתתפות 0, 20 ועד 50",
  qol_copay: "הוכרע במפגש 2: השתתפות עד 50 באיכות חיים",
  qol_cap_month: "הוכרע במפגש 2: תקרת איכות חיים 100",
  utilization_target: "הוכרע במפגש 2: יעד מיצוי 70%",
  red_flag_avg: "הוכרע במפגש 2: דגל אדום 35%",
};

/** החלטות של מפגש 2 שאינן הגדרה מספרית. */
export const DECIDED_PRINCIPLES_MEETING_2 = [
  "חמשת תחומי הליבה",
  "סל משלים בלבד",
  "מרכזי יום והסעות מחוץ לסל",
  "מלווה לכל 70 עד 80 אזרחים",
] as const;

const isDecidedText = (value: unknown): value is string => typeof value === "string" && /^\s*(הוכרע|סופי)/.test(value);

/** הסטטוס שכתוב בהגדרה עצמה, או במפתח X_status שחל עליה (הארוך ביותר). */
function ownStatus(record: Record<string, unknown>, key: string): string | undefined {
  const nested = nestedStatus(record[key]);
  if (nested) return nested;
  const statusKey = Object.keys(record)
    .filter((k) => k.endsWith(STATUS_SUFFIX) && k !== key && key.startsWith(k.slice(0, -STATUS_SUFFIX.length)))
    .sort((a, b) => b.length - a.length)[0];
  return statusKey ? String(record[statusKey] ?? "") : undefined;
}

/** הכרעה: ברשימת מפגש 2, או סומן "הוכרע"/"סופי". */
export function isDecided(settings: Settings, key: string): boolean {
  if (key in DECIDED_MEETING_2) return true;
  return isDecidedText(ownStatus(settings as Record<string, unknown>, key));
}

/** הגדרות שהוסרו (נשארות ב-seed לקריאת קבצים ישנים, לא מוצגות ולא נספרות). */
export const RETIRED_SETTINGS = new Set(["competition_max_suppliers_local", "competition_max_suppliers_national", "supplier_rating_weights"]);

/** כל הכללים בהגדרות (בלי מפתחות הסטטוס ובלי מה שהוסר). */
export function ruleKeys(settings: Settings): string[] {
  return Object.keys(settings).filter((k) => !k.endsWith(STATUS_SUFFIX) && !RETIRED_SETTINGS.has(k)).sort();
}

export function isProposal(settings: Settings, key: string): boolean {
  return !isDecided(settings, key);
}

/** מפתחות הגדרה בסטטוס הצעה: כל כלל שלא הוכרע. */
export function proposalKeys(settings: Settings): string[] {
  return ruleKeys(settings).filter((k) => !isDecided(settings, k));
}

/**
 * טקסט הסטטוס להצגה, בעברית ובלי מונחים פנימיים ("proposal", שמות מסמכים,
 * שמות שדות). כלל ממפגש 2 מוצג עם ההכרעה.
 */
export function statusNote(settings: Settings, key: string): string {
  if (key in DECIDED_MEETING_2) return DECIDED_MEETING_2[key]!;
  return plainStatus(ownStatus(settings as Record<string, unknown>, key) ?? "");
}

/** ניקוי טקסט סטטוס לתצוגה. */
export function plainStatus(text: string): string {
  return text
    .replace(/^\s*proposal\s*-?\s*/i, "")
    .replace(/\s*\(?[a-z_]+=(true|false)\)?/gi, "")
    .replace(/\s*\([a-z][a-z_]*[a-z]\)/g, "")
    .replace(/תוספת 3:\s*/g, "")
    .replace(/\s*\(תוספת 3\)/g, "")
    .replace(/תוספת 3/g, "ההצעה לפיילוט")
    .replace(/מודל החשכ"ל/g, "הצעת החשכ\"ל")
    .trim();
}

// קריאת ההגדרות של 0.4 שמגיעות בפורמט { value, status }.
export const qolMode = (s: Settings) => s.qol_mode.value;
export const referencePriceMode = (s: Settings) => s.reference_price_mode.value;
export const activeMinSessions = (s: Settings) => s.active_participant_min_sessions_month.value;
export const productsCapShare = (s: Settings) => s.products_quarterly_cap_share.value;
export const noShowRule = (s: Settings) => s.no_show_charge_rule.value;
export const supplierRatingEnabled = (s: Settings) => s.supplier_rating_enabled ?? true;

/**
 * תקרת המוצרים ברבעון בנקודות: שיעור מהארנק הרבעוני
 * (0.25 כפול 500 כפול 3 = 375, הפירוש שאושר ב-29.10).
 */
export function productsQuarterlyCapPoints(s: Settings): number {
  return Math.round(productsCapShare(s) * s.personal_wallet * 3 * s.points_per_shekel);
}

/** הרבעון של חודש: 2026-10 הוא 2026-Q4. */
export function quarterOf(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${y}-Q${Math.ceil(m / 3)}`;
}

/** שלושת החודשים של רבעון, מהמוקדם למאוחר. */
export function quarterMonths(quarter: string): string[] {
  const [y, q] = quarter.split("-Q").map(Number) as [number, number];
  return [1, 2, 3].map((i) => `${y}-${String((q - 1) * 3 + i).padStart(2, "0")}`);
}

/** מספר החודשים בחלון המיצוי, מתוך ערך כמו "rolling_3_months". */
export function utilizationWindowMonths(settings: Settings): number {
  const match = /(\d+)/.exec(settings.utilization_window);
  return match ? Number(match[1]) : 3;
}

export function copayRate(settings: Settings, tier: CopayTier): number {
  return settings.copay_tiers[tier];
}

/**
 * דרגת השתתפות עצמית ברירת מחדל לפי קטגוריה. "חוגים" אינם מסומנים ב-seed,
 * ולכן הדרגה הזו נבחרת ידנית בטופס.
 */
export function defaultCopayTier(seed: Seed, categoryCode: string): CopayTier {
  const category = seedIndex(seed).categories.get(categoryCode);
  if (category && (QOL_LAYERS as readonly string[]).includes(category.layer)) return "qol";
  return "core_and_prevention";
}

/** החודש הקודם בפורמט YYYY-MM. */
export function previousMonth(month: string, steps = 1): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const total = y * 12 + (m - 1) - steps;
  const year = Math.floor(total / 12);
  const mon = (total % 12) + 1;
  return `${year}-${String(mon).padStart(2, "0")}`;
}

/** החודשים בחלון שמסתיים ב-asOfMonth, מהמוקדם למאוחר. */
export function windowMonths(asOfMonth: string, size: number): string[] {
  const months: string[] = [];
  for (let i = size - 1; i >= 0; i--) months.push(previousMonth(asOfMonth, i));
  return months;
}

/** "2026-Q3" מוצג כ"רבעון 3, 2026". */
export function quarterText(q: string): string {
  return q.replace(/^(\d{4})-Q(\d)$/, "רבעון $2, $1");
}

/** שם בעברית לכל הגדרה, להצגה במסכים (בלי שמות שדות). */
export const SETTING_LABELS: Record<string, string> = {
  min_participants: "שירות רציף: משתתפים לפחות",
  min_active_months: "שירות רציף: חודשים פעילים לפחות",
  core_floor: "רצפה: שירותים רציפים בכל תחום ליבה",
  floor_applies_to_regular: "הרצפה חלה גם על שירות שאינו רציף",
  personal_wallet: "ארנק אישי בחודש",
  companion: "ליווי בחודש",
  community: "קהילה בחודש",
  overhead: "תפעול בחודש",
  total: "סל לאזרח בחודש",
  utilization_target: "יעד מיצוי",
  red_flag_avg: "דגל אדום מתחת ל",
  qol_cap_month: "תקרת איכות חיים בחודש",
  qol_counts_in_target: "איכות חיים נספרת ביעד המיצוי",
  small_cell_threshold: "סף תא קטן (פרטיות)",
  floor_scope: "היקף הרצפה",
  subarea_alerts: "תתי-תחומים עם התראה",
  red_flag_period: "תקופת הדגל האדום",
  red_flag_scope: "היקף הדגל האדום",
  qol_copay: "השתתפות באיכות חיים",
  qol_cap_is_paid_by_basket: "תקרת איכות חיים משולמת מהסל",
  copay_tiers: "מדרגות השתתפות עצמית",
  hot_meals_per_week_max: "ארוחה חמה: עד ארוחות בשבוע",
  hot_meals_months_max: "ארוחה חמה: עד חודשים",
  hot_meal_price_assumption: "ארוחה חמה: הנחת מחיר",
  companion_escort_counts_in_wallet: "ליווי המלווה נספר בארנק",
  points_per_shekel: "נקודות לשקל",
  points_rollover_months: "צבירת נקודות לחודשים הבאים",
  utilization_window: "חלון מיצוי",
  price_policy: "מדיניות מחיר",
  price_outlier_threshold: "חריגת מחיר מעל הייחוס",
  reference_price_method: "שיטת מחיר הייחוס",
  reference_price_min_samples: "דגימות לפחות למחיר ייחוס",
  hot_meal_entry_criteria: "ארוחה חמה: תנאי כניסה",
  publish_to_citizen_statuses: "מה מתפרסם לאזרח",
  cancellation_notice_hours: "הודעה מראש לביטול",
  no_show_charge_rule: "חיוב באי-הגעה",
  hospitalization_refund: "החזר באשפוז",
  products_quarterly_cap_share: "תקרת מוצרים ברבעון",
  products_count_in_floor: "מוצרים נספרים ברצפה",
  qol_mode: "איכות חיים: סכום קבוע או אחוז",
  active_participant_min_sessions_month: "משתתף פעיל: מפגשים בחודש לפחות",
  reference_price_mode: "מחיר ייחוס: מעקב או מחייב",
  low_competition_operator_threshold: "מעט ספקים: פחות מ",
  price_index_period: "תקופת מדד המחיר",
  first_service_max_days: "זמן לשירות ראשון: עד ימים",
  supplier_contact_to_hq: "פרטי ספק יחיד עוברים למטה",
  matching_weights: "משקלות שכבות ההתאמה",
  selection_min_per_domain: "בחירת האזרח: שירות מכל תחום (המלצה)",
  selection_max_active: "בחירת האזרח: עד שירותים פעילים",
  selection_change_months: "בחירת האזרח: החלפה כל חודשים",
  suggestions_per_domain: "הצעות לאזרח בכל תחום",
  subcategory_breadth_min: "רוחב: תתי-קטגוריות שונות לפחות",
  floor_min_accessible: "רצפה: שירות נגיש אחד לפחות",
  target_per_category: "יעד עושר בכל תחום (מדד)",
  floor_max_nonlocal: "שירותים לא מקומיים שנספרים ברצפה",
  large_city_authorities: "רשויות שנחשבות עיר גדולה",
  subarea_alert_min: "התראה בתת-תחום מתחת ל",
  supplier_rating_enabled: "דירוג ספקים: חמישה רכיבים",
  supplier_rating_min_evaluations: "דירוג ספקים: הערכות לפחות לפני ציון",
  reference_price_binding_scope: "היכן מחיר הייחוס מחייב",
};

export const settingLabel = (key: string) => SETTING_LABELS[key] ?? "הגדרה טכנית";
