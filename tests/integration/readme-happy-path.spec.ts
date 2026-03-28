import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

describe("README happy path integration", () => {
  it("keeps the documented init, review, and export flow executable", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-readme-smoke-"));
    await fs.copyFile(
      path.join(root, "tests", "fixtures", "production-readiness", "basic-repo", "package.json"),
      path.join(workspaceRoot, "package.json")
    );

    const init = spawnSync(process.execPath, [cliPath, "init", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });
    const review = spawnSync(process.execPath, [cliPath, "review", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });
    const exportResult = spawnSync(process.execPath, [cliPath, "export", "--root", workspaceRoot, "--json"], { cwd: root, encoding: "utf8" });

    expect(init.status).toBe(0);
    expect(review.status).toBe(0);
    expect(review.stdout).toContain("\"doctorStatus\"");
    expect(exportResult.status).toBe(0);
    expect(exportResult.stdout).toContain("\"runtimeIndex\"");
  });
});
