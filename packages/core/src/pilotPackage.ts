// חבילת פיילוט: מה שהשטח שולח למטה, ואיחוד החבילות במטה.
//
// פרטי ספק שהוא אדם פרטי (personal_data = true) עוברים בחבילה רק כש-
// supplier_contact_to_hq = true (הוכרע 28.10.2026). לייצוא לאינטגרטור הם לא
// עוברים אף פעם, ראו catalogExport.ts.

import {
  pilotPackageSchema,
  type AuthorityData,
  type MonthlyActivity,
  type Neighborhood,
  type NeighborhoodMonth,
  type PilotPackage,
  type Service,
  type Supplier,
} from "./model";
import { contentHash } from "./hash";
import { RESIDENT_FIELD_KEYS, findForbiddenKeys } from "./privacy";
import type { Seed } from "./seed";
import { seedIndex } from "./seed";

type PackageContent = Omit<PilotPackage, "exportedAt" | "contentHash">;

/** מכין ספק לחבילה לפי ההגדרה: עם פרטי קשר, או קוד וסוג בלבד לאדם פרטי. */
export function supplierForPackage(supplier: Supplier, seed: Seed): Supplier {
  if (seed.settings.supplier_contact_to_hq) return supplier;
  const personal = seedIndex(seed).supplierTypes.get(supplier.type)?.personal_data ?? true;
  const { contact: _contact, displayName, ...rest } = supplier;
  return personal ? rest : { ...rest, ...(displayName ? { displayName } : {}) };
}

function packageContent(data: AuthorityData, seed: Seed): PackageContent {
  const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);
  return {
    schema: "pilot_package_v1",
    authority: data.authority,
    seedVersion: seed.meta.version,
    neighborhoods: [...data.neighborhoods].sort(byId),
    suppliers: data.suppliers
      .map((s) => supplierForPackage(s, seed))
      .sort((a, b) => a.code.localeCompare(b.code)),
    services: [...data.services].sort(byId),
    activity: [...data.activity].sort(
      (a, b) => a.serviceId.localeCompare(b.serviceId) || a.month.localeCompare(b.month),
    ),
    enrollment: [...data.enrollment].sort(
      (a, b) => a.neighborhoodId.localeCompare(b.neighborhoodId) || a.month.localeCompare(b.month),
    ),
  };
}

/** בונה חבילת פיילוט. החתימה מחושבת על התוכן בלבד, בלי זמן הייצוא. */
export async function buildPilotPackage(data: AuthorityData, seed: Seed, now = new Date()): Promise<PilotPackage> {
  const content = packageContent(data, seed);
  const pkg: PilotPackage = { ...content, exportedAt: now.toISOString(), contentHash: await contentHash(content) };
  assertValidPackage(pkg);
  return pkg;
}

function assertValidPackage(pkg: unknown): asserts pkg is PilotPackage {
  const parsed = pilotPackageSchema.safeParse(pkg);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`חבילת הפיילוט לא תקינה: ${issues.join("; ")}`);
  }
  const forbidden = findForbiddenKeys(pkg, RESIDENT_FIELD_KEYS);
  if (forbidden.length) throw new Error(`בחבילה יש שדות של תושבים: ${forbidden.join(", ")}`);
}

/** קורא חבילה מטקסט, בודק סכמה ומוודא שהחתימה תואמת לתוכן. */
export async function parsePilotPackage(text: string): Promise<PilotPackage> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("הקובץ אינו JSON תקין");
  }
  assertValidPackage(raw);
  const { exportedAt: _e, contentHash: hash, ...content } = raw;
  if ((await contentHash(content)) !== hash) {
    throw new Error("חתימת התוכן לא תואמת. ייתכן שהקובץ נערך אחרי הייצוא");
  }
  return raw;
}

// ---------------------------------------------------------------------------
// איחוד במטה

export interface LoadedPackage {
  authority: string;
  contentHash: string;
  seedVersion: string;
  exportedAt: string;
  neighborhoodIds: string[];
}

export interface HqState {
  packages: LoadedPackage[];
  neighborhoods: Neighborhood[];
  suppliers: Supplier[];
  services: Service[];
  activity: MonthlyActivity[];
  enrollment: NeighborhoodMonth[];
}

export const emptyHqState = (): HqState => ({
  packages: [],
  neighborhoods: [],
  suppliers: [],
  services: [],
  activity: [],
  enrollment: [],
});

export interface ServiceChange {
  before: Service;
  after: Service;
  fields: (keyof Service)[];
}

