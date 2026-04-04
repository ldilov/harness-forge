import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type {
  RecursiveOsFamily,
  RecursiveRuntimeEntry,
  RecursiveRuntimeId,
  RecursiveRuntimeInventory,
  RecursiveShellFamily
} from "../../domain/recursive/runtime-inventory.js";
import {
  RUNTIME_DIR,
  RUNTIME_RECURSIVE_DIR,
  RUNTIME_RECURSIVE_RUNTIME_MANAGEMENT_FILE
} from "../../shared/index.js";
import { getManagedRuntimeEntry, loadManagedRuntimeRegistry } from "./runtime-management.js";

const execFileAsync = promisify(execFile);

interface RuntimeCandidate {
  runtimeId: RecursiveRuntimeId;
  command: string;
  args: string[];
  executablePath?: string;
  source: "process" | "discovered" | "registry" | "explicit";
}

function resolveOsFamily(): RecursiveOsFamily {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    case "darwin":
      return "darwin";
    default:
      return "unknown";
  }
}

function resolveShellFamily(): RecursiveShellFamily {
  const shell = process.env.SHELL?.toLowerCase();
  const comspec = process.env.ComSpec?.toLowerCase();
  const psModule = process.env.PSModulePath?.toLowerCase();
  if (psModule || comspec?.includes("powershell")) {
    return "powershell";
  }
  if (comspec?.includes("cmd.exe")) {
    return "cmd";
  }
  if (shell?.includes("bash")) {
    return "bash";
  }
  if (shell?.includes("zsh")) {
    return "zsh";
  }
  if (shell?.includes("sh")) {
    return "sh";
  }
  return "unknown";
}

function runtimeManagementPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_RECURSIVE_DIR, RUNTIME_RECURSIVE_RUNTIME_MANAGEMENT_FILE);
}

