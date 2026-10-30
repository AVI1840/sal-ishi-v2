// אירועי הפיילוט: מה שחוויית האזרח והמלווה שולחת לספק (PilotSyncAdapter).
// מקור אמת אחד: הסכמה כאן, ה-JSON Schema ב-schema/pilot/ נגזר ממנה, והטיפוסים
// במסכים נגזרים ממנה. מזהה האזרח הוא מזהה בדוי (פסאודונים) של הספק, אף פעם
// לא מספר זהות, ואין שדות של שם, טלפון או כתובת.

import { z } from "zod";

/**
 * 1.1 (0.6): הזמנה כמנוי חודשי או חד-פעמית, דיווח נוכחות מהספק (שמור מול נוצל),
 * ותמריצים. תוספות בלבד: קובץ 1.0 עדיין נקרא.
 */
export const PILOT_EVENTS_SCHEMA_ID = "sal-ishi.pilot-events/1.1";
export const PILOT_EVENTS_SCHEMA_IDS = ["sal-ishi.pilot-events/1.0", PILOT_EVENTS_SCHEMA_ID] as const;

export const actorSchema = z.enum(["citizen", "companion", "system"]);

/** הרשאת פעולה: המלווה פועלת בשם האזרח אחרי אישור בעל פה. לא ייפוי כוח. */
export const onBehalfSchema = z.object({
  consent: z.literal("verbal"),
  /** מה הוקרא לאזרח לפני האישור. */
  readBack: z.string(),
  confirmedAt: z.string(),
});

const base = {
  id: z.string(),
  at: z.string().describe("ISO 8601"),
  actor: actorSchema,
  citizenId: z.string().describe("מזהה בדוי של הספק. לא מספר זהות."),
  onBehalf: onBehalfSchema.optional(),
  synced: z.boolean().optional().describe("פנימי לכלי. לא נשלח."),
};

/** claim_help: עזרה בהגשה למממן אחר (משימת מיצוי למלווה, סל משלים בלבד). */
export const requestKindSchema = z.enum(["callback", "gated_service", "claim_help"]);
export const visitKindSchema = z.enum(["home", "phone", "no_answer"]);
/** subscription: שירות רציף, מנוי חודשי שמתחדש (אפשר לעזוב). single: מועד אחד, סדנה, ביקור או מוצר. */
export const bookingModeSchema = z.enum(["subscription", "single"]);
/** תמריץ: התנדבות בקהילה, הדרכת חוג או הרצאה, התמדה, עמידה ביעד אישי. */
export const incentiveReasonSchema = z.enum(["volunteer", "teach", "persistence", "goal"]);
export const incentiveRoleSchema = z.enum(["volunteer", "teach"]);

