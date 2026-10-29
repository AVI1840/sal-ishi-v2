/// <reference types="node" />
// תנאי הקבלה של גרסה 0.4 (מודל התשלום של החשכ"ל).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { onboardingJsonSchema, SCHEMA_FILE, schemaText } from "../../scripts/onboardingSchema";
import { buildCitizenCatalog, buildOnboardingStandard } from "../catalogExport";
import { buildDemoAuthority, buildDemoNationalChannel } from "../demo";
import { hourlyPriceIndex, isActiveParticipant, penetration, spread, timeToFirstService } from "../metrics";
import { migrationGaps } from "../migration";
import { pilotPackageSchema } from "../model";
import { RESIDENT_FIELD_KEYS } from "../privacy";
import { coverage } from "../rules/coverage";
import { ENTRY_STATUS, entryTest } from "../rules/entryTest";
import { referenceBindings } from "../rules/referencePrice";
import { utilization } from "../rules/utilization";
import { cancellationNoticeHours, hourlyPrice, noShowCharged, pointsSplit, serviceTerms } from "../rules/terms";
import { defaultSeed as seed, isOlderSeedBase, parseSeed, upgradeSeed, withSettings, type Settings } from "../seed";
import { productsQuarterlyCapPoints, proposalKeys, statusNote } from "../settings";
import { act, continuousMonths, nGeneral, nHaredi, svc } from "./fixtures";

const s04 = (patch: Partial<Settings>) => withSettings(seed, patch);
const mode = <K extends keyof Settings>(key: K, value: unknown) =>
  s04({ [key]: { ...(seed.settings[key] as object), value } } as Partial<Settings>);

describe("מחיר לשעה", () => {
  it("unitPrice / hoursPerUnit", () => {
    expect(hourlyPrice({ unitPrice: 120, hoursPerUnit: 6 })).toBe(20);
    expect(hourlyPrice({ unitPrice: 100, hoursPerUnit: 3 })).toBe(33.33);
  });
  it("בלי שעות: אין מחיר לשעה", () => {
    expect(hourlyPrice({ unitPrice: 100 })).toBeNull();
    expect(hourlyPrice({ hoursPerUnit: 2 })).toBeNull();
  });
});

describe("כלל אי-הגעה וביטול", () => {
  const { settings } = seed;
  it("קבוצה רגילה: לא מחויבת", () => expect(noShowCharged(settings, "group", false)).toBe(false));
  it("קבוצה מוגבלת מקום: מחויבת", () => expect(noShowCharged(settings, "group", true)).toBe(true));
  it("פרטני: מחויב", () => expect(noShowCharged(settings, "individual", false)).toBe(true));
  it("בבית: מחויב", () => expect(noShowCharged(settings, "home", false)).toBe(true));
  it("מרחוק בלי הגבלת מקום: לא מחויב", () => expect(noShowCharged(settings, "remote", false)).toBe(false));

  it("שעות הודעה לביטול לפי אופן מתן, ו-null כשלא נקבע", () => {
    expect(cancellationNoticeHours(settings, "group")).toBe(24);
    expect(cancellationNoticeHours(settings, "home")).toBe(48);
    expect(cancellationNoticeHours(settings, "individual")).toBeNull();
  });

  it("אשפוז: קבוצה החזר מלא, פרטני לפי חוזה", () => {
    expect(serviceTerms(svc("g"), seed)?.hospitalizationRefund).toBe("full_to_participant");
    expect(serviceTerms(svc("h", { serviceMode: "home" }), seed)?.hospitalizationRefund).toBe("by_contract");
  });

  it("מוצר: אין תנאי שירות", () => {
    expect(serviceTerms(svc("p", { categoryCode: "6", serviceTypeId: "T54", serviceMode: undefined }), seed)).toBeNull();
  });
});

