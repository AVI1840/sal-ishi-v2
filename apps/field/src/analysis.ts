// חישובים נגזרים מהמצב. כל ספי הכללים נקראים מה-seed הפעיל, ולכן שינוי
// בהגדרות מעדכן מיד את כל המסכים.

import { useMemo } from "react";
import {
  coverage,
  entryTest,
  labels,
  missingMandatoryFields,
  priceOutliers,
  referencePrices,
  seedIndex,
  type EntryResult,
  type MissingField,
  type PriceOutlier,
  type Service,
} from "@sal-ishi/core";
import type { Tone } from "@sal-ishi/ui";
import { useField } from "./store";

export interface ServiceAnalysis {
  entry: EntryResult;
  missing: MissingField[];
  outlier?: PriceOutlier;
  referenceMedian: number | null;
}

export function useAnalysis() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);

  return useMemo(() => {
    const refs = new Map(referencePrices(data.services, seed.settings).map((r) => [`${r.serviceTypeId}|${r.unit}`, r]));
    const outliers = new Map(priceOutliers(data.services, seed.settings).map((o) => [o.serviceId, o]));
    const perService = new Map<string, ServiceAnalysis>(
      data.services.map((s) => [
        s.id,
        {
          entry: entryTest(s, seed),
          missing: missingMandatoryFields(s, data.activity, seed),
          outlier: outliers.get(s.id),
          referenceMedian: refs.get(`${s.serviceTypeId}|${s.unit}`)?.median ?? null,
        },
      ]),
    );
    const cov = coverage(data, seed);
    return { perService, coverage: cov, refs, idx: seedIndex(seed), labels: labels(seed), seed, data };
  }, [data, seed]);
}

export function entryTone(status: string): Tone {
  if (status === "נכנס") return "success";
  if (status === "חסרים נתונים" || status === "מוחזר למיפוי" || status === "לא נכנס עד שיש מנגנון") return "warning";
  return "error";
}

export function workflowTone(status: Service["status"]): Tone {
  return status === "אושר" ? "success" : status === "נדחה" ? "error" : status === "הוגש" ? "info" : "neutral";
}

export const LANGUAGES = ["עברית", "ערבית", "יידיש", "רוסית", "אמהרית", "אנגלית", "צרפתית"];

export const shekel = (n: number | undefined | null) =>
  n === undefined || n === null ? "-" : `${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })} ש"ח`;

export const percent = (n: number | null) => (n === null ? "-" : `${Math.round(n * 100)}%`);

export const monthLabel = (m: string) => {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
};
