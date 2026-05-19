import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  captureDiff,
  createWorktree,
  removeWorktree,
} from "../../../src/infrastructure/sentinel/executor/worktree.js";

let workspace: string;

async function git(workspaceRoot: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, { cwd: workspaceRoot, stdio: "ignore", windowsHide: true });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`git ${args.join(" ")} -> ${code}`))));
    child.on("error", reject);
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-wt-"));
  await git(workspace, ["init", "-q", "-b", "main"]);
  await git(workspace, ["config", "user.email", "test@example.com"]);
  await git(workspace, ["config", "user.name", "Test"]);
  await fs.writeFile(path.join(workspace, "README.md"), "hello\n", "utf8");
  await git(workspace, ["add", "README.md"]);
  await git(workspace, ["commit", "-q", "-m", "init"]);
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("createWorktree / removeWorktree", () => {
  it("creates a worktree at the requested destination on a unique branch", async () => {
    const destination = path.join(workspace, ".hforge", "runtime", "actions", "runs", "act_x", "worktree");
    const handle = await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/abcd1234",
      destination,
    });
    expect(handle.path).toBe(destination);
    expect(handle.branch).toBe("sentinel/abcd1234");
    const exists = await fs.stat(destination);
    expect(exists.isDirectory()).toBe(true);
  });

  it("appends -1, -2, ... when the branch already exists", async () => {
    const destination1 = path.join(workspace, "wt1");
    const destination2 = path.join(workspace, "wt2");
    const a = await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/dup",
      destination: destination1,
    });
    const b = await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/dup",
      destination: destination2,
    });
    expect(a.branch).toBe("sentinel/dup");
    expect(b.branch).toBe("sentinel/dup-1");
  });

  it("captureDiff returns an empty string when there are no changes", async () => {
    const destination = path.join(workspace, "wt-clean");
    await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/clean",
      destination,
    });
    const diff = await captureDiff(workspace, destination);
    expect(diff.trim()).toBe("");
  });

  it("captureDiff reports porcelain status when files are modified but not staged", async () => {
    const destination = path.join(workspace, "wt-dirty");
    await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/dirty",
      destination,
    });
    await fs.writeFile(path.join(destination, "new.txt"), "fresh\n", "utf8");
    const diff = await captureDiff(workspace, destination);
    expect(diff).toContain("new.txt");
  });

  it("removeWorktree cleans up the directory and branch when requested", async () => {
    const destination = path.join(workspace, "wt-remove");
    const handle = await createWorktree({
      workspaceRoot: workspace,
      branchPrefix: "sentinel/remove",
      destination,
    });
    await removeWorktree({
      workspaceRoot: workspace,
      worktreePath: destination,
      branch: handle.branch,
      deleteBranch: true,
    });
    let stillExists = false;
    try {
      await fs.stat(destination);
      stillExists = true;
    } catch {
      stillExists = false;
    }
    expect(stillExists).toBe(false);
  });
});
