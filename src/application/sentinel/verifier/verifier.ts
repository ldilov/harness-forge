import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { exists } from "../../../shared/fs.js";
import { nowISO } from "../../../shared/timestamps.js";
import { PathMatcher } from "../../../infrastructure/sentinel/policy/path-matcher.js";
import {
  type ActionPlan,
  type VerificationCheck,
} from "../../../domain/sentinel/action/action-plan.js";

export type VerificationCheckStatus = "passed" | "failed" | "skipped";
export type VerificationStatus = "passed" | "failed" | "partial";

export interface VerificationCheckResult {
  readonly type: VerificationCheck["type"];
  readonly status: VerificationCheckStatus;
  readonly command?: string;
  readonly evidenceRef?: string;
  readonly summary?: string;
  readonly durationMs: number;
}

export interface VerificationReport {
  readonly actionPlanId: string;
  readonly status: VerificationStatus;
  readonly checks: readonly VerificationCheckResult[];
  readonly completedAt: string;
}

export interface VerifyRequest {
  readonly action: ActionPlan;
  readonly worktreePath: string;
  readonly runDir: string;
  readonly env: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
}

interface CommandOutcome {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
}

function splitCommand(command: string): { readonly bin: string; readonly args: readonly string[] } {
  const trimmed = command.trim();
  if (trimmed.length === 0) {
    throw new Error("empty verification command");
  }
  const parts: string[] = [];
  let buffer = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (quote !== null) {
      if (ch === quote) {
        quote = null;
        continue;
      }
      buffer += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (buffer.length > 0) {
        parts.push(buffer);
        buffer = "";
      }
      continue;
    }
    buffer += ch;
  }
  if (buffer.length > 0) {
    parts.push(buffer);
  }
  if (parts.length === 0) {
    throw new Error(`could not parse command: ${command}`);
  }
  return { bin: parts[0]!, args: parts.slice(1) };
}

