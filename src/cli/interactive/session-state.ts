import type { ReviewPlanDocument } from "./review-plan.js";
import type { SetupIntent } from "./setup-intent.js";

export type InteractiveSessionMode = "onboarding" | "project-hub" | "guided-repair";
export type InteractiveSessionState =
  | "draft"
  | "gathering-input"
  | "review"
  | "applying"
  | "completed"
  | "cancelled"
  | "partial-failure";

export interface RecoveryNotice {
  reasonCode: string;
  summary: string;
  observedState: string[];
  recommendedNextSteps: string[];
  safeRetryCommand?: string;
}

export interface ExecutionSummary {
  status: "success" | "cancelled" | "partial-failure" | "failed" | "preview";
  workspaceRoot: string;
  appliedTargets: string[];
  writtenArtifacts: string[];
  preservedArtifacts: string[];
  nextSuggestedCommands: string[];
  importantPaths: string[];
  operatorMessage: string;
}

export interface InteractiveSession {
  sessionId: string;
  mode: InteractiveSessionMode;
  state: InteractiveSessionState;
  entryTimestamp: string;
  activeStepId: string;
  visitedStepIds: string[];
  setupIntent?: SetupIntent;
  reviewPlan?: ReviewPlanDocument;
  recoveryNotice?: RecoveryNotice;
  result?: ExecutionSummary;
}

export function createInteractiveSession(mode: InteractiveSessionMode): InteractiveSession {
  return {
    sessionId: `IFS-${Date.now()}`,
    mode,
    state: "draft",
    entryTimestamp: new Date().toISOString(),
    activeStepId: "welcome",
    visitedStepIds: ["welcome"]
  };
}
