/**
 * נקודת ההתחלה של ההדגמה: כמה אירועים בדויים, כדי שהמלווה תראה תיק חי
 * (בקשה לשיחה, בקשה לשירות מותנה, אשפוז) ולשרה תהיה פעילות אחת קיימת.
 * רק ב-mode: demo, ופעם אחת אחרי כל איפוס.
 */

import { serviceById, priceOf, slotsFor } from "./services";
import type { PilotEvent } from "./model";
import { isDemo } from "./settings";
import { getPilot, newId, replaceEvents } from "./store";

const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

export function seedDemo(): void {
  if (!isDemo() || getPilot().state.seeded) return;
  const events: PilotEvent[] = [];
  const club = serviceById("demoj-club");
  if (club) {
    const price = priceOf(club);
    events.push({
      id: newId("ev"), at: ago(72), actor: "citizen", citizenId: "c1", synced: true,
      type: "booking.created", bookingId: newId("bk"), serviceId: club.id, serviceName: club.name,
      slot: slotsFor(club)[1] ?? null, coveredShekel: price.covered, copayShekel: price.copay,
    });
  }
  events.push({ id: newId("ev"), at: ago(3), actor: "citizen", citizenId: "p004", synced: true, type: "request.created", requestId: newId("rq"), kind: "callback" });
  const care = serviceById("demoj-care");
  if (care) {
    events.push({ id: newId("ev"), at: ago(20), actor: "citizen", citizenId: "p017", synced: true, type: "request.created", requestId: newId("rq"), kind: "gated_service", serviceId: care.id, serviceName: care.name });
  }
  events.push({ id: newId("ev"), at: ago(40), actor: "companion", citizenId: "p032", synced: true, type: "hospitalization.started", note: "דווח על ידי בת המשפחה" });
  replaceEvents(events, true);
}
