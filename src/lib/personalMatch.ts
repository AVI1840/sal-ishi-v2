/**
 * "מה שחשוב לי קודם": ההמלצה לאזרח מתחילה ממה שהוא סיפר (החלום, מה שהוא
 * אוהב לעשות, מה שחשוב לו), ורק אחר כך ממה שמונע הידרדרות. כל המלצה מקבלת
 * נימוק משלה שמתחיל ב"סיפרת ש...". שיקולי המניעה והפירוק לשכבות נשארים אצל
 * המלווה. מנוע ההתאמה עצמו לא משתנה: כאן רק בוחרים ומסדרים את מה שהוא החזיר.
 */

import { MOTIVATION_LABELS, type PersonalProfile } from "@/data/types";
import type { MatchResult } from "@/lib/matchingEngine";
import { citizenReasons } from "@/lib/citizenReasons";

/** מילים במה שהאזרח סיפר, מול שמות שירותים בקטלוג. */
const ACTIVITY_TO_SERVICE: [RegExp, RegExp][] = [
  [/שיר|מקהל|מוזיק|זמר/, /מקהלה|שירה|מוזיק/],
  [/בישול|לבשל|אוכל|לארח/, /בישול/],
  [/שיחות|חברים|לדבר|אנשים/, /מועדון|קבוצות עניין|קבוצה טלפונית/],
  [/שחמט|משחק/, /משחקי חשיבה/],
  [/קריא|לקרוא|ספר|היסטוריה|ללמוד|לימוד/, /למידה לאורך החיים|סיורים/],
  [/נכד|משפחה/, /שיחות וידאו|בין-דורית/],
  [/הליכה|ספורט|כושר|תנועה|גוף/, /התעמלות|הליכה|כוח ושיווי/],
  [/יצירה|ציור|יצירתי/, /יצירה/],
  [/התנדב|לעזור/, /התנדבות/],
];

/** מה שחשוב לאזרח, בשפה שלו, לנימוק כשאין התאמה למשהו שסיפר במפורש. */
const MOTIVATION_PHRASE: Record<string, string> = {
  belonging: "להיות חלק מקהילה",
  meaning: "לעשות משהו עם משמעות",
  family: "להיות קרוב למשפחה",
  health: "לשמור על הבריאות",
  independence: "לשמור על העצמאות",
  curiosity: "ללמוד דברים חדשים",
  growth: "להמשיך להתפתח",
  self_efficacy: "להרגיש שאפשר",
  recognition: "שיראו אותך",
  comfort: "שיהיה לך נוח",
};

export interface PersonalPick {
  result: MatchResult;
  /** הנימוק לאזרח: מתחיל ב"סיפרת ש...". */
  reason: string;
}

/** פרופיל עם מה שהאזרח סיפר בשאלון עכשיו. */
type ToldProfile = PersonalProfile & { toldNow?: string };

const LOVED_PHRASE: Record<string, string> = { שירה: "לשיר", בישול: "לבשל", "ללמוד ולקרוא": "ללמוד ולקרוא" };

const loves = (p: PersonalProfile) => (p.gender === "male" ? "אוהב" : "אוהבת");

/** הדברים שהאזרח סיפר, לפי הסדר: החלום, מה שהוא אוהב לעשות, תחומי העניין. */
function said(p: PersonalProfile): { text: string; reason: string; strong?: boolean }[] {
  const out: { text: string; reason: string; strong?: boolean }[] = [];
  // מה שסיפרה עכשיו בשאלון קודם לכל מה שהיה ידוע.
  const now = (p as ToldProfile).toldNow;
  if (now) out.push({ text: now, reason: `סיפרת עכשיו שאת${p.gender === "male" ? "ה" : ""} ${loves(p)} ${LOVED_PHRASE[now] ?? now}.`, strong: true });
  if (p.dream) out.push({ text: p.dream, reason: `סיפרת שהחלום שלך הוא ${p.dream}.`, strong: true });
  for (const a of p.preferredActivities ?? []) out.push({ text: a, reason: `סיפרת שאת${p.gender === "male" ? "ה" : ""} ${loves(p)} ${a}.` });
  for (const i of p.interests ?? []) out.push({ text: i, reason: `סיפרת שמעניין אותך ${i}.` });
  return out;
}

