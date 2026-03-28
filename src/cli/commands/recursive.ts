import path from "node:path";
import { Command } from "commander";

import { compactRecursiveSession } from "../../application/recursive/compact-session.js";
import { finalizeRecursiveSession } from "../../application/recursive/finalize-session.js";
import { planRecursiveTask } from "../../application/recursive/plan-task.js";
import { loadRecursiveSession, loadRecursiveSessionSummary } from "../../infrastructure/recursive/session-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";

function formatPlanResult(result: Awaited<ReturnType<typeof planRecursiveTask>>): string {
  const lines = [
    `Session: ${result.session.sessionId}`,
    `Task: ${result.session.taskId ?? "unlinked"}`,
    `Status: ${result.session.status}`,
    `Budget: ${result.session.budgetPolicy.policyId}`,
    `Handles: ${result.session.handles.length}`,
    `Promotion: ${result.session.promotionState}`,
    `Session file: ${result.artifactPaths.sessionPath}`,
    `Summary file: ${result.artifactPaths.summaryPath}`
  ];

  if (result.linkagePath) {
    lines.push(`Task linkage: ${result.linkagePath}`);
  }

  return lines.join("\n");
}

export function registerRecursiveCommands(program: Command): void {
  const recursive = program
    .command("recursive")
    .description("Optional recursive runtime commands for difficult, task-scoped investigations.");

  recursive
    .command("plan")
    .argument("<objective...>", "root objective for the recursive session")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--task-id <taskId>", "existing task runtime id to link")
    .option("--json", "json output", false)
    .action(async (objectiveParts: string[], options) => {
      const workspaceRoot = path.resolve(options.root);
      const objective = objectiveParts.join(" ").trim();
      const result = await planRecursiveTask({
        workspaceRoot,
        taskId: options.taskId,
        rootObjective: objective
      });

      console.log(
        options.json
          ? toJson({
              mode: "plan",
              sessionId: result.session.sessionId,
              taskId: result.session.taskId,
              status: result.session.status,
              budgetPolicyId: result.session.budgetPolicy.policyId,
              handleCount: result.session.handles.length,
              handles: result.session.handles,
              promotionState: result.session.promotionState,
              artifactPaths: result.artifactPaths,
              linkagePath: result.linkagePath
            })
          : formatPlanResult(result)
      );
    });

  recursive
    .command("inspect")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const session = await loadRecursiveSession(workspaceRoot, sessionId);
      const summary = await loadRecursiveSessionSummary(workspaceRoot, sessionId);
      if (!session) {
        throw new Error(`Recursive session not found: ${sessionId}`);
      }

      const payload = {
        mode: "inspect",
        session,
        summary,
        handleCount: session.handles.length,
        promotionState: session.promotionState
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("adr")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      const payload = {
        mode: "adr",
        sessionId,
        status: "reserved-for-later-phase"
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("resume")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      const payload = {
        mode: "resume",
        sessionId,
        status: "reserved-for-later-phase"
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("finalize")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const payload = await finalizeRecursiveSession(workspaceRoot, sessionId);
      console.log(options.json ? toJson({ mode: "finalize", ...payload }) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("compact")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const payload = await compactRecursiveSession(workspaceRoot, sessionId);
      console.log(options.json ? toJson({ mode: "compact", ...payload }) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("repl")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      const payload = {
        mode: "repl",
        sessionId,
        status: "reserved-for-later-phase"
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });
}
