import { useMemo } from "react";
import {
  authoritySummaries,
  coverage,
  labels,
  priceOutliers,
  referencePrices,
  seedIndex,
  supplierDiversity,
} from "@sal-ishi/core";
import { useHq } from "./store";

/** כל החישובים של המטה. נגזרים מה-seed הפעיל, כך ששינוי כלל מתעדכן מיד בכל המסכים. */
export function useHqAnalysis() {
  const state = useHq((s) => s.state);
  const seed = useHq((s) => s.seed);
  return useMemo(
    () => ({
      state,
      seed,
      idx: seedIndex(seed),
      labels: labels(seed),
      summaries: authoritySummaries(state, seed),
      coverage: coverage(state, seed),
      refs: referencePrices(state.services, seed.settings),
      outliers: priceOutliers(state.services, seed.settings),
      diversity: supplierDiversity(state.services, seed),
    }),
    [state, seed],
  );
}

export const shekel = (n: number | undefined | null) =>
  n === undefined || n === null ? "-" : `${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })} ש"ח`;
export const percent = (n: number | null) => (n === null ? "-" : `${Math.round(n * 100)}%`);
export const monthLabel = (m: string | null) => {
  if (!m) return "-";
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
};
