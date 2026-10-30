/**
 * תיק העבודה של המלווה ומיון "מי דורש פנייה היום".
 *
 * הכללים הם הכללים הקיימים בהגדרות: מיצוי רבעוני מתחת ל-red_flag_avg,
 * יותר מ-first_service_max_days ימים בלי שירות ראשון, התראה בתת-תחום
 * (subarea_alerts, קוגניטיבי) ואשפוז. נוספות להם בקשות פתוחות של האזרח
 * (שיחזרו אליי, שירות מותנה). הסדר ביניהם ב-app-settings.json.
 *
 * בהדגמה התיק בדוי ונבנה ממחולל קבוע. בפיילוט הנתונים המצטברים (מיצוי,
 * ימים לשירות ראשון) מגיעים מדוח ספק העל, כמו מדדי החדירה במטה.
 */

import { catalogState } from "@/data/catalogSource";
import type { Derived, Request } from "./model";
import { appSettings, type TriageRule } from "./settings";

export interface CaseloadPerson {
  id: string;
  name: string;
  age: number;
  neighborhood: string;
  /** מיצוי רבעוני, 0 עד 1. */
  utilization: number;
  daysSinceEnrollment: number;
  firstServiceDone: boolean;
  cognitiveAlert: boolean;
  lastContactDays: number;
  /** השפה המועדפת לשיחה. */
  language: "עברית" | "ערבית" | "רוסית" | "אמהרית";
}

export interface TriageReason {
  rule: TriageRule;
  text: string;
  request?: Request;
}

export interface TriageItem {
  person: CaseloadPerson;
  reasons: TriageReason[];
  /** קטן יותר = דחוף יותר. */
  rank: number;
  bucket: "today" | "week" | "watch" | "ok";
}

const NAMES_HE = ["מרים", "יוסף", "רחל", "אברהם", "חנה", "משה", "אסתר", "דוד", "שושנה", "יעקב", "רבקה", "שמעון", "לאה", "אליהו", "זהבה", "חיים", "פנינה", "מרדכי", "תמר", "נסים", "ציפורה", "אהרון", "בתיה", "שלמה", "עליזה", "מאיר", "דבורה", "יצחק"];
const NAMES_AR = ["פאטמה", "מחמד", "עאישה", "אחמד", "מרים", "חסן", "זינב", "עלי", "נג'לא", "יוסף", "סמירה", "איברהים"];
const NAMES_RU = ["גלינה", "בוריס", "ולנטינה", "מיכאיל", "לודמילה", "ולדימיר", "טטיאנה", "יבגני"];
const INITIALS = "אבגדהזחטכלמנסעפצקרשת";

/** מחולל קבוע (mulberry32): אותו תיק בכל הרצה. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** האזרחית של ההדגמה, ראשונה בתיק. */
export const PERSONA_PERSON: CaseloadPerson = {
  id: "c1",
  name: "שרה כ.",
  age: 78,
  neighborhood: "פסגת זאב",
  utilization: 0.31,
  daysSinceEnrollment: 40,
  firstServiceDone: true,
  cognitiveAlert: false,
  lastContactDays: 9,
  language: "עברית",
};

/** שתי דמויות נוספות להדגמת סלים שונים (תוספת 3): פרופיל מלא ב-mockData. */
export const EXTRA_PERSONAS: CaseloadPerson[] = [
  { id: "c2", name: "אהרון מ.", age: 82, neighborhood: "פסגת זאב", utilization: 0.12, daysSinceEnrollment: 25, firstServiceDone: true, cognitiveAlert: false, lastContactDays: 14, language: "עברית" },
  { id: "c3", name: "יוסף כ.", age: 72, neighborhood: "פסגת זאב", utilization: 0.78, daysSinceEnrollment: 60, firstServiceDone: true, cognitiveAlert: false, lastContactDays: 20, language: "עברית" },
];

