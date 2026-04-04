import { describe, it, expect } from "vitest";
import { parseDiagnosisResult } from "../../src/domain/onboarding/diagnosis-result.js";

describe("diagnosis result contract", () => {
  it("parses valid diagnosis result", () => {
    const valid = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      root: "/workspace/test",
      repoType: "typescript-cli",
      dominantLanguages: [{ language: "TypeScript", strength: "high" }],
      frameworkMatches: ["React"],
      toolingSignals: ["npm", "Vitest"],
      detectedTargets: ["codex"],
      riskSignals: [],
      topEvidence: [{
        id: "ev1",
        label: "package.json",
        path: "package.json",
        signalType: "tooling-signal",
        summary: "npm package metadata present",
      }],
      confidence: 0.87,
    };
    const result = parseDiagnosisResult(valid);
    expect(result.repoType).toBe("typescript-cli");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("rejects confidence out of range", () => {
    const invalid = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      root: "/workspace",
      repoType: "test",
      dominantLanguages: [],
      frameworkMatches: [],
      toolingSignals: [],
      detectedTargets: [],
      riskSignals: [],
      topEvidence: [],
      confidence: 1.5,
    };
    expect(() => parseDiagnosisResult(invalid)).toThrow();
  });
});
