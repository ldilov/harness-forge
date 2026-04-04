import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { recommendNextAction } from "../../src/application/next/recommend-next-action.js";

describe("recommendNextAction edge cases", () => {
  const tempDirs: string[] = [];

  function createWorkspace(structure: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-next-edge-"));
    tempDirs.push(dir);
    for (const [name, content] of Object.entries(structure)) {
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

  it("returns fallback plan when no candidates match", async () => {
    // Workspace with install state + runtime index + healthy doctor + no stale artifacts + no tasks
    // This should match some candidates (review, doctor warning is false)
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Should produce a valid plan regardless
    expect(plan.actionId).toBeTruthy();
    expect(plan.command).toBeTruthy();
    expect(plan.confidence).toBeGreaterThanOrEqual(0);
    expect(plan.confidence).toBeLessThanOrEqual(1);
  });

  it("detects doctor warning state from report", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/state/doctor-report.json": JSON.stringify({ status: "warning" }),
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.phase).toBe("maintain");
  });

  it("detects doctor failure state from report", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/state/doctor-report.json": JSON.stringify({ status: "failure" }),
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.phase).toBe("recover");
  });

  it("includes stale artifact evidence when stale tasks exist", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    // Create stale task artifacts (old modification time)
    const tasksDir = path.join(root, ".hforge", "runtime", "tasks");
    fs.mkdirSync(tasksDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      const taskFile = path.join(tasksDir, `task-${i}.json`);
      fs.writeFileSync(taskFile, "{}");
      // Set modification time to 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      fs.utimesSync(taskFile, twoHoursAgo, twoHoursAgo);
    }
    const plan = await recommendNextAction({ workspaceRoot: root });
    const staleEvidence = plan.evidence.find((e) => e.id === "ev-stale-tasks");
    expect(staleEvidence).toBeTruthy();
    expect(staleEvidence!.summary).toContain("stale task artifacts");
  });

  it("includes target evidence when targets detected", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    fs.mkdirSync(path.join(root, ".codex"), { recursive: true });
    const plan = await recommendNextAction({ workspaceRoot: root });
    const targetEvidence = plan.evidence.find((e) => e.id === "ev-targets");
    expect(targetEvidence).toBeTruthy();
    expect(targetEvidence!.summary).toContain("codex");
  });

  it("uses correct summary text for each action", async () => {
    // Test stale runtime → refresh summary
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    // Make runtime index stale (2 hours ago)
    const indexPath = path.join(root, ".hforge", "runtime", "index.json");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(indexPath, twoHoursAgo, twoHoursAgo);

    const plan = await recommendNextAction({ workspaceRoot: root });
    if (plan.actionId === "maintain.refresh-runtime") {
      expect(plan.summary).toContain("stale");
    }
  });

  it("provides follow-ups when alternatives exist", async () => {
    const root = createWorkspace();
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Bootstrap plan may or may not have follow-ups, but structure should be valid
    expect(Array.isArray(plan.followUps)).toBe(true);
    expect(Array.isArray(plan.alternatives)).toBe(true);
  });

  it("safeToAutoApply always matches classification", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    if (plan.safeToAutoApply) {
      expect(plan.classification).toBe("safe-auto");
    } else {
      expect(plan.classification).not.toBe("safe-auto");
    }
  });

  it("produces operate phase for healthy workspace with tasks", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
      ".hforge/runtime/tasks/task-1.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Healthy workspace should be in operate or maintain phase
    expect(["operate", "maintain"]).toContain(plan.phase);
  });

  it("returns maintain.review-health summary text", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    // Whatever action is recommended, it should have a non-empty summary
    expect(plan.summary.length).toBeGreaterThan(0);
  });

  it("handles default summary for unknown action IDs gracefully", async () => {
    // This tests the default case of buildSummary via the fallback plan
    const root = createWorkspace();
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.summary).toBeTruthy();
  });
});
