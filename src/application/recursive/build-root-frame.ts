import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveRootExecutionFrame } from "../../domain/recursive/iteration.js";
import type { RecursiveWorkingMemory } from "../../domain/recursive/memory.js";
import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import type { RecursiveCheckpoint } from "../../domain/recursive/checkpoint.js";

export interface BuildRootFrameInput {
  session: RecursiveSession;
  policy: RecursiveExecutionPolicy;
  memory: RecursiveWorkingMemory;
  summary: RecursiveSessionSummary;
  checkpoints?: RecursiveCheckpoint[];
}

export function buildRecursiveRootFrame(input: BuildRootFrameInput): RecursiveRootExecutionFrame {
  return {
    frameId: `FRAME-${Date.now()}`,
    sessionId: input.session.sessionId,
    objectiveSummary: input.session.rootObjective ?? input.memory.currentObjective,
    budgetView: {
      policyId: input.policy.policyId,
      remainingIterations: Math.max(input.policy.budgetSummary.maxIterations - input.session.iterationCount, 0),
      remainingSubcalls: Math.max(input.policy.budgetSummary.maxSubcalls - input.session.subcallCount, 0),
      remainingCodeCells: Math.max(input.policy.budgetSummary.maxCodeCells - input.session.codeCellCount, 0),
      stopConditions: input.policy.stopConditions
    },
    capabilitySummary: [
      `level=${input.policy.policyLevel}`,
      `structuredRun=${input.policy.allowStructuredRun}`,
      `typedActions=${input.policy.allowTypedActions}`,
      `codeCells=${input.policy.allowCodeCells}`,
      `writeScopes=${input.policy.allowedWriteScopes.join(",") || "none"}`
    ].join(" | "),
    handleInventory: input.session.handles.map((handle) => `${handle.handleId}:${handle.label}`),
    checkpointSummary: (input.checkpoints ?? []).slice(-3).map((checkpoint) => checkpoint.summary),
    confirmedFacts: input.memory.confirmedFacts.slice(0, 8),
    blockers: input.memory.blockers.slice(0, 8),
    allowedOperations: input.policy.allowedOperationFamilies,
    finalizationContract: input.policy.stopConditions.length > 0 ? input.policy.stopConditions : [input.summary.followUp]
  };
}
