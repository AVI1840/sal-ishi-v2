// טעינת קובץ הבסיס (seed) ובדיקת המבנה שלו. כל סף וכל כלל עסקי נקראים מכאן,
// אף אחד מהם לא מקודד במנוע הכללים.

import { z } from "zod";
import rawSeed from "../seed/seed_data_catalog_v0.4.json";
import { communitySchema, supplierTypeSchema, deliveryModeSchema, attendanceMethodSchema } from "./model";

const ratio = z.number().min(0).max(1);
const hours = z.number().int().nonnegative().nullable();

/** הגדרה בפורמט של 0.4: ערך וסטטוס באותו אובייקט. */
const withStatus = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value, status: z.string().optional(), options: z.array(z.string()).optional() }).passthrough();

export const QOL_MODES = ["fixed_amount", "percent"] as const;
export const REFERENCE_PRICE_MODES = ["monitor", "binding", "preactivated_low_competition"] as const;
export const NO_SHOW_RULES = ["individual_or_capacity_limited_only", "always", "never"] as const;

export const settingsSchema = z
  .object({
    min_participants: z.number().int().positive(),
    min_active_months: z.number().int().positive(),
    core_floor: z.number().int().positive(),
    personal_wallet: z.number().positive(),
    utilization_target: ratio,
    red_flag_avg: ratio,
    qol_counts_in_target: z.boolean(),
    companion_escort_counts_in_wallet: z.boolean(),
    small_cell_threshold: z.number().int().positive(),
    subarea_alerts: z.array(z.string()),
    copay_tiers: z
      .object({ core_and_prevention: ratio, classes: ratio, qol: ratio })
      .passthrough(),
    points_per_shekel: z.number().positive(),
    utilization_window: z.string().regex(/\d+/),
    price_outlier_threshold: z.number().nonnegative(),
    reference_price_method: z.literal("median_by_service_type_and_unit"),
    reference_price_min_samples: z.number().int().positive(),
    hot_meal_entry_criteria: z.array(z.string()),
    publish_to_citizen_statuses: z.array(z.string()),
    supplier_contact_to_hq: z.boolean().default(false),
    // תוספות מתוך מסמך הקטלוג (מפגש 2) ומהכרעות הבעלים. כולן בסטטוס הצעה ב-seed.
    matching_weights: z
      .object({ prevention: ratio, motivation: ratio, profileFit: ratio, socialProof: ratio, proximity: ratio })
      .refine((w) => Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 0.011, "סכום המשקלות חייב להיות 100%")
      .optional(),
    selection_min_per_domain: z.number().int().nonnegative().optional(),
    selection_max_active: z.number().int().positive().optional(),
    selection_change_months: z.number().int().positive().optional(),
    suggestions_per_domain: z.number().int().positive().optional(),
    /** ישן (4 רכיבים). נשאר לקריאת seed ישן, לא בשימוש. */
    supplier_rating_weights: z.record(z.string(), ratio).optional(),
    /** משקלות חמשת רכיבי הדירוג. חסר: ממוצע שווה (המשקלות ייקבעו). */
    supplier_rating_component_weights: z
      .record(z.enum(["audienceFit", "satisfaction", "quality", "serviceLevel", "outcomes"]), ratio)
      .refine((w) => Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 0.011, "סכום המשקלות חייב להיות 100%")
      .optional(),
    supplier_rating_min_evaluations: z.number().int().positive().optional(),
    competition_max_suppliers_local: z.number().int().positive().optional(),
    competition_max_suppliers_national: z.number().int().positive().optional(),
    subcategory_breadth_min: z.number().int().nonnegative().optional(),
    subarea_alert_min: z.number().int().nonnegative().optional(),
    supplier_rating_enabled: z.boolean().optional(),
    // תוספת 3: גיוון ונגישות ברצפה, יעד עושר, וספירת שירותים לא מקומיים.
    floor_min_accessible: withStatus(z.number().int().nonnegative()).optional(),
    target_per_category: withStatus(z.number().int().positive()).optional(),
    floor_max_nonlocal: z
      .object({ large_city: z.number().int().nonnegative(), small_authority: z.number().int().nonnegative(), status: z.string().optional() })
      .passthrough()
      .optional(),
    large_city_authorities: z.array(z.string()).optional(),
    // גרסה 0.4: מודל התשלום של החשכ"ל.
    qol_copay: ratio,
    qol_cap_month: z.number().nonnegative(),
    cancellation_notice_hours: z
      .object({ group: hours, home: hours, individual: hours.optional(), remote: hours.optional(), status: z.string().optional() })
      .passthrough(),
    no_show_charge_rule: withStatus(z.enum(NO_SHOW_RULES)),
    hospitalization_refund: z
      .object({ group: z.string(), individual: z.string(), notify_companion: z.boolean(), status: z.string().optional() })
      .passthrough(),
    products_quarterly_cap_share: withStatus(ratio),
    products_count_in_floor: z.boolean(),
    qol_mode: withStatus(z.enum(QOL_MODES)),
    active_participant_min_sessions_month: withStatus(z.number().int().positive()),
    reference_price_mode: withStatus(z.enum(REFERENCE_PRICE_MODES)),
    reference_price_binding_scope: z.array(z.object({ categoryCode: z.string(), authority: z.string() }).strict()).default([]),
    low_competition_operator_threshold: z.number().int().positive(),
    price_index_period: z.enum(["quarter", "month"]),
    first_service_max_days: z.number().int().positive(),
  })
  .passthrough();

