import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { recommendNextAction } from "../../src/application/next/recommend-next-action.js";

describe("default entry routing", () => {
  const tempDirs: string[] = [];

  function createWorkspace(structure: Record<string, string> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hforge-route-"));
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

  it("uninitialized workspace routes to setup phase", async () => {
    const root = createWorkspace();
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.phase).toBe("setup");
    expect(plan.actionId).toBe("setup.bootstrap");
  });

  it("initialized workspace with runtime routes to operate/maintain", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
      ".hforge/runtime/index.json": JSON.stringify({ version: 1 }),
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(["operate", "maintain"]).toContain(plan.phase);
  });

  it("initialized workspace without runtime index routes to recover", async () => {
    const root = createWorkspace({
      ".hforge/state/install.json": "{}",
    });
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.phase).toBe("recover");
    expect(plan.actionId).toBe("recover.fix-missing-runtime-index");
  });

  it("next action plan always has valid structure", async () => {
    const root = createWorkspace();
    const plan = await recommendNextAction({ workspaceRoot: root });
    expect(plan.generatedAt).toBeTruthy();
    expect(plan.root).toBeTruthy();
    expect(plan.actionId).toBeTruthy();
    expect(plan.title).toBeTruthy();
    expect(plan.command).toBeTruthy();
    expect(plan.confidence).toBeGreaterThanOrEqual(0);
    expect(plan.confidence).toBeLessThanOrEqual(1);
    expect(typeof plan.safeToAutoApply).toBe("boolean");
  });

  it("safe-auto classification matches safeToAutoApply", async () => {
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
});
