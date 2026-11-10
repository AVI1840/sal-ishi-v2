/**
 * הסיורים. כל תחנה מצביעה על מסך אמיתי של המוצר. כללי הניסוח: כותרת עד 5 מילים, טקסט עד 14 מילים,
 * לשון רבים (בלי צורות עם לוכסן), "המלצה, והבחירה של האדם".
 *
 * סיור מקוצר (ברירת מחדל): שלוש מערכות של כחצי דקה, בחוט אחד: שרה בוחרת, רונית מאשרת, והמטה רואה.
 * סיור מלא: הגרסה הארוכה, רק במצב מציג, לשיחה עמוקה.
 */
import { appSettings } from "@/pilot/settings";
import { decideBySupplier, getPilot } from "@/pilot/store";
import { awaitsSupplier } from "@/pilot/services";
import type { Step } from "./tourEngine";
import { booth, type BoothState, type TourLens } from "./store";
import { latestPickedName } from "./dayBoard";

const CONFIRM = /לאשר את ההזמנה|לשלוח בקשה לספק/;

function pendingSupplier() {
  const id = appSettings.citizen.persona_id;
  return getPilot().derived.bookings.filter((b) => b.citizenId === id && awaitsSupplier(b));
}

/** האם יש קול עברי להקראה. כשהרשימה ריקה (עוד נטענת) מניחים שיש. */
export function hasHebrewVoice(): boolean {
  try {
    const v = window.speechSynthesis?.getVoices?.() ?? [];
    return v.length === 0 || v.some((x) => x.lang.toLowerCase().startsWith("he"));
  } catch {
    return false;
  }
}

const pickedName = (): string | null => {
  const s = booth.get();
  return s.picked ?? latestPickedName(s.baseline);
};

const supplierAction: Step["action"] = {
  label: "אישור ספק (הדמיה)",
  show: () => pendingSupplier().length > 0,
  run: () => {
    for (const b of pendingSupplier()) decideBySupplier({ citizenId: b.citizenId, bookingId: b.id, decision: "approved" });
  },
};

const challengeStep: Step = {
  route: "/booth/challenge",
  compact: true,
  title: "האתגר",
  text: "406 אלף מקבלי גמלה, 22.6 מיליארד ש\"ח בשנה, ויותר מ-10 גופים סביב האזרח.",
};
const resultsStep: Step = {
  route: "/booth/results",
  compact: true,
  title: "מה קרה בפיילוט",
  text: "קשרים חברתיים מ-38% ל-94%, פעילות גופנית מ-30% ל-73%. מחקר הערכה חיצוני.",
};
const scaleStep: Step = {
  route: "/booth/scale",
  compact: true,
  title: "איך מרחיבים",
  text: "הזיזו את המחוון: מירושלים, דרך שש רשויות, ועד היקף ארצי.",
  target: [{ css: "[data-booth-scale]" }],
};

// ───────────────────────── סיור מקוצר ─────────────────────────

const pickStep: Step = {
  route: "/citizen",
  title: "בחרו שירות לשרה",
  text: "שרה, 78, ו-500 נקודות בחודש. געו בשירות שמדבר אליכם.",
  target: [{ css: "a[href*='/citizen/services/']" }],
  advance: { click: [{ css: "a[href*='/citizen/services/']" }], route: /\/citizen\/services\/.+/ },
};
const whyStep: Step = {
  title: "למה זה מתאים לה",
  text: "כל המלצה מגיעה עם הסיבה: מה חשוב לה, מה קרוב ונוח.",
  target: [{ text: /למה זה מתאים לך/ }],
};
const joinStep: Step = {
  title: "מצטרפים בכמה נגיעות",
  text: "בחרו מועד ואשרו. כלל הביטול כתוב בעברית פשוטה.",
  target: [
    { text: CONFIRM },
    { text: /לבדוק ולאשר|לבדוק ולשלוח בקשה/ },
    { css: "label:has(input[type='radio']:not(:checked))" },
    { text: /^להזמין|לבקש להצטרף/ },
  ],
  advance: { click: [{ text: CONFIRM }] },
};

const citizenShort: Step[] = [
  pickStep,
  whyStep,
  joinStep,
  {
    route: "/booth/week",
    compact: true,
    title: "השבוע של שרה השתנה",
    text: () => {
      const n = pickedName();
      return n ? `לצד הסיוע בבית נוסף ${n}. רונית כבר רואה את זה.` : "לצד הסיוע בבית נוסף עוד משהו משלה.";
    },
    action: supplierAction,
  },
];

const approveStep: Step = {
  route: "/coordinator",
  title: () => (booth.get().picked ? "הבקשה של שרה" : "מי דורש פנייה היום"),
  text: () => {
    const n = booth.get().picked;
    return n ? `שרה ביקשה להצטרף ל${n}. אשרו בשלוש נגיעות, עם סיבה.` : "76 אנשים בתיק, ממוינים לפי כללים. אשרו בקשה בשלוש נגיעות.";
  },
  target: [{ text: /לאשר ולתעד/ }, { css: "label:has(input[type='radio']:not(:checked))" }, { text: /^לאשר$/ }],
  advance: { click: [{ text: /לאשר ולתעד/ }] },
};
const pictureStep: Step = {
  route: "/coordinator/patients/c1",
  title: "התמונה המלאה של שרה",
  text: "מה חשוב לה, מה מעכב אותה, ואיזה שירות מתאים.",
  target: [{ text: /חסמים מזוהים/ }],
};
const gapStep: Step = {
  route: "/coordinator/community",
  title: "מה יש בשכונה, ואיפה פער",
  text: "אותם כללים שהמטה רואה. כך המלווה יודעת מה להציע.",
  target: [{ text: /מה יש בכל תחום/ }],
};

