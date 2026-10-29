/**
 * מודל הנתונים של חוויית האזרח והמלווה (גרסה 0.5).
 *
 * כל שינוי נרשם כאירוע (PilotEvent). המצב (הזמנות, בקשות, ביקורים) נגזר
 * מהאירועים, והאירועים הם גם יומן הביקורת וגם מה שעובר בסנכרון לספק.
 * הסכמות של האירועים והישויות ב-schema/pilot/. אין כאן נתוני תושבים:
 * בהדגמה כל האנשים בדויים, ובפיילוט המזהה הוא מזהה בדוי של הספק.
 */

import type { Booking, PilotEvent, PilotRequest, Visit } from "@sal-ishi/core";

// הטיפוסים נגזרים מהסכמה בליבה (packages/core/src/pilotEvents.ts), שממנה נגזר גם
// ה-JSON Schema לספק. כך המסכים, הסנכרון והתקן לא נפרדים.
export type { Actor, Booking, BookingStatus, OnBehalf, PilotEvent, PilotEventType, RequestKind, Visit, VisitKind } from "@sal-ishi/core";
export type Request = PilotRequest;

/** מצבי קצה שמציג ההדגמה מפעיל בלחיצה. לא נשמרים כאירועים. */
export interface Simulation {
  offline: boolean;
  walletEmpty: boolean;
  companionAway: boolean;
  noServices: boolean;
}

export type Lang = "he" | "ar" | "ru";

export interface PilotState {
  schema: 1;
  events: PilotEvent[];
  simulation: Simulation;
  lang: Lang;
  textScale: 1 | 1.25 | 1.5;
  /** נקודת ההתחלה של ההדגמה כבר נטענה. */
  seeded?: boolean;
}

export interface Derived {
  bookings: Booking[];
  requests: Request[];
  visits: Visit[];
  hospitalized: Set<string>;
  interests: Map<string, string[]>;
}

/** גוזר את המצב מהאירועים, בסדר שבו נרשמו. */
export function derive(events: PilotEvent[]): Derived {
  const bookings = new Map<string, Booking>();
  const requests = new Map<string, Request>();
  const visits: Visit[] = [];
  const hospitalized = new Set<string>();
  const interests = new Map<string, string[]>();
  for (const e of events) {
    switch (e.type) {
      case "booking.created":
        bookings.set(e.bookingId, {
          id: e.bookingId,
          citizenId: e.citizenId,
          serviceId: e.serviceId,
          serviceName: e.serviceName,
          slot: e.slot,
          createdAt: e.at,
          createdBy: e.actor,
          onBehalf: e.onBehalf,
          coveredShekel: e.coveredShekel,
          copayShekel: e.copayShekel,
          status: hospitalized.has(e.citizenId) ? "paused" : "booked",
        });
        break;
      case "booking.cancelled": {
        const b = bookings.get(e.bookingId);
        if (b) Object.assign(b, { status: "cancelled", cancelledAt: e.at, charged: e.charged });
        break;
      }
      case "request.created":
        requests.set(e.requestId, {
          id: e.requestId,
          citizenId: e.citizenId,
          kind: e.kind,
          serviceId: e.serviceId,
          serviceName: e.serviceName,
          note: e.note,
          createdAt: e.at,
          createdBy: e.actor,
          status: "open",
        });
        break;
      case "request.decided": {
        const r = requests.get(e.requestId);
        if (r) Object.assign(r, { status: e.decision, decidedAt: e.at, reason: e.reason });
        break;
      }
      case "visit.logged":
        visits.push({ id: e.visitId, citizenId: e.citizenId, at: e.at, kind: e.kind, note: e.note });
        break;
      case "hospitalization.started":
        hospitalized.add(e.citizenId);
        for (const b of bookings.values()) if (b.citizenId === e.citizenId && b.status === "booked") b.status = "paused";
        break;
      case "hospitalization.ended":
        hospitalized.delete(e.citizenId);
        for (const b of bookings.values()) if (b.citizenId === e.citizenId && b.status === "paused") b.status = "booked";
        break;
      case "needs.updated":
        interests.set(e.citizenId, e.interests);
        break;
    }
  }
  return { bookings: [...bookings.values()], requests: [...requests.values()], visits, hospitalized, interests };
}

export const EMPTY_SIMULATION: Simulation = { offline: false, walletEmpty: false, companionAway: false, noServices: false };
