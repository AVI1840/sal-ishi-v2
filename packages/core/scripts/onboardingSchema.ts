/// <reference types="node" />
// JSON Schema של תקן קליטת המפעילים, נגזר מסכמת ה-zod (מקור אמת אחד). לא חלק
// מהליבה שנטענת באפליקציות: zod-to-json-schema היא תלות פיתוח בלבד.
//
// עדכון הקובץ בתיקיית schema/ אחרי שינוי בסכמה:
//   npm run schema -w @sal-ishi/core (מריץ את writeSchema.ts)

import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { onboardingStandardSchema } from "../src/model";

export const SCHEMA_FILE = fileURLToPath(new URL("../../../schema/operator_onboarding_standard_1.1.schema.json", import.meta.url));

export function onboardingJsonSchema(): Record<string, unknown> {
  const schema = zodToJsonSchema(onboardingStandardSchema, { target: "jsonSchema7", $refStrategy: "none" }) as Record<string, unknown>;
  return {
    ...schema,
    $id: "urn:sal-ishi:operator_onboarding_standard:1.1",
    title: "operator_onboarding_standard 1.1",
    description:
      "תקן קליטת מפעילים: הקטלוג המאושר של הסל האישי להזדקנות מיטבית, לספק העל. בלי נתוני תושבים, בלי פרטי קשר של ספק יחיד ובלי מחיר בשקלים. מחיר בנקודות, לפי points_per_shekel.",
  };
}

export const schemaText = () => JSON.stringify(onboardingJsonSchema(), null, 2) + "\n";

