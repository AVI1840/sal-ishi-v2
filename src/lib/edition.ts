/**
 * גרסת הבנייה של הכלי.
 *
 * - preview (ברירת מחדל): גרסת תצוגה לשותפים. בלי שכבות ההאקתון, בלי צ'אט.
 * - pilot: גרסת פיילוט. כמו preview, בלי באנרים של תצוגה.
 * - hackathon: ההדגמה המקורית, עם הסיור האוטומטי, עמודי ההאקתון והפרוטוטייפ הלאומי.
 *
 * הצ'אט לאזרח נדלק רק במפורש (VITE_CITIZEN_CHAT=on), כי התשובות בו כתובות
 * מראש ואסור להציג אותן כ-AI למשתמשים אמיתיים (החלטה D4).
 */

type Edition = "preview" | "pilot" | "hackathon";

const raw = import.meta.env.VITE_EDITION;
export const EDITION: Edition = raw === "pilot" || raw === "hackathon" ? raw : "preview";

export const SHOW_DEMO_LAYERS = EDITION === "hackathon";
export const CITIZEN_CHAT_ENABLED = import.meta.env.VITE_CITIZEN_CHAT === "on";
