import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { applyCatalogs, buildDemoCatalogs, catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { configureMatching, matchServicesForCitizen } from "@/domain/matchingEngine";
import { suggestByDomain } from "@/lib/suggestions";
import { defaultSeed } from "@sal-ishi/core";
import { DEMO_ANSWERS, profileFor } from "../questionnaire";
import { whySentence } from "../why";

// תוספת 3, סעיפים 4-6 ותנאי הקבלה: סלים שונים, "למה" לכל המלצה, אי-התאמה
// בטיחותית גוברת על הציון, ושינוי משקל משנה את ההמלצות מיד.
beforeAll(() => applyCatalogs(buildDemoCatalogs(defaultSeed), defaultSeed, "demo"));
afterEach(() => configureMatching({ weights: catalogState.seed.settings.matching_weights }));

const basket = (id: string) => {
  const p = profileFor(id, DEMO_ANSWERS[id])!;
  return suggestByDomain(p, p.neighborhood).flatMap((d) => d.items.slice(0, 2).map((x) => x.service.id));
};

describe("אלגוריתם ההתאמה", () => {
  it("המשקלות מההגדרות: 30/30/25/15/0", () => {
    expect(catalogState.seed.settings.matching_weights).toEqual({ prevention: 0.3, motivation: 0.3, profileFit: 0.25, proximity: 0.15, socialProof: 0 });
  });

  it("שלוש הדמויות מקבלות סלים שונים, ולכל המלצה יש למה", () => {
    const [a, b, c] = ["c1", "c2", "c3"].map(basket);
    expect(a).not.toEqual(b);
    expect(b).not.toEqual(c);
    expect(a).not.toEqual(c);
    for (const id of ["c1", "c2", "c3"]) {
      const p = profileFor(id, DEMO_ANSWERS[id])!;
      for (const d of suggestByDomain(p, p.neighborhood)) for (const x of d.items) expect(whySentence(x.result, d.domainId).length).toBeGreaterThan(5);
    }
  });

  it("אי-התאמה בטיחותית: מי שכמעט לא יוצא מהבית לא מקבל שירות שדורש הליכה עצמאית", () => {
    const p = profileFor("c2", { ...DEMO_ANSWERS.c2!, mobility: "home_remote", function: "homebound" })!;
    const ids = matchServicesForCitizen(p, { topN: 500, minScore: 0 }).map((r) => r.service.id);
    const walkOnly = realServices.filter((s) => s.fitProfile && !s.fitProfile.mobility.includes("home_remote")).map((s) => s.id);
    expect(walkOnly.length).toBeGreaterThan(0);
    expect(ids.some((id) => walkOnly.includes(id))).toBe(false);
  });

  it("בלי סמארטפון: לא מומלץ שירות שדורש סמארטפון", () => {
    const p = profileFor("c1", DEMO_ANSWERS.c1)!;
    const ids = matchServicesForCitizen(p, { topN: 500, minScore: 0 }).map((r) => r.service.id);
    expect(ids).not.toContain("demoj-smartphone");
    expect(matchServicesForCitizen(profileFor("c3", DEMO_ANSWERS.c3)!, { topN: 500, minScore: 0 }).map((r) => r.service.id)).toContain("demoj-smartphone");
  });

  it("מימון מלא של מממן אחר לא מוצע מהארנק", () => {
    const ids = matchServicesForCitizen(profileFor("c1", DEMO_ANSWERS.c1)!, { topN: 500, minScore: 0 }).map((r) => r.service.id);
    expect(ids).not.toContain("demoj-checkups");
  });

  it("שינוי משקל בהגדרות משנה את ההמלצות מיד", () => {
    const p = profileFor("c1", DEMO_ANSWERS.c1)!;
    const before = matchServicesForCitizen(p, { topN: 8 }).map((r) => r.service.id);
    configureMatching({ weights: { prevention: 0, motivation: 0, profileFit: 0, proximity: 1, socialProof: 0 } });
    const after = matchServicesForCitizen(p, { topN: 8 }).map((r) => r.service.id);
    expect(after).not.toEqual(before);
  });

  it("שירות שלא נכנס ביתרת הארנק יורד בדירוג", () => {
    const p = profileFor("c3", DEMO_ANSWERS.c3)!;
    const rich = matchServicesForCitizen(p, { topN: 500, minScore: 0, walletLeft: 1000 });
    const poor = matchServicesForCitizen(p, { topN: 500, minScore: 0, walletLeft: 50 });
    const score = (rs: typeof rich, id: string) => rs.find((r) => r.service.id === id)!.layers.proximity;
    expect(score(poor, "demoj-smartphone")).toBeLessThan(score(rich, "demoj-smartphone"));
  });
});