async function runVersionProbe(
  command: string,
  args: string[]
): Promise<{ version?: string; healthy: boolean; note?: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 5_000,
      maxBuffer: 1024 * 1024
    });
    const versionLine = `${stdout ?? ""}\n${stderr ?? ""}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return {
      version: versionLine,
      healthy: true
    };
  } catch (error) {
    return {
      healthy: false,
      note: error instanceof Error ? error.message : String(error)
    };
  }
}

function versionArgsFor(runtimeId: RecursiveRuntimeId): string[] {
  switch (runtimeId) {
    case "node":
      return ["--version"];
    case "python":
      return ["--version"];
    case "powershell":
      return ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"];
  }
}

async function discoverHostCandidate(workspaceRoot: string, runtimeId: RecursiveRuntimeId): Promise<RuntimeCandidate | null> {
  const managed = await getManagedRuntimeEntry(runtimeManagementPath(workspaceRoot), runtimeId);
  if (managed) {
    return {
      runtimeId,
      command: managed.command,
      args: managed.args,
      executablePath: managed.executablePath,
      source: managed.source
    };
  }

  if (runtimeId === "node") {
    return {
      runtimeId,
      command: process.execPath,
      args: [],
      executablePath: process.execPath,
      source: "process"
    };
  }

  const candidates =
    runtimeId === "python"
      ? process.platform === "win32"
        ? [
            { command: "py", args: ["-3"] },
            { command: "python", args: [] },
            { command: "python3", args: [] }
          ]
        : [
            { command: "python3", args: [] },
            { command: "python", args: [] }
          ]
      : process.platform === "win32"
        ? [
            { command: "pwsh", args: [] },
            { command: "powershell", args: [] }
          ]
        : [{ command: "pwsh", args: [] }];

  for (const candidate of candidates) {
    const probe = await runVersionProbe(candidate.command, [...candidate.args, ...versionArgsFor(runtimeId)]);
    if (probe.healthy) {
      return {
        runtimeId,
        command: candidate.command,
        args: candidate.args,
        executablePath: candidate.command,
        source: "discovered"
      };
    }
  }

  return null;
}

function buildSummary(entries: RecursiveRuntimeEntry[]): string {
  const available = entries.filter((entry) => entry.availability === "available").map((entry) => entry.displayName);
  if (available.length === 0) {
    return "No recursive code-cell runtimes are currently healthy on this host. Agents should inspect provisioning guidance before attempting bounded execution.";
  }
  return `Recursive host-runtime inventory for this workspace. Healthy runtimes: ${available.join(", ")}. Agents should prefer discovered runtimes and only use provisioned aliases when explicitly configured.`;
}

function displayName(runtimeId: RecursiveRuntimeId): string {
  switch (runtimeId) {
    case "node":
      return "Node.js";
    case "python":
      return "Python";
    case "powershell":
      return "PowerShell";
  }
}

function noteForMissing(runtimeId: RecursiveRuntimeId): string {
  switch (runtimeId) {
    case "node":
      return "Node.js is expected through the active Harness Forge CLI process.";
    case "python":
      return "Python is not currently healthy on this host. Use `hforge recursive provision-runtime python` to register a workspace-managed Python alias when available.";
    case "powershell":
      return "PowerShell is not currently healthy on this host. Use `hforge recursive provision-runtime powershell` to register a workspace-managed alias when available.";
  }
}

function allowedByPolicy(runtimeId: RecursiveRuntimeId, policy?: RecursiveExecutionPolicy): boolean | undefined {
  if (!policy) {
    return undefined;
  }
  if (runtimeId === "node") {
    return policy.allowCodeCells && (policy.allowedLanguages.includes("javascript") || policy.allowedLanguages.includes("typescript"));
  }
  return policy.allowCodeCells && policy.allowedLanguages.includes(runtimeId);
}

export async function deriveRecursiveRuntimeInventory(
  workspaceRoot: string,
  policy?: RecursiveExecutionPolicy
): Promise<RecursiveRuntimeInventory> {
  await loadManagedRuntimeRegistry(runtimeManagementPath(workspaceRoot));
  const timestamp = new Date().toISOString();
  const runtimes = await Promise.all(
    (["node", "python", "powershell"] as const).map(async (runtimeId) => {
      const candidate = await discoverHostCandidate(workspaceRoot, runtimeId);
      if (!candidate) {
        return {
          runtimeId,
          displayName: displayName(runtimeId),
          availability: "missing" as const,
          healthStatus: "unknown" as const,
          provisioner: "none" as const,
          source: "none" as const,
          managed: false,
          args: [],
          notes: noteForMissing(runtimeId),
          lastCheckedAt: timestamp,
          ...(allowedByPolicy(runtimeId, policy) !== undefined ? { allowedByPolicy: allowedByPolicy(runtimeId, policy) } : {})
        };
      }

      const probe = await runVersionProbe(candidate.command, [...candidate.args, ...versionArgsFor(runtimeId)]);
      const isManaged = candidate.source === "registry" || candidate.source === "explicit";
      return {
        runtimeId,
        displayName: displayName(runtimeId),
        availability: probe.healthy ? "available" as const : "degraded" as const,
        healthStatus: probe.healthy ? "healthy" as const : "unhealthy" as const,
        provisioner: candidate.source === "registry" || candidate.source === "explicit" ? "workspace-managed" as const : "host" as const,
        source: candidate.source,
        managed: isManaged,
        executablePath: candidate.executablePath,
        command: candidate.command,
        args: candidate.args,
        version: probe.version,
        notes: probe.healthy
          ? isManaged
            ? `Harness Forge will prefer the workspace-managed ${displayName(runtimeId)} alias for bounded recursive execution.`
            : `Host ${displayName(runtimeId)} runtime detected and ready for bounded recursive execution.`
          : probe.note ?? `${displayName(runtimeId)} was discovered but failed its health check.`,
        lastCheckedAt: timestamp,
        ...(allowedByPolicy(runtimeId, policy) !== undefined ? { allowedByPolicy: allowedByPolicy(runtimeId, policy) } : {})
      };
    })
  );

  return {
    version: 1,
    generatedAt: timestamp,
    workspaceRoot: workspaceRoot.replaceAll("\\", "/"),
    osFamily: resolveOsFamily(),
    shellFamily: resolveShellFamily(),
    summary: buildSummary(runtimes),
    runtimes
  };
}

export function resolveRuntimeCandidate(
  inventory: RecursiveRuntimeInventory,
  runtimeId: RecursiveRuntimeId
): { command: string; args: string[] } | null {
  const entry = inventory.runtimes.find((runtime) => runtime.runtimeId === runtimeId);
  if (!entry || entry.availability !== "available" || entry.healthStatus !== "healthy" || !entry.command) {
    return null;
  }
  return {
    command: entry.command,
    args: entry.args ?? []
  };
}