function serviceRegexFor(text: string): RegExp | null {
  return ACTIVITY_TO_SERVICE.find(([said]) => said.test(text))?.[1] ?? null;
}

/**
 * עד n המלצות: קודם מה שהאזרח סיפר (כל אחת מתחום אחר), ואחר כך הטובות
 * ביותר של המנוע מתחומים שעוד לא נבחרו. כל נימוק ייחודי.
 */
export function personalRecommendations(p: PersonalProfile, results: MatchResult[], n = 3): PersonalPick[] {
  const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);
  const picks: PersonalPick[] = [];
  const usedService = new Set<string>();
  const usedCategory = new Set<string>();
  const usedReason = new Set<string>();
  const take = (r: MatchResult, reason: string) => {
    picks.push({ result: r, reason });
    usedService.add(r.service.id);
    usedCategory.add(String(r.service.category));
    usedReason.add(reason);
  };

  for (const s of said(p)) {
    if (picks.length >= n) break;
    const re = serviceRegexFor(s.text);
    if (!re || usedReason.has(s.reason)) continue;
    // החלום ומה שסיפרה עכשיו לא נופלים בגלל כלל הגיוון. שאר מה שסיפרה: מתחום אחר.
    const hit = sorted.find((r) => re.test(r.service.name) && !usedService.has(r.service.id) && (s.strong || !usedCategory.has(String(r.service.category))));
    if (hit) take(hit, s.reason);
  }

  // אחר כך: הטובות של המנוע מתחומים אחרים. "סיפרת ש..." רק כשהמנוע עצמו מצא
  // שהשירות עונה על מוטיבציה שהאזרח סיפר עליה. אחרת נימוק כן, בשפה פשוטה.
  const servedMotivation = (r: MatchResult) => {
    const labels = r.explanations.filter((e) => e.startsWith("מתאים למוטיבציה: ")).map((e) => e.replace("מתאים למוטיבציה: ", ""));
    return (p.motivations ?? []).find((m) => MOTIVATION_PHRASE[m] && labels.includes(MOTIVATION_LABELS[m]) && !usedReason.has(`סיפרת שחשוב לך ${MOTIVATION_PHRASE[m]}.`));
  };
  const rest = sorted
    .filter((r) => !usedService.has(r.service.id))
    .sort((a, b) => Number(Boolean(servedMotivation(b))) - Number(Boolean(servedMotivation(a))));
  for (const r of rest) {
    if (picks.length >= n) break;
    if (usedService.has(r.service.id) || usedCategory.has(String(r.service.category))) continue;
    const m = servedMotivation(r);
    const reason = m ? `סיפרת שחשוב לך ${MOTIVATION_PHRASE[m]}.` : citizenReasons(r.explanations).find((x) => !usedReason.has(x)) ?? "מתאים לך ולשכונה שלך.";
    take(r, reason);
  }
  return picks;
}

/** הנימוק האישי לשירות אחד (לדף השירות). */
export function personalReasonFor(p: PersonalProfile, serviceName: string): string | null {
  for (const s of said(p)) {
    const re = serviceRegexFor(s.text);
    if (re?.test(serviceName)) return s.reason;
  }
  return null;
}

/**
 * הפרופיל אחרי השאלון של האזרח ("לספר מה חשוב לי") או של הפגישה המשותפת.
 * מה שסיפר עכשיו קודם למה שהיה ידוע.
 */
export function withAnswers(p: PersonalProfile, answers?: Record<string, string>): ToldProfile {
  if (!answers) return p;
  const loved = answers.loved ? [answers.loved] : [];
  const motivations = [...(answers.hard === "lonely" ? ["belonging" as const] : []), ...p.motivations];
  return {
    ...p,
    ...(answers.loved ? { toldNow: answers.loved } : {}),
    preferredActivities: [...new Set([...loved, ...(p.preferredActivities ?? [])])],
    preferredFormat: (answers.with ?? answers.format ?? p.preferredFormat) as PersonalProfile["preferredFormat"],
    preferredHours: answers.hours ?? p.preferredHours,
    mobilityLevel: (answers.hard === "going_out" ? "walker_wheelchair" : answers.mobility ?? p.mobilityLevel) as PersonalProfile["mobilityLevel"],
    motivations: [...new Set(motivations)],
  };
}