async function runProbeCommand(
  command: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<CommandOutcome> {
  const { bin, args } = splitCommand(command);
  const startedAt = Date.now();
  return new Promise<CommandOutcome>((resolve) => {
    const child = spawn(bin, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({
        exitCode: timedOut ? null : exitCode,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        exitCode: null,
        stdout,
        stderr: stderr + (error instanceof Error ? error.message : String(error)),
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

async function checkCommand(
  check: Extract<VerificationCheck, { type: "command" }>,
  request: VerifyRequest,
  index: number,
): Promise<VerificationCheckResult> {
  const timeout = check.timeoutMs ?? request.timeoutMs ?? 60_000;
  const stdoutPath = path.join(request.runDir, `verify-${index}.stdout.log`);
  const stderrPath = path.join(request.runDir, `verify-${index}.stderr.log`);
  const outcome = await runProbeCommand(check.command, request.worktreePath, request.env, timeout);
  await fs.writeFile(stdoutPath, outcome.stdout, "utf8");
  await fs.writeFile(stderrPath, outcome.stderr, "utf8");
  const passed = outcome.exitCode === 0;
  return {
    type: "command",
    status: passed ? "passed" : "failed",
    command: check.command,
    evidenceRef: passed ? stdoutPath : stderrPath,
    summary:
      outcome.exitCode === null
        ? `command timed out or could not start (after ${outcome.durationMs}ms)`
        : `exit ${outcome.exitCode} in ${outcome.durationMs}ms`,
    durationMs: outcome.durationMs,
  };
}

async function checkFileExists(
  check: Extract<VerificationCheck, { type: "file_exists" }>,
  request: VerifyRequest,
): Promise<VerificationCheckResult> {
  const target = path.isAbsolute(check.path) ? check.path : path.join(request.worktreePath, check.path);
  const present = await exists(target);
  return {
    type: "file_exists",
    status: present ? "passed" : "failed",
    evidenceRef: target,
    summary: present ? "file present" : "file not found",
    durationMs: 0,
  };
}

async function checkNoDiffOutside(
  check: Extract<VerificationCheck, { type: "no_diff_outside" }>,
  request: VerifyRequest,
): Promise<VerificationCheckResult> {
  const status = await runProbeCommand(
    "git status --porcelain",
    request.worktreePath,
    request.env,
    10_000,
  );
  if (status.exitCode !== 0) {
    return {
      type: "no_diff_outside",
      status: "failed",
      summary: `git status failed: ${status.stderr.trim().slice(0, 200)}`,
      durationMs: status.durationMs,
    };
  }
  const matcher = new PathMatcher(check.allowedPaths);
  const offenders: string[] = [];
  for (const line of status.stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const filePath = trimmed.replace(/^[ MADRCU?!]{1,2}\s+/, "");
    if (!matcher.matches(filePath)) {
      offenders.push(filePath);
    }
  }
  return {
    type: "no_diff_outside",
    status: offenders.length === 0 ? "passed" : "failed",
    summary:
      offenders.length === 0
        ? "no changes outside allowed paths"
        : `unexpected changes: ${offenders.slice(0, 5).join(", ")}`,
    durationMs: status.durationMs,
  };
}

async function checkSchemaValid(
  check: Extract<VerificationCheck, { type: "schema_valid" }>,
  request: VerifyRequest,
): Promise<VerificationCheckResult> {
  const target = path.isAbsolute(check.path) ? check.path : path.join(request.worktreePath, check.path);
  if (!(await exists(target))) {
    return {
      type: "schema_valid",
      status: "failed",
      evidenceRef: target,
      summary: "target file does not exist",
      durationMs: 0,
    };
  }
  try {
    const raw = await fs.readFile(target, "utf8");
    JSON.parse(raw);
    return {
      type: "schema_valid",
      status: "skipped",
      evidenceRef: target,
      summary: `parsed as JSON; full ajv schema validation against '${check.schemaRef}' pending (skipped to avoid claiming false 'passed')`,
      durationMs: 0,
    };
  } catch (error: unknown) {
    return {
      type: "schema_valid",
      status: "failed",
      evidenceRef: target,
      summary: `JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
      durationMs: 0,
    };
  }
}

async function runCheck(
  check: VerificationCheck,
  request: VerifyRequest,
  index: number,
): Promise<VerificationCheckResult> {
  switch (check.type) {
    case "command":
      return checkCommand(check, request, index);
    case "file_exists":
      return checkFileExists(check, request);
    case "no_diff_outside":
      return checkNoDiffOutside(check, request);
    case "schema_valid":
      return checkSchemaValid(check, request);
    case "agent_review":
      return {
        type: "agent_review",
        status: "skipped",
        summary: "agent_review verification not yet implemented; LLM token budget defaults to 0",
        durationMs: 0,
      };
    default:
      return {
        type: (check as VerificationCheck).type,
        status: "skipped",
        summary: "unknown check type",
        durationMs: 0,
      };
  }
}

function aggregateStatus(results: readonly VerificationCheckResult[]): VerificationStatus {
  const failed = results.some((result) => result.status === "failed");
  if (failed) {
    return "failed";
  }
  const skipped = results.some((result) => result.status === "skipped");
  const passed = results.every((result) => result.status === "passed");
  if (passed) {
    return "passed";
  }
  if (skipped) {
    return "partial";
  }
  return "partial";
}

export class Verifier {
  async verify(request: VerifyRequest): Promise<VerificationReport> {
    const required = request.action.verification.required;
    const optional = request.action.verification.optional ?? [];
    const results: VerificationCheckResult[] = [];
    let index = 0;
    for (const check of required) {
      results.push(await runCheck(check, request, index));
      index += 1;
    }
    for (const check of optional) {
      results.push(await runCheck(check, request, index));
      index += 1;
    }
    return {
      actionPlanId: request.action.id,
      status: aggregateStatus(results),
      checks: results,
      completedAt: nowISO(),
    };
  }
}