const companionShort: Step[] = [approveStep, pictureStep, gapStep];

const boardStep: Step = {
  route: "/booth/board",
  compact: true,
  title: "הבחירה שלכם בלוח החי",
  text: "כל סל נספר לפי תחום, בלי פרטים אישיים.",
};

const hqShort = (s: Pick<BoothState, "order">): Step[] => [
  ...(s.order[0] === "hq" ? [challengeStep] : []),
  boardStep,
  {
    route: "/booth/agents",
    compact: true,
    title: "מי עבד על הבחירה הזו",
    text: "חמישה סוכנים, ואדם מחליט. היום רצים כללים.",
  },
  scaleStep,
  resultsStep,
];

const judges: Step[] = [
  challengeStep,
  resultsStep,
  {
    route: "/citizen",
    title: "המוצר חי: געו בהמלצה",
    text: "זה לא מצגת. געו בשירות שמומלץ לשרה.",
    target: [{ css: "a[href*='/citizen/services/']" }],
    advance: { click: [{ css: "a[href*='/citizen/services/']" }], route: /\/citizen\/services\/.+/ },
  },
  {
    title: "ההמלצה מגיעה עם הסיבה",
    text: "כל המלצה מוסברת, והבחירה של האדם.",
    target: [{ text: /למה זה מתאים לך/ }],
  },
  scaleStep,
  { route: "/booth/ready", compact: true, title: "מה קיים ומה בדרך", text: "רק עובדות מאושרות: מה עובד היום, ומה נבנה עם שותפים." },
];

// ───────────────────────── סיור מלא (מצב מציג) ─────────────────────────

const citizenFull: Step[] = [
  {
    route: "/citizen",
    title: "השוק של שרה",
    text: "שישה נושאים ו-59 שירותים בשכונה, מסודרים לפי מה שחשוב לה.",
    target: [{ text: /^לפי נושא$/ }],
  },
  {
    route: "/citizen",
    title: () => (hasHebrewVoice() ? "כל מסך מוקרא" : "אפשר להגדיל את הטקסט"),
    text: () => (hasHebrewVoice() ? "אפשר להקריא את המסך, להגדיל טקסט ולהגביר ניגודיות. געו ב\"להקריא\"." : "אפשר להגדיל טקסט ולהגביר ניגודיות. געו ב\"א+\"."),
    target: [{ text: /^להקריא/ }, { css: "button[aria-label^='הגדלת טקסט']" }],
    advance: { click: [{ text: /^להקריא/ }, { css: "button[aria-label^='הגדלת טקסט']" }] },
  },
  pickStep,
  whyStep,
  joinStep,
  {
    route: "/citizen/activities",
    title: () => {
      const n = pickedName();
      return n ? `שרה תצטרף ל${n}` : "ההרשמה נשמרה";
    },
    text: "הארנק התעדכן והמלווה רואה זאת. בכל מסך יש \"שיחזרו אליי\".",
    target: [{ text: /ההרשמות שלי/ }],
    action: supplierAction,
  },
];

const companionFull: Step[] = [
  {
    route: "/coordinator",
    title: "מי דורש פנייה היום",
    text: "76 אנשים בתיק, ממוינים לפי הכללים. המלווה והאדם מחליטים.",
    target: [{ text: /^לפנות היום$/ }],
  },
  approveStep,
  pictureStep,
  {
    title: "מה יעזור לצאת מהבית",
    text: "בכל נושא יש כפתור \"הצע\": המלווה מציעה, והאדם בוחר.",
    target: [{ text: /^תוכנית אישית$/ }],
    advance: { click: [{ text: /^תוכנית אישית$/ }] },
  },
  {
    route: "/coordinator/patients/c1/review",
    title: "אחרי חודש: מה עבד",
    text: "עבד, עבד חלקית או להחליף. שינוי אחד בחודש.",
    target: [{ text: /^להחליף$/ }],
    advance: { click: [{ text: /^להחליף$/ }] },
  },
  gapStep,
  {
    route: "/coordinator",
    title: "כלים, ידע וחיבורים",
    text: "קופת חולים, רווחה, ביטוח לאומי ומתנ\"ס: מלווה אחת מלווה יותר אנשים.",
  },
];

const hqFull: Step[] = [
  challengeStep,
  boardStep,
  {
    route: "/executive/catalog",
    title: "קטלוג בבעלות המדינה",
    text: "המדינה מחזיקה קטלוג, כללים ונתונים. כל פער בשטח מסומן.",
    target: [{ text: /ספריית הסל מול השטח/ }],
  },
  scaleStep,
  resultsStep,
];

export const FULL_TOURS: Record<TourLens, Step[]> = { citizen: citizenFull, companion: companionFull, hq: hqFull, judges };
/** כל הסיורים בשתי הצורות, לבדיקות. */
export const ALL_TOURS: Step[][] = [citizenShort, companionShort, hqShort({ order: ["hq"] }), hqShort({ order: ["citizen"] }), judges, ...Object.values(FULL_TOURS)];

/** הסיור של מערכת, לפי מצב החוט. */
export function tourFor(lens: TourLens, s: BoothState): Step[] {
  if (lens === "judges") return judges;
  if (s.full) return FULL_TOURS[lens];
  return lens === "citizen" ? citizenShort : lens === "companion" ? companionShort : hqShort(s);
}
