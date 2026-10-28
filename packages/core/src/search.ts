// חיפוש חכם בעברית, דטרמיניסטי ובלי AI: נרמול (ניקוד, אותיות סופיות, גרשיים),
// אותיות שימוש בתחילת מילה (ו, ה, ב, ל, מ, ש, כ), מילים נרדפות וסבילות לשגיאת
// הקלדה. כל מילה בשאילתה צריכה להימצא באחד השדות.

const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const PREFIXES = ["ו", "ה", "ב", "ל", "מ", "ש", "כ"];

export function normalizeHebrew(text: string): string {
  return text
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ךםןףץ]/g, (c) => FINALS[c] ?? c)
    .replace(/["'`׳״]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeHebrew(text).split(" ").filter(Boolean);
}

/** הצורות של מילה בלי אות שימוש אחת או שתיים בתחילתה ("ולחוג" -> "לחוג", "חוג"). */
function stems(token: string): string[] {
  const out = [token];
  let t = token;
  for (let i = 0; i < 2 && t.length > 3 && PREFIXES.includes(t[0]!); i++) {
    t = t.slice(1);
    out.push(t);
  }
  return out;
}

// קבוצות של מילים נרדפות. מילה בשאילתה מתאימה לכל מילה בקבוצה שלה.
const SYNONYM_GROUPS: string[][] = [
  ["כושר", "ספורט", "התעמלות", "גופנית", "אימון", "תנועה"],
  ["הליכה", "צעידה"],
  ["שחיה", "בריכה", "מים", "הידרותרפיה"],
  ["ריקוד", "מחול", "ריקודים"],
  ["זיכרון", "זכרון", "קוגניטיבי", "קוגניטיבית", "מוח", "חשיבה"],
  ["מחשב", "סמארטפון", "טלפון", "נייד", "דיגיטל", "דיגיטלית", "אינטרנט", "אפליקציה", "אפליקציות", "טכנולוגיה", "וואטסאפ"],
  ["בדידות", "חברה", "חברתי", "חברתית", "מועדון", "קהילה", "קהילתי", "שייכות", "מפגש"],
  ["תזונה", "אוכל", "בישול", "ארוחה", "מזון"],
  ["שירה", "מוזיקה", "מקהלה", "נגינה", "שירים"],
  ["ציור", "אמנות", "יצירה", "חוג", "חוגים"],
  ["תמיכה", "רגשי", "רגשית", "נפשי", "נפשית", "אבל", "אובדן"],
  ["משפטי", "משפטית", "עורך", "דין", "זכויות", "מיצוי"],
  ["כסף", "תקציב", "פיננסי", "כלכלי", "כלכלית"],
  ["נפילה", "נפילות", "משקל", "יציבות", "בטיחות", "איזון"],
  ["טיול", "טיולים", "סיור", "סיורים"],
  ["התנדבות", "מתנדב", "מתנדבים", "תעסוקה", "עבודה"],
  ["שמיעה", "אוזן", "חושים"],
  ["ראיה", "ראייה", "משקפיים", "עיניים"],
  ["לחצן", "מצוקה", "חירום"],
  ["הרצאה", "הרצאות", "העשרה", "לימוד", "קורס", "שיעור"],
].map((g) => g.map(normalizeHebrew));

const SYNONYMS = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) for (const w of group) SYNONYMS.set(w, new Set([...(SYNONYMS.get(w) ?? []), ...group]));

/** מרחק עריכה מוגבל: מחזיר את המרחק, או max+1 כשהוא גדול ממנו. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

const allowedTypos = (len: number) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

/** כמה טוב מילה מהשאילתה מתאימה למילה בטקסט: 1 מדויק, 0.9 התחלה, 0.8 נרדפת, 0.6 שגיאת הקלדה. */
function tokenMatch(query: string, word: string): number {
  const qs = stems(query);
  const ws = stems(word);
  if (qs.some((q) => ws.includes(q))) return 1;
  if (qs.some((q) => q.length >= 3 && ws.some((w) => w.startsWith(q)))) return 0.9;
  if (qs.some((q) => ws.some((w) => SYNONYMS.get(q)?.has(w)))) return 0.8;
  if (qs.some((q) => ws.some((w) => editDistance(q, w, allowedTypos(Math.min(q.length, w.length))) <= allowedTypos(Math.min(q.length, w.length)) && allowedTypos(Math.min(q.length, w.length)) > 0))) return 0.6;
  return 0;
}

export interface SearchField {
  text: string;
  weight: number;
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

/**
 * מחזיר את הפריטים שכל מילה בשאילתה נמצאת בהם, מהמתאים ביותר. שאילתה ריקה
 * מחזירה את כל הפריטים בסדר המקורי.
 */
export function smartSearch<T>(items: readonly T[], query: string, fields: (item: T) => SearchField[]): SearchHit<T>[] {
  const qTokens = tokenize(query);
  if (!qTokens.length) return items.map((item) => ({ item, score: 0 }));
  const hits: SearchHit<T>[] = [];
  for (const item of items) {
    const fs = fields(item).map((f) => ({ words: tokenize(f.text), weight: f.weight }));
    let total = 0;
    let all = true;
    for (const q of qTokens) {
      let best = 0;
      for (const f of fs) for (const w of f.words) best = Math.max(best, tokenMatch(q, w) * f.weight);
      if (best === 0) {
        all = false;
        break;
      }
      total += best;
    }
    if (all) hits.push({ item, score: total });
  }
  return hits.sort((a, b) => b.score - a.score);
}
