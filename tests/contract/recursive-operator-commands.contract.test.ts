import fs from "node:fs/promises";
import path from "node:path";

import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";
import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";

const root = process.cwd();

describe("recursive operator commands contract", () => {
  it("registers the planned recursive command family", () => {
    const program = new Command().name("hforge");
    registerRecursiveCommands(program);

    const recursive = program.commands.find((command) => command.name() === "recursive");
    expect(recursive).toBeTruthy();
    expect(recursive?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["plan", "capabilities", "run", "runs", "inspect-run", "inspect", "adr", "resume", "finalize", "compact", "repl"])
    );
  });

  it("documents recursive operator commands in both docs and the agent catalog", async () => {
    const docsCommands = await fs.readFile(path.join(root, "docs", "commands.md"), "utf8");
    const catalog = await loadAgentCommandCatalog(root);

    expect(docsCommands).toContain("recursive plan");
    expect(docsCommands).toContain("recursive capabilities");
    expect(docsCommands).toContain("recursive inspect");
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive plan"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive capabilities"))).toBe(true);
    expect(catalog.cliCommands.some((entry) => entry.command.includes("recursive inspect"))).toBe(true);
  });
});
