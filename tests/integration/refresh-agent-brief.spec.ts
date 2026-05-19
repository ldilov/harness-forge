import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { refreshWorkspaceRuntime } from "../../src/application/install/refresh-workspace-runtime.js";
import { parseAgentStartBrief } from "../../src/domain/runtime/agent-brief.js";

describe("refresh agent brief integration", () => {
  it("regenerates agent brief artifacts during refresh", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-refresh-agent-brief-"));
    await fs.writeFile(path.join(workspaceRoot, "package.json"), JSON.stringify({ name: "refresh-app" }), "utf8");

    await applyInstall(workspaceRoot, {
      planId: "plan-1",
      selection: {
        targetId: "codex",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: workspaceRoot,
        mode: "apply"
      },
      operations: [],
      warnings: [],
      conflicts: [],
      backupRequirements: [],
      hash: "hash-1",
      validationSummary: []
    });

    await refreshWorkspaceRuntime(workspaceRoot);
    const brief = parseAgentStartBrief(
      JSON.parse(await fs.readFile(path.join(workspaceRoot, ".hforge", "runtime", "agent-brief.json"), "utf8"))
    );

    expect(brief.freshness.status).toBe("current");
    expect(brief.targets.map((target) => target.targetId)).toContain("codex");
  });
});
