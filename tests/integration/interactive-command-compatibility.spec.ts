import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("interactive command compatibility", () => {
  it("skips prompts when direct init flags are complete", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-direct-init-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "interactive-cli", "clean-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    const result = spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--agent", "codex", "--yes", "--json"], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("Harness Forge Setup");
    expect(result.stdout).toContain("\"status\": \"success\"");
    expect(result.stdout).toContain("\"appliedTargets\"");
    expect(result.stdout).toContain("hforge.cmd");
    expect(result.stdout).toContain("shell setup");
  });

  it("supports prompt-free direct dry-run previews", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-direct-preview-"));
    const result = spawnSync(
      process.execPath,
      [cliPath, "init", "--root", workspaceRoot, "--agent", "codex", "--dry-run", "--json"],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("\"status\": \"preview\"");
    expect(result.stdout).toContain("\"Preview only. No files were written.\"");
  });
});
