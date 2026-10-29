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
  /** החלוקה עוד לא נקבעה בקטלוג. */
  unknown: boolean;
}

export function priceOf(s: RealService): Price {
  const total = toShekel(s.pricePoints ?? 0);
  if (s.coveredPoints === null && s.copayPoints === null) return { total, covered: total, copay: 0, unknown: true };
  if (typeof s.coveredPoints === "number" && typeof s.copayPoints === "number") {
    return { total, covered: toShekel(s.coveredPoints), copay: toShekel(s.copayPoints), unknown: false };
  }
  const copay = Math.round(total * (s.copayRate ?? 0));
  return { total, covered: total - copay, copay, unknown: false };
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

/** כמה כבר יצא מהארנק החודש: בסיס ההדגמה ועוד ההזמנות הפעילות. */
export function spentThisMonth(bookings: Booking[], citizenId: string, baseline: number, now = new Date()): number {
  const month = now.toISOString().slice(0, 7);
  return (
    baseline +
    bookings
      .filter((b) => b.citizenId === citizenId && b.createdAt.slice(0, 7) === month)
      .filter((b) => b.status !== "cancelled" || b.charged)
      .reduce((sum, b) => sum + b.coveredShekel, 0)
  );
}

/** סדר התחומים לפי מה שהאזרח אמר שחשוב לו. */
export const INTEREST_DOMAINS = ["belonging", "health_function", "prevention_products", "resilience", "digital"] as const;
export type Domain = (typeof INTEREST_DOMAINS)[number];

/**
 * ההמלצה: הטוב ביותר מכל תחום לפי מנוע ההתאמה, כשהתחומים שהאזרח בחר
 * קודם. שירות שכבר הוזמן לא מוצע שוב.
 */
export function recommend(profile: PersonalProfile, interests: string[], exclude: Set<string>): RealService[] {
  const domains = suggestByDomain(profile, profile.neighborhood);
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
