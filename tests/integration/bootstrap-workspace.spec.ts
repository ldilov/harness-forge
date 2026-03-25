import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { planBootstrapWorkspace } from "../../src/application/install/bootstrap-workspace.js";
import { discoverWorkspaceTargets } from "../../src/application/install/discover-workspace-targets.js";

const packageRoot = process.cwd();

describe("bootstrap workspace integration", () => {
  it("detects supported agent runtimes from the current repo layout", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-bootstrap-detect-"));
    await fs.writeFile(path.join(tempRoot, "AGENTS.md"), "# agent guidance\n", "utf8");
    await fs.writeFile(path.join(tempRoot, "CLAUDE.md"), "# claude guidance\n", "utf8");
    await fs.writeFile(
      path.join(tempRoot, "package.json"),
      JSON.stringify({ name: "fixture", dependencies: { react: "^19.0.0", next: "^15.0.0" } }, null, 2),
      "utf8"
    );

    const discovered = await discoverWorkspaceTargets(tempRoot);

    expect(discovered.map((item) => item.targetId)).toEqual(expect.arrayContaining(["codex", "claude-code"]));
  });

  it("plans bootstrap installs for discovered targets with recommended bundle inputs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-bootstrap-plan-"));
    await fs.writeFile(path.join(tempRoot, "AGENTS.md"), "# agent guidance\n", "utf8");
    await fs.mkdir(path.join(tempRoot, "src"), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, "package.json"),
      JSON.stringify({ name: "fixture", dependencies: { react: "^19.0.0", vite: "^6.0.0" } }, null, 2),
      "utf8"
    );
    await fs.writeFile(path.join(tempRoot, "src", "main.tsx"), "export const App = () => null;\n", "utf8");

    const result = await planBootstrapWorkspace({
      packageRoot,
      workspaceRoot: tempRoot,
      mode: "dry-run"
    });

    expect(result.targetIds).toContain("codex");
    expect(result.recommendedBundleIds).toEqual(
      expect.arrayContaining(["lang:typescript", "framework:react", "framework:vite", "capability:workflow-quality"])
    );
    expect(result.plans.length).toBeGreaterThan(0);
    expect(result.plans[0]?.selection.rootPath).toBe(tempRoot);
  });
});
