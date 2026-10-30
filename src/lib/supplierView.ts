/**
 * מבט על ספקים, משותף לניהול הספקים במטה ולדף של הספק עצמו. הכל מחושב מאותם
 * מקורות: נתוני ההדגמה של ירושלים, תקן הקליטה, הכיסוי מול הרצפה, "ביקשו ואין"
 * של המלוות והזמנות מיומן האירועים של הפיילוט. בלי תשלומים ובלי דירוג: אלה אצל ספק העל.
 */
import {
  buildDemoAuthority,
  complementOf,
  coverage,
  defaultSeed,
  DEMO_JERUSALEM,
  entryTest,
  ENTRY_STATUS,
  missingMandatoryFields,
  onboardingGaps,
  seedIndex,
  type AuthorityData,
  type Service,
  type Supplier,
} from "@sal-ishi/core";
import type { Booking } from "@/pilot/model";

export const SUPPLIER_TYPE_LABEL: Record<string, string> = {
  exempt: "עוסק פטור",
  licensed: "עוסק מורשה",
  company: "חברה",
  npo: "עמותה",
  authority: "רשות",
};

export const DELIVERY_LABEL: Record<string, string> = { community: "במרכז קהילתי", home: "בבית", remote: "מרחוק" };

let cached: AuthorityData | null = null;
export const supplierData = (): AuthorityData => (cached ??= buildDemoAuthority(DEMO_JERUSALEM));

export const supplierName = (s: Supplier) => s.displayName ?? `ספק ${s.code}`;

export interface ServiceRow {
  service: Service;
  ids: string[];
  hoods: string[];
  statuses: string[];
  entry: ReturnType<typeof entryTest>;
  missing: string[];
  ready: boolean;
}

export type SupplierStage = "active" | "onboarding" | "blocked";
export const STAGE_LABEL: Record<SupplierStage, string> = { active: "פעיל בשוק", onboarding: "בקליטה", blocked: "דורש השלמה" };

export interface SupplierSummary {
  supplier: Supplier;
  rows: ServiceRow[];
  referrals: number;
  ready: number;
  stage: SupplierStage;
  hoods: string[];
  bookings: number;
  activeBookings: number;
  participants: number;
  flags: string[];
}

const hoodName = (data: AuthorityData, id: string) => data.neighborhoods.find((n) => n.id === id)?.name ?? id;

/** שורה אחת לכל שירות של הספק (אותו שם בכמה שכונות מתאחד), בלי הפניות למממן אחר. */
export function serviceRows(data: AuthorityData, code: string): { rows: ServiceRow[]; referrals: number } {
  const all = data.services.filter((s) => s.supplierCode === code);
  const referrals = all.filter((s) => complementOf(s, defaultSeed).state === "full");
  const services = all.filter((s) => !referrals.includes(s));
  const byName = new Map<string, Service[]>();
  for (const s of services) byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  const rows = [...byName.values()].map((group): ServiceRow => {
    const s = group[0];
    const entry = entryTest(s, defaultSeed);
    const missing = [...new Set(group.flatMap((g) => [...missingMandatoryFields(g, data.activity, defaultSeed).map((m) => m.label), ...onboardingGaps(g, defaultSeed)]))];
    const ready = group.every((g) => g.status === "אושר") && missing.length === 0 && entry.status === ENTRY_STATUS.in;
    return { service: s, ids: group.map((g) => g.id), hoods: [...new Set(group.map((g) => hoodName(data, g.neighborhoodId)))], statuses: [...new Set(group.map((g) => g.status))], entry, missing, ready };
  });
  return { rows, referrals: referrals.length };
}