describe("מחיר ייחוס בשלושה מצבים", () => {
  // שלושה ספקים שונים לאותו סוג שירות, מחירים 90, 100, 150: חציון 100.
  const services = [
    svc("a", { unitPrice: 90, supplierCode: "x1" }),
    svc("b", { unitPrice: 100, supplierCode: "x2" }),
    svc("c", { unitPrice: 150, supplierCode: "x3" }),
  ];
  const lonely = svc("d", { unitPrice: 150, supplierCode: "x9", neighborhoodId: nHaredi.id });

  it("monitor: לא מחייב, החלוקה לפי דרגת ההשתתפות", () => {
    const of = referenceBindings(services, seed);
    expect(of(services[2]!).binding).toBe(false);
    expect(pointsSplit(services[2]!, 150, seed, of(services[2]!))).toEqual({ coveredPoints: 150, copayPoints: 0, copayBasis: "tier" });
  });

  it("binding: רק בקטגוריה ורשות שסומנו, והקשיש משלם את ההפרש", () => {
    const binding = s04({ ...mode("reference_price_mode", "binding").settings, reference_price_binding_scope: [{ categoryCode: "2.1", authority: services[0]!.authority }] });
    const of = referenceBindings(services, binding);
    expect(of(services[2]!)).toMatchObject({ binding: true, reason: "scope", referencePoints: 100 });
    expect(pointsSplit(services[2]!, 150, binding, of(services[2]!))).toEqual({ coveredPoints: 100, copayPoints: 50, copayBasis: "reference_binding" });
    const other = s04({ ...binding.settings, reference_price_binding_scope: [{ categoryCode: "1.1", authority: services[0]!.authority }] });
    expect(referenceBindings(services, other)(services[2]!).binding).toBe(false);
  });

  it("preactivated_low_competition: מופעל כשיש פחות ספקים מהסף בקטגוריה ושכונה", () => {
    const low = mode("reference_price_mode", "preactivated_low_competition");
    const of = referenceBindings([...services, lonely], low);
    expect(of(lonely)).toMatchObject({ binding: true, reason: "low_competition", operators: 1 });
    expect(of(services[0]!)).toMatchObject({ binding: false, operators: 3 });
  });
});

describe("איכות חיים בשני מצבים", () => {
  const coffee = svc("q", { categoryCode: "5.1", serviceTypeId: "T48", name: "שובר בית קפה זוגי", copayTier: "qol" });
  it("fixed_amount: הסכום מהכלל מכוסה, והשאר על הקשיש", () => {
    expect(pointsSplit(coffee, 70, seed)).toEqual({ coveredPoints: 50, copayPoints: 20, copayBasis: "qol_fixed" });
  });
  it("fixed_amount: פריט בלי סכום (ארוחה חמה) נשאר פתוח", () => {
    const meal = svc("m", { categoryCode: "5.4", serviceTypeId: "T52", copayTier: "qol" });
    expect(pointsSplit(meal, 100, seed)).toEqual({ coveredPoints: null, copayPoints: null, copayBasis: "qol_fixed" });
  });
  it("percent: qol_copay על הקשיש, עם תקרה חודשית", () => {
    const percent = mode("qol_mode", "percent");
    expect(pointsSplit(coffee, 70, percent)).toEqual({ coveredPoints: 35, copayPoints: 35, copayBasis: "qol_percent" });
    expect(pointsSplit(coffee, 300, percent).coveredPoints).toBe(100);
  });
});

describe("מדדים", () => {
  it("פעיל: לפחות active_participant_min_sessions_month מפגשים", () => {
    expect(isActiveParticipant(1, seed.settings)).toBe(false);
    expect(isActiveParticipant(2, seed.settings)).toBe(true);
    expect(isActiveParticipant(2, mode("active_participant_min_sessions_month", 3).settings)).toBe(false);
  });

  it("מיצוי (כסף) וחדירה (אנשים) הם מדדים נפרדים", () => {
    const services = [svc("a")];
    const activity = act("a", [["2026-10", 20]], 1000);
    const enrollment = [{ neighborhoodId: nGeneral.id, month: "2026-10", enrolled: 10, activeParticipants: 12, eligible: 40 }];
    const u = utilization({ neighborhoodId: nGeneral.id, asOfMonth: "2026-10", services, activity, enrollment }, seed);
    const p = penetration(nGeneral.id, enrollment, seed.settings, "2026-10");
    expect(u.rate).toBeCloseTo(1000 / (10 * 500 * 1)); // חלון של 3 חודשים, נתון בחודש אחד
    expect(p.rate).toBe(12 / 40);
    expect(u.rate).not.toBe(p.rate);
  });

  it("חדירה: מתחת לסף התא הקטן הספירה לא מוצגת", () => {
    const p = penetration(nGeneral.id, [{ neighborhoodId: nGeneral.id, month: "2026-10", enrolled: 10, activeParticipants: 3, eligible: 40 }], seed.settings);
    expect(p).toMatchObject({ active: null, rate: null, suppressed: true });
  });

  it("זמן לשירות ראשון: התראה מעל הסף, והסתרה מתחת לסף התא הקטן", () => {
    const row = (avg: number, count: number) => [{ neighborhoodId: nGeneral.id, month: "2026-10", enrolled: 10, firstServiceDaysAvg: avg, firstServiceCount: count }];
    expect(timeToFirstService(nGeneral.id, row(20, 8), seed.settings).overMax).toBe(true);
    expect(timeToFirstService(nGeneral.id, row(10, 8), seed.settings).overMax).toBe(false);
    expect(timeToFirstService(nGeneral.id, row(20, 2), seed.settings)).toMatchObject({ avgDays: null, suppressed: true });
  });

  it("פריסה: שכונה נספרת רק כשכל קטגוריות הליבה המקומיות ירוקות", () => {
    const data = buildDemoAuthority(2);
    const result = coverage(data, seed);
    const sp = spread(result, true);
    const greenEverywhere = data.neighborhoods.filter((n) =>
      result.cells.filter((c) => c.neighborhoodId === n.id && c.level !== "not_checked").every((c) => c.level === "green"),
    );
    expect(sp.neighborhoods).toBe(data.neighborhoods.length);
    expect(sp.meeting).toBe(greenEverywhere.length);
  });

  it("מדד מחיר לשעה לפי קטגוריה ורשות, ברבעון", () => {
    const rows = hourlyPriceIndex([svc("a", { unitPrice: 120 }), svc("b", { unitPrice: 60 })], seed, "2026-11");
    expect(rows).toEqual([{ period: "2026-Q4", categoryCode: "2.1", authority: svc("a").authority, services: 2, avgHourly: 15 }]);
  });
});

