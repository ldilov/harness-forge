import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { renderProgress } from "./progress.js";
import { styleSeparator } from "./text-style.js";

export function renderStepFrame(
  capabilities: TerminalCapabilityProfile,
  title: string,
  step: number,
  totalSteps: number,
  body: string
): string {
  const header = renderProgress(step, totalSteps, title, capabilities);
  const separator = styleSeparator(capabilities);
  return `\n${header}\n${separator}\n${body}\n`;
}
