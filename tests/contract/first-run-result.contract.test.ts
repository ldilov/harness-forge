import { describe, expect, it } from "vitest";

import { firstRunResultSchema, parseFirstRunResult } from "../../src/domain/runtime/first-run-result.js";

describe("first-run result contract", () => {
  const validFullSuccess = {
    schemaVersion: "1.0.0",
    timestamp: new Date().toISOString(),
    repoType: "monorepo",
    targetPosture: "claude-code",
    generatedArtifacts: [
      ".hforge/runtime/repo/onboarding-brief.json",
      ".hforge/runtime/repo/onboarding-brief.md"
    ],
    primaryNextCommand: "hforge recommend --root . --json",
    briefPath: ".hforge/runtime/repo/onboarding-brief.json",
    recoveryGuidance: null,
    partialSuccess: false
  };

  const validPartialSuccess = {
    ...validFullSuccess,
    partialSuccess: true,
    recoveryGuidance: "Install failed: timeout. Run hforge doctor to diagnose.",
    generatedArtifacts: []
  };

  it("accepts a full-success first-run result", () => {
    const result = firstRunResultSchema.safeParse(validFullSuccess);
    expect(result.success).toBe(true);
  });

  it("parses a full-success first-run result", () => {
    const parsed = parseFirstRunResult(validFullSuccess);
    expect(parsed.partialSuccess).toBe(false);
    expect(parsed.recoveryGuidance).toBeNull();
    expect(parsed.primaryNextCommand).toBe("hforge recommend --root . --json");
  });

  it("accepts a partial-success first-run result", () => {
    const result = firstRunResultSchema.safeParse(validPartialSuccess);
    expect(result.success).toBe(true);
  });

  it("parses a partial-success first-run result with recoveryGuidance", () => {
    const parsed = parseFirstRunResult(validPartialSuccess);
    expect(parsed.partialSuccess).toBe(true);
    expect(parsed.recoveryGuidance).toContain("hforge doctor");
  });

  it("requires primaryNextCommand to be non-empty", () => {
    const invalid = { ...validFullSuccess, primaryNextCommand: "" };
    const result = firstRunResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("requires briefPath to be non-empty", () => {
    const invalid = { ...validFullSuccess, briefPath: "" };
    const result = firstRunResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("allows recoveryGuidance to be null", () => {
    const withNull = { ...validFullSuccess, recoveryGuidance: null };
    const result = firstRunResultSchema.safeParse(withNull);
    expect(result.success).toBe(true);
  });

  it("rejects missing schemaVersion", () => {
    const { schemaVersion: _unused, ...noVersion } = validFullSuccess;
    const result = firstRunResultSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });
});
