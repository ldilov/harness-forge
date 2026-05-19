import fs from "node:fs/promises";
import os from "node:os";
import { ensureDir, writeTextFile } from "../../../shared/fs.js";
import { nowISO } from "../../../shared/timestamps.js";
import { shortSentinelId } from "../../../shared/ulid.js";
import { CheckpointStore } from "./checkpoint.js";
import type { AbortRegistry } from "../runtime/abort-registry.js";
import {
  type ActionPlan,
} from "../../../domain/sentinel/action/action-plan.js";
import { ActionStore } from "../../../infrastructure/sentinel/stores/action-store.js";
import { ApprovalStore } from "../../../infrastructure/sentinel/stores/approval-store.js";
import { ActiveProfileStore } from "../../../infrastructure/sentinel/stores/profile-store.js";
import { LedgerStore } from "../../../infrastructure/sentinel/stores/ledger-store.js";
import { CadenceLedger } from "../budget/cadence-ledger.js";
import { loadBudgetSnapshot } from "../budget/budget-ledger.js";
import {
  loadDeniedCommands,
  loadDeniedPaths,
} from "../policy-gate/policy-loader.js";
import { decideAction, type PolicyDecision } from "../policy-gate/gate.js";
import { builtInProfile } from "../../../domain/sentinel/policy/profile.js";
import {
  captureDiff,
  createWorktree,
  removeWorktree,
} from "../../../infrastructure/sentinel/executor/worktree.js";
import { buildSandboxEnv, sandboxHomePath } from "../../../infrastructure/sentinel/executor/env-sanitizer.js";
import { handleStep, type StepHandlerResult } from "./step-handlers.js";
import { Verifier } from "../verifier/verifier.js";
import {
  sentinelRunDiffPath,
  sentinelRunDir,
  sentinelRunPlanPath,
  sentinelRunVerificationPath,
  sentinelRunWorktreePath,
} from "../../../domain/sentinel/paths.js";
import type { VerificationReport } from "../verifier/verifier.js";

export interface ExecuteRequest {
  readonly workspaceRoot: string;
  readonly actionId: string;
  readonly executionEnabled?: boolean;
  readonly abortRegistry?: AbortRegistry;
}

export type ExecuteOutcomeStatus = "completed" | "failed" | "rejected" | "verifying";

export interface ExecuteOutcome {
  readonly status: ExecuteOutcomeStatus;
  readonly action: ActionPlan;
  readonly decision: PolicyDecision;
  readonly stepResults: readonly StepHandlerResult[];
  readonly verification: VerificationReport | null;
  readonly worktreePath: string;
  readonly branch: string | null;
  readonly diff: string;
  readonly summary: string;
}

export class ActionRunRefusedError extends Error {
  constructor(readonly decision: PolicyDecision) {
    super(`policy gate blocked the action: ${decision.reasons.join("; ")}`);
    this.name = "ActionRunRefusedError";
  }
}

export class ActionNotFoundError extends Error {
  constructor(readonly actionId: string) {
    super(`action '${actionId}' not found`);
    this.name = "ActionNotFoundError";
  }
}

export class SafeExecutor {
  constructor(private readonly executionEnabled: boolean = true) {}

