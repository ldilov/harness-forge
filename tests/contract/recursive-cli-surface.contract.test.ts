import fs from "node:fs/promises";
import path from "node:path";

import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";

const root = process.cwd();

describe("recursive cli surface contract", () => {
  it("promotes the full recursive RLM inspection surface", () => {
    const program = new Command().name("hforge");
    registerRecursiveCommands(program);

    const recursive = program.commands.find((command) => command.name() === "recursive");
    expect(recursive?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining([
        "execute",
        "iterations",
        "inspect-iteration",
        "subcalls",
        "inspect-subcall",
        "cells",
        "inspect-cell",
        "promotions",
        "inspect-promotion",
        "meta-ops",
        "inspect-meta-op",
        "score",
        "scorecards",
        "replay"
      ])
    );
  });

  it("keeps docs and package surfaces aligned with promoted recursive RLM commands", async () => {
    const [docsCommands, commandDoc, packageSurface] = await Promise.all([
      fs.readFile(path.join(root, "docs", "commands.md"), "utf8"),
      fs.readFile(path.join(root, "commands", "hforge-recursive.md"), "utf8"),
      fs.readFile(path.join(root, "manifests", "catalog", "package-surface.json"), "utf8")
    ]);

    expect(docsCommands).toContain("recursive execute");
    expect(docsCommands).toContain("recursive score");
    expect(docsCommands).toContain("recursive replay");
    expect(commandDoc).toContain("typed recursive action bundles");
    expect(packageSurface).toContain("schemas/runtime/recursive-action-bundle.schema.json");
  });

});
