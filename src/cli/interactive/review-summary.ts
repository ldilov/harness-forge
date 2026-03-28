import type { TerminalCapabilityProfile } from "./terminal-capabilities.js";
import type { ReviewPlanDocument } from "./review-plan.js";
import { renderBulletList, renderInfoCard, renderKeyValueTable, renderScreen } from "./renderers/screen-layout.js";
import { styleHeading, stylePath, styleSection, styleWarning } from "./renderers/text-style.js";

export function renderReviewSummary(reviewPlan: ReviewPlanDocument, capabilities: TerminalCapabilityProfile): string {
  return renderScreen(
    styleHeading(capabilities, "Review before write"),
    [
      styleSection(capabilities, "Setup summary"),
      renderKeyValueTable([
        { label: "Workspace", value: reviewPlan.workspaceRoot },
        { label: "Targets", value: reviewPlan.targetIds.join(", ") || "none" },
        { label: "Setup profile", value: reviewPlan.setupProfile },
        { label: "Modules", value: reviewPlan.enabledModules.join(", ") || "none" }
      ]),
      styleSection(capabilities, "Planned writes"),
      renderBulletList(
        reviewPlan.plannedWrites.map((item) => `${stylePath(capabilities, item.path)} (${item.kind}) - ${item.description}`),
        capabilities
      ),
      reviewPlan.warnings.length > 0
        ? `${styleWarning(capabilities, "Warnings")}\n${renderBulletList(reviewPlan.warnings, capabilities)}`
        : renderInfoCard("Warnings", ["None"], capabilities),
      renderInfoCard("Direct command preview", [reviewPlan.directCommandPreview], capabilities)
    ],
    capabilities
  );
}
