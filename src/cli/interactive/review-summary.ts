import type { TerminalCapabilityProfile } from "./terminal-capabilities.js";
import type { ReviewPlanDocument } from "./review-plan.js";
import type { ReviewSummaryV2 } from "../../domain/review/review-summary-v2.js";
import { renderBulletList, renderInfoCard, renderKeyValueTable, renderScreen } from "./renderers/screen-layout.js";
import { styleBox, styleEmoji, styleHeading, styleKeyValue, stylePath, styleSection, styleWarning } from "./renderers/text-style.js";
import { presentReviewSummaryV2 } from "../../infrastructure/presentation/presenters/review-summary-v2-presenter.js";

export function renderReviewSummary(reviewPlan: ReviewPlanDocument, capabilities: TerminalCapabilityProfile): string {
  const bullet = styleEmoji("\u2022", capabilities, "-");
  const boxLines: string[] = [];

  // Setup summary
  boxLines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCC1", capabilities, " ")} Workspace`,
    reviewPlan.workspaceRoot,
    capabilities
  ));
  boxLines.push(styleKeyValue(
    `${styleEmoji("\uD83C\uDFAF", capabilities, " ")} Targets`,
    reviewPlan.targetIds.join(", ") || "none",
    capabilities
  ));
  boxLines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCCA", capabilities, " ")} Profile`,
    reviewPlan.setupProfile,
    capabilities
  ));
  boxLines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCE6", capabilities, " ")} Modules`,
    reviewPlan.enabledModules.join(", ") || "none",
    capabilities
  ));

  // Planned writes
  boxLines.push("");
  boxLines.push(`${styleEmoji("\uD83D\uDCDD", capabilities, "*")} Planned writes`);
  for (const item of reviewPlan.plannedWrites) {
    boxLines.push(`  ${bullet} ${stylePath(capabilities, item.path)} (${item.kind})`);
    boxLines.push(`    ${item.description}`);
  }

  // Warnings
  if (reviewPlan.warnings.length > 0) {
    boxLines.push("");
    boxLines.push(`${styleEmoji("\u26A0\uFE0F", capabilities, "!")} ${styleWarning(capabilities, "Warnings")}`);
    for (const warning of reviewPlan.warnings) {
      boxLines.push(`  ${bullet} ${warning}`);
    }
  }

  // Direct command preview
  boxLines.push("");
  boxLines.push(`${styleEmoji("\uD83D\uDCBB", capabilities, "$")} Direct command preview`);
  boxLines.push(`  ${reviewPlan.directCommandPreview}`);

  const titleIcon = styleEmoji("\uD83D\uDCCB", capabilities, "*");
  return `\n${styleBox(boxLines, capabilities, `${titleIcon} Review before write`)}`;
}

export function renderReviewSummaryV2(summary: ReviewSummaryV2, capabilities: TerminalCapabilityProfile): string {
  // New order: recommendation -> why -> target diffs -> top changes -> warnings -> command
  // The presenter handles the content ordering; we wrap it in the screen layout.
  const content = presentReviewSummaryV2(summary);
  return renderScreen(
    styleHeading(capabilities, "Review before write"),
    [content],
    capabilities
  );
}
