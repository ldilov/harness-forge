import fs from "node:fs/promises";
import path from "node:path";

import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";
import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";

const root = process.cwd();

describe("recursive capabilities command contract", () => {
  it("registers recursive structured-analysis discovery commands", () => {
    const program = new Command().name("hforge");
    registerRecursiveCommands(program);

    const recursive = program.commands.find((command) => command.name() === "recursive");
    expect(recursive?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["capabilities", "run", "runs", "inspect-run"])
    );
  });

  it("documents recursive structured-analysis commands in docs and the agent catalog", async () => {
    const docsCommands = await fs.readFile(path.join(root, "docs", "commands.md"), "utf8");
    const catalog = await loadAgentCommandCatalog(root);

    expect(docsCommands).toContain("recursive capabilities");
    expect(docsCommands).toContain("recursive inspect-run");
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive capabilities"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive run"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive inspect-run"))).toBe(true);
  });
});
