import type { RecursiveActionBundle } from "../../domain/recursive/action-bundle.js";
import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveIteration, RecursiveIterationStatus, RecursiveRootExecutionFrame } from "../../domain/recursive/iteration.js";
import type { RecursiveWorkingMemory } from "../../domain/recursive/memory.js";
import type { RecursiveFinalOutput } from "../../domain/recursive/final-output.js";
import { ValidationError } from "../../shared/index.js";
import { createRecursiveCheckpoint } from "./checkpoint-session.js";
import { executeRecursiveCodeCell } from "./execute-code-cell.js";
import { proposeRecursiveMetaOp } from "./propose-meta-op.js";
import { proposeRecursivePromotion } from "./propose-promotion.js";
import { spawnRecursiveSubcall } from "./spawn-subcall.js";

export interface ExecuteActionBundleInput {
  workspaceRoot: string;
  bundle: RecursiveActionBundle;
  frame: RecursiveRootExecutionFrame;
  memory: RecursiveWorkingMemory;
  policy: RecursiveExecutionPolicy;
  handles: Array<{ handleId: string; targetRef: string }>;
  sequenceNumber: number;
}

export interface ExecuteActionBundleOutput {
  iteration: RecursiveIteration;
  memory: RecursiveWorkingMemory;
  diagnostics: string[];
  artifactsProduced: string[];
  finalOutput?: RecursiveFinalOutput;
  counts: {
    subcalls: number;
    codeCells: number;
    checkpoints: number;
  };
}

function ensureActionAllowed(policy: RecursiveExecutionPolicy, kind: string): void {
  if (!policy.allowTypedActions) {
    throw new ValidationError(`Policy ${policy.policyId} does not allow typed recursive actions.`);
  }
  if (!policy.allowedOperationFamilies.includes(kind)) {
    throw new ValidationError(`Policy ${policy.policyId} does not allow recursive action "${kind}".`);
  }
}

function applyMemoryUpdate(memory: RecursiveWorkingMemory, patch: Record<string, unknown>): RecursiveWorkingMemory {
  return {
    ...memory,
    confirmedFacts: Array.isArray(patch.confirmedFacts)
      ? [...new Set([...memory.confirmedFacts, ...(patch.confirmedFacts as string[])])]
      : memory.confirmedFacts,
    inferredFacts: Array.isArray(patch.inferredFacts)
      ? [...new Set([...memory.inferredFacts, ...(patch.inferredFacts as string[])])]
      : memory.inferredFacts,
    openQuestions: Array.isArray(patch.openQuestions)
      ? [...new Set([...memory.openQuestions, ...(patch.openQuestions as string[])])]
      : memory.openQuestions,
    blockers: Array.isArray(patch.blockers)
      ? [...new Set([...memory.blockers, ...(patch.blockers as string[])])]
      : memory.blockers,
    filesInFocus: Array.isArray(patch.filesInFocus)
      ? [...new Set([...memory.filesInFocus, ...(patch.filesInFocus as string[])])]
      : memory.filesInFocus,
    currentPlan: Array.isArray(patch.currentPlan) ? (patch.currentPlan as string[]) : memory.currentPlan,
    nextStep: typeof patch.nextStep === "string" ? patch.nextStep : memory.nextStep,
    lastBestResult: typeof patch.lastBestResult === "string" ? patch.lastBestResult : memory.lastBestResult,
    updatedAt: new Date().toISOString()
  };
}

function summarizeStatus(diagnostics: string[], artifactsProduced: string[]): RecursiveIterationStatus {
  if (diagnostics.length > 0 && artifactsProduced.length === 0) {
    return "blocked";
  }
  if (diagnostics.length > 0) {
    return "partial";
  }
  return "success";
}

