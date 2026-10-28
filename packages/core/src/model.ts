// מודל הנתונים של האטלס והקטלוג. הסכמות כאן הן מקור האמת: הטיפוסים נגזרים מהן,
// והן גם הבדיקה שרצה על כל חבילה וכל ייצוא. כל הסכמות strict, כך ששדה שלא
// הוגדר כאן (למשל שדה של תושב) גורם לכישלון ולא עובר בשקט.
//
// קו אדום: אין כאן שום שדה מזהה של תושב. פעילות נכנסת רק מצטברת.

import { z } from "zod";

export const COMMUNITIES = ["general", "haredi", "arab"] as const;
export const SUPPLIER_TYPES = ["exempt", "licensed", "company", "npo", "authority"] as const;
export const DELIVERY_MODES = ["community", "home", "remote"] as const;
export const ATTENDANCE_METHODS = ["operator", "companion", "bot"] as const;
export const COPAY_TIERS = ["core_and_prevention", "classes", "qol"] as const;
export const WORKFLOW_STATUSES = ["טיוטה", "הוגש", "אושר", "נדחה"] as const;

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "חודש בפורמט YYYY-MM");
const nonNegative = z.number().finite().nonnegative();
const count = z.number().int().nonnegative();

export const communitySchema = z.enum(COMMUNITIES);
export const supplierTypeSchema = z.enum(SUPPLIER_TYPES);
export const deliveryModeSchema = z.enum(DELIVERY_MODES);
export const attendanceMethodSchema = z.enum(ATTENDANCE_METHODS);
export const copayTierSchema = z.enum(COPAY_TIERS);
export const workflowStatusSchema = z.enum(WORKFLOW_STATUSES);

export const neighborhoodSchema = z
  .object({
    id: z.string().min(1),
    authority: z.string().min(1),
    name: z.string().min(1),
    community: communitySchema,
  })
  .strict();

export const supplierContactSchema = z
  .object({
    phone: z.string().optional(),
    email: z.string().optional(),
  })
  .strict();

export const supplierSchema = z
  .object({
    code: z.string().min(1),
    authority: z.string().min(1),
    type: supplierTypeSchema,
    // לחברה, עמותה או רשות זה שם ציבורי. לעוסק פטור או מורשה זה שם של אדם,
    // ולכן הוא עובר למטה רק לפי supplier_contact_to_hq ולעולם לא לייצוא.
    displayName: z.string().optional(),
    neighborhoods: z.array(z.string()),
    languages: z.array(z.string()),
    communityFit: z.array(communitySchema),
    accessible: z.boolean(),
    deliveryModes: z.array(deliveryModeSchema).optional(),
    contact: supplierContactSchema.optional(),
  })
  .strict();

export const serviceSchema = z
  .object({
    id: z.string().min(1),
    authority: z.string().min(1),
    neighborhoodId: z.string(),
    name: z.string().min(1),
    categoryCode: z.string(),
    serviceTypeId: z.string(),
    supplierCode: z.string(),
    languages: z.array(z.string()),
    format: z.string(),
    unit: z.string(),
    unitPrice: nonNegative.optional(),
    pricePoints: nonNegative.optional(),
    marketPrice: nonNegative.optional(),
    copayTier: copayTierSchema,
    communityFit: z.array(communitySchema),
    deliveryMode: deliveryModeSchema,
    attendanceMethod: z.array(attendanceMethodSchema),
    cancellationPolicy: z.string().optional(),
    otherFunder: z.boolean(),
    enforceable: z.boolean(),
    programId: z.string().optional(),
    startMonth: z.string(),
    status: workflowStatusSchema,
    committeeNote: z.string().optional(),
  })
  .strict();

export const monthlyActivitySchema = z
  .object({
    serviceId: z.string().min(1),
    month,
    uniqueParticipants: count,
    sessions: count,
    walletSpent: nonNegative.optional(),
  })
  .strict();

