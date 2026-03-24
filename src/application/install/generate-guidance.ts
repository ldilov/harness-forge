import type { InstallPlan } from "../../domain/operations/install-plan.js";

export function generateGuidance(plan: InstallPlan): string {
  return [
    `Harness Forge install ready for ${plan.selection.targetId}.`,
    `Use "hforge status" to inspect current state.`,
    `Use "hforge catalog --json" to review installed bundles.`,
    `Use "hforge template list" to discover starter task and workflow templates.`
  ].join("\n");
}
