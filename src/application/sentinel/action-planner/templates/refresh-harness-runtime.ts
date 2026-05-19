import type { Signal } from "../../../../domain/sentinel/signal/signal.js";
import { ActionPlanSchema, type ActionPlan } from "../../../../domain/sentinel/action/action-plan.js";
import { generateSentinelId } from "../../../../shared/ulid.js";
import { nowISO } from "../../../../shared/timestamps.js";

export function buildRefreshHarnessRuntimeAction(signal: Signal): ActionPlan {
  const created = nowISO();
  const plan: ActionPlan = ActionPlanSchema.parse({
    id: generateSentinelId("action"),
    title: "Refresh Harness Forge runtime artifacts",
    reason: `Drift signal '${signal.title}' indicates that generated runtime is out of sync with source files.`,
    sourceSignalIds: [signal.id],
    proposedBy: "monitor",
    authorityRequired: "A2",
    status: "proposed",
    dryRun: false,
    intentTags: ["refresh-harness-runtime", "harness.runtime_write"],
    risk: {
      level: "low",
      reasons: ["only writes under .hforge/", "no external network calls"],
      touchedTargets: [".hforge/runtime/**"],
      reversible: true,
      requiresHumanApproval: true,
    },
    steps: [
      { type: "run_command", command: "hforge refresh --root . --dry-run", timeoutMs: 60_000 },
      { type: "notify_dashboard" },
    ],
    verification: {
      required: [
        { type: "command", command: "hforge doctor --root . --json", timeoutMs: 60_000 },
      ],
    },
    rollback: { strategy: "delete_worktree" },
    createdAt: created,
    updatedAt: created,
  });
  return plan;
}

export const REFRESH_HARNESS_RUNTIME_INTENT = "refresh-harness-runtime";
