// נתוני הדגמה סינתטיים בלבד: רשות, שכונות, ספקים ושמות דמיוניים. כל מספר כאן
// מומצא, ונבחר כך שכל מצב בכלי יופיע (ירוק, כתום, אדום, אירוע, חריגת מחיר,
// התראה קהילתית ודגל מיצוי).

import type { AuthorityData, Community, MonthlyActivity, Neighborhood, Service, Supplier } from "@sal-ishi/core";
import { defaultSeed, seedIndex, defaultCopayTier } from "@sal-ishi/core";

const AUTHORITY = "רשות הדגמה";
const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

const N: Neighborhood[] = [
  { id: "demo-n1", authority: AUTHORITY, name: "שכונה א (הדגמה)", community: "general" },
  { id: "demo-n2", authority: AUTHORITY, name: "שכונה ב (הדגמה)", community: "haredi" },
  { id: "demo-n3", authority: AUTHORITY, name: "שכונה ג (הדגמה)", community: "haredi" },
  { id: "demo-n4", authority: AUTHORITY, name: "שכונה ד (הדגמה)", community: "haredi" },
  { id: "demo-n5", authority: AUTHORITY, name: "שכונה ה (הדגמה)", community: "arab" },
];

const all = N.map((n) => n.id);

const SUPPLIERS: Supplier[] = [
  { code: "S-001", authority: AUTHORITY, type: "authority", displayName: "מתנ\"ס הדגמה", neighborhoods: all, languages: ["עברית", "ערבית"], communityFit: ["general", "arab"], accessible: true, deliveryModes: ["community"] },
  { code: "S-002", authority: AUTHORITY, type: "npo", displayName: "עמותת הדגמה לקהילה", neighborhoods: ["demo-n2", "demo-n3", "demo-n4"], languages: ["עברית", "יידיש"], communityFit: ["haredi"], accessible: true, deliveryModes: ["community", "home"], contact: { phone: "000-0000100" } },
  { code: "S-003", authority: AUTHORITY, type: "company", displayName: "חברת הדגמה לכושר", neighborhoods: ["demo-n1", "demo-n5"], languages: ["עברית", "ערבית", "רוסית"], communityFit: ["general", "arab"], accessible: true, deliveryModes: ["community"] },
  { code: "S-004", authority: AUTHORITY, type: "exempt", displayName: "מדריכה לדוגמה 1", neighborhoods: ["demo-n1", "demo-n3"], languages: ["עברית"], communityFit: ["general"], accessible: false, deliveryModes: ["community", "home"], contact: { phone: "000-0000001", email: "demo1@example.test" } },
  { code: "S-005", authority: AUTHORITY, type: "exempt", displayName: "מדריך לדוגמה 2", neighborhoods: ["demo-n5"], languages: ["ערבית", "עברית"], communityFit: ["arab"], accessible: true, deliveryModes: ["community", "remote"], contact: { phone: "000-0000002" } },
  { code: "S-006", authority: AUTHORITY, type: "licensed", displayName: "יועצת לדוגמה 3", neighborhoods: all, languages: ["עברית", "אנגלית"], communityFit: ["general", "haredi"], accessible: true, deliveryModes: ["home", "remote"], contact: { email: "demo3@example.test" } },
  { code: "S-007", authority: AUTHORITY, type: "npo", displayName: "עמותת הדגמה לדיגיטל", neighborhoods: all, languages: ["עברית", "ערבית", "יידיש"], communityFit: ["general", "haredi", "arab"], accessible: true, deliveryModes: ["community", "home", "remote"] },
  { code: "S-008", authority: AUTHORITY, type: "company", displayName: "בית קפה הדגמה", neighborhoods: ["demo-n1"], languages: ["עברית"], communityFit: ["general"], accessible: true, deliveryModes: ["community"] },
];

type Pattern = "cont" | "low" | "event" | "none" | "short";

interface Spec {
  n: number;
  type: string;
  sup: string;
  fit: Community[];
  price: number;
  market?: number | null;
  pattern: Pattern;
  base?: number;
  status?: Service["status"];
  program?: string;
  start?: number;
  otherFunder?: boolean;
  enforceable?: boolean;
  name?: string;
  copay?: Service["copayTier"];
}

const G: Community[] = ["general"];
const H: Community[] = ["haredi"];
const A: Community[] = ["arab"];