export function summarize(data: AuthorityData, supplier: Supplier, bookings: readonly Booking[]): SupplierSummary {
  const { rows, referrals } = serviceRows(data, supplier.code);
  const ready = rows.filter((r) => r.ready).length;
  const ids = new Set(rows.flatMap((r) => r.ids));
  const mine = bookings.filter((b) => ids.has(b.serviceId));
  const lastMonth = [...data.activity.map((a) => a.month)].sort().at(-1) ?? "";
  const participants = data.activity.filter((a) => a.month === lastMonth && ids.has(a.serviceId)).reduce((n, a) => n + a.uniqueParticipants, 0);
  const stage: SupplierStage = rows.length && ready === rows.length ? "active" : ready > 0 ? "onboarding" : "blocked";
  const flags: string[] = [];
  if (!supplier.accessible) flags.push("לא נגיש");
  if (supplier.languages.length < 2) flags.push("שפה אחת");
  if (!supplier.contact?.phone && !supplier.contact?.email) flags.push("אין איש קשר");
  return {
    supplier,
    rows,
    referrals,
    ready,
    stage,
    hoods: [...new Set(rows.flatMap((r) => r.hoods))],
    bookings: mine.length,
    activeBookings: mine.filter((b) => b.status === "booked").length,
    participants,
    flags,
  };
}

export interface Opportunity {
  neighborhood: string;
  what: string;
  why: string;
  requests: number;
  /** האם הספק כבר נותן שירות מהסוג הזה (במקום אחר) ויכול להרחיב. */
  canExpand: boolean;
}

/**
 * הזדמנויות: פערים אדומים ברצפה ובקשות "ביקשו ואין". עם code, רק בשכונות של
 * הספק, ומסומן מה הוא כבר יודע לתת. בלי code, לכל הרשות (לגיוס במטה).
 */
export function opportunities(data: AuthorityData, code?: string): Opportunity[] {
  const { serviceTypes } = seedIndex(defaultSeed);
  const supplier = code ? data.suppliers.find((s) => s.code === code) : undefined;
  const mineTypes = new Set(data.services.filter((s) => s.supplierCode === code).map((s) => s.serviceTypeId));
  const mineCats = new Set(data.services.filter((s) => s.supplierCode === code).map((s) => s.categoryCode));
  const inScope = (hood: string) => !supplier || supplier.neighborhoods.includes(hood);
  const out: Opportunity[] = [];
  for (const u of data.unmetDemand ?? []) {
    if (!inScope(u.neighborhoodId)) continue;
    out.push({
      neighborhood: hoodName(data, u.neighborhoodId),
      what: serviceTypes.get(u.serviceTypeId)?.name ?? u.serviceTypeId,
      why: `${u.requests} בקשות מהמלוות שאין להן מענה`,
      requests: u.requests,
      canExpand: mineTypes.has(u.serviceTypeId),
    });
  }
  const cov = coverage(data, defaultSeed);
  for (const c of cov.cells.filter((x) => x.level === "red" && inScope(x.neighborhoodId))) {
    const cc = defaultSeed.core_categories.find((x) => x.id === c.coreCategoryId);
    out.push({
      neighborhood: hoodName(data, c.neighborhoodId),
      what: cc?.name ?? c.coreCategoryId,
      why: `מתחת לרצפה: ${c.count} מתוך ${c.floor} שירותים`,
      requests: 0,
      canExpand: !!cc && cc.codes.some((x) => mineCats.has(x)),
    });
  }
  return out.sort((a, b) => Number(b.canExpand) - Number(a.canExpand) || b.requests - a.requests);
}

/** מי מהספקים הקיימים כבר נותן את סוג השירות, כדי לפנות אליו קודם. */
export function suppliersOfType(data: AuthorityData, what: string): string[] {
  const { serviceTypes } = seedIndex(defaultSeed);
  const typeIds = [...serviceTypes.values()].filter((t) => t.name === what).map((t) => t.id);
  const codes = new Set(data.services.filter((s) => typeIds.includes(s.serviceTypeId)).map((s) => s.supplierCode));
  return data.suppliers.filter((s) => codes.has(s.code)).map(supplierName);
}
