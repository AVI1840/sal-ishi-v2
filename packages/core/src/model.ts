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
/** היקף שירות: שכונה, כל הרשות, אזורי (כמה רשויות) או ארצי (בעיקר מוצרים). */
export const REACHES = ["neighborhood", "authority", "regional", "national"] as const;
export const DEMAND_BANDS = ["high", "medium", "low"] as const;
/** אופן מתן השירות (גרסה 0.4): קובע שעות ביטול, חיוב באי-הגעה והחזר באשפוז. */
export const SERVICE_MODES = ["group", "individual", "home", "remote"] as const;
/** על מה מבוסס החלק שהקשיש משלם בייצוא. */
export const COPAY_BASES = ["tier", "qol_fixed", "qol_percent", "reference_binding"] as const;

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "חודש בפורמט YYYY-MM");
const nonNegative = z.number().finite().nonnegative();
const count = z.number().int().nonnegative();

export const communitySchema = z.enum(COMMUNITIES);
export const supplierTypeSchema = z.enum(SUPPLIER_TYPES);
export const deliveryModeSchema = z.enum(DELIVERY_MODES);
export const attendanceMethodSchema = z.enum(ATTENDANCE_METHODS);
export const copayTierSchema = z.enum(COPAY_TIERS);
export const workflowStatusSchema = z.enum(WORKFLOW_STATUSES);
export const reachSchema = z.enum(REACHES);
export const serviceModeSchema = z.enum(SERVICE_MODES);
export const copayBasisSchema = z.enum(COPAY_BASES);

const score = z.number().int().min(1).max(5);

// הערכת ספק רבעונית: ארבעה מדדים מ-1 עד 5. המשקלות בהגדרות (supplier_rating_weights).
export const supplierEvaluationSchema = z
  .object({
    quarter: z.string().regex(/^\d{4}-Q[1-4]$/, "רבעון בפורמט 2026-Q3"),
    quality: score,
    outcomes: score,
    satisfaction: score,
    value: score,
    note: z.string().optional(),
  })
  .strict();

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
    evaluations: z.array(supplierEvaluationSchema).optional(),
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
    /** ברירת מחדל: שכונה. שירות ברמת רשות נספר בכיסוי של כל שכונות הרשות. */
    reach: reachSchema.optional(),
    /** שכונות נוספות ברשות שהשירות משרת, ונספר בכיסוי שלהן. */
    servesNeighborhoods: z.array(z.string()).optional(),
    // גרסה 0.4. אופציונליים בסכמה כדי שנתונים וחבילות מ-0.3 ייקלטו, ונבדקים
    // במבחן הכניסה וברשימת ההשלמות.
    /** שעות שירות ביחידת תשלום. מחיר לשעה = unitPrice / hoursPerUnit. */
    hoursPerUnit: z.number().finite().positive().optional(),
    serviceMode: serviceModeSchema.optional(),
    /** קבוצה מוגבלת מקום עם רשימת המתנה. */
    capacityLimited: z.boolean().optional(),
    /** נפתח רק באישור מלווה (ארוחה חמה, הטבות איכות חיים לפי צורך). */
    gatedByCompanion: z.boolean().optional(),
    gateReason: z.string().optional(),
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
// גרסה 0.4: שדות מצטברים מדוח ספק העל, לחדירה ולזמן לשירות ראשון. כולם
// אופציונליים, וספירה של אנשים לעולם לא מפורטת לפי אדם.
export const neighborhoodMonthSchema = z
  .object({
    neighborhoodId: z.string().min(1),
    month,
    enrolled: count,
    /** משתתפים פעילים (לפי active_participant_min_sessions_month). */
    activeParticipants: count.optional(),
    /** זכאים ברמות 1 עד 3 בשכונה. */
    eligible: count.optional(),
    /** ממוצע ימים מרישום להשתתפות ראשונה, ומספר הנרשמים שהממוצע מחושב עליהם. */
    firstServiceDaysAvg: nonNegative.optional(),
    firstServiceCount: count.optional(),
  })
  .strict();

// ביקוש שלא נענה: המלווה מסמנת "ביקשו ואין" לסוג שירות. נספר מצטבר לשכונה
// ולחודש, בלי שום פרט על מי ביקש.
export const unmetDemandSchema = z
  .object({
    neighborhoodId: z.string().min(1),
    serviceTypeId: z.string().min(1),
    month,
    requests: count,
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
    unmetDemand: z.array(unmetDemandSchema).optional(),
  })
  .strict();

// פריט בקטלוג המאושר. בסיס משותף לתקן קליטת המפעילים ולקטלוג שמתפרסם לאזרח.
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
    reach: reachSchema,
    startMonth: z.string(),
  })
  .strict();

// תנאי השירות מגרסה 0.4: נגזרים מההגדרות לפי אופן מתן השירות. משותפים לייצוא
// ולקטלוג לאזרח.
const pointsSplit = {
  /** כמה נקודות מכוסות מהארנק, ו-null כשהסכום עוד לא נקבע (ארוחה חמה). */
  coveredPoints: nonNegative.nullable(),
  copayPoints: nonNegative.nullable(),
  copayBasis: copayBasisSchema,
};

