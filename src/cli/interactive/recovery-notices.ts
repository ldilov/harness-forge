import type { RecoveryNotice } from "./session-state.js";

export function createRecoveryNotice(reasonCode: string, summary: string, workspaceRoot: string): RecoveryNotice {
  return {
    reasonCode,
    summary,
    observedState: [`Workspace root: ${workspaceRoot}`],
    recommendedNextSteps: [
      `Retry with "hforge init --root ${workspaceRoot} --yes" if you want a direct non-interactive rerun.`,
      `Use "hforge doctor --root ${workspaceRoot}" if the workspace now looks partial or drifted.`
    ],
    safeRetryCommand: `hforge init --root ${workspaceRoot} --yes`
  };
}
