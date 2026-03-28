import type { ExecutionSummary } from "../session-state.js";
import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import { renderBulletList, renderScreen } from "./screen-layout.js";
import { styleHeading, stylePath, styleSection, styleSuccess } from "./text-style.js";

export function renderCompletionScreen(summary: ExecutionSummary, capabilities: TerminalCapabilityProfile): string {
  return renderScreen(
    styleHeading(capabilities, styleSuccess(capabilities, "Harness Forge setup complete")),
    [
      summary.operatorMessage,
      styleSection(capabilities, "Workspace"),
      renderBulletList([summary.workspaceRoot], capabilities),
      styleSection(capabilities, "Targets"),
      renderBulletList(summary.appliedTargets.length > 0 ? summary.appliedTargets : ["none"], capabilities),
      styleSection(capabilities, "Important paths"),
      renderBulletList(
        summary.importantPaths.length > 0 ? summary.importantPaths.map((entry) => stylePath(capabilities, entry)) : ["none"],
        capabilities
      ),
      styleSection(capabilities, "Next steps"),
      renderBulletList(summary.nextSuggestedCommands.length > 0 ? summary.nextSuggestedCommands : ["none"], capabilities)
    ],
    capabilities
  );
}
