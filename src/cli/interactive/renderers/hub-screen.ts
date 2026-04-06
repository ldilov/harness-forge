import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { styleBox, styleEmoji, styleKeyValue, styleMuted } from "./text-style.js";

export function renderHubScreen(
  workspaceRoot: string,
  actions: string[],
  capabilities: TerminalCapabilityProfile,
  healthMessage: string
): string {
  const bullet = styleEmoji("\u2022", capabilities, "-");
  const lines: string[] = [];

  lines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCC1", capabilities, " ")} Workspace`,
    workspaceRoot,
    capabilities
  ));
  lines.push("");
  lines.push(`${styleEmoji("\uD83D\uDC9A", capabilities, " ")} Runtime health`);
  lines.push(`  ${healthMessage}`);
  lines.push("");
  lines.push(`${styleEmoji("\u2699\uFE0F", capabilities, ">")} Available actions`);
  for (const action of actions) {
    lines.push(`  ${bullet} ${action}`);
  }

  const titleIcon = styleEmoji("\uD83D\uDD28", capabilities, "*");
  const box = styleBox(lines, capabilities, `${titleIcon} Harness Forge Project Hub`);
  const footer = styleMuted(capabilities, "  Choose an action to run immediately or exit back to the shell.");

  return `\n${box}\n${footer}\n`;
}
