// הגירה לגרסה 0.4: נתונים מגרסה קודמת נטענים כמו שהם. שדה חדש שחסר לא
// מתמלא לבד ולא נמחק כלום: השירות מופיע ברשימת ההשלמות, עם הצעה כשאפשר.

import type { Service, ServiceMode } from "./model";
import { isProduct, suggestedGate, suggestedServiceMode } from "./rules/terms";
import type { Seed } from "./seed";

export type GapField = "hoursPerUnit" | "serviceMode" | "gateReason";

export interface MigrationGap {
  field: GapField;
  label: string;
  /** הצעה לאישור המשתמש (אופן מתן, או סיבת שער מלווה). */
  suggestion?: ServiceMode | string;
}

export interface ServiceGaps {
  serviceId: string;
  name: string;
  status: Service["status"];
  gaps: MigrationGap[];
  /** הצעה לסמן את השירות כנפתח באישור מלווה, לפי כללי איכות החיים. */
  suggestGate: string | null;
}

export const GAP_LABELS: Record<GapField, string> = {
  hoursPerUnit: "שעות שירות ליחידה",
  serviceMode: "אופן מתן השירות",
  gateReason: "סיבה לפתיחה באישור מלווה",
};

/** השירותים שחסרים להם שדות של גרסה 0.4. מוצרים פטורים משעות ומאופן מתן. */
export function migrationGaps(services: readonly Service[], seed: Seed): ServiceGaps[] {
  const out: ServiceGaps[] = [];
  for (const s of services) {
    const product = isProduct(seed, s.categoryCode);
    const gaps: MigrationGap[] = [];
    if (!product && !s.hoursPerUnit) gaps.push({ field: "hoursPerUnit", label: GAP_LABELS.hoursPerUnit });
    if (!product && !s.serviceMode) gaps.push({ field: "serviceMode", label: GAP_LABELS.serviceMode, suggestion: suggestedServiceMode(s) });
    if (s.gatedByCompanion && !s.gateReason?.trim()) {
      gaps.push({ field: "gateReason", label: GAP_LABELS.gateReason, suggestion: suggestedGate(seed, s.categoryCode) ?? undefined });
    }
    const gate = s.gatedByCompanion === undefined ? suggestedGate(seed, s.categoryCode) : null;
    if (gaps.length || gate) out.push({ serviceId: s.id, name: s.name, status: s.status, gaps, suggestGate: gate });
  }
  return out;
}
