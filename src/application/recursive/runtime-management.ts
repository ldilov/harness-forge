import path from "node:path";

import { ValidationError, ensureDir, exists, readJsonFile, writeJsonFile } from "../../shared/index.js";
import type { RecursiveRuntimeId } from "../../domain/recursive/runtime-inventory.js";

interface ManagedRuntimeEntry {
  runtimeId: RecursiveRuntimeId;
  command: string;
  args: string[];
  executablePath?: string;
  source: "registry" | "explicit";
  managedAt: string;
  notes: string;
}

interface ManagedRuntimeRegistry {
  version: number;
  updatedAt: string;
  runtimes: ManagedRuntimeEntry[];
}

function createEmptyRegistry(): ManagedRuntimeRegistry {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    runtimes: []
  };
}

export async function loadManagedRuntimeRegistry(
  registryPath: string
): Promise<ManagedRuntimeRegistry> {
  if (!(await exists(registryPath))) {
    return createEmptyRegistry();
  }

  const parsed = await readJsonFile<ManagedRuntimeRegistry>(registryPath);
  return {
    version: parsed.version ?? 1,
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    runtimes: Array.isArray(parsed.runtimes) ? parsed.runtimes : []
  };
}

export async function upsertManagedRuntime(
  registryPath: string,
  entry: ManagedRuntimeEntry
): Promise<ManagedRuntimeRegistry> {
  const registry = await loadManagedRuntimeRegistry(registryPath);
  const next = registry.runtimes.filter((runtime) => runtime.runtimeId !== entry.runtimeId);
  next.push(entry);
  const updated: ManagedRuntimeRegistry = {
    version: 1,
    updatedAt: new Date().toISOString(),
    runtimes: next.sort((left, right) => left.runtimeId.localeCompare(right.runtimeId))
  };
  await ensureDir(path.dirname(registryPath));
  await writeJsonFile(registryPath, updated);
  return updated;
}

export async function getManagedRuntimeEntry(
  registryPath: string,
  runtimeId: RecursiveRuntimeId
): Promise<ManagedRuntimeEntry | null> {
  const registry = await loadManagedRuntimeRegistry(registryPath);
  return registry.runtimes.find((runtime) => runtime.runtimeId === runtimeId) ?? null;
}

export function assertProvisionableRuntime(runtimeId: RecursiveRuntimeId): void {
  if (runtimeId === "node") {
    throw new ValidationError("Node is already provided by the active Harness Forge CLI process and does not need recursive provisioning.");
  }
}
