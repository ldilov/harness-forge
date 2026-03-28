import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { renderScreen } from "./screen-layout.js";
import { renderProgress } from "./progress.js";
import { styleHeading } from "./text-style.js";

export function renderStepFrame(
  capabilities: TerminalCapabilityProfile,
  title: string,
  step: number,
  totalSteps: number,
  body: string
): string {
  return renderScreen(styleHeading(capabilities, title), [renderProgress(step, totalSteps, title, capabilities), body], capabilities);
}
