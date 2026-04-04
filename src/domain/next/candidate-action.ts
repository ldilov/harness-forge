import { z } from "zod";

export const scoringHintsSchema = z.object({
  urgencyBase: z.number().min(0).max(1),
  healthImpactBase: z.number().min(0).max(1),
  effortReductionBase: z.number().min(0).max(1),
  reversibilityBase: z.number().min(0).max(1),
});

export type ScoringHints = z.infer<typeof scoringHintsSchema>;

export interface CandidateAction {
  readonly actionId: string;
  readonly title: string;
  readonly command: string;
  readonly phase: "setup" | "operate" | "maintain" | "recover";
  readonly classification: "safe-auto" | "safe-manual" | "review-required" | "unsafe-for-auto";
  readonly scoringHints: ScoringHints;
  readonly checkPrerequisites: (state: WorkspaceState) => boolean;
}

export interface WorkspaceState {
  readonly hasInstallState: boolean;
  readonly hasRuntimeIndex: boolean;
  readonly isRuntimeStale: boolean;
  readonly doctorStatus: "healthy" | "warning" | "failure" | "unknown";
  readonly staleArtifactCount: number;
  readonly hasTaskFolders: boolean;
  readonly hasPacksAvailable: boolean;
  readonly hasFlowState: boolean;
  readonly isShellIntegrated: boolean;
  readonly detectedTargets: readonly string[];
}
