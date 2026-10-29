// ייבוא וייצוא Excel. כל קובץ מיוצא נפתח מימין לשמאל. כל ייבוא עובר קודם
// בדיקת עמודות מזהות, ורק אחר כך מיפוי עמודות.
//
// SheetJS מגיע מה-CDN הרשמי (0.20.3) ולא מחבילת xlsx ב-npm, שנעצרה ב-0.18.5
// עם פגיעויות ידועות.

import * as XLSX from "xlsx";
import {
  COMMUNITIES,
  DELIVERY_MODES,
  SERVICE_MODES,
  type Community,
  type DeliveryMode,
  type ServiceMode,
  type MonthlyActivity,
  type Neighborhood,
  type Service,
  type Supplier,
} from "./model";
import { detectIdentifyingColumns, identifyingColumnsMessage } from "./privacy";
import type { Seed } from "./seed";
import { seedIndex } from "./seed";
import { defaultCopayTier } from "./settings";

export type Cell = string | number | boolean | Date | null | undefined;
export type Row = Record<string, Cell>;

export type SheetReadResult =
  | { ok: true; sheetName: string; headers: string[]; rows: Row[] }
  | { ok: false; blockedColumns: string[]; message: string };

/** קורא את הגיליון הראשון. קובץ עם עמודה מזהה נחסם לפני שקוראים שורה אחת. */
export function readFirstSheet(data: ArrayBuffer | Uint8Array): SheetReadResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true, dense: true });
  const sheetName = wb.SheetNames[0];
  const ws = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheetName || !ws) return { ok: false, blockedColumns: [], message: "בקובץ אין גיליון לקריאה" };

  const headerRow = (XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, blankrows: false })[0] ?? []) as Cell[];
  const headers = headerRow.map((h) => String(h ?? "").trim()).filter(Boolean);
  const blocked = detectIdentifyingColumns(headers);
  if (blocked.length) return { ok: false, blockedColumns: blocked, message: identifyingColumnsMessage(blocked) };

  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null, raw: true });
  return { ok: true, sheetName, headers, rows };
}

export interface SheetSpec {
  name: string;
  rows: Row[];
  /** סדר העמודות. ברירת מחדל: סדר המפתחות בשורה הראשונה. */
  headers?: string[];
}

