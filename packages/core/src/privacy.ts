// שמירה על הקווים האדומים: חסימת עמודות מזהות בייבוא, הצגת תאים קטנים,
// וסריקה של אובייקט לפני ייצוא כדי לוודא שאין בו שדות אסורים.

import type { Settings } from "./seed";

/** מספר קטן מסף התא הקטן מוצג כ-"<5". */
export function formatCount(n: number, settings: Pick<Settings, "small_cell_threshold">): string {
  return n < settings.small_cell_threshold ? `<${settings.small_cell_threshold}` : String(n);
}

// כותרות שחוסמות קובץ אם הן מופיעות כמילה שלמה בכותרת עמודה.
const IDENTIFYING_TERMS = [
  "תז",
  "ת ז",
  "זהות",
  "שם פרטי",
  "שם משפחה",
  "משפחה",
  "טלפון",
  "נייד",
  "כתובת",
  "דואל",
  "מייל",
  "teudat zehut",
  "id number",
  "first name",
  "last name",
  "full name",
  "phone",
  "mobile",
  "address",
  "email",
];

// כותרות שחוסמות רק כשהן כל הכותרת. "שם השירות" ו"שם הספק" מותרים, "שם" לבד לא.
const IDENTIFYING_EXACT = ["שם", "שם מלא", "name", "id", "tz"];

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/["'׳״`]/g, "")
    .replace(/[_\-./\\:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** מחזיר את הכותרות שנראות מזהות. רשימה לא ריקה פירושה שהקובץ נחסם. */
export function detectIdentifyingColumns(headers: readonly string[]): string[] {
  return headers.filter((raw) => {
    const h = normalizeHeader(String(raw ?? ""));
    if (!h) return false;
    if (IDENTIFYING_EXACT.includes(h)) return true;
    const padded = ` ${h} `;
    return IDENTIFYING_TERMS.some((term) => padded.includes(` ${term} `));
  });
}

export function identifyingColumnsMessage(columns: readonly string[]): string {
  return `הקובץ נחסם: יש בו עמודות שנראות כמו מידע מזהה של תושבים (${columns.join(", ")}). מחקו אותן ונסו שוב. נכנסים רק נתונים מצטברים.`;
}

// שמות שדות של תושב שאסור שיופיעו בשום חבילה או ייצוא.
export const RESIDENT_FIELD_KEYS = [
  "personId",
  "residentId",
  "citizenId",
  "teudatZehut",
  "idNumber",
  "tz",
  "firstName",
  "lastName",
  "fullName",
  "birthDate",
  "dateOfBirth",
  "address",
  "residentPhone",
] as const;

// בנוסף, בייצוא לאינטגרטור ובקטלוג לאזרח אסורים פרטי קשר והערות פנימיות.
export const EXPORT_FORBIDDEN_KEYS = [
  ...RESIDENT_FIELD_KEYS,
  "contact",
  "phone",
  "email",
  "displayName",
  "committeeNote",
  "unitPrice",
  "marketPrice",
  "uniqueParticipants",
  "sessions",
  "walletSpent",
] as const;

/** מחזיר נתיבים לכל מפתח אסור שנמצא באובייקט, בכל עומק. */
export function findForbiddenKeys(value: unknown, forbidden: readonly string[], path = "$"): string[] {
  const hits: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => hits.push(...findForbiddenKeys(v, forbidden, `${path}[${i}]`)));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (forbidden.includes(k)) hits.push(`${path}.${k}`);
      hits.push(...findForbiddenKeys(v, forbidden, `${path}.${k}`));
    }
  }
  return hits;
}
