import type { NextActionPlan } from "../../../domain/next/next-action-plan.js";

export function serializeNextAction(plan: NextActionPlan): string {
  return JSON.stringify(plan, null, 2);
}
