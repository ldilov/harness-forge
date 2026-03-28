import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { renderBulletList, renderInfoCard, renderScreen } from "./screen-layout.js";
import { styleHeading, styleMuted, styleSection } from "./text-style.js";

export function renderHubScreen(
  workspaceRoot: string,
  actions: string[],
  capabilities: TerminalCapabilityProfile,
  healthMessage: string
): string {
  return renderScreen(
    styleHeading(capabilities, "Harness Forge Project Hub"),
    [
      `Workspace: ${workspaceRoot}`,
      renderInfoCard("Runtime health", [healthMessage], capabilities),
      styleSection(capabilities, "Available actions"),
      renderBulletList(actions, capabilities),
      styleMuted(capabilities, "Choose an action to run immediately or exit back to the shell.")
    ],
    capabilities
  );
}
