// נתוני הדגמה סינתטיים בלבד: רשויות, שכונות, ספקים ושמות דמיוניים. כל מספר כאן
// מומצא, ונבחר כך שכל מצב בכלי יופיע (ירוק, כתום, אדום, אירוע, חריגת מחיר,
// התראה קהילתית ודגל מיצוי). שתי וריאציות, כדי שהמטה יוכל להשוות בין פיילוטים.

import type { AuthorityData, Community, DeliveryMode, FitProfile, MonthlyActivity, Neighborhood, Service, ServiceMode, Supplier, SupplierEvaluation, UnmetDemand } from "./model";
import { NATIONAL_AUTHORITY } from "./catalogExport";
import { defaultSeed, seedIndex } from "./seed";
import { defaultCopayTier } from "./settings";
import { suggestedGate, suggestedServiceMode } from "./rules/terms";

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

type Pattern = "cont" | "low" | "event" | "none" | "short";

interface Spec {
  n: number;
  type: string;
  sup: string;
  fit: Community[];
  price: number;
  market?: number | null;
  pattern: Pattern;
  base?: number;
  status?: Service["status"];
  program?: string;
  start?: number;
  otherFunder?: boolean;
  enforceable?: boolean;
  name?: string;
  copay?: Service["copayTier"];
  reach?: Service["reach"];
  /** שירות מגרסה קודמת, בלי שדות 0.4: מופיע ברשימת ההשלמות. */
  legacy?: boolean;
  capacityLimited?: boolean;
  // תוספת 3: מזהה קבוע, אופן מתן, פרופיל התאמה ומממן אחר.
  key?: string;
  mode?: ServiceMode;
  delivery?: DeliveryMode;
  fp?: FitProfile;
  funder?: Pick<Service, "otherFunderName" | "otherFunderCoverage" | "requiresPriorClaim">;
}

// שעות שירות ליחידת תשלום, לפי היחידה בספריית סוגי השירות. מספרי הדגמה.
const HOURS_PER_UNIT: Record<string, number> = { "חודש": 6, "סבב": 12, "מפגש": 1.5, "סדנה": 6, "כרטיס": 2.5, "סיור": 4, "אירוע": 3, "שובר": 1, "ביקור": 1.5, "מנוי": 4, "טיפול": 1, "שעה": 1 };

const G: Community[] = ["general"];
const H: Community[] = ["haredi"];
const A: Community[] = ["arab"];

