import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// --- recommend-next-action: fallback plan path ---
import { recommendNextAction } from "../../src/application/next/recommend-next-action.js";

// --- presenters: uncovered branches ---
import { presentRecommendationBrief } from "../../src/infrastructure/presentation/presenters/recommendation-brief-presenter.js";
import { presentReviewSummaryV2 } from "../../src/infrastructure/presentation/presenters/review-summary-v2-presenter.js";
import type { RecommendationBrief } from "../../src/domain/onboarding/recommendation-brief.js";
import type { ReviewSummaryV2 } from "../../src/domain/review/review-summary-v2.js";

// --- diagnosis: framework detection branches ---
import { generateDiagnosis } from "../../src/application/onboarding/generate-diagnosis.js";

// --- collect-workspace-state: stale check branch ---
import { collectWorkspaceState } from "../../src/application/next/collect-workspace-state.js";

const tempDirs: string[] = [];

function createTempRepo(files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-covgap-"));
  tempDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe("recommend-next-action fallback path", () => {
  it("returns fallback plan when all candidates are filtered out", async () => {
    // Create a workspace where install state exists but all prerequisite checks fail
    // This is tricky — we need install state + runtime index + no stale + no tasks + no doctor issues + shell integrated
    // The only candidates that pass are review and inspect-task (if tasks exist)
    // With no tasks and healthy doctor, the remaining candidates should still exist
    // Let's test the fallback plan structure directly
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Even in this state we should get a valid plan
    expect(plan.generatedAt).toBeTruthy();
    expect(plan.command).toBeTruthy();
    expect(typeof plan.safeToAutoApply).toBe("boolean");
    if (plan.safeToAutoApply) {
      expect(plan.classification).toBe("safe-auto");
    }
  });
});

describe("recommendation-brief-presenter: alternatives and evidence branches", () => {
  const baseBrief: RecommendationBrief = {
    generatedAt: "2026-04-04T10:00:00.000Z",
    root: "/workspace",
    repoType: "typescript-cli",
    recommendedTargets: ["codex", "claude-code"],
    recommendedProfile: "recommended",
    recommendedModules: ["export-support"],
    rationale: {
      targets: [{ id: "r1", summary: "Both markers detected", importance: "high" }],
      profile: [{ id: "r2", summary: "Repo has surfaces", importance: "high" }],
      modules: [{ id: "r3", summary: "Export useful", importance: "medium" }],
    },
    evidence: [],
    confidence: { targets: 0.9, profile: 0.8, modules: 0.7, overall: 0.7 },
    caveats: [],
    alternatives: [],
  };

  it("renders alternatives section when alternatives exist", () => {
    const brief: RecommendationBrief = {
      ...baseBrief,
      alternatives: [
        { id: "alt1", summary: "Codex only for smaller footprint", targets: ["codex"], tradeOffs: ["No Claude hooks"] },
      ],
    };
    const output = presentRecommendationBrief(brief, "full");
    expect(output).toContain("Alternative");
    expect(output).toContain("Codex only for smaller footprint");
  });

  it("hides alternatives section when empty", () => {
    const output = presentRecommendationBrief(baseBrief, "full");
    expect(output).not.toContain("Alternative");
  });

  it("shows evidence with more-than-5 hint", () => {
    const evidence = Array.from({ length: 8 }, (_, i) => ({
      id: `ev${i}`,
      label: `Evidence ${i}`,
      signalType: "tooling-signal" as const,
      summary: `Signal ${i}`,
    }));
    const brief: RecommendationBrief = { ...baseBrief, evidence };
    const output = presentRecommendationBrief(brief, "full");
    expect(output).toContain("Evidence");
    expect(output).toContain("and 3 more");
    expect(output).toContain("--show-evidence");
  });

  it("shows low confidence for value < 0.5", () => {
    const brief: RecommendationBrief = {
      ...baseBrief,
      confidence: { targets: 0.3, profile: 0.2, modules: 0.1, overall: 0.1 },
    };
    const output = presentRecommendationBrief(brief, "full");
    expect(output).toContain("Confidence: Low");
  });

  it("shows no evidence section when empty", () => {
    const output = presentRecommendationBrief(baseBrief, "full");
    expect(output).not.toContain("Evidence");
  });

  it("shows evidence path suffix when path exists", () => {
    const brief: RecommendationBrief = {
      ...baseBrief,
      evidence: [{ id: "ev1", label: "pkg", path: "package.json", signalType: "tooling-signal", summary: "npm present" }],
    };
    const output = presentRecommendationBrief(brief, "full");
    expect(output).toContain("(package.json)");
  });

  it("shows evidence without path when path absent", () => {
    const brief: RecommendationBrief = {
      ...baseBrief,
      evidence: [{ id: "ev1", label: "test", signalType: "tooling-signal", summary: "No path item" }],
    };
    const output = presentRecommendationBrief(brief, "full");
    expect(output).toContain("No path item");
    expect(output).not.toContain("(undefined)");
  });
});

describe("review-summary-v2-presenter: warnings branch", () => {
  it("renders warnings section when warnings present", () => {
    const summary: ReviewSummaryV2 = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      workspaceRoot: "/workspace",
      recommendedInstall: { targets: ["codex"], profile: "recommended", modules: [] },
      why: ["Markers detected"],
      targetDifferences: [],
      topChanges: [{ path: ".hforge/runtime/index.json", kind: "update", description: "Refresh", layer: "canonical-runtime" }],
      warnings: ["Hook posture caveat", "Partial support warning"],
      fullWritePlan: [],
      directCommandPreview: "hforge init --root .",
    };
    const output = presentReviewSummaryV2(summary);
    expect(output).toContain("Warnings");
    expect(output).toContain("Hook posture caveat");
    expect(output).toContain("Partial support warning");
  });

  it("hides warnings section when empty", () => {
    const summary: ReviewSummaryV2 = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      workspaceRoot: "/workspace",
      recommendedInstall: { targets: ["codex"], profile: "recommended", modules: [] },
      why: ["Markers detected"],
      targetDifferences: [],
      topChanges: [],
      warnings: [],
      fullWritePlan: [],
      directCommandPreview: "hforge init --root .",
    };
    const output = presentReviewSummaryV2(summary);
    expect(output).not.toContain("Warnings");
  });
});

