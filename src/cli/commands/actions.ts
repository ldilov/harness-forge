import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import fs from "node:fs/promises";
import { ActionStore } from "../../infrastructure/sentinel/stores/action-store.js";
import { ApprovalStore } from "../../infrastructure/sentinel/stores/approval-store.js";
import { LedgerStore } from "../../infrastructure/sentinel/stores/ledger-store.js";
import {
  AuthorityLevelSchema,
  type ActionPlan,
  type ActionStatus,
  type AuthorityLevel,
  type RiskLevel,
} from "../../domain/sentinel/action/action-plan.js";
import { generateSentinelId } from "../../shared/ulid.js";
import { nowISO } from "../../shared/timestamps.js";
import { exists, readTextFile } from "../../shared/fs.js";
import {
  SafeExecutor,
  ActionNotFoundError,
} from "../../application/sentinel/safe-executor/executor.js";
import { runRollback } from "../../application/sentinel/rollback-runner/rollback.js";
import { Verifier } from "../../application/sentinel/verifier/verifier.js";
import { buildSandboxEnv } from "../../infrastructure/sentinel/executor/env-sanitizer.js";
import {
  sentinelRunDir,
  sentinelRunDiffPath,
  sentinelRunStderrPath,
  sentinelRunStdoutPath,
  sentinelRunVerificationPath,
  sentinelRunWorktreePath,
} from "../../domain/sentinel/paths.js";

interface ActionsOptions {
  readonly root: string;
  readonly json?: boolean;
  readonly status?: ActionStatus;
  readonly risk?: RiskLevel;
  readonly authority?: AuthorityLevel;
  readonly limit?: string;
}

