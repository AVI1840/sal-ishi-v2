import { describe, expect, it } from "vitest";
import { demoLearningEntries, learningFile, mergeLearning, tenderMarkdown, tenderRequirements, type LearningEntry } from "../learning";

const base = demoLearningEntries(new Date("2026-11-01T10:00:00Z"));

describe("פנקס למידה", () => {
  it("רישום הדרישות: רק מה שסומן למכרז ולא נדחה, ממוספר לפי סדר", () => {
    const rejected: LearningEntry = { ...base[0]!, id: "x", at: "2026-11-01T12:00:00Z", status: "נדחה" };
    const notTender: LearningEntry = { ...base[0]!, id: "y", at: "2026-11-01T13:00:00Z", tender: false };
    const reqs = tenderRequirements([...base, rejected, notTender]);
    expect(reqs.map((r) => r.id)).toEqual(["REQ-001", "REQ-002", "REQ-003"]);
    expect(reqs[0]!.status).toBe("הצעה, ממתין להכרעה");
    expect(reqs[2]!.status).toContain("הוכרע");
    expect(reqs[2]!.requirement).toBe(base[2]!.decision);
  });

  it("קליטת פנקס מהשטח: חדש נוסף, קיים שהשתנה מתעדכן", () => {
    const incoming = learningFile([{ ...base[0]!, decision: "24 שעות", status: "הוכרע" }, { ...base[1]!, id: "new-1" }], "שטח");
    const r = mergeLearning(base, incoming);
    expect(r.added).toBe(1);
    expect(r.updated).toBe(1);
    expect(r.entries).toHaveLength(4);
  });

  it("קובץ שאינו פנקס נדחה", () => {
    expect(() => mergeLearning(base, { schema: "other", entries: [] })).toThrow();
  });

  it("Markdown בלי em dash", () => {
    expect(tenderMarkdown(tenderRequirements(base))).not.toContain(String.fromCharCode(0x2014));
  });
});