describe("מוצרים", () => {
  it("תקרה רבעונית: 25% מהארנק הרבעוני", () => {
    expect(productsQuarterlyCapPoints(seed.settings)).toBe(375);
  });
  it("לא נספרים ברצפה, אלא אם ההגדרה משתנה", () => {
    const products = ["a", "b", "c"].map((id) => svc(id, { categoryCode: "6", serviceTypeId: "T54", reach: "national", status: "אושר" }));
    const cell = (s = seed) => coverage({ neighborhoods: [nGeneral], services: products, activity: [] }, s).cells.find((c) => c.coreCategoryId === "prevention_products")!;
    expect(cell().level).toBe("not_checked");
    expect(cell(s04({ products_count_in_floor: true }))).toMatchObject({ level: "green", count: 3 });
  });
});

describe("מבחן כניסה בגרסה 0.4", () => {
  it("בלי שעות ליחידה: חסרים נתונים", () => {
    const r = entryTest(svc("a", { hoursPerUnit: undefined }), seed);
    expect(r.status).toBe(ENTRY_STATUS.missingData);
    expect(r.reason).toContain("שעות שירות ליחידה");
  });
  it("נפתח באישור מלווה בלי סיבה: חסרים נתונים", () => {
    expect(entryTest(svc("a", { gatedByCompanion: true }), seed).status).toBe(ENTRY_STATUS.missingData);
    expect(entryTest(svc("a", { gatedByCompanion: true, gateReason: "צורך מתועד" }), seed).status).toBe(ENTRY_STATUS.in);
  });
  it("מוצר פטור משעות", () => {
    expect(entryTest(svc("p", { categoryCode: "6", serviceTypeId: "T54", hoursPerUnit: undefined }), seed).status).toBe(ENTRY_STATUS.in);
  });
});

describe("תקן קליטת מפעילים 1.1", () => {
  const data = buildDemoAuthority(2);
  const national = buildDemoNationalChannel();
  const source = { ...data, suppliers: [...data.suppliers, ...national.suppliers], services: [...data.services, ...national.services] };
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(onboardingJsonSchema());

  it("קובץ ה-JSON Schema בתיקיית schema/ מעודכן לסכמה בקוד", () => {
    expect(readFileSync(SCHEMA_FILE, "utf8").replace(/\r\n/g, "\n")).toBe(schemaText());
  });

  it("הייצוא עובר את ה-JSON Schema", async () => {
    const { export: exp } = await buildOnboardingStandard(source, seed);
    expect(exp.services.length).toBeGreaterThan(10);
    expect(validate(exp), JSON.stringify(validate.errors)).toBe(true);
  });

  it("בלי contact, בלי שם ספק ובלי שדה של תושב", async () => {
    const { export: exp } = await buildOnboardingStandard(source, seed);
    const text = JSON.stringify(exp);
    for (const key of ["contact", "phone", "email", "displayName", "unitPrice", ...RESIDENT_FIELD_KEYS]) {
      expect(text).not.toContain(`"${key}"`);
    }
    const schemaProps = JSON.stringify(onboardingJsonSchema());
    expect(schemaProps).not.toContain('"contact"');
  });

  it("ה-JSON Schema דוחה שדה נוסף", async () => {
    const { export: exp } = await buildOnboardingStandard(source, seed);
    const bad = { ...exp, services: [{ ...exp.services[0], contact: { phone: "0" } }] };
    expect(validate(bad)).toBe(false);
  });

  it("שירות מאושר בלי שדות 0.4 לא נכנס, ומדווח כדורש השלמה", async () => {
    const { export: exp, skipped } = await buildOnboardingStandard(source, seed);
    const legacy = data.services.find((s) => s.status === "אושר" && !s.hoursPerUnit)!;
    expect(exp.services.some((s) => s.serviceId === legacy.id)).toBe(false);
    expect(skipped.find((s) => s.serviceId === legacy.id)?.reason).toContain("דורש השלמה");
  });

  it("שינוי qol_mode ו-reference_price_mode מתעדכן מיד בייצוא", async () => {
    const qolItem = async (s = seed) => (await buildOnboardingStandard(source, s)).export.services.find((x) => x.categoryCode === "5.1")!;
    expect((await qolItem()).copayBasis).toBe("qol_fixed");
    const percent = mode("qol_mode", "percent");
    expect((await qolItem(percent)).copayBasis).toBe("qol_percent");
    expect((await buildOnboardingStandard(source, percent)).export.rules.qolMode).toBe("percent");

    const low = mode("reference_price_mode", "preactivated_low_competition");
    const { export: lowExp } = await buildOnboardingStandard(source, low);
    expect(lowExp.rules.referencePriceMode).toBe("preactivated_low_competition");
    expect(lowExp.services.some((x) => x.copayBasis === "reference_binding")).toBe(true);
  });

  it("הקטלוג לאזרח מקבל את התנאים, גם לשירות שעוד דורש השלמה", () => {
    const n = data.neighborhoods[0]!;
    const { catalog } = buildCitizenCatalog(source, n.id, seed);
    const coffee = catalog.services.find((s) => s.categoryCode === "5.1");
    expect(coffee?.gatedByCompanion).toBe(false);
    const group = catalog.services.find((s) => s.serviceMode === "group")!;
    expect(group.cancellationNoticeHours).toBe(24);
  });
});