const SPECS: Spec[] = [
  // שכונה א: כמעט מלאה
  { n: 0, type: "T01", sup: "S-001", fit: G, price: 120, pattern: "cont", base: 22, status: "אושר" },
  { n: 0, type: "T07", sup: "S-004", fit: G, price: 100, pattern: "cont", base: 14, status: "אושר", copay: "classes" },
  { n: 0, type: "T11", sup: "S-001", fit: G, price: 60, pattern: "cont", base: 30, status: "אושר" },
  { n: 0, type: "T17", sup: "S-003", fit: G, price: 90, pattern: "cont", base: 18, status: "אושר" },
  { n: 0, type: "T16", sup: "S-003", fit: G, price: 110, pattern: "cont", base: 15, status: "אושר", capacityLimited: true },
  { n: 0, type: "T21", sup: "S-004", fit: G, price: 80, pattern: "cont", base: 11, status: "הוגש", legacy: true },
  { n: 0, type: "T32", sup: "S-006", fit: G, price: 250, pattern: "cont", base: 12, status: "אושר", program: "p-support", start: 0 },
  { n: 0, type: "T32", sup: "S-006", fit: G, price: 250, pattern: "cont", base: 12, status: "אושר", program: "p-support", start: 5, name: "קבוצת תמיכה ומשמעות, סבב ב" },
  { n: 0, type: "T35", sup: "S-006", fit: G, price: 200, pattern: "cont", base: 10, status: "הוגש" },
  { n: 0, type: "T40", sup: "S-007", fit: G, price: 280, pattern: "cont", base: 13, status: "אושר" },
  { n: 0, type: "T42", sup: "S-007", fit: G, price: 300, pattern: "cont", base: 12, status: "אושר" },
  { n: 0, type: "T45", sup: "S-007", fit: G, price: 150, pattern: "cont", base: 11, status: "אושר", reach: "authority", name: "תמיכה טכנית בבית (לכל הרשות)" },
  { n: 0, type: "T48", sup: "S-008", fit: G, price: 50, pattern: "cont", base: 40, status: "אושר", copay: "qol" },
  { n: 0, type: "T28", sup: "S-001", fit: G, price: 0, pattern: "event", base: 35, otherFunder: true, status: "טיוטה", name: "הרצאת קופת חולים (הדגמה)" },

  // שכונה ב (חרדית): שייכות טובה, חוסן חסר
  { n: 1, type: "T01", sup: "S-002", fit: H, price: 130, pattern: "cont", base: 20, status: "אושר" },
  { n: 1, type: "T02", sup: "S-002", fit: H, price: 140, pattern: "cont", base: 16, status: "אושר" },
  { n: 1, type: "T12", sup: "S-002", fit: H, price: 50, pattern: "cont", base: 12, status: "אושר", legacy: true },
  { n: 1, type: "T17", sup: "S-002", fit: H, price: 95, pattern: "cont", base: 14, status: "אושר" },
  { n: 1, type: "T15", sup: "S-002", fit: H, price: 160, pattern: "cont", base: 10, status: "הוגש", capacityLimited: true },
  { n: 1, type: "T36", sup: "S-006", fit: ["general", "haredi"], price: 180, pattern: "short", base: 10, status: "הוגש" },
  { n: 1, type: "T40", sup: "S-007", fit: H, price: 280, pattern: "cont", base: 11, status: "אושר" },
  { n: 1, type: "T41", sup: "S-007", fit: H, price: 260, pattern: "cont", base: 10, status: "הוגש", market: null },

  // שכונה ג (חרדית): שירותים קיימים אבל לא מותאמים קהילתית
  { n: 2, type: "T01", sup: "S-002", fit: H, price: 125, pattern: "cont", base: 18, status: "אושר" },
  { n: 2, type: "T07", sup: "S-004", fit: G, price: 135, pattern: "cont", base: 12, status: "הוגש", copay: "classes" },
  { n: 2, type: "T17", sup: "S-004", fit: G, price: 90, pattern: "cont", base: 12, status: "אושר" },
  { n: 2, type: "T18", sup: "S-004", fit: G, price: 70, pattern: "cont", base: 10, status: "אושר" },
  { n: 2, type: "T22", sup: "S-006", fit: G, price: 300, pattern: "event", base: 25, status: "טיוטה" },
  { n: 2, type: "T40", sup: "S-007", fit: G, price: 280, pattern: "low", base: 7, status: "טיוטה" },

  // שכונה ד (חרדית): דלילה
  { n: 3, type: "T01", sup: "S-002", fit: H, price: 120, pattern: "cont", base: 15, status: "אושר" },
  { n: 3, type: "T16", sup: "S-002", fit: H, price: 115, pattern: "low", base: 8, status: "הוגש" },
  { n: 3, type: "T33", sup: "S-006", fit: ["general", "haredi"], price: 220, pattern: "none", status: "טיוטה", enforceable: false },

  // שכונה ה (ערבית)
  { n: 4, type: "T01", sup: "S-001", fit: A, price: 115, pattern: "cont", base: 20, status: "אושר" },
  { n: 4, type: "T06", sup: "S-001", fit: A, price: 40, pattern: "event", base: 60, status: "אושר" },
  { n: 4, type: "T09", sup: "S-005", fit: A, price: 90, pattern: "cont", base: 25, status: "אושר", reach: "regional", name: "טיולים וסיורים (אזורי)" },
  { n: 4, type: "T12", sup: "S-005", fit: A, price: 55, pattern: "cont", base: 10, status: "הוגש" },
  { n: 4, type: "T17", sup: "S-003", fit: A, price: 90, pattern: "cont", base: 16, status: "אושר" },
  { n: 4, type: "T19", sup: "S-003", fit: A, price: 85, pattern: "cont", base: 11, status: "אושר" },
  { n: 4, type: "T25", sup: "S-005", fit: A, price: 350, pattern: "cont", base: 10, status: "הוגש" },
  { n: 4, type: "T17", sup: "S-005", fit: A, price: 140, pattern: "cont", base: 12, status: "הוגש", name: "התעמלות מותאמת גיל, קבוצה ב" },
  { n: 4, type: "T40", sup: "S-007", fit: A, price: 290, pattern: "cont", base: 12, status: "נדחה" },
  // איכות חיים שנפתחת באישור המלווה (שער מ-qol_rules). בסוף הרשימה, כדי לא לשנות את המספרים האקראיים של שאר השירותים.
  { n: 0, type: "T51", sup: "S-008", fit: G, price: 100, pattern: "cont", base: 14, status: "אושר", copay: "qol" },
];

// ── קטלוג ההדגמה של ירושלים (תוספת 3) ─────────────────────
// סוגי השירות לפי הטבלה בתוספת 3, על ספריית הסוגים שב-seed. ספקים בדויים,
// מחירי דמה. פסגת זאב עשירה (יעד עושר), תלפיות מזרח ובית חנינא ברצפה, בבית וגן אין
// שירות בריאות נגיש, ורוממה דלה (פערים עם חלופות).
const WALK_AND_AID: FitProfile = { functionalLevels: ["independent", "partial_help"], mobility: ["independent_walking", "walker_wheelchair"], digitalRequired: "none", evidenceLevel: "medium" };
const WALK_ONLY: FitProfile = { functionalLevels: ["independent"], mobility: ["independent_walking"], digitalRequired: "none", evidenceLevel: "medium" };
const AT_HOME: FitProfile = { functionalLevels: ["independent", "partial_help", "homebound"], mobility: ["independent_walking", "walker_wheelchair", "home_remote"], digitalRequired: "none", evidenceLevel: "medium" };
const BY_PHONE: FitProfile = { ...AT_HOME, digitalRequired: "basic_phone" };
const BY_SMARTPHONE: FitProfile = { ...AT_HOME, digitalRequired: "smartphone" };
const fp = (base: FitProfile, extra: Partial<FitProfile> = {}): FitProfile => ({ ...base, ...extra });
const C = "cont" as const;