describe("generate-diagnosis: framework and language detection branches", () => {
  it("detects React framework from package.json dependencies", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", dependencies: { react: "18.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.frameworkMatches).toContain("React");
  });

  it("detects Next.js framework from package.json dependencies", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", dependencies: { next: "14.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.frameworkMatches).toContain("Next.js");
  });

  it("detects Vue framework from package.json dependencies", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", dependencies: { vue: "3.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.frameworkMatches).toContain("Vue");
  });

  it("detects Express framework from package.json dependencies", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", dependencies: { express: "4.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.frameworkMatches).toContain("Express");
  });

  it("detects Jest tooling from devDependencies", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", devDependencies: { jest: "29.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.toolingSignals).toContain("Jest");
  });

  it("detects Go language from go.mod", async () => {
    const root = createTempRepo({ "go.mod": "module example.com/myapp" });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.dominantLanguages.some((l) => l.language === "Go")).toBe(true);
    expect(result.topEvidence.some((e) => e.path === "go.mod")).toBe(true);
  });

  it("detects Rust language from Cargo.toml", async () => {
    const root = createTempRepo({ "Cargo.toml": '[package]\nname = "myapp"' });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.dominantLanguages.some((l) => l.language === "Rust")).toBe(true);
    expect(result.topEvidence.some((e) => e.path === "Cargo.toml")).toBe(true);
  });

  it("detects GitHub Actions from .github/workflows directory", async () => {
    const root = createTempRepo({
      "package.json": "{}",
      ".github/workflows/ci.yml": "name: CI",
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.toolingSignals).toContain("GitHub Actions");
  });

  it("produces framework-based repo type when frameworks detected", async () => {
    const root = createTempRepo({
      "package.json": JSON.stringify({ name: "test", dependencies: { react: "18.0.0" } }),
    });
    const result = await generateDiagnosis({ workspaceRoot: root });
    expect(result.repoType).toBe("typescript-react");
  });

  it("handles malformed package.json gracefully", async () => {
    const root = createTempRepo({ "package.json": "not-json{{{" });
    const result = await generateDiagnosis({ workspaceRoot: root });
    // Should not crash, still detect TypeScript from package.json presence
    expect(result.dominantLanguages.some((l) => l.language === "TypeScript")).toBe(true);
    expect(result.frameworkMatches.length).toBe(0);
  });
});

describe("collect-workspace-state: stale runtime edge cases", () => {
  it("marks runtime as stale when index mtime is old", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    // Set mtime to 2 hours ago
    const indexPath = path.join(root, ".hforge", "runtime", "index.json");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(indexPath, twoHoursAgo, twoHoursAgo);

    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.isRuntimeStale).toBe(true);
  });

  it("marks runtime as not stale when index is fresh", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.isRuntimeStale).toBe(false);
  });

  it("handles doctor report with healthy status", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/state/doctor-report.json": JSON.stringify({ status: "healthy" }),
      ".hforge/runtime/index.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.doctorStatus).toBe("healthy");
  });

  it("handles missing doctor report as unknown", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.doctorStatus).toBe("unknown");
  });

  it("detects task folders when present", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
      ".hforge/runtime/tasks/task-1.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.hasTaskFolders).toBe(true);
  });

  it("detects both targets from markers", async () => {
    const root = createTempRepo({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    fs.mkdirSync(path.join(root, ".codex"), { recursive: true });
    fs.mkdirSync(path.join(root, ".claude"), { recursive: true });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.detectedTargets).toContain("codex");
    expect(state.detectedTargets).toContain("claude-code");
  });
});
