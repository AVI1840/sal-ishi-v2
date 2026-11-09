// כותב את ה-JSON Schema לתיקיית schema/ בשורש המאגר.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_FILE, schemaText } from "./onboardingSchema";
import { PILOT_SCHEMA_FILES } from "./pilotSchema";

writeFileSync(SCHEMA_FILE, schemaText());
console.log(`נכתב ${SCHEMA_FILE}`);
for (const { file, text } of PILOT_SCHEMA_FILES) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text());
  console.log(`נכתב ${file}`);
}
