import type { ExecutionSummary } from "../session-state.js";
import type { TerminalCapabilityProfile } from "../terminal-capabilities.js";
import type { PostInstallBriefData } from "../../../application/runtime/format-post-install-summary.js";
import { formatPostInstallSummary } from "../../../application/runtime/format-post-install-summary.js";
import { styleBox, styleEmoji, styleKeyValue, styleMuted } from "./text-style.js";

export function renderCompletionScreen(
  summary: ExecutionSummary,
  capabilities: TerminalCapabilityProfile,
  briefData?: PostInstallBriefData,
  briefPath?: string
): string {
  const briefSummary =
    briefData && briefPath ? formatPostInstallSummary(briefData, briefPath) : "";

  const check = styleEmoji("\u2705", capabilities, "[OK]");
  const rocket = styleEmoji("\uD83D\uDE80", capabilities, ">>");
  const bullet = styleEmoji("\u2022", capabilities, "-");

  const lines: string[] = [];

  lines.push(`${check} Harness Forge setup complete!`);
  lines.push("");
  lines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCC1", capabilities, " ")} Workspace`,
    summary.workspaceRoot,
    capabilities
  ));
  lines.push(styleKeyValue(
    `${styleEmoji("\uD83C\uDFAF", capabilities, " ")} Targets`,
    summary.appliedTargets.length > 0 ? summary.appliedTargets.join(" + ") : "none",
    capabilities
  ));

  if (summary.importantPaths.length > 0) {
    lines.push("");
    lines.push(`${styleEmoji("\uD83D\uDCC2", capabilities, " ")} Important paths:`);
    for (const p of summary.importantPaths) {
      lines.push(`  ${bullet} ${p}`);
    }
  }

  if (briefSummary.length > 0) {
    lines.push("");
    lines.push(briefSummary);
  }

  lines.push("");
  lines.push(`${rocket} Next steps:`);
  const commands = summary.nextSuggestedCommands.length > 0
    ? ["hforge next --root .", ...summary.nextSuggestedCommands]
    : ["hforge next --root ."];
  for (const cmd of commands) {
    lines.push(`  ${bullet} ${cmd}`);
  }

  lines.push("");
  lines.push(styleMuted(
    capabilities,
    `Tip: Add "forge": "hforge" to your package.json scripts for a quick alias.`
  ));

  const box = styleBox(lines, capabilities);
  const footer = summary.operatorMessage.length > 0
    ? `\n${styleMuted(capabilities, `  ${summary.operatorMessage}`)}\n`
    : "";

  return `\n${box}${footer}`;
}