/** בונה קובץ xlsx שנפתח מימין לשמאל, עם רוחב עמודות לפי התוכן. */
export function writeWorkbook(sheets: SheetSpec[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const headers = sheet.headers ?? Object.keys(sheet.rows[0] ?? {});
    const ws = XLSX.utils.json_to_sheet(sheet.rows, { header: headers });
    if (!sheet.rows.length) XLSX.utils.sheet_add_aoa(ws, [headers]);
    ws["!cols"] = headers.map((h) => ({
      wch: Math.min(48, Math.max(h.length, ...sheet.rows.map((r) => String(r[h] ?? "").length)) + 2),
    }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  wb.Workbook = { ...(wb.Workbook ?? {}), Views: [{ RTL: true }] };
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** האם קובץ שנכתב מסומן מימין לשמאל (לבדיקות). */
export function isWorkbookRtl(data: Uint8Array): boolean {
  const wb = XLSX.read(data, { type: "array" });
  return Boolean(wb.Workbook?.Views?.[0]?.RTL);
}

// ---------------------------------------------------------------------------
// מיפוי עמודות

export interface ImportField<K extends string = string> {
  key: K;
  label: string;
  required?: boolean;
  aliases: string[];
}

export type ColumnMapping<K extends string = string> = Partial<Record<K, string>>;

const norm = (s: string) => s.replace(/["'׳״]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/** מיפוי ראשוני לפי שם העמודה. המשתמשת יכולה לשנות אותו במסך. */
export function autoMapColumns<K extends string>(headers: string[], fields: ImportField<K>[]): ColumnMapping<K> {
  const mapping: ColumnMapping<K> = {};
  const used = new Set<string>();
  for (const f of fields) {
    const candidates = [f.label, ...f.aliases].map(norm);
    const header = headers.find((h) => !used.has(h) && candidates.includes(norm(h)));
    if (header) {
      mapping[f.key] = header;
      used.add(header);
    }
  }
  return mapping;
}

export const SERVICE_IMPORT_FIELDS = [
  { key: "name", label: "שם השירות", required: true, aliases: ["שירות", "שם שירות"] },
  { key: "neighborhood", label: "שכונה", required: true, aliases: ["קוד שכונה"] },
  { key: "serviceType", label: "סוג שירות", required: true, aliases: ["קוד סוג שירות", "service_type_id"] },
  { key: "category", label: "קטגוריה", aliases: ["קוד קטגוריה", "category_code"] },
  { key: "supplier", label: "קוד ספק", required: true, aliases: ["ספק", "supplier_code"] },
  { key: "languages", label: "שפות", aliases: ["שפה"] },
  { key: "unitPrice", label: "מחיר ליחידה", aliases: ["עלות ליחידה", "unit_price"] },
  { key: "marketPrice", label: "מחיר שוק", aliases: ["מחיר שוק לייחוס", "market_price"] },
  { key: "unit", label: "יחידה", aliases: [] },
  { key: "deliveryMode", label: "אופן מסירה", aliases: ["מסירה"] },
  { key: "communityFit", label: "התאמה קהילתית", aliases: ["קהילה"] },
  { key: "otherFunder", label: "מממן אחר", aliases: [] },
  { key: "startMonth", label: "חודש התחלה", aliases: ["התחלה"] },
  { key: "programId", label: "קוד תוכנית", aliases: ["תוכנית"] },
  // גרסה 0.4: מודל התשלום של החשכ"ל
  { key: "hoursPerUnit", label: "שעות ליחידה", aliases: ["שעות שירות ליחידה", "hours_per_unit"] },
  { key: "serviceMode", label: "אופן מתן", aliases: ["אופן מתן השירות", "service_mode"] },
  { key: "capacityLimited", label: "מוגבל מקום", aliases: ["רשימת המתנה", "capacity_limited"] },
  { key: "gatedByCompanion", label: "באישור מלווה", aliases: ["נפתח באישור מלווה", "gated_by_companion"] },
  { key: "gateReason", label: "סיבה לאישור מלווה", aliases: ["gate_reason"] },
] as const satisfies readonly ImportField[];

export type ServiceImportKey = (typeof SERVICE_IMPORT_FIELDS)[number]["key"];

export const ACTIVITY_IMPORT_FIELDS = [
  { key: "service", label: "שירות", required: true, aliases: ["שם השירות", "מזהה שירות", "קוד שירות"] },
  { key: "month", label: "חודש", required: true, aliases: ["תקופה"] },
  { key: "participants", label: "משתתפים ייחודיים", required: true, aliases: ["משתתפים", "מספר משתתפים"] },
  { key: "sessions", label: "מפגשים", aliases: ["מספר מפגשים"] },
  { key: "walletSpent", label: "הוצאה מהארנק", aliases: ["הוצאה", "ניצול"] },
] as const satisfies readonly ImportField[];

export type ActivityImportKey = (typeof ACTIVITY_IMPORT_FIELDS)[number]["key"];

export function missingRequiredMappings<K extends string>(fields: readonly ImportField<K>[], mapping: ColumnMapping<K>) {
  return fields.filter((f) => f.required && !mapping[f.key]);
}

// ---------------------------------------------------------------------------
// המרת שורות

export interface RowError {
  row: number;
  message: string;
}

const text = (c: Cell) => (c === null || c === undefined ? "" : c instanceof Date ? c.toISOString() : String(c).trim());

function num(c: Cell): number | undefined {
  if (typeof c === "number" && Number.isFinite(c)) return c;
  const t = text(c).replace(/[,\s₪]/g, "");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function yes(c: Cell): boolean {
  if (typeof c === "boolean") return c;
  return ["כן", "true", "1", "v", "x"].includes(text(c).toLowerCase());
}

const list = (c: Cell) =>
  text(c)
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** חודש בפורמט YYYY-MM מתוך תאריך, "2026-01", "01/2026" או "1.2026". */
export function normalizeMonth(c: Cell): string | null {
  if (c instanceof Date && !Number.isNaN(c.getTime())) {
    return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`;
  }
  const t = text(c);
  let m = /^(\d{4})[-/.](\d{1,2})/.exec(t);
  if (m) return `${m[1]}-${m[2]!.padStart(2, "0")}`;
  m = /^(\d{1,2})[-/.](\d{4})$/.exec(t);
  if (m) return `${m[2]}-${m[1]!.padStart(2, "0")}`;
  return null;
}

const COMMUNITY_WORDS: Record<string, Community> = { כללי: "general", חרדי: "haredi", ערבי: "arab" };
const DELIVERY_WORDS: Record<string, DeliveryMode> = { קהילה: "community", "במרחב קהילתי": "community", בבית: "home", בית: "home", מרחוק: "remote" };

function communities(c: Cell): Community[] {
  const out = list(c)
    .map((w) => COMMUNITY_WORDS[w] ?? ((COMMUNITIES as readonly string[]).includes(w) ? (w as Community) : null))
    .filter((x): x is Community => x !== null);
  return out.length ? [...new Set(out)] : ["general"];
}

const SERVICE_MODE_WORDS: Record<string, ServiceMode> = { קבוצתי: "group", קבוצה: "group", פרטני: "individual", בבית: "home", בית: "home", מרחוק: "remote" };

/** אופן מתן מתוך מילה או מזהה. תא ריק או לא מזוהה: בלי ערך, והשירות ייכנס לרשימת ההשלמות. */
function serviceMode(c: Cell): ServiceMode | undefined {
  const t = text(c);
  return SERVICE_MODE_WORDS[t] ?? ((SERVICE_MODES as readonly string[]).includes(t) ? (t as ServiceMode) : undefined);
}

function delivery(c: Cell): DeliveryMode {
  const t = text(c);
  return DELIVERY_WORDS[t] ?? ((DELIVERY_MODES as readonly string[]).includes(t) ? (t as DeliveryMode) : "community");
}

export interface ServiceImportContext {
  authority: string;
  neighborhoods: readonly Neighborhood[];
  suppliers: readonly Supplier[];
  seed: Seed;
  newId: () => string;
  defaultStartMonth: string;
}

/** ממיר שורות לשירותים בסטטוס טיוטה. שורה שאי אפשר לשייך לשכונה נדחית עם הסבר. */
export function rowsToServices(
  rows: Row[],
  mapping: ColumnMapping<ServiceImportKey>,
  ctx: ServiceImportContext,
): { services: Service[]; errors: RowError[] } {
  const { serviceTypes, categories } = seedIndex(ctx.seed);
  const typeByName = new Map(ctx.seed.service_types.map((t) => [norm(t.name), t]));
  const get = (row: Row, key: ServiceImportKey) => (mapping[key] ? row[mapping[key]!] : undefined);
  const services: Service[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // שורה 1 היא הכותרות
    const name = text(get(row, "name"));
    if (!name) {
      errors.push({ row: rowNumber, message: "חסר שם שירות" });
      return;
    }
    const nKey = text(get(row, "neighborhood"));
    const neighborhood = ctx.neighborhoods.find((n) => n.id === nKey || norm(n.name) === norm(nKey));
    if (!neighborhood) {
      errors.push({ row: rowNumber, message: `שכונה "${nKey}" לא מוגדרת ברשות` });
      return;
    }
    const typeKey = text(get(row, "serviceType"));
    const type = serviceTypes.get(typeKey.toUpperCase()) ?? typeByName.get(norm(typeKey));
    const categoryRaw = text(get(row, "category"));
    const categoryCode = categories.has(categoryRaw) ? categoryRaw : (type?.category ?? categoryRaw);
    const supplierRaw = text(get(row, "supplier"));
    const supplier = ctx.suppliers.find((s) => s.code === supplierRaw);
    const unitPrice = num(get(row, "unitPrice"));
    const hoursPerUnit = num(get(row, "hoursPerUnit"));
    const mode = serviceMode(get(row, "serviceMode"));
    const gated = yes(get(row, "gatedByCompanion"));
    const gateReason = text(get(row, "gateReason"));

    services.push({
      id: ctx.newId(),
      authority: ctx.authority,
      neighborhoodId: neighborhood.id,
      name,
      categoryCode,
      serviceTypeId: type?.id ?? typeKey,
      supplierCode: supplier?.code ?? supplierRaw,
      languages: list(get(row, "languages")),
      format: type?.format ?? "",
      unit: text(get(row, "unit")) || type?.unit || "",
      ...(unitPrice !== undefined ? { unitPrice, pricePoints: unitPrice * ctx.seed.settings.points_per_shekel } : {}),
      ...(num(get(row, "marketPrice")) !== undefined ? { marketPrice: num(get(row, "marketPrice"))! } : {}),
      copayTier: defaultCopayTier(ctx.seed, categoryCode),
      communityFit: communities(get(row, "communityFit")),
      deliveryMode: delivery(get(row, "deliveryMode")),
      attendanceMethod: [],
      otherFunder: yes(get(row, "otherFunder")),
      enforceable: true,
      ...(text(get(row, "programId")) ? { programId: text(get(row, "programId")) } : {}),
      ...(hoursPerUnit !== undefined && hoursPerUnit > 0 ? { hoursPerUnit } : {}),
      ...(mode ? { serviceMode: mode } : {}),
      ...(mode === "group" && yes(get(row, "capacityLimited")) ? { capacityLimited: true } : {}),
      ...(gated ? { gatedByCompanion: true, ...(gateReason ? { gateReason } : {}) } : {}),
      startMonth: normalizeMonth(get(row, "startMonth")) ?? ctx.defaultStartMonth,
      status: "טיוטה",
    });
  });
  return { services, errors };
}

/** ממיר שורות פעילות. השירות מזוהה לפי מזהה או לפי שם (בתוך הרשות). */
export function rowsToActivity(
  rows: Row[],
  mapping: ColumnMapping<ActivityImportKey>,
  services: readonly Service[],
): { activity: MonthlyActivity[]; errors: RowError[] } {
  const get = (row: Row, key: ActivityImportKey) => (mapping[key] ? row[mapping[key]!] : undefined);
  const activity: MonthlyActivity[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const key = text(get(row, "service"));
    const matches = services.filter((s) => s.id === key || norm(s.name) === norm(key));
    if (matches.length !== 1) {
      errors.push({ row: rowNumber, message: matches.length ? `יותר משירות אחד בשם "${key}"` : `שירות "${key}" לא בקטלוג` });
      return;
    }
    const month = normalizeMonth(get(row, "month"));
    const participants = num(get(row, "participants"));
    if (!month || participants === undefined || participants < 0 || !Number.isInteger(participants)) {
      errors.push({ row: rowNumber, message: "חודש או מספר משתתפים לא תקינים" });
      return;
    }
    const walletSpent = num(get(row, "walletSpent"));
    activity.push({
      serviceId: matches[0]!.id,
      month,
      uniqueParticipants: participants,
      sessions: Math.max(0, Math.round(num(get(row, "sessions")) ?? 0)),
      ...(walletSpent !== undefined ? { walletSpent } : {}),
    });
  });
  return { activity, errors };
}

/** מחליף רשומות פעילות קיימות לאותו שירות וחודש, ומוסיף חדשות. */
export function upsertActivity(existing: readonly MonthlyActivity[], incoming: readonly MonthlyActivity[]): MonthlyActivity[] {
  const key = (a: MonthlyActivity) => `${a.serviceId}|${a.month}`;
  const map = new Map(existing.map((a) => [key(a), a]));
  for (const a of incoming) map.set(key(a), a);
  return [...map.values()];
}

// ---------------------------------------------------------------------------
// דוחות

/** תוויות בעברית לערכים במודל, מתוך ה-seed. */
export function labels(seed: Seed) {
  const byId = <T extends { id: string; name: string }>(items: readonly T[]) =>
    Object.fromEntries(items.map((i) => [i.id, i.name])) as Record<string, string>;
  const rate = (r: number) => `${Math.round(r * 100)}%`;
  const tiers = seed.settings.copay_tiers;
  return {
    community: byId(seed.community_profiles),
    supplierType: byId(seed.supplier_types),
    deliveryMode: byId(seed.delivery_modes),
    attendance: byId(seed.attendance_methods),
    copayTier: {
      core_and_prevention: `ליבה ומניעה (${rate(tiers.core_and_prevention)})`,
      classes: `חוגים (${rate(tiers.classes)})`,
      qol: seed.settings.qol_mode.value === "fixed_amount" ? "איכות חיים (סכום קבוע מהנקודות)" : `איכות חיים (${rate(seed.settings.qol_copay)})`,
    } as Record<string, string>,
  };
}

export interface CommitteeRowInput {
  service: Service;
  neighborhoodName: string;
  supplierLabel: string;
  entryStatus: string;
  entryReason: string;
  missingFields: string[];
  referenceMedian: number | null;
}

/** קובץ Excel לוועדה: שירות בשורה, עם סטטוס, מבחן כניסה ומחיר ייחוס. */
export function committeeWorkbook(rows: CommitteeRowInput[], seed: Seed): Uint8Array {
  const { categories, serviceTypes } = seedIndex(seed);
  const l = labels(seed);
  const headers = [
    "שכונה",
    "שם השירות",
    "קטגוריה",
    "סוג שירות",
    "ספק",
    "שפות",
    "אופן מסירה",
    "יחידה",
    "מחיר ליחידה",
    "מחיר שוק",
    "מחיר ייחוס (חציון)",
    "השתתפות עצמית",
    "מבחן כניסה",
    "סיבה",
    "שדות חסרים",
    "סטטוס",
    "הערת ועדה",
  ];
  const data: Row[] = rows.map(({ service: s, ...r }) => ({
    שכונה: r.neighborhoodName,
    "שם השירות": s.name,
    קטגוריה: categories.get(s.categoryCode)?.name ?? s.categoryCode,
    "סוג שירות": serviceTypes.get(s.serviceTypeId)?.name ?? s.serviceTypeId,
    ספק: r.supplierLabel,
    שפות: s.languages.join(", "),
    "אופן מסירה": l.deliveryMode[s.deliveryMode] ?? s.deliveryMode,
    יחידה: s.unit,
    "מחיר ליחידה": s.unitPrice ?? null,
    "מחיר שוק": s.marketPrice ?? null,
    "מחיר ייחוס (חציון)": r.referenceMedian,
    "השתתפות עצמית": l.copayTier[s.copayTier] ?? s.copayTier,
    "מבחן כניסה": r.entryStatus,
    סיבה: r.entryReason,
    "שדות חסרים": r.missingFields.join(", "),
    סטטוס: s.status,
    "הערת ועדה": s.committeeNote ?? "",
  }));
  return writeWorkbook([{ name: "שירותים לוועדה", rows: data, headers }]);
}

/** תבנית ריקה לייבוא שירותים, עם כותרות בעברית. */
export function serviceTemplateWorkbook(): Uint8Array {
  const headers = SERVICE_IMPORT_FIELDS.map((f) => f.label);
  return writeWorkbook([{ name: "שירותים", rows: [], headers }]);
}

export function activityTemplateWorkbook(): Uint8Array {
  const headers = ACTIVITY_IMPORT_FIELDS.map((f) => f.label);
  return writeWorkbook([{ name: "פעילות חודשית", rows: [], headers }]);
}
