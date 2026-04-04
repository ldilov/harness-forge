import { describe, it, expect } from "vitest";
import { buildReviewSummaryV2 } from "../../src/application/review/build-review-summary-v2.js";
import type { RecommendationBrief } from "../../src/domain/onboarding/recommendation-brief.js";
import type { PlannedWrite } from "../../src/application/review/build-review-summary-v2.js";

function makeBrief(overrides: Partial<RecommendationBrief> = {}): RecommendationBrief {
  return {
    generatedAt: "2026-04-04T10:00:00.000Z",
    root: "/workspace",
    repoType: "typescript-cli",
    recommendedTargets: ["codex", "claude-code"],
    recommendedProfile: "recommended",
    recommendedModules: ["export-support"],
    rationale: {
      targets: [{ id: "r1", summary: "Both markers detected", importance: "high" as const }],
      profile: [{ id: "r2", summary: "Repo complexity justifies recommended", importance: "high" as const }],
      modules: [{ id: "r3", summary: "Export flows useful", importance: "medium" as const }],
    },
    evidence: [{ id: "ev1", label: "package.json", signalType: "tooling-signal", summary: "npm present" }],
    confidence: { targets: 0.9, profile: 0.8, modules: 0.7, overall: 0.7 },
    caveats: ["Codex hooks are documentation-led"],
    alternatives: [],
    ...overrides,
  };
}

describe("buildReviewSummaryV2", () => {
  it("produces valid ReviewSummaryV2 with all fields", async () => {
    const writes: PlannedWrite[] = [
      { path: ".hforge/runtime/index.json", kind: "update", description: "Refresh runtime index" },
      { path: ".codex/config.toml", kind: "update", description: "Refresh Codex bridge" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: ["Codex hooks are partial"],
      plannedWrites: writes,
    });

    expect(result.generatedAt).toBeTruthy();
    expect(result.workspaceRoot).toBe("/workspace");
    expect(result.recommendedInstall.targets).toEqual(["codex", "claude-code"]);
    expect(result.recommendedInstall.profile).toBe("recommended");
    expect(result.why.length).toBeGreaterThan(0);
    expect(result.targetDifferences).toEqual(["Codex hooks are partial"]);
    expect(result.directCommandPreview).toContain("hforge init");
  });

  it("classifies .hforge/runtime paths as canonical-runtime", async () => {
    const writes: PlannedWrite[] = [
      { path: ".hforge/runtime/index.json", kind: "update", description: "Refresh runtime" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.fullWritePlan[0]!.layer).toBe("canonical-runtime");
  });

  it("classifies .hforge/library paths as canonical-runtime", async () => {
    const writes: PlannedWrite[] = [
      { path: ".hforge/library/some-lib.json", kind: "create", description: "Add library" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.fullWritePlan[0]!.layer).toBe("canonical-runtime");
  });

  it("classifies .hforge/generated paths as generated", async () => {
    const writes: PlannedWrite[] = [
      { path: ".hforge/generated/catalog.json", kind: "update", description: "Refresh catalog" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.fullWritePlan[0]!.layer).toBe("generated");
  });

  it("classifies .hforge/state paths as state", async () => {
    const writes: PlannedWrite[] = [
      { path: ".hforge/state/install.json", kind: "create", description: "Write install state" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.fullWritePlan[0]!.layer).toBe("state");
  });

  it("classifies .codex, .claude, .agents, .specify, AGENTS.md, CLAUDE.md as target-bridge", async () => {
    const writes: PlannedWrite[] = [
      { path: ".codex/config.toml", kind: "update", description: "Codex bridge" },
      { path: ".claude/settings.json", kind: "update", description: "Claude bridge" },
      { path: ".agents/skills/test.md", kind: "create", description: "Agent skill" },
      { path: ".specify/state.json", kind: "update", description: "Specify state" },
      { path: "AGENTS.md", kind: "update", description: "AGENTS doc" },
      { path: "CLAUDE.md", kind: "update", description: "CLAUDE doc" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    for (const change of result.fullWritePlan) {
      expect(change.layer).toBe("target-bridge");
    }
  });

  it("classifies unknown paths as unknown", async () => {
    const writes: PlannedWrite[] = [
      { path: "src/index.ts", kind: "update", description: "Product code" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.fullWritePlan[0]!.layer).toBe("unknown");
  });

  it("selects top 5 changes sorted by layer priority", async () => {
    const writes: PlannedWrite[] = [
      { path: "src/unknown.ts", kind: "update", description: "Unknown 1" },
      { path: "src/unknown2.ts", kind: "update", description: "Unknown 2" },
      { path: ".hforge/state/s.json", kind: "create", description: "State" },
      { path: ".hforge/generated/g.json", kind: "update", description: "Generated" },
      { path: ".codex/c.toml", kind: "update", description: "Bridge" },
      { path: ".hforge/runtime/r.json", kind: "update", description: "Runtime" },
      { path: ".hforge/runtime/r2.json", kind: "update", description: "Runtime 2" },
    ];
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief(),
      targetDifferences: [],
      plannedWrites: writes,
    });

    expect(result.topChanges.length).toBe(5);
    // canonical-runtime should be first
    expect(result.topChanges[0]!.layer).toBe("canonical-runtime");
    // full write plan should have all 7
    expect(result.fullWritePlan.length).toBe(7);
  });

  it("populates warnings from caveats", async () => {
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief({ caveats: ["Warning 1", "Warning 2"] }),
      targetDifferences: [],
      plannedWrites: [],
    });

    expect(result.warnings).toEqual(["Warning 1", "Warning 2"]);
  });

  it("builds correct command preview", async () => {
    const result = await buildReviewSummaryV2({
      workspaceRoot: "/workspace",
      recommendation: makeBrief({ recommendedTargets: ["codex"], recommendedProfile: "quick" }),
      targetDifferences: [],
      plannedWrites: [],
    });

    expect(result.directCommandPreview).toBe("hforge init --root . --targets codex --setup-profile quick");
  });
});
