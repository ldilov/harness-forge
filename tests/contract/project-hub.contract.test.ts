import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { initializeWorkspace } from "../../src/application/install/initialize-workspace.js";
import { runProjectHub } from "../../src/cli/interactive/project-hub.js";

const originalEnv = { ...process.env };

describe("project hub contract", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("opens status-oriented hub actions for initialized workspaces", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-project-hub-"));
    await initializeWorkspace(workspaceRoot);
    process.env.HFORGE_FORCE_TTY = "1";
    process.env.HFORGE_INTERACTIVE_SCRIPT = JSON.stringify({ hubAction: "status" });

    const summary = await runProjectHub(workspaceRoot);
    expect(summary.operatorMessage).toContain("Installed targets");
    expect(summary.workspaceRoot).toBe(workspaceRoot);
  });
});