export function buildCaseload(size = appSettings.companion.caseload_size): CaseloadPerson[] {
  const r = rng(20261103);
  // מלווה עובדת בשכונה אחת: כל התיק בשכונה שלה (מההגדרות).
  const home = appSettings.companion.neighborhood ?? "פסגת זאב";
  const people: CaseloadPerson[] = [PERSONA_PERSON, ...EXTRA_PERSONAS];
  for (let i = 1; i < size; i++) {
    r(); // שומר על רצף המחולל (קבוע בין הרצות)
    const neighborhood = home;
    const arab = false;
    const ru = !arab && r() < 0.15;
    const pool = arab ? NAMES_AR : ru ? NAMES_RU : NAMES_HE;
    const name = `${pool[Math.floor(r() * pool.length)]} ${INITIALS[Math.floor(r() * INITIALS.length)]}.`;
    const daysSinceEnrollment = Math.floor(r() * 120) + 3;
    const firstServiceDone = daysSinceEnrollment > 30 ? r() > 0.08 : r() > 0.55;
    people.push({
      id: `p${String(i).padStart(3, "0")}`,
      name,
      age: 67 + Math.floor(r() * 26),
      neighborhood,
      utilization: firstServiceDone ? Math.round((0.15 + r() * 0.85) * 100) / 100 : 0,
      daysSinceEnrollment,
      firstServiceDone,
      cognitiveAlert: r() < 0.06,
      lastContactDays: Math.floor(r() * 35),
      language: arab ? "ערבית" : ru ? "רוסית" : r() < 0.04 ? "אמהרית" : "עברית",
    });
  }
  return people;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** הסיבות לפנות לאדם, לפי הכללים. */
export function reasonsFor(p: CaseloadPerson, derived: Derived): TriageReason[] {
  const s = catalogState.seed.settings;
  const out: TriageReason[] = [];
  if (derived.hospitalized.has(p.id)) out.push({ rule: "hospitalization", text: "באשפוז" });
  for (const req of derived.requests.filter((x) => x.citizenId === p.id && x.status === "open")) {
    if (req.kind === "callback") out.push({ rule: "callback", text: "ביקש/ה שיחזרו אליו/ה", request: req });
    else if (req.kind === "claim_help") out.push({ rule: "claim_task", text: `משימת מיצוי: ${req.serviceName ?? "הגשה למממן אחר"}${req.note ? ` (${req.note})` : ""}`, request: req });
    else out.push({ rule: "gated_request", text: `מחכה לאישור: ${req.serviceName ?? "שירות"}`, request: req });
  }
  if (p.cognitiveAlert) out.push({ rule: "cognitive_alert", text: "התראה בתחום הקוגניטיבי" });
  const maxDays = s.first_service_max_days ?? 14;
  if (!p.firstServiceDone && p.daysSinceEnrollment > maxDays) out.push({ rule: "no_first_service", text: `${p.daysSinceEnrollment} ימים בלי שירות ראשון (הכלל: עד ${maxDays})` });
  const red = s.red_flag_avg ?? 0.35;
  if (p.firstServiceDone && p.utilization < red) out.push({ rule: "low_utilization", text: `מיצוי ברבעון ${pct(p.utilization)} (מתחת ל-${pct(red)})` });
  return out;
}

const BUCKET: Record<TriageRule, TriageItem["bucket"]> = {
  hospitalization: "today",
  callback: "today",
  gated_request: "today",
  claim_task: "week",
  cognitive_alert: "week",
  no_first_service: "week",
  low_utilization: "watch",
};

/** מיון חכם: לפי הכלל הדחוף ביותר, ובתוכו לפי מספר הסיבות וזמן מאז הקשר האחרון. */
export function triage(people: CaseloadPerson[], derived: Derived, order: TriageRule[] = appSettings.companion.triage_order): TriageItem[] {
  return people
    .map((person) => {
      const reasons = reasonsFor(person, derived).sort((a, b) => order.indexOf(a.rule) - order.indexOf(b.rule));
      const top = reasons[0];
      const rank = top ? order.indexOf(top.rule) * 1000 - reasons.length * 100 - Math.min(person.lastContactDays, 99) : 100000;
      const bucket: TriageItem["bucket"] = top ? BUCKET[top.rule] : "ok";
      return { person, reasons, rank, bucket };
    })
    .sort((a, b) => a.rank - b.rank);
}

export const RULE_LABEL: Record<TriageRule, string> = {
  hospitalization: "אשפוז",
  callback: "שיחזרו אליי",
  gated_request: "ממתין לאישור",
  claim_task: "משימת מיצוי",
  cognitive_alert: "התראה קוגניטיבית",
  no_first_service: "בלי שירות ראשון",
  low_utilization: "מיצוי נמוך",
};
