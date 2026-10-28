// טעינת קובץ הבסיס (seed) ובדיקת המבנה שלו. כל סף וכל כלל עסקי נקראים מכאן,
// אף אחד מהם לא מקודד במנוע הכללים.

import { z } from "zod";
import rawSeed from "../seed/seed_data_catalog_v0.3.json";
import { communitySchema, supplierTypeSchema, deliveryModeSchema, attendanceMethodSchema } from "./model";

const ratio = z.number().min(0).max(1);

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
    supplier_rating_weights: z
      .object({ quality: ratio, outcomes: ratio, satisfaction: ratio, value: ratio })
      .refine((w) => Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 0.011, "סכום המשקלות חייב להיות 100%")
      .optional(),
    competition_max_suppliers_local: z.number().int().positive().optional(),
    competition_max_suppliers_national: z.number().int().positive().optional(),
    subcategory_breadth_min: z.number().int().nonnegative().optional(),
    subarea_alert_min: z.number().int().nonnegative().optional(),
  })
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
    export_contract: z
      .object({
        name: z.literal("catalog_export"),
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

/** ה-seed שמגיע עם הקוד (גרסה 0.3). */
export const defaultSeed: Seed = parseSeed(rawSeed);

/**
 * seed שנשמר בדפדפן לפני שנוספו הגדרות חדשות: משלימים רק את המפתחות החסרים
 * מה-seed המובנה, בלי לדרוס ערכים שהמטה קבע.
 */
export function upgradeSeed(saved: Seed, bundled: Seed = defaultSeed): Seed {
  const missing = Object.fromEntries(
    Object.entries(bundled.settings).filter(([k]) => !(k in (saved.settings as Record<string, unknown>))),
  );
  if (!Object.keys(missing).length) return saved;
  return parseSeed({ ...saved, settings: { ...missing, ...saved.settings } });
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
