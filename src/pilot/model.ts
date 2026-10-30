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
export type { Actor, Booking, BookingMode, BookingStatus, IncentiveReason, IncentiveRole, OnBehalf, PilotEvent, PilotEventType, RequestKind, Visit, VisitKind } from "@sal-ishi/core";
import type { IncentiveReason, IncentiveRole } from "@sal-ishi/core";

/** תמריץ שהוענק (נקודות שנוספו לארנק). */
export interface Incentive {
  citizenId: string;
  reason: IncentiveReason;
  points: number;
  note?: string;
  at: string;
}
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
  /** תשובות השאלון המשותף לפי אזרח. */
  answers: Map<string, Record<string, string>>;
  reviews: { citizenId: string; serviceId: string; verdict: string; at: string }[];
  incentives: Incentive[];
  /** למה האזרח מתאים לתת לקהילה (המלווה מסמנת). */
  eligibility: Map<string, IncentiveRole[]>;
}

/** גוזר את המצב מהאירועים, בסדר שבו נרשמו. */
export function derive(events: PilotEvent[]): Derived {
  const bookings = new Map<string, Booking>();
  const requests = new Map<string, Request>();
  const visits: Visit[] = [];
  const hospitalized = new Set<string>();
  const interests = new Map<string, string[]>();
  const answers = new Map<string, Record<string, string>>();
  const reviews: Derived["reviews"] = [];
  const incentives: Incentive[] = [];
  const eligibility = new Map<string, IncentiveRole[]>();
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
          mode: e.mode ?? "single",
          sessionsPerMonth: e.sessionsPerMonth,
          attendedSessions: 0,
          attendance: [],
          status: hospitalized.has(e.citizenId) ? "paused" : "booked",
        });
        break;
      case "attendance.reported": {
        const b = bookings.get(e.bookingId);
        if (b && b.status !== "cancelled") {
          b.attendedSessions = (b.attendedSessions ?? 0) + e.sessions;
          b.attendance = [...(b.attendance ?? []), { at: e.at, sessions: e.sessions }];
        }
        break;
      }
      case "incentive.granted":
        incentives.push({ citizenId: e.citizenId, reason: e.reason, points: e.points, note: e.note, at: e.at });
        break;
      case "incentive.eligibility":
        eligibility.set(e.citizenId, e.roles);
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
        if (e.answers) answers.set(e.citizenId, e.answers);
        break;
      case "review.logged":
        reviews.push({ citizenId: e.citizenId, serviceId: e.serviceId, verdict: e.verdict, at: e.at });
        break;
    }
  }
  return { bookings: [...bookings.values()], requests: [...requests.values()], visits, hospitalized, interests, answers, reviews, incentives, eligibility };
}

export const EMPTY_SIMULATION: Simulation = { offline: false, walletEmpty: false, companionAway: false, noServices: false };