const SPECS: Spec[] = [
  // שכונה א: כמעט מלאה
  { n: 0, type: "T01", sup: "S-001", fit: G, price: 120, pattern: "cont", base: 22, status: "אושר" },
  { n: 0, type: "T07", sup: "S-004", fit: G, price: 100, pattern: "cont", base: 14, status: "אושר", copay: "classes" },
  { n: 0, type: "T11", sup: "S-001", fit: G, price: 60, pattern: "cont", base: 30, status: "אושר" },
  { n: 0, type: "T17", sup: "S-003", fit: G, price: 90, pattern: "cont", base: 18, status: "אושר" },
  { n: 0, type: "T16", sup: "S-003", fit: G, price: 110, pattern: "cont", base: 15, status: "אושר" },
  { n: 0, type: "T21", sup: "S-004", fit: G, price: 80, pattern: "cont", base: 11, status: "הוגש" },
  { n: 0, type: "T32", sup: "S-006", fit: G, price: 250, pattern: "cont", base: 12, status: "אושר", program: "demo-p-support", start: 0 },
  { n: 0, type: "T32", sup: "S-006", fit: G, price: 250, pattern: "cont", base: 12, status: "אושר", program: "demo-p-support", start: 5, name: "קבוצת תמיכה ומשמעות, סבב ב" },
  { n: 0, type: "T35", sup: "S-006", fit: G, price: 200, pattern: "cont", base: 10, status: "הוגש" },
  { n: 0, type: "T40", sup: "S-007", fit: G, price: 280, pattern: "cont", base: 13, status: "אושר" },
  { n: 0, type: "T42", sup: "S-007", fit: G, price: 300, pattern: "cont", base: 12, status: "אושר" },
  { n: 0, type: "T45", sup: "S-007", fit: G, price: 150, pattern: "low", base: 6, status: "טיוטה" },
  { n: 0, type: "T48", sup: "S-008", fit: G, price: 50, pattern: "cont", base: 40, status: "אושר", copay: "qol" },
  { n: 0, type: "T28", sup: "S-001", fit: G, price: 0, pattern: "event", base: 35, otherFunder: true, status: "טיוטה", name: "הרצאת קופת חולים (הדגמה)" },

  // שכונה ב (חרדית): שייכות טובה, חוסן חסר
  { n: 1, type: "T01", sup: "S-002", fit: H, price: 130, pattern: "cont", base: 20, status: "אושר" },
  { n: 1, type: "T02", sup: "S-002", fit: H, price: 140, pattern: "cont", base: 16, status: "אושר" },
  { n: 1, type: "T12", sup: "S-002", fit: H, price: 50, pattern: "cont", base: 12, status: "אושר" },
  { n: 1, type: "T17", sup: "S-002", fit: H, price: 95, pattern: "cont", base: 14, status: "אושר" },
  { n: 1, type: "T15", sup: "S-002", fit: H, price: 160, pattern: "cont", base: 10, status: "הוגש" },
  { n: 1, type: "T36", sup: "S-006", fit: ["general", "haredi"], price: 180, pattern: "short", base: 10, status: "הוגש" },
  { n: 1, type: "T40", sup: "S-007", fit: H, price: 280, pattern: "cont", base: 11, status: "אושר" },
  { n: 1, type: "T41", sup: "S-007", fit: H, price: 260, pattern: "cont", base: 10, status: "הוגש", market: null },

  // שכונה ג (חרדית): שירותים קיימים אבל לא מותאמים קהילתית
  { n: 2, type: "T01", sup: "S-002", fit: H, price: 125, pattern: "cont", base: 18, status: "אושר" },
  { n: 2, type: "T07", sup: "S-004", fit: G, price: 135, pattern: "cont", base: 12, status: "הוגש", copay: "classes" },
  { n: 2, type: "T17", sup: "S-004", fit: G, price: 90, pattern: "cont", base: 12, status: "אושר" },
  { n: 2, type: "T18", sup: "S-004", fit: G, price: 70, pattern: "cont", base: 10, status: "אושר" },
  { n: 2, type: "T22", sup: "S-006", fit: G, price: 300, pattern: "event", base: 25, status: "טיוטה" },
  { n: 2, type: "T40", sup: "S-007", fit: G, price: 280, pattern: "low", base: 7, status: "טיוטה" },

  // שכונה ד (חרדית): דלילה
  { n: 3, type: "T01", sup: "S-002", fit: H, price: 120, pattern: "cont", base: 15, status: "אושר" },
  { n: 3, type: "T16", sup: "S-002", fit: H, price: 115, pattern: "low", base: 8, status: "הוגש" },
  { n: 3, type: "T33", sup: "S-006", fit: ["general", "haredi"], price: 220, pattern: "none", status: "טיוטה", enforceable: false },

  // שכונה ה (ערבית)
  { n: 4, type: "T01", sup: "S-001", fit: A, price: 115, pattern: "cont", base: 20, status: "אושר" },
  { n: 4, type: "T06", sup: "S-001", fit: A, price: 40, pattern: "event", base: 60, status: "אושר" },
  { n: 4, type: "T09", sup: "S-005", fit: A, price: 90, pattern: "cont", base: 25, status: "אושר" },
  { n: 4, type: "T12", sup: "S-005", fit: A, price: 55, pattern: "cont", base: 10, status: "הוגש" },
  { n: 4, type: "T17", sup: "S-003", fit: A, price: 90, pattern: "cont", base: 16, status: "אושר" },
  { n: 4, type: "T19", sup: "S-003", fit: A, price: 85, pattern: "cont", base: 11, status: "אושר" },
  { n: 4, type: "T25", sup: "S-005", fit: A, price: 350, pattern: "cont", base: 10, status: "הוגש" },
  { n: 4, type: "T17", sup: "S-005", fit: A, price: 140, pattern: "cont", base: 12, status: "הוגש", name: "התעמלות מותאמת גיל, קבוצה ב" },
  { n: 4, type: "T40", sup: "S-007", fit: A, price: 290, pattern: "cont", base: 12, status: "נדחה" },
];

