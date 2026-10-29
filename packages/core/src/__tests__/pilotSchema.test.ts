import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { PILOT_SCHEMA_FILES } from "../../scripts/pilotSchema";
import { PILOT_EVENTS_SCHEMA_ID, PILOT_FORBIDDEN_KEYS, pilotEventsFileSchema, type PilotEvent } from "../pilotEvents";
import { findForbiddenKeys } from "../privacy";

const at = "2026-11-03T09:00:00.000Z";
const events: PilotEvent[] = [
  { id: "e1", at, actor: "citizen", citizenId: "c1", type: "booking.created", bookingId: "b1", serviceId: "demoj-s05", serviceName: "שיווי משקל", slot: at, coveredShekel: 116, copayShekel: 0 },
  { id: "e2", at, actor: "citizen", citizenId: "c1", type: "booking.cancelled", bookingId: "b1", charged: false, reason: "on_time" },
  { id: "e3", at, actor: "citizen", citizenId: "c1", type: "request.created", requestId: "r1", kind: "gated_service", serviceId: "demoj-s41", serviceName: "סל טיפוח" },
  { id: "e4", at, actor: "companion", citizenId: "c1", type: "request.decided", requestId: "r1", decision: "approved", reason: "צורך שזוהה בביקור" },
  {
    id: "e5", at, actor: "companion", citizenId: "c1", type: "booking.created", bookingId: "b2", serviceId: "demoj-s01", serviceName: "מועדון", slot: null, coveredShekel: 126, copayShekel: 0,
    onBehalf: { consent: "verbal", readBack: "מועדון חברתי. הכל מהסל.", confirmedAt: at },
  },
  { id: "e6", at, actor: "companion", citizenId: "c1", type: "visit.logged", visitId: "v1", kind: "home" },
  { id: "e7", at, actor: "companion", citizenId: "c1", type: "hospitalization.started" },
  { id: "e8", at, actor: "companion", citizenId: "c1", type: "hospitalization.ended" },
  { id: "e9", at, actor: "citizen", citizenId: "c1", type: "needs.updated", interests: ["belonging"] },
];
const file = { schema: PILOT_EVENTS_SCHEMA_ID, exportedAt: at, source: "sal-ishi-pilot", events };

describe("סכמות הפיילוט לספק", () => {
  it("קבצי ה-JSON Schema מעודכנים (npm run schema -w @sal-ishi/core)", () => {
    for (const { file: path, text } of PILOT_SCHEMA_FILES) expect(readFileSync(path, "utf8").replace(/\r\n/g, "\n"), path).toBe(text());
  });

  it("כל סוגי האירועים עוברים את ה-JSON Schema ואת zod", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(JSON.parse(PILOT_SCHEMA_FILES[0]!.text()));
    expect(validate(file), JSON.stringify(validate.errors)).toBe(true);
    expect(() => pilotEventsFileSchema.parse(file)).not.toThrow();
  });

  it("אירוע לא מוכר נדחה", () => {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(JSON.parse(PILOT_SCHEMA_FILES[0]!.text()));
    expect(validate({ ...file, events: [{ ...events[0], type: "payment.made" }] })).toBe(false);
  });

  it("אין שדות אישיים באירועים", () => {
    expect(findForbiddenKeys(file, PILOT_FORBIDDEN_KEYS as unknown as string[])).toEqual([]);
  });
});
