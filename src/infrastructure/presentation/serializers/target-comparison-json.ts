import type { TargetComparisonReport } from "../../../domain/targets/target-comparison.js";

export function serializeTargetComparison(report: TargetComparisonReport): string {
  return JSON.stringify(report, null, 2);
}