export async function executeActionBundle(input: ExecuteActionBundleInput): Promise<ExecuteActionBundleOutput> {
  const diagnostics: string[] = [];
  const artifactsProduced: string[] = [];
  let memory = input.memory;
  let finalOutput: RecursiveFinalOutput | undefined;
  const counts = {
    subcalls: 0,
    codeCells: 0,
    checkpoints: 0
  };

  for (const action of input.bundle.actions) {
    ensureActionAllowed(input.policy, action.kind);

    switch (action.kind) {
      case "read-handle": {
        const handle = input.handles.find((entry) => entry.handleId === action.args.handleId);
        if (!handle) {
          diagnostics.push(`Unknown handle requested: ${action.args.handleId}`);
          break;
        }
        artifactsProduced.push(handle.targetRef);
        break;
      }
      case "update-memory": {
        memory = applyMemoryUpdate(memory, action.args);
        break;
      }
      case "checkpoint": {
        const { artifactRef } = await createRecursiveCheckpoint({
          workspaceRoot: input.workspaceRoot,
          sessionId: input.bundle.sessionId,
          iterationId: input.bundle.iterationId,
          summary: action.args.summary,
          reason: action.args.reason,
          evidenceRefs: action.args.evidenceRefs
        });
        counts.checkpoints += 1;
        artifactsProduced.push(artifactRef);
        break;
      }
      case "spawn-subcall": {
        const { artifactRef } = await spawnRecursiveSubcall({
          workspaceRoot: input.workspaceRoot,
          sessionId: input.bundle.sessionId,
          iterationId: input.bundle.iterationId,
          action
        });
        counts.subcalls += 1;
        artifactsProduced.push(artifactRef);
        break;
      }
      case "run-code-cell": {
        const { artifactRefs } = await executeRecursiveCodeCell({
          workspaceRoot: input.workspaceRoot,
          sessionId: input.bundle.sessionId,
          iterationId: input.bundle.iterationId,
          action,
          policy: input.policy
        });
        counts.codeCells += 1;
        artifactsProduced.push(...artifactRefs);
        break;
      }
      case "propose-promotion": {
        const { artifactRef } = await proposeRecursivePromotion({
          workspaceRoot: input.workspaceRoot,
          sessionId: input.bundle.sessionId,
          action
        });
        artifactsProduced.push(artifactRef);
        break;
      }
      case "propose-meta-op": {
        const { artifactRef } = await proposeRecursiveMetaOp({
          workspaceRoot: input.workspaceRoot,
          sessionId: input.bundle.sessionId,
          action
        });
        artifactsProduced.push(artifactRef);
        break;
      }
      case "finalize-output": {
        finalOutput = {
          outputId: `OUT-${Date.now()}`,
          sessionId: input.bundle.sessionId,
          status: "finalized",
          summary: action.args.summary,
          sections: action.args.sections.map((section) => ({
            title: section,
            body: section,
            artifactRefs: action.args.artifactRefs
          })),
          artifactRefs: action.args.artifactRefs,
          promotionRefs: [],
          terminalVerdict: action.args.terminalVerdict,
          generatedAt: new Date().toISOString()
        };
        artifactsProduced.push(`final-output:${finalOutput.outputId}`);
        break;
      }
    }
  }

  const completedAt = new Date().toISOString();
  const status = summarizeStatus(diagnostics, artifactsProduced);
  const iteration: RecursiveIteration = {
    iterationId: input.bundle.iterationId,
    sessionId: input.bundle.sessionId,
    sequenceNumber: input.sequenceNumber,
    frameRef: `iterations/${input.bundle.iterationId}/frame.json`,
    actionBundleRef: `iterations/${input.bundle.iterationId}/bundle.json`,
    intent: input.bundle.intent,
    resultSummary: finalOutput?.summary ?? memory.lastBestResult ?? input.bundle.intent,
    status,
    operationsExecuted: input.bundle.actions.map((action) => action.kind),
    diagnostics,
    artifactsProduced,
    startedAt: input.bundle.createdAt,
    completedAt
  };

  return { iteration, memory: { ...memory, updatedAt: completedAt }, diagnostics, artifactsProduced, finalOutput, counts };
}
