import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";

export function renderProgress(currentStep: number, totalSteps: number, label: string, capabilities: TerminalCapabilityProfile): string {
  const prefix = capabilities.prefersAsciiSafeOutput ? "[step]" : "Step";
  return `${prefix} ${currentStep}/${totalSteps} - ${label}`;
}
