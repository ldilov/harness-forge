import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";
import { parseRecursiveRootExecutionFrame } from "../../src/domain/recursive/iteration.js";

describe("recursive iteration contract", () => {
  it("keeps typed RLM iteration inspection commands promoted under recursive", () => {
    const program = new Command().name("hforge");
    registerRecursiveCommands(program);

    const recursive = program.commands.find((command) => command.name() === "recursive");
    expect(recursive?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["execute", "iterations", "inspect-iteration"])
    );
  });

  it("accepts compact root execution frames", () => {
    const frame = parseRecursiveRootExecutionFrame({
      frameId: "FRAME-001",
      sessionId: "RS-001",
      objectiveSummary: "Inspect the billing retry flow",
      budgetView: {
        policyId: "default-recursive-policy",
        remainingIterations: 5,
        remainingSubcalls: 12,
        remainingCodeCells: 2,
        stopConditions: ["budget exhausted"]
      },
      capabilitySummary: "typed-rlm",
      handleInventory: ["repo-map:Repo map"],
      checkpointSummary: [],
      confirmedFacts: ["repo map inspected"],
      blockers: [],
      allowedOperations: ["read-handle", "update-memory"],
      finalizationContract: ["operator finalized output"]
    });

    expect(frame.budgetView.remainingIterations).toBe(5);
  });

});