const SPECS_J: Spec[] = [
  // פסגת זאב: עשירה
  { key: "club", n: 0, type: "T01", sup: "S-001", fit: G, price: 120, pattern: C, base: 24, status: "אושר", name: "מועדון שכונתי", fp: fp(WALK_AND_AID, { goals: ["belonging"], evidenceLevel: "high", suitableMildCognitiveDecline: true }) },
  { key: "interest", n: 0, type: "T03", sup: "S-004", fit: G, price: 60, pattern: C, base: 14, status: "אושר", name: "קבוצות עניין", fp: fp(WALK_AND_AID, { goals: ["belonging"] }) },
  { key: "intergen", n: 0, type: "T04", sup: "S-001", fit: G, price: 70, pattern: C, base: 12, status: "אושר", reach: "regional", name: "פעילות בין-דורית", fp: fp(WALK_ONLY, { goals: ["belonging", "meaning"] }) },
  { key: "volunteer", n: 0, type: "T12", sup: "S-002", fit: G, price: 40, pattern: C, base: 13, status: "אושר", name: "התנדבות מותאמת", fp: fp(WALK_AND_AID, { goals: ["meaning"] }) },
  { key: "project", n: 0, type: "T02", sup: "S-002", fit: G, price: 90, pattern: C, base: 13, status: "אושר", name: "פרויקט קהילתי בהובלה אישית", fp: fp(WALK_ONLY, { goals: ["meaning"] }) },
  { key: "mentor", n: 0, type: "T13", sup: "S-007", fit: G, price: 80, pattern: C, base: 13, status: "אושר", reach: "national", mode: "remote", delivery: "remote", name: "חונכות של ותיקים לצעירים (מרחוק)", fp: fp(BY_PHONE, { goals: ["meaning"] }) },
  { key: "culture", n: 0, type: "T11", sup: "S-001", fit: G, price: 60, pattern: C, base: 30, status: "אושר", name: "תרבות מקומית", fp: fp(WALK_AND_AID, { goals: ["belonging"] }) },
  { key: "learning", n: 0, type: "T10", sup: "S-006", fit: G, price: 90, pattern: C, base: 16, status: "אושר", reach: "regional", name: "למידה לאורך החיים", fp: fp(WALK_AND_AID, { goals: ["curiosity"], suitableMildCognitiveDecline: true }) },
  { key: "tours", n: 0, type: "T09", sup: "S-005", fit: G, price: 95, pattern: C, base: 20, status: "אושר", reach: "regional", name: "סיורים קבוצתיים", fp: fp(WALK_ONLY, { goals: ["curiosity"], intensity: "medium" }) },
  { key: "crafts", n: 0, type: "T07", sup: "S-004", fit: G, price: 100, pattern: C, base: 14, status: "אושר", copay: "classes", name: "חוגי יצירה", fp: fp(WALK_AND_AID, { goals: ["meaning"] }) },
  { key: "exercise", n: 0, type: "T17", sup: "S-003", fit: G, price: 90, pattern: C, base: 18, status: "אושר", name: "התעמלות מותאמת", fp: fp(WALK_AND_AID, { goals: ["health"], evidenceLevel: "high", intensity: "low" }) },
  { key: "hydro", n: 0, type: "T15", sup: "S-003", fit: G, price: 160, pattern: C, base: 13, status: "אושר", reach: "regional", capacityLimited: true, name: "הידרותרפיה", fp: fp(WALK_AND_AID, { goals: ["health"], evidenceLevel: "high", medicalClearanceRequired: true }) },
  { key: "yoga", n: 0, type: "T17", sup: "S-004", fit: G, price: 95, pattern: C, base: 12, status: "אושר", copay: "classes", name: "יוגה ופילאטיס", fp: fp(WALK_ONLY, { goals: ["health"], intensity: "medium" }) },
  { key: "balance", n: 0, type: "T16", sup: "S-003", fit: G, price: 110, pattern: C, base: 15, status: "אושר", capacityLimited: true, name: "כוח ושיווי משקל", fp: fp(WALK_AND_AID, { goals: ["health", "independence"], evidenceLevel: "high" }) },
  { key: "cognitive", n: 0, type: "T22", sup: "S-006", fit: G, price: 140, pattern: C, base: 12, status: "אושר", reach: "regional", name: "אימון קוגניטיבי", fp: fp(WALK_AND_AID, { goals: ["independence"], evidenceLevel: "high", suitableMildCognitiveDecline: true }) },
  { key: "memory", n: 0, type: "T22", sup: "S-004", fit: G, price: 90, pattern: C, base: 13, status: "אושר", name: "זיכרון ויצירה", fp: fp(WALK_AND_AID, { goals: ["independence", "meaning"], suitableMildCognitiveDecline: true }) },
  { key: "games", n: 0, type: "T21", sup: "S-001", fit: G, price: 70, pattern: C, base: 13, status: "אושר", name: "משחקי חשיבה קבוצתיים", fp: fp(WALK_AND_AID, { goals: ["curiosity"], suitableMildCognitiveDecline: true }) },
  { key: "cooking", n: 0, type: "T27", sup: "S-008", fit: G, price: 120, pattern: C, base: 13, status: "אושר", name: "סדנת בישול בריא קבוצתית", fp: fp(WALK_AND_AID, { goals: ["health"] }) },
  { key: "support", n: 0, type: "T32", sup: "S-006", fit: G, price: 250, pattern: C, base: 12, status: "אושר", name: "קבוצת תמיכה נושאית", fp: fp(WALK_AND_AID, { goals: ["belonging"], evidenceLevel: "high" }) },
  { key: "grief", n: 0, type: "T34", sup: "S-006", fit: G, price: 260, pattern: C, base: 13, status: "אושר", reach: "regional", name: "התמודדות עם אבל ואובדן", fp: fp(WALK_AND_AID, { evidenceLevel: "high" }) },
  { key: "phonegroup", n: 0, type: "T32", sup: "S-007", fit: G, price: 120, pattern: C, base: 14, status: "אושר", reach: "national", mode: "remote", delivery: "remote", name: "קבוצה טלפונית נגד בדידות", fp: fp(BY_PHONE, { goals: ["belonging"], evidenceLevel: "medium" }) },
  { key: "counsel", n: 0, type: "T33", sup: "S-006", fit: G, price: 220, pattern: C, base: 13, status: "אושר", mode: "individual", name: "ייעוץ פרטני להתמודדות", fp: fp(AT_HOME, { evidenceLevel: "high" }) },
  { key: "smartphone", n: 0, type: "T40", sup: "S-007", fit: G, price: 280, pattern: C, base: 13, status: "אושר", name: "סמארטפון בסיסי", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone", goals: ["independence"] }) },
  { key: "apps", n: 0, type: "T40", sup: "S-007", fit: G, price: 200, pattern: C, base: 13, status: "אושר", name: "אפליקציות יומיומיות", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone", goals: ["independence"] }) },
  { key: "gov", n: 0, type: "T41", sup: "S-007", fit: G, price: 150, pattern: C, base: 13, status: "אושר", reach: "national", mode: "remote", delivery: "remote", name: "שירותים ממשלתיים דיגיטליים", fp: fp(BY_SMARTPHONE) },
  { key: "banking", n: 0, type: "T43", sup: "S-007", fit: G, price: 170, pattern: C, base: 13, status: "אושר", reach: "regional", name: "בנקאות דיגיטלית", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone" }) },
  { key: "techhome", n: 0, type: "T45", sup: "S-007", fit: G, price: 150, pattern: C, base: 13, status: "אושר", reach: "authority", mode: "home", delivery: "home", name: "תמיכה טכנית בבית", fp: fp(AT_HOME, { digitalRequired: "basic_phone" }) },
  { key: "install", n: 0, type: "T47", sup: "S-007", fit: G, price: 130, pattern: C, base: 13, status: "אושר", mode: "home", delivery: "home", name: "התקנת ציוד", fp: fp(AT_HOME) },
  { key: "video", n: 0, type: "T44", sup: "S-007", fit: G, price: 110, pattern: C, base: 12, status: "אושר", reach: "national", mode: "remote", delivery: "remote", name: "שיחות וידאו עם המשפחה", fp: fp(BY_SMARTPHONE, { goals: ["family", "belonging"] }) },
  { key: "homeadapt", n: 0, type: "T29", sup: "S-003", fit: G, price: 300, pattern: C, base: 13, status: "אושר", mode: "home", delivery: "home", name: "התאמת הבית למניעת נפילות", fp: fp(AT_HOME, { goals: ["independence"], evidenceLevel: "high" }) },
  // השלמה בלבד: ייעוץ תזונה (סל הבריאות מממן חלק), בדיקות מונעות (הפניה בלבד)
  { key: "nutrition", n: 0, type: "T26", sup: "S-006", fit: G, price: 240, pattern: C, base: 13, status: "אושר", mode: "individual", name: "ייעוץ תזונה (השלמה)", fp: fp(AT_HOME, { goals: ["health"] }), funder: { otherFunderName: "סל בריאות", otherFunderCoverage: { kind: "percent", value: 50 } } },
  { key: "checkups", n: 0, type: "T31", sup: "S-001", fit: G, price: 120, pattern: C, base: 20, status: "אושר", mode: "individual", name: "בדיקות מונעות בקופה (הפניה)", fp: fp(WALK_AND_AID, { goals: ["health"] }), funder: { otherFunderName: "סל בריאות", otherFunderCoverage: { kind: "percent", value: 100 } } },
  // איכות חיים (seed, הוכרע): שובר בית קפה, וסל טיפוח באישור המלווה
  { key: "coffee", n: 0, type: "T48", sup: "S-008", fit: G, price: 53, pattern: C, base: 40, status: "אושר", copay: "qol", name: "שובר בית קפה זוגי", fp: fp(WALK_AND_AID, { goals: ["belonging"] }) },
  { key: "care", n: 0, type: "T51", sup: "S-008", fit: G, price: 105, pattern: C, base: 14, status: "אושר", copay: "qol", name: "סל טיפוח", fp: fp(AT_HOME) },

  // תלפיות מזרח: ברצפה
  { key: "k-club", n: 1, type: "T01", sup: "S-001", fit: G, price: 120, pattern: C, base: 20, status: "אושר", name: "מועדון שכונתי", fp: WALK_AND_AID },
  { key: "k-crafts", n: 1, type: "T07", sup: "S-004", fit: G, price: 100, pattern: C, base: 12, status: "אושר", copay: "classes", name: "חוגי יצירה", fp: WALK_AND_AID },
  { key: "k-volunteer", n: 1, type: "T12", sup: "S-002", fit: G, price: 40, pattern: C, base: 13, status: "אושר", name: "התנדבות מותאמת", fp: WALK_AND_AID },
  { key: "k-exercise", n: 1, type: "T17", sup: "S-003", fit: G, price: 90, pattern: C, base: 16, status: "אושר", name: "התעמלות מותאמת", fp: WALK_AND_AID },
  { key: "k-walk", n: 1, type: "T18", sup: "S-004", fit: G, price: 60, pattern: C, base: 12, status: "אושר", name: "קבוצות הליכה", fp: WALK_ONLY },
  { key: "k-games", n: 1, type: "T21", sup: "S-001", fit: G, price: 70, pattern: C, base: 13, status: "אושר", name: "משחקי חשיבה קבוצתיים", fp: WALK_AND_AID },
  { key: "k-support", n: 1, type: "T32", sup: "S-006", fit: G, price: 250, pattern: C, base: 13, status: "אושר", name: "קבוצת תמיכה נושאית", fp: WALK_AND_AID },
  { key: "k-counsel", n: 1, type: "T33", sup: "S-006", fit: G, price: 220, pattern: C, base: 13, status: "אושר", mode: "individual", name: "ייעוץ פרטני להתמודדות", fp: AT_HOME },
  { key: "k-grief", n: 1, type: "T34", sup: "S-006", fit: G, price: 260, pattern: C, base: 13, status: "אושר", name: "התמודדות עם אבל ואובדן", fp: WALK_AND_AID },
  { key: "k-smart", n: 1, type: "T40", sup: "S-007", fit: G, price: 280, pattern: C, base: 12, status: "אושר", name: "סמארטפון בסיסי", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone" }) },
  { key: "k-apps", n: 1, type: "T40", sup: "S-007", fit: G, price: 200, pattern: C, base: 13, status: "אושר", name: "אפליקציות יומיומיות", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone" }) },

  // בית וגן: ברצפה, אבל אף שירות בריאות לא נגיש להליכון
  { key: "g-club", n: 2, type: "T01", sup: "S-001", fit: G, price: 115, pattern: C, base: 18, status: "אושר", name: "מועדון שכונתי", fp: WALK_AND_AID },
  { key: "g-interest", n: 2, type: "T03", sup: "S-004", fit: G, price: 60, pattern: C, base: 12, status: "אושר", name: "קבוצות עניין", fp: WALK_AND_AID },
  { key: "g-culture", n: 2, type: "T11", sup: "S-001", fit: G, price: 60, pattern: C, base: 22, status: "אושר", name: "תרבות מקומית", fp: WALK_AND_AID },
  { key: "g-yoga", n: 2, type: "T17", sup: "S-004", fit: G, price: 95, pattern: C, base: 12, status: "אושר", copay: "classes", name: "יוגה ופילאטיס", fp: WALK_ONLY },
  { key: "g-walk", n: 2, type: "T18", sup: "S-004", fit: G, price: 60, pattern: C, base: 12, status: "אושר", name: "קבוצות הליכה", fp: WALK_ONLY },
  { key: "g-strength", n: 2, type: "T20", sup: "S-003", fit: G, price: 100, pattern: C, base: 13, status: "אושר", name: "כוח ושיווי משקל מתקדם", fp: fp(WALK_ONLY, { intensity: "high" }) },
  { key: "g-support", n: 2, type: "T32", sup: "S-006", fit: G, price: 250, pattern: C, base: 13, status: "אושר", name: "קבוצת תמיכה נושאית", fp: WALK_AND_AID },

  // רוממה (חרדית): דלה
  { key: "r-club", n: 3, type: "T01", sup: "S-002", fit: H, price: 120, pattern: C, base: 15, status: "אושר", name: "מועדון שכונתי", fp: WALK_AND_AID },
  { key: "r-exercise", n: 3, type: "T17", sup: "S-002", fit: H, price: 95, pattern: C, base: 13, status: "אושר", name: "התעמלות מותאמת", fp: WALK_AND_AID },

  // בית חנינא (ערבית)
  { key: "b-club", n: 4, type: "T01", sup: "S-001", fit: A, price: 115, pattern: C, base: 20, status: "אושר", name: "מועדון שכונתי", fp: WALK_AND_AID },
  { key: "b-culture", n: 4, type: "T11", sup: "S-001", fit: A, price: 60, pattern: C, base: 25, status: "אושר", name: "תרבות מקומית", fp: WALK_AND_AID },
  { key: "b-volunteer", n: 4, type: "T12", sup: "S-005", fit: A, price: 55, pattern: C, base: 13, status: "אושר", name: "התנדבות מותאמת", fp: WALK_AND_AID },
  { key: "b-exercise", n: 4, type: "T17", sup: "S-003", fit: A, price: 90, pattern: C, base: 16, status: "אושר", name: "התעמלות מותאמת", fp: WALK_AND_AID },
  { key: "b-walk", n: 4, type: "T18", sup: "S-005", fit: A, price: 60, pattern: C, base: 12, status: "אושר", name: "קבוצות הליכה", fp: WALK_ONLY },
  { key: "b-cooking", n: 4, type: "T27", sup: "S-005", fit: A, price: 120, pattern: C, base: 13, status: "אושר", name: "סדנת בישול בריא קבוצתית", fp: WALK_AND_AID },
  { key: "b-support", n: 4, type: "T32", sup: "S-005", fit: A, price: 240, pattern: C, base: 13, status: "אושר", name: "קבוצת תמיכה נושאית", fp: WALK_AND_AID },
  { key: "b-smart", n: 4, type: "T40", sup: "S-007", fit: A, price: 280, pattern: C, base: 12, status: "אושר", name: "סמארטפון בסיסי", fp: fp(WALK_AND_AID, { digitalRequired: "smartphone" }) },

  // פסגת זאב: מקהלה קהילתית, "חוט הזהב" של ההדגמה (שרה רוצה לחזור לשיר). בסוף
  // הרשימה, כדי לא לשנות את המספרים האקראיים של שאר השירותים.
  { key: "choir", n: 0, type: "T03", sup: "S-001", fit: G, price: 80, pattern: C, base: 16, status: "אושר", name: "מקהלה קהילתית", fp: fp(WALK_AND_AID, { goals: ["belonging", "meaning"], evidenceLevel: "medium" }) },
];

interface Variant {
  authority: string;
  prefix: string;
  label: string;
  communities: Community[];
  enrolled: number[];
  priceFactor: number;
  rngSeed: number;
  /** שמות שכונות. בלי זה: "שכונה א (תווית)". */
  names?: string[];
  /** רשימת שירותים משלה. בלי זה: SPECS. */
  specs?: Spec[];
}

// וריאציה 0 משמשת את משטח השטח. וריאציה 1 היא פיילוט שני להדגמת המטה:
// מחירים גבוהים ב-15%, שכונה רביעית כללית במקום חרדית. וריאציה 2 משמשת את
// הכלי המרכזי: שמות השכונות של אזרחי ההדגמה שלו, כדי שההתאמה לפי שכונה תעבוד.
// השמות הם גיאוגרפיה בלבד. השירותים, הספקים והמספרים בה סינתטיים כמו בשאר.
const VARIANTS: Variant[] = [
  { authority: "רשות הדגמה", prefix: "demo", label: "הדגמה", communities: ["general", "haredi", "haredi", "haredi", "arab"], enrolled: [60, 58, 47, 13, 56], priceFactor: 1, rngSeed: 2026 },
  { authority: "רשות הדגמה ב", prefix: "demob", label: "הדגמה ב", communities: ["general", "haredi", "general", "general", "arab"], enrolled: [75, 98, 27, 20, 77], priceFactor: 1.15, rngSeed: 7 },
  { authority: "ירושלים (הדגמה)", prefix: "demoj", label: "הדגמה", communities: ["general", "general", "general", "haredi", "arab"], enrolled: [64, 70, 40, 18, 66], priceFactor: 1.05, rngSeed: 99, names: ["פסגת זאב", "תלפיות מזרח", "בית וגן", "רוממה", "בית חנינא"], specs: SPECS_J },
];

// הערכות רבעוניות לדוגמה (איכות, תוצאות מניעה, שביעות רצון, עלות-תועלת).
const ev = (quarter: string, quality: number, outcomes: number, satisfaction: number, value: number): SupplierEvaluation => ({ quarter, quality, outcomes, satisfaction, value });
const EVALUATIONS: Record<string, SupplierEvaluation[] | undefined> = {
  "S-001": [ev("2026-Q2", 4, 3, 4, 4), ev("2026-Q3", 4, 4, 4, 4)],
  "S-002": [ev("2026-Q3", 5, 4, 5, 4)],
  "S-003": [ev("2026-Q2", 3, 3, 3, 2), ev("2026-Q3", 3, 2, 3, 2)],
  "S-004": [ev("2026-Q3", 4, 4, 5, 5)],
  "S-007": [ev("2026-Q3", 4, 3, 4, 3)],
};

// ביקוש שלא נענה: מה שמלוות סימנו כ"ביקשו ואין", לפי שכונה וסוג שירות.
const UNMET: [number, string, number][] = [
  [1, "T33", 7],
  [1, "T22", 4],
  [2, "T22", 9],
  [2, "T16", 6],
  [3, "T01", 3],
  [3, "T33", 8],
  [4, "T35", 6],
];

/** מחולל פסאודו-אקראי קבוע, כדי שההדגמה תיראה אותו דבר בכל טעינה. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_VARIANT_COUNT = VARIANTS.length;

/**
 * ירושלים (הדגמה): השכונות של הפיילוט לפי ההחלטות. מקור הנתונים המשותף לשלוש
 * הדלתות: הכלי לאזרח ולמלווה, אטלס השטח והמטה בונים ממנו את אותו קטלוג.
 */
export const DEMO_JERUSALEM = 2;

export function buildDemoAuthority(variant = 0): AuthorityData {
  const v = VARIANTS[variant] ?? VARIANTS[0]!;
  const { serviceTypes } = seedIndex(defaultSeed);
  const rand = rng(v.rngSeed);
  const letters = ["א", "ב", "ג", "ד", "ה"];
  const N: Neighborhood[] = v.communities.map((community, i) => ({
    id: `${v.prefix}-n${i + 1}`,
    authority: v.authority,
    name: v.names?.[i] ?? `שכונה ${letters[i]} (${v.label})`,
    community,
  }));
  const nid = (i: number) => `${v.prefix}-n${i + 1}`;
  const all = N.map((n) => n.id);

  const suppliers: Supplier[] = [
    { code: "S-001", type: "authority", displayName: `מתנ"ס ${v.label}`, neighborhoods: all, languages: ["עברית", "ערבית"], communityFit: ["general", "arab"], accessible: true, deliveryModes: ["community"] },
    { code: "S-002", type: "npo", displayName: `עמותת ${v.label} לקהילה`, neighborhoods: [nid(1), nid(2), nid(3)], languages: ["עברית", "יידיש"], communityFit: ["haredi"], accessible: true, deliveryModes: ["community", "home"], contact: { phone: "000-0000100" } },
    { code: "S-003", type: "company", displayName: `חברת ${v.label} לכושר`, neighborhoods: [nid(0), nid(4)], languages: ["עברית", "ערבית", "רוסית"], communityFit: ["general", "arab"], accessible: true, deliveryModes: ["community"] },
    { code: "S-004", type: "exempt", displayName: `מדריכה לדוגמה 1 (${v.label})`, neighborhoods: [nid(0), nid(2)], languages: ["עברית"], communityFit: ["general"], accessible: false, deliveryModes: ["community", "home"], contact: { phone: "000-0000001", email: "demo1@example.test" } },
    { code: "S-005", type: "exempt", displayName: `מדריך לדוגמה 2 (${v.label})`, neighborhoods: [nid(4)], languages: ["ערבית", "עברית"], communityFit: ["arab"], accessible: true, deliveryModes: ["community", "remote"], contact: { phone: "000-0000002" } },
    { code: "S-006", type: "licensed", displayName: `יועצת לדוגמה 3 (${v.label})`, neighborhoods: all, languages: ["עברית", "אנגלית"], communityFit: ["general", "haredi"], accessible: true, deliveryModes: ["home", "remote"], contact: { email: "demo3@example.test" } },
    { code: "S-007", type: "npo", displayName: `עמותת ${v.label} לדיגיטל`, neighborhoods: all, languages: ["עברית", "ערבית", "יידיש"], communityFit: ["general", "haredi", "arab"], accessible: true, deliveryModes: ["community", "home", "remote"] },
    { code: "S-008", type: "company", displayName: `בית קפה ${v.label}`, neighborhoods: [nid(0)], languages: ["עברית"], communityFit: ["general"], accessible: true, deliveryModes: ["community"] },
  ].map((s) => ({ ...s, authority: v.authority, evaluations: EVALUATIONS[s.code] }) as Supplier);

  const services: Service[] = [];
  const activity: MonthlyActivity[] = [];

  (v.specs ?? SPECS).forEach((spec, i) => {
    const type = serviceTypes.get(spec.type)!;
    const neighborhood = N[spec.n]!;
    // בשכונה שהפרופיל שלה כללי בוריאציה הזו, ההתאמה הקהילתית היא כללית.
    const fit: Community[] = neighborhood.community === "general" ? ["general"] : spec.fit;
    const id = spec.key ? `${v.prefix}-${spec.key}` : `${v.prefix}-s${String(i + 1).padStart(2, "0")}`;
    const start = spec.start ?? (spec.pattern === "short" ? 7 : Math.floor(rand() * 3));
    const price = Math.round(spec.price * v.priceFactor);
    const market = spec.market === null ? undefined : (spec.market ?? Math.round(price * (0.95 + rand() * 0.1)));
    const copayTier = spec.copay ?? defaultCopayTier(defaultSeed, type.category);

    services.push({
      id,
      authority: v.authority,
      neighborhoodId: neighborhood.id,
      name: spec.name ?? type.name,
      categoryCode: type.category,
      serviceTypeId: type.id,
      supplierCode: spec.sup,
      languages: suppliers.find((s) => s.code === spec.sup)!.languages.slice(0, 2),
      format: type.format,
      unit: type.unit,
      unitPrice: price,
      pricePoints: price,
      ...(market !== undefined ? { marketPrice: market } : {}),
      copayTier,
      communityFit: fit,
      deliveryMode: spec.delivery ?? "community",
      attendanceMethod: ["operator"],
      ...(spec.legacy ? {} : demoPaymentFields(type, spec)),
      ...(spec.mode ? { serviceMode: spec.mode } : {}),
      ...(spec.fp ? { fitProfile: spec.fp } : {}),
      ...(spec.funder ?? {}),
      otherFunder: spec.otherFunder ?? Boolean(spec.funder),
      enforceable: spec.enforceable ?? true,
      ...(spec.program ? { programId: `${v.prefix}-${spec.program}` } : {}),
      ...(spec.reach ? { reach: spec.reach } : {}),
      startMonth: MONTHS[start]!,
      status: spec.status ?? "טיוטה",
      ...(spec.status === "נדחה" ? { committeeNote: "מחיר גבוה ממחיר הייחוס, לבקש הצעה מחודשת (הדגמה)" } : {}),
    });

    const copayRate = defaultSeed.settings.copay_tiers[copayTier];
    const months =
      spec.pattern === "none"
        ? []
        : spec.pattern === "event"
          ? [MONTHS[start + 3]!]
          : spec.program
            ? MONTHS.slice(start, start + 5)
            : MONTHS.slice(start);
    for (const month of months) {
      const base = spec.base ?? 10;
      const participants =
        spec.pattern === "low" ? Math.max(3, Math.round(base - rand() * 3)) : Math.max(1, Math.round(base * (0.85 + rand() * 0.35)));
      activity.push({
        serviceId: id,
        month,
        uniqueParticipants: participants,
        sessions: spec.pattern === "event" ? 1 : 4,
        walletSpent: Math.round(participants * price * (1 - copayRate)),
      });
    }
  });

  return {
    authority: v.authority,
    neighborhoods: N,
    suppliers,
    services,
    activity,
    enrollment: N.flatMap((n, i) =>
      MONTHS.map((month) => {
        const enrolled = v.enrolled[i]!;
        // נתונים מצטברים מדוח ספק העל (חדירה וזמן לשירות ראשון). השכונה הקטנה
        // מתחת לסף התא הקטן, כדי שההסתרה תופיע בהדגמה.
        const fresh = Math.round(enrolled * 0.12);
        return {
          neighborhoodId: n.id,
          month,
          enrolled,
          activeParticipants: Math.round(enrolled * (0.45 + rand() * 0.3)),
          eligible: Math.round(enrolled * 1.7),
          firstServiceDaysAvg: Math.round((7 + rand() * 12) * 10) / 10,
          firstServiceCount: fresh,
        };
      }),
    ),
    // כל פיילוט עם ביקוש קצת שונה, כדי שההשוואה במטה תהיה אמינה.
    unmetDemand: UNMET.map(([n, serviceTypeId, requests]): UnmetDemand => ({
      neighborhoodId: nid(n),
      serviceTypeId,
      month: "2026-10",
      requests: Math.max(1, requests + Math.round((rand() - 0.5) * 6) - variant),
    })),
  };
}

/** שדות מודל התשלום (0.4) לשירות הדגמה: שעות לפי היחידה, אופן מתן ושער מלווה. */
function demoPaymentFields(type: { category: string; unit: string; format: string }, spec: Spec): Partial<Service> {
  const gate = suggestedGate(defaultSeed, type.category);
  return {
    hoursPerUnit: HOURS_PER_UNIT[type.unit] ?? 1,
    serviceMode: suggestedServiceMode({ format: type.format, deliveryMode: "community" }),
    capacityLimited: spec.capacityLimited ?? false,
    gatedByCompanion: gate !== null,
    ...(gate ? { gateReason: gate } : {}),
  };
}

/**
 * ערוץ המוצרים הארצי להדגמה: מוצרי מניעה ובטיחות ממסמך הקטלוג, מספקים
 * ארציים דמיוניים. מנוהל במטה ומופיע בקטלוג של כל שכונה.
 */
export function buildDemoNationalChannel(): { suppliers: Supplier[]; services: Service[] } {
  const supplier = (code: string, name: string, score: number[]): Supplier => ({
    code,
    authority: NATIONAL_AUTHORITY,
    type: "company",
    displayName: name,
    neighborhoods: [],
    languages: ["עברית", "ערבית", "רוסית", "אמהרית"],
    communityFit: ["general", "haredi", "arab"],
    accessible: true,
    deliveryModes: ["home"],
    evaluations: [ev("2026-Q3", score[0]!, score[1]!, score[2]!, score[3]!)],
  });
  const suppliers = [
    supplier("N-001", "ספק מוצרי בטיחות ארצי (הדגמה)", [4, 4, 4, 3]),
    supplier("N-002", "ספק טכנולוגיה מסייעת ארצי (הדגמה)", [5, 4, 4, 4]),
    supplier("N-003", "ספק ציוד כושר ביתי ארצי (הדגמה)", [3, 3, 4, 4]),
  ];
  const item = (id: string, typeId: string, name: string, sup: string, price: number, extra: Partial<Service> = {}): Service => ({
    id: `nat-${id}`,
    authority: NATIONAL_AUTHORITY,
    neighborhoodId: "",
    name,
    categoryCode: "6",
    serviceTypeId: typeId,
    supplierCode: sup,
    languages: ["עברית", "ערבית", "רוסית"],
    format: "מוצר",
    unit: "מוצר",
    unitPrice: price,
    pricePoints: price,
    marketPrice: Math.round(price * 1.1),
    copayTier: "core_and_prevention",
    communityFit: ["general", "haredi", "arab"],
    deliveryMode: "home",
    attendanceMethod: ["companion"],
    otherFunder: false,
    enforceable: true,
    reach: "national",
    startMonth: "2026-12",
    status: "אושר",
    fitProfile: { functionalLevels: ["independent", "partial_help", "homebound"], mobility: ["independent_walking", "walker_wheelchair", "home_remote"], digitalRequired: "none" },
    ...extra,
  });
  // השלמה בלבד (תוספת 3): מממן אחר משלם חלק או הכל. הכיסויים להדגמה [לאמת].
  const funded = (name: Service["otherFunderName"], coverage: Service["otherFunderCoverage"], prior = false): Partial<Service> => ({
    otherFunder: true,
    otherFunderName: name,
    otherFunderCoverage: coverage,
    requiresPriorClaim: prior,
  });
  return {
    suppliers,
    services: [
      // מוצרי מניעה ובטיחות (רשימה ארצית, רבעוני), לפי תוספת 3
      item("amp", "T57", "מגבר קול לטלפון", "N-002", 160),
      item("vision", "T57", "עזרי ראייה פשוטים", "N-002", 140),
      item("grab", "T54", "מאחזי יד", "N-001", 340),
      item("bath", "T54", "אביזרי אמבטיה נגד החלקה", "N-001", 220),
      item("shoes", "T54", "נעליים נגד החלקה", "N-001", 260),
      item("light", "T54", "תאורת לילה אוטומטית", "N-002", 120),
      item("fit", "T56", "עזרי התעמלות ביתיים", "N-003", 280),
      // השלמה בלבד
      item("hearing", "T57", "מכשיר שמיעה (השלמה)", "N-002", 3000, funded("משרד הבריאות", { kind: "amount", value: 2400 })),
      item("walker", "T56", "הליכון (השאלה, הפניה)", "N-003", 450, funded("אחר", { kind: "percent", value: 100 })),
      item("button", "T55", "לחצן מצוקה (השלמה)", "N-002", 450, funded("גמלת סיעוד", { kind: "amount", value: 300 }, true)),
    ],
  };
}
