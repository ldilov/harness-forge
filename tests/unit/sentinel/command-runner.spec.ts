import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runCommand } from "../../../src/infrastructure/sentinel/executor/command-runner.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-cmd-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

const isWindows = process.platform === "win32";
const echoCommand = isWindows ? 'cmd /c "echo hello"' : "node -e \"console.log('hello')\"";
const exitFailCommand = isWindows ? 'cmd /c "exit 7"' : 'node -e "process.exit(7)"';
const sleepCommand = isWindows
  ? 'cmd /c "ping -n 5 127.0.0.1 > NUL"'
  : 'node -e "setTimeout(() => process.exit(0), 5000)"';

describe("runCommand", () => {
  it("captures stdout to a file and returns exit code 0 on success", async () => {
    const stdoutPath = path.join(workspace, "stdout.log");
    const stderrPath = path.join(workspace, "stderr.log");
    const result = await runCommand({
      command: echoCommand,
      cwd: workspace,
      env: { ...process.env },
      stdoutPath,
      stderrPath,
    });
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    const stdout = await fs.readFile(stdoutPath, "utf8");
    expect(stdout).toContain("hello");
  });

  it("returns the failing exit code", async () => {
    const stdoutPath = path.join(workspace, "stdout.log");
    const stderrPath = path.join(workspace, "stderr.log");
    const result = await runCommand({
      command: exitFailCommand,
      cwd: workspace,
      env: { ...process.env },
      stdoutPath,
      stderrPath,
    });
    expect(result.exitCode).toBe(7);
  });

  it("times out and reports timedOut=true", async () => {
    const stdoutPath = path.join(workspace, "stdout.log");
    const stderrPath = path.join(workspace, "stderr.log");
    const result = await runCommand({
      command: sleepCommand,
      cwd: workspace,
      env: { ...process.env },
      stdoutPath,
      stderrPath,
      timeoutMs: 200,
    });
    expect(result.timedOut).toBe(true);
    expect(result.durationMs).toBeLessThan(4_000);
  }, 10_000);

  it("aborts when the AbortSignal fires", async () => {
    const stdoutPath = path.join(workspace, "stdout.log");
    const stderrPath = path.join(workspace, "stderr.log");
    const controller = new AbortController();
    const promise = runCommand({
      command: sleepCommand,
      cwd: workspace,
      env: { ...process.env },
      stdoutPath,
      stderrPath,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 100);
    const result = await promise;
    expect(result.aborted).toBe(true);
  }, 10_000);
});
