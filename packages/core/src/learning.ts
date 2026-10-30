// פנקס למידה: כל תובנה מהשטח נרשמת (מה קרה, איזה כלל או שדה, מה הוצע, מי הכריע),
// ומיוצאת כ"רישום דרישות למכרז". זה הנכס שמפעיל ביצוע לא יכתוב בעצמו.
// עובר בין השטח למטה כקובץ (כמו חבילת הפיילוט), בלי שרת.

import { z } from "zod";

export const LEARNING_AREAS = ["כלל", "שדה בתקן", "שירות או קטלוג", "תהליך עבודה", "חוויית אזרח", "חוויית מלווה", "ממשק לספק", "נגישות", "פרטיות ואבטחה"] as const;
export const LEARNING_STATUSES = ["פתוח", "הוכרע", "נדחה"] as const;
export const LEARNING_PRIORITIES = ["חובה", "רצוי", "לבדיקה"] as const;

export const learningEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  surface: z.enum(["שטח", "מטה", "אזרח ומלווה"]),
  /** מה קרה בשטח: עובדה, בלי פרטים מזהים של אנשים. */
  observed: z.string().min(1),
  area: z.enum(LEARNING_AREAS),
  /** הכלל או השדה שנוגעים בזה (מפתח בהגדרות או שם שדה בתקן). */
  ref: z.string().default(""),
  proposal: z.string().default(""),
  status: z.enum(LEARNING_STATUSES).default("פתוח"),
  decision: z.string().default(""),
  decidedBy: z.string().default(""),
  /** האם זה נכנס כדרישה למכרז, ובאיזו עדיפות. */
  tender: z.boolean().default(true),
  priority: z.enum(LEARNING_PRIORITIES).default("רצוי"),
});
export type LearningEntry = z.infer<typeof learningEntrySchema>;

export const LEARNING_FILE_SCHEMA = "sal-ishi.learning-notebook/1.0";
export const learningFileSchema = z.object({
  schema: z.literal(LEARNING_FILE_SCHEMA),
  exportedAt: z.string(),
  surface: z.string(),
  entries: z.array(learningEntrySchema),
});
export type LearningFile = z.infer<typeof learningFileSchema>;

export function learningFile(entries: LearningEntry[], surface: string, now = new Date()): LearningFile {
  return { schema: LEARNING_FILE_SCHEMA, exportedAt: now.toISOString(), surface, entries };
}

/** מיזוג פנקס שהגיע מהשטח: רשומה חדשה נוספת, רשומה קיימת מתעדכנת אם היא חדשה יותר. */
export function mergeLearning(current: LearningEntry[], incoming: unknown): { entries: LearningEntry[]; added: number; updated: number } {
  const file = learningFileSchema.parse(incoming);
  const byId = new Map(current.map((e) => [e.id, e]));
  let added = 0;
  let updated = 0;
  for (const e of file.entries) {
    const old = byId.get(e.id);
    if (!old) added++;
    else if (old.at < e.at || JSON.stringify(old) !== JSON.stringify(e)) updated++;
    else continue;
    byId.set(e.id, e);
  }
  return { entries: [...byId.values()].sort((a, b) => a.at.localeCompare(b.at)), added, updated };
}

export interface TenderRequirement {
  id: string;
  area: string;
  requirement: string;
  rationale: string;
  priority: string;
  status: string;
  source: string;
}

/**
 * רישום הדרישות למכרז: רשומה שסומנה למכרז ולא נדחתה. הדרישה היא ההכרעה אם
 * יש, אחרת ההצעה. הנימוק הוא מה שקרה בשטח. מספור קבוע לפי סדר הרישום.
 */
export function tenderRequirements(entries: LearningEntry[]): TenderRequirement[] {
  return entries
    .filter((e) => e.tender && e.status !== "נדחה")
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((e, i) => ({
      id: `REQ-${String(i + 1).padStart(3, "0")}`,
      area: e.area,
      requirement: (e.status === "הוכרע" && e.decision ? e.decision : e.proposal) || "(טרם נוסחה)",
      rationale: e.observed,
      priority: e.priority,
      status: e.status === "הוכרע" ? `הוכרע${e.decidedBy ? ` (${e.decidedBy})` : ""}` : "הצעה, ממתין להכרעה",
      source: `${e.surface}, ${e.at.slice(0, 10)}${e.ref ? `, ${e.ref}` : ""}`,
    }));
}

export function tenderMarkdown(reqs: TenderRequirement[], title = "רישום דרישות למכרז: הסל האישי להזדקנות מיטבית"): string {
  const lines = [`# ${title}`, "", `נוצר מפנקס הלמידה. ${reqs.length} דרישות. דרישה בסטטוס "הצעה, ממתין להכרעה" עוד לא אושרה.`, ""];
  for (const r of reqs) {
    lines.push(`## ${r.id}: ${r.area}`, "", `**הדרישה:** ${r.requirement}`, "", `**למה:** ${r.rationale}`, "", `**עדיפות:** ${r.priority}. **מצב:** ${r.status}. **מקור:** ${r.source}.`, "");
  }
  return lines.join("\n");
}

/** רשומות פתיחה להדגמה: סוגיות אמיתיות שעלו בבניית הכלי, מסומנות כדוגמה. */
export function demoLearningEntries(now = new Date()): LearningEntry[] {
  const d = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  return [
    {
      id: "demo-learn-1", at: d(6), surface: "מטה", area: "כלל", ref: "cancellation_notice_hours",
      observed: "לשירות פרטני ולשירות מרחוק לא הוגדרו שעות הודעה לביטול, ולכן האזרח רואה \"טרם נקבע\".",
      proposal: "הספק יציג שעות הודעה לכל אופן מתן, וברירת מחדל של 24 שעות עד הכרעה.",
      status: "פתוח", decision: "", decidedBy: "", tender: true, priority: "חובה",
    },
    {
      id: "demo-learn-2", at: d(4), surface: "שטח", area: "ממשק לספק", ref: "penetration",
      observed: "מנתוני השירותים אי אפשר לדעת מי השתתף ביותר משירות אחד, ולכן אי אפשר לחשב חדירה.",
      proposal: "הספק ימסור בכל חודש ספירות מצטברות: משתתפים פעילים, זכאים, וימים עד שירות ראשון.",
      status: "פתוח", decision: "", decidedBy: "", tender: true, priority: "חובה",
    },
    {
      id: "demo-learn-3", at: d(2), surface: "אזרח ומלווה", area: "חוויית מלווה", ref: "gated_by_companion",
      observed: "אישור שירות מותנה דרש מעבר בין מסכים. במסלול של שלוש נגיעות המלווה אישרה בפחות מדקה.",
      proposal: "אישור שירות מותנה בשלוש נגיעות, עם סיבה מרשימה סגורה שהאזרח רואה.",
      status: "הוכרע", decision: "אישור בשלוש נגיעות עם סיבה מרשימה סגורה, ותיעוד ביומן.", decidedBy: "צוות התכנית (דוגמה)", tender: true, priority: "רצוי",
    },
  ];
}
