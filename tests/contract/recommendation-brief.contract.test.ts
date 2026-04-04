import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseRecommendationBrief } from "../../src/domain/onboarding/recommendation-brief.js";

describe("recommendation brief contract", () => {
  it("parses example fixture", () => {
    const fixturePath = path.join(
      process.cwd(),
      "tests/fixtures/contracts/onboarding-brief.example.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    const result = parseRecommendationBrief(fixture);
    expect(result.recommendedTargets.length).toBeGreaterThanOrEqual(1);
    expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
    expect(result.confidence.overall).toBeLessThanOrEqual(1);
  });

  it("rejects empty recommendedTargets", () => {
    const invalid = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      root: "/workspace",
      repoType: "test",
      recommendedTargets: [],
      recommendedProfile: "quick",
      recommendedModules: [],
      rationale: { targets: [], profile: [], modules: [] },
      evidence: [],
      confidence: { targets: 0.5, profile: 0.5, modules: 0.5, overall: 0.5 },
      caveats: [],
      alternatives: [],
    };
    expect(() => parseRecommendationBrief(invalid)).toThrow();
  });
});
