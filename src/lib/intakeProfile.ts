/**
 * הפרופיל האישי מהקליטה (T0 עם המלווה), ומה שהאזרח מעדכן בעצמו. הרוב נאסף
 * בקליטה בבית; באזור האישי האזרח רואה את זה כבר מסומן, ויכול להוסיף, להוריד
 * ולעדכן: מה חשוב לו, החלום, מה הוא אוהב, יעדים, איך ומתי נוח לו, מה יכול
 * לעזור לו לצאת, ומה הוא יכול לתת. התפקוד (ניידות, טלפון) נרשם עם המלווה בלבד.
 * הכל נשמר כאירוע needs.updated, מגיע לתיק אצל המלווה ומזין את ההתאמה.
 * בלי ציונים ובלי תיוג: רק מה שהאזרח בחר, בשפה שלו.
 */
import { MOTIVATION_LABELS, type Motivation, type PersonalProfile } from "@/data/types";

export interface Option {
  id: string;
  label: string;
}

/** מה נותן לי משמעות. */
export const MEANING: Option[] = (Object.keys(MOTIVATION_LABELS) as Motivation[])
  .filter((m) => m !== "comfort")
  .map((id) => ({
    id,
    label: {
      health: "לשמור על הבריאות",
      belonging: "להיות חלק מקהילה",
      independence: "להסתדר בעצמי",
      meaning: "לעשות משהו עם משמעות",
      self_efficacy: "להרגיש שאני מסוגל/ת",
      family: "המשפחה והנכדים",
      recognition: "שיראו ויעריכו אותי",
      curiosity: "ללמוד דברים חדשים",
      growth: "להמשיך להתפתח",
      comfort: "",
    }[id],
  }));

/** מה אני אוהב/ת לעשות. הערך הוא המילה שמנוע ההמלצה מכיר. */
export const ACTIVITIES: Option[] = [
  { id: "שירה", label: "לשיר ולשמוע מוזיקה" },
  { id: "בישול", label: "לבשל ולארח" },
  { id: "שיחות", label: "לשבת ולדבר עם אנשים" },
  { id: "הליכה", label: "ללכת ולזוז" },
  { id: "שחייה", label: "לשחות" },
  { id: "ריקוד", label: "לרקוד" },
  { id: "יצירה", label: "ליצור, לצייר, לסרוג" },
  { id: "ללמוד ולקרוא", label: "ללמוד ולקרוא" },
  { id: "הרצאות", label: "לשמוע הרצאות" },
  { id: "טיולים", label: "לטייל ולצאת לסיורים" },
  { id: "משחק", label: "משחקי חשיבה, שחמט, קלפים" },
  { id: "גינון", label: "לגנן" },
  { id: "נכדים", label: "לבלות עם הנכדים" },
  { id: "התנדבות", label: "לעזור לאחרים" },
];

/** יעדים לחצי השנה הקרובה (נקבעים יחד עם המלווה, ואפשר לעדכן). */
export const GOALS: Option[] = [
  { id: "meet", label: "להכיר אנשים חדשים" },
  { id: "out", label: "לצאת יותר מהבית" },
  { id: "body", label: "לחזק את הגוף ואת שיווי המשקל" },
  { id: "memory", label: "לשמור על הזיכרון והראש חד" },
  { id: "learn", label: "ללמוד משהו חדש" },
  { id: "give", label: "לתת מעצמי: להתנדב, ללמד" },
  { id: "phone", label: "להסתדר עם הטלפון והמחשב" },
  { id: "home", label: "להמשיך לגור בבית בביטחון" },
  { id: "mood", label: "להרגיש טוב יותר עם עצמי" },
];

export const FORMAT: Option[] = [
  { id: "small_group", label: "בקבוצה קטנה" },
  { id: "large_group", label: "בקבוצה גדולה" },
  { id: "alone", label: "לבד, או עם אדם אחד" },
  { id: "flexible", label: "לא משנה לי" },
];

export const HOURS: Option[] = [
  { id: "בוקר", label: "בבוקר" },
  { id: "צהריים", label: "בצהריים" },
  { id: "אחר הצהריים", label: "אחר הצהריים" },
  { id: "ערב", label: "בערב" },
];

export const DAYS: Option[] = [
  { id: "1", label: "פעם בשבוע" },
  { id: "2", label: "פעמיים בשבוע" },
  { id: "3", label: "שלוש פעמים ויותר" },
];

export const LANGUAGES: Option[] = ["עברית", "רוסית", "ערבית", "אמהרית", "אנגלית", "יידיש", "צרפתית", "ספרדית"].map((l) => ({ id: l, label: l }));

export const WHERE: Option[] = [
  { id: "neighborhood", label: "בשכונה, ברגל" },
  { id: "near", label: "עד חצי שעה בתחבורה" },
  { id: "home", label: "בבית, בטלפון או במחשב" },
];

