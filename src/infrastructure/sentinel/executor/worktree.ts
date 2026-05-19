import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { ensureDir, exists } from "../../../shared/fs.js";

export interface CreateWorktreeRequest {
  readonly workspaceRoot: string;
  readonly branchPrefix: string;
  readonly destination: string;
  readonly baseRef?: string;
}

export interface WorktreeHandle {
  readonly path: string;
  readonly branch: string;
}

interface GitResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

async function runGit(workspaceRoot: string, args: readonly string[]): Promise<GitResult> {
  return new Promise<GitResult>((resolve) => {
    const child = spawn("git", args, {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
    child.on("error", (error) => resolve({ exitCode: null, stdout, stderr: stderr + error.message }));
  });
}

export class WorktreeError extends Error {
  constructor(message: string, readonly stderr: string) {
    super(`${message}: ${stderr.trim()}`);
    this.name = "WorktreeError";
  }
}

async function listExistingBranches(workspaceRoot: string): Promise<readonly string[]> {
  const result = await runGit(workspaceRoot, ["branch", "--list", "--all", "--format=%(refname:short)"]);
  if (result.exitCode !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function uniqueBranchName(workspaceRoot: string, base: string): Promise<string> {
  const branches = new Set(await listExistingBranches(workspaceRoot));
  if (!branches.has(base)) {
    return base;
  }
  for (let i = 1; i < 100; i += 1) {
    const candidate = `${base}-${i}`;
    if (!branches.has(candidate)) {
      return candidate;
    }
  }
  throw new Error(`could not find a free branch name for ${base}`);
}

export async function createWorktree(request: CreateWorktreeRequest): Promise<WorktreeHandle> {
  await ensureDir(path.dirname(request.destination));
  if (await exists(request.destination)) {
    await fs.rm(request.destination, { recursive: true, force: true });
  }
  const branch = await uniqueBranchName(request.workspaceRoot, request.branchPrefix);
  const args = ["worktree", "add", "-b", branch, request.destination];
  if (request.baseRef !== undefined) {
    args.push(request.baseRef);
  }
  const result = await runGit(request.workspaceRoot, args);
  if (result.exitCode !== 0) {
    throw new WorktreeError("git worktree add failed", result.stderr);
  }
  return { path: request.destination, branch };
}

export interface RemoveWorktreeRequest {
  readonly workspaceRoot: string;
  readonly worktreePath: string;
  readonly branch?: string;
  readonly deleteBranch?: boolean;
}

export async function removeWorktree(request: RemoveWorktreeRequest): Promise<void> {
  if (await exists(request.worktreePath)) {
    const removed = await runGit(request.workspaceRoot, [
      "worktree",
      "remove",
      "--force",
      request.worktreePath,
    ]);
    if (removed.exitCode !== 0) {
      await fs.rm(request.worktreePath, { recursive: true, force: true });
      await runGit(request.workspaceRoot, ["worktree", "prune"]);
    }
  } else {
    await runGit(request.workspaceRoot, ["worktree", "prune"]);
  }
  if (request.deleteBranch === true && request.branch !== undefined) {
    await runGit(request.workspaceRoot, ["branch", "-D", request.branch]);
  }
}

export async function captureDiff(workspaceRoot: string, worktreePath: string): Promise<string> {
  const result = await runGit(worktreePath, ["diff", "--no-color", "HEAD"]);
  if (result.exitCode !== 0) {
    return "";
  }
  if (result.stdout.length > 0) {
    return result.stdout;
  }
  const status = await runGit(worktreePath, ["status", "--porcelain"]);
  return status.stdout;
}
