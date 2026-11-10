/**
 * גרסת הבנייה של הכלי.
 *
 * - preview (ברירת מחדל): גרסת תצוגה לשותפים. בלי שכבות ההאקתון, בלי צ'אט.
 * - pilot: גרסת פיילוט. כמו preview, בלי באנרים של תצוגה.
 * - hackathon: ההדגמה המקורית, עם הסיור האוטומטי, עמודי ההאקתון והפרוטוטייפ הלאומי.
 * - booth: הדוכן בכנס (ראו IS_BOOTH).
 *
 * הצ'אט לאזרח נדלק רק במפורש (VITE_CITIZEN_CHAT=on), כי התשובות בו כתובות
 * מראש ואסור להציג אותן כ-AI למשתמשים אמיתיים (החלטה D4).
 */

type Edition = "preview" | "pilot" | "hackathon" | "booth";

const raw = import.meta.env.VITE_EDITION;
export const EDITION: Edition = raw === "pilot" || raw === "hackathon" || raw === "booth" ? raw : "preview";

export const SHOW_DEMO_LAYERS = EDITION === "hackathon";

/**
 * booth: גרסת הדוכן בכנס. אותו מוצר, בשכבת עטיפה: כניסה לפי תפקיד, סיורים מודרכים,
 * קיוסק והגדלה. כל שינוי בגרסה הזו עטוף ב-IS_BOOTH, ואין לו השפעה על שאר הגרסאות.
 */
export const IS_BOOTH = EDITION === "booth";
if (IS_BOOTH && typeof document !== "undefined") document.documentElement.dataset.edition = "booth";
export const CITIZEN_CHAT_ENABLED = import.meta.env.VITE_CITIZEN_CHAT === "on";
