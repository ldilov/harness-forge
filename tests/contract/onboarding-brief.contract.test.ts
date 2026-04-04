import { describe, expect, it } from "vitest";

import { onboardingBriefSchema, parseOnboardingBrief } from "../../src/domain/runtime/onboarding-brief.js";

describe("onboarding brief contract", () => {
  const validBrief = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    repoType: "monorepo",
    detectedLanguages: ["typescript"],
    detectedFrameworks: ["next.js"],
    keyBoundaries: ["src/api", "src/web"],
    selectedTargets: ["claude-code"],
    selectedProfile: "recommended",
    recommendedBundles: ["lang:typescript", "framework:next"],
    primaryWorkflowRecommendation: "Run recommend to get repo-aware guidance.",
    nextBestCommand: "hforge recommend --root . --json",
    alternateCommands: ["hforge review --root . --json", "hforge status --root . --json"],
    knownCautions: [],
    headline: "monorepo repo with typescript — targets: claude-code"
  };

  it("accepts a valid onboarding brief", () => {
    const result = onboardingBriefSchema.safeParse(validBrief);
    expect(result.success).toBe(true);
  });

  it("parses a valid onboarding brief via parseOnboardingBrief", () => {
    const parsed = parseOnboardingBrief(validBrief);
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.headline).toContain("monorepo");
  });

  it("requires nextBestCommand to be non-empty", () => {
    const invalid = { ...validBrief, nextBestCommand: "" };
    const result = onboardingBriefSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("enforces alternateCommands max length of 2", () => {
    const invalid = {
      ...validBrief,
      alternateCommands: ["cmd1", "cmd2", "cmd3"]
    };
    const result = onboardingBriefSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("allows empty alternateCommands", () => {
    const withEmpty = { ...validBrief, alternateCommands: [] };
    const result = onboardingBriefSchema.safeParse(withEmpty);
    expect(result.success).toBe(true);
  });

  it("allows empty knownCautions", () => {
    const withEmpty = { ...validBrief, knownCautions: [] };
    const result = onboardingBriefSchema.safeParse(withEmpty);
    expect(result.success).toBe(true);
  });

  it("rejects missing headline", () => {
    const { headline: _unused, ...noHeadline } = validBrief;
    const result = onboardingBriefSchema.safeParse(noHeadline);
    expect(result.success).toBe(false);
  });
});
