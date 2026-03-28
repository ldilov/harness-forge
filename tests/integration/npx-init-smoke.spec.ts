import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("npx-style init smoke", () => {
  it("starts cleanly and initializes runtime files in a temp repo", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-npx-smoke-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "production-readiness", "basic-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    const help = spawnSync(process.execPath, [cliPath, "--help"], { cwd: root, encoding: "utf8" });
    const init = spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });
    const status = spawnSync(process.execPath, [cliPath, "status", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });

    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Usage: hforge");
    expect(init.status).toBe(0);
    expect(init.stdout).toContain("\"runtimeIndexPath\"");
    expect(status.status).toBe(0);
    expect(status.stdout).toContain("\"runtimeSchemaVersion\": 3");
  });
});
