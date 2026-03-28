import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";
import { initializeWorkspace } from "../../src/application/install/initialize-workspace.js";

const root = process.cwd();

describe("public cli surface contract", () => {
  it("documents and catalogs the production command families", async () => {
    const [catalog, docsCommands] = await Promise.all([
      loadAgentCommandCatalog(root),
      fs.readFile(path.join(root, "docs", "commands.md"), "utf8")
    ]);

    for (const command of ["hforge", "init", "refresh", "task list", "pack inspect", "review", "export", "shell setup", "shell status"]) {
      expect(catalog.cliCommands.some((entry) => entry.command.includes(command))).toBe(true);
      expect(docsCommands).toContain(command);
    }

    expect(docsCommands).toContain("--dry-run");
    expect(docsCommands).toContain("--setup-profile");
  });

  it("fails invalid pack inspection with a useful error", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-cli-contract-"));
    await initializeWorkspace(workspaceRoot);

    const result = spawnSync(process.execPath, [path.join(root, "dist", "cli", "index.js"), "pack", "inspect", "TASK-404", "--root", workspaceRoot], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Task pack not found");
  });
});
