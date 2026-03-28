import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { loadInstallState } from "../../src/domain/state/install-state.js";
import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";

const packageRoot = process.cwd();

describe("agent command catalog integration", () => {
  it("exposes bootstrap, target inspection, and self-service repo commands to agents", async () => {
    const catalog = await loadAgentCommandCatalog(packageRoot);

    expect(catalog.cliCommands.some((entry) => entry.command.includes("bootstrap"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("refresh"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("task list"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("pack inspect"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("target inspect"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("cartograph"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("parallel plan"))).toBe(true);
    expect(catalog.npmScripts["validate:release"]).toBeTruthy();
    expect(catalog.npmScripts["validate:local"]).toBeTruthy();
    expect(catalog.npmScripts["smoke:cli"]).toBeTruthy();
    expect(catalog.npmScripts["commands:catalog"]).toBeTruthy();
    expect(catalog.npmScripts["recommend:current"]).toBeTruthy();
    expect(catalog.npmScripts["target:codex"]).toBeTruthy();
    expect(catalog.npmScripts["observability:summary"]).toBeTruthy();
  });

  it("merges installed targets across repeated installs and writes a workspace command catalog", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-command-catalog-"));

    await applyInstall(tempRoot, {
      planId: "plan-1",
      selection: {
        targetId: "codex",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: tempRoot,
        mode: "apply"
      },
      operations: [],
      warnings: [],
      conflicts: [],
      backupRequirements: [],
      hash: "hash-1",
      validationSummary: []
    });

    await applyInstall(tempRoot, {
      planId: "plan-2",
      selection: {
        targetId: "claude-code",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: tempRoot,
        mode: "apply"
      },
      operations: [],
      warnings: [],
      conflicts: [],
      backupRequirements: [],
      hash: "hash-2",
      validationSummary: []
    });

    const state = await loadInstallState(tempRoot);
    expect(state?.installedTargets).toEqual(expect.arrayContaining(["codex", "claude-code"]));

    const catalogPath = path.join(tempRoot, ".hforge", "generated", "agent-command-catalog.json");
    const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
    expect(catalog.npmScripts["validate:release"]).toBeTruthy();
    expect(catalog.npmScripts["validate:local"]).toBeTruthy();
    expect(catalog.cliCommands.some((entry: { command: string }) => entry.command.includes("commands --json"))).toBe(true);

    const manifestPath = path.join(tempRoot, ".hforge", "agent-manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    expect(manifest.entrypoints.canonicalInstructionFile).toBe("AGENTS.md");
    expect(manifest.entrypoints.commandCatalog).toBe(".hforge/generated/agent-command-catalog.json");
    expect(manifest.installedTargets.map((entry: { targetId: string }) => entry.targetId)).toEqual(
      expect.arrayContaining(["codex", "claude-code"])
    );
    expect(
      manifest.surfaces.some(
        (surface: { path: string; treatAsProductCode: boolean }) =>
          surface.path === ".hforge/library/skills" && surface.treatAsProductCode === false
      )
    ).toBe(true);
  });
});