  async run(request: ExecuteRequest): Promise<ExecuteOutcome> {
    const enabled = request.executionEnabled ?? this.executionEnabled;
    const actionStore = new ActionStore(request.workspaceRoot);
    const action = await actionStore.findById(request.actionId);
    if (action === null) {
      throw new ActionNotFoundError(request.actionId);
    }
    const profileStore = new ActiveProfileStore(request.workspaceRoot);
    const active = await profileStore.read();
    const profile = builtInProfile(active.name);
    const approvalStore = new ApprovalStore(request.workspaceRoot);
    const approvals = await approvalStore.forAction(action.id);
    const snapshot = await loadBudgetSnapshot(request.workspaceRoot);
    const deniedPaths = await loadDeniedPaths(request.workspaceRoot);
    const deniedCommands = await loadDeniedCommands(request.workspaceRoot);
    const decision = decideAction({
      action,
      profile: { ...profile, defaultLevel: active.defaultLevel },
      approvals,
      deniedPaths,
      deniedCommands,
      panicStop: snapshot.cadence.panicStop,
      executionEnabled: enabled,
    });
    if (decision.decision === "block") {
      await actionStore.setStatus(action.id, "rejected", nowISO());
      return this.buildBlockedOutcome(action, decision);
    }

    const runDir = sentinelRunDir(request.workspaceRoot, action.id);
    await ensureDir(runDir);
    await writeTextFile(sentinelRunPlanPath(request.workspaceRoot, action.id), `${JSON.stringify(action, null, 2)}\n`);

    const worktreePath = sentinelRunWorktreePath(request.workspaceRoot, action.id);
    const ledger = LedgerStore.forRun(request.workspaceRoot, action.id);
    const cadence = new CadenceLedger(request.workspaceRoot);
    const branchPrefix = `sentinel/${shortSentinelId(action.id)}`;
    const checkpoint = new CheckpointStore(request.workspaceRoot, action.id);
    const hostname = os.hostname();
    await checkpoint.write({
      actionId: action.id,
      phase: "policy-check",
      stepIndex: null,
      pid: process.pid,
      hostname,
      branch: null,
    });

    let branch: string | null = null;
    await checkpoint.write({
      actionId: action.id,
      phase: "worktree-create",
      stepIndex: null,
      pid: process.pid,
      hostname,
      branch: null,
    });
    try {
      const handle = await createWorktree({
        workspaceRoot: request.workspaceRoot,
        branchPrefix,
        destination: worktreePath,
      });
      branch = handle.branch;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await actionStore.setStatus(action.id, "failed", nowISO());
      await checkpoint.write({
        actionId: action.id,
        phase: "failed",
        stepIndex: null,
        pid: process.pid,
        hostname,
        branch: null,
      });
      return {
        status: "failed",
        action,
        decision,
        stepResults: [],
        verification: null,
        worktreePath,
        branch: null,
        diff: "",
        summary: `worktree creation failed: ${message}`,
      };
    }

    await ensureDir(sandboxHomePath(worktreePath));
    const env = buildSandboxEnv({ actionId: action.id, worktreePath });
    const abortHandle = request.abortRegistry === undefined
      ? null
      : request.abortRegistry.register(action.id, "safe-executor.run");
    const abortController = abortHandle === null ? new AbortController() : abortHandle.controller;
    const stepResults: StepHandlerResult[] = [];
    let runningFailed = false;
    let runningAborted = false;

    await actionStore.setStatus(action.id, "running", nowISO());
    await checkpoint.write({
      actionId: action.id,
      phase: "running",
      stepIndex: 0,
      pid: process.pid,
      hostname,
      branch,
    });
    await cadence.record({
      kind: "action.executed",
      subject: action.id,
      detail: { branch },
    });

    for (let i = 0; i < action.steps.length; i += 1) {
      if (abortController.signal.aborted) {
        runningAborted = true;
        break;
      }
      await checkpoint.write({
        actionId: action.id,
        phase: "running",
        stepIndex: i,
        pid: process.pid,
        hostname,
        branch,
      });
      const result = await handleStep(action.steps[i]!, {
        workspaceRoot: request.workspaceRoot,
        worktreePath,
        action,
        env,
        ledger,
        signal: abortController.signal,
        stepIndex: i,
      });
      stepResults.push(result);
      if (result.status === "failed") {
        runningFailed = true;
        break;
      }
    }
    if (request.abortRegistry !== undefined) {
      request.abortRegistry.unregister(action.id);
    }
    if (abortController.signal.aborted) {
      runningAborted = true;
    }

    const diff = await captureDiff(request.workspaceRoot, worktreePath);
    await fs.writeFile(sentinelRunDiffPath(request.workspaceRoot, action.id), diff, "utf8");

    if (runningAborted) {
      await actionStore.setStatus(action.id, "failed", nowISO());
      await checkpoint.write({
        actionId: action.id,
        phase: "failed",
        stepIndex: null,
        pid: process.pid,
        hostname,
        branch,
      });
      return {
        status: "failed",
        action,
        decision,
        stepResults,
        verification: null,
        worktreePath,
        branch,
        diff,
        summary: "run aborted (panic stop or operator cancel); worktree preserved for inspection",
      };
    }

    if (runningFailed) {
      await actionStore.setStatus(action.id, "failed", nowISO());
      await checkpoint.write({
        actionId: action.id,
        phase: "failed",
        stepIndex: null,
        pid: process.pid,
        hostname,
        branch,
      });
      return {
        status: "failed",
        action,
        decision,
        stepResults,
        verification: null,
        worktreePath,
        branch,
        diff,
        summary: "one or more steps failed; worktree preserved for inspection",
      };
    }

    await actionStore.setStatus(action.id, "verifying", nowISO());
    await checkpoint.write({
      actionId: action.id,
      phase: "verifying",
      stepIndex: null,
      pid: process.pid,
      hostname,
      branch,
    });
    const verifier = new Verifier();
    const verification = await verifier.verify({
      action,
      worktreePath,
      runDir,
      env,
      timeoutMs: 120_000,
    });
    await fs.writeFile(
      sentinelRunVerificationPath(request.workspaceRoot, action.id),
      `${JSON.stringify(verification, null, 2)}\n`,
      "utf8",
    );

    if (verification.status === "passed") {
      await actionStore.setStatus(action.id, "completed", nowISO());
      await checkpoint.write({
        actionId: action.id,
        phase: "completed",
        stepIndex: null,
        pid: process.pid,
        hostname,
        branch,
      });
      return {
        status: "completed",
        action,
        decision,
        stepResults,
        verification,
        worktreePath,
        branch,
        diff,
        summary: "all steps passed and verification passed",
      };
    }

    await actionStore.setStatus(action.id, "failed", nowISO());
    await checkpoint.write({
      actionId: action.id,
      phase: "failed",
      stepIndex: null,
      pid: process.pid,
      hostname,
      branch,
    });
    return {
      status: "failed",
      action,
      decision,
      stepResults,
      verification,
      worktreePath,
      branch,
      diff,
      summary: `verification ${verification.status}; worktree preserved at ${worktreePath}`,
    };
  }

  private buildBlockedOutcome(action: ActionPlan, decision: PolicyDecision): ExecuteOutcome {
    return {
      status: "rejected",
      action,
      decision,
      stepResults: [],
      verification: null,
      worktreePath: "",
      branch: null,
      diff: "",
      summary: `policy gate blocked: ${decision.reasons.join("; ")}`,
    };
  }
}

export async function discardWorktree(workspaceRoot: string, actionId: string, branch?: string): Promise<void> {
  const worktreePath = sentinelRunWorktreePath(workspaceRoot, actionId);
  await removeWorktree({
    workspaceRoot,
    worktreePath,
    branch,
    deleteBranch: branch !== undefined,
  });
}

