import type { TargetComparisonReport } from "../../../domain/targets/target-comparison.js";

export type ComparisonMode = "standalone" | "embedded";

export function presentTargetComparison(
  report: TargetComparisonReport,
  mode: ComparisonMode = "standalone"
): string {
  const lines: string[] = [];

  if (mode === "standalone") {
    lines.push("Target comparison");
    lines.push("");
  }

  lines.push(report.headlineVerdict);

  if (report.sharedStrengths.length > 0) {
    lines.push("");
    lines.push("Shared strengths");
    for (const s of report.sharedStrengths) {
      lines.push(`- ${s}`);
    }
  }

  if (mode === "standalone" && report.capabilityComparisons.length > 0) {
    lines.push("");
    lines.push("Capability differences");
    for (const comp of report.capabilityComparisons) {
      if (comp.winner === "tie") continue;
      const winnerLabel = comp.winner === "left" ? report.leftTargetId : report.rightTargetId;
      lines.push(`- ${comp.capabilityName}: ${winnerLabel} stronger — ${comp.operatorImpact}`);
    }
  }

  if (mode === "embedded" && report.capabilityComparisons.length > 0) {
    const diffs = report.capabilityComparisons.filter((c) => c.winner !== "tie");
    if (diffs.length > 0) {
      lines.push("");
      lines.push("Important target differences");
      for (const comp of diffs.slice(0, 3)) {
        lines.push(`- ${comp.operatorImpact}`);
      }
    }
  }

  if (report.practicalImplications.length > 0) {
    lines.push("");
    lines.push(mode === "standalone" ? "Practical implications" : "Recommended usage");
    for (const imp of report.practicalImplications) {
      lines.push(`- ${imp}`);
    }
  }

  if (mode === "standalone" && report.recommendedUsagePatterns.length > 0) {
    lines.push("");
    lines.push("Recommended usage patterns");
    for (const pattern of report.recommendedUsagePatterns) {
      lines.push(`- ${pattern.label}: ${pattern.whenToChoose.join(", ")}`);
    }
  }

  return lines.join("\n");
}
