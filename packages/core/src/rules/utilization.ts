// מיצוי: walletSpent מול הארנק האישי, בחלון מתגלגל (utilization_window).
// איכות חיים לא נספרת כש-qol_counts_in_target = false, וליווי המלווה לא
// נספר כש-companion_escort_counts_in_wallet = false.

import type { MonthlyActivity, NeighborhoodMonth, Service } from "../model";
import type { Seed } from "../seed";
import { COMPANION_LAYER, QOL_LAYERS, seedIndex } from "../seed";
import { utilizationWindowMonths, windowMonths } from "../settings";

export type UtilizationFlag = "red" | "below_target" | "on_target" | "no_data";

export interface UtilizationResult {
  neighborhoodId: string;
  months: string[];
  spent: number;
  capacity: number;
  /** spent / capacity, או null כשאין מחזיקי סל בחלון. */
  rate: number | null;
  flag: UtilizationFlag;
}

/** האם ההוצאה על שירות בקטגוריה הזו נספרת ביעד המיצוי. */
export function countsInUtilization(seed: Seed, categoryCode: string): boolean {
  const category = seedIndex(seed).categories.get(categoryCode);
  if (!category) return true;
  if ((QOL_LAYERS as readonly string[]).includes(category.layer)) return seed.settings.qol_counts_in_target;
  if (category.layer === COMPANION_LAYER) return seed.settings.companion_escort_counts_in_wallet;
  return true;
}

export function utilization(
  input: {
    neighborhoodId: string;
    asOfMonth: string;
    services: readonly Service[];
    activity: readonly MonthlyActivity[];
    enrollment: readonly NeighborhoodMonth[];
  },
  seed: Seed,
): UtilizationResult {
  const { settings } = seed;
  const months = windowMonths(input.asOfMonth, utilizationWindowMonths(settings));
  const inWindow = new Set(months);

  const counted = new Set(
    input.services
      .filter((s) => s.neighborhoodId === input.neighborhoodId && countsInUtilization(seed, s.categoryCode))
      .map((s) => s.id),
  );

  const spent = input.activity
    .filter((a) => inWindow.has(a.month) && counted.has(a.serviceId))
    .reduce((sum, a) => sum + (a.walletSpent ?? 0), 0);

  const capacity = input.enrollment
    .filter((e) => e.neighborhoodId === input.neighborhoodId && inWindow.has(e.month))
    .reduce((sum, e) => sum + e.enrolled * settings.personal_wallet, 0);

  const rate = capacity > 0 ? spent / capacity : null;
  let flag: UtilizationFlag;
  if (rate === null) flag = "no_data";
  else if (rate < settings.red_flag_avg) flag = "red";
  else if (rate < settings.utilization_target) flag = "below_target";
  else flag = "on_target";

  return { neighborhoodId: input.neighborhoodId, months, spent, capacity, rate, flag };
}

/** שירותים מתחת לסף המשתתפים בחודש האחרון של החלון (למסך "מה הולך"). */
export function servicesBelowThreshold(
  services: readonly Service[],
  activity: readonly MonthlyActivity[],
  asOfMonth: string,
  seed: Seed,
): { serviceId: string; participants: number }[] {
  const current = new Map(activity.filter((a) => a.month === asOfMonth).map((a) => [a.serviceId, a.uniqueParticipants]));
  return services
    .filter((s) => current.has(s.id) && (current.get(s.id) ?? 0) < seed.settings.min_participants)
    .map((s) => ({ serviceId: s.id, participants: current.get(s.id) ?? 0 }));
}
