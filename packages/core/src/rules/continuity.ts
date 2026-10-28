// שירות רציף: לפחות min_participants בחודש השיא ולפחות min_active_months
// חודשים פעילים. שירותים עם אותו programId באותה שכונה נספרים כשירות אחד
// (סבבים של אותה תוכנית). חודש פעיל אחד בלבד הוא "אירוע" ולא נספר.

import type { MonthlyActivity, Service } from "../model";
import type { Settings } from "../seed";

export const CONTINUITY_STATUS = {
  continuous: "רציף",
  notContinuous: "לא רציף",
  event: "אירוע",
  noActivity: "אין פעילות",
} as const;

export type ContinuityStatus = (typeof CONTINUITY_STATUS)[keyof typeof CONTINUITY_STATUS];

export interface ContinuityUnit {
  /** programId, או מזהה השירות כשאין תוכנית. */
  key: string;
  neighborhoodId: string;
  categoryCode: string;
  serviceIds: string[];
  peakParticipants: number;
  activeMonths: number;
  status: ContinuityStatus;
}

export function continuityUnits(
  services: readonly Service[],
  activity: readonly MonthlyActivity[],
  settings: Pick<Settings, "min_participants" | "min_active_months">,
): ContinuityUnit[] {
  const byService = new Map<string, MonthlyActivity[]>();
  for (const a of activity) {
    const list = byService.get(a.serviceId);
    if (list) list.push(a);
    else byService.set(a.serviceId, [a]);
  }

  const groups = new Map<string, Service[]>();
  for (const s of services) {
    const groupKey = `${s.neighborhoodId}|${s.programId ?? `service:${s.id}`}`;
    const list = groups.get(groupKey);
    if (list) list.push(s);
    else groups.set(groupKey, [s]);
  }

  const units: ContinuityUnit[] = [];
  for (const members of groups.values()) {
    const first = members[0]!;
    const perMonth = new Map<string, number>();
    const activeMonthSet = new Set<string>();
    for (const s of members) {
      for (const a of byService.get(s.id) ?? []) {
        perMonth.set(a.month, (perMonth.get(a.month) ?? 0) + a.uniqueParticipants);
        if (a.sessions > 0 || a.uniqueParticipants > 0) activeMonthSet.add(a.month);
      }
    }
    const peakParticipants = Math.max(0, ...perMonth.values());
    const activeMonths = activeMonthSet.size;

    let status: ContinuityStatus;
    if (activeMonths === 0) status = CONTINUITY_STATUS.noActivity;
    else if (activeMonths === 1) status = CONTINUITY_STATUS.event;
    else if (peakParticipants >= settings.min_participants && activeMonths >= settings.min_active_months)
      status = CONTINUITY_STATUS.continuous;
    else status = CONTINUITY_STATUS.notContinuous;

    units.push({
      key: first.programId ?? first.id,
      neighborhoodId: first.neighborhoodId,
      categoryCode: first.categoryCode,
      serviceIds: members.map((s) => s.id),
      peakParticipants,
      activeMonths,
      status,
    });
  }
  return units;
}
