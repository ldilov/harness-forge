import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("interactive onboarding flow", () => {
  it("runs the no-argument onboarding flow in a scripted interactive terminal", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-interactive-onboarding-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "interactive-cli", "clean-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    const result = spawnSync(process.execPath, [cliPath], {
      cwd: workspaceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        HFORGE_FORCE_TTY: "1",
        HFORGE_INTERACTIVE_SCRIPT: JSON.stringify({
          folderMode: "current-directory",
          targets: ["codex"],
          setupProfile: "recommended",
          modules: ["working-memory", "task-pack-support", "export-support"],
          dryRun: false,
          confirmAction: "confirm"
        })
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Harness Forge Setup");
    expect(result.stdout).toContain("Review before write");
    expect(result.stdout).toContain("Harness Forge setup complete");
    expect(result.stdout).toContain("shell setup");
    await expect(fs.readFile(path.join(workspaceRoot, ".hforge", "runtime", "index.json"), "utf8")).resolves.toContain("\"runtimeSchemaVersion\"");
    await expect(fs.readFile(path.join(workspaceRoot, ".hforge", "agent-manifest.json"), "utf8")).resolves.toContain("\"resolutionOrder\"");
    await expect(fs.readFile(path.join(workspaceRoot, ".hforge", "generated", "bin", "hforge.cmd"), "utf8")).resolves.toContain(
      "npx @harness-forge/cli"
    );
  });
});
