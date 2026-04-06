import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { styleBanner, styleEmoji } from "./text-style.js";

const STEP_ICONS: Record<string, string> = {
  "Folder selection": "\uD83D\uDCC2",
  "Workspace": "\uD83D\uDCC2",
  "Target selection": "\uD83C\uDFAF",
  "Setup profile": "\uD83D\uDCCA",
  "Review before write": "\uD83D\uDCDD",
};

export function renderProgress(
  currentStep: number,
  totalSteps: number,
  label: string,
  capabilities: TerminalCapabilityProfile
): string {
  const icon = STEP_ICONS[label] ?? "\u2699\uFE0F";
  const emoji = styleEmoji(icon, capabilities, "#");
  const text = `Step ${currentStep}/${totalSteps} \u00B7 ${emoji} ${label}`;
  return styleBanner(text, capabilities);
}
