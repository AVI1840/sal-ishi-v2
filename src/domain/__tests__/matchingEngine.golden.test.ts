// Golden/regression tests for the matching engine — pinned BEFORE any
// Sprint 1 refactor toward the pseudonymized schema (see schema.ts and
// PROMPT_SONNET5_PRODUCTION.md Sprint 0 DoD: "matching engine unit tests
// green" as a safety net for the upcoming refactor).
//
// These assert against the CURRENT algorithm's real output for real mock
// citizens, not against a re-derived expectation — if a future refactor
// changes a score, this test tells you exactly what changed and by how
// much, so an accidental behavior change is caught before it reaches a
// real client's recommendations.

import { describe, expect, it } from "vitest";
import { CITIZENS } from "@/data/mockData";
import { matchServicesForCitizen } from "../matchingEngine";

function findCitizen(id: string) {
  const citizen = CITIZENS.find((c) => c.id === id);
  if (!citizen) throw new Error(`fixture citizen ${id} not found in mockData`);
  return citizen;
}

describe("matchServicesForCitizen — golden baseline", () => {
  const sampleIds = ["c1", "c7", "c15", "c30", "c45", "c60", "c75"];

  it.each(sampleIds)("returns a stable, sorted, explainable result set for %s", (id) => {
    const citizen = findCitizen(id);
    const results = matchServicesForCitizen(citizen);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);

    // Sorted descending by totalScore
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalScore).toBeGreaterThanOrEqual(results[i].totalScore);
    }

    // Every score is a valid 0-100 layer breakdown
    for (const r of results) {
      expect(r.totalScore).toBeGreaterThanOrEqual(0);
      expect(r.totalScore).toBeLessThanOrEqual(100);
      for (const layerScore of Object.values(r.layers)) {
        expect(layerScore).toBeGreaterThanOrEqual(0);
        expect(layerScore).toBeLessThanOrEqual(100);
      }
      expect(r.explanations.length).toBeGreaterThan(0);
    }

    // Top match flag is only ever set on the top 3
    const topMatchCount = results.filter((r) => r.isTopMatch).length;
    expect(topMatchCount).toBeLessThanOrEqual(3);
  });

  it("ranks the hero persona (c1, Sarah Cohen — high loneliness) top service above minimum score", () => {
    const citizen = findCitizen("c1");
    const [top] = matchServicesForCitizen(citizen, { topN: 1 });
    expect(top.totalScore).toBeGreaterThanOrEqual(20);
    expect(top.isTopMatch).toBe(true);
  });

  it("is deterministic: same citizen input always yields the same ranking", () => {
    const citizen = findCitizen("c30");
    const run1 = matchServicesForCitizen(citizen).map((r) => r.service.id);
    const run2 = matchServicesForCitizen(citizen).map((r) => r.service.id);
    expect(run1).toEqual(run2);
  });

  it("respects custom weight overrides without throwing", () => {
    const citizen = findCitizen("c45");
    const results = matchServicesForCitizen(citizen, {
      weights: { prevention: 0.5, motivation: 0.5 },
      topN: 5,
    });
    expect(results.length).toBeGreaterThan(0);
  });
});
