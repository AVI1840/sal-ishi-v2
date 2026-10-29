// כותב את ה-JSON Schema לתיקיית schema/ בשורש המאגר.
import { writeFileSync } from "node:fs";
import { SCHEMA_FILE, schemaText } from "./onboardingSchema";

writeFileSync(SCHEMA_FILE, schemaText());
console.log(`נכתב ${SCHEMA_FILE}`);
