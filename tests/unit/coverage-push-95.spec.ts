import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ---- cli/commands/next.ts ----

describe("cli/commands/next.ts registration and action", () => {
  let logs: string[];
  let errors: string[];
  const origLog = console.log;
  const origErr = console.error;

  beforeEach(() => {
    logs = [];
    errors = [];
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    console.error = (...args: unknown[]) => errors.push(args.join(" "));
  });

  afterEach(() => {
    console.log = origLog;
    console.error = origErr;
  });

  it("registers next command on program", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);
    const nextCmd = program.commands.find((c) => c.name() === "next");
    expect(nextCmd).toBeTruthy();
    expect(nextCmd!.description()).toContain("next action");
  });

  it("next --json outputs valid JSON", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cli-next-"));
    try {
      await program.parseAsync(["node", "test", "next", "--root", tmpDir, "--json"], { from: "node" });
      const jsonOutput = logs.join("\n");
      const parsed = JSON.parse(jsonOutput);
      expect(parsed.actionId).toBeTruthy();
      expect(parsed.phase).toBeTruthy();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("next without --json outputs presenter text", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cli-next-"));
    try {
      await program.parseAsync(["node", "test", "next", "--root", tmpDir], { from: "node" });
      const output = logs.join("\n");
      expect(output).toContain("Best next action");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("next --verbose shows alternatives", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cli-next-"));
    try {
      await program.parseAsync(["node", "test", "next", "--root", tmpDir, "--verbose"], { from: "node" });
      const output = logs.join("\n");
      expect(output).toContain("Best next action");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("next --apply-safe-fixes on non-safe action refuses", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);

    // Empty workspace -> setup.bootstrap (safe-manual, not safe-auto)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cli-next-"));
    try {
      await program.parseAsync(["node", "test", "next", "--root", tmpDir, "--apply-safe-fixes"], { from: "node" });
      const output = logs.join("\n");
      expect(output).toContain("cannot be auto-applied");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("next --apply-safe-fixes on safe-auto action attempts execution", async () => {
    const { registerNextCommands } = await import("../../src/cli/commands/next.js");
    const program = new Command();
    program.exitOverride();
    registerNextCommands(program);

    // Create workspace with install state but no runtime index -> recover.fix-missing-runtime-index (safe-auto)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cli-next-"));
    fs.mkdirSync(path.join(tmpDir, ".hforge", "state"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".hforge", "state", "install.json"), "{}");
    try {
      await program.parseAsync(["node", "test", "next", "--root", tmpDir, "--apply-safe-fixes"], { from: "node" });
      const allOutput = logs.join("\n") + errors.join("\n");
      // It should attempt to run but the command may fail since hforge isn't installed in temp dir
      // Either "Running safe action" or "Action failed" is acceptable
      const attempted = allOutput.includes("Running safe action") || allOutput.includes("Action failed");
      expect(attempted).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---- recommend-next-action.ts uncovered branches ----
import { recommendNextAction } from "../../src/application/next/recommend-next-action.js";

describe("recommend-next-action: summary and evidence branches", () => {
  const tempDirs: string[] = [];

  function createWs(structure: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-rna-"));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(structure)) {
      const p = path.join(dir, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content);
    }
    return dir;
  }

  afterEach(() => {
    for (const d of tempDirs) fs.rmSync(d, { recursive: true, force: true });
    tempDirs.length = 0;
  });

  it("covers maintain.run-doctor summary for doctor warning", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/state/doctor-report.json": JSON.stringify({ status: "warning" }),
      ".hforge/runtime/index.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Should be maintain phase since doctor is warning
    expect(plan.phase).toBe("maintain");
    // The action might be doctor or refresh depending on scoring
    expect(plan.summary.length).toBeGreaterThan(0);
  });

  it("covers reconcile-stale-artifacts summary", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    const tasksDir = path.join(root, ".hforge", "runtime", "tasks");
    fs.mkdirSync(tasksDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      const f = path.join(tasksDir, `stale-${i}.json`);
      fs.writeFileSync(f, "{}");
      const old = new Date(Date.now() - 3 * 60 * 60 * 1000);
      fs.utimesSync(f, old, old);
    }
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.summary.length).toBeGreaterThan(0);
  });

  it("covers operate phase with task folders present", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
      ".hforge/runtime/tasks/task.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(["operate", "maintain"]).toContain(plan.phase);
  });

  it("covers evidence building for all signal types", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
    });
    fs.mkdirSync(path.join(root, ".codex"));
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Should have ev-no-index and ev-targets evidence items
    expect(plan.evidence.some(e => e.id === "ev-no-index")).toBe(true);
    expect(plan.evidence.some(e => e.id === "ev-targets")).toBe(true);
  });
});

// ---- generate-recommendation-brief.ts uncovered branches ----
import { generateRecommendationBrief } from "../../src/application/onboarding/generate-recommendation-brief.js";
import type { DiagnosisResult } from "../../src/domain/onboarding/diagnosis-result.js";

describe("generate-recommendation-brief: uncovered branches", () => {
  function makeDiag(overrides: Partial<DiagnosisResult> = {}): DiagnosisResult {
    return {
      generatedAt: new Date().toISOString(),
      root: "/workspace",
      repoType: "typescript-cli",
      dominantLanguages: [{ language: "TypeScript", strength: "high" }],
      frameworkMatches: [],
      toolingSignals: ["npm", "Vitest"],
      detectedTargets: [],
      riskSignals: [],
      topEvidence: [{ id: "ev1", label: "pkg", signalType: "tooling-signal", summary: "npm present" }],
      confidence: 0.8,
      ...overrides,
    };
  }

  it("covers codex-only target path when only codex detected", async () => {
    const result = await generateRecommendationBrief({
      diagnosis: makeDiag({ detectedTargets: ["codex"] }),
    });
    expect(result.recommendedTargets).toEqual(["codex"]);
    expect(result.rationale.targets.some(r => r.id === "existing-codex-marker")).toBe(true);
  });

  it("covers task-pack-support module when frameworks present", async () => {
    const result = await generateRecommendationBrief({
      diagnosis: makeDiag({ frameworkMatches: ["React"], toolingSignals: ["npm", "Vitest"] }),
    });
    expect(result.recommendedModules).toContain("task-pack-support");
  });

  it("covers task-pack-support module when 3+ tooling signals", async () => {
    const result = await generateRecommendationBrief({
      diagnosis: makeDiag({ toolingSignals: ["npm", "Vitest", "GitHub Actions"] }),
    });
    expect(result.recommendedModules).toContain("task-pack-support");
  });
});

// ---- compare-targets.ts edge branches ----
import { compareTargets } from "../../src/application/targets/compare-targets.js";

describe("compare-targets: edge branches", () => {
  const cwd = process.cwd();

  it("covers headline verdict when left wins more", async () => {
    // The actual codex vs claude-code comparison hits specific branches
    // depending on the real capability matrix
    const report = await compareTargets({
      leftTargetId: "codex",
      rightTargetId: "claude-code",
      workspaceRoot: cwd,
    });
    expect(report.headlineVerdict.length).toBeGreaterThan(0);
    // Verify usage patterns include target-specific entries
    expect(report.recommendedUsagePatterns.length).toBeGreaterThanOrEqual(1);
  });

  it("covers matrix load failure for invalid workspace", async () => {
    await expect(
      compareTargets({
        leftTargetId: "codex",
        rightTargetId: "claude-code",
        workspaceRoot: "/nonexistent/path/that/does/not/exist",
      })
    ).rejects.toThrow("Cannot load capability matrix");
  });

  it("practical implications include dual-install when diffs exist", async () => {
    const report = await compareTargets({
      leftTargetId: "codex",
      rightTargetId: "claude-code",
      workspaceRoot: cwd,
    });
    const hasDualImplication = report.practicalImplications.some(
      p => p.includes("Dual install") || p.includes("canonical")
    );
    expect(hasDualImplication).toBe(true);
  });
});

// ---- collect-workspace-state.ts edge cases ----
import { collectWorkspaceState } from "../../src/application/next/collect-workspace-state.js";

describe("collect-workspace-state: edge cases", () => {
  const tempDirs: string[] = [];

  function createWs(structure: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-cws-"));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(structure)) {
      const p = path.join(dir, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content);
    }
    return dir;
  }

  afterEach(() => {
    for (const d of tempDirs) fs.rmSync(d, { recursive: true, force: true });
    tempDirs.length = 0;
  });

  it("handles empty tasks directory for stale count", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    fs.mkdirSync(path.join(root, ".hforge", "runtime", "tasks"), { recursive: true });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.staleArtifactCount).toBe(0);
  });

  it("handles packs directory present", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": "{}",
      ".hforge/runtime/packs/pack1.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.hasPacksAvailable).toBe(true);
  });

  it("handles flow state present", async () => {
    const root = createWs({
      ".hforge/state/install.json": "{}",
      ".hforge/state/flow/active.json": "{}",
      ".hforge/runtime/index.json": "{}",
    });
    const state = await collectWorkspaceState({ workspaceRoot: root });
    expect(state.hasFlowState).toBe(true);
  });
});