export const pilotEventSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("booking.created"),
    bookingId: z.string(),
    serviceId: z.string().describe("מזהה השירות בתקן קליטת המפעילים"),
    serviceName: z.string(),
    slot: z.string().nullable().describe("מועד, או null כשהמפעיל מתאם מועד"),
    coveredShekel: z.number().describe("מהסל, להמחשה. במנוי: הסכום לחודש. הסכום המחייב אצל הספק"),
    copayShekel: z.number(),
    mode: bookingModeSchema.optional().describe("ברירת מחדל: single"),
    sessionsPerMonth: z.number().int().positive().optional().describe("במנוי: מפגשים בחודש, לחלוקת הסכום לפי נוכחות"),
  }),
  /** נוכחות מדווחת על ידי הספק (דרך ספק העל): הופכת סכום "שמור" ל"נוצל". */
  z.object({ ...base, type: z.literal("attendance.reported"), bookingId: z.string(), sessions: z.number().int().positive() }),
  /** תמריץ בנקודות, באישור המלווה. מתווסף לארנק. */
  z.object({ ...base, type: z.literal("incentive.granted"), reason: incentiveReasonSchema, points: z.number().positive(), note: z.string().optional() }),
  /** המלווה מסמנת למה האזרח מתאים לתת לקהילה. רשימה ריקה: לא מוצע. */
  z.object({ ...base, type: z.literal("incentive.eligibility"), roles: z.array(incentiveRoleSchema) }),
  z.object({ ...base, type: z.literal("booking.cancelled"), bookingId: z.string(), charged: z.boolean(), reason: z.string() }),
  z.object({
    ...base,
    type: z.literal("request.created"),
    requestId: z.string(),
    kind: requestKindSchema,
    serviceId: z.string().optional(),
    serviceName: z.string().optional(),
    note: z.string().optional(),
  }),
  z.object({ ...base, type: z.literal("request.decided"), requestId: z.string(), decision: z.enum(["approved", "rejected", "done"]), reason: z.string() }),
  z.object({ ...base, type: z.literal("visit.logged"), visitId: z.string(), kind: visitKindSchema, note: z.string().optional() }),
  z.object({ ...base, type: z.literal("hospitalization.started"), note: z.string().optional() }),
  z.object({ ...base, type: z.literal("hospitalization.ended") }),
  z.object({
    ...base,
    type: z.literal("needs.updated"),
    interests: z.array(z.string()),
    /** תשובות סגורות מהשאלון המשותף (מפתח שאלה: תשובה). בלי טקסט חופשי. */
    answers: z.record(z.string(), z.string()).optional(),
  }),
  /** מעקב חודשי: מה עבד ומה להחליף, בליווי המלווה. */
  z.object({ ...base, type: z.literal("review.logged"), serviceId: z.string(), verdict: z.enum(["worked", "partly", "replace"]) }),
]);

export const pilotEventsFileSchema = z.object({
  schema: z.enum(PILOT_EVENTS_SCHEMA_IDS),
  exportedAt: z.string(),
  source: z.literal("sal-ishi-pilot"),
  events: z.array(pilotEventSchema),
});

// ── ישויות (נגזרות מהאירועים) ─────────────────────────

export const bookingSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  slot: z.string().nullable(),
  createdAt: z.string(),
  createdBy: actorSchema,
  onBehalf: onBehalfSchema.optional(),
  coveredShekel: z.number(),
  copayShekel: z.number(),
  mode: bookingModeSchema.optional(),
  sessionsPerMonth: z.number().int().positive().optional(),
  /** מפגשים שהספק דיווח עליהם. */
  attendedSessions: z.number().int().nonnegative().optional(),
  status: z.enum(["booked", "cancelled", "paused"]),
  cancelledAt: z.string().optional(),
  charged: z.boolean().optional(),
});

export const requestSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  kind: requestKindSchema,
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  createdBy: actorSchema,
  status: z.enum(["open", "approved", "rejected", "done"]),
  decidedAt: z.string().optional(),
  reason: z.string().optional(),
});

export const visitSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  at: z.string(),
  kind: visitKindSchema,
  note: z.string().optional(),
});

export type Actor = z.infer<typeof actorSchema>;
export type OnBehalf = z.infer<typeof onBehalfSchema>;
export type PilotEvent = z.infer<typeof pilotEventSchema>;
export type PilotEventType = PilotEvent["type"];
export type RequestKind = z.infer<typeof requestKindSchema>;
export type VisitKind = z.infer<typeof visitKindSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type BookingStatus = Booking["status"];
export type PilotRequest = z.infer<typeof requestSchema>;
export type Visit = z.infer<typeof visitSchema>;
export type BookingMode = z.infer<typeof bookingModeSchema>;
export type IncentiveReason = z.infer<typeof incentiveReasonSchema>;
export type IncentiveRole = z.infer<typeof incentiveRoleSchema>;

/** שדות שאסור שיופיעו באירוע: מזהים אישיים ופרטי קשר. נבדק בבדיקות. */
export const PILOT_FORBIDDEN_KEYS = ["name", "fullName", "phone", "email", "address", "idNumber", "teudatZehut", "birthDate"] as const;
