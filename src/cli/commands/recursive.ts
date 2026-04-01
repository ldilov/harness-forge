import path from "node:path";
import { Command } from "commander";

import { compactRecursiveSession } from "../../application/recursive/compact-session.js";
import { deriveRecursiveLanguageCapabilities } from "../../application/recursive/derive-language-capabilities.js";
import { executeRecursiveLanguageModel } from "../../application/recursive/execute-rlm.js";
import { finalizeRecursiveSession } from "../../application/recursive/finalize-session.js";
import { planRecursiveTask } from "../../application/recursive/plan-task.js";
import { replayRecursiveSession } from "../../application/recursive/replay-session.js";
import { runStructuredAnalysis } from "../../application/recursive/run-structured-analysis.js";
import { scoreRecursiveTrajectory } from "../../application/recursive/score-trajectory.js";
import {
  listRecursiveCodeCells,
  listRecursiveIterations,
  listRecursiveMetaOpProposals,
  listRecursivePromotionProposals,
  listRecursiveRunIds,
  listRecursiveScorecards,
  listRecursiveStructuredRuns,
  listRecursiveSubcalls,
  loadRecursiveActionBundle,
  loadRecursiveCodeCell,
  loadRecursiveCodeCellResult,
  loadRecursiveIteration,
  loadRecursiveIterationFrame,
  loadRecursiveLanguageCapabilities,
  loadRecursiveMetaOpProposal,
  loadRecursivePromotionProposal,
  loadRecursiveScorecard,
  loadRecursiveSession,
  loadRecursiveSessionSummary,
  loadRecursiveStructuredRun,
  loadRecursiveStructuredRunResult,
  loadRecursiveSubcall,
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

function printPayload(options: { json?: boolean }, payload: unknown): void {
  console.log(options.json ? toJson(payload) : JSON.stringify(payload, null, 2));
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
      const [session, summary, iterations, subcalls, codeCells, promotions, metaOps, scorecard] = await Promise.all([
        loadRecursiveSession(workspaceRoot, sessionId),
        loadRecursiveSessionSummary(workspaceRoot, sessionId),
        listRecursiveIterations(workspaceRoot, sessionId),
        listRecursiveSubcalls(workspaceRoot, sessionId),
        listRecursiveCodeCells(workspaceRoot, sessionId),
        listRecursivePromotionProposals(workspaceRoot, sessionId),
        listRecursiveMetaOpProposals(workspaceRoot, sessionId),
        loadRecursiveScorecard(workspaceRoot, sessionId)
      ]);
      if (!session) {
        throw new Error(`Recursive session not found: ${sessionId}`);
      }

      printPayload(options, {
        mode: "inspect",
        session,
        summary,
        budgetPolicyId: session.budgetPolicy.policyId,
        promotionState: session.promotionState,
        handleCount: session.handles.length,
        counts: {
          handles: session.handles.length,
          iterations: iterations.length,
          subcalls: subcalls.length,
          codeCells: codeCells.length,
          promotions: promotions.length,
          metaOps: metaOps.length,
          scorecards: scorecard ? 1 : 0
        }
      });
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
      printPayload(options, { mode: "capabilities", ...capabilities });
    });

  recursive
    .command("execute")
    .argument("<sessionId>", "recursive session id")
    .option("--file <file>", "typed action-bundle json file")
    .option("--stdin", "read the typed action bundle from stdin", false)
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      if (!options.stdin && !options.file) {
        throw new Error('Provide either "--file <file>" or "--stdin" for recursive typed execution.');
      }
      if (options.stdin && options.file) {
        throw new Error('Use either "--file" or "--stdin", not both, for recursive typed execution.');
      }
      const result = await executeRecursiveLanguageModel({
        workspaceRoot,
        sessionId,
        sourceFile: options.file ? path.resolve(options.file) : undefined,
        stdinContent: options.stdin ? await readFromStdin() : undefined
      });
      printPayload(options, {
        mode: "execute",
        sessionId,
        bundleId: result.bundle.bundleId,
        iterationId: result.iteration.iterationId,
        status: result.iteration.status,
        resultSummary: result.iteration.resultSummary,
        finalOutput: result.finalOutput,
        artifactPaths: result.artifactPaths
      });
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
      printPayload(options, {
        mode: "run",
        sessionId,
        runId: result.meta.runId,
        submissionMode: result.meta.submissionMode,
        status: result.meta.status,
        summary: result.meta.summary,
        failureReason: result.meta.failureReason,
        result: result.result,
        artifactPaths: result.artifactPaths
      });
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
      printPayload(options, { mode: "runs", sessionId, runCount: runIds.length, runIds, runs });
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
      printPayload(options, { mode: "inspect-run", sessionId, runId, meta, result });
    });

  recursive
    .command("iterations")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const iterations = await listRecursiveIterations(workspaceRoot, sessionId);
      printPayload(options, { mode: "iterations", sessionId, iterations });
    });

  recursive
    .command("inspect-iteration")
    .argument("<sessionId>", "recursive session id")
    .argument("<iterationId>", "iteration id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, iterationId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [iteration, frame, bundle] = await Promise.all([
        loadRecursiveIteration(workspaceRoot, sessionId, iterationId),
        loadRecursiveIterationFrame(workspaceRoot, sessionId, iterationId),
        loadRecursiveActionBundle(workspaceRoot, sessionId, iterationId)
      ]);
      if (!iteration) {
        throw new Error(`Recursive iteration not found: ${sessionId}/${iterationId}`);
      }
      printPayload(options, { mode: "inspect-iteration", sessionId, iterationId, iteration, frame, bundle });
    });

  recursive
    .command("subcalls")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "subcalls", sessionId, subcalls: await listRecursiveSubcalls(workspaceRoot, sessionId) });
    });

  recursive
    .command("inspect-subcall")
    .argument("<sessionId>", "recursive session id")
    .argument("<subcallId>", "subcall id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, subcallId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const subcall = await loadRecursiveSubcall(workspaceRoot, sessionId, subcallId);
      if (!subcall) {
        throw new Error(`Recursive subcall not found: ${sessionId}/${subcallId}`);
      }
      printPayload(options, { mode: "inspect-subcall", sessionId, subcallId, subcall });
    });

  recursive
    .command("cells")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "cells", sessionId, cells: await listRecursiveCodeCells(workspaceRoot, sessionId) });
    });

  recursive
    .command("inspect-cell")
    .argument("<sessionId>", "recursive session id")
    .argument("<cellId>", "code cell id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, cellId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [cell, result] = await Promise.all([
        loadRecursiveCodeCell(workspaceRoot, sessionId, cellId),
        loadRecursiveCodeCellResult(workspaceRoot, sessionId, cellId)
      ]);
      if (!cell) {
        throw new Error(`Recursive code cell not found: ${sessionId}/${cellId}`);
      }
      printPayload(options, { mode: "inspect-cell", sessionId, cellId, cell, result });
    });

  recursive
    .command("promotions")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, {
        mode: "promotions",
        sessionId,
        promotions: await listRecursivePromotionProposals(workspaceRoot, sessionId)
      });
    });

  recursive
    .command("inspect-promotion")
    .argument("<sessionId>", "recursive session id")
    .argument("<promotionId>", "promotion id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, promotionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const promotion = await loadRecursivePromotionProposal(workspaceRoot, sessionId, promotionId);
      if (!promotion) {
        throw new Error(`Recursive promotion not found: ${sessionId}/${promotionId}`);
      }
      printPayload(options, { mode: "inspect-promotion", sessionId, promotionId, promotion });
    });

  recursive
    .command("meta-ops")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "meta-ops", sessionId, metaOps: await listRecursiveMetaOpProposals(workspaceRoot, sessionId) });
    });

  recursive
    .command("inspect-meta-op")
    .argument("<sessionId>", "recursive session id")
    .argument("<metaOpId>", "meta-op id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, metaOpId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const metaOp = await loadRecursiveMetaOpProposal(workspaceRoot, sessionId, metaOpId);
      if (!metaOp) {
        throw new Error(`Recursive meta-op not found: ${sessionId}/${metaOpId}`);
      }
      printPayload(options, { mode: "inspect-meta-op", sessionId, metaOpId, metaOp });
    });

  recursive
    .command("score")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const scorecard = await scoreRecursiveTrajectory(workspaceRoot, sessionId);
      printPayload(options, { mode: "score", sessionId, scorecard });
    });

  recursive
    .command("scorecards")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "scorecards", sessionId, scorecards: await listRecursiveScorecards(workspaceRoot, sessionId) });
    });

  recursive
    .command("replay")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "replay", ...(await replayRecursiveSession(workspaceRoot, sessionId)) });
    });

  recursive
    .command("finalize")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "finalize", ...(await finalizeRecursiveSession(workspaceRoot, sessionId)) });
    });

  recursive
    .command("compact")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (sessionId: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      printPayload(options, { mode: "compact", ...(await compactRecursiveSession(workspaceRoot, sessionId)) });
    });

  recursive
    .command("adr")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      printPayload(options, { mode: "adr", sessionId, status: "reserved-for-later-phase" });
    });

  recursive
    .command("resume")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      printPayload(options, { mode: "resume", sessionId, status: "reserved-for-later-phase" });
    });

  recursive
    .command("repl")
    .argument("<sessionId>", "recursive session id")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((sessionId: string, options) => {
      printPayload(options, { mode: "repl", sessionId, status: "reserved-for-later-phase" });
    });
}