// תוספת למודל שבפרומפט: מספר מחזיקי הסל בשכונה בחודש. מספר מצטבר בלבד,
// נדרש כמכנה של המיצוי (ארנק אישי כפול מחזיקים).
export const neighborhoodMonthSchema = z
  .object({
    neighborhoodId: z.string().min(1),
    month,
    enrolled: count,
  })
  .strict();

export const pilotPackageSchema = z
  .object({
    schema: z.literal("pilot_package_v1"),
    authority: z.string().min(1),
    exportedAt: z.string(),
    seedVersion: z.string(),
    contentHash: z.string().regex(/^[0-9a-f]{64}$/),
    neighborhoods: z.array(neighborhoodSchema),
    suppliers: z.array(supplierSchema),
    services: z.array(serviceSchema),
    activity: z.array(monthlyActivitySchema),
    enrollment: z.array(neighborhoodMonthSchema),
  })
  .strict();

// פריט בקטלוג המאושר. משותף ל-catalog_export ולקטלוג שמתפרסם לאזרח.
// לפי export_contract: ספק כקוד וסוג בלבד, בלי מחיר בשקלים ובלי הערות פנימיות.
export const catalogItemSchema = z
  .object({
    serviceId: z.string(),
    authority: z.string(),
    neighborhoodId: z.string(),
    neighborhoodName: z.string(),
    name: z.string(),
    categoryCode: z.string(),
    categoryName: z.string(),
    serviceTypeId: z.string(),
    serviceTypeName: z.string(),
    supplierCode: z.string(),
    supplierType: supplierTypeSchema,
    format: z.string(),
    unit: z.string(),
    languages: z.array(z.string()),
    pricePoints: nonNegative,
    copayTier: copayTierSchema,
    copayRate: z.number().min(0).max(1),
    deliveryMode: deliveryModeSchema,
    communityFit: z.array(communitySchema),
    attendanceMethod: z.array(attendanceMethodSchema),
    cancellationPolicy: z.string().nullable(),
    startMonth: z.string(),
  })
  .strict();

export const catalogExportSchema = z
  .object({
    schema: z.literal("catalog_export"),
    version: z.literal("1.0"),
    owner: z.string(),
    generatedAt: z.string(),
    seedVersion: z.string(),
    contentHash: z.string().regex(/^[0-9a-f]{64}$/),
    services: z.array(catalogItemSchema),
  })
  .strict();

export const citizenCatalogSchema = z
  .object({
    schema: z.literal("citizen_catalog_v1"),
    authority: z.string(),
    neighborhood: neighborhoodSchema,
    seedVersion: z.string(),
    generatedAt: z.string(),
    services: z.array(catalogItemSchema),
  })
  .strict();

export type Community = z.infer<typeof communitySchema>;
export type SupplierType = z.infer<typeof supplierTypeSchema>;
export type DeliveryMode = z.infer<typeof deliveryModeSchema>;
export type AttendanceMethod = z.infer<typeof attendanceMethodSchema>;
export type CopayTier = z.infer<typeof copayTierSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type Neighborhood = z.infer<typeof neighborhoodSchema>;
export type SupplierContact = z.infer<typeof supplierContactSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type MonthlyActivity = z.infer<typeof monthlyActivitySchema>;
export type NeighborhoodMonth = z.infer<typeof neighborhoodMonthSchema>;
export type PilotPackage = z.infer<typeof pilotPackageSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CatalogExport = z.infer<typeof catalogExportSchema>;
export type CitizenCatalog = z.infer<typeof citizenCatalogSchema>;

/** כל הנתונים של רשות אחת, כפי שהם נשמרים במשטח השטח. */
export interface AuthorityData {
  authority: string;
  neighborhoods: Neighborhood[];
  suppliers: Supplier[];
  services: Service[];
  activity: MonthlyActivity[];
  enrollment: NeighborhoodMonth[];
}