/** מה יכול לעזור לי לצאת. לא "קושי": מה שהמלווה תעזור בו. */
export const HELP: Option[] = [
  { id: "going_out", label: "קשה לי לצאת לבד" },
  { id: "fall", label: "אני חושש/ת ליפול" },
  { id: "new_people", label: "לא קל לי להכיר אנשים חדשים" },
  { id: "cost", label: "המחיר" },
  { id: "senses", label: "שמיעה או ראייה" },
  { id: "phone", label: "הטלפון והמחשב" },
  { id: "transport", label: "הדרך וההסעה" },
  { id: "mood", label: "מצב הרוח" },
];

/** מה אני יכול/ה לתת לקהילה. */
export const GIVE: Option[] = [
  { id: "listen", label: "להקשיב ולתמוך" },
  { id: "teach", label: "ללמד ממה שאני יודע/ת" },
  { id: "cook", label: "לבשל לאחרים" },
  { id: "music", label: "לשיר, לנגן" },
  { id: "hands", label: "ידיים טובות: תיקונים, יצירה" },
  { id: "languages", label: "שפות ותרגום" },
  { id: "volunteer", label: "להתנדב בשכונה" },
];

const list = (v?: string) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);
export const parseList = list;

/** מה שנאסף בקליטה, כבסיס לאזור האישי. */
export function intakeAnswers(p: PersonalProfile): Record<string, string> {
  const activities = ACTIVITIES.filter((a) => [...(p.preferredActivities ?? []), ...(p.interests ?? [])].some((x) => x.includes(a.id) || a.id.includes(x))).map((a) => a.id);
  const hours = HOURS.filter((h) => (p.preferredHours ?? "").includes(h.id)).map((h) => h.id);
  const help: string[] = [];
  if (p.barriers?.includes("mobility")) help.push("going_out");
  if (p.barriers?.includes("fear")) help.push("fall");
  if (p.barriers?.includes("social_difficulty") || p.barriers?.includes("shame")) help.push("new_people");
  if (p.barriers?.includes("cost")) help.push("cost");
  if (p.barriers?.includes("low_motivation") || p.barriers?.includes("anxiety")) help.push("mood");
  const goals: string[] = [];
  if (p.loneliness >= 4 || p.motivations.includes("belonging")) goals.push("meet");
  if (p.activityLevel <= 2) goals.push("out");
  if (p.motivations.includes("health")) goals.push("body");
  if (p.motivations.includes("curiosity") || p.motivations.includes("growth")) goals.push("learn");
  if (p.motivations.includes("meaning")) goals.push("give");
  const give: string[] = [];
  if (p.strengths?.includes("humanity")) give.push("listen");
  if (p.strengths?.includes("wisdom")) give.push("teach");
  if (activities.includes("בישול")) give.push("cook");
  if (activities.includes("שירה")) give.push("music");
  return {
    motivations: p.motivations.filter((m) => m !== "comfort").join(","),
    dream: p.dream ?? "",
    activities: activities.join(","),
    goals: goals.join(","),
    format: p.preferredFormat ?? "flexible",
    hours: hours.join(","),
    days: p.activityLevel >= 4 ? "3" : p.activityLevel >= 3 ? "2" : "1",
    languages: p.language ?? "עברית",
    where: p.mobilityLevel === "home_remote" ? "home" : "neighborhood",
    help: help.join(","),
    give: give.join(","),
  };
}

const GOAL_MOTIVATION: Record<string, Motivation> = { meet: "belonging", out: "belonging", body: "health", memory: "self_efficacy", learn: "curiosity", give: "meaning", phone: "self_efficacy", home: "independence", mood: "growth" };

/** הפרופיל אחרי העדכון של האזרח (התשובות גוברות על הקליטה). */
export function applyIntakeAnswers(p: PersonalProfile, a: Record<string, string>): PersonalProfile & { toldNow?: string } {
  const activities = list(a.activities);
  const goals = list(a.goals);
  const motivations = [...new Set([...(list(a.motivations) as Motivation[]), ...goals.map((g) => GOAL_MOTIVATION[g]).filter(Boolean)])];
  const before = new Set(intakeAnswers(p).activities.split(",").filter(Boolean));
  const added = activities.find((x) => !before.has(x));
  const help = list(a.help);
  return {
    ...p,
    ...(added ? { toldNow: added } : {}),
    dream: a.dream?.trim() ? a.dream.trim() : p.dream,
    preferredActivities: activities.length ? activities : p.preferredActivities,
    motivations: motivations.length ? motivations : p.motivations,
    preferredFormat: (a.format as PersonalProfile["preferredFormat"]) || p.preferredFormat,
    preferredHours: list(a.hours).join(", ") || p.preferredHours,
    language: list(a.languages)[0] ?? p.language,
    mobilityLevel: a.where === "home" || help.includes("going_out") ? "home_remote" : p.mobilityLevel,
  };
}

/** תחומי הסל שהאזרח מכוון אליהם, מהיעדים (למיון אצל המלווה ובשוק). */
export function domainsFromGoals(goals: string[]): string[] {
  const out: string[] = [];
  if (goals.some((g) => ["meet", "out", "give"].includes(g))) out.push("belonging");
  if (goals.some((g) => ["body", "memory", "home"].includes(g))) out.push("health_function");
  if (goals.includes("mood")) out.push("resilience");
  if (goals.includes("phone")) out.push("digital");
  return out;
}
