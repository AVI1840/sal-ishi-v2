import { describe, expect, it } from "vitest";
import { buildOnboardingStandard, buildCitizenCatalog, demandBand, servesNeighborhood } from "../catalogExport";
import { buildDemoAuthority, buildDemoNationalChannel } from "../demo";
import { buildPilotPackage, emptyHqState, mergePackage, parsePilotPackage } from "../pilotPackage";
import { coverage, suggestServiceTypes, unmetByCell } from "../rules/coverage";
import { competitionFlags, supplierScore } from "../rules/suppliers";
import { proposalKeys } from "../settings";
import { defaultSeed, upgradeSeed, withSettings } from "../seed";

// הדירוג כבוי כברירת מחדל (תוספת 3, הדירוג אצל ספק העל). הבדיקות כאן בודקות את המנגנון כשמדליקים אותו.
const seed = withSettings(defaultSeed, { supplier_rating_enabled: true });
import { act, continuousMonths, nGeneral, nHaredi, svc } from "./fixtures";

const cover = (services: ReturnType<typeof svc>[], s = seed) =>
  coverage({ neighborhoods: [nGeneral, nHaredi], services, activity: services.flatMap((x) => act(x.id, continuousMonths)) }, s);
const cell = (r: ReturnType<typeof coverage>, n: string, cc: string) => r.cells.find((c) => c.neighborhoodId === n && c.coreCategoryId === cc)!;

describe("היקף שירות", () => {
  it("שירות ברמת רשות נספר בכיסוי של כל שכונות הרשות", () => {
    const r = cover([svc("a", { reach: "authority" })]);
    expect(cell(r, nHaredi.id, "health_function").count).toBe(1);
    expect(cell(cover([svc("a")]), nHaredi.id, "health_function").count).toBe(0);
  });

  it("שירות שמשרת שכונה נוספת נספר גם בה", () => {
    expect(cell(cover([svc("a", { servesNeighborhoods: [nHaredi.id] })]), nHaredi.id, "health_function").count).toBe(1);
  });

  it("שירות ארצי לא נספר ברצפה של שכונה", () => {
    expect(cell(cover([svc("a", { reach: "national" })]), nGeneral.id, "health_function").count).toBe(0);
  });

  it("זמינות לשכונה: ארצי בכל מקום, רשות רק באותה רשות", () => {
    const other = { ...nHaredi, id: "x", authority: "אחרת" };
    expect(servesNeighborhood(svc("a", { reach: "national" }), other)).toBe(true);
    expect(servesNeighborhood(svc("a", { reach: "authority" }), nHaredi)).toBe(true);
    expect(servesNeighborhood(svc("a", { reach: "authority" }), other)).toBe(false);
  });
});

describe("רוחב בתוך קטגוריה ותת-תחום קוגניטיבי", () => {
  it("שלושה שירותים באותה תת-קטגוריה: התראת רוחב", () => {
    const r = cover([svc("a"), svc("b"), svc("c")]);
    expect(r.alerts.some((a) => a.kind === "breadth" && a.neighborhoodId === nGeneral.id)).toBe(true);
  });

  it("פיזור על שתי תתי-קטגוריות: בלי התראת רוחב", () => {
    const r = cover([svc("a"), svc("b"), svc("c", { categoryCode: "2.2", serviceTypeId: "T21" })]);
    expect(r.alerts.some((a) => a.kind === "breadth" && a.neighborhoodId === nGeneral.id)).toBe(false);
    expect(r.alerts.some((a) => a.kind === "subarea" && a.neighborhoodId === nGeneral.id)).toBe(false);
  });

  it("סף ההתראה הקוגניטיבית מההגדרות", () => {
    const services = [svc("a"), svc("c", { categoryCode: "2.2", serviceTypeId: "T21" })];
    expect(cover(services).alerts.some((a) => a.kind === "subarea" && a.neighborhoodId === nGeneral.id)).toBe(false);
    const strict = withSettings(seed, { subarea_alert_min: 3 });
    expect(cover(services, strict).alerts.some((a) => a.kind === "subarea" && a.neighborhoodId === nGeneral.id)).toBe(true);
  });

  it("הצעות להשלמה מעדיפות תת-קטגוריה שחסרה בתא", () => {
    const types = suggestServiceTypes(seed, "health_function", 3, { presentCodes: ["2.1"] });
    expect(types.every((t) => t.category !== "2.1")).toBe(true);
  });
});

