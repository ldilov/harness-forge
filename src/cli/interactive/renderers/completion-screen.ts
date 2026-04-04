import type { ExecutionSummary } from "../session-state.js";
import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import type { PostInstallBriefData } from "../../../application/runtime/format-post-install-summary.js";
import { formatPostInstallSummary } from "../../../application/runtime/format-post-install-summary.js";
import { renderBulletList, renderScreen } from "./screen-layout.js";
import { styleHeading, stylePath, styleSection, styleSuccess } from "./text-style.js";

export function renderCompletionScreen(
  summary: ExecutionSummary,
  capabilities: TerminalCapabilityProfile,
  briefData?: PostInstallBriefData,
  briefPath?: string
): string {
  const briefSummary =
    briefData && briefPath ? formatPostInstallSummary(briefData, briefPath) : "";

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
      ...(briefSummary.length > 0 ? [styleSection(capabilities, "First-run brief"), briefSummary] : []),
      styleSection(capabilities, "Next steps"),
      renderBulletList(summary.nextSuggestedCommands.length > 0 ? ["hforge next --root .", ...summary.nextSuggestedCommands] : ["hforge next --root ."], capabilities)
    ],
    capabilities
  );
}