export interface PackageDiff {
  authority: string;
  alreadyLoaded: boolean;
  /** מזהים שכבר שייכים לרשות אחרת. רשימה לא ריקה פירושה שהמיזוג ייעצר. */
  collisions: string[];
  added: Service[];
  changed: ServiceChange[];
  removed: Service[];
  unchanged: number;
  suppliersAdded: number;
  suppliersChanged: number;
  activityRows: number;
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** החבילה מחליפה את נתוני הרשות בשכונות שמופיעות בה. שירות מזוהה לפי רשות ומזהה. */
function inScope(pkg: PilotPackage) {
  const ids = new Set(pkg.neighborhoods.map((n) => n.id));
  return (authority: string, neighborhoodId: string) => authority === pkg.authority && ids.has(neighborhoodId);
}

export function diffPackage(state: HqState, pkg: PilotPackage): PackageDiff {
  const alreadyLoaded = state.packages.some((p) => p.contentHash === pkg.contentHash);
  const scope = inScope(pkg);
  const existing = new Map(
    state.services.filter((s) => scope(s.authority, s.neighborhoodId)).map((s) => [s.id, s]),
  );
  const incoming = new Map(pkg.services.map((s) => [s.id, s]));

  const added: Service[] = [];
  const changed: ServiceChange[] = [];
  let unchanged = 0;
  for (const s of pkg.services) {
    const before = existing.get(s.id);
    if (!before) added.push(s);
    else if (sameJson(before, s)) unchanged++;
    else {
      const keys = new Set([...Object.keys(before), ...Object.keys(s)]) as Set<keyof Service>;
      changed.push({ before, after: s, fields: [...keys].filter((k) => !sameJson(before[k], s[k])) });
    }
  }
  const removed = [...existing.values()].filter((s) => !incoming.has(s.id));

  const suppliers = new Map(state.suppliers.filter((s) => s.authority === pkg.authority).map((s) => [s.code, s]));
  const suppliersAdded = pkg.suppliers.filter((s) => !suppliers.has(s.code)).length;
  const suppliersChanged = pkg.suppliers.filter((s) => suppliers.has(s.code) && !sameJson(suppliers.get(s.code), s)).length;

  return {
    authority: pkg.authority,
    alreadyLoaded,
    collisions: idCollisions(state, pkg),
    added,
    changed,
    removed,
    unchanged,
    suppliersAdded,
    suppliersChanged,
    activityRows: pkg.activity.length,
  };
}

/**
 * מזהי שירות ושכונה חייבים להיות ייחודיים בין רשויות (המשטח מייצר UUID),
 * כי רשומת פעילות מזוהה רק לפי serviceId. התנגשות נעצרת כאן ולא נבלעת.
 */
export function idCollisions(state: HqState, pkg: PilotPackage): string[] {
  const serviceAuthority = new Map(state.services.map((s) => [s.id, s.authority]));
  const neighborhoodAuthority = new Map(state.neighborhoods.map((n) => [n.id, n.authority]));
  return [
    ...pkg.services
      .filter((s) => (serviceAuthority.get(s.id) ?? pkg.authority) !== pkg.authority)
      .map((s) => `שירות ${s.id}`),
    ...pkg.neighborhoods
      .filter((n) => (neighborhoodAuthority.get(n.id) ?? pkg.authority) !== pkg.authority)
      .map((n) => `שכונה ${n.id}`),
  ];
}

/** ממזג חבילה למצב המטה. חבילה שכבר נטענה (אותה חתימה) לא משנה דבר. */
export function mergePackage(state: HqState, pkg: PilotPackage): HqState {
  if (state.packages.some((p) => p.contentHash === pkg.contentHash)) return state;
  const collisions = idCollisions(state, pkg);
  if (collisions.length) {
    throw new Error(`מזהים שכבר שייכים לרשות אחרת: ${collisions.join(", ")}`);
  }

  const scope = inScope(pkg);
  const neighborhoodIds = new Set(pkg.neighborhoods.map((n) => n.id));
  const replacedServiceIds = new Set([
    ...state.services.filter((s) => scope(s.authority, s.neighborhoodId)).map((s) => s.id),
    ...pkg.services.map((s) => s.id),
  ]);
  const supplierCodes = new Set(pkg.suppliers.map((s) => s.code));

  return {
    packages: [
      ...state.packages.filter(
        (p) => !(p.authority === pkg.authority && p.neighborhoodIds.every((id) => neighborhoodIds.has(id))),
      ),
      {
        authority: pkg.authority,
        contentHash: pkg.contentHash,
        seedVersion: pkg.seedVersion,
        exportedAt: pkg.exportedAt,
        neighborhoodIds: [...neighborhoodIds],
      },
    ],
    neighborhoods: [
      ...state.neighborhoods.filter((n) => !(n.authority === pkg.authority && neighborhoodIds.has(n.id))),
      ...pkg.neighborhoods,
    ],
    suppliers: [
      ...state.suppliers.filter((s) => !(s.authority === pkg.authority && supplierCodes.has(s.code))),
      ...pkg.suppliers,
    ],
    services: [...state.services.filter((s) => !replacedServiceIds.has(s.id)), ...pkg.services],
    activity: [...state.activity.filter((a) => !replacedServiceIds.has(a.serviceId)), ...pkg.activity],
    enrollment: [
      ...state.enrollment.filter((e) => !neighborhoodIds.has(e.neighborhoodId)),
      ...pkg.enrollment,
    ],
  };
}
