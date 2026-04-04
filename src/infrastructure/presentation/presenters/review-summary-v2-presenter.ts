import type { ReviewSummaryV2 } from "../../../domain/review/review-summary-v2.js";

export function presentReviewSummaryV2(summary: ReviewSummaryV2): string {
  const lines: string[] = [];

  // 1. Recommendation summary
  lines.push("Recommended install");
  lines.push(`- Targets: ${summary.recommendedInstall.targets.join(" + ")}`);
  lines.push(`- Profile: ${summary.recommendedInstall.profile}`);
  if (summary.recommendedInstall.modules.length > 0) {
    lines.push(`- Modules: ${summary.recommendedInstall.modules.join(", ")}`);
  }

  // 2. Why / evidence
  if (summary.why.length > 0) {
    lines.push("");
    lines.push("Why this is recommended");
    for (const reason of summary.why) {
      lines.push(`- ${reason}`);
    }
  }

  // 3. Target differences
  if (summary.targetDifferences.length > 0) {
    lines.push("");
    lines.push("Target differences");
    for (const diff of summary.targetDifferences) {
      lines.push(`- ${diff}`);
    }
  }

  // 4. Top-level change summary
  if (summary.topChanges.length > 0) {
    lines.push("");
    lines.push("What will change");
    for (const change of summary.topChanges) {
      lines.push(`- ${change.description} (${change.layer})`);
    }
  }

  // 5. Warnings
  if (summary.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings");
    for (const warning of summary.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  // 6. Direct command preview
  lines.push("");
  lines.push("Command");
  lines.push(`- ${summary.directCommandPreview}`);

  return lines.join("\n");
}