// מספר מחזיקי סל לכל שכונה, נבחר כך שרמות המיצוי יהיו שונות.
const ENROLLED = [180, 140, 120, 90, 200];

/** מחולל פסאודו-אקראי קבוע, כדי שההדגמה תיראה אותו דבר בכל טעינה. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDemoAuthority(): AuthorityData {
  const { serviceTypes } = seedIndex(defaultSeed);
  const rand = rng(2026);
  const services: Service[] = [];
  const activity: MonthlyActivity[] = [];

  SPECS.forEach((spec, i) => {
    const type = serviceTypes.get(spec.type)!;
    const neighborhood = N[spec.n]!;
    const id = `demo-s${String(i + 1).padStart(2, "0")}`;
    const start = spec.start ?? (spec.pattern === "short" ? 7 : Math.floor(rand() * 3));
    const market = spec.market === null ? undefined : (spec.market ?? Math.round(spec.price * (0.95 + rand() * 0.1)));
    const copayTier = spec.copay ?? defaultCopayTier(defaultSeed, type.category);

    services.push({
      id,
      authority: AUTHORITY,
      neighborhoodId: neighborhood.id,
      name: spec.name ?? type.name,
      categoryCode: type.category,
      serviceTypeId: type.id,
      supplierCode: spec.sup,
      languages: SUPPLIERS.find((s) => s.code === spec.sup)!.languages.slice(0, 2),
      format: type.format,
      unit: type.unit,
      unitPrice: spec.price,
      pricePoints: spec.price,
      ...(market !== undefined ? { marketPrice: market } : {}),
      copayTier,
      communityFit: spec.fit,
      deliveryMode: "community",
      attendanceMethod: ["operator"],
      otherFunder: spec.otherFunder ?? false,
      enforceable: spec.enforceable ?? true,
      ...(spec.program ? { programId: spec.program } : {}),
      startMonth: MONTHS[start]!,
      status: spec.status ?? "טיוטה",
      ...(spec.status === "נדחה" ? { committeeNote: "מחיר גבוה ממחיר הייחוס, לבקש הצעה מחודשת (הדגמה)" } : {}),
    });

    const copayRate = defaultSeed.settings.copay_tiers[copayTier];
    const months =
      spec.pattern === "none"
        ? []
        : spec.pattern === "event"
          ? [MONTHS[start + 3]!]
          : spec.program
            ? MONTHS.slice(start, start + 5)
            : MONTHS.slice(start);
    for (const month of months) {
      const base = spec.base ?? 10;
      const participants =
        spec.pattern === "low" ? Math.max(3, Math.round(base - rand() * 3)) : Math.max(1, Math.round(base * (0.85 + rand() * 0.35)));
      activity.push({
        serviceId: id,
        month,
        uniqueParticipants: participants,
        sessions: spec.pattern === "event" ? 1 : 4,
        walletSpent: Math.round(participants * spec.price * (1 - copayRate)),
      });
    }
  });

  return {
    authority: AUTHORITY,
    neighborhoods: N,
    suppliers: SUPPLIERS,
    services,
    activity,
    enrollment: N.flatMap((n, i) => MONTHS.map((month) => ({ neighborhoodId: n.id, month, enrolled: ENROLLED[i]! }))),
  };
}
