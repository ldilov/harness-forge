import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../../../shared/fs.js";
import { nowISO } from "../../../shared/timestamps.js";
import { killTree, spawnDetachedOptions } from "./killtree.js";

export interface CommandRunRequest {
  readonly command: string;
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly stdoutPath: string;
  readonly stderrPath: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export interface CommandRunResult {
  readonly command: string;
  readonly cwd: string;
  readonly exitCode: number | null;
  readonly stdoutPath: string;
  readonly stderrPath: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationMs: number;
  readonly timedOut: boolean;
  readonly aborted: boolean;
}

interface SplitCommand {
  readonly bin: string;
  readonly args: readonly string[];
}

function splitCommand(command: string): SplitCommand {
  const trimmed = command.trim();
  if (trimmed.length === 0) {
    throw new Error("empty command");
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

export async function runCommand(request: CommandRunRequest): Promise<CommandRunResult> {
  const { bin, args } = splitCommand(request.command);
  await ensureDir(path.dirname(request.stdoutPath));
  await ensureDir(path.dirname(request.stderrPath));
  const stdoutHandle = await fs.open(request.stdoutPath, "w");
  const stderrHandle = await fs.open(request.stderrPath, "w");
  const startedAt = nowISO();
  const startedTime = Date.now();
  let timedOut = false;
  let aborted = false;
  let timeoutHandle: NodeJS.Timeout | null = null;
  let abortListener: (() => void) | null = null;

  const child = spawn(bin, args, {
    cwd: request.cwd,
    env: request.env,
    stdio: ["ignore", stdoutHandle.fd, stderrHandle.fd],
    shell: false,
    ...spawnDetachedOptions(),
  });

  const completion = new Promise<number | null>((resolve, reject) => {
    child.on("close", (exitCode) => resolve(exitCode));
    child.on("error", (error) => reject(error));
  });

  if (request.timeoutMs !== undefined && request.timeoutMs > 0 && child.pid !== undefined) {
    const pid = child.pid;
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      void killTree(pid, "SIGKILL");
    }, request.timeoutMs);
  }

  if (request.signal !== undefined && child.pid !== undefined) {
    const pid = child.pid;
    abortListener = () => {
      aborted = true;
      void killTree(pid, "SIGKILL");
    };
    if (request.signal.aborted) {
      abortListener();
    } else {
      request.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  let exitCode: number | null = null;
  try {
    exitCode = await completion;
  } catch {
    exitCode = null;
  } finally {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
    }
    if (abortListener !== null && request.signal !== undefined) {
      request.signal.removeEventListener("abort", abortListener);
    }
    await stdoutHandle.close().catch(() => undefined);
    await stderrHandle.close().catch(() => undefined);
  }

  const endedAt = nowISO();
  return {
    command: request.command,
    cwd: request.cwd,
    exitCode,
    stdoutPath: request.stdoutPath,
    stderrPath: request.stderrPath,
    startedAt,
    endedAt,
    durationMs: Date.now() - startedTime,
    timedOut,
    aborted,
  };
}
