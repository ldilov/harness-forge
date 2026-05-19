import { sha256Hex } from "../../../shared/sha256.js";
import type { AgentHookEvent } from "./hook-event.js";

export interface FingerprintInputs {
  readonly event: AgentHookEvent;
  readonly goal: string;
  readonly files: readonly string[];
  readonly graphVersion: string;
  readonly recentCommandSet: readonly string[];
}

export function hookFingerprint(inputs: FingerprintInputs): string {
  const normalizedFiles = [...inputs.files].map((f) => f.replace(/\\/g, "/")).sort();
  const normalizedCommands = [...inputs.recentCommandSet].sort();
  const material = JSON.stringify({
    event: inputs.event,
    goal: inputs.goal.trim(),
    files: normalizedFiles,
    graphVersion: inputs.graphVersion,
    commands: normalizedCommands,
  });
  return `fp_${sha256Hex(material).slice(0, 32)}`;
}
