/// <reference types="node" />
// JSON Schema של אירועי הפיילוט והישויות, נגזר מסכמת ה-zod בליבה. ספק שמחבר
// backend מקבל את האירועים לפי הסכמה הזו, דרך PilotSyncAdapter או כקובץ.
//
// עדכון: npm run schema -w @sal-ishi/core

import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";
import { bookingSchema, pilotEventsFileSchema, requestSchema, visitSchema } from "../src/pilotEvents";
import { learningFileSchema } from "../src/learning";

const dir = (name: string) => fileURLToPath(new URL(`../../../schema/pilot/${name}`, import.meta.url));

const PRIVACY = "בלי נתוני תושבים: מזהה האזרח הוא מזהה בדוי של הספק. אין שם, טלפון, כתובת או מספר זהות.";

function toJson(schema: ZodTypeAny, id: string, title: string, description: string) {
  const json = zodToJsonSchema(schema, { target: "jsonSchema7", $refStrategy: "none" }) as Record<string, unknown>;
  return JSON.stringify({ ...json, $id: id, title, description }, null, 2) + "\n";
}

export const PILOT_SCHEMA_FILES: { file: string; text: () => string }[] = [
  {
    file: dir("pilot-events-1.1.schema.json"),
    text: () => toJson(pilotEventsFileSchema, "urn:sal-ishi:pilot-events:1.1", "pilot events 1.1", `אירועים מחוויית האזרח והמלווה: הזמנה (מנוי חודשי או חד-פעמית), ביטול, נוכחות מדווחת, בקשה, החלטת מלווה, ביקור, אשפוז ותמריצים. ${PRIVACY}`),
  },
  { file: dir("booking-1.1.schema.json"), text: () => toJson(bookingSchema, "urn:sal-ishi:booking:1.1", "booking 1.1", `הזמנה, כפי שהיא נגזרת מהאירועים: מנוי או חד-פעמית, שמור ונוצל לפי נוכחות. ${PRIVACY}`) },
  { file: dir("request-1.0.schema.json"), text: () => toJson(requestSchema, "urn:sal-ishi:request:1.0", "request 1.0", `בקשה למלווה: שיחזרו אליי או שירות מותנה. ${PRIVACY}`) },
  { file: dir("visit-1.0.schema.json"), text: () => toJson(visitSchema, "urn:sal-ishi:visit:1.0", "visit 1.0", `רישום ביקור או שיחה של המלווה. ${PRIVACY}`) },
  {
    file: dir("learning-notebook-1.0.schema.json"),
    text: () => toJson(learningFileSchema, "urn:sal-ishi:learning-notebook:1.0", "learning notebook 1.0", "פנקס הלמידה: תובנות מהשטח, הצעות והכרעות. המקור לרישום הדרישות למכרז."),
  },
];