// פריט בתקן קליטת מפעילים: פריט הקטלוג ועוד השדות של מודל התשלום. שירות
// שחסר לו נתון לא נכנס לייצוא ומופיע ברשימת ההשלמות. null רק במוצר בערוץ
// הארצי (אין לו שעות ואופן מתן), או בערך שההגדרות עוד לא קבעו.
export const onboardingItemSchema = catalogItemSchema
  .extend({
    hoursPerUnit: z.number().positive().nullable(),
    pointsPerHour: nonNegative.nullable(),
    serviceMode: serviceModeSchema.nullable(),
    capacityLimited: z.boolean(),
    gatedByCompanion: z.boolean(),
    gateReason: z.string().nullable(),
    cancellationNoticeHours: count.nullable(),
    noShowCharged: z.boolean().nullable(),
    hospitalizationRefund: z.string().nullable(),
    productQuarterlyCap: z.boolean(),
    countsInFloor: z.boolean(),
    ...pointsSplit,
  })
  .strict();

// פריט בקטלוג לאזרח: פריט הקטלוג, ועוד שני אותות מצטברים לשכבת "המלצות וניסיון"
// במנוע ההתאמה: רמת ביקוש בשכונה (בלי מספרים מתחת לסף תא קטן), וציון ספק.
// שדות 0.4 אופציונליים, כדי שקטלוג שפורסם בגרסה קודמת עדיין ייקרא.
export const citizenCatalogItemSchema = catalogItemSchema
  .extend({
    demand: z.enum(DEMAND_BANDS).nullable(),
    supplierScore: z.number().min(1).max(5).nullable(),
    hoursPerUnit: z.number().positive().nullable().optional(),
    serviceMode: serviceModeSchema.nullable().optional(),
    gatedByCompanion: z.boolean().optional(),
    gateReason: z.string().nullable().optional(),
    cancellationNoticeHours: count.nullable().optional(),
    noShowCharged: z.boolean().nullable().optional(),
    coveredPoints: nonNegative.nullable().optional(),
    copayPoints: nonNegative.nullable().optional(),
    copayBasis: copayBasisSchema.optional(),
  })
  .strict();

export const onboardingStandardSchema = z
  .object({
    schema: z.literal("operator_onboarding_standard"),
    version: z.literal("1.1"),
    owner: z.string(),
    generatedAt: z.string(),
    seedVersion: z.string(),
    contentHash: z.string().regex(/^[0-9a-f]{64}$/),
    /** הגדרות שהייצוא חושב לפיהן, כדי שספק העל יידע באיזה מצב מדובר. */
    rules: z
      .object({
        qolMode: z.string(),
        referencePriceMode: z.string(),
        pointsPerShekel: z.number().positive(),
        productsQuarterlyCapPoints: nonNegative,
        activeParticipantMinSessionsMonth: z.number().int().positive(),
      })
      .strict(),
    services: z.array(onboardingItemSchema),
  })
  .strict();

export const citizenCatalogSchema = z
  .object({
    schema: z.literal("citizen_catalog_v1"),
    authority: z.string(),
    neighborhood: neighborhoodSchema,
    seedVersion: z.string(),
    generatedAt: z.string(),
    services: z.array(citizenCatalogItemSchema),
  })
  .strict();

// אינדקס הקטלוגים שפורסמו לאזרח: איזה קובץ לכל שכונה.
export const citizenCatalogIndexSchema = z
  .object({
    schema: z.literal("citizen_catalog_index_v1"),
    generatedAt: z.string(),
    seedVersion: z.string(),
    entries: z.array(
      z.object({ authority: z.string(), neighborhoodId: z.string(), neighborhoodName: z.string(), community: communitySchema }).strict(),
    ),
  })
  .strict();

// קובץ ביקוש שלא נענה, מהכלי של המלווה לשטח. השכונה לפי שם, כי לכל כלי מזהים משלו.
export const unmetDemandFileSchema = z
  .object({
    schema: z.literal("unmet_demand_v1"),
    exportedAt: z.string(),
    rows: z.array(
      z.object({ neighborhoodName: z.string().min(1), serviceTypeId: z.string().min(1), month, requests: count }).strict(),
    ),
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
export type CitizenCatalogItem = z.infer<typeof citizenCatalogItemSchema>;
export type CitizenCatalogIndex = z.infer<typeof citizenCatalogIndexSchema>;
export type UnmetDemand = z.infer<typeof unmetDemandSchema>;
export type UnmetDemandFile = z.infer<typeof unmetDemandFileSchema>;
export type SupplierEvaluation = z.infer<typeof supplierEvaluationSchema>;
export type Reach = z.infer<typeof reachSchema>;
export type DemandBand = (typeof DEMAND_BANDS)[number];
export type ServiceMode = z.infer<typeof serviceModeSchema>;
export type CopayBasis = z.infer<typeof copayBasisSchema>;
export type OnboardingItem = z.infer<typeof onboardingItemSchema>;
export type OnboardingStandard = z.infer<typeof onboardingStandardSchema>;
export type CitizenCatalog = z.infer<typeof citizenCatalogSchema>;

/** כל הנתונים של רשות אחת, כפי שהם נשמרים במשטח השטח. */
export interface AuthorityData {
  authority: string;
  neighborhoods: Neighborhood[];
  suppliers: Supplier[];
  services: Service[];
  activity: MonthlyActivity[];
  enrollment: NeighborhoodMonth[];
  unmetDemand?: UnmetDemand[];
}
