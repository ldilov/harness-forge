import { describe, expect, it } from "vitest";

import { buildRecursiveRootFrame } from "../../src/application/recursive/build-root-frame.js";

describe("recursive root frame unit", () => {
  it("builds a compact frame from session, memory, and policy posture", () => {
    const frame = buildRecursiveRootFrame({
      session: {
        sessionId: "RS-001",
        status: "running",
        createdAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z",
        budgetPolicy: {
          policyId: "default-recursive-policy",
          maxDepth: 2,
          maxIterations: 6,
          maxSubcalls: 12,
          maxCodeCells: 2,
          maxBatchWidth: 4,
          maxDurationMs: 1000,
          maxToolReads: 10,
          allowWritesToScratchOnly: true,
          allowNetwork: false,
          sandboxMode: "disabled",
          isolationLevel: "read-only-inspection",
          allowedWriteScopes: ["scratch"],
          stopConditions: ["budget exhausted"]
        },
        handles: [],
        tools: [],
        promotionState: "draft-only",
        iterationCount: 1,
        subcallCount: 0,
        codeCellCount: 0,
        checkpointCount: 0
      },
      policy: {
        policyId: "default-recursive-policy",
        sessionId: "RS-001",
        isolationLevel: "read-only-inspection",
        policyLevel: "typed-rlm",
        allowStructuredRun: true,
        allowTypedActions: true,
        allowCodeCells: false,
        allowMetaOps: true,
        allowPromotions: true,
        allowedInputs: ["file"],
        restrictedBehaviors: [],
        allowedOperationFamilies: ["read-handle"],
        allowedLanguages: [],
        allowedWriteScopes: ["scratch"],
        networkPosture: "offline",
        stopConditions: ["budget exhausted"],
        budgetSummary: {
          maxDurationMs: 1000,
          maxRuns: 2,
          maxIterations: 6,
          maxSubcalls: 12,
          maxCodeCells: 0,
          notes: "unit"
        },
        createdAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z"
      },
      memory: {
        memoryId: "MEM-001",
        sessionId: "RS-001",
        currentObjective: "Inspect billing retries",
        currentPlan: ["Read repo map"],
        filesInFocus: [],
        confirmedFacts: ["repo map inspected"],
        inferredFacts: [],
        blockers: [],
        openQuestions: [],
        recentFailedAttempts: [],
        scratchRefs: [],
        nextStep: "Finalize",
        updatedAt: "2026-04-01T10:00:00.000Z"
      },
      summary: {
        sessionId: "RS-001",
        outcome: "partial",
        summary: "In progress",
        promotedArtifacts: [],
        outstandingGaps: [],
        budgetReport: {
          policyId: "default-recursive-policy",
          limitsHit: []
        },
        followUp: "Finalize",
        generatedAt: "2026-04-01T10:00:00.000Z"
      },
      checkpoints: []
    });

    expect(frame.allowedOperations).toEqual(["read-handle"]);
  });

});