describe("דירוג ספקים", () => {
  it("חמשת הרכיבים, ממוצע שווה עד שייקבעו משקלות, לפי ההערכה האחרונה", () => {
    const last = { quarter: "2026-Q3", quality: 5, outcomes: 4, satisfaction: 3, audienceFit: 4, serviceLevel: 4 };
    const s = supplierScore({ evaluations: [{ quarter: "2026-Q2", quality: 1, outcomes: 1, satisfaction: 1 }, last] }, seed.settings);
    expect(s).toEqual({ score: 4, quarter: "2026-Q3", evaluations: 2, newSupplier: false }); // (5+4+3+4+4)/5
    // עם משקלות: ממוצע משוקלל.
    const w = supplierScore({ evaluations: [last, { ...last, quarter: "2026-Q4" }] }, { ...seed.settings, supplier_rating_component_weights: { quality: 0.5, outcomes: 0.5 } });
    expect(w?.score).toBe(4.5);
  });

  it("פחות הערכות מהמינימום: ספק חדש", () => {
    const s = supplierScore({ evaluations: [{ quarter: "2026-Q3", quality: 5, outcomes: 5, satisfaction: 5 }] }, seed.settings);
    expect(s?.newSupplier).toBe(true);
  });

  it("בלי הערכות: אין ציון", () => {
    expect(supplierScore({}, seed.settings)).toBeNull();
  });

  it("מדד תחרות: יותר מ-3 ספקים לאותו סוג שירות בשכונה", () => {
    const services = ["s1", "s2", "s3", "s4"].map((code, i) => svc(`x${i}`, { supplierCode: code }));
    expect(competitionFlags(services, seed.settings)).toEqual([{ authority: services[0]!.authority, neighborhoodId: nGeneral.id, serviceTypeId: "T17", suppliers: 4, max: 3 }]);
    expect(competitionFlags(services.slice(0, 3), seed.settings)).toEqual([]);
  });

  it("seed ישן מקבל את ההגדרות החדשות בלי לדרוס ערכים קיימים", () => {
    const { matching_weights: _w, selection_max_active: _m, ...oldSettings } = seed.settings;
    const old = { ...seed, settings: { ...oldSettings, core_floor: 4 } } as typeof seed;
    const up = upgradeSeed(old);
    expect(up.settings.core_floor).toBe(4);
    expect(up.settings.selection_max_active).toBe(8);
    expect(up.settings.matching_weights).toEqual(seed.settings.matching_weights);
    expect(upgradeSeed(defaultSeed)).toBe(defaultSeed);
  });

  it("ההגדרות החדשות מסומנות כהצעה", () => {
    const keys = proposalKeys(seed.settings);
    expect(keys).toEqual(expect.arrayContaining(["supplier_rating_enabled", "matching_weights", "selection_max_active", "competition_max_suppliers_local", "subcategory_breadth_min"]));
  });
});

describe("קטלוג לאזרח עם ערוץ ארצי, ביקוש וציון ספק", () => {
  const data = buildDemoAuthority(2);
  const national = buildDemoNationalChannel();
  const source = { ...data, suppliers: [...data.suppliers, ...national.suppliers], services: [...data.services, ...national.services] };

  it("שכונה מקבלת את השירותים שלה, את הרשותיים ואת הארציים", () => {
    const n = data.neighborhoods.find((x) => x.name === "בית וגן")!;
    const { catalog } = buildCitizenCatalog(source, n.id, seed);
    expect(catalog.services.filter((s) => s.reach === "national" && s.categoryCode === "6")).toHaveLength(national.services.length);
    expect(catalog.services.some((s) => s.reach === "authority")).toBe(true);
    expect(catalog.services.every((s) => s.reach !== "neighborhood" || s.neighborhoodId === n.id)).toBe(true);
  });

  it("רמת ביקוש בלי לחשוף מספרים קטנים", () => {
    const act3 = (n: number) => [{ serviceId: "a", month: "2026-10", uniqueParticipants: n, sessions: 4 }];
    expect(demandBand({ id: "a" }, act3(25), seed.settings)).toBe("high");
    expect(demandBand({ id: "a" }, act3(12), seed.settings)).toBe("medium");
    expect(demandBand({ id: "a" }, act3(6), seed.settings)).toBe("low");
    expect(demandBand({ id: "a" }, act3(3), seed.settings)).toBeNull();
  });

  it("ציון ספק בקטלוג לאזרח, ולא בתקן קליטת המפעילים", async () => {
    const n = data.neighborhoods[0]!;
    const { catalog } = buildCitizenCatalog(source, n.id, seed);
    expect(catalog.services.some((s) => s.supplierScore !== null)).toBe(true);
    const { export: exp } = await buildOnboardingStandard(source, seed);
    expect(JSON.stringify(exp)).not.toContain("supplierScore");
    // הליכון במימון מלא של מממן אחר: הפניה בלבד, לא בתקן.
    expect(exp.services.filter((s) => s.reach === "national" && s.categoryCode === "6")).toHaveLength(national.services.length - 1);
  });
});

describe("ביקוש שלא נענה", () => {
  it("עובר בחבילה, נקרא חזרה ומתמזג במטה", async () => {
    const data = buildDemoAuthority(0);
    const pkg = await buildPilotPackage(data, seed);
    expect(pkg.unmetDemand?.length).toBe(7);
    expect(await parsePilotPackage(JSON.stringify(pkg))).toEqual(pkg);
    const state = mergePackage(emptyHqState(), pkg);
    expect(state.unmetDemand).toHaveLength(7);
    const cells = unmetByCell(state.unmetDemand!, seed);
    const n2 = data.neighborhoods[2]!.id;
    const expected = data.unmetDemand!.filter((u) => u.neighborhoodId === n2 && ["T22", "T16"].includes(u.serviceTypeId)).reduce((a, u) => a + u.requests, 0);
    expect(cells.get(`${n2}|health_function`)?.requests).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it("חבילה בלי ביקוש שלא נענה שומרת על אותה חתימה", async () => {
    const data = { ...buildDemoAuthority(0), unmetDemand: undefined };
    const a = await buildPilotPackage(data, seed);
    const b = await buildPilotPackage({ ...data, unmetDemand: [] }, seed);
    expect(a.contentHash).toBe(b.contentHash);
    expect("unmetDemand" in a).toBe(false);
  });
});
