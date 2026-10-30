/**
 * נקודת ההתחלה של ההדגמה: כמה אירועים בדויים, כדי שהמלווה תראה תיק חי
 * (בקשה לשיחה, בקשה לשירות מותנה, אשפוז) ולשרה תהיה פעילות אחת קיימת, עם
 * נוכחות מדווחת. היתרה בארנק נגזרת מהאירועים האלה בלבד. התאריכים יחסיים להיום,
 * והנוכחות תמיד בחודש הנוכחי, כך שהמספרים זהים גם בתחילת חודש.
 * רק ב-mode: demo, ופעם אחת אחרי כל איפוס.
 */

import { isSubscription, priceOf, serviceById, sessionsPerMonth, slotsFor } from "./services";
import type { PilotEvent } from "./model";
import { isDemo } from "./settings";
import { getPilot, newId, replaceEvents } from "./store";

const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
/** כמו ago, אבל לא לפני תחילת החודש: הנוכחות של שרה נספרת בחודש של ההדגמה, בכל תאריך. */
const agoThisMonth = (hours: number) => {
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  return new Date(Math.max(Date.now() - hours * 3600000, Math.min(monthStart + 60000, Date.now()))).toISOString();
};

export function seedDemo(): void {
  if (!isDemo() || getPilot().state.seeded) return;
  const events: PilotEvent[] = [];
  const club = serviceById("demoj-club");
  if (club) {
    // שרה חברה במועדון השכונתי (מנוי חודשי), והספק דיווח על שני מפגשים: חצי שמור, חצי נוצל.
    const price = priceOf(club);
    const bookingId = newId("bk");
    events.push({
      id: newId("ev"), at: ago(72), actor: "citizen", citizenId: "c1", synced: true,
      type: "booking.created", bookingId, serviceId: club.id, serviceName: club.name,
      slot: slotsFor(club)[0] ?? null, coveredShekel: price.covered, copayShekel: price.copay,
      mode: isSubscription(club) ? "subscription" : "single", sessionsPerMonth: sessionsPerMonth(),
    });
    events.push({ id: newId("ev"), at: agoThisMonth(48), actor: "system", citizenId: "c1", synced: true, type: "attendance.reported", bookingId, sessions: 2 });
  }
  // רונית סימנה ששרה מתאימה להעביר חוג (שירה): ההצעה "לתת לקהילה" מוצגת לה.
  events.push({ id: newId("ev"), at: ago(96), actor: "companion", citizenId: "c1", synced: true, type: "incentive.eligibility", roles: ["teach"] });
  events.push({ id: newId("ev"), at: ago(3), actor: "citizen", citizenId: "p004", synced: true, type: "request.created", requestId: newId("rq"), kind: "callback" });
  const care = serviceById("demoj-care");
  if (care) {
    events.push({ id: newId("ev"), at: ago(20), actor: "citizen", citizenId: "p017", synced: true, type: "request.created", requestId: newId("rq"), kind: "gated_service", serviceId: care.id, serviceName: care.name });
  }
  events.push({ id: newId("ev"), at: ago(40), actor: "companion", citizenId: "p032", synced: true, type: "hospitalization.started", note: "דווח על ידי בת המשפחה" });
  replaceEvents(events, true);
}
