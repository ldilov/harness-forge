import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Verifier } from "../../../src/application/sentinel/verifier/verifier.js";
import {
  ActionPlanSchema,
  type ActionPlan,
  type VerificationCheck,
} from "../../../src/domain/sentinel/action/action-plan.js";

let workspace: string;
const isWindows = process.platform === "win32";

async function git(cwd: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: "ignore", windowsHide: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(" ")} -> ${code}`))));
    child.on("error", reject);
  });
}

function makePlan(checks: readonly VerificationCheck[]): ActionPlan {
  const now = new Date().toISOString();
  return ActionPlanSchema.parse({
    id: "act_v",
    title: "verify-test",
    reason: "test",
    sourceSignalIds: ["sig_x"],
    proposedBy: "user",
    authorityRequired: "A2",
    status: "running",
    dryRun: false,
    risk: { level: "low", reasons: [], touchedTargets: [], reversible: true, requiresHumanApproval: false },
    steps: [{ type: "run_command", command: "noop" }],
    verification: { required: checks },
    createdAt: now,
    updatedAt: now,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-verify-"));
  await git(workspace, ["init", "-q", "-b", "main"]);
  await git(workspace, ["config", "user.email", "test@example.com"]);
  await git(workspace, ["config", "user.name", "Test"]);
  await fs.writeFile(path.join(workspace, "README.md"), "hi\n", "utf8");
  await git(workspace, ["add", "README.md"]);
  await git(workspace, ["commit", "-q", "-m", "init"]);
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("Verifier", () => {
  it("passes when a command verification check exits 0", async () => {
    const ok = isWindows ? 'cmd /c "exit 0"' : 'node -e "process.exit(0)"';
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "command", command: ok, timeoutMs: 5_000 }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.status).toBe("passed");
    expect(report.checks[0]?.status).toBe("passed");
  });

  it("fails when a command verification check exits non-zero", async () => {
    const fail = isWindows ? 'cmd /c "exit 9"' : 'node -e "process.exit(9)"';
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "command", command: fail, timeoutMs: 5_000 }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.status).toBe("failed");
    expect(report.checks[0]?.status).toBe("failed");
  });

  it("file_exists passes when the file is present", async () => {
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "file_exists", path: "README.md" }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("passed");
  });

  it("file_exists fails when the file is absent", async () => {
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "file_exists", path: "ghost.md" }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("failed");
  });

  it("no_diff_outside passes when only allowed paths are changed", async () => {
    await fs.writeFile(path.join(workspace, ".hforge.test"), "x\n", "utf8");
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "no_diff_outside", allowedPaths: [".hforge.test"] }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("passed");
  });

  it("no_diff_outside fails when an unexpected file is touched", async () => {
    await fs.writeFile(path.join(workspace, "src.ts"), "x\n", "utf8");
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "no_diff_outside", allowedPaths: [".hforge/**"] }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("failed");
  });

  it("schema_valid returns skipped (parses JSON but does not yet run ajv)", async () => {
    await fs.writeFile(path.join(workspace, "config.json"), '{"name":"x"}\n', "utf8");
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "schema_valid", path: "config.json", schemaRef: "schemas/x.json" }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("skipped");
    expect(report.status).toBe("partial");
  });

  it("agent_review is skipped (LLM budget = 0)", async () => {
    const verifier = new Verifier();
    const report = await verifier.verify({
      action: makePlan([{ type: "agent_review", goal: "review the diff" }]),
      worktreePath: workspace,
      runDir: workspace,
      env: { ...process.env },
    });
    expect(report.checks[0]?.status).toBe("skipped");
    expect(report.status).toBe("partial");
  });
});
