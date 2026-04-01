import type { RecursiveSubcall, RecursiveSubcallStatus } from "../../domain/recursive/subcall.js";
import type { RecursiveAction } from "../../domain/recursive/action-bundle.js";
import { writeRecursiveSubcall } from "../../infrastructure/recursive/subcall-store.js";

export interface SpawnSubcallInput {
  workspaceRoot: string;
  sessionId: string;
  iterationId: string;
  action: Extract<RecursiveAction, { kind: "spawn-subcall" }>;
}

export async function spawnRecursiveSubcall(input: SpawnSubcallInput): Promise<{
  subcall: RecursiveSubcall;
  artifactRef: string;
}> {
  const timestamp = new Date().toISOString();
  const subcallId = `SUB-${Date.now()}`;
  const subcall: RecursiveSubcall = {
    subcallId,
    sessionId: input.sessionId,
    parentIterationId: input.iterationId,
    subcallType: input.action.args.subcallType,
    inputRefs: input.action.args.inputRefs,
    routingTier: input.action.args.routingTier,
    status: "completed" satisfies RecursiveSubcallStatus,
    prompt: input.action.args.prompt,
    summary: input.action.args.summary ?? `Spawned ${input.action.args.subcallType} subcall.`,
    resultRef: `subcalls/${subcallId}.json`,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const artifactRef = await writeRecursiveSubcall(input.workspaceRoot, subcall);
  return { subcall, artifactRef };
}
