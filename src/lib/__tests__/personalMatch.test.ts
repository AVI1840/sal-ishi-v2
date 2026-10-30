import { describe, expect, it } from "vitest";
import { CITIZENS } from "@/data/mockData";
import type { MatchResult } from "@/lib/matchingEngine";
import { personalReasonFor, personalRecommendations, withAnswers } from "../personalMatch";

const sarah = CITIZENS.find((c) => c.id === "c1")!;

function r(id: string, name: string, category: number, totalScore: number): MatchResult {
  return { service: { id, name, category } as MatchResult["service"], totalScore, layers: {} as MatchResult["layers"], explanations: ["מענה ישיר לרמת הסיכון שלך"], pilotGoalsServed: [], isTopMatch: false };
}

// המנוע לבדו מעדיף שירותים קוגניטיביים (ציון גבוה), כמו שקרה בהדגמה.
const results = [
  r("cog", "אימון קוגניטיבי", 2, 90),
  r("mem", "זיכרון ויצירה", 2, 88),
  r("bal", "כוח ושיווי משקל", 2, 85),
  r("choir", "מקהלה קהילתית", 3, 60),
  r("cook", "סדנת בישול בריא קבוצתית", 4, 55),
  r("club", "מועדון שכונתי", 3, 58),
];

describe("personalRecommendations", () => {
  it("שרה: המקהלה ראשונה, עם החלום שלה, ואחריה תחומים אחרים", () => {
    const picks = personalRecommendations(sarah, results);
    expect(picks.map((p) => p.result.service.id)).toEqual(["choir", "cook", "cog"]);
    expect(picks[0].reason).toBe("סיפרת שהחלום שלך הוא לחזור לשיר במקהלה כמו פעם.");
    expect(picks[1].reason).toBe("סיפרת שאת אוהבת בישול.");
  });

  it("כל נימוק ייחודי, בלי תיוג, ו'סיפרת ש' רק כשזה נכון", () => {
    const picks = personalRecommendations(sarah, results);
    const reasons = picks.map((p) => p.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
    for (const x of reasons) expect(x).not.toMatch(/סיכון|תפקוד/);
    // לאימון הקוגניטיבי אין מוטיבציה שהמנוע מצא: לא ממציאים "סיפרת ש".
    expect(picks[2].reason.startsWith("סיפרת ש")).toBe(false);
  });

  it("'סיפרת שחשוב לך' כשהמנוע מצא שהשירות עונה על המוטיבציה", () => {
    const withMotivation = [...results.slice(0, 3), { ...r("vol", "פרויקט קהילתי", 5, 50), explanations: ["מתאים למוטיבציה: משמעות"] }];
    const picks = personalRecommendations(sarah, withMotivation);
    expect(picks.find((p) => p.result.service.id === "vol")?.reason).toBe("סיפרת שחשוב לך לעשות משהו עם משמעות.");
  });

  it("נימוק לדף השירות, ותשובות השאלון קודמות למה שהיה ידוע", () => {
    expect(personalReasonFor(sarah, "מקהלה קהילתית")).toMatch(/^סיפרת ש/);
    const after = withAnswers(sarah, { loved: "ללמוד ולקרוא" });
    expect(after.preferredActivities[0]).toBe("ללמוד ולקרוא");
  });
});
