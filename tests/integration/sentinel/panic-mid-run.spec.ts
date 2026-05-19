import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SafeExecutor } from "../../../src/application/sentinel/safe-executor/executor.js";
import { AbortRegistry } from "../../../src/application/sentinel/runtime/abort-registry.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { ApprovalStore } from "../../../src/infrastructure/sentinel/stores/approval-store.js";
import { ActiveProfileStore } from "../../../src/infrastructure/sentinel/stores/profile-store.js";
import {
  ActionPlanSchema,
  type ActionPlan,
} from "../../../src/domain/sentinel/action/action-plan.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";

let workspace: string;
const isWindows = process.platform === "win32";

async function git(cwd: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: "ignore", windowsHide: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(" ")} -> ${code}`))));
    child.on("error", reject);
  });
}

function makeSlowPlan(): ActionPlan {
  const slow = isWindows
    ? 'cmd /c "ping -n 6 127.0.0.1 > NUL"'
    : 'node -e "setTimeout(() => process.exit(0), 5000)"';
  const ok = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
  const now = nowISO();
  return ActionPlanSchema.parse({
    id: "act_slow",
    title: "Slow probe",
    reason: "panic-stop test",
    sourceSignalIds: ["sig_x"],
    proposedBy: "user",
    authorityRequired: "A2",
    status: "approved",
    dryRun: false,
    risk: { level: "low", reasons: [], touchedTargets: [".hforge/**"], reversible: true, requiresHumanApproval: true },
    steps: [{ type: "run_command", command: slow, timeoutMs: 30_000 }],
    verification: { required: [{ type: "command", command: ok, timeoutMs: 5_000 }] },
    rollback: { strategy: "delete_worktree" },
    createdAt: now,
    updatedAt: now,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-panic-"));
  await git(workspace, ["init", "-q", "-b", "main"]);
  await git(workspace, ["config", "user.email", "test@example.com"]);
  await git(workspace, ["config", "user.name", "Test"]);
  await fs.writeFile(path.join(workspace, "README.md"), "hi\n", "utf8");
  await git(workspace, ["add", "README.md"]);
  await git(workspace, ["commit", "-q", "-m", "init"]);
  const profile = new ActiveProfileStore(workspace);
  await profile.write({ name: "assisted", defaultLevel: "A2", selectedAt: nowISO(), selectedBy: "test" });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("Panic-stop mid-run abort path (integration)", () => {
  it("aborts an in-flight run via the AbortRegistry and reports 'run aborted' summary", async () => {
    const plan = makeSlowPlan();
    await new ActionStore(workspace).upsert(plan);
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

    const registry = new AbortRegistry();
    const executor = new SafeExecutor(true);
    const runPromise = executor.run({
      workspaceRoot: workspace,
      actionId: plan.id,
      abortRegistry: registry,
    });
    setTimeout(() => {
      const aborted = registry.abortAll("panic_stop");
      expect(aborted.length).toBeGreaterThan(0);
    }, 250);
    const outcome = await runPromise;

    expect(outcome.status).toBe("failed");
    expect(outcome.summary).toMatch(/aborted|panic/i);
    const stored = await new ActionStore(workspace).findById(plan.id);
    expect(stored?.status).toBe("failed");
  }, 30_000);
});
