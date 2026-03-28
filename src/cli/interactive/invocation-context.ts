import path from "node:path";

import { RUNTIME_DIR, RUNTIME_INDEX_FILE, exists } from "../../shared/index.js";
import type { TerminalCapabilityProfile } from "./terminal-capabilities.js";
import { detectTerminalCapabilities } from "./terminal-capabilities.js";

export type RuntimePresenceState = "absent" | "present" | "partial";

export interface CliInvocationContext {
  argv: string[];
  cwd: string;
  explicitCommand: string | null;
  providedFlags: string[];
  isTty: boolean;
  isCi: boolean;
  detectedWorkspaceRoot: string;
  detectedRuntimeState: RuntimePresenceState;
  terminalProfile: TerminalCapabilityProfile;
}

export async function detectRuntimePresenceState(workspaceRoot: string): Promise<RuntimePresenceState> {
  const runtimeDir = path.join(workspaceRoot, RUNTIME_DIR);
  const runtimeIndexPath = path.join(runtimeDir, RUNTIME_INDEX_FILE);
  if (await exists(runtimeIndexPath)) {
    return "present";
  }
  if (await exists(runtimeDir)) {
    return "partial";
  }
  return "absent";
}

export async function resolveInvocationContext(argv: string[], cwd: string): Promise<CliInvocationContext> {
  const explicitCommand = argv.find((value) => !value.startsWith("-")) ?? null;
  const providedFlags = argv.filter((value) => value.startsWith("-"));
  const terminalProfile = detectTerminalCapabilities();
  const detectedWorkspaceRoot = path.resolve(cwd);
  const detectedRuntimeState = await detectRuntimePresenceState(detectedWorkspaceRoot);

  return {
    argv,
    cwd: detectedWorkspaceRoot,
    explicitCommand,
    providedFlags,
    isTty: terminalProfile.supportsInteractiveInput,
    isCi: process.env.CI === "true",
    detectedWorkspaceRoot,
    detectedRuntimeState,
    terminalProfile
  };
}
