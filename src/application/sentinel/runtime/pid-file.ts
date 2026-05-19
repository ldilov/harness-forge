import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { ensureDir, exists } from "../../../shared/fs.js";
import { sentinelPidPath } from "../../../domain/sentinel/paths.js";
import { nowISO } from "../../../shared/timestamps.js";

export const PidRecordSchema = z
  .object({
    pid: z.number().int().positive(),
    startedAt: z.string().min(1),
    hostname: z.string().min(1),
    workspaceRoot: z.string().min(1),
  })
  .strict();
export type PidRecord = z.infer<typeof PidRecordSchema>;

export interface PidFileLock {
  readonly record: PidRecord;
  readonly path: string;
  release(): Promise<void>;
}

export type PidLiveness = "alive" | "dead" | "foreign-host" | "indeterminate";

export function classifyPidLiveness(record: PidRecord, hostname: string = os.hostname()): PidLiveness {
  if (record.hostname !== hostname) {
    return "foreign-host";
  }
  if (record.pid === process.pid) {
    return "alive";
  }
  try {
    process.kill(record.pid, 0);
    return "alive";
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ESRCH") {
      return "dead";
    }
    if (code === "EPERM") {
      return "indeterminate";
    }
    return "dead";
  }
}

export class PidFileBusyError extends Error {
  constructor(readonly record: PidRecord, readonly filePath: string) {
    super(
      `sentinel daemon already running (pid ${record.pid} on ${record.hostname}, started ${record.startedAt}) — see ${filePath}`,
    );
    this.name = "PidFileBusyError";
  }
}

async function readRecord(filePath: string): Promise<PidRecord | null> {
  if (!(await exists(filePath))) {
    return null;
  }
  const raw = await fs.readFile(filePath, "utf8");
  if (raw.trim().length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return PidRecordSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function acquirePidFile(workspaceRoot: string): Promise<PidFileLock> {
  const filePath = sentinelPidPath(workspaceRoot);
  const existing = await readRecord(filePath);
  if (existing !== null) {
    const liveness = classifyPidLiveness(existing);
    if (liveness === "alive" || liveness === "foreign-host" || liveness === "indeterminate") {
      throw new PidFileBusyError(existing, filePath);
    }
    await fs.unlink(filePath).catch(() => undefined);
  }
  await ensureDir(path.dirname(filePath));
  const record: PidRecord = {
    pid: process.pid,
    startedAt: nowISO(),
    hostname: os.hostname(),
    workspaceRoot: path.resolve(workspaceRoot),
  };
  await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return {
    record,
    path: filePath,
    async release() {
      await fs.unlink(filePath).catch(() => undefined);
    },
  };
}

export async function readPidRecord(workspaceRoot: string): Promise<PidRecord | null> {
  return readRecord(sentinelPidPath(workspaceRoot));
}

export async function readPidFile(workspaceRoot: string): Promise<number | null> {
  const record = await readPidRecord(workspaceRoot);
  return record === null ? null : record.pid;
}
