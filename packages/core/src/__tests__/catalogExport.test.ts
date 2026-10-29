import { describe, expect, it } from "vitest";
import { buildOnboardingStandard, buildCitizenCatalog, validateOnboardingStandard } from "../catalogExport";
import { EXPORT_FORBIDDEN_KEYS, findForbiddenKeys } from "../privacy";
import { publishableServices } from "../rules/publish";
import { defaultSeed as seed, withSettings } from "../seed";
import { demoAuthority, nGeneral, nHaredi, supplierExempt, svc } from "./fixtures";

const NOW = new Date("2026-11-20T08:00:00Z");

describe("operator_onboarding_standard", () => {
  it("רק שירותים מאושרים", async () => {
    const { export: exp } = await buildOnboardingStandard(demoAuthority(), seed, NOW);
    expect(exp.services.map((s) => s.serviceId)).toEqual(["s1", "s2"]);
  });

  it("לא מכיל contact, שם ספק יחיד או שדה של תושב, גם כשפרטי הספק עוברים למטה", async () => {
    expect(seed.settings.supplier_contact_to_hq).toBe(true);
    const { export: exp } = await buildOnboardingStandard(demoAuthority(), seed, NOW);
    expect(findForbiddenKeys(exp, EXPORT_FORBIDDEN_KEYS)).toEqual([]);
    const text = JSON.stringify(exp);
    expect(text).not.toContain(supplierExempt.contact!.phone!);
    expect(text).not.toContain(supplierExempt.displayName!);
    expect(exp.services.find((s) => s.serviceId === "s2")).toMatchObject({ supplierCode: "S-EX", supplierType: "exempt" });
  });

  it("עובר בדיקת סכמה, עם השתתפות עצמית ונקודות", async () => {
    const { export: exp } = await buildOnboardingStandard(demoAuthority(), seed, NOW);
    expect(() => validateOnboardingStandard(exp)).not.toThrow();
    expect(exp).toMatchObject({ schema: "operator_onboarding_standard", version: "1.1", owner: "המוסד לביטוח לאומי", seedVersion: "0.4" });
    const s2 = exp.services.find((s) => s.serviceId === "s2")!;
    expect(s2.copayTier).toBe("classes");
    expect(s2.copayRate).toBe(0.2);
    expect(s2.pricePoints).toBe(100);
  });

  it("בדיקת הסכמה דוחה שדה נוסף ושדה אסור", async () => {
    const { export: exp } = await buildOnboardingStandard(demoAuthority(), seed, NOW);
    const withContact = { ...exp, services: exp.services.map((s) => ({ ...s, contact: { phone: "1" } })) };
    expect(() => validateOnboardingStandard(withContact)).toThrow();
    const withResident = { ...exp, personId: "x" };
    expect(() => validateOnboardingStandard(withResident)).toThrow();
  });

  it("שירות מאושר עם ספק לא מוכר מדווח ולא נכנס", async () => {
    const data = demoAuthority();
    data.services.push(svc("s9", { status: "אושר", supplierCode: "S-??" }));
    const { export: exp, skipped } = await buildOnboardingStandard(data, seed, NOW);
    expect(exp.services.map((s) => s.serviceId)).not.toContain("s9");
    expect(skipped).toEqual([{ serviceId: "s9", reason: "ספק לא מוכר" }]);
  });

  it("שינוי שיעור ההשתתפות בהגדרות מתעדכן בייצוא", async () => {
    const s = withSettings(seed, { copay_tiers: { ...seed.settings.copay_tiers, classes: 0.25 } });
    const { export: exp } = await buildOnboardingStandard(demoAuthority(), s, NOW);
    expect(exp.services.find((x) => x.serviceId === "s2")?.copayRate).toBe(0.25);
  });
});

describe("קטלוג לאזרח", () => {
  it("רק שירותים מאושרים של השכונה הנבחרת", () => {
    const data = demoAuthority();
    data.services.push(svc("h1", { neighborhoodId: nHaredi.id, status: "אושר" }));
    data.services.push(svc("h2", { neighborhoodId: nHaredi.id, status: "נדחה" }));
    const { catalog } = buildCitizenCatalog(data, nHaredi.id, seed, NOW);
    expect(catalog.services.map((s) => s.serviceId)).toEqual(["h1"]);
    expect(catalog.neighborhood.id).toBe(nHaredi.id);
    expect(findForbiddenKeys(catalog, EXPORT_FORBIDDEN_KEYS)).toEqual([]);
  });

  it("הסטטוסים שמתפרסמים נקראים מההגדרות", () => {
    const data = demoAuthority();
    const wider = withSettings(seed, { publish_to_citizen_statuses: ["אושר", "הוגש"] });
    expect(publishableServices(data.services, nGeneral.id, wider.settings).map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
    expect(publishableServices(data.services, nGeneral.id, seed.settings).map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});
