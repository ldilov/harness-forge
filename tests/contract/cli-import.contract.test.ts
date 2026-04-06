import { describe, expect, it } from "vitest";
import { Command } from "commander";

import { registerImportCommands } from "../../src/cli/commands/import-bundle.js";

describe("CLI import command registration", () => {
  it("registers the import command on the program", () => {
    const program = new Command();
    registerImportCommands(program);

    const importCmd = program.commands.find((c) => c.name() === "import");
    expect(importCmd).toBeDefined();
    expect(importCmd!.description()).toContain("Import");
  });

  it("has --dry-run, --insights-only, --root, and --json options", () => {
    const program = new Command();
    registerImportCommands(program);

    const importCmd = program.commands.find((c) => c.name() === "import")!;
    const optionNames = importCmd.options.map((o) => o.long);

    expect(optionNames).toContain("--dry-run");
    expect(optionNames).toContain("--insights-only");
    expect(optionNames).toContain("--root");
    expect(optionNames).toContain("--json");
  });
});
