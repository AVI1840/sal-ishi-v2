/**
 * השירותים כפי שהאזרח רואה אותם: מחיר בשקלים (מהארנק וממך), כללי ביטול
 * בשפה פשוטה, ומועדים. הכל נגזר מהקטלוג המאושר ומההגדרות. ההמלצה היא של
 * מנוע ההתאמה הקיים (suggestByDomain), כאן רק מסדרים אותה לפי מה שחשוב לאזרח.
 */

import { catalogState } from "@/data/catalogSource";
import { realServices, servesNeighborhood, type RealService } from "@/data/realServices";
import type { PersonalProfile } from "@/data/types";
import { suggestByDomain } from "@/lib/suggestions";
import type { Booking } from "./model";
import { appSettings } from "./settings";

const settings = () => catalogState.seed.settings;

/** נקודות לשקלים לפי ההגדרות (points_per_shekel). */
export const toShekel = (points: number) => Math.round(points / (settings().points_per_shekel || 1));

export const monthlyWalletShekel = () => toShekel(settings().personal_wallet);

export function serviceById(id: string): RealService | undefined {
  return realServices.find((s) => s.id === id);
}

export function servicesFor(neighborhood: string): RealService[] {
  return realServices.filter((s) => servesNeighborhood(s, neighborhood));
}

export interface Price {
  total: number;
  covered: number;
  copay: number;
  /** סל משלים בלבד (תוספת 3): מי עוד מממן וכמה. */
  funder: string | null;
  otherPays: number;
  state: NonNullable<RealService["complementState"]>;
  /** החלוקה עוד לא נקבעה בקטלוג. */
  unknown: boolean;
}

export function priceOf(s: RealService): Price {
  const total = toShekel(s.pricePoints ?? 0);
  const extra = { funder: s.otherFunderName ?? null, otherPays: toShekel(s.otherPaysPoints ?? 0), state: s.complementState ?? "none" } as const;
  if (extra.state === "full") return { total, covered: 0, copay: 0, unknown: false, ...extra };
  if (s.coveredPoints === null && s.copayPoints === null) return { total, covered: total, copay: 0, unknown: true, ...extra };
  if (typeof s.coveredPoints === "number" && typeof s.copayPoints === "number") {
    return { total, covered: toShekel(s.coveredPoints), copay: toShekel(s.copayPoints), unknown: false, ...extra };
  }
  const copay = Math.round(total * (s.copayRate ?? 0));
  return { total, covered: total - copay, copay, unknown: false, ...extra };
}

export const isProduct = (s: RealService) => s.coreCategoryId === "prevention_products" || s.unit === "מוצר";
/** שירות שהמפעיל מתאם איתו מועד (בבית, פרטני, מרחוק), ולא מועד קבוע בקבוצה. */
export const isCoordinated = (s: RealService) => !isProduct(s) && s.serviceMode !== "group";

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * עד שלושה מועדים קרובים לשירות קבוצתי. בהדגמה הם נגזרים מהמזהה, כדי שיהיו
 * קבועים בין הרצות. בפיילוט מערכת השעות מגיעה מהספק.
 */
