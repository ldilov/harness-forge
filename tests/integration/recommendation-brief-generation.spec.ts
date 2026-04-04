import { describe, it, expect } from "vitest";
import { generateRecommendationBrief } from "../../src/application/onboarding/generate-recommendation-brief.js";
import type { DiagnosisResult } from "../../src/domain/onboarding/diagnosis-result.js";

function makeDiagnosis(overrides: Partial<DiagnosisResult> = {}): DiagnosisResult {
  return {
    generatedAt: new Date().toISOString(),
    root: "/workspace/test",
    repoType: "typescript-cli",
    dominantLanguages: [{ language: "TypeScript", strength: "high" }],
    frameworkMatches: [],
    toolingSignals: ["npm", "Vitest"],
    detectedTargets: [],
    riskSignals: [],
    topEvidence: [{ id: "ev1", label: "package.json", signalType: "tooling-signal", summary: "npm present" }],
    confidence: 0.8,
    ...overrides,
  };
}

describe("recommendation brief generation", () => {
  it("recommends dual targets when both markers detected", async () => {
    const diagnosis = makeDiagnosis({ detectedTargets: ["codex", "claude-code"] });
    const result = await generateRecommendationBrief({ diagnosis });
    expect(result.recommendedTargets).toContain("codex");
    expect(result.recommendedTargets).toContain("claude-code");
    expect(result.confidence.overall).toBeGreaterThan(0);
  });

  it("recommends codex-only for empty repo", async () => {
    const diagnosis = makeDiagnosis({
      repoType: "generic-repo",
      detectedTargets: [],
      toolingSignals: [],
      confidence: 0.4,
    });
    const result = await generateRecommendationBrief({ diagnosis });
    expect(result.recommendedTargets).toEqual(["codex"]);
    expect(result.recommendedProfile).toBe("quick");
  });

  it("recommends claude-code when only claude marker present", async () => {
    const diagnosis = makeDiagnosis({ detectedTargets: ["claude-code"] });
    const result = await generateRecommendationBrief({ diagnosis });
    expect(result.recommendedTargets).toContain("claude-code");
  });

  it("never returns empty recommendedTargets", async () => {
    const diagnosis = makeDiagnosis({ detectedTargets: [], confidence: 0.1 });
    const result = await generateRecommendationBrief({ diagnosis });
    expect(result.recommendedTargets.length).toBeGreaterThanOrEqual(1);
  });

  it("overall confidence bounded by weak links", async () => {
    const diagnosis = makeDiagnosis({ detectedTargets: ["codex", "claude-code"], confidence: 0.9 });
    const result = await generateRecommendationBrief({ diagnosis });
    expect(result.confidence.overall).toBeLessThanOrEqual(result.confidence.targets);
    expect(result.confidence.overall).toBeLessThanOrEqual(result.confidence.profile);
    expect(result.confidence.overall).toBeLessThanOrEqual(result.confidence.modules);
  });
});
