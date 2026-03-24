import type { InstallPlan } from "../../domain/operations/install-plan.js";

export function formatPlanSummary(plan: InstallPlan): string {
  const lines = [
    `Plan ${plan.planId}`,
    `Target: ${plan.selection.targetId}`,
    `Mode: ${plan.selection.mode}`,
    `Operations: ${plan.operations.length}`
  ];

  if (plan.warnings.length > 0) {
    lines.push(`Warnings: ${plan.warnings.join("; ")}`);
  }
  if (plan.conflicts.length > 0) {
    lines.push(`Conflicts: ${plan.conflicts.join("; ")}`);
  }

  return lines.join("\n");
}

export function toJson<T>(value: T): string {
  return JSON.stringify(value, null, 2);
}
