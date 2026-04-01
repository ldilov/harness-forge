import fs from "node:fs/promises";

import type { RecursiveAction, RecursiveCodeCellLanguage } from "../../domain/recursive/action-bundle.js";
import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveCodeCell, RecursiveCodeCellResult } from "../../domain/recursive/code-cell.js";
import { ValidationError } from "../../shared/index.js";
import { persistRecursiveCodeCell } from "../../infrastructure/recursive/cell-store.js";
import { runNodeCell } from "../../infrastructure/recursive/sandbox/node-cell-runner.js";
import { runPythonCell } from "../../infrastructure/recursive/sandbox/python-cell-runner.js";
import { resolveRecursiveCodeCellPaths, toRecursiveArtifactRef } from "../../infrastructure/recursive/session-store.js";

export interface ExecuteCodeCellInput {
  workspaceRoot: string;
  sessionId: string;
  iterationId: string;
  action: Extract<RecursiveAction, { kind: "run-code-cell" }>;
  policy: RecursiveExecutionPolicy;
}

function resolveCellExtension(languageId: RecursiveCodeCellLanguage): string {
  switch (languageId) {
    case "javascript":
      return "mjs";
    case "typescript":
      return "mjs";
    case "python":
      return "py";
  }
}

export async function executeRecursiveCodeCell(input: ExecuteCodeCellInput): Promise<{
  cell: RecursiveCodeCell;
  result: RecursiveCodeCellResult;
  artifactRefs: string[];
}> {
  if (!input.policy.allowCodeCells) {
    throw new ValidationError(`Policy ${input.policy.policyId} does not allow recursive code cells.`);
  }
  if (!input.policy.allowedLanguages.includes(input.action.args.languageId)) {
    throw new ValidationError(
      `Policy ${input.policy.policyId} does not allow ${input.action.args.languageId} code cells.`
    );
  }

  const timestamp = new Date().toISOString();
  const cellId = `CELL-${Date.now()}`;
  const cellPaths = resolveRecursiveCodeCellPaths(input.workspaceRoot, input.sessionId, cellId);
  const sourceRef = toRecursiveArtifactRef(input.workspaceRoot, cellPaths.sourcePath);
  const stdoutRef = toRecursiveArtifactRef(input.workspaceRoot, cellPaths.stdoutPath);
  const stderrRef = toRecursiveArtifactRef(input.workspaceRoot, cellPaths.stderrPath);
  const resultRef = toRecursiveArtifactRef(input.workspaceRoot, cellPaths.resultPath);
  const cell: RecursiveCodeCell = {
    cellId,
    sessionId: input.sessionId,
    iterationId: input.iterationId,
    languageId: input.action.args.languageId,
    inputRefs: input.action.args.inputRefs,
    expectedOutputs: input.action.args.expectedOutputs,
    sandboxPosture: {
      sandboxMode: input.policy.isolationLevel,
      networkPosture: input.policy.networkPosture,
      timeoutMs: Math.min(input.policy.budgetSummary.maxDurationMs, 10_000),
      writeScope: "cell-artifacts-only"
    },
    status: "running",
    title: input.action.args.title,
    sourceRef,
    stdoutRef,
    stderrRef,
    resultRef,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const extension = resolveCellExtension(input.action.args.languageId);
  const execSourcePath = `${cellPaths.cellDir}/exec.${extension}`;
  await fs.mkdir(cellPaths.cellDir, { recursive: true });
  await Promise.all([
    fs.writeFile(cellPaths.sourcePath, input.action.args.source, "utf8"),
    fs.writeFile(execSourcePath, input.action.args.source, "utf8")
  ]);

  let stdout = "";
  let stderr = "";
  let verdict: RecursiveCodeCellResult["verdict"] = "completed";
  let summary = `${input.action.args.languageId} cell completed.`;
  const diagnostics: string[] = [];

  try {
    if (input.action.args.languageId === "python") {
      ({ stdout, stderr } = await runPythonCell({
        scriptPath: execSourcePath,
        timeoutMs: cell.sandboxPosture.timeoutMs
      }));
    } else {
      ({ stdout, stderr } = await runNodeCell({
        scriptPath: execSourcePath,
        timeoutMs: cell.sandboxPosture.timeoutMs
      }));
    }
  } catch (error) {
    verdict = "failed";
    summary = "Code cell failed.";
    diagnostics.push(error instanceof Error ? error.message : String(error));
  }

  const artifactRefs = [sourceRef, stdoutRef, stderrRef, resultRef];
  const result: RecursiveCodeCellResult = {
    cellId,
    verdict,
    summary,
    outputRefs: artifactRefs,
    diagnostics: stderr ? diagnostics.concat(stderr.trim()) : diagnostics,
    completedAt: new Date().toISOString()
  };
  const completedCell: RecursiveCodeCell = {
    ...cell,
    status: verdict === "completed" ? "completed" : "failed",
    sourceRef,
    updatedAt: result.completedAt
  };
  await persistRecursiveCodeCell(
    input.workspaceRoot,
    completedCell,
    result,
    input.action.args.source,
    stdout,
    stderr
  );
  return { cell: completedCell, result, artifactRefs };
}
