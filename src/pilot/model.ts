/**
 * מודל הנתונים של חוויית האזרח והמלווה (גרסה 0.5).
 *
 * כל שינוי נרשם כאירוע (PilotEvent). המצב (הזמנות, בקשות, ביקורים) נגזר
 * מהאירועים, והאירועים הם גם יומן הביקורת וגם מה שעובר בסנכרון לספק.
 * הסכמות של האירועים והישויות ב-schema/pilot/. אין כאן נתוני תושבים:
 * בהדגמה כל האנשים בדויים, ובפיילוט המזהה הוא מזהה בדוי של הספק.
 */

export type Actor = "citizen" | "companion" | "system";

/** הרשאת פעולה: המלווה פועלת בשם האזרח אחרי אישור בעל פה. לא ייפוי כוח. */
export interface OnBehalf {
  consent: "verbal";
  /** מה הוקרא לאזרח לפני האישור. */
  readBack: string;
  confirmedAt: string;
}

interface EventBase {
  id: string;
  at: string;
  actor: Actor;
  citizenId: string;
  onBehalf?: OnBehalf;
  /** נשלח לספק (בהדגמה: לקובץ הסנכרון). */
  synced?: boolean;
}

export type PilotEvent =
  | (EventBase & {
      type: "booking.created";
      bookingId: string;
      serviceId: string;
      serviceName: string;
      slot: string | null;
      coveredShekel: number;
      copayShekel: number;
    })
  | (EventBase & { type: "booking.cancelled"; bookingId: string; charged: boolean; reason: string })
  | (EventBase & { type: "request.created"; requestId: string; kind: RequestKind; serviceId?: string; serviceName?: string; note?: string })
  | (EventBase & { type: "request.decided"; requestId: string; decision: "approved" | "rejected" | "done"; reason: string })
  | (EventBase & { type: "visit.logged"; visitId: string; kind: VisitKind; note?: string })
  | (EventBase & { type: "hospitalization.started"; note?: string })
  | (EventBase & { type: "hospitalization.ended" })
  | (EventBase & { type: "needs.updated"; interests: string[] });

export type PilotEventType = PilotEvent["type"];
export type RequestKind = "callback" | "gated_service";
export type VisitKind = "home" | "phone" | "no_answer";

export type BookingStatus = "booked" | "cancelled" | "paused";

export interface Booking {
  id: string;
  citizenId: string;
  serviceId: string;
  serviceName: string;
  slot: string | null;
  createdAt: string;
  createdBy: Actor;
  onBehalf?: OnBehalf;
  coveredShekel: number;
  copayShekel: number;
  status: BookingStatus;
  cancelledAt?: string;
  charged?: boolean;
}

export interface Request {
  id: string;
  citizenId: string;
  kind: RequestKind;
  serviceId?: string;
  serviceName?: string;
  note?: string;
  createdAt: string;
  createdBy: Actor;
  status: "open" | "approved" | "rejected" | "done";
  decidedAt?: string;
  reason?: string;
}

export interface Visit {
  id: string;
  citizenId: string;
  at: string;
  kind: VisitKind;
  note?: string;
}

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
