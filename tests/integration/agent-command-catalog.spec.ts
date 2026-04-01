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
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive capabilities"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive inspect-run"))).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-analyze" && entry.docPath === "commands/hforge-analyze.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-status" && entry.docPath === "commands/hforge-status.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-recommend" && entry.docPath === "commands/hforge-recommend.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-cartograph" && entry.docPath === "commands/hforge-cartograph.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-recursive" && entry.docPath === "commands/hforge-recursive.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-recursive-investigate" && entry.docPath === "commands/hforge-recursive-investigate.md")).toBe(true);
    expect(catalog.markdownCommands.some((entry) => entry.trigger === "/hforge-update" && entry.docPath === "commands/hforge-update.md")).toBe(true);
    expect(catalog.executionModes.some((entry) => entry.commandPrefix.includes(".hforge/generated/bin/hforge"))).toBe(true);
    expect(catalog.preferredExecutionOrder[0]).toContain("workspace-launcher");
    expect(catalog.agentSafeCliCommands.some((entry) => entry.id === "status" && entry.variants.some((variant) => variant.command.includes("npx @harness-forge/cli status")))).toBe(true);
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
    expect(catalog.markdownCommands.some((entry: { trigger: string }) => entry.trigger === "/hforge-task")).toBe(true);
    expect(catalog.markdownCommands.some((entry: { trigger: string }) => entry.trigger === "/hforge-recursive")).toBe(true);
    expect(catalog.markdownCommands.some((entry: { trigger: string }) => entry.trigger === "/hforge-recursive-investigate")).toBe(true);
    expect(catalog.cliCommands.some((entry: { command: string }) => entry.command.includes("commands --json"))).toBe(true);
    expect(catalog.agentSafeCliCommands.some((entry: { id: string; variants: Array<{ command: string }> }) => entry.id === "status" && entry.variants.some((variant) => variant.command.includes(".hforge")))).toBe(true);

    const manifestPath = path.join(tempRoot, ".hforge", "agent-manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    expect(manifest.entrypoints.canonicalInstructionFile).toBe("AGENTS.md");
    expect(manifest.entrypoints.commandCatalog).toBe(".hforge/generated/agent-command-catalog.json");
    expect(manifest.entrypoints.markdownCommandRoot).toBe("commands");
    expect(manifest.commandExecution.preferredOrder[0]).toContain("workspace-launcher");
    expect(manifest.commandExecution.markdownCommands.some((entry: { trigger: string }) => entry.trigger === "/hforge-commands")).toBe(true);
    expect(manifest.commandExecution.modes.some((mode: { commandPrefix: string }) => mode.commandPrefix.includes(".hforge"))).toBe(true);
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
