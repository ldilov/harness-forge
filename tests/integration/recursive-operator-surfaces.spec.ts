import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { Command } from "commander";

import { registerRecursiveCommands } from "../../src/cli/commands/recursive.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

async function runRecursiveCommand(args: string[]): Promise<string> {
  const program = new Command().name("hforge");
  registerRecursiveCommands(program);
  const logs: string[] = [];
  const original = console.log;
  console.log = (...values: unknown[]) => {
    logs.push(values.map((value) => String(value)).join(" "));
  };

  try {
    await program.parseAsync(["node", "hforge", ...args]);
  } finally {
    console.log = original;
  }

  return logs.join("\n");
}

describe("recursive operator surfaces integration", () => {
  it("reports session id, budget, handles, and promotion state through the CLI", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-cli-"));
    tempRoots.push(workspaceRoot);

    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: [], highRiskPaths: [], criticalPaths: [] }, null, 2),
      "utf8"
    );

    const planOutput = await runRecursiveCommand([
      "recursive",
      "plan",
      "--root",
      workspaceRoot,
      "--task-id",
      "TASK-REC-CLI",
      "--json",
      "Investigate",
      "the",
      "billing",
      "retry",
      "flow"
    ]);
    const planned = JSON.parse(planOutput) as {
      sessionId: string;
      taskId: string;
      budgetPolicyId: string;
      handleCount: number;
      promotionState: string;
    };

    expect(planned.taskId).toBe("TASK-REC-CLI");
    expect(planned.budgetPolicyId).toBe("default-recursive-policy");
    expect(planned.handleCount).toBeGreaterThanOrEqual(1);
    expect(planned.promotionState).toBe("draft-only");

    const inspectOutput = await runRecursiveCommand([
      "recursive",
      "inspect",
      planned.sessionId,
      "--root",
      workspaceRoot,
      "--json"
    ]);
    const inspected = JSON.parse(inspectOutput) as {
      session: { sessionId: string; status: string };
      promotionState: string;
      handleCount: number;
    };

    expect(inspected.session.sessionId).toBe(planned.sessionId);
    expect(inspected.session.status).toBe("draft");
    expect(inspected.handleCount).toBeGreaterThanOrEqual(1);
    expect(inspected.promotionState).toBe("draft-only");
  });
});
