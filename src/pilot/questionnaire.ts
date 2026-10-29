/**
 * השאלון של הפגישה המשותפת (תוספת 3): עד 8 שאלות סגורות על רצונות, יכולות
 * ומגבלות, שלוש תשובות בכל אחת. התשובות מזינות את מנוע ההתאמה: רצון ומוטיבציה,
 * והתאמה ליכולות (כולל סינון בטיחות). בלי טקסט חופשי.
 */

import { CITIZENS } from "@/data/mockData";
import type { Motivation, PersonalProfile } from "@/data/types";

export interface Question {
  id: string;
  text: string;
  options: { value: string; label: string }[];
}

export const QUESTIONS: Question[] = [
  { id: "want1", text: "מה הכי חשוב לך עכשיו?", options: [{ value: "belonging", label: "להיפגש עם אנשים" }, { value: "health_function", label: "לשמור על הגוף" }, { value: "prevention_products", label: "להרגיש בטוח בבית" }] },
  { id: "want2", text: "ומה עוד?", options: [{ value: "resilience", label: "שיחה ותמיכה" }, { value: "digital", label: "להסתדר עם הטלפון" }, { value: "enough", label: "זה מספיק" }] },
  { id: "mobility", text: "איך יוצאים מהבית?", options: [{ value: "independent_walking", label: "הולך לבד" }, { value: "walker_wheelchair", label: "עם הליכון או כיסא גלגלים" }, { value: "home_remote", label: "כמעט לא יוצא מהבית" }] },
  { id: "function", text: "כמה עזרה צריך ביום-יום?", options: [{ value: "independent", label: "מסתדר לבד" }, { value: "partial_help", label: "צריך קצת עזרה" }, { value: "homebound", label: "צריך הרבה עזרה" }] },
  { id: "digital", text: "איזה טלפון יש?", options: [{ value: "none", label: "אין טלפון נייד" }, { value: "basic_phone", label: "טלפון רגיל" }, { value: "smartphone", label: "סמארטפון" }] },
  { id: "format", text: "איך נוח לך?", options: [{ value: "small_group", label: "בקבוצה קטנה" }, { value: "alone", label: "לבד" }, { value: "flexible", label: "גם וגם" }] },
  { id: "hours", text: "באיזו שעה נוח?", options: [{ value: "בוקר", label: "בבוקר" }, { value: "צהריים", label: "בצהריים" }, { value: "ערב", label: "אחר הצהריים" }] },
  { id: "language", text: "באיזו שפה?", options: [{ value: "עברית", label: "עברית" }, { value: "ערבית", label: "ערבית" }, { value: "רוסית", label: "רוסית" }] },
];

const MOTIVATION: Record<string, Motivation> = {
  belonging: "belonging",
  health_function: "health",
  prevention_products: "independence",
  resilience: "meaning",
  digital: "curiosity",
};

/** תשובות לדוגמה, כדי להראות ששלוש הדמויות מקבלות סלים שונים. */
export const DEMO_ANSWERS: Record<string, Record<string, string>> = {
  c1: { want1: "belonging", want2: "resilience", mobility: "independent_walking", function: "independent", digital: "basic_phone", format: "small_group", hours: "בוקר", language: "עברית" },
  c2: { want1: "prevention_products", want2: "enough", mobility: "walker_wheelchair", function: "partial_help", digital: "basic_phone", format: "alone", hours: "בוקר", language: "עברית" },
  c3: { want1: "health_function", want2: "digital", mobility: "independent_walking", function: "independent", digital: "smartphone", format: "small_group", hours: "בוקר", language: "עברית" },
};

export const interestsFrom = (a: Record<string, string>) => [a.want1, a.want2].filter((x): x is string => Boolean(x) && x !== "enough");

/** הפרופיל של אזרח מההדגמה, אחרי התשובות. בלי תשובות: הפרופיל כמו שהוא. */
export function profileFor(id: string, answers?: Record<string, string>): PersonalProfile | undefined {
  const base = CITIZENS.find((c) => c.id === id);
  if (!base || !answers) return base;
  const wanted = interestsFrom(answers).map((x) => MOTIVATION[x]).filter((x): x is Motivation => Boolean(x));
  return {
    ...base,
    motivations: [...new Set([...wanted, ...base.motivations])],
    mobilityLevel: answers.mobility as PersonalProfile["mobilityLevel"],
    functionalLevel: answers.function as PersonalProfile["functionalLevel"],
    digitalLevel: answers.digital as PersonalProfile["digitalLevel"],
    preferredFormat: (answers.format as PersonalProfile["preferredFormat"]) ?? base.preferredFormat,
    preferredHours: answers.hours ?? base.preferredHours,
    language: answers.language ?? base.language,
  };
}
