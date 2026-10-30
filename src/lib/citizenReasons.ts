/**
 * "למה זה מתאים לך" בשפה של האזרח. ההסברים של מנוע ההתאמה כתובים למלווה
 * ("גורם סיכון", "ירידה תפקודית", "מצב תפקודי"). מול האזרח לא מציגים תיוג,
 * ציון או נקודות: מתרגמים לשפה חיובית, ומשמיטים מה שנועד לבדיקה פנימית.
 */

const MAP: [RegExp, string | null][] = [
  [/רמת הסיכון/, "עוזר לשמור על הבריאות והעצמאות"],
  [/בדידות/, "הזדמנות להיפגש עם אנשים"],
  [/ירידה תפקודית|שמירה על תפקוד/, "עוזר לשמור על הגוף חזק"],
  [/מצב תפקודי|רמת העצמאות|ליכולות שלך/, "מותאם למה שנוח לך"],
  [/שפה לא ודאית/, null],
  [/^מתאים למוטיבציה: /, ""],
  [/^מתאים לתחום עניין: /, "מתאים למה שמעניין אותך: "],
  [/^שירות ביתי.*/, "מגיע אלייך הביתה"],
  [/^מגיע אליך הביתה$/, "מגיע אלייך הביתה"],
  [/^נכנס בסל של החודש$/, "נכנס בסל שלך החודש"],
];

const LONG_DASH = String.fromCharCode(0x2014);

export function citizenReason(reason: string): string | null {
  let text = reason.split(LONG_DASH).map((t) => t.trim()).join(": ").replace(/ - .*$/, "").trim();
  for (const [re, out] of MAP) {
    if (!re.test(text)) continue;
    if (out === null) return null;
    text = out.endsWith(": ") || out === "" ? text.replace(re, out) : out;
    break;
  }
  return text || null;
}

/** הסיבות בשפת האזרח, בלי כפילויות. */
export function citizenReasons(reasons: string[]): string[] {
  const out: string[] = [];
  for (const r of reasons) {
    const t = citizenReason(r);
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}
