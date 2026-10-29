// חישובים של משטח המטה: תמונה לכל פיילוט, והפצת גרסת seed עם יומן שינויים.

import type { Service, SupplierType } from "./model";
import type { HqState } from "./pilotPackage";
import { coverage } from "./rules/coverage";
import { ENTRY_STATUS, entryTest } from "./rules/entryTest";
import { utilization, type UtilizationFlag } from "./rules/utilization";
import { parseSeed, type Seed, type Settings } from "./seed";

export interface NeighborhoodUtilization {
  neighborhoodId: string;
  name: string;
  rate: number | null;
  flag: UtilizationFlag;
  /** הוצאה ותקציב בחלון, לחישוב מיצוי מצטבר לפיילוט ולארץ. */
  spent: number;
  capacity: number;
}

export interface AuthoritySummary {
  authority: string;
  neighborhoods: number;
  services: number;
  entered: number;
  approved: number;
  coverage: { green: number; orange: number; red: number };
  alerts: number;
  suppliers: number;
  suppliersByType: Partial<Record<SupplierType, number>>;
  utilization: NeighborhoodUtilization[];
  redFlags: number;
  asOfMonth: string | null;
}

/** החודש האחרון שיש בו פעילות בקבוצת השירותים. */
export function latestActivityMonth(state: Pick<HqState, "activity">, serviceIds?: Set<string>): string | null {
  let latest: string | null = null;
  for (const a of state.activity) {
    if (serviceIds && !serviceIds.has(a.serviceId)) continue;
    if (!latest || a.month > latest) latest = a.month;
  }
  return latest;
}

/** תמונה לכל פיילוט (רשות), להשוואה "תפוח לתפוח" לפי אותם כללים. */
export function authoritySummaries(state: HqState, seed: Seed): AuthoritySummary[] {
  const authorities = [...new Set(state.neighborhoods.map((n) => n.authority))].sort((a, b) => a.localeCompare(b));
  return authorities.map((authority) => {
    const neighborhoods = state.neighborhoods.filter((n) => n.authority === authority);
    const services = state.services.filter((s) => s.authority === authority);
    const ids = new Set(services.map((s) => s.id));
    const activity = state.activity.filter((a) => ids.has(a.serviceId));
    const nIds = new Set(neighborhoods.map((n) => n.id));
    const enrollment = state.enrollment.filter((e) => nIds.has(e.neighborhoodId));
    const suppliers = state.suppliers.filter((s) => s.authority === authority);

    const cov = coverage({ neighborhoods, services, activity }, seed);
    const asOfMonth = latestActivityMonth({ activity });
    const util: NeighborhoodUtilization[] = asOfMonth
      ? neighborhoods.map((n) => {
          const u = utilization({ neighborhoodId: n.id, asOfMonth, services, activity, enrollment }, seed);
          return { neighborhoodId: n.id, name: n.name, rate: u.rate, flag: u.flag, spent: u.spent, capacity: u.capacity };
        })
      : [];

    const suppliersByType: Partial<Record<SupplierType, number>> = {};
    for (const s of suppliers) suppliersByType[s.type] = (suppliersByType[s.type] ?? 0) + 1;

    return {
      authority,
      neighborhoods: neighborhoods.length,
      services: services.length,
      entered: services.filter((s) => entryTest(s, seed).status === ENTRY_STATUS.in).length,
      approved: services.filter((s) => s.status === "אושר").length,
      coverage: {
        green: cov.cells.filter((c) => c.level === "green").length,
        orange: cov.cells.filter((c) => c.level === "orange").length,
        red: cov.cells.filter((c) => c.level === "red").length,
      },
      alerts: cov.alerts.length,
      suppliers: suppliers.length,
      suppliersByType,
      utilization: util,
      redFlags: util.filter((u) => u.flag === "red").length,
      asOfMonth,
    };
  });
}

/** כמה ספקים שונים מספקים שירות בכל קטגוריית ליבה, לכל רשות (מגוון ספקים). */
export function supplierDiversity(services: readonly Service[], seed: Seed): { authority: string; coreCategoryId: string; suppliers: number }[] {
  const out: { authority: string; coreCategoryId: string; suppliers: number }[] = [];
  const authorities = [...new Set(services.map((s) => s.authority))].sort();
  for (const authority of authorities) {
    for (const cc of seed.core_categories) {
      const codes = new Set(
        services.filter((s) => s.authority === authority && cc.codes.includes(s.categoryCode)).map((s) => s.supplierCode),
      );
      out.push({ authority, coreCategoryId: cc.id, suppliers: codes.size });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// גרסאות seed

export interface ChangeLogEntry {
  at: string;
  kind: "setting" | "service_type" | "category";
  key: string;
  before: unknown;
  after: unknown;
  note?: string;
}

export interface SettingChange {
  key: string;
  before: unknown;
  after: unknown;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function settingsDiff(before: Settings, after: Settings): SettingChange[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return keys
    .map((key) => ({
      key,
      before: (before as Record<string, unknown>)[key],
      after: (after as Record<string, unknown>)[key],
    }))
    .filter((c) => !same(c.before, c.after));
}

/** 0.3 הופך ל-0.3.1, ו-0.3.1 ל-0.3.2. */
export function nextSeedVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length < 3) return `${version}.1`;
  const last = Number(parts[parts.length - 1]);
  parts[parts.length - 1] = String(Number.isFinite(last) ? last + 1 : 1);
  return parts.join(".");
}

/** גרסת seed חדשה להפצה לשטח: מספר גרסה, תאריך ויומן השינויים שנכנסו בה. */
export function publishSeedVersion(seed: Seed, changes: ChangeLogEntry[], now = new Date()): Seed {
  const meta = seed.meta as Seed["meta"] & { changelog?: unknown[] };
  const version = nextSeedVersion(seed.meta.version);
  const next = {
    ...seed,
    meta: {
      ...meta,
      version,
      published_at: now.toISOString(),
      changelog: [...(meta.changelog ?? []), { version, published_at: now.toISOString(), changes }],
    },
  };
  return parseSeed(next);
}
