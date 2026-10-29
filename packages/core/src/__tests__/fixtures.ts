// נתוני הדגמה סינתטיים בלבד. שום שם, טלפון או מזהה כאן אינו אמיתי.

import type { AuthorityData, MonthlyActivity, Neighborhood, Service, Supplier } from "../model";

export const AUTH = "רשות הדגמה";

export const nGeneral: Neighborhood = { id: "n-general", authority: AUTH, name: "שכונת הדגמה א", community: "general" };
export const nHaredi: Neighborhood = { id: "n-haredi", authority: AUTH, name: "שכונת הדגמה ב", community: "haredi" };

export const supplierExempt: Supplier = {
  code: "S-EX",
  authority: AUTH,
  type: "exempt",
  displayName: "מדריכה לדוגמה",
  neighborhoods: [nGeneral.id],
  languages: ["עברית"],
  communityFit: ["general"],
  accessible: true,
  deliveryModes: ["community", "home"],
  contact: { phone: "000-0000000", email: "demo@example.test" },
};

export const supplierNpo: Supplier = {
  code: "S-NPO",
  authority: AUTH,
  type: "npo",
  displayName: "עמותת הדגמה",
  neighborhoods: [nGeneral.id, nHaredi.id],
  languages: ["עברית", "יידיש"],
  communityFit: ["general", "haredi"],
  accessible: true,
  contact: { phone: "000-0000001" },
};

export function svc(id: string, o: Partial<Service> = {}): Service {
  return {
    id,
    authority: AUTH,
    neighborhoodId: nGeneral.id,
    name: `שירות ${id}`,
    categoryCode: "2.1",
    serviceTypeId: "T17",
    supplierCode: supplierNpo.code,
    languages: ["עברית"],
    format: "קבוצתי",
    unit: "חודש",
    unitPrice: 100,
    marketPrice: 100,
    copayTier: "core_and_prevention",
    communityFit: ["general"],
    deliveryMode: "community",
    attendanceMethod: ["operator"],
    otherFunder: false,
    enforceable: true,
    hoursPerUnit: 6,
    serviceMode: "group",
    startMonth: "2026-01",
    status: "טיוטה",
    ...o,
  };
}

/** פעילות חודשית: [חודש, משתתפים] לכל חודש. */
export function act(serviceId: string, months: [string, number][], walletSpent?: number): MonthlyActivity[] {
  return months.map(([month, uniqueParticipants]) => ({
    serviceId,
    month,
    uniqueParticipants,
    sessions: uniqueParticipants > 0 ? 4 : 0,
    ...(walletSpent !== undefined ? { walletSpent } : {}),
  }));
}

/** שלושה חודשים עם 12 משתתפים: שירות רציף לפי ברירות המחדל. */
export const continuousMonths: [string, number][] = [
  ["2026-01", 12],
  ["2026-02", 12],
  ["2026-03", 12],
];

export function demoAuthority(): AuthorityData {
  const services = [
    svc("s1", { status: "אושר" }),
    svc("s2", { status: "אושר", supplierCode: supplierExempt.code, copayTier: "classes" }),
    svc("s3", { status: "הוגש" }),
  ];
  return {
    authority: AUTH,
    neighborhoods: [nGeneral, nHaredi],
    suppliers: [supplierExempt, supplierNpo],
    services,
    activity: services.flatMap((s) => act(s.id, continuousMonths, 1000)),
    enrollment: [{ neighborhoodId: nGeneral.id, month: "2026-03", enrolled: 40 }],
  };
}
