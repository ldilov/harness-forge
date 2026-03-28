import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("interactive project hub", () => {
  it("routes no-argument startup into the project hub when runtime already exists", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-interactive-hub-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "interactive-cli", "clean-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--agent", "codex", "--yes"], {
      cwd: root,
      encoding: "utf8"
    });

    const result = spawnSync(process.execPath, [cliPath], {
      cwd: workspaceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        HFORGE_FORCE_TTY: "1",
        HFORGE_INTERACTIVE_SCRIPT: JSON.stringify({ hubAction: "status" })
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Harness Forge Project Hub");
    expect(result.stdout).toContain("Installed targets");
  });
});
