import path from "node:path";
import { Command } from "commander";

import { compactRecursiveSession } from "../../application/recursive/compact-session.js";
import { deriveRecursiveLanguageCapabilities } from "../../application/recursive/derive-language-capabilities.js";
import { finalizeRecursiveSession } from "../../application/recursive/finalize-session.js";
import { planRecursiveTask } from "../../application/recursive/plan-task.js";
import { runStructuredAnalysis } from "../../application/recursive/run-structured-analysis.js";
import {
  listRecursiveRunIds,
  listRecursiveStructuredRuns,
  loadRecursiveLanguageCapabilities,
  loadRecursiveSession,
  loadRecursiveSessionSummary,
  loadRecursiveStructuredRun,
  loadRecursiveStructuredRunResult,
  writeRecursiveLanguageCapabilities
} from "../../infrastructure/recursive/session-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";

async function readFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString("utf8");
}

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
    .command("capabilities")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--refresh", "recompute the canonical capability map before printing", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const existing = await loadRecursiveLanguageCapabilities(workspaceRoot);
      const capabilities =
        options.refresh || !existing ? await deriveRecursiveLanguageCapabilities(workspaceRoot) : existing;
      if (options.refresh || !existing) {
        await writeRecursiveLanguageCapabilities(workspaceRoot, capabilities);
      }
      console.log(options.json ? toJson({ mode: "capabilities", ...capabilities }) : JSON.stringify(capabilities, null, 2));
    });

  recursive
    .command("run")
    .argument("<sessionId>", "recursive session id")
    .option("--file <file>", "structured analysis snippet file")
    .option("--stdin", "read the structured analysis snippet from stdin", false)
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      if (!options.stdin && !options.file) {
        throw new Error('Provide either "--file <file>" or "--stdin" for recursive structured analysis.');
      }
      if (options.stdin && options.file) {
        throw new Error('Use either "--file" or "--stdin", not both, for recursive structured analysis.');
      }
      const result = await runStructuredAnalysis({
        workspaceRoot,
        sessionId,
        submissionMode: options.stdin ? "stdin" : "file",
        sourceFile: options.file ? path.resolve(options.file) : undefined,
        stdinContent: options.stdin ? await readFromStdin() : undefined
      });
      const payload = {
        mode: "run",
        sessionId,
        runId: result.meta.runId,
        submissionMode: result.meta.submissionMode,
        status: result.meta.status,
        summary: result.meta.summary,
        failureReason: result.meta.failureReason,
        result: result.result,
        artifactPaths: result.artifactPaths
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("runs")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [runIds, runs] = await Promise.all([
        listRecursiveRunIds(workspaceRoot, sessionId),
        listRecursiveStructuredRuns(workspaceRoot, sessionId)
      ]);
      const payload = {
        mode: "runs",
        sessionId,
        runCount: runIds.length,
        runIds,
        runs
      };
      console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
    });

  recursive
    .command("inspect-run")
    .argument("<sessionId>", "recursive session id")
    .argument("<runId>", "structured run id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, runId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [meta, result] = await Promise.all([
        loadRecursiveStructuredRun(workspaceRoot, sessionId, runId),
        loadRecursiveStructuredRunResult(workspaceRoot, sessionId, runId)
      ]);
      if (!meta) {
        throw new Error(`Recursive structured run not found: ${sessionId}/${runId}`);
      }
      const payload = {
        mode: "inspect-run",
        sessionId,
        runId,
        meta,
        result
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
