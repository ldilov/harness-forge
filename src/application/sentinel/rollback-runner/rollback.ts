import path from "node:path";
import { exists } from "../../../shared/fs.js";
import {
  removeWorktree,
} from "../../../infrastructure/sentinel/executor/worktree.js";
import type { LedgerStore } from "../../../infrastructure/sentinel/stores/ledger-store.js";
import { generateSentinelId } from "../../../shared/ulid.js";
import { nowISO } from "../../../shared/timestamps.js";
import type { ActionPlan } from "../../../domain/sentinel/action/action-plan.js";
import { sentinelRunWorktreePath } from "../../../domain/sentinel/paths.js";

export interface RollbackRequest {
  readonly action: ActionPlan;
  readonly workspaceRoot: string;
  readonly ledger: LedgerStore;
  readonly branch?: string;
}

export interface RollbackResult {
  readonly status: "passed" | "failed" | "skipped";
  readonly strategy: "delete_worktree" | "reverse_patch" | "restore_snapshot" | "manual" | "none";
  readonly summary: string;
}

export async function runRollback(request: RollbackRequest): Promise<RollbackResult> {
  const spec = request.action.rollback;
  if (spec === undefined) {
    return { status: "skipped", strategy: "none", summary: "no rollback spec on action" };
  }
  switch (spec.strategy) {
    case "delete_worktree": {
      const worktreePath = sentinelRunWorktreePath(request.workspaceRoot, request.action.id);
      if (!(await exists(worktreePath))) {
        return { status: "passed", strategy: spec.strategy, summary: "worktree already removed" };
      }
      try {
        await removeWorktree({
          workspaceRoot: request.workspaceRoot,
          worktreePath,
          branch: request.branch,
          deleteBranch: request.branch !== undefined,
        });
        await request.ledger.record({
          id: generateSentinelId("effect"),
          actionPlanId: request.action.id,
          kind: "worktree_remove",
          target: worktreePath,
          reversible: false,
          rollbackCommand: null,
          detail: { branch: request.branch ?? null },
          createdAt: nowISO(),
        });
        return {
          status: "passed",
          strategy: spec.strategy,
          summary: `removed ${path.relative(request.workspaceRoot, worktreePath)}`,
        };
      } catch (error: unknown) {
        return {
          status: "failed",
          strategy: spec.strategy,
          summary: error instanceof Error ? error.message : String(error),
        };
      }
    }
    case "manual":
      return {
        status: "skipped",
        strategy: spec.strategy,
        summary: spec.notes ?? "manual rollback required (no notes provided)",
      };
    case "reverse_patch":
    case "restore_snapshot":
      return {
        status: "skipped",
        strategy: spec.strategy,
        summary: `rollback strategy '${spec.strategy}' not yet implemented in this build`,
      };
    default:
      return {
        status: "failed",
        strategy: "none",
        summary: `unknown rollback strategy`,
      };
  }
}
