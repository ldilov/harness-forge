import { describe, it, expect } from "vitest";
import { presentRecommendationBrief } from "../../src/infrastructure/presentation/presenters/recommendation-brief-presenter.js";
import { presentTargetComparison } from "../../src/infrastructure/presentation/presenters/target-comparison-presenter.js";
import { presentNextAction } from "../../src/infrastructure/presentation/presenters/next-action-presenter.js";
import { presentReviewSummaryV2 } from "../../src/infrastructure/presentation/presenters/review-summary-v2-presenter.js";
import { serializeRecommendationBrief } from "../../src/infrastructure/presentation/serializers/recommendation-brief-json.js";
import { serializeTargetComparison } from "../../src/infrastructure/presentation/serializers/target-comparison-json.js";
import { serializeNextAction } from "../../src/infrastructure/presentation/serializers/next-action-json.js";
import { normalizeForSnapshot } from "../../src/infrastructure/presentation/ansi-normalizer.js";
import type { RecommendationBrief } from "../../src/domain/onboarding/recommendation-brief.js";
import type { TargetComparisonReport } from "../../src/domain/targets/target-comparison.js";
import type { NextActionPlan } from "../../src/domain/next/next-action-plan.js";
import type { ReviewSummaryV2 } from "../../src/domain/review/review-summary-v2.js";

const sampleBrief: RecommendationBrief = {
  generatedAt: "2026-04-04T10:00:00.000Z",
  root: "/workspace/test",
  repoType: "typescript-cli",
  recommendedTargets: ["codex", "claude-code"],
  recommendedProfile: "recommended",
  recommendedModules: ["working-memory", "export-support"],
  rationale: {
    targets: [{ id: "r1", summary: "Both markers detected", importance: "high" }],
    profile: [{ id: "r2", summary: "Repo has meaningful surfaces", importance: "high" }],
    modules: [{ id: "r3", summary: "Export flows useful", importance: "medium" }],
  },
  evidence: [{ id: "ev1", label: "package.json", signalType: "tooling-signal", summary: "npm present" }],
  confidence: { targets: 0.9, profile: 0.8, modules: 0.7, overall: 0.7 },
  caveats: ["Codex hooks are documentation-led"],
  alternatives: [],
};

const sampleComparison: TargetComparisonReport = {
  generatedAt: "2026-04-04T10:00:00.000Z",
  leftTargetId: "codex",
  rightTargetId: "claude-code",
  sharedStrengths: ["Shared .hforge runtime"],
  headlineVerdict: "Both first-class; Claude offers stronger hooks.",
  capabilityComparisons: [{
    capabilityId: "typed-hooks",
    capabilityName: "Typed Hooks",
    left: { supportLevel: "partial", supportMode: "documentation-only" },
    right: { supportLevel: "full", supportMode: "native" },
    winner: "right",
    operatorImpact: "Claude has native hook support.",
  }],
  practicalImplications: ["Dual install useful for mixed teams"],
  recommendedUsagePatterns: [{ id: "dual", label: "Dual install", whenToChoose: ["Mixed teams"], caveats: ["Larger footprint"] }],
};

const sampleNextAction: NextActionPlan = {
  generatedAt: "2026-04-04T10:00:00.000Z",
  root: "/workspace/test",
  phase: "maintain",
  actionId: "maintain.refresh-runtime",
  title: "Refresh shared runtime",
  command: "hforge refresh --root .",
  summary: "Runtime index is stale.",
  confidence: 0.91,
  safeToAutoApply: true,
  classification: "safe-auto",
  evidence: [{ id: "ev1", label: "stale index", signalType: "runtime-signal", summary: "Runtime index stale" }],
  blockingConditions: [],
  followUps: [{ actionId: "review", title: "Review", command: "hforge review", reason: "Follow-up" }],
  alternatives: [],
};

const sampleReviewV2: ReviewSummaryV2 = {
  generatedAt: "2026-04-04T10:00:00.000Z",
  workspaceRoot: "/workspace/test",
  recommendedInstall: { targets: ["codex"], profile: "recommended", modules: ["export-support"] },
  why: ["Existing markers detected"],
  targetDifferences: ["Codex is documentation-led for hooks"],
  topChanges: [{ path: ".hforge/runtime/index.json", kind: "update", description: "Refresh runtime", layer: "canonical-runtime" }],
  warnings: [],
  fullWritePlan: [{ path: ".hforge/runtime/index.json", kind: "update", description: "Refresh runtime", layer: "canonical-runtime" }],
  directCommandPreview: "hforge init --root . --targets codex",
};

describe("scripted flow regression", () => {
  it("recommendation brief presenter produces stable text output", () => {
    const output = normalizeForSnapshot(presentRecommendationBrief(sampleBrief, "full"));
    expect(output).toContain("Recommended install");
    expect(output).toContain("codex + claude-code");
    expect(output).toContain("Why this is recommended");
  });

  it("recommendation brief presenter embedded mode is concise", () => {
    const output = normalizeForSnapshot(presentRecommendationBrief(sampleBrief, "embedded"));
    expect(output).toContain("Recommended install");
    expect(output).not.toContain("Why this is recommended");
  });

  it("target comparison presenter standalone mode shows diffs", () => {
    const output = normalizeForSnapshot(presentTargetComparison(sampleComparison, "standalone"));
    expect(output).toContain("Target comparison");
    expect(output).toContain("Capability differences");
  });

  it("target comparison presenter embedded mode is concise", () => {
    const output = normalizeForSnapshot(presentTargetComparison(sampleComparison, "embedded"));
    expect(output).not.toContain("Target comparison");
    expect(output).toContain("Important target differences");
  });

  it("next action presenter shows action details", () => {
    const output = normalizeForSnapshot(presentNextAction(sampleNextAction, false));
    expect(output).toContain("Best next action");
    expect(output).toContain("Refresh shared runtime");
    expect(output).toContain("hforge refresh --root .");
    expect(output).toContain("Safe to run now");
  });

  it("next action presenter verbose mode shows alternatives", () => {
    const output = normalizeForSnapshot(presentNextAction(sampleNextAction, true));
    expect(output).toContain("Best next action");
  });

  it("review summary v2 presenter shows recommendation before writes", () => {
    const output = normalizeForSnapshot(presentReviewSummaryV2(sampleReviewV2));
    const recIndex = output.indexOf("Recommended install");
    const changeIndex = output.indexOf("What will change");
    expect(recIndex).toBeLessThan(changeIndex);
  });

  it("JSON serializers produce valid JSON", () => {
    expect(() => JSON.parse(serializeRecommendationBrief(sampleBrief))).not.toThrow();
    expect(() => JSON.parse(serializeTargetComparison(sampleComparison))).not.toThrow();
    expect(() => JSON.parse(serializeNextAction(sampleNextAction))).not.toThrow();
  });

  it("ANSI normalizer strips color codes", () => {
    const withAnsi = "\x1b[32mGreen text\x1b[0m and normal";
    const stripped = normalizeForSnapshot(withAnsi);
    expect(stripped).toBe("Green text and normal");
    expect(stripped).not.toContain("\x1b");
  });
});
