import type { ActionPlan, ActionStep } from "../../../domain/sentinel/action/action-plan.js";
import { runCommand, type CommandRunResult } from "../../../infrastructure/sentinel/executor/command-runner.js";
import {
  sentinelRunStderrPath,
  sentinelRunStdoutPath,
} from "../../../domain/sentinel/paths.js";
import type { LedgerStore } from "../../../infrastructure/sentinel/stores/ledger-store.js";
import { generateSentinelId } from "../../../shared/ulid.js";
import { nowISO } from "../../../shared/timestamps.js";

export interface StepHandlerContext {
  readonly workspaceRoot: string;
  readonly worktreePath: string;
  readonly action: ActionPlan;
  readonly env: NodeJS.ProcessEnv;
  readonly ledger: LedgerStore;
  readonly signal: AbortSignal;
  readonly stepIndex: number;
}

export interface StepHandlerResult {
  readonly status: "passed" | "failed" | "skipped";
  readonly summary: string;
  readonly command?: CommandRunResult;
}

async function handleRunCommand(
  step: Extract<ActionStep, { type: "run_command" }>,
  context: StepHandlerContext,
): Promise<StepHandlerResult> {
  const stdoutPath = sentinelRunStdoutPath(context.workspaceRoot, context.action.id, context.stepIndex);
  const stderrPath = sentinelRunStderrPath(context.workspaceRoot, context.action.id, context.stepIndex);
  if (context.action.dryRun) {
    return {
      status: "skipped",
      summary: `dry-run: would execute '${step.command}' in ${context.worktreePath}`,
    };
  }
  const result = await runCommand({
    command: step.command,
    cwd: context.worktreePath,
    env: context.env,
    stdoutPath,
    stderrPath,
    timeoutMs: step.timeoutMs ?? 60_000,
    signal: context.signal,
  });
  await context.ledger.record({
    id: generateSentinelId("effect"),
    actionPlanId: context.action.id,
    kind: "command_execute",
    target: step.command,
    reversible: false,
    rollbackCommand: null,
    detail: {
      cwd: result.cwd,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      timedOut: result.timedOut,
      aborted: result.aborted,
    },
    createdAt: nowISO(),
  });
  if (result.aborted) {
    return { status: "failed", summary: "command aborted (panic stop or operator cancel)", command: result };
  }
  if (result.timedOut) {
    return { status: "failed", summary: `command timed out after ${result.durationMs}ms`, command: result };
  }
  if (result.exitCode === 0) {
    return { status: "passed", summary: `exit 0 in ${result.durationMs}ms`, command: result };
  }
  return {
    status: "failed",
    summary: `exit ${result.exitCode ?? "null"} in ${result.durationMs}ms`,
    command: result,
  };
}

async function handleNotifyDashboard(): Promise<StepHandlerResult> {
  return {
    status: "passed",
    summary: "dashboard notification deferred to US6 panels",
  };
}

async function handleCreateWorktree(
  context: StepHandlerContext,
): Promise<StepHandlerResult> {
  await context.ledger.record({
    id: generateSentinelId("effect"),
    actionPlanId: context.action.id,
    kind: "worktree_create",
    target: context.worktreePath,
    reversible: true,
    rollbackCommand: `git worktree remove --force ${context.worktreePath}`,
    detail: { },
    createdAt: nowISO(),
  });
  return {
    status: "passed",
    summary: `worktree already created at ${context.worktreePath}`,
  };
}

export class StepNotImplementedError extends Error {
  constructor(readonly stepType: ActionStep["type"]) {
    super(`step type '${stepType}' is not yet implemented in this build (US5 MVP covers run_command, create_worktree, notify_dashboard)`);
    this.name = "StepNotImplementedError";
  }
}

export async function handleStep(
  step: ActionStep,
  context: StepHandlerContext,
): Promise<StepHandlerResult> {
  switch (step.type) {
    case "run_command":
      return handleRunCommand(step, context);
    case "notify_dashboard":
      return handleNotifyDashboard();
    case "create_worktree":
      return handleCreateWorktree(context);
    default:
      throw new StepNotImplementedError(step.type);
  }
}
