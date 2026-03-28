import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("init rerun and recovery integration", () => {
  it("allows reruns and keeps recovery guidance visible", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-rerun-smoke-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "production-readiness", "basic-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    const first = spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });
    const second = spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });
    const guidancePath = path.join(workspaceRoot, ".hforge", "state", "post-install-guidance.txt");

    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    await expect(fs.access(guidancePath)).resolves.toBeUndefined();
    expect(await fs.readFile(guidancePath, "utf8")).toContain("Harness Forge initialization completed");
  });
});