function applyFilters(plans: readonly ActionPlan[], options: ActionsOptions): readonly ActionPlan[] {
  const limit = options.limit === undefined ? null : Math.max(1, Number.parseInt(options.limit, 10));
  let filtered = plans.filter((plan) => {
    if (options.status !== undefined && plan.status !== options.status) {
      return false;
    }
    if (options.risk !== undefined && plan.risk.level !== options.risk) {
      return false;
    }
    if (options.authority !== undefined && plan.authorityRequired !== options.authority) {
      return false;
    }
    return true;
  });
  filtered = [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  if (limit !== null) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

export function registerActionsCommands(program: Command): void {
  const actions = program.command("actions").description("Sentinel proposed actions");

  actions
    .command("list", { isDefault: true })
    .description("List action plans (most recently updated first)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--status <status>", "filter by status")
    .option("--risk <level>", "filter by risk level")
    .option("--authority <level>", "filter by required authority")
    .option("--limit <n>", "maximum records", "20")
    .action(async (options: ActionsOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const all = await store.listAll();
      const filtered = applyFilters(all, options);
      if (options.json) {
        console.log(toJson({ actions: filtered }));
        return;
      }
      if (filtered.length === 0) {
        console.log("No action plans match. Sentinel proposes actions when signals carry a known intent.");
        return;
      }
      for (const plan of filtered) {
        console.log(`[${plan.status}] ${plan.title}`);
        console.log(
          `    risk=${plan.risk.level} authority=${plan.authorityRequired} steps=${plan.steps.length} id=${plan.id}`,
        );
        console.log(`    reason: ${plan.reason}`);
      }
    });

  actions
    .command("show <id>")
    .description("Show full action plan")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (id: string, options: ActionsOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const plan = await store.findById(id);
      if (plan === null) {
        console.error(`Action '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      if (options.json) {
        console.log(toJson({ action: plan }));
        return;
      }
      console.log(`Action ${plan.id}`);
      console.log(`  status=${plan.status} risk=${plan.risk.level} authority=${plan.authorityRequired}`);
      console.log(`  title: ${plan.title}`);
      console.log(`  reason: ${plan.reason}`);
      console.log(`  source signals: ${plan.sourceSignalIds.join(", ")}`);
      console.log(`  proposed by: ${plan.proposedBy}`);
      console.log(`  steps:`);
      for (const step of plan.steps) {
        console.log(`    - ${step.type}${"command" in step ? `: ${step.command}` : ""}`);
      }
      console.log(`  verification:`);
      for (const check of plan.verification.required) {
        console.log(`    - ${check.type}${"command" in check ? `: ${check.command}` : ""}`);
      }
      if (plan.rollback !== undefined) {
        console.log(`  rollback: ${plan.rollback.strategy}`);
      }
      console.log(`  touched targets: ${plan.risk.touchedTargets.join(", ")}`);
      console.log(`  reasons: ${plan.risk.reasons.join("; ")}`);
      console.log(`  reversible: ${plan.risk.reversible}`);
      console.log(`  approval required: ${plan.risk.requiresHumanApproval}`);
    });

  actions
    .command("reject <id>")
    .description("Reject a proposed action")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--reason <text>", "why the rejection")
    .action(async (id: string, options: { readonly root: string; readonly reason?: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const plan = await store.findById(id);
      if (plan === null) {
        console.error(`Action '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      if (plan.status !== "proposed") {
        console.error(`Action '${id}' is in status '${plan.status}', cannot reject.`);
        process.exitCode = 1;
        return;
      }
      await store.setStatus(id, "rejected", nowISO());
      console.log(`Action ${id} rejected${options.reason === undefined ? "" : ` (${options.reason})`}.`);
    });

  actions
    .command("approve <id>")
    .description("Approve a proposed action with a scoped authority grant")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--authority <level>", "authority level granted (A0..A5)", "A2")
    .option("--expires <duration>", "expire after this duration (e.g. 2h, 7d)")
    .option("--scope <globs>", "comma-separated path scope (default: action's touchedTargets)")
    .action(
      async (
        id: string,
        options: {
          readonly root: string;
          readonly authority: string;
          readonly expires?: string;
          readonly scope?: string;
        },
      ) => {
        const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
        const store = new ActionStore(workspaceRoot);
        const plan = await store.findById(id);
        if (plan === null) {
          console.error(`Action '${id}' not found.`);
          process.exitCode = 1;
          return;
        }
        if (plan.status !== "proposed") {
          console.error(`Action '${id}' is in status '${plan.status}', cannot approve.`);
          process.exitCode = 1;
          return;
        }
        const authority = AuthorityLevelSchema.safeParse(options.authority);
        if (!authority.success) {
          console.error(`Invalid --authority: ${options.authority} (use A0..A5)`);
          process.exitCode = 1;
          return;
        }
        let expiresAt: string | null = null;
        if (options.expires !== undefined) {
          const ms = parseDuration(options.expires);
          if (ms === null) {
            console.error(`Invalid --expires: ${options.expires}`);
            process.exitCode = 1;
            return;
          }
          expiresAt = new Date(Date.now() + ms).toISOString();
        }
        const scope =
          options.scope === undefined
            ? [...plan.risk.touchedTargets]
            : options.scope.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
        const approvals = new ApprovalStore(workspaceRoot);
        const entry = await approvals.append({
          id: generateSentinelId("approval"),
          actionPlanId: plan.id,
          approvedBy: process.env.USER ?? process.env.USERNAME ?? "operator",
          approvedAt: nowISO(),
          authorityGranted: authority.data,
          expiresAt,
          scope,
          revokedAt: null,
        });
        await store.setStatus(plan.id, "approved", nowISO());
        console.log(
          `Approved ${plan.id} with authority ${entry.authorityGranted}${expiresAt === null ? " (never expires)" : ` until ${expiresAt}`}.`,
        );
        console.log(`Approval id: ${entry.id}`);
      },
    );

  actions
    .command("run <id>")
    .description("Run an approved action in an isolated git worktree")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--dry-run", "do not execute steps; print what would run", false)
    .action(
      async (
        id: string,
        options: { readonly root: string; readonly json?: boolean; readonly dryRun?: boolean },
      ) => {
        const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
        const store = new ActionStore(workspaceRoot);
        const plan = await store.findById(id);
        if (plan === null) {
          console.error(`Action '${id}' not found.`);
          process.exitCode = 1;
          return;
        }
        if (options.dryRun === true) {
          if (options.json) {
            console.log(toJson({ action: plan, dryRun: true }));
            return;
          }
          console.log(`[dry-run] would run action ${plan.id} in an isolated worktree`);
          for (let i = 0; i < plan.steps.length; i += 1) {
            const step = plan.steps[i]!;
            if (step.type === "run_command") {
              console.log(`  ${i + 1}. run_command: ${step.command}`);
            } else {
              console.log(`  ${i + 1}. ${step.type}`);
            }
          }
          return;
        }
        try {
          const executor = new SafeExecutor(true);
          const outcome = await executor.run({ workspaceRoot, actionId: id });
          if (options.json) {
            console.log(toJson({ outcome }));
          } else {
            renderRunOutcome(outcome);
          }
          if (outcome.status === "rejected") {
            process.exitCode = 2;
          } else if (outcome.status === "failed") {
            process.exitCode = 4;
          }
        } catch (error: unknown) {
          if (error instanceof ActionNotFoundError) {
            console.error(error.message);
            process.exitCode = 1;
            return;
          }
          console.error(error instanceof Error ? error.message : String(error));
          process.exitCode = 4;
        }
      },
    );

  actions
    .command("verify <id>")
    .description("Re-run the verification spec for a previously-executed action")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (id: string, options: { readonly root: string; readonly json?: boolean }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const plan = await store.findById(id);
      if (plan === null) {
        console.error(`Action '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      const worktreePath = sentinelRunWorktreePath(workspaceRoot, id);
      if (!(await exists(worktreePath))) {
        console.error(`Run worktree for '${id}' is missing; run the action first.`);
        process.exitCode = 1;
        return;
      }
      const env = buildSandboxEnv({ actionId: id, worktreePath });
      const verifier = new Verifier();
      const report = await verifier.verify({
        action: plan,
        worktreePath,
        runDir: sentinelRunDir(workspaceRoot, id),
        env,
        timeoutMs: 120_000,
      });
      await fs.writeFile(
        sentinelRunVerificationPath(workspaceRoot, id),
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8",
      );
      if (options.json) {
        console.log(toJson({ verification: report }));
        return;
      }
      console.log(`Verification: ${report.status}`);
      for (const check of report.checks) {
        console.log(`  - [${check.status}] ${check.type}${check.command === undefined ? "" : `: ${check.command}`}`);
        if (check.summary !== undefined) {
          console.log(`        ${check.summary}`);
        }
      }
      if (report.status !== "passed") {
        process.exitCode = 4;
      }
    });

  actions
    .command("rollback <id>")
    .description("Apply the action's RollbackSpec (delete_worktree + manual supported)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (id: string, options: { readonly root: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const plan = await store.findById(id);
      if (plan === null) {
        console.error(`Action '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      const ledger = LedgerStore.forRun(workspaceRoot, id);
      const result = await runRollback({ action: plan, workspaceRoot, ledger });
      if (result.status === "passed") {
        await store.setStatus(id, "reverted", nowISO());
      }
      console.log(`Rollback (${result.strategy}): ${result.status} — ${result.summary}`);
      if (result.status === "failed") {
        process.exitCode = 4;
      }
    });

  actions
    .command("diff <id>")
    .description("Show the captured patch.diff for a run")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (id: string, options: { readonly root: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const filePath = sentinelRunDiffPath(workspaceRoot, id);
      if (!(await exists(filePath))) {
        console.error(`No diff captured for '${id}' (run the action first).`);
        process.exitCode = 1;
        return;
      }
      const raw = await readTextFile(filePath);
      if (raw.trim().length === 0) {
        console.log("(no changes captured)");
        return;
      }
      console.log(raw);
    });

  actions
    .command("logs <id>")
    .description("Show captured stdout/stderr for a run")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--stream <which>", "stdout | stderr | both", "both")
    .option("--step <n>", "limit to a specific step index")
    .action(
      async (
        id: string,
        options: { readonly root: string; readonly stream: string; readonly step?: string },
      ) => {
        const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
        const stream = options.stream.toLowerCase();
        const stepLimit = options.step === undefined ? null : Number.parseInt(options.step, 10);
        let printed = 0;
        for (let i = 0; i < 100; i += 1) {
          if (stepLimit !== null && i !== stepLimit) {
            continue;
          }
          if (stream === "stdout" || stream === "both") {
            const file = sentinelRunStdoutPath(workspaceRoot, id, i);
            if (await exists(file)) {
              console.log(`--- step ${i} stdout ---`);
              console.log((await readTextFile(file)).trimEnd());
              printed += 1;
            }
          }
          if (stream === "stderr" || stream === "both") {
            const file = sentinelRunStderrPath(workspaceRoot, id, i);
            if (await exists(file)) {
              console.log(`--- step ${i} stderr ---`);
              console.log((await readTextFile(file)).trimEnd());
              printed += 1;
            }
          }
        }
        if (printed === 0) {
          console.log("(no logs captured)");
        }
      },
    );

  actions
    .command("ledger")
    .description("Stream the side-effect ledger")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--action <id>", "filter by action id")
    .option("--json", "json output", false)
    .action(
      async (options: {
        readonly root: string;
        readonly action?: string;
        readonly json?: boolean;
      }) => {
        const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
        const ledger = LedgerStore.global(workspaceRoot);
        const all = await ledger.readAll();
        const filtered = options.action === undefined
          ? all
          : all.filter((entry) => entry.actionPlanId === options.action);
        if (options.json) {
          console.log(toJson({ entries: filtered }));
          return;
        }
        if (filtered.length === 0) {
          console.log("No ledger entries.");
          return;
        }
        for (const entry of filtered) {
          console.log(`${entry.createdAt} ${entry.kind} ${entry.target}`);
          console.log(`  action=${entry.actionPlanId} reversible=${entry.reversible}`);
        }
      },
    );
}

function renderRunOutcome(outcome: import("../../application/sentinel/safe-executor/executor.js").ExecuteOutcome): void {
  console.log(`Action ${outcome.action.id}: ${outcome.status}`);
  console.log(`  ${outcome.summary}`);
  if (outcome.branch !== null) {
    console.log(`  branch: ${outcome.branch}`);
  }
  if (outcome.worktreePath.length > 0) {
    console.log(`  worktree: ${outcome.worktreePath}`);
  }
  for (let i = 0; i < outcome.stepResults.length; i += 1) {
    const step = outcome.stepResults[i]!;
    console.log(`  step ${i + 1}: [${step.status}] ${step.summary}`);
  }
  if (outcome.verification !== null) {
    console.log(`  verification: ${outcome.verification.status}`);
    for (const check of outcome.verification.checks) {
      console.log(`    - [${check.status}] ${check.type}${check.summary === undefined ? "" : `: ${check.summary}`}`);
    }
  }
  if (outcome.status === "rejected") {
    for (const reason of outcome.decision.reasons) {
      console.log(`  policy: ${reason}`);
    }
  }
}

function parseDuration(value: string): number | null {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());
  if (match === null) {
    return null;
  }
  const amount = Number.parseInt(match[1]!, 10);
  switch (match[2]!.toLowerCase()) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
    default:
      return null;
  }
}
