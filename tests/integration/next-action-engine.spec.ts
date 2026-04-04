import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { recommendNextAction } from "../../src/application/next/recommend-next-action.js";
import { buildCandidateActions } from "../../src/application/next/build-candidate-actions.js";
import { scoreCandidateActions, filterSafeAutoOnly } from "../../src/application/next/score-candidate-actions.js";
import type { WorkspaceState } from "../../src/domain/next/candidate-action.js";

describe("next action engine", () => {
  const tempDirs: string[] = [];

  function createWorkspace(structure: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-next-"));
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

  it("recommends bootstrap for uninitialized workspace", async () => {
    const root = createWorkspace();
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.actionId).toBe("setup.bootstrap");
    expect(plan.phase).toBe("setup");
  });

  it("recommends recovery when runtime index missing but install state exists", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.actionId).toBe("recover.fix-missing-runtime-index");
    expect(plan.phase).toBe("recover");
    expect(plan.safeToAutoApply).toBe(true);
  });

  it("safe auto-apply only allows safe-auto classification", () => {
    const state: WorkspaceState = {
      hasInstallState: true,
      hasRuntimeIndex: true,
      isRuntimeStale: false,
      doctorStatus: "healthy",
      staleArtifactCount: 0,
      hasTaskFolders: true,
      hasPacksAvailable: false,
      hasFlowState: false,
      isShellIntegrated: true,
      detectedTargets: ["codex"],
    };
    const candidates = buildCandidateActions(state);
    const scored = scoreCandidateActions(candidates, state);
    const safeOnly = filterSafeAutoOnly(scored);
    for (const s of safeOnly) {
      expect(s.action.classification).toBe("safe-auto");
    }
  });

  it("rejects non-safe actions from safe-auto filter", () => {
    const state: WorkspaceState = {
      hasInstallState: true,
      hasRuntimeIndex: true,
      isRuntimeStale: false,
      doctorStatus: "warning",
      staleArtifactCount: 0,
      hasTaskFolders: false,
      hasPacksAvailable: false,
      hasFlowState: false,
      isShellIntegrated: true,
      detectedTargets: [],
    };
    const candidates = buildCandidateActions(state);
    const scored = scoreCandidateActions(candidates, state);
    const safeOnly = filterSafeAutoOnly(scored);
    for (const s of safeOnly) {
      expect(s.action.classification).toBe("safe-auto");
    }
    // Ensure non-safe-auto actions were filtered out
    const nonSafe = scored.filter((s) => s.action.classification !== "safe-auto");
    expect(nonSafe.length).toBeGreaterThan(0);
    expect(safeOnly.length).toBeLessThan(scored.length);
  });
});