const metricDefinitionSchema = z
  .object({ id: z.string(), name: z.string(), definition: z.string() })
  .passthrough();

const categorySchema = z
  .object({
    code: z.string(),
    domain: z.string(),
    name: z.string(),
    inside: z.string().nullable(),
    outside: z.string().nullable(),
    layer: z.string(),
    core: z.boolean(),
    core_category: z.string().nullable(),
  })
  .passthrough();

const serviceTypeSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    name: z.string(),
    format: z.string(),
    unit: z.string(),
    scope: z.string(),
    jerusalem: z.object({ tried: z.string(), services: z.number(), participants: z.number() }),
    note: z.string().nullable(),
  })
  .passthrough();

const coreCategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    codes: z.array(z.string()),
    subareas: z.array(
      z.object({ code: z.string(), name: z.string(), alert_if_below_floor: z.boolean().optional() }).passthrough(),
    ),
    national_list_only: z.boolean().optional(),
  })
  .passthrough();

export const seedSchema = z
  .object({
    meta: z.object({ version: z.string(), schema: z.string() }).passthrough(),
    settings: settingsSchema,
    categories: z.array(categorySchema),
    service_types: z.array(serviceTypeSchema),
    entry_test: z.array(z.object({ order: z.number(), question: z.string(), if_no: z.string() })),
    qol_rules: z.array(
      z.object({ category: z.string(), item: z.string(), value: z.number().nullable() }).passthrough(),
    ),
    mandatory_fields: z.array(z.object({ field: z.string(), label: z.string() })),
    core_categories: z.array(coreCategorySchema),
    community_profiles: z.array(z.object({ id: communitySchema, name: z.string() }).passthrough()),
    supplier_types: z.array(z.object({ id: supplierTypeSchema, name: z.string(), personal_data: z.boolean() })),
    delivery_modes: z.array(z.object({ id: deliveryModeSchema, name: z.string() })),
    attendance_methods: z.array(z.object({ id: attendanceMethodSchema, name: z.string() })),
    copay_note: z.string().optional(),
    metrics_definitions: z.array(metricDefinitionSchema),
    export_contract: z
      .object({
        name: z.literal("operator_onboarding_standard"),
        version: z.string(),
        owner: z.string(),
        includes: z.array(z.string()),
        excludes: z.array(z.string()),
      })
      .passthrough(),
  })
  .passthrough();