export function slotsFor(s: RealService, now = new Date(), max = 3): string[] {
  if (isProduct(s) || isCoordinated(s)) return [];
  const h = hash(s.id);
  const days = [h % 5, (h + 2) % 5].map((d) => d); // ראשון עד חמישי
  const hour = [9, 10, 11, 16, 17][h % 5];
  const out: string[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  for (let i = 1; out.length < max && i < 30; i++) {
    const day = new Date(d.getTime() + i * 86400000);
    if (days.includes(day.getDay())) {
      day.setHours(hour, h % 2 ? 30 : 0);
      out.push(day.toISOString());
    }
  }
  return out;
}

export interface CancelRule {
  /** שעות הודעה מראש. null: לא נקבע. */
  noticeHours: number | null;
  /** האם ביטול מאוחר או אי-הגעה מחויבים. */
  charged: boolean;
  /** הכלל עוד בהצעה. */
  proposal: boolean;
}

export function cancelRuleOf(s: RealService): CancelRule {
  const st = settings() as unknown as Record<string, { status?: string } | undefined>;
  const proposal = [st.cancellation_notice_hours, st.no_show_charge_rule].some((v) => String(v?.status ?? "").startsWith("proposal"));
  return { noticeHours: s.cancellationNoticeHours ?? null, charged: s.noShowCharged === true, proposal };
}

/** ביטול מאוחר מחויב: בתוך חלון ההודעה, ורק בשירות שאי-הגעה בו מחויבת. */
export function lateCancelCharged(b: Booking, s: RealService | undefined, now = new Date()): boolean {
  if (!s || !b.slot) return false;
  const rule = cancelRuleOf(s);
  if (!rule.charged || rule.noticeHours === null) return false;
  return new Date(b.slot).getTime() - now.getTime() < rule.noticeHours * 3600000;
}

// ── שמור ונוצל ──────────────────────────────────────────────
// מודל החשכ"ל: משלמים על נוכחות מדווחת. בהזמנה הסכום "שמור" בארנק, ואחרי
// דיווח הספק הוא "נוצל". במנוי חודשי: הסכום לחודש מתחלק למפגשים. היתרה נגזרת
// מהאירועים בלבד: אין סכום פתיחה בקוד.

/** כמה נוצל בפועל מהזמנה אחת, לפי הנוכחות שדווחה. */
export function usedOf(b: Booking): number {
  const attended = b.attendedSessions ?? 0;
  if (attended <= 0) return 0;
  if (b.mode === "subscription") {
    const per = b.coveredShekel / (b.sessionsPerMonth ?? sessionsPerMonth());
    return Math.min(b.coveredShekel, Math.round(per * attended));
  }
  return b.coveredShekel;
}

export interface WalletState {
  total: number;
  /** נקודות שהתווספו מתמריצים החודש. */
  bonus: number;
  /** שמור: הוזמן, עוד לא דווחה נוכחות. */
  reserved: number;
  /** נוצל: נוכחות מדווחת, או ביטול מאוחר שמחויב. */
  used: number;
  left: number;
}

export function walletOf(bookings: Booking[], incentives: { citizenId: string; points: number; at: string }[], citizenId: string, now = new Date()): WalletState {
  const month = now.toISOString().slice(0, 7);
  const total = monthlyWalletShekel();
  const bonus = incentives.filter((i) => i.citizenId === citizenId && i.at.slice(0, 7) === month).reduce((n, i) => n + i.points, 0);
  let reserved = 0;
  let used = 0;
  for (const b of bookings) {
    if (b.citizenId !== citizenId || b.createdAt.slice(0, 7) !== month) continue;
    const u = usedOf(b);
    if (b.status === "cancelled") {
      // ביטול: מה שנוצל נשאר נוצל. ביטול מאוחר מחויב: גם השאר.
      used += b.charged ? b.coveredShekel : u;
      continue;
    }
    used += u;
    reserved += Math.max(0, b.coveredShekel - u);
  }
  return { total, bonus, reserved, used, left: Math.max(0, total + bonus - reserved - used) };
}

/** תאימות: כמה יצא מהארנק החודש (שמור ונוצל). */
export function spentThisMonth(bookings: Booking[], citizenId: string, _baseline = 0, now = new Date()): number {
  const w = walletOf(bookings, [], citizenId, now);
  return w.reserved + w.used;
}

// ── תמחור לאזרח ─────────────────────────────────────────────

/** מפגשים בחודש במנוי (ברירת מחדל: פעם בשבוע). מההגדרות. */
export const sessionsPerMonth = () => appSettings.pricing?.sessions_per_month_default ?? 4;

/** שירות רציף שמוזמן כמנוי חודשי: יחידת המחיר היא חודש. */
export const isSubscription = (s: RealService) => !isProduct(s) && (appSettings.pricing?.subscription_units ?? ["חודש"]).includes(s.unit ?? "");

const UNIT_PREP: Record<string, string> = {
  מפגש: "למפגש",
  סבב: "לסבב מפגשים",
  סדנה: "לסדנה",
  ביקור: "לביקור",
  כרטיס: "לכרטיס",
  סיור: "לסיור",
  שובר: "לשובר",
  טיפול: "לטיפול",
  מוצר: "",
};

/** "84 נקודות בחודש, כ-4 מפגשים" או "74 נקודות למפגש". */
export function priceLabel(s: RealService, amount: (n: number) => string, short = false): string {
  const p = priceOf(s);
  if (p.state === "full") return "";
  if (p.unknown) return short ? "המחיר בבדיקה" : `המחיר ${amount(p.total)}${isSubscription(s) ? " בחודש" : ""}. כמה ממנו מהארנק עוד לא נקבע.`;
  const base = amount(p.covered);
  const copay = !p.unknown && p.copay > 0 ? ` + ₪${p.copay} ממך` : "";
  // "כ-4 מפגשים" רק בשירות קבוצתי. ארוחה או משלוח הביתה: בחודש בלבד.
  if (isSubscription(s)) return short || s.serviceMode !== "group" ? `${base} בחודש${copay}` : `${base} בחודש${copay}, כ-${sessionsPerMonth()} מפגשים`;
  const prep = UNIT_PREP[s.unit ?? ""] ?? (s.unit ? `ל${s.unit}` : "");
  return `${base}${prep ? ` ${prep}` : ""}${copay}`;
}

/** סדר התחומים לפי מה שהאזרח אמר שחשוב לו. */
export const INTEREST_DOMAINS = ["belonging", "health_function", "prevention_products", "resilience", "digital"] as const;
export type Domain = (typeof INTEREST_DOMAINS)[number];

/**
 * ההמלצה: הטוב ביותר מכל תחום לפי מנוע ההתאמה, כשהתחומים שהאזרח בחר
 * קודם. שירות שכבר הוזמן לא מוצע שוב.
 */
export function recommend(profile: PersonalProfile, interests: string[], exclude: Set<string>, walletLeft?: number): RealService[] {
  const domains = suggestByDomain(profile, profile.neighborhood, { walletLeft });
  const order = (id: string) => {
    const i = interests.indexOf(id);
    return i === -1 ? 100 + domains.findIndex((d) => d.domainId === id) : i;
  };
  const sorted = [...domains].sort((a, b) => order(a.domainId) - order(b.domainId));
  const out: RealService[] = [];
  const seen = new Set<string>();
  for (let round = 0; round < 3; round++) {
    for (const d of sorted) {
      const item = d.items.filter((x) => !exclude.has(x.service.id) && !seen.has(x.service.id))[0];
      if (item && (round === 0 || interests.length === 0 || interests.includes(d.domainId) || round > 1)) {
        out.push(item.service);
        seen.add(item.service.id);
      }
    }
  }
  return out;
}
