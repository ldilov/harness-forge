import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SafeExecutor } from "../../../src/application/sentinel/safe-executor/executor.js";
import { runRollback } from "../../../src/application/sentinel/rollback-runner/rollback.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { ApprovalStore } from "../../../src/infrastructure/sentinel/stores/approval-store.js";
import { ActiveProfileStore } from "../../../src/infrastructure/sentinel/stores/profile-store.js";
import { LedgerStore } from "../../../src/infrastructure/sentinel/stores/ledger-store.js";
import {
  ActionPlanSchema,
  type ActionPlan,
} from "../../../src/domain/sentinel/action/action-plan.js";
import {
  sentinelRunDiffPath,
  sentinelRunStdoutPath,
  sentinelRunVerificationPath,
  sentinelRunWorktreePath,
} from "../../../src/domain/sentinel/paths.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";
import { exists } from "../../../src/shared/fs.js";

let workspace: string;
const isWindows = process.platform === "win32";

async function git(cwd: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: "ignore", windowsHide: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(" ")} -> ${code}`))));
    child.on("error", reject);
  });
}

function makePlan(opts: {
  readonly id?: string;
  readonly command: string;
  readonly verifyCommand: string;
  readonly authority?: ActionPlan["authorityRequired"];
}): ActionPlan {
  const now = nowISO();
  return ActionPlanSchema.parse({
    id: opts.id ?? "act_run",
    title: "Run probe",
    reason: "smoke",
    sourceSignalIds: ["sig_x"],
    proposedBy: "user",
    authorityRequired: opts.authority ?? "A2",
    status: "approved",
    dryRun: false,
    risk: { level: "low", reasons: [], touchedTargets: [".hforge/**"], reversible: true, requiresHumanApproval: true },
    steps: [{ type: "run_command", command: opts.command, timeoutMs: 10_000 }],
    verification: { required: [{ type: "command", command: opts.verifyCommand, timeoutMs: 10_000 }] },
    rollback: { strategy: "delete_worktree" },
    createdAt: now,
    updatedAt: now,
  });
}

async function seedWorkspace(): Promise<void> {
  await git(workspace, ["init", "-q", "-b", "main"]);
  await git(workspace, ["config", "user.email", "test@example.com"]);
  await git(workspace, ["config", "user.name", "Test"]);
  await fs.writeFile(path.join(workspace, "README.md"), "hi\n", "utf8");
  await git(workspace, ["add", "README.md"]);
  await git(workspace, ["commit", "-q", "-m", "init"]);
}

async function approveAction(plan: ActionPlan): Promise<void> {
  const approvals = new ApprovalStore(workspace);
  await approvals.append({
    id: generateSentinelId("approval"),
    actionPlanId: plan.id,
    approvedBy: "tester",
    approvedAt: nowISO(),
    authorityGranted: plan.authorityRequired,
    expiresAt: null,
    scope: [".hforge/**"],
    revokedAt: null,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-exec-"));
  await seedWorkspace();
  const profile = new ActiveProfileStore(workspace);
  await profile.write({
    name: "assisted",
    defaultLevel: "A2",
    selectedAt: nowISO(),
    selectedBy: "test",
  });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("SafeExecutor.run (integration)", () => {
  it("runs a passing approved action end-to-end and lands status=completed", async () => {
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const plan = makePlan({ command: okCmd, verifyCommand: okCmd });
    await new ActionStore(workspace).upsert(plan);
    await approveAction(plan);

    const executor = new SafeExecutor(true);
    const outcome = await executor.run({ workspaceRoot: workspace, actionId: plan.id });

    expect(outcome.status).toBe("completed");
    expect(outcome.verification?.status).toBe("passed");
    expect(outcome.branch).toMatch(/^sentinel\//);
    expect(await exists(sentinelRunWorktreePath(workspace, plan.id))).toBe(true);
    expect(await exists(sentinelRunStdoutPath(workspace, plan.id, 0))).toBe(true);
    expect(await exists(sentinelRunVerificationPath(workspace, plan.id))).toBe(true);
    expect(await exists(sentinelRunDiffPath(workspace, plan.id))).toBe(true);

    const stored = await new ActionStore(workspace).findById(plan.id);
    expect(stored?.status).toBe("completed");
  });

  it("rejects without an approval when the cautious profile would gate it", async () => {
    const profile = new ActiveProfileStore(workspace);
    await profile.write({ name: "cautious", defaultLevel: "A1", selectedAt: nowISO(), selectedBy: "test" });
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const plan = makePlan({ command: okCmd, verifyCommand: okCmd });
    await new ActionStore(workspace).upsert(plan);

    const executor = new SafeExecutor(true);
    const outcome = await executor.run({ workspaceRoot: workspace, actionId: plan.id });

    expect(outcome.status).toBe("rejected");
    expect(outcome.decision.decision).toBe("block");
    expect(await exists(sentinelRunWorktreePath(workspace, plan.id))).toBe(false);
    const stored = await new ActionStore(workspace).findById(plan.id);
    expect(stored?.status).toBe("rejected");
  });

  it("preserves the worktree on verification failure (status=failed)", async () => {
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const fail = isWindows ? 'cmd /c "exit 1"' : 'node -e "process.exit(1)"';
    const plan = makePlan({ command: okCmd, verifyCommand: fail, id: "act_failverify" });
    await new ActionStore(workspace).upsert(plan);
    await approveAction(plan);

    const executor = new SafeExecutor(true);
    const outcome = await executor.run({ workspaceRoot: workspace, actionId: plan.id });

    expect(outcome.status).toBe("failed");
    expect(outcome.verification?.status).toBe("failed");
    expect(await exists(sentinelRunWorktreePath(workspace, plan.id))).toBe(true);

    const stored = await new ActionStore(workspace).findById(plan.id);
    expect(stored?.status).toBe("failed");
  });

  it("rollback strategy=delete_worktree removes the worktree and flips status to reverted", async () => {
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const plan = makePlan({ command: okCmd, verifyCommand: okCmd, id: "act_rollback" });
    await new ActionStore(workspace).upsert(plan);
    await approveAction(plan);

    const executor = new SafeExecutor(true);
    const outcome = await executor.run({ workspaceRoot: workspace, actionId: plan.id });
    expect(outcome.status).toBe("completed");

    const ledger = LedgerStore.forRun(workspace, plan.id);
    const result = await runRollback({ action: plan, workspaceRoot: workspace, ledger, branch: outcome.branch ?? undefined });
    expect(result.status).toBe("passed");
    expect(result.strategy).toBe("delete_worktree");
    expect(await exists(sentinelRunWorktreePath(workspace, plan.id))).toBe(false);
  });

  it("creates the sandbox HOME directory before launching steps", async () => {
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const plan = makePlan({ command: okCmd, verifyCommand: okCmd, id: "act_sandbox_home" });
    await new ActionStore(workspace).upsert(plan);
    await approveAction(plan);

    const executor = new SafeExecutor(true);
    await executor.run({ workspaceRoot: workspace, actionId: plan.id });

    const sandboxHome = path.join(sentinelRunWorktreePath(workspace, plan.id), ".sentinel-home");
    const stat = await fs.stat(sandboxHome);
    expect(stat.isDirectory()).toBe(true);
  });

  it("emits side-effect ledger entries for command_execute and worktree lifecycle", async () => {
    const okCmd = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const plan = makePlan({ command: okCmd, verifyCommand: okCmd, id: "act_ledger" });
    await new ActionStore(workspace).upsert(plan);
    await approveAction(plan);

    const executor = new SafeExecutor(true);
    await executor.run({ workspaceRoot: workspace, actionId: plan.id });

    const ledger = LedgerStore.forRun(workspace, plan.id);
    const entries = await ledger.readForRun();
    const kinds = entries.map((entry) => entry.kind);
    expect(kinds).toContain("command_execute");
  });
});
