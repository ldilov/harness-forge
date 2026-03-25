import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const root = process.cwd();

async function copyPath(tempRoot: string, relativePath: string): Promise<void> {
  const source = path.join(root, relativePath);
  const destination = path.join(tempRoot, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

describe("capability drift integration", () => {
  it("passes validation for the checked-in capability truth surfaces", async () => {
    const scriptPath = path.join(root, "scripts", "ci", "validate-capability-matrix.mjs");
    const { stdout } = await execFileAsync(process.execPath, [scriptPath, "--json"], { cwd: root });
    const result = JSON.parse(stdout);
    expect(result.ok).toBe(true);
  });

  it("fails validation when the generated support document drifts", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-capability-drift-"));
    const requiredPaths = [
      "docs/target-support-matrix.md",
      "manifests/catalog/capability-taxonomy.json",
      "manifests/catalog/harness-capability-matrix.json",
      "manifests/catalog/compatibility-matrix.json",
      "manifests/targets/core.json",
      "schemas/manifests/harness-capability-matrix.schema.json",
      "targets/codex/adapter.json",
      "targets/claude-code/adapter.json",
      "targets/cursor/adapter.json",
      "targets/opencode/adapter.json"
    ];

    await Promise.all(requiredPaths.map((relativePath) => copyPath(tempRoot, relativePath)));
    const driftedDocPath = path.join(tempRoot, "docs", "target-support-matrix.md");
    const content = await fs.readFile(driftedDocPath, "utf8");
    await fs.writeFile(driftedDocPath, content.replace("## Target summary", "## Drifted target summary"), "utf8");

    const scriptPath = path.join(root, "scripts", "ci", "validate-capability-matrix.mjs");
    await expect(execFileAsync(process.execPath, [scriptPath, "--json"], { cwd: tempRoot })).rejects.toMatchObject({
      stderr: expect.stringContaining("out of sync")
    });
  });
});
