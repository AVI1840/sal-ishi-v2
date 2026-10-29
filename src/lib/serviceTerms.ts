/**
 * תנאי שירות לפי מודל התשלום של החשכ"ל (גרסה 0.4), כפי שהכלי לאזרח ולמלווה
 * מציג אותם. הכל נקרא מהקטלוג המאושר: אין כאן כללים מקודדים. הכלי לא מפעיל
 * נקודות ולא מחייב, הוא רק מסביר מה נקבע.
 */

import type { RealService } from "@/data/realServices";

export const SERVICE_MODE_TEXT: Record<string, string> = {
  group: "קבוצתי",
  individual: "פרטני",
  home: "בבית",
  remote: "מרחוק",
};

export const COPAY_BASIS_TEXT: Record<string, string> = {
  tier: "לפי דרגת ההשתתפות",
  qol_fixed: "איכות חיים: סכום קבוע מהנקודות",
  qol_percent: "איכות חיים: אחוז השתתפות",
  reference_binding: "מחיר הייחוס מחייב: הארנק מכסה עד מחיר הייחוס",
};

const points = (n: number) => `${n.toLocaleString("he-IL", { maximumFractionDigits: 2 })} נקודות`;

/** שירות שנפתח רק באישור המלווה: לא נבחר ישירות על ידי האזרח. */
export function needsCompanion(s: Pick<RealService, "gatedByCompanion">): boolean {
  return s.gatedByCompanion === true;
}

/** שורת העלות: מחיר, ומה מכוסה מהארנק ומה על האזרח (כשהקטלוג קבע זאת). */
export function costNote(item: {
  pricePoints: number;
  unit: string;
  copayRate: number;
  coveredPoints?: number | null;
  copayPoints?: number | null;
}): string {
  const price = `${points(item.pricePoints)} ל${item.unit}`;
  if (item.coveredPoints === null && item.copayPoints === null) return `${price}. החלוקה בין הארנק לבינך טרם נקבעה`;
  if (item.coveredPoints !== undefined && item.coveredPoints !== null && item.copayPoints !== undefined && item.copayPoints !== null) {
    return item.copayPoints === 0
      ? `${price}. הארנק מכסה את כולו`
      : `${price}. מהארנק ${points(item.coveredPoints)}, עליך ${points(item.copayPoints)}`;
  }
  return `${price}${item.copayRate > 0 ? `, השתתפות עצמית ${Math.round(item.copayRate * 100)}%` : ", בלי השתתפות עצמית"}`;
}

/** חינם כשכל המחיר מכוסה מהארנק, אחרת מסובסד. */
export function costType(item: { copayRate: number; copayPoints?: number | null }): "free" | "subsidized" {
  if (item.copayPoints !== undefined && item.copayPoints !== null) return item.copayPoints === 0 ? "free" : "subsidized";
  return item.copayRate === 0 ? "free" : "subsidized";
}

export interface TermLine {
  term: string;
  text: string;
}

/**
 * שורות התנאים לכרטיס השירות. שדה שהקטלוג עוד לא קבע מוצג כ"טרם נקבע" ולא
 * נעלם, כדי שהאזרח והמלווה לא יניחו הנחה שאין לה בסיס.
 */
export function termLines(s: RealService): TermLine[] {
  const lines: TermLine[] = [];
  if (s.serviceMode) {
    lines.push({ term: "אופן מתן", text: `${SERVICE_MODE_TEXT[s.serviceMode] ?? s.serviceMode}${s.capacityLimited ? ", מקומות מוגבלים עם רשימת המתנה" : ""}` });
    lines.push({
      term: "ביטול",
      text: s.cancellationNoticeHours === null || s.cancellationNoticeHours === undefined ? "שעות ההודעה מראש טרם נקבעו" : `הודעה מראש של ${s.cancellationNoticeHours} שעות לפחות`,
    });
    if (s.noShowCharged !== null && s.noShowCharged !== undefined) {
      lines.push({ term: "אי-הגעה", text: s.noShowCharged ? "אי-הגעה בלי ביטול מחויבת" : "אי-הגעה לא מחויבת" });
    }
  }
  if (s.hoursPerUnit) lines.push({ term: "שעות ביחידה", text: `${s.hoursPerUnit} שעות שירות ל${s.unit ?? "יחידה"}` });
  if (s.copayBasis) lines.push({ term: "חלוקת העלות", text: COPAY_BASIS_TEXT[s.copayBasis] ?? s.copayBasis });
  if (needsCompanion(s)) lines.push({ term: "פתיחה", text: `באישור המלווה${s.gateReason ? `: ${s.gateReason}` : ""}` });
  return lines;
}
