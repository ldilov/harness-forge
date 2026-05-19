import { z } from "zod";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { AtomicJsonStore } from "../../../infrastructure/sentinel/stores/atomic-json-store.js";
import { exists } from "../../../shared/fs.js";
import { nowISO } from "../../../shared/timestamps.js";
import {
  sentinelRunCheckpointPath,
  SENTINEL_ACTIONS_DIR,
  SENTINEL_RUNS_DIR,
} from "../../../domain/sentinel/paths.js";
import { ActionStore } from "../../../infrastructure/sentinel/stores/action-store.js";

export const ExecutionPhaseSchema = z.enum([
  "policy-check",
  "worktree-create",
  "running",
  "verifying",
  "rollback",
  "completed",
  "failed",
  "reverted",
]);
export type ExecutionPhase = z.infer<typeof ExecutionPhaseSchema>;

export const CheckpointSchema = z
  .object({
    actionId: z.string().min(1),
    phase: ExecutionPhaseSchema,
    stepIndex: z.number().int().nonnegative().nullable(),
    pid: z.number().int().positive(),
    hostname: z.string().min(1),
    branch: z.string().nullable(),
    updatedAt: z.string().min(1),
    recoveredFromPhase: ExecutionPhaseSchema.nullable().optional(),
    recoveredFromPid: z.number().int().positive().nullable().optional(),
    recoveredFromHostname: z.string().nullable().optional(),
    recoveredAt: z.string().nullable().optional(),
  })
  .strict();
export type Checkpoint = z.infer<typeof CheckpointSchema>;

const TERMINAL_PHASES: ReadonlySet<ExecutionPhase> = new Set([
  "completed",
  "failed",
  "reverted",
]);

export function isTerminalPhase(phase: ExecutionPhase): boolean {
  return TERMINAL_PHASES.has(phase);
}

export class CheckpointStore {
  private readonly store: AtomicJsonStore<Checkpoint | null>;

  constructor(workspaceRoot: string, actionId: string) {
    this.store = new AtomicJsonStore<Checkpoint | null>(
      sentinelRunCheckpointPath(workspaceRoot, actionId),
      () => null,
      {
        validate: (raw) => (raw === null ? null : CheckpointSchema.parse(raw)),
      },
    );
  }

  async write(value: Omit<Checkpoint, "updatedAt">): Promise<void> {
    const record: Checkpoint = CheckpointSchema.parse({
      ...value,
      updatedAt: nowISO(),
    });
    await this.store.write(record);
  }

  async read(): Promise<Checkpoint | null> {
    return this.store.read();
  }

  async clear(): Promise<void> {
    await this.store.write(null);
  }
}

export interface RecoveryOutcome {
  readonly orphanedRuns: readonly { actionId: string; phase: ExecutionPhase }[];
  readonly errors: readonly string[];
}

async function listRunDirs(workspaceRoot: string): Promise<readonly string[]> {
  const runsRoot = path.join(workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_RUNS_DIR);
  if (!(await exists(runsRoot))) {
    return [];
  }
  const entries = await fs.readdir(runsRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

export async function recoverInflightRuns(workspaceRoot: string): Promise<RecoveryOutcome> {
  const dirs = await listRunDirs(workspaceRoot);
  const orphaned: { actionId: string; phase: ExecutionPhase }[] = [];
  const errors: string[] = [];
  const actions = new ActionStore(workspaceRoot);
  for (const dir of dirs) {
    const checkpointPath = sentinelRunCheckpointPath(workspaceRoot, dir);
    if (!(await exists(checkpointPath))) {
      continue;
    }
    try {
      const store = new CheckpointStore(workspaceRoot, dir);
      const checkpoint = await store.read();
      if (checkpoint === null) {
        continue;
      }
      if (isTerminalPhase(checkpoint.phase)) {
        continue;
      }
      const updated = await actions.setStatus(checkpoint.actionId, "failed", nowISO());
      if (updated === null) {
        errors.push(`could not flip status for ${checkpoint.actionId}: not found`);
        continue;
      }
      orphaned.push({ actionId: checkpoint.actionId, phase: checkpoint.phase });
      await store.write({
        actionId: checkpoint.actionId,
        phase: "failed",
        stepIndex: checkpoint.stepIndex,
        pid: process.pid,
        hostname: os.hostname(),
        branch: checkpoint.branch,
        recoveredFromPhase: checkpoint.phase,
        recoveredFromPid: checkpoint.pid,
        recoveredFromHostname: checkpoint.hostname,
        recoveredAt: nowISO(),
      });
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { orphanedRuns: orphaned, errors };
}