export type Settings = z.infer<typeof settingsSchema>;
export type Seed = z.infer<typeof seedSchema>;
export type Category = Seed["categories"][number];
export type ServiceType = Seed["service_types"][number];
export type CoreCategory = Seed["core_categories"][number];

/** בודק ומחזיר seed. זורק שגיאה עם רשימת הבעיות אם המבנה לא תקין. */
export function parseSeed(raw: unknown): Seed {
  const result = seedSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`קובץ הבסיס לא תקין: ${issues}`);
  }
  return result.data;
}

/** ה-seed שמגיע עם הקוד (גרסה 0.4). */
export const defaultSeed: Seed = parseSeed(rawSeed);

/** גרסת הבסיס: 0.4.2 שייכת ל-0.4. */
export function seedBaseVersion(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** האם seed שמור שייך לגרסת בסיס ישנה מזו שבקוד (למשל 0.3 מול 0.4). */
export function isOlderSeedBase(saved: unknown, bundled: Seed = defaultSeed): boolean {
  const version = (saved as { meta?: { version?: unknown } } | null)?.meta?.version;
  return typeof version !== "string" || compareVersions(seedBaseVersion(version), seedBaseVersion(bundled.meta.version)) < 0;
}

/**
 * seed שנשמר בדפדפן או שהגיע מהמטה. באותה גרסת בסיס משלימים רק את המפתחות
 * החסרים מה-seed המובנה, בלי לדרוס ערכים שהמטה קבע. בגרסת בסיס ישנה (0.3 מול
 * 0.4) מבנה ההגדרות השתנה, ולכן עוברים ל-seed המובנה, והמסך מודיע על כך.
 */
export function upgradeSeed(saved: unknown, bundled: Seed = defaultSeed): Seed {
  if (saved === bundled) return bundled;
  if (isOlderSeedBase(saved, bundled)) return bundled;
  const raw = saved as { settings?: Record<string, unknown> };
  const current = raw.settings ?? {};
  const missing = Object.fromEntries(Object.entries(bundled.settings).filter(([k]) => !(k in current)));
  return parseSeed({ ...raw, settings: { ...missing, ...current } });
}

/** עותק של ה-seed עם הגדרות מעודכנות. משמש את מסך ההגדרות במטה ואת הבדיקות. */
export function withSettings(seed: Seed, patch: Partial<Settings>): Seed {
  return { ...seed, settings: settingsSchema.parse({ ...seed.settings, ...patch }) };
}

function buildIndex(seed: Seed) {
  const categories = new Map(seed.categories.map((c) => [c.code, c]));
  const serviceTypes = new Map(seed.service_types.map((t) => [t.id, t]));
  const supplierTypes = new Map(seed.supplier_types.map((t) => [t.id, t]));
  const coreCategoryByCode = new Map<string, CoreCategory>();
  for (const cc of seed.core_categories) for (const code of cc.codes) coreCategoryByCode.set(code, cc);
  return { categories, serviceTypes, supplierTypes, coreCategoryByCode };
}

export type SeedIndex = ReturnType<typeof buildIndex>;

const indexCache = new WeakMap<Seed, SeedIndex>();

/** אינדקסים לחיפוש מהיר בתוך ה-seed (נשמרים לכל אובייקט seed). */
export function seedIndex(seed: Seed): SeedIndex {
  let idx = indexCache.get(seed);
  if (!idx) {
    idx = buildIndex(seed);
    indexCache.set(seed, idx);
  }
  return idx;
}

/** שכבות של איכות חיים: לא נספרות ביעד המיצוי, ופריטים בהן רק מתוך qol_rules. */
export const QOL_LAYERS = ["איכות חיים", "בתנאים"] as const;
export const OUTSIDE_LAYER = "בחוץ";
export const COMPANION_LAYER = "תפקיד המלווה";
