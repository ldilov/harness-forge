import path from "node:path";

import { describe, expect, it } from "vitest";

import { recommendFromIntelligence } from "../../src/application/recommendations/recommend-from-intelligence.js";

const root = process.cwd();

describe("repo intelligence contract", () => {
  it("returns the required fields with evidence-backed recommendations", async () => {
    const fixtureRoot = path.join(root, "tests", "fixtures", "benchmarks", "typescript-web-app");
    const result = await recommendFromIntelligence(fixtureRoot);

    expect(result.repoType).toBe("app");
    expect(result.dominantLanguages.length).toBeGreaterThan(0);
    expect(result.frameworkMatches.length).toBeGreaterThan(0);
    expect(result.recommendations.bundles.length).toBeGreaterThan(0);
    expect(result.recommendations.profiles.length).toBeGreaterThan(0);
    expect(result.recommendations.skills.length).toBeGreaterThan(0);

    for (const recommendation of [
      ...result.recommendations.bundles,
      ...result.recommendations.profiles,
      ...result.recommendations.skills,
      ...result.recommendations.validations
    ]) {
      expect(recommendation.evidence.length).toBeGreaterThan(0);
      expect(recommendation.why.length).toBeGreaterThan(0);
    }
  });
});
