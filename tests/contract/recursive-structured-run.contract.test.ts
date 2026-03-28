import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";
import { recursiveStructuredRunSchema } from "../../src/domain/recursive/structured-run.js";

describe("recursive structured run contract", () => {
  it("keeps structured-run command entrypoints available under the recursive command family", () => {
    const program = new Command().name("hforge");
    registerRecursiveCommands(program);

    const recursive = program.commands.find((command) => command.name() === "recursive");
    expect(recursive?.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining(["run", "runs", "inspect-run"])
    );
  });

  it("accepts run metadata with requested behaviors and durable references", () => {
    expect(
      recursiveStructuredRunSchema.parse({
        runId: "RUN-001",
        sessionId: "RS-001",
        submissionMode: "file",
        sourceRef: "tests/fixtures/recursive-structured-analysis/runs/sample-snippet.mjs",
        status: "success",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        policyRef: ".hforge/runtime/recursive/sessions/RS-001/execution-policy.json",
        resultRef: ".hforge/runtime/recursive/sessions/RS-001/runs/RUN-001/result.json",
        summary: "Structured recursive analysis completed successfully.",
        warningCount: 0,
        requestedBehaviors: ["read-runtime"]
      }).requestedBehaviors
    ).toEqual(["read-runtime"]);
  });
});
