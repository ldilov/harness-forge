import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("interactive terminal fallbacks", () => {
  it("fails fast with guidance when no interactive terminal is available", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-interactive-fallback-"));
    const result = spawnSync(process.execPath, [cliPath], {
      cwd: workspaceRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "true",
        HFORGE_FORCE_TTY: "0"
      }
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No interactive terminal detected");
  });

  it("renders onboarding without ANSI color when NO_COLOR is set", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-interactive-nocolor-"));
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
        NO_COLOR: "1",
        HFORGE_TERM_WIDTH: "40",
        HFORGE_INTERACTIVE_SCRIPT: JSON.stringify({
          folderMode: "current-directory",
          targets: ["codex"],
          setupProfile: "quick",
          dryRun: true,
          confirmAction: "confirm"
        })
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("\u001b[");
    expect(result.stdout).toContain("HARNESS FORGE SETUP");
  });
});
