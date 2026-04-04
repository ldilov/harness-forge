import type { StaleValueWarning } from "../../domain/runtime/stale-value-warning.js";

export function detectStaleWorkspace(
  workspaceRoot: string,
  lastRuntimeCommandAt: string | null,
  thresholdDays: number = 30
): StaleValueWarning[] {
  if (!lastRuntimeCommandAt) {
    return [];
  }

  const lastDate = new Date(lastRuntimeCommandAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= thresholdDays) {
    return [];
  }

  return [
    {
      warningId: `stale-${Date.now()}`,
      workspaceRoot,
      lastRuntimeCommandAt,
      daysSinceLastUse: daysSince,
      recommendation: `This workspace has not used runtime commands in ${daysSince} days. Run "hforge doctor --root . --json" to check workspace health.`
    }
  ];
}
