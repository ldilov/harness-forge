import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { RecursiveRuntimeId } from "../../domain/recursive/runtime-inventory.js";
import { ValidationError, ensureDir, writeJsonFile } from "../../shared/index.js";
import {
  loadRecursiveRuntimeInventory,
  resolveRecursiveRuntimeManagementPath,
  resolveRecursiveRuntimeInventoryPath,
  writeRecursiveRuntimeInventory
} from "../../infrastructure/recursive/session-store.js";
import { deriveRecursiveRuntimeInventory } from "./derive-runtime-inventory.js";
import { assertProvisionableRuntime, upsertManagedRuntime } from "./runtime-management.js";

const execFileAsync = promisify(execFile);

export interface ProvisionRecursiveRuntimeInput {
  workspaceRoot: string;
  runtimeId: RecursiveRuntimeId;
  executablePath?: string;
}

export interface ProvisionRecursiveRuntimeOutput {
  runtimeId: RecursiveRuntimeId;
  status: "managed" | "missing";
  inventoryPath: string;
  managementPath: string;
  message: string;
}

async function healthCheck(
  runtimeId: RecursiveRuntimeId,
  command: string,
  args: string[]
): Promise<{ healthy: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 5_000,
      maxBuffer: 1024 * 1024
    });
    const output = `${stdout ?? ""}\n${stderr ?? ""}`.trim();
    const matchesRuntime =
      runtimeId === "python"
        ? /python/i.test(output)
        : runtimeId === "powershell"
          ? /(\d+\.\d+(\.\d+)*)/.test(output)
          : /^v?\d+\./.test(output);
    return {
      healthy: matchesRuntime,
      output
    };
  } catch {
    return {
      healthy: false,
      output: ""
    };
  }
}

function versionArgs(runtimeId: RecursiveRuntimeId): string[] {
  switch (runtimeId) {
    case "python":
      return ["--version"];
    case "powershell":
      return ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"];
    case "node":
      return ["--version"];
  }
}

async function resolveProvisionCandidate(input: ProvisionRecursiveRuntimeInput): Promise<{
  command: string;
  args: string[];
  executablePath?: string;
  notes: string;
} | null> {
  if (input.executablePath) {
    const command = path.resolve(input.executablePath);
    const probe = await healthCheck(input.runtimeId, command, versionArgs(input.runtimeId));
    if (!probe.healthy) {
      throw new ValidationError(`Provided executable for ${input.runtimeId} did not pass its health check: ${command}`);
    }
    return {
      command,
      args: [],
      executablePath: command,
      notes: "Provisioned from an explicit operator-supplied executable."
    };
  }

  const inventory = (await loadRecursiveRuntimeInventory(input.workspaceRoot)) ?? (await deriveRecursiveRuntimeInventory(input.workspaceRoot));
  const entry = inventory?.runtimes.find((runtime) => runtime.runtimeId === input.runtimeId);
  if (entry?.command && entry.availability === "available" && entry.healthStatus === "healthy") {
    return {
      command: entry.command,
      args: entry.args ?? [],
      executablePath: entry.executablePath,
      notes: "Provisioned from a healthy host-discovered runtime."
    };
  }

  return null;
}

export async function provisionRecursiveRuntime(
  input: ProvisionRecursiveRuntimeInput
): Promise<ProvisionRecursiveRuntimeOutput> {
  assertProvisionableRuntime(input.runtimeId);
  const candidate = await resolveProvisionCandidate(input);
  const managementPath = resolveRecursiveRuntimeManagementPath(input.workspaceRoot);
  const inventoryPath = resolveRecursiveRuntimeInventoryPath(input.workspaceRoot);

  if (!candidate) {
    const inventory = await deriveRecursiveRuntimeInventory(input.workspaceRoot);
    await writeRecursiveRuntimeInventory(input.workspaceRoot, inventory);
    return {
      runtimeId: input.runtimeId,
      status: "missing",
      inventoryPath,
      managementPath,
      message: `No healthy ${input.runtimeId} runtime was available to provision. Install it first or rerun with --executable <path>.`
    };
  }

  await ensureDir(path.dirname(managementPath));
  await upsertManagedRuntime(managementPath, {
    runtimeId: input.runtimeId,
    command: candidate.command,
    args: candidate.args,
    executablePath: candidate.executablePath,
    source: input.executablePath ? "explicit" : "registry",
    managedAt: new Date().toISOString(),
    notes: candidate.notes
  });
  const managedDir = path.join(input.workspaceRoot, ".hforge", "runtime", "recursive", "managed-runtimes", input.runtimeId);
  await ensureDir(managedDir);
  await writeJsonFile(path.join(managedDir, "manifest.json"), {
    runtimeId: input.runtimeId,
    command: candidate.command,
    args: candidate.args,
    executablePath: candidate.executablePath,
    managedAt: new Date().toISOString(),
    notes: candidate.notes
  });
  const refreshedInventory = await deriveRecursiveRuntimeInventory(input.workspaceRoot);
  await writeRecursiveRuntimeInventory(input.workspaceRoot, refreshedInventory);

  return {
    runtimeId: input.runtimeId,
    status: "managed",
    inventoryPath,
    managementPath,
    message: `Registered a workspace-managed ${input.runtimeId} runtime for recursive execution.`
  };
}
