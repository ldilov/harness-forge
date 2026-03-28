import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import type { RecursiveSession, RecursiveSessionStatus } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import { createDefaultRecursiveBudgetPolicy } from "../../domain/recursive/budget.js";
import type { RecursiveTraceEvent } from "../../domain/recursive/trace-event.js";
import { appendRecursiveTraceEvent } from "../../infrastructure/recursive/trace-logger.js";
import {
  type RecursiveSessionBundle,
  loadRecursiveLanguageCapabilities,
  resolveRecursiveSessionPaths,
  writeRecursiveLanguageCapabilities,
  writeRecursiveSessionBundle
} from "../../infrastructure/recursive/session-store.js";
import { persistTaskRecursiveLinkage } from "../runtime/task-runtime-store.js";
import { buildRecursiveEnvironment } from "./build-environment.js";
import { deriveRecursiveLanguageCapabilities } from "./derive-language-capabilities.js";

export interface PlanRecursiveTaskInput {
  workspaceRoot: string;
  rootObjective: string;
  taskId?: string;
}

export interface PlanRecursiveTaskResult {
  session: RecursiveSession;
  summary: RecursiveSessionSummary;
  artifactPaths: ReturnType<typeof resolveRecursiveSessionPaths>;
  linkagePath?: string;
}

function createSessionId(): string {
  return `RS-${Date.now()}`;
}

function createTaskId(): string {
  return `TASK-REC-${Date.now()}`;
}

function createTraceEvent(sessionId: string, note: string): RecursiveTraceEvent {
  return {
    eventId: `EVT-${Date.now()}`,
    sessionId,
    eventType: "tool-call",
    occurredAt: new Date().toISOString(),
    actor: "operator",
    inputRefs: [],
    outputRefs: [],
    status: "success",
    budgetImpact: {
      iterationsUsed: 0,
      subcallsUsed: 0
    },
    notes: note
  };
}

function createSummary(session: RecursiveSession): RecursiveSessionSummary {
  return {
    sessionId: session.sessionId,
    taskId: session.taskId,
    outcome: "draft",
    summary: `Draft recursive session created for: ${session.rootObjective ?? "recursive investigation"}`,
    promotedArtifacts: [],
    outstandingGaps: ["Evidence gathering has not started yet."],
    budgetReport: {
      policyId: session.budgetPolicy.policyId,
      limitsHit: [],
      notes: "No recursive work has consumed the budget yet."
    },
    followUp: "Inspect the seeded handles, gather evidence, and promote durable findings only when stable.",
    generatedAt: new Date().toISOString()
  };
}

function createExecutionPolicy(session: RecursiveSession): RecursiveExecutionPolicy {
  return {
    policyId: session.budgetPolicy.policyId,
    sessionId: session.sessionId,
    isolationLevel: session.budgetPolicy.isolationLevel,
    allowStructuredRun: true,
    allowedInputs: ["file", "stdin"],
    restrictedBehaviors: ["write-product-code", "network"],
    budgetSummary: {
      maxDurationMs: session.budgetPolicy.maxDurationMs,
      maxRuns: 10,
      notes: "Structured recursive analysis remains session-scoped, read-oriented, and bounded by the recursive budget posture."
    },
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

async function createSessionCapabilities(workspaceRoot: string): Promise<RecursiveLanguageCapabilities> {
  const workspaceCapabilities =
    (await loadRecursiveLanguageCapabilities(workspaceRoot)) ?? (await deriveRecursiveLanguageCapabilities(workspaceRoot));
  await writeRecursiveLanguageCapabilities(workspaceRoot, workspaceCapabilities);
  return {
    ...workspaceCapabilities,
    generatedAt: new Date().toISOString(),
    summary: `Session-scoped recursive structured-analysis capability view for ${workspaceCapabilities.languages.filter((language) => language.adapterStatus !== "unavailable").map((language) => language.displayName).join(", ") || "undetected languages"}.`
  };
}

export async function planRecursiveTask(input: PlanRecursiveTaskInput): Promise<PlanRecursiveTaskResult> {
  const taskId = input.taskId ?? createTaskId();
  const sessionId = createSessionId();
  const timestamp = new Date().toISOString();
  const budgetPolicy = createDefaultRecursiveBudgetPolicy();
  const environment = await buildRecursiveEnvironment({
    workspaceRoot: input.workspaceRoot,
    taskId,
    rootObjective: input.rootObjective
  });

  const session: RecursiveSession = {
    sessionId,
    taskId,
    status: "draft" satisfies RecursiveSessionStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
    rootObjective: input.rootObjective,
    budgetPolicy,
    handles: environment.handles,
    tools: environment.tools,
    promotionState: "draft-only"
  };
  const summary = createSummary(session);
  const bundle: RecursiveSessionBundle = {
    session,
    executionPolicy: createExecutionPolicy(session),
    capabilities: await createSessionCapabilities(input.workspaceRoot),
    memory: {
      sessionId,
      taskId,
      currentObjective: input.rootObjective,
      currentPlan: ["Review the linked runtime handles.", "Decide whether deeper recursive work is warranted."],
      filesInFocus: environment.handles
        .filter((handle) => handle.handleType === "task-artifact" || handle.handleType === "repo-file")
        .map((handle) => handle.targetRef),
      confirmedFacts: [],
      inferredFacts: [],
      blockers: [],
      openQuestions: ["What evidence is still missing before we escalate further?"],
      recentFailedAttempts: [],
      nextStep: "Inspect the linked task and shared-runtime artifacts.",
      lastUpdated: timestamp
    },
    scratch: {
      sessionId,
      updatedAt: timestamp,
      notes: []
    },
    calls: [],
    summary
  };

  const artifactPaths = await writeRecursiveSessionBundle(input.workspaceRoot, bundle);
  const traceEvent = createTraceEvent(sessionId, "Initialized recursive plan session.");
  traceEvent.outputRefs = [artifactPaths.sessionPath, artifactPaths.summaryPath].map((value) => value.replaceAll("\\", "/"));
  await appendRecursiveTraceEvent(artifactPaths.tracePath, traceEvent);

  const linkagePath = await persistTaskRecursiveLinkage(input.workspaceRoot, {
    taskId,
    sessionId,
    linkedAt: timestamp,
    status: session.status,
    promotionState: session.promotionState,
    sessionRef: ".hforge/runtime/recursive/sessions/" + `${sessionId}/session.json`,
    summaryRef: ".hforge/runtime/recursive/sessions/" + `${sessionId}/summary.json`
  });

  return {
    session,
    summary,
    artifactPaths,
    linkagePath
  };
}
