import { describe, expect, it } from "vitest";
import { citizenReason, citizenReasons } from "../citizenReasons";

describe("citizenReasons", () => {
  it("לא מציג לאזרח תיוג של סיכון או ירידה תפקודית", () => {
    const out = citizenReasons([
      "מענה ישיר לרמת הסיכון שלך",
      "ממתן בדידות - מזוהה כגורם סיכון",
      "מונע ירידה תפקודית",
      "מותאם למצב תפקודי",
      "שפה לא ודאית - לבדוק",
    ]);
    expect(out.join(" ")).not.toMatch(/סיכון|תפקודי|לבדוק/);
    expect(out).toContain("הזדמנות להיפגש עם אנשים");
  });

  it("משאיר סיבות שכבר בשפה של האזרח", () => {
    expect(citizenReason("בשכונה שלך")).toBe("בשכונה שלך");
    expect(citizenReason("מתאים לתחום עניין: שירה")).toBe("מתאים למה שמעניין אותך: שירה");
  });
});