describe("הגירה מגרסה 0.3", () => {
  it("seed שמור של 0.3 מוחלף ב-0.4 המובנה", () => {
    const old = { ...seed, meta: { ...seed.meta, version: "0.3.2" }, settings: { ...seed.settings, cancellation_notice_hours: null } };
    expect(isOlderSeedBase(old)).toBe(true);
    expect(upgradeSeed(old)).toBe(seed);
  });

  it("seed של 0.4 מהמטה שומר את הערכים שלו ומשלים מפתחות חסרים", () => {
    const { first_service_max_days: _x, ...rest } = seed.settings;
    const fromHq = { ...seed, meta: { ...seed.meta, version: "0.4.3" }, settings: { ...rest, core_floor: 4 } };
    const up = upgradeSeed(fromHq);
    expect(up.settings.core_floor).toBe(4);
    expect(up.settings.first_service_max_days).toBe(14);
  });

  it("חבילת פיילוט בלי שדות 0.4 עוברת את הסכמה", () => {
    const pkgService = { ...svc("old"), hoursPerUnit: undefined, serviceMode: undefined };
    delete pkgService.hoursPerUnit;
    delete pkgService.serviceMode;
    const ok = pilotPackageSchema.shape.services.element.safeParse(pkgService);
    expect(ok.success).toBe(true);
  });

  it("רשימת השלמות: מה חסר, עם הצעה, בלי למחוק", () => {
    const data = buildDemoAuthority(0);
    const gaps = migrationGaps(data.services, seed);
    const legacy = gaps.find((g) => g.gaps.some((x) => x.field === "hoursPerUnit"))!;
    expect(legacy.gaps.map((g) => g.field)).toEqual(["hoursPerUnit", "serviceMode"]);
    expect(legacy.gaps[1]!.suggestion).toBe("group");
    expect(data.services.find((s) => s.id === legacy.serviceId)).toBeDefined();
  });

  it("ההגדרות החדשות מסומנות כהצעה, עם טקסט הסטטוס", () => {
    expect(proposalKeys(seed.settings)).toEqual(expect.arrayContaining(["qol_mode", "reference_price_mode", "products_quarterly_cap_share", "no_show_charge_rule"]));
    expect(statusNote(seed.settings, "qol_mode")).toContain("מפגש 3");
    expect(parseSeed(JSON.parse(JSON.stringify(seed))).settings.qol_mode.value).toBe("fixed_amount");
  });
});

describe("בלי em dash בקוד ובטקסטים של האטלס", () => {
  const root = fileURLToPath(new URL("../../../../", import.meta.url));
  const dirs = ["packages/core/src", "packages/core/seed", "packages/core/scripts", "packages/ui/src", "apps/field/src", "apps/hq/src", "schema", "docs/atlas"];
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f: string) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|json|md|css)$/.test(f) ? [p] : [];
    });
  it("אף קובץ לא מכיל em dash", () => {
    const dash = String.fromCharCode(0x2014);
    const offenders = dirs.flatMap((d) => files(join(root, d))).filter((f) => readFileSync(f, "utf8").includes(dash));
    expect(offenders).toEqual([]);
  });
});
